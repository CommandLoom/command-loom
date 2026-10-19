// Perfect fit: a flat piece is dropped onto a block with a hole of the same shape, 2% larger (the clearance).
// Whether it goes in is decided by exact geometry: the piece's outline (turned by an angle, scaled by a size) must lie entirely
// inside the hole's outline: every corner inside, and no edges crossing. The drop is free fall (g = 9.81 m/s²); a piece that
// does not fit lands on the block and bounces (each bounce keeps 35% of its speed) until it rests.
(function (root) {
  "use strict";
  const G = 9.81;
  // ---------- outlines (centimetres, centred on the origin) ----------
  function star(R = 4, r = 1.75, n = 5) { const p = []; for (let i = 0; i < 2 * n; i++) { const a = Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; p.push([rr * Math.cos(a), rr * Math.sin(a)]); } return p; }
  function gear(teeth = 12, Ro = 4, Rr = 3.25) { const p = [], step = 2 * Math.PI / teeth;
    for (let i = 0; i < teeth; i++) { const a = i * step; for (const [f, rr] of [[0, Rr], [.18, Rr], [.3, Ro], [.7, Ro], [.82, Rr]]) p.push([rr * Math.cos(a + f * step), rr * Math.sin(a + f * step)]); } return p; }
  function heart(n = 120) { const p = []; for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n; p.push([16 * Math.sin(t) ** 3 / 4.4, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 4.4 + 0.6]); } return p; }
  const plus = () => [[-1.3, 4], [1.3, 4], [1.3, 1.3], [4, 1.3], [4, -1.3], [1.3, -1.3], [1.3, -4], [-1.3, -4], [-1.3, -1.3], [-4, -1.3], [-4, 1.3], [-1.3, 1.3]];
  const SHAPES = { star: star(), gear: gear(), heart: heart(), plus: plus() };
  // ---------- geometry ----------
  const tf = (P, ang, s) => { const c = Math.cos(ang), si = Math.sin(ang); return P.map(([x, y]) => [s * (x * c - y * si), s * (x * si + y * c)]); };
  function inside(P, x, y) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function cross(a, b, c, d) { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d); return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)); }
  function contained(P, Q) { for (const [x, y] of P) if (!inside(Q, x, y)) return false;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; for (let j = 0; j < Q.length; j++) if (cross(a, b, Q[j], Q[(j + 1) % Q.length])) return false; } return true; }
  const CLEAR = 1.02;
  const fits = (shape, angleDeg, size = 1) => contained(tf(SHAPES[shape], angleDeg * Math.PI / 180, size), tf(SHAPES[shape], 0, CLEAR));
  // largest turn (degrees) that still fits, by bisection
  function maxAngle(shape) { let lo = 0, hi = 30; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (fits(shape, m)) lo = m; else hi = m; } return lo; }
  // ---------- drop: height of the piece's bottom above the block top (m) at time t; returns [height, impacts] ----------
  function drop(h, thick, fit, e = 0.35) {
    const imp = []; const floor = fit ? -thick : 0, t1 = Math.sqrt(2 * (h - floor) / G), v1 = G * t1; imp.push({ t: t1, v: v1 });
    let t = t1, v = v1 * (fit ? 0.15 : e); while (v > 0.05) { const fl = 2 * v / G; t += fl; imp.push({ t, v }); v *= fit ? 0.15 : e; }
    const tRest = t;
    function y(tt) { if (tt <= t1) return h - 0.5 * G * tt * tt; if (tt >= tRest) return floor; for (let i = 0; i < imp.length - 1; i++) if (tt < imp[i + 1].t) { const s = tt - imp[i].t, v0 = imp[i + 1].v; return floor + v0 * s - 0.5 * G * s * s; } return floor; }
    return { y, imp, t1, tRest, floor };
  }
  const api = { SHAPES, tf, inside, contained, fits, maxAngle, drop, CLEAR, G };
  root.Fit = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
