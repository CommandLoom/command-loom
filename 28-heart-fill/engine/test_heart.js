// Checks the claims of the 28 Heart Fill video (needs data/ from precompute.js).  node engine/test_heart.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "grains.js", "heart.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const H = globalThis.Heart, V = globalThis.HeartVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
(async () => {
  await V.loadAll(async (p) => { const b = fs.readFileSync(path.join(__dirname, "..", p)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); });
  const fin = (N) => V.data[N].frames - 1;
  test("every ball stays inside the heart in every recorded frame (within 0.5 mm)", () => {
    for (const N of V.SIZES) { const D = V.data[N]; for (let f = 0; f < D.frames; f += 3) { const p = D.at(f); for (let i = 0; i < D.N; i++) { if (Number.isNaN(p[2 * i])) continue; ok(H.inside(p[2 * i], p[2 * i + 1]) || H.wallDist(p[2 * i], p[2 * i + 1]) < 5e-4, N + " frame " + f); } } } });
  test("smaller balls fill the heart better: count and covered share rise with every step", () => {
    const rows = V.SIZES.map((N) => ({ N, n: V.data[N].count[fin(N)], c: V.data[N].cover[fin(N)], w: 2000 * V.data[N].r.reduce((a, b) => a + b) / V.data[N].N, t: (V.data[N].pourFrames - 60) / 30 }));
    rows.forEach((r) => console.log(`    ${r.w.toFixed(1)} mm balls (planned ${r.N}): ${r.n} fit · ${(100 * r.c).toFixed(1)}% of the heart · last ball at ${r.t.toFixed(1)} s`));
    for (let i = 1; i < rows.length; i++) { ok(rows[i].n > rows[i - 1].n, "count"); ok(rows[i].c > rows[i - 1].c, "cover"); } });
  test("full means full: in the last 2 s of pouring no free spot was found, and the count never changes after that", () => {
    for (const N of V.SIZES) { const D = V.data[N], last = D.count[D.pourFrames - 60]; for (let f = D.pourFrames - 60; f < D.frames; f++) ok(D.count[f] === last, N + " grew after full"); } });
  test("balls overlap only slightly (simplified model): at most 30% of the smaller radius at the end", () => {
    let all = 0; for (const N of V.SIZES) { const D = V.data[N], p = D.at(fin(N)); for (let i = 0; i < D.N; i++) { if (Number.isNaN(p[2 * i])) continue; for (let j = i + 1; j < D.N; j++) { if (Number.isNaN(p[2 * j])) continue;
      const dx = p[2 * j] - p[2 * i], dy = p[2 * j + 1] - p[2 * i + 1], R = D.r[i] + D.r[j]; if (Math.abs(dx) > R || Math.abs(dy) > R) continue; all = Math.max(all, (R - Math.hypot(dx, dy)) / Math.min(D.r[i], D.r[j])); } } }
    console.log("    worst overlap " + (100 * all).toFixed(0) + "% of a radius"); ok(all < .3, "overlap"); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade; scenes fit 100 s", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
    const all = V.S[V.S.length - 1]; ok(all.t1 - all.t0 >= 8, "room for the side-by-side scene " + (all.t1 - all.t0)); console.log("    scenes: " + V.S.map((s) => s.id + " " + s.t0.toFixed(1)).join(" · ")); });
  console.log(`\n${pass} tests passed`);
})();
