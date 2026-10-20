// 11 Brachistochrone: four frictionless beads racing from A to B (brach.js). Every time and speed is computed from energy conservation.
(function (root) {
  "use strict";
  const K = root.Brach, D = root.CLDraw;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8" };
  const B = [2, .8];
  const CURVES = [["straight line", K.straight(B), [220, 226, 236]], ["steep drop, then slide", K.dropThenSlide(B), [239, 111, 174]], ["circular arc", K.arc(B), [53, 196, 240]], ["cycloid", K.cycloid(B), [255, 189, 56]]]
    .map(([name, pts, col]) => ({ name, pts, col, tr: K.track(pts) }));
  const ORDER = CURVES.map((c, i) => i).sort((a, b) => CURVES[a].tr.total - CURVES[b].tr.total);
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const DIP = Math.max(...CURVES[3].pts.map((p) => p[1])) - B[1];
  const R_BOWL = .5, T_TAUTO = K.tautoTime(R_BOWL);
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  function tracks(ctx, X, Y, prog = 1, k = 1, only) {
    CURVES.forEach((c, i) => { if (only && !only.includes(i)) return; const n = Math.round(c.pts.length * prog); ctx.strokeStyle = css(c.col, .75); ctx.lineWidth = 4 * k; ctx.beginPath();
      for (let j = 0; j < n; j += 8) { const p = c.pts[j]; j ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])); } ctx.stroke(); });
    for (const [p, s] of [[[0, 0], "A"], [B, "B"]]) { ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 9 * k, 0, 7); ctx.fill(); D.text(ctx, s, X(p[0]) + (s === "A" ? -30 : 34) * k, Y(p[1]) - 4, 40 * k, C.text, 700); }
  }
  function beads(ctx, X, Y, tt, k = 1) { CURVES.forEach((c) => { const q = K.at(c.tr, tt), x = X(q.x), y = Y(q.y), g = ctx.createRadialGradient(x - 5 * k, y - 5 * k, 2, x, y, 18 * k);
    g.addColorStop(0, "#FFFFFF"); g.addColorStop(.4, css(c.col)); g.addColorStop(1, css(c.col.map((v) => v * .4))); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16 * k, 0, 7); ctx.fill(); }); }
  function results(ctx, tt, x, y, k = 1, size = 34) {
    ORDER.forEach((i, r) => { const c = CURVES[i], done = tt >= c.tr.total, a = done ? 1 : .35;
      D.text(ctx, (done ? (r + 1) + ". " : "· ") + c.name, x, y + r * size * 1.5 * k, size * k, css(c.col, a), 700, "left");
      D.text(ctx, (done ? c.tr.total : Math.min(tt, c.tr.total)).toFixed(3) + " s", x + 560 * k, y + r * size * 1.5 * k, size * k, css(c.col, a), 700, "right"); });
  }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["ask", 4, 16], ["race", 16, 36], ["why", 36, 56], ["tauto", 56, 80], ["history", 80, 92], ["close", 92, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const SLOW = 12, RACE0 = 18, rt = (t) => Math.max(0, (t - RACE0) / SLOW);
  const X = (x) => 200 + x * 560, Y = (y) => 250 + y * 560;
  const BOWL = [.4, 1.3, 2.3].map((th0) => K.track(K.bowlFrom(R_BOWL, th0))), BX0 = (th0) => R_BOWL * (th0 - Math.sin(th0));
  function bowlScene(ctx, tt, cx, cy, s, k = 1) {
    // full cycloid bowl, lowest point at the centre
    ctx.strokeStyle = "rgba(255,189,56,.75)"; ctx.lineWidth = 4 * k; ctx.beginPath();
    for (let a = 0; a <= 2 * Math.PI + 1e-9; a += .02) { const x = R_BOWL * (a - Math.sin(a)) - Math.PI * R_BOWL, y = R_BOWL * (1 - Math.cos(a)); a ? ctx.lineTo(cx + x * s, cy + (y - 2 * R_BOWL) * s) : ctx.moveTo(cx + x * s, cy + (y - 2 * R_BOWL) * s); }
    ctx.stroke(); const cols = [[53, 196, 240], [239, 111, 174], [220, 226, 236]];
    [.4, 1.3, 2.3].forEach((th0, i) => { const tr = BOWL[i], q = K.at(tr, tt), y0 = R_BOWL * (1 - Math.cos(th0)), xs = BX0(th0) + q.x - Math.PI * R_BOWL, ys = y0 + q.y;
      const x = cx + xs * s, y = cy + (ys - 2 * R_BOWL) * s; ctx.fillStyle = css(cols[i]); ctx.beginPath(); ctx.arc(x, y, 16 * k, 0, 7); ctx.fill(); });
  }
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook" || sc.id === "race" || sc.id === "close") {
      const tt = sc.id === "race" ? rt(t) : 2; tracks(ctx, X, Y); beads(ctx, X, Y, tt); results(ctx, tt, 1300, 420);
      if (sc.id === "hook") { D.text(ctx, "The fastest way down is not the straight line.", W / 2, 80, 58, C.text, 700); D.text(ctx, "Later in this video · frictionless beads, computed", W / 2, 142, 30, css([255, 189, 56]), 600); return; }
      if (sc.id === "close") { D.text(ctx, "Shortest path is not the fastest path.", W / 2, 80, 58, C.text, 700, "center", f); D.text(ctx, "Frictionless beads, g = 9.81 m/s², A to B: 2 m across, 0.8 m down · times from energy conservation", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
      D.speed(ctx, SLOW + "× SLOWER", W); D.text(ctx, tt < CURVES[ORDER[0]].tr.total ? "Go." : "The cycloid wins, by dipping below the finish.", W / 2, 80, 56, C.text, 700, "center", f); return; }
    if (sc.id === "ask") { tracks(ctx, X, Y, D.clamp((u - 1) / 6)); beads(ctx, X, Y, 0);
      D.lines(ctx, ["From A to B. No friction, only gravity.", "Which bead arrives first?"], W / 2, 70, 52, C.text, f);
      CURVES.forEach((c, i) => D.text(ctx, c.name, 1380, 420 + i * 51, 34, css(c.col), 700, "left", D.clamp((u - 2 - i * .8) / .4) * f)); return; }
    if (sc.id === "why") {
      const x0 = 260, y0 = 260, w = 1100, h = 560, tmax = 1.1, vmax = 5.2, Xv = (s) => x0 + s / tmax * w, Yv = (v) => y0 + h - v / vmax * h, up = D.clamp((u - .5) / 8) * tmax;
      ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      for (let s = 0; s <= 1; s += .25) D.text(ctx, s.toFixed(2) + " s", Xv(s), y0 + h + 30, 22, C.dim, 600); D.text(ctx, "speed (m/s)", x0, y0 - 26, 22, C.dim, 600, "left");
      for (let v = 0; v <= 5; v++) D.text(ctx, String(v), x0 - 14, Yv(v), 20, C.dim, 600, "right");
      CURVES.forEach((c) => { ctx.strokeStyle = css(c.col); ctx.lineWidth = 3.5; ctx.beginPath(); for (let s = 0; s <= Math.min(up, c.tr.total); s += .005) { const p = [Xv(s), Yv(K.at(c.tr, s).v)]; s ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke(); });
      CURVES.forEach((c, i) => D.text(ctx, c.name, 1440, 420 + i * 51, 32, css(c.col), 700, "left", f));
      D.text(ctx, u < 9 ? "The cycloid starts almost vertically, so it is fast from the very start." : "It even dips " + Math.round(DIP * 100) + " cm below B: losing height early buys speed.", W / 2, 80, 48, C.text, 700, "center", f); return; }
    if (sc.id === "tauto") {
      const tt = Math.max(0, (u - 3) / SLOW); bowlScene(ctx, tt, 960, 900, 560);
      D.lines(ctx, ["Flip the cycloid into a bowl.", tt < T_TAUTO ? "Release three beads from different heights…" : "…they reach the bottom at the same moment."], W / 2, 70, 50, C.text, f);
      D.text(ctx, Math.min(tt, T_TAUTO).toFixed(3) + " s", 1700, 1000, 48, C.text, 700, "right"); D.text(ctx, "all three: " + T_TAUTO.toFixed(3) + " s", 1700, 1050, 26, C.dim, 600, "right"); D.speed(ctx, SLOW + "× SLOWER", W); return; }
    if (sc.id === "history") { tracks(ctx, X, Y, 1, 1, [3]);
      D.lines(ctx, ["Johann Bernoulli posed this puzzle in June 1696.", "Newton, Leibniz, Jakob Bernoulli and others solved it:", "the answer is a cycloid, the curve traced by a point on a rolling wheel."], 1060, 380, 38, C.text, D.clamp((u - .4) / .6) * f); }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .05 * (t - sc.t0) / (sc.t1 - sc.t0); });
  function raceNotes(offset, slow) { const ev = [{ t: offset, k: 7, gain: .5 }]; ORDER.forEach((i, r) => ev.push({ t: offset + CURVES[i].tr.total * slow, k: 14 - r * 3, gain: .65 }));
    CURVES.forEach((c, i) => [.25, .5, .75].forEach((fr) => { const j = c.pts.findIndex((p) => p[0] >= fr * B[0]); if (j > 0) ev.push({ t: offset + c.tr.T[j] * slow, k: 3 + i * 2, gain: .3 }); })); return ev; }
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 9 }, ...CURVES.map((c, i) => ({ t: s.ask.t0 + 2 + i * .8, k: 4 + i * 3, gain: .5 })), ...raceNotes(RACE0, SLOW),
      { t: s.why.t0 + 9, k: 12, gain: .5 }, ...[0, 1, 2].map((i) => ({ t: s.tauto.t0 + 3, k: 3 + i * 4, gain: .4 })), { t: s.tauto.t0 + 3 + T_TAUTO * SLOW, k: 2, gain: .7 }, { t: s.tauto.t0 + 3 + T_TAUTO * SLOW, k: 7, gain: .7 }, { t: s.tauto.t0 + 3 + T_TAUTO * SLOW, k: 12, gain: .7 },
      { t: s.history.t0 + .4, k: 8, gain: .5 }, { t: s.close.t0 + .3, k: 6 }];
  }

  // ---------- Shorts ----------
  const XS = (x) => 120 + x * 420, YS = (y) => 640 + y * 420, S1_SLOW = 15, S1_0 = 6;
  function s1(ctx, t) {
    const tt = Math.max(0, (t - S1_0) / S1_SLOW); tracks(ctx, XS, YS, D.clamp(t / 3), 1.1); beads(ctx, XS, YS, tt, 1.1); results(ctx, tt, 80, 1300, 1.2, 36);
    D.lines(ctx, tt < CURVES[ORDER[0]].tr.total ? ["Four slopes, A to B.", "Which bead wins?"] : ["Not the straight one.", "The cycloid."], 540, 170, 76, C.text, 1);
    D.text(ctx, "no friction · " + S1_SLOW + "× slower", 540, 1820, 30, C.dim, 600);
  }
  function s2(ctx, t) {
    const round = t < 16 ? 0 : 1, tt = Math.max(0, (t - (round ? 18 : 4)) / S1_SLOW); bowlScene(ctx, tt, 540, 1250, 300, 1);
    D.lines(ctx, ["Three beads,", "three heights."], 540, 170, 80, C.text, 1);
    D.text(ctx, tt < T_TAUTO ? "Which one reaches the bottom first?" : "All at the same moment: " + T_TAUTO.toFixed(3) + " s", 540, 400, 40, tt < T_TAUTO ? C.text : "#FFBD38", 700);
    D.text(ctx, "cycloid bowl · no friction · " + S1_SLOW + "× slower", 540, 1520, 30, C.dim, 600);
  }
  const timelines = [
    { id: "full", name: "11 Brachistochrone (long)", file: "Command Loom - 11 Brachistochrone.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Which slope is fastest", file: "Command Loom - Short 1 - Which Slope Wins.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .06 * t / 30), voice: "glass", events: () => raceNotes(S1_0, S1_SLOW) },
    { id: "s2", name: "Short 2 · Same moment", file: "Command Loom - Short 2 - Same Moment.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .06 * t / 30), voice: "glass",
      events: () => [4, 18].flatMap((t0) => [{ t: t0, k: 5, gain: .5 }, ...[2, 7, 12].map((k) => ({ t: t0 + T_TAUTO * S1_SLOW, k, gain: .65 }))]) }
  ];
  root.CLVideo = { title: "Command Loom · 11 Brachistochrone", timelines };
  root.BrachVideo = { S, B, CURVES, ORDER, DIP, BOWL, T_TAUTO, timelines };
})(typeof window !== "undefined" ? window : globalThis);
