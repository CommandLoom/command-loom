// Checks that each pattern label matches what the simulation actually makes.  node engine/test_turing.js  (about a minute)
const path = require("path"), fs = require("fs"), vm = require("vm");
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
for (const f of ["draw.js", "rd.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const RD = globalThis.RD, V = globalThis.TuringVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const runPanel = (key, i) => { const [F, k] = V.PATTERNS[key]; return new RD.Sim(V.PANEL_N, F, k, 11 + i, .1).step(V.PANEL_END); };
const keys = Object.keys(V.PATTERNS), res = {};
keys.forEach((k, i) => { const s = runPanel(k, i); res[k] = { blobs: s.blobs(), cover: s.cover() }; console.log("  ", k, res[k].blobs, "blobs,", (res[k].cover * 100).toFixed(0) + "% covered"); });
test("'spots that split': many separate spots, most of the dish empty", () => ok(res.spots.blobs >= 25 && res.spots.cover < .35, JSON.stringify(res.spots)));
test("'stripes' and 'labyrinth': a few long connected bands, not spots", () => { ok(res.stripes.blobs <= 12 && res.stripes.cover > .25, JSON.stringify(res.stripes)); ok(res.maze.blobs <= 6 && res.maze.cover > .35, JSON.stringify(res.maze)); });
test("'holes': V covers most of the dish in one connected sheet", () => ok(res.holes.blobs <= 3 && res.holes.cover > .55, JSON.stringify(res.holes)));
test("growing dish: the spot count really goes up over time (spots split)", () => {
  const sim = V.growMake(), counts = []; for (let i = 0; i < 6; i++) { sim.step(Math.round(14040 / 6)); counts.push(sim.blobs()); }
  console.log("   counts", counts.join(" ")); ok(counts[5] > counts[0] * 3 && counts[5] >= 30, "counts " + counts);
});
test("timelines: whole frames, Shorts 30–40 s, scenes contiguous", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id + " length"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
