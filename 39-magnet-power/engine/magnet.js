// A magnet moves across a table of steel balls (seen from above). Simplified magnetism: each ball is pulled towards the magnet's
// centre with a force that falls with the 4th power of distance, F = P · m g · (1 cm / d)⁴, so "power" P is the pull at 1 cm in
// ball weights; closer than 2.1 cm (magnet radius + ball radius) the pull stays at its 2.1 cm value. The magnet is held just above the table, so it never
// pushes the balls; they gather in a heap under it. A resting ball starts to move only when the pull beats static friction (0.3 of its weight); a moving ball loses
// speed to rolling friction (0.05 of its weight). Balls do not magnetise each other. The balls are hard discs (grains.js). Units: metres, seconds.
(function (root) {
  "use strict";
  const DEF = { r: 0.005, rm: 0.016, g: 9.81, muS: 0.3, muR: 0.05, spacing: 0.018, half: 0.18, x0: -0.26, x1: 0.26, dur: 12 };
  function layout(P) { const pts = []; for (let y = -P.half; y <= P.half + 1e-9; y += P.spacing) for (let x = -P.half; x <= P.half + 1e-9; x += P.spacing) pts.push([x, y]); return pts; }
  const magnetAt = (P, t) => [P.x0 + (P.x1 - P.x0) * Math.min(1, Math.max(0, t / P.dur)), 0];
  function ring(cx, cy, rr, n = 28) { const w = []; for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n, b = 2 * Math.PI * (i + 1) / n; w.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a), cx + rr * Math.cos(b), cy + rr * Math.sin(b)]); } return w; }
  function run(G, power, opt = {}) {
    const P = { ...DEF, ...opt }, pts = layout(P), n = pts.length, frames = Math.round(P.dur * 30) + 1;
    let t = 0;
    const pull = (x, y, mt) => { const [mx, my] = magnetAt(P, mt), dx = mx - x, dy = my - y, d = Math.max(Math.hypot(dx, dy), P.rm + P.r), F = power * P.g * Math.pow(0.01 / d, 4); return [F * dx / d, F * dy / d, F]; };
    const S = G.create({ x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), r: new Array(n).fill(P.r), walls: [], g: [0, 0], sub: 40, iters: 3, mu: 0.2, fps: 30,
      force: (i, x, y, vx, vy, tt) => { const [fx, fy, F] = pull(x, y, tt), v = Math.hypot(vx, vy);
        if (v < 2e-3) return F > P.muS * P.g ? [fx, fy] : [-vx * 400, -vy * 400];      // at rest: stays unless the pull beats static friction
        return [fx - P.muR * P.g * vx / v, fy - P.muR * P.g * vy / v]; } });
    const out = [S.snapshot()];
    for (let f = 1; f < frames; f++) out.push(S.advance());
    return { power, P, n, frames: out, start: pts };
  }
  // balls moved more than 1 cm from where they started
  function moved(R, f) { const fr = R.frames[Math.min(R.frames.length - 1, f)]; let c = 0; for (let i = 0; i < R.n; i++) if (Math.hypot(fr[2 * i] - R.start[i][0], fr[2 * i + 1] - R.start[i][1]) > 0.01) c++; return c; }
  // the distance at which the pull equals static friction: balls closer than this start to move
  const reach = (power, P = DEF) => 0.01 * Math.pow(power / P.muS, 0.25);
  const api = { DEF, layout, magnetAt, run, moved, reach };
  root.Magnet = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
