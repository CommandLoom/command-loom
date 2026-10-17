// Checks every claim in the 10 Same Average video against the simulated run.  node engine/test_sameavg.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "coin.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Coin, V = globalThis.SameAvgVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  const ST = V.ST, R = V.R, end = ST[R];
  console.log(`   after ${R} rounds: average $${end.mean.toFixed(0)}, median $${end.median.toFixed(2)}, above start ${(end.above * 100).toFixed(1)}%, top 1% hold ${(end.top1 * 100).toFixed(1)}%`);
  test("rules: expected ×1.05 per flip, typical ×√0.9 ≈ 0.949", () => { ok(Math.abs(K.expected - 1.05) < 1e-12, "expected"); ok(K.typical.toFixed(3) === "0.949", "typical"); });
  test("coins are fair: heads fraction over all 400,000 flips within 0.5% of one half", () => {
    let h = 0; for (let i = 0; i < V.N; i++) for (let r = 1; r <= R; r++) h += K.heads(V.SEED, i, r) ? 1 : 0; const f = h / (V.N * R); console.log("   heads fraction", f.toFixed(4)); ok(Math.abs(f - .5) < .005, f);
  });
  test("'The average got richer. Most people got poorer.'", () => { ok(end.mean > 100 && end.median < 100 && end.above < .5, JSON.stringify(end)); });
  test("'The average keeps rising… while the typical player sinks' (rounds 6–40)", () => {
    ok(ST[R].mean > ST[6].mean * 2, "mean rises"); ok(ST[R].median < ST[6].median / 4, "median sinks"); });
  test("richest 1% hold more than half of all money at the end", () => ok(end.top1 > .5, end.top1));
  test("Short 2: 10 wins and 10 losses from $100 leave $34.87, i.e. −65%", () => { const v = V.S2[20]; ok(v.toFixed(2) === "34.87" && Math.round((v - 100)) === -65, v); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  });
  console.log(`\n${pass} tests passed`);
});
