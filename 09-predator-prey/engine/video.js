// 09 Predator Prey: the Wa-Tor ocean (wator.js), full screen. Every cell and count is the simulation at that step, and the music is
// the populations themselves: the melody follows the number of fish, the bass follows the number of sharks.
(function (root) {
  "use strict";
  const WT = root.WaTor, D = root.CLDraw, FPS = 30;
  const C = { bg: "#03070D", water: [4, 8, 20], fish: [22, 110, 175], shark: [255, 160, 50], fishText: [90, 200, 255], text: "#F5F3EF", dim: "#9AA6B8" };
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const P = { fishBreed: 5, sharkBreed: 10, sharkStart: 5, eatGain: 3 }, SEED = 7, CH_PER_S = 15;
  const OCEANS = { wide: [160, 90, 1500], tall: [90, 160, 1000] };
  const make = (k) => () => new WT.Ocean(OCEANS[k][0], OCEANS[k][1], P, SEED);
  function runner(k) { let o = null; return (c) => { if (!o || o.t > c) o = make(k)(); o.step(c - o.t); return o; }; }
  const oceanAt = { wide: runner("wide"), tall: runner("tall") };
  const HIST = {};
  const ready = (async () => { for (const k of Object.keys(OCEANS)) { const o = make(k)(); o.step(OCEANS[k][2]); HIST[k] = o.history; } })();
  const cvs = {};
  // the ocean drawn smooth (cells blended), so schools of fish and packs of sharks read as moving shapes
  function ocean(ctx, o, x, y, w, h) {
    const W = o.W, H = o.H, id = W + "x" + H, c = cvs[id] || (cvs[id] = document.createElement("canvas")); c.width = W; c.height = H;
    const g = c.getContext("2d"), img = g.createImageData(W, H), px = img.data;
    for (let i = 0; i < W * H; i++) { const col = o.kind[i] === WT.FISH ? C.fish : o.kind[i] === WT.SHARK ? C.shark : C.water; px[i * 4] = col[0]; px[i * 4 + 1] = col[1]; px[i * 4 + 2] = col[2]; px[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0); ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(c, x, y, w, h); ctx.restore();
  }
  // a slim strip of the population history (fish cyan, sharks orange), each scaled to its own maximum
  function strip(ctx, hist, upto, x, y, w, h, span) {
    const from = Math.max(0, upto - span), mf = Math.max(...hist.map((q) => q[0])), ms = Math.max(...hist.map((q) => q[1]));
    ctx.save(); ctx.fillStyle = "rgba(3,7,13,.6)"; ctx.fillRect(x, y, w, h);
    for (const [idx, col, mx] of [[0, C.fishText, mf], [1, C.shark, ms]]) { ctx.strokeStyle = css(col); ctx.lineWidth = 3; ctx.beginPath();
      for (let c = from; c <= upto; c++) { const px = x + (c - from) / span * w, py = y + h - 6 - hist[c][idx] / mx * (h - 12); c === from ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke(); }
    ctx.restore();
  }
  function phase(hist, c) {
    if (c < 30) return "";
    const n = hist.length - 1, df = hist[Math.min(c + 8, n)][0] - hist[Math.max(0, c - 8)][0], ds = hist[Math.min(c + 8, n)][1] - hist[Math.max(0, c - 8)][1];
    if (df > 0 && ds <= 0) return "Few sharks: the fish multiply.";
    if (df > 0 && ds > 0) return "Plenty of fish: the sharks multiply.";
    if (df <= 0 && ds > 0) return "Too many sharks: the fish crash.";
    return "No fish left: the sharks starve.";
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["run", 4, 94], ["close", 94, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const HOOK0 = 520, chAt = (t) => t < 4 ? HOOK0 + Math.floor(t * CH_PER_S) : Math.min(OCEANS.wide[2], Math.floor((t - 4) * CH_PER_S));
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), c = chAt(t), o = oceanAt.wide(c), h = HIST.wide, [nf, ns] = h[c];
    ocean(ctx, o, 0, 0, W, H); D.topShade(ctx, W, 200);
    ctx.save(); ctx.fillStyle = "rgba(3,7,13,.72)"; ctx.fillRect(30, 930, 360, 130); ctx.fillRect(1530, 930, 360, 130); ctx.restore();
    D.text(ctx, nf.toLocaleString("en-US"), 60, 980, 64, css(C.fishText), 700, "left"); D.text(ctx, "fish", 60, 1030, 28, C.text, 600, "left");
    D.text(ctx, ns.toLocaleString("en-US"), 1860, 980, 64, css(C.shark), 700, "right"); D.text(ctx, "sharks", 1860, 1030, 28, C.text, 600, "right");
    strip(ctx, h, c, 460, 950, 1000, 100, 360);
    if (sc.id === "hook") { D.text(ctx, "Fish, sharks, and a cycle that never ends.", W / 2, 80, 62, C.text, 700); return; }
    if (sc.id === "close") { D.text(ctx, "Nobody controls it. The cycle comes from the rules.", W / 2, 80, 56, C.text, 700, "center", D.fade(t, sc.t0, sc.t1)); return; }
    const intro = D.clamp(1 - Math.max(0, t - 9) / .8);
    if (intro > 0) D.text(ctx, "Fish multiply. Sharks eat fish. That's all.", W / 2, 80, 58, C.text, 700, "center", intro);
    else D.text(ctx, phase(h, c), W / 2, 80, 52, C.text, 700, "center");
    D.speed(ctx, CH_PER_S + " STEPS PER SECOND", W, 1, 150);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => 1.02 + .02 * Math.sin(t / 15));

  // ---------- music from the populations ----------
  // every 2 steps a marimba note around a pitch that follows the fish count (a little up-and-down figure on top); every 6 steps a low bell whose pitch follows the shark count.
  // Notes come from a C major pentatonic scale, so any two of them sound together.
  const PENTA = [0, 2, 4, 7, 9], ARP = [0, 2, 4, 2];            // a small rising-and-falling figure around the note the fish choose
  const scale = (i) => 48 + 12 * Math.floor(i / 5) + PENTA[((i % 5) + 5) % 5];
  function music(hist, from, to, t0, gain = 1) {
    const ev = [], mf = Math.max(...hist.map((q) => q[0])), ms = Math.max(...hist.map((q) => q[1]));
    for (let c = from; c < to; c++) { const t = t0 + (c - from) / CH_PER_S;
      if (c % 2 === 0) { const base = 5 + Math.round(hist[c][0] / mf * 12); ev.push({ t, midi: scale(base + ARP[(c / 2) % 4]), base, gain: gain * .5, side: -.2 }); }
      if (c % 6 === 0) ev.push({ t, midi: scale(Math.round(hist[c][1] / ms * 7)) - 12, gain: gain * .7, side: .25, voice: "bell" }); }
    return ev; }
  const fullEvents = () => [...music(HIST.wide, HOOK0, HOOK0 + 60, 0), ...music(HIST.wide, 0, Math.floor(95.4 * CH_PER_S) - 60, 4)].filter((e) => e.t < 99.4);

  // ---------- Shorts ----------
  function vert(ctx, c, title, hist) { const o = oceanAt.tall(c), [nf, ns] = hist[c]; ocean(ctx, o, 0, 0, 1080, 1920); D.topShade(ctx, 1080, 420);
    D.lines(ctx, title, 540, 150, 76, C.text, 1); D.text(ctx, phase(hist, c), 540, 330, 40, C.text, 600);
    ctx.save(); ctx.fillStyle = "rgba(3,7,13,.72)"; ctx.fillRect(40, 1650, 1000, 220); ctx.restore();
    D.text(ctx, nf.toLocaleString("en-US") + " fish", 80, 1700, 56, css(C.fishText), 700, "left"); D.text(ctx, ns.toLocaleString("en-US") + " sharks", 1000, 1700, 56, css(C.shark), 700, "right");
    strip(ctx, hist, c, 80, 1740, 920, 110, 300); }
  const s1 = (ctx, t) => vert(ctx, Math.min(OCEANS.tall[2], Math.floor(t * CH_PER_S)), ["Sharks eat fish.", "Then what?"], HIST.tall);
  const s2 = (ctx, t) => vert(ctx, Math.min(OCEANS.tall[2], 480 + Math.floor(t * CH_PER_S)), ["Wave after wave."], HIST.tall);
  const timelines = [
    { id: "full", name: "09 Predator Prey (long)", file: "Command Loom - 09 Predator Prey.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Sharks eat fish. Then what?", file: "Command Loom - Short 1 - Sharks and Fish.mp4", W: 1080, H: 1920, dur: 32, draw: zoomWrap(s1, 1080, 1920, (t) => 1.02 + .02 * t / 32), voice: "marimba",
      events: () => music(HIST.tall, 0, 31.4 * CH_PER_S, 0) },
    { id: "s2", name: "Short 2 · Wave after wave", file: "Command Loom - Short 2 - Wave After Wave.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1.02 + .02 * t / 30), voice: "marimba",
      events: () => music(HIST.tall, 480, 480 + 29.4 * CH_PER_S, 0) }
  ];
  root.CLVideo = { title: "Command Loom · 09 Predator Prey", timelines, ready };
  root.PredVideo = { S, P, OCEANS, SEED, CH_PER_S, HIST, timelines, ready, phase, music };
})(typeof window !== "undefined" ? window : globalThis);
