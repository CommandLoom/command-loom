// Ideal Galton board: every ball makes ROWS independent left/right choices with P(right) = p.
// Each ball has its own seeded random stream, so any ball's path can be recomputed exactly and runs are reproducible.
// Binomial: P(k) = C(n,k) p^k (1-p)^(n-k); mean np, variance np(1-p) (NIST/SEMATECH e-Handbook 1.3.6.6.18).
(function (root) {
  "use strict";
  const ROWS = 16;
  function mulberry(a) { return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(seed, i) { let h = (seed * 0x9E3779B1 ^ i * 0x85EBCA77) >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x7FEB352D) >>> 0; h ^= h >>> 15; return h >>> 0; }
  // decisions of ball i: array of 0 (left) / 1 (right)
  function path(seed, i, p = .5, rows = ROWS) { const r = mulberry(hash(seed, i)), out = new Uint8Array(rows); for (let j = 0; j < rows; j++) out[j] = r() < p ? 1 : 0; return out; }
  function binOf(seed, i, p = .5, rows = ROWS) { let k = 0; const d = path(seed, i, p, rows); for (let j = 0; j < rows; j++) k += d[j]; return k; }
  function choose(n, k) { let c = 1; for (let j = 1; j <= k; j++) c = c * (n - k + j) / j; return Math.round(c); }
  function binomial(n, p) { return Array.from({ length: n + 1 }, (_, k) => choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)); }
  // continuous normal probability over the bin [k-0.5, k+0.5]
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return s * y; }
  function normalBins(n, p) { const m = n * p, sd = Math.sqrt(n * p * (1 - p)), F = (x) => .5 * (1 + erf((x - m) / (sd * Math.SQRT2))); return Array.from({ length: n + 1 }, (_, k) => F(k + .5) - F(k - .5)); }
  // a run: the bin of every ball, plus running histograms
  function run(seed, count, p = .5, rows = ROWS) {
    const bins = new Uint8Array(count); for (let i = 0; i < count; i++) bins[i] = binOf(seed, i, p, rows);
    return { seed, count, p, rows, bins };
  }
  function histogram(r, upTo) { const h = new Array(r.rows + 1).fill(0); for (let i = 0; i < Math.min(upTo, r.count); i++) h[r.bins[i]]++; return h; }
  function stats(h) { const n = h.reduce((a, b) => a + b, 0); if (!n) return { n, mean: NaN, sd: NaN }; let m = 0; h.forEach((c, k) => m += c * k); m /= n; let v = 0; h.forEach((c, k) => v += c * (k - m) ** 2); return { n, mean: m, sd: Math.sqrt(v / n) }; }
  const api = { ROWS, mulberry, hash, path, binOf, choose, binomial, normalBins, run, histogram, stats };
  root.Galton = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
