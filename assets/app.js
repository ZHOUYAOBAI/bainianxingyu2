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
          a.style.color = "#6B1620";
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }


  /* ---------- 7. 终幕图版轮播 ---------- */
  function initPlate() {
    var frame = document.querySelector(".plate-slider");
    if (!frame) return;
    var slides = Array.prototype.slice.call(frame.querySelectorAll(".plate-slide"));
    var dots = Array.prototype.slice.call(frame.querySelectorAll(".pdot"));
    if (slides.length < 2) return;

    var idx = 0;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timer = null;

    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-on", i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle("is-on", i === idx); });
    }

    function play() {
      if (reduce || timer) return;
      timer = window.setInterval(function () { show(idx + 1); }, 6200);
    }
    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { show(i); stop(); play(); });
    });

    frame.addEventListener("mouseenter", stop);
    frame.addEventListener("mouseleave", play);
    frame.addEventListener("focusin", stop);
    frame.addEventListener("focusout", function () { play(); });

    play();
  }


  /* ---------- 8. demo 试听 ---------- */
  function initDemo() {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".arow"));
    if (!rows.length) return;

    var audio = new Audio();
    audio.preload = "auto";
    var current = null;
    var seeking = false;

    function fmt(t) {
      if (!t || !isFinite(t)) return "0:00";
      var m = Math.floor(t / 60), sec = Math.floor(t % 60);
      return m + ":" + (sec < 10 ? "0" : "") + sec;
    }

    function setTime(row, cur, total) {
      var tm = row.querySelector(".atime");
      if (!tm) return;
      tm.textContent = (cur === null) ? tm.dataset.dur : fmt(cur) + " / " + fmt(total);
    }

    function setProgress(row, pct) {
      var bar = row.querySelector(".abar i");
      if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    }

    function paintBuffer() {
      if (!current || !audio.buffered || !audio.duration) return;
      var end = 0;
      for (var i = 0; i < audio.buffered.length; i++) {
        if (audio.buffered.start(i) <= audio.currentTime + 0.1) {
          end = Math.max(end, audio.buffered.end(i));
        }
      }
      var buf = current.querySelector(".abuf");
      if (buf) buf.style.width = ((end / audio.duration) * 100).toFixed(2) + "%";
    }

    function reset(row) {
      row.classList.remove("is-playing");
      setProgress(row, 0);
      setTime(row, null);
      var buf = row.querySelector(".abuf");
      if (buf) buf.style.width = "0%";
    }

    function preload(src) {
      try { fetch(src, { cache: "force-cache" }); } catch (e) {}
    }

    function playRow(row) {
      if (current && current !== row) { audio.pause(); }
      var switching = current !== row;
      current = row;
      if (switching || !audio.src || audio.src.indexOf(row.dataset.src) === -1) {
        audio.src = row.dataset.src;
        audio.load();
      }
      audio.play().then(function () {
        row.classList.add("is-playing");
        var idx = rows.indexOf(row);
        var next = rows[idx + 1];
        if (next) preload(next.dataset.src);
      }).catch(function () { reset(row); });
    }

    rows.forEach(function (row) {
      var tm = row.querySelector(".atime");
      if (tm) tm.dataset.dur = tm.textContent;

      /* 播放 / 暂停 */
      row.querySelector(".aplay").addEventListener("click", function () {
        if (current === row && !audio.paused) { audio.pause(); return; }
        if (current === row && audio.paused) { playRow(row); return; }
        playRow(row);
      });

      /* 拖动 / 点击进度条跳转 */
      var bar = row.querySelector(".abar");
      if (!bar) return;

      function seekFromEvent(e) {
        var rect = bar.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var pct = Math.min(1, Math.max(0, x / rect.width));
        if (current !== row) {
          playRow(row);
        }
        var apply = function () {
          if (!isFinite(audio.duration)) return;
          audio.currentTime = pct * audio.duration;
          setProgress(row, pct * 100);
          setTime(row, audio.currentTime, audio.duration);
          paintBuffer();
        };
        if (isFinite(audio.duration)) apply();
        else audio.addEventListener("loadedmetadata", apply, { once: true });
      }

      bar.addEventListener("pointerdown", function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        seeking = true;
        try { bar.setPointerCapture(e.pointerId); } catch (err) {}
        seekFromEvent(e);
        e.preventDefault();
      });
      bar.addEventListener("pointermove", function (e) {
        if (!seeking) return;
        seekFromEvent(e);
      });
      bar.addEventListener("pointerup", function () { seeking = false; });
      bar.addEventListener("pointercancel", function () { seeking = false; });

      bar.addEventListener("keydown", function (e) {
        if (!isFinite(audio.duration)) return;
        if (current !== row) playRow(row);
        var step = (e.shiftKey ? 30 : 5);
        if (e.key === "ArrowRight") { audio.currentTime = Math.min(audio.duration, audio.currentTime + step); e.preventDefault(); }
        if (e.key === "ArrowLeft") { audio.currentTime = Math.max(0, audio.currentTime - step); e.preventDefault(); }
      });
    });

    audio.addEventListener("timeupdate", function () {
      if (!current) return;
      if (!seeking) {
        var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        setProgress(current, pct);
        setTime(current, audio.currentTime, audio.duration || 0);
      }
      paintBuffer();
    });
    audio.addEventListener("progress", paintBuffer);
    audio.addEventListener("loadedmetadata", paintBuffer);
    audio.addEventListener("pause", function () {
      if (current) current.classList.remove("is-playing");
    });
    audio.addEventListener("play", function () {
      if (current) current.classList.add("is-playing");
    });
    audio.addEventListener("ended", function () {
      if (current) { reset(current); current = null; }
    });
  }

  /* ---------- 信封访问门 ---------- */

  /* ---------------- 门页金粉 ---------------- */
  function initDust(gate) {
    var cv = document.getElementById("gateDust");
    if (!cv || !cv.getContext) return { start: function () {}, burstCenter: function () {}, stop: function () {} };
    var ctx = cv.getContext("2d");
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], raf = 0, last = 0;
    var GOLD = ["#FFF3D2", "#F8DCA0", "#EFC173", "#DFA457"];

    function size() {
      W = gate.clientWidth || window.innerWidth;
      H = gate.clientHeight || window.innerHeight;
      cv.width = Math.floor(W * DPR);
      cv.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function fleck(x, y, o) {
      o = o || {};
      return {
        x: x, y: y, vx: o.vx || 0, vy: o.vy || 0,
        r: o.r || rnd(0.7, 2.2),
        a: o.a || rnd(0.25, 0.9),
        sway: rnd(0.6, 2.4), phase: rnd(0, Math.PI * 2),
        life: 0,
        hl: o.hl === undefined ? Math.random() < 0.32 : o.hl,
        grav: o.grav === undefined ? -0.05 : o.grav,
        decay: o.decay || 0.02
      };
    }

    function push(f) { if (parts.length < 420) parts.push(f); }

    function burstCenter(n) {
      var cx = W / 2, cy = H * 0.44;
      for (var i = 0; i < n; i++) {
        var ang = rnd(0, Math.PI * 2), sp = rnd(1.2, 8);
        push(fleck(cx + rnd(-26, 26), cy + rnd(-18, 18), {
          vx: Math.cos(ang) * sp * 0.95,
          vy: Math.sin(ang) * sp - rnd(1.2, 4.4),
          r: rnd(0.9, 3.2), a: rnd(0.35, 1), grav: -0.10, decay: rnd(0.010, 0.026)
        }));
      }
    }

    function ambientTick() {
      var n = Math.random() < 0.55 ? 1 : (Math.random() < 0.5 ? 1 : 0);
      for (var i = 0; i < n; i++) {
        push(fleck(rnd(-10, W + 10), H + rnd(0, 46), {
          vx: rnd(-0.5, 0.5), vy: rnd(-1.15, -0.35),
          r: rnd(0.5, 1.9), a: rnd(0.10, 0.46), grav: -0.004, decay: 0.004
        }));
      }
    }

    function draw(p) {
      var alpha = p.a * Math.max(0, 1 - p.life * p.decay);
      if (alpha <= 0.01) return false;
      var x = p.x + Math.sin(p.life * 0.03 * p.sway + p.phase) * 1.7;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      if (p.hl) {
        var s = p.r * 2.9;
        var g = ctx.createRadialGradient(x, p.y, 0, x, p.y, s);
        g.addColorStop(0, "rgba(255,246,214," + alpha + ")");
        g.addColorStop(0.35, "rgba(240,196,116," + alpha * 0.5 + ")");
        g.addColorStop(1, "rgba(220,160,80,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, p.y, s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,240,200," + alpha * 0.8 + ")";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - s * 1.6, p.y); ctx.lineTo(x + s * 1.6, p.y);
        ctx.moveTo(x, p.y - s * 1.6); ctx.lineTo(x, p.y + s * 1.6);
        ctx.stroke();
      } else {
        var g2 = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 2.6);
        g2.addColorStop(0, "rgba(255,240,205," + alpha + ")");
        g2.addColorStop(0.4, "rgba(238,192,116," + alpha * 0.55 + ")");
        g2.addColorStop(1, "rgba(220,160,80,0)");
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(x, p.y, p.r * 2.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return true;
    }

    function loop(now) {
      if (!last) last = now;
      var dt = Math.min(40, now - last) / 16.7;
      last = now;
      ctx.clearRect(0, 0, W, H);
      ambientTick();
      var keep = [], i, p;
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        p.life += dt;
        p.vy += p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < -70 || p.y > H + 90 || p.x < -90 || p.x > W + 90) continue;
        if (draw(p)) keep.push(p);
      }
      parts = keep;
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (raf) return;
      size(); last = 0;
      raf = requestAnimationFrame(loop);
    }
    function stop(fadeMs) {
      setTimeout(function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        ctx.clearRect(0, 0, W, H);
        parts = [];
      }, fadeMs || 0);
    }

    return { start: start, burstCenter: burstCenter, stop: stop };
  }

  function initGate() {
    var gate = document.getElementById("gate");
    if (!gate) return;
    var envelope = document.getElementById("envelope");
    var form = document.getElementById("gateForm");
    var reveal = document.getElementById("gateReveal");
    var input = document.getElementById("gateCode");
    var btn = document.getElementById("gateBtn");
    var hint = document.getElementById("gateHint");
    var PASS = "19281314";
    var busy = false;
    var dust = initDust(gate);

    function unlock() {
      busy = true;
      try { sessionStorage.setItem("bx1928_unlocked", "1"); } catch (e) {}
      form.classList.add("is-gone");
      gate.classList.add("is-glowing");
      envelope.classList.add("is-open");
      dust.start();
      setTimeout(function () {
        envelope.style.transition = "opacity .45s ease, transform .6s ease";
        envelope.style.opacity = "0";
        envelope.style.transform = "translateY(-8%) scale(.94)";
        dust.burstCenter(84);
      }, 1450);
      setTimeout(function () {
        gate.classList.add("is-casting");
        dust.burstCenter(46);
      }, 1800);
      setTimeout(function () {
        reveal.classList.add("is-play");
      }, 1950);
      setTimeout(function () {
        dust.burstCenter(30);
      }, 2750);
      setTimeout(function () {
        gate.classList.add("is-done");
        document.documentElement.classList.remove("is-locked");
        document.documentElement.classList.add("is-unlocked");
        window.scrollTo(0, 0);
        dust.stop(1400);
      }, 5000);
    }

    function submit() {
      if (busy) return;
      var val = (input.value || "").replace(/\s/g, "");
      if (val === PASS) { unlock(); return; }
      gate.classList.remove("is-shake");
      void gate.offsetWidth;
      gate.classList.add("is-shake");
      hint.textContent = "密码不对，请核对后再试";
      hint.classList.add("is-error");
      input.select();
    }

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
    });
    input.addEventListener("input", function () {
      hint.textContent = "本页为剧本样稿，仅限受邀方查阅";
      hint.classList.remove("is-error");
    });
    setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, 300);
  }

  function boot() {
    initGate();
    initReveal();
    initLyrics();
    initScore();
    initStar();
    initInterlude();
    initNavState();
    initPlate();
    initDemo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
