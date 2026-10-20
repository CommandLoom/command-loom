// 12 Sorting Sounds: rainbow bars sorted step by step by four algorithms (sorts.js), each one heard: every step plays the height of the
// bar it touches. Each algorithm gets a solo, then all four race on the same 120 bars at the same speed. Every counter is counted.
(function (root) {
  "use strict";
  const K = root.Sorts, D = root.CLDraw;
  const C = { bg: "#05070C", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38" };
  const NAMES = { bubble: "Bubble sort", insertion: "Insertion sort", merge: "Merge sort", quick: "Quicksort" }, KEYS = ["bubble", "insertion", "merge", "quick"];
  const COL = { bubble: [239, 111, 174], insertion: [53, 196, 240], merge: [255, 189, 56], quick: [140, 230, 160] };
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const fmt = (v) => v.toLocaleString("en-US");
  const rainbow = (v, n, l = 60) => `hsl(${Math.round((v - 1) / Math.max(1, n - 1) * 300)},90%,${l}%)`;
  // cache the replay so consecutive frames only apply the new steps
  const cache = new Map();
  function stateAt(id, a0, st, k) { let c = cache.get(id); if (!c || c.k > k) { c = { a: a0.slice(), k: 0 }; cache.set(id, c); }
    for (let s = c.k; s < Math.min(k, st.length); s++) { const [t, x, y] = st[s]; if (t === "s") { const q = c.a[x]; c.a[x] = c.a[y]; c.a[y] = q; } else if (t === "w") c.a[x] = y; } c.k = Math.min(k, st.length); return { a: c.a, cur: st[c.k - 1] }; }
  // a run: algorithm `key` on bars a0, starting at video time t0, `rate` steps per second, then a finishing sweep across the sorted bars
  const SWEEP = 1.2;
  function run(key, a0, t0, rate) { const st = K.ALGOS[key](a0); return { key, a0, st, t0, rate, end: t0 + st.length / rate, id: key + a0.length + "_" + t0 }; }
  const stepAt = (R, t) => Math.max(0, Math.min(R.st.length, Math.round((t - R.t0) * R.rate)));
  function panel(ctx, R, t, x0, y0, w, h, k2 = 1, header = true) {
    const k = stepAt(R, t), { a, cur } = stateAt(R.id, R.a0, R.st, k), n = a.length, bw = w / n, done = k >= R.st.length, sw = done ? D.clamp((t - R.end) / SWEEP) : 0, by = y0 + (header ? 56 * k2 : 0), bh = h - (header ? 56 * k2 : 0);
    for (let i = 0; i < n; i++) { const hh = a[i] / n * bh, touched = cur && !done && (cur[1] === i || (cur[0] !== "w" && cur[2] === i)), front = done && sw < 1 && Math.abs(i - sw * n) < 1.5;
      ctx.fillStyle = touched || front ? "#FFFFFF" : rainbow(a[i], n, done && i < sw * n ? 66 : 56); ctx.fillRect(x0 + i * bw + (bw > 4 ? .6 : 0), by + bh - hh, Math.max(1, bw - (bw > 4 ? 1.2 : 0)), hh); }
    if (done && sw < 1) { const x = x0 + sw * w, g = ctx.createRadialGradient(x, by + bh / 2, 0, x, by + bh / 2, bh * .6); g.addColorStop(0, "rgba(255,255,255,.25)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(x - bh * .6, by, bh * 1.2, bh); }
    if (!header) return;
    D.text(ctx, NAMES[R.key], x0, y0 + 20 * k2, 36 * k2, css(COL[R.key]), 700, "left");
    D.text(ctx, done ? "done · " + fmt(K.comparisons(R.st)) + " comparisons" : fmt(K.comparisons(R.st, k)) + " comparisons", x0 + w, y0 + 20 * k2, 28 * k2, done ? css(COL[R.key]) : C.text, 700, "right");
  }
  // sound: each step plays the height of the bar it touches (at most `cap` notes a second), then the sweep plays the sorted bars rising
  function runNotes(R, cap = 14, side = 0, gain = 1, voice) { const ev = []; let last = -1, n = R.a0.length;
    for (let s = 0; s < R.st.length; s++) { const t = R.t0 + s / R.rate; if (t - last < 1 / cap) continue; last = t;
      const v = stateAt("snd", R.a0, R.st, s + 1).a[R.st[s][1]]; ev.push({ t, k: Math.round(15 * (v - 1) / (n - 1)), side, gain: .38 * gain, voice }); }
    cache.delete("snd"); return [...ev, ...sweepNotes(R.end, side, gain)]; }
  const sweepNotes = (t0, side = 0, gain = 1, dur = SWEEP) => Array.from({ length: 16 }, (_, i) => ({ t: t0 + i / 16 * dur, k: i, side, gain: .5 * gain }));
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }

  // ---------- long video ----------
  const S = [["hook", 0, 5], ["bubble", 5, 20], ["insertion", 20, 35], ["merge", 35, 50], ["quick", 50, 64], ["race", 64, 90], ["close", 90, 98]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const A120 = K.shuffled(120, 19);
  const HOOK = run("quick", A120, .4, 400);
  const SOLO = { bubble: run("bubble", K.shuffled(40, 4), 5.8, 92), insertion: run("insertion", K.shuffled(60, 6), 20.8, 160), merge: run("merge", K.shuffled(120, 12), 35.8, 125), quick: run("quick", K.shuffled(120, 13), 50.8, 100) };
  const RATE = 470, RACE = Object.fromEntries(KEYS.map((k) => [k, run(k, A120, 65, RATE)]));
  const SAY = { bubble: "Bubble sort: swap neighbours that are out of order.", insertion: "Insertion sort: slide each bar back into place.", merge: "Merge sort: sort the halves, then merge them.", quick: "Quicksort: split around a pivot, then repeat." };
  const PANELS = [[90, 170], [990, 170], [90, 600], [990, 600]], PW = 840, PH = 400;
  const CLOSE_SWEEP = 90.3;
  function inner(ctx, t) {
    const W = 1920, sc = sceneAt(t), f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { panel(ctx, HOOK, t, 120, 200, 1680, 800); D.text(ctx, "Four ways to sort the same bars. Listen.", W / 2, 80, 54, C.text, 700); D.speed(ctx, HOOK.rate + " STEPS / S", W); return; }
    if (SOLO[sc.id]) { const R = SOLO[sc.id]; ctx.save(); ctx.globalAlpha = f; panel(ctx, R, t, 120, 200, 1680, 800); ctx.restore(); D.text(ctx, SAY[sc.id], W / 2, 80, 50, C.text, 700, "center", f); D.speed(ctx, R.rate + " STEPS / S", W); return; }
    // race and close: the same 120 bars in four panels
    KEYS.forEach((key, i) => panel(ctx, RACE[key], t, PANELS[i][0], PANELS[i][1], PW, PH));
    if (sc.id === "race") { const finished = KEYS.filter((k) => t >= RACE[k].end).length;
      D.text(ctx, finished < 2 ? "Same 120 bars, same speed. Who finishes first?" : finished < 4 ? "Quicksort and merge sort are long done." : "Bubble sort, finally.", W / 2, 80, 50, C.text, 700, "center", f); D.speed(ctx, RATE + " STEPS / S", W); return; }
    // close: one sweep across all four sorted panels, panel by panel
    KEYS.forEach((key, i) => { const p = D.clamp((t - CLOSE_SWEEP - i) / 1); if (p <= 0 || p >= 1) return; const [x0, y0] = PANELS[i], x = x0 + p * PW;
      const g = ctx.createRadialGradient(x, y0 + PH / 2, 0, x, y0 + PH / 2, PH * .7); g.addColorStop(0, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(x0, y0 + 56, PW, PH - 56); });
    D.text(ctx, "Same bars. Different methods.", W / 2, 80, 56, C.text, 700, "center", f);
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .025 * (t - sc.t0) / (sc.t1 - sc.t0); });
  function fullEvents() {
    const ev = [...runNotes(HOOK, 16), ...KEYS.flatMap((k) => [{ t: S.find((s) => s.id === k).t0 + .25, k: 3 + KEYS.indexOf(k) * 3, voice: "bell", gain: .5 }, ...runNotes(SOLO[k], 14)])];
    ev.push({ t: 64.25, k: 9, voice: "bell", gain: .5 });
    // race: each algorithm keeps its own side and plays at most 5 notes a second, so the four can be told apart
    KEYS.forEach((k, i) => ev.push(...runNotes(RACE[k], 5, [-.6, .6, -.3, .3][i], .8)));
    KEYS.forEach((k, i) => ev.push(...sweepNotes(CLOSE_SWEEP + i, [-.6, .6, -.3, .3][i], .9, 1)));
    [2, 7, 12].forEach((k) => ev.push({ t: CLOSE_SWEEP + 4.3, k, voice: "bell", gain: .6 }));
    return ev.filter((e) => e.t < 97.4);
  }

  // ---------- Shorts ----------
  const S1_RATE = 100, S1A = run("bubble", K.shuffled(60, 6), 1.5, S1_RATE), S1B = run("quick", K.shuffled(60, 6), 1.5, S1_RATE);
  function s1(ctx, t) { panel(ctx, S1A, t, 60, 420, 960, 560, 1.2); panel(ctx, S1B, t, 60, 1080, 960, 560, 1.2);
    D.lines(ctx, ["Bubble sort vs", "quicksort."], 540, 160, 80, C.text, 1); D.text(ctx, "same bars · " + S1_RATE + " steps per second each", 540, 330, 32, C.amber, 600); }
  const A128 = K.shuffled(128, 8), S2R = run("merge", A128, 1.2, K.ALGOS.merge(A128).length / 24);
  function s2(ctx, t) { panel(ctx, S2R, t, 40, 520, 1000, 1000, 1.2);
    D.lines(ctx, ["Merge sort,", "with sound."], 540, 160, 80, C.text, 1); D.text(ctx, "every note: the height of the bar it touches", 540, 340, 34, C.amber, 600); }
  const timelines = [
    { id: "full", name: "12 Sorting Sounds (long)", file: "Command Loom - 12 Sorting Sounds.mp4", W: 1920, H: 1080, dur: 98, draw: drawFull, events: fullEvents, voice: "glass" },
    { id: "s1", name: "Short 1 · Bubble vs quicksort", file: "Command Loom - Short 1 - Bubble vs Quicksort.mp4", W: 1080, H: 1920, dur: 32, draw: zoomWrap(s1, 1080, 1920, (t) => 1 + .03 * t / 32), voice: "glass",
      events: () => [{ t: .3, k: 7, voice: "bell", gain: .5 }, ...runNotes(S1A, 7, .5, .9), ...runNotes(S1B, 9, -.5, .9)].filter((e) => e.t < 31.4) },
    { id: "s2", name: "Short 2 · Merge sort with sound", file: "Command Loom - Short 2 - Merge Sort Sound.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(s2, 1080, 1920, (t) => 1 + .03 * t / 30), voice: "glass",
      events: () => [{ t: .3, k: 7, voice: "bell", gain: .5 }, ...runNotes(S2R, 14), ...[2, 7, 12].map((k) => ({ t: S2R.end + SWEEP + .2, k, voice: "bell", gain: .6 }))].filter((e) => e.t < 29.4) }
  ];
  root.CLVideo = { title: "Command Loom · 12 Sorting Sounds", timelines };
  root.SortVideo = { S, HOOK, SOLO, RACE, RATE, S1A, S1B, S2R, CLOSE_SWEEP, timelines };
})(typeof window !== "undefined" ? window : globalThis);
