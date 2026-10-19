// A ball dropped onto a sharp spike, simulated in the side-view plane (centimetres, seconds, g = 981 cm/s²).
// Pieces are circles that collide with the spike's two sides and the plate (no piece-to-piece contact). Brittle materials break
// on first touching the spike into pieces with random sizes and burst speeds (seeded, so every run is identical).
// Material behaviour is a simple model: restitution (bounciness), sliding friction, number and size of pieces.
// Every collision above a small speed is recorded; the soundtrack plays one note per recorded collision.
(function (root) {
  "use strict";
  const G = 981, DT = 1 / 1200;
  const MAT = {
    glass:   { name: "Glass",   breaks: true,  n: 170, size: [.22, .7],  burst: [60, 260],  e: .45, mu: .25, voice: "glass" },
    crystal: { name: "Crystal", breaks: true,  n: 34,  size: [.6, 1.35], burst: [50, 190],  e: .5,  mu: .2,  voice: "bell" },
    wood:    { name: "Wood",    breaks: true,  n: 26,  size: [.35, .95], burst: [40, 150],  e: .3,  mu: .45, voice: "wood", halves: true },
    metal:   { name: "Metal",   breaks: false, e: .62, mu: .04, voice: "metal" },
    jelly:   { name: "Jelly",   breaks: false, sticky: true, e: .1, mu: .9, voice: "plop" },
    water:   { name: "Water",   breaks: true,  n: 320, size: [.12, .32], burst: [80, 300],  e: .08, mu: .6,  voice: "plop" }
  };
  const SPIKE = [[-3, 0], [0, 10], [3, 0]], TRAY = 26, RIM = 9, FLOOR = [[-TRAY, 0], [TRAY, 0]], R = 3;
  const SEGS = [[SPIKE[0], SPIKE[1]], [SPIKE[1], SPIKE[2]], FLOOR, [[-TRAY, 0], [-TRAY, RIM]], [[TRAY, 0], [TRAY, RIM]]];
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function closest(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], u = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy))); return [a[0] + u * dx, a[1] + u * dy]; }
  // drops: [{t, x}] release times and sideways offsets; returns frames at `fps` and the collision log
  function simulate(key, drops, dur, fps = 30, seed = 25) {
    const m = MAT[key], r = rng(seed), P = [], hits = [], frames = [];
    const balls = drops.map((d, i) => ({ id: i, t: d.t, x: d.x, y: 40, vx: 0, vy: 0, rad: R, a: 0, w: 0, alive: false, ball: true, stuck: false, depth: 0, squash: 0, sv: 0 }));
    let t = 0, nextFrame = 0;
    const spawnPieces = (b) => {
      if (m.halves) for (const s of [-1, 1]) P.push({ x: b.x + s * 1.2, y: b.y, vx: b.vx * .3 + s * 45, vy: b.vy * .2 + 30, rad: 1.9, a: 0, w: s * 4, alive: true, half: s, kind: "half" });
      for (let i = 0; i < m.n; i++) { const ang = r() * Math.PI * 2, rr = Math.sqrt(r()) * R * .9, sp = m.burst[0] + r() * (m.burst[1] - m.burst[0]), up = Math.sin(ang) * .5 + .5;
        P.push({ x: b.x + Math.cos(ang) * rr, y: b.y + Math.sin(ang) * rr, vx: b.vx * .3 + Math.cos(ang) * sp, vy: b.vy * .25 + Math.abs(Math.sin(ang)) * sp * (.4 + up * .6),
          rad: m.size[0] + r() * (m.size[1] - m.size[0]), a: r() * 6.28, w: (r() - .5) * 40, alive: true, kind: "piece", seed: r() }); } };
    const collide = (p) => {
      for (const [a, b] of SEGS) { const c = closest(p.x, p.y, a, b), dx = p.x - c[0], dy = p.y - c[1], d = Math.hypot(dx, dy);
        if (d >= p.rad || d === 0) continue; const nx = dx / d, ny = dy / d, vn = p.vx * nx + p.vy * ny; p.x = c[0] + nx * p.rad; p.y = c[1] + ny * p.rad;
        if (vn < 0) { const tx = -ny, ty = nx, vt = p.vx * tx + p.vy * ty, vnNew = -vn * m.e, vtNew = vt * (1 - m.mu * Math.min(1, -vn / 50));
          p.vx = nx * vnNew + tx * vtNew; p.vy = ny * vnNew + ty * vtNew; p.w = p.w * .8 + vtNew / p.rad * .3;
          if (-vn > 25) hits.push({ t, x: c[0], y: c[1], v: -vn, ball: !!p.ball, size: p.rad }); return true; } }
      return false; };
    while (t <= dur + 1e-9) {
      for (const b of balls) if (!b.alive && !b.done && t >= b.t) b.alive = true;
      for (const b of balls) { if (!b.alive) continue;
        if (b.stuck) { b.depth += (b.target - b.depth) * DT * 2.5; b.sv += (-60 * b.squash - 3 * b.sv) * DT; b.squash += b.sv * DT; b.y = 10 + R - b.depth; continue; }
        b.vy -= G * DT; b.x += b.vx * DT; b.y += b.vy * DT; b.a += b.w * DT;
        const touchSpike = Math.hypot(b.x - closest(b.x, b.y, SPIKE[0], SPIKE[1])[0], b.y - closest(b.x, b.y, SPIKE[0], SPIKE[1])[1]) < R || Math.hypot(b.x - closest(b.x, b.y, SPIKE[1], SPIKE[2])[0], b.y - closest(b.x, b.y, SPIKE[1], SPIKE[2])[1]) < R;
        if (touchSpike && m.breaks) { hits.push({ t, x: b.x, y: b.y - R, v: -b.vy, ball: true, size: R, brk: true }); b.alive = false; b.done = true; spawnPieces(b); continue; }
        if (touchSpike && m.sticky) { hits.push({ t, x: b.x, y: b.y - R, v: -b.vy, ball: true, size: R, brk: true }); b.stuck = true; b.target = R * .75; b.depth = 0; b.sv = -b.vy * .0035; b.squash = 0; b.x = b.x * .3; continue; }
        if (collide(b)) b.w = b.vx / R; if (b.y < -60) { b.alive = false; b.done = true; } }
      for (const p of P) { if (!p.alive) continue; p.vy -= G * DT; p.x += p.vx * DT; p.y += p.vy * DT; p.a += p.w * DT; collide(p); if (p.y < -60) p.alive = false; }
      if (t >= nextFrame - 1e-9) {
        frames.push({ t, balls: balls.map((b) => ({ x: b.x, y: b.y, a: b.a, on: b.alive, sq: b.squash || 0, stuck: b.stuck })), pieces: P.map((p) => [p.x, p.y, p.a, p.alive ? 1 : 0]) });
        nextFrame += 1 / fps; }
      t += DT;
    }
    return { key, m, frames, hits, pieces: P.map((p) => ({ rad: p.rad, kind: p.kind, half: p.half, seed: p.seed })), dur, fps };
  }
  const api = { MAT, SPIKE, R, TRAY, RIM, simulate };
  root.Materials = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
