// 21 Perfect Fit: pieces dropped onto blocks with a matching hole 2% larger (fit.js decides by exact geometry whether it goes in).
// Rendered with three.js; the drop is free fall with g = 9.81 m/s², shown 4× slower. Labels are the real turn angle or size used.
(function (root) {
  "use strict";
  const F = root.Fit, D = root.CLDraw, FPS = 30, SLOW = 4, H_DROP = 0.25, THICK = 0.04, CM = 100, STEP = 4.2;
  const C = { text: "#F5F3EF", dim: "#C9D1DC", amber: "#FFBD38", ok: "#5BE584", no: "#FF5A6A" };
  // ladders: [shape, label kind, values]; the fit of each value is computed, not chosen
  const LADDERS = {
    star: { kind: "angle", values: [20, 6, 2, 0.8, 0.5, 0.3], color: 0xF2A214, metal: .55, rough: .32 },
    gear: { kind: "angle", values: [10, 4, 1, 0.5, 0.35, 0.2], color: 0xC9CED8, metal: .75, rough: .3 },
    heart: { kind: "size", values: [110, 105, 103, 102.5, 102.1, 101.9], color: 0xD9123A, metal: .1, rough: .25 },
    plus: { kind: "angle", values: [5, 1, 0.3], color: 0x2EC4B6, metal: .2, rough: .3 }
  };
  const fitsStep = (shape, v) => LADDERS[shape].kind === "angle" ? F.fits(shape, v, 1) : F.fits(shape, 0, v / 100);
  const dropCache = {}, dropFor = (fit) => dropCache[fit] || (dropCache[fit] = F.drop(H_DROP, THICK, fit));
  const labelOf = (shape, v) => LADDERS[shape].kind === "angle" ? `Angle ${v}°` : `Size ${v}%`;
  // ---------- three.js stage (built on first draw; not needed by the tests) ----------
  let T3 = null;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function woodTexture() { const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d"), r = rng(29);
    g.fillStyle = "#9a5a2c"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 90; i++) { const y = r() * 512, a = .05 + r() * .12; g.strokeStyle = r() < .5 ? `rgba(60,30,12,${a})` : `rgba(210,140,80,${a})`; g.lineWidth = 1 + r() * 3; g.beginPath();
      for (let x = 0; x <= 512; x += 16) g.lineTo(x, y + Math.sin(x / 60 + i) * 6 + Math.sin(x / 17 + i * 3) * 1.5); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.08, .08); t.encoding = THREE.sRGBEncoding; return t; }
  const shape2 = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); return s; };
  const extrude = (shape, depth, bevel) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 }); g.rotateX(-Math.PI / 2); return g; };
  function stage() {
    if (T3) return T3;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0b10); scene.fog = new THREE.Fog(0x0a0b10, 90, 190);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x202028, .32));
    const key = new THREE.DirectionalLight(0xfff2e0, 1.5); key.position.set(18, 40, 22); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 120 }); key.shadow.bias = -0.0005; scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fc6ff, .6); rim.position.set(-25, 18, -30); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: .62, metalness: 0 });
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, .5, 400);
    T3 = { renderer, scene, camera, wood, blocks: {}, pieces: {}, size: "" }; return T3;
  }
  function block(shape, x) { const S = stage(), k = shape + x; if (S.blocks[k]) return S.blocks[k];
    const outer = shape2([[-7.5, -7.5], [7.5, -7.5], [7.5, 7.5], [-7.5, 7.5]]); outer.holes.push(shape2(F.tf(F.SHAPES[shape], 0, F.CLEAR)));
    const m = new THREE.Mesh(extrude(outer, THICK * CM, .25), S.wood); m.position.x = x; m.castShadow = m.receiveShadow = true; S.scene.add(m); return (S.blocks[k] = m); }
  function piece(shape, v) { const S = stage(), k = shape + ":" + v; if (S.pieces[k]) return S.pieces[k]; const L = LADDERS[shape];
    const pts = L.kind === "angle" ? F.tf(F.SHAPES[shape], v * Math.PI / 180, 1) : F.tf(F.SHAPES[shape], 0, v / 100);
    const m = new THREE.Mesh(extrude(shape2(pts), THICK * CM - .3, .15), new THREE.MeshStandardMaterial({ color: L.color, metalness: L.metal, roughness: L.rough }));
    m.castShadow = m.receiveShadow = true; S.scene.add(m); return (S.pieces[k] = m); }
  // place the scene for one moment: list of {shape, v, x, tDrop (s since release, real time)}
  function render(ctx, W, H, items, camAng, camDist = 1) {
    const S = stage(); if (S.size !== W + "x" + H) { S.renderer.setSize(W, H, false); S.camera.aspect = W / H; S.camera.updateProjectionMatrix(); S.size = W + "x" + H; }
    for (const m of [...Object.values(S.blocks), ...Object.values(S.pieces)]) m.visible = false;
    for (const it of items) { block(it.shape, it.x).visible = true; const p = piece(it.shape, it.v), d = dropFor(fitsStep(it.shape, it.v));
      p.visible = true; p.position.set(it.x, THICK * CM + d.y(Math.max(0, it.tDrop)) * CM + .15, 0); }
    const r = 62 * camDist; S.camera.position.set(Math.sin(camAng) * r * .55, r * .78, Math.cos(camAng) * r * .62); S.camera.lookAt(0, 2, 0);
    S.renderer.render(S.scene, S.camera); ctx.drawImage(S.renderer.domElement, 0, 0, W, H);
  }
  // ---------- ladder playback ----------
  // within one step: 0.5 s still, then the drop at 1/SLOW speed, then the verdict
  function stepState(shape, u) { const L = LADDERS[shape], i = Math.min(L.values.length - 1, Math.floor(u / STEP)), w = u - i * STEP, v = L.values[i], fit = fitsStep(shape, v), d = dropFor(fit);
    const tDrop = Math.max(0, (w - .5) / SLOW), landed = tDrop >= d.t1, rested = tDrop >= d.tRest; return { i, v, fit, tDrop, landed, rested, w }; }
  function verdict(ctx, st, x, y, px) { if (!st.landed) return; const a = D.clamp((st.w - .5 - dropFor(st.fit).t1 * SLOW) / .25);
    D.text(ctx, st.fit ? "✓ fits" : "✗ doesn't fit", x, y, px, st.fit ? C.ok : C.no, 700, "center", a); }
  const NOTE = `hole 2% larger than the piece · fit decided by exact geometry · free fall, shown ${SLOW}× slower`;

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["star", 4, 29], ["gear", 29, 54], ["heart", 54, 79], ["plus", 79, 92], ["close", 92, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1), cam = .35 + .02 * t;
    if (sc.id === "hook") { const v = 101.9; render(ctx, W, H, [{ shape: "heart", v, x: 0, tDrop: Math.max(0, (u - .3) / SLOW) }], cam, .85);
      D.text(ctx, "A hole 2% bigger than the piece.", W / 2, 80, 60, C.text, 700); D.text(ctx, "Size 101.9% · will it go in?", W / 2, 150, 40, C.amber, 700);
      if (u > .3 + dropFor(true).t1 * SLOW) D.text(ctx, "✓ fits", W / 2, 960, 64, C.ok, 700); return; }
    if (sc.id === "close") { const sh = ["star", "gear", "heart", "plus"], last = (k) => LADDERS[k].values[LADDERS[k].values.length - 1];
      render(ctx, W, H, sh.map((k, j) => ({ shape: k, v: last(k), x: (j - 1.5) * 19, tDrop: 5 })), .2 + .05 * u, 1.55);
      D.text(ctx, "Four shapes. Four perfect fits.", W / 2, 80, 60, C.text, 700, "center", f); D.text(ctx, NOTE, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    const st = stepState(sc.id, u), L = LADDERS[sc.id];
    render(ctx, W, H, [{ shape: sc.id, v: st.v, x: 0, tDrop: st.tDrop }], cam, .85);
    D.text(ctx, labelOf(sc.id, st.v), W / 2, 85, 72, C.text, 700);
    D.text(ctx, L.kind === "angle" ? "how far the piece is turned from the hole" : "piece size, compared with the hole's shape", W / 2, 150, 30, C.amber, 600);
    verdict(ctx, st, W / 2, 960, 64); D.text(ctx, NOTE, W / 2, 1050, 22, C.dim, 500);
  }
  // ---------- sound: every impact is a wood knock (louder when faster); a fit ends with a bell ----------
  function stepNotes(shape, t0, from = 0, to = Infinity) { const ev = [], L = LADDERS[shape];
    L.values.forEach((v, i) => { const fit = fitsStep(shape, v), d = dropFor(fit), base = t0 + i * STEP + .5;
      d.imp.forEach((im, j) => { const t = base + im.t * SLOW; if (t >= from && t < to) ev.push({ t, k: fit ? 3 : 9, gain: Math.min(1, .25 + im.v / 2.4), voice: "wood" }); });
      const tr = base + d.tRest * SLOW + .1; if (fit && tr >= from && tr < to) ev.push({ t: tr, k: 10, gain: .8, voice: "bell" }, { t: tr, k: 6, gain: .6, voice: "bell" }); });
    return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [];
    const d = dropFor(true); d.imp.forEach((im) => ev.push({ t: .3 + im.t * SLOW, k: 3, gain: Math.min(1, .25 + im.v / 2.4), voice: "wood" })); ev.push({ t: .3 + d.tRest * SLOW + .1, k: 10, gain: .8, voice: "bell" });
    for (const k of ["star", "gear", "heart", "plus"]) ev.push(...stepNotes(k, s[k].t0, s[k].t0, s[k].t1 - .05));
    ev.push({ t: s.close.t0 + .3, k: 7, gain: .5, voice: "bell" }, { t: s.close.t0 + .3, k: 12, gain: .4, voice: "bell" });
    return ev.filter((e) => e.t < 99.4); }
  // ---------- Shorts ----------
  const VW = 1080, VH = 1920;
  const short = (shape, title) => (ctx, t) => { const u = Math.max(0, t - 1.2), st = stepState(shape, u);
    render(ctx, VW, VH, [{ shape, v: st.v, x: 0, tDrop: st.tDrop }], .35 + .02 * t, 1.15);
    D.lines(ctx, title, 540, 170, 74, C.text, 1); D.text(ctx, labelOf(shape, st.v), 540, 380, 84, C.amber, 700);
    verdict(ctx, st, 540, 1560, 76); D.text(ctx, `hole 2% bigger · exact geometry · ${SLOW}× slower`, 540, 1760, 30, C.dim, 600); };
  const timelines = [
    { id: "full", name: "21 Perfect Fit (long)", file: "Command Loom - 21 Perfect Fit.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "wood" },
    { id: "s1", name: "Short 1 · Star, angle ladder", file: "Command Loom - Short 1 - Star Angle.mp4", W: VW, H: VH, dur: 30, draw: short("star", ["Turn it less.", "Will it fit now?"]), voice: "wood",
      events: () => stepNotes("star", 1.2, 0, 29.4) },
    { id: "s2", name: "Short 2 · Heart, size ladder", file: "Command Loom - Short 2 - Heart Size.mp4", W: VW, H: VH, dur: 30, draw: short("heart", ["Make it smaller.", "Will it fit now?"]), voice: "wood",
      events: () => stepNotes("heart", 1.2, 0, 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 21 Perfect Fit", timelines, ready: Promise.resolve() };
  root.FitVideo = { S, LADDERS, fitsStep, dropFor, timelines, STEP, SLOW };
})(typeof window !== "undefined" ? window : globalThis);
