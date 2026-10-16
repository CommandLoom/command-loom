// Checks every number and claim the 07 Rainbow video shows.  node engine/test_rainbow.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "optics.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const O = globalThis.Optics, V = globalThis.RainbowVideo;
V.profiles();
let pass = 0;
function test(name, fn) { fn(); pass++; console.log("PASS " + name); }
const ok = (c, m) => { if (!c) throw new Error(m); };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b}`);

test("water index near the handbook 1.333 at the sodium D line, normal dispersion", () => {
  near(O.nWater(589.3), 1.3330, 5e-4, "n(589.3)"); ok(O.nWater(400) > O.nWater(550) && O.nWater(550) > O.nWater(700), "normal dispersion");
});
test("traced ray extremes equal the analytic rainbow angles (primary max, secondary min)", () => {
  for (const l of [400, 550, 700]) {
    let mx = 0, mn = 180; for (let i = 1; i < 20000; i++) { const b = i / 20000, a = O.trace(b, l, 1), c = O.trace(b, l, 2); if (a) mx = Math.max(mx, a.angle); if (c) mn = Math.min(mn, c.angle); }
    near(mx, O.rainbowAngle(l, 1), .01, "primary " + l); near(mn, O.rainbowAngle(l, 2), .01, "secondary " + l);
  }
});
test("on-screen angles: red 42.4°, violet 40.6°, secondary ~51° with colours reversed", () => {
  ok(V.A1[700].toFixed(1) === "42.4" && V.A1[400].toFixed(1) === "40.6", "primary labels " + V.A1[700] + " " + V.A1[400]);
  ok(V.A1[700] > V.A1[400], "red outside on the primary"); ok(V.A2[400] > V.A2[700], "secondary reversed: violet outside");
  ok(Math.round(V.A2[550]) === 51, "secondary label 51°: " + V.A2[550]);
});
test("split scene: for the demo ray (impact 0.86) red really leaves at a bigger angle than violet", () => {
  const r = O.trace(V.B_DEMO, 700, 1).angle, v = O.trace(V.B_DEMO, 400, 1).angle; ok(r > v, `red ${r} violet ${v}`);
  near(V.bMin(550), .86, .01, "0.86 is the green minimum-deviation impact parameter");
});
test("sweep: the histogram of 480 uniform rays peaks in the bin holding the 550 nm rainbow angle", () => {
  const bins = new Array(46).fill(0); for (let i = 0; i < V.SWEEP_N; i++) { const tr = O.trace(V.sweepB(i), 550, 1); if (tr) bins[Math.min(45, Math.floor(tr.angle))]++; }
  ok(bins.indexOf(Math.max(...bins)) === Math.floor(V.A1[550]), "peak bin " + bins.indexOf(Math.max(...bins)));
  ok(V.sweepAt(1e9, 15) === V.SWEEP_N, "sweep completes");
});
test("colour curves peak at the rainbow angle; secondary is dimmer; dark band between", () => {
  for (const l of V.WL) { const p = V.PROF["1:" + l]; let j = 0; for (let i = 0; i < p.length; i++) if (p[i] > p[j]) j = i; near(j * .05, V.A1[l], .35, "profile peak " + l); }
  const p1 = V.PROF["1:550"], p2 = V.PROF["2:550"], mx = (p) => Math.max(...p);
  ok(mx(p2) < .6 * mx(p1), "secondary dimmer " + mx(p2) / mx(p1));
  const at = (p, a) => p[Math.floor(a / .05)]; ok(at(p1, 46.5) + at(p2, 46.5) < .2 * at(p1, 38), "Alexander's band darker than inside the bow");
});
test("timelines: whole frames, Shorts 30–40 s, scenes contiguous", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id + " frames"); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id + " length"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous " + V.S[i].id);
  ok(V.S[V.S.length - 1].t1 === V.timelines[0].dur, "full duration");
  for (const tl of V.timelines) { const ev = tl.events(); ok(ev.every((e) => e.t >= 0 && e.t < tl.dur - .6), tl.id + " events inside, before the end fade"); }
});
console.log(`\n${pass} tests passed`);
