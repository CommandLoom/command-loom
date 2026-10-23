// 19 Gravity Ladder: the same ball in the same 1 m ring, dropped from rest, under the surface gravity of the Moon, Mars, Earth,
// Jupiter and the Sun (gravity.js). Shown in real time; every bounce and every counted number comes from the simulation.
(function (root) {
  "use strict";
  const G = root.Gravity, D = root.CLDraw, FPS = 30, R = 1, r = 0.04, X0 = 0.12, Y0 = 0.8;
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", ring: "rgba(210,225,255,.9)" };
  const PL = G.PLANETS.map(([name, g]) => ({ name, g }));
  const sims = {}, sim = (g) => sims[g] || (sims[g] = G.run(g, R, r, X0, Y0, 0, 0, 40));
  // ---------- schedules ----------
  const S = [["hook", 0, 4], ["Moon", 4, 20], ["Mars", 20, 34], ["Earth", 34, 48], ["Jupiter", 48, 62], ["Sun", 62, 84], ["all", 84, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const planet = (name) => PL.find((p) => p.name === name);
  // ---------- drawing ----------
  const hsl = (h, l, a) => `hsla(${Math.round(((h % 1) + 1) % 1 * 360)},92%,${l}%,${a})`;
  function ring(ctx, g, t, cx, cy, s, k, opts = {}) {
    const B = sim(g), i = G.idx(B, t);
    ctx.save(); ctx.strokeStyle = C.ring; ctx.lineWidth = 3 * k; ctx.shadowColor = "rgba(140,190,255,.8)"; ctx.shadowBlur = 12 * k; ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, 7); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let j = 0; j <= i; j++) {                  // every flight so far, one colour per bounce
      const b = B[j], end = j < i ? B[j + 1].t - b.t : t - b.t, n = Math.max(4, Math.ceil(end * 120)), recent = i - j;
      ctx.strokeStyle = hsl(j * 0.061, 60, recent < 2 ? .95 : Math.max(.22, .7 - recent * .01)); ctx.lineWidth = (recent < 2 ? 3.5 : 2) * k; ctx.beginPath();
      for (let q = 0; q <= n; q++) { const s2 = end * q / n, x = b.x + b.vx * s2, y = b.y + b.vy * s2 - 0.5 * g * s2 * s2; q ? ctx.lineTo(cx + x * s, cy - y * s) : ctx.moveTo(cx + x * s, cy - y * s); }
      ctx.stroke();
    }
    ctx.restore();
    const p = G.pos(B, g, t); ctx.save(); ctx.shadowColor = "#fff"; ctx.shadowBlur = 16 * k; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + p[0] * s, cy - p[1] * s, r * s, 0, 7); ctx.fill(); ctx.restore();
    return i;                                          // bounces so far
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const label = (p) => `${p.name} gravity · ${p.g.toFixed(2)} m/s²`;

  // ---------- long video ----------
  const HOOK0 = 10;
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1), foot = "real time · ring 1 m radius · dropped from rest · no energy lost on bounces";
    if (sc.id === "hook") { const sun = planet("Sun"); ring(ctx, sun.g, HOOK0 + u, 960, 600, 420, 1);
      D.text(ctx, "Same ball. Same ring. Wait for the Sun.", W / 2, 72, 58, C.text, 700); D.text(ctx, label(sun), W / 2, 140, 36, C.amber, 700); return; }
    if (sc.id === "all") {
      PL.forEach((p, j) => { const cx = 192 + 384 * j, n = ring(ctx, p.g, u, cx, 560, 165, .6);
        D.text(ctx, p.name, cx, 790, 40, C.text, 700, "center", f); D.text(ctx, `${p.g.toFixed(2)} m/s² · ${n} bounces`, cx, 840, 24, C.amber, 600, "center", f); });
      D.text(ctx, "Same path every time, only faster: time runs as 1/√g.", W / 2, 72, 52, C.text, 700, "center", f);
      D.text(ctx, foot, W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    const p = planet(sc.id), n = ring(ctx, p.g, u, 960, 600, 420, 1);
    D.text(ctx, label(p), W / 2, 72, 60, C.text, 700, "center", f);
    D.text(ctx, `bounces: ${n}`, 1780, 980, 44, C.amber, 700, "right", f);
    D.text(ctx, foot, W / 2, 1050, 24, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: one marimba note per bounce, pitch from where on the ring it lands ----------
  function bounceNotes(g, t0, a, b, side = 0, gain = 1) {
    const ev = [], seen = new Map();
    for (const bb of sim(g).slice(1)) { if (bb.t < a || bb.t >= b) continue; const fr = Math.floor(bb.t * FPS); const c = seen.get(fr) || 0; if (c >= 3) continue; seen.set(fr, c + 1);
      const k = Math.round(((Math.atan2(bb.y, bb.x) / (2 * Math.PI) + 1) % 1) * 15); ev.push({ t: t0 + bb.t - a, k, side, gain: gain * .7 }); }
    return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [...bounceNotes(planet("Sun").g, 0, HOOK0, HOOK0 + 3.9)];
    for (const p of PL) ev.push(...bounceNotes(p.g, s[p.name].t0, 0, s[p.name].t1 - s[p.name].t0 - .05));
    PL.forEach((p, j) => ev.push(...bounceNotes(p.g, s.all.t0, 0, 15.3, (j - 2) * .4, .6)));
    return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  const L1 = [["Moon", 0, 5], ["Mars", 5, 9], ["Earth", 9, 13], ["Jupiter", 13, 18], ["Sun", 18, 30]];
  function s1(ctx, t) { const seg = L1.find((x) => t < x[2]) || L1[L1.length - 1], p = planet(seg[0]), u = t - seg[1], f = D.fade(t, seg[1], seg[2], .2), n = ring(ctx, p.g, u, 540, 1020, 470, 1.15);
    D.lines(ctx, ["Same ball. Same ring.", "Wait for the Sun."], 540, 170, 74, C.text, 1);
    D.text(ctx, p.name, 540, 400, 92, C.amber, 700, "center", f); D.text(ctx, `${p.g.toFixed(2)} m/s² · bounces: ${n}`, 540, 480, 40, C.text, 600, "center", f);
    D.text(ctx, "real time · ring 1 m radius · no energy lost", 540, 1600, 32, C.dim, 600); }
  function s2(ctx, t) { const moon = planet("Moon"), sun = planet("Sun");
    const a = ring(ctx, moon.g, t, 540, 760, 330, 1), b = ring(ctx, sun.g, t, 540, 1470, 330, 1);
    D.lines(ctx, ["Moon vs Sun."], 540, 150, 84, C.text, 1);
    D.text(ctx, `Moon · ${a} bounces`, 540, 380, 46, C.text, 700); D.text(ctx, `Sun · ${b} bounces`, 540, 1840, 46, C.amber, 700);
    D.text(ctx, "same drop, real time · 1 m ring", 540, 270, 32, C.dim, 600); }
  const timelines = [
    { id: "full", name: "19 Gravity Ladder (long)", file: "Command Loom - 19 Gravity Ladder.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Wait for the Sun", file: "Command Loom - Short 1 - Wait for the Sun.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s1, VW, VH, (t) => 1 + .04 * t / 30), voice: "marimba",
      events: () => L1.flatMap(([n, a, b]) => bounceNotes(planet(n).g, a, 0, b - a - .05)).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · Moon vs Sun", file: "Command Loom - Short 2 - Moon vs Sun.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "marimba",
      events: () => [...bounceNotes(planet("Moon").g, 0, 0, 29.3, -.5), ...bounceNotes(planet("Sun").g, 0, 0, 29.3, .5, .7)] }
  ];
  root.CLVideo = { title: "Command Loom · 19 Gravity Ladder", timelines, ready: Promise.resolve() };
  root.GravityVideo = { S, PL, sim, timelines, R, r };
})(typeof window !== "undefined" ? window : globalThis);
