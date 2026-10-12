// sim.js verification tests:  node test_sim.js
const M = require("./sim.js");
let fail = 0; const ok = (c, msg) => { console.log((c ? "  OK    " : "  FAIL  ") + msg); if (!c) fail++; };

// 1) Reproducibility: same seed -> same result; different chunking of steps -> same result
{
  const a = M.makeSim({ n: 10, seed: 42 }).advance(20), b = M.makeSim({ n: 10, seed: 42 });
  for (let i = 0; i < 600; i++) b.advance(1 / 30);
  let same = true; for (let i = 0; i < 10; i++) if (a.th[i] !== b.th[i] || a.w[i] !== b.w[i]) same = false;
  ok(same && Math.abs(a.t - b.t) < 1e-9, "same seed + different chunking (20 s at once / 600×1/30 s) gives an identical state");
  const c = M.makeSim({ n: 10, seed: 43 }).advance(20); ok(c.th[0] !== a.th[0], "different seed, different start");
}

// 2) Physics: real experiment values (tempo ~208 ticks/min, amplitude ~45°), small deviation after locking
const runs = (n, seeds, T, extra = {}) => seeds.map(seed => { const s = M.makeSim({ n, seed, ...extra }); let amp = 0;
  while (s.t < T) { s.advance(0.5); if (s.t > T - 5) for (let i = 0; i < n; i++) amp = Math.max(amp, Math.abs(s.th[i])); }
  s.order(); let lo = 1e9, hi = 0; for (let i = 0; i < n; i++) { lo = Math.min(lo, s.bpm(i)); hi = Math.max(hi, s.bpm(i)); }
  return { seed, lock: s.lockedAt, maxDev: s.maxDev, lo, hi, ampDeg: amp * 180 / Math.PI }; });
for (const [n, T] of [[2, 120], [10, 180], [100, 220]]) {
  const r = runs(n, [1, 2, 3, 4, 5].slice(0, n === 100 ? 3 : 5), T);
  const locks = r.map(x => x.lock < 0 ? "none" : x.lock.toFixed(0)).join(", ");
  console.log(`N=${n}: lock time (s) = ${locks} | final deviation ≤ ${Math.max(...r.map(x => x.maxDev)).toFixed(1)}° | tempo ${Math.min(...r.map(x => x.lo)).toFixed(1)}–${Math.max(...r.map(x => x.hi)).toFixed(1)} ticks/min | amplitude ~${r[0].ampDeg.toFixed(0)}°`);
  ok(r.every(x => x.lock > 0), `N=${n}: every run reached full sync`);
  ok(r.every(x => x.maxDev < 5), `N=${n}: at the end everyone is within 5° of the shared rhythm`);
  ok(r.every(x => x.lo > 203 && x.hi < 213), `N=${n}: tempo is about 208 ticks/min`);
}

// 3) Fixed board: no coupling, never reports sync (with a ±1% tempo difference)
{
  const r = runs(2, [1, 2, 3, 4, 5, 6, 7, 8], 120, { fixed: true, spread: 1 });
  ok(r.every(x => x.lock < 0), "fixed board (±1%): no sync in any of 8 runs");
  const f = runs(2, [1, 2, 3, 4, 5, 6, 7, 8], 120, { spread: 1 });
  console.log("  free board (±1%) lock times: " + f.map(x => x.lock < 0 ? "none" : x.lock.toFixed(0)).join(", "));
  ok(f.every(x => x.lock > 0), "free board (±1%): all in sync");
}
console.log(fail ? `\n${fail} FAILED` : "\nALL TESTS PASSED");
