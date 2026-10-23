// Checks the claims of the 18 Bounce Melody video.  node engine/test_melody.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "ring.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.MelodyVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const all = [["king", V.SONG_LEN.king], ["joy", V.SONG_LEN.joy], ["elise", V.SONG_LEN.elise], ["king", 26], ["joy", 26], ["elise", 26]];
test("one note per bounce: each song has exactly as many bounces as notes, and lasts the planned time", () => {
  for (const [k, d] of all) { const sg = V.song(k, d); ok(sg.H.length === sg.n + 1, k); ok(Math.abs(sg.H[sg.n].t - d) < 1e-6, k + " " + sg.H[sg.n].t);
    console.log(`    ${k} ${d}s: ${sg.n} notes, +${((sg.q - 1) * 100).toFixed(2)}% speed per bounce, last gap ${((sg.H[sg.n].t - sg.H[sg.n - 1].t) * 1000).toFixed(0)} ms`); } });
test("every bounce point is on the wall and every flight is a straight chord (angle in = angle out)", () => {
  for (const [k, d] of all) { const H = V.song(k, d).H; for (let i = 0; i < H.length; i++) ok(Math.abs(Math.hypot(H[i].x, H[i].y) - V.RC) < 1e-12, "radius");
    for (let i = 2; i < H.length; i++) { const a = H[i - 2], b = H[i - 1], c = H[i]; const n = [b.x / V.RC, b.y / V.RC], u = [b.x - a.x, b.y - a.y], w = [c.x - b.x, c.y - b.y];
      const din = Math.abs(u[0] * n[0] + u[1] * n[1]) / Math.hypot(...u), dout = Math.abs(w[0] * n[0] + w[1] * n[1]) / Math.hypot(...w); ok(Math.abs(din - dout) < 1e-9, "reflection"); } } });
test("the tune speeds up: every gap between notes is shorter than the one before", () => {
  for (const [k, d] of all) { const H = V.song(k, d).H; for (let i = 2; i < H.length; i++) ok(H[i].t - H[i - 1].t < H[i - 1].t - H[i - 2].t, k); } });
test("melodies are in range and the long video plays them in full", () => {
  for (const k of ["king", "joy", "elise"]) { const sg = V.song(k, V.SONG_LEN[k]); ok(sg.notes.every((m) => m >= 48 && m <= 84), k); }
  const ev = V.timelines[0].events(), s = V.S.find((x) => x.id === "king"); const kingNotes = ev.filter((e) => e.t >= s.t0 && e.t < s.t1 && e.voice === "marimba").length;
  ok(kingNotes === V.song("king", V.SONG_LEN.king).n, kingNotes); });
test("close: the three replays are the songs' own last notes, one after the other, inside the scene", () => { const c = V.S.find((x) => x.id === "close");
  for (let j = 0; j < 3; j++) { ok(V.REPLAY0(j) >= c.t0 && V.REPLAY0(j) + V.REPLAY < c.t1 - .5, j); if (j) ok(V.REPLAY0(j) >= V.REPLAY0(j - 1) + V.REPLAY, "overlap " + j); } });
test("timelines: whole frames, Shorts 30–40 s, events inside, no gap in the sound longer than 1.5 s", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(), ts = ev.map((e) => e.t).sort((a, b) => a - b); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length);
    let gap = ts[0]; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]); console.log("    " + tl.id + ": " + ev.length + " notes, longest gap " + gap.toFixed(2) + " s, last note " + ts[ts.length - 1].toFixed(2) + " of " + tl.dur);
    ok(gap < 1.5, tl.id + " gap " + gap); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
