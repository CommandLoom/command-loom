// Sorting algorithms that record what they do. Each run sorts one row of colour values (0..W-1, a rainbow) and returns
// {cmp, writes: [[op, index, value], ...], ops}: every comparison and every write is one operation, numbered in order, so the row
// can be shown exactly as it was after any number of operations. A swap is two writes.
(function (root) {
  "use strict";
  function rec(a0) {
    const a = a0.slice(), writes = []; let op = 0, cmp = 0;
    return { a, writes, less: (i, j) => { op++; cmp++; return a[i] < a[j]; }, lessV: (x, y) => { op++; cmp++; return x < y; },
      set: (i, v) => { op++; a[i] = v; writes.push([op, i, v]); }, swap(i, j) { const t = a[i]; this.set(i, a[j]); this.set(j, t); }, done() { return { cmp, writes, ops: op, out: a }; } };
  }
  const ALG = {
    bubble(a0) { const R = rec(a0), n = R.a.length; for (let e = n - 1; e > 0; e--) { let sw = false; for (let i = 0; i < e; i++) if (R.less(i + 1, i)) { R.swap(i, i + 1); sw = true; } if (!sw) break; } return R.done(); },
    insertion(a0) { const R = rec(a0), a = R.a; for (let i = 1; i < a.length; i++) { const v = a[i]; let j = i - 1; while (j >= 0 && R.lessV(v, a[j])) { R.set(j + 1, a[j]); j--; } R.set(j + 1, v); } return R.done(); },
    selection(a0) { const R = rec(a0), n = R.a.length; for (let i = 0; i < n - 1; i++) { let m = i; for (let j = i + 1; j < n; j++) if (R.less(j, m)) m = j; if (m !== i) R.swap(i, m); } return R.done(); },
    merge(a0) { const R = rec(a0), a = R.a;
      const ms = (lo, hi) => { if (hi - lo < 2) return; const mid = (lo + hi) >> 1; ms(lo, mid); ms(mid, hi); const L = a.slice(lo, mid), Rr = a.slice(mid, hi); let i = 0, j = 0, k = lo;
        while (i < L.length && j < Rr.length) R.set(k++, R.lessV(Rr[j], L[i]) ? Rr[j++] : L[i++]); while (i < L.length) R.set(k++, L[i++]); while (j < Rr.length) R.set(k++, Rr[j++]); };
      ms(0, a.length); return R.done(); },
    quick(a0) { const R = rec(a0), a = R.a;                 // Lomuto partition, middle element as pivot
      const qs = (lo, hi) => { if (lo >= hi) return; const m = (lo + hi) >> 1; R.swap(m, hi); let p = lo; for (let i = lo; i < hi; i++) if (R.less(i, hi)) { if (i !== p) R.swap(i, p); p++; } R.swap(p, hi); qs(lo, p - 1); qs(p + 1, hi); };
      qs(0, a.length - 1); return R.done(); },
    heap(a0) { const R = rec(a0), a = R.a, n = a.length;
      const down = (i, len) => { for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < len && R.less(m, l)) m = l; if (r < len && R.less(m, r)) m = r; if (m === i) return; R.swap(i, m); i = m; } };
      for (let i = (n >> 1) - 1; i >= 0; i--) down(i, n); for (let e = n - 1; e > 0; e--) { R.swap(0, e); down(0, e); } return R.done(); }
  };
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffled(W, seed) { const r = rng(seed), a = Array.from({ length: W }, (_, i) => i); for (let i = W - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // a grid: H rows of W values, every row its own shuffle; run(alg) sorts every row
  function grid(W, H, seed) { return Array.from({ length: H }, (_, y) => shuffled(W, seed * 1000 + y)); }
  function runGrid(rows, alg) { return rows.map((row) => ({ start: row, ...ALG[alg](row) })); }
  // the row after `op` operations (writes are in op order)
  function rowAt(run, op, out) { out.set ? out.set(run.start) : run.start.forEach((v, i) => out[i] = v); const w = run.writes; for (let i = 0; i < w.length && w[i][0] <= op; i++) out[w[i][1]] = w[i][2]; return out; }
  const api = { ALG, grid, runGrid, rowAt, shuffled, rng };
  root.Sorts = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
