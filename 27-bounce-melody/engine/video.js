// 27 Bounce Melody: a ball bouncing inside a ring; every bounce plays the next note of a public-domain melody (ring.js).
// Game rule shown on screen: the ball gets a little faster after each bounce, so the tune speeds up on its own.
(function (root) {
  "use strict";
  const RG = root.Ring, D = root.CLDraw, FPS = 30, M = RG.MELODIES, BALL = 0.06, RC = 1 - BALL;
  const C = { bg: "#05050B", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  const DEG = Math.PI / 180;
  // song plan: melody, angle step between bounces, first gap (s), length (s), hue offset
  const PLAN = { king: { step: 137.508 * DEG, g0: .75, hue: .02 }, joy: { step: 144.3 * DEG, g0: .8, hue: .55 }, elise: { step: 100.7 * DEG, g0: .9, hue: .8 } };
  const cache = {};
  function song(key, dur) { const k = key + dur; if (cache[k]) return cache[k]; const p = PLAN[key], n = M[key].notes.length, q = RG.gainFor(n, dur, p.g0), v0 = 2 * RC * Math.sin(p.step / 2) / p.g0;
    return (cache[k] = { key, n, q, H: RG.run(RC, p.step, -Math.PI / 2, v0, q, n), dur, ...p, ...M[key] }); }
  // ---------- schedules ----------
  const S = [["hook", 0, 4], ["king", 4, 36], ["joy", 36, 64], ["elise", 64, 86], ["close", 86, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const SONG_LEN = { king: 28, joy: 24, elise: 18 };
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  // ---------- drawing ----------
  const hsl = (h, l, a) => `hsla(${Math.round(((h % 1) + 1) % 1 * 360)},95%,${l}%,${a})`;
  function ringScene(ctx, sg, t, cx, cy, s, k, rot = 0) {
    const H = sg.H, last = H[H.length - 1].t, i = Math.min(RG.idx(H, t), H.length - 1), p = RG.pos(H, Math.min(t, last));
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const hue = sg.hue + .4 * Math.min(1, i / sg.n);
    ctx.strokeStyle = hsl(hue, 70, .95); ctx.lineWidth = 5 * k; ctx.shadowColor = hsl(hue, 60, 1); ctx.shadowBlur = 22 * k; ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (let j = 1; j <= i; j++) { const a = H[j - 1], b = H[j], rec = i - j; ctx.strokeStyle = hsl(sg.hue + .4 * j / sg.n, 60, rec < 1 ? .9 : .28); ctx.lineWidth = (rec < 1 ? 3 : 1.6) * k;
      ctx.beginPath(); ctx.moveTo(a.x * s, -a.y * s); ctx.lineTo(b.x * s, -b.y * s); ctx.stroke(); }
    if (t < last) { const a = H[i]; ctx.strokeStyle = hsl(hue, 75, .95); ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(a.x * s, -a.y * s); ctx.lineTo(p[0] * s, -p[1] * s); ctx.stroke(); }
    for (let j = Math.max(1, i - 3); j <= i; j++) { const age = t - H[j].t; if (age < 0 || age > .35) continue;     // ripple where the ball just hit
      ctx.strokeStyle = hsl(hue, 80, .9 * (1 - age / .35)); ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(H[j].x * s, -H[j].y * s, (BALL + age * .9) * s, 0, 7); ctx.stroke(); }
    ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 18 * k; ctx.beginPath(); ctx.arc(p[0] * s, -p[1] * s, BALL * s, 0, 7); ctx.fill();
    ctx.restore();
    return Math.min(i, sg.n);
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const speedText = (sg, i) => `note ${i} / ${sg.n} · speed ×${Math.pow(sg.q, i).toFixed(1)}`;
  function songPanel(ctx, sg, u, W, cx, cy, s, k, top, foot) {
    const i = ringScene(ctx, sg, u, cx, cy, s, k), done = u >= sg.H[sg.n].t + .25, f = D.clamp((u - sg.H[sg.n].t - .25) / .5);
    if (!done) { D.text(ctx, "GUESS THE SONG", W / 2, top, 64 * k, C.text, 700); D.text(ctx, speedText(sg, i), W / 2, top + 66 * k, 32 * k, C.amber, 600); }
    else { D.text(ctx, sg.title, W / 2, top, 58 * k, C.amber, 700, "center", f); D.text(ctx, sg.by + " · public domain", W / 2, top + 64 * k, 32 * k, C.text, 600, "center", f); }
    D.text(ctx, foot, W / 2, foot === "" ? 0 : (k > 1 ? 1700 : 1050), 24 * k, C.dim, 500);
    return i; }
  const RULE = "every bounce plays the next note · rule: the ball gets slightly faster after each bounce";

  // ---------- long video ----------
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const sg = song("king", SONG_LEN.king); ringScene(ctx, sg, sg.H[sg.n].t - 4.2 + u, 960, 600, 410, 1);
      D.text(ctx, "Every bounce plays the next note.", W / 2, 72, 60, C.text, 700); D.text(ctx, "Can you name the song?", W / 2, 140, 38, C.amber, 700); return; }
    if (sc.id === "close") { ["king", "joy", "elise"].forEach((key, j) => { const sg = song(key, SONG_LEN[key]); ringScene(ctx, sg, sg.dur + 5, 400 + 560 * j, 560, 230, .7, .15 * u * (j % 2 ? -1 : 1));
        D.text(ctx, sg.title, 400 + 560 * j, 850, 32, C.amber, 700, "center", f); D.text(ctx, sg.by, 400 + 560 * j, 895, 24, C.text, 600, "center", f); });
      D.text(ctx, "Three songs, one ball, one ring.", W / 2, 72, 56, C.text, 700, "center", f); D.text(ctx, RULE, W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    songPanel(ctx, song(sc.id, SONG_LEN[sc.id]), u, W, 960, 600, 410, 1, 72, RULE);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .03 * (t - sc.t0) / (sc.t1 - sc.t0); });

  // ---------- sound: the melody note at every bounce; a soft bell chord when the title appears ----------
  function notes(sg, t0, a = 0, b = Infinity, voice = "marimba") { const ev = []; for (let j = 1; j <= sg.n; j++) { const tt = sg.H[j].t; if (tt >= a && tt < b) ev.push({ t: t0 + tt - a, midi: sg.notes[j - 1], k: (sg.notes[j - 1] - 52) % 16, gain: .9, voice }); } return ev; }
  const reveal = (sg, t0) => [{ t: t0 + sg.H[sg.n].t + .3, midi: sg.notes[sg.n - 1] - 12, k: 3, gain: .7, voice: "bell" }, { t: t0 + sg.H[sg.n].t + .3, midi: sg.notes[sg.n - 1] - 5, k: 8, gain: .5, voice: "bell" }];
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), king = song("king", SONG_LEN.king), ev = [...notes(king, 0, king.H[king.n].t - 4.2, king.H[king.n].t - .25)];
    for (const key of ["king", "joy", "elise"]) { const sg = song(key, SONG_LEN[key]); ev.push(...notes(sg, s[key].t0), ...reveal(sg, s[key].t0)); }
    ev.push({ t: s.close.t0 + .4, midi: 57, k: 5, gain: .6, voice: "bell" }, { t: s.close.t0 + .4, midi: 64, k: 9, gain: .5, voice: "bell" });
    return ev.filter((e) => e.t >= 0 && e.t < 99.4); }

  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  const short = (key) => (ctx, t) => { const sg = song(key, 26); songPanel(ctx, sg, Math.max(0, t - .3), VW, 540, 1050, 470, 1.15, 230, "every bounce = next note · ball speeds up after each bounce"); };
  const timelines = [
    { id: "full", name: "27 Bounce Melody (long)", file: "Command Loom - 27 Bounce Melody.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Guess the song (Grieg)", file: "Command Loom - Short 1 - Guess the Song.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(short("king"), VW, VH, (t) => 1 + .04 * t / 30), voice: "marimba",
      events: () => { const sg = song("king", 26); return [...notes(sg, .3), ...reveal(sg, .3)].filter((e) => e.t < 29.4); } },
    { id: "s2", name: "Short 2 · Guess the song (Beethoven)", file: "Command Loom - Short 2 - Guess This One.mp4", W: VW, H: VH, dur: 30, draw: zoomWrap(short("joy"), VW, VH, (t) => 1 + .04 * t / 30), voice: "marimba",
      events: () => { const sg = song("joy", 26); return [...notes(sg, .3), ...reveal(sg, .3)].filter((e) => e.t < 29.4); } }
  ];
  root.CLVideo = { title: "Command Loom · 27 Bounce Melody", timelines, ready: Promise.resolve() };
  root.MelodyVideo = { S, song, SONG_LEN, timelines, RC };
})(typeof window !== "undefined" ? window : globalThis);
