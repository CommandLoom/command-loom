// Checks the claims of the 34 Pendulum Chords video.  node engine/test_chords.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "pendulum.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const P = globalThis.Pend, V = globalThis.ChordVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("pendulum n makes exactly 51 + n swings in 60 s; lengths from T = 2π√(L/g)", () => {
  for (let n = 0; n < P.N; n++) { ok(Math.abs(60 / P.T(n) - (51 + n)) < 1e-9, "swings " + n); ok(Math.abs(2 * Math.PI * Math.sqrt(P.L(n) / P.g) - P.T(n)) < 1e-12, "length " + n); }
  console.log("    lengths " + (P.L(0) * 100).toFixed(1) + " cm to " + (P.L(15) * 100).toFixed(1) + " cm"); });
test("notes: C, E, G, B repeated over four octaves, longest pendulum lowest (C2 = MIDI 36 … B5 = MIDI 83)", () => {
  for (let n = 1; n < P.N; n++) ok(P.midi(n) > P.midi(n - 1), "rising"); ok(P.midi(0) === 36 && P.midi(15) === 83, "range");
  for (let n = 0; n < P.N; n++) ok([0, 4, 7, 11].includes(P.midi(n) % 12), "chord tone"); });
test("captions match the phases: 1 group at 0 and 60 s, 4 at 15/45/75, 3 at 20/40/80, 2 at 30/90", () => {
  const want = { 0: 1, 15: 4, 20: 3, 30: 2, 40: 3, 45: 4, 60: 1, 75: 4, 80: 3, 90: 2 };
  for (const [m] of V.CAPS) ok(P.groups(m) === want[m], m + " → " + P.groups(m)); });
test("at 15 s each group is one note name (all C, all E, …); at 30 s the groups are {C, G} and {E, B}; at 45 s the arpeggio runs the other way", () => {
  for (const G of P.groupMembers(15)) ok(new Set(G.map((n) => n % 4)).size === 1, "15 s group " + G);
  for (const G of P.groupMembers(30)) { const s = [...new Set(G.map((n) => P.NAMES[n % 4]))].sort().join(""); ok(s === "CG" || s === "BE", "30 s " + s); }
  const order = (t0) => [0, 1, 2, 3].map((c) => [c, P.peaks(c, t0, t0 + 2)[0]]).sort((a, b) => a[1] - b[1]).map((x) => P.NAMES[x[0]]).join("");
  const a = order(15), b = order(45); console.log("    first notes after 15 s: " + a + " · after 45 s: " + b);
  const cyc = (x) => [0, 1, 2, 3].map((i) => x.slice(i) + x.slice(0, i)); ok(cyc(a.split("").reverse().join("")).includes(b), "reversed cycle"); });
test("timelines: whole frames, Shorts 30–40 s, every note at a right-hand turn, sound before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
  for (let n = 0; n < P.N; n++) for (const t of P.peaks(n, 0, 61)) ok(Math.abs(P.theta(n, t) - P.A) < 1e-12, "peak"); });
console.log(`\n${pass} tests passed`);
