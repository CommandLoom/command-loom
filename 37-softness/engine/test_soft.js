// Checks the claims of the 37 Softness video.  node engine/test_soft.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "jelly.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const J = globalThis.Jelly, V = globalThis.SoftVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const stat = (f) => { let mnx = 9, mxx = -9, mny = 9, mxy = -9, cy = 0; for (let i = 0; i < f.length; i += 2) { mnx = Math.min(mnx, f[i]); mxx = Math.max(mxx, f[i]); mny = Math.min(mny, f[i + 1]); mxy = Math.max(mxy, f[i + 1]); cy += f[i + 1]; } return { w: mxx - mnx, h: mxy - mny, mny, cy: cy / (f.length / 2) }; };
const area = (f) => { let A = 0; const M = f.length / 2; for (let i = 0; i < M; i++) { const j = (i + 1) % M; A += f[2 * i] * f[2 * j + 1] - f[2 * j] * f[2 * i + 1]; } return A / 2; };
(async () => {
  await V.ready;
  const rows = V.LEVELS.map((p) => { const R = V.sim(p, 30, 7), cys = R.frames.map((f) => stat(f).cy); let first = 0; for (let i = 1; i < cys.length; i++) if (cys[i] > cys[i - 1]) { first = i; break; }
    const rebound = first ? Math.max(...cys.slice(first, first + 30)) - J.DEF.R : 0, squash = Math.min(...R.frames.map((f) => { const s = stat(f); return s.h / s.w; })); return { p, rebound, squash, R }; });
  test("softer means a lower bounce and a flatter squash, at every step of the ladder", () => {
    rows.forEach((r) => console.log(`    ${r.p}%: bounces back to ${(Math.max(0, r.rebound) * 100).toFixed(1)} cm · flattest height/width ${r.squash.toFixed(2)}`));
    for (let i = 1; i < rows.length; i++) { ok(rows[i].rebound <= rows[i - 1].rebound + 1e-3, "bounce " + rows[i].p); ok(rows[i].squash <= rows[i - 1].squash + 0.02, "squash " + rows[i].p); } });
  test("a jelly hardly changes its volume: area stays within 10% of the start in every frame of every run", () => {
    let lo = 9, at = ""; for (const [p, cm, secs] of V.NEED) { const R = V.sim(p, cm, secs), A0 = R.A0; for (const f of R.frames) { const a = area(f) / A0; ok(a > .9 && a < 1.1, p + "% " + cm + " cm area " + a.toFixed(3)); if (a < lo) { lo = a; at = p + "% from " + cm + " cm"; } } }
    console.log("    most squeezed: " + (100 * lo).toFixed(0) + "% of its area (" + at + ")"); });
  test("nothing goes through the floor (no point lower than 0.1 mm below it)", () => {
    for (const [p, cm, secs] of V.NEED) for (const f of V.sim(p, cm, secs).frames) ok(stat(f).mny > -1e-4, p + " floor"); });
  test("the drop height is the gap under the ball at the start; every run starts at rest and lands at the predicted time (√(2h/g), within one frame)", () => {
    for (const cm of V.HEIGHTS) { const R = V.sim(100, cm, 4.2), s0 = stat(R.frames[0]); ok(Math.abs(s0.mny - cm / 100) < 1e-6, "height " + cm); const land = R.hits[0][0]; ok(Math.abs(land - Math.sqrt(2 * cm / 100 / 9.81)) < 1 / 30 + 1e-3, cm + " lands " + land); } });
  test("deterministic: the same run twice gives the same frames", () => { const a = J.run(.6, 1, { ...V.OPT, y0: 0.35 }), b = J.run(.6, 1, { ...V.OPT, y0: 0.35 }); ok(a.frames.every((f, i) => f.every((v, j) => v === b.frames[i][j])), "same"); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
})();
