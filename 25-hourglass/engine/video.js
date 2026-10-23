// 25 Hourglass: the same hourglass with a 1.6 cm neck, filled with 1, 10, 100, 1,000 and 3,000 balls of the same total amount
// (hourglass.js). The simulations (grains.js) were run once by precompute.js; this page plays back the recorded frames
// (30 per simulated second; slowed-down playback blends neighbouring recorded frames so the motion stays smooth).
(function (root) {
  "use strict";
  const H = root.Hourglass, D = root.CLDraw, FPS = 30;
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", green: "#5BE38C", red: "#FF5A6E", glass: "rgba(200,225,255,.85)" };
  const COUNTS = [1, 10, 100, 1000, 3000];
  const data = {};
  function parse(buf) {                                        // ArrayBuffer → {N, frames, r, at(f) → Float32Array [x, y, …]}
    const dv = new DataView(buf), N = dv.getUint32(4, true), frames = dv.getUint32(8, true), B = [0, 1, 2, 3].map((i) => dv.getFloat32(12 + 4 * i, true));
    const r = new Float32Array(N); for (let i = 0; i < N; i++) r[i] = dv.getFloat32(28 + 4 * i, true);
    const q = new Uint16Array(buf, 28 + 4 * N, frames * N * 2), out = new Float32Array(2 * N);
    const at = (f) => { f = Math.max(0, Math.min(frames - 1, f)); const o = f * N * 2; for (let i = 0; i < N; i++) { out[2 * i] = B[0] + q[o + 2 * i] / 65535 * (B[1] - B[0]); out[2 * i + 1] = B[2] + q[o + 2 * i + 1] / 65535 * (B[3] - B[2]); } return out; };
    // balls below the neck at each frame
    const passed = new Int32Array(frames); for (let f = 0; f < frames; f++) { const o = f * N * 2; let c = 0; for (let i = 0; i < N; i++) if (B[2] + q[o + 2 * i + 1] / 65535 * (B[3] - B[2]) < 0) c++; passed[f] = c; }
    const y0 = new Float32Array(N); for (let i = 0; i < N; i++) y0[i] = B[2] + q[2 * i + 1] / 65535 * (B[3] - B[2]);
    return { N, frames, r, at, passed, y0, box: B };
  }
  // positions at simulated time ts, blended between the two recorded frames around it
  const blend = {};
  function atTime(N, ts) { const Dt = data[N], f = Math.max(0, Math.min(Dt.frames - 1, ts * FPS)), f0 = Math.floor(f), a = f - f0, A = (blend[N] || (blend[N] = new Float32Array(2 * Dt.N)));
    A.set(Dt.at(f0)); if (a > 1e-6 && f0 + 1 < Dt.frames) { const B = Dt.at(f0 + 1); for (let i = 0; i < A.length; i++) A[i] += (B[i] - A[i]) * a; } return A; }
  const hsl = (h, l) => `hsl(${Math.round(((h % 1) + 1) % 1 * 360)},85%,${l}%)`;
  function glass(ctx, cx, cy, s, k) {
    ctx.save(); ctx.beginPath(); const P = H.PROFILE;
    const pts = [...P.map(([x, y]) => [x, y]), ...P.slice().reverse().map(([x, y]) => [-x, y]), ...P.map(([x, y]) => [-x, -y]), ...P.slice().reverse().map(([x, y]) => [x, -y])];
    pts.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s)); ctx.closePath();
    ctx.fillStyle = "rgba(120,160,220,.07)"; ctx.fill(); ctx.strokeStyle = C.glass; ctx.lineWidth = 3.5 * k; ctx.shadowColor = "rgba(140,190,255,.7)"; ctx.shadowBlur = 12 * k; ctx.stroke(); ctx.restore();
  }
  function hourglass(ctx, N, ts, cx, cy, s, k) {
    const Dt = data[N], p = atTime(N, ts);
    glass(ctx, cx, cy, s, k);
    for (let i = 0; i < Dt.N; i++) {                          // colour from the starting height: layers, like coloured sand
      const hue = .02 + .75 * (Dt.y0[i] / .17), x = cx + p[2 * i] * s, y = cy - p[2 * i + 1] * s, rr = Math.max(1.2, Dt.r[i] * s);
      ctx.fillStyle = hsl(hue, 58); ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
      if (rr > 5) { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(x - rr * .3, y - rr * .3, rr * .35, 0, 7); ctx.fill(); }
    }
    return { passed: Dt.passed[Math.max(0, Math.min(Dt.frames - 1, Math.floor(ts * FPS)))], N: Dt.N };
  }
  function zoomWrap(inner, W, H2, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H2); ctx.save(); ctx.translate(W / 2, H2 / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H2 / 2); inner(ctx, t); ctx.restore(); }; }
  const fmt = (n) => n.toLocaleString("en-US"), mm = (N) => (data[N].r.reduce((a, b) => a + b, 0) / data[N].N * 2000).toFixed(N === 1 ? 0 : 1);
  const tEmpty = (N) => { const Dt = data[N]; for (let f = 0; f < Dt.frames; f++) if (Dt.passed[f] === Dt.N) return f / FPS; return null; };
  // the moment a jammed glass stops moving (no ball moves more than 0.2 mm in a recorded frame)
  const tStill = (N) => { const Dt = data[N]; let prev = Dt.at(0).slice(); for (let f = 1; f < Dt.frames; f++) { const p = Dt.at(f); let m = 0; for (let i = 0; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - prev[i])); if (m < 2e-4) return f / FPS; prev = p.slice(); } return null; };
  const status = (st) => st.passed === st.N ? "✓ all through" : `${fmt(st.passed)} / ${fmt(st.N)} through`;
  const slowLabel = (v) => v === 1 ? "real time" : `${v}× slower`;
  const foot = "neck 1.6 cm · about the same total amount every time · simplified grain model: hard balls, friction, no spin";

  // ---------- long video ----------
  // jams: the three big-ball glasses released one after another; flows: 1,000 and 3,000 slowed; neck: a close-up; all: five together
  const S = [["hook", 0, 5], ["jam", 5, 9], ["1000", 9, 23], ["3000", 23, 40], ["neck", 40, 56], ["all", 56, 70]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  // the big balls do not move at all once released (they already sit in the neck), so the jam is shown briefly: a ✗ for each glass in turn
  const JAM = [[1, 5.5], [10, 6.4], [100, 7.3]], SLOW = { hook: 2, 1000: 2, 3000: 4, neck: 8, all: 2 }, REL = { 1000: 9.4, 3000: 23.4, all: 56.4 }, NECK = [1.0, 40.1], HOOK0 = .6;
  const SCALE = 2500;
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const st = hourglass(ctx, 3000, HOOK0 + u / SLOW.hook, 960, 560, SCALE, 1);
      D.text(ctx, "1 ball… or 3,000?", W / 2, 70, 62, C.text, 700); D.text(ctx, status(st), 1560, 560, 50, C.amber, 700); D.speed(ctx, slowLabel(SLOW.hook), W); return; }
    if (sc.id === "jam") {
      JAM.forEach(([N, t0], j) => { const cx = 460 + 500 * j, st = hourglass(ctx, N, Math.max(0, t - 5), cx, 560, 1500, .8), stuck = t >= t0;
        D.text(ctx, `${fmt(N)} ball${N > 1 ? "s" : ""}`, cx, 870, 46, C.text, 700, "center", f); D.text(ctx, `each ${mm(N)} mm`, cx, 920, 28, C.dim, 600, "center", f);
        if (stuck) D.text(ctx, "✗ stuck", cx, 980, 40, C.red, 700, "center", D.clamp((t - t0) / .25) * f); });
      D.text(ctx, "Big balls jam the 16 mm neck.", W / 2, 80, 60, C.text, 700, "center", f); D.speed(ctx, slowLabel(1), W); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    if (sc.id === "neck") { const ts = NECK[0] + Math.max(0, t - NECK[1]) / SLOW.neck, st = hourglass(ctx, 3000, ts, 960, 540, 9000, 1.6); D.topShade(ctx, W, 200);
      D.text(ctx, "Up close at the neck.", W / 2, 80, 60, C.text, 700, "center", f); D.text(ctx, status(st), 1700, 1000, 46, C.amber, 700, "right", f); D.speed(ctx, slowLabel(SLOW.neck), W);
      D.text(ctx, "3,000 balls, 2 mm each, through a 16 mm neck", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    if (sc.id === "all") {
      COUNTS.forEach((N, j) => { const cx = 210 + 375 * j, st = hourglass(ctx, N, Math.max(0, t - REL.all) / SLOW.all, cx, 540, 1450, .7);
        D.text(ctx, fmt(N), cx, 870, 46, C.text, 700, "center", f); D.text(ctx, status(st), cx, 918, 26, st.passed === st.N ? C.green : N <= 100 ? C.red : C.amber, 600, "center", f); });
      D.text(ctx, "All five, released together.", W / 2, 80, 60, C.text, 700, "center", f); D.speed(ctx, slowLabel(SLOW.all), W); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    const N = Number(sc.id), v = SLOW[N], ts = Math.max(0, t - REL[N]) / v, st = hourglass(ctx, N, ts, 960, 560, SCALE, 1); D.speed(ctx, slowLabel(v), W);
    D.text(ctx, `${fmt(N)} balls`, 380, 420, 96, C.text, 700, "center", f); D.text(ctx, `each about ${mm(N)} mm wide`, 380, 510, 38, C.amber, 600, "center", f);
    D.text(ctx, "the neck: 16 mm", 380, 570, 34, C.dim, 600, "center", f);
    D.text(ctx, status(st), 1540, 470, 52, st.passed === st.N ? C.green : C.amber, 700, "center", f); D.text(ctx, `${ts.toFixed(1)} s after release`, 1540, 550, 36, C.text, 600, "center", f);
    D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .02 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound ----------
  // a glassy tick each time a ball passes the neck (pitch from its starting height) and a wooden knock each time a ball lands (its fall
  // stops: downward speed over 0.25 m/s, then nearly none), both read from the recorded frames; at most `cap` sounds of each kind per video frame
  function notes(N, t0, a, b, side = 0, gain = 1, slow = 1, cap = 3) {
    const Dt = data[N], ev = [], seenP = new Map(), seenL = new Map(), crossed = new Uint8Array(Dt.N), f0 = Math.floor(a * FPS);
    let p0 = Dt.at(Math.max(0, f0 - 1)).slice(), p1 = Dt.at(f0).slice();
    for (let f = f0 + 1; f < Math.min(Dt.frames, Math.ceil(b * FPS)); f++) { const p = Dt.at(f), tv = t0 + (f / FPS - a) * slow, fr = Math.floor(tv * FPS);
      for (let i = 0; i < Dt.N; i++) {
        if (!crossed[i] && p1[2 * i + 1] >= 0 && p[2 * i + 1] < 0) { crossed[i] = 1; const c = seenP.get(fr) || 0; if (c < cap) { seenP.set(fr, c + 1); ev.push({ t: tv, k: Math.round(Dt.y0[i] / .17 * 15), side, gain: gain * (N <= 10 ? 1 : .6), voice: "glass" }); } }
        const vPrev = (p1[2 * i + 1] - p0[2 * i + 1]) * FPS, vNow = (p[2 * i + 1] - p1[2 * i + 1]) * FPS;
        if (vPrev < -.25 && vNow > -.06) { const c = seenL.get(fr) || 0; if (c < cap) { seenL.set(fr, c + 1); ev.push({ t: tv, k: Math.max(0, Math.min(15, Math.round(-vPrev * 4))), side, gain: gain * Math.min(1, .25 - vPrev * .4), voice: "wood" }); } } }
      p0 = p1; p1 = p.slice(); }
    return ev; }
  function fullEvents() { const ev = [...notes(3000, 0, HOOK0, HOOK0 + 4.9 / SLOW.hook, 0, 1, SLOW.hook)];
    JAM.forEach(([N, t0], j) => ev.push({ t: t0, k: 2 + 2 * j, voice: "bell", gain: .55, side: (j - 1) * .5 }, { t: t0, k: 3, voice: "wood", gain: .7, side: (j - 1) * .5 })); ev.push({ t: 8.2, k: 9, voice: "bell", gain: .45 });
    for (const N of [1000, 3000]) { const sc = S.find((x) => x.id === String(N)), v = SLOW[N]; ev.push({ t: sc.t0 + .1, k: 6, voice: "bell", gain: .5 }, ...notes(N, REL[N], 0, (sc.t1 - REL[N] - .1) / v, 0, 1, v));
      [8, 12, 15].forEach((k, j) => ev.push({ t: REL[N] + tEmpty(N) * v + .1 + .4 * j, k, voice: "bell", gain: .6 })); }
    ev.push({ t: 40.05, k: 9, voice: "bell", gain: .5 }, ...notes(3000, NECK[1], NECK[0], NECK[0] + (S[4].t1 - NECK[1] - .1) / SLOW.neck, 0, 1, SLOW.neck, 2));
    ev.push({ t: 56.05, k: 5, voice: "bell", gain: .5 }); COUNTS.forEach((N, j) => ev.push(...notes(N, REL.all, 0, (69.4 - REL.all) / SLOW.all, (j - 2) * .4, .6, SLOW.all, 2)));
    for (const N of [1000, 3000]) [7, 11].forEach((k) => ev.push({ t: REL.all + tEmpty(N) * SLOW.all + .1, k, voice: "bell", gain: .55 }));
    return ev.filter((e) => e.t < 69.4); }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, L1 = [[1, 0, 2.5, 1], [10, 2.5, 5, 1], [100, 5, 7.5, 1], [1000, 7.5, 19.8, 2], [3000, 19.8, 31, 2.5]], S2V = 7.5;
  function vert(ctx, N, ts, alpha, title, v) { const st = hourglass(ctx, N, ts, 540, 1060, 3600, 1.2); D.text(ctx, slowLabel(v), 540, 1640, 40, C.amber, 600, "center", alpha);
    D.lines(ctx, title, 540, 140, 72, C.text, 1); D.text(ctx, `${fmt(N)} ball${N > 1 ? "s" : ""}`, 540, 330, 96, C.amber, 700, "center", alpha);
    const stuck = N <= 100 && ts >= .8; D.text(ctx, stuck ? "✗ stuck" : status(st), 540, 1720, 52, st.passed === st.N ? C.green : stuck ? C.red : C.text, 700, "center", alpha);
    D.text(ctx, "neck 16 mm · about the same amount · simplified grain model", 540, 1800, 28, C.dim, 600); }
  const s1 = (ctx, t) => { const seg = L1.find((x) => t < x[2]) || L1[L1.length - 1]; vert(ctx, seg[0], Math.max(0, t - seg[1] - .2) / seg[3], D.fade(t, seg[1], seg[2], .2), ["Same hourglass,", "smaller balls."], seg[3]); };
  const s2 = (ctx, t) => vert(ctx, 3000, Math.max(0, t - .5) / S2V, 1, ["3,000 balls.", "Wait for the last one."], S2V);
  const timelines = [
    { id: "full", name: "25 Hourglass (long)", file: "Command Loom - 25 Hourglass.mp4", W: 1920, H: 1080, dur: 70, draw: drawFull, events: fullEvents, voice: "wood" },
    { id: "s1", name: "Short 1 · Smaller Balls", file: "Command Loom - Short 1 - Smaller Balls.mp4", W: VW, H: VH, dur: 31, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * t / 31), voice: "wood",
      events: () => L1.flatMap(([N, a, b, v]) => [{ t: a + .1, k: 12, voice: "wood", gain: .6 }, ...notes(N, a + .2, 0, (b - a - .25) / v, 0, 1, v), ...(N <= 100 ? [{ t: a + 1, k: 2, voice: "bell", gain: .55 }, { t: a + 1, k: 3, voice: "wood", gain: .7 }, { t: a + 1.8, k: 6, voice: "bell", gain: .35 }] : [])]).filter((e) => e.t < 30.4) },
    { id: "s2", name: "Short 2 · The Last Ball", file: "Command Loom - Short 2 - The Last Ball.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "wood",
      events: () => [...notes(3000, .5, 0, 28.8 / S2V, 0, 1, S2V), ...[8, 12].map((k) => ({ t: .5 + tEmpty(3000) * S2V + .1, k, voice: "bell", gain: .6 }))].filter((e) => e.t < 29.4) }
  ];
  const isNode = typeof window === "undefined" || !root.fetch || typeof document === "undefined";
  async function loadAll(read) { for (const N of COUNTS) data[N] = parse(await read(`data/hourglass_${N}.bin`)); }
  const ready = isNode ? null : loadAll(async (p) => (await fetch(p)).arrayBuffer());
  // in Node (tests, audio tools): loadNode(read) with read(path) → ArrayBuffer
  const loadNode = (read) => loadAll(async (p) => read(p));
  root.CLVideo = { title: "Command Loom · 25 Hourglass", timelines, ready, loadNode };
  root.HourglassVideo = { S, SLOW, REL, JAM, NECK, S2V, COUNTS, data, parse, loadAll, timelines, tEmpty, tStill, atTime };
})(typeof window !== "undefined" ? window : globalThis);
