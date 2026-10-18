// The Collatz map: n even → n / 2, n odd → 3n + 1, repeated until 1. Exact integer arithmetic (all values here stay far below 2^53).
(function (root) {
  "use strict";
  const next = (n) => (n % 2 === 0 ? n / 2 : 3 * n + 1);
  function path(n) { const p = [n]; while (n !== 1) { n = next(n); p.push(n); } return p; }   // n … 1
  const steps = (n) => path(n).length - 1;
  function table(N) { const st = new Uint16Array(N + 1), peak = new Float64Array(N + 1); for (let n = 1; n <= N; n++) { const p = path(n); st[n] = p.length - 1; peak[n] = Math.max(...p); } return { st, peak }; }
  const api = { next, path, steps, table };
  root.Collatz = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
