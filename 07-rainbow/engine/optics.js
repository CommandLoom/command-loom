// Geometric optics of a spherical water drop. Refractive index of water at 20 °C from the measured dispersion of
// M. Daimon and A. Masumura, Applied Optics 46(18), 3811-3820 (2007) (Sellmeier fit, coefficients from refractiveindex.info, CC0).
// Rays are traced as vectors (Snell's law at every surface); intensities use the unpolarized Fresnel equations.
(function (root) {
  "use strict";
  const B = [0.5684027565, 0.1726177391, 0.02086189578, 0.1130748688], CC = [0.005101829712, 0.01821153936, 0.02620722293, 10.69792721];
  function nWater(lambdaNm) { const l2 = (lambdaNm / 1000) ** 2; let s = 1; for (let j = 0; j < 4; j++) s += B[j] * l2 / (l2 - CC[j]); return Math.sqrt(s); }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  // refract direction d at a surface with normal m pointing against d, eta = n_from / n_to; null if total internal reflection
  function refract(d, m, eta) { const ci = -dot(m, d), k = 1 - eta * eta * (1 - ci * ci); if (k < 0) return null; const f = eta * ci - Math.sqrt(k); return [eta * d[0] + f * m[0], eta * d[1] + f * m[1]]; }
  function reflect(d, m) { const k = 2 * dot(d, m); return [d[0] - k * m[0], d[1] - k * m[1]]; }
  // next hit on the unit circle from point p (on the circle) going d (inside)
  const chord = (p, d) => { const s = -2 * dot(p, d); return [p[0] + s * d[0], p[1] + s * d[1]]; };
  // unpolarized Fresnel reflectance for incidence angle ci (cosine) from n1 into n2
  function fresnelR(ci, n1, n2) { const st = n1 / n2 * Math.sqrt(Math.max(0, 1 - ci * ci)); if (st >= 1) return 1; const ct = Math.sqrt(1 - st * st);
    const rs = ((n1 * ci - n2 * ct) / (n1 * ci + n2 * ct)) ** 2, rp = ((n1 * ct - n2 * ci) / (n1 * ct + n2 * ci)) ** 2; return (rs + rp) / 2; }
  // trace a ray of impact parameter b (0..1) entering a unit drop from the left (direction +x) with k internal reflections
  // returns {pts: [entry, ...reflection points, exit], out: exit direction, angle: degrees from the antisolar direction, weight: Fresnel fraction}
  function trace(b, lambdaNm, k = 1) {
    const n = nWater(lambdaNm), d0 = [1, 0], p0 = [-Math.sqrt(1 - b * b), b];
    let d = refract(d0, p0, 1 / n); const ci0 = -dot(p0, d0); let w = 1 - fresnelR(ci0, 1, n);
    const pts = [p0]; let p = p0;
    for (let j = 0; j < k; j++) { const q = chord(p, d); pts.push(q); const m = [-q[0], -q[1]]; w *= fresnelR(-dot(m, d), n, 1); d = reflect(d, [q[0], q[1]]); p = q; }
    const q = chord(p, d); pts.push(q); const m = [-q[0], -q[1]], ci = -dot(m, d); w *= 1 - fresnelR(ci, n, 1);
    const out = refract(d, m, n); if (!out) return null;
    const angle = Math.acos(Math.max(-1, Math.min(1, -dot(out, d0)))) * 180 / Math.PI;    // angle between the ray reaching the eye and the antisolar direction
    return { pts, out, angle, weight: w };
  }
  // analytic rainbow angle (minimum deviation) for k reflections: cos i = sqrt((n^2 - 1) / (k(k+2)))
  function rainbowAngle(lambdaNm, k = 1) { const n = nWater(lambdaNm), i = Math.acos(Math.sqrt((n * n - 1) / (k * (k + 2)))), r = Math.asin(Math.sin(i) / n);
    const D = 2 * (i - r) + k * (Math.PI - 2 * r); const deg = D * 180 / Math.PI; return k % 2 ? 180 - (deg % 360) : (deg % 360) - 180; }
  // angular intensity profile I(theta) for one wavelength: rays uniform over the drop's cross-section (b = sqrt(u)), Fresnel-weighted,
  // smoothed by the Sun's angular diameter (0.53 degrees)
  function profile(lambdaNm, k, lo, hi, step, rays = 200000) {
    const nb = Math.round((hi - lo) / step), h = new Float64Array(nb);
    for (let s = 0; s < rays; s++) { const b = Math.sqrt((s + .5) / rays), r = trace(b, lambdaNm, k); if (!r) continue; const j = Math.floor((r.angle - lo) / step); if (j >= 0 && j < nb) h[j] += r.weight; }
    const sig = .265 / step / 2, ker = []; for (let x = -Math.ceil(3 * sig); x <= Math.ceil(3 * sig); x++) ker.push(Math.exp(-x * x / (2 * sig * sig)));
    const ks = ker.reduce((a, b) => a + b, 0), out = new Float64Array(nb), half = (ker.length - 1) / 2;
    for (let j = 0; j < nb; j++) { let v = 0; for (let q = 0; q < ker.length; q++) { const jj = j + q - half; if (jj >= 0 && jj < nb) v += h[jj] * ker[q]; } out[j] = v / ks / rays; }
    return out;
  }
  // approximate visible colour of a wavelength (display only; "spectral colours illustrative")
  function rgb(l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else r = 1;
    const f = l < 420 ? .3 + .7 * (l - 380) / 40 : l > 680 ? .3 + .7 * (750 - l) / 70 : 1;
    return [r, g, b].map((c) => Math.round(255 * Math.pow(c * f, .8)));
  }
  const api = { nWater, trace, rainbowAngle, profile, rgb, fresnelR };
  root.Optics = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
