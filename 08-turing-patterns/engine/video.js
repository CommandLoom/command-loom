// 08 Turing Patterns: every frame is the Gray–Scott simulation (rd.js) at that step; nothing is painted.
(function (root) {
  "use strict";
  const RD = root.RD, D = root.CLDraw;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0" };
  // colour map for V (0 … 0.4): night blue → teal → amber → cream
  const STOPS = [[0, [8, 12, 24]], [.12, [18, 70, 96]], [.22, [53, 196, 240]], [.30, [255, 189, 56]], [.40, [255, 246, 222]]];
  const LUT = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) { const v = i / 255 * .4; let j = 0; while (j < STOPS.length - 2 && v > STOPS[j + 1][0]) j++; const [a, ca] = STOPS[j], [b, cb] = STOPS[j + 1], u = D.clamp((v - a) / (b - a));
    for (let c = 0; c < 3; c++) LUT[i * 3 + c] = Math.round(ca[c] + (cb[c] - ca[c]) * u); }
  const PATTERNS = { spots: [.0367, .0649, "spots that split"], stripes: [.029, .057, "stripes"], maze: [.0545, .062, "labyrinth"], holes: [.039, .058, "holes"] };
  // a runner keeps one simulation and steps it to whatever step count a frame needs (restarts if asked to go back)
  function runner(make) { let sim = null; return (steps) => { if (!sim || sim.steps > steps) sim = make(); sim.step(steps - sim.steps); return sim; }; }
  const cvs = {};
  function paint(ctx, sim, x, y, size, key, alpha = 1) {
    const n = sim.n, c = cvs[key + n] || (cvs[key + n] = document.createElement("canvas")); c.width = n; c.height = n;
    const g = c.getContext("2d"), img = g.createImageData(n, n), px = img.data, V = sim.V;
    for (let i = 0; i < n * n; i++) { const q = Math.min(255, Math.max(0, Math.round(V[i] / .4 * 255))) * 3; px[i * 4] = LUT[q]; px[i * 4 + 1] = LUT[q + 1]; px[i * 4 + 2] = LUT[q + 2]; px[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(c, x, y, size, size); ctx.restore();
    ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2; ctx.strokeRect(x, y, size, size);
  }
  const FPS = 30;

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["rules", 4, 18], ["grow", 18, 54], ["four", 54, 82], ["turing", 82, 96], ["close", 96, 104]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const GROW_N = 192, GROW_RATE = 13, PANEL_N = 128, PANEL_RATE = 12;
  const growAt = runner(() => new RD.Sim(GROW_N, PATTERNS.spots[0], PATTERNS.spots[1], 3, .06));
  const panelRun = Object.fromEntries(Object.entries(PATTERNS).map(([key, [F, k]], i) => [key, runner(() => new RD.Sim(PANEL_N, F, k, 11 + i, .1))]));
  const growSteps = (t) => Math.max(0, Math.round((t - S[2].t0) * FPS) * GROW_RATE);
  const panelSteps = (t) => Math.max(0, Math.round((t - S[3].t0) * FPS) * PANEL_RATE);
  const PANEL_END = Math.round((S[3].t1 - S[3].t0) * FPS) * PANEL_RATE;
  function fourPanels(ctx, t, x0, y0, size, gap, cols, k = 1, steps) {
    Object.entries(PATTERNS).forEach(([key, [F, kk, name]], i) => { const x = x0 + (i % cols) * (size + gap), y = y0 + Math.floor(i / cols) * (size + gap);
      paint(ctx, panelRun[key](steps), x, y, size, "p" + key);
      D.text(ctx, name, x + size / 2, y + size + 30 * k, 32 * k, C.text, 700); D.text(ctx, "feed " + F + " · kill " + kk, x + size / 2, y + size + 64 * k, 22 * k, C.dim, 600); });
  }
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const big = 860, bx = 120, by = 150;
    if (sc.id === "hook") {
      const z = 1 + .04 * u / 4, s = 940 * z; paint(ctx, panelRun.maze(PANEL_END), 960 - s / 2, 560 - s / 2, s, "hook");
      D.topShade(ctx, W, 260); D.text(ctx, "Two chemicals. No blueprint.", W / 2, 80, 64, C.text, 700); D.text(ctx, "Later in this video · Gray–Scott simulation", W / 2, 142, 30, C.amber, 600); return;
    }
    if (sc.id === "rules" || sc.id === "grow") {
      const sim = growAt(sc.id === "rules" ? 0 : growSteps(t)); paint(ctx, sim, bx, by, big, "grow");
      const tx = 1100;
      if (sc.id === "rules") {
        const L = [["U is fed in everywhere.", C.cyan], ["V turns U into more V:  U + 2V → 3V", C.amber], ["V slowly breaks down.", C.text], ["Both spread out. U spreads twice as fast.", C.text]];
        D.text(ctx, "The rules", tx, 210, 56, C.text, 700, "left", f);
        L.forEach(([s, c], i) => D.text(ctx, s, tx, 320 + i * 90, 36, c, 600, "left", D.clamp((u - .8 - i * 2.4) / .5) * f));
        D.text(ctx, "Start: a small square of V in a sea of U", tx, 760, 28, C.dim, 600, "left", D.clamp((u - 10.5) / .5) * f);
        D.text(ctx, "That's all. Press play.", tx, 860, 44, C.text, 700, "left", D.clamp((u - 12) / .5) * f); return;
      }
      const n = sim.blobs(); D.text(ctx, n.toLocaleString("en-US"), tx, 360, 120, C.amber, 700, "left"); D.text(ctx, "separate spots", tx, 450, 34, C.dim, 600, "left");
      D.text(ctx, sim.steps.toLocaleString("en-US") + " time steps", tx, 560, 44, C.text, 700, "left"); D.text(ctx, GROW_RATE + " steps per frame", tx, 610, 26, C.dim, 600, "left");
      D.lines(ctx, [u < 12 ? "The square breaks up into spots…" : u < 26 ? "Each spot grows, stretches and splits." : "…until the whole dish is spotted."], W / 2, 70, 52, C.text, f);
      D.text(ctx, "Gray–Scott model · feed " + PATTERNS.spots[0] + " · kill " + PATTERNS.spots[1], bx + big / 2, by + big + 34, 24, C.dim, 600, "center", f); return;
    }
    if (sc.id === "four") {
      const z = 1 + .07 * u / (sc.t1 - sc.t0); ctx.save(); ctx.translate(960, 470); ctx.scale(z, z); ctx.translate(-960, -470);
      fourPanels(ctx, t, 150, 290, 360, 60, 4, 1, panelSteps(t)); ctx.restore();
      D.lines(ctx, ["Same two rules. Change only how fast U is fed", "and V is removed, and the pattern changes."], W / 2, 70, 48, C.text, f);
      D.text(ctx, panelSteps(t).toLocaleString("en-US") + " time steps", W / 2, 1010, 30, C.dim, 600, "center", f); return;
    }
    if (sc.id === "turing" || sc.id === "close") {
      const steps = PANEL_END + Math.round((t - S[4].t0) * FPS) * 2, key = sc.id === "turing" ? "stripes" : "spots", sim = sc.id === "turing" ? panelRun.stripes(steps) : growAt(growSteps(S[2].t1) + Math.round(u * FPS) * 4);
      const z = 1.05 + .08 * u / (sc.t1 - sc.t0), s = 1080 * z; paint(ctx, sim, 960 - s / 2, 540 - s / 2, s, "end" + key);
      D.topShade(ctx, W, 300);
      if (sc.id === "turing") { D.lines(ctx, ["In 1952 Alan Turing proposed that chemicals", "which react and spread could make spots and stripes."], W / 2, 70, 48, C.text, D.clamp(u / .6) * f);
        D.text(ctx, "In 1990 a real lab reaction showed it (the CIMA reaction).", W / 2, 1030, 34, C.amber, 600, "center", D.clamp((u - 6) / .6) * f); return; }
      D.text(ctx, "Two chemicals. Two rules. No blueprint.", W / 2, 80, 60, C.text, 700, "center", f);
      D.text(ctx, "Gray & Scott (1984) · Pearson (1993) · Turing (1952) · computed, not painted", W / 2, 1040, 24, C.dim, 500, "center", f);
    }
  }
  // sound: one note each time the number of spots in the growing dish goes up (higher as the count grows)
  function spotNotes(make, rate, offset, frames, maxPerSec = 8) {
    const sim = make(), ev = []; let last = sim.blobs(), lastT = -1;
    for (let fr = 1; fr <= frames; fr++) { sim.step(rate); const n = sim.blobs(); if (n > last) { const t = offset + fr / FPS; if (t - lastT >= 1 / maxPerSec) { ev.push({ t, k: Math.min(15, Math.round(15 * Math.log(n) / Math.log(120))), gain: .55 }); lastT = t; } } last = n; }
    return ev;
  }
  const growMake = () => new RD.Sim(GROW_N, PATTERNS.spots[0], PATTERNS.spots[1], 3, .06);
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 5 }, { t: .3, k: 9 },
      ...[0, 1, 2, 3].map((i) => ({ t: s.rules.t0 + .8 + i * 2.4, k: 4 + i * 3, gain: .6 })), { t: s.rules.t0 + 12, k: 12, gain: .6 },
      ...spotNotes(growMake, GROW_RATE, s.grow.t0, Math.round((s.grow.t1 - s.grow.t0) * FPS) - 1),
      ...[0, 1, 2, 3].map((i) => ({ t: s.four.t0 + .4 + i * .35, k: 3 + i * 3, gain: .6 })),
      { t: s.turing.t0 + .3, k: 4 }, { t: s.turing.t0 + 6, k: 10 }, { t: s.close.t0 + .3, k: 6 }];
  }

  // ---------- Shorts ----------
  const S1_N = 160, S1_RATE = 14, S1_0 = 2.5;
  const s1Make = () => new RD.Sim(S1_N, PATTERNS.spots[0], PATTERNS.spots[1], 5, .06), s1At = runner(s1Make);
  const s1Steps = (t) => Math.max(0, Math.round((t - S1_0) * FPS) * S1_RATE);
  function drawS1(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const sim = s1At(s1Steps(t)); paint(ctx, sim, 40, 420, 1000, "s1");
    D.lines(ctx, t < 16 ? ["One square.", "Two chemicals."] : ["Spots that grow", "and split."], 540, 170, 76, C.text, 1);
    D.text(ctx, sim.blobs() + " spots", 540, 1530, 80, C.amber, 700); D.text(ctx, sim.steps.toLocaleString("en-US") + " time steps · Gray–Scott model", 540, 1610, 30, C.dim, 600);
  }
  const S2_RATE = 16, s2Steps = (t) => Math.max(0, Math.round((t - 1.5) * FPS) * S2_RATE);
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920);
    const z = 1 + .06 * t / 30; ctx.save(); ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
    fourPanels(ctx, t, 70, 420, 440, 120, 2, 1.1, s2Steps(t)); ctx.restore();
    D.lines(ctx, ["Same two rules.", "Four patterns."], 540, 170, 78, C.text, 1);
    D.text(ctx, "only feed and kill rates change", 540, 345, 34, C.amber, 600);
  }
  const timelines = [
    { id: "full", name: "08 Turing Patterns (long)", file: "Command Loom - 08 Turing Patterns.mp4", W: 1920, H: 1080, dur: 104, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Spots that split", file: "Command Loom - Short 1 - Spots That Split.mp4", W: 1080, H: 1920, dur: 32, draw: drawS1, voice: "glass",
      events: () => [{ t: .3, k: 6 }, ...spotNotes(s1Make, S1_RATE, S1_0, Math.round((32 - S1_0 - .7) * FPS))] },
    { id: "s2", name: "Short 2 · Same rules, four patterns", file: "Command Loom - Short 2 - Same Rules Four Patterns.mp4", W: 1080, H: 1920, dur: 30, draw: drawS2, voice: "glass",
      events: () => [...[0, 1, 2, 3].map((i) => ({ t: .4 + i * .35, k: 3 + i * 3, gain: .6 })), { t: 12, k: 8, gain: .5 }, { t: 22, k: 11, gain: .5 }] }
  ];
  root.CLVideo = { title: "Command Loom · 08 Turing Patterns", timelines };
  root.TuringVideo = { S, PATTERNS, GROW_N, GROW_RATE, PANEL_N, PANEL_RATE, PANEL_END, growMake, spotNotes, timelines };
})(typeof window !== "undefined" ? window : globalThis);
