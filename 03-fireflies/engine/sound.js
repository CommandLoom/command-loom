// Firefly sonification adapted from the completed Double Pendulums sound engine.
// Approved Claude 1b glass voice; every note follows a measured flash event.
(function (root) {
  "use strict";
  // G major pentatonic, low to high = first to last representative firefly (same colour order)
  const PENTA = [0, 2, 4, 7, 9];
  const note = (k, base) => base * Math.pow(2, (12 * Math.floor(k / 5) + PENTA[k % 5]) / 12);
  const STYLES = {
    glass: { name: "Short glass", base: 392.0, parts: [[1,.55,.16],[2.756,.40,.13],[5.404,.16,.07]], attack: .004,
      gain: .55*1.55, wet: .07, target: -27, maxBoost: 6, span: 10, lowpass: 3600 }
  };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // one voice, mono, into buf at offset
  function voice(buf, at, sr, st, k, amp) {
    if (st.parts) {
      const f0 = note(st.span ? Math.round(k * st.span / 15) : k, st.base), len = Math.min(buf.length - at, Math.round(sr * st.parts[0][2] * 5));
      for (const [mul, a, dec] of st.parts) {
        const f = f0 * mul; if (f > sr * .45) continue;
        const w = 2 * Math.PI * f / sr, d = Math.exp(-1 / (dec * sr)); let e = a * amp;
        for (let i = 0; i < len; i++) { const atk = i < st.attack * sr ? i / (st.attack * sr) : 1; const t=i/sr, tail=t<=.12?1:t>=.55?0:Math.cos(Math.PI/2*(t-.12)/.43)**2;
          buf[at + i] += e * atk * tail * Math.sin(w * i); e *= d; }
      }
    } else {                                   // wood: short resonant noise click, pitch by colour order
      const f = 620 * Math.pow(2, k / 15 * 1.2), r = rng(k * 7919 + at), len = Math.min(buf.length - at, Math.round(sr * .12));
      const w = 2 * Math.PI * f / sr, q = .965; let y1 = 0, y2 = 0, e = amp;
      const d = Math.exp(-1 / (.03 * sr));
      for (let i = 0; i < len; i++) { const x = i < 40 ? (r() * 2 - 1) * e : 0; const y = x + 2 * q * Math.cos(w) * y1 - q * q * y2; y2 = y1; y1 = y; buf[at + i] += y * .18 * Math.pow(d, i); }
    }
  }
  // small Schroeder room
  function reverb(L, R, sr, wet) {
    const combs = [1116, 1188, 1277, 1356].map(n => Math.round(n * sr / 44100)), aps = [556, 441].map(n => Math.round(n * sr / 44100));
    for (const [ch, spread] of [[L, 0], [R, 23]]) {
      const inp = Float32Array.from(ch), out = new Float32Array(ch.length);
      for (const n0 of combs) { const n = n0 + spread, b = new Float32Array(n); let idx = 0, lp = 0;
        for (let i = 0; i < inp.length; i++) { const y = b[idx]; lp = y * .8 + lp * .2; b[idx] = inp[i] * .25 + lp * .82; out[i] += y; idx = (idx + 1) % n; } }
      for (const n0 of aps) { const n = n0 + spread, b = new Float32Array(n); let idx = 0;
        for (let i = 0; i < out.length; i++) { const bv = b[idx], y = -out[i] + bv; b[idx] = out[i] + bv * .5; out[i] = y; idx = (idx + 1) % n; } }
      for (let i = 0; i < ch.length; i++) ch[i] = ch[i] * (1 - wet * .5) + out[i] * wet * .35;
    }
  }
  // events in output time: [{t, k, x, side}] ; side -1/0/1 shifts pan for split screens
  function render(events, duration, styleName = "glass", sr = 48000) {
    if (!STYLES[styleName]) throw Error("Only the approved glass voice is available");
    const st = STYLES[styleName], len = Math.ceil(duration * sr) + sr * 2, L = new Float32Array(len), R = new Float32Array(len), mono = new Float32Array(Math.round(sr * 6));
    const sorted = events.slice().sort((a, b) => a.t - b.t);
    for (let i = 0, lo = 0, hi = 0; i < sorted.length; i++) {      // neighbours within ±60 ms on the same screen side
      while (sorted[lo].t < sorted[i].t - .06) lo++;
      while (hi < sorted.length && sorted[hi].t <= sorted[i].t + .06) hi++;
      let n = 0; for (let j = lo; j < hi; j++) if ((sorted[j].side || 0) === (sorted[i].side || 0)) n++;
      sorted[i].vel = Math.pow(n, -.6);   // coincident notes share loudness; a full chord ≈ the peak of a single note
    }
    for (const e of sorted) {
      const at = Math.round(e.t * sr); if (at < 0 || at >= len) continue;
      mono.fill(0); const tmp = mono.subarray(0, Math.min(mono.length, len - at));
      voice(tmp, 0, sr, st, e.k, .22 * st.gain * (e.vel ?? 1));
      let pan = Math.max(-1, Math.min(1, (e.k / 15 * 2 - 1) * .45 + (e.side || 0) * .45));   // colour order spread across the stereo field
      const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
      for (let i = 0; i < tmp.length; i++) { const v = tmp[i]; if (v === 0 && i > sr * .1) continue; L[at + i] += v * gl; R[at + i] += v * gr; }
    }
    if (st.lowpass) { const a = 1 - Math.exp(-2 * Math.PI * st.lowpass / sr); for (const ch of [L, R]) { let y = 0; for (let i = 0; i < ch.length; i++) { y += a * (ch[i] - y); ch[i] = y; } } }
    reverb(L, R, sr, st.wet);
    // slow automatic gain: 1.5 s RMS follower, gain limited to -6 dB..+maxBoost, target per style
    const target = Math.pow(10, st.target / 20), win = Math.round(sr * 1.5), hop = Math.round(sr * .05);
    const gains = []; for (let a = 0; a < len; a += hop) { let s = 0, n = 0; for (let i = Math.max(0, a - win / 2); i < Math.min(len, a + win / 2); i += 4) { s += L[i] * L[i] + R[i] * R[i]; n += 2; }
      const rms = Math.sqrt(s / Math.max(1, n)); gains.push(rms < 1e-5 ? 1 : Math.max(Math.pow(10, -6 / 20), Math.min(Math.pow(10, st.maxBoost / 20), target / rms))); }
    let g = gains[0]; const slew = Math.exp(-1 / (sr * .4));
    for (let i = 0; i < len; i++) { const gi = gains[Math.min(gains.length - 1, Math.floor(i / hop))]; g = gi + (g - gi) * slew; L[i] *= g; R[i] *= g; }
    // Original soft limiter, followed by one fixed -3 dB output trim for the revision peak target.
    // Per-note cosine release shortens only the tail; partial ratios and the approved attack stay unchanged.
    const c = Math.pow(10, -1 / 20); for (let i = 0; i < len; i++) { L[i] = Math.pow(10,-3/20)*c*Math.tanh(L[i]/c); R[i] = Math.pow(10,-3/20)*c*Math.tanh(R[i]/c); }
    const n = Math.round(duration * sr), fade = Math.min(n, Math.round(.5*sr));
    // Match the completed video's linear end fade; the final PCM sample is exactly zero.
    for (let i=0;i<fade;i++){const j=n-1-i,g=i/fade;L[j]*=g;R[j]*=g;}
    return { L: L.subarray(0,n), R: R.subarray(0,n), len:n, sr, duration, events:sorted.length, ...stats(L,R,0,n) };
  }
  function stats(L,R,start=0,end=L.length){
    let energy=0,peak=0;for(let i=start;i<end;i++){energy+=(L[i]*L[i]+R[i]*R[i])/2;peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}
    return {rmsDb:energy?10*Math.log10(energy/(end-start)):-Infinity,peakDb:peak?20*Math.log10(peak):-Infinity};
  }
  // Firefly events are mapped by the same director used for the visuals.
  function timeline(scenes,ranges){return root.FireflyDirector.timeline(scenes,ranges);}
  const frequency=k=>note(Math.round(k*STYLES.glass.span/15),STYLES.glass.base);
  const api={STYLES,render,timeline,note,frequency,stats};root.FireflySound=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window !== "undefined" ? window : globalThis);
