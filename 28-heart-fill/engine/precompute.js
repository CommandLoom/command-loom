// Pours balls into the heart and stores every frame in data/heart_<N>.bin (the page only plays them back).
// node engine/precompute.js [N]       (a few minutes; the result is the same every time)
// Ball size: chosen so that N balls would cover 78% of the heart. Balls appear at free spots inside the heart's upper part
// (above the top dip) and fall; when no free spot is left there for 2 s, the heart counts as full. Then everything settles.
// File: "CLHF" · uint32 count · uint32 frames · float32 xmin, xmax, ymin, ymax · float32 r[count] · uint32 pourFrames ·
//       frames × count × (uint16 x, uint16 y)   (65535, 65535 = not poured yet)
const fs = require("fs"), path = require("path");
const G = require("./grains.js"), H = require("./heart.js");
const RUNS = [[50, 10, 3], [200, 10, 3], [1000, 12, 3], [3000, 14, 3]];      // [N, seconds of pouring at the planned rate, seconds to settle]
const BOX = [-0.16, 0.16, H.BOTTOM - 0.005, 0.13];
fs.mkdirSync(path.join(__dirname, "..", "data"), { recursive: true });
for (const [N, pourS, settleS] of RUNS) {
  if (process.argv[2] && Number(process.argv[2]) !== N) continue;
  const t0 = Date.now(), rng = G.rng(38 + N), r0 = Math.sqrt(0.78 * H.area() / (N * Math.PI)), count = Math.round(N * 1.4);
  const r = Array.from({ length: count }, () => r0 * (0.9 + 0.2 * rng())), zeros = new Array(count).fill(0);
  const S = G.create({ x: zeros, y: zeros, r, walls: H.walls(), sub: 80, iters: 3, mu: 0.3, fps: 30, active: 0 });
  const rate = N / (pourS * 30), frames0 = [];
  let owed = 0, lastSpawn = 0, f = 0;
  frames0.push(S.snapshot());
  while (true) {                                            // pour until full (2 s without a free spot), then settle
    f++; owed += rate; let tries = 0;
    while (owed >= 1 && S.active < count && tries < 60) { tries++; const ri = r[S.active], x = (rng() * 2 - 1) * 0.15, y = H.TOP + rng() * (0.115 - H.TOP);
      if (H.inside(x, y) && H.wallDist(x, y) > ri * 1.02 && S.clear(x, y, ri * 1.02)) { S.spawn(x, y, 0, 0); owed -= 1; lastSpawn = f; } }
    frames0.push(S.advance());
    if (f - lastSpawn > 60 || S.active >= count) break;
  }
  const pourFrames = f; for (let k = 0; k < settleS * 30; k++) frames0.push(S.advance());
  const frames = frames0.length, buf = Buffer.alloc(4 + 8 + 16 + 4 * count + 4 + frames * count * 4);
  buf.write("CLHF", 0); buf.writeUInt32LE(count, 4); buf.writeUInt32LE(frames, 8); BOX.forEach((v, i) => buf.writeFloatLE(v, 12 + 4 * i));
  r.forEach((v, i) => buf.writeFloatLE(v, 28 + 4 * i)); buf.writeUInt32LE(pourFrames, 28 + 4 * count);
  let o = 32 + 4 * count; const q = (v, a, b) => Math.max(0, Math.min(65534, Math.round((v - a) / (b - a) * 65534)));
  for (const fr of frames0) for (let i = 0; i < count; i++) { const x = fr[2 * i], y = fr[2 * i + 1]; if (Number.isNaN(x)) { buf.writeUInt16LE(65535, o); buf.writeUInt16LE(65535, o + 2); } else { buf.writeUInt16LE(q(x, BOX[0], BOX[1]), o); buf.writeUInt16LE(q(y, BOX[2], BOX[3]), o + 2); } o += 4; }
  fs.writeFileSync(path.join(__dirname, "..", "data", `heart_${N}.bin`), buf);
  let inside = 0, A = 0; for (let i = 0; i < S.active; i++) if (H.inside(S.X[i], S.Y[i])) { inside++; A += Math.PI * r[i] * r[i]; }
  console.log(`${N}: r ${(r0 * 1000).toFixed(1)} mm · ${S.active} balls in ${(pourFrames / 30).toFixed(1)} s (cap ${count}) · inside ${inside} · ${(100 * A / H.area()).toFixed(1)}% of the heart · ${(buf.length / 1048576).toFixed(1)} MB · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
