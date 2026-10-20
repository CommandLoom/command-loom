// 34 Pendulum Chords: the 16 pendulums of a pendulum wave seen from above (pendulum.js); each one plays its note of a C major seventh
// chord at every swing, so the patterns of the wave become arpeggios and chords. Real time; every note is one swing.
(function (root) {
  "use strict";
  const P = root.Pend, D = root.CLDraw, N = P.N, FPS = 30;
  const C = { bg: "#05060B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  const HUE = [.08, .55, .33, .85];                          // C, E, G, B
  const hsl = (h, l, a) => `hsla(${Math.round(((h % 1) + 1) % 1 * 360)},90%,${l}%,${a})`;
  const disp = (n, t) => P.L(n) * Math.sin(P.theta(n, t));   // sideways displacement of the bob seen from above, metres
  // layout: { x0, dx, cy, scale (px per metre), flow (px per second the trace drifts), keysY }
  function wave(ctx, ts, Lo, k) {
    const { x0, dx, cy, scale, flow, keysY, keyW } = Lo, TR = .34;
    ctx.save(); ctx.strokeStyle = "rgba(160,176,198,.22)"; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(x0 - dx * .6, cy); ctx.lineTo(x0 + dx * (N - .4), cy); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (let n = 0; n < N; n++) {                            // the trace each bob leaves, drifting left
      const x = x0 + n * dx, h = HUE[n % 4]; ctx.beginPath();
      for (let q = 0; q <= 24; q++) { const tq = ts - TR * q / 24; if (tq < 0) break; const px = x - flow * (ts - tq), py = cy + disp(n, tq) * scale; q ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.strokeStyle = hsl(h, 60, .55); ctx.lineWidth = 3 * k; ctx.stroke(); }
    ctx.restore();
    const lit = [];
    for (let n = 0; n < N; n++) {
      const x = x0 + n * dx, y = cy + disp(n, Math.max(0, ts)) * scale, h = HUE[n % 4], pk = P.peaks(n, ts - .45, ts + 1e-9).pop(), age = pk != null && ts >= 0 ? ts - pk : 9;
      if (age < .45) { const e = age / .45; ctx.save(); ctx.strokeStyle = hsl(h, 70, .9 * (1 - e)); ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(x, y, (18 + 40 * e) * k, 0, 7); ctx.stroke(); ctx.restore(); lit[n] = 1 - e; }
      ctx.save(); ctx.shadowColor = hsl(h, 70, 1); ctx.shadowBlur = (age < .45 ? 30 : 12) * k; ctx.fillStyle = age < .2 ? "#fff" : hsl(h, 72, 1); ctx.beginPath(); ctx.arc(x, y, 15 * k, 0, 7); ctx.fill(); ctx.restore();
    }
    for (let n = 0; n < N; n++) {                            // keyboard strip: one key per pendulum
      const x = x0 + n * dx, a = lit[n] || 0, h = HUE[n % 4];
      ctx.save(); ctx.fillStyle = a ? hsl(h, 65, .25 + .7 * a) : "rgba(40,48,62,.8)"; ctx.fillRect(x - keyW / 2, keysY, keyW, 54 * k); ctx.restore();
      D.text(ctx, P.noteName(n), x, keysY + 27 * k, 22 * k, a > .3 ? "#05060B" : C.dim, 700);
    }
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  // captions at the exact moments (checked against the phases in the tests)
  const CAPS = [[0, "Released together: one chord, C major seventh."], [15, "15 s · 4 groups: each plays one note in four octaves. An arpeggio."],
    [20, "20 s · 3 groups take turns."], [30, "30 s · 2 groups: C with G, then E with B, again and again."], [40, "40 s · 3 groups again."],
    [45, "45 s · 4 groups: the arpeggio, the other way round."], [60, "60 s · all 16 together again: the whole chord."],
    [75, "75 s · 4 groups"], [80, "80 s · 3 groups"], [90, "90 s · 2 groups"]];
  function caption(ts) { for (const [m, s] of CAPS) { const a = m === 0 ? D.clamp(1 - Math.max(0, ts - 3) / .6) * D.clamp(ts + 1) : D.clamp(1 - Math.abs(ts - m) / 2.2); if (a > 0) return { s, a, m }; } return null; }

  // ---------- long video ----------
  const LONG = { x0: 160, dx: 106.7, cy: 540, scale: 3900, flow: 300, keysY: 930, keyW: 96 };
  const RUN0 = 4, HOOK_TS = 13;
  const S = [["hook", 0, 4], ["run", 4, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  function inner(ctx, t) {
    const W = 1920;
    if (t < RUN0) { const ts = HOOK_TS + t; wave(ctx, ts, LONG, 1); D.text(ctx, "16 pendulums, 16 notes of one chord.", W / 2, 80, 60, C.text, 700); D.text(ctx, "wait for the patterns", W / 2, 148, 34, C.amber, 600); return; }
    const ts = t - RUN0; wave(ctx, ts, LONG, 1);
    const cp = caption(ts); D.text(ctx, cp ? cp.s : "", W / 2, 90, 50, ts < 3.5 ? C.text : C.amber, 700, "center", cp ? cp.a : 0);
    D.text(ctx, mmss(ts), 1800, 70, 54, C.text, 700, "right"); D.text(ctx, "real time", 1800, 112, 24, C.dim, 600, "right");
    D.text(ctx, "seen from above · ideal pendulums, 51 to 66 swings per minute · one note per swing", W / 2, 1050, 24, C.dim, 500);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => t < RUN0 ? 1 + .02 * t / 4 : 1 + .03 * Math.sin((t - RUN0) / 96 * Math.PI));

  // ---------- sound: each right-hand turn of a pendulum plays its note (marimba) ----------
  function swingNotes(a, b, offset, gain = .5) { const ev = []; for (let n = 0; n < N; n++) for (const t of P.peaks(n, a, b)) ev.push({ t: offset + Math.max(0, t - a), midi: P.midi(n), k: n, gain, side: (n / (N - 1) - .5) * .5 }); return ev; }
  const fullEvents = () => [...swingNotes(HOOK_TS, HOOK_TS + 3.95, 0), ...swingNotes(0, 95.4, RUN0)];

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, VERT = { x0: 85, dx: 60.7, cy: 980, scale: 2900, flow: 170, keysY: 1440, keyW: 54 };
  function vert(ctx, ts, title, sub) { wave(ctx, ts, VERT, 1);
    D.lines(ctx, title, 540, 170, 74, C.text, 1); if (sub) D.text(ctx, sub, 540, 170 + title.length * 83 + 10, 34, C.amber, 600);
    const cp = caption(ts); if (cp && ts > 3.5) D.text(ctx, cp.m + " s · " + (P.groups(cp.m) === 1 ? "all together" : P.groups(cp.m) + " groups"), 540, 1610, 52, C.amber, 700, "center", cp.a);
    D.text(ctx, mmss(Math.max(0, ts)), 540, 1720, 80, C.text, 700); D.text(ctx, "real time · seen from above · one note per swing", 540, 1790, 28, C.dim, 600); }
  const S1_0 = 2;
  const s1 = (ctx, t) => vert(ctx, t - S1_0, t - S1_0 < 26 ? ["16 pendulums,", "16 notes."] : ["30 seconds:", "two chords."], t - S1_0 < 26 ? "listen at 30 seconds" : null);
  const S2_FROM = 30;
  const s2 = (ctx, t) => vert(ctx, S2_FROM + t, t < 27 ? ["Two chords…"] : ["…one chord."], t < 27 ? "wait for second 60" : null);
  const timelines = [
    { id: "full", name: "34 Pendulum Chords (long)", file: "Command Loom - 34 Pendulum Chords.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Two Chords", file: "Command Loom - Short 1 - Two Chords.mp4", W: VW, H: VH, dur: 33, draw: zoomWrap(s1, VW, VH, (t) => 1 + .03 * t / 33), voice: "marimba", events: () => swingNotes(0, 30.4, S1_0) },
    { id: "s2", name: "Short 2 · One Chord", file: "Command Loom - Short 2 - One Chord.mp4", W: VW, H: VH, dur: 33, draw: zoomWrap(s2, VW, VH, (t) => 1 + .03 * t / 33), voice: "marimba", events: () => swingNotes(S2_FROM, S2_FROM + 32.4, 0) }
  ];
  root.CLVideo = { title: "Command Loom · 34 Pendulum Chords", timelines, ready: Promise.resolve() };
  root.ChordVideo = { S, CAPS, caption, timelines, RUN0, HOOK_TS };
})(typeof window !== "undefined" ? window : globalThis);
