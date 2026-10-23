// Runs the five hourglass simulations once and stores every frame in data/hourglass_<N>.bin (the page only plays them back).
// node engine/precompute.js            (takes a few minutes; the result is the same every time)
// File: "CLHG" · uint32 N · uint32 frames · float32 xmin, xmax, ymin, ymax · float32 r[N] · frames × N × (uint16 x, uint16 y)
const fs = require("fs"), path = require("path");
const G = require("./grains.js"), H = require("./hourglass.js");
const RUNS = [[1, 18], [10, 18], [100, 18], [1000, 20], [3000, 30]];          // [balls, seconds after the gate opens]
const BOX = [-0.075, 0.075, -0.175, 0.175];
fs.mkdirSync(path.join(__dirname, "..", "data"), { recursive: true });
for (const [N, secs] of RUNS) {
  if (process.argv[2] && Number(process.argv[2]) !== N) continue;
  const t0 = Date.now(), F = H.fill(N, G.rng(35 + N)), walls = H.walls();
  const S = G.create({ x: F.x, y: F.y, r: F.r, walls: [...walls, H.GATE], sub: 80, iters: 3, mu: 0.3, fps: 30 });
  for (let f = 0; f < H.SETTLE * 30; f++) S.advance();
  S.setWalls(walls);
  for (let i = 0; i < N; i++) { S.VX[i] = 0; S.VY[i] = 0; }                // released from rest when the gate opens
  const frames = Math.round(secs * 30) + 1, buf = Buffer.alloc(4 + 8 + 16 + 4 * N + frames * N * 4);
  buf.write("CLHG", 0); buf.writeUInt32LE(N, 4); buf.writeUInt32LE(frames, 8); BOX.forEach((v, i) => buf.writeFloatLE(v, 12 + 4 * i));
  for (let i = 0; i < N; i++) buf.writeFloatLE(F.r[i], 28 + 4 * i);
  let o = 28 + 4 * N; const q = (v, a, b) => Math.max(0, Math.min(65535, Math.round((v - a) / (b - a) * 65535)));
  for (let f = 0; f < frames; f++) { const fr = f === 0 ? S.snapshot() : S.advance(); for (let i = 0; i < N; i++) { buf.writeUInt16LE(q(fr[2 * i], BOX[0], BOX[1]), o); buf.writeUInt16LE(q(fr[2 * i + 1], BOX[2], BOX[3]), o + 2); o += 4; } }
  fs.writeFileSync(path.join(__dirname, "..", "data", `hourglass_${N}.bin`), buf);
  let below = 0; for (let i = 0; i < N; i++) if (S.Y[i] < 0) below++;
  console.log(`${N} balls · r ${(F.r0 * 1000).toFixed(2)} mm · ${secs} s · ${below} passed · ${(buf.length / 1048576).toFixed(1)} MB · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
