// Magnet Builds stage: chrome balls and stacked-magnet rods carried by a magnetic wand and snapped into place.
// This is a CHOREOGRAPHED ANIMATION, not a physics simulation: the build order, wand motion and camera are designed.
// What is real: the shapes use one rod length (a whole number of 1/8-unit magnets) so a real set could build them,
// some shapes (octahedron, dodecahedron, helix) pick a resting face with the centre of mass over the support, and the last D0 of each snap follows
// d'' = -1 / (d + s)^4 (a dipole-like attraction profile). Adapted from the earlier "Magnet Workshop" page.
(function (root) {
  "use strict";
  root.makeMagnetStage = function () {

  // ---------------- şekiller: tüm çubuklar eşit boyda (1 birim), yani gerçek bir setle kurulabilir ----------------
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; },
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
  };
  function rotTo(a, b) {                       // a birim vektörünü b'ye çeviren döndürme (Rodrigues)
    const v = V.cross(a, b), c = V.dot(a, b), s = V.len(v);
    if (s < 1e-9) return c > 0 ? (p) => p.slice() : (p) => [p[0], -p[1], -p[2]];
    const k = V.mul(v, 1 / s);
    return (p) => V.add(V.add(V.mul(p, c), V.mul(V.cross(k, p), s)), V.mul(k, V.dot(k, p) * (1 - c)));
  }
  const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
  function edgesByLength(P) { const E = []; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (Math.abs(V.dist(P[i], P[j]) - 1) < 1e-6) E.push([i, j]); return E; }
  function restOnFace(P, f, R) {               // f yüzünü masaya yatır (dış normal aşağı); en alttaki bilyeler masaya değer
    const c = V.mul(P.reduce((s, p) => V.add(s, p), [0, 0, 0]), 1 / P.length);
    let n = V.norm(V.cross(V.sub(P[f[1]], P[f[0]]), V.sub(P[f[2]], P[f[0]])));
    if (V.dot(n, V.sub(P[f[0]], c)) < 0) n = V.mul(n, -1);
    const Q = P.map(rotTo(n, [0, -1, 0]));
    const my = Math.min(...Q.map(p => p[1])), cx = Q.reduce((s, p) => s + p[0], 0) / Q.length, cz = Q.reduce((s, p) => s + p[2], 0) / Q.length;
    return Q.map(p => [p[0] - cx, p[1] - my + R, p[2] - cz]);
  }
  const M_BALL = 1, M_ROD = 0.6;               // bilye ve çubuk kütlesi (oran)
  function centerOfMass(P, E) {
    let s = [0, 0, 0], m = 0;
    P.forEach(p => { s = V.add(s, V.mul(p, M_BALL)); m += M_BALL; });
    E.forEach(([a, b]) => { s = V.add(s, V.mul(V.add(P[a], P[b]), M_ROD / 2)); m += M_ROD; });
    return V.mul(s, 1 / m);
  }
  function supportMargin(P, E, R) {            // kütle merkezinin masaya değen noktaların dışbükey zarfına uzaklığı (+ içeride)
    const c = centerOfMass(P, E), pts = P.filter(p => p[1] < R + 1e-4).map(p => [p[0], p[2]]);
    if (pts.length < 3) return -1;
    const h = []; pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    for (const p of pts) { while (h.length >= 2 && cr(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }
    const lo = h.length + 1; for (let i = pts.length - 2; i >= 0; i--) { const p = pts[i]; while (h.length >= lo && cr(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }
    h.pop(); let m = Infinity;
    for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); m = Math.min(m, cr(a, b, [c[0], c[2]]) / L); }
    return m;
  }
  function restStable(P, E, R, score) {        // dengede durabildiği yüzler arasından score'u en iyi olanı seç
    let best = null;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) for (let k = j + 1; k < P.length; k++) {
      const n = V.cross(V.sub(P[j], P[i]), V.sub(P[k], P[i])); if (V.len(n) < 1e-6) continue;
      let pos = 0, neg = 0; for (const p of P) { const d = V.dot(n, V.sub(p, P[i])); if (d > 1e-6) pos++; else if (d < -1e-6) neg++; }
      if (pos && neg) continue;                 // dışbükey zarfın yüzü değil
      const Q = restOnFace(P, [i, j, k], R), m = supportMargin(Q, E, R);
      if (m < 0.05) continue;                   // devrilir
      const s = score(Q, m); if (!best || s > best.s) best = { s, Q };
    }
    return best.Q;
  }
  function icosa(R) {
    const t = (1 + Math.sqrt(5)) / 2, P = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) { P.push([0, a, b * t]); P.push([a, b * t, 0]); P.push([b * t, 0, a]); }
    const Q = P.map(p => V.mul(p, 0.5)), E = edgesByLength(Q);
    let f = null;
    for (const [i, j] of E) { for (let k = 0; k < Q.length && !f; k++) if (k !== i && k !== j && Math.abs(V.dist(Q[i], Q[k]) - 1) < 1e-6 && Math.abs(V.dist(Q[j], Q[k]) - 1) < 1e-6) f = [i, j, k]; if (f) break; }
    return { name: "İkosahedron", en: "Icosahedron", P: restOnFace(Q, f, R), E };
  }
  function helix(R, n = 16) {                  // Boerdijk–Coxeter tetraheliksi: yüz yüze dizilmiş düzgün dörtyüzlüler
    const r = 3 * Math.sqrt(3) / 10, th = Math.acos(-2 / 3), h = 1 / Math.sqrt(10), P = [], E = [];
    for (let i = 0; i < n; i++) P.push([i * h, r * Math.cos(i * th), r * Math.sin(i * th)]);
    for (let i = 0; i < n; i++) for (const d of [1, 2, 3]) if (i + d < n) E.push([i, i + d]);
    let Q = restStable(P, E, R, (Q, m) => -Math.max(...Q.map(p => p[1])) * 4 + m);     // yatık ve sağlam dursun
    const pc = Q.map(p => p), ax = V.sub(Q[n - 1], Q[0]); Q = pc.map(p => rotY(p, Math.atan2(ax[2], ax[0]) + Math.PI / 3));   // uzun eksen çapraz, sağ-geriye doğru
    return { name: "Burgu", en: "Helix", P: Q, E };
  }
  function snail(R) {
    // gövde: yan yatmış altıgen antiprizma; iki altıgen yüzün ortasında birer bilye (her yüz 6 üçgen)
    const hA = Math.sqrt(1 - 2 * (1 - Math.cos(Math.PI / 6))), P = [], E = [];
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; P.push([0, Math.cos(a), Math.sin(a)]); }                 // 0-5 ön altıgen
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; P.push([hA, Math.cos(a), Math.sin(a)]); } // 6-11 arka altıgen
    P.push([0, 0, 0]); P.push([hA, 0, 0]);                                                                             // 12 ön, 13 arka merkez
    for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; E.push([k, k1], [6 + k, 6 + k1], [12, k], [13, 6 + k], [k, 6 + k], [k1, 6 + k]); }
    let Q = restOnFace(P, [3, 9, 4], R);
    const ax = V.sub(Q[12], Q[13]); Q = Q.map(p => rotY(p, -Math.atan2(-ax[2], -ax[0])));        // ön yüz -x yönüne
    let best = null;
    for (let k = 0; k < 6; k++) { const y = Q[k][1] + Q[(k + 1) % 6][1]; if (!best || y > best[0]) best = [y, k, (k + 1) % 6]; }
    const t1 = best[1], t2 = best[2];
    const apex = (a, b, c, away) => {
      const g = V.mul(V.add(V.add(Q[a], Q[b]), Q[c]), 1 / 3); let n = V.norm(V.cross(V.sub(Q[b], Q[a]), V.sub(Q[c], Q[a])));
      if (V.dot(n, V.sub(g, away)) < 0) n = V.mul(n, -1); return V.add(g, V.mul(n, Math.sqrt(2 / 3)));
    };
    const H1 = Q.length; Q.push(apex(t1, t2, 12, Q[13])); E.push([H1, t1], [H1, t2], [H1, 12]);   // baş: ön yüze dışa dörtyüzlü
    const H2 = Q.length; Q.push(apex(H1, t1, t2, Q[12])); E.push([H2, H1], [H2, t1], [H2, t2]);   // üstüne bir dörtyüzlü daha
    const tops = [H1, H2].sort((a, b) => Q[b][1] - Q[a][1]);
    const side = V.norm(V.cross([0, 1, 0], V.sub(Q[12], Q[13])));
    tops.forEach((n, i) => {                   // antenler: başın iki bilyesinden yukarı, hafif öne ve dışa
      const d = V.norm(V.add(V.add([0, 1, 0], [-0.3, 0, 0]), V.mul(side, i === 0 ? 0.3 : -0.3)));
      const T = Q.length; Q.push(V.add(Q[n], d)); E.push([n, T]);
    });
    let tb = 6; for (let k = 6; k < 12; k++) if (Q[k][1] - Q[k][0] < Q[tb][1] - Q[tb][0]) tb = k;   // kuyruk: arka-alt bilyeden geriye
    const T = Q.length; Q.push(V.add(Q[tb], V.norm([1, 0.1, 0]))); E.push([tb, T]);
    const my = Math.min(...Q.map(p => p[1])); Q = Q.map(p => [p[0], p[1] - my + R, p[2]]);
    return { name: "Salyangoz", en: "Snail", P: Q, E };
  }
  function octa(R) {
    const a = Math.SQRT1_2, P = [[a, 0, 0], [-a, 0, 0], [0, a, 0], [0, -a, 0], [0, 0, a], [0, 0, -a]], E = edgesByLength(P);
    return { name: "Oktahedron", en: "Octahedron", P: restStable(P, E, R, (Q, m) => m), E };
  }
  function cube(R) {
    const P = []; for (const x of [-.5, .5]) for (const y of [-.5, .5]) for (const z of [-.5, .5]) P.push([x, y, z]);
    const E = edgesByLength(P), my = Math.min(...P.map(p => p[1]));
    return { name: "Küp", en: "Cube", P: P.map(p => [p[0], p[1] - my + R, p[2]]), E };
  }
  function sierpinski(R) {                     // iki birim boyundaki dörtyüzlünün köşeleri + kenar ortaları: 4 küçük dörtyüzlü
    const C = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(p => V.mul(p, 1 / Math.SQRT2)), P = C.slice();
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) P.push(V.mul(V.add(C[i], C[j]), 0.5));
    const E = edgesByLength(P);
    return { name: "Sierpinski Piramidi", en: "Sierpinski Pyramid", P: restOnFace(P, [0, 1, 2], R), E };
  }
  function dodeca(R) {
    const t = (1 + Math.sqrt(5)) / 2, P = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) P.push([x, y, z]);
    for (const a of [-1, 1]) for (const b of [-1, 1]) { P.push([0, a / t, b * t]); P.push([a / t, b * t, 0]); P.push([b * t, 0, a / t]); }
    const Q = P.map(p => V.mul(p, t / 2)), E = edgesByLength(Q);
    return { name: "Dodekahedron", en: "Dodecahedron", P: restStable(Q, E, R, (S, m) => m), E };
  }
  function hanging(R) {
    // 1,5 birimlik (12 mıknatıslı) çubuklardan kare piramit; tepesinden iki küçük bilyelik zincir; ucunda
    // 0,5 birimlik (4 mıknatıslı) çubuklardan, köşesinden asılı küçük bir oktahedron
    const s = 1.5, rc = 0.045, ri = 0.05, e = 0.5, P = [], E = [], K = [], Rn = [];
    const add = (p, r) => { P.push(p); Rn.push(r); return P.length - 1; };
    const link = (a, b, k = "rod") => { E.push([a, b]); K.push(k); };
    const base = [[-s / 2, R, -s / 2], [s / 2, R, -s / 2], [s / 2, R, s / 2], [-s / 2, R, s / 2]].map(p => add(p, R));
    const apex = add([0, R + s / Math.SQRT2, 0], R);
    for (let k = 0; k < 4; k++) { link(base[k], base[(k + 1) % 4]); link(base[k], apex); }
    let y = P[apex][1] - R - rc; const c1 = add([0, y, 0], rc); link(apex, c1, "touch");
    y -= 2 * rc; const c2 = add([0, y, 0], rc); link(c1, c2, "touch");
    y -= rc + ri; const T = add([0, y, 0], ri); link(c2, T, "touch");
    const eq = []; for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; eq.push(add([Math.cos(a) * e / Math.SQRT2, y - e / Math.SQRT2, Math.sin(a) * e / Math.SQRT2], ri)); }
    const B = add([0, y - e * Math.SQRT2, 0], ri);
    for (let k = 0; k < 4; k++) { link(T, eq[k]); link(eq[k], eq[(k + 1) % 4]); link(eq[k], B); }
    return { name: "Asılı Oktahedron", en: "Hanging Octahedron", P, E, K, Rn };
  }
  function buildPlan(S) {                      // kurulum sırası: alttan yukarı; her yeni bilye önce bir çubukla bağlanır, sonra üçgenler kapanır
    const { P, E } = S, N = P.length, adj = P.map(() => []);
    E.forEach(([a, b], k) => { adj[a].push([b, k]); adj[b].push([a, k]); });
    const placed = new Array(N).fill(false), used = new Array(E.length).fill(false), plan = [];
    let start = 0; for (let i = 1; i < N; i++) if (P[i][1] < P[start][1] - 1e-6 || (Math.abs(P[i][1] - P[start][1]) < 1e-6 && P[i][0] < P[start][0])) start = i;
    placed[start] = true; plan.push({ type: "ball", node: start, first: true });
    for (let c = 1; c < N; c++) {
      let pick = null;
      for (let i = 0; i < N; i++) if (!placed[i] && adj[i].some(([j]) => placed[j])) {
        const s = P[i][1] * 3 + Math.min(...adj[i].filter(([j]) => placed[j]).map(([j]) => V.dist(P[i], P[start])));
        if (!pick || s < pick.s) pick = { i, s };
      }
      const v = pick.i, nb = adj[v].filter(([j]) => placed[j]).sort((a, b) => P[a[0]][1] - P[b[0]][1]);
      const [u, ku] = nb[0];
      if (S.K && S.K[ku] === "touch") plan.push({ type: "ball", node: v, from: u, touch: true });   // zincir: bilye doğrudan bilyeye
      else { plan.push({ type: "rod", edge: ku, from: u, to: v }); plan.push({ type: "ball", node: v, from: u }); }
      used[ku] = true; placed[v] = true;
      for (const [w, k] of adj[v]) if (placed[w] && !used[k]) { plan.push({ type: "close", edge: k, from: w, to: v }); used[k] = true; }
    }
    return plan;
  }


  const R_BALL = 0.075, R_ROD = 0.026, TIP_R = 0.03, D0 = 0.1, SEG = 1 / 8, FPS = 30;
  const Y = new THREE.Vector3(0, 1, 0), v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const SHAPES = [
    ["snail", () => snail(R_BALL)], ["icosa", () => icosa(R_BALL)], ["helix", () => helix(R_BALL)], ["octa", () => octa(R_BALL)],
    ["cube", () => cube(R_BALL)], ["sierpinski", () => sierpinski(R_BALL)], ["dodeca", () => dodeca(R_BALL)], ["hanging", () => hanging(R_BALL)],
  ];
  let rng = 1;                                   // tekrarlanabilir rastgelelik (kamera kesmeleri)
  const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };

  // ---------------- mıknatıs çekimi: d'' = -k / (d + s)^4 (iki dipol), d0 -> 0 ----------------
  const SNAP_T = 0.09, SNAP = (() => {
    const s = 2 * R_BALL, h = 1e-5, traj = [[0, 0]]; let d = D0, v = 0, t = 0, n = 0;
    while (d > 0) { v += -1 / Math.pow(d + s, 4) * h; d += v * h; t += h; if (++n % 20 === 0) traj.push([t, 1 - Math.max(d, 0) / D0]); }
    const prof = []; let j = 0;
    for (let i = 0; i <= 100; i++) { const tt = t * i / 100; while (j < traj.length - 1 && traj[j + 1][0] < tt) j++; prof.push(traj[Math.min(j + 1, traj.length - 1)][1]); }
    prof[100] = 1; return prof;
  })();
  const snapAt = (u) => { const x = Math.max(0, Math.min(1, u)) * 100, i = Math.floor(x); return i >= 100 ? 1 : SNAP[i] + (SNAP[i + 1] - SNAP[i]) * (x - i); };
  const ease = (u) => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

  // ---------------- sahne ----------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const BG = 0xECECEB, scene = new THREE.Scene(); scene.background = new THREE.Color(BG); scene.fog = new THREE.Fog(BG, 12, 30);
  const camera = new THREE.PerspectiveCamera(32, 1.6, 0.03, 80);
  const controls = { update() {}, target: new THREE.Vector3() };   // no user camera here: the cinematic camera always drives

  scene.environment = (() => {                  // krom yansıması için stüdyo ortamı: softbox'lar ve koyu bantlar
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#3a3d42"); g.addColorStop(.3, "#7c8087"); g.addColorStop(.46, "#e9e9e7"); g.addColorStop(.52, "#5b5e63"); g.addColorStop(.7, "#2a2c30"); g.addColorStop(1, "#141518");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    x.shadowColor = "#ffffff"; x.shadowBlur = 30; x.fillStyle = "#ffffff";
    x.fillRect(140, 80, 200, 110); x.fillRect(620, 70, 250, 80); x.fillRect(440, 170, 90, 50);
    x.shadowColor = "#000000"; x.shadowBlur = 20; x.fillStyle = "#0e0f11";
    x.fillRect(0, 300, 1024, 40); x.fillRect(880, 90, 70, 200); x.fillRect(30, 110, 50, 170); x.fillRect(360, 60, 40, 160);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(renderer), env = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose(); return env;
  })();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6d3cf, 0.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;
  scene.add(key); scene.add(key.target);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0xf0f0ee, roughness: 0.95, metalness: 0, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const chrome = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08 });
  const nickel = new THREE.MeshStandardMaterial({ color: 0xe9ecef, metalness: 1, roughness: 0.2 });
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x2f5bd3, transparent: true, opacity: 0.2, depthWrite: false });
  const geoCache = {};
  const ballGeo = (r) => geoCache["b" + r] || (geoCache["b" + r] = new THREE.SphereGeometry(r, 40, 28));
  const ghostBallGeo = (r) => geoCache["gb" + r] || (geoCache["gb" + r] = new THREE.SphereGeometry(r * 1.07, 24, 16));
  function rodGeo(len, n) {                     // n tane üst üste dizilmiş silindir mıknatıs: aralarında ince oluk
    const k = "r" + len.toFixed(4) + "_" + n; if (geoCache[k]) return geoCache[k];
    const l = len / n, c = Math.min(0.006, l * 0.12), pts = [new THREE.Vector2(0, -len / 2)];
    for (let i = 0; i < n; i++) { const y0 = -len / 2 + i * l; pts.push(new THREE.Vector2(R_ROD * 0.84, y0), new THREE.Vector2(R_ROD, y0 + c), new THREE.Vector2(R_ROD, y0 + l - c), new THREE.Vector2(R_ROD * 0.84, y0 + l)); }
    pts.push(new THREE.Vector2(0, len / 2));
    return geoCache[k] = new THREE.LatheGeometry(pts, 28);
  }
  const ghostRodGeo = (len) => geoCache["gr" + len.toFixed(4)] || (geoCache["gr" + len.toFixed(4)] = new THREE.CylinderGeometry(R_ROD * 1.25, R_ROD * 1.25, len, 16));

  // göstergeç: siyah gövde, krom bilezik, mıknatıslı krom uç (uç noktası grubun orijininde)
  const wand = new THREE.Group(); scene.add(wand);
  const WAND_UP = new THREE.Vector3(0.42, 1, 0.48).normalize();
  (() => {
    const black = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.42, metalness: 0.1 }), grip = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.8 });
    const parts = [[new THREE.SphereGeometry(TIP_R, 24, 16), chrome, 0], [new THREE.CylinderGeometry(TIP_R * 0.8, 0.034, 0.14, 24), chrome, 0.08],
      [new THREE.CylinderGeometry(0.034, 0.034, 3.2, 24), black, 1.75], [new THREE.CylinderGeometry(0.039, 0.039, 0.9, 24), grip, 1.9]];
    parts.forEach(([g, m, y]) => { const o = new THREE.Mesh(g, m); o.position.y = y; o.castShadow = true; wand.add(o); });
    wand.quaternion.setFromUnitVectors(Y, WAND_UP);
  })();

  // ---------------- sound events (synthesized later from these moments; no recorded samples) ----------------
  const events = [];
  function click(pos, vol = 1, rate = 1) { events.push({ t: simT / speed, vol, rate, x: pos ? Math.max(-1, Math.min(1, pos.clone().project(camera).x)) : 0, step: counts.step }); }

  // ---------------- kurulum ----------------
  let S = null, plan = [], world = null, queue = [], seg = null, segT = 0, simT = 0, total = 0, speed = 1, paused = false, phase = "build";
  let counts = { b: 0, r: 0, step: 0 }, showGhost = true, showText = true;
  let structC = new THREE.Vector3(), structR = 1, allC = new THREE.Vector3(), allR = 3, finishedAt = -1;
  const tip = new THREE.Vector3(), focusT = new THREE.Vector3();
  let actionIndex = -1;
  const vt = () => simT / speed;                 // video zamanı (sn)

  function setRod(m, c, d) { m.position.copy(c); m.quaternion.setFromUnitVectors(Y, d); }
  function clear() { if (world) scene.remove(world); }

  function build(name) {
    clear(); S = SHAPES.find(s => s[0] === name)[1](); plan = buildPlan(S); world = new THREE.Group(); scene.add(world);
    const K = S.K || S.E.map(() => "rod"), Rn = S.Rn || S.P.map(() => R_BALL), P = S.P.map(v3);
    S._K = K; S._R = Rn; S.nRods = K.filter(k => k === "rod").length;
    let maxX = -1e9; P.forEach(p => maxX = Math.max(maxX, p.x));
    const sbox = new THREE.Box3(); P.forEach((p, i) => { sbox.expandByPoint(p.clone().addScalar(Rn[i])); sbox.expandByPoint(p.clone().addScalar(-Rn[i])); });
    const ss = sbox.getBoundingSphere(new THREE.Sphere()); structC.copy(ss.center); structR = ss.radius;
    // malzeme: sağda beyaz seramik kase (bilyeler) ve tepsi (çubuklar)
    const nB = S.P.length, rodEdges = S.E.map((e, k) => k).filter(k => K[k] === "rod"), nR = rodEdges.length, sx = maxX + 1.05;
    const maxRb = Math.max(...Rn), lens = rodEdges.map(k => S.P[S.E[k][0]] && P[S.E[k][0]].distanceTo(P[S.E[k][1]])), maxL = Math.max(...lens);
    const dishC = new THREE.Vector3(sx + 0.05, 0, 0.62), trayC = new THREE.Vector3(sx + 0.12 + (maxL - 1) / 2, 0, -0.72);
    const white = new THREE.MeshStandardMaterial({ color: 0xfbfbfa, roughness: 0.35, metalness: 0, envMapIntensity: 0.6 });
    const ringN = Math.ceil((Math.sqrt(12 * nB - 3) - 3) / 6) + 1, dishR = ringN * 2 * maxRb * 1.05 + 0.08;
    const prof = [[0, 0], [dishR, 0], [dishR + 0.05, 0.025], [dishR + 0.09, 0.075], [dishR + 0.1, 0.085], [dishR + 0.06, 0.075], [dishR + 0.04, 0.03], [0, 0.012]].map(p => new THREE.Vector2(p[0], p[1]));
    const dish = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), white); dish.position.copy(dishC); dish.castShadow = dish.receiveShadow = true; world.add(dish);
    const sp = 2 * R_ROD * 1.12, perLayer = Math.ceil(nR / 2), tw = perLayer * sp + 0.16, tl = maxL + 0.16;
    const tray = new THREE.Group(); tray.position.copy(trayC); world.add(tray);
    const tb = new THREE.Mesh(new THREE.BoxGeometry(tl, 0.015, tw), white); tb.position.y = 0.0075; tray.add(tb);
    [[0, tw / 2, tl, 0.012], [0, -tw / 2, tl, 0.012], [tl / 2, 0, 0.012, tw], [-tl / 2, 0, 0.012, tw]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), white); m.position.set(x, 0.035, z); tray.add(m); });
    tray.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    const hex = [], st = 2 * maxRb * 1.04;
    for (let q = -ringN; q <= ringN; q++) for (let r = -ringN; r <= ringN; r++) { const x = st * (q + r / 2), z = st * r * Math.sqrt(3) / 2; if (Math.hypot(x, z) <= dishR - maxRb) hex.push([x, z]); }
    hex.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const rodSpots = [];
    for (let i = 0; i < nR; i++) { const layer = i < nR - perLayer ? 1 : 0, j = layer ? i : i - (nR - perLayer); rodSpots.push(new THREE.Vector3(trayC.x, 0.015 + R_ROD + layer * R_ROD * 1.75, trayC.z + (j - (perLayer - 1) / 2) * sp + layer * sp / 2)); }
    rodSpots.reverse();
    // parçaları kurulum sırasına göre hazırla: her eyleme kendi parçası
    let hi = 0, ri = 0;
    const parts = plan.map(a => {
      if (a.type === "ball") { const r = Rn[a.node], m = new THREE.Mesh(ballGeo(r), chrome); const [x, z] = hex[hi++]; m.position.set(dishC.x + x, 0.012 + r, dishC.z + z); m.castShadow = m.receiveShadow = true; world.add(m); return m; }
      const [ea, eb] = S.E[a.edge], L = P[ea].distanceTo(P[eb]), len = L - (Rn[ea] + Rn[eb]) * 0.8, n = Math.round(L / SEG);
      const m = new THREE.Mesh(rodGeo(len, n), nickel); m.userData = { L, len }; setRod(m, rodSpots[ri++], new THREE.Vector3(1, 0, 0)); m.castShadow = m.receiveShadow = true; world.add(m); return m;
    });
    const box = sbox.clone(); box.expandByPoint(new THREE.Vector3(dishC.x + dishR, 0, dishC.z + dishR)); box.expandByPoint(new THREE.Vector3(trayC.x + tl / 2, 0, trayC.z - tw / 2));
    const as = box.getBoundingSphere(new THREE.Sphere()); allC.copy(as.center); allC.y = box.max.y * 0.38; allR = as.radius * 0.8;
    key.position.set(allC.x - 3, 7, allC.z + 4); key.target.position.copy(allC);
    Object.assign(key.shadow.camera, { left: -allR * 1.4, right: allR * 1.4, top: allR * 1.4, bottom: -allR * 1.4, near: 0.5, far: 25 }); key.shadow.camera.updateProjectionMatrix();
    makeQueue(P, Rn, parts);
    rng = 7 + name.length * 131; actionIndex = -1; phase = "build"; finishedAt = -1;
    camInit();
  }

  // ---------------- zaman çizelgesi: her eylem = git, al, taşı, bekle, yapış (+ dön), otur ----------------
  function makeQueue(P, Rn, parts) {
    queue = []; seg = null; segT = 0; simT = 0; counts = { b: 0, r: 0, step: 0 };
    tip.copy(allC).add(WAND_UP.clone().multiplyScalar(allR * 0.9)).add(new THREE.Vector3(0.6, 0, 0)); wand.position.copy(tip); wand.visible = true;
    const placedNodes = [];
    plan.forEach((a, idx) => {
      const isBall = a.type === "ball", part = parts[idx];
      let fin, finD = null, appr, apprD = null, pivot = null, d0 = null, halfL = 0, sideHold = false;
      if (isBall) {
        fin = P[a.node].clone();
        if (a.first) appr = fin.clone().add(new THREE.Vector3(0, 0.16, 0));
        else { const dir = fin.clone().sub(P[a.from]).normalize(); appr = fin.clone().addScaledVector(dir, D0); sideHold = a.touch || dir.y < -0.3; }
      } else {
        const L = part.userData.L; halfL = L / 2;
        const d = P[a.to].clone().sub(P[a.from]).normalize(); finD = d;
        if (a.type === "rod") { fin = P[a.from].clone().addScaledVector(d, halfL); appr = fin.clone().addScaledVector(d, D0); apprD = d; }
        else {
          fin = P[a.from].clone().add(P[a.to]).multiplyScalar(0.5);
          const cen = placedNodes.reduce((s, n) => s.add(P[n]), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, placedNodes.length));
          let out = fin.clone().sub(cen); if (out.lengthSq() < 1e-6) out.set(0, 1, 0); out.normalize();
          let axis = new THREE.Vector3().crossVectors(d, out); if (axis.lengthSq() < 1e-6) axis.crossVectors(d, Y); axis.normalize();
          d0 = d.clone().applyAxisAngle(axis, 0.32); if (d0.clone().sub(d).dot(out) < 0) d0 = d.clone().applyAxisAngle(axis, -0.32);
          pivot = P[a.from].clone(); appr = pivot.clone().addScaledVector(d0, halfL + D0); apprD = d0;
        }
      }
      if (isBall) placedNodes.push(a.node);
      const gh = new THREE.Mesh(isBall ? ghostBallGeo(Rn[a.node]) : ghostRodGeo(part.userData.len), ghostMat); gh.visible = false; world.add(gh);
      if (isBall) gh.position.copy(fin); else setRod(gh, fin, finD);
      const home = part.position.clone(), homeQ = part.quaternion.clone(), rb = isBall ? Rn[a.node] : 0;
      const holdOff = (q) => {                   // parçayı tutan uç: bilyede tepesi (zincirde yanı), çubukta ortasının üst yanı
        if (isBall) return sideHold ? new THREE.Vector3(0.6, 0.25, 0.75).normalize().multiplyScalar(rb + TIP_R * 0.9) : new THREE.Vector3(0, rb + TIP_R * 0.9, 0);
        const ax = Y.clone().applyQuaternion(q); let u = Y.clone().addScaledVector(ax, -ax.y); if (u.lengthSq() < 1e-4) u.set(0, 0, 1); return u.normalize().multiplyScalar(R_ROD + TIP_R * 0.9);
      };
      const apprQ = isBall ? homeQ.clone() : new THREE.Quaternion().setFromUnitVectors(Y, apprD);
      const from = new THREE.Vector3(), lift = home.clone().add(new THREE.Vector3(0, 0.22, 0)), pickTip = home.clone().add(holdOff(homeQ));
      queue.push({ dur: 0.32, start: idx, begin() { from.copy(tip); actionIndex = idx; focusT.copy(fin); onAction(idx); }, update(u) { const e = ease(u); tip.lerpVectors(from, pickTip, e); tip.y += Math.sin(Math.PI * e) * 0.35; } });
      queue.push({ dur: 0.14, begin() { if (showGhost) gh.visible = true; }, update(u) { part.position.lerpVectors(home, lift, ease(u)); tip.copy(part.position).add(holdOff(part.quaternion)); } });
      queue.push({ dur: 0.52, update(u) {
        const e = ease(u), h = 0.3 + lift.distanceTo(appr) * 0.1;
        part.position.lerpVectors(lift, appr, e); part.position.y += Math.sin(Math.PI * e) * h;
        part.quaternion.copy(homeQ).slerp(apprQ, ease(Math.min(1, u * 1.25)));
        tip.copy(part.position).add(holdOff(part.quaternion));
      } });
      queue.push({ dur: 0.05, update() {} });
      if (a.first) {                             // serbest düşüş: 1 birim = 27 mm -> g ≈ 363 birim/sn²
        const H = appr.y - fin.y, T = Math.sqrt(2 * H / 363);
        queue.push({ dur: T, update(u) { part.position.copy(appr); part.position.y = appr.y - H * u * u; }, end() { part.position.copy(fin); click(fin, 0.45, 0.85); } });
      } else if (a.type === "close") {
        const c0 = pivot.clone().addScaledVector(d0, halfL), q0 = new THREE.Quaternion().setFromUnitVectors(Y, d0), qF = new THREE.Quaternion().setFromUnitVectors(Y, finD);
        queue.push({ dur: SNAP_T, update(u) { part.position.lerpVectors(appr, c0, snapAt(u)); }, end() { part.position.copy(c0); click(pivot, 0.75); } });
        queue.push({ dur: SNAP_T * 1.6, update(u) { part.quaternion.copy(q0).slerp(qF, snapAt(u)); part.position.copy(pivot).addScaledVector(Y.clone().applyQuaternion(part.quaternion), halfL); },
          end() { setRod(part, fin, finD); click(P[a.to], 0.95); } });
      } else {
        queue.push({ dur: SNAP_T, update(u) { part.position.lerpVectors(appr, fin, snapAt(u)); },
          end() { part.position.copy(fin); part.quaternion.copy(isBall ? homeQ : new THREE.Quaternion().setFromUnitVectors(Y, finD)); click(fin, isBall ? (a.touch ? 0.8 : 1) : 0.85, a.touch ? 1.15 : 1); } });
      }
      const rec = a.type === "close" ? finD : (isBall && !a.first ? appr.clone().sub(fin).normalize() : new THREE.Vector3(0, 1, 0));
      const tip0 = new THREE.Vector3();
      queue.push({ dur: 0.12, begin() { tip0.copy(tip); gh.visible = false; isBall ? counts.b++ : counts.r++; counts.step = idx + 1; },
        update(u) { part.position.copy(fin).addScaledVector(rec, Math.exp(-u * 6) * Math.sin(u * Math.PI * 5) * 0.006); tip.copy(tip0).addScaledVector(WAND_UP, ease(u) * 0.3); },
        end() { part.position.copy(fin); } });
    });
    const f2 = new THREE.Vector3(), away = new THREE.Vector3();
    queue.push({ dur: 0.9, begin() { f2.copy(tip); away.copy(tip).addScaledVector(WAND_UP, 3); phase = "outro"; finishedAt = simT; }, update(u) { tip.lerpVectors(f2, away, ease(u)); }, end() { wand.visible = false; } });
    queue.push({ dur: 9.5, update() {} });       // genel gösterim: kamera bitmiş şeklin çevresinde döner
    total = queue.reduce((s, q) => s + q.dur, 0);
  }

  function advance(dt) {
    let left = dt;
    while (left > 0 && (seg || queue.length)) {
      if (!seg) { seg = queue.shift(); segT = 0; seg.begin && seg.begin(); }
      const need = seg.dur - segT;
      if (left >= need) { simT += need; left -= need; segT = seg.dur; seg.update(1); seg.end && seg.end(); seg = null; }
      else { segT += left; simT += left; seg.update(segT / seg.dur); left = 0; }
    }
    if (!seg && !queue.length) phase = "done";
    wand.position.copy(tip);
  }

  // ---------------- sinematik kamera: hedef bölgeyi izler, ara ara açı değiştirir (kesme), sonda genel gösterim ----------------
  let cine = true;
  const cam = { f: new THREE.Vector3(), az: 0.6, el: 0.4, dist: 2, tAz: 0.6, tEl: 0.4, tDist: 2, orbit: 0 };
  function fitDist(r) { const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect); return r / Math.sin(Math.min(vf, hf) / 2); }
  function camInit() { cam.f.copy(structC); cam.f.y = Math.max(0.15, structC.y * 0.6); cam.az = cam.tAz = -0.55; cam.el = cam.tEl = 0.42; cam.dist = cam.tDist = fitDist(structR) * 0.9; cam.orbit = 0;
    if (!cine) { camera.position.set(allC.x + fitDist(allR) * 0.45, allC.y + fitDist(allR) * 0.45, allC.z + fitDist(allR) * 0.77); controls.target.copy(allC); controls.update(); } }
  function onAction(i) {
    const close = fitDist(0.55), medium = fitDist(Math.max(0.9, structR * 0.65));
    if (i === 0) { cam.tDist = medium; return; }
    if (i % 5 === 0) {                           // kesme: yeni açı ve mesafe, anında
      cam.tAz = cam.az = -(0.1 + rand() * 1.25) - (rand() < 0.2 ? Math.PI * 0.35 : 0);   // sol önden: malzeme sağ arkada kalır
      cam.tEl = cam.el = 0.22 + rand() * 0.42;
      cam.tDist = cam.dist = (Math.floor(i / 5) % 2) ? close : medium;
      cam.f.copy(focusT); cam.cut = true;
    }
  }
  function updateCam(dt) {
    if (!cine) { controls.update(); return; }
    let f = focusT, dist = cam.tDist, el = cam.tEl;
    if (phase === "outro" || phase === "done") {   // genel gösterim
      f = structC; dist = fitDist(structR) * 0.88; el = 0.36; cam.orbit += dt * (2 * Math.PI / 9.5);
    }
    const k = 1 - Math.exp(-dt * (phase === "build" ? 3.2 : 1.6));
    cam.f.lerp(f, k); cam.dist += (dist - cam.dist) * k; cam.el += (el - cam.el) * k;
    if (phase === "build") cam.az -= dt * 0.05;
    const az = cam.az + cam.orbit;
    let d = cam.dist;
    const pos = () => new THREE.Vector3(cam.f.x + Math.sin(az) * Math.cos(cam.el) * d, cam.f.y + Math.sin(cam.el) * d, cam.f.z + Math.cos(az) * Math.cos(cam.el) * d);
    let p = pos();
    while (p.distanceTo(structC) < structR * 0.95 + 0.25 && d < 20) { d += 0.1; p = pos(); }   // kamera yapının içine girmesin
    if (p.y < 0.12) p.y = 0.12;
    camera.position.copy(p); camera.lookAt(cam.f);
    controls.target.copy(cam.f);
  }


    function setSpeed(s) { speed = s; }
    function size(W, H) { renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    function render() { renderer.render(scene, camera); return renderer.domElement; }
    function reset(name) { events.length = 0; build(name); }
    return { SHAPES, reset, advance, updateCam, size, render, setSpeed, events,
      get total() { return total; }, get phase() { return phase; }, get simT() { return simT; }, get counts() { return counts; },
      get S() { return S; }, get plan() { return plan; }, get finishedAt() { return finishedAt; }, get speed() { return speed; } };
  };
})(window);
