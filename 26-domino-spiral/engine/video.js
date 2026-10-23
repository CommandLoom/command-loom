// 26 Domino Spiral: 10, 100, 1,000 and 10,000 dominoes seen from above, on a line and on spirals, then 450 in a winding heart (domino.js).
// Speeds are labelled; the counter shows how many have fallen.
(function (root) {
  "use strict";
  const DM = root.Domino, D = root.CLDraw, FPS = 30;
  const C = { bg: "#0B0D12", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", green: "#5BE38C" };
  const M = DM.make({ kappa: 0.9 }), P = M.P;
  // ---------- layouts: positions and fall directions along a path, one domino every d metres ----------
  function along(path, n) {                                   // path(s) → [x, y], s in metres along the path (dense sampling)
    const pos = [], dir = []; for (let i = 0; i < n; i++) { const s = i * P.d, a = path(s), b = path(s + 1e-4); const l = Math.hypot(b[0] - a[0], b[1] - a[1]); pos.push(a); dir.push([(b[0] - a[0]) / l, (b[1] - a[1]) / l]); } return { pos, dir, n };
  }
  function spiralPath(r0, pitch) {                           // Archimedean spiral r = r0 + pitch·φ/2π, parametrised by arc length (table)
    const tab = [[0, 0]]; let s = 0, ph = 0; const dph = 0.002;
    return (S) => { while (tab[tab.length - 1][0] < S) { const r = r0 + pitch * ph / (2 * Math.PI), r2 = r0 + pitch * (ph + dph) / (2 * Math.PI); s += Math.hypot(r2 * Math.cos(ph + dph) - r * Math.cos(ph), r2 * Math.sin(ph + dph) - r * Math.sin(ph)); ph += dph; tab.push([s, ph]); }
      let lo = 0, hi = tab.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] <= S) lo = m; else hi = m; } const [s0, p0] = tab[lo], [s1, p1] = tab[hi], ph2 = p0 + (p1 - p0) * (S - s0) / ((s1 - s0) || 1), r = r0 + pitch * ph2 / (2 * Math.PI);
      return [r * Math.cos(ph2), r * Math.sin(ph2)]; };
  }
  function heartPath(s0, turns = 4, shrink = .6) {             // a heart curve that winds inwards (4 turns), from the outer bottom tip, by arc length
    const sc = (u) => s0 * (1 - shrink * (u - Math.PI) / (2 * Math.PI * turns));
    const f = (u) => [16 * Math.pow(Math.sin(u), 3) * sc(u), (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * sc(u)];
    const tab = [[0, Math.PI]]; let s = 0, u = Math.PI; const du = 2e-4, uEnd = Math.PI + 2 * Math.PI * turns;
    while (u < uEnd) { const a = f(u), b = f(u + du); s += Math.hypot(b[0] - a[0], b[1] - a[1]); u += du; tab.push([s, u]); }
    const L = s; return { L, path: (S) => { S = Math.min(S, L); let lo = 0, hi = tab.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] <= S) lo = m; else hi = m; } const [s0, u0] = tab[lo], [s1, u1] = tab[hi]; return f(u0 + (u1 - u0) * (S - s0) / ((s1 - s0) || 1)); } };
  }
  // any closed curve f(u) (u from 0 to 2π) wound inwards over several turns, shrinking from scale s0 by `shrink`, parametrised by arc length
  function windPath(f, s0, turns, shrink, u0 = 0) {
    const sc = (u) => s0 * (1 - shrink * (u - u0) / (2 * Math.PI * turns)), g = (u) => { const p = f(u); return [p[0] * sc(u), p[1] * sc(u)]; };
    const tab = [[0, u0]]; let s = 0, u = u0; const du = 2e-4, uEnd = u0 + 2 * Math.PI * turns;
    while (u < uEnd) { const a = g(u), b = g(u + du); s += Math.hypot(b[0] - a[0], b[1] - a[1]); u += du; tab.push([s, u]); }
    return { L: s, path: (S) => { S = Math.min(S, s); let lo = 0, hi = tab.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] <= S) lo = m; else hi = m; } const [s1, u1] = tab[lo], [s2, u2] = tab[hi]; return g(u1 + (u2 - u1) * (S - s1) / ((s2 - s1) || 1)); } };
  }
  const flowerF = (u) => { const r = 1 + .26 * Math.cos(6 * u); return [r * Math.cos(u + Math.PI / 2), r * Math.sin(u + Math.PI / 2)]; };       // six petals
  const heartF = (u) => [16 * Math.pow(Math.sin(u), 3) / 17, (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) / 17];
  const sized = (f, n, turns, shrink, u0) => windPath(f, n * P.d / windPath(f, 1, turns, shrink, u0).L * 1.001, turns, shrink, u0);   // sized so n dominoes fill it
  const BIG_N = 3000, FLOWER = sized(flowerF, BIG_N, 12, .65, 0), BIGHEART = sized(heartF, BIG_N, 6, .62, Math.PI);
  const HEART_N = 450, HEART = heartPath(HEART_N * P.d / heartPath(1).L * 1.001);   // sized so 450 dominoes fill the winding heart
  const LAYOUTS = {
    10: () => along((s) => [s - 4.5 * P.d, 0], 10),
    100: () => along(spiralPath(0.07, 0.045), 100),
    1000: () => along(spiralPath(0.08, 0.045), 1000),
    10000: () => along(spiralPath(0.1, 0.045), 10000),
    heart: () => along(HEART.path, HEART_N),
    flower: () => along(FLOWER.path, BIG_N),
    bigheart: () => along(BIGHEART.path, BIG_N)
  };
  const lay = {}, chains = {}, L = (k) => lay[k] || (lay[k] = LAYOUTS[k]()), CH = (k) => chains[k] || (chains[k] = M.chain(L(k).n));
  const fallen = (k, t) => { const c = CH(k); let lo = 0, hi = c.n; while (lo < hi) { const m = (lo + hi) >> 1; if (c.t0[m] + c.T[m] <= t) lo = m + 1; else hi = m; } return lo; };
  const hsl = (h, l) => `hsl(${Math.round(((h % 1) + 1) % 1 * 360)},85%,${l}%)`;
  // draw layout k at model time t: cx, cy centre, s px per metre
  function field(ctx, k, t, cx, cy, s) {
    const Ly = L(k), c = CH(k), n = Ly.n, w = P.w * s / 2;
    for (let i = 0; i < n; i++) {
      // footprint seen from above, along the fall direction: from the lifted back edge to the top front corner (pivot at x = t/2)
      const th = M.angle(c, i, t), [x, y] = Ly.pos[i], [ux, uy] = Ly.dir[i], a0 = (P.t / 2 - P.t * Math.cos(th)) * s, a1 = (P.t / 2 + P.h * Math.sin(th)) * s, px = cx + x * s, py = cy - y * s;
      ctx.setTransform(ux, -uy, uy, ux, px, py);              // local frame: +x along the fall direction (screen y flipped)
      const lit = 38 + 30 * (th / (Math.PI / 2));
      ctx.fillStyle = hsl(i / n * .85, lit); ctx.fillRect(a0, -w, Math.max(1.2, a1 - a0), 2 * w);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return fallen(k, t);
  }
  const fmt = (n) => n.toLocaleString("en-US"), mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  // ---------- long video ----------
  // [layout, start, end, speed (video seconds → model seconds), px per metre]
  const S = [["hook", 0, 4], ["10", 4, 10], ["100", 10, 20], ["1000", 20, 41], ["10000", 41, 81], ["heart", 81, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const SPEED = { hook: 10, 10: .25, 100: .5, 1000: 2, 10000: 10, heart: 1 }, SCALE = { 10: 2600, 100: 1700, 1000: 580, 10000: 195, heart: 500 };
  const speedLabel = (v) => v === 1 ? "real time" : v < 1 ? `${1 / v}× slower` : `${v}× faster`;
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const foot = "rigid dominoes 4.8 × 2.4 × 0.75 cm, 3.6 cm apart · each passes on 90% of its spin (a model choice)";
  // field() uses setTransform, so the camera push is applied by scaling inside the layout instead
  function inner(ctx, t, z) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const tm = CH("10000").t0[9999] - 4 * 10 + u * 10, n = field(ctx, "10000", tm, 960, 575, SCALE[10000] * z);
      D.text(ctx, "10,000 dominoes.", W / 2, 70, 66, C.text, 700); D.text(ctx, `${fmt(n)} fallen`, 1700, 980, 46, C.amber, 700, "right"); D.speed(ctx, speedLabel(10), W); return; }
    const k = sc.id, v = SPEED[k], tm = Math.max(0, u - .4) * v, n = field(ctx, k, tm, 960, k === "10" ? 600 : k === "heart" ? 495 : 575, SCALE[k] * z), N = L(k).n;
    D.text(ctx, k === "heart" ? `${fmt(N)} dominoes in a heart` : `${fmt(N)} dominoes`, W / 2, 70, 64, C.text, 700, "center", f);
    D.text(ctx, `${fmt(n)} fallen · ${mmss(tm)} of real time`, W / 2, 138, 34, n === N ? C.green : C.amber, 600, "center", f);
    D.speed(ctx, speedLabel(v), W); D.text(ctx, foot, W / 2, 1050, 22, C.dim, 500, "center", f);
  }
  function drawFull(ctx, t) { const sc = sceneAt(t), z = 1 + .04 * (t - sc.t0) / (sc.t1 - sc.t0); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1920, 1080); inner(ctx, t, z); }

  // ---------- sound: a wooden tick each time a domino hits the next one (at most 3 per frame), pitch through the colours ----------
  function ticks(k, t0, a, b, v, side = 0, gain = 1) {
    const c = CH(k), ev = [], seen = new Map();
    for (let i = 0; i < c.n; i++) { const th = c.t0[i] + c.T[i]; if (th < a || th >= b) continue; const tv = t0 + (th - a) / v, fr = Math.floor(tv * FPS), cnt = seen.get(fr) || 0; if (cnt >= 3) continue; seen.set(fr, cnt + 1);
      ev.push({ t: tv, k: Math.round((i / c.n) * 15), side, gain: gain * .9 }); }
    return ev; }
  function fullEvents() { const hk = CH("10000").t0[9999] - 40, ev = [...ticks("10000", 0, hk, hk + 39, 10)];
    for (const sc of S.slice(1)) { const v = SPEED[sc.id]; ev.push(...ticks(sc.id, sc.t0 + .4, 0, (sc.t1 - sc.t0 - .5) * v, v)); }
    return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  function vert(ctx, k, tm, v, title, sc) { const n = field(ctx, k, tm, 540, 1030, sc), N = L(k).n;
    D.lines(ctx, title, 540, 150, 76, C.text, 1); D.text(ctx, `${fmt(n)} / ${fmt(N)} fallen`, 540, 1680, 54, n === N ? C.green : C.amber, 700);
    D.text(ctx, speedLabel(v) + " · rigid dominoes, simplified hand-over", 540, 1760, 30, C.dim, 600); }
  const S1V = 1.4;                                            // Short 1: 1,000 dominoes at 1.4× real speed
  const s1 = (ctx, t) => { const z = 1 + .03 * t / 31; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, VW, VH); vert(ctx, "1000", Math.max(0, t - .4) * S1V, S1V, ["1,000 dominoes", "in a spiral."], 700 * z); };
  const S2V = 14;                                             // Short 2: 10,000 dominoes at 14× real speed
  const s2 = (ctx, t) => { const z = 1 + .03 * t / 30; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, VW, VH); vert(ctx, "10000", Math.max(0, t - .4) * S2V, S2V, ["10,000 dominoes.", "Wait for the last one."], 230 * z); };
  // Shorts 3 and 4: 3,000 dominoes in a winding flower and a winding heart, 4× real speed
  const BIGV = 4, big = (k, title, sc, cy, dur) => (ctx, t) => { const z = 1 + .03 * t / dur; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, VW, VH);
    const n = field(ctx, k, Math.max(0, t - .4) * BIGV, 540, cy, sc * z), N = L(k).n;
    D.lines(ctx, title, 540, 150, 76, C.text, 1); D.text(ctx, `${fmt(n)} / ${fmt(N)} fallen`, 540, 1680, 54, n === N ? C.green : C.amber, 700);
    D.text(ctx, speedLabel(BIGV) + " · rigid dominoes, simplified hand-over", 540, 1760, 30, C.dim, 600); };
  const BIG_DUR = 31;
  const timelines = [
    { id: "full", name: "26 Domino Spiral (long)", file: "Command Loom - 26 Domino Spiral.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "wood" },
    { id: "s1", name: "Short 1 · 1,000 Dominoes", file: "Command Loom - Short 1 - 1000 Dominoes.mp4", W: VW, H: VH, dur: 31, draw: s1, voice: "wood", events: () => ticks("1000", .4, 0, 30.2 * S1V, S1V) },
    { id: "s2", name: "Short 2 · 10,000 Dominoes", file: "Command Loom - Short 2 - 10000 Dominoes.mp4", W: VW, H: VH, dur: 30, draw: s2, voice: "wood", events: () => ticks("10000", .4, 0, 29.2 * S2V, S2V) },
    { id: "s3", name: "Short 3 · Domino Flower", file: "Command Loom - Short 3 - Domino Flower.mp4", W: VW, H: VH, dur: BIG_DUR, draw: big("flower", ["3,000 dominoes", "in a flower."], 270, 1000, BIG_DUR), voice: "wood",
      events: () => ticks("flower", .4, 0, (BIG_DUR - .9) * BIGV, BIGV) },
    { id: "s4", name: "Short 4 · Domino Heart", file: "Command Loom - Short 4 - Domino Heart.mp4", W: VW, H: VH, dur: BIG_DUR, draw: big("bigheart", ["3,000 dominoes", "in a heart."], 122, 915, BIG_DUR), voice: "wood",
      events: () => ticks("bigheart", .4, 0, (BIG_DUR - .9) * BIGV, BIGV) }
  ];
  root.CLVideo = { title: "Command Loom · 26 Domino Spiral", timelines, ready: Promise.resolve() };
  root.DominoVideo = { S, SPEED, L, CH, fallen, M, timelines, S1V, S2V, HEART_N, BIG_N, BIGV, BIG_DUR };
})(typeof window !== "undefined" ? window : globalThis);
