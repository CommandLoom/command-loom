// 12 Sorting Sounds: four sorting algorithms on the same shuffled bars, replayed step by step (sorts.js). Every counter is counted.
(function (root) {
  "use strict";
  const K = root.Sorts, D = root.CLDraw;
  const C = { bg: "#06080D", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0" };
  const NAMES = { bubble: "Bubble sort", insertion: "Insertion sort", merge: "Merge sort", quick: "Quicksort" }, KEYS = ["bubble", "insertion", "merge", "quick"];
  const COL = { bubble: [239, 111, 174], insertion: [53, 196, 240], merge: [255, 189, 56], quick: [140, 230, 160] };
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const fmt = (v) => v.toLocaleString("en-US");
  const A120 = K.shuffled(120, 19), RUN = Object.fromEntries(KEYS.map((k) => [k, K.ALGOS[k](A120)]));
  const A40 = K.shuffled(40, 4), B40 = K.ALGOS.bubble(A40);
  const A60 = K.shuffled(60, 6), S60 = { bubble: K.ALGOS.bubble(A60), quick: K.ALGOS.quick(A60) };
  const A128 = K.shuffled(128, 8), M128 = K.ALGOS.merge(A128);
  const A1000 = K.shuffled(1000, 1000), CMP1000 = Object.fromEntries(KEYS.map((k) => [k, K.comparisons(K.ALGOS[k](A1000))]));
  // cache the replay so consecutive frames only apply the new steps
  const cache = new Map();
  function stateAt(key, a0, st, k) { let c = cache.get(key); if (!c || c.k > k) { c = { a: a0.slice(), k: 0 }; cache.set(key, c); }
    for (let s = c.k; s < Math.min(k, st.length); s++) { const [t, x, y] = st[s]; if (t === "s") { const q = c.a[x]; c.a[x] = c.a[y]; c.a[y] = q; } else if (t === "w") c.a[x] = y; } c.k = Math.min(k, st.length); return { a: c.a, cur: st[c.k - 1] }; }
  function bars(ctx, a, cur, x0, y0, w, h, col, done) {
    const n = a.length, bw = w / n; for (let i = 0; i < n; i++) { const hh = a[i] / n * h, hi = cur && !done && (cur[1] === i || (cur[0] !== "w" && cur[2] === i));
      ctx.fillStyle = hi ? "#FFFFFF" : done ? css(col) : css(col, .55 + .45 * a[i] / n); ctx.fillRect(x0 + i * bw + .5, y0 + h - hh, Math.max(1, bw - 1), hh); }
  }
  function panel(ctx, key, a0, st, k, x0, y0, w, h, rate, k2 = 1) {
    const { a, cur } = stateAt(key + a0.length + "_" + x0 + y0, a0, st, k), done = k >= st.length; bars(ctx, a, cur, x0, y0 + 50 * k2, w, h - 90 * k2, COL[key.split(":")[0]], done);
    const nm = key.split(":")[0]; D.text(ctx, NAMES[nm], x0, y0 + 18 * k2, 34 * k2, css(COL[nm]), 700, "left");
    D.text(ctx, fmt(K.comparisons(st, k)) + " comparisons", x0 + w, y0 + 18 * k2, 26 * k2, C.text, 600, "right");
    if (done) D.text(ctx, "done in " + (st.length / rate).toFixed(1) + " s", x0 + w, y0 + h - 14 * k2, 28 * k2, css(COL[nm]), 700, "right");
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["one", 4, 24], ["race", 24, 72], ["counts", 72, 90], ["close", 90, 98]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const RATE = 240, ONE_RATE = 12, RACE0 = 25.5;
  const PANELS = [[90, 170], [990, 170], [90, 600], [990, 600]], PW = 840, PH = 400;
  function race(ctx, k) { KEYS.forEach((key, i) => panel(ctx, key, A120, RUN[key], k, PANELS[i][0], PANELS[i][1], PW, PH, RATE)); }
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { race(ctx, Math.round((2 + u) * RATE)); D.text(ctx, "Same 120 bars. Same speed. Very different finish times.", W / 2, 80, 52, C.text, 700); D.text(ctx, "Later in this video · every comparison counted", W / 2, 136, 28, C.amber, 600); return; }
    if (sc.id === "one") { const k = Math.max(0, Math.round((u - 1.5) * ONE_RATE)); panel(ctx, "bubble:one", A40, B40, k, 260, 220, 1400, 700, ONE_RATE, 1.3);
      D.text(ctx, k < 40 ? "Bubble sort: compare two neighbours, swap if they are out of order." : "Each pass carries the biggest bar to the end. Every comparison is one note.", W / 2, 80, 46, C.text, 700, "center", f); return; }
    if (sc.id === "race" || sc.id === "close") { const k = sc.id === "race" ? Math.max(0, Math.round((t - RACE0) * RATE)) : 1e9; race(ctx, k);
      if (sc.id === "close") { D.text(ctx, "Same task. Same computer. The method is everything.", W / 2, 80, 54, C.text, 700, "center", f); D.text(ctx, "Comparisons counted in the runs shown · 1,000,000-item numbers are estimates from n²/2, n²/4 and n log₂ n", W / 2, 1050, 24, C.dim, 500, "center", f); return; }
      D.text(ctx, "Same 120 bars, " + RATE + " steps per second each.", W / 2, 80, 50, C.text, 700, "center", f); D.speed(ctx, RATE + " STEPS / S", W); return; }
    if (sc.id === "counts") {
      D.text(ctx, "Comparisons needed", W / 2, 80, 56, C.text, 700, "center", f);
      const cols = [["", 360], ["120 items", 760], ["1,000 items", 1160], ["1,000,000 items (estimate)", 1580]];
      cols.forEach(([s, x]) => D.text(ctx, s, x, 220, 30, C.dim, 600, "center", f));
      const est = { bubble: "≈ 500,000,000,000", insertion: "≈ 250,000,000,000", merge: "≈ 20,000,000", quick: "≈ 28,000,000" };
      KEYS.forEach((key, i) => { const y = 320 + i * 110, a = D.clamp((u - .6 - i * 1.2) / .5) * f;
        D.text(ctx, NAMES[key], 360, y, 40, css(COL[key]), 700, "center", a); D.text(ctx, fmt(K.comparisons(RUN[key])), 760, y, 40, C.text, 700, "center", a);
        D.text(ctx, fmt(CMP1000[key]), 1160, y, 40, C.text, 700, "center", a); D.text(ctx, est[key], 1580, y, 40, C.amber, 700, "center", a); });
      D.text(ctx, "At a billion comparisons per second: bubble sort ≈ 8 minutes, merge sort ≈ 0.02 seconds.", W / 2, 850, 38, C.text, 700, "center", D.clamp((u - 7) / .6) * f);
    }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .04 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: one note per comparison when slow; at race speed, a soft tick every 150 steps for each algorithm and a short run of notes when it finishes
  function stepNotes(a0, st, offset, rate, tmax, cap = 12) { const ev = []; let last = -1;
    for (let s = 0; s < st.length; s++) { const t = offset + s / rate; if (t > tmax) break; if (st[s][0] !== "c" && st[s][0] !== "w") continue; if (t - last < 1 / cap) continue; last = t; const v = stateAt("snd" + a0.length, a0, st, s).a[st[s][1]]; ev.push({ t, k: Math.round(15 * (v - 1) / (a0.length - 1)), gain: .4 }); }
    cache.delete("snd" + a0.length); return ev; }
  function raceNotes(offset, rate, tmax) { const ev = []; KEYS.forEach((key, i) => { const st = RUN[key];
    for (let s = 150; s < st.length; s += 150) { const t = offset + s / rate; if (t < tmax) ev.push({ t, k: 2 + i * 3, gain: .25 }); }
    const tf = offset + st.length / rate; if (tf < tmax) [0, .12, .24].forEach((d, j) => ev.push({ t: tf + d, k: 6 + i * 2 + j * 2, gain: .55 })); }); return ev; }
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 8 }, ...stepNotes(A40, B40, s.one.t0 + 1.5, ONE_RATE, s.one.t1 - .2), ...raceNotes(RACE0, RATE, s.race.t1 - .2),
      ...KEYS.map((_, i) => ({ t: s.counts.t0 + .6 + i * 1.2, k: 4 + i * 3, gain: .5 })), { t: s.counts.t0 + 7, k: 12, gain: .55 }, { t: s.close.t0 + .3, k: 6 }]; }

  // ---------- Shorts ----------
  const S1_RATE = 100, S1_0 = 3;
  function s1(ctx, t) { const k = Math.max(0, Math.round((t - S1_0) * S1_RATE));
    panel(ctx, "bubble:s1", A60, S60.bubble, k, 60, 420, 960, 560, S1_RATE, 1.2); panel(ctx, "quick:s1", A60, S60.quick, k, 60, 1060, 960, 560, S1_RATE, 1.2);
    D.lines(ctx, ["Bubble sort vs", "quicksort."], 540, 160, 80, C.text, 1); D.text(ctx, "same bars · " + S1_RATE + " steps per second each", 540, 330, 32, C.amber, 600); }
  const S2_RATE = M128.length / 25;
  function s2(ctx, t) { const k = Math.max(0, Math.round((t - 2) * S2_RATE)); panel(ctx, "merge:s2", A128, M128, k, 40, 460, 1000, 1000, S2_RATE, 1.2);
    D.lines(ctx, ["Merge sort,", "with sound."], 540, 160, 80, C.text, 1); D.text(ctx, "every note: one bar placed", 540, 340, 34, C.amber, 600); }
  const timelines = [
    { id: "full", name: "12 Sorting Sounds (long)", file: "Command Loom - 12 Sorting Sounds.mp4", W: 1920, H: 1080, dur: 98, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Bubble vs quicksort", file: "Command Loom - Short 1 - Bubble vs Quicksort.mp4", W: 1080, H: 1920, dur: 32, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .04 * t / 32), voice: "glass",
      events: () => [...stepNotes(A60, S60.quick, S1_0, S1_RATE, 31.3, 10), ...[0, .12, .24].map((d, j) => ({ t: S1_0 + S60.quick.length / S1_RATE + d, k: 10 + j * 2, gain: .55 })),
        ...(S1_0 + S60.bubble.length / S1_RATE < 31 ? [0, .12, .24].map((d, j) => ({ t: S1_0 + S60.bubble.length / S1_RATE + d, k: 6 + j * 2, gain: .55 })) : [])] },
    { id: "s2", name: "Short 2 · Merge sort with sound", file: "Command Loom - Short 2 - Merge Sort Sound.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .04 * t / 30), voice: "glass",
      events: () => stepNotes(A128, M128, 2, S2_RATE, 29.3, 12) }
  ];
  root.CLVideo = { title: "Command Loom · 12 Sorting Sounds", timelines };
  root.SortVideo = { S, RUN, A120, CMP1000, S60, M128, RATE, timelines };
})(typeof window !== "undefined" ? window : globalThis);
