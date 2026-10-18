// Newtonian gravity for three point masses in a plane (G = 1, no softening).
// Integrator: Dormand–Prince 5(4) with adaptive steps (tight tolerance), so close encounters are followed accurately.
// State: [x1, y1, x2, y2, x3, y3, vx1, vy1, vx2, vy2, vx3, vy3].
(function (root) {
  "use strict";
  function deriv(m, s, out) {
    for (let i = 0; i < 6; i++) out[i] = s[6 + i];
    for (let i = 0; i < 3; i++) { out[6 + 2 * i] = 0; out[7 + 2 * i] = 0; }
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const dx = s[2 * j] - s[2 * i], dy = s[2 * j + 1] - s[2 * i + 1], r2 = dx * dx + dy * dy, r3 = r2 * Math.sqrt(r2);
      out[6 + 2 * i] += m[j] * dx / r3; out[7 + 2 * i] += m[j] * dy / r3; out[6 + 2 * j] -= m[i] * dx / r3; out[7 + 2 * j] -= m[i] * dy / r3; }
    return out;
  }
  const A = [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]];
  const B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0], B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
  class System {
    constructor(m, s, tol = 1e-12) { this.m = m.slice(); this.s = Float64Array.from(s); this.t = 0; this.h = 1e-3; this.tol = tol; this.k = Array.from({ length: 7 }, () => new Float64Array(12)); this.tmp = new Float64Array(12); this.minDist = Infinity; this.steps = 0; }
    // advance exactly to time t1 (the last step is shortened to land on it)
    advance(t1) {
      const k = this.k, y = this.s, tmp = this.tmp, m = this.m;
      while (this.t < t1 - 1e-15) {
        let h = Math.min(this.h, t1 - this.t);
        for (;;) {
          deriv(m, y, k[0]);
          for (let st = 1; st < 7; st++) { for (let i = 0; i < 12; i++) { let a = y[i]; for (let j = 0; j < st; j++) a += h * A[st][j] * k[j][i]; tmp[i] = a; } deriv(m, tmp, k[st]); }
          let err = 0; for (let i = 0; i < 12; i++) { let e = 0; for (let j = 0; j < 7; j++) e += h * (B5[j] - B4[j]) * k[j][i]; const sc = this.tol * (1 + Math.abs(tmp[i])); err = Math.max(err, Math.abs(e) / sc); }
          if (err <= 1) { y.set(tmp); this.t += h; this.steps++; this.h = h * Math.min(5, .9 * Math.pow(err + 1e-30, -.2)); break; }   // tmp holds the 5th-order solution (FSAL row = B5)
          h *= Math.max(.1, .9 * Math.pow(err, -.25));
        }
        for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) this.minDist = Math.min(this.minDist, Math.hypot(y[2 * j] - y[2 * i], y[2 * j + 1] - y[2 * i + 1]));
      }
      return this;
    }
    energy() { const s = this.s, m = this.m; let e = 0; for (let i = 0; i < 3; i++) e += .5 * m[i] * (s[6 + 2 * i] ** 2 + s[7 + 2 * i] ** 2);
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) e -= m[i] * m[j] / Math.hypot(s[2 * j] - s[2 * i], s[2 * j + 1] - s[2 * i + 1]); return e; }
    pos(i) { return [this.s[2 * i], this.s[2 * i + 1]]; }
    clone() { const c = new System(this.m, this.s, this.tol); c.t = this.t; c.h = this.h; return c; }
  }
  // the figure-eight: three equal masses on one curve (found numerically by C. Moore, 1993; proved by A. Chenciner and R. Montgomery, 2000).
  // Initial values and period from C. Simó's computation, as usually quoted.
  const EIGHT = { m: [1, 1, 1], s: [-0.97000436, 0.24308753, 0, 0, 0.97000436, -0.24308753, 0.4662036850, 0.4323657300, -0.93240737, -0.86473146, 0.4662036850, 0.4323657300], T: 6.32591398 };
  // Burrau's Pythagorean problem (1913): masses 3, 4, 5 at rest at the corners of a 3-4-5 right triangle
  const PYTH = { m: [3, 4, 5], s: [1, 3, -2, -1, 1, -1, 0, 0, 0, 0, 0, 0] };
  const api = { System, EIGHT, PYTH, deriv };
  root.ThreeBody = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
