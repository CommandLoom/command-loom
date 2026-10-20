// 32 Doubling Balls: one ball in a circle, a square and a triangle; every bounce makes a copy of the ball (doubling.js), until there
// are 4,096. Real gravity, no energy lost. Shown 5× slower, then all three side by side in real time.
(function (root) {
  "use strict";
  const Z = root.Doubling, D = root.CLDraw, FPS = 30, D2R = Math.PI / 180, SLOW = 5, CAP = 4096, r = 0.012;
  const START = { x0: -0.3, y0: 0.2, vx0: 1.5, vy0: 0 };
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", green: "#5BE38C", ring: "rgba(210,225,255,.9)" };
  const SHAPES = {
    circle:   { type: "circle", L: [430, 590], P: [480, 1080] },
    square:   { type: "poly", n: 4, rot: 0, L: [400, 600], P: [470, 1080] },
    triangle: { type: "poly", n: 3, rot: -90 * D2R, L: [285, 715], P: [320, 1180] }
  };
  const TEND = { circle: 12, square: 12, triangle: 12 };
  const sims = {}, sim = (k) => sims[k] || (sims[k] = Z.run(SHAPES[k], { r, ...START, cap: CAP, turn: 20, tEnd: TEND[k] }));
  const hueOf = (id) => (id * 0.6180339887) % 1;
  const hsl = (h, l, a) => `hsla(${Math.round(((h % 1) + 1) % 1 * 360)},95%,${l}%,${a})`;

  function outline(ctx, sh, rho, cx, cy, s) {
    ctx.beginPath(); if (sh.type === "circle") { ctx.arc(cx, cy, rho * s, 0, 7); return; }
    const R = rho / Math.cos(Math.PI / sh.n); for (let i = 0; i <= sh.n; i++) { const th = sh.rot + Math.PI / sh.n + 2 * Math.PI * i / sh.n; const x = R * Math.cos(th), y = R * Math.sin(th); i ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s); } ctx.closePath();
  }
  // t is simulation time
  function box(ctx, k, t, cx, cy, s, kk) {
    const sh = SHAPES[k], S = sim(k), n = Z.count(S, t), full = S.tCap != null && t >= S.tCap;
    ctx.save(); outline(ctx, sh, 1, cx, cy, s); ctx.strokeStyle = full ? C.green : C.ring; ctx.lineWidth = 3 * kk; ctx.shadowColor = full ? C.green : "rgba(140,190,255,.8)"; ctx.shadowBlur = 14 * kk; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const tail = 0.03, big = n < 64, rad = Math.max(1.6, (big ? r * 1.6 : r) * s) * kk;
    for (let i = 0; i < n; i++) {
      const b = S.balls[i], p = Z.pos(S, b, t), q = Z.pos(S, b, Math.max(b.born, t - tail)), col = hsl(hueOf(i), 62, .75);
      ctx.strokeStyle = col; ctx.lineWidth = rad * 1.1; ctx.beginPath(); ctx.moveTo(cx + q[0] * s, cy - q[1] * s); ctx.lineTo(cx + p[0] * s, cy - p[1] * s); ctx.stroke();
      if (big) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + p[0] * s, cy - p[1] * s, rad, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    return { n, full };
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const fmt = (n) => n.toLocaleString("en-US");

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["circle", 4, 32], ["square", 32, 60], ["triangle", 60, 88], ["all", 88, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const foot = "game rule: every bounce makes a copy of the ball, until 4,096 · real gravity · no energy lost · balls pass through each other";
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const st = box(ctx, "circle", sim("circle").tCap - 1 + u / SLOW, 960, 590, 430, 1);
      D.text(ctx, "Every bounce makes a copy.", W / 2, 72, 62, C.text, 700); D.text(ctx, fmt(st.n), 1700, 560, 110, st.full ? C.green : C.text, 700); D.speed(ctx, "5× slower", W); return; }
    if (sc.id === "all") {
      ["circle", "square", "triangle"].forEach((k, j) => { const cx = 330 + 630 * j, sh = SHAPES[k], st = box(ctx, k, u, cx, k === "triangle" ? 650 : 560, k === "triangle" ? 165 : 240, .7);
        D.text(ctx, fmt(st.n), cx, 880, 60, st.full ? C.green : C.text, 700, "center", f); });
      D.text(ctx, "All three in real time.", W / 2, 72, 60, C.text, 700, "center", f); D.text(ctx, "one ball to 4,096 in about five seconds", W / 2, 142, 34, C.amber, 600, "center", f);
      D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    const k = sc.id, sh = SHAPES[k], st = box(ctx, k, u / SLOW, 960, sh.L[1], sh.L[0], 1);
    D.text(ctx, "Every bounce makes a copy.", W / 2, 72, 62, C.text, 700, "center", f); D.text(ctx, "wait for 4,096", W / 2, 142, 36, C.amber, 600, "center", f);
    D.text(ctx, fmt(st.n), 1700, 560, 110, st.full ? C.green : C.text, 700, "center", f); D.text(ctx, "balls", 1700, 650, 38, C.amber, 600, "center", f);
    D.speed(ctx, "5× slower", W); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: one marimba note per bounce (at most 3 per frame), pitch from where it hits; a bell at 4,096 ----------
  function notes(k, t0, a, b, slow, side = 0, gain = 1) {
    const Sm = sim(k), ev = [], seen = new Map();
    for (const h of Sm.hits) { if (h[0] < a || h[0] >= b) continue; const tv = t0 + (h[0] - a) * slow, fr = Math.floor(tv * FPS), c = seen.get(fr) || 0; if (c >= 3) continue; seen.set(fr, c + 1);
      ev.push({ t: tv, k: Math.round(((h[2] / (2 * Math.PI) + 1) % 1) * 15), side, gain: gain * .6 }); }
    if (Sm.tCap != null && Sm.tCap >= a && Sm.tCap < b) ev.push({ t: t0 + (Sm.tCap - a) * slow, k: 10, side, gain: gain * 1.2, voice: "bell" });
    return ev; }
  function fullEvents() { const ev = [...notes("circle", 0, sim("circle").tCap - 1, sim("circle").tCap - 1 + 3.9 / SLOW, SLOW)];
    for (const sc of S.slice(1, 4)) ev.push(...notes(sc.id, sc.t0, 0, (sc.t1 - sc.t0 - .1) / SLOW, SLOW));
    ["circle", "square", "triangle"].forEach((k, j) => ev.push(...notes(k, 88, 0, 11.4, 1, j - 1, .7)));
    return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  function vert(ctx, k, t) { const sh = SHAPES[k], st = box(ctx, k, t / SLOW, 540, sh.P[1], sh.P[0], 1.15);
    D.lines(ctx, ["Every bounce", "makes a copy."], 540, 150, 78, C.text, 1); D.text(ctx, fmt(st.n), 540, 400, 130, st.full ? C.green : C.text, 700);
    D.text(ctx, st.full ? "4,096 reached" : "wait for 4,096", 540, 500, 40, st.full ? C.green : C.amber, 600);
    D.text(ctx, "5× slower · game rule · real gravity", 540, 1700, 32, C.dim, 600); }
  const timelines = [
    { id: "full", name: "32 Doubling Balls (long)", file: "Command Loom - 32 Doubling Balls.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Circle", file: "Command Loom - Short 1 - Circle.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap((ctx, t) => vert(ctx, "circle", t), VW, VH, (t) => 1 + .04 * t / 30), voice: "marimba",
      events: () => notes("circle", 0, 0, 29.4 / SLOW, SLOW) },
    { id: "s2", name: "Short 2 · Square", file: "Command Loom - Short 2 - Square.mp4", W: VW, H: VH, dur: 32, draw: zoomWrap((ctx, t) => vert(ctx, "square", t), VW, VH, (t) => 1 + .04 * t / 32), voice: "marimba",
      events: () => notes("square", 0, 0, 31.4 / SLOW, SLOW) }
  ];
  // the three simulations take a few seconds each: compute them before the page starts, yielding in between
  const yieldNow = () => new Promise((res) => { const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); res(); }; ch.port2.postMessage(0); });
  const ready = (async () => { for (const k of Object.keys(SHAPES)) { await yieldNow(); sim(k); } })();
  root.CLVideo = { title: "Command Loom · 32 Doubling Balls", timelines, ready };
  root.DoublingVideo = { S, SHAPES, sim, timelines, SLOW, CAP, TEND, ready };
})(typeof window !== "undefined" ? window : globalThis);
