// Checks the claims of the 18 Monte Carlo Pi video.  node engine/test_pi.js
const path = require("path"), fs = require("fs"), vm = require("vm");
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
for (const f of ["draw.js", "mc.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const M = globalThis.MC, V = globalThis.PiVideo, Dt = V.DARTS, Nd = V.NEED;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
console.log("   darts:", [100, 1000, 10000, 100000].map((n) => n + " → " + Dt.est(n).toFixed(5)).join(" | "), "  needles 5000 →", Nd.est(5000).toFixed(5));
test("'100,000 darts: three digits right' (3.14…)", () => ok(M.digitsRight(Dt.est(100000)) === 3, Dt.est(100000)));
test("the inside counter matches a direct recount", () => { let c = 0; for (let i = 0; i < 100000; i++) if (Dt.X[i] ** 2 + Dt.Y[i] ** 2 <= 1) c++; ok(c === Dt.IN[100000], c); });
test("error shrinks like 1/√N: at 100,000 darts it is within 3× the typical 1.64/√N", () => { const e = Math.abs(Dt.est(100000) - Math.PI); ok(e < 3 * 1.64 / Math.sqrt(100000), e); });
test("Buffon: crossings match the geometry, estimate within 3 standard deviations of π after 5,000 needles", () => {
  let c = 0; Nd.list.forEach((q) => { const dy = Math.sin(q.a) / 2; if (Math.floor(q.y - dy) !== Math.floor(q.y + dy)) c++; }); ok(c === Nd.CR[5000], c);
  const p = 2 / Math.PI, sdP = Math.sqrt(p * (1 - p) / 5000), sdPi = 2 / (p * p) * sdP; ok(Math.abs(Nd.est(5000) - Math.PI) < 3 * sdPi, Nd.est(5000) + " sd " + sdPi); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
