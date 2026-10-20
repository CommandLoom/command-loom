// 07 Pendulum Wave: 16 ideal pendulums (pendulum.js), drawn in simple 3D perspective. Every swing on screen is the model at that time.
(function (root) {
  "use strict";
  const P = root.Pend, D = root.CLDraw, N = P.N;
  const C = { bg: "#07090E", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0" };
  const mix = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));
  const COL = Array.from({ length: N }, (_, n) => mix([255, 189, 56], [53, 196, 240], n / (N - 1)));
  const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const SP = .032, FLOOR = -.43, Z = (n) => n * SP;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  function camera(pos, target, F, cx, cy) {
    const f = norm(sub(target, pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    return (p) => { const d = sub(p, pos), zc = dot(d, f); return [cx + F * dot(d, r) / zc, cy - F * dot(d, u) / zc, zc]; };
  }
  const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  // draw the rig at model time ts; show = which pendulums (default all); still = hang straight down
  function rig(ctx, pr, ts, opt = {}) {
    const show = opt.show || [...Array(N).keys()], F = opt.F;
    // frame: top bar and two posts
    if (!opt.place) { const a = pr([0, .02, -.03]), b = pr([0, .02, Z(N - 1) + .03]);
    ctx.strokeStyle = "rgba(190,200,215,.55)"; ctx.lineWidth = 6 * opt.k; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    for (const z of [-.03, Z(N - 1) + .03]) { const p = pr([0, .02, z]), q = pr([0, FLOOR, z]); ctx.lineWidth = 4 * opt.k; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }
    const items = show.map((n) => { const th = opt.still ? 0 : P.theta(n, ts), L = P.L(n), [x0, z] = opt.place && opt.place[n] || [0, Z(n)]; return { n, piv: [x0, 0, z], bob: [x0 + L * Math.sin(th), -L * Math.cos(th), z] }; });
    items.sort((x, y) => pr(y.bob)[2] - pr(x.bob)[2]);
    for (const it of items) {                                             // floor shadows
      const s = pr([it.bob[0], FLOOR, it.bob[2]]); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(s[0], s[1], F * .014 / s[2], F * .005 / s[2], 0, 0, 7); ctx.fill(); }
    for (const it of items) {
      const p = pr(it.piv), q = pr(it.bob), r = F * .013 / q[2], c = COL[it.n], hi = opt.highlight && opt.highlight.includes(it.n);
      ctx.strokeStyle = "rgba(220,228,240,.5)"; ctx.lineWidth = 1.6 * opt.k; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      const g = ctx.createRadialGradient(q[0] - r * .35, q[1] - r * .35, r * .1, q[0], q[1], r * 1.05); g.addColorStop(0, "#FFFFFF"); g.addColorStop(.35, rgba(c)); g.addColorStop(1, rgba(c.map((v) => v * .35)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 7); ctx.fill();
      if (hi) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2 * opt.k; ctx.beginPath(); ctx.arc(q[0], q[1], r * 1.6, 0, 7); ctx.stroke(); }
    }
    return items;
  }
  // phase dial: each pendulum is a dot going round once per swing
  function dial(ctx, cx, cy, R, ts, k = 1) {
    ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    D.text(ctx, "release position", cx, cy - R - 30 * k, 24 * k, C.dim, 500);
    for (let n = 0; n < N; n++) { const a = -Math.PI / 2 + P.phase(n, ts), rr = R * (.55 + .45 * n / (N - 1)); ctx.fillStyle = rgba(COL[n]); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 15 * k, 0, 7); ctx.fill(); }
  }
  // caption for the number of groups at model time ts (exact moments only, from the phases)
  const MOMENTS = [15, 20, 30, 40, 45];
  function groupCaption(ts) { for (const m of MOMENTS) if (Math.abs(ts - m) < 1.6) return { m, q: P.groups(m), a: D.clamp(1 - Math.abs(ts - m) / 1.6) }; return null; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["one", 4, 16], ["set", 16, 28], ["run", 28, 89], ["why", 89, 105], ["close", 105, 114]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const RUN0 = 28.5;                                      // release moment in the long video
  const HOOK_TS = 20;
  function camFull(t, F = 1900) { const w = .06 * Math.sin(t / 17); return camera([-.46, .40, .24 + w], [0, -.26, .24], F, 960, 690); }
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const k = 1, opt = { F: 1900, k };
    if (sc.id === "hook") { const ts = HOOK_TS - 2 + u; rig(ctx, camFull(t), ts, opt);
      D.text(ctx, "16 pendulums. No motors. Just lengths.", W / 2, 80, 62, C.text, 700); D.text(ctx, "Later in this video · ideal pendulum model", W / 2, 142, 30, C.amber, 600); return; }
    if (sc.id === "one") {
      const pr = camera([0, -.12, -.62], [0, -.2, 0], 1500, 960, 470), ts = Math.max(0, u - 2); rig(ctx, pr, ts, { ...opt, show: [0, N - 1], F: 1500, place: { 0: [-.2, 0], [N - 1]: [.2, 0] } });
      D.text(ctx, "A shorter pendulum swings faster.", W / 2, 80, 60, C.text, 700, "center", f);
      const lab = (n, x) => { D.text(ctx, (P.L(n) * 100).toFixed(1) + " cm", x, 900, 44, rgba(COL[n]), 700, "center", D.clamp((u - 1) / .5));
        D.text(ctx, P.T(n).toFixed(3) + " s per swing", x, 952, 30, C.dim, 600, "center", D.clamp((u - 1) / .5)); };
      lab(0, 520); lab(N - 1, 1400); D.text(ctx, "Ideal pendulums · small swings · real time", W / 2, 1040, 26, C.dim, 500, "center", f); return;
    }
    if (sc.id === "set") {
      const F2 = 1900 * (1 + .06 * u / 12), pr = camFull(t, F2); rig(ctx, pr, 0, { ...opt, F: F2, still: true });
      D.lines(ctx, ["16 lengths, chosen so that in 60 seconds", "they swing 51, 52, 53 … 66 times."], W / 2, 70, 52, C.text, f);
      for (let n = 0; n < N; n++) { const a = D.clamp((u - .5 - n * .3) / .4) * f, q = pr([0, -P.L(n), Z(n)]);
        D.text(ctx, String(P.swings(n)), q[0], q[1] + 52, 30, rgba(COL[n]), 700, "center", a); D.text(ctx, (P.L(n) * 100).toFixed(1), q[0], q[1] + 86, 20, C.dim, 600, "center", a); }
      D.text(ctx, "swings per minute · length in cm", W / 2, 1000, 28, C.dim, 600, "center", D.clamp((u - 5) / .5) * f);
      return;
    }
    if (sc.id === "run" || sc.id === "close") {
      const ts = sc.id === "run" ? Math.max(0, t - RUN0) : 60 + (t - sc.t0) - 1; rig(ctx, camFull(t), ts, opt);
      D.text(ctx, mmss(Math.max(0, ts)) + (ts >= 59.5 && sc.id === "close" ? "" : ""), 1780, 1010, 54, C.text, 700, "right");
      D.text(ctx, "real time", 1780, 1052, 24, C.dim, 600, "right");
      if (sc.id === "close") { D.text(ctx, "Every 60 seconds, they agree again.", W / 2, 80, 60, C.text, 700, "center", f);
        D.text(ctx, "Design after the Harvard lecture demo: 51–66 swings per minute · g = 9.80665 m/s²", W / 2, 1040, 24, C.dim, 500, "center", f); return; }
      if (ts < 1) D.text(ctx, "Released together.", W / 2, 80, 60, C.text, 700, "center", D.clamp(t - RUN0 + .6));
      else if (ts < 12) D.lines(ctx, ["Each one falls a little behind", "its shorter neighbour."], W / 2, 70, 54, C.text, D.clamp((ts - 2) / .6) * D.clamp((11.6 - ts) / .6));
      const gc = groupCaption(ts); if (gc) D.text(ctx, gc.m + " s · " + gc.q + " rows", W / 2, 80, 64, C.amber, 700, "center", gc.a);
      if (ts > 55) D.text(ctx, "…and at 60 s:", W / 2, 80, 60, C.text, 700, "center", D.clamp((ts - 55) / .5));
      return;
    }
    if (sc.id === "why") {
      const ts = Math.min(60, u * 60 / 14);
      dial(ctx, 960, 600, 330, ts); D.speed(ctx, "60 SECONDS IN 14 · " + mmss(ts), W);
      D.lines(ctx, ["Each pendulum makes one more swing per minute", "than its longer neighbour."], W / 2, 80, 50, C.text, f);
      const q = P.groups(ts, .004); if (q <= 4) D.text(ctx, q === 1 ? "all together" : q + " groups", 960, 1010, 44, C.amber, 700);
    }
  }
  function swingNotes(a, b, offset, gain = .45, show) {       // a right-hand turn of each pendulum = one note (longest = lowest)
    const ev = []; for (const n of show || [...Array(N).keys()]) for (const t of P.peaks(n, a, b)) ev.push({ t: offset + t - a, k: n, gain, side: (n / (N - 1) - .5) * .6 });
    return ev;
  }
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [...swingNotes(HOOK_TS - 2, HOOK_TS + 2, 0),
      ...swingNotes(0, 10, s.one.t0 + 2, .5, [0, N - 1]),
      ...Array.from({ length: N }, (_, n) => ({ t: s.set.t0 + .5 + n * .3, k: n, gain: .4 })),
      ...swingNotes(0, 60.4, RUN0),
      ...[15, 20, 30, 40, 45].map((m) => ({ t: s.why.t0 + m * 14 / 60, k: 8, gain: .6 })), { t: s.why.t0 + 14, k: 3, gain: .7 },
      ...swingNotes(59, 60 + (s.close.t1 - s.close.t0) - 1.6, s.close.t0)];
  }

  // ---------- Shorts ----------
  const camShort = (t) => { const yaw = .2 + .06 * Math.sin(t / 9); return camera([Math.sin(yaw) * .58, .42, .24 - Math.cos(yaw) * .58], [0, -.25, .26], 1550, 540, 840); };
  function shortFrame(ctx, t, ts, title, sub) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); rig(ctx, camShort(t), ts, { F: 1550, k: 1.2, still: ts < 0 });
    D.lines(ctx, title, 540, 170, 74, C.text, 1); if (sub) D.text(ctx, sub, 540, 170 + title.length * 83 + 10, 34, C.amber, 600);
    D.text(ctx, mmss(Math.max(0, ts)), 540, 1440, 96, C.text, 700); D.text(ctx, "real time · ideal pendulums", 540, 1510, 30, C.dim, 600);
  }
  const S1_0 = 2;                                             // release at 2 s, then 30 s of real time
  function drawS1(ctx, t) {
    const ts = t - S1_0, gc = groupCaption(ts);
    shortFrame(ctx, t, ts, ts < 25 ? ["16 pendulums.", "Different lengths."] : ["30 seconds:", "two perfect rows."], ts < 25 ? "Watch the pattern change" : null);
    if (gc && gc.m < 30) D.text(ctx, gc.m + " s · " + gc.q + " rows", 540, 1600, 56, C.amber, 700, "center", gc.a);
  }
  const S2_FROM = 36, S2_0 = 4;                                // shows model time 36 s → 60 s, then holds 3 s more of motion
  function drawS2(ctx, t) {
    const ts = t < S2_0 ? S2_FROM : S2_FROM + (t - S2_0), gc = groupCaption(ts);
    shortFrame(ctx, t, ts, ts < 58 ? ["Wait for", "second 60."] : ["Every 60 seconds,", "one line again."], ts < 58 ? "16 pendulums, each a different length" : null);
    if (gc) D.text(ctx, gc.m + " s · " + gc.q + " rows", 540, 1600, 56, C.amber, 700, "center", gc.a);
  }
  const timelines = [
    { id: "full", name: "07 Pendulum Wave (long)", file: "Command Loom - 07 Pendulum Wave.mp4", W: 1920, H: 1080, dur: 114, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Two perfect rows", file: "Command Loom - Short 1 - Two Perfect Rows.mp4", W: 1080, H: 1920, dur: 33, draw: drawS1, voice: "marimba",
      events: () => swingNotes(0, 30.45, S1_0) },
    { id: "s2", name: "Short 2 · Wait for second 60", file: "Command Loom - Short 2 - Wait for Second 60.mp4", W: 1080, H: 1920, dur: 31, draw: drawS2, voice: "marimba",
      events: () => swingNotes(S2_FROM, S2_FROM + 31 - S2_0 - .7, S2_0) }
  ];
  root.CLVideo = { title: "Command Loom · 07 Pendulum Wave", timelines };
  root.PendVideo = { S, RUN0, MOMENTS, groupCaption, timelines, fullEvents };
})(typeof window !== "undefined" ? window : globalThis);
