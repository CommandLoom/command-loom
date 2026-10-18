// Checks the claims of the 16 Brachistochrone video.  node engine/test_brach.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "brach.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Brach, V = globalThis.BrachVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
console.log("   times:", V.CURVES.map((c) => c.name + " " + c.tr.total.toFixed(4)).join(" | "));
test("all four tracks really go from A (0,0) to B (2, 0.8)", () => V.CURVES.forEach((c) => { const a = c.pts[0], b = c.pts[c.pts.length - 1]; ok(Math.hypot(a[0], a[1]) < 1e-9 && Math.hypot(b[0] - 2, b[1] - .8) < 1e-6, c.name); }));
test("the cycloid is fastest and matches the exact formula θ√(R/g)", () => { ok(V.ORDER[0] === 3, V.ORDER); const { th, R } = K.cycloidFit(V.B); ok(Math.abs(V.CURVES[3].tr.total - th * Math.sqrt(R / K.g)) < 1e-4, V.CURVES[3].tr.total); });
test("the straight line is the slowest even though it is the shortest", () => { const L = V.CURVES.map((c) => c.tr.length); ok(V.ORDER[3] === 0 && L[0] === Math.min(...L), V.ORDER + " " + L); });
test("straight-line time matches √(2L²/(g·h))", () => { const L = Math.hypot(2, .8); ok(Math.abs(V.CURVES[0].tr.total - Math.sqrt(2 * L * L / (K.g * .8))) < 1e-4, V.CURVES[0].tr.total); });
test("the cycloid dips about 10 cm below B", () => { ok(Math.round(V.DIP * 100) === 10, V.DIP); });
test("tautochrone: beads from three heights reach the bottom within 0.1 ms of π√(R/g)", () => V.BOWL.forEach((tr) => ok(Math.abs(tr.total - V.T_TAUTO) < 1e-4, tr.total)));
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
