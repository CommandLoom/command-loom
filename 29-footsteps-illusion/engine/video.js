// 29 Footsteps Illusion: the long video (1:40, 16:9) and two Shorts.  Blocks slide over black and white stripes at one constant
// speed, yet seem to walk in steps.  Every knock in the sound is one such "step": the moment a block's edges move onto the stripes
// that give them strong contrast (steps.js).  Scenes: two blocks walking, the stripes taken away, why it happens, thin and wide
// stripes, and a six-block race that ends in a tie.
(function (root) {
  "use strict";
  const D = root.CLDraw, F = root.Footsteps, FPS = 30;
  const C = { bg: "#0B0D12", text: "#F5F3EF", dim: "#A9B2C2", ink: "#0A0A12", amber: "#FFBD38", green: "#3BD07A", red: "#FF5A5A",
    yellow: "#FFD21F", navy: "#1B2A8C" };
  const RACE_COLORS = [["#FFD21F", true], ["#1B2A8C", false], ["#7FE3FF", true], ["#8C1B1B", false], ["#FF9BD2", true], ["#145C2E", false]];
  function box(ctx, lines, x, y, px, align = "center", bg = "rgba(255,255,255,.95)", fg = C.ink, a = 1) {   // text on a plate, readable over stripes
    if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${px}px ${D.FONT}`;
    const w = Math.max(...lines.map((s) => ctx.measureText(s).width)) + px * 1.1, h = lines.length * px * 1.2 + px * .5, x0 = align === "center" ? x - w / 2 : x;
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x0, y - px * .85, w, h, px * .3); ctx.fill(); ctx.restore();
    lines.forEach((s, i) => D.text(ctx, s, align === "center" ? x : x + px * .55, y + i * px * 1.2, px, fg, 700, align === "center" ? "center" : "left", a));
  }
  const fadeAt = (t, a, b, c, d) => t < a ? 0 : t < b ? D.smooth((t - a) / (b - a)) : t < c ? 1 : t < d ? 1 - D.smooth((t - c) / (d - c)) : 0;   // stripes → grey → stripes

  // ================= long video (1920×1080) =================
  const LW = 1920, LH = 1080;
  // scenes A–C: two blocks side by side over one big stripe field
  const P2 = 64, V2 = 128, field = { x: 0, y: 0, len: LW, thick: LH, dir: "h", P: P2, off: 0, v: V2, s0: 0, w: 256, bh: 0, light: true, wrap: true, color: "#000" };
  const YEL = { ...field, y: 340, thick: 200, bh: 96, s0: 160, color: C.yellow, light: true }, NAV = { ...YEL, y: 540, color: C.navy, light: false };
  // scene D: three stripe widths, same speed
  const THREE = [32, 64, 128].map((P, i) => ({ x: 0, y: 260 + i * 255, len: LW, thick: 165, dir: "h", P, off: 0, v: V2, s0: 160, w: 256, bh: 96, color: C.yellow, light: true, wrap: true }));
  // scene E: six-block race, stripe phases staggered so the blocks step at different moments
  const RP = 48, RW = 144, RSTART = 77, RFIN = 1500;
  const RACE = RACE_COLORS.map(([color, light], i) => ({ x: 160, y: 200 + i * 118, len: 1600, thick: 108, dir: "h", P: RP, off: (i * 5 * RP / 12) % RP, v: 80, s0: 0, w: RW, bh: 76, color, light, wrap: true }));
  const raceT = (t) => Math.max(0, t - RSTART), RACE_END = RSTART + (RFIN - RW) / 80;   // all six fronts reach the finish line at this moment
  const SCENES = [{ t0: 0, t1: 20, name: "Two blocks" }, { t0: 20, t1: 40, name: "Take the stripes away" }, { t0: 40, t1: 60, name: "Why they seem to step" },
    { t0: 60, t1: 75, name: "Thin and wide stripes" }, { t0: 75, t1: 100, name: "Six blocks, one race" }];
  const sceneAt = (t) => SCENES.findIndex((s) => t < s.t1) < 0 ? SCENES.length - 1 : SCENES.findIndex((s) => t < s.t1);
  const fadeB = (t) => fadeAt(t, 22, 24, 33, 35), fadeE = (t) => fadeAt(t, RACE_END + .2, RACE_END + 1.7, 1e9, 1e9);
  function edgeMarks(ctx, L, t) {                              // scene C: a mark at both edges, green for strong contrast, red for weak
    const [x, y, w, h] = F.blockRect(L, t), st = F.strong(L, t), col = st ? C.green : C.red;
    ctx.fillStyle = col; for (const ex of [x, x + w]) { ctx.beginPath(); ctx.moveTo(ex - 14, y - 26); ctx.lineTo(ex + 14, y - 26); ctx.lineTo(ex, y - 6); ctx.fill(); ctx.fillRect(ex - 3, y + h + 6, 6, 22); }
    box(ctx, [st ? "strong contrast: looks fast" : "weak contrast: looks slow"], Math.max(250, Math.min(LW - 250, x + w / 2)), L.light ? y - 52 : y + h + 66, 28, "center", "rgba(11,13,18,.88)", col);
  }
  function drawLong(ctx, t) {
    const k = sceneAt(t), sc = SCENES[k]; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, LW, LH);
    if (k <= 2) { const fd = k === 1 ? fadeB(t) : 0; F.drawLane(ctx, field, t, fd, { noBlock: true }); F.drawLane(ctx, YEL, t, fd); F.drawLane(ctx, NAV, t, fd);
      if (k === 0) box(ctx, ["Watch the two blocks walk."], LW / 2, 140, 54);
      if (k === 1) { box(ctx, [t < 22 ? "Now take the stripes away." : t < 33 ? "Same speed, every moment." : "Stripes back: they walk again."], LW / 2, 140, 54);
        if (fd > .5) for (const L of [YEL, NAV]) { const [x, y, w, h] = F.blockRect(L, t);                // a ruler: where the front edge was every half second
          for (let j = 0; j <= 6; j++) { const xx = x + w - j * L.v / 2; ctx.fillStyle = `rgba(11,13,18,${.85 - j * .1})`; ctx.fillRect(xx - 2, y + h + 8, 4, 26); }
          box(ctx, [`${L.v} px per second, all the time`], LW / 2, L === YEL ? 300 : 840, 30, "center", "rgba(11,13,18,.85)", C.text, fd); } }
      if (k === 2) { box(ctx, ["Why? Contrast at the edges."], LW / 2, 140, 54); edgeMarks(ctx, YEL, t); edgeMarks(ctx, NAV, t);
        box(ctx, t < 50 ? ["Yellow edges on black: strong contrast, they look fast. On white: weak, they look slow."] : ["Dark blue is the other way round, so the two take turns: one steps while the other waits."], LW / 2, 905, 32, "center", "rgba(11,13,18,.88)", C.text); } }
    else if (k === 3) { THREE.forEach((L) => F.drawLane(ctx, L, t)); box(ctx, ["Thin stripes, wide stripes. One speed."], LW / 2, 110, 50);
      ["16 px stripes: quick little steps", "32 px stripes", "64 px stripes: long, slow strides"].forEach((s, i) => box(ctx, [s], 40, THREE[i].y - 34, 28, "left", "rgba(11,13,18,.88)", C.text)); }
    else { const tr = raceT(t), fd = fadeE(t); for (const L of RACE) { F.drawLane(ctx, L, tr, fd); }
      ctx.fillStyle = C.red; ctx.fillRect(160 + RFIN - 3, 190, 6, 6 * 118 + 4); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(157, 190, 6, 6 * 118 + 4);
      box(ctx, [t < RACE_END ? "Six blocks, one speed. Who wins?" : "A tie. They were never apart."], LW / 2, 110, 50);
      D.text(ctx, "FINISH", 160 + RFIN, 172, 26, C.red, 800); }
    ctx.fillStyle = "rgba(11,13,18,.9)"; ctx.fillRect(0, LH - 64, LW, 64);
    D.text(ctx, "the footsteps illusion (Stuart Anstis, 2003) · every block moves at one constant speed · each note is one “step”", LW / 2, LH - 32, 26, C.dim, 600);
  }
  // sound: every step of every block is a marimba note (light blocks higher, dark blocks lower); with the stripes gone the steps fade and
  // even glass ticks (one every half second, like the ruler) take over
  function stepEvents(L, t0, t1, k, side, gain, tShift = 0, fadeFn = () => 0) {
    return F.steps(L, t0 - tShift, t1 - tShift).map((s) => ({ t: s + tShift, k, voice: "marimba", side, gain: gain * (1 - fadeFn(s + tShift)) })).filter((e) => e.gain > .03);
  }
  function longEvents() {
    let ev = [...stepEvents(YEL, 0, 60, 10, -.25, .6, 0, fadeB), ...stepEvents(NAV, 0, 60, 5, .25, .6, 0, fadeB)];
    for (let t = 22.5; t < 34.6; t += .5) ev.push({ t, k: 12, voice: "glass", gain: .35 * fadeB(t) + .05 });
    THREE.forEach((L, i) => ev.push(...stepEvents(L, 60, 75, [13, 9, 5][i], [-.4, 0, .4][i], .5)));
    RACE.forEach((L, i) => ev.push(...stepEvents(L, RSTART, 100, L.light ? 9 + i : 3 + i, -.5 + i * .2, .45, RSTART, fadeE)));
    for (let t = 75; t < RSTART; t += .5) ev.push({ t, k: 7, voice: "glass", gain: .25 });              // the start, before the blocks move
    [0, 4, 7].forEach((kk, i) => ev.push({ t: RACE_END + i * .12, k: 7 + kk, voice: "glass", gain: .45 }));
    for (let t = RACE_END + 1; t < 99.4; t += .5) ev.push({ t, k: 12, voice: "glass", gain: .3 });
    return ev.filter((e) => e.t < 99.4).sort((a, b) => a.t - b.t);
  }

  // ================= Shorts (1080×1920) =================
  const SW = 1080, SH = 1920;
  // Short 1: two big blocks, the stripes leave and come back
  const S1F = { x: 0, y: 0, len: SW, thick: SH, dir: "h", P: 80, off: 0, v: 160, s0: 0, w: 320, bh: 0, light: true, wrap: true, color: "#000" };
  const S1Y = { ...S1F, y: 760, thick: 200, bh: 130, s0: 120, color: C.yellow, light: true }, S1N = { ...S1Y, y: 980, color: C.navy, light: false };
  const fadeS1 = (t) => fadeAt(t, 15, 17, 24, 26);
  function drawS1(ctx, t) {
    const fd = fadeS1(t); F.drawLane(ctx, S1F, t, fd, { noBlock: true }); F.drawLane(ctx, S1Y, t, fd); F.drawLane(ctx, S1N, t, fd);
    box(ctx, t < 15 ? ["Watch them walk."] : t < 17 ? ["Now, no stripes:"] : t < 24 ? ["They never change speed."] : ["The stripes make them step."], SW / 2, 300, 66);
    if (fd > .5) box(ctx, ["160 px per second, all the time"], SW / 2, 1300, 38, "center", "rgba(11,13,18,.85)", C.text, fd);
    ctx.fillStyle = "rgba(11,13,18,.9)"; ctx.fillRect(0, 1640, SW, 110); D.text(ctx, "the footsteps illusion (Stuart Anstis, 2003)", SW / 2, 1695, 32, C.dim, 600);
  }
  function eventsS1() {
    const ev = [...stepEvents(S1Y, 0, 30, 10, -.25, .6, 0, fadeS1), ...stepEvents(S1N, 0, 30, 5, .25, .6, 0, fadeS1)];
    for (let t = 15.5; t < 25.6; t += .5) ev.push({ t, k: 12, voice: "glass", gain: .35 * fadeS1(t) + .05 });
    return ev.filter((e) => e.t < 29.4).sort((a, b) => a.t - b.t);
  }
  // Short 2: a six-block race upwards, in columns (kept left of the Shorts buttons)
  const S2P = 48, S2W = 144, S2START = 2, S2FIN = 1250;
  const S2 = RACE_COLORS.map(([color, light], i) => ({ x: 40 + i * 152, y: 400, len: 1380, thick: 140, dir: "v", P: S2P, off: (i * 5 * S2P / 12) % S2P, v: 48, s0: 0, w: S2W, bh: 104, color, light, wrap: true }));
  const S2END = S2START + (S2FIN - S2W) / 48, fadeS2 = (t) => fadeAt(t, S2END + .2, S2END + 1.7, 1e9, 1e9);
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, SW, SH); const tr = Math.max(0, t - S2START), fd = fadeS2(t);
    for (const L of S2) F.drawLane(ctx, L, tr, fd);
    const fy = 400 + 1380 - S2FIN; ctx.fillStyle = C.red; ctx.fillRect(36, fy - 3, 6 * 152 - 4, 6); box(ctx, ["FINISH"], 40 + 3 * 152 - 6, fy - 30, 30, "center", "rgba(11,13,18,.92)", C.red);
    box(ctx, t < S2END ? ["Six blocks. One speed.", "Who wins?"] : ["A tie.", "They were never apart."], SW / 2, 175, 62);
    ctx.fillStyle = "rgba(11,13,18,.9)"; ctx.fillRect(0, 1790, SW, 90); D.text(ctx, "the footsteps illusion (Stuart Anstis, 2003)", SW / 2, 1835, 30, C.dim, 600);
  }
  function eventsS2() {
    const ev = []; S2.forEach((L, i) => ev.push(...stepEvents(L, S2START, 30, L.light ? 9 + i : 3 + i, -.5 + i * .2, .45, S2START, fadeS2)));
    for (let t = 0; t < S2START; t += .5) ev.push({ t, k: 7, voice: "glass", gain: .25 });
    [0, 4, 7].forEach((kk, i) => ev.push({ t: S2END + i * .12, k: 7 + kk, voice: "glass", gain: .45 }));
    for (let t = S2END + 1; t < 29.4; t += .5) ev.push({ t, k: 12, voice: "glass", gain: .3 });
    return ev.filter((e) => e.t < 29.4).sort((a, b) => a.t - b.t);
  }
  const timelines = [
    { id: "full", name: "29 Footsteps Illusion (long)", file: "Command Loom - 29 Footsteps Illusion.mp4", W: LW, H: LH, dur: 100, draw: drawLong, events: longEvents, voice: "wood" },
    { id: "s1", name: "Short 1 · They Never Change Speed", file: "Command Loom - Short 1 - They Never Change Speed.mp4", W: SW, H: SH, dur: 30, draw: drawS1, events: eventsS1, voice: "wood" },
    { id: "s2", name: "Short 2 · Six Blocks One Speed", file: "Command Loom - Short 2 - Six Blocks One Speed.mp4", W: SW, H: SH, dur: 30, draw: drawS2, events: eventsS2, voice: "wood" }];
  root.CLVideo = { title: "Command Loom · 29 Footsteps Illusion", timelines };
  root.FootVideo = { timelines, SCENES, YEL, NAV, THREE, RACE, RACE_END, RSTART, RFIN, S1Y, S1N, S2, S2END, S2START, S2FIN, fadeB, fadeS1 };
})(typeof window !== "undefined" ? window : globalThis);
