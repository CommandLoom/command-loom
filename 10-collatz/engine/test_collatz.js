// Checks every number the 10 Collatz video shows.  node engine/test_collatz.js
const path = require("path"), fs = require("fs"), vm = require("vm");
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
for (const f of ["draw.js", "collatz.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Collatz, V = globalThis.CollatzVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  test("6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1: 8 steps; 1 → 4 → 2 → 1 loop", () => { ok(K.path(6).join(",") === "6,3,10,5,16,8,4,2,1", K.path(6)); ok(K.path(4).join(",") === "4,2,1" && K.next(1) === 4, "loop"); });
  test("27 needs 111 steps and peaks at 9,232 (step 77)", () => { const p = V.P27; ok(p.length - 1 === 111 && Math.max(...p) === 9232 && p.indexOf(9232) === 77, p.length - 1 + " " + Math.max(...p) + " " + p.indexOf(9232)); });
  test("most steps below 10,000: 6,171 with 261 steps", () => { ok(V.MAXN === 6171 && V.TAB.st[6171] === 261, V.MAXN + " " + V.TAB.st[V.MAXN]); });
  test("every number from 1 to 10,000 reaches 1 (paths terminate)", () => { for (let n = 1; n <= V.NMAX; n++) ok(K.path(n).slice(-1)[0] === 1, n); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  });
  console.log(`\n${pass} tests passed`);
});
