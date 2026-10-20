// Frictionless beads sliding under gravity along different curves from A to B (the brachistochrone problem, Johann Bernoulli, 1696).
// Energy conservation gives the speed at depth y: v = √(2 g y). Each curve is cut into many short straight pieces; on a piece from depth
// y1 to y2 with length L the bead accelerates uniformly, so it takes 2L / (v1 + v2). That gives time, position and speed along every curve.
(function (root) {
  "use strict";
  const g = 9.81;
  // y is measured downward from A; points are [x, y] in metres
  function track(pts) {
    const T = [0], S = [0], V = [0];
    for (let i = 1; i < pts.length; i++) { const [x1, y1] = pts[i - 1], [x2, y2] = pts[i], L = Math.hypot(x2 - x1, y2 - y1), v1 = Math.sqrt(2 * g * Math.max(0, y1)), v2 = Math.sqrt(2 * g * Math.max(0, y2));
      T.push(T[i - 1] + (v1 + v2 > 0 ? 2 * L / (v1 + v2) : Infinity)); S.push(S[i - 1] + L); V.push(v2); }
    return { pts, T, S, V, total: T[T.length - 1], length: S[S.length - 1] };
  }
  function at(tr, t) {                                     // position and speed at time t (clamped to the finish)
    const T = tr.T; if (t >= tr.total) { const n = T.length - 1; return { x: tr.pts[n][0], y: tr.pts[n][1], v: tr.V[n], done: true }; }
    let lo = 0, hi = T.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
    const u = (t - T[lo]) / (T[hi] - T[lo]), [x1, y1] = tr.pts[lo], [x2, y2] = tr.pts[hi]; const y = y1 + (y2 - y1) * u;
    return { x: x1 + (x2 - x1) * u, y, v: Math.sqrt(2 * g * Math.max(0, y)), done: false };
  }
  const M = 4000;
  const straight = (B) => Array.from({ length: M + 1 }, (_, i) => [B[0] * i / M, B[1] * i / M]);
  // circular arc through A and B with a vertical start at A (centre on the horizontal line through A); y downward
  function arc(B) { const r = (B[0] ** 2 + B[1] ** 2) / (2 * B[0]), aB = Math.atan2(B[1], B[0] - r);
    return Array.from({ length: M + 1 }, (_, i) => { const a = Math.PI - (Math.PI - aB) * i / M; return [r + r * Math.cos(a), r * Math.sin(a)]; }); }
  // cycloid through A and B: x = R(θ − sin θ), y = R(1 − cos θ); θ_B from (θ − sin θ)/(1 − cos θ) = xB / yB
  function cycloidFit(B) { const k = B[0] / B[1]; let lo = 1e-6, hi = 2 * Math.PI - 1e-6; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2, q = (m - Math.sin(m)) / (1 - Math.cos(m)); if (q < k) lo = m; else hi = m; } const th = (lo + hi) / 2; return { th, R: B[1] / (1 - Math.cos(th)) }; }
  function cycloid(B) { const { th, R } = cycloidFit(B); return Array.from({ length: M + 1 }, (_, i) => { const a = th * i / M; return [R * (a - Math.sin(a)), R * (1 - Math.cos(a))]; }); }
  // a steep start: drop straight down half the depth, then straight to B
  function dropThenSlide(B) { const mid = [0, B[1] * .9], out = []; for (let i = 0; i <= M / 2; i++) out.push([0, mid[1] * i / (M / 2)]); for (let i = 1; i <= M / 2; i++) out.push([B[0] * i / (M / 2), mid[1] + (B[1] - mid[1]) * i / (M / 2)]); return out; }
  // tautochrone: a cycloid bowl; released at rest from any point, a bead reaches the bottom after π√(R/g)
  const tautoTime = (R) => Math.PI * Math.sqrt(R / g);
  function bowlFrom(R, th0) { const pts = []; for (let i = 0; i <= M; i++) { const a = th0 + (Math.PI - th0) * i / M; pts.push([R * (a - Math.sin(a)), R * (1 - Math.cos(a))]); } const y0 = pts[0][1]; return pts.map(([x, y]) => [x, y - y0]); }
  // a family of curves between the straight line (s = 0) and the cycloid (s = 1) and beyond it (s > 1, deeper):
  // y_s(x) = y_line(x) + s · (y_cycloid(x) − y_line(x)), on an x grid packed near A where the cycloid starts vertically
  function cycY(B, x) { const { th, R } = cycloidFit(B); let lo = 0, hi = th; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (R * (m - Math.sin(m)) < x) lo = m; else hi = m; } const a = (lo + hi) / 2; return R * (1 - Math.cos(a)); }
  function fan(B, s) { const out = []; for (let i = 0; i <= M; i++) { const x = B[0] * Math.pow(i / M, 3), yl = B[1] * x / B[0]; out.push([x, i === M ? B[1] : yl + s * (cycY(B, x) - yl)]); } return out; }
  // tautochrone bowl x(θ) = R(θ − sin θ) − πR, height above the bottom R(1 + cos θ); arc length from the bottom s = 4R cos(θ/2).
  // Along that arc length the motion is exactly simple harmonic, s(t) = s0 cos(t √(g / 4R)), so every release height reaches the bottom after π√(R/g).
  function bowlAt(R, s0, t) { const s = s0 * Math.cos(t * Math.sqrt(g / (4 * R))), th = 2 * Math.acos(Math.max(-1, Math.min(1, s / (4 * R)))); return { x: R * (th - Math.sin(th)) - Math.PI * R, h: R * (1 + Math.cos(th)), s }; }
  const api = { g, track, at, straight, arc, cycloid, cycloidFit, dropThenSlide, tautoTime, bowlFrom, fan, bowlAt };
  root.Brach = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
