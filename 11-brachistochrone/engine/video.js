// 11 Brachistochrone: frictionless beads racing from A to B (brach.js). Four classic slopes race three times, then twelve curves
// from the straight line to deeper-than-cycloid race at once, and finally a cycloid bowl sends beads from many heights to the bottom
// at the same moment. Every position, time and speed comes from energy conservation; only the playback is slowed (labelled).
(function (root) {
  "use strict";
  const K = root.Brach, D = root.CLDraw;
  const C = { bg: "#05070C", text: "#F5F3EF", dim: "#9AA6B8", gold: [255, 189, 56] };
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function hsl(h, s, l) { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l), f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [255 * f(0), 255 * f(8), 255 * f(4)]; }
  const NOTE = "frictionless beads · g = 9.81 m/s² · times from energy conservation";

  // ---------- races ----------
  const CLASSIC = [["straight line", K.straight, [225, 230, 240]], ["steep drop", K.dropThenSlide, [239, 111, 174]], ["circular arc", K.arc, [53, 196, 240]], ["cycloid", K.cycloid, C.gold]];
  const FAN_S = [0, .25, .5, .7, .85, 1, 1.15, 1.3, 1.5, 1.8, 2.2, 2.7];   // 0 = straight line, 1 = cycloid, above 1 = deeper than the cycloid
  const cache = {};
  function curves(kind, B) {
    const id = kind + B; if (cache[id]) return cache[id];
    const cs = kind === "four" ? CLASSIC.map(([name, f, col], i) => ({ name, col, pts: f(B), k: [1, 5, 8, 11][i] }))
      : FAN_S.map((s, i) => ({ name: s === 1 ? "cycloid" : "", s, col: hsl(i * 300 / 11, 92, 62), pts: K.fan(B, s), k: 2 + i }));
    cs.forEach((c) => c.tr = K.track(c.pts)); return cache[id] = cs;
  }
  const nice = (x) => Math.floor(x * 2) / 2;
  // start: tracks draw in over `draw` seconds, beads are released 0.2 s later; the slowdown is chosen so the slowest bead takes about `run` seconds
  function race(kind, B, start, run, draw = 1) {
    const cs = curves(kind, B), tmax = Math.max(...cs.map((c) => c.tr.total)), slow = nice(run / tmax), order = cs.map((_, i) => i).sort((a, b) => cs[a].tr.total - cs[b].tr.total);
    let ymax = 0; cs.forEach((c) => c.pts.forEach((p) => { if (p[1] > ymax) ymax = p[1]; }));
    const t0 = start + draw + .2; return { kind, B, cs, start, draw, t0, slow, order, tmax, ymax, end: t0 + tmax * slow };
  }
  function fit(R, [bx, by, bw, bh]) { const s = Math.min(bw / R.B[0], bh / R.ymax), ox = bx + (bw - R.B[0] * s) / 2; return { X: (x) => ox + x * s, Y: (y) => by + y * s }; }
  const drawIn = (R, i) => (i / R.cs.length * .6) / 1.6 * R.draw;      // when curve i starts drawing (seconds after R.start)
  function drawRace(ctx, R, tv, box, k = 1) {
    const L = fit(R, box), tt = (tv - R.t0) / R.slow, prog = D.clamp((tv - R.start) / R.draw), n = R.cs.length, allIn = tt > R.tmax, win = R.order[0];
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
    R.cs.forEach((c, i) => {
      const p = D.clamp(prog * 1.6 - i / n * .6), m = Math.max(2, Math.round(c.pts.length * p)); if (p <= 0) return;
      ctx.beginPath(); for (let j = 0; j < m; j += 8) { const q = c.pts[j]; j ? ctx.lineTo(L.X(q[0]), L.Y(q[1])) : ctx.moveTo(L.X(q[0]), L.Y(q[1])); } const q = c.pts[m - 1]; ctx.lineTo(L.X(q[0]), L.Y(q[1]));
      ctx.strokeStyle = css(c.col, .4); ctx.lineWidth = (R.kind === "four" ? 3 : 2.2) * k; ctx.stroke();
      // the stretch the bead has already covered is painted bright and thick
      const T = c.tr.T, e = tt <= 0 ? 0 : tt >= c.tr.total ? c.pts.length - 1 : (() => { let lo = 0, hi = T.length - 1; while (hi - lo > 1) { const mm = (lo + hi) >> 1; if (T[mm] <= tt) lo = mm; else hi = mm; } return lo; })();
      if (e > 0) { ctx.beginPath(); for (let j = 0; j <= e; j += 8) { const q = c.pts[j]; j ? ctx.lineTo(L.X(q[0]), L.Y(q[1])) : ctx.moveTo(L.X(q[0]), L.Y(q[1])); } const qe = c.pts[e]; ctx.lineTo(L.X(qe[0]), L.Y(qe[1]));
        const glow = allIn && i === win ? .4 + .2 * Math.sin((tv - R.end) * 6) : .2;
        ctx.strokeStyle = css(c.col, glow); ctx.lineWidth = (allIn && i === win ? 26 : 18) * k; ctx.stroke();
        ctx.strokeStyle = css(c.col, 1); ctx.lineWidth = (R.kind === "four" ? 7 : 5) * k; ctx.stroke(); }
    });
    for (const [p, s] of [[[0, 0], "A"], [R.B, "B"]]) { ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(L.X(p[0]), L.Y(p[1]), 9 * k, 0, 7); ctx.fill(); D.text(ctx, s, L.X(p[0]) + (s === "A" ? -34 : 36) * k, L.Y(p[1]) - 6 * k, 40 * k, C.text, 700); }
    // finish rings
    R.cs.forEach((c) => { const age = tv - (R.t0 + c.tr.total * R.slow); if (age < 0 || age > .9) return; ctx.strokeStyle = css(c.col, 1 - age / .9); ctx.lineWidth = 5 * k;
      ctx.beginPath(); ctx.arc(L.X(R.B[0]), L.Y(R.B[1]), (18 + age * 130) * k, 0, 7); ctx.stroke(); });
    // beads with short glowing trails
    R.cs.forEach((c) => {
      if (prog < 1) return; const q0 = K.at(c.tr, Math.max(0, tt));
      const x = L.X(q0.x), y = L.Y(q0.y), r = (R.kind === "four" ? 22 : 17) * k, halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
      halo.addColorStop(0, css(c.col, .45)); halo.addColorStop(1, css(c.col, 0)); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, 7); ctx.fill();
      const g = ctx.createRadialGradient(x - r * .3, y - r * .3, 2, x, y, r * 1.1);
      g.addColorStop(0, "#FFFFFF"); g.addColorStop(.4, css(c.col)); g.addColorStop(1, css(c.col.map((v) => v * .45))); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    });
    ctx.restore();
  }
  // four-track board: one row per finished bead, in finishing order, bar length = time
  function board4(ctx, R, tv, x, y, w, k = 1) {
    const tt = (tv - R.t0) / R.slow;
    R.order.forEach((i, r) => { const c = R.cs[i]; if (tt < c.tr.total) return; const a = D.clamp((tt - c.tr.total) * R.slow / .25), yy = y + r * 96 * k;
      ctx.fillStyle = css(c.col, a); ctx.beginPath(); ctx.arc(x + 16 * k, yy, 14 * k, 0, 7); ctx.fill();
      D.text(ctx, (r + 1) + ". " + c.name, x + 44 * k, yy, 34 * k, css(c.col, a), 700, "left"); D.text(ctx, c.tr.total.toFixed(3) + " s", x + w, yy, 34 * k, css(c.col, a), 700, "right");
      ctx.fillStyle = css(c.col, .55 * a); ctx.fillRect(x + 44 * k, yy + 26 * k, (w - 44 * k) * c.tr.total / R.tmax * D.clamp(a * 1.5), 10 * k); });
  }
  // twelve-curve board: arrival time of each curve (flatter on the left, deeper on the right); the dots form a valley with the cycloid at the bottom
  function fanBoard(ctx, R, tv, [bx, by, bw, bh], k = 1) {
    const tt = (tv - R.t0) / R.slow, tmin = R.cs[R.order[0]].tr.total, lo = Math.floor(tmin * 20) / 20, hi = Math.ceil(R.tmax * 20) / 20, step = hi - lo > .3 ? .1 : .05;
    const X = (i) => bx + (i + .5) / R.cs.length * bw, Y = (t) => by + bh - (t - lo) / (hi - lo) * bh;
    ctx.save(); ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
    for (let t = lo; t <= hi + 1e-9; t += step) D.text(ctx, t.toFixed(2) + " s", bx - 12 * k, Y(t), 22 * k, C.dim, 600, "right");
    D.text(ctx, "time to B", bx, by - 34 * k, 24 * k, C.dim, 600, "left"); D.text(ctx, "flatter", bx + 4 * k, by + bh + 30 * k, 22 * k, C.dim, 600, "left"); D.text(ctx, "deeper", bx + bw, by + bh + 30 * k, 22 * k, C.dim, 600, "right");
    if (tt > R.tmax) { const a = D.clamp((tt - R.tmax) * R.slow / .5); ctx.strokeStyle = `rgba(245,243,239,${.5 * a})`; ctx.lineWidth = 2.5 * k; ctx.beginPath(); R.cs.forEach((c, i) => i ? ctx.lineTo(X(i), Y(c.tr.total)) : ctx.moveTo(X(i), Y(c.tr.total))); ctx.stroke(); }
    R.cs.forEach((c, i) => { const age = (tt - c.tr.total) * R.slow; if (age < 0) return; const pop = 1 + .8 * Math.max(0, 1 - age / .3);
      ctx.fillStyle = css(c.col); ctx.beginPath(); ctx.arc(X(i), Y(c.tr.total), 11 * k * pop, 0, 7); ctx.fill(); });
    const w = R.order[0], wa = (tt - R.cs[w].tr.total) * R.slow; if (wa > 0) { ctx.strokeStyle = css(C.gold, D.clamp(wa / .3)); ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(X(w), Y(R.cs[w].tr.total), 22 * k, 0, 7); ctx.stroke();
      D.text(ctx, R.cs[w].name || "fastest", X(w), Y(R.cs[w].tr.total) + 50 * k, 28 * k, css(C.gold, D.clamp(wa / .3)), 700); }
    ctx.restore();
  }
  function raceEvents(R) {
    const ev = [];   // each bead ticks at arc lengths L·(q/N)²: close together near A where it is slow, wider apart where it is fast (about one tick per 0.55 s of video)
    R.cs.forEach((c, i) => ev.push({ t: R.start + drawIn(R, i), k: c.k, gain: .35 }));
    ev.push({ t: R.t0, k: 8, voice: "wood", gain: .8 });
    R.cs.forEach((c) => { const N = Math.max(6, Math.round(c.tr.total * R.slow / .55)); for (let q = 1, j = 0; q < N; q++) { const d = c.tr.length * (q / N) ** 2; while (c.tr.S[j] < d) j++; ev.push({ t: R.t0 + c.tr.T[j] * R.slow, k: c.k, gain: .22, voice: "marimba" }); } });
    R.order.forEach((i, r) => ev.push({ t: R.t0 + R.cs[i].tr.total * R.slow, k: Math.max(2, 15 - r * (R.kind === "four" ? 3 : 1)), voice: "bell", gain: r === 0 ? .8 : .45 }));
    ev.push({ t: R.end + .5, k: 12, gain: .5 });
    return ev;
  }

  // ---------- tautochrone bowl ----------
  // beads are released at rest; new beads join exactly one full swing later (when everyone is back at rest on the starting side),
  // so the bowl goes from 3 to 6 to 12 beads without disturbing anyone. All of them reach the bottom together every half swing.
  const R_BOWL = .5, Q = K.tautoTime(R_BOWL), AMP = [[.3, .6, .9], [.15, .45, .75], [.08, .22, .37, .52, .67, .82]];
  const BALLS = AMP.flatMap((g, gi) => g.map((a) => ({ a, gi, add: 4 * Q * gi }))).sort((p, q) => p.a - q.a).map((b, r) => ({ ...b, col: hsl(r * 300 / 11, 92, 62), k: 2 + r }));
  function tauto(ctx, tv, T0, slow, cx, cy, s, k = 1) {
    const tt = (tv - T0) / slow;
    ctx.save(); ctx.lineCap = "round"; ctx.beginPath();
    for (let a = 0; a <= 2 * Math.PI + 1e-9; a += .02) { const x = cx + (R_BOWL * (a - Math.sin(a)) - Math.PI * R_BOWL) * s, y = cy - R_BOWL * (1 + Math.cos(a)) * s; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = css(C.gold, .16); ctx.lineWidth = 18 * k; ctx.stroke(); ctx.strokeStyle = css(C.gold, .9); ctx.lineWidth = 4.5 * k; ctx.stroke();
    for (let m = 0; m < 40; m++) { const age = tv - (T0 + (2 * m + 1) * Q * slow); if (age < 0 || age > 1.1) continue;
      ctx.strokeStyle = `rgba(255,255,255,${(1 - age / 1.1) * .9})`; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.arc(cx, cy, (20 + age * 260) * k, 0, 7); ctx.stroke(); }
    for (const b of BALLS) {
      if (tt < b.add) continue; const s0 = b.a * 4 * R_BOWL, age = (tt - b.add) * slow;
      if (b.gi > 0 && age < .6) { ctx.strokeStyle = css(b.col, 1 - age / .6); ctx.lineWidth = 4 * k; const p = K.bowlAt(R_BOWL, s0, 0); ctx.beginPath(); ctx.arc(cx + p.x * s, cy - p.h * s, (16 + age * 90) * k, 0, 7); ctx.stroke(); }
      for (let j = 8; j >= 1; j--) { const p = K.bowlAt(R_BOWL, s0, Math.max(0, tt - j * .04 / slow)); ctx.fillStyle = css(b.col, .4 * (1 - j / 9)); ctx.beginPath(); ctx.arc(cx + p.x * s, cy - p.h * s, (14 - j) * k, 0, 7); ctx.fill(); }
      const p = K.bowlAt(R_BOWL, s0, Math.max(0, tt)), x = cx + p.x * s, y = cy - p.h * s, g = ctx.createRadialGradient(x - 5 * k, y - 5 * k, 2, x, y, 18 * k);
      g.addColorStop(0, "#FFFFFF"); g.addColorStop(.4, css(b.col)); g.addColorStop(1, css(b.col.map((v) => v * .45))); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 15 * k, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  const firstMeet = (T0, slow) => T0 + Q * slow;
  // the same beads as rows: distance along the bowl from the bottom (left of the centre line = left side); every row hits the line together
  function lanes(ctx, tv, T0, slow, cx, y0, half, gap, k = 1) {
    const tt = (tv - T0) / slow; ctx.save(); ctx.strokeStyle = "rgba(245,243,239,.35)"; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(cx, y0 - gap); ctx.lineTo(cx, y0 + BALLS.length * gap); ctx.stroke();
    BALLS.forEach((b, r) => { const y = y0 + r * gap; ctx.strokeStyle = "rgba(160,176,198,.18)"; ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
      if (tt < b.add) return; const p = K.bowlAt(R_BOWL, b.a * 4 * R_BOWL, Math.max(0, tt)), x = cx - p.s / (4 * R_BOWL) * half;
      ctx.fillStyle = css(b.col); ctx.beginPath(); ctx.arc(x, y, 10 * k, 0, 7); ctx.fill(); });
    for (let m = 0; m < 40; m++) { const age = tv - (T0 + (2 * m + 1) * Q * slow); if (age < 0 || age > .6) continue; ctx.fillStyle = `rgba(255,255,255,${.35 * (1 - age / .6)})`; ctx.fillRect(cx - 14 * k, y0 - gap, 28 * k, (BALLS.length + 1) * gap); }
    ctx.restore();
  }
  function tautoEvents(T0, slow, end) {
    const ev = [{ t: T0, k: 8, voice: "wood", gain: .8 }], ds = .16 * 4 * R_BOWL, dt = 1 / 240;
    for (let m = 0; T0 + (2 * m + 1) * Q * slow < end; m++) { const t = T0 + (2 * m + 1) * Q * slow; [2, 7, 12].forEach((k) => ev.push({ t, k, voice: "bell", gain: .6 })); ev.push({ t, k: 14, gain: .5 }); }
    for (const b of BALLS) {
      const s0 = b.a * 4 * R_BOWL, t1 = T0 + b.add * slow; if (t1 >= end) continue; if (b.gi > 0) ev.push({ t: t1, k: b.k, gain: .4 });
      let last = Math.floor(s0 / ds); for (let t = t1 + dt; t < end; t += dt) { const c = Math.floor(K.bowlAt(R_BOWL, s0, (t - T0) / slow).s / ds); if (c !== last) { ev.push({ t, k: b.k, gain: .18, voice: "marimba" }); last = c; } }
    }
    return ev;
  }

  // ---------- long video ----------
  const S = [["hook", 0, 6], ["race", 6, 36], ["fan", 36, 63], ["tauto", 63, 91], ["close", 91, 100]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const B1 = [2, 1];
  const HOOK = race("fan", B1, 0, 4.6, .3), CLOSE = race("fan", B1, 91, 4.6, .3);
  const RACES = [[2, 1], [2.4, .6], [1.4, 1.2]].map((B, i) => race("four", B, 6 + 10 * i, 7.6));
  const FANS = [[2, 1], [2.6, .8]].map((B, i) => race("fan", B, 36 + 13.5 * i, 10.6, 1.2));
  const TAUTO0 = 63.5, TAUTO_SLOW = 3;
  const BOX4 = [150, 240, 1060, 740], FANBOX = [110, 230, 1130, 790], DOTBOX = [1380, 300, 450, 520];
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t);
    D.text(ctx, NOTE, W / 2, 1052, 22, C.dim, 500);
    if (sc.id === "hook" || sc.id === "close") { const R = sc.id === "hook" ? HOOK : CLOSE; drawRace(ctx, R, t, FANBOX); fanBoard(ctx, R, t, DOTBOX); D.speed(ctx, R.slow + "× SLOWER", W);
      D.text(ctx, sc.id === "hook" ? "Twelve slopes. Which bead gets to B first?" : "The fastest way down is a cycloid.", W / 2, 80, 56, C.text, 700, "center", D.fade(t, sc.t0, sc.t1 + 1)); return; }
    if (sc.id === "race") { const i = Math.min(2, Math.floor((t - 6) / 10)), R = RACES[i], f = D.fade(t, R.start, R.start + 10, .3);
      ctx.save(); ctx.globalAlpha = f; drawRace(ctx, R, t, BOX4); board4(ctx, R, t, 1330, 380, 480); ctx.restore(); D.speed(ctx, R.slow + "× SLOWER", W);
      D.text(ctx, ["Four slopes from A to B. Which bead wins?", "Move B. Race again.", "Move B again."][i], W / 2, 80, 54, C.text, 700, "center", f); return; }
    if (sc.id === "fan") { const i = Math.min(1, Math.floor((t - 36) / 13.5)), R = FANS[i], f = D.fade(t, R.start, R.start + 13.5, .3);
      ctx.save(); ctx.globalAlpha = f; drawRace(ctx, R, t, FANBOX); fanBoard(ctx, R, t, DOTBOX); ctx.restore(); D.speed(ctx, R.slow + "× SLOWER", W);
      D.text(ctx, t < R.end ? (i ? "Another finish point." : "From the straight line to deeper than the cycloid.") : "Fastest: the cycloid.", W / 2, 80, 52, C.text, 700, "center", f); return; }
    tauto(ctx, t, TAUTO0, TAUTO_SLOW, 960, 955, 560); D.speed(ctx, TAUTO_SLOW + "× SLOWER", W);
    D.text(ctx, t < firstMeet(TAUTO0, TAUTO_SLOW) ? "Flip the cycloid into a bowl. Release from different heights." : "Every height reaches the bottom at the same moment.", W / 2, 80, 52, C.text, 700, "center", D.fade(t, sc.t0, sc.t1));
  }
  function zoomWrap(fn, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); fn(ctx, t); ctx.restore(); }; }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .025 * (t - sc.t0) / (sc.t1 - sc.t0); });
  const fullEvents = () => [...raceEvents(HOOK), ...RACES.flatMap(raceEvents), ...FANS.flatMap(raceEvents), { t: 63.1, k: 5, voice: "bell", gain: .5 }, ...tautoEvents(TAUTO0, TAUTO_SLOW, 90.9),
    ...raceEvents(CLOSE), { t: CLOSE.end + 1.3, k: 9, voice: "bell", gain: .6 }].filter((e) => e.t < 99.4);

  // ---------- Shorts ----------
  const S1A = race("four", B1, 0, 8.1, .6), S1B = race("fan", B1, 10.5, 16.2, 1.2), TBOX = [80, 440, 920, 700], TDOT = [160, 1260, 800, 420];
  function s1(ctx, t) {
    const R = t < 10.5 ? S1A : S1B, f = t < 10.5 ? D.fade(t, -1, 10.5, .3) : D.fade(t, 10.5, 33, .3);
    ctx.save(); ctx.globalAlpha = f; drawRace(ctx, R, t, TBOX, 1.1); if (R === S1A) board4(ctx, R, t, 120, 1300, 840, 1.15); else fanBoard(ctx, R, t, TDOT, 1.2); ctx.restore();
    D.lines(ctx, R === S1A ? ["Four slopes.", "Which bead wins?"] : t < R.end ? ["Now twelve slopes."] : ["The cycloid", "wins again."], 540, 170, 76, C.text, f);
    D.text(ctx, "no friction · " + R.slow + "× slower", 540, 1840, 30, C.dim, 600);
  }
  const S2_0 = 1, S2_SLOW = 3;
  function s2(ctx, t) {
    tauto(ctx, t, S2_0, S2_SLOW, 540, 1080, 330, 1); lanes(ctx, t, S2_0, S2_SLOW, 540, 1250, 440, 40, 1);
    D.lines(ctx, t < firstMeet(S2_0, S2_SLOW) ? ["Different heights.", "Who reaches the bottom first?"] : ["Different heights.", "Same arrival. Every time."], 540, 200, 70, C.text, 1);
    D.text(ctx, "cycloid bowl · no friction · " + S2_SLOW + "× slower", 540, 1840, 30, C.dim, 600);
  }
  const timelines = [
    { id: "full", name: "11 Brachistochrone (long)", file: "Command Loom - 11 Brachistochrone.mp4", W: 1920, H: 1080, dur: 100, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Which slope wins", file: "Command Loom - Short 1 - Which Slope Wins.mp4", W: 1080, H: 1920, dur: 32, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .03 * t / 32), voice: "glass",
      events: () => [...raceEvents(S1A), ...raceEvents(S1B)].filter((e) => e.t < 31.4) },
    { id: "s2", name: "Short 2 · Same moment", file: "Command Loom - Short 2 - Same Moment.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => tautoEvents(S2_0, S2_SLOW, 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 11 Brachistochrone", timelines };
  root.BrachVideo = { S, HOOK, CLOSE, RACES, FANS, S1A, S1B, FAN_S, BALLS, R_BOWL, Q, TAUTO0, TAUTO_SLOW, S2_0, S2_SLOW, timelines };
})(typeof window !== "undefined" ? window : globalThis);
