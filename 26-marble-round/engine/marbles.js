// Marbles rolling down a gently tilted serpentine track (seen from above). Ideal rolling without slipping on a constant slope:
// acceleration along the track a = (5/7) g sin(slope), so distance s(t) = v0 t + a t^2 / 2. The track is covered with coloured keys;
// each key is cut exactly as long as the marble travels during that note, so rolling over the keys plays the melody in time.
// Marbles released one after another follow the same motion, delayed, so the song becomes a round.
(function (root) {
  "use strict";
  const G = 9.81;
  function track(slopeDeg, v0) { const a = (5 / 7) * G * Math.sin(slopeDeg * Math.PI / 180); return { slopeDeg, v0, a, s: (t) => v0 * t + 0.5 * a * t * t, v: (t) => v0 + a * t }; }
  // melody: [[midi, beats], ...]; returns keys with start/end distance along the track
  function keys(tr, melody, beat) { const out = []; let t = 0; for (const [m, b] of melody) { const t1 = t + b * beat; out.push({ midi: m, t0: t, t1, s0: tr.s(t), s1: tr.s(t1) }); t = t1; } return out; }
  // which key a marble released at tRel is on at time t (or -1)
  function keyAt(K, tr, t, tRel) { const u = t - tRel; if (u < 0 || u >= K[K.length - 1].t1) return -1; let lo = 0, hi = K.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (K[m].t0 <= u) lo = m; else hi = m - 1; } return lo; }
  // public-domain tunes (traditional)
  const FRERE = [[60, 1], [62, 1], [64, 1], [60, 1], [60, 1], [62, 1], [64, 1], [60, 1], [64, 1], [65, 1], [67, 2], [64, 1], [65, 1], [67, 2],
    [67, .5], [69, .5], [67, .5], [65, .5], [64, 1], [60, 1], [67, .5], [69, .5], [67, .5], [65, .5], [64, 1], [60, 1], [60, 1], [55, 1], [60, 2], [60, 1], [55, 1], [60, 2]];
  const ROW = [[60, 1.5], [60, 1.5], [60, 1], [62, .5], [64, 1.5], [64, 1], [62, .5], [64, 1], [65, .5], [67, 3],
    [72, .5], [72, .5], [72, .5], [67, .5], [67, .5], [67, .5], [64, .5], [64, .5], [64, .5], [60, .5], [60, .5], [60, .5], [67, 1], [65, .5], [64, 1], [62, .5], [60, 3]];
  const api = { track, keys, keyAt, FRERE, ROW };
  root.Marbles = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
