// 11 Ink Diffusion: 5,000 simulated dye molecules doing Brownian random walks with the measured diffusion coefficient of fluorescein.
(function (root) {
  "use strict";
  const F = root.Diff, D = root.CLDraw, FPS = 30;
  const C = { bg: "#05070C", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0", dye: [80, 170, 255] };
  const fmtLen = (m) => m >= .01 ? (m * 100).toFixed(m >= .1 ? 0 : 1) + " cm" : m >= 1e-3 ? (m * 1e3).toFixed(1) + " mm" : Math.round(m * 1e6) + " µm";
  // crowd run: 0–20 s of simulated time over 32 s of video, two steps per frame
  const N = 5000, SIM_T = 20, CROWD_V = 32, DT = SIM_T / (CROWD_V * FPS) / 2;
  function runner(make) { let w = null; return (steps) => { if (!w || w.steps > steps) w = make(); w.step(steps - w.steps); return w; }; }
  const crowdMake = () => new F.Walkers(N, DT, 11), crowdAt = runner(crowdMake);
  let MSD = null;                                           // measured mean squared distance (µm²) for every crowd step
  const ready = (async () => { const w = crowdMake(); MSD = [w.msd()]; for (let s = 0; s < CROWD_V * FPS * 2; s++) { w.step(1); MSD.push(w.msd()); } })();
  const RINGS = [25, 50, 75, 100, 125, 150, 175];              // µm
  const ringTimes = () => RINGS.map((r) => { const s = MSD.findIndex((m) => Math.sqrt(m) >= r); return s < 0 ? null : s * DT; });
  function dish(ctx, w, cx, cy, size, span, k = 1, ring = true) {           // span = µm across the square
    ctx.save(); ctx.beginPath(); ctx.rect(cx - size / 2, cy - size / 2, size, size); ctx.clip();
    ctx.fillStyle = "#03050A"; ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    const s = size / span; ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(${C.dye[0]},${C.dye[1]},${C.dye[2]},.6)`;
    const d = 4 * k; for (let i = 0; i < w.N; i++) ctx.fillRect(cx + w.x[i] * s - d / 2, cy + w.y[i] * s - d / 2, d, d);
    ctx.globalCompositeOperation = "source-over";
    if (ring) { const r = Math.sqrt(w.msd()) * s; ctx.strokeStyle = C.amber; ctx.lineWidth = 3 * k; ctx.setLineDash([12 * k, 9 * k]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore(); ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2; ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    const bar = 100 * s; ctx.fillStyle = C.text; ctx.fillRect(cx + size / 2 - 30 * k - bar, cy + size / 2 - 34 * k, bar, 5 * k); D.text(ctx, "100 µm", cx + size / 2 - 30 * k - bar / 2, cy + size / 2 - 56 * k, 22 * k, C.text, 600);
  }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["one", 4, 18], ["crowd", 18, 50], ["law", 50, 68], ["scale", 68, 90], ["close", 90, 98]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const crowdSteps = (t) => D.clamp(Math.round((t - S[2].t0) * FPS * 2), 0, CROWD_V * FPS * 2);
  const ONE_DT = .01, oneMake = () => new F.Walkers(1, ONE_DT, 5, 0);
  let ONE = null; const onePath = () => { if (ONE) return ONE; const w = oneMake(), p = [[0, 0]]; for (let i = 0; i < 1300; i++) { w.step(1); p.push([w.x[0], w.y[0]]); } return ONE = p; };
  const SCALE = [[1, "1 second"], [60, "1 minute"], [3600, "1 hour"], [86400, "1 day"], [604800, "1 week"], [31557600, "1 year"]];
  function drawFullInner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    if (sc.id === "hook") { dish(ctx, crowdAt(Math.round((14 + u) * FPS * 2)), 960, 600, 860, 440);
      D.text(ctx, "Why you have to stir your tea.", W / 2, 80, 62, C.text, 700); D.text(ctx, "Later in this video · 5,000 simulated dye molecules", W / 2, 142, 30, C.amber, 600); return; }
    if (sc.id === "one") {
      const p = onePath(), n = Math.min(p.length - 1, Math.round(D.clamp((u - .8) / 12.5) * (p.length - 1))), cx = 760, cy = 590, s = 860 / 140;
      ctx.fillStyle = "#03050A"; ctx.fillRect(cx - 430, cy - 430, 860, 860); ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.strokeRect(cx - 430, cy - 430, 860, 860);
      ctx.save(); ctx.beginPath(); ctx.rect(cx - 430, cy - 430, 860, 860); ctx.clip(); ctx.strokeStyle = `rgba(${C.dye.join(",")},.85)`; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const x = cx + p[i][0] * s, y = cy + p[i][1] * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cx + p[n][0] * s, cy + p[n][1] * s, 9, 0, 7); ctx.fill(); ctx.restore();
      ctx.fillStyle = C.text; ctx.fillRect(cx + 400 - 20 * s, cy + 400, 20 * s, 5); D.text(ctx, "20 µm", cx + 400 - 10 * s, cy + 380, 22, C.text, 600);
      D.text(ctx, "One dye molecule in still water.", W / 2, 80, 58, C.text, 700, "center", f);
      D.lines(ctx, ["Water molecules hit it", "from every side, so it", "wanders at random."], 1560, 420, 40, C.text, D.clamp((u - 2) / .5) * f);
      D.text(ctx, "t = " + (n * ONE_DT).toFixed(1) + " s", 1280, 700, 48, C.amber, 700, "left"); D.text(ctx, "position every 0.01 s (the real path is even more jagged)", 1280, 760, 22, C.dim, 600, "left"); return;
    }
    if (sc.id === "crowd" || sc.id === "close") {
      const steps = sc.id === "crowd" ? crowdSteps(t) : CROWD_V * FPS * 2, w = crowdAt(steps); dish(ctx, w, 640, 590, 860, 440);
      const tt = steps * DT, rr = Math.sqrt(MSD[steps]);
      D.text(ctx, "t = " + tt.toFixed(1) + " s", 1180, 380, 72, C.text, 700, "left"); D.text(ctx, "simulated time", 1180, 440, 26, C.dim, 600, "left");
      D.text(ctx, Math.round(rr) + " µm", 1180, 560, 72, C.amber, 700, "left"); D.text(ctx, "typical distance travelled (dashed ring)", 1180, 620, 26, C.dim, 600, "left");
      D.text(ctx, "fluorescein in water · D = 4.25 × 10⁻¹⁰ m²/s", 1180, 740, 26, C.dim, 600, "left");
      if (sc.id === "close") { D.text(ctx, "Molecules never stop moving. They just don't get far.", W / 2, 80, 54, C.text, 700, "center", f);
        D.text(ctx, "Random walks with the measured diffusion coefficient of fluorescein · Einstein (1905) · simulated", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
      D.lines(ctx, [tt < 6 ? "Now a whole drop: 5,000 molecules." : "The drop spreads… slower and slower."], W / 2, 70, 54, C.text, f);
      D.speed(ctx, "SIMULATED 20 S IN 32 S", W); return;
    }
    if (sc.id === "law") {
      const x0 = 260, x1 = 1500, y0 = 230, y1 = 900, mx = MSD[MSD.length - 1] * 1.08, X = (tt) => x0 + tt / SIM_T * (x1 - x0), Y = (m) => y1 - m / mx * (y1 - y0);
      ctx.strokeStyle = "rgba(160,176,198,.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
      for (let s = 0; s <= 20; s += 5) D.text(ctx, s + " s", X(s), y1 + 30, 24, C.dim, 600);
      D.text(ctx, "average squared distance (µm²)", x0, y0 - 30, 24, C.dim, 600, "left");
      const show = D.clamp((u - .5) / 6); ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(SIM_T * show), Y(4 * F.D_FL * SIM_T * show * 1e12)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.amber; for (let s = 1; s <= 20; s++) { if (s / 20 > show) break; const m = MSD[Math.round(s / DT)]; ctx.beginPath(); ctx.arc(X(s), Y(m), 8, 0, 7); ctx.fill(); }
      D.text(ctx, "dots: measured from the 5,000 molecules · dashed: 4 D t", 1500, y1 + 80, 24, C.dim, 600, "right");
      D.lines(ctx, [u < 8 ? "The squared distance grows in a straight line." : "So distance grows like √time: 4× the time, only 2× as far."], W / 2, 80, 50, C.text, f);
      return;
    }
    if (sc.id === "scale") {
      const x0 = 520, x1 = 1700, lo = Math.log10(1e-5), hi = Math.log10(1), X = (m) => x0 + (Math.log10(m) - lo) / (hi - lo) * (x1 - x0);
      SCALE.forEach(([s, lab], i) => { const a = D.clamp((u - .6 - i * 1.4) / .5) * f, y = 230 + i * 105, m = F.rms(s);
        D.text(ctx, lab, x0 - 30, y, 36, C.text, 700, "right", a); ctx.globalAlpha = a; ctx.fillStyle = `rgba(${C.dye.join(",")},.85)`; ctx.fillRect(x0, y - 18, X(m) - x0, 36); ctx.globalAlpha = 1;
        D.text(ctx, fmtLen(m), X(m) + 18, y, 36, C.amber, 700, "left", a); });
      D.text(ctx, "typical distance a dye molecule spreads (log scale)", W / 2, 900, 26, C.dim, 600, "center", f);
      const days = F.timeFor(.04) / 86400; D.text(ctx, "Across half a teacup (4 cm): about " + Math.round(days) + " days. That's why you stir.", W / 2, 990, 40, C.text, 700, "center", D.clamp((u - 10) / .6) * f);
      D.text(ctx, "Diffusion is fast for a cell and hopeless for a cup.", W / 2, 80, 56, C.text, 700, "center", f);
    }
  }
  // slow camera push on every scene except the crowd (which moves by itself)
  function drawFull(ctx, t) { const sc = sceneAt(t), u = (t - sc.t0) / (sc.t1 - sc.t0), z = sc.id === "crowd" || sc.id === "one" ? 1 : 1 + .05 * u;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1920, 1080); ctx.save(); ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960, -540); drawFullInner(ctx, t); ctx.restore(); }
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x])), rt = ringTimes(), ev = [{ t: .3, k: 6 }];
    for (let i = 0; i < 26; i++) ev.push({ t: s.one.t0 + .8 + i * .48, k: 2 + (Math.round(onePath()[i * 50][0] * 3) % 10 + 10) % 10, gain: .35 });
    rt.forEach((tt, i) => { if (tt != null) ev.push({ t: s.crowd.t0 + tt / SIM_T * CROWD_V, k: 3 + i * 2, gain: .6 }); });
    for (let j = 1; j <= 20; j++) ev.push({ t: s.law.t0 + .5 + j / 20 * 6, k: Math.round(j / 20 * 12) + 2, gain: .4 });
    SCALE.forEach((_, i) => ev.push({ t: s.scale.t0 + .6 + i * 1.4, k: 2 + i * 2, gain: .6 })); ev.push({ t: s.scale.t0 + 10, k: 13, gain: .6 }, { t: s.close.t0 + .3, k: 5 });
    return ev;
  }

  // ---------- Shorts ----------
  const S1_0 = 2;
  function drawS1(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const steps = D.clamp(Math.round((t - S1_0) * FPS * 2 * 20 / 18), 0, CROWD_V * FPS * 2), w = crowdAt(steps);
    dish(ctx, w, 540, 880, 980, 440, 1.1);
    D.lines(ctx, ["Why you have to", "stir your tea."], 540, 170, 78, C.text, 1);
    const tt = steps * DT; D.text(ctx, "t = " + tt.toFixed(1) + " s · " + Math.round(Math.sqrt(MSD[steps])) + " µm", 540, 1450, 56, C.amber, 700);
    const a = D.clamp((t - 21) / .6); D.lines(ctx, ["1 hour: " + fmtLen(F.rms(3600)) + "   1 day: " + fmtLen(F.rms(86400)), "Across half a cup: ~" + Math.round(F.timeFor(.04) / 86400) + " days"], 540, 1540, 44, C.text, a);
  }
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const steps = D.clamp(Math.round((t - 2) * FPS * 2 * 20 / 26), 0, CROWD_V * FPS * 2), w = crowdAt(steps);
    dish(ctx, w, 540, 900, 980, 440, 1.1, false); const s = 980 / 440, rt = ringTimes(), tt = steps * DT;
    RINGS.forEach((r, i) => { if (rt[i] == null || tt < rt[i]) return; ctx.strokeStyle = "rgba(255,189,56,.75)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(540, 900, r * s, 0, 7); ctx.stroke();
      D.text(ctx, r + " µm · " + rt[i].toFixed(1) + " s", 540, 900 - r * s - 18, 26, C.amber, 700); });
    D.lines(ctx, ["Twice as far takes", "four times as long."], 540, 170, 76, C.text, 1);
    D.text(ctx, "t = " + tt.toFixed(1) + " s", 540, 1460, 60, C.text, 700); D.text(ctx, "5,000 simulated dye molecules", 540, 1530, 32, C.dim, 600);
  }
  const timelines = [
    { id: "full", name: "11 Ink Diffusion (long)", file: "Command Loom - 11 Ink Diffusion.mp4", W: 1920, H: 1080, dur: 98, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Why you stir your tea", file: "Command Loom - Short 1 - Why You Stir Your Tea.mp4", W: 1080, H: 1920, dur: 31, draw: drawS1, voice: "glass",
      events: () => [...ringTimes().filter((x) => x != null && S1_0 + x * 18 / 20 < 30).map((x, i) => ({ t: S1_0 + x * 18 / 20, k: 3 + i * 2, gain: .6 })), { t: 21, k: 12, gain: .6 }] },
    { id: "s2", name: "Short 2 · Twice as far, four times as long", file: "Command Loom - Short 2 - Twice as Far.mp4", W: 1080, H: 1920, dur: 30, draw: drawS2, voice: "glass",
      events: () => ringTimes().filter((x) => x != null && 2 + x * 26 / 20 < 29.4).map((x, i) => ({ t: 2 + x * 26 / 20, k: 3 + i * 2, gain: .65 })) }
  ];
  root.CLVideo = { title: "Command Loom · 11 Ink Diffusion", timelines, ready };
  root.DiffVideo = { S, N, DT, SIM_T, RINGS, ringTimes, get MSD() { return MSD; }, SCALE, timelines, ready, fmtLen };
})(typeof window !== "undefined" ? window : globalThis);
