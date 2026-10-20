// 08 Turing Patterns: one dot grows and splits until the screen is full of spots, then the same two rules grow stripes, a maze
// and holes, each from one dot, full screen (rd.js). Every frame is the simulation; nothing is painted. Every note is the pattern growing.
(function (root) {
  "use strict";
  const RD = root.RD, D = root.CLDraw, FPS = 30;
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  // [feed, kill, name, colour stops for V from 0 to 0.4]
  const P = {
    spots:   [.0367, .0649, "spots that split", [[0, [10, 6, 30]], [.14, [120, 20, 110]], [.24, [255, 80, 120]], [.32, [255, 170, 60]], [.40, [255, 245, 200]]]],
    stripes: [.029, .057, "stripes", [[0, [4, 10, 22]], [.12, [20, 80, 120]], [.22, [60, 200, 230]], [.32, [220, 250, 255]], [.40, [255, 255, 255]]]],
    maze:    [.0545, .062, "a maze", [[0, [14, 4, 28]], [.12, [80, 20, 140]], [.22, [180, 60, 255]], [.30, [120, 220, 255]], [.40, [240, 255, 255]]]],
    holes:   [.039, .058, "rings", [[0, [4, 18, 10]], [.14, [20, 90, 40]], [.24, [110, 220, 60]], [.32, [230, 255, 90]], [.40, [255, 255, 220]]]]
  };
  const LUTS = {};
  for (const [key, [, , , stops]] of Object.entries(P)) { const L = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) { const v = i / 255 * .4; let j = 0; while (j < stops.length - 2 && v > stops[j + 1][0]) j++; const [a, ca] = stops[j], [b, cb] = stops[j + 1], u = D.clamp((v - a) / (b - a));
      for (let c = 0; c < 3; c++) L[i * 3 + c] = Math.round(ca[c] + (cb[c] - ca[c]) * u); }
    LUTS[key] = L; }
  const GW = 320, GH = 180, VW = 180, VH = 320;
  // a runner keeps one simulation and steps it to whatever step count a frame needs (restarts if asked to go back)
  function runner(make) { let sim = null; return (steps) => { if (!sim || sim.steps > steps) sim = make(); sim.step(steps - sim.steps); return sim; }; }
  const make = (key, W, H, seed) => () => new RD.Sim(W, H, P[key][0], P[key][1], seed, 4);
  const cvs = {};
  function paint(ctx, sim, key, x, y, w, h) {
    const W = sim.W, H = sim.H, id = key + W + "x" + H, c = cvs[id] || (cvs[id] = document.createElement("canvas")); c.width = W; c.height = H;
    const g = c.getContext("2d"), img = g.createImageData(W, H), px = img.data, V = sim.V, L = LUTS[key];
    for (let i = 0; i < W * H; i++) { const q = Math.min(255, Math.max(0, Math.round(V[i] / .4 * 255))) * 3; px[i * 4] = L[q]; px[i * 4 + 1] = L[q + 1]; px[i * 4 + 2] = L[q + 2]; px[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(c, x, y, w, h); ctx.restore();
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  // scene: [id, start, end, pattern, steps per frame]
  const S = [["hook", 0, 4, "spots", 0], ["spots", 4, 37, "spots", 23], ["stripes", 37, 51.5, "stripes", 13], ["maze", 51.5, 69, "maze", 26], ["holes", 69, 84, "holes", 12], ["all", 84, 100, null, 0]]
    .map(([id, t0, t1, key, rate]) => ({ id, t0, t1, key, rate }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const RUN = Object.fromEntries(Object.keys(P).map((k, i) => [k, runner(make(k, GW, GH, 3 + i))]));
  const QUAD = Object.fromEntries(Object.keys(P).map((k, i) => [k, runner(make(k, GW, GH, 21 + i))]));
  const steps = (sc, t) => Math.max(0, Math.round((t - sc.t0 - .3) * FPS)) * sc.rate;
  const SPOTS_END = Math.round((S[1].t1 - S[1].t0 - .3) * FPS) * S[1].rate;
  const QUAD_RATE = { spots: 40, stripes: 9, maze: 18, holes: 9 };
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const sim = RUN.spots(SPOTS_END); paint(ctx, sim, "spots", 0, 0, W, H); D.topShade(ctx, W, 220);
      D.text(ctx, "It starts as one dot.", W / 2, 90, 72, C.text, 700); D.text(ctx, sim.blobs() + " spots", 1840, 1020, 54, C.amber, 700, "right"); return; }
    if (sc.id === "all") {
      Object.keys(P).forEach((k, i) => { const x = (i % 2) * W / 2, y = Math.floor(i / 2) * H / 2, sim = QUAD[k](Math.max(0, Math.round(u * FPS)) * QUAD_RATE[k]);
        paint(ctx, sim, k, x, y, W / 2, H / 2); D.text(ctx, P[k][2], x + W / 4, y + H / 2 - 40, 38, C.text, 700, "center", f); });
      ctx.fillStyle = C.bg; ctx.fillRect(W / 2 - 3, 0, 6, H); ctx.fillRect(0, H / 2 - 3, W, 6);
      D.text(ctx, "Same two rules. Four patterns.", W / 2, 70, 56, C.text, 700, "center", D.fade(u, 0, 14)); return; }
    const sim = RUN[sc.key](steps(sc, t)); paint(ctx, sim, sc.key, 0, 0, W, H);
    if (sc.id === "spots") { const n = sim.blobs(); D.text(ctx, n.toLocaleString("en-US"), 1840, 120, 110, C.amber, 700, "right"); D.text(ctx, n === 1 ? "spot" : "spots", 1840, 200, 40, C.text, 600, "right");
      D.text(ctx, "One dot. It grows, stretches and splits.", W / 2, 80, 56, C.text, 700, "center", D.clamp(1 - Math.max(0, u - 6) / .8)); }
    else D.text(ctx, "Change two numbers: " + P[sc.key][2] + ".", W / 2, 80, 56, C.text, 700, "center", D.clamp(1 - Math.max(0, u - 5) / .8) * f);
    D.text(ctx, "Gray–Scott reaction–diffusion · feed " + P[sc.key][0] + " · kill " + P[sc.key][1] + " · computed, not painted", W / 2, 1052, 22, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: notes from the growth itself ----------
  // a note each time the number of spots goes up, and a note each time the pattern reaches another 0.5% of the screen
  // (0.15% for the spots), pitch rising as it fills. At most 8 notes a second.
  function growthNotes(key, W, H, seed, rate, t0, frames, side = 0, gain = 1, perSec = 8) {
    const sim = make(key, W, H, seed)(), ev = []; let lastN = sim.blobs(), lastR = 0, lastT = -1;
    for (let fr = 1; fr <= frames; fr++) { sim.step(rate); const t = t0 + fr / FPS;
      const n = key === "spots" ? sim.blobs() : 0, r = sim.reach();
      if (key === "spots" && n > lastN && t - lastT >= 1 / perSec) { ev.push({ t, k: Math.min(15, Math.round(15 * Math.log(n) / Math.log(180))), side, gain: gain * .6 }); lastT = t; lastR = r; }
      else if (r - lastR >= (key === "spots" ? .0015 : .005) && t - lastT >= 1 / perSec) { ev.push({ t, k: Math.min(15, Math.round(r * 16)), side, gain: gain * .45, voice: key === "spots" ? "marimba" : undefined }); lastT = t; lastR = r; }
      lastN = n;
    }
    return ev; }
  function fullEvents() {
    const ev = [{ t: .3, k: 5, gain: .6 }, { t: 1.8, k: 9, gain: .5 }, { t: 3.2, k: 12, gain: .5 }];
    S.slice(1, 6).forEach((sc, i) => ev.push({ t: sc.t0 + .15, k: 3 + 3 * i, gain: .7, voice: "bell" }));   // a bell as each new dot is placed
    S.slice(1, 5).forEach((sc) => ev.push(...growthNotes(sc.key, GW, GH, 3 + Object.keys(P).indexOf(sc.key), sc.rate, sc.t0 + .3, Math.round((sc.t1 - sc.t0 - .5) * FPS))));
    Object.keys(P).forEach((k, i) => ev.push(...growthNotes(k, GW, GH, 21 + i, QUAD_RATE[k], S[5].t0, Math.round(15.3 * FPS), (i % 2 ? .5 : -.5), .6, 3)));
    return ev; }

  // ---------- Shorts ----------
  const S1_RATE = 26, S1_0 = 1;
  const s1Run = runner(make("spots", VW, VH, 5));
  function s1(ctx, t) { const sim = s1Run(Math.max(0, Math.round((t - S1_0) * FPS)) * S1_RATE); paint(ctx, sim, "spots", 0, 0, 1080, 1920); D.topShade(ctx, 1080, 420);
    const n = sim.blobs(); D.lines(ctx, ["One dot."], 540, 170, 96, C.text, 1); D.text(ctx, n + (n === 1 ? " spot" : " spots"), 540, 300, 64, C.amber, 700);
    D.text(ctx, "Gray–Scott reaction–diffusion · computed", 540, 1860, 28, C.dim, 600); }
  const S2 = [["stripes", 0, 7.5, 14], ["maze", 7.5, 15, 34], ["holes", 15, 22.5, 14], ["spots", 22.5, 30, 60]];
  const s2Run = Object.fromEntries(S2.map(([k], i) => [k, runner(make(k, VW, VH, 31 + i))]));
  function s2(ctx, t) { const sg = S2.find((x) => t < x[2]) || S2[3], [k, a, b, rate] = sg, sim = s2Run[k](Math.max(0, Math.round((t - a) * FPS)) * rate); paint(ctx, sim, k, 0, 0, 1080, 1920);
    D.topShade(ctx, 1080, 420); D.lines(ctx, ["Same two rules."], 540, 170, 84, C.text, 1); D.text(ctx, P[k][2], 540, 290, 70, C.amber, 700, "center", D.fade(t, a, b, .2));
    D.text(ctx, "Gray–Scott reaction–diffusion · only two numbers change", 540, 1860, 28, C.dim, 600); }
  const timelines = [
    { id: "full", name: "08 Turing Patterns (long)", file: "Command Loom - 08 Turing Patterns.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Spots that split", file: "Command Loom - Short 1 - Spots That Split.mp4", W: 1080, H: 1920, dur: 32, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .03 * t / 32), voice: "glass",
      events: () => [{ t: .3, k: 6, gain: .6 }, ...growthNotes("spots", VW, VH, 5, S1_RATE, S1_0, Math.round((32 - S1_0 - .7) * FPS))] },
    { id: "s2", name: "Short 2 · Same rules, four patterns", file: "Command Loom - Short 2 - Same Rules Four Patterns.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .03 * (t % 7.5) / 7.5), voice: "glass",
      events: () => S2.flatMap(([k, a, b, rate], i) => growthNotes(k, VW, VH, 31 + i, rate, a, Math.round((b - a - .3) * FPS))).filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 08 Turing Patterns", timelines };
  root.TuringVideo = { S, P, GW, GH, RUN, SPOTS_END, make, growthNotes, timelines };
})(typeof window !== "undefined" ? window : globalThis);
