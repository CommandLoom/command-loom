// 14 Sandpile: the Bak–Tang–Wiesenfeld sandpile (sandpile.js). Grains are poured onto one centre square and the pile builds a
// mandala by itself. Every grain and toppling is computed; squares that toppled in the current frame flash, and every avalanche is heard.
(function (root) {
  "use strict";
  const K = root.Sand, D = root.CLDraw, FPS = 30;
  const C = { bg: "#0E0C2C", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  const COLS = [[14, 12, 44], [0, 170, 225], [240, 60, 150], [255, 200, 60]];          // 0, 1, 2, 3 grains
  const fmt = (v) => v.toLocaleString("en-US");
  const yieldNow = () => new Promise((r) => { if (typeof MessageChannel === "undefined") return r(); const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); r(); }; ch.port2.postMessage(0); });

  // ---------- pours ----------
  // grains poured by u seconds: n(u) = a(e^{bu} − 1), starting at rate0 grains per second and reaching N at the end: slow at first, then faster and faster
  function schedule(N, dur, rate0) { let lo = 1e-5, hi = 5; for (let i = 0; i < 100; i++) { const b = (lo + hi) / 2; if (rate0 / b * (Math.exp(b * dur) - 1) > N) hi = b; else lo = b; }
    const b = (lo + hi) / 2, a = rate0 / b; return (u) => u <= 0 ? 0 : u >= dur ? N : Math.min(N, Math.round(a * (Math.exp(b * u) - 1))); }
  const pour = (W, N, t0, dur, rate0) => ({ W, N, t0, dur, F: Math.round(dur * FPS), n: schedule(N, dur, rate0), c: (W >> 1) * W + (W >> 1) });
  const P = { hook: pour(161, 32768, .2, 4.4, 300), full: pour(221, 65536, 13.3, 83, 6), s1: pour(161, 32768, 1.2, 27.5, 6), s2: pour(49, 2000, 1.2, 27.5, 4) };
  const frameOf = (Q, t) => Math.max(0, Math.min(Q.F, Math.floor((t - Q.t0) * FPS)));
  // a runner keeps one pile and pours up to the frame asked for (restarting if asked to go back); `mark` = squares that toppled in that frame
  function runner(Q) { let st = null; return (f) => {
    if (!st || st.f > f) st = { p: new K.Pile(Q.W), f: 0, n: 0, mark: new Uint8Array(Q.W * Q.W) };
    while (st.f < f) { st.f++; const n = Q.n(st.f / FPS), last = st.f === f; if (last) st.mark.fill(0); if (n > st.n) { st.p.g[Q.c] += n - st.n; st.n = n; st.p.relax(last ? st.mark : null); } }
    return st; }; }
  const RUN = Object.fromEntries(Object.keys(P).map((k) => [k, runner(P[k])]));
  // per frame: topplings in that frame and the pile's radius (farthest non-empty square along the centre row and column), measured once at load
  const STAT = {};
  async function measure(key) { const Q = P[key], W = Q.W, h = W >> 1, p = new K.Pile(W), T = new Float64Array(Q.F + 1), R = new Float32Array(Q.F + 1); let n = 0, r = 0;
    for (let f = 1; f <= Q.F; f++) { const m = Q.n(f / FPS); if (m > n) { p.g[Q.c] += m - n; n = m; T[f] = p.relax(); }
      while (r < h && (p.g[h * W + h + r + 1] || p.g[(h + r + 1) * W + h])) r++; R[f] = r; if (f % 60 === 0) await yieldNow(); }
    STAT[key] = { T, R, total: T.reduce((a, b) => a + b, 0), final: p }; }
  const ready = (async () => { for (const k of Object.keys(P)) await measure(k); })();
  // camera radius: the pile's radius over the next 0.7 s, averaged, so the view widens smoothly ahead of the pile
  function camR(key, f) { const R = STAT[key].R; let s = 0; for (let j = 0; j <= 20; j++) s += R[Math.min(R.length - 1, f + j)]; return s / 21; }
  const cvs = {};
  function pile(ctx, key, t, cx, cy, half, maxPx = 40) {
    const Q = P[key], f = frameOf(Q, t), st = RUN[key](f), W = Q.W, s = Math.min(maxPx, half / (camR(key, f) + 1.5));
    const c = cvs[key] || (cvs[key] = document.createElement("canvas")); c.width = W; c.height = W; const g = c.getContext("2d"), img = g.createImageData(W, W), px = img.data;
    // flash strength: full when few squares toppled this frame, fainter when most of the pile toppled at once (so the pattern stays visible)
    let nt = 0, area = 0; for (let i = 0; i < W * W; i++) { nt += st.mark[i]; if (st.p.g[i]) area++; } const fl = .6 * Math.min(1, .12 / Math.max(1e-9, nt / Math.max(1, area)));
    for (let i = 0; i < W * W; i++) { const col = COLS[Math.min(3, st.p.g[i])], m = st.mark[i] ? fl : 0; px[i * 4] = col[0] + (255 - col[0]) * m; px[i * 4 + 1] = col[1] + (255 - col[1]) * m; px[i * 4 + 2] = col[2] + (255 - col[2]) * m; px[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, cx - W / 2 * s, cy - W / 2 * s, W * s, W * s);
    if (s >= 9) { const k = Math.ceil(half / s) + 1; ctx.strokeStyle = "rgba(5,6,14,.75)"; ctx.lineWidth = Math.max(1, s * .08); ctx.beginPath();
      for (let j = -k; j <= k + 1; j++) { const x = cx + (j - .5) * s; ctx.moveTo(x, cy - k * s); ctx.lineTo(x, cy + k * s); ctx.moveTo(cx - k * s, x - cx + cy); ctx.lineTo(cx + k * s, x - cx + cy); } ctx.stroke(); }
    ctx.restore(); return st.n;
  }
  // sound: a note for each frame with an avalanche (at most ten a second; bigger avalanches lower and louder), a soft tick for each grain while grains
  // are still few, and a bell each time the number of grains doubles
  function pourNotes(key, tmax, gain = 1) { const Q = P[key], T = STAT[key].T, ev = []; let last = -1, tick = -1, next = 16, n0 = 0;
    for (let f = 1; f <= Q.F; f++) { const t = Q.t0 + f / FPS, n = Q.n(f / FPS); if (t >= tmax) break;
      if (T[f] > 0 && t - last >= .1) { const l = Math.log2(T[f]); ev.push({ t, k: Math.max(0, Math.min(15, 14 - Math.round(l * .85))), gain: (.25 + .45 * Math.min(1, l / 18)) * gain }); last = t; }
      if (n > n0 && n - n0 < 3 && t - tick >= .1 && t - last > .05) { ev.push({ t, k: 8, voice: "wood", gain: .5 * gain }); tick = t; }
      while (n >= next) { ev.push({ t, k: Math.max(0, Math.min(15, Math.log2(next) - 4)), voice: "bell", gain: .5 * gain }); next *= 2; } n0 = n; }
    return ev; }

  // tiny rules demo: a 7 × 7 grid, one grain dropped in the middle, toppling in waves
  const RULE0 = [2, 3, 1, 2, 3, 0, 1, 3, 2, 3, 3, 1, 2, 2, 1, 3, 3, 3, 2, 3, 0, 2, 3, 3, 3, 3, 1, 2, 0, 2, 3, 3, 2, 3, 1, 1, 3, 2, 3, 1, 2, 3, 2, 0, 1, 2, 3, 1, 2];
  const RULE_WAVES = (() => { const W = 7, g = RULE0.slice(); g[24]++; const waves = [{ g: g.slice(), hot: [] }];
    for (let w = 0; w < 30; w++) { const hot = []; for (let i = 0; i < 49; i++) if (g[i] >= 4) hot.push(i); if (!hot.length) break;
      for (const i of hot) { g[i] -= 4; const x = i % W, y = (i / W) | 0; if (x > 0) g[i - 1]++; if (x < W - 1) g[i + 1]++; if (y > 0) g[i - W]++; if (y < W - 1) g[i + W]++; }
      waves.push({ g: g.slice(), hot }); } return waves; })();
  const RULE_T0 = 5, WAVE0 = 7.4, WAVE_DT = .8;
  function rules(ctx, t, x0, y0, cell, k = 1) {
    const wi = Math.min(RULE_WAVES.length - 1, Math.max(0, Math.floor((t - WAVE0) / WAVE_DT) + 1)), before = t < WAVE0 - 1.2, wv = before ? { g: RULE0, hot: [] } : RULE_WAVES[t < WAVE0 ? 0 : wi];
    wv.g.forEach((v, i) => { const x = x0 + (i % 7) * cell, y = y0 + Math.floor(i / 7) * cell, hot = wv.hot.includes(i), col = COLS[Math.min(3, v)];
      ctx.fillStyle = hot ? "#FFFFFF" : v >= 4 ? "#FF3B3B" : `rgb(${col[0]},${col[1]},${col[2]})`; ctx.fillRect(x + 3 * k, y + 3 * k, cell - 6 * k, cell - 6 * k);
      D.text(ctx, String(v), x + cell / 2, y + cell / 2 + 2 * k, cell * .42, hot || v === 3 ? "#1A1A1A" : C.text, 700); });
    if (!before && t < WAVE0) { const a = D.clamp((t - WAVE0 + 1.2) / .4); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 5 * k; ctx.strokeRect(x0 + 3 * cell, y0 + 3 * cell, cell, cell); }
    return wi;
  }
  const ruleNotes = () => [{ t: RULE_T0 + .2, k: 6, voice: "bell", gain: .5 }, { t: WAVE0 - 1.2, k: 10, voice: "wood", gain: .8 }, ...RULE0.map((v, i) => ({ t: RULE_T0 + .5 + i * .03, k: 3 + v * 3, gain: .18 })),
    ...RULE_WAVES.slice(1).map((w, i) => ({ t: WAVE0 + i * WAVE_DT, k: Math.min(15, 4 + w.hot.length), gain: .5 })), ...RULE_WAVES.slice(1).flatMap((w, i) => w.hot.slice(0, 4).map((_, j) => ({ t: WAVE0 + i * WAVE_DT + .06 * (j + 1), k: 12 - j, gain: .2 })))];
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 5], ["rules", 5, 13], ["pour", 13, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const n = pile(ctx, "hook", t, 960, 570, 470); D.text(ctx, "Pour sand on one square. One rule does the rest.", W / 2, 80, 56, C.text, 700); D.text(ctx, fmt(n) + " grains", 1840, 1010, 48, C.amber, 700, "right"); return; }
    if (sc.id === "rules") { const wi = rules(ctx, t, 300, 240, 100);
      ["Each square holds 0–3 grains.", "Add one more grain.", "4 grains? It topples: one to each neighbour.", "Neighbours can topple too."].forEach((s, i) =>
        D.text(ctx, s, 1080, 380 + i * 90, 40, i === 2 ? C.amber : C.text, 700, "left", D.clamp((t - RULE_T0 - .4 - [0, 1.2, 2.4, 4][i]) / .4) * f));
      D.text(ctx, "The rule", W / 2, 80, 58, C.text, 700, "center", f); if (t >= WAVE0) D.text(ctx, wi + (wi === 1 ? " wave" : " waves") + " of toppling", 650, 1000, 32, C.dim, 600, "center", f); return; }
    const n = pile(ctx, "full", t, 960, 570, 470), Q = P.full, endT = Q.t0 + Q.dur;
    D.text(ctx, fmt(n) + " grains", 1840, 1000, 56, C.amber, 700, "right"); D.text(ctx, "all poured on the centre square", 1840, 1046, 24, C.dim, 600, "right");
    const cap = t < 22 ? "One grain at a time…" : t < 40 ? "Every 4 grains, a square topples. Avalanches spread outward." : t < endT - 4 ? "Nobody draws this pattern. The rule grows it." : "One rule. Patterns nobody drew.";
    D.text(ctx, cap, W / 2, 80, 54, C.text, 700); if (t > endT - 4) D.text(ctx, "Bak–Tang–Wiesenfeld sandpile (1987) · every grain and toppling computed", W / 2, 1050, 22, C.dim, 500, "center", D.clamp((t - endT + 4) / .5));
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => 1 + .015 * Math.sin(t / 7));
  const fullEvents = () => [...pourNotes("hook", 5), ...ruleNotes(), { t: 13.1, k: 4, voice: "bell", gain: .5 }, ...pourNotes("full", 99.4), ...[2, 7, 12].map((k) => ({ t: P.full.t0 + P.full.dur + .3, k, voice: "bell", gain: .6 }))].filter((e) => e.t < 99.4);

  // ---------- Shorts ----------
  function s1(ctx, t) { const n = pile(ctx, "s1", t, 540, 1020, 500); D.lines(ctx, ["Pour sand on one", "square. Watch."], 540, 160, 78, C.text, 1);
    D.text(ctx, fmt(n) + " grains", 540, 1620, 66, C.amber, 700); D.text(ctx, "4 grains on a square: it topples to the neighbours", 540, 1700, 32, C.dim, 600); }
  function s2(ctx, t) { const n = pile(ctx, "s2", t, 540, 1020, 500, 60); D.lines(ctx, ["One more grain.", "How big is the avalanche?"], 540, 160, 70, C.text, 1);
    D.text(ctx, fmt(n) + " grains", 540, 1620, 66, C.amber, 700); D.text(ctx, "white squares: toppling right now", 540, 1700, 32, C.dim, 600); }
  const timelines = [
    { id: "full", name: "14 Sandpile (long)", file: "Command Loom - 14 Sandpile.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Pour sand on one square", file: "Command Loom - Short 1 - One Square of Sand.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .02 * t / 30), voice: "marimba",
      events: () => [{ t: .3, k: 6, voice: "bell", gain: .5 }, ...pourNotes("s1", 29.4), ...[2, 7, 12].map((k) => ({ t: P.s1.t0 + P.s1.dur + .2, k, voice: "bell", gain: .6 }))].filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · One more grain", file: "Command Loom - Short 2 - One More Grain.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .02 * t / 30), voice: "marimba",
      events: () => [{ t: .3, k: 6, voice: "bell", gain: .5 }, ...pourNotes("s2", 29.4), ...[2, 7, 12].map((k) => ({ t: P.s2.t0 + P.s2.dur + .2, k, voice: "bell", gain: .6 }))].filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 14 Sandpile", timelines, ready };
  root.SandVideo = { S, P, STAT, RULE_WAVES, schedule, timelines, ready };
})(typeof window !== "undefined" ? window : globalThis);
