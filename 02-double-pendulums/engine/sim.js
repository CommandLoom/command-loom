// Ideal planar double pendulums. Shinbrot et al., AJP 60, 491–499 (1992), Appendix B.
// Assumed: 1 m massless rods, 1 kg point bobs. g is conventional standard gravity.
// Angles are measured from downward vertical; instances never interact.
(function (root) {
  "use strict";
  const G = 9.80665, DT = 1 / 600, N = 1000, EPS = 1e-9;
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function initial(seed) {
    const r = rng(seed);
    return { theta1: (110 + 55 * r()) * Math.PI / 180, theta2: (-60 + 120 * r()) * Math.PI / 180,
      omega1: 0, omega2: 0 };
  }
  function parameters(o) {
    const p = { l1: o.l1 ?? 1, l2: o.l2 ?? 1, m1: o.m1 ?? 1, m2: o.m2 ?? 1, g: o.g ?? G };
    for (const v of Object.values(p)) if (!(v > 0 && Number.isFinite(v))) throw new Error("Invalid physical parameter");
    return p;
  }
  function acceleration(a, b, u, v, p, out = new Float64Array(2)) {
    const d = a - b, s = Math.sin(d), c = Math.cos(d);
    const A = (p.m1 + p.m2) * p.l1 * p.l1, C = p.m2 * p.l2 * p.l2, B = p.m2 * p.l1 * p.l2 * c;
    const f = -p.m2 * p.l1 * p.l2 * s * v * v - (p.m1 + p.m2) * p.g * p.l1 * Math.sin(a);
    const h = p.m2 * p.l1 * p.l2 * s * u * u - p.m2 * p.g * p.l2 * Math.sin(b);
    const det = A * C - B * B;
    out[0] = (C * f - B * h) / det; out[1] = (A * h - B * f) / det; return out;
  }
  function energy(a, b, u, v, p) {
    return .5 * (p.m1 + p.m2) * p.l1 * p.l1 * u * u + .5 * p.m2 * p.l2 * p.l2 * v * v +
      p.m2 * p.l1 * p.l2 * u * v * Math.cos(a - b) -
      (p.m1 + p.m2) * p.g * p.l1 * Math.cos(a) - p.m2 * p.g * p.l2 * Math.cos(b);
  }
  function endpoint(a, b, p, out = new Float64Array(2)) {
    out[0] = p.l1 * Math.sin(a) + p.l2 * Math.sin(b);
    out[1] = -p.l1 * Math.cos(a) - p.l2 * Math.cos(b); return out;
  }
  function makeSim(o = {}) {
    const n = o.n ?? N, dt = o.dt ?? DT, p = parameters(o), base = o.initial ?? initial(o.seed ?? 1);
    if (!Number.isInteger(n) || n < 1 || n > 10000 || !(dt > 0 && Number.isFinite(dt))) throw new Error("Invalid simulation size/timestep");
    for (const k of ["theta1", "theta2", "omega1", "omega2"]) if (!Number.isFinite(base[k])) throw new Error("Invalid initial state");
    const eps = o.epsilon ?? EPS;
    if (!(eps >= 0 && Number.isFinite(eps))) throw new Error("Invalid perturbation");
    const S = { n, dt, p, base: { ...base }, epsilon: eps, t: 0, steps: 0, maxEnergyDrift: 0, onCrossing: null,
      theta1: new Float64Array(n), theta2: new Float64Array(n), omega1: new Float64Array(n), omega2: new Float64Array(n) };
    const e0 = new Float64Array(n), work = new Float64Array(2), pos = new Float64Array(2);
    const eref = (p.m1 + p.m2) * p.g * p.l1 + p.m2 * p.g * p.l2;
    const span = o.span ?? null;
    for (let i = 0; i < n; i++) {
      const perturb = span === null ? (i - (n - 1) / 2) * eps : (n === 1 ? 0 : (i / (n - 1) - .5) * span);
      S.theta1[i] = base.theta1 + perturb; S.theta2[i] = base.theta2; S.omega1[i] = base.omega1; S.omega2[i] = base.omega2;
      e0[i] = energy(S.theta1[i], S.theta2[i], S.omega1[i], S.omega2[i], p);
    }
    // A downward-vertical crossing is theta = 2*pi*k, not every sin(theta)=0.
    // Root refinement on the cubic Hermite interpolant gives event timing inside an RK step.
    function crossing(i, rod, a, b, u, v, t0) {
      const turn = 2 * Math.PI, lo = Math.min(a, b), hi = Math.max(a, b);
      for (let k = Math.floor(lo / turn) + 1; k * turn <= hi; k++) {
        const target = k * turn;
        if ((a < target) === (b < target) || a === b) continue;
        let l = 0, h = 1;
        for (let j = 0; j < 24; j++) {
          const z = (l + h) / 2, z2 = z * z, z3 = z2 * z;
          const value = (2 * z3 - 3 * z2 + 1) * a + (z3 - 2 * z2 + z) * dt * u +
            (-2 * z3 + 3 * z2) * b + (z3 - z2) * dt * v;
          if ((value < target) === (a < target)) l = z; else h = z;
        }
        const when = t0 + (l + h) * .5 * dt;
        S.onCrossing({ index: i, rod, t: when, direction: b > a ? 1 : -1 });
      }
    }
    S.step = function () {
      const h = dt, h2 = h / 2, h6 = h / 6, oldTime = S.steps * h;
      for (let i = 0; i < n; i++) {
        const a = S.theta1[i], b = S.theta2[i], u = S.omega1[i], v = S.omega2[i];
        acceleration(a, b, u, v, p, work); const k1 = work[0], j1 = work[1];
        const u2 = u + h2 * k1, v2 = v + h2 * j1;
        acceleration(a + h2 * u, b + h2 * v, u2, v2, p, work); const k2 = work[0], j2 = work[1];
        const u3 = u + h2 * k2, v3 = v + h2 * j2;
        acceleration(a + h2 * u2, b + h2 * v2, u3, v3, p, work); const k3 = work[0], j3 = work[1];
        const u4 = u + h * k3, v4 = v + h * j3;
        acceleration(a + h * u3, b + h * v3, u4, v4, p, work); const k4 = work[0], j4 = work[1];
        const na = a + h6 * (u + 2 * u2 + 2 * u3 + u4), nb = b + h6 * (v + 2 * v2 + 2 * v3 + v4);
        const nu = u + h6 * (k1 + 2 * k2 + 2 * k3 + k4), nv = v + h6 * (j1 + 2 * j2 + 2 * j3 + j4);
        if (!Number.isFinite(na + nb + nu + nv)) throw new Error("Non-finite trajectory");
        S.theta1[i] = na; S.theta2[i] = nb; S.omega1[i] = nu; S.omega2[i] = nv;
        if (o.monitorEnergy) S.maxEnergyDrift = Math.max(S.maxEnergyDrift, Math.abs(energy(na, nb, nu, nv, p) - e0[i]) / eref);
        if (S.onCrossing) { crossing(i, 1, a, na, u, nu, oldTime); crossing(i, 2, b, nb, v, nv, oldTime); }
      }
      S.steps++; S.t = S.steps * dt; return S;
    };
    let targetTime = 0;
    S.advanceTo = function (time) {
      if (!(time >= S.t - 1e-8 && Number.isFinite(time))) throw new Error("Cannot reverse simulation");
      targetTime = time;
      const targetSteps = Math.floor(time / dt + 1e-7);
      while (S.steps < targetSteps) S.step(); return S;
    };
    S.advance = function (seconds) { if (!(seconds >= 0 && Number.isFinite(seconds))) throw new Error("Invalid interval");
      return S.advanceTo(targetTime + seconds); };
    S.spread = function () {
      let sx = 0, sy = 0;
      for (let i = 0; i < n; i++) { endpoint(S.theta1[i], S.theta2[i], p, pos); sx += pos[0]; sy += pos[1]; }
      sx /= n; sy /= n;
      let sq = 0;
      for (let i = 0; i < n; i++) { endpoint(S.theta1[i], S.theta2[i], p, pos); sq += (pos[0] - sx) ** 2 + (pos[1] - sy) ** 2; }
      return Math.sqrt(sq / n) / (p.l1 + p.l2);
    };
    S.snapshot = function () { return { n, dt, epsilon: eps, p: { ...p }, base: { ...base }, steps: S.steps,
      theta1: Array.from(S.theta1), theta2: Array.from(S.theta2), omega1: Array.from(S.omega1), omega2: Array.from(S.omega2),
      maxEnergyDrift: S.maxEnergyDrift }; };
    S.restore = function (snap) {
      if (snap.n !== n || snap.dt !== dt || snap.epsilon !== eps || JSON.stringify(snap.p) !== JSON.stringify(p) ||
          JSON.stringify(snap.base) !== JSON.stringify(S.base) || !Number.isInteger(snap.steps) || snap.steps < 0) throw new Error("Incompatible checkpoint");
      for (const k of ["theta1","theta2","omega1","omega2"]) {
        if (snap[k].length !== n || !snap[k].every(Number.isFinite)) throw new Error("Invalid checkpoint");
        S[k].set(snap[k]);
      }
      S.steps = snap.steps; S.t = S.steps * dt; targetTime = S.t; S.maxEnergyDrift = snap.maxEnergyDrift ?? 0; return S;
    };
    S.energy = i => energy(S.theta1[i], S.theta2[i], S.omega1[i], S.omega2[i], p);
    return S;
  }
  const api = { G, DT, N, EPS, rng, initial, parameters, acceleration, energy, endpoint, makeSim };
  root.PendulumSim = api; if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
