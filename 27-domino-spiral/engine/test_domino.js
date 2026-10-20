// Checks the claims of the 27 Domino Spiral video.  node engine/test_domino.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "domino.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.DominoVideo, M = V.M, P = M.P;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("the falling block: energy (rotational + height of the centre) is conserved within 0.01% until the touch", () => {
  const f = M.fall(V.CH("1000").w0[500]), I = (P.h * P.h + P.t * P.t) / 3, E = (th, w) => .5 * I * w * w + P.g * ((P.h / 2) * Math.cos(th) + (P.t / 2) * Math.sin(th));
  const w = (i) => (f.s[i + 1] - f.s[i - 1]) / 2e-3, i1 = Math.floor(f.hit.T * 1000) - 2, e0 = E(f.s[1], w(1)), e1 = E(f.s[i1], w(i1)); ok(Math.abs(e1 - e0) / e0 < 1e-4, e0 + " " + e1); });
test("each domino starts exactly when the one before touches it, at h·sin θ = d − t", () => {
  const c = V.CH("1000"); for (let i = 0; i < c.n - 1; i++) { ok(Math.abs(c.t0[i + 1] - (c.t0[i] + c.T[i])) < 1e-12, "start " + i); const th = M.angle(c, i, c.t0[i + 1] - 1e-9); ok(Math.abs(P.h * Math.sin(th) - (P.d - P.t)) < 2e-4, "touch " + i + " " + P.h * Math.sin(th)); } });
test("neighbouring dominoes never pass through each other: a falling domino's tilt never exceeds its resting angle on the next one", () => {
  for (const k of ["100", "1000"]) { const c = V.CH(k); for (let i = 0; i < c.n - 1; i++) for (const dt of [0, .02, .05, .1, .5, 2]) ok(M.angle(c, i, c.t0[i] + dt) <= M.thRest + 1e-12, k + " " + i); } });
test("numbers shown: wave speed, time for every layout, and the counts that fit the scenes", () => {
  const c = V.CH("10000"), per = (c.t0[9999] - c.t0[9000]) / 999; console.log("    steady wave: " + (P.d / per).toFixed(2) + " m/s · one domino every " + (per * 1000).toFixed(1) + " ms");
  for (const k of ["10", "100", "1000", "10000", "heart"]) { const ch = V.CH(k), n = ch.n, end = ch.t0[n - 1] + ch.T[n - 1]; console.log("    " + k + ": " + n + " dominoes, the last one is down at " + end.toFixed(2) + " s");
    const sc = V.S.find((s) => s.id === k); ok((sc.t1 - sc.t0 - .6) * V.SPEED[k] > end, k + " fits its scene"); }
  ok(29 * V.S2V > V.CH("10000").t0[9999] + V.CH("10000").T[9999], "short 2"); ok(30.4 * V.S1V > V.CH("1000").t0[999] + V.CH("1000").T[999], "short 1");
  ok(V.fallen("1000", 1e9) === 1000, "all fall"); });
test("layouts: every domino has a fall direction; neighbours are 3.6 cm apart along the path (straight-line gap shorter only at the heart’s two points; spiral turns 4.5 cm apart, dominoes 2.4 cm wide)", () => {
  for (const k of ["10", "100", "1000", "10000", "heart"]) for (const d of V.L(k).dir) ok(isFinite(d[0]) && isFinite(d[1]) && Math.abs(Math.hypot(d[0], d[1]) - 1) < 1e-9, k + " direction");
  for (const k of ["1000", "10000", "heart"]) { const L = V.L(k); for (let i = 1; i < L.n; i++) { const d = Math.hypot(L.pos[i][0] - L.pos[i - 1][0], L.pos[i][1] - L.pos[i - 1][1]); ok(k === "heart" ? d <= P.d + 2e-3 && d > .2 * P.d : Math.abs(d - P.d) < 2e-3, k + " gap " + d); } } });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); } });
console.log(`\n${pass} tests passed`);
