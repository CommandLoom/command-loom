// Estimating π with randomness. Darts: points uniform in the square [−1, 1]²; the share inside the unit circle tends to π/4.
// Buffon's needle (G.-L. Leclerc, Comte de Buffon, 1777): needles of length L dropped on lines spaced L apart cross a line
// with probability 2/π, so π ≈ 2·(needles) / (crossings). Seeded pseudo-random numbers, so every run is identical.
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function darts(N, seed = 314) { const r = rng(seed), X = new Float32Array(N), Y = new Float32Array(N), IN = new Uint32Array(N + 1);
    for (let i = 0; i < N; i++) { X[i] = r() * 2 - 1; Y[i] = r() * 2 - 1; IN[i + 1] = IN[i] + (X[i] * X[i] + Y[i] * Y[i] <= 1 ? 1 : 0); } return { X, Y, IN, est: (n) => n ? 4 * IN[n] / n : 0 }; }
  // needles: centre (x, y) in a band of height H (lines every 1 unit), angle a; length 1
  function needles(N, H = 6, W = 10, seed = 1777) { const r = rng(seed), out = []; let cross = 0; const CR = new Uint32Array(N + 1);
    for (let i = 0; i < N; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, dy = Math.sin(a) / 2, c = Math.floor(y - dy) !== Math.floor(y + dy); if (c) cross++; CR[i + 1] = cross; out.push({ x, y, a, c }); }
    return { list: out, CR, est: (n) => (CR[n] ? 2 * n / CR[n] : 0) }; }
  const digitsRight = (est) => { const s = est.toFixed(6), p = Math.PI.toFixed(6); let k = 0; for (let i = 0; i < s.length; i++) { if (s[i] !== p[i]) break; if (s[i] !== ".") k++; } return k; };
  const api = { rng, darts, needles, digitsRight };
  root.MC = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
