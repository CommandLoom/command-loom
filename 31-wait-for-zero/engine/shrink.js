// A ball inside a shape (circle or regular polygon) under gravity, bouncing elastically (angle in = angle out, no energy lost).
// Game rule: every bounce shrinks the shape by 1% of its starting size, so a counter runs from 100% to 0%. The shape shrinks
// towards the point where the ball touches it (a scaling centred on the contact point), so the ball is never pushed by a wall
// and its energy never changes; at 0% the shape is exactly the ball's size, around the ball.
// Between bounces the ball flies on an exact parabola: hits on a polygon side are roots of a quadratic, hits on a circle are
// found by bisection to machine precision.
// Units: metres, seconds, m/s². Size = the shape's inradius ρ; the ball's centre moves in the same shape with inradius a = ρ - r,
// centred at (cx, cy).
(function (root) {
  "use strict";
  function normals(shape) { if (shape.type === "circle") return null; const out = []; for (let i = 0; i < shape.n; i++) { const th = shape.rot + 2 * Math.PI * i / shape.n; out.push([Math.cos(th), Math.sin(th)]); } return out; }
  // signed distance of point (x, y) from the boundary of the domain with inradius a centred at (cx, cy) (negative inside)
  function sd(shape, N, a, cx, cy, x, y) { const dx = x - cx, dy = y - cy; if (!N) return Math.hypot(dx, dy) - a; let m = -Infinity; for (const [nx, ny] of N) m = Math.max(m, nx * dx + ny * dy - a); return m; }
  function run(shape, opt) {
    const { rho0 = 1, r = 0.04, g = 9.81, x0, y0, vx0 = 0, vy0 = 0, step = 1, tEnd = 120 } = opt, N = normals(shape), a0 = rho0 - r;
    let t = 0, x = x0, y = y0, vx = vx0, vy = vy0, a = a0, cx = 0, cy = 0, pct = 100;
    const segs = [{ t, x, y, vx, vy, a, cx, cy }], hits = [];
    const at = (s) => [x + vx * s, y + vy * s - 0.5 * g * s * s];
    function firstHit() {
      if (!N) { const out = (s) => { const p = at(s); return Math.hypot(p[0] - cx, p[1] - cy) - a; }, dt0 = Math.max(1e-6, Math.min(.002, a * .02));
        let lo = 0, hi = dt0; while (out(hi) < 0) { lo = hi; hi += dt0; if (hi > 60) return null; }
        for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (out(m) < 0) lo = m; else hi = m; }
        const p = at(lo), l = Math.hypot(p[0] - cx, p[1] - cy); return { s: lo, n: [(p[0] - cx) / l, (p[1] - cy) / l] }; }
      let best = null;
      for (const n of N) {                                   // d(s) = A s² + Bv s + C0, crossing from inside (−) to outside (+)
        const A = -0.5 * g * n[1], Bv = n[0] * vx + n[1] * vy, C0 = n[0] * (x - cx) + n[1] * (y - cy) - a;
        let roots = [];
        if (Math.abs(A) < 1e-14) { if (Bv > 0) roots = [-C0 / Bv]; }
        else { const disc = Bv * Bv - 4 * A * C0; if (disc >= 0) { const q = Math.sqrt(disc); roots = [(-Bv - q) / (2 * A), (-Bv + q) / (2 * A)]; } }
        for (const s of roots) if (s > 1e-13 && 2 * A * s + Bv > 0 && (!best || s < best.s)) best = { s, n };
      }
      return best;
    }
    while (t < tEnd && pct > 0) {
      const h = firstHit(); if (!h) break;
      const p = at(h.s), ux = vx, uy = vy - g * h.s, dot = ux * h.n[0] + uy * h.n[1];
      t += h.s; x = p[0]; y = p[1]; vx = ux - 2 * dot * h.n[0]; vy = uy - 2 * dot * h.n[1];
      pct -= step; const aNew = a0 * pct / 100, k = aNew / a;  // shrink towards the contact point
      cx = x + k * (cx - x); cy = y + k * (cy - y); a = aNew;
      hits.push({ t, x, y, speed: dot, pct, a, cx, cy }); segs.push({ t, x, y, vx, vy, a, cx, cy });
    }
    return { shape, N, g, r, a0, rho0, segs, hits, tZero: pct <= 0 ? t : null };
  }
  function segAt(S, t) { const a = S.segs; let lo = 0, hi = a.length - 1; if (t >= a[hi].t) return hi; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m].t <= t) lo = m; else hi = m; } return lo; }
  function pos(S, t) { if (S.tZero != null && t >= S.tZero) { const h = S.hits[S.hits.length - 1]; return [h.x, h.y]; } const sg = S.segs[segAt(S, t)], s = t - sg.t; return [sg.x + sg.vx * s, sg.y + sg.vy * s - 0.5 * S.g * s * s]; }
  function vel(S, t) { const sg = S.segs[segAt(S, t)], s = t - sg.t; return [sg.vx, sg.vy - S.g * s]; }
  const energy = (S, t) => { const p = pos(S, t), v = vel(S, t); return 0.5 * (v[0] * v[0] + v[1] * v[1]) + S.g * p[1]; };
  const hitsBefore = (S, t) => { let lo = 0, hi = S.hits.length; while (lo < hi) { const m = (lo + hi) >> 1; if (S.hits[m].t <= t) lo = m + 1; else hi = m; } return lo; };
  const api = { run, pos, vel, energy, segAt, hitsBefore, sd, normals };
  root.Shrink = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
