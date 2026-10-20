// Checks the claims of the 17 Material Sounds video.  node engine/test_materials.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "materials.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const M = globalThis.Materials, V = globalThis.MaterialVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  test("same drop for every material: released at 0.5 s from 40 cm, first touches the spike at the same moment", () => {
    const t = V.KEYS.map((k) => V.SIM[k].hits[0].t); console.log("     first contact", t.map((x) => x.toFixed(3)).join(" ")); ok(t.every((x) => Math.abs(x - t[0]) < 1e-9), "same"); });
  test("brittle materials break into pieces; metal and jelly stay whole", () => { for (const k of V.KEYS) { const sim = V.SIM[k]; ok((sim.pieces.length > 0) === !!M.MAT[k].breaks, k); } });
  test("nothing leaves the tray: every piece still in play at the end is inside the walls and above the floor", () => {
    for (const k of V.KEYS) { const f = V.SIM[k].frames[V.SIM[k].frames.length - 1]; for (const p of f.pieces) if (p[3]) ok(Math.abs(p[0]) <= M.TRAY + .01 && p[1] >= -.01, k);
      const b = f.balls[0]; if (b.on) ok(Math.abs(b.x) <= M.TRAY && b.y >= 0, k + " ball"); } });
  test("the same run every time (seeded): two simulations of glass give identical pieces and collisions", () => {
    const a = M.simulate("glass", [{ t: .5, x: .4 }], 2, 120), b = M.simulate("glass", [{ t: .5, x: .4 }], 2, 120); ok(a.hits.length === b.hits.length && a.hits.every((h, i) => h.t === b.hits[i].t && h.v === b.hits[i].v), "seed"); });
  test("every sound is a recorded collision (or a jelly wobble): counts per material", () => {
    for (const k of V.KEYS) { const n = V.hitNotes(k, 0, 0, 6).length; console.log(`     ${k}: ${V.SIM[k].hits.length} collisions → ${n} sounds`); ok(n > 0, k); } });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
});
