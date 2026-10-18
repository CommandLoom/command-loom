// A toy model of natural selection by camouflage (inspired by the peppered moth, Biston betularia).
// Each moth has a heritable shade c (0 = pale, 1 = dark). Each generation birds eat a moth with probability
// BASE + EAT · |c − bark|, so moths that stand out are eaten more often. Survivors are drawn at random as parents
// to refill the population; a child copies its parent's shade plus a small random change (σ = MUT). Seeded and deterministic.
(function (root) {
  "use strict";
  const N = 400, GENS = 140, BASE = .05, EAT = .8, MUT = .03;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // bark shade by generation: pale lichen, then soot darkens it, then it cleans up again
  function bark(g) { if (g < 20) return .2; if (g < 40) return .2 + .6 * (g - 20) / 20; if (g < 75) return .8; if (g < 95) return .8 - .6 * (g - 75) / 20; return .2; }
  function run(seed = 17) {
    const r = rng(seed), gauss = () => { const u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    let pop = Array.from({ length: N }, () => Math.min(1, Math.max(0, .2 + gauss() * .08)));
    const gens = [];
    for (let g = 0; g < GENS; g++) {
      const b = bark(g), eaten = pop.map((c) => r() < BASE + EAT * Math.abs(c - b)), surv = pop.filter((_, i) => !eaten[i]);
      const pos = pop.map(() => [r(), r()]);
      gens.push({ g, bark: b, pop, eaten, pos, mean: pop.reduce((a, c) => a + c, 0) / N, eatenCount: eaten.filter(Boolean).length, darkShare: pop.filter((c) => c > .5).length / N });
      pop = Array.from({ length: N }, () => Math.min(1, Math.max(0, surv[Math.floor(r() * surv.length)] + gauss() * MUT)));
    }
    return gens;
  }
  const api = { N, GENS, BASE, EAT, MUT, bark, run, rng };
  root.Evolve = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
