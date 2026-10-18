// An excitable medium: the Barkley model (D. Barkley, "A model for fast computer simulation of waves in excitable media",
// Physica D 49, 61–70, 1991), a simple stand-in for chemical waves such as those of the Belousov–Zhabotinsky reaction.
//   du/dt = (1/ε) u (1 − u) (u − (v + b)/a) + ∇²u      (u: excitation, the "fast" chemical)
//   dv/dt = u − v                                       (v: recovery, the "slow" chemical; the medium is refractory while v is high)
// Barkley's semi-implicit step for the reaction, explicit diffusion (5-point Laplacian), no-flux edges. Deterministic.
(function (root) {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  class Medium {
    constructor(W, H, p = {}) { Object.assign(this, { a: .75, b: .02, eps: .02, h: .5, dt: .02 }, p); this.W = W; this.H = H;
      this.u = new Float32Array(W * H); this.v = new Float32Array(W * H); this.u2 = new Float32Array(W * H); this.t = 0; this.steps = 0; }
    step(m = 1) {
      const W = this.W, H = this.H, { a, b, eps, h, dt } = this, k = dt / (h * h), r = dt / eps;
      for (let s = 0; s < m; s++) {
        const u = this.u, v = this.v, u2 = this.u2;
        for (let y = 0; y < H; y++) { const row = y * W, up = (y > 0 ? y - 1 : 1) * W, dn = (y < H - 1 ? y + 1 : H - 2) * W;
          for (let x = 0; x < W; x++) { const i = row + x, ui = u[i], vi = v[i];
            const lap = u[row + (x > 0 ? x - 1 : 1)] + u[row + (x < W - 1 ? x + 1 : W - 2)] + u[up + x] + u[dn + x] - 4 * ui, th = (vi + b) / a;
            let f;
            if (ui < th) f = ui / (1 - r * (1 - ui) * (ui - th));
            else { const g = r * ui * (ui - th); f = (ui + g) / (1 + g); }
            let un = f + k * lap; un = un < 0 ? 0 : un > 1 ? 1 : un; u2[i] = un; v[i] = vi + dt * (ui - vi); } }
        this.u = u2; this.u2 = u; this.t += dt; this.steps++;
      }
      return this;
    }
    stimulate(cx, cy, rad) { const W = this.W; for (let y = Math.max(0, Math.ceil(cy - rad)); y <= Math.min(this.H - 1, cy + rad); y++) for (let x = Math.max(0, Math.ceil(cx - rad)); x <= Math.min(W - 1, cx + rad); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) this.u[y * W + x] = 1; }
    // put both chemicals back to rest where pred(x, y) is true: breaking a wavefront leaves free ends, which curl into spirals
    erase(pred) { const W = this.W; for (let y = 0; y < this.H; y++) for (let x = 0; x < W; x++) if (pred(x, y)) { this.u[y * W + x] = 0; this.v[y * W + x] = 0; } }
    excited(th = .5) { let c = 0; for (let i = 0; i < this.u.length; i++) if (this.u[i] > th) c++; return c / this.u.length; }
    clone() { const m = new Medium(this.W, this.H, { a: this.a, b: this.b, eps: this.eps, h: this.h, dt: this.dt }); m.u.set(this.u); m.v.set(this.v); m.t = this.t; m.steps = this.steps; return m; }
    copyFrom(o) { this.u.set(o.u); this.v.set(o.v); this.t = o.t; this.steps = o.steps; return this; }
  }
  const api = { rng, Medium };
  root.BZ = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
