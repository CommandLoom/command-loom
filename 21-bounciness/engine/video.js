// 21 Bounciness: the same ball, dropped the same way into the same 1 m ring, with bounciness 0%, 50%, 80%, 95%, 100%, 101% and 105%
// (bounce.js). Real time. Above 100% each bounce adds speed: labelled as impossible in reality. Every sound is one bounce.
(function (root) {
  "use strict";
  const B = root.Bounce, D = root.CLDraw, FPS = 30, R = 1, r = 0.04, V_MAX = 100;
  const START = { x0: -0.45, y0: 0.45, vx0: 2.2, vy0: 0 };
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", red: "#FF5A6E", ring: "rgba(210,225,255,.9)" };
  const LEVELS = [0, 50, 80, 95, 100, 101, 105];
  const HUE = { 99: .5, 0: .58, 50: .5, 80: .36, 95: .15, 100: .1, 101: .03, 105: .95 };
  const sims = {}, sim = (p) => sims[p] || (sims[p] = B.run(p / 100, { R, r, ...START, tEnd: 40, vMax: V_MAX }));
  const S = [["hook", 0, 4], ["0", 4, 14], ["50", 14, 24], ["80", 24, 36], ["95", 36, 49], ["100", 49, 61], ["101", 61, 75], ["105", 75, 86], ["all", 86, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const hsl = (h, l, a) => `hsla(${Math.round(((h % 1) + 1) % 1 * 360)},90%,${l}%,${a})`;
  const stopT = (p) => { const s = sim(p), h = s.hits; return p > 100 && Math.hypot(...B.vel(s, h[h.length - 1].t + 1e-6)) >= V_MAX * .9 ? h[h.length - 1].t : Infinity; };

  function ring(ctx, p, t, cx, cy, s, k) {
    const Sm = sim(p), g = Sm.g, i = B.segAt(Sm, t), stop = stopT(p), tt = Math.min(t, stop);
    const hot = Math.min(1, Math.max(0, (t - stop) / .3));
    ctx.save(); ctx.strokeStyle = hot > 0 ? `rgba(255,${Math.round(225 - 120 * hot)},${Math.round(255 - 170 * hot)},1)` : C.ring; ctx.lineWidth = (3 + 4 * hot) * k;
    ctx.shadowColor = hot > 0 ? "rgba(255,120,90,.9)" : "rgba(140,190,255,.8)"; ctx.shadowBlur = (12 + 30 * hot) * k; ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, 7); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const j0 = Math.max(0, i - 700);
    for (let j = j0; j <= i; j++) {
      const sg = Sm.segs[j], end = Math.min(j < i ? Sm.segs[j + 1].t : tt, tt) - sg.t; if (end <= 0) continue;
      const recent = i - j; ctx.strokeStyle = hsl(HUE[p] + j * .012, 62, recent < 2 ? .95 : Math.max(.2, .7 - recent * .008)); ctx.lineWidth = (recent < 2 ? 3.5 : 2) * k; ctx.beginPath();
      if (sg.type === "fly") { const n = Math.max(3, Math.min(160, Math.ceil(end * 120)));
        for (let q = 0; q <= n; q++) { const s2 = end * q / n, x = sg.x + sg.vx * s2, y = sg.y + sg.vy * s2 - 0.5 * g * s2 * s2; q ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s); } }
      else { const m = Math.min(sg.phi.length - 1, Math.floor(end / sg.dt)), a0 = Math.max(0, m - 3600);   // last 1.5 s of sliding
        for (let q = a0; q <= m; q += 8) { const x = Sm.Rc * Math.cos(sg.phi[q]), y = Sm.Rc * Math.sin(sg.phi[q]); q > a0 ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s); } }
      ctx.stroke();
    }
    ctx.restore();
    const q = B.pos(Sm, tt); ctx.save(); ctx.shadowColor = "#fff"; ctx.shadowBlur = 16 * k; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + q[0] * s, cy - q[1] * s, r * s, 0, 7); ctx.fill(); ctx.restore();
    return { n: B.hitsBefore(Sm, tt), v: Math.hypot(...B.vel(Sm, tt)), stopped: t >= stop };
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const sub = (p) => p === 0 ? "every bounce keeps 0% of its speed towards the wall" : p < 100 ? `every bounce keeps ${p}% of its speed towards the wall` : p === 100 ? "every bounce keeps 100%: no energy lost" : `every bounce gains ${p - 100}% speed: impossible in reality`;
  const kmh = (v) => `${v.toFixed(1)} m/s`;

  // ---------- long video ----------
  const HOOK0 = 6;
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1), foot = "real time · ring 1 m radius · same start every time · no friction";
    if (sc.id === "hook") { const st = ring(ctx, 105, HOOK0 + u, 960, 600, 420, 1);
      D.text(ctx, "Bounciness 105%", W / 2, 72, 66, C.text, 700); D.text(ctx, sub(105), W / 2, 142, 34, C.red, 600);
      D.text(ctx, `speed ${kmh(st.v)}`, 1780, 980, 44, C.amber, 700, "right"); return; }
    if (sc.id === "all") {
      LEVELS.forEach((p, j) => { const top = j < 4, cx = top ? 240 + 480 * j : 480 + 480 * (j - 4), cy = top ? 350 : 765, st = ring(ctx, p, u, cx, cy, 145, .6);
        D.text(ctx, p + "%", cx - 70, cy + 178, 44, p > 100 ? C.red : C.text, 700, "center", f); D.text(ctx, `${st.n} bounce${st.n === 1 ? "" : "s"}`, cx + 60, cy + 180, 26, C.amber, 600, "center", f); });
      D.text(ctx, "Same drop, seven bounciness values.", W / 2, 72, 56, C.text, 700, "center", f);
      D.text(ctx, "above 100% each bounce adds speed, which no real ball can do", W / 2, 142, 32, C.red, 600, "center", f);
      D.text(ctx, foot, W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    const p = Number(sc.id), st = ring(ctx, p, u, 960, 600, 420, 1);
    D.text(ctx, `Bounciness ${p}%`, W / 2, 72, 66, C.text, 700, "center", f); D.text(ctx, sub(p), W / 2, 142, 34, p > 100 ? C.red : C.amber, 600, "center", f);
    D.text(ctx, `bounces: ${st.n}`, 1780, 930, 44, C.amber, 700, "right", f); D.text(ctx, `speed ${kmh(st.v)}`, 1780, 985, 36, C.text, 600, "right", f);
    if (st.stopped) D.text(ctx, `${V_MAX} m/s reached: simulation stopped`, W / 2, 1000, 40, C.red, 700, "center", f);
    if (p === 0 && u > 1.2) D.text(ctx, "no bounce: it slides along the ring", 140, 985, 34, C.text, 600, "left", f);
    D.text(ctx, foot, W / 2, 1050, 24, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: a marimba note per bounce (louder when faster); a soft bell each time a sliding ball passes the bottom ----------
  function notes(p, t0, a, b, side = 0, gain = 1) {
    const Sm = sim(p), ev = [], seen = new Map(), stop = stopT(p);
    for (const h of Sm.hits) { if (h.t < a || h.t >= b || h.t > stop) continue; const fr = Math.floor(h.t * FPS), c = seen.get(fr) || 0; if (c >= 3) continue; seen.set(fr, c + 1);
      const k = Math.round(((h.angle / (2 * Math.PI) + 1) % 1) * 15); ev.push({ t: t0 + h.t - a, k, side, gain: gain * Math.min(1, .25 + h.speed / 5) * .75 }); }
    for (const sg of Sm.segs) if (sg.type === "slide") for (let q = 1; q < sg.phi.length; q++) {   // passes the bottom (phi = -90°)
      const tq = sg.t + q * sg.dt; if (tq < a || tq >= b) continue;
      const c0 = Math.cos(sg.phi[q - 1]), c1 = Math.cos(sg.phi[q]); if (Math.sin(sg.phi[q]) < 0 && c0 * c1 <= 0 && c0 !== c1) ev.push({ t: t0 + tq - a, k: 5, side, gain: gain * .5, voice: "bell" }); }
    return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [...notes(105, 0, HOOK0, HOOK0 + 3.9)];
    for (const p of LEVELS) { const sc = s[String(p)]; ev.push(...notes(p, sc.t0, 0, sc.t1 - sc.t0 - .05)); }
    LEVELS.forEach((p, j) => ev.push(...notes(p, s.all.t0, 0, 13.3, (j - 3) * .3, .55)));
    return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  const L1 = [[0, 0, 3.5], [50, 3.5, 7], [80, 7, 11], [95, 11, 15], [100, 15, 19], [101, 19, 23], [105, 23, 34]];
  function s1(ctx, t) { const seg = L1.find((x) => t < x[2]) || L1[L1.length - 1], p = seg[0], u = t - seg[1], f = D.fade(t, seg[1], seg[2], .2), st = ring(ctx, p, u, 540, 1040, 470, 1.15);
    D.lines(ctx, ["Bounciness 0% to 105%."], 540, 170, 70, C.text, 1);
    D.text(ctx, p + "%", 540, 380, 120, p > 100 ? C.red : C.amber, 700, "center", f); D.text(ctx, `bounces: ${st.n} · ${kmh(st.v)}`, 540, 480, 40, C.text, 600, "center", f);
    if (p > 100) D.text(ctx, "gains speed each bounce: impossible", 540, 1585, 38, C.red, 700, "center", f);
    if (st.stopped) D.text(ctx, `${V_MAX} m/s: simulation stopped`, 540, 1640, 40, C.red, 700, "center", f);
    D.text(ctx, "real time · ring 1 m radius · no friction", 540, 1700, 30, C.dim, 600); }
  function s2(ctx, t) { const a = ring(ctx, 99, t, 540, 770, 330, 1), b = ring(ctx, 101, t, 540, 1470, 330, 1);
    D.lines(ctx, ["99% vs 101%."], 540, 150, 84, C.text, 1);
    D.text(ctx, `99% · loses a little · ${kmh(a.v)}`, 540, 390, 42, C.text, 700); D.text(ctx, `101% · gains a little · ${kmh(b.v)}`, 540, 1845, 42, C.red, 700);
    D.text(ctx, "same drop, real time · 101% is impossible in reality", 540, 262, 30, C.dim, 600); }
  const timelines = [
    { id: "full", name: "21 Bounciness (long)", file: "Command Loom - 21 Bounciness.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · 0% to 105%", file: "Command Loom - Short 1 - Zero to 105.mp4", W: VW, H: VH, dur: 34, draw: zoomWrap(s1, VW, VH, (t) => 1 + .04 * t / 34), voice: "marimba",
      events: () => L1.flatMap(([p, a, b]) => notes(p, a, 0, b - a - .05)).filter((e) => e.t < 33.4) },
    { id: "s2", name: "Short 2 · 99% vs 101%", file: "Command Loom - Short 2 - 99 vs 101.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "marimba",
      events: () => [...notes(99, 0, 0, 29.3, -.5), ...notes(101, 0, 0, 29.3, .5, .8)] }
  ];
  root.CLVideo = { title: "Command Loom · 21 Bounciness", timelines, ready: Promise.resolve() };
  root.BounceVideo = { S, LEVELS, sim, stopT, timelines, R, r, V_MAX, START };
})(typeof window !== "undefined" ? window : globalThis);
