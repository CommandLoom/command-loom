// 12 Predator Prey: the Wa-Tor ocean (wator.js). Every cell, count and curve is the simulation at that chronon.
(function (root) {
  "use strict";
  const WT = root.WaTor, D = root.CLDraw, FPS = 30;
  const C = { bg: "#05080D", water: [8, 16, 30], fish: [53, 196, 240], shark: [255, 189, 56], text: "#F5F3EF", dim: "#9AA6B8" };
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const GW = 160, GH = 90, P = { fishBreed: 5, sharkBreed: 10, sharkStart: 5, eatGain: 3 }, SEED = 7, CH_PER_S = 15, RUN_CH = 900;
  const make = () => new WT.Ocean(GW, GH, P, SEED);
  function runner() { let o = null; return (c) => { if (!o || o.t > c) o = make(); o.step(c - o.t); return o; }; }
  const oceanAt = runner();
  let HIST = null, PEAKS = null, SM = null;      // SM: 11-step moving averages used for the curves (shark counts wobble with the 10-step breeding rhythm)
  const smooth = (a, w = 9) => a.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - w); j <= Math.min(a.length - 1, i + w); j++) { s += a[j]; n++; } return s / n; });
  function peaks(a) { const s = smooth(a, 12), out = []; for (let i = 20; i < s.length - 20; i++) { let top = true; for (let j = i - 20; j <= i + 20; j++) if (s[j] > s[i]) { top = false; break; } if (top && (!out.length || i - out[out.length - 1] > 40)) out.push(i); } return out; }
  const ready = (async () => { const o = make(); o.step(RUN_CH); HIST = o.history; SM = HIST.map((_, i) => [0, 1].map((k) => { let s = 0, n = 0; for (let j = Math.max(0, i - 5); j <= Math.min(HIST.length - 1, i + 5); j++) { s += HIST[j][k]; n++; } return s / n; })); PEAKS = { fish: peaks(HIST.map((h) => h[0])), shark: peaks(HIST.map((h) => h[1])) }; })();
  const cvs = {};
  function ocean(ctx, o, x, y, w, h) {
    const c = cvs[w] || (cvs[w] = document.createElement("canvas")); c.width = GW; c.height = GH; const g = c.getContext("2d"), img = g.createImageData(GW, GH), px = img.data;
    for (let i = 0; i < GW * GH; i++) { const col = o.kind[i] === WT.FISH ? C.fish : o.kind[i] === WT.SHARK ? C.shark : C.water; px[i * 4] = col[0]; px[i * 4 + 1] = col[1]; px[i * 4 + 2] = col[2]; px[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, x, y, w, h); ctx.imageSmoothingEnabled = true;
    ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  }
  function chart(ctx, upto, x, y, w, h, k = 1, from = 0, span = RUN_CH) {
    const mf = Math.max(...SM.map((q) => q[0])), ms = Math.max(...SM.map((q) => q[1])), X = (c) => x + (c - from) / span * w;
    ctx.strokeStyle = "rgba(160,176,198,.4)"; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
    for (const [idx, col, mx] of [[0, C.fish, mf], [1, C.shark, ms]]) { ctx.strokeStyle = css(col); ctx.lineWidth = 3.5 * k; ctx.beginPath();
      for (let c = from; c <= Math.min(upto, from + span); c++) { const p = [X(c), y + h - SM[c][idx] / mx * h * .95]; c === from ? ctx.moveTo(...p) : ctx.lineTo(...p); } ctx.stroke(); }
    D.text(ctx, "fish", x, y - 22 * k, 26 * k, css(C.fish), 700, "left"); D.text(ctx, "sharks", x + 80 * k, y - 22 * k, 26 * k, css(C.shark), 700, "left");
    D.text(ctx, "11-step averages · each scaled to its own maximum", x + w, y + h + 26 * k, 20 * k, C.dim, 600, "right");
    return X;
  }
  // which part of the cycle we are in, from the smoothed slopes of the measured counts
  function phaseCaption(c) {
    if (c < 30) return "";
    const f = HIST.map((q) => q[0]), s = HIST.map((q) => q[1]), df = (f[Math.min(c + 8, RUN_CH)] - f[Math.max(0, c - 8)]), ds = (s[Math.min(c + 8, RUN_CH)] - s[Math.max(0, c - 8)]);
    if (df > 0 && ds <= 0) return "Few sharks: the fish multiply.";
    if (df > 0 && ds > 0) return "Plenty of food: the sharks multiply.";
    if (df <= 0 && ds > 0) return "Too many sharks: the fish crash.";
    return "No food left: the sharks starve.";
  }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["rules", 4, 18], ["run", 18, 78], ["loop", 78, 92], ["close", 92, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const runCh = (t) => D.clamp(Math.floor((t - S[2].t0) * CH_PER_S), 0, RUN_CH);
  function drawFullInner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    if (sc.id === "hook") { const c = 520 + Math.floor(u * CH_PER_S); ocean(ctx, oceanAt(c), 80, 210, 1120, 630); chart(ctx, c, 1290, 330, 560, 380);
      D.text(ctx, "Sharks, fish, and a cycle that never ends.", W / 2, 80, 60, C.text, 700); D.text(ctx, "Later in this video · Wa-Tor simulation", W / 2, 142, 30, css(C.shark), 600); return; }
    if (sc.id === "rules") {
      const o = oceanAt(Math.floor(u * 2)), z = 4; ctx.save(); ctx.beginPath(); ctx.rect(80, 210, 1120, 630); ctx.clip(); ocean(ctx, o, 80 - 1120 * (z - 1) / 2, 210 - 630 * (z - 1) / 2, 1120 * z, 630 * z); ctx.restore();
      ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.strokeRect(80, 210, 1120, 630);
      const L = [["Fish swim at random and breed every " + P.fishBreed + " steps.", css(C.fish)], ["Sharks eat a fish next to them: +" + P.eatGain + " energy.", css(C.shark)], ["Every step costs a shark 1 energy. At 0 it starves.", C.text], ["Sharks breed every " + P.sharkBreed + " steps.", C.text]];
      D.text(ctx, "The rules", 1290, 280, 52, C.text, 700, "left", f);
      L.forEach(([s, c], i) => D.lines(ctx, [s], 1290 + 270, 380 + i * 110, 30, c, D.clamp((u - .8 - i * 2.4) / .5) * f));
      D.text(ctx, "A toy ocean of " + GW + " × " + GH + " cells. Nothing else.", W / 2, 80, 54, C.text, 700, "center", f); return;
    }
    if (sc.id === "run" || sc.id === "close") {
      const c = sc.id === "run" ? runCh(t) : RUN_CH, o = oceanAt(c), [nf, ns] = HIST[c]; ocean(ctx, o, 80, 210, 1120, 630); chart(ctx, c, 1290, 330, 560, 380);
      D.text(ctx, nf.toLocaleString("en-US") + " fish", 1290, 800, 48, css(C.fish), 700, "left"); D.text(ctx, ns.toLocaleString("en-US") + " sharks", 1290, 870, 48, css(C.shark), 700, "left");
      D.text(ctx, "step " + c, 1200, 880, 30, C.dim, 600, "right");
      if (sc.id === "close") { D.text(ctx, "Nobody controls it. The cycle comes from the rules.", W / 2, 80, 56, C.text, 700, "center", f);
        D.text(ctx, "Wa-Tor (Dewdney, Scientific American, 1984) · predator–prey cycles (Lotka 1925, Volterra 1926) · simulated", W / 2, 1040, 24, C.dim, 500, "center", f); return; }
      D.text(ctx, phaseCaption(c), W / 2, 80, 56, C.text, 700, "center", f); D.speed(ctx, CH_PER_S + " STEPS PER SECOND", W); return;
    }
    if (sc.id === "loop") {
      const n = Math.round(D.clamp((u - .5) / 11) * RUN_CH), mf = Math.max(...SM.map((q) => q[0])), ms = Math.max(...SM.map((q) => q[1]));
      const x0 = 420, y0 = 200, w = 1080, h = 760, X = (v) => x0 + v / mf * w, Y = (v) => y0 + h - v / ms * h;
      ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      D.text(ctx, "fish →", x0 + w, y0 + h + 34, 28, css(C.fish), 700, "right"); D.text(ctx, "sharks ↑", x0 - 16, y0, 28, css(C.shark), 700, "right");
      ctx.lineWidth = 2.5; for (let c = 1; c <= n; c++) { ctx.strokeStyle = `rgba(245,243,239,${.15 + .75 * c / RUN_CH})`; ctx.beginPath(); ctx.moveTo(X(SM[c - 1][0]), Y(SM[c - 1][1])); ctx.lineTo(X(SM[c][0]), Y(SM[c][1])); ctx.stroke(); }
      ctx.fillStyle = css(C.shark); ctx.beginPath(); ctx.arc(X(SM[n][0]), Y(SM[n][1]), 10, 0, 7); ctx.fill();
      D.text(ctx, "Plot fish against sharks and the cycle becomes a loop.", W / 2, 80, 52, C.text, 700, "center", f);
      D.text(ctx, "every point: one step of the run above (11-step averages)", W / 2, 1040, 24, C.dim, 600, "center", f);
    }
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const drawFull = zoomWrap(drawFullInner, 1920, 1080, (t) => { const sc = sceneAt(t); return sc.id === "close" || sc.id === "loop" ? 1 + .05 * (t - sc.t0) / (sc.t1 - sc.t0) : 1; });
  // sound: a soft note at every measured population peak (fish high, sharks low), plus cues
  function peakNotes(offset, rate, from = 0, to = RUN_CH, gain = .65) {
    const ev = []; for (const c of PEAKS.fish) if (c >= from && c <= to) ev.push({ t: offset + (c - from) / rate, k: 12, gain });
    for (const c of PEAKS.shark) if (c >= from && c <= to) ev.push({ t: offset + (c - from) / rate, k: 3, gain }); return ev;
  }
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 9 }, ...[0, 1, 2, 3].map((i) => ({ t: s.rules.t0 + .8 + i * 2.4, k: [11, 4, 7, 2][i], gain: .6 })),
      ...peakNotes(s.run.t0, CH_PER_S), ...peakNotes(s.loop.t0 + .5, RUN_CH / 11, 0, RUN_CH, .4), { t: s.close.t0 + .3, k: 6 }];
  }

  // ---------- Shorts ----------
  const S1_0 = 1.5, S1_CH = 480;
  function drawS1(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const c = D.clamp(Math.floor((t - S1_0) * CH_PER_S), 0, S1_CH), o = oceanAt(c), [nf, ns] = HIST[c];
    ocean(ctx, o, 0, 380, 1080, 608);
    chart(ctx, c, 90, 1110, 900, 250, 1.1, 0, S1_CH);
    D.lines(ctx, ["Sharks eat fish.", "Then what?"], 540, 140, 76, C.text, 1);
    D.text(ctx, nf + " fish · " + ns + " sharks", 540, 1450, 50, C.text, 700); D.text(ctx, phaseCaption(c), 540, 1520, 36, C.dim, 600);
  }
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const from = 200, span = 400, upto = from + Math.round(D.clamp((t - 1.5) / 22) * span);
    const X = chart(ctx, upto, 90, 560, 900, 620, 1.2, from, span);
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(upto), 540); ctx.lineTo(X(upto), 1200); ctx.stroke();
    D.text(ctx, "step " + upto, X(upto), 520, 30, C.text, 700);
    D.lines(ctx, ["Why the sharks", "always come second."], 540, 160, 74, C.text, 1);
    const pf = PEAKS.fish.filter((c) => c > from && c < from + span), ps = PEAKS.shark.filter((c) => c > from && c < from + span);
    pf.forEach((c) => { if (upto >= c) { ctx.strokeStyle = css(C.fish, .6); ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(X(c), 560); ctx.lineTo(X(c), 1180); ctx.stroke(); ctx.setLineDash([]); } });
    ps.forEach((c) => { if (upto >= c) { ctx.strokeStyle = css(C.shark, .6); ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(X(c), 560); ctx.lineTo(X(c), 1180); ctx.stroke(); ctx.setLineDash([]); } });
    const lag = Math.round(PEAKS.lag); D.lines(ctx, ["Fish peak first. Sharks peak", "about " + lag + " steps later."], 540, 1330, 50, C.text, D.clamp((t - 18) / .6));
    D.text(ctx, "dashed lines: measured peaks · Wa-Tor simulation", 540, 1470, 30, C.dim, 600);
  }
  const timelines = [
    { id: "full", name: "12 Predator Prey (long)", file: "Command Loom - 12 Predator Prey.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Sharks eat fish. Then what?", file: "Command Loom - Short 1 - Sharks and Fish.mp4", W: 1080, H: 1920, dur: 34, draw: drawS1, voice: "marimba",
      events: () => peakNotes(S1_0, CH_PER_S, 0, S1_CH) },
    { id: "s2", name: "Short 2 · Why the sharks come second", file: "Command Loom - Short 2 - Sharks Come Second.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(drawS2, 1080, 1920, (t) => 1 + .06 * t / 30), voice: "marimba",
      events: () => peakNotes(1.5, 400 / 22, 200, 600) }
  ];
  const readyAll = ready.then(() => { const lags = []; for (const c of PEAKS.shark) { const fp = PEAKS.fish.filter((x) => x < c).pop(); if (fp != null && c - fp < 150) lags.push(c - fp); } PEAKS.lag = lags.reduce((a, b) => a + b, 0) / lags.length; PEAKS.lags = lags; });
  root.CLVideo = { title: "Command Loom · 12 Predator Prey", timelines, ready: readyAll };
  root.PredVideo = { S, P, GW, GH, SEED, RUN_CH, CH_PER_S, get HIST() { return HIST; }, get PEAKS() { return PEAKS; }, timelines, ready: readyAll, phaseCaption };
})(typeof window !== "undefined" ? window : globalThis);
