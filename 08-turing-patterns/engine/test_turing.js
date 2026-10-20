// Checks the claims of the 08 Turing Patterns video.  node engine/test_turing.js  (a few minutes)
const path = require("path"), fs = require("fs"), vm = require("vm");
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
for (const f of ["draw.js", "rd.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.TuringVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const end = {}; for (const sc of V.S.slice(1, 5)) { const sim = V.make(sc.key, V.GW, V.GH, 3 + Object.keys(V.P).indexOf(sc.key))(); sim.step(Math.round((sc.t1 - sc.t0 - .3) * 30) * sc.rate);
  end[sc.key] = { blobs: sim.blobs(), cover: sim.cover(), reach: sim.reach() }; console.log("   " + sc.key + ": " + end[sc.key].blobs + " pieces, covers " + (100 * end[sc.key].cover).toFixed(0) + "%, reached " + (100 * end[sc.key].reach).toFixed(0) + "% of the screen"); }
test("labels match the simulation: many separate spots; stripes and maze are a few long bands; the last one is a few big rings covering most of the screen", () => {
  ok(end.spots.blobs >= 100 && end.spots.cover < .5, "spots"); ok(end.stripes.blobs <= 15 && end.stripes.cover > .25, "stripes"); ok(end.maze.blobs <= 6 && end.maze.cover > .35, "maze"); ok(end.holes.blobs <= 8 && end.holes.cover > .55, "rings"); });
test("every pattern grows from one dot to (nearly) the whole screen within its scene", () => { for (const k of Object.keys(end)) ok(end[k].reach > .4, k + " reach " + end[k].reach); });
test("the spot count starts at one and goes up as spots split", () => { const sim = V.make("spots", V.GW, V.GH, 3)(), c = []; for (let i = 0; i < 6; i++) { sim.step(3900); c.push(sim.blobs()); } console.log("   spots every 3,900 steps: " + c.join(" ")); for (let i = 1; i < 6; i++) ok(c[i] >= c[i - 1], "monotone"); ok(c[5] > 10 * Math.max(1, c[0]), "splits"); });
test("sound all the way through: no gap of 2 s or more between notes in the long video, and every note is inside the video", () => {
  const ev = V.timelines[0].events().map((e) => e.t).sort((a, b) => a - b); let gap = 0, at = 0; for (let i = 1; i < ev.length; i++) if (ev[i] - ev[i - 1] > gap) { gap = ev[i] - ev[i - 1]; at = ev[i - 1]; }
  console.log("   " + ev.length + " notes · longest gap " + gap.toFixed(2) + " s at " + at.toFixed(1) + " s"); ok(gap < 2, "gap"); ok(ev[0] < 1 && ev[ev.length - 1] < 99.5, "range"); });
test("timelines: whole frames, Shorts 30–40 s, scenes contiguous", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id + " length"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
