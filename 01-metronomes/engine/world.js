// 3D scene: dark studio, spotlight, walnut board on rollers, black metronomes, glowing bobs colored by phase.
// makeStage() builds a THREE.Scene; makeRig(stage, N) adds a board with N metronomes and draws it with update(sim).
(function (root) {
  const T = THREE;
  const BH = 0.21, BR0 = 0.072, BR1 = 0.03, ROD = 0.16, ROLL_R = 0.06, BOARD_T = 0.035;
  const ap = (y) => (BR0 - (BR0 - BR1) * y / BH) * Math.SQRT1_2;          // distance of the body's front face at height y
  const PIV_Y = BOARD_T + 0.05, PIV_Z = ap(0.05) + 0.012;

  function woodTex() {
    const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;    // reproducible texture
    x.fillStyle = "#4a2a17"; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 110; i++) {
      const y = r() * 512; x.strokeStyle = r() < .5 ? "#2a160b" : "#6b4127"; x.globalAlpha = 0.1 + r() * 0.15; x.lineWidth = 1 + r() * 3;
      x.beginPath(); x.moveTo(0, y); for (let k = 0; k <= 512; k += 32) x.lineTo(k, y + Math.sin(k / 80 + i) * 4); x.stroke();
    }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
  }
  let shared = null;
  function mats() {
    if (shared) return shared;
    const glowC = document.createElement("canvas"); glowC.width = glowC.height = 64; const g = glowC.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    shared = {
      wood: new T.MeshStandardMaterial({ map: woodTex(), roughness: 0.35, metalness: 0.05 }),
      black: new T.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.28, metalness: 0.2 }),
      gold: new T.MeshStandardMaterial({ color: 0xc9a050, roughness: 0.3, metalness: 0.95 }),
      steel: new T.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.9 }),
      roller: new T.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.4, metalness: 0.6 }),
      glowTex: new T.CanvasTexture(glowC),
    };
    return shared;
  }

  function makeStage() {
    const scene = new T.Scene(); scene.background = new T.Color(0x0a0b0e); scene.fog = new T.Fog(0x0a0b0e, 5, 11);
    scene.add(new T.HemisphereLight(0x8a93b0, 0x1a1410, 0.28));
    const spot = new T.SpotLight(0xfff0d8, 2.4, 0, Math.PI / 5.5, 0.55, 1.2);
    spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0003; spot.shadow.camera.far = 20;
    scene.add(spot); scene.add(spot.target);
    const rim = new T.DirectionalLight(0x9fb4ff, 0.35); rim.position.set(2.5, 1.2, -3); scene.add(rim);
    const floor = new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshStandardMaterial({ color: 0x141518, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const wall = new T.Mesh(new T.PlaneGeometry(30, 12), new T.MeshStandardMaterial({ color: 0x1a1d24, roughness: 1 }));
    wall.position.set(0, 6, -4.5); wall.receiveShadow = true; scene.add(wall);
    return { scene, spot };
  }

  const C_GOLD = new T.Color(0xffc56a), C_PINK = new T.Color(0xe77fc0), C_VIO = new T.Color(0x8a76ff);
  function phaseColor(dp, out) {               // in step with the shared rhythm: gold, quarter cycle off: pink, opposite phase: violet
    const a = Math.abs(((dp + Math.PI * 3) % (Math.PI * 2)) - Math.PI) / Math.PI;
    if (a < 0.5) out.copy(C_GOLD).lerp(C_PINK, a * 2); else out.copy(C_PINK).lerp(C_VIO, (a - 0.5) * 2);
    return out;
  }

  function makeRig(stage, N) {
    const M = mats(), root = new T.Group(); stage.scene.add(root);
    const cols = N <= 3 ? N : Math.ceil(Math.sqrt(N)), rowsN = Math.ceil(N / cols);
    const SX = N <= 3 ? 0.42 : 0.27, SZ = N <= 3 ? 0.3 : 0.21;
    const boardW = cols * SX + 0.12, boardD = rowsN * SZ + 0.12, layout = [];
    for (let r = 0; r < rowsN; r++) { const inRow = Math.min(cols, N - r * cols); for (let c = 0; c < inRow; c++) layout.push([(c - (inRow - 1) / 2) * SX, (r - (rowsN - 1) / 2) * SZ]); }
    const board = new T.Group(); board.position.y = 2 * ROLL_R; root.add(board);
    const slab = new T.Mesh(new T.BoxGeometry(boardW, BOARD_T, boardD), M.wood); slab.position.y = BOARD_T / 2; slab.castShadow = slab.receiveShadow = true; board.add(slab);
    const trimF = new T.Mesh(new T.BoxGeometry(boardW + 0.004, 0.006, 0.006), M.gold); trimF.position.set(0, BOARD_T - 0.003, boardD / 2); board.add(trimF);
    const trimB = trimF.clone(); trimB.position.z = -boardD / 2; board.add(trimB);
    const dummy = new T.Object3D();
    const bodyG = new T.CylinderGeometry(BR1, BR0, BH, 4, 1); bodyG.rotateY(Math.PI / 4); bodyG.translate(0, BH / 2 + BOARD_T + 0.01, 0);
    const baseG = new T.BoxGeometry(BR0 * 1.6, 0.01, BR0 * 1.6); baseG.translate(0, BOARD_T + 0.005, 0);
    const trimG = new T.TorusGeometry(BR0 * 0.78, 0.0025, 6, 4); trimG.rotateZ(Math.PI / 4); trimG.rotateX(Math.PI / 2); trimG.translate(0, BOARD_T + 0.011, 0);
    const bodies = new T.InstancedMesh(bodyG, M.black, N), bases = new T.InstancedMesh(baseG, M.black, N), trims = new T.InstancedMesh(trimG, M.gold, N);
    layout.forEach(([x, z], i) => { dummy.position.set(x, 0, z); dummy.updateMatrix(); bodies.setMatrixAt(i, dummy.matrix); bases.setMatrixAt(i, dummy.matrix); trims.setMatrixAt(i, dummy.matrix); });
    [bodies, bases].forEach(o => { o.castShadow = o.receiveShadow = true; board.add(o); }); board.add(trims);
    const rodG = new T.BoxGeometry(0.004, ROD, 0.0025); rodG.translate(0, ROD / 2, 0);
    const ringG = new T.TorusGeometry(0.011, 0.0035, 8, 18); ringG.translate(0, ROD * 0.55, 0);
    const bobG = new T.SphereGeometry(0.0125, 16, 12); bobG.translate(0, ROD, 0);
    const rods = new T.InstancedMesh(rodG, M.steel, N), rings = new T.InstancedMesh(ringG, M.gold, N), bobs = new T.InstancedMesh(bobG, new T.MeshBasicMaterial({ color: 0xffffff }), N);
    const bobCol = new Float32Array(N * 3); bobs.instanceColor = new T.InstancedBufferAttribute(bobCol, 3);
    rods.castShadow = rings.castShadow = true;
    [rods, rings, bobs].forEach(o => { o.instanceMatrix.setUsage(T.DynamicDrawUsage); board.add(o); });
    const gg = new T.BufferGeometry(), glowPos = new Float32Array(N * 3), glowCol = new Float32Array(N * 3);
    gg.setAttribute("position", new T.BufferAttribute(glowPos, 3)); gg.setAttribute("color", new T.BufferAttribute(glowCol, 3));
    const glow = new T.Points(gg, new T.PointsMaterial({ size: N <= 3 ? 0.09 : 0.075, map: M.glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
    glow.frustumCulled = false; board.add(glow);
    const rollers = [], rollerX = [], nR = Math.max(2, Math.round(boardW / 0.6) + 1);
    for (let k = 0; k < nR; k++) {
      const rg = new T.Group(), cyl = new T.Mesh(new T.CylinderGeometry(ROLL_R, ROLL_R, boardD * 0.92, 32), M.roller);
      cyl.rotation.x = Math.PI / 2; cyl.castShadow = cyl.receiveShadow = true; rg.add(cyl);
      const cap = new T.Mesh(new T.CircleGeometry(ROLL_R * 0.5, 24), M.gold); cap.position.z = boardD * 0.46 + 0.001; rg.add(cap);
      const x0 = (k / (nR - 1) - 0.5) * (boardW - 0.3); rg.position.set(x0, ROLL_R, 0); root.add(rg); rollers.push(rg); rollerX.push(x0);
    }
    const span = Math.max(boardW, boardD), tmp = new T.Color();
    stage.spot.target.position.set(0, 0.2, 0); stage.spot.position.set(-0.4 * span, 2.6 + span * 0.9, 0.9 + span * 0.5);
    stage.spot.angle = Math.atan((span * 0.85) / stage.spot.position.y);

    function update(sim, magnify = 1) {
      const bx = sim.x * magnify;
      board.position.x = bx;
      rollers.forEach((r, k) => { r.position.x = rollerX[k] + bx / 2; r.rotation.z = -(bx / 2) / ROLL_R; });
      for (let i = 0; i < N; i++) {
        const [x, z] = layout[i], th = sim.th[i];
        dummy.position.set(x, PIV_Y, z + PIV_Z); dummy.rotation.set(0, 0, th); dummy.updateMatrix();
        rods.setMatrixAt(i, dummy.matrix); rings.setMatrixAt(i, dummy.matrix); bobs.setMatrixAt(i, dummy.matrix);
        phaseColor(sim.ph[i] - sim.PSI, tmp);
        bobCol[i * 3] = tmp.r; bobCol[i * 3 + 1] = tmp.g; bobCol[i * 3 + 2] = tmp.b;
        glowPos[i * 3] = x - ROD * Math.sin(th); glowPos[i * 3 + 1] = PIV_Y + ROD * Math.cos(th); glowPos[i * 3 + 2] = z + PIV_Z;
        glowCol[i * 3] = tmp.r * .9; glowCol[i * 3 + 1] = tmp.g * .9; glowCol[i * 3 + 2] = tmp.b * .9;
      }
      rods.instanceMatrix.needsUpdate = rings.instanceMatrix.needsUpdate = bobs.instanceMatrix.needsUpdate = true;
      bobs.instanceColor.needsUpdate = true; gg.attributes.position.needsUpdate = gg.attributes.color.needsUpdate = true;
    }
    // world position of a metronome, used for stereo panning
    const worldPos = (i, out) => out.set(layout[i][0] + board.position.x, PIV_Y + 2 * ROLL_R + 0.1, layout[i][1]);
    return { root, update, layout, boardW, boardD, span, worldPos };
  }
  root.MetroWorld = { makeStage, makeRig, phaseColor };
})(window);
