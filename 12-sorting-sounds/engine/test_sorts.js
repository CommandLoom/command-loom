// Checks the claims of the 12 Sorting Sounds video.  node engine/test_sorts.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "sorts.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Sorts, V = globalThis.SortVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const RUNS = [V.HOOK, ...Object.values(V.SOLO), ...Object.values(V.RACE), V.S1A, V.S1B, V.S2R];
test("every recorded run really sorts its bars", () => RUNS.forEach((R) => ok(K.replay(R.a0, R.st, R.st.length).a.every((v, i) => v === i + 1), R.id)));
test("race at equal speed: quicksort, merge, insertion, bubble; everyone finishes inside the race scene", () => {
  const L = Object.fromEntries(Object.entries(V.RACE).map(([k, R]) => [k, R.st.length])); console.log("   steps", JSON.stringify(L), "finish", Object.values(V.RACE).map((R) => R.end.toFixed(1)).join(" "));
  ok(L.quick < L.merge && L.merge < L.insertion && L.insertion < L.bubble, JSON.stringify(L)); const race = V.S.find((s) => s.id === "race"); ok(V.RACE.bubble.end + 1.2 < race.t1, "bubble too slow"); });
test("each solo finishes, sweep included, inside its own scene", () => Object.entries(V.SOLO).forEach(([k, R]) => { const s = V.S.find((x) => x.id === k); ok(R.t0 >= s.t0 && R.end + 1.2 < s.t1, k + " " + R.end); }));
test("Shorts: in Short 1 quicksort is done before 10 s, bubble sort only just before the end; merge sort and its sweep fit Short 2", () => {
  ok(V.S1B.end < 10 && V.S1A.end > 25 && V.S1A.end + 1.2 < 31.4, V.S1A.end + " " + V.S1B.end); ok(V.S2R.end + 1.4 < 29.4, V.S2R.end); });
test("timelines: whole frames, Shorts 30–40 s, events inside, no gap in the sound longer than 1.5 s", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(), ts = ev.map((e) => e.t).sort((a, b) => a - b); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events");
    let gap = ts[0]; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]); console.log("   " + tl.id + ": " + ev.length + " notes, longest gap " + gap.toFixed(2) + " s, last note " + ts[ts.length - 1].toFixed(2));
    ok(gap < 1.5, tl.id + " gap " + gap); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
