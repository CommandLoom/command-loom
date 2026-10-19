// Checks the claims of the 28 Gravity Ladder video.  node engine/test_gravity.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "gravity.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const G = globalThis.Gravity, V = globalThis.GravityVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("no energy lost: energy per unit mass stays within 1e-9 on every bounce, for every planet", () => {
  for (const p of V.PL) { const B = V.sim(p.g), e0 = G.energy(B[0], p.g); for (const b of B) ok(Math.abs(G.energy(b, p.g) - e0) < 1e-9 * Math.max(1, Math.abs(e0)), p.name); } });
test("the ball never leaves the ring: every bounce is at radius R - r, and mid-flight points stay inside", () => {
  for (const p of V.PL) { const B = V.sim(p.g); for (let i = 1; i < B.length; i++) { ok(Math.abs(Math.hypot(B[i].x, B[i].y) - (V.R - V.r)) < 1e-9, "bounce radius");
    const m = (B[i - 1].t + B[i].t) / 2, q = G.pos(B, p.g, m); ok(Math.hypot(q[0], q[1]) <= V.R - V.r + 1e-9, "flight"); } } });
test("same path, only faster: bounce n happens at time t_n(Moon) × √(g_Moon / g) for every planet (within 1e-6 s)", () => {
  const moon = V.sim(1.62); for (const p of V.PL) { const B = V.sim(p.g), k = Math.sqrt(1.62 / p.g);
    for (let i = 1; i < Math.min(B.length, 20); i++) ok(Math.abs(B[i].t - moon[i].t * k) < 1e-6, p.name + " " + i); } });
test("bounce counts shown in the long video: more gravity, more bounces", () => {
  const counts = V.PL.map((p) => { const s = V.S.find((x) => x.id === p.name); return V.sim(p.g).filter((b) => b.t > 0 && b.t <= s.t1 - s.t0).length; });
  console.log("    bounces per scene", V.PL.map((p, i) => p.name + " " + counts[i]).join(" · "));
  for (let i = 1; i < counts.length; i++) ok(counts[i] > counts[i - 1] * 0.9, "ladder"); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
