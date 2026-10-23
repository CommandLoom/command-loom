// 16 Ellipse String Art: 2,048 balls leave one point of a billiard table (billiard.js). Every path and wall hit is computed exactly.
// The "string art" is every wall-to-wall path drawn as a faint line; it is built up in order of time, so any frame can be rebuilt.
(function (root) {
  "use strict";
  const B = root.Billiard, D = root.CLDraw, FPS = 30, N = 2048, V = 1;
  const C = { bg: "#04050A", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", wall: "rgba(200,220,255,.85)" };
  const E = B.ellipse(1, 0.8), CIR = B.circle(0.85), ST = B.stadium(0.5, 0.8);
  // ---------- schedules ----------
  const S = [["hook", 0, 4], ["circleC", 4, 14], ["circleOff", 14, 30], ["ellipseF", 30, 50], ["ellipseOff", 50, 68], ["stadium", 68, 88], ["close", 88, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const SIMS = {
    circleC: () => B.run(CIR, 0, 0, N, V, 40),
    circleOff: () => B.run(CIR, 0.42, 0.12, N, V, 40),
    ellipseF: () => B.run(E, -E.c, 0, N, V, 40),
    ellipseOff: () => B.run(E, -E.c + 0.06, 0.04, N, V, 40),
    stadium: () => B.run(ST, -0.3, 0.1, N, V, 40)
  };
  const sim = {}, getSim = (k) => sim[k] || (sim[k] = SIMS[k]());
  const PASS = 2 * E.a / V;                       // focus -> wall -> other focus: always 2a long
  // ---------- drawing ----------
  const hsl = (h, l = 60, a = 1) => `hsla(${Math.round(h * 360)},95%,${l}%,${a})`;
  function outline(ctx, table, cx, cy, s, lw) {
    ctx.save(); ctx.strokeStyle = C.wall; ctx.lineWidth = lw; ctx.shadowColor = "rgba(140,190,255,.8)"; ctx.shadowBlur = lw * 4; ctx.beginPath();
    if (table.kind === "circle") ctx.arc(cx, cy, table.R * s, 0, 7);
    else if (table.kind === "ellipse") ctx.ellipse(cx, cy, table.a * s, table.b * s, 0, 0, 7);
    else { const L = table.L * s, R = table.R * s; ctx.moveTo(cx - L, cy - R); ctx.lineTo(cx + L, cy - R); ctx.arc(cx + L, cy, R, -Math.PI / 2, Math.PI / 2); ctx.lineTo(cx - L, cy + R); ctx.arc(cx - L, cy, R, Math.PI / 2, 1.5 * Math.PI); }
    ctx.stroke(); ctx.restore();
  }
  // every completed wall-to-wall path, sorted by the time it was completed
  function chords(sm) { if (sm._ch) return sm._ch; const out = [];
    for (const b of sm.balls) for (let i = 1; i < b.T.length; i++) out.push([b.T[i], b.X[i - 1], b.Y[i - 1], b.X[i], b.Y[i], b.hue]);
    out.sort((p, q) => p[0] - q[0]); return (sm._ch = out); }
  const acc = {};
  // decay (per second, optional): older lines fade out exponentially, so long runs show the current weave instead of saturating to white
  function stringArt(ctx, key, sm, t, cx, cy, s, W, H, alpha, decay = 0) {
    const a = acc[key] || (acc[key] = { c: null, i: 0, t: -1 });
    if (!a.c) { a.c = document.createElement("canvas"); a.c.width = W; a.c.height = H; }
    const g = a.c.getContext("2d");
    if (t < a.t) { g.clearRect(0, 0, W, H); a.i = 0; a.t = 0; }
    if (decay && t > a.t) { g.globalCompositeOperation = "destination-out"; g.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-decay * (t - a.t))).toFixed(4)})`; g.fillRect(0, 0, W, H); }
    const ch = chords(sm); g.globalCompositeOperation = "lighter"; g.lineWidth = 1.1;
    while (a.i < ch.length && ch[a.i][0] <= t) { const c = ch[a.i]; g.strokeStyle = hsl(c[5], 55, decay ? alpha * Math.exp(-decay * (t - c[0])) : alpha); g.beginPath(); g.moveTo(cx + c[1] * s, cy - c[2] * s); g.lineTo(cx + c[3] * s, cy - c[4] * s); g.stroke(); a.i++; }
    a.t = t; ctx.drawImage(a.c, 0, 0);
  }
  function balls(ctx, sm, t, cx, cy, s, tail, r) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (const b of sm.balls) {
      const p = B.pos(b, t), q = B.pos(b, Math.max(0, t - tail)); ctx.strokeStyle = hsl(b.hue, 62, .55); ctx.lineWidth = r * .9; ctx.beginPath(); ctx.moveTo(cx + q[0] * s, cy - q[1] * s);
      for (let i = q[2] + 1; i <= p[2]; i++) ctx.lineTo(cx + b.X[i] * s, cy - b.Y[i] * s);
      ctx.lineTo(cx + p[0] * s, cy - p[1] * s); ctx.stroke();
      ctx.fillStyle = hsl(b.hue, 75, .9); ctx.beginPath(); ctx.arc(cx + p[0] * s, cy - p[1] * s, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function focusMarks(ctx, cx, cy, s, k) { for (const fx of [-E.c, E.c]) { ctx.strokeStyle = "rgba(255,189,56,.8)"; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(cx + fx * s, cy, 9 * k, 0, 7); ctx.stroke(); } }
  function table(ctx, key, t, cx, cy, s, W, H, k, art = .05, decay = 0) {
    const sm = getSim(key), tb = sm.table;
    stringArt(ctx, key + W + (decay ? "d" : ""), sm, t, cx, cy, s, W, H, art, decay); outline(ctx, tb, cx, cy, s, 3 * k);
    if (tb.kind === "ellipse") focusMarks(ctx, cx, cy, s, k);
    balls(ctx, sm, t, cx, cy, s, .3, 2.2 * k);
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const meetings = (t) => Math.floor(t / PASS + 1e-9);

  // ---------- long video ----------
  const HOOK0 = PASS - 1.2;                                  // the hook starts 1.2 s before the first meeting
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1), cx = 960, cy = 590, s = 540, foot = (txt) => D.text(ctx, txt, W / 2, 1050, 24, C.dim, 500, "center", f);
    if (sc.id === "hook") { table(ctx, "ellipseF", HOOK0 + u, cx, cy, s, W, H, 1);
      D.text(ctx, "2,048 balls leave one point.", W / 2, 70, 56, C.text, 700); if (HOOK0 + u > PASS - .05) D.text(ctx, "All of them meet again.", W / 2, 135, 40, C.amber, 700, "center", D.clamp((HOOK0 + u - PASS) / .4)); return; }
    if (sc.id === "close") { table(ctx, "ellipseF", 1.4 + u, cx, cy, s, W, H, 1, .04);
      D.text(ctx, "One shape. One point. Every path the same length.", W / 2, 70, 50, C.text, 700, "center", f); foot("billiard paths computed exactly: straight lines, angle in = angle out, no friction"); return; }
    const key = sc.id; table(ctx, key, u, cx, cy, s, W, H, 1);
    if (key === "circleC") { D.text(ctx, "A circle, started from its centre: every ball comes straight back.", W / 2, 70, 46, C.text, 700, "center", f); }
    else if (key === "circleOff") { D.text(ctx, u < 6 ? "Move the start off-centre…" : "…and the paths weave a pattern nobody drew.", W / 2, 70, 50, C.text, 700, "center", f); }
    else if (key === "ellipseF") { const m = meetings(u), sp = m ? B.spread(getSim(key), m * PASS, m % 2 ? E.c : -E.c, 0) : 0;
      D.text(ctx, u < PASS ? "Now an ellipse, started from one focus (orange ring)…" : u < 12 ? "…every path is the same length, so all 2,048 meet at the other focus." : "Pass after pass, the paths fold onto the long axis.", W / 2, 70, 46, C.text, 700, "center", f);
      if (m) D.text(ctx, `meetings: ${m} · all within ${sp < 1e-6 ? "a millionth" : sp.toExponential(0)} of the focus`, 1840, 1000, 30, C.amber, 700, "right", f); }
    else if (key === "ellipseOff") { const sp = B.spread(getSim(key), PASS, E.c, 0);
      D.text(ctx, "Start just beside the focus: they never all meet again.", W / 2, 70, 48, C.text, 700, "center", f);
      D.text(ctx, `at the moment they would meet, some are ${(sp / (2 * E.a) * 100).toFixed(0)}% of the table width away`, 1840, 1000, 28, C.amber, 700, "right", f); }
    else if (key === "stadium") { D.text(ctx, u < 7 ? "A stadium: two half-circles and two straight sides…" : "…chaos. The balls spread over the whole table.", W / 2, 70, 50, C.text, 700, "center", f); }
    foot("2,048 balls · same speed · straight lines, angle in = angle out · no friction");
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: wall hits (a note from the hit's position around the table), a bell at each meeting ----------
  function hitNotes(key, t0, a, b, cap = 4) {
    const sm = getSim(key), byFrame = new Map();
    for (const bl of sm.balls) for (let i = 1; i < bl.T.length; i++) { const tt = bl.T[i]; if (tt < a || tt >= b) continue;
      const fr = Math.floor(tt * FPS), kk = Math.floor(((Math.atan2(bl.Y[i], bl.X[i]) / (2 * Math.PI) + 1) % 1) * 16);
      const m = byFrame.get(fr) || new Map(); m.set(kk, (m.get(kk) || 0) + 1); byFrame.set(fr, m); }
    const ev = [];
    for (const [fr, m] of byFrame) { [...m.entries()].sort((p, q) => q[1] - p[1]).slice(0, cap).forEach(([kk, n]) => ev.push({ t: t0 + fr / FPS - a, k: kk, gain: Math.min(1, .25 + .15 * Math.log2(n + 1)) })); }
    return ev; }
  const meetBells = (t0, a, b) => { const ev = []; for (let m = 1; m * PASS < b; m++) if (m * PASS >= a) ev.push({ t: t0 + m * PASS - a, k: 12, gain: .9, voice: "bell" }, { t: t0 + m * PASS - a, k: 5, gain: .7, voice: "bell" }); return ev; };
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [];
    ev.push(...hitNotes("ellipseF", s.hook.t0, HOOK0, HOOK0 + 4), ...meetBells(s.hook.t0, HOOK0, HOOK0 + 4));
    for (const k of ["circleC", "circleOff", "ellipseF", "ellipseOff", "stadium"]) ev.push(...hitNotes(k, s[k].t0, 0, s[k].t1 - s[k].t0 - .05));
    ev.push(...meetBells(s.ellipseF.t0, 0, s.ellipseF.t1 - s.ellipseF.t0));
    ev.push(...hitNotes("ellipseF", s.close.t0, 1.4, 12.8), ...meetBells(s.close.t0, 1.4, 12.8));
    return ev.filter((e) => e.t >= 0 && e.t < 99.4); }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  function s1(ctx, t) { const cx = 540, cy = 1010, s = 470, tt = Math.max(0, t - .4), m = meetings(tt);
    table(ctx, "ellipseF", tt, cx, cy, s, VW, VH, 1.15);
    D.lines(ctx, ["2,048 balls leave", "one point…"], 540, 170, 78, C.text, 1);
    D.text(ctx, !m ? "wait for it" : m < 6 ? `…and meet again. Meetings: ${m}` : `meetings: ${m} · the paths fold onto one line`, 540, 380, 44, C.amber, 700);
    D.text(ctx, "ellipse billiard · paths computed exactly", 540, 1640, 30, C.dim, 600); }
  // one Short per table from the long video (the old four-table Short is now covered by these and Short 1)
  const TS = [{ n: 2, key: "circleOff", dur: 34, file: "Off Centre", lines: (u) => u < 8 ? ["Start off-centre…"] : ["…and the paths", "weave a pattern."], note: "circle billiard · start halfway between the centre and the wall" },
    { n: 3, key: "ellipseOff", dur: 34, file: "Beside the Focus", lines: (u) => u < 8 ? ["Start just beside", "the focus…"] : ["…they never all", "meet again."], note: "ellipse billiard · start 3.6% of the table width from the focus" },
    { n: 4, key: "stadium", dur: 38, file: "Stadium", lines: (u) => u < 9 ? ["A stadium: two half-circles,", "two straight sides…"] : ["…chaos. The balls", "fill the whole table."], note: "stadium billiard · two half-circles joined by straight sides" }];
  function tableShort(X) { return (ctx, t) => { const u = Math.max(0, t - .4), sc = X.key === "stadium" ? 375 : 470;
    table(ctx, X.key, u, 540, 1010, sc, VW, VH, 1.15, .07, .45); D.lines(ctx, X.lines(u), 540, 170, X.key === "stadium" ? 66 : 78, C.text, 1);
    D.text(ctx, "2,048 balls · straight lines · angle in = angle out", 540, 1600, 30, C.dim, 600); D.text(ctx, X.note, 540, 1650, 28, C.dim, 600); }; }
  const timelines = [
    { id: "full", name: "16 Ellipse String Art (long)", file: "Command Loom - 16 Ellipse String Art.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · One point, one meeting", file: "Command Loom - Short 1 - One Point.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(s1, VW, VH, (t) => 1 + .04 * t / 30), voice: "glass",
      events: () => [...hitNotes("ellipseF", .4, 0, 29), ...meetBells(.4, 0, 29)].filter((e) => e.t < 29.4) },
    ...TS.map((X) => ({ id: "s" + X.n, name: `Short ${X.n} · ${X.file}`, file: `Command Loom - Short ${X.n} - ${X.file}.mp4`, W: VW, H: VH, dur: X.dur, draw: zoomWrap(tableShort(X), VW, VH, (t) => 1 + .04 * t / X.dur), voice: "glass",
      events: () => [{ t: .2, k: 9, voice: "bell", gain: .5 }, ...hitNotes(X.key, .4, 0, X.dur - .9)].filter((e) => e.t < X.dur - .6) }))
  ];
  root.CLVideo = { title: "Command Loom · 16 Ellipse String Art", timelines, ready: Promise.resolve() };
  root.EllipseVideo = { S, E, PASS, N, getSim, timelines, meetings, hitNotes };
})(typeof window !== "undefined" ? window : globalThis);
