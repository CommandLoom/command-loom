// A simple grain model: hard discs in 2D that cannot overlap, under gravity (or any outside force), inside walls made of line
// segments. Position-based method: each small time step moves every disc, then pushes overlapping discs (and discs inside a wall)
// apart a few times; sliding contacts lose part of their sideways motion (a simplified friction, no spinning). Collisions are
// inelastic, like sand or small beads. Deterministic: the same start gives the same result.
// Units: metres, seconds.
(function (root) {
  "use strict";
  function create(opt) {
    const { x, y, r, walls = [], g = [0, -9.81], sub = 40, iters = 3, mu = 0.4, damp = 0, force = null, fps = 30 } = opt;
    const n = r.length, R = Float64Array.from(r), X = Float64Array.from(x), Y = Float64Array.from(y), VX = new Float64Array(n), VY = new Float64Array(n), PX = new Float64Array(n), PY = new Float64Array(n);
    const W = new Float64Array(n); let rmax = 0; for (let i = 0; i < n; i++) { W[i] = 1 / (R[i] * R[i]); rmax = Math.max(rmax, R[i]); }
    const cell = 2 * rmax;
    // walls as a flat array: ax, ay, dx, dy, 1/L², and a bounding box grown by rmax
    let WL = new Float64Array(0), nw = 0;
    function setWalls(ws) { nw = ws.length; WL = new Float64Array(nw * 9);
      ws.forEach(([ax, ay, bx, by], k) => { const dx = bx - ax, dy = by - ay, o = 9 * k; WL[o] = ax; WL[o + 1] = ay; WL[o + 2] = dx; WL[o + 3] = dy; WL[o + 4] = 1 / (dx * dx + dy * dy);
        WL[o + 5] = Math.min(ax, bx) - rmax; WL[o + 6] = Math.max(ax, bx) + rmax; WL[o + 7] = Math.min(ay, by) - rmax; WL[o + 8] = Math.max(ay, by) + rmax; }); }
    setWalls(walls);
    const h = 1 / fps / sub; let t = 0, frame = 0, nA = opt.active ?? n;   // only the first nA discs exist so far (pouring adds more)
    let gx0 = 0, gy0 = 0, gw = 0, gh = 0, head = new Int32Array(1); const next = new Int32Array(n);
    function buildGrid() {
      let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
      for (let i = 0; i < nA; i++) { const px = PX[i], py = PY[i]; if (px < mnx) mnx = px; if (px > mxx) mxx = px; if (py < mny) mny = py; if (py > mxy) mxy = py; }
      gx0 = mnx - cell; gy0 = mny - cell; gw = Math.ceil((mxx - gx0) / cell) + 2; gh = Math.ceil((mxy - gy0) / cell) + 2;
      if (head.length < gw * gh) head = new Int32Array(gw * gh * 2); head.fill(-1, 0, gw * gh);
      for (let i = 0; i < nA; i++) { const c = ((PY[i] - gy0) / cell | 0) * gw + ((PX[i] - gx0) / cell | 0); next[i] = head[c]; head[c] = i; }
    }
    function pairs() {
      for (let i = 0; i < nA; i++) {
        const cx = (PX[i] - gx0) / cell | 0, cy = (PY[i] - gy0) / cell | 0, ri = R[i], wi = W[i];
        for (let yy = cy - 1; yy <= cy + 1; yy++) { if (yy < 0 || yy >= gh) continue;
          for (let xx = cx - 1; xx <= cx + 1; xx++) { if (xx < 0 || xx >= gw) continue;
            for (let j = head[yy * gw + xx]; j !== -1; j = next[j]) { if (j <= i) continue;
              const dx = PX[j] - PX[i], dy = PY[j] - PY[i], S = ri + R[j], d2 = dx * dx + dy * dy; if (d2 >= S * S || d2 === 0) continue;
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = S - d, wj = W[j], a = wi / (wi + wj), b = 1 - a;
              let px = -nx * ov, py = -ny * ov;
              // friction: remove part of the relative sideways motion during this step
              const rx = (PX[i] - X[i]) - (PX[j] - X[j]), ry = (PY[i] - Y[i]) - (PY[j] - Y[j]), tn = ry * nx - rx * ny, cap = mu * ov, f = tn > cap ? cap : tn < -cap ? -cap : tn;
              px += ny * f; py -= nx * f;
              PX[i] += px * a; PY[i] += py * a; PX[j] -= px * b; PY[j] -= py * b;
            } } }
      }
    }
    function wallPass() {
      for (let i = 0; i < nA; i++) { const ri = R[i];
        for (let o = 0; o < nw * 9; o += 9) { const px = PX[i], py = PY[i]; if (px < WL[o + 5] || px > WL[o + 6] || py < WL[o + 7] || py > WL[o + 8]) continue;
          let u = ((px - WL[o]) * WL[o + 2] + (py - WL[o + 1]) * WL[o + 3]) * WL[o + 4]; u = u < 0 ? 0 : u > 1 ? 1 : u;
          const ex = px - (WL[o] + WL[o + 2] * u), ey = py - (WL[o + 1] + WL[o + 3] * u), d2 = ex * ex + ey * ey; if (d2 >= ri * ri) continue;
          const d = Math.sqrt(d2) || 1e-12, nx = ex / d, ny = ey / d, ov = ri - d; PX[i] += nx * ov; PY[i] += ny * ov;
          const rx = PX[i] - X[i], ry = PY[i] - Y[i], tn = ry * nx - rx * ny, cap = mu * ov, f = tn > cap ? cap : tn < -cap ? -cap : tn; PX[i] += ny * f; PY[i] -= nx * f; } }
    }
    const gxv = g[0], gyv = g[1];
    function step() {
      if (nA === 0) { t += h; return; }
      const kd = 1 - damp * h;
      for (let i = 0; i < nA; i++) { let ax = gxv, ay = gyv; if (force) { const F = force(i, X[i], Y[i], VX[i], VY[i], t); ax += F[0]; ay += F[1]; }
        VX[i] = (VX[i] + ax * h) * kd; VY[i] = (VY[i] + ay * h) * kd; PX[i] = X[i] + VX[i] * h; PY[i] = Y[i] + VY[i] * h; }
      buildGrid();
      for (let k = 0; k < iters; k++) { pairs(); wallPass(); }
      for (let i = 0; i < nA; i++) { VX[i] = (PX[i] - X[i]) / h; VY[i] = (PY[i] - Y[i]) / h; X[i] = PX[i]; Y[i] = PY[i]; }
      t += h;
    }
    function snapshot() { const f = new Float32Array(2 * n).fill(NaN); for (let i = 0; i < nA; i++) { f[2 * i] = X[i]; f[2 * i + 1] = Y[i]; } return f; }
    // add the next disc at (x, y) with velocity (vx, vy); returns false when all discs are in
    function spawn(x, y, vx = 0, vy = 0) { if (nA >= n) return false; X[nA] = x; Y[nA] = y; VX[nA] = vx; VY[nA] = vy; nA++; return true; }
    // is a disc of radius rr at (x, y) clear of every disc so far?
    function clear(x, y, rr) { for (let i = 0; i < nA; i++) { const dx = X[i] - x, dy = Y[i] - y, S = R[i] + rr; if (dx * dx + dy * dy < S * S) return false; } return true; }
    function advance() { for (let s = 0; s < sub; s++) step(); frame++; return snapshot(); }
    return { n, r: R, X, Y, VX, VY, advance, snapshot, setWalls, step, spawn, clear, get active() { return nA; }, get t() { return t; }, get frame() { return frame; }, h, sub, fps };
  }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const api = { create, rng };
  root.Grains = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
