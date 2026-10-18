// Checks the claims of the 15 Half Life video.  node engine/test_half.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "decay.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const K = globalThis.Decay, V = globalThis.HalfVideo;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("'half of what is left, every half-life': measured counts within 3 standard deviations of exact halving", () => {
  const got = []; for (let j = 0; j <= 6; j++) { const n = V.left(j * V.HALF), e = V.N * 2 ** -j, sd = Math.sqrt(V.N * 2 ** -j * (1 - 2 ** -j)); got.push(n); ok(Math.abs(n - e) <= 3 * sd + 1e-9, j + ": " + n + " vs " + e); }
  console.log("   measured", got.join(" → "));
});
test("binary-search count equals the plain count", () => { for (const t of [0, 3, 8, 17.5, 40]) ok(V.left(t) === K.remaining(V.T, t), t); });
test("no memory: atoms that survived one half-life still lose half in the next (measured 40–60%)", () => { const a = V.left(V.HALF), b = V.left(2 * V.HALF); ok(b / a > .4 && b / a < .6, b / a); });
test("carbon-14: 25% left means two half-lives, about 11,460 years", () => { const age = K.ageFromFraction(.25); ok(Math.round(age / 10) * 10 === 11460, age); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + JSON.stringify(ev.filter((e) => !(e.t >= 0 && e.t < tl.dur - .5)).slice(0, 3))); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous");
});
console.log(`\n${pass} tests passed`);
