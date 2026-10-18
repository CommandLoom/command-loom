// 15 Half Life: 10,000 simulated atoms with random (exponential) decay times from decay.js. Every count is measured from them.
(function (root) {
  "use strict";
  const K = root.Decay, D = root.CLDraw;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8", amber: [255, 189, 56], cyan: [53, 196, 240], spent: [40, 52, 70] };
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const N = 10000, HALF = 8, SEED = 15;                  // half-life of 8 video seconds in the grid scene
  const T = K.decayTimes(N, HALF, SEED), T20 = K.decayTimes(20, 3.3, 7);
  const fmt = (v) => v.toLocaleString("en-US");
  const SORTED = Float64Array.from(T).sort(), left = (t) => { let lo = 0, hi = N; while (lo < hi) { const m = (lo + hi) >> 1; if (SORTED[m] > t) hi = m; else lo = m + 1; } return N - lo; };   // atoms not yet decayed at t
  function grid(ctx, t, x0, y0, size, flash = .5) {
    const n = 100, c = size / n;
    for (let i = 0; i < N; i++) { const x = x0 + (i % n) * c, y = y0 + Math.floor(i / n) * c, d = t - T[i];
      ctx.fillStyle = d < 0 ? css(C.amber) : d < flash ? `rgba(255,255,255,${1 - d / flash})` : css(C.spent); ctx.fillRect(x + .6, y + .6, c - 1.2, c - 1.2);
      if (d >= 0 && d < flash) { ctx.fillStyle = css(C.spent, d / flash); ctx.fillRect(x + .6, y + .6, c - 1.2, c - 1.2); } }
  }
  function curve(ctx, t, x0, y0, w, h, tmax, k = 1) {
    const X = (s) => x0 + s / tmax * w, Y = (v) => y0 + h - v / N * h;
    ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    for (let j = 1; j * HALF <= tmax; j++) { ctx.strokeStyle = "rgba(160,176,198,.2)"; ctx.setLineDash([6 * k, 6 * k]); ctx.beginPath(); ctx.moveTo(X(j * HALF), y0); ctx.lineTo(X(j * HALF), y0 + h); ctx.stroke(); ctx.setLineDash([]);
      D.text(ctx, j + "×", X(j * HALF), y0 + h + 24 * k, 20 * k, C.dim, 600); }
    ctx.strokeStyle = css(C.cyan, .8); ctx.lineWidth = 2 * k; ctx.setLineDash([8 * k, 7 * k]); ctx.beginPath(); for (let s = 0; s <= tmax; s += .1) { const p = [X(s), Y(K.expected(N, HALF, s))]; s ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = css(C.amber); ctx.lineWidth = 3 * k; ctx.beginPath(); for (let s = 0; s <= Math.min(t, tmax); s += .1) { const p = [X(s), Y(left(s))]; s ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
    D.text(ctx, "atoms left · dashed: exactly halving", x0, y0 - 22 * k, 22 * k, C.dim, 600, "left"); D.text(ctx, "half-lives", x0 + w, y0 + h + 50 * k, 20 * k, C.dim, 600, "right");
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["one", 4, 16], ["grid", 16, 66], ["table", 66, 82], ["carbon", 82, 96], ["close", 96, 104]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const GRID0 = 17, gt = (t) => Math.max(0, t - GRID0);                // grid-scene clock (6 half-lives = 48 s)
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook" || sc.id === "close") { const tt = sc.id === "hook" ? HALF : 6 * HALF; grid(ctx, tt, 110, 150, 860); curve(ctx, tt, 1120, 300, 680, 460, 6 * HALF);
      if (sc.id === "hook") { D.text(ctx, "Half of them. Every time. Nobody knows which.", W / 2, 80, 56, C.text, 700); D.text(ctx, "Later in this video · 10,000 simulated atoms", W / 2, 140, 28, css(C.amber), 600); return; }
      D.text(ctx, "Random for one atom. Clockwork for ten thousand.", W / 2, 80, 54, C.text, 700, "center", f);
      D.text(ctx, "Simulated: every atom has the same chance per second to decay · decay times drawn at random (seeded)", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    if (sc.id === "one") {
      const x0 = 260, x1 = 1660; D.text(ctx, "20 atoms. When does each one decay?", W / 2, 80, 56, C.text, 700, "center", f);
      T20.forEach((td, i) => { const x = x0 + (i + .5) * (x1 - x0) / 20, y = 520, gone = u - 1 > td; ctx.fillStyle = gone ? css(C.spent) : css(C.amber); ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill();
        if (gone && u - 1 - td < .5) { ctx.strokeStyle = `rgba(255,255,255,${1 - (u - 1 - td) / .5})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 26 + 40 * (u - 1 - td), 0, 7); ctx.stroke(); } });
      D.lines(ctx, ["No schedule, no memory: an old atom is as likely to go next as a new one."], W / 2, 760, 38, C.text, D.clamp((u - 3) / .5) * f);
      D.text(ctx, T20.filter((td) => u - 1 > td).length + " of 20 decayed", W / 2, 860, 44, css(C.amber), 700, "center", f); return; }
    if (sc.id === "grid") {
      const tt = gt(t); grid(ctx, tt, 110, 150, 860); curve(ctx, tt, 1120, 300, 680, 460, 6 * HALF); const nleft = left(tt), j = Math.floor(tt / HALF);
      D.text(ctx, fmt(nleft), 1120, 880, 84, css(C.amber), 700, "left"); D.text(ctx, "atoms left", 1120, 940, 28, C.dim, 600, "left");
      D.text(ctx, (tt / HALF).toFixed(2) + " half-lives", 1800, 880, 40, C.text, 700, "right");
      D.text(ctx, j < 1 ? "10,000 atoms. One half-life: watch the count." : "After " + j + (j === 1 ? " half-life: " : " half-lives: ") + fmt(left(j * HALF)) + " left.", W / 2, 80, 54, C.text, 700, "center", f);
      D.speed(ctx, "1 HALF-LIFE = 8 S", W); return; }
    if (sc.id === "table") {
      D.text(ctx, "Each half-life, half of what is left.", W / 2, 80, 56, C.text, 700, "center", f);
      D.text(ctx, "half-lives", 520, 240, 30, C.dim, 600, "center", f); D.text(ctx, "measured", 960, 240, 30, C.dim, 600, "center", f); D.text(ctx, "exactly half", 1400, 240, 30, C.dim, 600, "center", f);
      for (let j = 0; j <= 6; j++) { const a = D.clamp((u - .5 - j * 1.2) / .4) * f, y = 320 + j * 95;
        D.text(ctx, String(j), 520, y, 52, C.text, 700, "center", a); D.text(ctx, fmt(left(j * HALF)), 960, y, 52, css(C.amber), 700, "center", a); D.text(ctx, fmt(Math.round(K.expected(N, HALF, j * HALF))), 1400, y, 52, css(C.cyan), 700, "center", a); }
      return; }
    if (sc.id === "carbon") {
      const x0 = 260, y0 = 260, w = 1400, h = 560, ymax = 30000, X = (y) => x0 + y / ymax * w, Y = (fr) => y0 + h - fr * h;
      ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      for (let y = 0; y <= ymax; y += 5000) D.text(ctx, fmt(y), X(y), y0 + h + 30, 22, C.dim, 600); D.text(ctx, "years", x0 + w, y0 + h + 62, 22, C.dim, 600, "right");
      const up = D.clamp((u - .5) / 6) * ymax; ctx.strokeStyle = css(C.amber); ctx.lineWidth = 4; ctx.beginPath(); for (let y = 0; y <= up; y += 100) { const p = [X(y), Y(Math.pow(2, -y / K.C14_HALF))]; y ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
      D.text(ctx, "share of carbon-14 left", x0, y0 - 26, 22, C.dim, 600, "left");
      const age = K.ageFromFraction(.25), a = D.clamp((u - 7) / .6) * f;
      if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(X(age), Y(.25), 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        D.text(ctx, "25% left → about " + fmt(Math.round(age / 10) * 10) + " years old", X(age) + 20, Y(.25) - 30, 34, C.text, 700, "left", a); }
      D.text(ctx, "Carbon-14 half-life: about " + fmt(K.C14_HALF) + " years. That is how old bones and wood are dated.", W / 2, 80, 46, C.text, 700, "center", f); }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .05 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: one soft note for every 100 atoms that decay (so the clicks slow down by half every half-life)
  function decayNotes(offset, tmax, rate = 1, gain = .5) { const sorted = Float64Array.from(T).sort(), ev = []; for (let j = 99; j < N; j += 100) { const td = sorted[j]; if (td > tmax) break; ev.push({ t: offset + td / rate, k: Math.min(15, Math.floor(j / 100 / 6.67)), gain }); } return ev; }
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 6 }, ...Array.from(T20).filter((td) => td + 1 < 11.6).map((td, i) => ({ t: s.one.t0 + 1 + td, k: 10, gain: .5 })),
      ...decayNotes(GRID0, s.grid.t1 - GRID0 - .3), ...Array.from({ length: 7 }, (_, j) => ({ t: s.table.t0 + .5 + j * 1.2, k: 12 - j, gain: .55 })),
      { t: s.carbon.t0 + 7, k: 4, gain: .6 }, { t: s.close.t0 + .3, k: 6 }];
  }

  // ---------- Shorts ----------
  const S1_0 = 2, S1_RATE = 8 / 6;          // half-life of 6 s in Short 1
  function s1(ctx, t) {
    const tt = Math.max(0, (t - S1_0) * S1_RATE), nleft = left(tt);
    grid(ctx, tt, 70, 420, 940); D.lines(ctx, tt < HALF * 4 ? ["Half of them.", "Every time."] : ["Nobody knows", "which atom is next."], 540, 170, 78, C.text, 1);
    D.text(ctx, fmt(nleft) + " left", 540, 1460, 72, css(C.amber), 700); D.text(ctx, (tt / HALF).toFixed(1) + " half-lives · 1 half-life = 6 s", 540, 1540, 32, C.dim, 600);
  }
  function s2(ctx, t) {
    const x0 = 110, y0 = 560, w = 860, h = 700, ymax = 30000, X = (y) => x0 + y / ymax * w, Y = (fr) => y0 + h - fr * h, up = D.clamp((t - 2) / 16) * ymax;
    ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    for (let y = 0; y <= ymax; y += 10000) D.text(ctx, fmt(y) + " yr", X(y), y0 + h + 34, 26, C.dim, 600);
    ctx.strokeStyle = css(C.amber); ctx.lineWidth = 5; ctx.beginPath(); for (let y = 0; y <= up; y += 100) { const p = [X(y), Y(Math.pow(2, -y / K.C14_HALF))]; y ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
    [.5, .25, .125].forEach((fr, i) => { const age = K.ageFromFraction(fr); if (up < age) return; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(X(age), Y(fr), 10, 0, 7); ctx.fill();
      D.text(ctx, Math.round(fr * 100 * 10) / 10 + "% · " + fmt(Math.round(age / 10) * 10) + " yr", X(age) + 18, Y(fr) - 28, 32, C.text, 700, "left"); });
    D.lines(ctx, ["The clock inside", "old bones."], 540, 170, 80, C.text, 1); D.text(ctx, "Carbon-14 halves every ~" + fmt(K.C14_HALF) + " years", 540, 380, 38, css(C.amber), 600);
  }
  const timelines = [
    { id: "full", name: "15 Half Life (long)", file: "Command Loom - 15 Half Life.mp4", W: 1920, H: 1080, dur: 104, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Half of them, every time", file: "Command Loom - Short 1 - Half Every Time.mp4", W: 1080, H: 1920, dur: 32, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .06 * t / 32), voice: "glass",
      events: () => decayNotes(S1_0, (31.4 - S1_0) * S1_RATE, S1_RATE) },
    { id: "s2", name: "Short 2 · The clock in old bones", file: "Command Loom - Short 2 - Carbon Clock.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .06 * t / 30), voice: "glass",
      events: () => [.5, .25, .125].map((fr, i) => ({ t: 2 + K.ageFromFraction(fr) / 30000 * 16, k: 10 - i * 3, gain: .65 })) }
  ];
  root.CLVideo = { title: "Command Loom · 15 Half Life", timelines };
  root.HalfVideo = { S, N, HALF, T, T20, timelines, decayNotes, left };
})(typeof window !== "undefined" ? window : globalThis);
