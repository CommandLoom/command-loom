// Drawing with circles: a closed path sampled at N points is written as a sum of rotating circles (a discrete Fourier series).
// Circle k turns k times per lap with radius |c_k| and starting angle arg c_k; chained tip to tail, the last tip traces the path.
(function (root) {
  "use strict";
  // resample a closed polyline to N points equally spaced along its length
  function resample(pts, N) {
    const P = pts.concat([pts[0]]), L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tot = L[L.length - 1], out = []; let j = 0;
    for (let n = 0; n < N; n++) { const s = tot * n / N; while (L[j + 1] < s) j++; const u = (s - L[j]) / (L[j + 1] - L[j] || 1); out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * u, P[j][1] + (P[j + 1][1] - P[j][1]) * u]); }
    return out;
  }
  // DFT: c_k = (1/N) Σ z_n e^{−2πi k n / N}, k = −N/2 … N/2 − 1; sorted by radius (largest first)
  function dft(z) {
    const N = z.length, out = [];
    for (let k = -N / 2; k < N / 2; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const a = -2 * Math.PI * k * n / N; re += z[n][0] * Math.cos(a) - z[n][1] * Math.sin(a); im += z[n][0] * Math.sin(a) + z[n][1] * Math.cos(a); }
      out.push({ k, re: re / N, im: im / N, r: Math.hypot(re, im) / N, ph: Math.atan2(im, re) }); }
    return out.sort((a, b) => b.r - a.r);
  }
  // position of every circle centre and the final tip at lap fraction s, using the first K circles
  function chain(C, K, s) { let x = 0, y = 0; const pts = [[0, 0]]; for (let i = 0; i < K; i++) { const c = C[i], a = 2 * Math.PI * c.k * s + c.ph; x += c.r * Math.cos(a); y += c.r * Math.sin(a); pts.push([x, y]); } return pts; }
  const tip = (C, K, s) => { const p = chain(C, K, s); return p[p.length - 1]; };
  // mean distance between the K-circle drawing and the target path, measured at the N sample points
  function error(C, K, z) { let e = 0; for (let n = 0; n < z.length; n++) { const p = tip(C, K, n / z.length); e += Math.hypot(p[0] - z[n][0], p[1] - z[n][1]); } return e / z.length; }
  // shapes (unit-ish size, y down)
  const heart = (N) => Array.from({ length: N }, (_, i) => { const t = 2 * Math.PI * i / N; return [16 * Math.sin(t) ** 3 / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17]; });
  const star = () => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .4 : 1; return [r * Math.cos(a), r * Math.sin(a)]; });
  // the Command Loom chevron ">" as one thick closed outline
  const loom = () => [[-.85, -.85], [.65, 0], [-.85, .85], [-.85, .45], [-.05, 0], [-.85, -.45]];
  const api = { resample, dft, chain, tip, error, heart, star, loom };
  root.Fourier = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
