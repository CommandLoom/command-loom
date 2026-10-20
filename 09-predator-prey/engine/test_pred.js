// Checks the claims of the 09 Predator Prey video against the simulation.  node engine/test_pred.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "wator.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const V = globalThis.PredVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
const smooth = (a, w) => a.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - w); j <= Math.min(a.length - 1, i + w); j++) { s += a[j]; n++; } return s / n; });
const peaks = (a) => { const s = smooth(a, 12), out = []; for (let i = 20; i < s.length - 20; i++) { let top = true; for (let j = i - 20; j <= i + 20; j++) if (s[j] > s[i]) { top = false; break; } if (top && (!out.length || i - out[out.length - 1] > 40)) out.push(i); } return out; };
V.ready.then(() => {
  for (const k of ["wide", "tall"]) { const H = V.HIST[k], pf = peaks(H.map((h) => h[0])), ps = peaks(H.map((h) => h[1]));
    console.log(`   ${k}: ${H.length - 1} steps · fish peaks ${pf.length}, shark peaks ${ps.length} · fewest fish ${Math.min(...H.map((h) => h[0]))}, fewest sharks ${Math.min(...H.map((h) => h[1]))}`);
    test(k + " ocean: neither species dies out during the run", () => ok(H.every(([f, s]) => f > 0 && s > 0), "extinction"));
    test(k + " ocean: it really cycles (at least 4 fish peaks and 4 shark peaks)", () => ok(pf.length >= 4 && ps.length >= 4, pf.length + "/" + ps.length)); }
  test("music follows the counts: the melody's centre note moves the same way as the fish count in over 90% of its changes", () => {
    const H = V.HIST.wide, ev = V.music(H, 0, 600, 0), mel = ev.filter((e) => !e.voice), cf = mel.map((e) => H[Math.round(e.t * 15)][0]);
    let agree = 0, tot = 0; for (let i = 1; i < mel.length; i++) { const a = Math.sign(mel[i].base - mel[i - 1].base), b = Math.sign(cf[i] - cf[i - 1]); if (a !== 0) { tot++; if (a === b) agree++; } }
    console.log("   melody centre moves with the fish count in " + agree + " of " + tot + " pitch changes"); ok(agree / tot > .9, "follows"); });
  test("sound all the way through: no gap over 0.5 s in the long video; timelines whole frames, Shorts 30–40 s", () => {
    const ev = V.timelines[0].events().map((e) => e.t).sort((a, b) => a - b); let gap = 0; for (let i = 1; i < ev.length; i++) gap = Math.max(gap, ev[i] - ev[i - 1]); ok(gap <= .5 && ev[0] < .5, "gap " + gap);
    for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
      const e = tl.events(); ok(e.length && e.every((x) => x.t >= 0 && x.t < tl.dur - .5), tl.id); }
    for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
  console.log(`\n${pass} tests passed`);
});
