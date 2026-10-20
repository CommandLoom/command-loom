// Checks the claims of the 15 Chemical Spirals video.  node engine/test_bz.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "bz.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const B = globalThis.BZ, V = globalThis.BZVideo, T = V.T;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const t0 = Date.now();
V.ready.then(() => {
  console.log("   built all tracks in", ((Date.now() - t0) / 1000).toFixed(1), "s");
  test("model stays in range: u in [0, 1], v in [0, 1] on every stored frame", () => { for (const k in T) for (const m of T[k].cps) { for (const x of m.u) ok(x >= 0 && x <= 1, k + " u"); for (const x of m.v) ok(x >= -1e-6 && x <= 1, k + " v " + x); } });
  test("one ring: spreads, reaches the walls and leaves the dish quiet (never turns back)", () => { const a = T.ring.active; ok(Math.max(...a) > .02 && a[a.length - 1] === 0, a[a.length - 1]); });
  test("two rings: after they meet, both vanish (active share falls to 0 and stays 0)", () => { const a = Array.from(T.collide.active), z = a.findIndex((x, i) => i > 50 && x === 0);
    ok(z > 0 && a.slice(z).every((x) => x === 0), "first zero at " + z); console.log("    dish quiet from frame", z, "of", a.length - 1); });
  test("broken ring: two spirals keep turning at a steady beat (≥ 15 turns each, periods within 2%)", () => { const tr = T.spiral, end = tr.frames - 120;
    for (let j = 0; j < 2; j++) { const n = V.turnsBy(tr, j, end), g = tr.fire[j].filter((x) => x > V.BREAK_F + 300), d = g.slice(1).map((x, i) => x - g[i]), mean = d.reduce((p, q) => p + q, 0) / d.length;
      console.log("    spiral", j, "turns", n, "· frames per turn", mean.toFixed(2), "· spread", Math.min(...d), "–", Math.max(...d)); ok(n >= 15 && Math.max(...d) - Math.min(...d) <= Math.max(2, .02 * mean * 2), "unsteady " + d); }
    ok(tr.active[tr.frames] > .1, "spirals died"); });
  test("left and right spirals turn in opposite directions (mirror images about the trigger point)", () => { const m = V.state(T.spiral, T.spiral.frames - 120); let diff = 0;
    for (let y = 0; y < m.H; y++) for (let x = 1; x < m.W / 2; x++) diff += Math.abs(m.u[y * m.W + x] - m.u[y * m.W + (m.W - x)]); ok(diff / (m.W * m.H / 2) < .01, "not mirrored " + diff); });
  test("many broken waves: the dish stays full of spirals to the end", () => { for (const k of ["many", "s2"]) ok(T[k].active[T[k].frames] > .15 && T[k].fire.every((f) => f.length >= 10), k + " " + T[k].active[T[k].frames]); });
  test("rebuilding a frame from the stored copies gives exactly the computed frame", () => { const tr = T.many, a = V.state(tr, 437).u.slice(); V.state(tr, 10); const b = V.state(tr, 437).u; ok(a.every((x, i) => x === b[i]), "differs"); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
    ok(T.spiral.frames - 120 >= Math.round((V.S[3].t1 - V.S[3].t0) * 30), "hook frames");
  });
  console.log(`\n${pass} tests passed`);
});
