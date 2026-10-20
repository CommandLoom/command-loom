// Checks the claims of the 14 Sandpile video.  node engine/test_sand.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "sandpile.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Sand, V = globalThis.SandVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  for (const [k, Q] of Object.entries(V.P)) console.log("   " + k + ": " + Q.N + " grains on " + Q.W + "×" + Q.W + " in " + Q.dur + " s · " + V.STAT[k].total.toLocaleString("en-US") + " topplings · final radius " + V.STAT[k].R[Q.F]);
  test("every pour reaches its grain count on time and no grain falls off the grid (the pile never touches the edge)", () => { for (const [k, Q] of Object.entries(V.P)) {
    ok(Q.n(Q.dur) === Q.N && Q.n(0) === 0, k); const p = V.STAT[k].final; ok(p.total() === Q.N && p.g.every((v) => v < 4), k + " total " + p.total()); ok(V.STAT[k].R[Q.F] < (Q.W >> 1) - 1, k + " radius"); } });
  test("the pour starts slowly (a few grains a second) and only speeds up", () => { for (const [k, Q] of Object.entries(V.P)) { let prev = 0;
    for (let f = 1; f <= Q.F; f++) { const d = Q.n(f / 30) - Q.n((f - 1) / 30); ok(d >= 0, k); if (f > 30) ok(d >= prev - 1, k + " slows at " + f); prev = Math.max(prev, d); } if (k !== "hook") ok(Q.n(1) <= 10, k + " first second " + Q.n(1)); } });
  test("Abelian: pouring frame by frame ends exactly where pouring everything at once ends", () => { for (const k of ["s2", "s1"]) { const a = K.centrePile(V.P[k].W, V.P[k].N); ok(a.g.every((v, i) => v === V.STAT[k].final.g[i]), k); } });
  test("the mandala is symmetric: the final pile looks the same rotated by 90° and mirrored", () => { const Q = V.P.full, W = Q.W, g = V.STAT.full.final.g;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const v = g[y * W + x]; ok(v === g[x * W + (W - 1 - y)] && v === g[y * W + (W - 1 - x)], x + "," + y); } });
  test("rules demo: one dropped grain sets off at least two waves and ends stable", () => { const w = V.RULE_WAVES; ok(w.length >= 3 && w[w.length - 1].g.every((v) => v < 4), w.length); });
  test("timelines: whole frames, Shorts 30–40 s, events inside, no gap in the sound longer than 1.5 s", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(), ts = ev.map((e) => e.t).sort((a, b) => a - b); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events");
      let gap = ts[0]; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]); console.log("   " + tl.id + ": " + ev.length + " notes, longest gap " + gap.toFixed(2) + " s, last note " + ts[ts.length - 1].toFixed(2));
      ok(gap < 1.5, tl.id + " gap " + gap); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  });
  console.log(`\n${pass} tests passed`);
});
