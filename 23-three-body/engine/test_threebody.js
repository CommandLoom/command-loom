// Checks the claims of the 23 Three Body video.  node engine/test_threebody.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "threebody.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.ThreeBody, V = globalThis.TBVideo, P = V.P;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => { const st = V.STATS; console.log("   ", JSON.stringify(st));
  test("integrator: energy kept to 1 part in 10 million on every run", () => { for (const k in P) { const d = Math.abs((P[k].E1 - P[k].E0) / P[k].E0); console.log("    ", k, "energy drift", d.toExponential(1), "closest pass", P[k].minDist.toExponential(1)); ok(d < 1e-7, k); } });
  test("figure-eight: back to the start after 10 laps within one millionth; centre of mass fixed", () => { ok(st.backErr < 1e-6, st.backErr);
    const q = V.at(P.eight, 7.3); ok(Math.abs(q[0] + q[2] + q[4]) < 1e-9 && Math.abs(q[1] + q[3] + q[5]) < 1e-9, "com"); });
  test("figure-eight: all three stars follow the same curve (the middle star reaches each spot a third of a lap after the first)", () => { const T = K.EIGHT.T; let e = 0;
    for (let t = 0; t < T; t += .05) { const a = V.at(P.eight, t + T / 3), b = V.at(P.eight, t); e = Math.max(e, Math.hypot(a[2] - b[0], a[3] - b[1])); } ok(e < 1e-3, e); });
  test("nudged 3% faster: stays bounded for 20 laps (farthest < 1.5)", () => ok(st.nudgeR < 1.5 && st.nudgeR > st.eightR, st.nudgeR));
  test("3-4-5 problem: the copies agree to 0.1 until they split, between t = 30 and 40", () => ok(st.split > 30 && st.split < 40, st.split));
  test("3-4-5 problem: the original ejects its lightest star (mass 3); the other two leave together as a pair", () => { ok(st.eject > st.split && st.eject < 80, st.eject);
    const q = V.at(P.py, V.PY_END), r = (b) => Math.hypot(q[2 * b], q[2 * b + 1]), pair = Math.hypot(q[2] - q[4], q[3] - q[5]);
    console.log("     at t = 100: radii", [0, 1, 2].map((b) => r(b).toFixed(1)).join("/"), "· pair separation", pair.toFixed(2)); ok(r(0) > 2 * r(1) && r(0) > 30 && pair < 1.5, "fate"); });
  test("3-4-5 problem: the copy has ejected nothing by t = 100 (all stars within 5 of the centre)", () => ok(st.copyR.every((r) => r < 5), st.copyR));
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
});
