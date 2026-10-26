// Checks the claims of 29 Footsteps Illusion.  node engine/test_steps.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "steps.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.FootVideo, F = globalThis.Footsteps;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const all = [V.YEL, V.NAV, ...V.THREE, ...V.RACE, V.S1Y, V.S1N, ...V.S2];
test("every block moves at one constant speed (frame to frame, apart from coming back in at the start)", () => {
  for (const L of all) for (let f = 1; f < 3000; f++) { const d = F.pos(L, f / 30) - F.pos(L, (f - 1) / 30); ok(Math.abs(d - L.v / 30) < 1e-6 || d < 0, L.color + " " + f); } });
test("each block is a whole number of stripe periods long, so both its edges are always on the same colour", () => {
  for (const L of all) { ok(Math.abs(L.w / L.P - Math.round(L.w / L.P)) < 1e-9, L.color); for (let t = 0; t < 20; t += .013) { const s = F.pos(L, t); ok(F.black(L, s + 1e-6) === F.black(L, s + L.w + 1e-6), "edges " + t); } } });
test("the yellow and the dark-blue block take turns: their steps alternate", () => { const y = F.steps(V.YEL, 0, 20), n = F.steps(V.NAV, 0, 20), all2 = [...y.map((t) => [t, "y"]), ...n.map((t) => [t, "n"])].sort((a, b) => a[0] - b[0]);
  let alt = 0; for (let i = 1; i < all2.length; i++) if (all2[i][1] !== all2[i - 1][1]) alt++; console.log(`   ${y.length} + ${n.length} steps in 20 s, ${alt} of ${all2.length - 1} changes of foot`); ok(alt >= all2.length - 4, alt); });
test("steps per second = speed / stripe period (thin stripes 4, 32 px 2, wide 1)", () => V.THREE.forEach((L) => { const n = F.steps(L, 0, 30).length / 30; ok(Math.abs(n - L.v / L.P) < .1, L.P + " " + n); }));
test("the race is a tie: all six fronts reach the finish line in the same frame (long video and Short 2)", () => {
  for (const L of V.RACE) ok(Math.abs(F.pos(L, V.RACE_END - V.RSTART) + L.w - V.RFIN) < 1e-6, "long " + L.color);
  for (const L of V.S2) ok(Math.abs(F.pos(L, V.S2END - V.S2START) + L.w - V.S2FIN) < 1e-6, "short " + L.color); console.log(`   long video finish at ${V.RACE_END.toFixed(2)} s, Short 2 at ${V.S2END.toFixed(2)} s`); });
test("timelines: whole frames, no gap in the sound longer than 1.5 s; chapters at least 10 s apart", () => { for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id);
  const ts = tl.events().map((e) => e.t); let g = ts[0]; for (let i = 1; i < ts.length; i++) g = Math.max(g, ts[i] - ts[i - 1]); g = Math.max(g, tl.dur - .6 - ts[ts.length - 1]);
  console.log(`   ${tl.id}: ${ts.length} sounds, longest gap ${g.toFixed(2)} s`); ok(g < 1.5, tl.id + " " + g); }
  const c = V.SCENES.map((s) => s.t0); for (let i = 1; i < c.length; i++) ok(c[i] - c[i - 1] >= 10, "chapter " + i); ok(100 - c[c.length - 1] >= 10, "last chapter"); });
console.log(`\n${pass} tests passed`);
