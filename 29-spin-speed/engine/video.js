// 29 Spin Speed: 80 balls in a spinning bowl (bowl.js) at 50, 80, 95, 100, 110 and 120 RPM, then one slow spin-up from 0 to 125 RPM.
// Seen from above. The dashed circle is the predicted ring radius ρ* = √(RB² − (g/ω²)²) (none below the critical speed).
(function (root) {
  "use strict";
  const B = root.Bowl, G = root.Grains, D = root.CLDraw, FPS = 30;
  const C = { bg: "#090B10", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", green: "#5BE38C" };
  const RPMS = [50, 80, 95, 100, 110, 120], P = { ...B.DEF, n: 80 }, UP = 24, UPMAX = 125;
  const wFixed = (rpm) => (t) => B.rpm2w(rpm) * Math.min(1, t / P.ramp), wUp = (t) => B.rpm2w(UPMAX) * Math.min(1, t / UP);
  const runs = {}, run = (k) => runs[k] || (runs[k] = k === "up" ? B.run(G, wUp, UP + 6, P) : B.run(G, wFixed(k), 12.6, P));
  const frameAt = (R, t) => R.frames[Math.max(0, Math.min(R.frames.length - 1, Math.round(t * FPS)))];
  const hsl = (h, l) => `hsl(${Math.round(((h % 1) + 1) % 1 * 360)},80%,${l}%)`;
  // bowl angle at time t (integral of ω), for the turning spokes
  const angle = (wOf, t) => { let a = 0; const n = Math.ceil(t * 60); for (let i = 0; i < n; i++) a += wOf((i + .5) / 60) / 60; return a; };
  function bowl(ctx, k, t, cx, cy, s, kk) {
    const R = run(k), wOf = k === "up" ? wUp : wFixed(k), w = wOf(t), f = frameAt(R, t), rim = P.RIM * s;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rim); g.addColorStop(0, "#2A3242"); g.addColorStop(.7, "#1C2230"); g.addColorStop(1, "#11151E");
    ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rim, 0, 7); ctx.fill();
    const a0 = angle(wOf, t); ctx.strokeStyle = "rgba(160,176,198,.12)"; ctx.lineWidth = 3 * kk;                // spokes painted on the bowl, turning with it
    for (let i = 0; i < 12; i++) { const a = a0 + i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rim * .12, cy - Math.sin(a) * rim * .12); ctx.lineTo(cx + Math.cos(a) * rim * .97, cy - Math.sin(a) * rim * .97); ctx.stroke(); }
    ctx.strokeStyle = "rgba(210,225,255,.85)"; ctx.lineWidth = 5 * kk; ctx.beginPath(); ctx.arc(cx, cy, rim, 0, 7); ctx.stroke();
    const pr = B.ringRadius(w, P); if (pr > 0) { ctx.setLineDash([10 * kk, 8 * kk]); ctx.strokeStyle = "rgba(255,190,80,.7)"; ctx.lineWidth = 2.5 * kk; ctx.beginPath(); ctx.arc(cx, cy, Math.min(pr, P.RIM) * s, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    for (let i = 0; i < P.n; i++) { const x = cx + f[2 * i] * s, y = cy - f[2 * i + 1] * s, rr = P.r * s; const gg = ctx.createRadialGradient(x - rr * .35, y - rr * .4, rr * .1, x, y, rr);
      gg.addColorStop(0, "#fff"); gg.addColorStop(.35, hsl(i / P.n, 62)); gg.addColorStop(1, hsl(i / P.n, 28)); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); }
    ctx.restore();
    return { rpm: w * 60 / (2 * Math.PI), mean: B.meanRadius(R, Math.round(Math.min(t, R.secs) * FPS)), pred: pr };
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const RC = B.rpmCrit(P);

  // ---------- long video ----------
  const S = [["hook", 0, 4], ...RPMS.map((r, i) => ["r" + r, 4 + 12 * i, 16 + 12 * i]), ["up", 76, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const foot = `bowl: part of a 10 cm sphere, rim 8.2 cm out · critical speed ${RC.toFixed(0)} RPM · simplified: top view, friction drags the balls along with the bowl`;
  const status = (st) => st.pred > 0 ? `ring predicted at ${(Math.min(st.pred, P.RIM) * 100).toFixed(1)} cm` : `below ${RC.toFixed(0)} RPM: they stay at the bottom`;
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const st = bowl(ctx, 120, 8.6 + u, 960, 570, 5000, 1); D.text(ctx, "Spin speed 120 RPM", W / 2, 70, 66, C.text, 700); D.text(ctx, status(st), W / 2, 140, 34, C.amber, 600); return; }
    if (sc.id === "up") { const st = bowl(ctx, "up", u, 960, 570, 5000, 1);
      D.text(ctx, `Spinning up: ${Math.round(st.rpm)} RPM`, W / 2, 70, 64, C.text, 700, "center", f); D.text(ctx, status(st), W / 2, 140, 34, st.pred > 0 ? C.amber : C.dim, 600, "center", f);
      D.text(ctx, `balls: ${(st.mean * 100).toFixed(1)} cm from the centre on average`, 1780, 980, 32, C.text, 600, "right", f); D.text(ctx, foot, W / 2, 1050, 20, C.dim, 500, "center", f); return; }
    const rpm = Number(sc.id.slice(1)), st = bowl(ctx, rpm, Math.max(0, u - .3), 960, 570, 5000, 1);
    D.text(ctx, `Spin speed ${rpm} RPM`, W / 2, 70, 70, C.text, 700, "center", f); D.text(ctx, status(st), W / 2, 140, 34, st.pred > 0 ? C.amber : C.dim, 600, "center", f);
    D.text(ctx, `balls: ${(st.mean * 100).toFixed(1)} cm from the centre on average`, 1780, 980, 32, C.text, 600, "right", f); D.text(ctx, foot, W / 2, 1050, 20, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: a soft glass tick each time a ball touches the rim (at most 3 per frame), and one per bowl turn ----------
  function ticks(k, t0, a, b, side = 0, gain = 1) {
    const R = run(k), wOf = k === "up" ? wUp : wFixed(k), ev = [], seen = new Map(), lim = P.RIM - P.r * 1.05, near = new Uint8Array(P.n);
    for (let f = Math.max(1, Math.round(a * FPS)); f < Math.min(R.frames.length, Math.round(b * FPS)); f++) { const fr = R.frames[f];
      for (let i = 0; i < P.n; i++) { const on = Math.hypot(fr[2 * i], fr[2 * i + 1]) > lim; if (on && !near[i]) { const tv = t0 + f / FPS - a, q = Math.floor(tv * FPS), c = seen.get(q) || 0; if (c < 3) { seen.set(q, c + 1); ev.push({ t: tv, k: 8 + (i % 6), side, gain: gain * .5 }); } } near[i] = on ? 1 : 0; } }
    let turns = Math.floor(angle(wOf, a) / (2 * Math.PI)); for (let f = Math.round(a * 60); f < Math.round(b * 60); f++) { const tt = f / 60, n = Math.floor(angle(wOf, tt) / (2 * Math.PI)); if (n > turns) { turns = n; ev.push({ t: t0 + tt - a, k: 2, side, gain: gain * .35, voice: "marimba" }); } }
    return ev.filter((e) => e.t >= t0); }
  function fullEvents() { const ev = [...ticks(120, 0, 8.6, 12.5)]; RPMS.forEach((r) => { const sc = S.find((s) => s.id === "r" + r); ev.push(...ticks(r, sc.t0 + .3, 0, 11.6)); }); ev.push(...ticks("up", 76, 0, 23.4)); return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  function s1(ctx, t) { const i = Math.min(5, Math.floor(t / 5)), rpm = RPMS[i], u = t - 5 * i, a = D.fade(t, 5 * i, 5 * i + 5, .2), st = bowl(ctx, rpm, 7 + u, 540, 1020, 5900, 1.1);
    D.lines(ctx, ["Spin it faster."], 540, 160, 80, C.text, 1); D.text(ctx, `${rpm} RPM`, 540, 330, 110, C.amber, 700, "center", a);
    D.text(ctx, st.pred > 0 ? "a ring forms" : "they stay at the bottom", 540, 1560, 50, C.text, 700, "center", a); D.text(ctx, "simplified spinning-bowl model · real time", 540, 1700, 30, C.dim, 600); }
  function s2(ctx, t) { const st = bowl(ctx, "up", t, 540, 1020, 5900, 1.1);
    D.lines(ctx, ["Wait for", `${RC.toFixed(0)} RPM.`], 540, 150, 80, C.text, 1); D.text(ctx, `${Math.round(st.rpm)} RPM`, 540, 400, 110, st.pred > 0 ? C.amber : C.text, 700);
    D.text(ctx, st.pred > 0 ? "above the critical speed: a ring" : "below it: they stay at the bottom", 540, 1560, 44, C.text, 700); D.text(ctx, "real time · simplified spinning-bowl model", 540, 1700, 30, C.dim, 600); }
  const timelines = [
    { id: "full", name: "29 Spin Speed (long)", file: "Command Loom - 29 Spin Speed.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Spin It Faster", file: "Command Loom - Short 1 - Spin It Faster.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * (t % 5) / 5), voice: "glass",
      events: () => RPMS.flatMap((r, i) => ticks(r, 5 * i, 7, 11.95)).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · Critical Speed", file: "Command Loom - Short 2 - Critical Speed.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => ticks("up", 0, 0, 29.4) }
  ];
  const yieldNow = () => new Promise((res) => { const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); res(); }; ch.port2.postMessage(0); });
  const ready = (async () => { for (const k of [...RPMS, "up"]) { await yieldNow(); run(k); } })();
  root.CLVideo = { title: "Command Loom · 29 Spin Speed", timelines, ready };
  root.SpinVideo = { S, RPMS, run, timelines, ready, P, UP, UPMAX, wUp, wFixed };
})(typeof window !== "undefined" ? window : globalThis);
