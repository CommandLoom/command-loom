// A ball bouncing inside a fixed ring, in straight lines (no gravity). Angle in = angle out, so every flight crosses the same
// angle of the ring and the path draws a star. Game rule (not physics): after every bounce the ball is a fixed percentage faster,
// so the bounces, and the notes they play, come steadily quicker. Each bounce plays the next note of a melody.
(function (root) {
  "use strict";
  // centre of the ball touches the wall at radius Rc. step = angle around the ring between two bounces.
  function run(Rc, step, theta0, v0, gain, n) {
    const chord = 2 * Rc * Math.sin(step / 2), H = [];
    let t = 0, v = v0;
    for (let i = 0; i <= n; i++) {
      const th = theta0 + i * step; H.push({ t, x: Rc * Math.cos(th), y: Rc * Math.sin(th), v });
      t += chord / v; v *= gain;
    }
    return H;
  }
  // speed-up per bounce that makes n notes last exactly `dur` seconds from a first gap g0
  function gainFor(n, dur, g0) { let lo = 1, hi = 1.2; for (let i = 0; i < 100; i++) { const q = (lo + hi) / 2; let s = 0, g = g0; for (let k = 0; k < n; k++) { s += g; g /= q; } if (s > dur) lo = q; else hi = q; } return (lo + hi) / 2; }
  function idx(H, t) { let lo = 0, hi = H.length - 1; if (t >= H[hi].t) return hi; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (H[m].t <= t) lo = m; else hi = m; } return lo; }
  function pos(H, t) { const i = idx(H, t); if (i >= H.length - 1) return [H[i].x, H[i].y, i]; const a = H[i], b = H[i + 1], u = (t - a.t) / (b.t - a.t); return [a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, i]; }
  // public-domain melodies as MIDI note numbers (one per bounce)
  const P1 = [57, 59, 60, 62, 64, 60, 64, 63, 59, 63, 62, 58, 62, 57, 59, 60, 62, 64, 60, 64, 69, 67, 64, 60, 64, 67];
  const MELODIES = {
    king: { title: "In the Hall of the Mountain King", by: "Edvard Grieg, 1875", notes: [...P1, ...P1, ...P1.map((m) => m + 7), ...P1.map((m) => m + 7)] },
    joy: { title: "Ode to Joy", by: "Ludwig van Beethoven, 1824", notes: [
      64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62, 64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60,
      62, 62, 64, 60, 62, 64, 65, 64, 60, 62, 64, 65, 64, 62, 60, 62, 55, 64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60] },
    elise: { title: "Für Elise", by: "Ludwig van Beethoven, 1810", notes: [
      76, 75, 76, 75, 76, 71, 74, 72, 69, 60, 64, 69, 71, 64, 68, 71, 72, 64, 76, 75, 76, 75, 76, 71, 74, 72, 69, 60, 64, 69, 71, 64, 72, 71, 69] }
  };
  const api = { run, gainFor, idx, pos, MELODIES };
  root.Ring = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
