// Checks the claims of the 24 Ellipse String Art video.  node engine/test_billiard.js
const path = require("path"), fs = require("fs"), vm = require("vm");
for (const f of ["draw.js", "billiard.js", "video.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, f), "utf8"), { filename: f });
const B = globalThis.Billiard, V = globalThis.EllipseVideo, E = V.E;
let pass = 0; const test = (n, fn) => { fn(); pass++; console.log("PASS " + n); }, ok = (c, m) => { if (!c) throw new Error(m); };
test("ellipse from a focus: every ball meets at the other focus, within a millionth, for all 12 meetings shown", () => {
  const sm = V.getSim("ellipseF"); let worst = 0;
  for (let m = 1; m <= 12; m++) worst = Math.max(worst, B.spread(sm, m * V.PASS, m % 2 ? E.c : -E.c, 0));
  console.log("    worst spread", worst.toExponential(2)); ok(worst < 1e-6, worst); });
test("every path focus -> wall -> focus is 2a long (checked on all 2,048 balls' first bounce)", () => {
  for (const b of V.getSim("ellipseF").balls) { const d = Math.hypot(b.X[1] - b.X[0], b.Y[1] - b.Y[0]) + Math.hypot(E.c - b.X[1], -b.Y[1]); ok(Math.abs(d - 2 * E.a) < 1e-9, d); } });
test("circle from the centre: every ball returns to the centre together", () => { const sm = V.getSim("circleC"), T = 2 * 0.85; ok(B.spread(sm, T, 0, 0) < 1e-9, "spread"); });
test("start just beside the focus: at the meeting times the balls stay spread out (more than 10% of the table width)", () => {
  const sm = V.getSim("ellipseOff"); for (let m = 1; m <= 7; m++) ok(B.spread(sm, m * V.PASS, m % 2 ? E.c : -E.c, 0) > 0.2, "met " + m); });
test("all bounce points lie on the walls, nothing escapes any table", () => {
  for (const k of ["circleC", "circleOff", "ellipseF", "ellipseOff", "stadium"]) { const sm = V.getSim(k), tb = sm.table;
    for (const b of sm.balls) for (let i = 1; i < b.X.length; i++) { const x = b.X[i], y = b.Y[i];
      const r = tb.kind === "circle" ? Math.hypot(x, y) / tb.R : tb.kind === "ellipse" ? Math.hypot(x / tb.a, y / tb.b) : (Math.abs(x) <= tb.L ? Math.abs(y) / tb.R : Math.hypot(Math.abs(x) - tb.L, y) / tb.R);
      ok(Math.abs(r - 1) < 1e-9, k + " " + r); } } });
test("stadium spreads the balls over the table: after 15 s they cover most of a 20 × 20 grid of the table", () => {
  const sm = V.getSim("stadium"), tb = sm.table, cells = new Set(); for (const b of sm.balls) { const p = B.pos(b, 15); cells.add(Math.floor((p[0] / tb.w + .5) * 20) + "," + Math.floor((p[1] / tb.h + .5) * 20)); }
  console.log("    cells covered", cells.size); ok(cells.size > 250, cells.size); });
test("timelines: whole frames, Shorts 30–40 s, sound inside and before the end fade", () => {
  for (const tl of V.timelines) { ok(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-9, tl.id); if (tl.id !== "full") ok(tl.dur >= 30 && tl.dur <= 40, tl.id);
    const ev = tl.events(); ok(ev.length && ev.every((e) => e.t >= 0 && e.t < tl.dur - .5), tl.id + " events " + ev.length); console.log("    ", tl.id, "sound events", ev.length); }
  for (let i = 1; i < V.S.length; i++) ok(V.S[i].t0 === V.S[i - 1].t1, "contiguous"); });
console.log(`\n${pass} tests passed`);
