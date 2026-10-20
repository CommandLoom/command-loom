// Wa-Tor (A. K. Dewdney, "Computer Recreations", Scientific American, December 1984): fish and sharks on a toroidal ocean grid.
// Each chronon, in a seeded random order: a fish moves to a random free neighbour and, after FISH_BREED chronons, leaves a new fish behind.
// A shark moves to a random neighbouring fish and eats it (gaining energy), otherwise to a free cell; it loses 1 energy per chronon,
// dies at 0, and after SHARK_BREED chronons leaves a new shark behind (energy split). Deterministic for a given seed.
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const EMPTY = 0, FISH = 1, SHARK = 2;
  class Ocean {
    constructor(W, H, p = {}, seed = 1) {
      Object.assign(this, { W, H, fishBreed: 3, sharkBreed: 10, sharkStart: 3, eatGain: 3, fish0: .3, shark0: .05 }, p);
      const N = W * H; this.t = 0; this.r = rng(seed); this.kind = new Uint8Array(N); this.age = new Uint16Array(N); this.energy = new Int16Array(N); this.moved = new Uint8Array(N);
      for (let i = 0; i < N; i++) { const u = this.r(); if (u < this.fish0) { this.kind[i] = FISH; this.age[i] = Math.floor(this.r() * this.fishBreed); }
        else if (u < this.fish0 + this.shark0) { this.kind[i] = SHARK; this.age[i] = Math.floor(this.r() * this.sharkBreed); this.energy[i] = this.sharkStart; } }
      this.order = Uint32Array.from({ length: N }, (_, i) => i); this.history = [this.count()];
    }
    nb(i) { const W = this.W, H = this.H, x = i % W, y = (i / W) | 0; return [y * W + (x + 1) % W, y * W + (x - 1 + W) % W, ((y + 1) % H) * W + x, ((y - 1 + H) % H) * W + x]; }
    move(from, to) { this.kind[to] = this.kind[from]; this.age[to] = this.age[from]; this.energy[to] = this.energy[from]; this.kind[from] = EMPTY; this.age[from] = 0; this.energy[from] = 0; this.moved[to] = 1; }
    step(m = 1) {
      for (let s = 0; s < m; s++) {
        const N = this.W * this.H, o = this.order, r = this.r; this.moved.fill(0);
        for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)), q = o[i]; o[i] = o[j]; o[j] = q; }
        for (let k = 0; k < N; k++) {
          const i = o[k], kd = this.kind[i]; if (kd === EMPTY || this.moved[i]) continue;
          const nb = this.nb(i);
          if (kd === FISH) {
            const free = nb.filter((q) => this.kind[q] === EMPTY); this.age[i]++;
            if (free.length) { const to = free[Math.floor(r() * free.length)], breed = this.age[i] >= this.fishBreed; this.move(i, to);
              if (breed) { this.age[to] = 0; this.kind[i] = FISH; this.age[i] = 0; this.moved[i] = 1; } }
            else this.moved[i] = 1;
          } else {
            this.energy[i]--; this.age[i]++;
            if (this.energy[i] <= 0) { this.kind[i] = EMPTY; this.age[i] = 0; continue; }
            const fish = nb.filter((q) => this.kind[q] === FISH), free = fish.length ? fish : nb.filter((q) => this.kind[q] === EMPTY);
            if (free.length) { const to = free[Math.floor(r() * free.length)]; if (this.kind[to] === FISH) this.energy[i] += this.eatGain; const breed = this.age[i] >= this.sharkBreed; this.move(i, to);
              if (breed) { const e = this.energy[to]; this.age[to] = 0; this.energy[to] = Math.ceil(e / 2); this.kind[i] = SHARK; this.age[i] = 0; this.energy[i] = Math.floor(e / 2) || 1; this.moved[i] = 1; } }
            else this.moved[i] = 1;
          }
        }
        this.t++; this.history.push(this.count());
      }
      return this;
    }
    count() { let f = 0, sh = 0; for (let i = 0; i < this.kind.length; i++) { if (this.kind[i] === FISH) f++; else if (this.kind[i] === SHARK) sh++; } return [f, sh]; }
  }
  const api = { Ocean, EMPTY, FISH, SHARK, rng };
  root.WaTor = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
