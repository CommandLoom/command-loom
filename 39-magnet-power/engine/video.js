// 39 Magnet Power: the same magnet passes over the same 441 steel balls with power 10, 30, 100, 300, 1,000 and 3,000 (magnet.js).
// Seen from above; the dashed circle is the reach where the pull beats static friction.
(function (root) {
  "use strict";
  const M = root.Magnet, G = root.Grains, D = root.CLDraw, FPS = 30;
  const C = { bg: "#0A0C12", table: "#1A1F2B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", red: "#FF4B5C" };
  const POWERS = [10, 30, 100, 300, 1000, 3000];
  const runs = {}, run = (p) => runs[p] || (runs[p] = M.run(G, p));
  const P = M.DEF, frameAt = (R, t) => R.frames[Math.max(0, Math.min(R.frames.length - 1, Math.round(t * FPS)))];
  let ballImg = null;
  function steel(rpx) {                                       // a small pre-drawn steel ball sprite
    const c = document.createElement("canvas"), s = Math.ceil(rpx * 2 + 2); c.width = c.height = s; const g = c.getContext("2d"), m = s / 2;
    const gr = g.createRadialGradient(m - rpx * .35, m - rpx * .4, rpx * .1, m, m, rpx); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.3, "#C9D1DC"); gr.addColorStop(.75, "#6A7484"); gr.addColorStop(1, "#2B313C");
    g.fillStyle = gr; g.beginPath(); g.arc(m, m, rpx, 0, 7); g.fill(); return c;
  }
  function table(ctx, p, t, cx, cy, s, k, labels = true) {
    const R = run(p), f = frameAt(R, t), half = .27, rpx = P.r * s;
    ctx.save(); ctx.fillStyle = C.table; ctx.fillRect(cx - half * s, cy - .21 * s, 2 * half * s, .42 * s); ctx.restore();
    if (!ballImg || Math.abs(ballImg.r - rpx) > .5) { ballImg = steel(rpx); ballImg.r = rpx; }
    for (let i = 0; i < R.n; i++) { const x = cx + f[2 * i] * s, y = cy - f[2 * i + 1] * s; ctx.drawImage(ballImg, x - ballImg.width / 2, y - ballImg.height / 2); }
    const [mx, my] = M.magnetAt(P, t), X = cx + mx * s, Y = cy - my * s, reach = M.reach(p) * s;
    ctx.save(); ctx.setLineDash([10 * k, 8 * k]); ctx.strokeStyle = "rgba(255,190,80,.55)"; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.arc(X, Y, reach, 0, 7); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 5 * k; ctx.shadowColor = "rgba(255,60,80,.8)"; ctx.shadowBlur = 16 * k; ctx.beginPath(); ctx.arc(X, Y, P.rm * s, 0, 7); ctx.stroke(); ctx.restore();
    if (labels) D.text(ctx, "N", X, Y, 26 * k, C.red, 700);
    return M.moved(R, Math.round(t * FPS));
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const fmt = (n) => n.toLocaleString("en-US");

  // ---------- long video ----------
  const S = [["hook", 0, 4], ...POWERS.map((p, i) => ["p" + p, 4 + 13 * i, 17 + 13 * i]), ["all", 82, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const ALL_SLOW = 1.5, foot = "power = pull at 1 cm, in ball weights · pull ∝ 1/distance⁴ · friction 0.3 at rest, 0.05 rolling · simplified: balls don't magnetise each other";
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const n = table(ctx, 3000, 8 + u, 960, 580, 2100, 1); D.text(ctx, "Magnet power 3,000", W / 2, 70, 66, C.text, 700); D.text(ctx, `${fmt(n)} balls moved`, 1700, 1000, 44, C.amber, 700, "right"); return; }
    if (sc.id === "all") { const tt = u / ALL_SLOW; POWERS.forEach((p, j) => { const cx = 330 + 630 * (j % 3), cy = 330 + 410 * Math.floor(j / 3), n = table(ctx, p, tt, cx, cy, 900, .45, false);
        D.text(ctx, `${fmt(p)} · ${n} moved`, cx, cy + 200, 32, C.text, 700, "center", f); });
      D.text(ctx, "All six, side by side.", W / 2, 70, 60, C.text, 700, "center", f); D.speed(ctx, `${ALL_SLOW}× slower`, W); D.text(ctx, foot, W / 2, 1050, 20, C.dim, 500, "center", f); return; }
    const p = Number(sc.id.slice(1)), n = table(ctx, p, Math.max(0, u - .5), 960, 580, 2100, 1);
    D.text(ctx, `Magnet power ${fmt(p)}`, W / 2, 70, 70, C.text, 700, "center", f); D.text(ctx, `reach ${(M.reach(p) * 100).toFixed(1)} cm · ${fmt(n)} balls moved`, W / 2, 140, 36, C.amber, 600, "center", f);
    D.text(ctx, foot, W / 2, 1050, 20, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: a metal click each time a ball starts to move (at most 3 per frame), higher for stronger magnets ----------
  function clicks(p, t0, a, b, slow = 1, side = 0, gain = 1) {
    const R = run(p), ev = [], seen = new Map(), started = new Uint8Array(R.n);
    for (let f = Math.max(1, Math.round(a * FPS)); f < Math.min(R.frames.length, Math.round(b * FPS)); f++) { const fr = R.frames[f];
      for (let i = 0; i < R.n; i++) if (!started[i] && Math.hypot(fr[2 * i] - R.start[i][0], fr[2 * i + 1] - R.start[i][1]) > 0.002) { started[i] = 1;
        const tv = t0 + (f / FPS - a) * slow, fr2 = Math.floor(tv * FPS), c = seen.get(fr2) || 0; if (c >= 3) continue; seen.set(fr2, c + 1); ev.push({ t: tv, k: 4 + POWERS.indexOf(p) * 2, side, gain: gain * .55 }); } }
    return ev; }
  function fullEvents() { const ev = [...clicks(3000, 0, 8, 11.9)]; POWERS.forEach((p) => { const sc = S.find((s) => s.id === "p" + p); ev.push(...clicks(p, sc.t0 + .5, 0, 12)); });
    POWERS.forEach((p, j) => ev.push(...clicks(p, 82, 0, 17.4 / ALL_SLOW, ALL_SLOW, (j % 3 - 1) * .6, .6))); return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, S2_SLOW = 2.4;
  function s1(ctx, t) { const i = Math.min(5, Math.floor(t / 5)), p = POWERS[i], u = t - 5 * i, a = D.fade(t, 5 * i, 5 * i + 5, .2), n = table(ctx, p, 3.5 + u, 540, 1000, 1950, .9);
    D.lines(ctx, ["Same magnet,", "more power."], 540, 150, 76, C.text, 1); D.text(ctx, `Power ${fmt(p)}`, 540, 380, 100, C.amber, 700, "center", a);
    D.text(ctx, `${fmt(n)} balls moved`, 540, 1520, 52, C.text, 700, "center", a); D.text(ctx, "simplified magnet model · real time", 540, 1700, 30, C.dim, 600); }
  function s2(ctx, t) { const tt = t / S2_SLOW, a = table(ctx, 10, tt, 540, 680, 1500, .8), b = table(ctx, 3000, tt, 540, 1390, 1500, .8);
    D.lines(ctx, ["Power 10 vs 3,000"], 540, 150, 74, C.text, 1); D.text(ctx, `${S2_SLOW}× slower · simplified magnet model`, 540, 240, 34, C.amber, 600);
    D.text(ctx, `10 · ${a} moved`, 540, 345, 46, C.text, 700); D.text(ctx, `3,000 · ${b} moved`, 540, 1810, 46, C.text, 700); }
  const timelines = [
    { id: "full", name: "39 Magnet Power (long)", file: "Command Loom - 39 Magnet Power.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "metal" },
    { id: "s1", name: "Short 1 · More Power", file: "Command Loom - Short 1 - More Power.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * (t % 5) / 5), voice: "metal",
      events: () => POWERS.flatMap((p, i) => clicks(p, 5 * i, 3.5, 8.45)).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · 10 vs 3,000", file: "Command Loom - Short 2 - 10 vs 3000.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "metal",
      events: () => [...clicks(10, 0, 0, 29.4 / S2_SLOW, S2_SLOW, -.4), ...clicks(3000, 0, 0, 29.4 / S2_SLOW, S2_SLOW, .4)] }
  ];
  const yieldNow = () => new Promise((res) => { const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); res(); }; ch.port2.postMessage(0); });
  const ready = (async () => { for (const p of POWERS) { await yieldNow(); run(p); } })();
  root.CLVideo = { title: "Command Loom · 39 Magnet Power", timelines, ready };
  root.MagnetVideo = { S, POWERS, run, timelines, ready, ALL_SLOW, S2_SLOW };
})(typeof window !== "undefined" ? window : globalThis);
