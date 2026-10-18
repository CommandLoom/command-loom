// Checks the claims of the 21 Sandpile video.  node engine/test_sand.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "sandpile.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Sand, V = globalThis.SandVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  const sz = Array.from(V.RUN.sizes), nz = sz.filter((x) => x > 0), small = nz.filter((x) => x < 8).length, huge = nz.filter((x) => x >= 4096).length;
  console.log("   avalanches", nz.length, "· smallest-bin share", (small / nz.length * 100).toFixed(0) + "%", "· ≥4096 topplings:", huge, "· largest", Math.max(...sz));
  test("captions: most drops cause no avalanche; half the avalanches are small, 1 in 100 is huge", () => { const st = V.stats(); console.log("   ", JSON.stringify(st));
    ok(st.quiet > V.RDROPS / 2 && st.median < 50 && st.p99 > 5000, JSON.stringify(st)); });
  test("sizes span more than four orders of magnitude (1 to over 10,000 topplings)", () => ok(Math.min(...nz) === 1 && Math.max(...sz) > 10000, Math.max(...sz)));
  test("Abelian: dropping 1,000 grains at the centre in one go equals dropping them one by one", () => {
    const a = K.centrePile(41, 1000), b = new K.Pile(41), c = 20 * 41 + 20; for (let i = 0; i < 1000; i++) b.drop(c); ok(a.g.every((v, i) => v === b.g[i]), "differs"); });
  test("centre pile: 32,768 grains stay on the 151 × 151 grid (no grain falls off) and every square ends with 0–3", () => {
    const p = K.centrePile(V.CW, V.CMAX); ok(p.total() === V.CMAX && p.g.every((v) => v < 4), p.total()); });
  test("rules demo: one dropped grain sets off at least two waves and ends stable", () => { const w = V.RULE_WAVES; ok(w.length >= 3 && w[w.length - 1].g.every((v) => v < 4), w.length); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  });
  console.log(`\n${pass} tests passed`);
});
