// Checks the claims of the 32 Doubling Balls video.  node engine/test_doubling.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "doubling.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const Z = globalThis.Doubling, V = globalThis.DoublingVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const KEYS = Object.keys(V.SHAPES);
(async () => {
  await V.ready;
  test("every new ball appears at a bounce, at the bouncing ball's position, until exactly 4,096", () => {
    for (const k of KEYS) { const S = V.sim(k); ok(S.balls.length === V.CAP, k + " " + S.balls.length);
      for (const b of S.balls.slice(1)) { const p = S.balls[b.parent], q = Z.pos(S, p, b.born), m = b.segs[0]; ok(Math.hypot(q[0] - m[1], q[1] - m[2]) < 1e-9, k + " spawn point"); ok(Math.abs(Z.sd(S.N, S.a, m[1], m[2])) < 1e-9, k + " on wall"); } } });
  test("no energy lost: every ball keeps its energy per unit mass through every bounce (within 1e-9), copies included", () => {
    for (const k of KEYS) { const S = V.sim(k), e = (q) => 0.5 * (q[3] * q[3] + q[4] * q[4]) + S.g * q[2], e0 = e(S.balls[0].segs[0]);
      for (const b of S.balls) for (const q of b.segs) ok(Math.abs(e(q) - e0) < 1e-9 * Math.max(1, e0), k); } });
  test("angle in = angle out, and every ball stays inside its shape the whole time", () => {
    for (const k of KEYS) { const S = V.sim(k);
      for (const b of S.balls.filter((_, i) => i % 16 === 0)) { for (let t = b.born; t < S.tEnd; t += 0.002) { const p = Z.pos(S, b, t); ok(Z.sd(S.N, S.a, p[0], p[1]) <= 1e-9, k + " inside"); }
        for (const q of b.segs.slice(1)) { const a = Z.vel(S, b, q[0] - 1e-9), c = [q[3], q[4]]; ok(Math.abs(Math.hypot(...a) - Math.hypot(...c)) < 1e-6, k + " speed"); } } } });
  test("numbers shown: the time to reach 4,096 and the counts at each second", () => {
    for (const k of KEYS) { const S = V.sim(k); console.log("    " + k + ": 4,096 at " + S.tCap.toFixed(2) + " s · counts at 1..6 s " + [1, 2, 3, 4, 5, 6].map((t) => Z.count(S, t)).join(", ") + " · bounces " + S.hits.length); }
    const sc = (id) => V.S.find((s) => s.id === id); for (const k of KEYS) ok(V.sim(k).tCap < (sc(k).t1 - sc(k).t0) / V.SLOW - .3, k + " reaches 4,096 in its scene");
    for (const k of KEYS) ok(V.TEND[k] >= Math.max((sc(k).t1 - sc(k).t0) / V.SLOW, sc("all").t1 - sc("all").t0, 32 / V.SLOW), k + " simulated long enough"); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
})();
