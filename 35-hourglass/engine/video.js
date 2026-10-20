// 35 Hourglass: the same hourglass with a 1.6 cm neck, filled with 1, 10, 100, 1,000 and 3,000 balls of the same total amount
// (hourglass.js). The simulations (grains.js) were run once by precompute.js; this page plays back the recorded frames.
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
    // balls below the neck at each frame, and the first frame each ball passed
    const passed = new Int32Array(frames); for (let f = 0; f < frames; f++) { const o = f * N * 2; let c = 0; for (let i = 0; i < N; i++) if (B[2] + q[o + 2 * i + 1] / 65535 * (B[3] - B[2]) < 0) c++; passed[f] = c; }
    const y0 = new Float32Array(N); { const o = 0; for (let i = 0; i < N; i++) y0[i] = B[2] + q[o + 2 * i + 1] / 65535 * (B[3] - B[2]); }
    return { N, frames, r, at, passed, y0, box: B };
  }
  const frameOf = (t) => Math.floor(t * FPS + 1e-6);
  const hsl = (h, l) => `hsl(${Math.round(((h % 1) + 1) % 1 * 360)},80%,${l}%)`;
  function glass(ctx, cx, cy, s, k) {
    ctx.save(); ctx.beginPath(); const P = H.PROFILE;
    const pts = [...P.map(([x, y]) => [x, y]), ...P.slice().reverse().map(([x, y]) => [-x, y]), ...P.map(([x, y]) => [-x, -y]), ...P.slice().reverse().map(([x, y]) => [x, -y])];
    pts.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s)); ctx.closePath();
    ctx.fillStyle = "rgba(120,160,220,.07)"; ctx.fill(); ctx.strokeStyle = C.glass; ctx.lineWidth = 3.5 * k; ctx.shadowColor = "rgba(140,190,255,.7)"; ctx.shadowBlur = 12 * k; ctx.stroke(); ctx.restore();
  }
  function hourglass(ctx, N, t, cx, cy, s, k) {
    const Dt = data[N], f = frameOf(t), p = Dt.at(f);
    glass(ctx, cx, cy, s, k);
    for (let i = 0; i < Dt.N; i++) {                          // colour from the starting height: layers, like coloured sand
      const hue = .02 + .75 * (Dt.y0[i] / .17), x = cx + p[2 * i] * s, y = cy - p[2 * i + 1] * s, rr = Math.max(1.2, Dt.r[i] * s);
      ctx.fillStyle = hsl(hue, 58); ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
      if (rr > 6) { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(x - rr * .3, y - rr * .3, rr * .35, 0, 7); ctx.fill(); }
    }
    return { passed: Dt.passed[Math.min(Dt.frames - 1, f)], N: Dt.N };
  }
  function zoomWrap(inner, W, H2, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H2); ctx.save(); ctx.translate(W / 2, H2 / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H2 / 2); inner(ctx, t); ctx.restore(); }; }
  const fmt = (n) => n.toLocaleString("en-US"), mm = (N) => (data[N].r.reduce((a, b) => a + b, 0) / data[N].N * 2000).toFixed(N === 1 ? 0 : 1);
  const tEmpty = (N) => { const Dt = data[N]; for (let f = 0; f < Dt.frames; f++) if (Dt.passed[f] === Dt.N) return f / FPS; return null; };
  const status = (st) => st.passed === st.N ? "all through" : `${fmt(st.passed)} / ${fmt(st.N)} through`;

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["1", 4, 12], ["10", 12, 22], ["100", 22, 34], ["1000", 34, 50], ["3000", 50, 70], ["all", 70, 96]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const SLOW = { hook: 4, 1: 1, 10: 1, 100: 1, 1000: 2, 3000: 4, all: 4 }, slowLabel = (v) => v === 1 ? "real time" : `${v}× slower`;
  const SCALE = 2500, foot = "neck 1.6 cm · about the same total amount every time · simplified grain model: hard balls, friction, no spin";
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const st = hourglass(ctx, 3000, 1.2 + u / 4, 960, 560, SCALE, 1);
      D.text(ctx, "1 ball… or 3,000?", W / 2, 70, 62, C.text, 700); D.text(ctx, status(st), 1560, 560, 50, C.amber, 700); D.speed(ctx, slowLabel(4), W); return; }
    if (sc.id === "all") {
      COUNTS.forEach((N, j) => { const cx = 210 + 375 * j, st = hourglass(ctx, N, u / SLOW.all, cx, 560, 1150, .6);
        D.text(ctx, fmt(N), cx, 820, 46, C.text, 700, "center", f); D.text(ctx, status(st), cx, 870, 26, st.passed === st.N ? C.green : C.amber, 600, "center", f); });
      D.text(ctx, "All five, released together.", W / 2, 80, 60, C.text, 700, "center", f); D.speed(ctx, slowLabel(SLOW.all), W); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    const N = Number(sc.id), v = SLOW[N], st = hourglass(ctx, N, u / v, 960, 560, SCALE, 1); D.speed(ctx, slowLabel(v), W);
    D.text(ctx, `${fmt(N)} ball${N > 1 ? "s" : ""}`, 380, 420, 96, C.text, 700, "center", f); D.text(ctx, `each about ${mm(N)} mm wide`, 380, 510, 38, C.amber, 600, "center", f);
    D.text(ctx, "the neck: 16 mm", 380, 570, 34, C.dim, 600, "center", f);
    D.text(ctx, status(st), 1540, 470, 52, st.passed === st.N ? C.green : C.amber, 700, "center", f); D.text(ctx, `${(u / v).toFixed(1)} s after release`, 1540, 550, 36, C.text, 600, "center", f);
    D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: a soft wooden tick each time a ball passes the neck (at most 3 per frame); pitch from its starting height ----------
  function notes(N, t0, a, b, side = 0, gain = 1, slow = 1) {
    const Dt = data[N], ev = [], seen = new Map(), crossed = new Uint8Array(Dt.N); let prev = Dt.at(frameOf(a)).slice();
    for (let f = frameOf(a) + 1; f < Math.min(Dt.frames, frameOf(b)); f++) { const p = Dt.at(f);
      for (let i = 0; i < Dt.N; i++) if (!crossed[i] && prev[2 * i + 1] >= 0 && p[2 * i + 1] < 0) { crossed[i] = 1; const tv = t0 + (f / FPS - a) * slow, fr = Math.floor(tv * FPS), c = seen.get(fr) || 0; if (c >= 3) continue; seen.set(fr, c + 1);
        ev.push({ t: tv, k: Math.round(Dt.y0[i] / .17 * 15), side, gain: gain * (N <= 10 ? 1 : .7) }); }
      prev = p.slice(); }
    return ev; }
  function fullEvents() { const ev = [...notes(3000, 0, 1.2, 1.2 + 3.9 / 4, 0, 1, 4)]; for (const sc of S.slice(1, 6)) { const v = SLOW[sc.id]; ev.push(...notes(Number(sc.id), sc.t0, 0, (sc.t1 - sc.t0 - .1) / v, 0, 1, v)); }
    COUNTS.forEach((N, j) => ev.push(...notes(N, 70, 0, 25.4 / SLOW.all, (j - 2) * .4, .6, SLOW.all))); return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, L1 = [[1, 0, 3, 1], [10, 3, 7, 1], [100, 7, 13, 1], [1000, 13, 21, 2], [3000, 21, 31, 4]], S2V = 7.5;
  function vert(ctx, N, u, alpha, title, v) { const st = hourglass(ctx, N, u / v, 540, 1060, 3600, 1.2); D.text(ctx, slowLabel(v), 540, 1640, 40, C.amber, 600, "center", alpha);
    D.lines(ctx, title, 540, 140, 72, C.text, 1); D.text(ctx, `${fmt(N)} ball${N > 1 ? "s" : ""}`, 540, 330, 96, C.amber, 700, "center", alpha);
    D.text(ctx, status(st), 540, 1720, 52, st.passed === st.N ? C.green : C.text, 700, "center", alpha);
    D.text(ctx, "neck 16 mm · about the same amount · simplified grain model", 540, 1800, 28, C.dim, 600); }
  const s1 = (ctx, t) => { const seg = L1.find((x) => t < x[2]) || L1[L1.length - 1]; vert(ctx, seg[0], t - seg[1], D.fade(t, seg[1], seg[2], .2), ["Same hourglass,", "smaller balls."], seg[3]); };
  const s2 = (ctx, t) => vert(ctx, 3000, Math.max(0, t - .5), 1, ["3,000 balls.", "Wait for the last one."], S2V);
  const timelines = [
    { id: "full", name: "35 Hourglass (long)", file: "Command Loom - 35 Hourglass.mp4", W: 1920, H: 1080, dur: 96, draw: drawFull, events: fullEvents, voice: "wood" },
    { id: "s1", name: "Short 1 · Smaller Balls", file: "Command Loom - Short 1 - Smaller Balls.mp4", W: VW, H: VH, dur: 31, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * t / 31), voice: "wood",
      events: () => L1.flatMap(([N, a, b, v]) => notes(N, a, 0, (b - a - .05) / v, 0, 1, v)).filter((e) => e.t < 30.4) },
    { id: "s2", name: "Short 2 · The Last Ball", file: "Command Loom - Short 2 - The Last Ball.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "wood", events: () => notes(3000, .5, 0, 28.8 / S2V, 0, 1, S2V) }
  ];
  const isNode = typeof window === "undefined" || !root.fetch || typeof document === "undefined";
  async function loadAll(read) { for (const N of COUNTS) data[N] = parse(await read(`data/hourglass_${N}.bin`)); }
  const ready = isNode ? null : loadAll(async (p) => (await fetch(p)).arrayBuffer());
  // in Node (tests, audio tools): loadNode(read) with read(path) → ArrayBuffer
  const loadNode = (read) => loadAll(async (p) => read(p));
  root.CLVideo = { title: "Command Loom · 35 Hourglass", timelines, ready, loadNode };
  root.HourglassVideo = { S, SLOW, S2V, COUNTS, data, parse, loadAll, timelines, tEmpty, frameOf };
})(typeof window !== "undefined" ? window : globalThis);
