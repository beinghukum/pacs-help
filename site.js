// PACS Auto Help: search box, "On this page" highlight, language memory, mobile menu. No outside files.
(function () {
  var body = document.body, lang = body.getAttribute("data-lang"), root = body.getAttribute("data-root");
  try { localStorage.setItem("pacsHelpLang", lang); } catch (e) {}

  // mobile: the menu button shows the module list
  var mb = document.querySelector(".menu");
  if (mb) mb.onclick = function () { body.classList.toggle("nav"); };

  // pictures wider than the page: shrink them to fit (Chrome / Edge 'zoom'), never below 55 %
  var fit = function () {
    [].forEach.call(document.querySelectorAll(".fig"), function (f) {
      var c = f.firstElementChild; if (!c) return;
      c.style.zoom = 1;
      var z = f.clientWidth / c.scrollWidth;
      if (z < 1) c.style.zoom = Math.max(z, 0.55);
    });
  };
  fit(); window.addEventListener("resize", fit);

  // "On this page": mark the part being read
  var links = [].slice.call(document.querySelectorAll(".toc a"));
  if (links.length) {
    var heads = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var mark = function () {
      var i = 0;
      heads.forEach(function (h, k) { if (h && h.getBoundingClientRect().top < 120) i = k; });
      links.forEach(function (a, k) { a.classList.toggle("on", k === i); });
    };
    window.addEventListener("scroll", mark, { passive: true }); mark();
  }

  // search: words of every chapter part (search.json, made by build_site.py)
  var box = document.querySelector(".srch input"), res = document.querySelector(".res"), data = null, pick = -1;
  if (!box) return;
  var load = function (then) {
    if (data) return then();
    var x = new XMLHttpRequest();
    x.open("GET", root + lang + "/search.json?v=" + (body.getAttribute("data-v") || ""));
    x.onload = function () { try { data = JSON.parse(x.responseText); } catch (e) { data = []; } then(); };
    x.onerror = function () { data = []; then(); };
    x.send();
  };
  var show = function () {
    var q = box.value.toLowerCase().trim();
    if (!q) { res.style.display = "none"; return; }
    var words = q.split(/\s+/), hits = [];
    data.forEach(function (d) {
      var hay = (d.t + " " + d.x).toLowerCase(), score = 0;
      for (var i = 0; i < words.length; i++) { if (hay.indexOf(words[i]) < 0) return; }
      if (d.t.toLowerCase().indexOf(q) >= 0) score += 10;
      hits.push({ d: d, s: score });
    });
    hits.sort(function (a, b) { return b.s - a.s; });
    res.innerHTML = hits.length ? hits.slice(0, 12).map(function (h, k) {
      var i = h.d.x.toLowerCase().indexOf(words[0]), from = Math.max(0, i - 40);
      var bit = (from ? "..." : "") + h.d.x.substr(from, 110) + "...";
      return '<a href="' + root + h.d.u + '"><b>' + h.d.t + '</b><small>' + h.d.c + ' · ' + bit.replace(/</g, "&lt;") + '</small></a>';
    }).join("") : '<div class="none">' + res.getAttribute("data-none") + '</div>';
    res.style.display = "block"; pick = -1;
  };
  box.addEventListener("input", function () { load(show); });
  box.addEventListener("focus", function () { load(show); });
  box.addEventListener("keydown", function (e) {
    var a = res.querySelectorAll("a");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      pick = Math.max(0, Math.min(a.length - 1, pick + (e.key === "ArrowDown" ? 1 : -1)));
      [].forEach.call(a, function (x, k) { x.classList.toggle("on", k === pick); }); e.preventDefault();
    } else if (e.key === "Enter" && a.length) { location.href = a[Math.max(pick, 0)].href; }
    else if (e.key === "Escape") { res.style.display = "none"; }
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".srch")) res.style.display = "none"; });
})();
