// The hourglass and how it is filled. Shape: two mirrored bulbs joined by a neck NECK metres wide; each bulb 17 cm tall.
// Fill: N balls of the same total area (55% of the top bulb), so more balls means smaller balls; sizes vary ±10% (a fixed seed).
// The balls are first placed on rows in the top bulb, settle for 1.5 s on a closed gate across the neck, then the gate opens (t = 0).
(function (root) {
  "use strict";
  const NECK = 0.016, FILL = 0.55, SETTLE = 1.5;
  const PROFILE = [[NECK / 2, 0], [0.03, 0.012], [0.06, 0.045], [0.068, 0.1], [0.055, 0.15], [0.03, 0.165], [0, 0.17]];   // right half of the top bulb
  function halfWidth(y) { const a = Math.abs(y); for (let i = 0; i < PROFILE.length - 1; i++) { const [x0, y0] = PROFILE[i], [x1, y1] = PROFILE[i + 1]; if (a >= y0 && a <= y1) return x0 + (a - y0) / (y1 - y0) * (x1 - x0); } return 0; }
  function walls() { const s = []; for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let i = 0; i < PROFILE.length - 1; i++) s.push([sx * PROFILE[i][0], sy * PROFILE[i][1], sx * PROFILE[i + 1][0], sy * PROFILE[i + 1][1]]); return s; }
  const GATE = [-NECK, 0.0003, NECK, 0.0003];
  function bulbArea() { let A = 0; for (let i = 0; i < PROFILE.length - 1; i++) { const [x0, y0] = PROFILE[i], [x1, y1] = PROFILE[i + 1]; A += (x0 + x1) * (y1 - y0); } return A; }   // both halves
  function fill(N, rng) {
    let r0 = Math.sqrt(FILL * bulbArea() / (N * Math.PI));
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = [], y = [], r = [], rs = Array.from({ length: N }, () => r0 * (0.9 + 0.2 * rng()));
      if (N === 1) return { x: [0], y: [0.17 - r0 * 1.05 - 0.004], r: [Math.min(r0, 0.06)], r0 };
      if (N <= 100) {                                           // few balls: random placement without overlap (lowest spots first)
        const cand = []; for (let k = 0; k < 40000; k++) cand.push([(rng() * 2 - 1) * 0.07, 0.004 + rng() * 0.166]); cand.sort((p, q) => p[1] - q[1]);
        for (const [xx, yy] of cand) { if (x.length === N) break; const ri = rs[x.length];
          if (!(Math.abs(xx) < halfWidth(yy) - ri * 1.02 && Math.abs(xx) < halfWidth(yy + ri) - ri * 1.02 && Math.abs(xx) < halfWidth(yy - ri) - ri * 1.02 && yy - ri > 0.002 && yy + ri < 0.168)) continue;
          let free = true; for (let j = 0; j < x.length; j++) if (Math.hypot(xx - x[j], yy - y[j]) < (ri + r[j]) * 1.02) { free = false; break; } if (free) { x.push(xx); y.push(yy); r.push(ri); } }
        if (x.length === N) return { x, y, r, r0 };
      }
      for (const sp of [1.1, 1.05, 1.02]) for (const ph of [0, .25, .5, .75]) { x.length = 0; y.length = 0; r.length = 0; const step = 2.05 * r0 * sp;
        for (let yy = 0.004 + r0 * 1.1; yy < 0.17 && x.length < N; yy += step * 0.87) {
          const off = ((Math.round(yy / step) % 2) * .5 + ph) * step;
          for (let xx = -0.07 + off; xx < 0.07 && x.length < N; xx += step) { const ri = rs[x.length]; if (Math.abs(xx) < halfWidth(yy) - ri * 1.02 && Math.abs(xx) < halfWidth(yy + ri) - ri * 1.02 && Math.abs(xx) < halfWidth(yy - ri) - ri * 1.02 && yy + ri < 0.168) { x.push(xx); y.push(yy); r.push(ri); } }
        }
        if (x.length === N) return { x, y, r, r0 }; }
      if (x.length === N) return { x, y, r, r0 };
      r0 *= 0.97;
    }
    throw Error("could not place " + N);
  }
  const api = { NECK, FILL, SETTLE, PROFILE, halfWidth, walls, GATE, bulbArea, fill };
  root.Hourglass = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
