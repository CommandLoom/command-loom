// Metronome physics: Pantaleone (2002), Am. J. Phys. 70, 992, Eqs. 1, 5 and 6, generalized to N metronomes.
// Values measured in the paper: 104 oscillations per minute (W_PEN = 10.9 rad/s, measured at full amplitude), amplitude ~45° (TH0 = 0.39),
// escapement MU = 0.010, coupling BETA = 0.011 for two metronomes on a 58 g board. No board friction; the system's
// center of mass starts at rest (the paper's assumptions). The same seed gives the same simulation on every computer.
(function (root) {
  const W_PEN = 10.9, MU = 0.010, TH0 = 0.39, BETA2 = 0.011, G = 9.81, H = 0.02;
  const W = W_PEN / (1 - 1.5 * TH0 * TH0 / 6), DT = H / W;      // small-angle frequency (Eqs. 8-9), time step (s)
  const M_MET = 94, M_BOARD_PER = 29, M_REF = 2 * (M_MET + M_BOARD_PER), LOCK_DEG = 5;

  function rng(seed) {                         // mulberry32: reproducible random numbers
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // opts: { n, seed, spread (percent, ± tempo difference), fixed (board fixed?), phases (optional starting phases) }
  function makeSim(opts) {
    const N = opts.n, R = rng(opts.seed), A = () => new Float64Array(N);
    const S = { N, t: 0, th: A(), w: A(), k: A(), f: A(), ph: A(), lastTick: A(), per: A(), x: 0, fixed: !!opts.fixed,
      R: 0, PSI: 0, share: 0, maxDev: 180, lockedAt: -1, onTick: null };
    const F = A(), a1 = A(), a2 = A(), a3 = A(), a4 = A(), t2 = A(), w2 = A(), k2 = A(), k3 = A();
    const b = BETA2 * M_REF / (M_BOARD_PER * N + M_MET * N);
    const beta = S.fixed ? 0 : b, x0 = S.fixed ? 0 : b * G / (W_PEN * W_PEN);
    // tempo differences: evenly spread over ±spread, in shuffled order
    const sp = (opts.spread == null ? 0.3 : opts.spread) / 100, d = [];
    for (let i = 0; i < N; i++) d.push(N === 1 ? 0 : (-1 + 2 * i / (N - 1)) * sp);
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    for (let i = 0; i < N; i++) { S.f[i] = 1 + d[i]; S.k[i] = S.f[i] * S.f[i]; }
    const phases = opts.phases || Array.from({ length: N }, () => R() * 2 * Math.PI);
    for (let i = 0; i < N; i++) { S.th[i] = 2 * TH0 * Math.cos(phases[i]); S.w[i] = -2 * TH0 * S.f[i] * Math.sin(phases[i]); }
    S.phases0 = phases.slice();

    function der(th, w, out) {
      let num = 0, den = 1;
      for (let i = 0; i < N; i++) {
        F[i] = -S.k[i] * Math.sin(th[i]) - MU * (th[i] * th[i] / (TH0 * TH0) - 1) * w[i];
        const c = Math.cos(th[i]); num += c * F[i] - Math.sin(th[i]) * w[i] * w[i]; den -= beta * c * c;
      }
      const X = num / den;                      // board acceleration (second derivative of the sum of sines)
      for (let i = 0; i < N; i++) out[i] = F[i] + beta * Math.cos(th[i]) * X;
    }
    S.step = function () {
      const th = S.th, w = S.w, h = H;
      der(th, w, a1);
      for (let i = 0; i < N; i++) { t2[i] = th[i] + h / 2 * w[i]; w2[i] = w[i] + h / 2 * a1[i]; k2[i] = w2[i]; }
      der(t2, w2, a2);
      for (let i = 0; i < N; i++) { t2[i] = th[i] + h / 2 * k2[i]; w2[i] = w[i] + h / 2 * a2[i]; k3[i] = w2[i]; }
      der(t2, w2, a3);
      for (let i = 0; i < N; i++) { t2[i] = th[i] + h * k3[i]; w2[i] = w[i] + h * a3[i]; }
      der(t2, w2, a4);
      S.t += DT; let sx = 0;
      for (let i = 0; i < N; i++) {
        const nt = th[i] + h * (w[i] + 2 * k2[i] + 2 * k3[i] + w2[i]) / 6;
        w[i] += h * (a1[i] + 2 * a2[i] + 2 * a3[i] + a4[i]) / 6;
        if ((th[i] < 0) !== (nt < 0)) {          // tick: the pendulum crossed the center (instant found by linear interpolation within the step)
          const tc = S.t - DT + DT * th[i] / (th[i] - nt);
          if (S.lastTick[i] > 0) { const dt = tc - S.lastTick[i]; S.per[i] = S.per[i] ? S.per[i] * 0.6 + dt * 0.4 : dt; }
          S.lastTick[i] = tc; if (S.onTick) S.onTick(i, tc);
        }
        th[i] = nt; sx += Math.sin(nt);
      }
      S.x = -x0 * sx;                           // Eq. 5: board position (meters)
    };
    S.order = function () {                     // shared rhythm (Kuramoto) and the share of metronomes in it
      let c = 0, s = 0;
      for (let i = 0; i < N; i++) { const p = Math.atan2(-S.w[i] / S.f[i], S.th[i]); S.ph[i] = p; c += Math.cos(p); s += Math.sin(p); }
      S.R = Math.hypot(c, s) / N; S.PSI = Math.atan2(s, c);
      let n = 0, mx = 0;
      for (let i = 0; i < N; i++) { const e = Math.abs(((S.ph[i] - S.PSI + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * 180 / Math.PI; if (e <= LOCK_DEG) n++; if (e > mx) mx = e; }
      S.share = n / N; S.maxDev = mx;
      return S;
    };
    // advance(s): steps the simulation; lockedAt records the moment everyone has stayed in the shared rhythm for 3 s
    let since = null, chk = 0, target = 0, nStep = 0;
    S.advance = function (sec) {                // the target time is kept absolute: advancing in pieces gives exactly the same result as advancing at once
      target += sec;
      while ((nStep + 1) * DT <= target + 1e-9) {
        nStep++;
        S.step();
        if (++chk % 25 === 0) { S.order(); if (S.share === 1) { if (since === null) since = S.t; if (S.lockedAt < 0 && S.t - since > 3) S.lockedAt = since; } else since = null; }
      }
      return S;
    };
    S.bpm = (i) => S.per[i] ? 60 / S.per[i] : 0;
    return S;
  }
  root.MetroSim = { makeSim, DT, W, TH0, LOCK_DEG };
  if (typeof module !== "undefined") module.exports = root.MetroSim;
})(typeof window !== "undefined" ? window : globalThis);
