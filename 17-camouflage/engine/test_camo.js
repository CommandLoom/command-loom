// Checks the claims of the 17 Camouflage video.  node engine/test_camo.js
const path = require("path"), fs = require("fs"), vm = require("vm");
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
for (const f of ["draw.js", "evolve.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.CamoVideo, G = V.G;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
console.log("   dark share at 19 / 40 / 74 / 95 / 139:", [19, 40, 74, 95, 139].map((g) => Math.round(G[g].darkShare * 100) + "%").join(" "));
test("on pale bark the population stays pale (generation 19: under 5% dark)", () => ok(G[19].darkShare < .05, G[19].darkShare));
test("after the bark darkens, dark moths take over (generation 74: over 90% dark)", () => ok(G[74].darkShare > .9, G[74].darkShare));
test("after the bark pales again, the pale moths come back (generation 139: under 10% dark)", () => ok(G[139].darkShare < .1, G[139].darkShare));
test("'birds catch moths that stand out': on dark bark, pale moths are caught more often than dark ones (measured)", () => {
  let pe = 0, pn = 0, de = 0, dn = 0; for (let g = 45; g < 75; g++) G[g].pop.forEach((c, i) => { if (c < .5) { pn++; if (G[g].eaten[i]) pe++; } else { dn++; if (G[g].eaten[i]) de++; } });
  console.log("   caught: pale", (pe / Math.max(1, pn) * 100).toFixed(0) + "%", "dark", (de / dn * 100).toFixed(0) + "%"); ok(pn === 0 || pe / pn > de / dn, pe / pn + " vs " + de / dn); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
