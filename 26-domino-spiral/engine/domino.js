// A row of dominoes. Each domino is a rigid block that tips over its front bottom edge:
//   θ'' = 3 g ((h/2) sin θ − (t/2) cos θ) / (h² + t²)        (θ from upright; h height, t thickness)
// It touches the next domino when h·sin θ = d − t (d = spacing, front to front). Simplified hand-over (a model choice, not a
// full collision): the next domino starts with KAPPA times the spin the falling one had at the touch, and the falling one comes
// to rest leaning on it at REST × the touching angle; the last domino falls flat. Integrated with RK4 (0.1 ms steps).
// Units: metres, seconds.
(function (root) {
  "use strict";
  const DEF = { h: 0.048, t: 0.0075, w: 0.024, d: 0.036, g: 9.81, kappa: 0.62, push: 4.0, rest: 1.35 };
  function make(opt = {}) {
    const P = { ...DEF, ...opt }, { h, t, d, g } = P, K = 3 * g / (h * h + t * t), DT = 1e-4;
    const acc = (th) => K * ((h / 2) * Math.sin(th) - (t / 2) * Math.cos(th));
    const thHit = Math.asin((d - t) / h), thRest = Math.min(Math.PI / 2, thHit * P.rest);
    const cache = new Map();
    function fall(w0) {                                       // fall from upright with spin w0; samples every 1 ms up to flat
      const key = Math.round(w0 * 1e5); if (cache.has(key)) return cache.get(key);
      let th = 0, w = w0, tt = 0, hit = null; const s = [0];
      while (th < Math.PI / 2 && tt < 10) {
        for (let k = 0; k < 10; k++) {
          const k1a = w, k1b = acc(th), k2a = w + .5 * DT * k1b, k2b = acc(th + .5 * DT * k1a), k3a = w + .5 * DT * k2b, k3b = acc(th + .5 * DT * k2a), k4a = w + DT * k3b, k4b = acc(th + DT * k3a);
          const th1 = th + DT / 6 * (k1a + 2 * k2a + 2 * k3a + k4a), w1 = w + DT / 6 * (k1b + 2 * k2b + 2 * k3b + k4b);
          if (!hit && th1 >= thHit) { const u = (thHit - th) / (th1 - th); hit = { T: tt + u * DT, w: w + u * (w1 - w) }; }
          th = th1; w = w1; tt += DT;
        }
        s.push(Math.min(th, Math.PI / 2));
      }
      const f = { hit, s, w0 }; cache.set(key, f); return f;
    }
    // a chain of n dominoes: start times and starting spins
    function chain(n) {
      const t0 = new Float64Array(n), w0 = new Float64Array(n), T = new Float64Array(n); let tt = 0, w = P.push;
      for (let i = 0; i < n; i++) { const f = fall(w); t0[i] = tt; w0[i] = w; T[i] = f.hit.T; tt += f.hit.T; w = P.kappa * f.hit.w; }
      return { n, t0, w0, T, end: t0[n - 1] + fall(w0[n - 1]).s.length * 1e-3 };
    }
    // tilt of domino i at time tt
    function angle(C, i, tt) {
      const u = tt - C.t0[i]; if (u <= 0) return 0;
      const f = fall(C.w0[i]), k = u * 1000, a = Math.floor(k), th = a >= f.s.length - 1 ? Math.PI / 2 : f.s[a] + (f.s[a + 1] - f.s[a]) * (k - a);
      return i === C.n - 1 ? th : Math.min(th, thRest);
    }
    return { P, fall, chain, angle, thHit, thRest, acc };
  }
  const api = { make, DEF };
  root.Domino = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
