// Checks the claims of the 29 Spin Speed video.  node engine/test_spin.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "grains.js", "bowl.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const B = globalThis.Bowl, V = globalThis.SpinVideo, P = V.P;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
(async () => {
  await V.ready;
  test("critical speed √(g/RB) = 94.6 RPM; the predicted ring radius satisfies ω² = g/√(RB² − ρ²)", () => {
    ok(Math.abs(B.rpmCrit(P) - 94.6) < .05, "crit " + B.rpmCrit(P));
    for (const r of [100, 110, 120]) { const w = B.rpm2w(r), rho = B.ringRadius(w, P); ok(Math.abs(w * w - P.g / Math.sqrt(P.RB * P.RB - rho * rho)) < 1e-9, "ring " + r); } });
  test("below the critical speed the balls stay in the bottom heap; above it they move out, closer to the prediction the faster it spins", () => {
    const rows = V.RPMS.map((r) => ({ r, m: B.meanRadius(V.run(r), 12 * 30), p: Math.min(B.ringRadius(B.rpm2w(r), P), P.RIM) }));
    rows.forEach((x) => console.log(`    ${x.r} RPM: balls on average ${(x.m * 100).toFixed(1)} cm out · ring predicted ${x.p ? (x.p * 100).toFixed(1) + " cm" : "none"}`));
    const heap = rows.filter((x) => x.r < 94.6).map((x) => x.m); ok(Math.max(...heap) - Math.min(...heap) < 0.003, "heap the same below critical");
    const above = rows.filter((x) => x.r > 100); for (const x of above) ok(Math.abs(x.m - x.p) < 0.012, x.r + " near prediction"); ok(rows[5].m > rows[4].m && rows[4].m > rows[3].m, "grows"); });
  test("every ball stays inside the rim, and balls never overlap by more than 15% of a radius (final frames)", () => {
    for (const k of [...V.RPMS, "up"]) { const R = V.run(k); for (const f of [R.frames[60], R.frames[R.frames.length - 1]]) { for (let i = 0; i < P.n; i++) ok(Math.hypot(f[2 * i], f[2 * i + 1]) <= P.RIM - P.r * .85, k + " rim");
      let worst = 0; for (let i = 0; i < P.n; i++) for (let j = i + 1; j < P.n; j++) worst = Math.max(worst, (2 * P.r - Math.hypot(f[2 * j] - f[2 * i], f[2 * j + 1] - f[2 * i + 1])) / P.r); ok(worst < .15, k + " overlap " + worst.toFixed(3)); } } });
  test("the spin-up: after settling in the bottom heap, the balls leave the centre only after the bowl passes the critical speed", () => {
    const R = V.run("up"), m0 = B.meanRadius(R, Math.round(10 * 30)); let tLeave = null;
    for (let f = 300; f < R.frames.length; f++) if (B.meanRadius(R, f) > m0 + 0.008) { tLeave = f / 30; break; }
    const rpmAt = tLeave * V.UPMAX / V.UP; console.log("    balls clearly move out at " + tLeave.toFixed(1) + " s, when the bowl turns at " + rpmAt.toFixed(0) + " RPM"); ok(rpmAt > 94.6, "after critical"); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
})();
