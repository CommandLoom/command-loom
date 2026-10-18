// 17 Camouflage: a toy model of natural selection (evolve.js). Every moth, bird catch and percentage comes from the run.
(function (root) {
  "use strict";
  const E = root.Evolve, D = root.CLDraw;
  const C = { bg: "#07090D", text: "#F5F3EF", dim: "#9AA6B8", amber: "#FFBD38", cyan: "#35C4F0" };
  const G = E.run(17), GN = G.length;
  const shade = (c) => { const v = 226 - 196 * c; return [Math.round(v + 8 * (1 - c)), Math.round(v), Math.round(v - 14 * (1 - c))]; };   // pale cream → near black
  const rgb = (a, al = 1) => `rgba(${a[0]},${a[1]},${a[2]},${al})`;
  let TEX = null;
  function texture() {                               // bark streaks (display only), built once
    if (TEX) return TEX; const n = 400, c = document.createElement("canvas"); c.width = n; c.height = n; const g = c.getContext("2d"), img = g.createImageData(n, n), r = E.rng(5);
    const cols = Array.from({ length: n }, () => r()), rows = Array.from({ length: n }, () => r());
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = (y * n + x) * 4, v = Math.sin(x * .09 + cols[(x * 7) % n] * 2) * .5 + cols[x] * .35 + rows[(y * 3 + x) % n] * .25;
      const l = v > .55 ? 255 : 0, a = Math.round(Math.min(1, Math.abs(v - .45)) * 70); img.data[i] = l; img.data[i + 1] = l; img.data[i + 2] = l; img.data[i + 3] = a; }
    g.putImageData(img, 0, 0); return TEX = c;
  }
  function moth(ctx, x, y, s, c, alpha = 1) {
    ctx.globalAlpha = alpha; ctx.fillStyle = rgb(shade(c)); ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1;
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sg * s * .55, y, s * .62, s * .42, sg * .5, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = rgb(shade(Math.min(1, c + .25))); ctx.beginPath(); ctx.ellipse(x, y, s * .14, s * .5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
  // one generation drawn at phase p (0..1): moths sit still, then the ones birds take are ringed and vanish
  function field(ctx, gi, p, x0, y0, w, h, s = 15) {
    const gen = G[gi]; ctx.fillStyle = rgb(shade(gen.bark)); ctx.fillRect(x0, y0, w, h); ctx.drawImage(texture(), x0, y0, w, h);
    gen.pop.forEach((c, i) => { const [u, v] = gen.pos[i], x = x0 + 14 + u * (w - 28), y = y0 + 14 + v * (h - 28), eat = gen.eaten[i];
      if (eat && p > .55) { const q = (p - .55) / .45; moth(ctx, x, y, s, c, 1 - q); ctx.strokeStyle = `rgba(255,80,80,${.9 * (1 - q)})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, s * (1.2 + q), 0, 7); ctx.stroke(); }
      else moth(ctx, x, y, s, c); });
    ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, w, h);
  }
  function chart(ctx, upto, x0, y0, w, h, k = 1) {
    const X = (g) => x0 + g / (GN - 1) * w, Y = (v) => y0 + h - v * h;
    ctx.strokeStyle = "rgba(160,176,198,.45)"; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    for (const [key, col, dash] of [["bark", "rgba(160,176,198,.9)", [8 * k, 7 * k]], ["mean", C.amber, []]]) { ctx.strokeStyle = col; ctx.lineWidth = 3 * k; ctx.setLineDash(dash); ctx.beginPath();
      for (let g = 0; g <= upto; g++) { const p = [X(g), Y(G[g][key])]; g ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke(); ctx.setLineDash([]); }
    D.text(ctx, "pale", x0 - 12 * k, y0 + h, 20 * k, C.dim, 600, "right"); D.text(ctx, "dark", x0 - 12 * k, y0, 20 * k, C.dim, 600, "right");
    D.text(ctx, "moths (average shade)", x0, y0 - 46 * k, 22 * k, C.amber, 700, "left"); D.text(ctx, "bark", x0, y0 - 20 * k, 22 * k, "rgba(160,176,198,.9)", 700, "left");
    D.text(ctx, "generation", x0 + w, y0 + h + 26 * k, 20 * k, C.dim, 600, "right");
  }
  function zoomWrap(inner, W, H, zf) { return (ctx, t) => { const z = zf(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); inner(ctx, t); ctx.restore(); }; }
  const phaseCaption = (g) => g < 20 ? "Pale bark: pale moths are hard to spot." : g < 40 ? "Soot darkens the bark…" : g < 75 ? "…now the dark moths survive more often." : g < 95 ? "The air gets cleaner, the bark pales again…" : "…and the pale moths come back.";

  // ---------- long video ----------
  const S = [["hook", 0, 4], ["rules", 4, 16], ["run", 16, 92], ["chart", 92, 104]].map(([id, t0, t1]) => ({ id, t0, t1 }));
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const GEN_S = .54, gAt = (t) => { const x = Math.max(0, t - S[2].t0) / GEN_S; return [Math.min(GN - 1, Math.floor(x)), x - Math.floor(x)]; };
  function inner(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t), u = t - sc.t0, f = D.fade(t, sc.t0, sc.t1);
    if (sc.id === "hook") { field(ctx, 45, .7, 80, 190, 1100, 820); chart(ctx, 45, 1300, 360, 520, 380);
      D.text(ctx, "Same moths. Different trees. Watch them change colour.", W / 2, 80, 54, C.text, 700); D.text(ctx, "Later in this video · a toy model of natural selection", W / 2, 140, 28, C.amber, 600); return; }
    if (sc.id === "rules") { field(ctx, 0, 0, 80, 190, 1100, 820);
      const L = ["Birds catch the moths", "that stand out.", "Survivors' young look like them,", "with tiny random differences.", "No moth chooses anything."];
      L.forEach((s, i) => D.text(ctx, s, 1240, 360 + i * 76, 34, i === 4 ? C.amber : C.text, 700, "left", D.clamp((u - .8 - Math.floor(i / 2) * 2.4) / .5) * f));
      D.text(ctx, "400 moths on a tree", W / 2, 80, 56, C.text, 700, "center", f); return; }
    if (sc.id === "run") { const [g, p] = gAt(t), gen = G[g]; field(ctx, g, p, 80, 190, 1100, 820); chart(ctx, g, 1300, 360, 520, 380);
      D.text(ctx, "Generation " + g, 1300, 830, 48, C.text, 700, "left"); D.text(ctx, Math.round(gen.darkShare * 100) + "% dark moths", 1300, 895, 40, C.amber, 700, "left");
      D.text(ctx, gen.eatenCount + " caught by birds this generation", 1300, 950, 26, C.dim, 600, "left");
      D.text(ctx, phaseCaption(g), W / 2, 80, 54, C.text, 700, "center", f); D.speed(ctx, "1 GENERATION = " + GEN_S + " S", W); return; }
    if (sc.id === "chart") { chart(ctx, GN - 1, 260, 260, 1400, 560);
      D.text(ctx, "The moths followed their tree, both ways.", W / 2, 80, 54, C.text, 700, "center", f);
      D.text(ctx, "Real peppered moths in Britain: dark ones rose with industrial soot and fell after cleaner air.", W / 2, 150, 30, C.amber, 600, "center", f);
      D.text(ctx, "Toy model: 400 moths, birds catch a moth with probability 5% + 80% × (shade difference) · simulated", W / 2, 1040, 24, C.dim, 500, "center", f); }
  }
  const drawFull = zoomWrap(inner, 1920, 1080, (t) => { const sc = sceneAt(t); return 1 + .05 * (t - sc.t0) / (sc.t1 - sc.t0); });
  // sound: one soft note per generation; lower notes for a darker population
  const genNotes = (offset, rate, from = 0, to = GN - 1, gain = .5) => G.slice(from, to + 1).map((gen, i) => ({ t: offset + i * rate + .05, k: 1 + Math.round(14 * (1 - gen.mean)), gain }));
  function fullEvents() { const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [{ t: .3, k: 8 }, ...[0, 1, 2, 3].map((i) => ({ t: s.rules.t0 + .8 + i * 2, k: 4 + i * 3, gain: .55 })), ...genNotes(s.run.t0, GEN_S), { t: s.chart.t0 + .3, k: 6 }, { t: s.chart.t0 + .3, k: 11 }].filter((e) => e.t < 103.4); }

  // ---------- Shorts ----------
  function short(from, to, title1, title2) {
    const rate = 27 / (to - from + 1);
    return { rate, draw: (ctx, t) => { const x = Math.max(0, t - 1.5) / rate, g = Math.min(to, from + Math.floor(x)), p = x - Math.floor(x), gen = G[g];
      field(ctx, g, p, 40, 380, 1000, 900, 17); chart(ctx, g, 140, 1440, 820, 230, 1.1);
      D.lines(ctx, g < (from + to) / 2 ? title1 : title2, 540, 150, 72, C.text, 1);
      D.text(ctx, "Generation " + g + " · " + Math.round(gen.darkShare * 100) + "% dark", 540, 1790, 44, C.text, 700); } };
  }
  const SH1 = short(18, 80, ["The tree turns dark.", "Watch the moths."], ["Now the dark ones", "survive."]), SH2 = short(72, 139, ["Clean air, pale tree", "again…"], ["…and the moths", "change back."]);
  const timelines = [
    { id: "full", name: "17 Camouflage (long)", file: "Command Loom - 17 Camouflage.mp4", W: 1920, H: 1080, dur: 104, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · Watch the moths", file: "Command Loom - Short 1 - Watch the Moths.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(SH1.draw, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "marimba", events: () => genNotes(1.5, SH1.rate, 18, 80) },
    { id: "s2", name: "Short 2 · And back again", file: "Command Loom - Short 2 - And Back Again.mp4", W: 1080, H: 1920, dur: 30, draw: zoomWrap(SH2.draw, 1080, 1920, (t) => 1 + .05 * t / 30), voice: "marimba", events: () => genNotes(1.5, SH2.rate, 72, 139) }
  ];
  root.CLVideo = { title: "Command Loom · 17 Camouflage", timelines };
  root.CamoVideo = { S, G, GEN_S, timelines, phaseCaption };
})(typeof window !== "undefined" ? window : globalThis);
