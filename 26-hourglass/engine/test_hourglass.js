// Checks the claims of the 26 Hourglass video (needs data/ from precompute.js).  node engine/test_hourglass.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "grains.js", "hourglass.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const G = globalThis.Grains, H = globalThis.Hourglass, V = globalThis.HourglassVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
(async () => {
  await V.loadAll(async (p) => { const b = fs.readFileSync(path.join(__dirname, "..", p)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); });
  test("about the same total amount: the balls cover 51–56% of the top bulb for every count", () => {
    for (const N of V.COUNTS) { const r = V.data[N].r; let A = 0; for (const x of r) A += Math.PI * x * x; const fr = A / H.bulbArea(); if (N > 1) ok(fr > .51 && fr < .56, N + " " + fr.toFixed(3)); console.log("    " + N + " balls: mean width " + (2000 * r.reduce((a, b) => a + b) / N).toFixed(1) + " mm, cover " + (100 * fr).toFixed(1) + "% of the bulb"); } });
  test("every ball stays inside the glass in every recorded frame (within 0.5 mm, recorded at 4.6 µm resolution)", () => {
    for (const N of V.COUNTS) { const D = V.data[N]; for (let f = 0; f < D.frames; f += 3) { const p = D.at(f); for (let i = 0; i < N; i++) { const x = p[2 * i], y = p[2 * i + 1]; ok(Math.abs(y) <= 0.17 + 5e-4 && Math.abs(x) <= H.halfWidth(y) + 5e-4, N + " frame " + f); } } } });
  test("balls overlap only slightly (the simplified model lets a deep pile squeeze a little): never more than 30% of the smaller radius in sampled frames", () => {
    let all = 0; for (const N of [100, 1000, 3000]) { const D = V.data[N]; for (const f of [0, 60, 150, 300, D.frames - 1]) { const p = D.at(f); let worst = 0;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = p[2 * j] - p[2 * i], dy = p[2 * j + 1] - p[2 * i + 1], R = D.r[i] + D.r[j]; if (Math.abs(dx) > R || Math.abs(dy) > R) continue; const ov = R - Math.hypot(dx, dy); if (ov > 0) worst = Math.max(worst, ov / Math.min(D.r[i], D.r[j])); }
      ok(worst < .3, N + " f" + f + " " + worst.toFixed(3)); all = Math.max(all, worst); } } console.log("    worst overlap " + (100 * all).toFixed(0) + "% of a radius"); });
  test("numbers shown: how many get through and when the last one passes", () => {
    for (const N of V.COUNTS) { const D = V.data[N], te = V.tEmpty(N); console.log("    " + N + ": " + D.passed[D.frames - 1] + " / " + N + " through after " + ((D.frames - 1) / 30).toFixed(0) + " s" + (te != null ? ", all through at " + te.toFixed(2) + " s" : "")); }
    ok(V.data[1].passed[V.data[1].frames - 1] === 0 && V.data[10].passed[V.data[10].frames - 1] === 0, "big balls stuck"); ok(V.tEmpty(3000) != null && .5 + V.tEmpty(3000) * V.S2V < 29.4, "3000 empties inside Short 2"); for (const N of [1000, 3000]) { const sc = V.S.find((x) => x.id === String(N)); ok(V.REL[N] + V.tEmpty(N) * V.SLOW[N] < sc.t1 - .5, N + " empties in its scene"); }
    for (const N of [1000, 3000]) ok(V.REL.all + V.tEmpty(N) * V.SLOW.all < 69, N + " empties in the last scene");
    for (const [N] of V.JAM) { const D = V.data[N], a = D.at(0).slice(), z = D.at(D.frames - 1); let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(z[i] - a[i]));
      console.log("    " + N + ": largest move of any ball in 18 s " + (m * 1000).toFixed(1) + " mm"); ok(m < .005, N + " moved"); } });
  test("blended playback: halfway between two recorded frames every ball is halfway between its two recorded positions", () => {
    const D = V.data[3000], a = D.at(40).slice(), b = D.at(41).slice(), m = V.atTime(3000, 40.5 / 30); for (let i = 0; i < a.length; i++) ok(Math.abs(m[i] - (a[i] + b[i]) / 2) < 1e-6, i); });
  test("deterministic: re-running the first 0.5 s of the 100-ball simulation gives the same positions (to the stored resolution)", () => {
    const F = H.fill(100, G.rng(35 + 100)), walls = H.walls(), S = G.create({ x: F.x, y: F.y, r: F.r, walls: [...walls, H.GATE], sub: 80, iters: 3, mu: 0.3, fps: 30 });
    for (let f = 0; f < H.SETTLE * 30; f++) S.advance(); S.setWalls(walls); for (let i = 0; i < 100; i++) { S.VX[i] = 0; S.VY[i] = 0; }
    let fr = S.snapshot(); for (let f = 0; f < 15; f++) fr = S.advance(); const p = V.data[100].at(15); for (let i = 0; i < 100; i++) ok(Math.abs(p[2 * i] - fr[2 * i]) < 1e-5 && Math.abs(p[2 * i + 1] - fr[2 * i + 1]) < 1e-5, "ball " + i); });
  test("timelines: whole frames, Shorts 30–40 s, events inside, no gap in the sound longer than 1.5 s", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(), ts = ev.map((e) => e.t).sort((a, b) => a - b); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length);
      let gap = ts[0]; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]); console.log("    " + tl.id + ": " + ev.length + " notes, longest gap " + gap.toFixed(2) + " s, last note " + ts[ts.length - 1].toFixed(2));
      ok(gap < 1.5, tl.id + " gap " + gap); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
})();
