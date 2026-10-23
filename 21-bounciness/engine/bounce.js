// A ball inside a ring under gravity, with a bounciness (coefficient of restitution) e: at each bounce the speed towards the wall
// is reversed and multiplied by e; the speed along the wall is kept (no friction). Between bounces the ball flies on an exact
// parabola, and each bounce is found by bisection to machine precision. When a bounce would leave less than STICK m/s of
// speed towards the centre, the ball stays on the wall and slides along it (a frictionless pendulum, integrated with RK4)
// until the wall can no longer hold it (normal force < 0), then flies again.
// Units: metres, seconds, m/s². Ring radius R, ball radius r: the ball's centre moves inside Rc = R - r.
(function (root) {
  "use strict";
  const STICK = 0.05, SLIDE_DT = 1 / 2400;
  function run(e, opt) {
    const { R = 1, r = 0.04, g = 9.81, x0, y0, vx0, vy0, tEnd, vMax = 1e9 } = opt, Rc = R - r;
    const segs = [], hits = [];
    let t = 0, x = x0, y = y0, vx = vx0, vy = vy0;
    const flyTo = () => {                                        // flight from (x,y,vx,vy) at time t; returns time to the wall
      const at = (s) => [x + vx * s, y + vy * s - 0.5 * g * s * s], out = (s) => { const p = at(s); return Math.hypot(p[0], p[1]) - Rc; };
      const dt0 = 0.002; let a = 0, b = dt0;
      while (out(b) < 0) { a = b; b += dt0; if (b > 60) return null; }
      for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (out(m) < 0) a = m; else b = m; }
      return a;
    };
    while (t < tEnd) {
      segs.push({ type: "fly", t, x, y, vx, vy });
      const s = flyTo(); if (s == null) break;
      const px = x + vx * s, py = y + vy * s - 0.5 * g * s * s, l = Math.hypot(px, py), nx = px / l, ny = py / l;
      let ux = vx, uy = vy - g * s; const vn = ux * nx + uy * ny, tx = -ny, ty = nx, vt = ux * tx + uy * ty;
      t += s; x = nx * Rc; y = ny * Rc;
      hits.push({ t, x, y, speed: vn, angle: Math.atan2(y, x) });
      if (e * vn >= STICK) {                                    // bounce
        ux -= (1 + e) * vn * nx; uy -= (1 + e) * vn * ny; vx = ux; vy = uy;
        if (Math.hypot(vx, vy) > vMax || t >= tEnd) { segs.push({ type: "fly", t, x, y, vx, vy }); break; }
        continue;
      }
      // slide along the wall: phi'' = -g cos(phi) / Rc ; detach when N = Rc*w^2 - g*sin(phi) < 0
      let phi = Math.atan2(y, x), w = vt / Rc; const seg = { type: "slide", t, dt: SLIDE_DT, phi: [phi] }; segs.push(seg);
      const f = (p) => -g * Math.cos(p) / Rc;
      let detached = false;
      while (t < tEnd) {
        const k1p = w, k1w = f(phi), k2p = w + .5 * SLIDE_DT * k1w, k2w = f(phi + .5 * SLIDE_DT * k1p), k3p = w + .5 * SLIDE_DT * k2w, k3w = f(phi + .5 * SLIDE_DT * k2p),
          k4p = w + SLIDE_DT * k3w, k4w = f(phi + SLIDE_DT * k3p);
        phi += SLIDE_DT / 6 * (k1p + 2 * k2p + 2 * k3p + k4p); w += SLIDE_DT / 6 * (k1w + 2 * k2w + 2 * k3w + k4w); t += SLIDE_DT; seg.phi.push(phi);
        if (Rc * w * w - g * Math.sin(phi) < 0) { detached = true; break; }
      }
      seg.w = w;
      if (!detached) break;
      x = Rc * Math.cos(phi); y = Rc * Math.sin(phi); vx = -Math.sin(phi) * w * Rc; vy = Math.cos(phi) * w * Rc;
      // step just off the wall so the next flight starts inside
      x *= 1 - 1e-9; y *= 1 - 1e-9;
    }
    return { e, g, Rc, segs, hits, tEnd };
  }
  function segAt(S, t) { const a = S.segs; let lo = 0, hi = a.length - 1; if (t >= a[hi].t) return hi; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m].t <= t) lo = m; else hi = m; } return lo; }
  function pos(S, t) {
    const sg = S.segs[segAt(S, t)], s = t - sg.t;
    if (sg.type === "fly") return [sg.x + sg.vx * s, sg.y + sg.vy * s - 0.5 * S.g * s * s];
    const i = Math.min(sg.phi.length - 1, Math.floor(s / sg.dt)), fr = Math.min(1, s / sg.dt - i), p = sg.phi[i] + (sg.phi[Math.min(sg.phi.length - 1, i + 1)] - sg.phi[i]) * fr;
    return [S.Rc * Math.cos(p), S.Rc * Math.sin(p)];
  }
  function vel(S, t) {
    const sg = S.segs[segAt(S, t)], s = t - sg.t;
    if (sg.type === "fly") return [sg.vx, sg.vy - S.g * s];
    const i = Math.min(sg.phi.length - 2, Math.floor(s / sg.dt)), w = (sg.phi[i + 1] - sg.phi[i]) / sg.dt, p = sg.phi[i];
    return [-Math.sin(p) * w * S.Rc, Math.cos(p) * w * S.Rc];
  }
  const energy = (S, t) => { const p = pos(S, t), v = vel(S, t); return 0.5 * (v[0] * v[0] + v[1] * v[1]) + S.g * p[1]; };
  const hitsBefore = (S, t) => { let lo = 0, hi = S.hits.length; while (lo < hi) { const m = (lo + hi) >> 1; if (S.hits[m].t <= t) lo = m + 1; else hi = m; } return lo; };
  const api = { run, pos, vel, energy, segAt, hitsBefore, STICK };
  root.Bounce = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
