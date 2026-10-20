// 23 Wait for Zero: a ball bouncing in a circle, a triangle, a diamond and a hexagon; every bounce shrinks the shape by 1% of its
// starting size (shrink.js). The counter runs from 100% to 0%, where the shape is exactly the ball's size. Real time, real gravity.
(function (root) {
  "use strict";
  const Z = root.Shrink, D = root.CLDraw, FPS = 30, r = 0.04, D2R = Math.PI / 180;
  const START = { x0: 0.15, y0: 0.4, vx0: 1.6, vy0: 0 };
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", green: "#5BE38C" };
  const SHAPES = {
    circle:   { name: "circle",   type: "circle", hue: .55, L: [420, 590], P: [470, 1080] },
    triangle: { name: "triangle", type: "poly", n: 3, rot: -90 * D2R, hue: .08, L: [280, 720], P: [300, 1200] },
    diamond:  { name: "diamond",  type: "poly", n: 4, rot: 45 * D2R, hue: .8, L: [300, 610], P: [340, 1080] },
    hexagon:  { name: "hexagon",  type: "poly", n: 6, rot: -90 * D2R, hue: .33, L: [420, 590], P: [440, 1080] },
    square:   { name: "square",   type: "poly", n: 4, rot: 0, hue: .62, L: [420, 590], P: [470, 1080] }
  };
  const sims = {}, sim = (k) => sims[k] || (sims[k] = Z.run(SHAPES[k], { r, ...START, tEnd: 120 }));
  const ZERO = (k) => sim(k).tZero;
  const hsl = (h, l, a) => `hsla(${Math.round(((h % 1) + 1) % 1 * 360)},90%,${l}%,${a})`;

  function outline(ctx, sh, rho, cx, cy, s) {
    ctx.beginPath();
    if (sh.type === "circle") { ctx.arc(cx, cy, rho * s, 0, 7); return; }
    const R = rho / Math.cos(Math.PI / sh.n);                // circumradius from inradius; vertices sit between the side normals
    for (let i = 0; i <= sh.n; i++) { const th = sh.rot + Math.PI / sh.n + 2 * Math.PI * i / sh.n, x = R * Math.cos(th), y = R * Math.sin(th); i ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s); }
    ctx.closePath();
  }
  // state at time t: drawn size eases over 0.1 s after each shrink (display only; the ball is already inside the new size)
  function state(k, t) {
    const S = sim(k), z = S.tZero, n = Z.hitsBefore(S, t), pct = Math.max(0, 100 - n);
    // drawn shape eases from the previous size and centre to the new one over 0.1 s (it always contains the new shape)
    let rho = S.a0 + r, c = [0, 0];
    for (const h of S.hits) { if (h.t > t) break; const e = D.smooth((t - h.t) / .1); rho = rho + (h.a + r - rho) * e; c = [c[0] + (h.cx - c[0]) * e, c[1] + (h.cy - c[1]) * e]; }
    return { S, n, pct, rho, c, p: Z.pos(S, t), done: z != null && t >= z };
  }
  function scene(ctx, k, t, cx, cy, s, kk) {
    const sh = SHAPES[k], st = state(k, t), S = st.S;
    // faint outlines of the sizes already passed
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    let i = 0; for (const z of S.hits) { if (z.t > t) break; i++; if (i % 2) continue; outline(ctx, sh, z.a + r, cx + z.cx * s, cy - z.cy * s, s); ctx.strokeStyle = hsl(sh.hue + (100 - z.pct) * .004, 60, .16); ctx.lineWidth = 1.5 * kk; ctx.stroke(); }
    ctx.restore();
    // trail: the last 10 flights
    const j = Z.segAt(S, Math.min(t, S.tZero ?? t)), tt = Math.min(t, S.tZero ?? t);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (let q = Math.max(0, j - 10); q <= j; q++) { const sg = S.segs[q], end = (q < j ? S.segs[q + 1].t : tt) - sg.t; if (end <= 0) continue; const age = j - q, nn = Math.max(3, Math.min(80, Math.ceil(end * 120)));
      ctx.strokeStyle = hsl(sh.hue + q * .01, 65, age < 1 ? .95 : .6 - age * .05); ctx.lineWidth = (age < 1 ? 3.5 : 2.2) * kk; ctx.beginPath();
      for (let m = 0; m <= nn; m++) { const s2 = end * m / nn, x = sg.x + sg.vx * s2, y = sg.y + sg.vy * s2 - 0.5 * S.g * s2 * s2; m ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s); }
      ctx.stroke(); }
    ctx.restore();
    // the shape
    const glow = st.done ? D.clamp((t - S.tZero) / .4) * (.75 + .25 * Math.sin((t - S.tZero) * 5)) : 0;   // gentle pulse once it fits
    ctx.save(); outline(ctx, sh, st.rho, cx + st.c[0] * s, cy - st.c[1] * s, s); ctx.strokeStyle = glow ? C.green : hsl(sh.hue + (100 - st.pct) * .004, 70, .95); ctx.lineWidth = (4 + 3 * glow) * kk; ctx.shadowColor = glow ? C.green : hsl(sh.hue, 70, .9); ctx.shadowBlur = (14 + 30 * glow) * kk; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.shadowColor = "#fff"; ctx.shadowBlur = 16 * kk; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + st.p[0] * s, cy - st.p[1] * s, r * s, 0, 7); ctx.fill(); ctx.restore();
    return st;
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["circle", 4, 28.5], ["triangle", 28.5, 50.5], ["hexagon", 50.5, 75.5], ["diamond", 75.5, 110]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const HOOK0 = () => ZERO("circle") - 3.2;
  const foot = "game rule: each bounce shrinks the shape by 1% of its starting size · real gravity · no energy lost";
  function big(ctx, st, x, y, px, a = 1) { D.text(ctx, st.done ? "0%" : st.pct + "%", x, y, px, st.done ? C.green : C.text, 700, "center", a); }
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const st = scene(ctx, "circle", HOOK0() + u, 960, SHAPES.circle.L[1], SHAPES.circle.L[0], 1);
      D.text(ctx, "Wait for 0%", W / 2, 72, 66, C.text, 700); big(ctx, st, 1700, 560, 130); return; }
    const k = sc.id, st = scene(ctx, k, u, 960, SHAPES[k].L[1], SHAPES[k].L[0], 1);
    D.text(ctx, "Wait for 0%", W / 2, 72, 66, C.text, 700, "center", f); D.text(ctx, `every bounce shrinks the ${k} by 1%`, W / 2, 142, 36, C.amber, 600, "center", f);
    big(ctx, st, 1700, 560, 130, f); D.text(ctx, `bounces: ${st.n}`, 1700, 680, 38, C.amber, 600, "center", f);
    if (st.done) D.text(ctx, "exactly the ball's size", 1700, 760, 40, C.green, 700, "center", f);
    D.text(ctx, foot, W / 2, 1050, 24, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: a marimba note per bounce, rising as the counter falls; a bell at 0% ----------
  function notes(k, t0, a, b, side = 0, gain = 1) {
    const Sm = sim(k), ev = [], seen = new Map();
    for (const h of Sm.hits) { if (h.t < a || h.t >= b) continue; const fr = Math.floor(h.t * FPS), c = seen.get(fr) || 0; if (c >= 3) continue; seen.set(fr, c + 1);
      ev.push({ t: t0 + h.t - a, k: Math.round((100 - h.pct) / 100 * 15), side, gain: gain * .75 }); }
    if (Sm.tZero != null && Sm.tZero + .25 >= a && Sm.tZero + .25 < b) ev.push({ t: t0 + Sm.tZero + .25 - a, k: 10, side, gain: gain * 1.1, voice: "bell" });
    return ev; }
  function fullEvents() { const ev = [...notes("circle", 0, HOOK0(), HOOK0() + 3.9)]; for (const sc of S.slice(1)) ev.push(...notes(sc.id, sc.t0, 0, sc.t1 - sc.t0 - .1)); return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  function vert(ctx, k, u, alpha = 1) { const st = scene(ctx, k, u, 540, SHAPES[k].P[1], SHAPES[k].P[0], 1.15);
    D.lines(ctx, ["Wait for 0%."], 540, 170, 84, C.text, 1); D.text(ctx, `every bounce shrinks the ${k} by 1%`, 540, 280, 40, C.amber, 600, "center", alpha);
    big(ctx, st, 540, 450, 150, alpha);
    if (st.done) D.text(ctx, "exactly the ball's size", 540, 1680, 48, C.green, 700, "center", alpha);
    D.text(ctx, "game rule · real gravity · no energy lost", 540, 1600, 30, C.dim, 600); }
  const S1D = Math.round((ZERO("diamond") + 1.5) * 30) / 30, S2D = Math.round((ZERO("square") + 2.9) * 30) / 30;
  const timelines = [
    { id: "full", name: "23 Wait for Zero (long)", file: "Command Loom - 23 Wait for Zero.mp4", W: 1920, H: 1080, dur: 110, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Diamond", file: "Command Loom - Short 1 - Diamond.mp4", W: VW, H: VH, dur: S1D, draw: zoomWrap((ctx, t) => vert(ctx, "diamond", t), VW, VH, (t) => 1 + .04 * t / S1D), voice: "marimba",
      events: () => notes("diamond", 0, 0, S1D - .6) },
    { id: "s2", name: "Short 2 · Square", file: "Command Loom - Short 2 - Square.mp4", W: VW, H: VH, dur: S2D, draw: zoomWrap((ctx, t) => vert(ctx, "square", t), VW, VH, (t) => 1 + .04 * t / S2D), voice: "marimba",
      events: () => notes("square", 0, 0, S2D - .6) }
  ];
  root.CLVideo = { title: "Command Loom · 23 Wait for Zero", timelines, ready: Promise.resolve() };
  root.ZeroVideo = { S, SHAPES, sim, ZERO, timelines, r, START };
})(typeof window !== "undefined" ? window : globalThis);
