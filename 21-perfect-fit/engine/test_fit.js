// Checks the claims of the 21 Perfect Fit video.  node engine/test_fit.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "fit.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const F = globalThis.Fit, V = globalThis.FitVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("geometry check works: a piece fits its own 2%-larger hole when not turned, and never fits a hole smaller than itself", () => {
  for (const k in F.SHAPES) { ok(F.fits(k, 0, 1), k + " own"); ok(!F.fits(k, 0, 1.05), k + " bigger"); } });
test("each ladder ends with a fit and every earlier step is a miss (as shown on screen)", () => {
  for (const k in V.LADDERS) { const r = V.LADDERS[k].values.map((v) => V.fitsStep(k, v)); console.log("    ", k, V.LADDERS[k].values.map((v, i) => v + (r[i] ? "✓" : "✗")).join(" "));
    ok(r[r.length - 1] && r.slice(0, -1).every((x) => !x), k); } });
test("limits: the largest turn that still fits is under half a degree for all three turned shapes", () => {
  for (const k of ["star", "gear", "plus"]) { const a = F.maxAngle(k); console.log(`     ${k}: fits up to ${a.toFixed(3)}°`); ok(a > 0.05 && a < 0.5, k); } });
test("free fall: first impact after √(2h/g); every bounce keeps 35% of the speed", () => {
  const d = F.drop(0.25, 0.04, false); ok(Math.abs(d.t1 - Math.sqrt(0.5 / 9.81)) < 1e-12, "t1");
  for (let i = 1; i < d.imp.length; i++) ok(Math.abs(d.imp[i].v / d.imp[i - 1].v - .35) < 1e-12, "e"); ok(Math.abs(d.y(d.t1)) < 1e-9, "contact"); });
test("every piece of a row has landed and settled before its scene ends (long video and Shorts)", () => {
  for (const k of V.ORDER) { const last = V.doneAt(k, V.LADDERS[k].values.length - 1); ok(last + .6 < V.SC, k + " " + last); }
  for (const k of ["star", "heart"]) ok(1 + V.doneAt(k, 7, V.S_DT) + .6 < 29.4, "short " + k); });
test("timelines: whole frames, Shorts 30–40 s, events inside, no gap in the sound longer than 1.5 s", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(), ts = ev.map((e) => e.t).sort((a, b) => a - b); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length);
    let gap = ts[0]; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]); console.log("     " + tl.id + ": " + ev.length + " notes, longest gap " + gap.toFixed(2) + " s, last note " + ts[ts.length - 1].toFixed(2));
    ok(gap < 1.5, tl.id + " gap " + gap); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
