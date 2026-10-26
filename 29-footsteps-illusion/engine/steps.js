// 29 Footsteps Illusion: the stimulus.  A lane is a band of black and white stripes; a block slides along it at one constant speed.
// A light block looks fast while its front and back edges sit on black (strong contrast) and slow while they sit on white
// (weak contrast); a dark block the other way round.  So two such blocks seem to take turns stepping (Anstis 2003).
// Lane: { x, y, len, thick, dir: "h" (moves right) | "v" (moves up), P (stripe period, px), off (stripe phase), v (px/s),
//         s0 (start position of the block's back edge), w, bh (block size along / across), color, light, wrap }
(function (root) {
  "use strict";
  const mod = (a, m) => ((a % m) + m) % m;
  // where the back edge of the block is (along the lane) at time t; a wrapping lane brings the block back in from the start
  function pos(L, t) { const s = L.s0 + L.v * t; return L.wrap ? mod(s + L.w, L.len + L.w) - L.w : s; }
  // is lane coordinate u on a black stripe?
  const black = (L, u) => mod(u - L.off, L.P) < L.P / 2;
  // the edges of the block sit on stripes of one colour (its length is a whole number of periods): true = black
  const edgesOnBlack = (L, t) => black(L, pos(L, t) + 1e-6);
  // strong contrast at the edges: a light block on black, a dark block on white
  const strong = (L, t) => edgesOnBlack(L, t) === L.light;
  // the moments the block "steps": its edges move onto the stripes of strong contrast (sampled once per frame, as drawn)
  function steps(L, t0, t1, fps = 30) {
    const out = []; let prev = strong(L, t0), pp = pos(L, t0);
    for (let f = Math.ceil(t0 * fps) + 1; f / fps < t1; f++) { const t = f / fps, p = pos(L, t), s = strong(L, t);
      if (s && !prev && p > pp) out.push(t); prev = s; pp = p; }
    return out;
  }
  function drawLane(ctx, L, t, fade = 0, opt = {}) {          // fade 0: black/white stripes, 1: plain grey
    const g = (a, b) => Math.round(a + (b - a) * fade), wh = `rgb(${g(250, 128)},${g(250, 128)},${g(250, 128)})`, bk = `rgb(${g(10, 128)},${g(10, 128)},${g(10, 128)})`;
    ctx.save(); const H = L.dir === "h";
    const rx = L.x, ry = L.y, rw = H ? L.len : L.thick, rh = H ? L.thick : L.len;
    ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip(); ctx.fillStyle = wh; ctx.fillRect(rx, ry, rw, rh); ctx.fillStyle = bk;
    for (let u = mod(L.off, L.P) - L.P; u < L.len; u += L.P) { if (H) ctx.fillRect(rx + u, ry, L.P / 2, rh); else ctx.fillRect(rx, ry + rh - u - L.P / 2, rw, L.P / 2); }
    if (!opt.noBlock) { const s = pos(L, t); ctx.fillStyle = L.color;
      if (H) ctx.fillRect(rx + s, ry + (L.thick - L.bh) / 2, L.w, L.bh); else ctx.fillRect(rx + (L.thick - L.bh) / 2, ry + rh - s - L.w, L.bh, L.w); }
    ctx.restore();
  }
  // screen rectangle of the block (for labels and markers)
  function blockRect(L, t) { const s = pos(L, t); return L.dir === "h" ? [L.x + s, L.y + (L.thick - L.bh) / 2, L.w, L.bh] : [L.x + (L.thick - L.bh) / 2, L.y + L.len - s - L.w, L.bh, L.w]; }
  root.Footsteps = { pos, black, edgesOnBlack, strong, steps, drawLane, blockRect, mod };
})(typeof window !== "undefined" ? window : globalThis);
