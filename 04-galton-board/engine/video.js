// 04 Galton Board: scenes, drawing and sound. Every ball, count, mean and spread on screen comes from galton.js.
(function (root) {
  "use strict";
  const G = root.Galton, D = root.CLDraw, ROWS = G.ROWS, SEED = 2026, FAIR = .5, LEAN = .6;
  const C = { bg: "#070C16", peg: "#52678A", pegHot: "#FFE2A0", ball: "#FFBD38", bar: "#22D9F2", bar2: "#EF8FD0", theory: "#F5F3EF", normal: "#FFBD38", dim: "#9FB0C6" };
  const N_MAIN = 10000, N_LEAN = 2000;

  // ---------- release schedules: ball i released at rel[i], spends step[i] seconds per row ----------
  function schedule(n, segs) {
    const rel = new Float64Array(n), step = new Float64Array(n);
    for (const s of segs) for (let i = s.n0; i < s.n1; i++) { const x = s.n1 - s.n0 > 1 ? (i - s.n0) / (s.n1 - s.n0 - 1) : 0; rel[i] = s.t0 + (s.t1 - s.t0) * Math.pow(x, s.g ?? 1); step[i] = s.step; }
    const land = Float64Array.from(rel, (r, i) => r + (ROWS + 1) * step[i]);
    return { n, rel, step, land, segs };
  }
  const MAIN = G.run(SEED, N_MAIN, FAIR), LEANRUN = G.run(SEED + 1, N_LEAN, LEAN);
  const SCHED_MAIN = schedule(N_MAIN, [
    { n0: 0, n1: 1, t0: 3.4, t1: 3.4, step: .42 },
    { n0: 1, n1: 101, t0: 11.2, t1: 22.4, g: .8, step: .12 },
    { n0: 101, n1: 1001, t0: 25.0, t1: 37.0, g: .6, step: .07 },
    { n0: 1001, n1: N_MAIN, t0: 39.0, t1: 56.4, g: .5, step: .035 }]);
  const SCHED_LEAN = schedule(N_LEAN, [{ n0: 0, n1: N_LEAN, t0: 72.0, t1: 83.5, g: .6, step: .04 }]);
  const END_MAIN = Math.max(...SCHED_MAIN.land);

  // ---------- layouts ----------
  function layout(cx, top, dx, dy, histTop, histH, k) { return { cx, top, dx, dy, histTop, histH, k, ballR: Math.max(3, dx * .15), pegR: Math.max(2, dx * .07) }; }
  const L_MAIN = layout(860, 200, 44, 27, 680, 330, 1);
  const pegXY = (L, r, j) => [L.cx + (j - r / 2) * L.dx, L.top + r * L.dy];
  const binX = (L, k) => L.cx + (k - ROWS / 2) * L.dx;

  // ---------- state at a time ----------
  function landed(run, sch, t) { const h = new Array(ROWS + 1).fill(0); let n = 0; for (let i = 0; i < sch.n; i++) if (sch.land[i] <= t) { h[run.bins[i]]++; n++; } return { h, n }; }
  function ballPos(L, run, sch, i, t) {
    const u = (t - sch.rel[i]) / sch.step[i]; if (u < 0 || u >= ROWS + 1) return null;
    const d = G.path(run.seed, i, run.p); let j = 0; const r = Math.floor(u), f = u - r;
    for (let q = 0; q < Math.min(r, ROWS); q++) j += d[q];
    let x0, y0, x1, y1;
    if (r < ROWS) { [x0, y0] = pegXY(L, r, j); const j1 = j + d[r]; if (r + 1 < ROWS) [x1, y1] = pegXY(L, r + 1, j1); else { x1 = binX(L, j1); y1 = L.top + ROWS * L.dy; } }
    else { x0 = binX(L, j); y0 = L.top + ROWS * L.dy; x1 = x0; y1 = L.histTop + L.histH - L.ballR; }
    const x = x0 + (x1 - x0) * D.smooth(f), y = y0 + (y1 - y0) * f - (r < ROWS ? Math.sin(Math.PI * f) * L.dy * .45 : 0) - L.pegR - L.ballR;
    return [x, y, r];
  }
  const rateAt = (sch, t) => { let n = 0; for (let i = 0; i < sch.n; i++) if (sch.rel[i] > t - 1 && sch.rel[i] <= t) n++; return n; };

  // ---------- drawing ----------
  function bg(ctx, W, H) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); const g = ctx.createRadialGradient(W / 2, H * .45, 50, W / 2, H * .45, Math.max(W, H) * .7); g.addColorStop(0, "rgba(40,60,95,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function pegs(ctx, L, hot) {
    for (let r = 0; r < ROWS; r++) for (let j = 0; j <= r; j++) { const [x, y] = pegXY(L, r, j), h = hot && hot[r + "," + j] || 0;
      ctx.fillStyle = h > 0 ? C.pegHot : C.peg; ctx.globalAlpha = h > 0 ? .4 + .6 * h : 1; ctx.beginPath(); ctx.arc(x, y, L.pegR * (1 + h * .8), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    // funnel and bin walls
    ctx.strokeStyle = "#24324A"; ctx.lineWidth = 2 * L.k;
    const yb = L.top + ROWS * L.dy, ye = L.histTop + L.histH;
    for (let k = 0; k <= ROWS + 1; k++) { const x = binX(L, k) - L.dx / 2; ctx.beginPath(); ctx.moveTo(x, yb + L.dy * .4); ctx.lineTo(x, ye); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(binX(L, 0) - L.dx / 2, ye); ctx.lineTo(binX(L, ROWS) + L.dx / 2, ye); ctx.stroke();
  }
  function hist(ctx, L, h, n, p, showTheory, color = C.bar) {
    const ye = L.histTop + L.histH, w = L.dx * .84, maxC = Math.max(...h, 1), pk = G.binomial(ROWS, p), expMax = n * Math.max(...pk);
    const stacked = maxC * 2 * L.ballR <= L.histH * .98;
    const scale = stacked ? 2 * L.ballR : L.histH * .9 / Math.max(maxC, expMax, 1);
    for (let k = 0; k <= ROWS; k++) {
      const x = binX(L, k);
      if (stacked) { ctx.fillStyle = C.ball; for (let c = 0; c < h[k]; c++) { ctx.beginPath(); ctx.arc(x, ye - L.ballR - c * 2 * L.ballR, L.ballR * .92, 0, 7); ctx.fill(); } }
      else { const hh = h[k] * scale, g = ctx.createLinearGradient(0, ye - hh, 0, ye); g.addColorStop(0, color); g.addColorStop(1, "rgba(34,217,242,.25)"); ctx.fillStyle = g; ctx.fillRect(x - w / 2, ye - hh, w, hh); }
    }
    if (showTheory > 0 && !stacked) {
      ctx.save(); ctx.globalAlpha = showTheory;
      ctx.strokeStyle = C.theory; ctx.lineWidth = 3 * L.k; for (let k = 0; k <= ROWS; k++) { const x = binX(L, k), y = ye - n * pk[k] * scale; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke(); }
      const nb = G.normalBins(ROWS, p); ctx.strokeStyle = C.normal; ctx.lineWidth = 2.5 * L.k; ctx.setLineDash([10 * L.k, 8 * L.k]); ctx.beginPath();
      const m = ROWS * p, sd = Math.sqrt(ROWS * p * (1 - p));
      for (let s = 0; s <= 200; s++) { const xk = -0.5 + (ROWS + 1) * s / 200, dens = Math.exp(-((xk - m) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)); const x = L.cx + (xk - ROWS / 2) * L.dx, y = ye - n * dens * scale; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    return stacked;
  }
  function balls(ctx, L, run, sch, t, hot) {
    if (ctx) ctx.fillStyle = C.ball;
    for (let i = 0; i < sch.n; i++) { if (sch.rel[i] > t || sch.land[i] <= t) continue; const b = ballPos(L, run, sch, i, t); if (!b) continue;
      if (ctx) { const big = sch.step[i] > .2, r = L.ballR * (big ? 2.1 : 1);
        if (big) { const g = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], r * 3); g.addColorStop(0, "rgba(255,189,56,.45)"); g.addColorStop(1, "rgba(255,189,56,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b[0], b[1], r * 3, 0, 7); ctx.fill(); ctx.fillStyle = C.ball; }
        ctx.beginPath(); ctx.arc(b[0], b[1], r, 0, 7); ctx.fill(); }
      if (hot && sch.step[i] > .1) { const u = (t - sch.rel[i]) / sch.step[i], r = Math.floor(u); if (r < ROWS) { const d = G.path(run.seed, i, run.p); let j = 0; for (let q = 0; q < r; q++) j += d[q]; hot[r + "," + j] = Math.max(hot[r + "," + j] || 0, 1 - (u - r)); } } }
  }
  function statsPanel(ctx, x, y, h, n, p, k = 1, label = true) {
    const s = G.stats(h), m = ROWS * p, sd = Math.sqrt(ROWS * p * (1 - p));
    D.text(ctx, "Balls landed", x, y, 30 * k, C.dim, 600, "left"); D.text(ctx, n.toLocaleString("en-US"), x, y + 44 * k, 52 * k, "#F5F3EF", 700, "left");
    if (n >= 20) {
      D.text(ctx, "Mean bin  " + s.mean.toFixed(2), x, y + 112 * k, 32 * k, "#F5F3EF", 600, "left"); if (label) D.text(ctx, "prediction " + m.toFixed(1), x, y + 148 * k, 26 * k, C.dim, 500, "left");
      D.text(ctx, "Spread (SD)  " + s.sd.toFixed(2), x, y + 200 * k, 32 * k, "#F5F3EF", 600, "left"); if (label) D.text(ctx, "prediction " + sd.toFixed(2), x, y + 236 * k, 26 * k, C.dim, 500, "left");
    }
  }
  function pascal(ctx, L, t0, t, perRow = .55) {
    const shown = Math.floor((t - t0) / perRow);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let r = 0; r < ROWS; r++) { const a = D.clamp((t - t0 - r * perRow) / .3); if (a <= 0) continue;
      for (let j = 0; j <= r; j++) { const [x, y] = pegXY(L, r, j), v = G.choose(r, j); ctx.globalAlpha = a; ctx.fillStyle = r === shown ? "#FFE2A0" : "#C9D6E8"; ctx.font = "600 " + Math.round((v > 999 ? 12.5 : 15) * L.dx / 44) + "px " + D.FONT; ctx.fillText(String(v), x, y); } }
    const a = D.clamp((t - t0 - ROWS * perRow) / .4);
    for (let k = 0; k <= ROWS; k++) { ctx.globalAlpha = a; ctx.fillStyle = k === 8 ? "#FFBD38" : "#C9D6E8"; ctx.font = "700 " + Math.round(13 * L.dx / 44) + "px " + D.FONT; const v = G.choose(ROWS, k); ctx.save(); ctx.translate(binX(L, k), L.top + ROWS * L.dy + L.dy * .2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "right"; ctx.fillText(v.toLocaleString("en-US"), 0, 0); ctx.restore(); }
    ctx.globalAlpha = 1;
  }

  // ---------- full video ----------
  const S = [
    { id: "hook", t0: 0, t1: 3 }, { id: "one", t0: 3, t1: 11 }, { id: "first", t0: 11, t1: 25 }, { id: "thousand", t0: 25, t1: 39 },
    { id: "tenk", t0: 39, t1: 59 }, { id: "paths", t0: 59, t1: 72 }, { id: "lean", t0: 72, t1: 86 }, { id: "close", t0: 86, t1: 96 }];
  const HOOK_FROM = 54.4;                                   // the hook shows main-run time 54.4..57.4 ("Later in this run")
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const L_LEFT = layout(500, 300, 26, 17, 600, 300, .62), L_RIGHT = layout(1420, 300, 26, 17, 600, 300, .62);
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t); bg(ctx, W, H);
    if (sc.id === "close") { const z = 1 + .06 * D.smooth((t - sc.t0) / (sc.t1 - sc.t0)); ctx.save(); ctx.translate(860, 600); ctx.scale(z, z); ctx.translate(-860, -600); drawMain(ctx, t, sc, W, H); ctx.restore(); D.lines(ctx, ["Chance, repeated, becomes a law."], W / 2, 90, 66, "#F5F3EF", D.fade(t, sc.t0, sc.t1)); D.text(ctx, "Ideal probability model · 16 rows · independent 50 / 50 choices", W / 2, 1050, 28, C.dim, 500); return; }
    drawMain(ctx, t, sc, W, H);
  }
  function drawMain(ctx, t, sc, W, H) {
    if (sc.id === "lean") {
      const tl = t, hf = landed(MAIN, SCHED_MAIN, 1e9), hl = landed(LEANRUN, SCHED_LEAN, tl);
      pegs(ctx, L_LEFT); hist(ctx, L_LEFT, hf.h, hf.n, FAIR, 1); pegs(ctx, L_RIGHT); balls(ctx, L_RIGHT, LEANRUN, SCHED_LEAN, tl); hist(ctx, L_RIGHT, hl.h, hl.n, LEAN, D.clamp((hl.n - 600) / 400), C.bar2);
      D.text(ctx, "Fair: 50 / 50", 500, 230, 40, "#F5F3EF", 700); D.text(ctx, "Leaning: 60 / 40", 1420, 230, 40, "#FFBD38", 700);
      const sf = G.stats(hf.h), sl = G.stats(hl.h);
      D.text(ctx, "mean bin " + sf.mean.toFixed(2), 500, 960, 30, C.dim, 600); if (hl.n >= 20) D.text(ctx, "mean bin " + sl.mean.toFixed(2) + "   (prediction 9.6)", 1420, 960, 30, C.dim, 600);
      D.text(ctx, hl.n.toLocaleString("en-US") + " balls", 1420, 1004, 28, C.dim, 500);
      D.lines(ctx, t < 80 ? ["Every peg leans 60 / 40."] : ["The center moves. The shape stays."], W / 2, 90, 64, "#F5F3EF", D.fade(t, sc.t0, sc.t1));
      return;
    }
    const mt = sc.id === "hook" ? HOOK_FROM + t : sc.id === "paths" || sc.id === "close" ? 1e9 : t;   // main-run time
    const hot = {}; if (sc.id === "one" || sc.id === "first") balls(null, L_MAIN, MAIN, SCHED_MAIN, mt, hot);
    pegs(ctx, L_MAIN, hot);
    if (sc.id === "paths") { ctx.save(); ctx.fillStyle = C.bg; for (let r = 0; r < ROWS; r++) for (let j = 0; j <= r; j++) { const [x, y] = pegXY(L_MAIN, r, j); ctx.beginPath(); ctx.arc(x, y, L_MAIN.pegR * 1.2, 0, 7); ctx.fill(); } ctx.restore(); pascal(ctx, L_MAIN, sc.t0 + .6, t); }
    balls(ctx, L_MAIN, MAIN, SCHED_MAIN, mt);
    const lh = landed(MAIN, SCHED_MAIN, mt), theory = sc.id === "tenk" ? D.clamp((lh.n - 1000) / 1500) : sc.id === "hook" || sc.id === "paths" || sc.id === "close" ? 1 : 0;
    hist(ctx, L_MAIN, lh.h, lh.n, FAIR, theory);
    if (sc.id !== "one" && sc.id !== "paths") statsPanel(ctx, 1330, 360, lh.h, lh.n, FAIR, 1, theory > 0);
    if (theory > .05 && sc.id !== "paths") { ctx.globalAlpha = theory; ctx.fillStyle = C.theory; ctx.fillRect(1330, 700, 40, 4); D.text(ctx, "Binomial prediction", 1385, 702, 26, C.dim, 500, "left"); ctx.strokeStyle = C.normal; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(1330, 744); ctx.lineTo(1370, 744); ctx.stroke(); ctx.setLineDash([]); D.text(ctx, "Normal approximation", 1385, 744, 26, C.dim, 500, "left"); ctx.globalAlpha = 1; }
    // text
    const f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { D.lines(ctx, ["One curve from pure chance."], W / 2, 90, 72, "#F5F3EF", 1); D.text(ctx, "Later in this run", W / 2, 150, 34, "#FFBD38", 600); }
    if (sc.id === "one") {
      D.lines(ctx, [t < 7 ? "Every peg: left or right." : "Count the rights."], W / 2, 90, 66, "#F5F3EF", f);
      const u = (t - SCHED_MAIN.rel[0]) / SCHED_MAIN.step[0], d = G.path(MAIN.seed, 0, FAIR), r = D.clamp(Math.floor(u), 0, ROWS);
      let s = ""; for (let q = 0; q < Math.min(r, ROWS); q++) s += d[q] ? "R " : "L ";
      D.text(ctx, "50 / 50 at every peg", 1330, 360, 32, C.dim, 600, "left"); D.text(ctx, s.trim(), 1330, 420, 34, "#F5F3EF", 700, "left");
      const rights = d.slice(0, r).reduce((a, b) => a + b, 0); D.text(ctx, "Rights: " + rights + (r >= ROWS ? "  →  bin " + rights : ""), 1330, 480, 36, "#FFBD38", 700, "left");
    }
    if (sc.id === "first") D.lines(ctx, [t < 18 ? "100 balls." : "Still lumpy."], W / 2, 90, 66, "#F5F3EF", f);
    if (sc.id === "thousand") D.lines(ctx, [t < 31 ? "1,000 balls." : "A shape appears."], W / 2, 90, 66, "#F5F3EF", f);
    if (sc.id === "tenk") D.lines(ctx, [lh.n < N_MAIN ? "Up to 10,000." : "The bell curve."], W / 2, 90, 66, "#F5F3EF", f);
    if (sc.id === "paths") { D.lines(ctx, [t < 66 ? "Count the paths to each bin." : "12,870 paths to the middle. 1 to each edge."], W / 2, 90, t < 66 ? 66 : 54, "#F5F3EF", f); D.text(ctx, "Pascal's triangle", 1330, 360, 34, C.dim, 600, "left"); }

    if (sc.id === "thousand" || sc.id === "tenk" || sc.id === "first") { const r = rateAt(SCHED_MAIN, mt); if (r > 0) D.speed(ctx, "Display rate: " + r.toLocaleString("en-US") + " balls/s", W); }
    if (sc.id === "one") D.speed(ctx, "Steps animated · not physical fall time", W);
  }

  // ---------- sound ----------
  const kOfBin = (b) => Math.round(b * 15 / ROWS);
  function landingNotes(run, sch, map, lo, hi, side = 0, per = .1) {          // at most one landing note per 0.1 s
    const out = [], used = new Set();
    const idx = Array.from({ length: sch.n }, (_, i) => i).filter((i) => sch.land[i] >= lo && sch.land[i] < hi).sort((a, b) => sch.land[a] - sch.land[b]);
    for (const i of idx) { const v = map(sch.land[i]); if (v === null) continue; const slot = Math.floor(v / per); if (used.has(slot)) continue; used.add(slot); out.push({ t: v, k: kOfBin(run.bins[i]), side }); }
    return out;
  }
  function pegTicks(run, sch, i, map) { const d = G.path(run.seed, i, run.p), out = []; let j = 0; for (let r = 0; r < ROWS; r++) { out.push({ t: map(sch.rel[i] + r * sch.step[i]), k: Math.round(15 * (j + (ROWS - r) / 2) / ROWS), voice: "glass", gain: .5 }); j += d[r]; } return out; }
  function fullEvents() {
    const ev = [];
    ev.push(...landingNotes(MAIN, SCHED_MAIN, (v) => v - HOOK_FROM, HOOK_FROM, HOOK_FROM + 3));
    ev.push(...pegTicks(MAIN, SCHED_MAIN, 0, (v) => v));
    ev.push(...landingNotes(MAIN, SCHED_MAIN, (v) => v, 3, 59));
    for (let r = 0; r < ROWS; r++) ev.push({ t: 59.6 + r * .55, k: Math.round(r * 15 / (ROWS - 1)), gain: .8 });
    ev.push({ t: 59.6 + ROWS * .55 + .2, k: 8 }, { t: 59.6 + ROWS * .55 + .2, k: 0 }, { t: 59.6 + ROWS * .55 + .2, k: 15 });
    ev.push(...landingNotes(LEANRUN, SCHED_LEAN, (v) => v, 72, 86, .6));
    ev.push({ t: 86.4, k: 4 }, { t: 86.4, k: 8 }, { t: 86.4, k: 11 });
    return ev;
  }

  // ---------- Shorts (1080x1920) ----------
  const LV = layout(540, 430, 50, 31, 1000, 400, 1.1), LV2a = layout(540, 360, 44, 15, 600, 200, .9), LV2b = layout(540, 900, 44, 15, 1140, 200, .9);
  const SCH_S1 = schedule(N_MAIN, [{ n0: 0, n1: 1, t0: .6, t1: .6, step: .3 }, { n0: 1, n1: N_MAIN, t0: 6.2, t1: 25.5, g: .5, step: .04 }]);
  const SCH_S2 = schedule(3000, [{ n0: 0, n1: 1, t0: .6, t1: .6, step: .36 }, { n0: 1, n1: 3000, t0: 19.5, t1: 27.5, g: .5, step: .035 }]);
  const SCH_S3a = schedule(N_LEAN, [{ n0: 0, n1: N_LEAN, t0: .2, t1: 24, g: .55, step: .04 }]), SCH_S3b = SCH_S3a;
  function shortFrame(ctx, W, H) { bg(ctx, W, H); }
  function drawS1(ctx, t) {
    shortFrame(ctx, 1080, 1920); const hot = {}; balls(null, LV, MAIN, SCH_S1, t, hot); pegs(ctx, LV, hot); balls(ctx, LV, MAIN, SCH_S1, t);
    const lh = landed(MAIN, SCH_S1, t), th = D.clamp((lh.n - 1500) / 2000); hist(ctx, LV, lh.h, lh.n, FAIR, th);
    D.text(ctx, lh.n.toLocaleString("en-US") + " balls", 540, 1470, 44, "#F5F3EF", 700);
    if (lh.n >= 20) { const s = G.stats(lh.h); D.text(ctx, "mean bin " + s.mean.toFixed(2) + "  ·  prediction 8.0", 540, 1520, 30, C.dim, 600); }
    D.lines(ctx, t < 6 ? ["Left or right.", "50 / 50 at every peg."] : lh.n < N_MAIN ? ["10,000 balls."] : ["One curve from", "pure chance."], 540, 150, 74, "#F5F3EF", 1);
    const r = rateAt(SCH_S1, t); if (t > 6 && r > 0) D.text(ctx, "Display rate " + r.toLocaleString("en-US") + "/s", 540, 330, 32, "#FFBD38", 600); else if (t < 6) D.text(ctx, "Steps animated", 540, 330, 32, "#FFBD38", 600);
  }
  function drawS2(ctx, t) {
    shortFrame(ctx, 1080, 1920); const hot = {};
    if (t < 7.5 || t >= 19) balls(null, LV, MAIN, SCH_S2, t, hot);
    pegs(ctx, LV, hot); if (t < 7.5 || t >= 19) balls(ctx, LV, MAIN, SCH_S2, t);
    if (t >= 7.5 && t < 19.5) { ctx.save(); ctx.fillStyle = C.bg; for (let r = 0; r < ROWS; r++) for (let j = 0; j <= r; j++) { const [x, y] = pegXY(LV, r, j); ctx.beginPath(); ctx.arc(x, y, LV.pegR * 1.3, 0, 7); ctx.fill(); } ctx.restore(); pascal(ctx, LV, 7.8, t, .55); }
    const lh = landed(MAIN, SCH_S2, t); hist(ctx, LV, lh.h, lh.n, FAIR, t > 19.5 ? D.clamp((lh.n - 500) / 800) : 0);
    const head = t < 7.5 ? ["Follow one ball."] : t < 14 ? ["Count the paths", "to each bin."] : t < 19.5 ? ["12,870 paths to the middle.", "1 to each edge."] : ["That's why the", "middle fills first."];
    D.lines(ctx, head, 540, 150, t >= 14 && t < 19.5 ? 60 : 74, "#F5F3EF", 1);
    if (t < 7.5) { const d = G.path(MAIN.seed, 0, FAIR), r = D.clamp(Math.floor((t - SCH_S2.rel[0]) / SCH_S2.step[0]), 0, ROWS), rights = d.slice(0, r).reduce((a, b) => a + b, 0); D.text(ctx, "Rights so far: " + rights + (r >= ROWS ? "  →  bin " + rights : ""), 540, 1470, 40, "#FFBD38", 700); D.text(ctx, "Steps animated", 540, 330, 32, "#FFBD38", 600); }
    if (t >= 19.5) D.text(ctx, lh.n.toLocaleString("en-US") + " balls", 540, 1470, 44, "#F5F3EF", 700);
  }
  function drawS3(ctx, t) {
    shortFrame(ctx, 1080, 1920);
    const a = landed(MAIN, SCH_S3a, t), b = landed(LEANRUN, SCH_S3b, t);
    pegs(ctx, LV2a); balls(ctx, LV2a, MAIN, SCH_S3a, t); hist(ctx, LV2a, a.h, a.n, FAIR, D.clamp((a.n - 600) / 500));
    pegs(ctx, LV2b); balls(ctx, LV2b, LEANRUN, SCH_S3b, t); hist(ctx, LV2b, b.h, b.n, LEAN, D.clamp((b.n - 600) / 500), C.bar2);
    D.text(ctx, "Fair 50 / 50", 70, 300, 40, "#F5F3EF", 700, "left"); D.text(ctx, "Leaning 60 / 40", 70, 845, 40, "#FFBD38", 700, "left");
    if (a.n >= 20) D.text(ctx, "mean bin " + G.stats(a.h).mean.toFixed(2), 1010, 300, 30, C.dim, 600, "right");
    if (b.n >= 20) D.text(ctx, "mean bin " + G.stats(b.h).mean.toFixed(2), 1010, 845, 30, C.dim, 600, "right");
    D.text(ctx, a.n.toLocaleString("en-US") + " balls each", 540, 1420, 36, C.dim, 600);
    D.lines(ctx, t < 26 ? ["Same board.", "Tilt every peg 60 / 40."] : ["The center moves.", "The shape stays."], 540, 140, 70, "#F5F3EF", 1);
  }
  function sEvents(sch, run, map, lo, hi, side) { return landingNotes(run, sch, map, lo, hi, side); }

  const timelines = [
    { id: "full", name: "04 Galton Board (long)", file: "Command Loom - 04 Galton Board.mp4", W: 1920, H: 1080, dur: 96, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · 10,000 balls", file: "Command Loom - Short 1 - Ten Thousand Balls.mp4", W: 1080, H: 1920, dur: 30, draw: drawS1, voice: "marimba",
      events: () => [...pegTicks(MAIN, SCH_S1, 0, (v) => v), ...sEvents(SCH_S1, MAIN, (v) => v, 1, 30)] },
    { id: "s2", name: "Short 2 · Why the middle wins", file: "Command Loom - Short 2 - Why the Middle Wins.mp4", W: 1080, H: 1920, dur: 30, draw: drawS2, voice: "marimba",
      events: () => [...pegTicks(MAIN, SCH_S2, 0, (v) => v), ...Array.from({ length: ROWS }, (_, r) => ({ t: 7.8 + r * .55, k: Math.round(r * 15 / (ROWS - 1)), gain: .8 })), ...sEvents(SCH_S2, MAIN, (v) => v, 19.5, 30)] },
    { id: "s3", name: "Short 3 · Fair vs leaning", file: "Command Loom - Short 3 - Fair vs Leaning.mp4", W: 1080, H: 1920, dur: 31, draw: drawS3, voice: "marimba",
      events: () => [...sEvents(SCH_S3a, MAIN, (v) => v, 0, 31, -.6), ...sEvents(SCH_S3b, LEANRUN, (v) => v, 0, 31, .6)] }
  ];
  root.CLVideo = { title: "Command Loom · 04 Galton Board", timelines };
  root.GaltonVideo = { MAIN, LEANRUN, SCHED_MAIN, SCHED_LEAN, SCH_S1, SCH_S2, SCH_S3a, HOOK_FROM, S, END_MAIN, landed, rateAt, timelines };
})(typeof window !== "undefined" ? window : globalThis);
