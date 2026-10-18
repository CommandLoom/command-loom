// 23 Three Body: the figure-eight orbit, a nudged figure-eight, and Burrau's 3-4-5 problem run twice from almost the same start.
// Every position comes from threebody.js (adaptive Dormand–Prince, no softening). Paths are sampled finely once at load, in chunks.
(function (root) {
  "use strict";
  const K = root.ThreeBody, D = root.CLDraw, FPS = 30;
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  const COL = [[255, 189, 56], [92, 200, 255], [255, 120, 170]];
  const yieldNow = () => new Promise((r) => { if (typeof MessageChannel === "undefined") return r(); const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); r(); }; ch.port2.postMessage(0); });
  // ---------- schedules ----------
  const S = [["hook", 0, 4], ["eight", 4, 28], ["nudge", 28, 44], ["pyth", 44, 90], ["close", 90, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const E8 = K.EIGHT, LAP = E8.T, EIGHT_RATE = LAP / 4;            // model time per video second: one lap every 4 s
  const NUDGE = 1.03, PY_END = 100, PY_RATE = PY_END / 45.5, DX = 1e-3;
  const S1_RATE = LAP / 4, S2_RATE = PY_END / 28;
  // ---------- paths ----------
  async function sample(m, s0, tEnd, dt) { const sys = new K.System(m, s0), n = Math.round(tEnd / dt) + 1, xy = new Float64Array(n * 6);
    for (let i = 0; i < n; i++) { if (i) sys.advance(i * dt); for (let j = 0; j < 6; j++) xy[i * 6 + j] = sys.s[j]; if (i % 400 === 0) await yieldNow(); }
    return { dt, n, xy, m, E0: new K.System(m, s0).energy(), E1: sys.energy(), minDist: sys.minDist }; }
  function at(p, t) { const f = Math.max(0, Math.min(p.n - 1.000001, t / p.dt)), i = Math.floor(f), a = f - i, o = [];
    for (let j = 0; j < 6; j++) o.push(p.xy[i * 6 + j] * (1 - a) + p.xy[(i + 1) * 6 + j] * a); return o; }
  const P = {}; let STATS = null;
  const ready = (async () => {
    P.eight = await sample(E8.m, E8.s, 24 * LAP, .005);
    const sn = E8.s.slice(); for (let i = 6; i < 12; i++) sn[i] *= NUDGE; P.nudge = await sample(E8.m, sn, 20 * LAP, .005);
    P.py = await sample(K.PYTH.m, K.PYTH.s, PY_END + 1, .002);
    const sc = K.PYTH.s.slice(); sc[0] += DX; P.copy = await sample(K.PYTH.m, sc, PY_END + 1, .002);
    // measured facts shown on screen
    const back = new K.System(E8.m, E8.s).advance(10 * LAP), backErr = Math.hypot(...Array.from(back.s).map((v, i) => v - E8.s[i]));
    const rmax = (p, upto) => { let r = 0; for (let i = 0; i * p.dt <= upto; i++) for (let b = 0; b < 3; b++) r = Math.max(r, Math.hypot(p.xy[i * 6 + 2 * b], p.xy[i * 6 + 2 * b + 1])); return r; };
    let split = null, eject = null; for (let i = 0; i < P.py.n; i++) { const t = i * P.py.dt;
      if (split === null) { let d = 0; for (let b = 0; b < 3; b++) d = Math.max(d, Math.hypot(P.py.xy[i * 6 + 2 * b] - P.copy.xy[i * 6 + 2 * b], P.py.xy[i * 6 + 2 * b + 1] - P.copy.xy[i * 6 + 2 * b + 1])); if (d > .1) split = t; }
      if (eject === null && Math.hypot(P.py.xy[i * 6], P.py.xy[i * 6 + 1]) > 8) eject = t; }
    STATS = { backErr, eightR: rmax(P.eight, 20 * LAP), nudgeR: rmax(P.nudge, 20 * LAP), split, eject, copyR: [0, 1, 2].map((b) => Math.hypot(...at(P.copy, PY_END).slice(2 * b, 2 * b + 2))) };
  })();

  // ---------- drawing ----------
  function trail(ctx, p, b, t, span, view, k = 1, dash) { const { cx, cy, s } = view, i1 = Math.floor(t / p.dt), i0 = Math.max(0, i1 - Math.round(span / p.dt)), step = Math.max(1, Math.round((i1 - i0) / 900));
    const col = COL[b]; ctx.lineCap = "round"; ctx.lineWidth = 3 * k; if (dash) ctx.setLineDash([10 * k, 10 * k]);
    let px = null, py = null;
    for (let i = i0; i <= i1; i += step) { const x = cx + p.xy[i * 6 + 2 * b] * s, y = cy - p.xy[i * 6 + 2 * b + 1] * s;
      if (px !== null) { ctx.strokeStyle = `rgba(${col},${.08 + .75 * (i - i0) / Math.max(1, i1 - i0)})`; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); } px = x; py = y; }
    ctx.setLineDash([]); }
  function star(ctx, x, y, r, col, hollow) { const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2); g.addColorStop(0, `rgba(${col},.55)`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 7); ctx.fill();
    if (hollow) { ctx.strokeStyle = `rgb(${col})`; ctx.lineWidth = r * .35; ctx.beginPath(); ctx.arc(x, y, r * .85, 0, 7); ctx.stroke(); }
    else { ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(x - r * .25, y - r * .25, r * .35, 0, 7); ctx.fill(); } }
  function bodies(ctx, p, t, view, k = 1, opts = {}) { const q = at(p, t), { cx, cy, s, W, H } = view;
    for (let b = 0; b < 3; b++) { if (opts.trail) trail(ctx, p, b, t, opts.trail, view, k, opts.hollow); }
    for (let b = 0; b < 3; b++) { const x = cx + q[2 * b] * s, y = cy - q[2 * b + 1] * s, r = (opts.r || 16) * Math.cbrt(p.m[b] / (opts.mref || 1)) * k;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) { const ax = Math.max(40 * k, Math.min(W - 40 * k, x)), ay = Math.max(40 * k, Math.min(H - 40 * k, y)); D.text(ctx, opts.hollow ? "◇" : "◆", ax, ay, 30 * k, `rgb(${COL[b]})`, 700); continue; }
      star(ctx, x, y, r, COL[b], opts.hollow); }
    return q; }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const sig = (v) => v.toFixed(7);
  // after the ejection, zoom out just enough to keep the original's escaping pair (masses 4 and 5) on screen
  function pyView(v, mt) { if (!STATS || mt <= STATS.eject) return v; const q = at(P.py, mt), x = (4 * q[2] + 5 * q[4]) / 9, y = (4 * q[3] + 5 * q[5]) / 9, r = Math.hypot(x, y) + 1.2;
    return Object.assign({}, v, { s: Math.min(v.s, v.fit / r) }); }

  // ---------- long video ----------
  const V8 = { cx: 960, cy: 590, s: 760, W: 1920, H: 1080 }, VN = { cx: 960, cy: 590, s: 600, W: 1920, H: 1080 }, VP = { cx: 960, cy: 590, s: 150, W: 1920, H: 1080, fit: 400 };
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1), st = STATS;
    if (sc.id === "hook" || sc.id === "eight") { const mt = (t - (sc.id === "hook" ? 0 : 0)) * EIGHT_RATE; bodies(ctx, P.eight, mt, V8, 1, { trail: LAP * .96 });
      if (sc.id === "hook") { D.text(ctx, "Three equal stars. One shared path.", W / 2, 90, 60, C.text, 700); return; }
      const lap = Math.floor(mt / LAP) + 1;
      D.text(ctx, u < 8 ? "Three equal masses, pulling on each other by gravity alone." : u < 16 ? "They chase each other along one figure-eight." : "Back to the exact start every lap: after 10 laps, off by " + sig(st.backErr) + ".", W / 2, 90, 50, C.text, 700, "center", f);
      D.text(ctx, "lap " + lap, 1820, 1030, 34, C.amber, 700, "right", f);
      D.text(ctx, "found by C. Moore (1993), proved by A. Chenciner & R. Montgomery (2000) · simulated, Newtonian gravity", 100, 1040, 22, C.dim, 500, "left", f); return; }
    if (sc.id === "nudge") { const mt = u * EIGHT_RATE; ctx.save(); ctx.globalAlpha = .25; for (let b = 0; b < 1; b++) trail(ctx, P.eight, b, LAP, LAP, VN, 1); ctx.restore();
      bodies(ctx, P.nudge, mt, VN, 1, { trail: LAP * 1.5 });
      D.text(ctx, u < 7 ? "Now push all three 3% faster." : "The dance wobbles, but holds together.", W / 2, 90, 54, C.text, 700, "center", f);
      D.text(ctx, "farthest from the centre in 20 laps: " + st.nudgeR.toFixed(2) + " (perfect eight: " + st.eightR.toFixed(2) + ")", W / 2, 1040, 26, C.amber, 600, "center", f); return; }
    if (sc.id === "pyth") { const mt = u * PY_RATE, rev = D.clamp((u - 6) / 1);
      if (rev > 0) { ctx.save(); ctx.globalAlpha = rev; bodies(ctx, P.copy, mt, pyView(VP, mt), 1, { trail: 2.5, hollow: true, r: 13, mref: 4 }); ctx.restore(); }
      bodies(ctx, P.py, mt, pyView(VP, mt), 1, { trail: 2.5, r: 11, mref: 4 });
      const cap = mt < 1.5 ? "Masses 3, 4 and 5, at rest on a 3-4-5 triangle (Burrau, 1913)." : u < 13 ? "Two copies. In the outlined one, a star starts 0.001 to the right." :
        mt < st.split ? "For a while they move as one." : mt < st.eject ? "At t = " + st.split.toFixed(1) + " the copies part ways." : "The original flings its lightest star away.";
      D.text(ctx, cap, W / 2, 90, 48, C.text, 700, "center", f);
      D.text(ctx, "t = " + mt.toFixed(1), 1820, 1030, 34, C.amber, 700, "right", f);
      if (mt > st.eject + 12) D.text(ctx, "The copy: at t = " + PY_END + ", all three still tangled together.", W / 2, 160, 36, C.amber, 700, "center", D.clamp((mt - st.eject - 12) / 2) * f);
      D.text(ctx, "filled: original · outlined: copy · simulated, Newtonian gravity, adaptive steps, no softening", 100, 1040, 22, C.dim, 500, "left", f); return; }
    bodies(ctx, P.eight, (t - sc.t0 + 24) * EIGHT_RATE, V8, 1, { trail: LAP * .96 });
    D.text(ctx, "Two bodies repeat their orbit forever.", W / 2, 90, 52, C.text, 700, "center", f);
    D.text(ctx, "Three: a rare perfect dance, or chaos from a 0.001 difference.", W / 2, 1010, 40, C.amber, 700, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .035 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: a note each time a star crosses the vertical centre line of the figure-eight; in the 3-4-5 problem, a note at each close pass (closer = louder)
  function crossings(p, t0, rate, tmax, tStart = 0) { const ev = []; for (let b = 0; b < 3; b++) { let prev = null;
    for (let i = Math.floor(tStart / p.dt); i < p.n; i++) { const mt = i * p.dt, t = t0 + (mt - tStart) / rate; if (t >= tmax) break; const x = p.xy[i * 6 + 2 * b];
      if (prev !== null && (prev < 0) !== (x < 0)) ev.push({ t, k: [5, 9, 12][b], side: (b - 1) * .5, gain: .45 }); prev = x; } } return ev; }
  function passes(p, t0, rate, tmax, side = 0, gainK = 1) { const ev = []; const pairs = [[0, 1], [0, 2], [1, 2]];
    for (const [a, b] of pairs) { let d0 = Infinity, d1 = Infinity;
      for (let i = 0; i < p.n; i++) { const d = Math.hypot(p.xy[i * 6 + 2 * a] - p.xy[i * 6 + 2 * b], p.xy[i * 6 + 2 * a + 1] - p.xy[i * 6 + 2 * b + 1]);
        if (d1 < d0 && d1 < d && d1 < .5) { const t = t0 + (i - 1) * p.dt / rate; if (t < tmax) ev.push({ t, k: Math.max(0, Math.min(15, Math.round(12 + Math.log2(d1)))), side, gain: gainK * (.35 + .4 * D.clamp(-Math.log10(d1) / 3)) }); }
        d0 = d1; d1 = d; } } return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [...crossings(P.eight, 0, EIGHT_RATE, s.eight.t1 - .1), ...crossings(P.nudge, s.nudge.t0, EIGHT_RATE, s.nudge.t1 - .1), ...passes(P.py, s.pyth.t0, PY_RATE, s.pyth.t1 - .1, -.3),
      ...passes(P.copy, s.pyth.t0, PY_RATE, s.pyth.t1 - .1, .3, .6).filter((e) => (e.t - s.pyth.t0) * PY_RATE > STATS.split), { t: s.pyth.t0 + STATS.eject / PY_RATE, k: 0, gain: .8 },
      ...crossings(P.eight, s.close.t0, EIGHT_RATE, s.close.t1 - .7, 24 * EIGHT_RATE)]; }

  // ---------- Shorts ----------
  const VS1 = { cx: 540, cy: 1000, s: 470, W: 1080, H: 1920 }, VS2 = { cx: 540, cy: 1060, s: 170, W: 1080, H: 1920, fit: 420 };
  function s1(ctx, t) { const mt = t * S1_RATE; bodies(ctx, P.eight, mt, VS1, 1, { trail: LAP * .96, r: 13 });
    D.lines(ctx, ["Three stars,", "one figure-eight."], 540, 200, 80, C.text, 1);
    D.text(ctx, "lap " + (Math.floor(mt / LAP) + 1) + " · gravity only", 540, 400, 38, C.amber, 700);
    D.text(ctx, "simulated · equal masses · Chenciner & Montgomery (2000)", 540, 1780, 28, C.dim, 600); }
  function s2(ctx, t) { const mt = Math.max(0, t - 1.5) * S2_RATE, st = STATS;
    const vw = pyView(VS2, mt); bodies(ctx, P.copy, mt, vw, 1, { trail: 2.5, hollow: true, r: 12, mref: 4 }); bodies(ctx, P.py, mt, vw, 1, { trail: 2.5, r: 10, mref: 4 });
    D.lines(ctx, mt < st.split ? ["Two copies.", "One star moved 0.001."] : mt < st.eject ? ["…and their futures", "split apart."] : ["One throws a star out.", "The other doesn't."], 540, 200, 72, C.text, 1);
    D.text(ctx, "t = " + mt.toFixed(1), 540, 380, 40, C.amber, 700);
    D.text(ctx, "filled: original · outlined: copy · masses 3, 4, 5 (Burrau, 1913)", 540, 1780, 28, C.dim, 600); }
  const timelines = [
    { id: "full", name: "23 Three Body (long)", file: "Command Loom - 23 Three Body.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "bell" },
    { id: "s1", name: "Short 1 · Figure-eight", file: "Command Loom - Short 1 - Figure Eight.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .04 * t / 30), voice: "bell",
      events: () => crossings(P.eight, 0, S1_RATE, 29.3) },
    { id: "s2", name: "Short 2 · Same start, different fate", file: "Command Loom - Short 2 - Different Fate.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .04 * t / 30), voice: "bell",
      events: () => [...passes(P.py, 1.5, S2_RATE, 29.3, -.3), { t: 1.5 + STATS.eject / S2_RATE, k: 0, gain: .8 }] }
  ];
  root.CLVideo = { title: "Command Loom · 23 Three Body", timelines, ready };
  root.TBVideo = { S, P, get STATS() { return STATS; }, timelines, ready, at, NUDGE, DX, PY_END };
})(typeof window !== "undefined" ? window : globalThis);
