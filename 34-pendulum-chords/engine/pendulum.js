// Pendulum wave: 16 ideal simple pendulums whose lengths are chosen so that in GAMMA seconds pendulum n makes K + n full swings.
// Small-angle model: theta_n(t) = A cos(2 pi t / T_n), T_n = GAMMA / (K + n), length L_n = g (T_n / 2 pi)^2.
// Design after the Harvard Natural Sciences Lecture Demonstrations pendulum wave (51 to 65 oscillations in 60 s).
// Each pendulum is one note: the notes of a C major seventh chord (C, E, G, B) over four octaves, longest pendulum lowest.
(function (root) {
  "use strict";
  const N = 16, GAMMA = 60, K = 51, g = 9.80665, A = 14 * Math.PI / 180;
  const swings = (n) => K + n, T = (n) => GAMMA / swings(n), L = (n) => g * (T(n) / (2 * Math.PI)) ** 2;
  const phase = (n, t) => 2 * Math.PI * t / T(n);
  const theta = (n, t) => A * Math.cos(phase(n, t));
  const CHORD = [0, 4, 7, 11], NAMES = ["C", "E", "G", "B"];
  const midi = (n) => 36 + 12 * Math.floor(n / 4) + CHORD[n % 4];              // C2 … B5
  const noteName = (n) => NAMES[n % 4] + (2 + Math.floor(n / 4));
  function groups(t, tol = 1e-6) { const ph = []; for (let n = 0; n < N; n++) { const p = ((t / T(n)) % 1 + 1) % 1; if (!ph.some((q) => Math.min(Math.abs(q - p), 1 - Math.abs(q - p)) < tol)) ph.push(p); } return ph.length; }
  // the pendulums in each group at time t (same phase), as lists of indices
  function groupMembers(t, tol = 1e-6) { const out = []; for (let n = 0; n < N; n++) { const p = ((t / T(n)) % 1 + 1) % 1; const gr = out.find((G) => { const q = ((t / T(G[0])) % 1 + 1) % 1; return Math.min(Math.abs(q - p), 1 - Math.abs(q - p)) < tol; }); gr ? gr.push(n) : out.push([n]); } return out; }
  // right-hand turning points (theta = +A) of pendulum n inside [a, b): t = m T_n
  function peaks(n, a, b) { const out = [], Tn = T(n); for (let m = Math.ceil(a / Tn - 1e-9); m * Tn < b; m++) out.push(m * Tn); return out; }
  const api = { N, GAMMA, K, g, A, swings, T, L, phase, theta, groups, groupMembers, peaks, midi, noteName, CHORD, NAMES };
  root.Pend = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
