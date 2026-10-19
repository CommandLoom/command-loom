// 25 Material Sounds: the same ball dropped on the same spike, in six materials (materials.js). Rendered with three.js.
// Every piece's path and every collision comes from the simulation; each collision is one sound in that material's voice.
(function (root) {
  "use strict";
  const M = root.Materials, D = root.CLDraw, FPS = 30, SIMFPS = 120, SIMDUR = 6, SLOW = 4, SLOW0 = .55;
  const KEYS = ["glass", "crystal", "wood", "metal", "jelly", "water"];
  const C = { text: "#F5F3EF", dim: "#C9D1DC", amber: "#FFBD38" };
  const yieldNow = () => new Promise((r) => { if (typeof MessageChannel === "undefined") return r(); const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); r(); }; ch.port2.postMessage(0); });
  const SIM = {};
  const ready = (async () => { for (const k of KEYS) { SIM[k] = M.simulate(k, [{ t: .5, x: .4 }], SIMDUR, SIMFPS); await yieldNow(); } })();
  const frameAt = (k, t) => { const s = SIM[k], i = Math.max(0, Math.min(s.frames.length - 1, Math.round(t * SIMFPS))); return s.frames[i]; };
  // ---------- three.js stage ----------
  let T3 = null;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function woodTex() { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), r = rng(25); g.fillStyle = "#a2602f"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) { const y = r() * 256; g.strokeStyle = r() < .5 ? `rgba(70,35,14,${.06 + r() * .12})` : `rgba(215,150,90,${.05 + r() * .1})`; g.lineWidth = 1 + r() * 2; g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x / 30 + i) * 4); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.06, .06); t.encoding = THREE.sRGBEncoding; return t; }
  function envMap(renderer) { const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#141820"); gr.addColorStop(.45, "#7d8898"); gr.addColorStop(.55, "#2a3040"); gr.addColorStop(1, "#06070a"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(60, 40, 90, 30); g.fillRect(330, 50, 120, 24);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding; const pm = new THREE.PMREMGenerator(renderer), env = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose(); return env; }
  const MATS = {};
  function stage() {
    if (T3) return T3;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x090a0e); scene.environment = envMap(renderer);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a22, .35));
    const key = new THREE.DirectionalLight(0xfff0e0, 1.4); key.position.set(14, 40, 26); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -10, near: 1, far: 120 }); key.shadow.bias = -0.0004; scene.add(key);
    const wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: .65 });
    const tray = new THREE.Group(), T = M.TRAY, RIM = M.RIM;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2 * T + 2, 1.2, 22), wood); slab.position.y = -.6; tray.add(slab);
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1, RIM, 22), wood); w.position.set(s * (T + .5), RIM / 2, 0); tray.add(w); }
    const back = new THREE.Mesh(new THREE.BoxGeometry(2 * T + 2, RIM, 1), wood); back.position.set(0, RIM / 2, -11.5); tray.add(back);
    tray.traverse((o) => { o.castShadow = o.receiveShadow = true; }); scene.add(tray);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.2; floor.receiveShadow = true; scene.add(floor);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(3, 10, 48), new THREE.MeshStandardMaterial({ color: 0xb8bec8, metalness: 1, roughness: .22 })); spike.position.y = 5; spike.castShadow = true; scene.add(spike);
    MATS.glass = new THREE.MeshPhysicalMaterial({ color: 0x8fd6ff, metalness: 0, roughness: .05, transparent: true, opacity: .6, clearcoat: 1, emissive: 0x0b2a3a, envMapIntensity: 1.2 });
    MATS.crystal = new THREE.MeshPhysicalMaterial({ color: 0xb06cff, metalness: .1, roughness: .08, transparent: true, opacity: .8, clearcoat: 1, flatShading: true, emissive: 0x2a0a55, envMapIntensity: 1.3 });
    MATS.wood = new THREE.MeshStandardMaterial({ map: woodTex(), color: 0xe0a070, roughness: .6 });
    MATS.metal = new THREE.MeshStandardMaterial({ color: 0xd9dee8, metalness: 1, roughness: .18, envMapIntensity: 1.6 });
    MATS.jelly = new THREE.MeshPhysicalMaterial({ color: 0x3ee07a, roughness: .15, transparent: true, opacity: .82, clearcoat: 1, emissive: 0x0b3a18 });
    MATS.water = new THREE.MeshPhysicalMaterial({ color: 0x1f7bff, roughness: .05, transparent: true, opacity: .75, clearcoat: 1, emissive: 0x061c40, envMapIntensity: 1 });
    const balls = {}, inst = {}, halves = {};
    for (const k of KEYS) { const b = new THREE.Mesh(new THREE.SphereGeometry(M.R, 48, 32), MATS[k]); b.castShadow = true; b.visible = false; scene.add(b); balls[k] = b; }
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, .5, 600);
    T3 = { renderer, scene, camera, balls, inst, halves, size: "" }; return T3;
  }
  function pieces(k) { const S = stage(); if (S.inst[k]) return S.inst[k]; const sim = SIM[k], n = Math.max(1, sim.pieces.length);
    const geo = k === "glass" ? new THREE.TetrahedronGeometry(1) : k === "crystal" ? new THREE.OctahedronGeometry(1) : k === "wood" ? new THREE.BoxGeometry(.5, 2.6, .5) : new THREE.SphereGeometry(1, 10, 8);
    const m = new THREE.InstancedMesh(geo, MATS[k], n); m.castShadow = true; m.visible = false; S.scene.add(m); S.inst[k] = m;
    if (k === "wood") for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(M.R * .95, 32, 16, 0, Math.PI), MATS.wood); h.castShadow = true; h.visible = false; S.scene.add(h); S.halves[s] = h; }
    return m; }
  function place(k, f) { const S = stage(), sim = SIM[k], m = pieces(k), o = new THREE.Object3D();
    sim.pieces.forEach((p, i) => { const [x, y, a, on] = f.pieces[i] || [0, 0, 0, 0], z = ((p.seed ?? .5) - .5) * 9;
      if (p.kind === "half") { const h = S.halves[p.half]; h.visible = !!on; h.position.set(x, y, 0); h.rotation.set(0, p.half < 0 ? Math.PI / 2 : -Math.PI / 2, a); o.scale.set(0, 0, 0); }
      else { o.position.set(x, y + (k === "water" ? 0 : 0), z); o.rotation.set((p.seed || 0) * 6, (p.seed || 0) * 11, a); const s = k === "wood" ? p.rad * 1.1 : k === "glass" ? p.rad * 1.5 : p.rad; o.scale.set(on ? s : 0, on ? s : 0, on ? s : 0); }
      o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.instanceMatrix.needsUpdate = true; m.visible = true; }
  function renderPanel(W, H, k, t, zoom = 1) {
    const S = stage(); if (S.size !== W + "x" + H) { S.renderer.setSize(W, H, false); S.camera.aspect = W / H; S.camera.updateProjectionMatrix(); S.size = W + "x" + H; }
    for (const kk of KEYS) { S.balls[kk].visible = false; if (S.inst[kk]) S.inst[kk].visible = false; } for (const s of [-1, 1]) if (S.halves[s]) S.halves[s].visible = false;
    const f = frameAt(k, t), b = f.balls[0], ball = S.balls[k];
    if (b.on) { ball.visible = true; ball.position.set(b.x, b.y, 0); ball.rotation.set(0, 0, b.a); const q = b.sq || 0; ball.scale.set(1 + q, 1 - q, 1 + q); }
    if (SIM[k].pieces.length) place(k, f);
    const portrait = H > W, dist = (portrait ? 72 : 66) / zoom; if (S.camera.fov !== (portrait ? 56 : 30)) { S.camera.fov = portrait ? 56 : 30; S.camera.updateProjectionMatrix(); }
    if (portrait) { S.camera.position.set(Math.sin(.12 + t * .02) * 5, 36 / zoom, 30 / zoom); S.camera.lookAt(0, 3.5, 0); }
    else { S.camera.position.set(Math.sin(.12 + t * .02) * dist * .22, dist * .48, dist); S.camera.lookAt(0, 4.5, 0); }
    S.renderer.render(S.scene, S.camera); return S.renderer.domElement; }
  const draw3 = (ctx, W, H, k, t, zoom, x = 0, y = 0) => ctx.drawImage(renderPanel(W, H, k, t, zoom), x, y, W, H);
  // ---------- schedules ----------
  const PASS = 6, S = [["hook", 0, 4], ["pass", 4, 40], ["slow", 40, 76], ["grid", 76, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const NOTE = "simulated · simple material model (bounciness, friction, number of pieces) · every sound is one collision";
  const nm = (k) => M.MAT[k].name;
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    ctx.fillStyle = "#06070a"; ctx.fillRect(0, 0, W, H);
    if (sc.id === "hook") { draw3(ctx, W, H, "glass", SLOW0 + u / SLOW, 1.15); D.text(ctx, "Which material sounds best?", W / 2, 85, 66, C.text, 700); D.text(ctx, `Glass · ${SLOW}× slower`, W / 2, 160, 38, C.amber, 700); return; }
    if (sc.id === "pass" || sc.id === "slow") { const i = Math.min(5, Math.floor(u / PASS)), w = u - i * PASS, k = KEYS[i], ff = D.fade(u, i * PASS, (i + 1) * PASS, .25), slow = sc.id === "slow";
      draw3(ctx, W, H, k, slow ? SLOW0 + w / SLOW : w, slow ? 1.15 : 1);
      D.text(ctx, `${i + 1} · ${nm(k).toUpperCase()}`, W / 2, 85, 72, C.text, 700, "center", ff); D.text(ctx, slow ? `${SLOW}× slower · sound at real pitch` : "same ball · same drop · same spike", W / 2, 155, 34, C.amber, 600, "center", ff);
      D.text(ctx, NOTE, W / 2, 1052, 22, C.dim, 500); return; }
    // grid: six panels, each dropping 3 s after the previous
    KEYS.forEach((k, i) => { const x = (i % 3) * 640, y = 120 + Math.floor(i / 3) * 450, tt = Math.max(0, u - 1 - 3 * i); draw3(ctx, 640, 450, k, tt, .95, x, y);
      D.text(ctx, `${i + 1} · ${nm(k)}`, x + 320, y + 410, 38, C.text, 700); });
    D.text(ctx, "Which one sounds best? Comment 1–6", W / 2, 70, 58, C.text, 700, "center", f); D.text(ctx, NOTE, W / 2, 1052, 22, C.dim, 500, "center", f);
  }
  // ---------- sound ----------
  function hitNotes(k, t0, a, b, speed = 1) { const sim = SIM[k], ev = [], per = new Map(), voice = M.MAT[k].voice;
    for (const h of sim.hits) { if (h.t < a || h.t >= b) continue; const tt = t0 + (h.t - a) * speed, fr = Math.floor(tt * FPS), c = per.get(fr) || 0; if (c >= 4 && !h.brk) continue; per.set(fr, c + 1);
      const kk = h.brk ? 3 : Math.max(0, Math.min(15, Math.round(15 - h.size * 6))); ev.push({ t: tt, k: kk, voice, gain: h.brk ? 1 : Math.min(.9, .12 + h.v / 450) }); }
    if (k === "jelly") { const fr = sim.frames; for (let i = 1; i < fr.length - 1; i++) { const q0 = fr[i - 1].balls[0].sq, q1 = fr[i].balls[0].sq, q2 = fr[i + 1].balls[0].sq; const tt = i / SIMFPS;
        if (q1 > q0 && q1 >= q2 && q1 > .015 && tt >= a && tt < b) ev.push({ t: t0 + (tt - a) * speed, k: 4, voice: "plop", gain: Math.min(.8, q1 * 6) }); } }
    return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [...hitNotes("glass", 0, SLOW0, SLOW0 + 3.95 / SLOW, SLOW)];
    KEYS.forEach((k, i) => { ev.push(...hitNotes(k, s.pass.t0 + i * PASS, 0, PASS - .05)); ev.push(...hitNotes(k, s.slow.t0 + i * PASS, SLOW0, SLOW0 + (PASS - .05) / SLOW, SLOW)); ev.push(...hitNotes(k, s.grid.t0 + 1 + 3 * i, 0, 4)); });
    return ev.filter((e) => e.t >= 0 && e.t < 99.4); }
  // ---------- Shorts ----------
  const VW = 1080, VH = 1920, SP = 4.6;
  function s1(ctx, t) { const i = Math.min(5, Math.floor(t / SP)), w = t - i * SP, k = KEYS[i], end = t >= 6 * SP;
    draw3(ctx, VW, VH, k, end ? SIMDUR - .01 : w, 1);
    D.lines(ctx, ["Which material", "sounds best?"], 540, 170, 80, C.text, 1); D.text(ctx, end ? "Comment 1–6" : `${i + 1} · ${nm(k)}`, 540, 390, 74, C.amber, 700);
    D.text(ctx, "same ball · same drop · every sound = one collision", 540, 1780, 30, C.dim, 600); }
  const S2K = ["glass", "water", "crystal", "metal"], S2L = 7.25;
  function s2(ctx, t) { const i = Math.min(3, Math.floor(t / S2L)), w = t - i * S2L, k = S2K[i];
    draw3(ctx, VW, VH, k, SLOW0 + Math.min(w, S2L) / SLOW, 1.2 + .1 * w / S2L);
    D.lines(ctx, ["4× slower.", "Which sounds best?"], 540, 170, 80, C.text, 1); D.text(ctx, `${nm(k)}`, 540, 390, 74, C.amber, 700);
    D.text(ctx, "simulated · sound at real pitch · one sound per collision", 540, 1780, 30, C.dim, 600); }
  const timelines = [
    { id: "full", name: "25 Material Sounds (long)", file: "Command Loom - 25 Material Sounds.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Six materials", file: "Command Loom - Short 1 - Six Materials.mp4", W: VW, H: VH, dur: 30, draw: s1, voice: "glass",
      events: () => KEYS.flatMap((k, i) => hitNotes(k, i * SP, 0, SP - .05)).filter((e) => e.t < 29.4) },
    { id: "s2", name: "Short 2 · Slow motion", file: "Command Loom - Short 2 - Slow Motion.mp4", W: VW, H: VH, dur: 30, draw: s2, voice: "glass",
      events: () => S2K.flatMap((k, i) => hitNotes(k, i * S2L, SLOW0, SLOW0 + (S2L - .05) / SLOW, SLOW)).filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 25 Material Sounds", timelines, ready };
  root.MaterialVideo = { S, KEYS, SIM, timelines, ready, hitNotes, SIMDUR, SIMFPS };
})(typeof window !== "undefined" ? window : globalThis);
