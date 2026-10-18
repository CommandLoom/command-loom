// Checks the claims of the 14 Lorenz Butterfly video.  node engine/test_lorenz.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "lorenz.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const L = globalThis.Lorenz, V = globalThis.LorenzVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  const S = V.SEP, H = V.H;
  test("RK4 step 0.005 is converged: halving the step changes the single orbit by < 1e-4 at time 5 (chaos amplifies any tiny error later; that is the point of the video)", () => {
    const a = L.orbit([1, 1, 1], .005, 1000)[1000], b = L.orbit([1, 1, 1], .0025, 2000)[2000]; ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-4, a + " " + b); });
  test("'one billionth apart' at the start, more than 1 unit apart later (split time measured)", () => { ok(Math.abs(S[0] - 1e-9) < 1e-12, S[0]); console.log("   split time", V.SPLIT_T.toFixed(2)); ok(V.SPLIT_T > 10 && V.SPLIT_T < 40, V.SPLIT_T); });
  test("the gap grows exponentially (measured average rate for this pair; the long-run Lyapunov exponent is about 0.9)", () => {
    const i0 = Math.round(2 / H), i1 = Math.round((V.SPLIT_T - 2) / H), rate = (Math.log(S[i1]) - Math.log(S[i0])) / ((i1 - i0) * H); console.log("   growth rate", rate.toFixed(3)); ok(rate > .3 && rate < 1.2, rate); });
  test("'it loops around one wing, then jumps to the other': many wing switches, on both sides", () => { const n = V.switches(V.A, 6000); console.log("   switches", n); ok(n >= 8, n); });
  test("the cloud of 10,000 ends spread over both wings (right-wing share between 35% and 65%)", () => {
    const c = new L.Cloud(10000, V.START, .01, 3); for (let i = 0; i < 5000; i++) c.step(H); console.log("   spread", c.spread().toFixed(1), "right", c.rightShare().toFixed(2)); ok(c.spread() > 5 && c.rightShare() > .35 && c.rightShare() < .65, c.rightShare()); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  });
  console.log(`\n${pass} tests passed`);
});
