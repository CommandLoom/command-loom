// The Abelian sandpile (P. Bak, C. Tang, K. Wiesenfeld, Physical Review Letters 59, 381, 1987):
// a cell holding 4 or more grains topples, giving one grain to each of its 4 neighbours; grains that fall off the edge are lost.
// The final stable state does not depend on the order of topplings (that is why it is called Abelian).
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  class Pile {
    constructor(W, H = W) { this.W = W; this.H = H; this.g = new Uint32Array(W * H); this.stack = new Int32Array(W * H * 4); this.lastTopples = null; }
    // relax every unstable cell; returns the number of topplings (avalanche size); optionally records which cells toppled (a Set, or a 0/1 typed array)
    relax(record) {
      const W = this.W, H = this.H, g = this.g, st = this.stack; let sp = 0, count = 0;
      for (let i = 0; i < g.length; i++) if (g[i] >= 4) st[sp++] = i;
      while (sp > 0) { const i = st[--sp]; if (g[i] < 4) continue; const q = g[i] >> 2; g[i] -= 4 * q; count += q; if (record) { if (record.add) record.add(i); else record[i] = 1; }
        const x = i % W, y = (i / W) | 0;
        if (x > 0) { g[i - 1] += q; if (g[i - 1] >= 4) st[sp++] = i - 1; } if (x < W - 1) { g[i + 1] += q; if (g[i + 1] >= 4) st[sp++] = i + 1; }
        if (y > 0) { g[i - W] += q; if (g[i - W] >= 4) st[sp++] = i - W; } if (y < H - 1) { g[i + W] += q; if (g[i + W] >= 4) st[sp++] = i + W; }
        if (sp > st.length - 8) { const ns = new Int32Array(st.length * 2); ns.set(st); this.stack = ns; return count + this.relax(record); } }
      return count;
    }
    drop(i, record) { this.g[i]++; return this.g[i] >= 4 ? this.relax(record) : 0; }
    total() { let s = 0; for (const v of this.g) s += v; return s; }
  }
  // a random-drop run: start from random stable heights, drop grains at random cells, record each avalanche
  function randomRun(W, drops, seed = 21) { const r = rng(seed), p = new Pile(W); for (let i = 0; i < p.g.length; i++) p.g[i] = Math.floor(r() * 4);
    const init = Uint32Array.from(p.g), sites = new Int32Array(drops), sizes = new Int32Array(drops);
    for (let d = 0; d < drops; d++) { const i = Math.floor(r() * p.g.length); sites[d] = i; sizes[d] = p.drop(i); }
    return { W, init, sites, sizes };
  }
  // all grains at the centre at once (allowed because the result does not depend on order)
  function centrePile(W, n) { const p = new Pile(W); p.g[(W >> 1) * W + (W >> 1)] = n; p.relax(); return p; }
  const api = { rng, Pile, randomRun, centrePile };
  root.Sand = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
