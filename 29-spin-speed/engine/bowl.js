// Balls in a spinning bowl, seen from above. The bowl is part of a sphere of radius RB (rim at RIM from the centre).
// Simplified forces on each ball, in the horizontal plane:
//   slope:    the bowl's slope pulls towards the centre with g·tanθ = g·ρ / √(RB² − ρ²)
//   friction: the bowl drags each ball towards its own surface velocity ω × r, at rate K (a model choice)
// A ball moving with the bowl at radius ρ needs ω²ρ towards the centre, which the slope gives only where ω² = g / √(RB² − ρ²):
// below the critical speed ω_c = √(g / RB) the balls stay at the bottom; above it they ride up to ρ* = √(RB² − (g/ω²)²).
// The balls are hard discs (grains.js); the rim is a wall. Units: metres, seconds.
(function (root) {
  "use strict";
  const DEF = { RB: 0.1, RIM: 0.082, r: 0.004, n: 120, g: 9.81, K: 4, ramp: 3 };
  const rpm2w = (rpm) => rpm * 2 * Math.PI / 60;
  const wCrit = (P = DEF) => Math.sqrt(P.g / P.RB), rpmCrit = (P = DEF) => wCrit(P) * 60 / (2 * Math.PI);
  const ringRadius = (w, P = DEF) => w * w <= P.g / P.RB ? 0 : Math.sqrt(P.RB * P.RB - Math.pow(P.g / (w * w), 2));
  function rimWalls(R, n = 64) { const w = []; for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n, b = 2 * Math.PI * (i + 1) / n; w.push([R * Math.cos(a), R * Math.sin(a), R * Math.cos(b), R * Math.sin(b)]); } return w; }
  // wOf(t): the bowl's spin (rad/s) at time t
  function run(G, wOf, secs, opt = {}) {
    const P = { ...DEF, ...opt }, rng = G.rng(40), x = [], y = [];
    while (x.length < P.n) { const a = rng() * 2 * Math.PI, rr = Math.sqrt(rng()) * (P.RIM - 2 * P.r), px = rr * Math.cos(a), py = rr * Math.sin(a);   // scattered at rest
      if (x.every((qx, i) => Math.hypot(qx - px, y[i] - py) > 2.1 * P.r)) { x.push(px); y.push(py); } }
    const S = G.create({ x, y, r: new Array(P.n).fill(P.r), walls: rimWalls(P.RIM), g: [0, 0], sub: 40, iters: 3, mu: 0.2, fps: 30,
      force: (i, px, py, vx, vy, t) => { const rho = Math.hypot(px, py), w = wOf(t), s = rho > 1e-9 ? -P.g / Math.sqrt(P.RB * P.RB - rho * rho) : 0;
        return [s * px - P.K * (vx + w * py), s * py - P.K * (vy - w * px)]; } });
    const frames = [S.snapshot()]; for (let f = 1; f <= Math.round(secs * 30); f++) frames.push(S.advance());
    return { frames, P, wOf, secs };
  }
  // mean distance of the balls from the centre in frame f
  function meanRadius(R, f) { const fr = R.frames[f]; let s = 0; for (let i = 0; i < fr.length; i += 2) s += Math.hypot(fr[i], fr[i + 1]); return s / (fr.length / 2); }
  const api = { DEF, rpm2w, wCrit, rpmCrit, ringRadius, run, meanRadius };
  root.Bowl = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
