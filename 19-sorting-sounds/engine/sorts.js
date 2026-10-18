// Four sorting algorithms recorded as step lists, so any moment of any run can be replayed exactly.
// Steps: ["c", i, j] compare, ["s", i, j] swap, ["w", i, v] write value v at index i (merge sort).
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffled(n, seed = 19) { const a = Array.from({ length: n }, (_, i) => i + 1), r = rng(seed); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function bubble(a0) { const a = a0.slice(), st = []; for (let end = a.length - 1; end > 0; end--) { let sw = false; for (let i = 0; i < end; i++) { st.push(["c", i, i + 1]); if (a[i] > a[i + 1]) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; st.push(["s", i, i + 1]); sw = true; } } if (!sw) break; } return st; }
  function insertion(a0) { const a = a0.slice(), st = []; for (let i = 1; i < a.length; i++) { let j = i; while (j > 0) { st.push(["c", j - 1, j]); if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; st.push(["s", j - 1, j]); j--; } else break; } } return st; }
  function merge(a0) { const a = a0.slice(), st = [];
    (function ms(lo, hi) { if (hi - lo < 1) return; const mid = (lo + hi) >> 1; ms(lo, mid); ms(mid + 1, hi); const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1); let i = 0, j = 0, k = lo;
      while (i < L.length && j < R.length) { st.push(["c", lo + i, mid + 1 + j]); if (L[i] <= R[j]) { a[k] = L[i++]; } else { a[k] = R[j++]; } st.push(["w", k, a[k]]); k++; }
      while (i < L.length) { a[k] = L[i++]; st.push(["w", k, a[k]]); k++; } while (j < R.length) { a[k] = R[j++]; st.push(["w", k, a[k]]); k++; } })(0, a.length - 1);
    return st; }
  function quick(a0) { const a = a0.slice(), st = [];
    (function qs(lo, hi) { if (lo >= hi) return; const p = a[hi]; let i = lo; for (let j = lo; j < hi; j++) { st.push(["c", j, hi]); if (a[j] < p) { if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; st.push(["s", i, j]); } i++; } }
      if (i !== hi) { [a[i], a[hi]] = [a[hi], a[i]]; st.push(["s", i, hi]); } qs(lo, i - 1); qs(i + 1, hi); })(0, a.length - 1);
    return st; }
  // array after the first k steps, plus the indices touched by step k (for highlighting)
  function replay(a0, st, k) { const a = a0.slice(); for (let s = 0; s < Math.min(k, st.length); s++) { const [t, x, y] = st[s]; if (t === "s") [a[x], a[y]] = [a[y], a[x]]; else if (t === "w") a[x] = y; } const cur = st[Math.min(k, st.length) - 1]; return { a, cur }; }
  const comparisons = (st, k = Infinity) => { let c = 0; for (let s = 0; s < Math.min(k, st.length); s++) if (st[s][0] === "c") c++; return c; };
  const ALGOS = { bubble, insertion, merge, quick };
  const api = { rng, shuffled, ALGOS, replay, comparisons };
  root.Sorts = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
