// 20 Perfect Fit: pieces dropped onto blocks with a matching hole 2% larger (fit.js decides by exact geometry whether it goes in).
// Each shape gets a row of eight blocks; the pieces drop one after another, each turned a little less (or made a little smaller)
// than the one before, until one goes in. Rendered with three.js; free fall with g = 9.81 m/s², shown 4× slower.
(function (root) {
  "use strict";
  const F = root.Fit, D = root.CLDraw, FPS = 30, SLOW = 4, H_DROP = 0.25, THICK = 0.04, CM = 100;
  const C = { text: "#F5F3EF", dim: "#C9D1DC", amber: "#FFBD38", ok: "#5BE584", no: "#FF5A6A" };
  // ladders: [shape, label kind, values]; the fit of each value is computed, not chosen
  const LADDERS = {
    star: { kind: "angle", values: [30, 20, 10, 6, 3, 1.5, 0.8, 0.3], color: 0xF2A214, metal: .55, rough: .32 },
    gear: { kind: "angle", values: [15, 8, 4, 2, 1, 0.5, 0.35, 0.2], color: 0xC9CED8, metal: .75, rough: .3 },
    heart: { kind: "size", values: [115, 110, 106, 104, 103, 102.5, 102.2, 101.9], color: 0xD9123A, metal: .1, rough: .25 },
    plus: { kind: "angle", values: [10, 5, 2, 1, 0.7, 0.5, 0.4, 0.3], color: 0x2EC4B6, metal: .2, rough: .3 }
  };
  const fitsStep = (shape, v) => LADDERS[shape].kind === "angle" ? F.fits(shape, v, 1) : F.fits(shape, 0, v / 100);
  const dropCache = {}, dropFor = (fit) => dropCache[fit] || (dropCache[fit] = F.drop(H_DROP, THICK, fit));
  const short = (shape, v) => LADDERS[shape].kind === "angle" ? `${v}°` : `${v}%`;
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
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0b10); scene.fog = new THREE.Fog(0x0a0b10, 250, 420);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x202028, .34));
    const key = new THREE.DirectionalLight(0xfff2e0, 1.5); key.position.set(30, 60, 36); key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
    Object.assign(key.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 200 }); key.shadow.bias = -0.0005; scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fc6ff, .6); rim.position.set(-25, 18, -30); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(260, 64), new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: .62, metalness: 0 });
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, .5, 600);
    T3 = { renderer, scene, camera, wood, blocks: {}, pieces: {}, size: "" }; return T3;
  }
  function block(shape, x, z) { const S = stage(), k = shape + x + "," + z; if (S.blocks[k]) return S.blocks[k];
    const outer = shape2([[-7.5, -7.5], [7.5, -7.5], [7.5, 7.5], [-7.5, 7.5]]); outer.holes.push(shape2(F.tf(F.SHAPES[shape], 0, F.CLEAR)));
    const m = new THREE.Mesh(extrude(outer, THICK * CM, .25), S.wood); m.position.set(x, 0, z); m.castShadow = m.receiveShadow = true; S.scene.add(m); return (S.blocks[k] = m); }
  function piece(shape, v, slot) { const S = stage(), k = shape + ":" + v + ":" + slot; if (S.pieces[k]) return S.pieces[k]; const L = LADDERS[shape];
    const pts = L.kind === "angle" ? F.tf(F.SHAPES[shape], v * Math.PI / 180, 1) : F.tf(F.SHAPES[shape], 0, v / 100);
    const m = new THREE.Mesh(extrude(shape2(pts), THICK * CM - .3, .15), new THREE.MeshStandardMaterial({ color: L.color, metalness: L.metal, roughness: L.rough }));
    m.castShadow = m.receiveShadow = true; S.scene.add(m); return (S.pieces[k] = m); }
  // one moment: items {shape, v, x, z, tDrop (s since release, real time; negative = still waiting above)}; returns each block's screen point (front edge)
  function render(ctx, W, H, items, cam) {
    const S = stage(); if (S.size !== W + "x" + H) { S.renderer.setSize(W, H, false); S.camera.aspect = W / H; S.camera.updateProjectionMatrix(); S.size = W + "x" + H; }
    for (const m of [...Object.values(S.blocks), ...Object.values(S.pieces)]) m.visible = false;
    items.forEach((it, j) => { block(it.shape, it.x, it.z).visible = true; if (it.tDrop < -.15) return; const p = piece(it.shape, it.v, j), d = dropFor(fitsStep(it.shape, it.v));
      p.visible = true; p.position.set(it.x, THICK * CM + d.y(Math.max(0, it.tDrop)) * CM + .15, it.z); });
    S.camera.position.set(...cam.pos); S.camera.lookAt(...cam.look); S.camera.updateMatrixWorld();
    S.renderer.render(S.scene, S.camera); ctx.drawImage(S.renderer.domElement, 0, 0, W, H);
    return items.map((it) => { const v = new THREE.Vector3(it.x, 0, it.z + 8.5).project(S.camera), u = new THREE.Vector3(it.x, H_DROP * CM + 6, it.z).project(S.camera);
      return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, top: (1 - u.y) / 2 * H }; });
  }
  // ---------- a ladder row: pieces released DT seconds apart (video time), each falling at 1/SLOW speed ----------
  const DT = 2.3, T_IN = .6;
  const tDropOf = (u, i, dt = DT) => (u - T_IN - i * dt) / SLOW;
  function rowItems(shape, u, pos, dt = DT) { return LADDERS[shape].values.map((v, i) => ({ shape, v, x: pos[i][0], z: pos[i][1], tDrop: tDropOf(u, i, dt) })); }
  const doneAt = (shape, i, dt = DT) => T_IN + i * dt + dropFor(fitsStep(shape, LADDERS[shape].values[i])).tRest * SLOW;     // video seconds into the row
  function labels(ctx, shape, u, P, k = 1, dt = DT) {
    LADDERS[shape].values.forEach((v, i) => { const p = P[i], fit = fitsStep(shape, v), d = dropFor(fit), land = T_IN + i * dt + d.t1 * SLOW, wait = u < T_IN + i * dt - .6;
      D.text(ctx, short(shape, v), p.x, p.y + 34 * k, 34 * k, wait ? "rgba(245,243,239,.45)" : C.text, 700);
      if (u >= land) { const a = D.clamp((u - land) / .25); D.text(ctx, fit ? "✓" : "✗", p.x, p.y + 78 * k, 44 * k, fit ? C.ok : C.no, 700, "center", a); } });
  }
  const ROW = (n, gap = 19) => Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * gap, 0]);
  const GRID = (n) => Array.from({ length: n }, (_, i) => [(i % 2 - .5) * 19, (Math.floor(i / 2) - (n / 2 - 1) / 2) * 21]);
  // long video camera: close on the block whose piece is falling, sliding along the row; when the row is done it pulls back to show all eight
  const camWide = (u) => ({ pos: [Math.sin(.18 + .006 * u) * 20, 108, 138], look: [0, 3, 2] });
  function camLong(u, shape) { const n = LADDERS[shape].values.length, c = D.clamp((u - T_IN + .5) / DT, 0, n - 1), i = Math.floor(c), f = c - i, x = (i + D.smooth(D.clamp(f * 2.5 - 1.2)) - (n - 1) / 2) * 17.5;
    const w = D.smooth(D.clamp((u - doneAt(shape, n - 1) - .1) / 1.4)), W0 = camWide(u), cx = x * (1 - w), mix = (a, b) => a.map((v, k) => v + (b[k] - v) * w);
    return { pos: mix([cx + Math.sin(.18 + .006 * u) * 12, 64, 108], W0.pos), look: mix([cx, 13, 0], W0.look) }; }
  const camTall = (u) => ({ pos: [Math.sin(.15 + .006 * u) * 14, 205, 128], look: [0, 6, 4] });
  const NOTE = `hole 2% larger than the piece · fit decided by exact geometry · free fall, shown ${SLOW}× slower`;

  // ---------- long video ----------
  const ORDER = ["star", "gear", "heart", "plus"], SC = 19.2;
  const S = [["hook", 0, 5], ...ORDER.map((k, i) => [k, 5 + SC * i, 5 + SC * (i + 1)]), ["close", 5 + SC * 4, 90]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const HOOK2 = 2.3, CLOSE_DT = .8;      // hook: 102.2% bounces off, then 101.9% drops in
  const SAY = { star: "Turn the star a little less each time. When does it go in?", gear: "A gear with twelve teeth.", heart: "Same heart, made a little smaller each time.", plus: "A plus sign." };
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { const second = u >= HOOK2, v = second ? 101.9 : 102.2, fit = fitsStep("heart", v), t0 = second ? HOOK2 + .1 : .3;
      render(ctx, W, H, [{ shape: "heart", v, x: 0, z: 0, tDrop: (u - t0) / SLOW }], { pos: [8, 52, 58], look: [0, 1, 0] });
      D.text(ctx, "A hole 2% bigger than the piece.", W / 2, 80, 60, C.text, 700); D.text(ctx, `Size ${v}% · will it go in?`, W / 2, 150, 40, C.amber, 700);
      if (u > t0 + dropFor(fit).t1 * SLOW) D.text(ctx, fit ? "✓ fits" : "✗ doesn't fit", W / 2, 960, 64, fit ? C.ok : C.no, 700); return; }
    if (sc.id === "close") { const items = ORDER.map((k, j) => { const vs = LADDERS[k].values; return { shape: k, v: vs[vs.length - 1], x: (j - 1.5) * 19, z: 0, tDrop: (u - .4 - j * CLOSE_DT) / SLOW }; });
      const P = render(ctx, W, H, items, { pos: [Math.sin(.2 + .03 * u) * 26, 80, 92], look: [0, -2, 4] });
      items.forEach((it, j) => { if (it.tDrop * SLOW > dropFor(true).t1 * SLOW) D.text(ctx, "✓", P[j].x, P[j].y + 50, 52, C.ok, 700); });
      D.text(ctx, "Four shapes. Four perfect fits.", W / 2, 80, 60, C.text, 700, "center", f); D.text(ctx, NOTE, W / 2, 1050, 22, C.dim, 500, "center", f); return; }
    const P = render(ctx, W, H, rowItems(sc.id, u, ROW(8, 17.5)), camLong(u, sc.id)); labels(ctx, sc.id, u, P);
    D.text(ctx, SAY[sc.id], W / 2, 80, 54, C.text, 700, "center", f);
    D.text(ctx, LADDERS[sc.id].kind === "angle" ? "number under each block: how far the piece is turned" : "number under each block: piece size compared with the hole's shape", W / 2, 148, 30, C.amber, 600, "center", f);
    D.text(ctx, NOTE, W / 2, 1050, 22, C.dim, 500);
  }
  // ---------- sound: a click at each release, a wood knock at every impact (louder when faster), a bell when a piece drops in ----------
  // release: a glass note that climbs one step for each piece along the row; falling: a soft note as the piece passes 2/3 and 1/3 of the drop height;
  // impact: a wood knock plus a marimba note (louder when faster); a piece that drops in: bells
  function dropNotes(t0, fit, k0 = 0) { const d = dropFor(fit), ev = [{ t: t0, k: 12 + k0 % 3, gain: .35, voice: "wood" }, { t: t0, k: Math.min(15, 3 + k0), gain: .45 }];
    [2 / 3, 1 / 3].forEach((h, j) => ev.push({ t: t0 + Math.sqrt(2 * H_DROP * (1 - h) / F.G) * SLOW, k: Math.min(15, 4 + k0 + j), gain: .25, voice: "marimba" }));
    d.imp.forEach((im) => ev.push({ t: t0 + im.t * SLOW, k: fit ? 3 : 9, gain: Math.min(1, .25 + im.v / 2.4), voice: "wood" }, { t: t0 + im.t * SLOW, k: fit ? 2 : 7 + (k0 % 4), gain: Math.min(.8, .2 + im.v / 3), voice: "marimba" }));
    if (fit) { const tr = t0 + d.tRest * SLOW + .1; ev.push({ t: tr, k: 10, gain: .8, voice: "bell" }, { t: tr, k: 6, gain: .6, voice: "bell" }, { t: tr + .35, k: 13, gain: .5, voice: "bell" }); }
    return ev; }
  const rowNotes = (shape, t0, dt = DT) => LADDERS[shape].values.flatMap((v, i) => dropNotes(t0 + T_IN + i * dt, fitsStep(shape, v), i));
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [...dropNotes(.3, false), ...dropNotes(HOOK2 + .1, true)];
    for (const k of ORDER) ev.push({ t: s[k].t0 + .1, k: 5, gain: .45, voice: "bell" }, ...rowNotes(k, s[k].t0));
    ORDER.forEach((k, j) => ev.push(...dropNotes(s.close.t0 + .4 + j * CLOSE_DT, true, j)));
    return ev.filter((e) => e.t < 89.4); }
  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, S_T0 = 1, S_DT = 3.3;
  const shortDraw = (shape, title) => (ctx, t) => { const u = t - S_T0, P = render(ctx, VW, VH, rowItems(shape, u, GRID(8), S_DT), camTall(u)); labels(ctx, shape, u, P, 1.1, S_DT);
    D.lines(ctx, title, 540, 150, 74, C.text, 1); D.text(ctx, `hole 2% bigger · exact geometry · ${SLOW}× slower`, 540, 1840, 30, C.dim, 600); };
  const timelines = [
    { id: "full", name: "20 Perfect Fit (long)", file: "Command Loom - 20 Perfect Fit.mp4", W: 1920, H: 1080, dur: 90, draw: drawFull, events: fullEvents, voice: "wood" },
    { id: "s1", name: "Short 1 · Star, angle ladder", file: "Command Loom - Short 1 - Star Angle.mp4", W: VW, H: VH, dur: 30, draw: shortDraw("star", ["Turn it less.", "Will it fit now?"]), voice: "wood",
      events: () => [{ t: .3, k: 5, gain: .45, voice: "bell" }, ...rowNotes("star", S_T0, S_DT)].filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · Heart, size ladder", file: "Command Loom - Short 2 - Heart Size.mp4", W: VW, H: VH, dur: 30, draw: shortDraw("heart", ["Make it smaller.", "Will it fit now?"]), voice: "wood",
      events: () => [{ t: .3, k: 5, gain: .45, voice: "bell" }, ...rowNotes("heart", S_T0, S_DT)].filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 20 Perfect Fit", timelines, ready: Promise.resolve() };
  root.FitVideo = { S, LADDERS, ORDER, fitsStep, dropFor, doneAt, timelines, DT, S_DT, SLOW, SC };
})(typeof window !== "undefined" ? window : globalThis);
