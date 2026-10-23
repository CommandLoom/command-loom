// Checks the claims of the 22 Wait for Zero video.  node engine/test_zero.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "shrink.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const Z = globalThis.Shrink, V = globalThis.ZeroVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const KEYS = Object.keys(V.SHAPES);
test("every shape reaches 0% after exactly 100 bounces; each bounce lowers the counter by 1", () => {
  for (const k of KEYS) { const S = V.sim(k); ok(S.hits.length === 100 && S.tZero != null, k + " " + S.hits.length); S.hits.forEach((h, i) => ok(h.pct === 99 - i, k + " pct")); } });
test("no energy lost: energy per unit mass constant within 1e-9 through every bounce and every shrink", () => {
  for (const k of KEYS) { const S = V.sim(k), e0 = Z.energy(S, 0); for (const sg of S.segs) { const e = 0.5 * (sg.vx * sg.vx + sg.vy * sg.vy) + S.g * sg.y; ok(Math.abs(e - e0) < 1e-9 * Math.max(1, e0), k); } } });
test("angle in = angle out on every bounce; each bounce is on the wall; the new size is exactly (100 − bounces)% of the start", () => {
  for (const k of KEYS) { const S = V.sim(k); let prev = { a: S.a0, cx: 0, cy: 0 };
    for (const h of S.hits) { ok(Math.abs(Z.sd(S.shape, S.N, prev.a, prev.cx, prev.cy, h.x, h.y)) < 1e-9, k + " on wall");
      ok(Math.abs(Z.sd(S.shape, S.N, h.a, h.cx, h.cy, h.x, h.y)) < 1e-9, k + " still touching after the shrink");
      ok(Math.abs(h.a - S.a0 * h.pct / 100) < 1e-12, k + " size");
      const a = Z.vel(S, h.t - 1e-9), b = Z.vel(S, h.t + 1e-9); ok(Math.abs(Math.hypot(...a) - Math.hypot(...b)) < 1e-6, k + " speed"); prev = h; } } });
test("the wall never pushes the ball: the ball stays inside the current shape at all times", () => {
  for (const k of KEYS) { const S = V.sim(k); let cur = { a: S.a0, cx: 0, cy: 0 }, hi = 0;
    for (let t = 0; t < S.tZero; t += 0.0005) { while (hi < S.hits.length && S.hits[hi].t <= t) cur = S.hits[hi++]; const p = Z.pos(S, t); ok(Z.sd(S.shape, S.N, cur.a, cur.cx, cur.cy, p[0], p[1]) <= 1e-7, k + " inside " + t); } } });
test("numbers shown: time to 0% for each shape, and every scene shows its whole run", () => {
  console.log("    time to 0%", KEYS.map((k) => k + " " + V.ZERO(k).toFixed(2) + " s").join(" · "));
  for (const sc of V.S.slice(1)) ok(V.ZERO(sc.id) < sc.t1 - sc.t0 - .8, sc.id + " fits its scene"); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 20 && tl.dur <= 60, tl.id + " " + tl.dur);      // Shorts: each runs until its shape reaches 0%
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
