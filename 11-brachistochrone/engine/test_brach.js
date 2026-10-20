// Checks the claims of the 11 Brachistochrone video.  node engine/test_brach.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "brach.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Brach, V = globalThis.BrachVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const ALL = [V.HOOK, ...V.RACES, ...V.FANS, V.CLOSE, V.S1A, V.S1B];
for (const R of [...V.RACES, ...V.FANS]) console.log("   B=(" + R.B + ") " + R.slow + "x:", R.cs.map((c) => (c.name || "s=" + c.s) + " " + c.tr.total.toFixed(3)).join(" | "));
test("every track really goes from A (0,0) to its B", () => ALL.forEach((R) => R.cs.forEach((c) => { const a = c.pts[0], b = c.pts[c.pts.length - 1]; ok(Math.hypot(a[0], a[1]) < 1e-9 && Math.hypot(b[0] - R.B[0], b[1] - R.B[1]) < 1e-6, R.B + " " + c.name); })));
test("the cycloid wins every race and matches the exact time θ√(R/g)", () => ALL.forEach((R) => { const w = R.cs[R.order[0]]; ok(w.name === "cycloid", R.B + " winner " + w.name);
  const { th, R: r } = K.cycloidFit(R.B); ok(Math.abs(w.tr.total - th * Math.sqrt(r / K.g)) < (R.kind === "four" ? 1e-4 : 1e-3), R.B + " " + w.tr.total); }));
test("twelve curves: the times fall towards the cycloid and rise beyond it (a valley)", () => V.FANS.forEach((R) => { const t = R.cs.map((c) => c.tr.total), m = V.FAN_S.indexOf(1);
  for (let i = 1; i < t.length; i++) ok(i <= m ? t[i] < t[i - 1] : t[i] > t[i - 1], R.B + " at " + i); }));
test("straight-line time matches √(2L²/(g·h))", () => V.RACES.forEach((R) => { const L = Math.hypot(...R.B); ok(Math.abs(R.cs[0].tr.total - Math.sqrt(2 * L * L / (K.g * R.B[1]))) < 1e-4, R.B); }));
test("the third race: the steep drop loses even to the straight line (shown on the board)", () => { const R = V.RACES[2]; ok(R.cs[1].tr.total > R.cs[0].tr.total, R.cs.map((c) => c.tr.total)); });
test("bowl: every release height reaches the bottom at π√(R/g); checked against a numerical slide", () => {
  for (const b of V.BALLS) { const p = K.bowlAt(V.R_BOWL, b.a * 4 * V.R_BOWL, V.Q); ok(Math.abs(p.s) < 1e-9 && p.h < 1e-9, b.a); }
  for (const a of [.2, .5, .9]) { const th0 = 2 * Math.acos(a), tr = K.track(K.bowlFrom(V.R_BOWL, th0)); ok(Math.abs(tr.total - V.Q) < 1e-3, a + " " + tr.total); }
});
test("bowl: new beads join at rest exactly where the motion is at rest (one full swing later)", () => V.BALLS.forEach((b) => { const w = Math.sqrt(K.g / (4 * V.R_BOWL)); ok(Math.abs(Math.sin(w * b.add)) < 1e-9, b.a); }));
test("timelines: whole frames, Shorts 30–40 s, events inside, no gap in the sound longer than 1.6 s", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(), ts = ev.map((e) => e.t).sort((a, b) => a - b); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events");
    let gap = ts[0]; for (let i = 1; i < ts.length; i++) gap = Math.max(gap, ts[i] - ts[i - 1]); console.log("   " + tl.id + ": " + ev.length + " notes, longest gap " + gap.toFixed(2) + " s, last note " + ts[ts.length - 1].toFixed(2));
    ok(gap < 1.6, tl.id + " gap " + gap); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
