// 10 Same Average: 10,000 players of the +50 % / −40 % coin game (coin.js). Every dot, line and percentage is measured from the run.
(function (root) {
  "use strict";
  const K = root.Coin, D = root.CLDraw;
  const C = { bg: "#07090E", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0", grid: "rgba(160,176,198,.18)" };
  const N = 10000, R = 40, SEED = 2026;
  let W = null, ST = null, XS = null, PICK = null;
  const ready = (async () => {
    W = K.run(N, R, SEED); ST = W.map((w) => K.stats(w));
    let a = 7 >>> 0; XS = new Float32Array(N); for (let i = 0; i < N; i++) { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; XS[i] = a / 4294967296; }
    const order = [...Array(N).keys()].sort((i, j) => W[R][i] - W[R][j]); PICK = [order[Math.floor(N * .99)], order[Math.floor(N * .5)], order[Math.floor(N * .1)]];
  })();
  const money = (v) => v >= 1e6 ? "$" + (v / 1e6).toFixed(1) + "M" : v >= 1e4 ? "$" + Math.round(v / 1e3) + "k" : v >= 100 ? "$" + Math.round(v).toLocaleString("en-US") : v >= 1 ? "$" + v.toFixed(2) : v >= .01 ? Math.round(v * 100) + "¢" : "< 1¢";
  const pct = (v) => Math.round(v * 100) + "%";
  const LO = -4.3, HI = 4.3, lg = (v) => Math.log10(Math.max(v, 1e-12) / K.START);
  // money of player i at fractional round r (geometric interpolation between rounds)
  const at = (i, r) => { const a = Math.floor(r), b = Math.min(R, a + 1), u = r - a; return a >= R ? W[R][i] : W[a][i] * Math.pow(W[b][i] / W[a][i], D.smooth(u)); };
  function axis(ctx, x0, x1, Y, k = 1) {
    for (const [v, s] of [[1e6, "$1M"], [1e4, "$10k"], [100, "$100 start"], [1, "$1"], [.01, "1¢"]]) { const y = Y(lg(v));
      ctx.strokeStyle = v === 100 ? "rgba(245,243,239,.45)" : C.grid; ctx.lineWidth = (v === 100 ? 2 : 1) * k; ctx.setLineDash(v === 100 ? [] : [6 * k, 8 * k]); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
      D.text(ctx, s, x0 - 14 * k, y, 22 * k, v === 100 ? C.text : C.dim, 600, "right"); }
  }
  // money levels: after a rounds a player with h heads has 100 · 1.5^h · 0.6^(a−h). Bars show how many players sit at each level;
  // between rounds every bar splits into a tails part (moving down) and a heads part (moving up), using the real flips.
  let LV = null;
  function levels() {
    if (LV) return LV; LV = [];
    for (let a = 0; a < R; a++) { const H = new Int32Array(N); const split = Array.from({ length: a + 1 }, () => [0, 0]);
      for (let i = 0; i < N; i++) { let h = 0; for (let r = 1; r <= a; r++) if (K.heads(SEED, i, r)) h++; split[h][K.heads(SEED, i, a + 1) ? 1 : 0]++; }
      LV.push(split); }
    return LV;
  }
  const levelLog = (a, h) => lg(K.START * Math.pow(K.UP, h) * Math.pow(K.DOWN, a - h));
  function swarm(ctx, r, x0, x1, y0, y1, k = 1, lines = true) {
    const Y = (l) => y1 - (D.clamp(l, LO, HI) - LO) / (HI - LO) * (y1 - y0), cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
    axis(ctx, x0, x1, Y, k); const lv = levels();
    const a = Math.min(R - 1, Math.floor(r)), u = r >= R ? 1 : D.smooth(r - a), split = lv[a];
    let mx = 0; for (const [tl, hd] of split) mx = Math.max(mx, tl + hd); let mx2 = 0;
    const next = new Map(); split.forEach(([tl, hd], h) => { next.set(h, (next.get(h) || 0) + tl); next.set(h + 1, (next.get(h + 1) || 0) + hd); }); for (const v of next.values()) mx2 = Math.max(mx2, v);
    const scale = half / (mx + (mx2 - mx) * u), th = 13 * k;
    split.forEach(([tl, hd], h) => { const l0 = levelLog(a, h);
      for (const [cnt, dl, side] of [[tl, Math.log10(K.DOWN), -1], [hd, Math.log10(K.UP), 1]]) { if (!cnt) continue;
        const l = l0 + dl * u, w = cnt * scale, up = l > 1e-9; ctx.fillStyle = up ? "rgba(255,189,56,.85)" : "rgba(53,196,240,.85)";
        const xa = u < .02 ? cx - (tl + hd) * scale / 2 + (side > 0 ? tl * scale : 0) : side < 0 ? cx - w : cx; ctx.fillRect(xa, Y(l) - th / 2, w, th); } });
    D.text(ctx, "bar length = number of players at each amount", cx, y1 + 34 * k, 22 * k, C.dim, 600);
    if (!lines) return Y;
    const b = Math.min(R, Math.floor(r)), st = ST[b], st2 = ST[Math.min(R, b + 1)], uu = r >= R ? 0 : D.smooth(r - b);
    const mean = st.mean * Math.pow(st2.mean / st.mean, uu), med = st.median * Math.pow(st2.median / st.median, uu);
    for (const [v, c, lab, dash] of [[mean, C.amber, "average " + money(mean), []], [med, C.cyan, "median " + money(med), [10 * k, 8 * k]]]) {
      const y = Y(lg(v)); ctx.strokeStyle = c; ctx.lineWidth = 3 * k; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
      D.text(ctx, lab, x1 + 14 * k, y, 28 * k, c, 700, "left"); }
    return Y;
  }
  function panel(ctx, r, x, y, k = 1) {
    const st = ST[Math.min(R, Math.round(r))];
    D.text(ctx, "Round " + Math.min(R, Math.round(r)) + " / " + R, x, y, 44 * k, C.text, 700, "left");
    D.text(ctx, pct(st.above), x, y + 110 * k, 84 * k, C.amber, 700, "left"); D.text(ctx, "have more than they started with", x, y + 170 * k, 26 * k, C.dim, 600, "left");
    D.text(ctx, pct(st.top1), x, y + 280 * k, 84 * k, C.text, 700, "left"); D.text(ctx, "of all money held by the richest 1%", x, y + 340 * k, 26 * k, C.dim, 600, "left");
  }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["rules", 4, 16], ["three", 16, 30], ["crowd", 30, 77], ["why", 77, 94], ["close", 94, 102]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const CROWD_RATE = 1.1, roundAt = (t) => D.clamp((t - S[3].t0 - 1) / CROWD_RATE, 0, R);
  function coin(ctx, x, y, r, face, k = 1) {
    const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, "#FFE7A8"); g.addColorStop(1, "#B9852A");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(255,240,200,.8)"; ctx.lineWidth = 3 * k; ctx.stroke();
    D.text(ctx, face, x, y + 2, r * .9, "#5A3B08", 700);
  }
  function drawFullInner(ctx, t) {
    const W1 = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W1, H);
    if (sc.id === "hook" || sc.id === "crowd" || sc.id === "close") {
      const r = sc.id === "crowd" ? roundAt(t) : R; swarm(ctx, r, 260, 1180, 190, 1000); panel(ctx, r, 1440, 280);
      if (sc.id === "hook") { D.text(ctx, "The average got richer. Most people got poorer.", W1 / 2, 80, 58, C.text, 700); D.text(ctx, "Later in this video · 10,000 simulated players", W1 / 2, 140, 30, C.amber, 600); }
      if (sc.id === "crowd") { const st = ST[Math.round(r)]; D.lines(ctx, [r < 6 ? "10,000 players. Each has their own coin." : r < 30 ? "The average keeps rising…" : "…while the typical player sinks."], W1 / 2, 70, 52, C.text, f);
        D.speed(ctx, CROWD_RATE + " S PER ROUND", W1); }
      if (sc.id === "close") { D.text(ctx, "The average is not what happens to you.", W1 / 2, 80, 58, C.text, 700, "center", f);
        D.text(ctx, "Coin game after O. Peters, Nature Physics 15 (2019) · simulated, every number measured", W1 / 2, 1050, 24, C.dim, 500, "center", f); }
      return;
    }
    if (sc.id === "rules") {
      const spin = u * 2.4, flip = Math.floor(spin + .5) % 2; ctx.save(); ctx.translate(520, 560); ctx.scale(Math.max(.06, Math.abs(Math.cos(Math.PI * spin))), 1); coin(ctx, 0, 0, 170, flip ? "H" : "T"); ctx.restore();
      const L = [["Heads: your money × 1.5  (+50%)", C.amber], ["Tails: your money × 0.6  (−40%)", C.cyan], ["Average per flip: ½ × 1.5 + ½ × 0.6 = 1.05", C.text], ["+5% per flip, on average. A good deal?", C.text]];
      L.forEach(([s, c], i) => D.text(ctx, s, 820, 380 + i * 100, 40, c, 700, "left", D.clamp((u - .8 - i * 2.2) / .5) * f));
      D.text(ctx, "A fair coin. Everyone starts with $100.", W1 / 2, 80, 56, C.text, 700, "center", f); return;
    }
    if (sc.id === "three") {
      const x0 = 260, x1 = 1500, y0 = 200, y1 = 960, Y = (l) => y1 - (D.clamp(l, LO, HI) - LO) / (HI - LO) * (y1 - y0), X = (r) => x0 + r / R * (x1 - x0);
      axis(ctx, x0, x1, Y); const rr = D.clamp((u - .8) / 11) * R;
      D.text(ctx, "round", x1, y1 + 40, 24, C.dim, 600, "right");
      PICK.forEach((i, j) => { const c = [C.amber, C.text, C.cyan][j]; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath();
        for (let r = 0; r <= rr; r += .25) { const p = [X(r), Y(lg(at(i, r)))]; r ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
        const v = at(i, rr); D.text(ctx, money(v), X(rr) + 16, Y(lg(v)), 30, c, 700, "left"); });
      D.text(ctx, "Three of the 10,000 players: lucky, typical, unlucky.", W1 / 2, 80, 52, C.text, 700, "center", f);
      D.text(ctx, "picked by final rank: top 1%, middle, bottom 10%", W1 / 2, 1040, 26, C.dim, 500, "center", f); return;
    }
    if (sc.id === "why") {
      const steps = [["$100", 0], ["× 1.5 → $150", 1.8], ["× 0.6 → $90", 3.6]];
      D.text(ctx, "One win and one loss:", 260, 300, 52, C.text, 700, "left", D.clamp((u - .3) / .5) * f);
      steps.forEach(([s, at], i) => D.text(ctx, s, 260 + i * 470, 420, 64, [C.text, C.amber, C.cyan][i], 700, "left", D.clamp((u - at) / .5) * f));
      D.text(ctx, "1.5 × 0.6 = 0.9: you lose 10% every two flips.", 260, 560, 46, C.text, 700, "left", D.clamp((u - 6) / .5) * f);
      D.text(ctx, "Typical change per flip: √0.9 = 0.949, about −5%.", 260, 640, 40, C.dim, 600, "left", D.clamp((u - 8.5) / .5) * f);
      D.text(ctx, "The average stays high because a few lucky players get enormous:", 260, 780, 38, C.text, 600, "left", D.clamp((u - 11) / .5) * f);
      D.text(ctx, "after 40 rounds the richest 1% hold " + pct(ST[R].top1) + " of all the money.", 260, 840, 38, C.amber, 700, "left", D.clamp((u - 11) / .5) * f);
      D.text(ctx, "Why?", W1 / 2, 80, 60, C.text, 700, "center", f);
    }
  }
  // slow camera push on every scene except the crowd (which moves by itself)
  function zoomWrap(inner, W, H, dur) { return (ctx, t) => { const sc = dur ? null : sceneAt(t), u = dur ? t / dur : (t - sc.t0) / (sc.t1 - sc.t0), z = sc && sc.id === "crowd" ? 1 : 1 + .05 * u;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const drawFull = zoomWrap(drawFullInner, 1920, 1080);
  // one soft note per round; pitch follows the share of players above $100
  const roundNotes = (offset, rate, gain = .55) => Array.from({ length: R }, (_, j) => ({ t: offset + (j + 1) * rate, k: Math.round(15 * ST[j + 1].above), gain }));
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 9 }, { t: .3, k: 3 },
      ...[0, 1, 2, 3].map((i) => ({ t: s.rules.t0 + .8 + i * 2.2, k: [12, 3, 8, 10][i], gain: .6 })),
      ...Array.from({ length: R }, (_, r) => ({ t: s.three.t0 + .8 + (r + 1) / R * 11, k: K.heads(SEED, PICK[1], r + 1) ? 10 : 4, gain: .45 })),
      ...roundNotes(s.crowd.t0 + 1, CROWD_RATE),
      ...[[0, 8], [1.8, 12], [3.6, 3], [6, 6], [8.5, 5], [11, 13]].map(([a, k]) => ({ t: s.why.t0 + a, k, gain: .6 })), { t: s.close.t0 + .3, k: 6 }];
  }

  // ---------- Shorts ----------
  const S1_0 = 2.5, S1_RATE = .65, s1Round = (t) => D.clamp((t - S1_0) / S1_RATE, 0, R);
  function drawS1(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const r = s1Round(t), st = ST[Math.round(r)];
    swarm(ctx, r, 170, 760, 430, 1380, 1.1);
    D.lines(ctx, r < R ? ["10,000 people.", "Same fair coin."] : ["Average: richer.", "Most: poorer."], 540, 170, 78, C.text, 1);
    D.text(ctx, "Heads +50% · Tails −40%", 540, 340, 36, C.amber, 600);
    D.text(ctx, "Round " + Math.round(r) + " / " + R, 540, 1470, 48, C.text, 700); D.text(ctx, pct(st.above) + " are above $100", 540, 1540, 44, C.amber, 700);
  }
  // Short 2: one player, alternating wins and losses (exactly half heads)
  const S2 = (() => { const v = [100]; for (let i = 0; i < 20; i++) v.push(v[i] * (i % 2 ? K.DOWN : K.UP)); return v; })();
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920);
    D.lines(ctx, ["+50%, then −40%.", "Are you up?"], 540, 170, 80, C.text, 1);
    const n = D.clamp(Math.floor((t - 3) / 1.1) + 1, 0, 20), x0 = 120, x1 = 960, y0 = 620, y1 = 1300, X = (i) => x0 + i / 20 * (x1 - x0), Y = (v) => y1 - (v / 160) * (y1 - y0);
    ctx.strokeStyle = "rgba(245,243,239,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, Y(100)); ctx.lineTo(x1, Y(100)); ctx.stroke(); D.text(ctx, "$100", x0 - 10, Y(100), 26, C.text, 600, "right");
    ctx.strokeStyle = C.amber; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i <= n; i++) { i ? ctx.lineTo(X(i), Y(S2[i])) : ctx.moveTo(X(i), Y(S2[i])); } ctx.stroke();
    for (let i = 1; i <= n; i++) { ctx.fillStyle = i % 2 ? C.amber : C.cyan; ctx.beginPath(); ctx.arc(X(i), Y(S2[i]), 9, 0, 7); ctx.fill(); }
    D.text(ctx, money(S2[n]), 540, 1440, 110, n === 20 ? C.cyan : C.text, 700);
    D.text(ctx, n === 0 ? "start" : (Math.ceil(n / 2)) + " wins, " + Math.floor(n / 2) + " losses", 540, 1540, 40, C.dim, 600);
    if (n === 20) D.text(ctx, "Half wins, half losses: −65%.", 540, 470, 48, C.amber, 700, "center", D.clamp((t - 3 - 19 * 1.1 - 1.2) / .5));
  }
  const timelines = [
    { id: "full", name: "10 Same Average (long)", file: "Command Loom - 10 Same Average.mp4", W: 1920, H: 1080, dur: 102, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · 10,000 people, one coin", file: "Command Loom - Short 1 - Same Coin.mp4", W: 1080, H: 1920, dur: 32, draw: zoomWrap(drawS1, 1080, 1920, 32), voice: "marimba", events: () => roundNotes(S1_0, S1_RATE) },
    { id: "s2", name: "Short 2 · +50% then −40%", file: "Command Loom - Short 2 - Up 50 Down 40.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(drawS2, 1080, 1920, 30), voice: "marimba",
      events: () => Array.from({ length: 20 }, (_, i) => ({ t: 3 + i * 1.1, k: i % 2 ? 4 : 10, gain: .55 })) }
  ];
  root.CLVideo = { title: "Command Loom · 10 Same Average", timelines, ready };
  root.SameAvgVideo = { S, N, R, SEED, get W() { return W; }, get ST() { return ST; }, get PICK() { return PICK; }, S2, timelines, ready, fullEvents };
})(typeof window !== "undefined" ? window : globalThis);
