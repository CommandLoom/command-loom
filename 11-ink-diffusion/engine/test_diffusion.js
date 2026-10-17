// Checks every number the 11 Ink Diffusion video shows.  node engine/test_diffusion.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "diffusion.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const F = globalThis.Diff, V = globalThis.DiffVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
V.ready.then(() => {
  const M = V.MSD, last = M[M.length - 1], want = 4 * F.D_FL * V.SIM_T * 1e12;
  console.log("   measured mean squared distance after 20 s:", last.toFixed(0), "µm²; theory 4Dt:", want.toFixed(0));
  test("the 5,000 walkers follow ⟨r²⟩ = 4Dt within 5 % (sampling noise for 5,000 walkers ≈ 1.4 %) at 5, 10, 15 and 20 s", () => { for (const s of [5, 10, 15, 20]) { const m = M[Math.round(s / V.DT)], th = 4 * F.D_FL * s * 1e12; ok(Math.abs(m / th - 1) < .05, s + " s: " + m + " vs " + th); } });
  test("'4× the time, only 2× as far' (measured: RMS at 20 s ≈ 2 × RMS at 5 s)", () => { const r5 = Math.sqrt(M[Math.round(5 / V.DT)]), r20 = Math.sqrt(last); ok(Math.abs(r20 / r5 - 2) < .06, r20 / r5); });
  test("scale bars: 1 s 41 µm, 1 min 319 µm, 1 h 2.5 mm, 1 day 1.2 cm, 1 week 3.2 cm, 1 year 23 cm", () => {
    const got = V.SCALE.map(([s]) => V.fmtLen(F.rms(s))); console.log("   ", got.join(" · ")); ok(JSON.stringify(got) === JSON.stringify(["41 µm", "319 µm", "2.5 mm", "1.2 cm", "3.2 cm", "23 cm"]), got);
  });
  test("half a teacup (4 cm) takes about 11 days", () => ok(Math.round(F.timeFor(.04) / 86400) === 11, F.timeFor(.04) / 86400));
  test("ring times follow r² (each ring crossed later than the last, 50 µm ≈ 4 × the 25 µm time)", () => { const rt = V.ringTimes(); ok(rt.every((x, i) => x != null && (i === 0 || x > rt[i - 1])), rt); ok(Math.abs(rt[1] / rt[0] - 4) < 1, rt[1] / rt[0]); });
  test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events"); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
  });
  console.log(`\n${pass} tests passed`);
});
