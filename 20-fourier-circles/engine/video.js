// 20 Fourier Circles: shapes drawn by chains of rotating circles (fourier.js). Radii, speeds and errors are computed from each shape.
(function (root) {
  "use strict";
  const F = root.Fourier, D = root.CLDraw;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0" };
  const N = 256, SH = { heart: F.resample(F.heart(600), N), star: F.resample(F.star(), N), loom: F.resample(F.loom(), N) };
  const CO = Object.fromEntries(Object.entries(SH).map(([k, z]) => [k, F.dft(z)]));
  const KS = [1, 2, 4, 8, 16, 32, 64], HEIGHT = Math.max(...SH.heart.map((p) => p[1])) - Math.min(...SH.heart.map((p) => p[1]));
  const ERR = Object.fromEntries(KS.map((k) => [k, F.error(CO.heart, k, SH.heart) / HEIGHT]));      // average miss as a share of the heart's height
  function drawChain(ctx, coef, K, s, cx, cy, sc, k = 1, laps = 1, traceCol = C.amber, showCircles = true) {
    // trace: the pen's path from the start of the drawing up to now
    const steps = Math.max(2, Math.round(laps * 500)); ctx.strokeStyle = traceCol; ctx.lineWidth = 3.5 * k; ctx.lineJoin = "round"; ctx.beginPath();
    for (let i = 0; i <= steps; i++) { const ss = Math.min(s, laps) * i / steps, p = F.tip(coef, K, ss); i ? ctx.lineTo(cx + p[0] * sc, cy + p[1] * sc) : ctx.moveTo(cx + p[0] * sc, cy + p[1] * sc); } ctx.stroke();
    if (!showCircles) return;
    const ch = F.chain(coef, K, s % 1);
    for (let i = 0; i < K; i++) { const r = coef[i].r * sc; if (r < .6) continue; const [x, y] = ch[i]; ctx.strokeStyle = `rgba(160,190,230,${Math.max(.08, .45 - i * .006)})`; ctx.lineWidth = 1.2 * k;
      ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, r, 0, 7); ctx.stroke(); ctx.strokeStyle = "rgba(230,236,245,.55)"; ctx.beginPath(); ctx.moveTo(cx + x * sc, cy + y * sc); ctx.lineTo(cx + ch[i + 1][0] * sc, cy + ch[i + 1][1] * sc); ctx.stroke(); }
    const p = ch[K]; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cx + p[0] * sc, cy + p[1] * sc, 7 * k, 0, 7); ctx.fill();
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["one", 4, 18], ["heart", 18, 44], ["more", 44, 66], ["star", 66, 80], ["loom", 80, 94], ["close", 94, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const HEART_LAP = 12;
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { drawChain(ctx, CO.heart, 64, .55 + u / HEART_LAP, 960, 590, 400);
      D.text(ctx, "Spinning circles, chained together, can draw anything.", W / 2, 80, 54, C.text, 700); D.text(ctx, "Later in this video · computed from the shape itself", W / 2, 140, 28, C.amber, 600); return; }
    if (sc.id === "one") { const K = u < 5 ? 1 : u < 9.5 ? 2 : 3, s = ((u < 5 ? u : u < 9.5 ? u - 5 : u - 9.5) / 4.5); drawChain(ctx, CO.heart, K, s, 960, 600, 400, 1, 1);
      D.text(ctx, K === 1 ? "One spinning circle draws a circle." : K === 2 ? "Add a second, spinning at another speed, on its rim…" : "…and a third. The pen starts to make a shape.", W / 2, 80, 52, C.text, 700, "center", f);
      D.text(ctx, K + (K === 1 ? " circle" : " circles"), 1780, 1000, 44, C.amber, 700, "right"); return; }
    if (sc.id === "heart" || sc.id === "close") { const s = sc.id === "heart" ? Math.max(0, u - 1) / HEART_LAP : 2; drawChain(ctx, CO.heart, 64, s, 960, 590, 400, 1, 2);
      if (sc.id === "close") { D.text(ctx, "Every closed drawing is a sum of spinning circles.", W / 2, 80, 54, C.text, 700, "center", f); D.text(ctx, "Discrete Fourier transform of 256 points per shape · circles sorted by size · computed, not drawn by hand", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
      D.text(ctx, "64 circles, each turning a whole number of times per lap.", W / 2, 80, 52, C.text, 700, "center", f); D.text(ctx, "64 circles", 1780, 1000, 44, C.amber, 700, "right"); return; }
    if (sc.id === "more") {
      KS.forEach((K, i) => { const col = i % 4, row = Math.floor(i / 4), cx = 280 + col * 450, cy = 340 + row * 400, a = D.clamp((u - .5 - i * 1.6) / .5);
        if (a <= 0) return; ctx.globalAlpha = a; drawChain(ctx, CO.heart, K, 1, cx, cy, 150, .6, 1, C.amber, false); ctx.globalAlpha = 1;
        D.text(ctx, K + (K === 1 ? " circle" : " circles"), cx, cy + 175, 30, C.text, 700, "center", a); D.text(ctx, "average miss " + (ERR[K] * 100).toFixed(ERR[K] < .01 ? 2 : 1) + "% of height", cx, cy + 210, 22, C.dim, 600, "center", a); });
      D.text(ctx, "More circles, closer drawing. Doubling the circles cuts the error again and again.", W / 2, 80, 44, C.text, 700, "center", f); return; }
    if (sc.id === "star" || sc.id === "loom") { const key = sc.id, s = Math.max(0, u - 1) / 11.5; drawChain(ctx, CO[key], key === "star" ? 64 : 128, s, 960, 590, 380);
      D.text(ctx, key === "star" ? "Sharp corners need many more small circles." : "Even our own logo: 128 circles.", W / 2, 80, 52, C.text, 700, "center", f);
      D.text(ctx, (key === "star" ? 64 : 128) + " circles", 1780, 1000, 44, C.amber, 700, "right"); }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .04 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: a soft note every 1/16 of a lap while a shape is drawn; pitch follows the pen's height
  function penNotes(coef, K, t0, lap, laps, gain = .45) { const ev = []; for (let j = 0; j <= laps * 16; j++) { const s = j / 16, p = F.tip(coef, K, s); ev.push({ t: t0 + s * lap, k: Math.max(0, Math.min(15, Math.round(7.5 - p[1] * 7))), gain }); } return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 9 }, { t: s.one.t0 + .2, k: 4 }, { t: s.one.t0 + 5, k: 8 }, { t: s.one.t0 + 9.5, k: 12 },
      ...penNotes(CO.heart, 64, s.heart.t0 + 1, HEART_LAP, 2), ...KS.map((_, i) => ({ t: s.more.t0 + .5 + i * 1.6, k: 2 + i * 2, gain: .55 })),
      ...penNotes(CO.star, 64, s.star.t0 + 1, 11.5, 1), ...penNotes(CO.loom, 128, s.loom.t0 + 1, 11.5, 1), { t: s.close.t0 + .3, k: 6 }].filter((e) => e.t < 99.4); }

  // ---------- Shorts ----------
  function s1(ctx, t) { drawChain(ctx, CO.heart, 64, Math.max(0, t - 1.5) / 13, 540, 1000, 440, 1.1, 2);
    D.lines(ctx, ["64 spinning circles", "draw a heart."], 540, 170, 76, C.text, 1); D.text(ctx, "each circle turns a whole number of times per lap", 540, 340, 30, C.amber, 600); }
  function s2(ctx, t) { const i = Math.min(KS.length - 1, Math.floor(Math.max(0, t - 1) / 3.9)), K = KS[i], s = ((Math.max(0, t - 1) % 3.9) / 3.2);
    drawChain(ctx, CO.heart, K, Math.min(1, s), 540, 960, 420, 1.1, 1);
    D.lines(ctx, ["How many circles", "for a heart?"], 540, 170, 76, C.text, 1); D.text(ctx, K + (K === 1 ? " circle" : " circles") + " · miss " + (ERR[K] * 100).toFixed(ERR[K] < .01 ? 2 : 1) + "%", 540, 1560, 54, C.amber, 700); }
  const timelines = [
    { id: "full", name: "20 Fourier Circles (long)", file: "Command Loom - 20 Fourier Circles.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Circles draw a heart", file: "Command Loom - Short 1 - Circles Draw a Heart.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "glass",
      events: () => penNotes(CO.heart, 64, 1.5, 13, 2).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · How many circles", file: "Command Loom - Short 2 - How Many Circles.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "glass",
      events: () => KS.map((_, i) => ({ t: 1 + i * 3.9 + .05, k: 2 + i * 2, gain: .6 })).filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 20 Fourier Circles", timelines };
  root.FourierVideo = { S, SH, CO, KS, ERR, timelines };
})(typeof window !== "undefined" ? window : globalThis);
