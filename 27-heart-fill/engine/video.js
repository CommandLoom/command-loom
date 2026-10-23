// 27 Heart Fill: balls of four sizes fill the same heart until no more fit (heart.js, grains.js). The simulations were run once by
// precompute.js; this page plays back the recorded frames and counts the balls and the share of the heart they cover.
(function (root) {
  "use strict";
  const H = root.Heart, D = root.CLDraw, FPS = 30;
  const C = { bg: "#0B0910", text: "#F5F3EF", dim: "#A89AB0", amber: "#FFBD38", heart: "#FF5C8A" };
  const SIZES = [50, 200, 1000, 3000], data = {};
  function parse(buf) {
    const dv = new DataView(buf), N = dv.getUint32(4, true), frames = dv.getUint32(8, true), B = [0, 1, 2, 3].map((i) => dv.getFloat32(12 + 4 * i, true));
    const r = new Float32Array(N); for (let i = 0; i < N; i++) r[i] = dv.getFloat32(28 + 4 * i, true);
    const pourFrames = dv.getUint32(28 + 4 * N, true), q = new Uint16Array(buf, 32 + 4 * N, frames * N * 2), out = new Float32Array(2 * N);
    const at = (f) => { f = Math.max(0, Math.min(frames - 1, f)); const o = f * N * 2; for (let i = 0; i < N; i++) { const a = q[o + 2 * i], b = q[o + 2 * i + 1]; if (a === 65535) { out[2 * i] = NaN; out[2 * i + 1] = NaN; } else { out[2 * i] = B[0] + a / 65534 * (B[1] - B[0]); out[2 * i + 1] = B[2] + b / 65534 * (B[3] - B[2]); } } return out; };
    const count = new Int32Array(frames), cover = new Float32Array(frames), A = H.area();
    for (let f = 0; f < frames; f++) { const o = f * N * 2; let c = 0, s = 0; for (let i = 0; i < N; i++) if (q[o + 2 * i] !== 65535) { c++; s += Math.PI * r[i] * r[i]; } count[f] = c; cover[f] = s / A; }
    return { N, frames, r, at, pourFrames, count, cover };
  }
  const frameOf = (t) => Math.floor(t * FPS + 1e-6), hsl = (h, l) => `hsl(${Math.round(((h % 1) + 1) % 1 * 360)},80%,${l}%)`;
  function heart(ctx, cx, cy, s, k) { ctx.save(); ctx.beginPath(); H.outline.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s)); ctx.closePath();
    ctx.fillStyle = "rgba(255,92,138,.06)"; ctx.fill(); ctx.strokeStyle = C.heart; ctx.lineWidth = 5 * k; ctx.shadowColor = "rgba(255,92,138,.8)"; ctx.shadowBlur = 18 * k; ctx.stroke(); ctx.restore(); }
  function scene(ctx, N, t, cx, cy, s, k) {
    const Dt = data[N], f = frameOf(t), p = Dt.at(f), n = Dt.count[Math.min(Dt.frames - 1, f)];
    heart(ctx, cx, cy, s, k);
    for (let i = 0; i < Dt.N; i++) { if (Number.isNaN(p[2 * i])) continue; const x = cx + p[2 * i] * s, y = cy - p[2 * i + 1] * s, rr = Math.max(1.2, Dt.r[i] * s);
      ctx.fillStyle = hsl(.9 - (i / (n || 1)) * .75, 58); ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); if (rr > 7) { ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.beginPath(); ctx.arc(x - rr * .3, y - rr * .3, rr * .33, 0, 7); ctx.fill(); } }
    return { n, cover: Dt.cover[Math.min(Dt.frames - 1, f)], full: f >= Dt.pourFrames - 60 };   // full from the last ball on
  }
  function zoomWrap(inner, W, H2, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H2); ctx.save(); ctx.translate(W / 2, H2 / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H2 / 2); inner(ctx, t); ctx.restore(); }; }
  const fmt = (n) => n.toLocaleString("en-US"), width = (N) => (data[N].r.reduce((a, b) => a + b, 0) / data[N].N * 2000).toFixed(1);
  const pct = (x) => (100 * x).toFixed(1) + "%";

  // ---------- long video (scene lengths come from the data: pouring time + 2 s) ----------
  let S = [], ALLSP = 2;
  function plan() { let t = 4; S = [{ id: "hook", t0: 0, t1: 4 }]; for (const N of SIZES) { const d = Math.min(data[N].frames / FPS, data[N].pourFrames / FPS + 2.5); S.push({ id: String(N), t0: t, t1: t + d }); t += d; } S.push({ id: "all", t0: t, t1: 100 }); ALLSP = Math.ceil(data[3000].frames / FPS / (100 - t - 1) * 10) / 10; }   // fast enough that all four end full
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const SCALE = 3000, foot = "heart 30 cm wide · balls appear at free spots in its upper part and fall · full = no free spot for 2 s · simplified grain model";
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const Dt = data[3000], st = scene(ctx, 3000, Dt.pourFrames / FPS - 4 + u, 960, 600, SCALE, 1); D.text(ctx, "How many balls fit in a heart?", W / 2, 70, 62, C.text, 700); D.text(ctx, fmt(st.n), 1650, 560, 110, C.amber, 700); return; }
    if (sc.id === "all") { const tt = u * ALLSP; SIZES.forEach((N, j) => { const cx = 240 + 480 * j, st = scene(ctx, N, tt, cx, 560, 1350, .5);
        D.text(ctx, `${fmt(st.n)} balls`, cx, 820, 44, st.full ? C.amber : C.text, 700, "center", f); D.text(ctx, `${width(N)} mm · ${pct(st.cover)} full`, cx, 870, 28, C.text, 600, "center", f); });
      D.text(ctx, "Smaller balls, fuller heart.", W / 2, 80, 62, C.text, 700, "center", f); D.speed(ctx, `${ALLSP}× faster`, W); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    const N = Number(sc.id), st = scene(ctx, N, u, 960, 600, SCALE, 1);
    D.text(ctx, "How many balls fit in a heart?", W / 2, 70, 60, C.text, 700, "center", f); D.text(ctx, `balls ${width(N)} mm wide`, W / 2, 140, 36, C.amber, 600, "center", f);
    D.text(ctx, fmt(st.n), 1650, 520, 120, st.full ? C.amber : C.text, 700, "center", f); D.text(ctx, st.full ? "full" : "balls so far", 1650, 610, 40, C.text, 600, "center", f);
    D.text(ctx, `${pct(st.cover)} of the heart covered`, 1650, 670, 32, C.dim, 600, "center", f); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / ((sc.t1 - sc.t0) || 1); });

  // ---------- sound: a glass tick for each new ball (at most 3 per frame), rising as the heart fills; a bell when it is full ----------
  function notes(N, t0, a, b, speed = 1, side = 0, gain = 1) { const Dt = data[N], ev = [], seen = new Map();
    for (let f = Math.max(1, frameOf(a)); f < Math.min(Dt.frames, frameOf(b)); f++) { const add = Dt.count[f] - Dt.count[f - 1]; for (let j = 0; j < Math.min(add, 3); j++) { const tv = t0 + (f / FPS - a) / speed + j * .01, q = Math.floor(tv * FPS), c = seen.get(q) || 0; if (c >= 3) continue; seen.set(q, c + 1); ev.push({ t: tv, k: Math.round(Dt.cover[f] / .85 * 15), side, gain: gain * .5 }); } }
    const tf = (Dt.pourFrames / FPS - 2 - a) / speed + t0; if (Dt.pourFrames / FPS - 2 >= a && Dt.pourFrames / FPS - 2 < b) ev.push({ t: tf, k: 10, side, gain: gain * 1.1, voice: "bell" });
    return ev; }
  function fullEvents() { const ev = [...notes(3000, 0, data[3000].pourFrames / FPS - 4, data[3000].pourFrames / FPS - .1)];
    for (const sc of S.filter((s) => SIZES.includes(Number(s.id)))) ev.push(...notes(Number(sc.id), sc.t0, 0, sc.t1 - sc.t0 - .1));
    const all = S[S.length - 1]; SIZES.forEach((N, j) => ev.push(...notes(N, all.t0, 0, (all.t1 - all.t0 - .6) * ALLSP, ALLSP, (j - 1.5) * .4, .6))); return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  function vert(ctx, N, u, title, alpha = 1) { const st = scene(ctx, N, u, 540, 1040, 3300, 1.1);
    D.lines(ctx, title, 540, 150, 76, C.text, 1); D.text(ctx, fmt(st.n), 540, 400, 130, st.full ? C.amber : C.text, 700, "center", alpha);
    D.text(ctx, `${width(N)} mm balls · ${pct(st.cover)} full`, 540, 1600, 44, C.text, 700, "center", alpha); D.text(ctx, "simplified grain model", 540, 1700, 30, C.dim, 600); }
  let S1 = [], S2SP = 1;
  function planShorts() { const segs = [[50, 7], [200, 7], [1000, 8], [3000, 8]]; let t = 0; S1 = segs.map(([N, d]) => { const s = { N, t0: t, t1: t + d, speed: data[N].pourFrames / FPS / (d - 1) }; t += d; return s; });
    S2SP = data[3000].pourFrames / FPS / 27.5; }
  const s1 = (ctx, t) => { const sg = S1.find((x) => t < x.t1) || S1[S1.length - 1]; vert(ctx, sg.N, (t - sg.t0) * sg.speed, ["How many fit?"], D.fade(t, sg.t0, sg.t1, .2)); D.speed(ctx, `${sg.speed.toFixed(1)}× faster`, VW, 1.2, 60); };
  const s2 = (ctx, t) => { vert(ctx, 3000, t * S2SP, ["Fill the heart", "with tiny balls."]); D.speed(ctx, S2SP > 1.05 ? `${S2SP.toFixed(1)}× faster` : "real time", VW, 1.2, 60); };
  const timelines = [
    { id: "full", name: "27 Heart Fill (long)", file: "Command Loom - 27 Heart Fill.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · How Many Fit", file: "Command Loom - Short 1 - How Many Fit.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => S1.flatMap((sg) => notes(sg.N, sg.t0, 0, (sg.t1 - sg.t0 - .05) * sg.speed, sg.speed)).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · Tiny Balls", file: "Command Loom - Short 2 - Tiny Balls.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => notes(3000, 0, 0, 29.4 * S2SP, S2SP) }
  ];
  async function loadAll(read) { for (const N of SIZES) data[N] = parse(await read(`data/heart_${N}.bin`)); plan(); planShorts(); }
  const isNode = typeof window === "undefined" || !root.fetch || typeof document === "undefined";
  const ready = isNode ? null : loadAll(async (p) => (await fetch(p)).arrayBuffer());
  const loadNode = (read) => loadAll(async (p) => read(p));
  root.CLVideo = { title: "Command Loom · 27 Heart Fill", timelines, ready, loadNode };
  root.HeartVideo = { SIZES, data, loadAll, timelines, get ALLSP() { return ALLSP; }, get S() { return S; }, get S1() { return S1; }, get S2SP() { return S2SP; }, frameOf };
})(typeof window !== "undefined" ? window : globalThis);
