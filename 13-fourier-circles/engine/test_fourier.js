// Checks the claims of the 13 Fourier Circles video.  node engine/test_fourier.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "fourier.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const F = globalThis.Fourier, V = globalThis.FourierVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
console.log("   heart miss % of height:", V.KS.map((k) => k + ":" + (V.ERR[k] * 100).toFixed(1)).join(" "));
test("all 256 circles reproduce every sample point exactly (it is an exact transform)", () => { for (const k of Object.keys(V.SH)) ok(F.error(V.CO[k], 256, V.SH[k]) < 1e-9, k); });
test("'more circles, closer drawing': the miss shrinks every time the circles double", () => { for (let i = 1; i < V.KS.length; i++) ok(V.ERR[V.KS[i]] < V.ERR[V.KS[i - 1]], V.KS[i]); });
test("every circle turns a whole number of times per lap (speeds are integers)", () => { for (const k of Object.keys(V.CO)) ok(V.CO[k].every((c) => Number.isInteger(c.k)), k); });
test("64 circles draw the heart within 1% of its height; 128 circles draw the chevron within 1%", () => {
  ok(V.ERR[64] < .01, V.ERR[64]); const h = Math.max(...V.SH.loom.map((p) => p[1])) - Math.min(...V.SH.loom.map((p) => p[1])); ok(F.error(V.CO.loom, 128, V.SH.loom) / h < .01, "loom"); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
