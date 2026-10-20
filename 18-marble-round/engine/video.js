// 18 Marble Round: marbles roll down a tilted serpentine track of tuned keys (marbles.js) and play a traditional round.
// Every note time comes from the rolling motion; each key is as long as the marble travels during its note.
(function (root) {
  "use strict";
  const MB = root.Marbles, D = root.CLDraw, FPS = 30;
  const C = { bg: "#06070C", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", rail: "rgba(190,205,230,.25)" };
  const TR = MB.track(0.5, 1.5);                                 // 0.5° slope, released at 1.5 m/s
  const SONGS = { frere: { mel: MB.FRERE, beat: .625, entry: 8, title: "Frère Jacques", by: "traditional round" },
                  row: { mel: [...MB.ROW, ...MB.ROW], beat: .44, entry: 6, title: "Row, Row, Row Your Boat", by: "traditional round" } };
  for (const k in SONGS) { const sg = SONGS[k]; sg.K = MB.keys(TR, sg.mel, sg.beat); sg.T = sg.K[sg.K.length - 1].t1; sg.L = sg.K[sg.K.length - 1].s1; }
  const VOICE = [[255, 189, 56], [92, 200, 255], [255, 110, 170], [140, 240, 140]];
  const HUE = { 0: 0, 2: 28, 4: 52, 5: 120, 7: 185, 9: 225, 11: 275 };              // key colour by note: C red … B violet
  const PCOL = (m) => `hsl(${HUE[((m % 12) + 12) % 12] ?? 0},90%,${m < 60 ? 46 : m > 71 ? 70 : 58}%)`;
  // ---------- serpentine layout: lanes joined by half-circle turns ----------
  function layout(x0, y0, w, h, lanes, L) { const r = h / (2 * lanes), straight = w - 2 * r, per = straight + Math.PI * r, total = lanes * straight + (lanes - 1) * Math.PI * r;
    const k = total / L;                                            // pixels per metre
    function at(s) { let p = Math.max(0, Math.min(total, s * k)); const lane = Math.min(lanes - 1, Math.floor(p / per)); p -= lane * per;
      const y = y0 + r + lane * 2 * r, dir = lane % 2 ? -1 : 1, xs = dir > 0 ? x0 + r : x0 + w - r;
      if (p <= straight || lane === lanes - 1) return [xs + dir * Math.min(p, straight), y];
      const a = (p - straight) / r, cx = dir > 0 ? x0 + w - r : x0 + r;                 // half-circle turn down to the next lane
      return [cx + dir * r * Math.sin(a), y + r - r * Math.cos(a)]; }
    return { at, r, k, lanes, total }; }
  function strokePath(ctx, lay, s0, s1) { const n = Math.max(2, Math.ceil((s1 - s0) * lay.k / 6)); ctx.beginPath(); for (let i = 0; i <= n; i++) { const p = lay.at(s0 + (s1 - s0) * i / n); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); }
  function drawTrack(ctx, sg, lay, t, rel) {
    const lw = lay.r * 1.05; ctx.save(); ctx.lineCap = "butt"; ctx.lineJoin = "round";
    ctx.strokeStyle = C.rail; ctx.lineWidth = lw + 8; strokePath(ctx, lay, 0, sg.L);
    const lit = new Map(); rel.forEach((tr, v) => { const i = MB.keyAt(sg.K, TR, t, tr); if (i >= 0) lit.set(i, v); });
    sg.K.forEach((key, i) => { const on = lit.has(i); ctx.strokeStyle = PCOL(key.midi); ctx.globalAlpha = on ? 1 : .6; ctx.lineWidth = lw; ctx.shadowColor = on ? PCOL(key.midi) : "transparent"; ctx.shadowBlur = on ? 24 : 0;
      strokePath(ctx, lay, key.s0 + .02, key.s1 - .02); });
    ctx.restore();
    rel.forEach((tr, v) => { const u = t - tr; if (u < 0) return; const s = TR.s(Math.min(u, sg.T + .4)), p = lay.at(Math.min(s, sg.L)), col = VOICE[v % 4], rr = lay.r * .42;
      ctx.save(); ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 20; const g = ctx.createRadialGradient(p[0] - rr * .35, p[1] - rr * .35, rr * .1, p[0], p[1], rr);
      g.addColorStop(0, "#fff"); g.addColorStop(.35, `rgb(${col})`); g.addColorStop(1, `rgba(${col},.75)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fill(); ctx.restore(); });
  }
  const releases = (sg, n, t0) => Array.from({ length: n }, (_, i) => t0 + i * sg.entry * sg.beat);
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const PHYS = `ideal rolling on a ${TR.slopeDeg}° slope (a = 5/7·g·sin θ = ${TR.a.toFixed(3)} m/s²) · each key is cut to its note's length at the marble's speed`;

  // ---------- schedules ----------
  const S = [["hook", 0, 4], ["m1", 4, 26], ["m2", 26, 53], ["m4", 53, 91], ["close", 91, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const NM = { m1: 1, m2: 2, m4: 4 }, FR = SONGS.frere;
  const LL = layout(110, 165, 1700, 820, 7, FR.L);
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook" || sc.id === "close") { const tt = (sc.id === "hook" ? 12 : 10) + u; drawTrack(ctx, FR, LL, tt, releases(FR, 4, 0));
      D.text(ctx, sc.id === "hook" ? "4 marbles. One song. Nobody is playing it." : "Frère Jacques · traditional · played by a tilted track", W / 2, 75, 54, C.text, 700, "center", sc.id === "hook" ? 1 : f);
      D.text(ctx, PHYS, W / 2, 1050, 22, C.dim, 500, "center", sc.id === "hook" ? 1 : f); return; }
    const n = NM[sc.id]; drawTrack(ctx, FR, LL, u, releases(FR, n, 1));
    D.text(ctx, n === 1 ? "1 MARBLE" : `${n} MARBLES`, W / 2, 75, 64, C.text, 700, "center", f);
    D.text(ctx, n === 1 ? "one marble plays the tune" : n === 2 ? "a second marble, two bars behind" : "four marbles, two bars apart: a round", W / 2, 130, 32, C.amber, 600, "center", f);
    D.text(ctx, PHYS, W / 2, 1050, 22, C.dim, 500, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // ---------- sound: a marimba note each time a marble rolls onto a key ----------
  function roundNotes(sg, rel, t0, a = 0, b = Infinity) { const ev = []; rel.forEach((tr, v) => sg.K.forEach((key) => { const tt = tr + key.t0; if (tt >= a && tt < b) ev.push({ t: t0 + tt - a, midi: key.midi, k: (key.midi - 48) % 16, side: (v - 1.5) * .35, gain: .8 }); })); return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [...roundNotes(FR, releases(FR, 4, 0), 0, 12, 15.9)];
    for (const k of ["m1", "m2", "m4"]) ev.push(...roundNotes(FR, releases(FR, NM[k], 1), s[k].t0, 0, s[k].t1 - s[k].t0 - .3));
    ev.push(...roundNotes(FR, releases(FR, 4, 0), s.close.t0, 10, 18.4));
    return ev.filter((e) => e.t < 99.4); }
  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, LV = layout(70, 430, 940, 1240, 9, FR.L), LR = layout(70, 430, 940, 1240, 9, SONGS.row.L);
  function short(sg, lay, title, hide) { return (ctx, t) => { const rel = releases(sg, 4, .5), n = rel.filter((r) => t >= r).length, end = rel[3] + sg.T; drawTrack(ctx, sg, lay, t, rel);
    D.lines(ctx, title, 540, 150, 70, C.text, 1);
    D.text(ctx, hide && t < end ? `${n} ${n === 1 ? "marble" : "marbles"} · name the song` : `${n} ${n === 1 ? "marble" : "marbles"} · ${sg.title}`, 540, 340, 40, C.amber, 700);
    D.text(ctx, `${TR.slopeDeg}° slope · keys cut to each note's length`, 540, 1760, 30, C.dim, 600); }; }
  const timelines = [
    { id: "full", name: "18 Marble Round (long)", file: "Command Loom - 18 Marble Round.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Frère Jacques round", file: "Command Loom - Short 1 - Four Marbles.mp4", W: VW, H: VH, dur: 37, draw: zoomWrap(short(FR, LV, ["4 marbles,", "one song."]), VW, VH, (t) => 1 + .04 * t / 37), voice: "marimba",
      events: () => roundNotes(FR, releases(FR, 4, .5), 0).filter((e) => e.t < 36.4) },
    { id: "s2", name: "Short 2 · Row, Row, Row round", file: "Command Loom - Short 2 - Row Your Boat.mp4", W: VW, H: VH, dur: 31, draw: zoomWrap(short(SONGS.row, LR, ["Name this round.", "Nobody plays it."], true), VW, VH, (t) => 1 + .04 * t / 31), voice: "marimba",
      events: () => roundNotes(SONGS.row, releases(SONGS.row, 4, .5), 0).filter((e) => e.t < 30.4) }
  ];
  root.CLVideo = { title: "Command Loom · 18 Marble Round", timelines, ready: Promise.resolve() };
  root.RoundVideo = { S, SONGS, TR, timelines, releases, layout, NM, MB };
})(typeof window !== "undefined" ? window : globalThis);
