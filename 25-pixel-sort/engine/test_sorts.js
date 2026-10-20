// Checks the claims of the 25 Pixel Sort video.  node engine/test_sorts.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "sorts.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const SO = globalThis.Sorts, V = globalThis.PixelVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("every algorithm sorts every row of every grid, and replaying the recorded writes gives the same sorted row", () => {
  for (const g of Object.keys(V.GRIDS)) for (const a of V.ALGS) for (const r of V.run(g, a)) { ok(r.out.every((v, i) => v === i), g + a); const row = SO.rowAt(r, r.ops, new Array(r.start.length)); ok(row.every((v, i) => v === i), g + a + " replay"); } });
test("swap-based sorts (bubble, selection, quick, heap): after every complete swap the row holds the same colours, none lost or doubled", () => {
  for (const a of ["bubble", "selection", "quick", "heap"]) { const r = V.run("L", a)[25], W = r.start.length, row = r.start.slice(); ok(r.writes.length % 2 === 0, a + " pairs");
    for (let i = 0; i < r.writes.length; i += 2) { row[r.writes[i][1]] = r.writes[i][2]; row[r.writes[i + 1][1]] = r.writes[i + 1][2]; ok(new Set(row).size === W, a + " at swap " + i / 2); } } });
test("rows start shuffled and differ from each other; the same seed gives the same grid", () => {
  const A = SO.grid(100, 50, 7), B = SO.grid(100, 50, 7); ok(JSON.stringify(A) === JSON.stringify(B), "seed");
  ok(new Set(A.map((r) => r.join())).size === 50, "rows differ"); ok(A.every((r) => !r.every((v, i) => v === i)), "shuffled"); });
test("numbers shown: operations per algorithm (long grid, the most in one row) and the race times at equal speed", () => {
  const rate = V.raceRate();
  console.log("    most operations in one row:", V.ALGS.map((a) => a + " " + V.run("L", a).max).join(" · "));
  console.log("    race at " + rate.toFixed(0) + " op/s: finishes", V.ALGS.map((a) => a + " " + (V.run("R", a).max / rate).toFixed(1) + " s").join(" · "));
  ok(Math.abs(V.run("R", "bubble").max / rate - V.RACE) < 1e-9, "bubble ends the race");
  const vr = V.run("V", "bubble").max / V.V_RACE; console.log("    Short 2: quicksort done at " + (V.run("V", "quick").max / vr + .5).toFixed(1) + " s, bubble at " + (V.V_RACE + .5) + " s"); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length + " " + Math.max(...ev.map((e) => e.t))); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
