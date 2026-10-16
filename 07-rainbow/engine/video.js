// 07 Rainbow: every angle, path and colour band comes from optics.js (Snell + Fresnel + measured water dispersion).
// The sky images are computed from the angular distribution of hundreds of thousands of traced rays, not painted.
(function (root) {
  "use strict";
  const O = root.Optics, D = root.CLDraw, FPS = 30;
  const WL = [400, 450, 500, 550, 600, 650, 700], WLS = Array.from({ length: 16 }, (_, i) => 400 + i * 20);
  const C = { bg: "#060A12", drop: "rgba(120,170,230,.10)", rim: "rgba(150,200,255,.55)", text: "#F5F3EF", dim: "#9FB0C6", amber: "#FFBD38" };
  const css = (l, a = 1) => { const [r, g, b] = O.rgb(l); return `rgba(${r},${g},${b},${a})`; };
  const B_DEMO = .86, bMin = (l, k = 1) => Math.sin(Math.acos(Math.sqrt((O.nWater(l) ** 2 - 1) / (k * (k + 2)))));
  const A1 = Object.fromEntries(WL.map((l) => [l, O.rainbowAngle(l, 1)])), A2 = Object.fromEntries(WL.map((l) => [l, O.rainbowAngle(l, 2)]));
  const STEP = .05, PROF = {};                        // angular profiles, 0..60 degrees
  let SKY = {};                                       // cached sky canvases
  function profiles() { for (const k of [1, 2]) for (const l of new Set([...WLS, ...WL])) PROF[k + ":" + l] = O.profile(l, k, 0, 60, STEP, 60000); }
  const profAt = (k, l, th) => { const p = PROF[k + ":" + l], j = Math.floor(th / STEP); return j >= 0 && j < p.length ? p[j] : 0; };

  // ---------- sky (computed) ----------
  function sky(W, H, ax, ay, ppd, horizon, which) {
    const key = [W, H, ax, ay, ppd, which].join(","); if (SKY[key]) return SKY[key];
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d"), img = x.createImageData(W, H), px = img.data;
    const cols = WLS.map((l) => O.rgb(l)), K = [0, 1, 2].reduce((a, c) => a + cols.reduce((q, col) => q + col[c], 0), 0) / 3;
    // tone map: normalise by the brightest mean spectral radiance of the primary bow, then compress softly
    let pm = 0; for (let j = 0; j < PROF["1:400"].length; j++) { let m = 0; for (const l of WLS) m += PROF["1:" + l][j]; pm = Math.max(pm, m / WLS.length); }
    const tone = (x) => 215 * Math.tanh(.8 * x / (K * pm));        // display tone map (plus a saturation boost below); the angles are untouched
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4, th = Math.hypot(xx - ax, yy - ay) / ppd;
      // overcast rain sky behind the drops
      const sk = 1 - yy / H; let r = 48 + 40 * sk, g = 58 + 44 * sk, b = 78 + 52 * sk;
      if (yy < horizon) {
        let R = 0, G = 0, Bc = 0;
        for (let j = 0; j < WLS.length; j++) { let v = profAt(1, WLS[j], th); if (which > 1) v += profAt(2, WLS[j], th); R += v * cols[j][0]; G += v * cols[j][1]; Bc += v * cols[j][2]; }
        const tr = tone(R), tg = tone(G), tb = tone(Bc), L = (tr + tg + tb) / 3, sat = 1.7; r += Math.max(0, L + sat * (tr - L)); g += Math.max(0, L + sat * (tg - L)); b += Math.max(0, L + sat * (tb - L));
      } else { const t = (yy - horizon) / (H - horizon); r = 22 - 10 * t; g = 30 - 12 * t; b = 26 - 10 * t; }
      px[i] = Math.min(255, r); px[i + 1] = Math.min(255, g); px[i + 2] = Math.min(255, b); px[i + 3] = 255;
    }
    x.putImageData(img, 0, 0); SKY[key] = cv; return cv;
  }

  // falling rain streaks over the sky (display only)
  const hsh = (j, s) => { const x = Math.sin(j * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  function rain(ctx, W, H, t, horizon) {
    ctx.save(); ctx.strokeStyle = "rgba(210,225,245,.24)"; ctx.lineWidth = 1.8; ctx.beginPath(); const n = Math.round(W * H / 9000), span = horizon + 60;
    for (let j = 0; j < n; j++) { const x = (hsh(j, 1) * W + t * 60) % W, y = (hsh(j, 2) * span + t * (700 + 300 * hsh(j, 3))) % span - 30; ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 24); }
    ctx.stroke(); ctx.restore();
  }
  function zoomed(ctx, x, y, z, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(z, z); ctx.translate(-x, -y); fn(); ctx.restore(); }

  // ---------- drop diagram ----------
  function dropDiagram(ctx, cx, cy, R, k = 1) {
    const g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R); g.addColorStop(0, "rgba(140,190,250,.16)"); g.addColorStop(1, "rgba(80,130,200,.08)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.strokeStyle = C.rim; ctx.lineWidth = 3 * k; ctx.stroke();
  }
  const P = (cx, cy, R, p) => [cx + p[0] * R, cy - p[1] * R];
  // draw a traced ray up to progress u (0..1 over its segments), incoming from the left edge, exit ray of length L
  function ray(ctx, cx, cy, R, tr, u, color, width, L, x0) {
    const pts = [[x0, P(cx, cy, R, tr.pts[0])[1]], ...tr.pts.map((p) => P(cx, cy, R, p))];
    const last = pts[pts.length - 1]; pts.push([last[0] + tr.out[0] * L, last[1] - tr.out[1] * L]);
    const segs = pts.length - 1, f = u * segs; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let s = 0; s < segs; s++) { const a = pts[s], b = pts[s + 1], w = Math.min(1, Math.max(0, f - s)); if (w <= 0) break; ctx.lineTo(a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w); }
    ctx.stroke(); return pts;
  }
  function angleArc(ctx, x, y, out, deg, color, k = 1, label = true) {           // angle between the exit ray and the antisolar direction (+x reversed)
    const r = 120 * k; ctx.save(); ctx.strokeStyle = "rgba(220,230,245,.5)"; ctx.setLineDash([8 * k, 7 * k]); ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 260 * k, y); ctx.stroke(); ctx.setLineDash([]);
    let a1 = Math.atan2(-out[1], out[0]); if (a1 < 0) a1 += 2 * Math.PI; const lo = Math.min(a1, Math.PI), hi = Math.max(a1, Math.PI), mid = (lo + hi) / 2;
    ctx.strokeStyle = color; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(x, y, r, lo, hi, false); ctx.stroke();
    if (label) D.text(ctx, deg.toFixed(1) + "°", x + Math.cos(mid) * (r + 70 * k), y + Math.sin(mid) * (r + 50 * k), 34 * k, color, 700); ctx.restore();
  }
  function histogram(ctx, x, y, w, h, counts, lo, hi, color, k = 1) {
    const n = counts.length, mx = Math.max(...counts, 1); ctx.fillStyle = color;
    counts.forEach((c, i) => { const hh = c / mx * h; ctx.fillRect(x + i * w / n, y + h - hh, Math.max(1, w / n - 1), hh); });
    ctx.strokeStyle = "rgba(160,176,198,.5)"; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x, y + h + .5); ctx.lineTo(x + w, y + h + .5); ctx.stroke();
    for (let a = lo; a <= hi; a += 10) { const xx = x + (a - lo) / (hi - lo) * w; D.text(ctx, a + "°", xx, y + h + 26 * k, 22 * k, C.dim, 500); }
  }
  function curves(ctx, x, y, w, h, lo, hi, k, upto, scale) {
    WL.slice(0, upto).forEach((l) => { const p = PROF["1:" + l]; ctx.strokeStyle = css(l); ctx.lineWidth = 3 * k; ctx.beginPath();
      for (let a = lo; a <= hi; a += .05) { const v = p[Math.floor(a / STEP)] || 0, xx = x + (a - lo) / (hi - lo) * w, yy = y + h - Math.min(h, v * scale * h); a === lo ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); } ctx.stroke(); });
  }


  // ---------- full video ----------
  const S = [["hook", 0, 3], ["one", 3, 14], ["split", 14, 24], ["sweep", 24, 41], ["colors", 41, 52.5], ["sky", 52.5, 68.5], ["second", 68.5, 82.5], ["close", 82.5, 90]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const SWEEP_N = 480, sweepB = (i) => (i + .5) / SWEEP_N;
  const sweepAt = (u, fill) => Math.min(SWEEP_N, Math.max(0, Math.floor(SWEEP_N * u / fill)));
  const peakScale = () => 1 / Math.max(...WL.map((l) => Math.max(...PROF["1:" + l])));
  const deg1 = (x) => x.toFixed(1) + "°";
  // the full-frame sky: antisolar point below the horizon, 22 px per degree
  const SKYF = { ax: 960, ay: 1250, ppd: 22, hz: 930 };
  function skyFull(ctx, t, which, alpha = 1) { ctx.globalAlpha = alpha; ctx.drawImage(sky(1920, 1080, SKYF.ax, SKYF.ay, SKYF.ppd, SKYF.hz, which), 0, 0); ctx.globalAlpha = 1; }
  // overlays on the computed sky: a dashed trace along a bow, and single drops glinting in their own colour
  const LAM = []; for (let l = 400; l <= 700; l += 5) LAM.push([O.rainbowAngle(l, 1), l]);
  const lambdaAt = (th) => { let best = LAM[0]; for (const e of LAM) if (Math.abs(e[0] - th) < Math.abs(best[0] - th)) best = e; return best[1]; };
  function arcTrace(ctx, ax, ay, ppd, deg, prog, hz, k = 1) {
    if (prog <= 0) return; const r = ppd * deg, a0 = Math.PI + Math.asin(Math.min(1, (ay - hz) / r)), a1 = 2 * Math.PI - Math.asin(Math.min(1, (ay - hz) / r)), a = a0 + (a1 - a0) * prog;
    ctx.save(); ctx.setLineDash([14 * k, 10 * k]); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(ax, ay, r, a0, a, false); ctx.stroke(); ctx.setLineDash([]);
    if (prog < 1) { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(ax + Math.cos(a) * r, ay + Math.sin(a) * r, 7 * k, 0, 7); ctx.fill(); } ctx.restore();
  }
  const GLINTS = 70, glintPhase = (j, t) => t * 2.2 + j * 1.7;
  function glints(ctx, ax, ay, ppd, t, amount, hz, k = 1) {
    if (amount <= 0) return;
    for (let j = 0; j < GLINTS; j++) { const th = 40.6 + 1.8 * hsh(j, 6), phi = Math.PI * (1.08 + .84 * hsh(j, 5)), x = ax + Math.cos(phi) * ppd * th, y = ay + Math.sin(phi) * ppd * th; if (y > hz - 6) continue;
      const pulse = Math.max(0, Math.sin(glintPhase(j, t))) ** 4 * amount; if (pulse < .02) continue; const l = lambdaAt(th);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 18 * k); g.addColorStop(0, css(l, pulse)); g.addColorStop(1, css(l, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18 * k, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${.9 * pulse})`; ctx.beginPath(); ctx.arc(x, y, 3 * k, 0, 7); ctx.fill(); }
  }
  // glint notes: every sixth drop, at its brightest moment, inside [a, b)
  function glintNotes(a, b, gain = .35) { const ev = []; for (let j = 0; j < GLINTS; j += 6) { const l = lambdaAt(40.6 + 1.8 * hsh(j, 6));
      for (let m = 0; m < 200; m++) { const t = (Math.PI / 2 + 2 * Math.PI * m - j * 1.7) / 2.2; if (t >= a && t < b) ev.push({ t, k: Math.round(2 + (700 - l) / 300 * 12), gain }); } }
    ev.sort((x, y) => x.t - y.t); return ev.filter((e, i) => i === 0 || e.t - ev[i - 1].t >= .45); }
  const SKY_FROM = 59.5, zSky = (t) => t < 3 ? 1 + .02 * t / 3 : 1 + .07 * D.clamp((t - SKY_FROM) / 30.5);
  function sunRays(ctx, cx, cy, R, x0) { ctx.strokeStyle = "rgba(255,210,120,.18)"; ctx.lineWidth = 2; for (let y = cy - R; y <= cy + R; y += 34) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(cx - Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)), y); ctx.stroke(); } }
  function sweepRays(ctx, cx, cy, R, n, L, x0) {
    const bins = new Array(46).fill(0);
    for (let i = 0; i < n; i++) { const tr = O.trace(sweepB(i), 550, 1); if (!tr) continue; bins[Math.min(45, Math.floor(tr.angle))]++; const recent = i > n - 12;
      ray(ctx, cx, cy, R, tr, 1, recent ? "rgba(255,255,255,.9)" : "rgba(150,230,170,.07)", recent ? 3 : 1.5, L, x0); }
    return bins;
  }
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, dur = sc.t1 - sc.t0, f = D.fade(t, sc.t0, sc.t1); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const cx = 640, cy = 560, R = 340, z = 1 + .05 * u / dur;
    if (sc.id === "hook" || sc.id === "sky" && u >= 7 || sc.id === "second" || sc.id === "close") {
      const A = SKYF.ax, Y = SKYF.ay, P2 = SKYF.ppd, HZ = SKYF.hz;
      zoomed(ctx, 960, 640, zSky(t), () => {
        if (sc.id === "hook" || sc.id === "close") skyFull(ctx, t, 2);
        else if (sc.id === "sky") skyFull(ctx, t, 1);
        else { skyFull(ctx, t, 1); skyFull(ctx, t, 2, D.clamp(u / 3)); }
        if (sc.id === "sky") { arcTrace(ctx, A, Y, P2, A1[700], D.clamp((u - 8) / 4.5), HZ); glints(ctx, A, Y, P2, t, D.clamp((u - 12.5) / 1.5), HZ);
          D.text(ctx, "red " + deg1(A1[700]) + " · violet " + deg1(A1[400]), W / 2, Y - P2 * 42.4 - 36, 30, C.text, 600, "center", D.clamp((u - 12.5) / .6) * f); }
        if (sc.id === "second") { arcTrace(ctx, A, Y, P2, A2[550], D.clamp((u - 3.5) / 4.5), HZ); glints(ctx, A, Y, P2, t, .5, HZ);
          D.text(ctx, "Alexander's dark band", W / 2, Y - P2 * 46.5, 30, C.text, 600, "center", D.clamp((u - 8) / 1) * f); }
        if (sc.id === "close") glints(ctx, A, Y, P2, t, 1, HZ);
      });
      rain(ctx, W, H, t, HZ); D.topShade(ctx, W, 240);
      if (sc.id === "hook") { D.text(ctx, "A rainbow is not a thing. It's an angle.", W / 2, 90, 64, C.text, 700); D.text(ctx, "Later in this video · computed from traced rays", W / 2, 150, 32, C.amber, 600); }
      if (sc.id === "sky") D.lines(ctx, ["Together they draw a circle", "around the point opposite the Sun."], W / 2, 80, 54, C.text, D.clamp((u - 7) / .6) * f);
      if (sc.id === "second") D.lines(ctx, ["A second rainbow: two reflections.", "About " + Math.round(A2[550]) + "°, colours reversed."], W / 2, 80, 54, C.text, D.clamp((u - 3) / .6) * f);
      if (sc.id === "close") { D.text(ctx, "Each drop sends you one colour. Millions of drops make the bow.", W / 2, 84, 50, C.text, 700, "center", f);
        D.text(ctx, "Water dispersion: Daimon & Masumura (2007) · Snell + Fresnel · computed, not painted", W / 2, 1050, 26, C.dim, 500, "center", f); }
      return;
    }
    if (sc.id === "sky") {                                       // side view: Sun behind the observer
      const ox = 300, oy = 860, as = Math.atan2(300, W);
      zoomed(ctx, 760, 560, z, () => {
        ctx.strokeStyle = "rgba(255,210,120,.30)"; ctx.lineWidth = 2; for (let j = 0; j < 7; j++) { ctx.beginPath(); ctx.moveTo(0, 200 + j * 90); ctx.lineTo(W, 200 + j * 90 + 300); ctx.stroke(); }
        D.text(ctx, "Sunlight", 120, 160, 34, C.amber, 700, "left");
        ctx.setLineDash([10, 8]); ctx.strokeStyle = "rgba(220,230,245,.6)"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(as) * 1500, oy + Math.sin(as) * 1500); ctx.stroke(); ctx.setLineDash([]);
        D.text(ctx, "antisolar direction", ox + Math.cos(as) * 1100, oy + Math.sin(as) * 1100 - 28, 26, C.dim, 500);
        for (const l of [700, 400]) { const a = A1[l], ang = as - a * Math.PI / 180, L = 1050, x1 = ox + Math.cos(ang) * L, y1 = oy + Math.sin(ang) * L, g = D.clamp(u / 2);
          ctx.strokeStyle = css(l); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + (x1 - ox) * g, oy + (y1 - oy) * g); ctx.stroke();
          if (g >= 1) { ctx.fillStyle = "rgba(160,200,255,.85)"; ctx.beginPath(); ctx.arc(x1, y1, 14, 0, 7); ctx.fill(); D.text(ctx, (l === 700 ? "red " : "violet ") + deg1(a), x1 + 30, y1 + (l === 700 ? -16 : 16), 30, css(l), 700, "left"); } }
        ctx.fillStyle = "#E8EDF5"; ctx.beginPath(); ctx.arc(ox, oy - 30, 16, 0, 7); ctx.fill(); ctx.fillRect(ox - 6, oy - 14, 12, 50); D.text(ctx, "you", ox, oy + 70, 30, C.text, 600);
      });
      D.lines(ctx, ["Sun behind you. Drops about 42° from the", "antisolar direction send you red."], W / 2, 80, 50, C.text, D.fade(u, 0, 7.2)); return;
    }
    // drop scenes: the diagram slowly zooms; charts and captions stay put
    let caption = "", note = "", bins = null, upto = 0;
    zoomed(ctx, cx, cy, z, () => {
      dropDiagram(ctx, cx, cy, R); sunRays(ctx, cx, cy, R, 40); D.text(ctx, "Sunlight →", 60, cy - R - 40, 30, C.amber, 700, "left");
      if (sc.id === "one") {
        const tr = O.trace(B_DEMO, 550, 1), p = ray(ctx, cx, cy, R, tr, D.clamp((u - 1) / 7), "#FFFFFF", 5, 520, 40);
        [["Bends in", p[1], 2.5], ["Reflects", p[2], 4.5], ["Bends out", p[3], 6.5]].forEach(([s, q, at]) => { const a = D.clamp((u - at) / .4); if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(q[0], q[1], 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
          D.text(ctx, s, q[0] + (q[0] > cx ? 30 : -30), q[1] - 30, 34, C.text, 700, q[0] > cx ? "left" : "right", a); } });
        if (u > 8.5) angleArc(ctx, p[3][0], p[3][1], tr.out, tr.angle, "#FFFFFF");
        caption = "One raindrop. One ray of sunlight."; note = "Ray-path diagram · steps animated";
      }
      if (sc.id === "split") {
        const trs = WL.map((l) => O.trace(B_DEMO, l, 1)); trs.forEach((tr, j) => ray(ctx, cx, cy, R, tr, D.clamp((u - .5) / 4.5), css(WL[j], .95), 3.5, 620, 40));
        const show = D.clamp((u - 5.5) / 1); if (show > 0) { const r = trs[6], er = P(cx, cy, R, r.pts[r.pts.length - 1]); ctx.globalAlpha = show; angleArc(ctx, er[0], er[1], r.out, r.angle, css(700), 1, false); ctx.globalAlpha = 1; }
        caption = u < 5.5 ? "Each colour bends a little differently." : "Red leaves at a bigger angle than violet."; note = "Spectral colours illustrative · water at 20 °C";
      }
      if (sc.id === "sweep") { bins = sweepRays(ctx, cx, cy, R, sweepAt(u, dur - 2), 380, 40); }
      if (sc.id === "colors") {
        upto = Math.min(WL.length, 1 + Math.floor(u / 1.2)); WL.slice(0, upto).forEach((l) => ray(ctx, cx, cy, R, O.trace(bMin(l), l, 1), 1, css(l, .95), 3.5, 420, 40));
        caption = "Each colour has its own rainbow angle."; note = "Rays shown: each colour's minimum-deviation ray";
      }
    });
    if (sc.id === "sweep") {
      const n = sweepAt(u, dur - 2); histogram(ctx, 1180, 600, 640, 320, bins, 0, 45, "rgba(150,230,170,.85)");
      D.text(ctx, "Rays leaving at each angle (green light, 550 nm)", 1180, 560, 28, C.dim, 600, "left"); D.text(ctx, n + " rays", 1180, 990, 30, C.text, 700, "left");
      const peak = bins.indexOf(Math.max(...bins)); if (n > 200) D.text(ctx, "pile-up at " + deg1(A1[550]), 1180 + (peak + .5) / 46 * 640, 520, 30, C.amber, 700, "center", D.clamp((n - 200) / 80));
      caption = n < 300 ? "Now send in rays all across the drop." : "Rays pile up near 42°. That pile-up is the rainbow.";
    }
    if (sc.id === "colors") {
      curves(ctx, 1080, 300, 760, 520, 30, 45, 1, upto, peakScale());
      for (let a = 30; a <= 45; a += 5) D.text(ctx, a + "°", 1080 + (a - 30) / 15 * 760, 850, 24, C.dim, 500);
      D.text(ctx, "Brightness vs angle, each colour (traced rays)", 1080, 260, 28, C.dim, 600, "left");
      const a = D.clamp((u - 8.6) / .5); if (a > 0) { D.text(ctx, "violet peaks at " + deg1(A1[400]), 1080, 930, 34, css(420), 700, "left", a); D.text(ctx, "red peaks at " + deg1(A1[700]), 1480, 930, 34, css(700), 700, "left", a); }
    }
    if (sc.id === "split") { const show = D.clamp((u - 5.5) / 1), r = O.trace(B_DEMO, 700, 1), v = O.trace(B_DEMO, 400, 1);
      D.text(ctx, "red " + r.angle.toFixed(2) + "°", 1350, 700, 40, css(700), 700, "left", show); D.text(ctx, "violet " + v.angle.toFixed(2) + "°", 1350, 760, 40, css(420), 700, "left", show);
      D.text(ctx, "for this one ray (impact 0.86)", 1350, 812, 26, C.dim, 500, "left", show); }
    D.lines(ctx, [caption], W / 2, 80, 54, C.text, f); if (note) D.text(ctx, note, sc.id === "colors" ? 1460 : 1500, sc.id === "colors" ? 1000 : 1040, 26, C.dim, 500, "center", f);
  }
  function fullEvents() {
    const ev = [], s = Object.fromEntries(S.map((x) => [x.id, x]));
    ev.push({ t: .2, k: 4 }, { t: .2, k: 9 }, { t: .2, k: 13 });
    [2.5, 4.5, 6.5].forEach((a, i) => ev.push({ t: s.one.t0 + a, k: 5 + i * 3 }));
    WL.forEach((l, j) => ev.push({ t: s.split.t0 + 2.5 + j * .25, k: 15 - j * 2 }));
    const fill = s.sweep.t1 - s.sweep.t0 - 2;
    for (let i = 0; i < SWEEP_N; i += 8) { const tr = O.trace(sweepB(i), 550, 1); if (tr) ev.push({ t: s.sweep.t0 + fill * i / SWEEP_N, k: Math.round(15 * tr.angle / 42), gain: .6 }); }
    WL.forEach((l, j) => ev.push({ t: s.colors.t0 + j * 1.2 + .1, k: 15 - j * 2 }));
    ev.push({ t: s.sky.t0 + 2, k: 8 }, { t: s.sky.t0 + 7.2, k: 3 }, { t: s.sky.t0 + 7.2, k: 8 }, { t: s.sky.t0 + 7.2, k: 12 }, { t: s.second.t0 + 1.5, k: 1 }, { t: s.second.t0 + 1.5, k: 6 }, { t: s.close.t0 + .3, k: 5 });
    for (let i = 0; i < 9; i++) ev.push({ t: s.sky.t0 + 8 + i * .5, k: 2 + i, gain: .5 });           // the trace along the bow
    for (let i = 0; i < 9; i++) ev.push({ t: s.second.t0 + 3.5 + i * .5, k: 12 - i, gain: .45 });
    ev.push(...glintNotes(s.sky.t0 + 13, s.sky.t1), ...glintNotes(s.second.t0 + 9, s.second.t1, .25), ...glintNotes(s.close.t0 + 1, s.close.t1 - 1));
    return ev;
  }

  // ---------- Shorts (1080x1920) ----------
  const SKYS = { ax: 540, ay: 1640, ppd: 20, hz: 1460 };
  function skyShort(ctx, t, which, alpha = 1, wet = true) { ctx.globalAlpha = alpha; ctx.drawImage(sky(1080, 1920, SKYS.ax, SKYS.ay, SKYS.ppd, SKYS.hz, which), 0, 0); ctx.globalAlpha = 1; if (wet) { rain(ctx, 1080, 1920, t, SKYS.hz); D.topShade(ctx, 1080, 520); } }
  function shortDrop(ctx, cx, cy, R, z, fn) { zoomed(ctx, cx, cy, z, () => { dropDiagram(ctx, cx, cy, R, 1.1); sunRays(ctx, cx, cy, R, 30); fn(); }); }
  function drawS1(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920);
    if (t < 12) { const cx = 520, cy = 900, R = 300; shortDrop(ctx, cx, cy, R, 1 + .05 * t / 12, () => WL.map((l) => O.trace(B_DEMO, l, 1)).forEach((tr, j) => ray(ctx, cx, cy, R, tr, D.clamp((t - .5) / 5), css(WL[j], .95), 4, 560, 30)));
      D.lines(ctx, ["Why is red always", "on the outside?"], 540, 160, 78, C.text, 1); D.text(ctx, "Ray-path diagram · water at 20 °C", 540, 330, 30, C.dim, 600);
      if (t > 6) D.lines(ctx, ["Red leaves the drop", "at a bigger angle."], 540, 1640, 56, C.text, D.clamp((t - 6) / .5)); return; }
    const A = SKYS.ax, Y = SKYS.ay, P2 = SKYS.ppd, HZ = SKYS.hz;
    zoomed(ctx, 540, 1100, 1 + .07 * D.clamp((t - 12) / 18), () => { skyShort(ctx, t, 1, 1, false); arcTrace(ctx, A, Y, P2, A1[700], D.clamp((t - 13.5) / 4.5), HZ, 1.2); glints(ctx, A, Y, P2, t, D.clamp((t - 18) / 1.5), HZ, 1.3); });
    rain(ctx, 1080, 1920, t, HZ); D.topShade(ctx, 1080, 520); const a = D.clamp((t - 12) / .6);
    D.lines(ctx, ["Red: " + deg1(A1[700]) + " from the point", "opposite the Sun.", "Violet: " + deg1(A1[400]) + "."], 540, 160, 60, C.text, a); D.text(ctx, "Computed from traced rays", 540, 400, 30, C.dim, 600, "center", a);
  }
  const S2_FILL = 28.5;
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const cx = 520, cy = 700, R = 270, n = sweepAt(t - .5, S2_FILL); let bins;
    shortDrop(ctx, cx, cy, R, 1 + .04 * t / 31, () => { bins = sweepRays(ctx, cx, cy, R, n, 330, 30); });
    histogram(ctx, 90, 1080, 900, 320, bins, 0, 45, "rgba(150,230,170,.85)", 1.1); D.text(ctx, n + " rays · green light", 540, 1480, 40, C.text, 700);
    D.lines(ctx, n < 320 ? ["Shoot rays across", "a raindrop."] : ["They pile up at " + deg1(A1[550]) + ".", "That's the rainbow."], 540, 160, 76, C.text, 1);
  }
  function drawS3(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920);
    if (t < 12) { const cx = 520, cy = 900, R = 300; shortDrop(ctx, cx, cy, R, 1 + .05 * t / 12, () => WL.map((l) => O.trace(bMin(l, 2), l, 2)).forEach((tr, j) => ray(ctx, cx, cy, R, tr, D.clamp((t - .5) / 6), css(WL[j], .95), 4, 560, 30)));
      D.lines(ctx, ["The second rainbow:", "two reflections."], 540, 160, 76, C.text, 1); D.text(ctx, "Ray-path diagram · water at 20 °C", 540, 330, 30, C.dim, 600); return; }
    const A = SKYS.ax, Y = SKYS.ay, P2 = SKYS.ppd, HZ = SKYS.hz;
    zoomed(ctx, 540, 1100, 1 + .07 * D.clamp((t - 12) / 18), () => { skyShort(ctx, t, 1, 1, false); skyShort(ctx, t, 2, D.clamp((t - 12) / 2.5), false);
      arcTrace(ctx, A, Y, P2, A2[550], D.clamp((t - 15) / 4.5), HZ, 1.2); glints(ctx, A, Y, P2, t, D.clamp((t - 20) / 1.5) * .7, HZ, 1.3); });
    rain(ctx, 1080, 1920, t, HZ); D.topShade(ctx, 1080, 520); const a = D.clamp((t - 13) / .6);
    D.lines(ctx, ["About " + Math.round(A2[550]) + "°, colours reversed.", "The sky between is darker."], 540, 160, 62, C.text, a); D.text(ctx, "Alexander's dark band", 540, SKYS.ay - SKYS.ppd * 46.5, 34, C.text, 700, "center", D.clamp((t - 16) / 1));
  }
  const ready = (async () => { profiles(); })();
  const timelines = [
    { id: "full", name: "07 Rainbow (long)", file: "Command Loom - 07 Rainbow.mp4", W: 1920, H: 1080, dur: 90, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Why red is outside", file: "Command Loom - Short 1 - Why Red Is Outside.mp4", W: 1080, H: 1920, dur: 30, draw: drawS1, voice: "glass",
      events: () => [...WL.map((l, j) => ({ t: 2.5 + j * .3, k: 15 - j * 2 })), { t: 12.2, k: 3 }, { t: 12.2, k: 8 }, { t: 12.2, k: 12 },
        ...Array.from({ length: 9 }, (_, i) => ({ t: 13.5 + i * .5, k: 2 + i, gain: .5 })), ...glintNotes(18.5, 29)] },
    { id: "s2", name: "Short 2 · Why 42 degrees", file: "Command Loom - Short 2 - Why 42 Degrees.mp4", W: 1080, H: 1920, dur: 31, draw: drawS2, voice: "glass",
      events: () => { const ev = []; for (let i = 0; i < SWEEP_N; i += 8) { const tr = O.trace(sweepB(i), 550, 1); if (tr) ev.push({ t: .5 + S2_FILL * i / SWEEP_N, k: Math.round(15 * tr.angle / 42), gain: .6 }); } return ev; } },
    { id: "s3", name: "Short 3 · The second rainbow", file: "Command Loom - Short 3 - The Second Rainbow.mp4", W: 1080, H: 1920, dur: 30, draw: drawS3, voice: "glass",
      events: () => [...WL.map((l, j) => ({ t: 3.5 + j * .35, k: 2 + j * 2 })), { t: 12.2, k: 1 }, { t: 12.2, k: 6 }, { t: 12.2, k: 10 },
        ...Array.from({ length: 9 }, (_, i) => ({ t: 15 + i * .5, k: 12 - i, gain: .45 })), ...glintNotes(20.5, 29, .3)] }
  ];
  root.CLVideo = { title: "Command Loom · 07 Rainbow", timelines, ready };
  root.RainbowVideo = { S, A1, A2, WL, B_DEMO, SWEEP_N, sweepB, sweepAt, bMin, fullEvents, timelines, PROF, profiles };
})(typeof window !== "undefined" ? window : globalThis);
