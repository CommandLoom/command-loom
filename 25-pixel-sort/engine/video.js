// 25 Pixel Sort: 5,000 coloured pixels (50 rows × 100) in random order; every row is sorted into a rainbow by the same algorithm
// (sorts.js), one algorithm per scene, then all six race at the same speed. Every comparison and every write is counted.
(function (root) {
  "use strict";
  const SO = root.Sorts, D = root.CLDraw, FPS = 30;
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", green: "#5BE38C" };
  const ALGS = ["bubble", "insertion", "selection", "merge", "quick", "heap"];
  const NAME = { bubble: "Bubble sort", insertion: "Insertion sort", selection: "Selection sort", merge: "Merge sort", quick: "Quicksort", heap: "Heapsort" };
  const GRIDS = { L: { W: 100, H: 50, seed: 7 }, P: { W: 60, H: 90, seed: 11 }, R: { W: 100, H: 50, seed: 7 }, V: { W: 60, H: 40, seed: 13 } };
  const runs = {}, run = (g, alg) => { const k = g + alg; if (!runs[k]) { const G = GRIDS[g]; runs[k] = SO.runGrid(SO.grid(G.W, G.H, G.seed), alg); runs[k].max = Math.max(...runs[k].map((r) => r.ops)); } return runs[k]; };
  const colour = (v, W) => { const h = v / W * 300, s = .85, l = .56, k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0) * 255, f(8) * 255, f(4) * 255]; };
  let img = null, cvs = null, row = null;
  // draw grid g sorted by alg after `op` operations per row, into the rectangle (x, y, w, h)
  function grid(ctx, g, alg, op, x, y, w, h, border) {
    const G = GRIDS[g], R = run(g, alg);
    if (!cvs || cvs.width !== G.W || cvs.height !== G.H) { cvs = document.createElement("canvas"); cvs.width = G.W; cvs.height = G.H; img = cvs.getContext("2d").createImageData(G.W, G.H); row = new Int32Array(G.W); }
    let total = 0, done = 0;
    for (let yy = 0; yy < G.H; yy++) { const r = R[yy]; SO.rowAt(r, op, row); total += Math.min(op, r.ops); if (op >= r.ops) done++;
      for (let xx = 0; xx < G.W; xx++) { const c = colour(row[xx], G.W), i = 4 * (yy * G.W + xx); img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255; } }
    cvs.getContext("2d").putImageData(img, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(cvs, x, y, w, h); ctx.restore();
    if (border) { ctx.save(); ctx.strokeStyle = done === G.H ? C.green : "rgba(210,225,255,.35)"; ctx.lineWidth = 3; ctx.strokeRect(x - 4, y - 4, w + 8, h + 8); ctx.restore(); }
    return { total, done, rows: G.H };
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  // ---------- long video ----------
  const SORT = 11.5;                                          // seconds of sorting per scene (each algorithm at its own speed)
  const S = [["hook", 0, 4], ...ALGS.map((a, i) => [a, 4 + 13 * i, 17 + 13 * i]), ["race", 82, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const RACE = 16;                                            // the race: all six at the same number of operations per second
  const raceRate = () => Math.max(...ALGS.map((a) => run("R", a).max)) / RACE;
  const foot = "50 rows × 100 pixels, every row in its own random order · counts: comparisons + writes";
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const R = run("L", "merge"), op = R.max * D.clamp(u / 3.4); grid(ctx, "L", "merge", op, 160, 190, 1600, 800, true);
      D.text(ctx, "5,000 pixels sort themselves into a rainbow.", W / 2, 80, 58, C.text, 700); D.text(ctx, "Merge sort", W / 2, 1040, 38, C.amber, 700); return; }
    if (sc.id === "race") {
      const rate = raceRate(), op = rate * Math.max(0, u - .5);
      ALGS.forEach((a, j) => { const x = 110 + (j % 3) * 590, y = 210 + Math.floor(j / 3) * 410, st = grid(ctx, "R", a, op, x, y, 520, 260, true);
        D.text(ctx, NAME[a], x + 260, y + 300, 34, st.done === st.rows ? C.green : C.text, 700, "center", f); });
      D.text(ctx, "Same pixels, same speed.", W / 2, 80, 60, C.text, 700, "center", f); D.text(ctx, `${fmt(rate)} operations per second per row`, W / 2, 148, 32, C.amber, 600, "center", f);
      D.text(ctx, foot, W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    const a = sc.id, R = run("L", a), op = R.max * D.clamp((u - .3) / SORT), st = grid(ctx, "L", a, op, 160, 190, 1600, 800, true);
    D.text(ctx, NAME[a], W / 2, 80, 66, C.text, 700, "center", f);
    D.text(ctx, `operations: ${fmt(st.total)} · rows sorted: ${st.done} / ${st.rows}`, W / 2, 148, 34, st.done === st.rows ? C.green : C.amber, 600, "center", f);
    D.text(ctx, `sped up to fit ${SORT} s · ` + foot, W / 2, 1050, 24, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .025 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: the writes in one row (the middle row), pitch from the colour written; at most 3 per frame ----------
  function notes(g, alg, rowIdx, t0, opRate, op0, tMax, side = 0, gain = 1) {
    const r = run(g, alg)[rowIdx], W = GRIDS[g].W, ev = [], seen = new Map();
    for (const [op, , v] of r.writes) { if (op < op0) continue; const t = t0 + (op - op0) / opRate; if (t >= tMax) break; const fr = Math.floor(t * FPS), c = seen.get(fr) || 0; if (c >= 3) continue; seen.set(fr, c + 1);
      ev.push({ t, k: Math.round(v / (W - 1) * 15), side, gain: gain * .55 }); }
    return ev; }
  const done = (t, gain = 1, side = 0) => ({ t, k: 10, side, gain: gain * 1.1, voice: "bell" });
  function fullEvents() {
    const ev = [...notes("L", "merge", 25, 0, run("L", "merge").max / 3.4, 0, 3.9)];
    for (const sc of S.filter((s) => ALGS.includes(s.id))) { const R = run("L", sc.id); ev.push(...notes("L", sc.id, 25, sc.t0 + .3, R.max / SORT, 0, sc.t1 - .1)); ev.push(done(sc.t0 + .3 + SORT)); }
    const rate = raceRate(); ALGS.forEach((a, j) => { ev.push(...notes("R", a, 25, 82.5, rate, 0, 99.4, (j % 3 - 1) * .6, .6)); const tf = 82.5 + run("R", a).max / rate; if (tf < 99.4) ev.push(done(tf, .7, (j % 3 - 1) * .6)); });
    return ev; }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, P_SORT = 4.3;
  function s1(ctx, t) { const i = Math.min(5, Math.floor(t / 5)), a = ALGS[i], u = t - i * 5, f = D.fade(t, i * 5, i * 5 + 5, .2), R = run("P", a), st = grid(ctx, "P", a, R.max * D.clamp((u - .2) / P_SORT), 60, 330, 960, 1440, true);
    D.lines(ctx, ["Which sort looks best?"], 540, 120, 76, C.text, 1); D.text(ctx, `${i + 1} · ${NAME[a]}`, 540, 230, 60, st.done === st.rows ? C.green : C.amber, 700, "center", f);
    D.text(ctx, `each sped up to fit ${P_SORT} s · comment 1–6`, 540, 1830, 32, C.dim, 600); }
  const V_RACE = 27;
  function s2(ctx, t) { const rate = run("V", "bubble").max / V_RACE, op = rate * Math.max(0, t - .5);
    const a = grid(ctx, "V", "bubble", op, 90, 330, 900, 600, true), b = grid(ctx, "V", "quick", op, 90, 1150, 900, 600, true);
    D.lines(ctx, ["Same pixels, same speed."], 540, 120, 70, C.text, 1);
    D.text(ctx, "Bubble sort", 540, 270, 52, a.done === a.rows ? C.green : C.text, 700); D.text(ctx, "Quicksort", 540, 1090, 52, b.done === b.rows ? C.green : C.text, 700);
    D.text(ctx, `operations: ${fmt(a.total)}`, 540, 975, 34, C.amber, 600); D.text(ctx, `operations: ${fmt(b.total)}`, 540, 1795, 34, C.amber, 600); }
  const timelines = [
    { id: "full", name: "25 Pixel Sort (long)", file: "Command Loom - 25 Pixel Sort.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Which Sort", file: "Command Loom - Short 1 - Which Sort.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * (t % 5) / 5), voice: "glass",
      events: () => ALGS.flatMap((a, i) => [...notes("P", a, 45, i * 5 + .2, run("P", a).max / P_SORT, 0, i * 5 + 4.95), done(i * 5 + .2 + P_SORT)]).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · Bubble vs Quick", file: "Command Loom - Short 2 - Bubble vs Quick.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => { const rate = run("V", "bubble").max / V_RACE; return [...notes("V", "bubble", 20, .5, rate, 0, 29.4, -.5), ...notes("V", "quick", 20, .5, rate, 0, 29.4, .5), done(.5 + run("V", "quick").max / rate, 1, .5), done(.5 + V_RACE, 1, -.5)]; } }
  ];
  root.CLVideo = { title: "Command Loom · 25 Pixel Sort", timelines, ready: Promise.resolve() };
  root.PixelVideo = { S, ALGS, run, GRIDS, timelines, SORT, RACE, raceRate, V_RACE, P_SORT };
})(typeof window !== "undefined" ? window : globalThis);
