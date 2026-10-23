// Shared drawing helpers: Command Loom typography and labels (1080p sizes: title 78 px, small 38 px, tag 34 px).
(function (root) {
  "use strict";
  const FONT = '"Bahnschrift","Segoe UI",sans-serif';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
  // opacity of something visible from a to b with fade f
  const fade = (t, a, b, f = .35) => clamp(Math.min((t - a) / f, (b - t) / f));
  function text(ctx, s, x, y, px, color = "#F5F3EF", weight = 700, align = "center", alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = weight + " " + px + "px " + FONT; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(2,5,12,.9)"; ctx.shadowBlur = px * .25; ctx.shadowOffsetY = 2; ctx.fillText(s, x, y); ctx.restore();
  }
  function lines(ctx, arr, x, y0, px, color, alpha = 1, weight = 700) { arr.forEach((s, i) => text(ctx, s, x, y0 + i * px * 1.12, px, color, weight, "center", alpha)); }
  function speed(ctx, label, W, k = 1, y = 40) { text(ctx, label, W - 44 * k, y * k, 34 * k, "#FFBD38", 600, "right"); }
  function topShade(ctx, W, h, color = "rgba(6,10,20,.85)") { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, color); g.addColorStop(1, "rgba(6,10,20,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, h); }
  const api = { FONT, clamp, smooth, fade, text, lines, speed, topShade }; root.CLDraw = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
