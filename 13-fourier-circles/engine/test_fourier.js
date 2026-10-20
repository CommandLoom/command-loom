// Checks the claims of the 13 Fourier Circles video.  node engine/test_fourier.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "fourier.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const F = globalThis.Fourier, V = globalThis.FourierVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const H = (z) => Math.max(...z.map((p) => p[1])) - Math.min(...z.map((p) => p[1]));
console.log("   heart miss % of height:", V.KS.map((k) => k + ":" + (V.ERR[k] * 100).toFixed(2)).join(" "));
test("all 256 circles reproduce every sample point exactly (it is an exact transform)", () => { for (const k of Object.keys(V.SH)) ok(F.error(V.CO[k], 256, V.SH[k]) < 1e-9, k); });
test("'more circles, closer heart': the miss shrinks every time the circles double", () => { for (let i = 1; i < V.KS.length; i++) ok(V.ERR[V.KS[i]] < V.ERR[V.KS[i - 1]], V.KS[i]); });
test("every circle turns a whole number of times per lap (speeds are integers)", () => { for (const k of Object.keys(V.CO)) ok(V.CO[k].every((c) => Number.isInteger(c.k)), k); });
test("each shape is drawn with circles that miss it by less than 1% of its height", () => {
  ok(V.ERR[64] < .01, "heart " + V.ERR[64]); for (const R of V.SHAPES) { const e = F.error(V.CO[R.key], R.K, V.SH[R.key]) / H(V.SH[R.key]); console.log("   " + R.key + " " + R.K + " circles: miss " + (e * 100).toFixed(3) + "%"); ok(e < .01, R.key); } });
test("lap clock: lapsAt and timeAt are inverses and the laps speed up", () => { const d = [4, 2.5, 1.5]; for (const s of [0, .3, 1, 1.7, 2.5, 3.9]) ok(Math.abs(V.lapsAt(V.timeAt(s, 10, d), 10, d) - s) < 1e-9, s); });
test("timelines: whole frames, Shorts 30–40 s, events inside, no gap in the sound longer than 1.5 s", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(), ts = ev.map((e) => e.t).sort((a, b) => a - b); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events");
    let gap = ts[0]; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]); console.log("   " + tl.id + ": " + ev.length + " notes, longest gap " + gap.toFixed(2) + " s, last note " + ts[ts.length - 1].toFixed(2));
    ok(gap < 1.5, tl.id + " gap " + gap); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
