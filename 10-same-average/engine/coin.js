// The multiplicative coin game (O. Peters, "The ergodicity problem in economics", Nature Physics 15, 1216–1221, 2019):
// each round every player flips a fair coin; heads multiplies their money by 1.5 (+50 %), tails by 0.6 (−40 %).
// Expected value per round ×1.05, but the typical (time-average) factor is √(1.5 × 0.6) = √0.9 ≈ 0.949.
// Every player has their own seeded coin, so any player's history can be recomputed exactly.
(function (root) {
  "use strict";
  const UP = 1.5, DOWN = .6, START = 100;
  function hash(a, b) { let h = (Math.imul(a, 0x9E3779B1) ^ Math.imul(b + 0x7F4A7C15, 0x85EBCA77)) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297A2D39) >>> 0; h ^= h >>> 15; return h >>> 0; }
  const heads = (seed, player, round) => (hash(hash(seed, player), round) & 1) === 1;
  // W[r][i] = money of player i after r rounds
  function run(N, R, seed = 2026) {
    const W = [new Float64Array(N).fill(START)];
    for (let r = 1; r <= R; r++) { const p = W[r - 1], q = new Float64Array(N); for (let i = 0; i < N; i++) q[i] = p[i] * (heads(seed, i, r) ? UP : DOWN); W.push(q); }
    return W;
  }
  function stats(w) {
    const s = Float64Array.from(w).sort(), N = s.length; let sum = 0, above = 0; for (const v of s) { sum += v; if (v > START + 1e-9) above++; }
    const top = Math.ceil(N / 100); let topSum = 0; for (let i = N - top; i < N; i++) topSum += s[i];
    return { mean: sum / N, median: N % 2 ? s[(N - 1) / 2] : (s[N / 2 - 1] + s[N / 2]) / 2, above: above / N, below: 1 - above / N, top1: topSum / sum, max: s[N - 1], min: s[0] };
  }
  const api = { UP, DOWN, START, heads, run, stats, expected: UP / 2 + DOWN / 2, typical: Math.sqrt(UP * DOWN) };
  root.Coin = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
