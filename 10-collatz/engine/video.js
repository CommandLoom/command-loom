// 10 Collatz: 27 bounces up and down for 111 steps to reach 1, then the paths of 1 to 10,000 grow into a glowing coral, path by path,
// and finally four corals with different turns grow side by side. Every path, step and peak is computed exactly with collatz.js.
(function (root) {
  "use strict";
  const K = root.Collatz, D = root.CLDraw, FPS = 30;
  const C = { bg: "#04050A", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  const NMAX = 10000;
  // coral turns (a popular way to draw the Collatz paths, not part of the maths): [turn on even, turn on odd] in degrees
  const TURNS = { main: [8.65, -16], a: [5, -9], b: [12, -22], c: [20, -11], d: [-7, 14] };
  let TAB = null, P27 = null, MAXN = 0; const BOX = {}, PTS = {}, CB = {}, R = 2;   // CB: bounding box of paths 1..n; R: offscreen resolution factor
  const yieldNow = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); r(); }; ch.port2.postMessage(0); });
  // path of n drawn backwards from 1: turn by the even angle on even values, by the odd angle on odd values
  function coralPts(n, key) { const [e, o] = TURNS[key], E = e * Math.PI / 180, O = o * Math.PI / 180, p = K.path(n).reverse(); let x = 0, y = 0, a = -Math.PI / 2; const pts = [0, 0];
    for (let i = 1; i < p.length; i++) { a += p[i] % 2 === 0 ? E : O; x += Math.cos(a); y += Math.sin(a); pts.push(x, y); } return pts; }
  const ready = (async () => {
    TAB = K.table(NMAX); P27 = K.path(27); let mx = 0; for (let n = 1; n <= NMAX; n++) if (TAB.st[n] > TAB.st[mx]) mx = n; MAXN = mx;
    for (const key of Object.keys(TURNS)) { const lim = key === "main" ? NMAX : 3000; let x0 = 0, x1 = 0, y0 = 0, y1 = 0; PTS[key] = [null]; const cb = CB[key] = new Float64Array((lim + 1) * 4);
      for (let n = 1; n <= lim; n++) { const p = coralPts(n, key); PTS[key].push(p); for (let i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; }
        cb[n * 4] = x0; cb[n * 4 + 1] = x1; cb[n * 4 + 2] = y0; cb[n * 4 + 3] = y1; if (n % 500 === 0) await yieldNow(); }
      BOX[key] = { x0, x1, y0, y1 }; }
  })();
  const hue = (n) => (0.55 + TAB.st[n] / 262 * .9) % 1;
  // where the coral sits on screen when it is fully grown (all paths fit a size × size square centred at cx, cy)
  function geoOf(key, cx, cy, size) { const b = BOX[key], s = size / Math.max(b.x1 - b.x0, b.y1 - b.y0); return { s, ox: cx - (b.x0 + b.x1) / 2 * s, oy: cy - (b.y0 + b.y1) / 2 * s }; }
  const alphaOf = (m) => Math.min(.85, .1 + 2.2 / Math.sqrt(m)), strokeOf = (m, k = 1) => `hsla(${Math.round(hue(m) * 360)},90%,60%,${(alphaOf(m) * k).toFixed(3)})`, widthOf = (m) => m < 200 ? 2.2 : 1.2;
  // each path is drawn twice: a wide faint glow, then the bright core
  function path(g, p, geo) { g.beginPath(); for (let i = 0; i < p.length; i += 2) i ? g.lineTo(geo.ox + p[i] * geo.s, geo.oy + p[i + 1] * geo.s) : g.moveTo(geo.ox + p[i] * geo.s, geo.oy + p[i + 1] * geo.s); }
  // incremental coral on an offscreen canvas (paths 1..n, R× resolution), restarted only if asked to go back
  const layers = {};
  function coral(id, key, W, H, geo, n) {
    const L = layers[id] || (layers[id] = { c: null, n: 0 });
    if (!L.c || L.n > n) { L.c = document.createElement("canvas"); L.c.width = W * R; L.c.height = H * R; L.n = 0; L.c.getContext("2d").scale(R, R); }
    const g = L.c.getContext("2d"); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.lineJoin = "round";
    for (let m = L.n + 1; m <= n; m++) { path(g, PTS[key][m], geo); g.strokeStyle = strokeOf(m, .22); g.lineWidth = widthOf(m) * 4; g.stroke(); g.strokeStyle = strokeOf(m); g.lineWidth = widthOf(m); g.stroke(); }
    L.n = n; return L.c;
  }
  // camera: close in on the young coral and pull back as it grows. Each frame fits the coral of the next second's frames (which contains
  // today's coral) and averages those fits, so the motion is smooth and the coral stays in view. Never closer than ZMAX, never wider than the full coral.
  const ZMAX = 14, VEC = 400;
  function cam(ctx, key, geo, nAt, u, vx, vy, vw, vh, J = 30) {
    const cb = CB[key]; let zs = 0, xs = 0, ys = 0;
    for (let j = 0; j <= J; j++) { const i = nAt(u + j / FPS) * 4, bx0 = geo.ox + cb[i] * geo.s, bx1 = geo.ox + cb[i + 1] * geo.s, by0 = geo.oy + cb[i + 2] * geo.s, by1 = geo.oy + cb[i + 3] * geo.s;
      zs += Math.max(1, Math.min(ZMAX, vw * .78 / Math.max(1, bx1 - bx0), vh * .78 / Math.max(1, by1 - by0))); xs += (bx0 + bx1) / 2; ys += (by0 + by1) / 2; }
    const z = zs / (J + 1), cx = xs / (J + 1), cy = ys / (J + 1);
    ctx.translate(vx + vw / 2, vy + vh / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); return z;
  }
  // up to VEC paths are drawn as sharp vectors (lines up to 3× thicker when zoomed in); after that the offscreen coral is used
  function coralView(ctx, id, key, W, H, cx, cy, size, nAt, u, view, k = 1, look = 30) {
    const n = nAt(u), geo = geoOf(key, cx, cy, size), c = n > VEC ? coral(id, key, W, H, geo, n) : null; ctx.save();
    if (view) { ctx.beginPath(); ctx.rect(...view); ctx.clip(); }
    const z = cam(ctx, key, geo, nAt, u, ...(view || [0, 0, W, H]), look);
    if (c) ctx.drawImage(c, 0, 0, W, H);
    else { ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round"; const wk = Math.min(z, 3) / z;
      for (let m = 1; m <= n; m++) { path(ctx, PTS[key][m], geo); ctx.strokeStyle = strokeOf(m, .22); ctx.lineWidth = widthOf(m) * wk * 4; ctx.stroke(); ctx.strokeStyle = strokeOf(m); ctx.lineWidth = widthOf(m) * wk; ctx.stroke(); } ctx.globalCompositeOperation = "source-over"; }
    if (n < PTS[key].length - 1) newest(ctx, key, n, geo, k, z); ctx.restore(); return n;
  }
  // the newest path, drawn bright on top (constant thickness on screen)
  function newest(ctx, key, n, geo, k, z = 1) { ctx.save(); ctx.strokeStyle = "#FFFFFF"; ctx.shadowColor = `hsl(${Math.round(hue(n) * 360)},90%,65%)`; ctx.shadowBlur = 16 * k; ctx.lineWidth = 5 * k / z; ctx.lineCap = "round"; ctx.lineJoin = "round";
    path(ctx, PTS[key][n], geo); ctx.stroke(); ctx.restore(); }
  const fmt = (v) => v.toLocaleString("en-US");
  // how many paths are drawn after u seconds of a d-second growth: one at a time first, then faster and faster, all of them 1 s before the end
  const grown = (u, d, N, slow = 8) => { if (u <= 0) return 1; if (u < slow) return Math.max(1, Math.round(1 + u / slow * 60)); return Math.min(N, Math.round(61 * Math.pow(N / 61, D.clamp((u - slow) / (d - slow - 1))))); };
  function hail(ctx, n, x0, y0, w, h, k) {                 // 27's path as a glowing line, a ball at the newest step
    const mx = Math.log(9232), X = (i) => x0 + i / (P27.length - 1) * w, Y = (v) => y0 + h - Math.log(v) / mx * h;
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 3 * k; ctx.setLineDash([6 * k, 8 * k]); ctx.beginPath(); ctx.moveTo(X(n), Y(P27[n])); ctx.lineTo(X(n), y0 + h); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 7 * k; ctx.lineJoin = "round"; ctx.lineCap = "round"; for (let i = 1; i <= n; i++) { ctx.strokeStyle = `hsl(${Math.round(200 - 170 * Math.log(P27[i]) / mx)},95%,60%)`; ctx.beginPath(); ctx.moveTo(X(i - 1), Y(P27[i - 1])); ctx.lineTo(X(i), Y(P27[i])); ctx.stroke(); }
    ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 24 * k; ctx.beginPath(); ctx.arc(X(n), Y(P27[n]), 16 * k, 0, 7); ctx.fill(); ctx.restore();
    return { x: X(n), y: Y(P27[n]) };
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["hail", 4, 20], ["coral", 20, 84], ["four", 84, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const HAIL = 14.5, hailN = (u) => Math.min(P27.length - 1, Math.floor(D.clamp((u - .5) / HAIL) * (P27.length - 1)));
  const FOUR = ["a", "b", "c", "d"];
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { coralView(ctx, "hook", "main", W, H, 960, 590, 880, hookN, u, null, 1, 6); D.topShade(ctx, W, 220);
      D.text(ctx, "Halve it if it's even. Triple it and add 1 if it's odd.", W / 2, 80, 54, C.text, 700); return; }
    if (sc.id === "hail") { const n = hailN(u), b = hail(ctx, n, 160, 230, 1600, 700, 1);
      D.text(ctx, fmt(P27[n]), b.x, b.y - 46, 46, "#fff", 700); D.text(ctx, "start: 27", 160, 980, 36, C.text, 700, "left"); D.text(ctx, "step " + n + " / 111", 1760, 980, 36, C.amber, 700, "right");
      D.text(ctx, n < 111 ? "Start at 27. Halve if even, triple + 1 if odd." : "27 climbs to 9,232, then falls to 1. 111 steps.", W / 2, 80, 52, C.text, 700, "center", f); return; }
    if (sc.id === "coral") { const n = coralView(ctx, "full", "main", W, H, 960, 590, 880, (v) => grown(v, sc.t1 - sc.t0, NMAX), u);
      D.topShade(ctx, W, 200); D.text(ctx, fmt(n), 1840, 120, 96, C.amber, 700, "right"); D.text(ctx, n === 1 ? "number" : "numbers", 1840, 196, 34, C.text, 600, "right");
      D.text(ctx, "Every number's path back to 1: left on even, right on odd.", W / 2, 80, 50, C.text, 700, "center", D.clamp(1 - Math.max(0, u - 7) / .8)); return; }
    FOUR.forEach((key, i) => { const cx = 480 + 960 * (i % 2), cy = 300 + 540 * Math.floor(i / 2);
      coralView(ctx, "q" + key, key, W, H, cx, cy, 470, (v) => grown(v, sc.t1 - sc.t0 + 2, 3000, 2), u, [960 * (i % 2), 540 * Math.floor(i / 2), 960, 540], .7); });
    D.text(ctx, "Same numbers, other turns.", W / 2, 70, 56, C.text, 700, "center", D.fade(u, 0, 16));
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound ----------
  // 27: a note per step, higher for bigger values; coral: a note for each new path (at most 8 a second), higher for longer paths
  const hailNotes = (t0, dur) => { const mx = Math.log(9232); return P27.slice(1).map((v, i) => ({ t: t0 + .5 + (i + 1) / 111 * dur, k: Math.round(15 * Math.log(v) / mx), gain: .5 })); };
  // the hook: all 10,000 paths in under four seconds, the count multiplying by the same factor every frame
  const hookN = (u) => Math.max(1, Math.min(NMAX, Math.round(Math.exp(Math.max(0, u - .2) / 3.4 * Math.log(NMAX)))));
  function pathNotes(t0, d, N, slow, side = 0, gain = 1, perSec = 8, nAt = (u) => grown(u, d, N, slow)) {
    const ev = []; let last = 1, lastT = -1;
    for (let fr = 0; fr < Math.round((d - .3) * FPS); fr++) { const u = fr / FPS, n = nAt(u); if (n > last && u - lastT >= 1 / perSec) { ev.push({ t: t0 + u, k: Math.round(TAB.st[n] / 262 * 15), side, gain: gain * .5 }); lastT = u; } last = n; }
    return ev; }
  function fullEvents() { return [...pathNotes(0, 4, NMAX, 0, 0, 1, 10, hookN), { t: 3.7, k: 12, voice: "bell", gain: .6 }, ...hailNotes(4, HAIL), { t: 4 + .5 + HAIL + .3, k: 14, voice: "bell", gain: .7 },
    { t: 20.1, k: 3, voice: "bell", gain: .6 }, ...pathNotes(20, 64, NMAX, 8), ...FOUR.flatMap((k, i) => pathNotes(84, 18, 3000, 2, i % 2 ? .5 : -.5, .6, 3)).filter((e) => e.t < 99.4)]; }

  // ---------- Shorts ----------
  function s1(ctx, t) { const n = Math.min(111, Math.floor(D.clamp((t - 1.5) / 25) * 111)), b = hail(ctx, n, 70, 560, 940, 900, 1.1);
    D.text(ctx, fmt(P27[n]), b.x, b.y - 50, 50, "#fff", 700, b.x > 800 ? "right" : "center");
    D.lines(ctx, n < 111 ? ["Start at 27.", "Halve if even, ×3+1 if odd."] : ["111 steps.", "Peak: 9,232."], 540, 170, 70, C.text, 1); D.text(ctx, "step " + n, 540, 1620, 60, C.amber, 700); }
  function s2(ctx, t) { const n = coralView(ctx, "short", "main", 1080, 1920, 540, 1040, 1000, (v) => grown(v, 30, NMAX, 6), t, [0, 420, 1080, 1400], 1.1);
    D.topShade(ctx, 1080, 420); D.lines(ctx, ["Every number from", "1 to " + fmt(n) + "."], 540, 160, 72, C.text, 1); D.text(ctx, "left on even · right on odd · every path ends at 1", 540, 1820, 30, C.dim, 600); }
  const timelines = [
    { id: "full", name: "10 Collatz (long)", file: "Command Loom - 10 Collatz.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · 27 takes 111 steps", file: "Command Loom - Short 1 - 27 Takes 111 Steps.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .04 * t / 30), voice: "glass",
      events: () => [...hailNotes(1, 25), { t: 27.2, k: 14, voice: "bell", gain: .7 }] },
    { id: "s2", name: "Short 2 · The Collatz coral", file: "Command Loom - Short 2 - Collatz Coral.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .04 * t / 30), voice: "glass",
      events: () => pathNotes(0, 30, NMAX, 6).filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 10 Collatz", timelines, ready };
  root.CollatzVideo = { S, NMAX, grown, get TAB() { return TAB; }, get P27() { return P27; }, get MAXN() { return MAXN; }, timelines, ready };
})(typeof window !== "undefined" ? window : globalThis);
