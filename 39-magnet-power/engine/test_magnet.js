// Checks the claims of the 39 Magnet Power video.  node engine/test_magnet.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "grains.js", "magnet.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const M = globalThis.Magnet, V = globalThis.MagnetVideo, P = M.DEF;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
(async () => {
  await V.ready;
  test("more power moves more balls: the count after the pass rises at every step of the ladder", () => {
    const c = V.POWERS.map((p) => M.moved(V.run(p), 360)); console.log("    balls moved after 12 s: " + V.POWERS.map((p, i) => p + " → " + c[i]).join(" · "));
    for (let i = 1; i < c.length; i++) ok(c[i] > c[i - 1], "ladder " + V.POWERS[i]); });
  test("the reach circle is right: the pull equals static friction exactly at the reach (P·(1 cm/d)⁴ = 0.3)", () => {
    for (const p of V.POWERS) { const d = M.reach(p); ok(Math.abs(p * Math.pow(0.01 / d, 4) - P.muS) < 1e-12, "reach " + p); console.log("    power " + p + ": reach " + (d * 100).toFixed(2) + " cm"); } });
  test("balls more than 3 cm beyond the reach of the magnet's path never move", () => {
    for (const p of V.POWERS) { const R = V.run(p), fr = R.frames[R.frames.length - 1], far = M.reach(p) + 0.03;
      for (let i = 0; i < R.n; i++) { const [x0, y0] = R.start[i]; if (Math.abs(y0) > far) ok(Math.hypot(fr[2 * i] - x0, fr[2 * i + 1] - y0) < 1e-6, p + " far ball " + i + " moved"); } } });
  test("balls stay apart: no two overlap by more than 15% of a radius at the end of any run", () => {
    for (const p of V.POWERS) { const R = V.run(p), f = R.frames[R.frames.length - 1]; let worst = 0;
      for (let i = 0; i < R.n; i++) for (let j = i + 1; j < R.n; j++) { const d = Math.hypot(f[2 * j] - f[2 * i], f[2 * j + 1] - f[2 * i + 1]); worst = Math.max(worst, (2 * P.r - d) / P.r); }
      ok(worst < .15, p + " overlap " + worst.toFixed(3)); } });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
})();
