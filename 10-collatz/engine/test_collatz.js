// Checks every number the 10 Collatz video shows.  node engine/test_collatz.js
const path = require("path"), fs = require("fs"), vm = require("vm");
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
for (const f of ["draw.js", "collatz.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Collatz, V = globalThis.CollatzVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  test("27 needs 111 steps and peaks at 9,232 (step 77)", () => { const p = V.P27; ok(p.length - 1 === 111 && Math.max(...p) === 9232 && p.indexOf(9232) === 77, p.length - 1); });
  test("every number from 1 to 10,000 reaches 1 (paths terminate); most steps below 10,000: 6,171 with 261", () => { for (let n = 1; n <= V.NMAX; n++) ok(K.path(n).slice(-1)[0] === 1, n); ok(V.MAXN === 6171 && V.TAB.st[6171] === 261, V.MAXN); });
  test("the coral grows one path at a time at first, then faster, and is complete inside its scene", () => { const sc = V.S.find((s) => s.id === "coral"), d = sc.t1 - sc.t0, g = (u) => V.grown(u, d, V.NMAX);
    ok(g(0) === 1 && g(4) < 40 && g(d - .9) === V.NMAX, "schedule"); for (let u = 0; u < d; u += 1 / 30) ok(g(u + 1 / 30) >= g(u), "monotone"); });
  test("sound all the way through: no gap of 1.5 s or more in the long video; timelines whole frames, Shorts 30–40 s", () => {
    const ev = V.timelines[0].events().map((e) => e.t).sort((a, b) => a - b); let gap = 0, at = 0; for (let i = 1; i < ev.length; i++) if (ev[i] - ev[i - 1] > gap) { gap = ev[i] - ev[i - 1]; at = ev[i - 1]; }
    console.log("   " + ev.length + " notes · longest gap " + gap.toFixed(2) + " s at " + at.toFixed(1)); ok(gap < 1.5 && ev[0] < .5, "gap");
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const e = tl.events(); ok(e.length && e.every((x) => x.t >= 0 && x.t < tl.dur - .5), tl.id + " events"); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
});
