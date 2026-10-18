// Checks the claims of the 19 Sorting Sounds video.  node engine/test_sorts.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "sorts.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Sorts, V = globalThis.SortVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const sorted = (a0, st) => K.replay(a0, st, st.length).a.every((v, i) => v === i + 1);
test("every recorded run really sorts the bars", () => { for (const k of Object.keys(V.RUN)) ok(sorted(V.A120, V.RUN[k]), k); ok(sorted(V.A120.length ? K.shuffled(128, 8) : [], V.M128), "merge128"); });
test("race finishing order at equal speed: quicksort, merge, insertion, bubble; bubble finishes inside the race scene", () => {
  const L = Object.fromEntries(Object.entries(V.RUN).map(([k, st]) => [k, st.length])); console.log("   steps", JSON.stringify(L));
  ok(L.quick < L.merge && L.merge < L.insertion && L.insertion < L.bubble, JSON.stringify(L)); ok(25.5 + L.bubble / V.RATE < 72, "bubble too slow"); });
test("1,000-item comparisons are counted (shown in the table)", () => { console.log("   1000:", JSON.stringify(V.CMP1000)); ok(V.CMP1000.bubble > 400000 && V.CMP1000.merge < 10000, JSON.stringify(V.CMP1000)); });
test("1,000,000-item estimates match the formulas within 15%", () => { const n = 1e6, lg = Math.log2(n);
  for (const [v, e] of [[5e11, n * n / 2], [2.5e11, n * n / 4], [2e7, n * lg - 1.25 * n], [2.8e7, 1.39 * n * lg]]) ok(Math.abs(v / e - 1) < .15, v + " vs " + e);
  ok(Math.round(5e11 / 1e9 / 60) === 8 && Math.abs(2e7 / 1e9 - .02) < 1e-9, "times"); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + JSON.stringify(ev.filter((e) => !(e.t >= 0 && e.t < tl.dur - .5)).slice(0, 2))); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
