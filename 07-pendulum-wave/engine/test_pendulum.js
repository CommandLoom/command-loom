// Checks every number the 07 Pendulum Wave video shows.  node engine/test_pendulum.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "pendulum.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const P = globalThis.Pend, V = globalThis.PendVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("swing counts 51…66 in 60 s; lengths 34.4 cm → 20.5 cm; periods on screen", () => {
  ok(P.swings(0) === 51 && P.swings(15) === 66, "counts");
  for (let n = 0; n < 16; n++) ok(Math.abs(P.T(n) * P.swings(n) - 60) < 1e-12, "period " + n);
  ok((P.L(0) * 100).toFixed(1) === "34.4" && (P.L(15) * 100).toFixed(1) === "20.5", "lengths " + P.L(0) + " " + P.L(15));
  ok(P.T(0).toFixed(3) === "1.176" && P.T(15).toFixed(3) === "0.909", "periods");
});
test("all 16 back in one line at 60 s (and only then within the minute)", () => {
  ok(P.groups(60) === 1 && P.groups(0) === 1, "aligned at 0 and 60");
  for (let t = .5; t < 59.6; t += .5) ok(P.groups(t) > 1, "not aligned at " + t);
});
test("row captions: 15 s → 4, 20 s → 3, 30 s → 2, 40 s → 3, 45 s → 4", () => {
  const want = { 15: 4, 20: 3, 30: 2, 40: 3, 45: 4 }; for (const m of V.MOMENTS) ok(P.groups(m) === want[m], m + " s gives " + P.groups(m));
});
test("each pendulum makes exactly one more swing per minute than its longer neighbour", () => { for (let n = 1; n < 16; n++) ok(P.swings(n) - P.swings(n - 1) === 1, "n " + n); });
test("timelines: whole frames, Shorts 30–40 s, sound events inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id + " length");
    const ev = tl.events(); ok(ev.length > 0 && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
