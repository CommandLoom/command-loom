// 37 Softness: the same 10 cm soft ball dropped on the floor with softness 0%, 20%, 40%, 60%, 80% and 100% (jelly.js), then
// side by side in slow motion, from 1 m, and the softest one from four heights. Every sound is one impact.
(function (root) {
  "use strict";
  const J = root.Jelly, D = root.CLDraw, FPS = 30;
  const C = { bg: "#0A0C12", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", floor: "#2A3140" };
  const LEVELS = [0, 20, 40, 60, 80, 100], HEIGHTS = [10, 30, 100, 200];
  const OPT = { x0: 0, K: 30000, P0: 3000, sub: 900, spike: false, inc: 4000 };
  const HUE = (p) => .95 - p / 100 * .55;                     // firm = red, soft = green
  const runs = {};
  const key = (p, cm, secs) => p + "@" + cm + ":" + secs;
  const sim = (p, cm, secs) => runs[key(p, cm, secs)] || (runs[key(p, cm, secs)] = J.run(p / 100, secs, { ...OPT, y0: cm / 100 + OPT_R() }));
  function OPT_R() { return J.DEF.R; }
  const NEED = [...LEVELS.map((p) => [p, 30, 7]), [0, 30, 7.6], [100, 30, 7.6], ...LEVELS.map((p) => [p, 100, 14]), ...HEIGHTS.map((h) => [100, h, 4.2])];
  const frameAt = (R, t) => R.frames[Math.max(0, Math.min(R.frames.length - 1, Math.round(t * FPS)))];
  function ball(ctx, R, p, t, cx, fy, s, k) {                 // cx: screen x of the drop line, fy: screen y of the floor, s px per metre
    const f = frameAt(R, t), M = f.length / 2; let mx = 0, my = 0, top = -1;
    ctx.save(); ctx.beginPath();
    for (let i = 0; i <= M; i++) { const j = i % M, x = cx + f[2 * j] * s, y = fy - f[2 * j + 1] * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); mx += f[2 * j] / M; my += f[2 * j + 1] / M; top = Math.max(top, f[2 * j + 1]); }
    ctx.closePath(); const h = HUE(p), g = ctx.createRadialGradient(cx + (mx - 0.018) * s, fy - (my + 0.022) * s, 0.004 * s, cx + mx * s, fy - my * s, 0.075 * s);
    g.addColorStop(0, `hsla(${h * 360},90%,78%,.98)`); g.addColorStop(.5, `hsla(${h * 360},85%,55%,.95)`); g.addColorStop(1, `hsla(${h * 360},80%,32%,.95)`);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = `hsla(${h * 360},70%,25%,.9)`; ctx.lineWidth = 2.5 * k; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(cx + mx * s - 0.018 * s, fy - (my + 0.022) * s, 0.012 * s, 0.007 * s, -.5, 0, 7); ctx.fill(); ctx.restore();
    return { h: top, squash: null };
  }
  function floor(ctx, x0, x1, fy, k) { ctx.save(); ctx.fillStyle = C.floor; ctx.fillRect(x0, fy, x1 - x0, 6 * k); ctx.restore(); }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ...LEVELS.map((p, i) => ["p" + p, 4 + 7 * i, 11 + 7 * i]), ["slow", 46, 70], ["meter", 70, 84], ["heights", 84, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const SLOW = 4, foot = "simplified soft ball: 48 points, springs, pressure, keeps its volume · softness weakens springs and pressure · real time unless marked";
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { floor(ctx, 300, 1620, 900, 1); ball(ctx, sim(100, 30, 7.6), 100, 0.12 + u / SLOW, 960, 900, 2600, 1);
      D.text(ctx, "Softness 100%", W / 2, 80, 66, C.text, 700); D.speed(ctx, "4× slower", W); return; }
    if (sc.id[0] === "p") { const p = Number(sc.id.slice(1)); floor(ctx, 300, 1620, 900, 1); ball(ctx, sim(p, 30, 7), p, u, 960, 900, 2600, 1);
      D.text(ctx, `Softness ${p}%`, W / 2, 80, 70, C.text, 700, "center", f); D.text(ctx, "same ball, same drop: 30 cm", W / 2, 150, 34, C.amber, 600, "center", f);
      D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    if (sc.id === "slow") { const st = u / SLOW; [[0, 560], [100, 1360]].forEach(([p, cx]) => { floor(ctx, cx - 340, cx + 340, 880, 1); ball(ctx, sim(p, 30, 7.6), p, st, cx, 880, 2400, 1); D.text(ctx, `${p}%`, cx, 960, 56, C.text, 700, "center", f); });
      D.text(ctx, "0% vs 100%, 4× slower", W / 2, 80, 64, C.text, 700, "center", f); D.speed(ctx, "4× slower", W); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    if (sc.id === "meter") { LEVELS.forEach((p, j) => { const cx = 210 + 300 * j; floor(ctx, cx - 140, cx + 140, 900, .7); ball(ctx, sim(p, 100, 14), p, u, cx, 900, 1150, .5); D.text(ctx, `${p}%`, cx, 960, 44, C.text, 700, "center", f); });
      D.text(ctx, "All six from 1 metre.", W / 2, 80, 62, C.text, 700, "center", f); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    const i = Math.min(3, Math.floor(u / 4)), hcm = HEIGHTS[i], uu = u - 4 * i, a = D.fade(u, 4 * i, 4 * i + 4, .2), sc2 = hcm >= 100 ? 1000 : 2000, fy = 930;
    floor(ctx, 300, 1620, fy, 1); ball(ctx, sim(100, hcm, 4.2), 100, uu, 960, fy, sc2, hcm >= 100 ? .5 : 1);
    D.text(ctx, `Softness 100% from ${hcm >= 100 ? hcm / 100 + " m" : hcm + " cm"}`, W / 2, 80, 62, C.text, 700, "center", a); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .035 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: a soft "plop" at each impact, louder when faster (at most 2 per frame) ----------
  function plops(R, t0, a, b, slow = 1, side = 0, gain = 1) { const ev = [], seen = new Map();
    for (const [t, v] of R.hits) { if (t < a || t >= b) continue; const tv = t0 + (t - a) * slow, fr = Math.floor(tv * FPS), c = seen.get(fr) || 0; if (c >= 2) continue; seen.set(fr, c + 1);
      ev.push({ t: tv, k: Math.round(14 - R.soft * 10), side, gain: gain * Math.min(1.2, .3 + v / 2.5) }); }
    return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [...plops(sim(100, 30, 7.6), 0, .12, .12 + 3.9 / SLOW, SLOW)];
    LEVELS.forEach((p) => ev.push(...plops(sim(p, 30, 7), s["p" + p].t0, 0, 6.9)));
    ev.push(...plops(sim(0, 30, 7.6), s.slow.t0, 0, 23.8 / SLOW, SLOW, -.6), ...plops(sim(100, 30, 7.6), s.slow.t0, 0, 23.8 / SLOW, SLOW, .6));
    LEVELS.forEach((p, j) => ev.push(...plops(sim(p, 100, 14), s.meter.t0, 0, 13.9, 1, (j - 2.5) * .3, .7)));
    HEIGHTS.forEach((h, i) => ev.push(...plops(sim(100, h, 4.2), s.heights.t0 + 4 * i, 0, i === 3 ? 3.4 : 3.95)));
    return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  function s1(ctx, t) { const i = Math.min(5, Math.floor(t / 5)), p = LEVELS[i], u = t - 5 * i, a = D.fade(t, 5 * i, 5 * i + 5, .2);
    floor(ctx, 80, 1000, 1250, 1.2); ball(ctx, sim(p, 30, 7), p, u, 540, 1250, 2700, 1.2);
    D.lines(ctx, ["Same ball, same drop."], 540, 160, 70, C.text, 1); D.text(ctx, `Softness ${p}%`, 540, 330, 100, C.amber, 700, "center", a);
    D.text(ctx, "simplified soft ball · real time", 540, 1700, 32, C.dim, 600); }
  function s2(ctx, t) { const st = t / SLOW; [[0, 640], [100, 1380]].forEach(([p, fy]) => { floor(ctx, 120, 960, fy, 1.1); ball(ctx, sim(p, 30, 7.6), p, st, 540, fy, 2000, 1.1); D.text(ctx, `${p}%`, 940, fy - 60, 60, C.text, 700, "right"); });
    D.lines(ctx, ["Softness 0% vs 100%"], 540, 150, 70, C.text, 1); D.text(ctx, "4× slower · same drop", 540, 240, 38, C.amber, 600);
    D.text(ctx, "simplified soft ball", 540, 1700, 32, C.dim, 600); }
  const timelines = [
    { id: "full", name: "37 Softness (long)", file: "Command Loom - 37 Softness.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "plop" },
    { id: "s1", name: "Short 1 · Softness 0 to 100", file: "Command Loom - Short 1 - Softness Ladder.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * (t % 5) / 5), voice: "plop",
      events: () => LEVELS.flatMap((p, i) => plops(sim(p, 30, 7), 5 * i, 0, 4.95)).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · 0% vs 100%", file: "Command Loom - Short 2 - Zero vs Hundred.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "plop",
      events: () => [...plops(sim(0, 30, 7.6), 0, 0, 29.4 / SLOW, SLOW, -.4), ...plops(sim(100, 30, 7.6), 0, 0, 29.4 / SLOW, SLOW, .4)] }
  ];
  const yieldNow = () => new Promise((res) => { const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); res(); }; ch.port2.postMessage(0); });
  const ready = (async () => { for (const [p, cm, secs] of NEED) { await yieldNow(); sim(p, cm, secs); } })();
  root.CLVideo = { title: "Command Loom · 37 Softness", timelines, ready };
  root.SoftVideo = { S, LEVELS, HEIGHTS, sim, NEED, timelines, ready, OPT };
})(typeof window !== "undefined" ? window : globalThis);
