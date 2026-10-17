// Gray–Scott reaction–diffusion (P. Gray & S. K. Scott 1984; patterns catalogued by J. E. Pearson, Science 261, 1993).
// Two chemicals on a grid: U is fed in at rate F, V is removed at rate F + k, and the reaction U + 2V → 3V turns U into V.
// Both diffuse, U twice as fast as V. Discretisation as in Karl Sims' reaction–diffusion tutorial: dt = 1, D_U = 1, D_V = 0.5,
// 3×3 Laplacian (centre −1, sides 0.2, corners 0.05), periodic edges. Fully deterministic (seeded noise).
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  class Sim {
    constructor(n, F, k, seed = 1, seedSize = .08) {
      this.n = n; this.F = F; this.k = k; this.steps = 0; const N = n * n, r = rng(seed);
      this.U = new Float32Array(N).fill(1); this.V = new Float32Array(N); this.U2 = new Float32Array(N); this.V2 = new Float32Array(N);
      const s = Math.max(2, Math.round(n * seedSize)), c = n >> 1;
      for (let y = c - s; y < c + s; y++) for (let x = c - s; x < c + s; x++) { const i = y * n + x; this.U[i] = .5 + (r() - .5) * .1; this.V[i] = .25 + (r() - .5) * .1; }
    }
    step(m = 1) {
      const n = this.n, F = this.F, K = this.k;
      const XM = this.XM || (this.XM = Int32Array.from({ length: n }, (_, x) => (x - 1 + n) % n)), XP = this.XP || (this.XP = Int32Array.from({ length: n }, (_, x) => (x + 1) % n));
      for (let s = 0; s < m; s++) {
        const U = this.U, V = this.V, U2 = this.U2, V2 = this.V2;
        for (let y = 0; y < n; y++) {
          const ym = XM[y] * n, y0 = y * n, yp = XP[y] * n;
          for (let x = 0; x < n; x++) {
            const xm = XM[x], xp = XP[x], i = y0 + x;
            const lu = -U[i] + .2 * (U[y0 + xm] + U[y0 + xp] + U[ym + x] + U[yp + x]) + .05 * (U[ym + xm] + U[ym + xp] + U[yp + xm] + U[yp + xp]);
            const lv = -V[i] + .2 * (V[y0 + xm] + V[y0 + xp] + V[ym + x] + V[yp + x]) + .05 * (V[ym + xm] + V[ym + xp] + V[yp + xm] + V[yp + xp]);
            const u = U[i], v = V[i], uvv = u * v * v;
            U2[i] = u + (lu - uvv + F * (1 - u)); const nv = v + (.5 * lv + uvv - (F + K) * v); V2[i] = nv < 1e-20 ? 0 : nv;   // flush tiny values (denormals are slow)
          }
        }
        this.U = U2; this.V = V2; this.U2 = U; this.V2 = V; this.steps++;
      }
      return this;
    }
    // number of separate blobs where V > th (4-connected, periodic edges)
    blobs(th = .2) {
      const n = this.n, V = this.V, seen = new Uint8Array(n * n), stack = []; let count = 0;
      for (let i = 0; i < n * n; i++) { if (seen[i] || V[i] <= th) continue; count++; seen[i] = 1; stack.push(i);
        while (stack.length) { const j = stack.pop(), x = j % n, y = (j / n) | 0;
          for (const q of [y * n + (x + 1) % n, y * n + (x - 1 + n) % n, ((y + 1) % n) * n + x, ((y - 1 + n) % n) * n + x]) if (!seen[q] && V[q] > th) { seen[q] = 1; stack.push(q); } } }
      return count;
    }
    cover(th = .2) { let c = 0; for (let i = 0; i < this.V.length; i++) if (this.V[i] > th) c++; return c / this.V.length; }
  }
  const api = { Sim, rng };
  root.RD = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
