// 10 Collatz: every path, count and peak is computed exactly with collatz.js.
(function (root) {
  "use strict";
  const K = root.Collatz, D = root.CLDraw, FPS = 30;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0" };
  const NMAX = 10000, EVEN = 8.65 * Math.PI / 180, ODD = -16 * Math.PI / 180;      // coral turns (a popular drawing rule, not part of the maths)
  const mixc = (u) => [Math.round(53 + (255 - 53) * u), Math.round(196 + (189 - 196) * u), Math.round(240 + (56 - 240) * u)];
  let TAB = null, P27 = null, CORAL = null, BOX = null, MAXN = 0, FULLIMG = null, SHORTIMG = null;
  function coralPaint(g, m, s, ox, oy) { const col = mixc(Math.sqrt(m / NMAX)); g.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${Math.min(.9, .07 + 2 / Math.sqrt(m)).toFixed(3)})`; g.beginPath();
    coralPts(m).forEach(([x, y], i) => (i ? g.lineTo(ox + x * s, oy + y * s) : g.moveTo(ox + x * s, oy + y * s))); g.stroke(); }
  // yield to the browser without timers (hidden tabs throttle setTimeout to once a minute; MessageChannel is not throttled)
  const yieldNow = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  async function coralAsync(W, H, cx, cy, size) {
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); g.lineWidth = 1.1; g.lineCap = "round";
    const s = size / Math.max(BOX.x1 - BOX.x0, BOX.y1 - BOX.y0), ox = cx - (BOX.x0 + BOX.x1) / 2 * s, oy = cy - (BOX.y0 + BOX.y1) / 2 * s;
    for (let m = 1; m <= NMAX; m++) { coralPaint(g, m, s, ox, oy); if (m % 150 === 0) await yieldNow(); }
    return c;
  }
  // coral: draw each number's path backwards from 1, turning left on even values and right on odd values
  function coralPts(n) { const p = K.path(n).reverse(); let x = 0, y = 0, a = -Math.PI / 2; const pts = [[0, 0]];
    for (let i = 1; i < p.length; i++) { a += p[i] % 2 === 0 ? EVEN : ODD; x += Math.cos(a); y += Math.sin(a); pts.push([x, y]); } return pts; }
  const ready = (async () => {
    TAB = K.table(NMAX); P27 = K.path(27); let mx = 0; for (let n = 1; n <= NMAX; n++) if (TAB.st[n] > TAB.st[mx]) mx = n; MAXN = mx;
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0; for (let n = 1; n <= NMAX; n++) for (const [x, y] of coralPts(n)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    BOX = { x0, x1, y0, y1 };
    // the finished corals are drawn once here, in small batches, so the page never locks up
    if (typeof document !== "undefined" && document.createElement("canvas").getContext("2d").beginPath) {
      FULLIMG = await coralAsync(1920, 1080, 960, 600, 860); SHORTIMG = await coralAsync(1080, 1920, 540, 1000, 1000); }
  })();
  // incremental coral on an offscreen canvas (paths 1..n), restarted only if asked to go back
  function coralLayer(key, W, H, cx, cy, size) {
    const st = CORAL && CORAL[key] || ((CORAL = CORAL || {})[key] = { c: null, n: 0 });
    return (n) => {
      if (!st.c || st.n > n) { st.c = document.createElement("canvas"); st.c.width = W; st.c.height = H; st.n = 0; }
      const g = st.c.getContext("2d"), s = size / Math.max(BOX.x1 - BOX.x0, BOX.y1 - BOX.y0), ox = cx - (BOX.x0 + BOX.x1) / 2 * s, oy = cy - (BOX.y0 + BOX.y1) / 2 * s;
      g.lineWidth = 1.1; g.lineCap = "round";
      if (n >= NMAX && (key === "full" ? FULLIMG : SHORTIMG)) return key === "full" ? FULLIMG : SHORTIMG;     // finished coral: use the copy drawn at load
      for (let m = st.n + 1; m <= n; m++) coralPaint(g, m, s, ox, oy);
      st.n = n; return st.c;
    };
  }
  const fmt = (v) => v.toLocaleString("en-US");

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["rule", 4, 18], ["p27", 18, 36], ["coral", 36, 70], ["chart", 70, 90], ["close", 90, 98]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const coralN = (u, dur) => Math.max(1, Math.round(Math.pow(NMAX, D.clamp(u / (dur - 3)))));
  let fullCoral = null;
  function path27(ctx, n, x0, y0, w, h, k = 1) {
    const mx = Math.max(...P27), X = (i) => x0 + i / (P27.length - 1) * w, Y = (v) => y0 + h - v / mx * h;
    ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    ctx.strokeStyle = C.amber; ctx.lineWidth = 3.5 * k; ctx.beginPath(); for (let i = 0; i <= n; i++) i ? ctx.lineTo(X(i), Y(P27[i])) : ctx.moveTo(X(i), Y(P27[i])); ctx.stroke();
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(X(n), Y(P27[n]), 8 * k, 0, 7); ctx.fill();
    const ip = P27.indexOf(mx); if (n >= ip) { D.text(ctx, "peak " + fmt(mx) + " (step " + ip + ")", X(ip), Y(mx) - 30 * k, 28 * k, C.amber, 700); }
    return { X, Y };
  }
  function drawFullInner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, dur = sc.t1 - sc.t0, f = D.fade(t, sc.t0, sc.t1); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    fullCoral = fullCoral || coralLayer("full", W, H, 960, 600, 860);
    if (sc.id === "hook" || sc.id === "close") { const z = 1 + .05 * u / dur; ctx.save(); ctx.translate(960, 600); ctx.scale(z, z); ctx.translate(-960, -600); ctx.drawImage(fullCoral(NMAX), 0, 0); ctx.restore();
      D.topShade(ctx, W, 230);
      if (sc.id === "hook") { D.text(ctx, "One simple rule. Nobody can prove where it leads.", W / 2, 80, 58, C.text, 700); D.text(ctx, "Later in this video · the paths of 1 to 10,000", W / 2, 142, 30, C.amber, 600); return; }
      D.text(ctx, "Every number tried so far ends at 1. Nobody knows why.", W / 2, 80, 54, C.text, 700, "center", f);
      D.text(ctx, "Collatz (1937) · checked by computer below 2⁷¹ (Barina et al., 2025) · coral turns: +8.65° even, −16° odd", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
    if (sc.id === "rule") {
      D.text(ctx, "Pick any whole number.", W / 2, 230, 56, C.text, 700, "center", D.clamp((u - .3) / .5) * f);
      D.text(ctx, "Even? Halve it.", W / 2 - 330, 340, 46, C.cyan, 700, "center", D.clamp((u - 1.3) / .5) * f); D.text(ctx, "Odd? Triple it and add 1.", W / 2 + 280, 340, 46, C.amber, 700, "center", D.clamp((u - 2.3) / .5) * f);
      const p = K.path(6), n = Math.min(p.length - 1, Math.floor(D.clamp((u - 4) / 7) * p.length));
      p.slice(0, n + 1).forEach((v, i) => { const x = 360 + i * 150, col = v % 2 === 0 ? C.cyan : C.amber; D.text(ctx, String(v), x, 560, 72, i === n ? "#FFFFFF" : col, 700); if (i < n) D.text(ctx, "→", x + 75, 560, 40, C.dim, 600); });
      if (n === p.length - 1) D.text(ctx, "6 reaches 1 in " + (p.length - 1) + " steps. Then it would loop 4 → 2 → 1 forever.", W / 2, 720, 40, C.text, 600, "center", D.clamp((u - 11.4) / .5) * f);
      D.text(ctx, "The rule", W / 2, 80, 60, C.text, 700, "center", f); return;
    }
    if (sc.id === "p27") {
      const n = Math.min(P27.length - 1, Math.floor(D.clamp((u - 1) / 14) * P27.length)); path27(ctx, n, 220, 230, 1480, 680);
      D.text(ctx, "27", 220, 960, 40, C.text, 700, "left"); D.text(ctx, "step " + n + " · value " + fmt(P27[n]), 1700, 960, 40, C.text, 700, "right");
      D.text(ctx, n < P27.length - 1 ? "Now start from 27." : "27 climbs to 9,232 and needs 111 steps to reach 1.", W / 2, 80, 56, C.text, 700, "center", f); return;
    }
    if (sc.id === "coral") {
      const n = coralN(u, dur); ctx.drawImage(fullCoral(n), 0, 0); D.topShade(ctx, W, 230);
      D.text(ctx, "Draw every path backwards from 1: turn left on even, right on odd.", W / 2, 80, 48, C.text, 700, "center", f);
      D.text(ctx, "1 to " + fmt(n), 1780, 980, 64, C.amber, 700, "right"); D.text(ctx, "numbers drawn", 1780, 1036, 26, C.dim, 600, "right"); return;
    }
    if (sc.id === "chart") {
      const x0 = 220, x1 = 1700, y0 = 220, y1 = 900, mx = TAB.st[MAXN], X = (n) => x0 + n / NMAX * (x1 - x0), Y = (s) => y1 - s / (mx * 1.05) * (y1 - y0), upto = Math.round(D.clamp((u - .5) / 8) * NMAX);
      ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
      for (let s = 0; s <= 250; s += 50) D.text(ctx, String(s), x0 - 14, Y(s), 22, C.dim, 600, "right"); for (let n = 0; n <= NMAX; n += 2500) D.text(ctx, fmt(n), X(n), y1 + 30, 22, C.dim, 600);
      D.text(ctx, "steps to reach 1", x0, y0 - 30, 24, C.dim, 600, "left");
      ctx.fillStyle = "rgba(53,196,240,.55)"; for (let n = 1; n <= upto; n++) ctx.fillRect(X(n) - 1, Y(TAB.st[n]) - 1, 2.2, 2.2);
      if (upto >= 27) { ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(X(27), Y(111), 9, 0, 7); ctx.fill(); D.text(ctx, "27: 111", X(27) + 16, Y(111) - 20, 28, C.amber, 700, "left"); }
      if (upto >= MAXN) { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(X(MAXN), Y(mx), 9, 0, 7); ctx.fill(); D.text(ctx, fmt(MAXN) + ": " + mx + " steps, the most below 10,000", X(MAXN), Y(mx) - 28, 28, C.text, 700); }
      D.text(ctx, "Steps to reach 1, for every number up to 10,000", W / 2, 80, 54, C.text, 700, "center", f);
    }
  }
  // slow camera push on every scene so no stretch of the video stands still
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const drawFull = zoomWrap(drawFullInner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .06 * (t - sc.t0) / (sc.t1 - sc.t0); });
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x])), ev = [{ t: .3, k: 4 }, { t: .3, k: 11 }];
    [.3, 1.3, 2.3].forEach((a, i) => ev.push({ t: s.rule.t0 + a, k: [7, 3, 12][i], gain: .6 }));
    const p6 = K.path(6); p6.forEach((v, i) => ev.push({ t: s.rule.t0 + 4 + i * 7 / p6.length, k: v % 2 ? 11 : 5, gain: .55 }));
    const mx = Math.log(9232); P27.forEach((v, i) => ev.push({ t: s.p27.t0 + 1 + i * 14 / P27.length, k: Math.round(15 * Math.log(v) / mx), gain: .4 }));
    for (const m of [1, 10, 100, 1000, 10000]) ev.push({ t: s.coral.t0 + Math.log(m) / Math.log(NMAX) * (s.coral.t1 - s.coral.t0 - 3), k: 3 + Math.round(Math.log10(m)) * 2, gain: .6 });
    ev.push({ t: s.chart.t0 + .5 + 27 / NMAX * 8, k: 12, gain: .6 }, { t: s.chart.t0 + .5 + MAXN / NMAX * 8, k: 14, gain: .6 }, { t: s.close.t0 + .3, k: 5 });
    return ev;
  }

  // ---------- Shorts ----------
  function drawS1(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const n = Math.min(P27.length - 1, Math.floor(D.clamp((t - 2) / 22) * P27.length));
    path27(ctx, n, 90, 520, 900, 820, 1.1);
    D.lines(ctx, n < P27.length - 1 ? ["Start at 27.", "Halve if even, 3n+1 if odd."] : ["111 steps.", "Peak: 9,232."], 540, 170, 70, C.text, 1);
    D.text(ctx, "step " + n, 540, 1460, 64, C.text, 700); D.text(ctx, fmt(P27[n]), 540, 1550, 80, C.amber, 700);
  }
  let shortCoral = null;
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); shortCoral = shortCoral || coralLayer("short", 1080, 1920, 540, 1000, 1000);
    const n = Math.max(1, Math.round(Math.pow(NMAX, D.clamp((t - 1.5) / 25)))); ctx.drawImage(shortCoral(n), 0, 0);
    D.lines(ctx, ["Every number from", "1 to " + fmt(n) + "."], 540, 170, 72, C.text, 1);
    D.text(ctx, "Even: turn left · Odd: turn right", 540, 1640, 38, C.amber, 600); D.text(ctx, "All paths end at 1 (bottom)", 540, 1700, 30, C.dim, 600);
  }
  const timelines = [
    { id: "full", name: "10 Collatz (long)", file: "Command Loom - 10 Collatz.mp4", W: 1920, H: 1080, dur: 98, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · 27 takes 111 steps", file: "Command Loom - Short 1 - 27 Takes 111 Steps.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(drawS1, 1080, 1920, (t) => 1 + .06 * t / 30), voice: "glass",
      events: () => { const mx = Math.log(9232); return P27.map((v, i) => ({ t: 2 + i * 22 / P27.length, k: Math.round(15 * Math.log(v) / mx), gain: .45 })); } },
    { id: "s2", name: "Short 2 · The Collatz coral", file: "Command Loom - Short 2 - Collatz Coral.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(drawS2, 1080, 1920, (t) => 1 + .08 * t / 30), voice: "glass",
      events: () => [1, 10, 100, 1000, 10000].map((m) => ({ t: 1.5 + Math.log(m) / Math.log(NMAX) * 25, k: 3 + Math.round(Math.log10(m)) * 2, gain: .65 })) }
  ];
  root.CLVideo = { title: "Command Loom · 10 Collatz", timelines, ready };
  root.CollatzVideo = { S, NMAX, get TAB() { return TAB; }, get P27() { return P27; }, get MAXN() { return MAXN; }, timelines, ready };
})(typeof window !== "undefined" ? window : globalThis);
