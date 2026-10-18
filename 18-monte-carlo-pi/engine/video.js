// 18 Monte Carlo Pi: random darts and Buffon's needles (mc.js). Every estimate on screen is computed from the throws shown.
(function (root) {
  "use strict";
  const M = root.MC, D = root.CLDraw;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0", pink: "#EF6FAE" };
  const NMAX = 100000, DARTS = M.darts(NMAX), NEED = M.needles(5000);
  const fmt = (v) => v.toLocaleString("en-US");
  // incremental dart layer (adds new darts each frame; restarts only if asked to go back)
  const layers = {};
  function dartLayer(key, size) { const st = layers[key] || (layers[key] = { c: null, n: 0 });
    return (n) => { if (!st.c || st.n > n) { st.c = document.createElement("canvas"); st.c.width = size; st.c.height = size; st.n = 0; }
      const g = st.c.getContext("2d"), s = size / 2, r = Math.max(1.2, size / 500);
      for (let i = st.n; i < n; i++) { const x = DARTS.X[i], y = DARTS.Y[i], inside = x * x + y * y <= 1; g.fillStyle = inside ? "rgba(255,189,56,.75)" : "rgba(53,196,240,.6)"; g.fillRect(s + x * s - r / 2, s - y * s - r / 2, r, r); }
      st.n = n; return st.c; }; }
  function board(ctx, n, x0, y0, size, key, k = 1) {
    ctx.fillStyle = "#0B0F18"; ctx.fillRect(x0, y0, size, size); ctx.drawImage(dartLayer(key, size)(n), x0, y0);
    ctx.strokeStyle = "rgba(245,243,239,.7)"; ctx.lineWidth = 2.5 * k; ctx.strokeRect(x0, y0, size, size); ctx.beginPath(); ctx.arc(x0 + size / 2, y0 + size / 2, size / 2, 0, 7); ctx.stroke();
  }
  function estimate(ctx, est, x, y, k = 1, align = "left") {
    const s = est.toFixed(5), d = M.digitsRight(est); ctx.save(); ctx.font = "700 " + 110 * k + "px " + D.FONT; const w = ctx.measureText(s).width; ctx.restore();
    let cx = align === "center" ? x - w / 2 : x; let used = 0;
    for (const ch of s) { const right = ch === "." ? used < d : (used++ < d); ctx.save(); ctx.font = "700 " + 110 * k + "px " + D.FONT; const cw = ctx.measureText(ch).width; ctx.restore();
      D.text(ctx, ch, cx, y, 110 * k, right ? C.amber : C.dim, 700, "left"); cx += cw; }
    D.text(ctx, "π = 3.14159…  ·  " + d + (d === 1 ? " digit" : " digits") + " right", align === "center" ? x : x, y + 80 * k, 30 * k, C.dim, 600, align);
  }
  function floor(ctx, n, x0, y0, w, h, k = 1) {               // Buffon: lines 1 unit apart; a 10 × 6 unit floor
    const s = w / 10; ctx.fillStyle = "#0B0F18"; ctx.fillRect(x0, y0, w, h); ctx.strokeStyle = "rgba(245,243,239,.45)"; ctx.lineWidth = 2 * k;
    for (let j = 0; j <= 6; j++) { ctx.beginPath(); ctx.moveTo(x0, y0 + j * s); ctx.lineTo(x0 + w, y0 + j * s); ctx.stroke(); }
    ctx.lineWidth = 1.6 * k; for (let i = 0; i < n; i++) { const q = NEED.list[i], dx = Math.cos(q.a) / 2, dy = Math.sin(q.a) / 2; ctx.strokeStyle = q.c ? "rgba(239,111,174,.8)" : "rgba(53,196,240,.45)";
      ctx.beginPath(); ctx.moveTo(x0 + (q.x - dx) * s, y0 + (q.y - dy) * s); ctx.lineTo(x0 + (q.x + dx) * s, y0 + (q.y + dy) * s); ctx.stroke(); }
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["idea", 4, 16], ["darts", 16, 52], ["error", 52, 68], ["buffon", 68, 92], ["close", 92, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const dartsAt = (u, dur) => Math.min(NMAX, Math.round(Math.pow(NMAX, D.clamp((u - .5) / (dur - 3)))));
  const needlesAt = (u, dur) => Math.min(5000, Math.round(Math.pow(5000, D.clamp((u - 1) / (dur - 4)))));
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook" || sc.id === "darts" || sc.id === "close") {
      const n = sc.id === "darts" ? dartsAt(u, sc.t1 - sc.t0) : NMAX; board(ctx, n, 160, 190, 820, "full"); const est = DARTS.est(n);
      estimate(ctx, est, 1100, 460); D.text(ctx, fmt(n) + " darts", 1100, 640, 48, C.text, 700, "left"); D.text(ctx, fmt(DARTS.IN[n]) + " inside the circle", 1100, 700, 30, C.amber, 600, "left");
      D.text(ctx, "π ≈ 4 × inside ÷ all", 1100, 790, 34, C.dim, 600, "left");
      if (sc.id === "hook") { D.text(ctx, "Throw darts at random. Get π.", W / 2, 80, 62, C.text, 700); D.text(ctx, "Later in this video · 100,000 random darts", W / 2, 142, 30, C.amber, 600); }
      if (sc.id === "darts") D.text(ctx, n < 1000 ? "Throw darts at random…" : n < 30000 ? "The estimate wobbles toward π…" : "100,000 darts: three digits right.", W / 2, 80, 56, C.text, 700, "center", f);
      if (sc.id === "close") { D.text(ctx, "Randomness finds π. Very, very slowly.", W / 2, 80, 58, C.text, 700, "center", f);
        D.text(ctx, "Seeded pseudo-random numbers · Buffon (1777) · every estimate computed from the throws shown", W / 2, 1050, 24, C.dim, 500, "center", f); }
      return; }
    if (sc.id === "idea") { const x0 = 160, y0 = 190, s = 820; ctx.fillStyle = "#0B0F18"; ctx.fillRect(x0, y0, s, s);
      ctx.fillStyle = "rgba(255,189,56,.18)"; ctx.beginPath(); ctx.arc(x0 + s / 2, y0 + s / 2, s / 2, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(245,243,239,.7)"; ctx.lineWidth = 2.5; ctx.strokeRect(x0, y0, s, s); ctx.stroke();
      const L = ["A circle inside a square.", "Circle area: π r².  Square area: 4 r².", "So the circle covers π/4 of the square.", "Throw darts at random and count."];
      L.forEach((s2, i) => D.text(ctx, s2, 1100, 380 + i * 95, 40, i === 2 ? C.amber : C.text, 700, "left", D.clamp((u - .6 - i * 2.2) / .5) * f));
      D.text(ctx, "Finding π with nothing but chance", W / 2, 80, 58, C.text, 700, "center", f); return; }
    if (sc.id === "error") {
      const x0 = 260, y0 = 220, w = 1400, h = 640, X = (n) => x0 + Math.log10(n) / 5 * w, Y = (e) => y0 + h - (Math.log10(Math.max(e, 1e-5)) + 5) / 5 * h, up = Math.pow(NMAX, D.clamp((u - .5) / 7));
      ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      for (let p = 0; p <= 5; p++) { D.text(ctx, fmt(10 ** p), X(10 ** p), y0 + h + 30, 22, C.dim, 600); } for (let p = -4; p <= 0; p++) D.text(ctx, String(10 ** p), x0 - 14, Y(10 ** p), 20, C.dim, 600, "right");
      D.text(ctx, "error |estimate − π| (log scale)", x0, y0 - 28, 22, C.dim, 600, "left"); D.text(ctx, "darts", x0 + w, y0 + h + 62, 22, C.dim, 600, "right");
      ctx.strokeStyle = "rgba(53,196,240,.8)"; ctx.setLineDash([10, 8]); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(1), Y(1.64)); ctx.lineTo(X(NMAX), Y(1.64 / Math.sqrt(NMAX))); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.beginPath(); let first = true; for (let n = 10; n <= up; n = Math.ceil(n * 1.02)) { const p = [X(n), Y(Math.abs(DARTS.est(n) - Math.PI))]; first ? ctx.moveTo(...p) : ctx.lineTo(...p); first = false; } ctx.stroke();
      D.text(ctx, "dashed: typical error ∝ 1/√(darts)", x0 + w, y0 + 20, 24, C.cyan, 600, "right");
      D.text(ctx, u < 8 ? "How fast does it get better?" : "100× more darts buys only one more digit.", W / 2, 80, 56, C.text, 700, "center", f); return; }
    if (sc.id === "buffon") { const n = needlesAt(u, sc.t1 - sc.t0); floor(ctx, n, 120, 220, 1100, 660);
      estimate(ctx, NEED.est(n), 1300, 420, .9); D.text(ctx, fmt(n) + " needles", 1300, 600, 44, C.text, 700, "left"); D.text(ctx, fmt(NEED.CR[n]) + " cross a line", 1300, 660, 30, C.pink, 600, "left");
      D.text(ctx, "π ≈ 2 × needles ÷ crossings", 1300, 740, 32, C.dim, 600, "left");
      D.lines(ctx, ["Buffon's needles (1777): drop needles as long as the gap between lines."], W / 2, 80, 46, C.text, f); }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .05 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: a soft note for each of the first darts or needles (at most 8 a second), and a chord at every power of ten
  function throwNotes(countAt, t0, t1, cap = 8, hiK = 11, loK = 4, isHit) { const ev = []; let last = -1, prev = 0;
    for (let t = t0; t < t1; t += 1 / 30) { const n = countAt(t - t0); for (let i = prev; i < n; i++) { if (t - last < 1 / cap) break; ev.push({ t, k: isHit(i) ? hiK : loK, gain: .35 }); last = t; } prev = n; } return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), dd = s.darts.t1 - s.darts.t0, bd = s.buffon.t1 - s.buffon.t0;
    return [{ t: .3, k: 8 }, ...[0, 1, 2, 3].map((i) => ({ t: s.idea.t0 + .6 + i * 2.2, k: 4 + i * 3, gain: .55 })),
      ...throwNotes((u) => dartsAt(u, dd), s.darts.t0, s.darts.t1 - .3, 8, 11, 4, (i) => DARTS.X[i] ** 2 + DARTS.Y[i] ** 2 <= 1),
      ...[10, 100, 1000, 10000, 100000].map((n) => ({ t: s.darts.t0 + .5 + Math.log(n) / Math.log(NMAX) * (dd - 3), k: 2 + M.digitsRight(DARTS.est(n)) * 3, gain: .6 })),
      { t: s.error.t0 + 8, k: 12, gain: .5 }, ...throwNotes((u) => needlesAt(u, bd), s.buffon.t0, s.buffon.t1 - .3, 8, 12, 5, (i) => NEED.list[i].c), { t: s.close.t0 + .3, k: 6 }]; }

  // ---------- Shorts ----------
  function s1(ctx, t) { const n = Math.min(NMAX, Math.round(Math.pow(NMAX, D.clamp((t - 1.5) / 25)))); board(ctx, n, 90, 400, 900, "short", 1.1); estimate(ctx, DARTS.est(n), 540, 1440, .9, "center");
    D.lines(ctx, ["Random darts.", "Out comes π."], 540, 160, 80, C.text, 1); D.text(ctx, fmt(n) + " darts", 540, 1640, 46, C.text, 700); }
  function s2(ctx, t) { const n = Math.min(5000, Math.round(Math.pow(5000, D.clamp((t - 1.5) / 25)))); floor(ctx, n, 40, 420, 1000, 600, 1.1); estimate(ctx, NEED.est(n), 540, 1200, .9, "center");
    D.lines(ctx, ["Drop needles", "on a striped floor."], 540, 160, 76, C.text, 1); D.text(ctx, fmt(n) + " needles · " + fmt(NEED.CR[n]) + " cross a line", 540, 1400, 40, C.text, 700); D.text(ctx, "Buffon, 1777", 540, 1460, 30, C.dim, 600); }
  const timelines = [
    { id: "full", name: "18 Monte Carlo Pi (long)", file: "Command Loom - 18 Monte Carlo Pi.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Random darts, out comes pi", file: "Command Loom - Short 1 - Random Darts Pi.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "glass",
      events: () => throwNotes((u) => Math.min(NMAX, Math.round(Math.pow(NMAX, D.clamp((u - 1.5) / 25)))), 0, 29.3, 8, 11, 4, (i) => DARTS.X[i] ** 2 + DARTS.Y[i] ** 2 <= 1) },
    { id: "s2", name: "Short 2 · Buffon's needles", file: "Command Loom - Short 2 - Buffons Needles.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "glass",
      events: () => throwNotes((u) => Math.min(5000, Math.round(Math.pow(5000, D.clamp((u - 1.5) / 25)))), 0, 29.3, 8, 12, 5, (i) => NEED.list[i].c) }
  ];
  root.CLVideo = { title: "Command Loom · 18 Monte Carlo Pi", timelines };
  root.PiVideo = { S, NMAX, DARTS, NEED, timelines };
})(typeof window !== "undefined" ? window : globalThis);
