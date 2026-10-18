// 21 Sandpile: the Bak–Tang–Wiesenfeld sandpile (sandpile.js). Every grain, toppling and count is computed.
// The grids for every frame are computed once at load, in small chunks, so the page never locks up.
(function (root) {
  "use strict";
  const K = root.Sand, D = root.CLDraw, FPS = 30;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0" };
  const COLS = [[10, 16, 30], [30, 110, 150], [255, 189, 56], [255, 244, 220]], FLASH = [255, 255, 255];
  const fmt = (v) => v.toLocaleString("en-US");
  const yieldNow = () => new Promise((r) => { if (typeof MessageChannel === "undefined") return r(); const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  // ---------- schedules ----------
  const S = [["hook", 0, 4], ["rules", 4, 18], ["random", 18, 54], ["centre", 54, 86], ["close", 86, 96]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const RW = 100, RDROPS = 30000, RAND_FR = Math.round((S[2].t1 - S[2].t0) * FPS), dropsAtFrame = (f) => Math.min(RDROPS, Math.round(RDROPS * Math.pow(f / (RAND_FR - 60), 2.5)));
  const CW = 151, CMAX = 32768, CENT_FR = Math.round((S[3].t1 - S[3].t0) * FPS), grainsAtFrame = (f) => Math.min(CMAX, Math.round(CMAX * Math.pow(f / (CENT_FR - 60), 2)));
  const S1_FR = 27 * FPS, S2_FR = 27 * FPS;
  let STATS = null;           // measured from the run: quiet drops, median and 99th-percentile avalanche
  const stats = () => { if (STATS) return STATS; const nz = Array.from(RUN.sizes).filter((x) => x > 0).sort((a, b) => a - b);
    return STATS = { quiet: RDROPS - nz.length, median: nz[Math.floor(nz.length / 2)], p99: nz[Math.floor(nz.length * .99)], max: nz[nz.length - 1] }; };
  let RUN = null, RSNAP = null, CSNAP = null, S1SNAP = null, S2SNAP = null;
  // snapshot = heights (0–3) in bits 0–1, bit 2 set if the cell toppled since the previous snapshot
  async function randomSnaps(dropsAt, frames) { const p = new K.Pile(RW); p.g.set(RUN.init); const out = []; let d = 0;
    for (let f = 0; f <= frames; f++) { const target = dropsAt(f); let rec = new Set(); while (d < target) { const r1 = new Set(); if (p.drop(RUN.sites[d], r1) > 0) rec = r1; d++; }   // flash only the frame's last avalanche
      const s = new Uint8Array(RW * RW); for (let i = 0; i < s.length; i++) s[i] = p.g[i] | (rec.has(i) ? 4 : 0); out.push(s); if (f % 20 === 0) await yieldNow(); }
    return out; }
  async function centreSnaps(grainsAt, frames) { const p = new K.Pile(CW), c = (CW >> 1) * CW + (CW >> 1), out = []; let n = 0;
    for (let f = 0; f <= frames; f++) { const target = grainsAt(f); p.g[c] += target - n; n = target; p.relax();
      const s = new Uint8Array(CW * CW); for (let i = 0; i < s.length; i++) s[i] = p.g[i]; out.push(s); if (f % 10 === 0) await yieldNow(); }
    return out; }
  const ready = (async () => {
    if (typeof document === "undefined") { RUN = K.randomRun(RW, RDROPS, 21); return; }      // tests only need the run
    // same run as K.randomRun, but in chunks so the page stays responsive
    { const r = K.rng(21), p = new K.Pile(RW); for (let i = 0; i < p.g.length; i++) p.g[i] = Math.floor(r() * 4);
      RUN = { W: RW, init: Uint32Array.from(p.g), sites: new Int32Array(RDROPS), sizes: new Int32Array(RDROPS) };
      for (let d = 0; d < RDROPS; d++) { const i = Math.floor(r() * p.g.length); RUN.sites[d] = i; RUN.sizes[d] = p.drop(i); if (d % 300 === 0) await yieldNow(); } }
    RSNAP = await randomSnaps(dropsAtFrame, RAND_FR); CSNAP = await centreSnaps(grainsAtFrame, CENT_FR);
    S1SNAP = await randomSnaps((f) => Math.min(RDROPS, Math.round(RDROPS * Math.pow(f / (S1_FR - 45), 2.5))), S1_FR);
    S2SNAP = await centreSnaps((f) => Math.min(CMAX, Math.round(CMAX * Math.pow(f / (S2_FR - 45), 2))), S2_FR);
  })();
  const cvs = {};
  function grid(ctx, snap, W, x0, y0, size, key) {
    const c = cvs[key] || (cvs[key] = document.createElement("canvas")); c.width = W; c.height = W; const g = c.getContext("2d"), img = g.createImageData(W, W), px = img.data;
    for (let i = 0; i < W * W; i++) { const v = snap[i], col = v & 4 ? FLASH : COLS[v & 3]; px[i * 4] = col[0]; px[i * 4 + 1] = col[1]; px[i * 4 + 2] = col[2]; px[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, x0, y0, size, size); ctx.imageSmoothingEnabled = true; ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, size, size);
  }
  function histogram(ctx, upto, x0, y0, w, h, k = 1) {
    const bins = new Array(16).fill(0); for (let d = 0; d < upto; d++) { const s = RUN.sizes[d]; if (s > 0) bins[Math.min(15, Math.floor(Math.log2(s)))]++; }
    const mx = Math.log10(Math.max(10, ...bins) + 1), bw = w / 16;
    ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    bins.forEach((b, i) => { const hh = b ? Math.log10(b + 1) / mx * h : 0; ctx.fillStyle = "rgba(255,189,56,.85)"; ctx.fillRect(x0 + i * bw + 2, y0 + h - hh, bw - 4, hh); });
    for (const p of [0, 5, 10, 15]) D.text(ctx, fmt(2 ** p), x0 + (p + .5) * bw, y0 + h + 24 * k, 18 * k, C.dim, 600);
    D.text(ctx, "avalanches by size (topplings, doubling bins; count on log scale)", x0, y0 - 22 * k, 20 * k, C.dim, 600, "left");
    return bins;
  }
  // tiny rules demo: a 7 × 7 grid, one grain dropped in the middle, toppling in waves
  const RULE0 = [2, 3, 1, 2, 3, 0, 1, 3, 2, 3, 3, 1, 2, 2, 1, 3, 3, 3, 2, 3, 0, 2, 3, 3, 3, 3, 1, 2, 0, 2, 3, 3, 2, 3, 1, 1, 3, 2, 3, 1, 2, 3, 2, 0, 1, 2, 3, 1, 2];
  const RULE_WAVES = (() => { const W = 7, g = RULE0.slice(); g[24]++; const waves = [{ g: g.slice(), hot: [] }];
    for (let w = 0; w < 30; w++) { const hot = []; for (let i = 0; i < 49; i++) if (g[i] >= 4) hot.push(i); if (!hot.length) break;
      for (const i of hot) { g[i] -= 4; const x = i % W, y = (i / W) | 0; if (x > 0) g[i - 1]++; if (x < W - 1) g[i + 1]++; if (y > 0) g[i - W]++; if (y < W - 1) g[i + W]++; }
      waves.push({ g: g.slice(), hot }); } return waves; })();
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const fr = (t, t0, n) => Math.max(0, Math.min(n, Math.round((t - t0) * FPS)));

  // ---------- long video ----------
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook" || sc.id === "close") { grid(ctx, CSNAP[CENT_FR], CW, 520, 170, 880, "c");
      if (sc.id === "hook") { D.text(ctx, "Drop sand grain by grain. This builds itself.", W / 2, 80, 58, C.text, 700); D.text(ctx, "Later in this video · 32,768 grains, one rule", W / 2, 140, 28, C.amber, 600); return; }
      D.text(ctx, "One simple rule. Avalanches of every size. Patterns nobody drew.", W / 2, 80, 50, C.text, 700, "center", f);
      D.text(ctx, "Bak–Tang–Wiesenfeld sandpile (1987) · every grain and toppling computed", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    if (sc.id === "rules") {
      const wi = Math.min(RULE_WAVES.length - 1, Math.max(0, Math.floor((u - 3) / 1.1))), wv = RULE_WAVES[wi], cell = 96, x0 = 260, y0 = 220;
      wv.g.forEach((v, i) => { const x = x0 + (i % 7) * cell, y = y0 + Math.floor(i / 7) * cell, hot = wv.hot.includes(i); const col = COLS[Math.min(3, v)];
        ctx.fillStyle = hot ? "#FFFFFF" : v >= 4 ? "#EF6FAE" : `rgb(${col[0]},${col[1]},${col[2]})`; ctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
        D.text(ctx, String(v), x + cell / 2, y + cell / 2 + 2, 40, hot || (v >= 2 && v < 4) ? "#1A1A1A" : C.text, 700); });
      const L = ["Each square holds 0–3 grains.", "Add one grain to the middle.", "4 or more? It topples:", "one grain to each neighbour.", "Neighbours may topple too."];
      L.forEach((s, i) => D.text(ctx, s, 1060, 360 + i * 74, 38, i === 2 ? C.amber : C.text, 700, "left", D.clamp((u - .5 - i * 1.6) / .5) * f));
      D.text(ctx, "The rule", W / 2, 80, 58, C.text, 700, "center", f); D.text(ctx, wi ? "wave " + wi + " of topplings" : "", x0 + 3.5 * cell, y0 + 7 * cell + 40, 30, C.dim, 600, "center", f); return; }
    if (sc.id === "random") { const fi = fr(t, sc.t0, RAND_FR), d = dropsAtFrame(fi); grid(ctx, RSNAP[fi], RW, 120, 170, 860, "r"); histogram(ctx, d, 1120, 420, 680, 420);
      let last = 0; for (let j = d - 1; j >= 0 && j > d - 200; j--) if (RUN.sizes[j] > 0) { last = RUN.sizes[j]; break; }
      D.text(ctx, fmt(d) + " grains dropped", 1120, 230, 46, C.text, 700, "left"); D.text(ctx, "last avalanche: " + fmt(last) + " topplings", 1120, 290, 32, C.amber, 700, "left");
      const st = stats(); D.text(ctx, d < 400 ? "Drop grains at random spots…" : d < 12000 ? "Most grains do nothing. Then, now and then, a huge avalanche." : "Half of the avalanches are under " + st.median + " topplings; 1 in 100 is over " + fmt(Math.round(st.p99 / 100) * 100) + ".", W / 2, 80, 46, C.text, 700, "center", f); return; }
    if (sc.id === "centre") { const fi = fr(t, sc.t0, CENT_FR), n = grainsAtFrame(fi); grid(ctx, CSNAP[fi], CW, 520, 170, 880, "c");
      D.text(ctx, fmt(n) + " grains", 1780, 980, 52, C.amber, 700, "right"); D.text(ctx, "all dropped on the centre square", 1780, 1036, 26, C.dim, 600, "right");
      D.text(ctx, "Now pour every grain onto one square.", W / 2, 80, 56, C.text, 700, "center", f); }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .04 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: one note per avalanche (at most ten a second; bigger avalanches are lower and louder) and a chord at each doubling of the centre pile
  function avalancheNotes(t0, dropsAt, frames, tmax) { const ev = []; let last = -1, d = 0;
    for (let f = 0; f <= frames; f++) { const target = dropsAt(f), t = t0 + f / FPS; if (t > tmax) break; let big = 0; while (d < target) { big = Math.max(big, RUN.sizes[d]); d++; }
      if (big > 0 && t - last >= .1) { const l = Math.log2(big); ev.push({ t, k: Math.max(0, 15 - Math.round(l)), gain: .3 + .5 * Math.min(1, l / 14) }); last = t; } } return ev; }
  function doublingNotes(t0, grainsAt, frames, tmax) { const ev = []; let next = 1024;
    for (let f = 0; f <= frames && next <= CMAX; f++) { const t = t0 + f / FPS; if (t > tmax) break; if (grainsAt(f) >= next) { const k = Math.round(Math.log2(next)) - 8; ev.push({ t, k, gain: .55 }, { t, k: k + 4, gain: .45 }); next *= 2; } } return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 8 }, ...[0, 1, 2, 3, 4].map((i) => ({ t: s.rules.t0 + .5 + i * 1.6, k: 4 + i * 2, gain: .5 })), ...RULE_WAVES.slice(1).map((_, i) => ({ t: s.rules.t0 + 3 + (i + 1) * 1.1, k: 12 - i, gain: .45 })).filter((e) => e.t < s.rules.t1),
      ...avalancheNotes(s.random.t0, dropsAtFrame, RAND_FR, s.random.t1 - .2), ...doublingNotes(s.centre.t0, grainsAtFrame, CENT_FR, s.centre.t1 - .2), { t: s.close.t0 + .3, k: 6 }]; }

  // ---------- Shorts ----------
  const s1Drops = (f) => Math.min(RDROPS, Math.round(RDROPS * Math.pow(f / (S1_FR - 45), 2.5))), s2Grains = (f) => Math.min(CMAX, Math.round(CMAX * Math.pow(f / (S2_FR - 45), 2)));
  function s1(ctx, t) { const fi = fr(t, 1.5, S1_FR), d = s1Drops(fi); grid(ctx, S1SNAP[fi], RW, 40, 380, 1000, "s1"); histogram(ctx, d, 110, 1480, 860, 260, 1.1);
    D.lines(ctx, ["Same grain of sand.", "Any size avalanche."], 540, 150, 74, C.text, 1); D.text(ctx, fmt(d) + " grains dropped at random", 540, 320, 34, C.amber, 600); }
  function s2(ctx, t) { const fi = fr(t, 1.5, S2_FR), n = s2Grains(fi); grid(ctx, S2SNAP[fi], CW, 40, 480, 1000, "s2");
    D.lines(ctx, ["Pour sand on one", "square. Watch."], 540, 160, 76, C.text, 1); D.text(ctx, fmt(n) + " grains", 540, 1580, 64, C.amber, 700); D.text(ctx, "one rule: 4 grains topple to the neighbours", 540, 1660, 32, C.dim, 600); }
  const timelines = [
    { id: "full", name: "21 Sandpile (long)", file: "Command Loom - 21 Sandpile.mp4", W: 1920, H: 1080, dur: 96, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Any size avalanche", file: "Command Loom - Short 1 - Any Size Avalanche.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .04 * t / 30), voice: "marimba",
      events: () => avalancheNotes(1.5, s1Drops, S1_FR, 29.3) },
    { id: "s2", name: "Short 2 · Pour sand on one square", file: "Command Loom - Short 2 - One Square of Sand.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "marimba",
      events: () => doublingNotes(1.5, s2Grains, S2_FR, 29.3) }
  ];
  root.CLVideo = { title: "Command Loom · 21 Sandpile", timelines, ready };
  root.SandVideo = { stats, S, RW, RDROPS, CW, CMAX, get RUN() { return RUN; }, RULE_WAVES, timelines, ready, dropsAtFrame, grainsAtFrame, RAND_FR, CENT_FR };
})(typeof window !== "undefined" ? window : globalThis);
