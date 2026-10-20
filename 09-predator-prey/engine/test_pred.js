// Checks the claims of the 09 Predator Prey video against the simulation.  node engine/test_pred.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "wator.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.PredVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  const H = V.HIST, P = V.PEAKS; console.log("   fish peaks", P.fish.join(" "), "| shark peaks", P.shark.join(" "), "| lags", P.lags.join(" "), "mean", P.lag.toFixed(1));
  test("neither species dies out during the 900-step run", () => { ok(H.every(([f, s]) => f > 0 && s > 0), "extinction"); });
  test("it really cycles: at least 4 fish peaks and 4 shark peaks", () => ok(P.fish.length >= 4 && P.shark.length >= 4, P.fish.length + "/" + P.shark.length));
  test("'Sharks peak after the fish': every measured lag positive, mean between 10 and 100 steps", () => ok(P.lags.length >= 3 && P.lags.every((l) => l > 0) && P.lag > 10 && P.lag < 100, P.lags));
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + JSON.stringify(ev.filter((e) => !(e.t >= 0 && e.t < tl.dur - .5)))); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  });
  console.log(`\n${pass} tests passed`);
});
