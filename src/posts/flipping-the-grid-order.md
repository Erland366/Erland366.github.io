---
title: Flipping the Grid Order
description: Speedup
date: 2026-10-10
topic: Personal
image: /assets/posts/flipping-the-grid-order-thumb.png
draft: false
---

These days I'm optimizing inference on an AMD MI210, and I recently found the [GEAK](https://github.com/AMD-AGI/GEAK) repo, an agent that writes and tunes GPU kernels. One of the bottlenecks in my setup is the dense GEMM during decode, where M is tiny (1 to 64 tokens) and the weight matrix is big. So I pointed GEAK at it and let it run for two rounds.

A quick glossary for the NVIDIA folks, since this post is about an AMD card. A **workgroup** is AMD's name for a thread block (PTX calls it a CTA): a group of threads that run together on one compute unit. A **CU** is AMD's name for an SM, and the MI210 has 104 of them.

Most of what it did is what you would expect: a Triton split-K kernel, retuned tile sizes, a GEMV path for M=1. Weighted speedup went from 1.00x to 1.23x after round 1 and 1.29x after round 2. Which is very good!

I checked what it does and saw very interesting pattern of flipping the order of the `program_id` in the Triton kernels

## Where it came from

After round 1, the agent profiled the kernels again (rocprov3). The M=4 and M=16 rows were already streaming the weights at 0.9 to 1.19 TB/s, which is about the most this card gives me. But when we have M=64, now this MI210s has streaming bottleneck where qkv at M=64 ran at about 625 GB/s. This is because the tile was too big (`BLOCK_M=64`, 150+ registers) and only 96 workgroups were launched on 104 CUs.

So the plan for round 2 was to use smaller M tiles, which means the kernel now has *several* M tiles per weight block. And that is where the order matters.

## The flip

```python
if M_FAST:
    # M tiles of one (N, K) block are adjacent in launch order -> the W block is re-read from L2
    pid_m = tl.program_id(0)
    pid_n = tl.program_id(1)
    pid_k = tl.program_id(2)
else:
    pid_n = tl.program_id(0)
    pid_k = tl.program_id(1)
    pid_m = tl.program_id(2)
```

and on the launch side:

```python
grid = (num_m, num_n, split) if m_fast else (num_n, split, num_m)
```

Axis 0 of the grid is the one that varies fastest, so workgroups next to each other in launch order get consecutive values of whatever sits on axis 0.

In the old order that is `pid_n`. Every workgroup loads a different slice of W, and the other M tile that wants the *same* slice sits `num_n * split` positions later in the queue. With `M_FAST` the M tiles go on axis 0, so the two workgroups that need the same W block are neighbours.

## Why that can matter

The GPU can only run so many workgroups at once, so a big grid gets dispatched in waves. Take `qkv` at M=64: `BLOCK_M=32` gives 2 M tiles, 16 N tiles and 6 K splits, so 192 workgroups on 104 CUs. If roughly one workgroup fits per CU, that is about two waves.

<div class="gfig big" id="toy"><p class="cap">Figure 1 · toy example</p><p class="look">Same color = same W block. A0 and A1 are its two workgroups (M tile 0 and 1). Tap a square.</p><div class="order"><h4>Old order <span class="res" id="toyOldRes"></span></h4><div class="strip-wrap" id="toyOld"></div></div><div class="order"><h4>M_FAST order <span class="res" id="toyNewRes"></span></h4><div class="strip-wrap" id="toyNew"></div></div></div>

- **Old order:** the twin of workgroup `i` is workgroup `i + 96`. Only the first few pairs land in the same wave. The rest read their half of W one wave later, after 12.6 MB of weights have streamed through an 8 MB L2.
- **New order:** twins sit next to each other, so both M tiles read the same W block at about the same time and the second read can be served from L2. W is paid for once instead of twice.

<div class="gfig" id="real"><p class="cap">Figure 2 · the real kernels</p><div class="ctl"><label>Kernel <select id="cfg"><option value="16,6">qkv, M=64 (192 workgroups)</option><option value="96,1">o, M=64 (192 workgroups)</option><option value="6,8">router, M=64 (96 workgroups)</option><option value="96,1b">shared-down, M=64 (192 workgroups)</option></select></label><label>Workgroups per wave <input type="range" id="wave" min="48" max="192" step="8" value="104"><output id="waveOut">104</output></label></div><div class="order"><h4>Old order <span class="res" id="resOld"></span></h4><div class="strip-wrap" id="oldRow"></div></div><div class="order"><h4>M_FAST order <span class="res" id="resNew"></span></h4><div class="strip-wrap" id="newRow"></div></div><p class="note">A model of the scheduling, not a measurement.</p></div>

This only helps when there is more than one M tile and more workgroups than fit in a single wave. That narrows it down a lot: `m_fast=1` is set on most rows of the config table, but only the four M=64 rows (qkv, o, router, shared-down) actually have two M tiles. Everywhere else `num_m` is 1 and both orders launch the same thing. The router row has 96 workgroups, which is a single wave, so I would expect no difference there either.

## What happened

So I ran the four shipped M=64 configs twice, with `m_fast` 0 and 1 and nothing else changed, on the MI210 with the weights cold in L2:

| Row (N x K) | Workgroups | `m_fast=0` (us) | `m_fast=1` (us) | Speedup |
|---|---|---|---|---|
| qkv (1024 x 6144) | 192 | 18.62 | 17.60 | 1.058x |
| o (6144 x 768) | 192 | 13.24 | 12.35 | 1.072x |
| router (192 x 6144) | 96 | 6.43 | 6.46 | 0.995x |
| shared-down (6144 x 224) | 192 | 6.88 | 6.12 | 1.123x |

The three rows with 192 workgroups get 6 to 12% faster, which is about a microsecond per call. The router row has 96 workgroups, so it fits in one wave and the order makes no difference. That is the same split the diagram predicts. Such a small but I like the modification

Not sure if this is AMD only or NVIDIA behaves the same way.... but I'm curious.

<link rel="stylesheet" href="/assets/grid-figures.css">
<script src="/assets/grid-figures.js" defer></script>
