// Checks the claims of the 30 Bounciness video.  node engine/test_bounce.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "bounce.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const B = globalThis.Bounce, V = globalThis.BounceVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("each bounce: speed towards the wall × bounciness, speed along the wall unchanged (checked on every bounce)", () => {
  for (const p of [50, 80, 95, 100, 101, 105, 99]) { const S = V.sim(p), e = p / 100;
    for (const h of S.hits) { const a = B.vel(S, h.t - 1e-7), b = B.vel(S, h.t + 1e-7), nx = Math.cos(h.angle), ny = Math.sin(h.angle);
      const na = a[0] * nx + a[1] * ny, nb = b[0] * nx + b[1] * ny, ta = -a[0] * ny + a[1] * nx, tb = -b[0] * ny + b[1] * nx;
      if (e * na < B.STICK) continue;
      ok(Math.abs(nb + e * na) < 1e-4 * Math.max(1, na), p + " normal " + na + " " + nb); ok(Math.abs(ta - tb) < 1e-4 * Math.max(1, Math.abs(ta)), p + " tangent"); } } });
test("between bounces: energy constant in flight and while sliding (within 0.1% between segment start and middle)", () => {
  for (const p of V.LEVELS) { const S = V.sim(p); for (let j = 0; j < S.segs.length - 1; j++) { const sg = S.segs[j], t1 = S.segs[j + 1].t;
    const e0 = B.energy(S, sg.t + 1e-6), e1 = B.energy(S, sg.t + (t1 - sg.t) * .5); ok(Math.abs(e1 - e0) < 1e-3 * Math.max(1, Math.abs(e0)), p + " seg " + j + " " + e0 + " " + e1); } } });
test("the ball never leaves the ring", () => {
  for (const p of V.LEVELS) { const S = V.sim(p), end = Math.min(S.tEnd, V.stopT(p)); for (let t = 0; t < end; t += 0.01) ok(Math.hypot(...B.pos(S, t)) <= S.Rc + 1e-6, p + " " + t); } });
test("below 100% energy only goes down at bounces, at 100% it stays, above 100% it goes up", () => {
  for (const p of V.LEVELS) { const S = V.sim(p); let prev = B.energy(S, 0);
    for (const h of S.hits.slice(0, 60)) { const after = B.energy(S, h.t + 1e-6); if (p < 100) ok(after <= prev + 1e-6, p + " up"); if (p === 100) ok(Math.abs(after - prev) < 1e-6, "100 changed"); if (p > 100) ok(after >= prev - 1e-6, p + " down"); prev = after; } } });
test("numbers shown: 0% sticks on the first hit; 105% reaches 100 m/s; bounce counts per scene", () => {
  ok(V.sim(0).hits.length === 1 && V.sim(0).segs[1].type === "slide", "0% slides"); ok(isFinite(V.stopT(105)) && V.stopT(105) < 10.5, "105 stops " + V.stopT(105));
  const sc = (id) => V.S.find((s) => s.id === id);
  console.log("    bounces in scene", V.LEVELS.map((p) => p + "%: " + B.hitsBefore(V.sim(p), sc(String(p)).t1 - sc(String(p)).t0)).join(" · "), "· 105% stops at", V.stopT(105).toFixed(2), "s");
  console.log("    first slide", V.LEVELS.filter((p) => p < 100).map((p) => p + "%: " + V.sim(p).segs.find((s) => s.type === "slide")?.t.toFixed(2)).join(" · "));
  console.log("    Short 2 speeds at 29 s: 99%", Math.hypot(...B.vel(V.sim(99), 29)).toFixed(2), "· 101%", Math.hypot(...B.vel(V.sim(101), 29)).toFixed(2)); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
