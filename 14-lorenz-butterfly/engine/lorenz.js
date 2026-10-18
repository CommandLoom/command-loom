// The Lorenz system (E. N. Lorenz, "Deterministic Nonperiodic Flow", J. Atmos. Sci. 20, 130–141, 1963):
// dx/dt = σ(y − x), dy/dt = x(ρ − z) − y, dz/dt = xy − βz with the classic σ = 10, ρ = 28, β = 8/3.
// Integrated with fourth-order Runge–Kutta; deterministic.
(function (root) {
  "use strict";
  const SIG = 10, RHO = 28, BETA = 8 / 3;
  const f = (x, y, z) => [SIG * (y - x), x * (RHO - z) - y, x * y - BETA * z];
  function rk4(p, h) {
    const [x, y, z] = p, a = f(x, y, z), b = f(x + h / 2 * a[0], y + h / 2 * a[1], z + h / 2 * a[2]), c = f(x + h / 2 * b[0], y + h / 2 * b[1], z + h / 2 * b[2]), d = f(x + h * c[0], y + h * c[1], z + h * c[2]);
    return [x + h / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]), y + h / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1]), z + h / 6 * (a[2] + 2 * b[2] + 2 * c[2] + d[2])];
  }
  function orbit(p0, h, n) { const out = [p0]; let p = p0; for (let i = 0; i < n; i++) { p = rk4(p, h); out.push(p); } return out; }
  // a cloud of N points in a tiny cube, stepped together (flat Float64Array for speed)
  class Cloud {
    constructor(N, c, w, seed = 1) {
      this.N = N; this.P = new Float64Array(N * 3); this.t = 0; let a = seed >>> 0; const r = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
      for (let i = 0; i < N; i++) { this.P[i * 3] = c[0] + (r() - .5) * w; this.P[i * 3 + 1] = c[1] + (r() - .5) * w; this.P[i * 3 + 2] = c[2] + (r() - .5) * w; }
    }
    step(h, m = 1) { const P = this.P; for (let s = 0; s < m; s++) { for (let i = 0; i < this.N; i++) { const q = rk4([P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], h); P[i * 3] = q[0]; P[i * 3 + 1] = q[1]; P[i * 3 + 2] = q[2]; } this.t += h; } return this; }
    spread() { let mx = [0, 0, 0], s = 0; const N = this.N, P = this.P; for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) mx[k] += P[i * 3 + k] / N;
      for (let i = 0; i < N; i++) s += (P[i * 3] - mx[0]) ** 2 + (P[i * 3 + 1] - mx[1]) ** 2 + (P[i * 3 + 2] - mx[2]) ** 2; return Math.sqrt(s / N); }
    rightShare() { let c = 0; for (let i = 0; i < this.N; i++) if (this.P[i * 3] > 0) c++; return c / this.N; }
  }
  const api = { SIG, RHO, BETA, f, rk4, orbit, Cloud };
  root.Lorenz = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
