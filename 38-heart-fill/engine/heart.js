// The heart: the classic heart curve x = 16 sin³u, y = 13 cos u − 5 cos 2u − 2 cos 3u − cos 4u, scaled to 30 cm wide, as a wall
// of 240 straight pieces, closed all round. Balls appear inside, in its upper part, and fall.
(function (root) {
  "use strict";
  const SC = 0.30 / 32, SEG = 240;
  const curve = (u) => [16 * Math.pow(Math.sin(u), 3) * SC, (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * SC];
  const outline = Array.from({ length: SEG }, (_, i) => curve(2 * Math.PI * i / SEG));          // starts at the top dip (u = 0)
  const TOP = curve(0)[1], BOTTOM = curve(Math.PI)[1];
  function area() { let A = 0; for (let i = 0; i < SEG; i++) { const [x0, y0] = outline[i], [x1, y1] = outline[(i + 1) % SEG]; A += x0 * y1 - x1 * y0; } return Math.abs(A) / 2; }
  function inside(x, y) { let c = false; for (let i = 0, j = SEG - 1; i < SEG; j = i++) { const [xi, yi] = outline[i], [xj, yj] = outline[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function wallDist(x, y) { let d = Infinity; for (let i = 0; i < SEG; i++) { const [ax, ay] = outline[i], [bx, by] = outline[(i + 1) % SEG], dx = bx - ax, dy = by - ay; let u = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy); u = Math.max(0, Math.min(1, u)); d = Math.min(d, Math.hypot(x - ax - u * dx, y - ay - u * dy)); } return d; }
  function walls() {
    const w = [];
    for (let i = 0; i < SEG; i++) { const a = outline[i], b = outline[(i + 1) % SEG]; w.push([a[0], a[1], b[0], b[1]]); }
    return w;
  }
  const api = { SC, outline, curve, area, inside, wallDist, walls, TOP, BOTTOM };
  root.Heart = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
