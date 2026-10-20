// Command Loom event sonification. Every sound is one event from the video's own model or data:
// {t: seconds, k: 0..15 (pitch / colour order), side: -1..1 (optional pan offset), gain: optional multiplier, voice: optional style,
//  midi: optional exact pitch (MIDI note number; used for melodies instead of k)}.
// No drone, no noise bed, no per-scene normalisation. Coincident events share loudness, a slow automatic
// gain keeps sparse and dense passages comparable, and the last 0.5 s always fades to silence.
(function (root) {
  "use strict";
  const PENTA = [0, 2, 4, 7, 9];
  const note = (k, base) => base * Math.pow(2, (12 * Math.floor(k / 5) + PENTA[k % 5]) / 12);
  // parts: [frequency ratio, level, decay seconds]
  const STYLES = {
    glass:   { base: 392.0, parts: [[1, .55, .16], [2.756, .40, .13], [5.404, .16, .07]], attack: .004, gain: .85, wet: .07, span: 10, lowpass: 3600 },
    marimba: { base: 220.0, parts: [[1, 1, .45], [3.93, .10, .12], [9.2, .015, .04]], attack: .008, gain: .70, wet: .16, span: 10, lowpass: 2600 },
    bell:    { base: 196.0, parts: [[1, 1, 1.0], [2.0, .25, .6], [2.756, .20, .4], [5.404, .08, .15]], attack: .006, gain: .55, wet: .26, span: 10, lowpass: 2800 },
    wood:    { base: 0, parts: null, attack: .0005, gain: .55, wet: .10 },
    metal:   { base: 330.0, parts: [[1, .7, .9], [2.76, .45, .7], [5.40, .28, .45], [8.93, .14, .3]], attack: .002, gain: .5, wet: .2, span: 10, lowpass: 5200 },
    plop:    { base: 0, parts: null, plop: true, attack: .002, gain: .8, wet: .12 }
  };
  const TARGET = -27, MAX_BOOST = 6, CEILING = -1;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function voice(buf, sr, st, k, amp, seed, midi) {
    if (st.plop) {                             // soft "plop": a low sine whose pitch falls quickly (jelly, water)
      const f1 = midi != null ? midiHz(midi) : 110 * Math.pow(2, k / 15), len = Math.min(buf.length, Math.round(sr * .25)); let ph = 0;
      for (let i = 0; i < len; i++) { const tt = i / sr, f = f1 * (1 + 1.5 * Math.exp(-tt / .025)); ph += 2 * Math.PI * f / sr; buf[i] += amp * 1.4 * Math.min(1, i / (st.attack * sr)) * Math.exp(-tt / .07) * Math.sin(ph); }
      return;
    }
    if (st.parts) {
      const f0 = midi != null ? midiHz(midi) : note(st.span ? Math.round(k * st.span / 15) : k, st.base), len = Math.min(buf.length, Math.round(sr * st.parts[0][2] * 5));
      for (const [mul, a, dec] of st.parts) {
        const f = f0 * mul; if (f > sr * .45) continue;
        const w = 2 * Math.PI * f / sr, d = Math.exp(-1 / (dec * sr)); let e = a * amp;
        for (let i = 0; i < len; i++) { const atk = i < st.attack * sr ? i / (st.attack * sr) : 1; buf[i] += e * atk * Math.sin(w * i); e *= d; }
      }
    } else {                                   // wood: short resonant noise click, pitch by order
      const f = 620 * Math.pow(2, k / 15 * 1.2), r = rng(seed), len = Math.min(buf.length, Math.round(sr * .12));
      const w = 2 * Math.PI * f / sr, q = .965, d = Math.exp(-1 / (.03 * sr)); let y1 = 0, y2 = 0;
      for (let i = 0; i < len; i++) { const x = i < 40 ? (r() * 2 - 1) * amp : 0; const y = x + 2 * q * Math.cos(w) * y1 - q * q * y2; y2 = y1; y1 = y; buf[i] += y * .18 * Math.pow(d, i); }
    }
  }
  function reverb(L, R, sr, wet) {
    if (!wet) return;
    const combs = [1116, 1188, 1277, 1356].map((n) => Math.round(n * sr / 44100)), aps = [556, 441].map((n) => Math.round(n * sr / 44100));
    for (const [ch, spread] of [[L, 0], [R, 23]]) {
      const inp = Float32Array.from(ch), out = new Float32Array(ch.length);
      for (const n0 of combs) { const n = n0 + spread, b = new Float32Array(n); let idx = 0, lp = 0;
        for (let i = 0; i < inp.length; i++) { const y = b[idx]; lp = y * .8 + lp * .2; b[idx] = inp[i] * .25 + lp * .82; out[i] += y; idx = (idx + 1) % n; } }
      for (const n0 of aps) { const n = n0 + spread, b = new Float32Array(n); let idx = 0;
        for (let i = 0; i < out.length; i++) { const bv = b[idx], y = -out[i] + bv; b[idx] = out[i] + bv * .5; out[i] = y; idx = (idx + 1) % n; } }
      for (let i = 0; i < ch.length; i++) ch[i] = ch[i] * (1 - wet * .5) + out[i] * wet * .35;
    }
  }
  function stats(L, R, a = 0, b = L.length) {
    let s = 0, p = 0; for (let i = a; i < b; i++) { s += (L[i] * L[i] + R[i] * R[i]) / 2; p = Math.max(p, Math.abs(L[i]), Math.abs(R[i])); }
    return { rmsDb: 10 * Math.log10(s / Math.max(1, b - a) + 1e-20), peakDb: 20 * Math.log10(p + 1e-12) };
  }
  function render(events, duration, styleName = "glass", sr = 48000) {
    const len = Math.max(1, Math.round(duration * sr)), L = new Float32Array(len + sr * 2), R = new Float32Array(len + sr * 2);
    const sorted = events.filter((e) => e.t >= 0 && e.t < duration).slice().sort((a, b) => a.t - b.t);
    for (let i = 0, lo = 0, hi = 0; i < sorted.length; i++) {          // events within ±60 ms on the same side share loudness
      while (sorted[lo].t < sorted[i].t - .06) lo++;
      while (hi < sorted.length && sorted[hi].t <= sorted[i].t + .06) hi++;
      let n = 0; for (let j = lo; j < hi; j++) if ((sorted[j].side || 0) === (sorted[i].side || 0)) n++;
      sorted[i].vel = Math.pow(n, -.6);
    }
    const tmp = new Float32Array(sr * 6);
    sorted.forEach((e, idx) => {
      const st = STYLES[e.voice || styleName], at = Math.round(e.t * sr); tmp.fill(0);
      const view = tmp.subarray(0, Math.min(tmp.length, L.length - at));
      voice(view, sr, st, e.k ?? 7, .22 * st.gain * e.vel * (e.gain ?? 1), idx * 7919 + at, e.midi);
      const pan = Math.max(-1, Math.min(1, ((e.k ?? 7) / 15 * 2 - 1) * .4 + (e.side || 0) * .45)), gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
      for (let i = 0; i < view.length; i++) { const v = view[i]; if (v === 0 && i > sr * .2) continue; L[at + i] += v * gl; R[at + i] += v * gr; }
    });
    const lp = STYLES[styleName].lowpass;
    if (lp) { const a = 1 - Math.exp(-2 * Math.PI * lp / sr); for (const ch of [L, R]) { let y = 0; for (let i = 0; i < ch.length; i++) { y += a * (ch[i] - y); ch[i] = y; } } }
    reverb(L, R, sr, STYLES[styleName].wet);
    const target = Math.pow(10, TARGET / 20), win = Math.round(sr * 1.5), hop = Math.round(sr * .05), gains = [];
    for (let a = 0; a < len; a += hop) { let s = 0, n = 0; for (let i = Math.max(0, a - win / 2); i < Math.min(len, a + win / 2); i += 4) { s += L[i] * L[i] + R[i] * R[i]; n += 2; }
      const rms = Math.sqrt(s / Math.max(1, n)); gains.push(rms < 1e-5 ? 1 : Math.max(Math.pow(10, -6 / 20), Math.min(Math.pow(10, MAX_BOOST / 20), target / rms))); }
    let g = gains[0] ?? 1; const slew = Math.exp(-1 / (sr * .4)), c = Math.pow(10, CEILING / 20);
    for (let i = 0; i < len; i++) { const gi = gains[Math.min(gains.length - 1, Math.floor(i / hop))]; g = gi + (g - gi) * slew; L[i] = c * Math.tanh(L[i] * g / c); R[i] = c * Math.tanh(R[i] * g / c); }
    // safety: the loudest strike never exceeds -12 dBFS (the whole track is scaled together, dynamics unchanged)
    let pk = 0; for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    const cap = Math.pow(10, -12 / 20); if (pk > cap) { const s = cap / pk; for (let i = 0; i < len; i++) { L[i] *= s; R[i] *= s; } }
    const fl = Math.min(len, Math.round(.5 * sr)); for (let i = 0; i < fl; i++) { const k = i / fl, j = len - 1 - i; L[j] *= k; R[j] *= k; }
    const outL = L.slice(0, len), outR = R.slice(0, len); outL[len - 1] = 0; outR[len - 1] = 0;
    return { L: outL, R: outR, len, sr, duration, events: sorted.length, ...stats(outL, outR) };
  }
  const api = { STYLES, note, render, stats }; root.CLSound = api; if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
