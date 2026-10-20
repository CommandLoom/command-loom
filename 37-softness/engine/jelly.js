// A 2D soft ball: M points on a ring joined by springs (each point to its neighbour and to the points 2 and 3 along), with a gas
// pressure inside that pushes outwards in proportion to 1/area. Softness s from 0 to 1 scales the springs and the pressure down:
// springs K·10^(−3s), pressure P0·10^(−1.5s), each plus a small floor. Points hit a spike and the floor: they are pushed out, keep 10% of their speed into the
// surface and lose part of their sliding speed (friction); the spike's tip cannot poke through the skin. Semi-implicit Euler, 600 steps per frame. Units: metres, seconds.
(function (root) {
  "use strict";
  const DEF = { M: 48, R: 0.05, mass: 0.1, g: 9.81, K: 9000, floorK: 25, floorP: 40, P0: 900, damp: 0.6, e: 0.1, mu: 0.5, sub: 600, fps: 30, spike: true, inc: 0 };
  const SPIKE = [[-0.03, 0], [0, 0.08], [0.03, 0]];          // a triangle on the floor (base 6 cm, height 8 cm)
  function create(soft, opt = {}) {
    const P = { ...DEF, ...opt }, { M, R } = P, m = P.mass / M;
    const k = P.K * Math.pow(10, -3 * soft) + P.floorK, kp = P.P0 * Math.pow(10, -1.5 * soft) + P.floorP;   // each 10% softer: springs ×0.5, pressure ×0.71
    const X = new Float64Array(M), Y = new Float64Array(M), VX = new Float64Array(M), VY = new Float64Array(M), FX = new Float64Array(M), FY = new Float64Array(M);
    const x0 = opt.x0 ?? 0.004, y0 = opt.y0 ?? 0.3;
    for (let i = 0; i < M; i++) { const a = 2 * Math.PI * i / M; X[i] = x0 + R * Math.cos(a); Y[i] = y0 + R * Math.sin(a); }
    const springs = []; for (let i = 0; i < M; i++) for (const s of [1, 2, 3]) { const j = (i + s) % M; springs.push([i, j, Math.hypot(X[j] - X[i], Y[j] - Y[i]), s === 1 ? 1 : s === 2 ? .5 : .3]); }
    const area = () => { let A = 0; for (let i = 0; i < M; i++) { const j = (i + 1) % M; A += X[i] * Y[j] - X[j] * Y[i]; } return A / 2; };
    const A0 = area(), h = 1 / P.fps / P.sub; let t = 0; const hits = [];
    const edges = SPIKE.slice(0, -1).map((p, i) => [p, SPIKE[i + 1]]);
    function collide(i) {
      let hit = 0;
      // floor (y = 0) and side walls (±0.4 m)
      if (Y[i] < 0) { hit = Math.max(hit, -VY[i]); Y[i] = 0; if (VY[i] < 0) VY[i] = -P.e * VY[i]; VX[i] *= Math.max(0, 1 - P.mu * 0.05); }
      if (Math.abs(X[i]) > 0.4) { X[i] = Math.sign(X[i]) * 0.4; VX[i] = -P.e * VX[i]; }
      // spike: inside the triangle → push out through the nearest slanted side
      const [a, b, c] = SPIKE; if (P.spike && Y[i] > 0 && Y[i] < b[1]) { const half = c[0] * (1 - Y[i] / b[1]); if (Math.abs(X[i]) < half) {
        let best = null; for (const [p, q] of edges) { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), nx = dy / L * (p[0] < 0 ? -1 : 1) * (p[0] < 0 ? 1 : 1), ny = -dx / L;
          const nn = p[0] < 0 ? [-Math.abs(nx), Math.abs(ny)] : [Math.abs(nx), Math.abs(ny)], dist = (X[i] - p[0]) * nn[0] + (Y[i] - p[1]) * nn[1]; if (!best || dist > best.d) best = { d: dist, n: nn }; }
        X[i] -= best.d * best.n[0]; Y[i] -= best.d * best.n[1];
        const vn = VX[i] * best.n[0] + VY[i] * best.n[1]; if (vn < 0) { hit = Math.max(hit, -vn); VX[i] -= (1 + P.e) * vn * best.n[0]; VY[i] -= (1 + P.e) * vn * best.n[1];
          const tx = -best.n[1], ty = best.n[0], vt = VX[i] * tx + VY[i] * ty, dv = Math.min(Math.abs(vt), P.mu * (1 + P.e) * -vn) * Math.sign(vt); VX[i] -= dv * tx; VY[i] -= dv * ty; } } }
      return hit;
    }
    // the spike's tip must not cross the skin between two points: for every piece of skin the tip lies over, we keep track of
    // which side the tip is on; if it would cross to the inside, that piece is moved back so the tip stays just outside
    const side = new Int8Array(M);
    const sideOf = (i) => { const j = (i + 1) % M, [ax, ay] = SPIKE[1], ex = X[j] - X[i], ey = Y[j] - Y[i]; return ex * (ay - Y[i]) - ey * (ax - X[i]) > 0 ? 1 : -1; };
    for (let i = 0; i < M; i++) side[i] = sideOf(i);
    function tip() {
      if (!P.spike) return;
      const [ax, ay] = SPIKE[1];
      for (let i = 0; i < M; i++) { const j = (i + 1) % M, ex = X[j] - X[i], ey = Y[j] - Y[i], L2 = ex * ex + ey * ey, u = ((ax - X[i]) * ex + (ay - Y[i]) * ey) / L2, sd = sideOf(i);
        if (u > -0.05 && u < 1.05 && side[i] !== sd) {          // the tip moved across this piece of skin: push the piece back past the tip
          const L = Math.sqrt(L2), sg = side[i] < 0 ? 1 : -1, nx = -ey / L * sg, ny = ex / L * sg, d = Math.abs(ex * (ay - Y[i]) - ey * (ax - X[i])) / L + 1e-4;
          for (const [q, w] of [[i, 1 - u], [j, u]]) { X[q] += nx * d * Math.min(1, 2 * w); Y[q] += ny * d * Math.min(1, 2 * w); const vn = VX[q] * nx + VY[q] * ny; if (vn < 0) { VX[q] -= vn * nx; VY[q] -= vn * ny; } }
        }
      }
      for (let i = 0; i < M; i++) side[i] = sideOf(i);
    }
    function step() {
      FX.fill(0); FY.fill(-m * P.g);
      for (const [i, j, L0, w] of springs) { const dx = X[j] - X[i], dy = Y[j] - Y[i], L = Math.hypot(dx, dy) || 1e-9, ux = dx / L, uy = dy / L;
        const rv = (VX[j] - VX[i]) * ux + (VY[j] - VY[i]) * uy, f = k * w * (L - L0) + P.damp * w * rv; FX[i] += f * ux; FY[i] += f * uy; FX[j] -= f * ux; FY[j] -= f * uy; }
      const A = area(), pr = kp * (A0 / Math.max(A, A0 * 0.05) - 1) + P.inc * (A0 - A) / A0;   // gas pressure + jelly hardly changes its volume (same for every softness)
      for (let i = 0; i < M; i++) { const j = (i + 1) % M, ex = X[j] - X[i], ey = Y[j] - Y[i], nx = ey, ny = -ex, f = pr * 0.5; FX[i] += f * nx; FY[i] += f * ny; FX[j] += f * nx; FY[j] += f * ny; }
      let hit = 0;
      for (let i = 0; i < M; i++) { VX[i] += FX[i] / m * h; VY[i] += FY[i] / m * h; X[i] += VX[i] * h; Y[i] += VY[i] * h; hit = Math.max(hit, collide(i)); }
      tip();
      t += h; return hit;
    }
    function advance() { let hit = 0; for (let s = 0; s < P.sub; s++) hit = Math.max(hit, step()); if (hit > 0.15) hits.push([t, hit]); return snapshot(); }
    function snapshot() { const f = new Float32Array(2 * M); for (let i = 0; i < M; i++) { f[2 * i] = X[i]; f[2 * i + 1] = Y[i]; } return f; }
    return { P, M, X, Y, VX, VY, advance, snapshot, area, A0, hits, get t() { return t; }, k, kp };
  }
  function run(soft, secs, opt = {}) { const S = create(soft, opt), frames = [S.snapshot()]; for (let f = 1; f <= Math.round(secs * (opt.fps || 30)); f++) frames.push(S.advance()); return { soft, frames, hits: S.hits, A0: S.A0, sim: S }; }
  const api = { create, run, SPIKE, DEF };
  root.Jelly = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
