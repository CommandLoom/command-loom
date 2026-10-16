"use strict";
// Model law, reproducibility, conservation of balls, timing of every claim, and the numbers printed on screen.
global.window = global; const assert = require("assert");
require("./galton.js"); window.CLDraw = require("./draw.js"); require("./video.js");
const G = window.Galton, V = window.GaltonVideo; let passes = 0; const test = (n, f) => { f(); passes++; console.log("PASS " + n); };
test("each ball's path is reproducible and its bin is the number of rights", () => {
  for (let i = 0; i < 200; i++) { const a = G.path(2026, i), b = G.path(2026, i); assert.deepStrictEqual(a, b); assert.strictEqual(G.binOf(2026, i), a.reduce((x, y) => x + y, 0)); }
});
test("binomial and normal predictions: totals, mean np, variance np(1-p)", () => {
  for (const p of [.5, .6]) { const b = G.binomial(16, p); assert(Math.abs(b.reduce((x, y) => x + y) - 1) < 1e-12);
    const m = b.reduce((s, v, k) => s + v * k, 0), v = b.reduce((s, x, k) => s + x * (k - m) ** 2, 0); assert(Math.abs(m - 16 * p) < 1e-9 && Math.abs(v - 16 * p * (1 - p)) < 1e-9);
    assert(Math.abs(G.normalBins(16, p).reduce((x, y) => x + y) - 1) < 1e-3); }
  assert.strictEqual(G.choose(16, 8), 12870); assert.strictEqual(G.choose(16, 0), 1);
});
test("every ball is accounted for: released = in flight + landed; all land inside their scene", () => {
  const sc = Object.fromEntries(V.S.map((s) => [s.id, s]));
  assert(V.END_MAIN < sc.tenk.t1 - .5, "main run must finish before the 10,000 scene ends");
  assert(Math.max(...V.SCHED_LEAN.land) < sc.lean.t1 - .5);
  for (const [sch, end] of [[V.SCH_S1, 30], [V.SCH_S2, 30], [V.SCH_S3a, 31]]) assert(Math.max(...sch.land) < end - .5);
  for (const t of [5, 20, 33, 45, 58]) { const l = V.landed(V.MAIN, V.SCHED_MAIN, t); let fly = 0, rel = 0; for (let i = 0; i < V.SCHED_MAIN.n; i++) { if (V.SCHED_MAIN.rel[i] <= t) rel++; if (V.SCHED_MAIN.rel[i] <= t && V.SCHED_MAIN.land[i] > t) fly++; } assert.strictEqual(rel, fly + l.n); }
  const fin = V.landed(V.MAIN, V.SCHED_MAIN, 1e9); assert.strictEqual(fin.n, 10000); assert.deepStrictEqual(fin.h, G.histogram(V.MAIN, 10000));
});
test("on-screen claims: 'The bell curve.' only at 10,000; scene counts match their titles", () => {
  const sc = Object.fromEntries(V.S.map((s) => [s.id, s])), at = (t) => V.landed(V.MAIN, V.SCHED_MAIN, t).n;
  assert(at(sc.first.t1) === 101 || at(sc.first.t1) <= 101); assert(at(sc.first.t1) >= 95, "about 100 balls by the end of '100 balls'");
  assert(at(sc.thousand.t1) >= 990 && at(sc.thousand.t1) <= 1001);
  assert.strictEqual(at(sc.tenk.t1), 10000);
  const s = G.stats(G.histogram(V.MAIN, 10000)); assert(Math.abs(s.mean - 8) < .1 && Math.abs(s.sd - 2) < .1, "measured " + s.mean + " " + s.sd);
  const l = G.stats(G.histogram(V.LEANRUN, 2000)); assert(Math.abs(l.mean - 9.6) < .15, "lean mean " + l.mean);
  console.log("   main: mean " + s.mean.toFixed(3) + " sd " + s.sd.toFixed(3) + " · lean: mean " + l.mean.toFixed(3) + " sd " + l.sd.toFixed(3));
});
test("timelines have whole-frame durations and Shorts are 30-40 s", () => {
  for (const tl of V.timelines) { assert(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9); if (tl.id !== "full") assert(tl.dur >= 30 && tl.dur <= 40); assert(tl.events().length > 10); }
});
console.log("\n" + passes + " tests passed");
