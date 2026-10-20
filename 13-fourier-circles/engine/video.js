// 13 Fourier Circles: shapes drawn by chains of rotating circles (fourier.js). Radii, speeds and errors are computed from each shape
// (discrete Fourier transform of 256 points); the pen plays a note sixteen times a lap, higher when it is higher on screen.
(function (root) {
  "use strict";
  const F = root.Fourier, D = root.CLDraw;
  const C = { bg: "#05070C", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  const N = 256, SH = { heart: F.resample(F.heart(600), N), star: F.resample(F.star(), N), flower: F.resample(F.flower(800), N), infinity: F.resample(F.infinity(800), N), loom: F.resample(F.loom(), N) };
  const CO = Object.fromEntries(Object.entries(SH).map(([k, z]) => [k, F.dft(z)]));
  const KS = [1, 2, 4, 8, 16, 32, 64], HEIGHT = Math.max(...SH.heart.map((p) => p[1])) - Math.min(...SH.heart.map((p) => p[1]));
  const ERR = Object.fromEntries(KS.map((k) => [k, F.error(CO.heart, k, SH.heart) / HEIGHT]));      // average miss as a share of the heart's height
  const HUE = { heart: 340, star: 45, flower: 290, infinity: 185, loom: 25 };
  const pct = (e) => (e * 100).toFixed(e < .01 ? 2 : 1) + "%";

  // laps drawn by time t when drawing starts at t0 and the laps take durs[0], durs[1], … seconds (the last one repeats): the drawing speeds up
  function lapsAt(t, t0, durs) { let s = 0, u = t - t0; if (u <= 0) return 0; for (let i = 0; ; i++) { const d = durs[Math.min(i, durs.length - 1)]; if (u < d) return s + u / d; u -= d; s++; } }
  function timeAt(s, t0, durs) { let t = t0, i = 0; while (s >= 1) { t += durs[Math.min(i, durs.length - 1)]; s--; i++; } return t + s * durs[Math.min(i, durs.length - 1)]; }
  // one pen: rainbow circles, the drawing so far (faint) and a glowing comet over the last 0.6 lap
  function pen(ctx, coef, K, s, cx, cy, sc, hue, k = 1, circles = true) {
    const P = (q) => { const p = F.tip(coef, K, q); return [cx + p[0] * sc, cy + p[1] * sc]; };
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
    const done = Math.min(1, s), n0 = Math.max(2, Math.round(360 * done)); ctx.beginPath(); for (let i = 0; i <= n0; i++) { const p = P(done * i / n0); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
    ctx.strokeStyle = `hsla(${hue},90%,62%,.38)`; ctx.lineWidth = 3 * k; ctx.stroke();
    const L = Math.min(s, .6), m = 120; for (let j = 0; j < m; j++) { const a = s - L + L * j / m, b = s - L + L * (j + 1) / m, w = (j + 1) / m, p = P(a), q = P(b);
      ctx.strokeStyle = `hsla(${hue + 40 * w},95%,${60 + 15 * w}%,${w * .25})`; ctx.lineWidth = 14 * k * w; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke();
      ctx.strokeStyle = `hsla(${hue + 40 * w},95%,${62 + 20 * w}%,${w})`; ctx.lineWidth = (2 + 3.5 * w) * k; ctx.stroke(); }
    if (circles) { const ch = F.chain(coef, K, s % 1);
      for (let i = 0; i < K; i++) { const r = coef[i].r * sc; if (r < .8) continue; const [x, y] = ch[i];
        ctx.strokeStyle = `hsla(${(hue + 180 + i * 23) % 360},85%,66%,${Math.max(.12, .7 - i * .012)})`; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, r, 0, 7); ctx.stroke();
        ctx.strokeStyle = "rgba(240,244,250,.6)"; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.moveTo(cx + x * sc, cy + y * sc); ctx.lineTo(cx + ch[i + 1][0] * sc, cy + ch[i + 1][1] * sc); ctx.stroke(); } }
    const p = P(s), g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 22 * k); g.addColorStop(0, "#FFFFFF"); g.addColorStop(.3, `hsla(${hue},95%,75%,.9)`); g.addColorStop(1, `hsla(${hue},95%,60%,0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], 22 * k, 0, 7); ctx.fill(); ctx.restore();
  }
  // sound: sixteen notes a lap (fewer when laps get fast), pitch from the pen's height; a chime each time a lap closes
  function penNotes(coef, K, t0, durs, tEnd, side = 0, gain = 1, cap = 11) {
    const ev = []; let last = -1;
    for (let j = 0; ; j++) { const s = j / 16, t = timeAt(s, t0, durs); if (t >= tEnd) break; if (j % 16 === 0 && j) ev.push({ t, k: 13, gain: .45 * gain, side, voice: "bell" });
      if (t - last < 1 / cap) continue; last = t; const p = F.tip(coef, K, s); ev.push({ t, k: Math.max(0, Math.min(15, Math.round(7.5 - p[1] * 7))), side, gain: .42 * gain }); }
    return ev;
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 5], ["build", 5, 20], ["heart", 20, 34], ["grid", 34, 52], ["shapes", 52, 88], ["finale", 88, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const HOOK = { t0: .2, durs: [3.4, 2.4] }, BUILD = [1, 2, 3, 5, 8, 16, 32, 64], B0 = 5.3, BD = 1.82, HEART = { t0: 20.5, durs: [6, 4, 2.5] }, GRID = { t0: 34.6, durs: [3] };
  const SHAPES = [["star", 64], ["flower", 32], ["infinity", 32], ["loom", 128]].map(([key, K], i) => ({ key, K, t0: 52.4 + 9 * i, durs: [4, 2.5, 1.5] }));
  const FIN = { t0: 88.4, durs: [3, 2.2] }, FIN_KEYS = [["heart", 64], ["star", 64], ["flower", 32], ["infinity", 32], ["loom", 128]];
  const GRID_POS = KS.map((_, i) => i < 4 ? [270 + i * 460, 380] : [500 + (i - 4) * 460, 780]);
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { pen(ctx, CO.heart, 64, lapsAt(t, HOOK.t0, HOOK.durs), 960, 600, 400, HUE.heart); D.text(ctx, "Spinning circles, chained together, can draw anything.", W / 2, 80, 54, C.text, 700); return; }
    if (sc.id === "build") { const i = Math.max(0, Math.min(BUILD.length - 1, Math.floor((t - B0) / BD))), K = BUILD[i], s = Math.min(1, Math.max(0, (t - B0 - i * BD) / (BD - .12)));
      pen(ctx, CO.heart, K, s, 960, 600, 400, HUE.heart); D.text(ctx, K + (K === 1 ? " circle" : " circles"), 1800, 1000, 60, C.amber, 700, "right");
      D.text(ctx, i === 0 ? "One circle draws a circle." : i < 4 ? "Add circles on the rim, each spinning at its own speed…" : "…and a heart appears.", W / 2, 80, 52, C.text, 700, "center", f); return; }
    if (sc.id === "heart") { pen(ctx, CO.heart, 64, lapsAt(t, HEART.t0, HEART.durs), 960, 600, 400, HUE.heart); D.text(ctx, "64 circles", 1800, 1000, 60, C.amber, 700, "right");
      D.text(ctx, "Each circle turns a whole number of times per lap.", W / 2, 80, 52, C.text, 700, "center", f); return; }
    if (sc.id === "grid") { const s = lapsAt(t, GRID.t0, GRID.durs);
      KS.forEach((K, i) => { const [cx, cy] = GRID_POS[i], a = D.clamp((t - sc.t0 - i * .25) / .4) * f; if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; pen(ctx, CO.heart, K, s, cx, cy - 20, 140, (HUE.heart + i * 40) % 360, .6); ctx.restore();
        D.text(ctx, K + (K === 1 ? " circle" : " circles"), cx, cy + 150, 30, C.text, 700, "center", a); D.text(ctx, "miss " + pct(ERR[K]), cx, cy + 184, 24, C.dim, 600, "center", a); });
      D.text(ctx, "More circles, closer heart.", W / 2, 80, 52, C.text, 700, "center", f); return; }
    if (sc.id === "shapes") { const i = Math.min(3, Math.floor((t - 52) / 9)), R = SHAPES[i], g = D.fade(t, 52 + 9 * i, 61 + 9 * i, .3);
      ctx.save(); ctx.globalAlpha = g; pen(ctx, CO[R.key], R.K, lapsAt(t, R.t0, R.durs), 960, 600, 390, HUE[R.key]); ctx.restore(); D.text(ctx, R.K + " circles", 1800, 1000, 60, C.amber, 700, "right", g);
      D.text(ctx, ["A star: sharp corners need many small circles.", "A flower.", "Infinity.", "Even our own logo."][i], W / 2, 80, 52, C.text, 700, "center", g); return; }
    const s = lapsAt(t, FIN.t0, FIN.durs);
    FIN_KEYS.forEach(([key, K], i) => { const a = D.clamp((t - sc.t0 - i * .2) / .4); ctx.save(); ctx.globalAlpha = a; pen(ctx, CO[key], K, s, 230 + i * 365, 560, 150, HUE[key], .6); ctx.restore(); });
    D.text(ctx, "Every closed drawing is a sum of spinning circles.", W / 2, 80, 54, C.text, 700, "center", D.fade(t, sc.t0, sc.t1 + 1));
    D.text(ctx, "discrete Fourier transform of 256 points per shape · circles sorted by size · computed, not drawn by hand", W / 2, 1050, 24, C.dim, 500);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .025 * (t - sc.t0) / (sc.t1 - sc.t0); });
  function fullEvents() {
    const ev = [...penNotes(CO.heart, 64, HOOK.t0, HOOK.durs, 5)];
    BUILD.forEach((K, i) => { const t0 = B0 + i * BD; ev.push({ t: t0, k: 2 + i, voice: "bell", gain: .5 }, ...penNotes(CO.heart, K, t0, [BD - .12], t0 + BD - .12, 0, .9)); });
    ev.push(...penNotes(CO.heart, 64, HEART.t0, HEART.durs, 34), { t: 34.1, k: 4, voice: "bell", gain: .5 });
    ev.push(...penNotes(CO.heart, 64, GRID.t0, GRID.durs, 51.8), ...KS.map((_, i) => ({ t: 34 + i * .25, k: 2 + i * 2, gain: .4 })));
    SHAPES.forEach((R, i) => ev.push({ t: 52 + 9 * i + .1, k: 5 + i * 2, voice: "bell", gain: .5 }, ...penNotes(CO[R.key], R.K, R.t0, R.durs, 60.8 + 9 * i)));
    ev.push({ t: 88.1, k: 7, voice: "bell", gain: .5 }, ...penNotes(CO.heart, 64, FIN.t0, FIN.durs, 99.4, -.3), ...penNotes(CO.flower, 32, FIN.t0, FIN.durs, 99.4, .3, .6, 4));
    return ev.filter((e) => e.t < 99.4);
  }

  // ---------- Shorts ----------
  const SB0 = 1, SBD = 1.6, SH1 = { t0: 14.2, durs: [5, 3, 2, 1.5] };
  function s1(ctx, t) {
    let K = 64, s; if (t < SH1.t0) { const i = Math.max(0, Math.min(BUILD.length - 1, Math.floor((t - SB0) / SBD))); K = BUILD[i]; s = Math.min(1, Math.max(0, (t - SB0 - i * SBD) / (SBD - .1))); } else s = lapsAt(t, SH1.t0, SH1.durs);
    pen(ctx, CO.heart, K, s, 540, 1000, 440, HUE.heart, 1.1);
    D.lines(ctx, ["Spinning circles", "draw a heart."], 540, 170, 80, C.text, 1); D.text(ctx, K + (K === 1 ? " circle" : " circles"), 540, 1640, 64, C.amber, 700);
  }
  const S2D = 4.05;
  function s2(ctx, t) { const i = Math.min(KS.length - 1, Math.floor(Math.max(0, t - 1) / S2D)), K = KS[i], s = Math.min(1, Math.max(0, (t - 1 - i * S2D) / (S2D - .5)));
    pen(ctx, CO.heart, K, s, 540, 960, 420, (HUE.heart + i * 40) % 360, 1.1);
    D.lines(ctx, ["How many circles", "for a heart?"], 540, 170, 80, C.text, 1); D.text(ctx, K + (K === 1 ? " circle" : " circles"), 540, 1560, 64, C.amber, 700); D.text(ctx, "miss " + pct(ERR[K]) + " of its height", 540, 1640, 40, C.dim, 600); }
  const timelines = [
    { id: "full", name: "13 Fourier Circles (long)", file: "Command Loom - 13 Fourier Circles.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Circles draw a heart", file: "Command Loom - Short 1 - Circles Draw a Heart.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => [...BUILD.flatMap((K, i) => { const t0 = SB0 + i * SBD; return [{ t: t0, k: 2 + i, voice: "bell", gain: .5 }, ...penNotes(CO.heart, K, t0, [SBD - .1], t0 + SBD - .1, 0, .9)]; }), ...penNotes(CO.heart, 64, SH1.t0, SH1.durs, 29.4)] },
    { id: "s2", name: "Short 2 · How many circles", file: "Command Loom - Short 2 - How Many Circles.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => KS.flatMap((K, i) => { const t0 = 1 + i * S2D; return [{ t: t0, k: 2 + i * 2, voice: "bell", gain: .5 }, ...penNotes(CO.heart, K, t0, [S2D - .5], t0 + S2D - .5)]; }).filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 13 Fourier Circles", timelines };
  root.FourierVideo = { S, SH, CO, KS, ERR, SHAPES, lapsAt, timeAt, timelines };
})(typeof window !== "undefined" ? window : globalThis);
