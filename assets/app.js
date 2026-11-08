/* 《百年星语·破晓1928》剧本站
   动效只用 transform / opacity；不依赖任何时间轴库。
   所有内容默认可见，动效只是增强。 */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 区块入场：90ms 交错 ---------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-rv]"));
    if (!items.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var group = el.parentNode;
        var sibs = group ? Array.prototype.slice.call(group.children) : [el];
        var i = sibs.indexOf(el);
        el.style.transitionDelay = Math.min(i, 8) * 90 + "ms";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 2. 唱词逐句浮现 ---------- */
  function initLyrics() {
    var lines = Array.prototype.slice.call(document.querySelectorAll("[data-ly]"));
    if (!lines.length) return;

    if (reduced || !("IntersectionObserver" in window)) return;

    lines.forEach(function (li) {
      li.style.opacity = "0";
      li.style.transform = "translate3d(0,14px,0)";
      li.style.transition = "opacity .9s cubic-bezier(.22,.61,.24,1), transform .9s cubic-bezier(.22,.61,.24,1)";
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var li = entry.target;
        var list = li.parentNode;
        var idx = Array.prototype.indexOf.call(list.children, li);
        var delay = Math.min(idx % 6, 5) * 90;
        window.setTimeout(function () {
          li.style.opacity = "1";
          li.style.transform = "none";
        }, delay);
        io.unobserve(li);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });

    lines.forEach(function (li) { io.observe(li); });
  }

  /* ---------- 3. 分曲表 ---------- */
  function initScore() {
    var body = document.getElementById("scoreBody");
    if (!body || !window.NUMBERS) return;

    var data = window.NUMBERS;
    var count = document.getElementById("scoreCount");
    var total = document.getElementById("scoreTotal");
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".fbtn"));

    function esc(s) {
      return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function render(filter) {
      var rows = data.filter(function (n) {
        return filter === "全部" || n.cls === filter;
      });
      body.innerHTML = rows.map(function (n) {
        return '<tr>' +
          '<td class="no">No.' + esc(n.no) + '</td>' +
          '<td class="tt">' + esc(n.title) + '</td>' +
          '<td class="ty">' + esc(n.type) + '</td>' +
          '<td class="ty">' + esc(n.voice) + '</td>' +
          '<td class="ky">' + esc(n.key) + '</td>' +
          '<td class="mt">' + esc(n.meter) + '</td>' +
          '<td class="tp">' + esc(n.tempo || "—") + '</td>' +
          '<td class="du">' + esc(n.dur || "原稿未标") + '</td>' +
          '</tr>';
      }).join("");
      if (count) count.textContent = rows.length + " 首";
    }

    function totalTime() {
      var sec = 0;
      data.forEach(function (n) {
        if (!n.dur) return;
        var m = n.dur.match(/(\d+)′(\d+)″/);
        if (m) sec += parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      });
      if (total) {
        total.textContent = "唱段总时长 " + Math.floor(sec / 60) + "′" + String(sec % 60).padStart(2, "0") + "″";
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        render(btn.getAttribute("data-filter"));
      });
    });

    render("全部");
    totalTime();
  }

  /* ---------- 4. 第三颗星 ---------- */
  function initStar() {
    var star = document.getElementById("starThird");
    var nian = document.getElementById("thirdNian");
    var mark = document.getElementById("thirdMark");
    var papers = document.getElementById("papers");
    if (!star || !nian) return;

    var open = false;
    function toggle() {
      open = !open;
      nian.style.transition = "opacity 1s cubic-bezier(.22,.61,.24,1), transform 1s cubic-bezier(.22,.61,.24,1)";
      nian.style.opacity = open ? "1" : "0";
      nian.style.transform = open ? "translate3d(0,0,0)" : "translate3d(0,10px,0)";
      mark.style.transition = "opacity .6s ease";
      mark.style.opacity = open ? "0" : ".35";
      if (papers) {
        papers.style.transition = "opacity .9s ease";
        papers.style.opacity = open ? ".85" : "0";
      }
      star.setAttribute("aria-label", open ? "第三颗星的位置：绣着一个念字" : "第三颗星的位置：空着");
    }

    star.addEventListener("click", toggle);
    star.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  }

  /* ---------- 5. 幕间图缓慢漂移（一处活的画面） ---------- */
  function initInterlude() {
    var images = Array.prototype.slice.call(document.querySelectorAll(".interlude-image"));
    if (!images.length || reduced) return;

    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      images.forEach(function (img) {
        var sec = img.parentNode;
        var r = sec.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        var p = (vh - r.top) / (vh + r.height);
        var y = (p - 0.5) * 8;
        img.style.transform = "scale(1.10) translate3d(0," + y.toFixed(2) + "%,0)";
      });
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- 6. 导航当前章节 ---------- */
  function initNavState() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").replace("#", "");
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = map[entry.target.id];
        if (!a) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.style.color = ""; });
          a.style.color = "#211B15";
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }

  function boot() {
    initReveal();
    initLyrics();
    initScore();
    initStar();
    initInterlude();
    initNavState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
