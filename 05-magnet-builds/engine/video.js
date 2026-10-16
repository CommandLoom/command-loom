// 05 Magnet Builds: timelines built from the stage's own choreography lengths; every click sound is a snap event of the stage.
(function (root) {
  "use strict";
  const D = root.CLDraw, FPS = 30, INK = "#1B1E22";
  let stage = null;
  const LONG = ["cube", "octa", "sierpinski", "icosa", "snail", "dodeca"];
  const SHORTS = [["icosa", "Short 1 · Icosahedron", "Command Loom - Short 1 - Icosahedron.mp4"],
                  ["snail", "Short 2 · Snail", "Command Loom - Short 2 - Snail.mp4"],
                  ["hanging", "Short 3 · Hanging octahedron", "Command Loom - Short 3 - Hanging Octahedron.mp4"]];
  const info = {};                                    // shape -> {total, en, balls, rods, pieces, events:[...] at speed 1}
  const r30 = (x) => Math.round(x * FPS) / FPS, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- deterministic state: rebuild and step frame by frame (exactly like the export loop) ----------
  const run = { key: null, f: -1 };
  function stateAt(seg, W, H, frame) {
    const key = seg.shape + "@" + seg.speed + "@" + W + "x" + H;
    if (run.key !== key || frame < run.f) { stage.size(W, H); stage.setSpeed(seg.speed); stage.reset(seg.shape); stage.updateCam(1 / FPS); run.key = key; run.f = 0; }
    while (run.f < frame) { stage.advance(seg.speed / FPS); stage.updateCam(1 / FPS); run.f++; }
  }
  function ink(ctx, s, x, y, px, a = 1, w = 700, align = "center", color = INK) {
    if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = w + " " + px + "px " + D.FONT; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,255,255,.85)"; ctx.shadowBlur = px * .35; ctx.fillText(s, x, y); ctx.restore();
  }

  function makeTimeline(id, name, file, W, H, segsSpec, extra) {
    const segs = []; let t = 0;
    for (const s of segsSpec) { const i = info[s.shape], dur = s.dur ?? r30(i.total / s.speed + .4); segs.push({ ...s, start: t, dur, end: t + dur, info: i }); t += dur; }
    const vertical = H > W, k = vertical ? 1.15 : 1;
    function draw(ctx, tt) {
      const seg = segs.find((s) => tt < s.end - 1e-9) || segs[segs.length - 1], u = tt - seg.start, frame = (seg.offset || 0) + Math.round(u * FPS);
      stateAt(seg, W, H, frame); ctx.drawImage(stage.render(), 0, 0, W, H);
      const i = seg.info, lt = frame / FPS, fin = stage.finishedAt >= 0 ? stage.finishedAt / seg.speed : 1e9;
      const intro = D.clamp((3.0 - lt) / .5), outro = D.clamp((lt - fin - .6) / .8), big = Math.max(intro, outro), corner = 1 - big;
      const y0 = vertical ? 170 : 92;
      if (seg.hook) { ink(ctx, extra.hookTitle, W / 2, y0, 72 * k); ink(ctx, "Later in this video", W / 2, y0 + 70 * k, 34 * k, 1, 600, "center", "#B4541C"); return; }
      if (big > .01) { ink(ctx, i.en.toUpperCase(), W / 2, y0, 80 * k, big); ink(ctx, (outro > 0 ? "built piece by piece · " : "") + i.balls + " balls · " + i.rods + " rods", W / 2, y0 + 72 * k, 36 * k, big * .85, 500); }
      if (corner > .01) { ink(ctx, i.en.toUpperCase(), vertical ? W / 2 : 60, vertical ? 170 : 60, 34 * k, corner * .85, 700, vertical ? "center" : "left"); ink(ctx, "Piece " + stage.counts.step + " / " + i.pieces, vertical ? W / 2 : 60, vertical ? 218 : 102, 28 * k, corner * .7, 500, vertical ? "center" : "left"); }
      if (seg.first) ink(ctx, "Choreographed animation · buildable geometry", W / 2, vertical ? 300 : H - 60, 30 * k, D.fade(lt, .3, 6, .5), 500, "center", "#5F6670");
      if (seg.speed !== 1) ink(ctx, seg.speed.toFixed(1) + "× SPEED", vertical ? W / 2 : W - 50, vertical ? 360 : 44, 30 * k, .8, 600, vertical ? "center" : "right", "#B4541C");
      if (seg.last && outro > 0) ink(ctx, extra.closing, W / 2, vertical ? 420 : H - 70, 46 * k, outro, 700);
      if (!vertical) { const tot = i.total / seg.speed; ctx.fillStyle = "rgba(27,30,34,.12)"; ctx.fillRect(60, H - 22, W - 120, 3); ctx.fillStyle = "rgba(27,30,34,.55)"; ctx.fillRect(60, H - 22, (W - 120) * D.clamp(lt / tot), 3); }
    }
    function events() {
      const out = [];
      for (const s of segs) for (const e of s.info.events) {
        const v = e.t / s.speed - (s.offset || 0) / FPS; if (v < 0 || v >= s.dur) continue;
        out.push({ t: s.start + v, k: 3 + (e.step * 3) % 11, gain: .55 + .45 * e.vol, side: e.x * .6 });
      }
      return out;
    }
    return { id, name, file, W, H, dur: r30(t), draw, events, voice: "glass", segs };
  }

  async function ready() {
    stage = root.makeMagnetStage();
    for (const [name] of stage.SHAPES) {                         // choreography length and snap events at speed 1
      stage.size(1920, 1080); stage.setSpeed(1); stage.reset(name); stage.updateCam(1 / FPS);
      const total = stage.total, S = stage.S;
      for (let f = 0; f < Math.ceil(total * FPS) + 2; f++) { stage.advance(1 / FPS); stage.updateCam(1 / FPS); }
      info[name] = { total, en: S.en, balls: S.P.length, rods: S.nRods, pieces: stage.plan.length, events: stage.events.map((e) => ({ ...e })) };
    }
    run.key = null;
    const sp = (n, target) => Math.round(clamp(info[n].total / target, 1, 3.5) * 10) / 10;
    const longSegs = LONG.map((n, i) => ({ shape: n, speed: sp(n, 26), first: i === 0, last: i === LONG.length - 1 }));
    const d = info.dodeca, hs = sp("dodeca", 26), hookFrom = Math.round((d.total / hs - 3.6) * FPS);
    const full = makeTimeline("full", "05 Magnet Builds (long)", "Command Loom - 05 Magnet Builds.mp4", 1920, 1080,
      [{ shape: "dodeca", speed: hs, offset: hookFrom, dur: 3, hook: true }, ...longSegs], { hookTitle: "Six magnetic shapes. Click by click.", closing: "Six shapes. One rod length." });
    const shorts = SHORTS.map(([n, nm, file], i) => makeTimeline("s" + (i + 1), nm, file, 1080, 1920, [{ shape: n, speed: sp(n, 34), first: true, last: true }],
      { closing: n === "hanging" ? "Hanging by a single magnet." : "Built piece by piece." }));
    root.CLVideo.timelines.push(full, ...shorts);
    root.MagnetVideo = { info, full, shorts };
  }
  root.CLVideo = { title: "Command Loom · 05 Magnet Builds", timelines: [], ready: null };
  root.CLVideo.ready = ready();
})(window);
