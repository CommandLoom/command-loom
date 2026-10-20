// Gray–Scott reaction–diffusion (P. Gray & S. K. Scott 1984; patterns catalogued by J. E. Pearson, Science 261, 1993).
// Two chemicals on a W × H grid: U is fed in at rate F, V is removed at rate F + k, and the reaction U + 2V → 3V turns U into V.
// Both diffuse, U twice as fast as V. Discretisation as in Karl Sims' reaction–diffusion tutorial: dt = 1, D_U = 1, D_V = 0.5,
// 3×3 Laplacian (centre −1, sides 0.2, corners 0.05), periodic edges. Fully deterministic (seeded noise).
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  class Sim {
    // seed: a small square of V (half-width r cells) at the centre
    constructor(W, H, F, k, seed = 1, r = 4) {
      this.W = W; this.H = H; this.F = F; this.k = k; this.steps = 0; const N = W * H, rnd = rng(seed);
      this.U = new Float32Array(N).fill(1); this.V = new Float32Array(N); this.U2 = new Float32Array(N); this.V2 = new Float32Array(N);
      const cx = W >> 1, cy = H >> 1;
      for (let y = cy - r; y < cy + r; y++) for (let x = cx - r; x < cx + r; x++) { const i = y * W + x; this.U[i] = .5 + (rnd() - .5) * .1; this.V[i] = .25 + (rnd() - .5) * .1; }
      this.XM = Int32Array.from({ length: W }, (_, x) => (x - 1 + W) % W); this.XP = Int32Array.from({ length: W }, (_, x) => (x + 1) % W);
      this.YM = Int32Array.from({ length: H }, (_, y) => ((y - 1 + H) % H) * W); this.YP = Int32Array.from({ length: H }, (_, y) => ((y + 1) % H) * W);
    }
    step(m = 1) {
      const W = this.W, H = this.H, F = this.F, K = this.k, XM = this.XM, XP = this.XP, YM = this.YM, YP = this.YP;
      for (let s = 0; s < m; s++) {
        const U = this.U, V = this.V, U2 = this.U2, V2 = this.V2;
        for (let y = 0; y < H; y++) {
          const ym = YM[y], y0 = y * W, yp = YP[y];
          for (let x = 0; x < W; x++) {
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
      const W = this.W, H = this.H, V = this.V, seen = new Uint8Array(W * H), stack = []; let count = 0;
      for (let i = 0; i < W * H; i++) { if (seen[i] || V[i] <= th) continue; count++; seen[i] = 1; stack.push(i);
        while (stack.length) { const j = stack.pop(), x = j % W, y = (j / W) | 0;
          for (const q of [y * W + (x + 1) % W, y * W + (x - 1 + W) % W, ((y + 1) % H) * W + x, ((y - 1 + H) % H) * W + x]) if (!seen[q] && V[q] > th) { seen[q] = 1; stack.push(q); } } }
      return count;
    }
    // share of the grid where the pattern is (V > th)
    cover(th = .2) { let c = 0; for (let i = 0; i < this.V.length; i++) if (this.V[i] > th) c++; return c / this.V.length; }
    // share of the grid the pattern has reached so far (V above a small trace level)
    reach(th = .05) { let c = 0; for (let i = 0; i < this.V.length; i++) if (this.V[i] > th) c++; return c / this.V.length; }
  }
  const api = { Sim, rng };
  root.RD = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
