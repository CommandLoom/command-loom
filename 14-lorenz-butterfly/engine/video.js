// 14 Lorenz Butterfly: every curve and point is the Lorenz system (lorenz.js) integrated with RK4.
(function (root) {
  "use strict";
  const L = root.Lorenz, D = root.CLDraw, FPS = 30, H = .005;
  const C = { bg: "#05070C", text: "#F5F3EF", dim: "#9AA6B8", amber: [255, 189, 56], cyan: [53, 196, 240] };
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const P0 = [1, 1, 1], EPS = 1e-9, N_ORB = 8000;
  let A = null, B = null, SEP = null, START = null, SPLIT_T = null;
  const ready = (async () => {
    A = L.orbit(P0, H, N_ORB); B = L.orbit([P0[0] + EPS, P0[1], P0[2]], H, N_ORB);
    SEP = A.map((p, i) => Math.hypot(p[0] - B[i][0], p[1] - B[i][1], p[2] - B[i][2]));
    SPLIT_T = SEP.findIndex((s) => s > 1) * H;                                     // first time the two are more than 1 unit apart
    START = L.orbit(P0, H, 3000)[3000];                                            // a point already on the attractor, for the cloud
  })();
  const switches = (orb, upto) => { let n = 0; for (let i = 1; i <= upto; i++) if (Math.sign(orb[i][0]) !== Math.sign(orb[i - 1][0]) && orb[i][0] !== 0) n++; return n; };
  const phiAt = (t) => -Math.PI / 4 + .55 * Math.sin(t / 11);       // swing around the face-on view (both wings visible)
  function proj(cx, cy, s, phi) { const c = Math.cos(phi), sn = Math.sin(phi); return (p) => [cx + s * (p[0] * c - p[1] * sn), cy - s * (p[2] - 25) - s * .18 * (p[0] * sn + p[1] * c)]; }
  function trail(ctx, orb, upto, pr, col, w, keep = 2400) {
    const from = Math.max(0, upto - keep), seg = 120;
    for (let a = from; a < upto; a += seg) { const b = Math.min(upto, a + seg), age = (upto - b) / keep; ctx.strokeStyle = css(col, .15 + .8 * (1 - age)); ctx.lineWidth = w; ctx.beginPath();
      for (let i = a; i <= b; i++) { const q = pr(orb[i]); i === a ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    const q = pr(orb[upto]); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(q[0], q[1], w * 2.4, 0, 7); ctx.fill();
  }
  function runner(make) { let o = null; return (n) => { if (!o || o.steps > n) { o = make(); o.steps = 0; } while (o.steps < n) { o.step(H); o.steps++; } return o; }; }
  const cloudAt = runner(() => new L.Cloud(10000, START, .01, 3));
  function zoomWrap(inner, W, Hh, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, Hh); ctx.save(); ctx.translate(W / 2, Hh / 2); ctx.scale(z, z); ctx.translate(-W / 2, -Hh / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["eq", 4, 16], ["one", 16, 40], ["two", 40, 62], ["cloud", 62, 90], ["close", 90, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const ONE_RATE = 6000 / 23, TWO_RATE = N_ORB / 21, CLOUD_STEPS = (u) => Math.round(D.clamp(u / 27) * 5000);
  function inner(ctx, t) {
    const W = 1920, Hh = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1), pr = proj(960, 590, 17, phiAt(t));
    if (sc.id === "hook" || sc.id === "close") { trail(ctx, A, 6000, pr, C.amber, 1.6, 6000);
      if (sc.id === "hook") { D.text(ctx, "Three simple equations. It never repeats.", W / 2, 80, 60, C.text, 700); D.text(ctx, "Later in this video · Lorenz system", W / 2, 142, 30, css(C.amber), 600); return; }
      D.text(ctx, "Perfectly determined. Impossible to predict.", W / 2, 80, 58, C.text, 700, "center", f);
      D.text(ctx, "Lorenz (1963) · σ = 10, ρ = 28, β = 8/3 · fourth-order Runge–Kutta, step 0.005 · simulated", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    if (sc.id === "eq") {
      const n = Math.round(D.clamp((u - 6) / 6) * 600); if (n > 0) trail(ctx, A, n, pr, C.amber, 2);
      ["dx/dt = 10 (y − x)", "dy/dt = x (28 − z) − y", "dz/dt = x y − (8/3) z"].forEach((s, i) => D.text(ctx, s, 160, 380 + i * 110, 56, C.text, 700, "left", D.clamp((u - .5 - i * 1.2) / .5) * f));
      D.text(ctx, "No randomness anywhere.", 160, 760, 40, css(C.amber), 700, "left", D.clamp((u - 4.5) / .5) * f);
      D.text(ctx, "Edward Lorenz's weather model, 1963", W / 2, 80, 56, C.text, 700, "center", f); return; }
    if (sc.id === "one") {
      const n = Math.min(6000, Math.round(u * ONE_RATE)); trail(ctx, A, n, pr, C.amber, 2);
      D.text(ctx, switches(A, n) + " wing switches", 1780, 960, 48, css(C.amber), 700, "right"); D.text(ctx, "time " + (n * H).toFixed(1), 1780, 1020, 28, C.dim, 600, "right");
      D.text(ctx, u < 10 ? "It loops around one wing…" : "…then jumps to the other, with no pattern.", W / 2, 80, 56, C.text, 700, "center", f); return; }
    if (sc.id === "two") {
      const n = Math.min(N_ORB, Math.round(u * TWO_RATE)); trail(ctx, B, n, pr, C.cyan, 2, 1500); trail(ctx, A, n, pr, C.amber, 2, 1500);
      const s = SEP[n], x0 = 1340, y0 = 760, w = 480, h = 200, X = (i) => x0 + i / N_ORB * w, Y = (v) => y0 + h - (Math.log10(Math.max(v, 1e-10)) + 10) / 12 * h;
      ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i <= n; i += 10) { const p = [X(i), Y(SEP[i])]; i ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
      D.text(ctx, "distance apart (log scale, 10⁻¹⁰ to 10²)", x0, y0 - 24, 22, C.dim, 600, "left");
      D.text(ctx, "apart: " + (s < .001 ? s.toExponential(1) : s.toFixed(s < 1 ? 3 : 1)), 1780, 1020, 34, C.text, 700, "right");
      D.text(ctx, n * H < SPLIT_T ? "Two starts, one billionth apart." : "By time " + SPLIT_T.toFixed(1) + " they have gone separate ways.", W / 2, 80, 56, C.text, 700, "center", f); return; }
    if (sc.id === "cloud") {
      const steps = CLOUD_STEPS(u), cl = cloudAt(steps), P = cl.P; ctx.fillStyle = css(C.cyan, .55);
      for (let i = 0; i < cl.N; i++) { const q = pr([P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]); ctx.fillRect(q[0] - 1.2, q[1] - 1.2, 2.4, 2.4); }
      D.text(ctx, "spread " + cl.spread().toFixed(cl.spread() < 1 ? 3 : 1), 1780, 960, 44, css(C.cyan), 700, "right"); D.text(ctx, Math.round(cl.rightShare() * 100) + "% on the right wing", 1780, 1020, 28, C.dim, 600, "right");
      D.text(ctx, steps * H < 8 ? "Now 10,000 starts packed into a tiny box…" : "…smeared across the whole butterfly.", W / 2, 80, 56, C.text, 700, "center", f);
    }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .05 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: one note each time a trajectory jumps to the other wing (high = right wing, low = left)
  function wingNotes(orb, upto, offset, rate, hi = 11, lo = 4, gain = .55) { const ev = []; for (let i = 1; i <= upto; i++) if (Math.sign(orb[i][0]) !== Math.sign(orb[i - 1][0])) ev.push({ t: offset + i / rate, k: orb[i][0] > 0 ? hi : lo, gain }); return ev; }
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x])), cl0 = L.orbit(START, H, 5000);
    return [{ t: .3, k: 8 }, ...[0, 1, 2].map((i) => ({ t: s.eq.t0 + .5 + i * 1.2, k: 5 + i * 3, gain: .6 })), { t: s.eq.t0 + 4.5, k: 12, gain: .5 },
      ...wingNotes(A, 6000, s.one.t0, ONE_RATE), ...wingNotes(A, N_ORB, s.two.t0, TWO_RATE, 12, 5, .45), ...wingNotes(B, N_ORB, s.two.t0, TWO_RATE, 9, 2, .45),
      ...wingNotes(cl0, 5000, s.cloud.t0, 5000 / 27, 10, 3, .45), { t: s.close.t0 + .3, k: 6 }].filter((e) => e.t < 99.4);
  }

  // ---------- Shorts ----------
  const S1_RATE = N_ORB / 26;
  function s1(ctx, t) {
    const n = Math.min(N_ORB, Math.round(Math.max(0, t - 2) * S1_RATE)), pr = proj(540, 900, 19, phiAt(t));
    trail(ctx, B, n, pr, C.cyan, 2.2, 1500); trail(ctx, A, n, pr, C.amber, 2.2, 1500);
    D.lines(ctx, n * H < SPLIT_T ? ["Two starts,", "one billionth apart."] : ["Same equations.", "Different futures."], 540, 170, 74, C.text, 1);
    const s = SEP[n]; D.text(ctx, "apart: " + (s < .001 ? s.toExponential(1) : s.toFixed(s < 1 ? 3 : 1)), 540, 1480, 56, C.text, 700); D.text(ctx, "Lorenz system · simulated", 540, 1550, 30, C.dim, 600);
  }
  function s2(ctx, t) {
    const n = Math.min(6000, Math.round(Math.max(0, t - 1.5) * 6000 / 26)), pr = proj(540, 920, 19, phiAt(t)); trail(ctx, A, n, pr, C.amber, 2.2);
    D.lines(ctx, ["Three equations.", "It never repeats."], 540, 170, 76, C.text, 1);
    D.text(ctx, switches(A, n) + " wing switches", 540, 1480, 56, C.text, 700); D.text(ctx, "Lorenz system · simulated", 540, 1550, 30, C.dim, 600);
  }
  const timelines = [
    { id: "full", name: "14 Lorenz Butterfly (long)", file: "Command Loom - 14 Lorenz Butterfly.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · One billionth apart", file: "Command Loom - Short 1 - One Billionth Apart.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .06 * t / 30), voice: "glass",
      events: () => [...wingNotes(A, N_ORB, 2, S1_RATE, 12, 5, .45), ...wingNotes(B, N_ORB, 2, S1_RATE, 9, 2, .45)].filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · It never repeats", file: "Command Loom - Short 2 - It Never Repeats.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .06 * t / 30), voice: "glass",
      events: () => wingNotes(A, 6000, 1.5, 6000 / 26).filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 14 Lorenz Butterfly", timelines, ready };
  root.LorenzVideo = { S, H, EPS, get A() { return A; }, get B() { return B; }, get SEP() { return SEP; }, get SPLIT_T() { return SPLIT_T; }, get START() { return START; }, switches, timelines, ready };
})(typeof window !== "undefined" ? window : globalThis);
