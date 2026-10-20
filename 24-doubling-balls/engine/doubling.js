// Balls bouncing inside a shape (circle or regular polygon) under gravity, elastically (angle in = angle out, no energy lost).
// Game rule: every time a ball hits the wall, a copy of it appears at the same point, leaving at a slightly different angle
// (the bounce direction turned by TURN degrees), until the number of balls reaches CAP. Balls pass through each other.
// Each ball flies on an exact parabola; polygon hits are quadratic roots, circle hits are found by bisection to machine precision.
// Units: metres, seconds, m/s². The ball centres move inside the shape with inradius a = ρ - r.
(function (root) {
  "use strict";
  function normals(shape) { if (shape.type === "circle") return null; const out = []; for (let i = 0; i < shape.n; i++) { const th = shape.rot + 2 * Math.PI * i / shape.n; out.push([Math.cos(th), Math.sin(th)]); } return out; }
  function sd(N, a, x, y) { if (!N) return Math.hypot(x, y) - a; let m = -Infinity; for (const [nx, ny] of N) m = Math.max(m, nx * x + ny * y - a); return m; }
  function nextHit(N, a, g, x, y, vx, vy) {
    const at = (s) => [x + vx * s, y + vy * s - 0.5 * g * s * s];
    if (!N) { const out = (s) => { const p = at(s); return Math.hypot(p[0], p[1]) - a; }, dt0 = 0.008;
      // step forward; a grazing pass that leaves and re-enters within one step is caught by checking the distance maximum
      const dout = (s) => { const p = at(s); return p[0] * vx + p[1] * (vy - g * s); };   // ∝ d|p|/ds
      let lo = 0, hi = dt0;
      for (;;) { if (out(hi) >= 0) break;
        if (dout(lo) > 0 && dout(hi) < 0) { let l = lo, h = hi; for (let i = 0; i < 60; i++) { const m = (l + h) / 2; if (dout(m) > 0) l = m; else h = m; } if (out(l) >= 0) { hi = l; break; } }
        lo = hi; hi += dt0; if (hi > 60) return null; }
      for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (out(m) < 0) lo = m; else hi = m; }
      const p = at(lo), l = Math.hypot(p[0], p[1]); return { s: lo, n: [p[0] / l, p[1] / l] }; }
    let best = null;
    for (const n of N) { const A = -0.5 * g * n[1], Bv = n[0] * vx + n[1] * vy, C0 = n[0] * x + n[1] * y - a; let roots = [];
      if (Math.abs(A) < 1e-14) { if (Bv > 0) roots = [-C0 / Bv]; } else { const d = Bv * Bv - 4 * A * C0; if (d >= 0) { const q = Math.sqrt(d); roots = [(-Bv - q) / (2 * A), (-Bv + q) / (2 * A)]; } }
      for (const s of roots) if (s > 1e-12 && 2 * A * s + Bv > 0 && (!best || s < best.s)) best = { s, n }; }
    return best;
  }
  // a tiny binary heap of [time, ball]
  function Heap() { const h = []; return { push(t, b) { h.push([t, b]); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } },
    pop() { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; }, get size() { return h.length; } }; }
  function run(shape, opt) {
    const { rho = 1, r = 0.012, g = 9.81, x0, y0, vx0 = 0, vy0 = 0, turn = 2, cap = 4096, tEnd = 30 } = opt, N = normals(shape), a = rho - r, ct = Math.cos(turn * Math.PI / 180), st = Math.sin(turn * Math.PI / 180);
    const balls = [], heap = Heap(), spawns = [], hits = [];
    const add = (t, x, y, vx, vy, parent) => { const b = { id: balls.length, born: t, parent, segs: [[t, x, y, vx, vy]] }; balls.push(b); const h = nextHit(N, a, g, x, y, vx, vy); if (h) heap.push(t + h.s, b.id); b.next = h; return b; };
    add(0, x0, y0, vx0, vy0, -1);
    while (heap.size) {
      const [t, id] = heap.pop(); if (t > tEnd) break;
      const b = balls[id], [t0, x, y, vx, vy] = b.segs[b.segs.length - 1], s = b.next.s, n = b.next.n;
      const px = x + vx * s, py = y + vy * s - 0.5 * g * s * s, ux = vx, uy = vy - g * s, dot = ux * n[0] + uy * n[1];
      const rx = ux - 2 * dot * n[0], ry = uy - 2 * dot * n[1];
      b.segs.push([t, px, py, rx, ry]); hits.push([t, id, Math.atan2(py, px), dot]);
      const h = nextHit(N, a, g, px, py, rx, ry); b.next = h; if (h) heap.push(t + h.s, id);
      if (balls.length < cap) {                              // the copy: same point, bounce direction turned by TURN degrees (still pointing inwards)
        let cx = rx * ct - ry * st, cy = rx * st + ry * ct; if (cx * n[0] + cy * n[1] >= 0) { cx = rx * ct + ry * st; cy = -rx * st + ry * ct; }
        add(t, px * (1 - 1e-12), py * (1 - 1e-12), cx, cy, id); spawns.push(t);
      }
    }
    return { shape, N, a, g, r, balls, spawns, hits, cap, tCap: balls.length >= cap ? spawns[cap - 2] : null, tEnd };
  }
  function segOf(b, t) { const s = b.segs; let lo = 0, hi = s.length - 1; if (t >= s[hi][0]) return hi; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m][0] <= t) lo = m; else hi = m; } return lo; }
  function pos(S, b, t) { const q = b.segs[segOf(b, t)], s = t - q[0]; return [q[1] + q[3] * s, q[2] + q[4] * s - 0.5 * S.g * s * s]; }
  function vel(S, b, t) { const q = b.segs[segOf(b, t)], s = t - q[0]; return [q[3], q[4] - S.g * s]; }
  const count = (S, t) => { let lo = 0, hi = S.balls.length; while (lo < hi) { const m = (lo + hi) >> 1; if (S.balls[m].born <= t) lo = m + 1; else hi = m; } return lo; };
  const api = { run, pos, vel, count, segOf, sd, normals };
  root.Doubling = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
