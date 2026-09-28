# Erland’s research website

A small, static academic website for [erland366.github.io](https://erland366.github.io/), built with Eleventy. Pages contain ordinary HTML; JavaScript only enhances the theme toggle and publication filters. No database or paid hosting is needed.

The profile emphasizes Erland’s current role as a Research Engineer at MBZUAI, primarily working on cross-vendor mismatches between AMD and NVIDIA GPU platforms, and his search for PhD opportunities in ML systems. Its narrative connects earlier work on language model architectures and training objectives to systems research. Keep this framing consistent across the homepage, section introductions, metadata, blog draft, and sibling profile README.

## Preview locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:8080`. The site rebuilds when content changes.

To check the exact production output:

```sh
npm run check
```

This makes a clean `_site/` build and verifies page metadata, navigation and asset links, publication records, and exclusion of draft and future-dated posts. Do not edit `_site/`; it is generated.

## Edit the site

| Content | File |
| --- | --- |
| Name, blog author nickname, email, social profiles, navigation | `src/_data/site.json` |
| Homepage introduction and research interests | `src/index.njk` |
| Publications and featured selections | `src/_data/publications.json` |
| Experience and education | `src/experience.njk` |
| Organization logos | `src/assets/logos/` |
| Contact icons in the header and footer | `src/_includes/partials/social-links.njk` |
| Profile photo | `src/assets/profile.jpg` |
| Colors, type, responsive layout | `src/assets/style.css` |

Publication records with `selected: true` appear on the homepage. Keep preprints labeled as preprints until a venue is verified. Data entries are shown in file order; COPUS leads to foreground the ML systems focus, followed by other recent work. A source and content review is recorded in [docs/content-sources.md](docs/content-sources.md).

To give a publication a picture, add `image` (a local path under `/assets/publications/`), `imageAlt`, `imageWidth`, and `imageHeight` to its record. An optional `poster` URL adds a Poster link and makes the thumbnail open the full poster; otherwise it opens the paper. The same entry renders on the Publications page and, when selected, on the homepage. Token Order Prediction uses the original full-color poster image from ICML 2026, shown at thumbnail size without cropping.

## Write a blog post

Create `src/posts/your-post-title.md`:

```markdown
---
title: Your post title
description: A one-sentence introduction.
date: 2026-09-20
topic: Research notes
draft: true
---

Write your post in Markdown.

## A section heading

You can use links, images, lists, tables, block quotes, and fenced code blocks.
```

Preview unpublished writing with `npm run preview:drafts`, then open `http://localhost:8081/blog/`. Draft previews go to `_drafts/`, separate from production, and include a visible banner and `noindex` metadata. The included welcome note is an editable draft, not a published article.

When a post is ready, change `draft` to `false` and set the intended publication date. A normal build excludes drafts and dates in the future. Its URL will be `/blog/your-post-title/`; the homepage, archive, RSS feed, and sitemap update automatically. Future posts appear only after a build on or after their date; there is no scheduled publishing job. Rebuild production after changing a published post back to draft, so stale generated files are cleared.

Draft Markdown is still visible in this public GitHub repository when pushed. Keep confidential notes outside the repository.

## Publish on GitHub Pages

The repository previously published the root of `main` through Jekyll. This version builds the website into `_site/` and uses the included GitHub Actions workflow.

1. Review the biography, experience, photo, and contact details.
2. In this repository’s **Settings → Pages → Build and deployment**, change **Source** to **GitHub Actions**. Do this before deploying this version; the old branch publishing mode will not build Eleventy.
3. Commit and push the website changes to `main`.
4. The **Build and deploy website** workflow validates and deploys the site. Pull requests run checks without publishing.

The profile README is in the separate sibling repository `../Erland366/README.md`; commit and push that repository separately when ready. It links to the new website, so publish the website first.

## Search engine verification

`public/googlea3642c7d280c95c7.html` is the Google Search Console ownership file for `https://erland366.github.io/`. It is served unchanged at the site root. Keep it; removing it unverifies the site in Search Console. The sitemap to submit there is `sitemap.xml`.

## Existing demos

The previous homepage is preserved at `/demos/image-classifier.html`. The existing `/llm.html` URL is preserved. Their source now lives under `public/`; these legacy demos retain their original dependencies and were not modernized with the site.

## Design and assets

The layout takes inspiration from [Songlin Yang’s website](https://sustcsonglin.github.io/), with original templates and styling. The palette is white and black with phthalo green (`#123524`). Green appears in headings, emphasized bio text, contact icons, links, and the active tab. A solid green PhD contact banner and pale green research/writing panels give the color more presence while keeping the page background white. A lighter green tint (`#85c9a7`) keeps accents readable in the optional dark theme. White is the default. The portrait is Erland’s supplied `DSC_6832 4x6.jpg`, copied to `src/assets/profile.jpg` at its original 2000 × 2800 resolution. The same image is used for social previews. DM Sans and Manrope load from Google Fonts with system-font fallbacks. There are no analytics or tracking scripts. The selected color theme is stored locally in the visitor’s browser.

Blog bylines and feed authors use `site.blogAuthor` (Erland Hilman Fuadi (Edd)); publication author names use the academic name. The header and footer use compact green icons for email, Google Scholar, GitHub, LinkedIn, Twitter/X, and blog RSS, with accessible labels and hover titles.

To add WeChat later, set `wechat` in `src/_data/site.json` to your public contact URL, or to a QR image path such as `/assets/wechat-qr.png` after adding that image under `src/assets/`. The WeChat icon appears in both locations when the value is filled in; it is hidden while empty.

The portrait and locally stored organization logos use their original colors, without desaturation or grayscale filters. Logo sources and icon attribution are documented in [`docs/content-sources.md`](docs/content-sources.md).
