// Billiards: balls move in straight lines at constant speed and reflect off the wall (angle in = angle out).
// No gravity, no friction, no ball-ball collisions. Every wall hit is found exactly (quadratic / line equations), not by small steps.
// Tables: circle (radius R), ellipse (semi-axes a, b), stadium (two half-circles of radius R joined by straight sides of half-length L).
(function (root) {
  "use strict";
  const EPS = 1e-9;
  function circle(R) { return { kind: "circle", R, hit: (px, py, dx, dy) => quad(dx * dx + dy * dy, 2 * (px * dx + py * dy), px * px + py * py - R * R), normal: (x, y) => [x / R, y / R], w: 2 * R, h: 2 * R }; }
  function ellipse(a, b) { return { kind: "ellipse", a, b, c: Math.sqrt(a * a - b * b),
    hit: (px, py, dx, dy) => quad(dx * dx / (a * a) + dy * dy / (b * b), 2 * (px * dx / (a * a) + py * dy / (b * b)), px * px / (a * a) + py * py / (b * b) - 1),
    normal: (x, y) => { const nx = x / (a * a), ny = y / (b * b), l = Math.hypot(nx, ny); return [nx / l, ny / l]; }, w: 2 * a, h: 2 * b }; }
  function stadium(L, R) {
    return { kind: "stadium", L, R, w: 2 * (L + R), h: 2 * R,
      hit(px, py, dx, dy) { let best = Infinity;
        for (const yw of [R, -R]) if (Math.abs(dy) > EPS) { const s = (yw - py) / dy, x = px + s * dx; if (s > EPS && Math.abs(x) <= L + 1e-12) best = Math.min(best, s); }
        for (const cx of [L, -L]) for (const s of roots(dx * dx + dy * dy, 2 * ((px - cx) * dx + py * dy), (px - cx) ** 2 + py * py - R * R)) {
          const x = px + s * dx; if (s > EPS && s < best && (cx > 0 ? x >= L - 1e-12 : x <= -L + 1e-12)) best = s; }
        return best; },
      normal(x, y) { if (x > this.L) { const l = Math.hypot(x - this.L, y); return [(x - this.L) / l, y / l]; } if (x < -this.L) { const l = Math.hypot(x + this.L, y); return [(x + this.L) / l, y / l]; } return [0, Math.sign(y)]; } };
  }
  // smallest positive root of A s^2 + B s + C = 0 (the ball is inside, so C <= 0 and there is exactly one forward hit)
  function quad(A, B, C) { const disc = B * B - 4 * A * C; if (disc < 0) return Infinity; const r = Math.sqrt(disc), q = -0.5 * (B + (B >= 0 ? r : -r));
    const s1 = q / A, s2 = C / q; let s = Infinity; for (const v of [s1, s2]) if (v > EPS && v < s) s = v; return s; }

  function roots(A, B, C) { const disc = B * B - 4 * A * C; if (disc < 0) return []; const r = Math.sqrt(disc); return [(-B - r) / (2 * A), (-B + r) / (2 * A)]; }

  // run n balls from (x0, y0), evenly spread directions, speed v, until time tEnd. Returns per-ball bounce lists.
  function run(table, x0, y0, n, v, tEnd, angle0 = 0) {
    const balls = [];
    for (let j = 0; j < n; j++) {
      const th = angle0 + 2 * Math.PI * (j + 0.5) / n; let dx = Math.cos(th), dy = Math.sin(th), px = x0, py = y0, t = 0;
      const T = [0], X = [px], Y = [py];
      while (t < tEnd) {
        const s = table.hit(px, py, dx, dy); if (!isFinite(s)) break;
        px += s * dx; py += s * dy; t += s / v;
        const [nx, ny] = table.normal(px, py), dot = dx * nx + dy * ny; dx -= 2 * dot * nx; dy -= 2 * dot * ny;
        const l = Math.hypot(dx, dy); dx /= l; dy /= l;
        T.push(t); X.push(px); Y.push(py);
      }
      balls.push({ T: Float64Array.from(T), X: Float64Array.from(X), Y: Float64Array.from(Y), hue: j / n });
    }
    return { table, v, n, x0, y0, tEnd, balls };
  }
  function seg(b, t) { let lo = 0, hi = b.T.length - 1; if (t >= b.T[hi]) return hi - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (b.T[m] <= t) lo = m; else hi = m; } return lo; }
  function pos(b, t) { const i = Math.max(0, Math.min(b.T.length - 2, seg(b, t))), u = (t - b.T[i]) / (b.T[i + 1] - b.T[i] || 1);
    return [b.X[i] + (b.X[i + 1] - b.X[i]) * u, b.Y[i] + (b.Y[i + 1] - b.Y[i]) * u, i]; }
  // largest distance of any ball from point (x, y) at time t
  function spread(sim, t, x, y) { let m = 0; for (const b of sim.balls) { const p = pos(b, t); m = Math.max(m, Math.hypot(p[0] - x, p[1] - y)); } return m; }
  const api = { circle, ellipse, stadium, run, pos, seg, spread };
  root.Billiard = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
