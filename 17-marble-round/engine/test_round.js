// Checks the claims of the 17 Marble Round video.  node engine/test_round.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "marbles.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.RoundVideo, TR = V.TR;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("rolling physics: a = 5/7 g sin(0.5°), and distance follows s = v0 t + a t²/2", () => { ok(Math.abs(TR.a - 5 / 7 * 9.81 * Math.sin(0.5 * Math.PI / 180)) < 1e-12, "a");
  // check against a fine step-by-step integration of dv/dt = a
  let s = 0, v = TR.v0; const dt = 1e-4; for (let t = 0; t < 20 - 1e-9; t += dt) { s += v * dt + .5 * TR.a * dt * dt; v += TR.a * dt; } ok(Math.abs(s - TR.s(20)) < 1e-6, s); });
test("keys are cut to the notes: rolling over each key takes exactly its note length", () => {
  for (const k in V.SONGS) { const sg = V.SONGS[k]; let t = 0;
    sg.K.forEach((key, i) => { const dur = sg.mel[i][1] * sg.beat; ok(Math.abs(key.t1 - key.t0 - dur) < 1e-12, "dur"); ok(Math.abs(TR.s(key.t1) - key.s1) < 1e-12 && Math.abs(TR.s(key.t0) - key.s0) < 1e-12, "cut"); t += dur; });
    console.log(`    ${sg.title}: ${sg.K.length} keys, track ${sg.L.toFixed(1)} m, first key ${(sg.K[0].s1 - sg.K[0].s0).toFixed(2)} m, marble ends at ${TR.v(sg.T).toFixed(2)} m/s`); } });
test("tunes: Frère Jacques is 8 bars of 4 beats; Row, Row, Row is 8 bars of 6/8, played twice", () => {
  ok(V.MB.FRERE.reduce((a, n) => a + n[1], 0) === 32, "frere"); ok(V.MB.ROW.reduce((a, n) => a + n[1], 0) === 24, "row"); });
test("a round: marble n plays the same key exactly 2 bars after marble n−1", () => {
  const sg = V.SONGS.frere, rel = V.releases(sg, 4, 1); for (let v = 1; v < 4; v++) ok(Math.abs(rel[v] - rel[v - 1] - 8 * sg.beat) < 1e-12, "entry"); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  const m4 = V.S.find((s) => s.id === "m4"), last = V.releases(V.SONGS.frere, 4, 1)[3] + V.SONGS.frere.T; ok(last < m4.t1 - m4.t0, "m4 fits " + last); });
console.log(`\n${pass} tests passed`);
