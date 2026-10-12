// Video director: scene order, camera, on-screen text, metronome sound, live preview and frame-by-frame MP4.
(function (root) {
  const T = THREE, FPS = 30, OUT_W = 1920, OUT_H = 1080, SEEDS = window.SEEDS;
  const { makeSim } = window.MetroSim, { makeStage, makeRig } = window.MetroWorld;

  // ---------------- scenes (durations in video seconds; speed: simulated seconds per video second) ----------------
  // permanent sync moment (found by pick_seeds.js, checking every step): "In sync." appears here; scene lengths follow it
  const lockT = (k, speed) => SEEDS[k].stableFrom / speed;
  const SCENES = [
    { id: "open", name: "0 · Opening", worlds: [{ n: 100, key: "opening" }], speed: 1, dur: 15, cam: "open",
      texts: [[1, 6, "100 metronomes.", "title"], [7, 13, "Started at random.", "title"]] },
    { id: "two", name: "1 · Two metronomes", worlds: [{ n: 2, key: "two" }], speed: 1, dur: lockT("two", 1) + 9, cam: "two", hud: "pair",
      texts: [[0.8, 4.8, "Two metronomes."], [6, 11, "Same tempo. Different start."], [14, 20, "No motor. No signal. No connection."], [23, 28.5, "…or is there?"],
        [33, 39, "Listen to the clicks."], [42, 48, "Two clicks, slowly becoming one."], ["lock", "end", "In sync."]] },
    { id: "split", name: "2 · Fixed / free board", worlds: [{ n: 2, key: "split", fixed: true, label: "FIXED BOARD" }, { n: 2, key: "split", label: "FREE BOARD" }],
      speed: 1, dur: lockT("split", 1) + 9, cam: "split", hud: "pair", magnify: 20,
      texts: [[1, 6.5, "Same start. One difference."], [13, 19, "Every swing nudges the board."], [21, 27, "The board nudges back."],
        [32, 38, "It moves only about a millimeter."], [41, 47, "That is enough."], ["lock", "end", "Only the free board finds the beat."]],
      note: "Board motion shown 20× larger" },
    { id: "ten", name: "3 · Ten metronomes", worlds: [{ n: 10, key: "ten" }], speed: 2, dur: lockT("ten", 2) + 7, cam: "ten", hud: "share",
      texts: [[0.8, 4.5, "Now 10."], [7, 13, "More metronomes, more patience."], ["lock", "end", "In sync."]] },
    { id: "hundred", name: "4 · One hundred metronomes", worlds: [{ n: 100, key: "hundred" }], speed: 2, dur: lockT("hundred", 2) + 6, cam: "hundred", hud: "share", fadeOut: 0,
      texts: [[0.8, 4.5, "100."], [9, 15, "Watch the chaos fold."], ["lock", "end", "In sync."]] },
    { id: "close", name: "5 · Closing", continues: true, speed: 1, dur: 28, cam: "close", fadeIn: 0, fadeOut: 1.4,
      texts: [[1.5, 9, "One rhythm.", "title"], [9.5, 15.5, "100 metronomes. One shared board. No conductor.", "small"],
        [16, 27, "Physics model: J. Pantaleone, Am. J. Phys. 70, 992 (2002)", "credit"]] },
  ];
  let acc = 0; for (const s of SCENES) { s.start = acc; acc += s.dur; s.end = acc; s.fadeIn = s.fadeIn ?? 0.7; s.fadeOut = s.fadeOut ?? 0.7; }
  const TOTAL = acc;

  // ---------------- camera: a smooth function of scene time (identical in every render) ----------------
  const sm = (a, b, u) => { const x = Math.min(1, Math.max(0, u)); const e = x * x * (3 - 2 * x); return a + (b - a) * e; };
  function orbit(cam, tx, ty, tz, dist, az, el) {
    cam.position.set(tx + Math.sin(az) * Math.cos(el) * dist, ty + Math.sin(el) * dist, tz + Math.cos(az) * Math.cos(el) * dist); cam.lookAt(tx, ty, tz);
  }
  function camFor(sc, u, cam, side) {
    const p = u / sc.dur;
    switch (sc.cam) {
      case "open": orbit(cam, 0, 0.22, 0, sm(1.25, 3.0, p), sm(-0.95, -0.35, p), sm(0.16, 0.38, p)); break;
      case "two": orbit(cam, 0, 0.21, 0, sm(1.6, 1.3, p), sm(0.42, 0.12, p), sm(0.24, 0.17, p)); break;
      case "split": orbit(cam, 0, 0.2, 0, sm(2.05, 1.85, p), 0, 0.2); break;          // the whole board in each half, straight from the front
      case "ten": orbit(cam, 0, 0.2, 0, sm(2.6, 2.1, p), sm(-0.7, 0.15, p), sm(0.5, 0.38, p)); break;
      case "hundred": orbit(cam, 0, 0.5, 0, sm(4.3, 3.5, p), sm(0.7, -0.05, p), sm(0.46, 0.34, p)); break;      // raised target: board sits low in frame, leaving room for text
      case "close": orbit(cam, 0, sm(0.5, 0.4, p), 0, sm(3.5, 4.8, p), sm(-0.05, -0.55, p), sm(0.34, 0.55, p)); break;
    }
  }

  // ---------------- metronome tick: a wooden click (decaying sines + short noise), reproducible ----------------
  function tickBuffer(ctx, pitch) {
    const sr = ctx.sampleRate, n = Math.floor(sr * 0.07), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    let s = 12345; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647 * 2 - 1;
    const P = [[2100, 0.012, 0.5], [3900, 0.006, 0.25], [1150, 0.02, 0.35]];
    for (let i = 0; i < n; i++) {
      const t = i / sr; let y = 0.55 * rnd() * Math.exp(-t / 0.0035);
      for (const [f, tau, a] of P) y += a * Math.sin(2 * Math.PI * f * pitch * t) * Math.exp(-t / tau);
      d[i] = y * Math.min(1, t / 0.0004) * 0.55;
    }
    return b;
  }

  // ---------------- runtime: worlds, simulations, tick events ----------------
  function Runtime() {
    const R = { scIndex: -1, sc: null, u: 0, worlds: [], ticks: [] };
    R.disposeWorlds = function () {
      for (const w of R.worlds) w.stage.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      R.worlds = [];
    };
    R.enter = function (i) {                  // enter a scene: build a new world and simulation unless it continues the previous one
      const sc = SCENES[i]; R.scIndex = i; R.sc = sc; R.u = 0;
      if (sc.continues) return;
      R.disposeWorlds();
      R.worlds = sc.worlds.map((wd, side) => {
        const cfg = SEEDS[wd.key], sim = makeSim({ n: wd.n, seed: cfg.seed, spread: cfg.spread, fixed: !!wd.fixed });
        const stage = makeStage(), rig = makeRig(stage, wd.n), cam = new T.PerspectiveCamera(34, 16 / 9, 0.03, 40);
        const w = { wd, sim, stage, rig, cam, side };
        sim.onTick = (k, tc) => R.ticks.push({ t: R.videoTimeOfSim(sc, tc), world: w, k });
        return w;
      });
      R.simStart = 0;
    };
    R.videoTimeOfSim = (sc, tsim) => R.sceneStartVideo + (tsim - R.simStart) / sc.speed;
    R.seek = function (i) {                   // jump to the start of a scene (for a continuing scene, run the previous one to its end)
      if (SCENES[i].continues) { R.seek(i - 1); R.advance(SCENES[i - 1].dur, true); }
      R.sceneStartVideo = SCENES[i].start; R.enter(i);
      if (SCENES[i].continues) { R.simStart = R.worlds[0].sim.t; for (const w of R.worlds) w.sim.onTick = (k, tc) => R.ticks.push({ t: R.videoTimeOfSim(SCENES[i], tc), world: w, k }); }
      R.ticks.length = 0;
    };
    R.advance = function (dtVideo, quiet) {   // advance in video time; move to the next scene when one ends
      let left = dtVideo;
      while (left > 1e-9) {
        const sc = R.sc, rest = sc.dur - R.u, d = Math.min(left, rest);
        for (const w of R.worlds) { w.sim.advance(d * sc.speed); }
        R.u += d; left -= d;
        if (R.u >= sc.dur - 1e-9) {
          if (R.scIndex + 1 >= SCENES.length) { R.done = true; break; }
          if (quiet) break;
          const ni = R.scIndex + 1; R.sceneStartVideo = SCENES[ni].start; R.enter(ni);
          if (SCENES[ni].continues) { R.simStart = R.worlds[0].sim.t; for (const w of R.worlds) w.sim.onTick = (k, tc) => R.ticks.push({ t: R.videoTimeOfSim(SCENES[ni], tc), world: w, k }); }
        }
      }
      if (quiet) R.ticks.length = 0;
      for (const w of R.worlds) w.sim.order();
    };
    R.time = () => R.sc.start + R.u;
    return R;
  }

  // ---------------- drawing: 3D (single or split screen) + text ----------------
  function renderFrame(R, renderer, W, H) {
    const sc = R.sc, n = R.worlds.length;
    renderer.setScissorTest(n > 1);
    R.worlds.forEach((w, i) => {
      const vw = W / n, vx = vw * i;
      w.cam.aspect = vw / H; w.cam.fov = n > 1 ? 40 : 34; w.cam.updateProjectionMatrix();
      camFor(sc, R.u, w.cam, i);
      w.rig.update(w.sim, sc.magnify || 1);
      renderer.setViewport(vx, 0, vw, H); renderer.setScissor(vx, 0, vw, H);
      renderer.render(w.stage.scene, w.cam);
    });
    renderer.setScissorTest(false);
  }

  const FONT = '"Bahnschrift", "Segoe UI", system-ui, sans-serif';
  function textAlpha(a, b, u) { return Math.max(0, Math.min(1, (u - a) / 0.45, (b - u) / 0.45)); }
  function lockU(R) {                       // "In sync." moment: permanent sync (from here on everyone stays within 5°)
    const w = R.worlds[R.worlds.length - 1]; if (!w || R.sc.continues) return Infinity;
    return (SEEDS[w.wd.key].stableFrom - R.simStart) / R.sc.speed;
  }
  function drawOverlay(R, x, W, H) {
    const sc = R.sc, u = R.u, s = H / 1080;
    x.save(); x.textAlign = "center"; x.textBaseline = "middle";
    const shadow = () => { x.shadowColor = "rgba(0,0,0,0.75)"; x.shadowBlur = 18 * s; };
    // main captions
    const lu = lockU(R);
    for (const [a0, b0, txt, style] of sc.texts) {
      const a = a0 === "lock" ? lu + 0.2 : a0, b = b0 === "end" ? sc.dur - 0.5 : b0;
      const al = textAlpha(a, b, u); if (al <= 0) continue;
      x.globalAlpha = al; shadow(); x.fillStyle = "#F3EEE4";
      if (style === "title") { x.font = `700 ${78 * s}px ${FONT}`; x.letterSpacing = `${6 * s}px`; x.fillText(txt.toUpperCase(), W / 2, H * 0.14); x.letterSpacing = "0px"; }
      else if (style === "small") { x.font = `500 ${38 * s}px ${FONT}`; x.fillText(txt, W / 2, H * 0.14); }
      else if (style === "credit") { x.font = `400 ${26 * s}px ${FONT}`; x.fillStyle = "#B9B4AA"; x.fillText(txt, W / 2, H * 0.93); }
      else { x.font = `600 ${56 * s}px ${FONT}`; x.fillText(txt, W / 2, H * 0.14); }
    }
    x.shadowBlur = 0; x.globalAlpha = 1;
    // speed label (honesty: sped-up scenes are marked)
    if (sc.speed !== 1) {
      x.font = `600 ${24 * s}px ${FONT}`; const label = sc.speed + "× SPEED", tw = x.measureText(label).width + 28 * s;
      x.fillStyle = "rgba(230,185,100,0.16)"; x.strokeStyle = "rgba(230,185,100,0.8)"; x.lineWidth = 1.5 * s;
      const bx = W - tw - 40 * s, by = 36 * s; x.beginPath(); x.roundRect(bx, by, tw, 40 * s, 20 * s); x.fill(); x.stroke();
      x.fillStyle = "#E6B964"; x.fillText(label, bx + tw / 2, by + 21 * s);
    }
    // indicators
    if (sc.hud === "pair") {
      R.worlds.forEach((w, i) => {
        const n = R.worlds.length, cx = W * (i + 0.5) / n, sim = w.sim;
        let d = (sim.ph[0] - sim.ph[1]) * 180 / Math.PI; d = Math.abs(((d + 540) % 360) - 180);
        if (w.wd.label) { x.font = `700 ${30 * s}px ${FONT}`; x.letterSpacing = `${4 * s}px`; x.fillStyle = "#D9D4CA"; shadow(); x.fillText(w.wd.label, cx, H * 0.27); x.letterSpacing = "0px"; x.shadowBlur = 0; }
        const r = 38 * s, cy = H * 0.835;
        x.fillStyle = "rgba(8,9,12,0.62)"; x.beginPath(); x.roundRect(cx - 190 * s, cy - r - 18 * s, 380 * s, 2 * r + 70 * s, 16 * s); x.fill();
        x.strokeStyle = "rgba(255,255,255,0.22)"; x.lineWidth = 2 * s; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
        for (let k = 0; k < 2; k++) { const p = sim.ph[k]; x.fillStyle = k ? "#E77FC0" : "#FFC56A"; x.beginPath(); x.arc(cx + r * Math.cos(p), cy - r * Math.sin(p), 6 * s, 0, 7); x.fill(); }
        x.font = `500 ${28 * s}px ${FONT}`; x.fillStyle = "#E9E4DA"; x.fillText(`phase difference  ${Math.round(d)}°`, cx, cy + r + 30 * s);
      });
      if (sc.note) { x.font = `400 ${22 * s}px ${FONT}`; x.fillStyle = "#9A958C"; x.fillText(sc.note, W / 2, H * 0.965); }
      if (R.worlds.length > 1) { x.fillStyle = "rgba(255,255,255,0.18)"; x.fillRect(W / 2 - 1 * s, 0, 2 * s, H); }
    }
    if (sc.hud === "share" || (sc.id === "close" && u < 2)) {
      const sim = R.worlds[0].sim, pct = Math.floor(sim.share * 100), al = sc.id === "close" ? Math.max(0, 1 - u / 1.5) : 1;
      x.globalAlpha = al; const bw = 300 * s, bx = W / 2 - bw / 2, by = H * 0.26;
      x.font = `600 ${22 * s}px ${FONT}`; x.letterSpacing = `${6 * s}px`; x.fillStyle = "#F3EEE4"; x.fillText("IN SYNC", W / 2 - 40 * s, by - 22 * s);
      x.letterSpacing = "0px"; x.fillStyle = "#E6B964"; x.font = `700 ${24 * s}px ${FONT}`; x.fillText(pct + "%", W / 2 + 80 * s, by - 22 * s);
      x.fillStyle = "rgba(255,255,255,0.18)"; x.fillRect(bx, by, bw, 3 * s); x.fillStyle = "#E6B964"; x.fillRect(bx, by, bw * sim.share, 3 * s);
      x.globalAlpha = 1;
    }
    // scene transition: fade to black
    const fi = sc.fadeIn > 0 ? Math.max(0, 1 - u / sc.fadeIn) : 0, fo = sc.fadeOut > 0 ? Math.max(0, 1 - (sc.dur - u) / sc.fadeOut) : 0, f = Math.max(fi, fo);
    if (f > 0) { x.fillStyle = `rgba(0,0,0,${f})`; x.fillRect(0, 0, W, H); }
    x.restore();
    return f;                                  // fade amount (the sound fades with it)
  }

  // tick event -> sound parameters (pan, pitch)
  const tmpV = new T.Vector3();
  function tickParams(R, e) {
    const w = e.world, n = w.wd.n, sc = R.sc;
    w.rig.worldPos(e.k, tmpV); tmpV.project(w.cam);
    const nW = R.worlds.length, pan = Math.max(-0.85, Math.min(0.85, (tmpV.x + (nW > 1 ? (w.side ? 1 : -1) : 0)) * (nW > 1 ? 0.45 : 0.6)));
    const gain = (n > 2 ? 1.4 / Math.sqrt(n) : 0.75), pitch = (w.sim.th[e.k] > 0 ? 1.0 : 0.94) * (1 + ((e.k * 0.618) % 1 - 0.5) * 0.04);
    return { t: e.t, pan, gain, pitch };
  }

  // ---------------- MP4 audio: all ticks are summed directly into a stereo buffer (no audio-graph nodes) ----------------
  // Each tick: the tick sample, resampled for its pitch (linear interpolation), is added with its gain and stereo position.
  // Then a soft compressor (threshold -16 dB, ratio 5:1, attack 2 ms, release 120 ms) and peak normalization to -1 dB.
  function mixTicks(events, dur, tick, sr = 48000) {
    const len = Math.ceil(dur * sr), L = new Float32Array(len), R = new Float32Array(len), n = tick.length;
    for (const e of events) {
      const s0 = Math.round(e.t * sr); if (s0 >= len || e.t < 0) continue;
      const g = e.gain * e.k, a = (e.pan + 1) * Math.PI / 4, gl = g * Math.cos(a), gr = g * Math.sin(a), m = Math.floor((n - 1) / e.pitch);
      for (let j = 0; j < m && s0 + j < len; j++) {
        const p = j * e.pitch, i = p | 0, f = p - i, v = tick[i] + (tick[i + 1] - tick[i]) * f;
        L[s0 + j] += v * gl; R[s0 + j] += v * gr;
      }
    }
    const T = Math.pow(10, -16 / 20), att = Math.exp(-1 / (0.002 * sr)), rel = Math.exp(-1 / (0.12 * sr));
    let env = 0, peak = 0;
    for (let i = 0; i < len; i++) {
      const x = Math.max(Math.abs(L[i]), Math.abs(R[i]));
      env = x > env ? att * env + (1 - att) * x : rel * env + (1 - rel) * x;
      const k = env > T ? (T + (env - T) / 5) / env : 1;
      L[i] *= k; R[i] *= k; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    if (peak > 0) { const k = 0.89 / peak; for (let i = 0; i < len; i++) { L[i] *= k; R[i] *= k; } }
    return { L, R, len };
  }

  root.Director = { SCENES, TOTAL, FPS, OUT_W, OUT_H, Runtime, renderFrame, drawOverlay, tickBuffer, tickParams, mixTicks };
})(window);
