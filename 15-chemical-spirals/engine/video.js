// 15 Chemical Spirals: waves in an excitable medium (bz.js, Barkley model), the kind of waves the Belousov–Zhabotinsky reaction makes.
// Every frame is the simulation itself. It is computed once at load, in small chunks, keeping a full copy every 30 frames
// so any frame can be rebuilt quickly; turn counts and the active share are measured during that run.
(function (root) {
  "use strict";
  const B = root.BZ, D = root.CLDraw, FPS = 30;
  const C = { bg: "#07080C", text: "#F5F3EF", dim: "#9AA6B8", blue: "#5CC8FF", orange: "#F08A4B" };
  const yieldNow = () => new Promise((r) => { if (typeof MessageChannel === "undefined") return r(); const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); r(); }; ch.port2.postMessage(0); });
  const fmt1 = (v) => v.toFixed(1);
  // ---------- schedules ----------
  const S = [["hook", 0, 4], ["rings", 4, 30], ["spiral", 30, 64], ["many", 64, 88], ["close", 88, 98]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const len = (id) => { const s = S.find((x) => x.id === id); return Math.round((s.t1 - s.t0) * FPS); };
  // a broken piece of wave: an excited strip with recovering medium on one side, so it can only travel one way
  function segment(m, cx, cy, ang, L) { const W = m.W, H = m.H, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    for (let s = -L / 2; s <= L / 2; s += .5) for (let o = -1; o <= 8; o += .5) { const x = Math.round(cx + dx * s + nx * o), y = Math.round(cy + dy * s + ny * o);
      if (x < 0 || y < 0 || x >= W || y >= H) continue; const i = y * W + x; if (o <= 1) m.u[i] = 1; else m.v[i] = Math.max(m.v[i], .6); } }
  function scatter(m, n, seed) { const r = B.rng(seed); for (let k = 0; k < n; k++) segment(m, 24 + r() * (m.W - 48), 24 + r() * (m.H - 48), r() * Math.PI * 2, 20 + r() * 16); }
  // ---------- tracks (one simulation each) ----------
  const LW = 320, LH = 180, VW = 180, VH = 252, BREAK_F = 150;
  // rain of drops: a ring at the centre, then a new trigger every 40 frames at a random spot (seeded); a trigger landing on recovering medium does nothing
  const DROPS = (() => { const r = B.rng(5), act = {}; for (let f = 75; f < len("rings") - 75; f += 40) { const x = Math.round(24 + r() * (LW - 48)), y = Math.round(20 + r() * (LH - 40)); act[f] = (m) => m.stimulate(x, y, 3); } return act; })();
  // listening dots: a grid over the dish; each plays a note when a wave front reaches it (higher notes near the top, panned by position)
  const grid = (W, H, nx, ny) => Array.from({ length: nx * ny }, (_, i) => [Math.round((i % nx + .5) * W / nx), Math.round((Math.floor(i / nx) + .5) * H / ny)]);
  const T = {
    rings:   { W: LW, H: LH, frames: len("rings"), spf: 4, init: (m) => m.stimulate(160, 90, 3), act: DROPS, probes: [] },
    // the next two are only measured (by the tests), as clean single cases of what the rain of drops shows
    ring:    { W: LW, H: LH, frames: 420, spf: 4, init: (m) => m.stimulate(160, 90, 3), act: {}, probes: Array.from({ length: 12 }, (_, k) => [172 + 12 * k, 90]), keys: Array.from({ length: 12 }, (_, k) => 13 - k) },
    collide: { W: LW, H: LH, frames: 360, spf: 4, init: (m) => m.stimulate(96, 100, 3), act: { 45: (m) => m.stimulate(236, 66, 3) }, probes: Array.from({ length: 9 }, (_, k) => [Math.round(96 + 14 * (k + 1)), Math.round(100 - 3.4 * (k + 1))]), keys: [3, 4, 5, 6, 7, 8, 9, 10, 11] },
    spiral:  { W: LW, H: LH, frames: len("spiral") + 4 * FPS, spf: 4, init: (m) => m.stimulate(160, 90, 3), act: { [BREAK_F]: (m) => m.erase((x, y) => y > 90) }, probes: [[96, 140], [224, 140]] },
    many:    { W: LW, H: LH, frames: len("many") + len("close"), spf: 4, init: (m) => scatter(m, 8, 22), act: {}, probes: [[40, 30], [120, 150], [200, 40], [280, 140], [160, 90]] },
    s1:      { W: VW, H: VH, frames: 28 * FPS, spf: 4, init: (m) => m.stimulate(90, 126, 3), act: { [BREAK_F]: (m) => m.erase((x, y) => x > 90) }, probes: [[40, 60], [40, 192]] },
    s2:      { W: VW, H: VH, frames: 28 * FPS, spf: 4, init: (m) => scatter(m, 6, 7), act: {}, probes: [[30, 40], [150, 60], [90, 126], [30, 210], [150, 220]] }
  };
  for (const tr of Object.values(T)) tr.listen = tr.W > tr.H ? grid(tr.W, tr.H, 12, 7) : grid(tr.W, tr.H, 7, 10);
  async function build(tr) {
    const m = new B.Medium(tr.W, tr.H); tr.init(m); tr.cps = [m.clone()]; tr.active = new Float32Array(tr.frames + 1); tr.active[0] = m.excited();
    tr.fire = tr.probes.map(() => []); const last = tr.probes.map(([x, y]) => m.u[y * tr.W + x]);
    tr.lfire = tr.listen.map(() => []); const llast = tr.listen.map(([x, y]) => m.u[y * tr.W + x]);
    for (let f = 1; f <= tr.frames; f++) {
      for (let s = 0; s < tr.spf; s++) { m.step(1); tr.probes.forEach(([x, y], j) => { const u = m.u[y * tr.W + x]; if (u > .5 && last[j] <= .5) tr.fire[j].push(f); last[j] = u; });
        tr.listen.forEach(([x, y], j) => { const u = m.u[y * tr.W + x]; if (u > .5 && llast[j] <= .5 && tr.lfire[j][tr.lfire[j].length - 1] !== f) tr.lfire[j].push(f); llast[j] = u; }); }
      if (tr.act[f]) tr.act[f](m);
      tr.active[f] = m.excited(); if (f % 30 === 0) tr.cps.push(m.clone()); if (f % 4 === 0) await yieldNow();
    }
    tr.cur = m.clone(); tr.curF = tr.frames;
  }
  // the medium at frame f, rebuilt from the nearest copy (cheap when frames are asked for in order)
  function state(tr, f) { f = Math.max(0, Math.min(tr.frames, f));
    if (!(tr.curF <= f && f - tr.curF < 60)) { const c = Math.floor(f / 30); tr.cur.copyFrom(tr.cps[c]); tr.curF = c * 30; }
    while (tr.curF < f) { tr.cur.step(tr.spf); tr.curF++; if (tr.act[tr.curF]) tr.act[tr.curF](tr.cur); }
    return tr.cur; }
  const turnsBy = (tr, j, f) => { let n = 0; for (const g of tr.fire[j]) if (g <= f) n++; return n; };
  function period(tr, j) { const g = tr.fire[j].slice(-8), d = []; for (let i = 1; i < g.length; i++) d.push(g[i] - g[i - 1]); return d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0; }   // frames per turn, from the last firings
  const ready = (async () => { for (const k of Object.keys(T)) await build(T[k]); })();

  // ---------- drawing ----------
  // colour: resting medium orange-red (like the ferroin-indicator dish), the excited front bright blue, the recovering trail fading slate
  const LUT = new Uint8Array(64 * 64 * 3);
  for (let a = 0; a < 64; a++) for (let b = 0; b < 64; b++) { const u = a / 63, v = b / 63, i = (a * 64 + b) * 3;
    LUT[i] = Math.max(0, Math.min(255, 196 * (1 - u) * (1 - .62 * v) + 70 * u * u)); LUT[i + 1] = Math.max(0, Math.min(255, 68 * (1 - u) + 58 * v * (1 - u) + 200 * u)); LUT[i + 2] = Math.max(0, Math.min(255, 42 + 120 * v * (1 - u) + 213 * u)); }
  const cvs = {};
  function field(ctx, m, x0, y0, w, h, key) {
    const c = cvs[key] || (cvs[key] = document.createElement("canvas")); if (c.width !== m.W) { c.width = m.W; c.height = m.H; }
    const g = c.getContext("2d"), img = g.createImageData(m.W, m.H), px = img.data, u = m.u, v = m.v;
    for (let i = 0; i < u.length; i++) { const a = Math.round(u[i] * 63), b = Math.min(63, Math.round(v[i] / .75 * 63)), l = (a * 64 + b) * 3; px[i * 4] = LUT[l]; px[i * 4 + 1] = LUT[l + 1]; px[i * 4 + 2] = LUT[l + 2]; px[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(c, x0, y0, w, h);
    ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, w, h);
  }
  // the listening dots, flashing white for a moment when a wave front passes
  function dots(ctx, tr, f, x0, y0, w, h, k = 1) { ctx.save();
    tr.listen.forEach(([x, y], j) => { const fs = tr.lfire[j]; let last = -1e9; for (let i = fs.length - 1; i >= 0; i--) if (fs[i] <= f) { last = fs[i]; break; }
      const age = (f - last) / FPS, px = x0 + (x + .5) / tr.W * w, py = y0 + (y + .5) / tr.H * h;
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(px, py, 3.5 * k, 0, 7); ctx.fill();
      if (age < .5) { const a = 1 - age / .5; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(px, py, (5 + 6 * a) * k, 0, 7); ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${a * .7})`; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(px, py, (8 + 30 * (1 - a)) * k, 0, 7); ctx.stroke(); } });
    ctx.restore(); }
  function legend(ctx, x, y, k, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(7,8,12,.72)"; ctx.fillRect(x, y, 430 * k, 172 * k);
    [["excited: reacting now", [70, 200, 255]], ["recovering: cannot react yet", [80, 120, 150]], ["ready: waiting for a wave", [196, 68, 42]]].forEach(([s, col], i) => {
      ctx.fillStyle = `rgb(${col})`; ctx.fillRect(x + 22 * k, y + (24 + i * 48) * k, 30 * k, 30 * k); D.text(ctx, s, x + 70 * k, y + (40 + i * 48) * k, 26 * k, C.text, 600, "left", a); });
    ctx.restore(); }
  function badge(ctx, s, x, y, size, col, a = 1, align = "right") { ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${size}px Bahnschrift, "Segoe UI", sans-serif`; const w = ctx.measureText(s).width + size;
    ctx.fillStyle = "rgba(7,8,12,.72)"; ctx.fillRect(align === "right" ? x - w : x, y - size * .85, w, size * 1.6); ctx.restore(); D.text(ctx, s, align === "right" ? x - size / 2 : x + size / 2, y, size, col, 700, align, a); }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const fr = (t, t0) => Math.max(0, Math.round((t - t0) * FPS));
  const GX = 200, GY = 165, GW = 1520, GH = 855;

  // ---------- long video ----------
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1), note = "simulated · Barkley model of an excitable medium · not real time";
    if (sc.id === "hook") { const tr = T.spiral, fh = tr.frames - 4 * FPS + fr(t, 0); field(ctx, state(tr, fh), GX, GY, GW, GH, "L"); dots(ctx, tr, fh, GX, GY, GW, GH);
      D.text(ctx, "A chemical reaction that draws spirals by itself.", W / 2, 80, 58, C.text, 700); D.text(ctx, note, W / 2, 1052, 24, C.dim, 500); return; }
    if (sc.id === "rings") { const tr = T.rings, fi = fr(t, sc.t0); field(ctx, state(tr, fi), GX, GY, GW, GH, "L"); dots(ctx, tr, fi, GX, GY, GW, GH); legend(ctx, GX + 24, GY + 24, 1, D.clamp((u - 1) / .6) * D.clamp((7 - u) / .5));
      D.text(ctx, u < 4 ? "Trigger one spot. A ring of reaction spreads out." : u < 13 ? "More drops. Where two rings meet, both vanish." : "Behind each ring the dish must recover, so rings never turn back.", W / 2, 80, 50, C.text, 700, "center", f);
      D.text(ctx, "white dots: each plays a note when a wave reaches it · " + note, W / 2, 1052, 24, C.dim, 500, "center", f); return; }
    if (sc.id === "spiral") { const tr = T.spiral, fi = fr(t, sc.t0); field(ctx, state(tr, fi), GX, GY, GW, GH, "L"); dots(ctx, tr, fi, GX, GY, GW, GH);
      if (fi >= BREAK_F - 20 && fi < BREAK_F) { const p = (fi - BREAK_F + 20) / 20; ctx.fillStyle = `rgba(245,243,239,${.35 * p})`; ctx.fillRect(GX, GY + GH / 2, GW, GH / 2); }
      const n1 = turnsBy(tr, 0, fi), n2 = turnsBy(tr, 1, fi), per = period(tr, 1) / FPS;
      if (fi > BREAK_F + 60) { badge(ctx, "left spiral: " + n1 + (n1 === 1 ? " turn" : " turns"), GX + 24, GY + 60, 30, C.blue, f, "left"); badge(ctx, "right spiral: " + n2 + (n2 === 1 ? " turn" : " turns"), GX + GW - 24, GY + 60, 30, C.blue, f); }
      D.text(ctx, fi < BREAK_F ? "Now wipe out the lower half of the ring…" : fi < BREAK_F + 120 ? "Each broken end curls inward." : "Two spirals, turning in opposite directions, on and on.", W / 2, 80, 52, C.text, 700, "center", f);
      D.text(ctx, fi > BREAK_F + 300 ? "one turn every " + per.toFixed(1) + " s on screen (measured) · " + note : note, W / 2, 1052, 24, C.dim, 500, "center", f); return; }
    const tr = T.many, fi = fr(t, S[3].t0); field(ctx, state(tr, fi), GX, GY, GW, GH, "L"); dots(ctx, tr, fi, GX, GY, GW, GH);
    if (sc.id === "many") { D.text(ctx, u < 4 ? "Break many waves at once…" : "…and the dish fills with spirals.", W / 2, 80, 54, C.text, 700, "center", f);
      D.text(ctx, "8 broken wave pieces at random spots (seeded) · " + note, W / 2, 1052, 24, C.dim, 500, "center", f); return; }
    D.text(ctx, "Real Belousov–Zhabotinsky dishes make these same spirals.", W / 2, 80, 50, C.text, 700, "center", f);
    D.text(ctx, "Here: a simplified model of an excitable medium (Barkley, 1991), not the full chemistry", W / 2, 1052, 24, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .035 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // the listening grid: every wave front reaching a dot is a note (at most two notes per 1/16 s, so a front sweeping a whole row is a quick run, not a crash)
  function listenNotes(tr, t0, tmax, f0 = 0) { const all = []; tr.lfire.forEach((fs, j) => { for (const g of fs) { const t = t0 + (g - f0) / FPS; if (t >= Math.max(0, t0) && t < tmax) all.push([t, j]); } });
    all.sort((a, b) => a[0] - b[0]); const ev = []; let win = -1, n = 0;
    for (const [t, j] of all) { const w = Math.floor(t * 16); if (w !== win) { win = w; n = 0; } if (n >= 2) continue; n++; const [x, y] = tr.listen[j];
      ev.push({ t, k: Math.round(2 + 11 * (1 - y / tr.H)), side: x / tr.W * 1.2 - .6, gain: .38 }); }
    return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), hf = T.spiral.frames - 4 * FPS;
    return [...listenNotes(T.spiral, -hf / FPS, s.hook.t1 - .1).filter((e) => e.t >= .05), { t: .1, k: 10, voice: "bell", gain: .5 },
      { t: s.rings.t0 + .05, k: 10, voice: "bell", gain: .6 }, ...Object.keys(DROPS).map((f) => ({ t: s.rings.t0 + f / FPS, k: 12, voice: "wood", gain: .5 })), ...listenNotes(T.rings, s.rings.t0, s.rings.t1 - .1),
      { t: s.spiral.t0 + .05, k: 10, voice: "bell", gain: .6 }, { t: s.spiral.t0 + BREAK_F / FPS, k: 3, voice: "bell", gain: .6 }, ...listenNotes(T.spiral, s.spiral.t0, s.spiral.t1 - .2),
      { t: s.many.t0 + .05, k: 7, voice: "bell", gain: .6 }, ...listenNotes(T.many, s.many.t0, s.close.t1 - .7)]; }

  // ---------- Shorts ----------
  const SX = 40, SY = 380, SWd = 1000, SHt = 1400;
  function s1(ctx, t) { const tr = T.s1, fi = fr(t, 1); field(ctx, state(tr, fi), SX, SY, SWd, SHt, "V"); dots(ctx, tr, fi, SX, SY, SWd, SHt, 1.2);
    if (fi >= BREAK_F - 20 && fi < BREAK_F) { const p = (fi - BREAK_F + 20) / 20; ctx.fillStyle = `rgba(245,243,239,${.35 * p})`; ctx.fillRect(SX + SWd / 2, SY, SWd / 2, SHt); }
    D.lines(ctx, fi < BREAK_F ? ["A ring of chemical", "reaction spreads."] : fi < BREAK_F + 100 ? ["Break it…"] : ["…and it turns into", "two spirals."], 540, 160, 72, C.text, 1);
    D.text(ctx, fi > BREAK_F + 60 ? "turns so far: " + turnsBy(tr, 0, fi) + " and " + turnsBy(tr, 1, fi) : "simulated excitable medium · not real time", 540, 330, 34, C.blue, 600);
    D.text(ctx, "Barkley model · the waves of the Belousov–Zhabotinsky reaction", 540, 1840, 28, C.dim, 600); }
  function s2(ctx, t) { const tr = T.s2, fi = fr(t, 1); field(ctx, state(tr, fi), SX, SY, SWd, SHt, "V"); dots(ctx, tr, fi, SX, SY, SWd, SHt, 1.2);
    D.lines(ctx, fi < 120 ? ["6 broken waves", "in a chemical dish…"] : ["…become a dish", "full of spirals."], 540, 160, 72, C.text, 1);
    D.text(ctx, "active: " + fmt1(tr.active[Math.min(fi, tr.frames)] * 100) + "% of the dish", 540, 330, 34, C.blue, 600);
    D.text(ctx, "simulated · Barkley model of an excitable medium", 540, 1840, 28, C.dim, 600); }
  const timelines = [
    { id: "full", name: "15 Chemical Spirals (long)", file: "Command Loom - 15 Chemical Spirals.mp4", W: 1920, H: 1080, dur: 98, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Break a wave, get a spiral", file: "Command Loom - Short 1 - Break a Wave.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .04 * t / 30), voice: "glass",
      events: () => [{ t: .3, k: 7, voice: "bell", gain: .5 }, { t: 1.05, k: 10, gain: .6 }, { t: 1 + BREAK_F / FPS, k: 3, voice: "bell", gain: .6 }, ...listenNotes(T.s1, 1, 29.3)] },
    { id: "s2", name: "Short 2 · A dish full of spirals", file: "Command Loom - Short 2 - Dish of Spirals.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "glass",
      events: () => [{ t: .3, k: 7, voice: "bell", gain: .5 }, ...listenNotes(T.s2, 1, 29.3)] }
  ];
  root.CLVideo = { title: "Command Loom · 15 Chemical Spirals", timelines, ready };
  root.BZVideo = { S, T, BREAK_F, DROPS, timelines, ready, state, turnsBy, period };
})(typeof window !== "undefined" ? window : globalThis);
