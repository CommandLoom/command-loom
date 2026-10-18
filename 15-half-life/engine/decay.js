// Radioactive decay: every atom has the same constant chance per unit time to decay, independent of its age (no memory).
// So each atom's decay time is exponential with mean T½ / ln 2, and on average half of the atoms left decay in every half-life.
// Decay times are drawn once from a seeded generator (t = −(T½ / ln 2) · ln U), so every run is identical.
(function (root) {
  "use strict";
  const C14_HALF = 5730;                // years (Godwin 1962: 5730 ± 40; a 2019 review gives 5700 ± 30)
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function decayTimes(N, half, seed = 1) { const r = rng(seed), out = new Float64Array(N); for (let i = 0; i < N; i++) out[i] = -half / Math.LN2 * Math.log(1 - r()); return out; }
  const remaining = (times, t) => { let n = 0; for (const x of times) if (x > t) n++; return n; };
  const expected = (N, half, t) => N * Math.pow(2, -t / half);
  const ageFromFraction = (f, half = C14_HALF) => -half * Math.log2(f);
  const api = { C14_HALF, rng, decayTimes, remaining, expected, ageFromFraction };
  root.Decay = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
