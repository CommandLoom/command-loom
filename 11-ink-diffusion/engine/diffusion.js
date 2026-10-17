// Brownian motion of dye molecules in still water: each molecule takes independent Gaussian steps,
// σ = √(2 D Δt) per axis, so the mean squared distance from the start grows as ⟨r²⟩ = 4 D t in two dimensions (A. Einstein, 1905).
// D for fluorescein in water near room temperature: we use 4.25 × 10⁻¹⁰ m²/s; published measurements range from about 4 to 7 × 10⁻¹⁰ m²/s depending on method.
(function (root) {
  "use strict";
  const D_FL = 4.25e-10;                                         // m²/s
  const rms = (t, D = D_FL) => Math.sqrt(4 * D * t);             // m, 2D root-mean-square distance after t seconds
  const timeFor = (r, D = D_FL) => r * r / (4 * D);              // s, time for the RMS distance to reach r
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // N walkers starting inside a small disc (the drop) of radius r0 (µm); positions in µm; dt in s
  class Walkers {
    constructor(N, dt, seed = 1, r0 = 6, D = D_FL) {
      this.N = N; this.dt = dt; this.steps = 0; this.r = rng(seed); this.sig = Math.sqrt(2 * D * dt) * 1e6; this.x = new Float32Array(N); this.y = new Float32Array(N);
      for (let i = 0; i < N; i++) { const a = this.r() * 2 * Math.PI, s = r0 * Math.sqrt(this.r()); this.x[i] = s * Math.cos(a); this.y[i] = s * Math.sin(a); }
      this.x0 = Float32Array.from(this.x); this.y0 = Float32Array.from(this.y);
    }
    gauss() { const u = 1 - this.r(), v = this.r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    step(m = 1) { for (let s = 0; s < m; s++) { for (let i = 0; i < this.N; i++) { this.x[i] += this.sig * this.gauss(); this.y[i] += this.sig * this.gauss(); } this.steps++; } return this; }
    get t() { return this.steps * this.dt; }
    msd() { let s = 0; for (let i = 0; i < this.N; i++) { const dx = this.x[i] - this.x0[i], dy = this.y[i] - this.y0[i]; s += dx * dx + dy * dy; } return s / this.N; }   // µm²
  }
  const api = { D_FL, rms, timeFor, rng, Walkers };
  root.Diff = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
