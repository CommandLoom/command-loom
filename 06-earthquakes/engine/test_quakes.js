"use strict";
// The frozen snapshot, the numbers printed on screen and the timing of every claim.
global.window = global; const assert = require("assert"), fs = require("fs"), path = require("path"), crypto = require("crypto");
require("./quakes.js"); window.CLDraw = require("./draw.js"); require("./video.js");
const Q = window.QUAKES, V = window.QuakeVideo, EV = Q.events, M = Q.manifest; let passes = 0; const test = (n, f) => { f(); passes++; console.log("PASS " + n); };
test("snapshot: sorted, unique, inside 2025 UTC, M>=4.5, located; matches the manifest", () => {
  const ids = new Set(); EV.forEach((e, i) => { assert(e[0] >= Q.t0 && e[0] < Q.t1 && e[4] >= 4.5 && !ids.has(e[6])); ids.add(e[6]); if (i) assert(EV[i - 1][0] <= e[0]); });
  assert.strictEqual(EV.length, M.features); assert.strictEqual(M.unlocated.length, 0);
  const raw = path.join(__dirname, "..", "data", "raw", "usgs_2025_m45.geojson");
  if (fs.existsSync(raw)) assert.strictEqual(crypto.createHash("sha256").update(fs.readFileSync(raw)).digest("hex"), M.sha256_raw);
});
test("largest event, busiest UTC day and magnitude counts are recomputed, not typed", () => {
  assert.strictEqual(V.BIG[6], M.largest.id); assert.strictEqual(V.BIG[4], 8.8);
  assert.strictEqual(V.BUSY[0], M.busiest_utc_day.day); assert.strictEqual(V.BUSY[1], M.busiest_utc_day.events);
  for (const k of [5, 6, 7, 8]) assert.strictEqual(EV.filter((e) => e[4] >= k).length, M.counts["M≥" + k]);
  assert.strictEqual(V.DAYS.reduce((a, b) => a + b, 0), EV.length);
});
test("counter: countAt is exact at every event boundary", () => {
  for (const i of [0, 1, 100, 4000, EV.length - 1]) { assert(V.countAt(EV[i][0]) >= i + 1); assert(V.countAt(EV[i][0] - 1) <= i); }
  assert.strictEqual(V.countAt(Q.t1), EV.length);
});
test("timelines: whole frames, Shorts 30-40 s, the year scene covers exactly 365 days", () => {
  const y = V.S.find((s) => s.id === "year"); assert(Math.abs((y.t1 - y.t0) * V.YEAR_RATE - 365 * 86400000) < 1);
  for (const tl of V.timelines) { assert(Math.abs(tl.dur * 30 - Math.round(tl.dur * 30)) < 1e-6, tl.id); if (tl.id !== "full") assert(tl.dur >= 30 && tl.dur <= 40, tl.id + " " + tl.dur); assert(tl.events().length > 5, tl.id); }
  console.log("   full " + V.FULL_DUR.toFixed(2) + " s · Japan box " + V.JP_N + " events · sound notes " + V.fullEvents().length);
});
console.log("\n" + passes + " tests passed");
