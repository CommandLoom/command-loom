// A ball inside a ring under gravity. Between bounces the ball flies on an exact parabola (no step-by-step integration error);
// each bounce is found by bisection to machine precision and reflects the velocity off the wall (angle in = angle out, no energy lost).
// Units: metres, seconds, m/s². The ring has radius R; the ball has radius r, so its centre bounces at R - r.
(function (root) {
  "use strict";
  const PLANETS = [["Moon", 1.62], ["Mars", 3.71], ["Earth", 9.81], ["Jupiter", 24.79], ["Sun", 274.0]];   // surface gravity, NASA fact sheets
  function run(g, R, r, x0, y0, vx0, vy0, tEnd) {
    const Rc = R - r, dt0 = 0.004 * Math.sqrt(R / g), B = [{ t: 0, x: x0, y: y0, vx: vx0, vy: vy0 }];
    let t = 0, x = x0, y = y0, vx = vx0, vy = vy0;
    const at = (s) => [x + vx * s, y + vy * s - 0.5 * g * s * s];
    const out = (s) => { const p = at(s); return Math.hypot(p[0], p[1]) - Rc; };
    while (t < tEnd) {
      let a = 0, b = dt0; while (out(b) < 0) { a = b; b += dt0; if (b > 50) return B; }
      for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (out(m) < 0) a = m; else b = m; }
      const s = a, p = at(s), l = Math.hypot(p[0], p[1]), nx = p[0] / l, ny = p[1] / l;
      let ux = vx, uy = vy - g * s; const dot = ux * nx + uy * ny; ux -= 2 * dot * nx; uy -= 2 * dot * ny;
      t += s; x = nx * Rc; y = ny * Rc; vx = ux; vy = uy; B.push({ t, x, y, vx, vy });
    }
    return B;
  }
  function idx(B, t) { let lo = 0, hi = B.length - 1; if (t >= B[hi].t) return hi; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (B[m].t <= t) lo = m; else hi = m; } return lo; }
  function pos(B, g, t) { const b = B[idx(B, t)], s = t - b.t; return [b.x + b.vx * s, b.y + b.vy * s - 0.5 * g * s * s]; }
  const energy = (b, g) => 0.5 * (b.vx * b.vx + b.vy * b.vy) + g * b.y;    // per unit mass
  const api = { PLANETS, run, idx, pos, energy };
  root.Gravity = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
