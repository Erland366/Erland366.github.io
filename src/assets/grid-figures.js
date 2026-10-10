(function () {
  var $ = function (id) { return document.getElementById(id); };
  if (!$("toy") || !$("real")) return;
  var dark = function () { return document.documentElement.getAttribute("data-theme") === "dark"; };
  function hue(i, n) { return "hsl(" + Math.round(i * 360 / n) + ",58%," + (dark() ? "46%" : "42%") + ")"; }
  function order(nBlocks, numM, fast) {
    var o = [], b, m;
    if (fast) { for (b = 0; b < nBlocks; b++) for (m = 0; m < numM; m++) o.push([b, m]); }
    else { for (m = 0; m < numM; m++) for (b = 0; b < nBlocks; b++) o.push([b, m]); }
    return o;
  }
  function stats(o, wave) {
    var first = {}, same = 0;
    o.forEach(function (c, pos) { if (c[0] in first) { if (Math.floor(first[c[0]] / wave) === Math.floor(pos / wave)) same++; } else first[c[0]] = pos; });
    return same;
  }
  function draw(rowEl, resEl, o, wave, nBlocks, labelFn) {
    rowEl.textContent = ""; rowEl.classList.remove("dim");
    var w = null, cells = [];
    o.forEach(function (c, pos) {
      if (pos % wave === 0) {
        w = document.createElement("div"); w.className = "wave w" + (Math.floor(pos / wave) % 2); rowEl.appendChild(w);
        var l = document.createElement("span"); l.className = "wlabel"; l.textContent = "wave " + (Math.floor(pos / wave) + 1); w.appendChild(l);
      }
      var b = document.createElement("button"); b.type = "button"; b.className = "cell"; b.style.background = hue(c[0], nBlocks);
      b.textContent = labelFn ? labelFn(c) : "";
      b.setAttribute("aria-label", "workgroup " + pos + ", W block " + c[0] + ", M tile " + c[1]);
      w.appendChild(b); cells.push(b);
    });
    function show(i) {
      var j = -1, k;
      for (k = 0; k < o.length; k++) if (k !== i && o[k][0] === o[i][0]) j = k;
      cells.forEach(function (x) { x.classList.remove("hl"); });
      rowEl.classList.add("dim"); cells[i].classList.add("hl"); if (j >= 0) cells[j].classList.add("hl");
      var a = Math.min(i, j), b2 = Math.max(i, j), same = Math.floor(a / wave) === Math.floor(b2 / wave);
      resEl.textContent = "Twins are " + (b2 - a) + " slot" + (b2 - a === 1 ? "" : "s") + " apart · " + (same ? "same wave" : "different waves");
    }
    cells.forEach(function (x, i) { x.addEventListener("click", function () { show(i); }); x.addEventListener("mouseenter", function () { show(i); }); });
    resEl.textContent = stats(o, wave) + " of " + nBlocks + " twins in the same wave";
  }
  var letters = "ABCDEF";
  function toy() {
    var lab = function (c) { return letters[c[0]] + c[1]; };
    draw($("toyOld"), $("toyOldRes"), order(6, 2, false), 6, 6, lab);
    draw($("toyNew"), $("toyNewRes"), order(6, 2, true), 6, 6, lab);
  }
  function real() {
    var p = $("cfg").value.split(","), numN = +p[0], split = parseInt(p[1], 10), wave = +$("wave").value;
    $("waveOut").textContent = wave;
    var nb = numN * split;
    draw($("oldRow"), $("resOld"), order(nb, 2, false), wave, nb);
    draw($("newRow"), $("resNew"), order(nb, 2, true), wave, nb);
  }
  toy(); real();
  $("cfg").addEventListener("change", real); $("wave").addEventListener("input", real);
  new MutationObserver(function () { toy(); real(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
