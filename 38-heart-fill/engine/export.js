// Command Loom frame-by-frame MP4 export (WebCodecs H.264 + AAC/Opus, mp4-muxer).
// Rules learned on earlier videos: try several codec profiles; never call flush() mid-stream (wait for "dequeue");
// frame time comes from the frame number, never the wall clock.
(function (root) {
  "use strict";
  async function codecs(W, H) {
    if (!root.VideoEncoder || !root.AudioEncoder) throw Error("WebCodecs not available. Use an up-to-date Chrome or Edge.");
    let video = null, audio = null, mux = "aac";
    for (const codec of ["avc1.640028", "avc1.640032", "avc1.64002a", "avc1.4d0028", "avc1.640033", "avc1.42e028"])
      for (const hardwareAcceleration of ["no-preference", "prefer-software", "prefer-hardware"]) {
        if (video) break;
        try { const r = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 12e6, framerate: 30, avc: { format: "avc" }, hardwareAcceleration }); if (r.supported) video = r.config; } catch (e) {}
      }
    for (const [codec, m] of [["mp4a.40.2", "aac"], ["opus", "opus"]]) {
      if (audio) break;
      try { const r = await AudioEncoder.isConfigSupported({ codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 }); if (r.supported) { audio = r.config; mux = m; } } catch (e) {}
    }
    if (!video) throw Error("No H.264 encoder for " + W + "x" + H + ". Try an up-to-date Chrome or Edge.");
    if (!audio) throw Error("No AAC or Opus audio encoder.");
    return { video, audio, mux };
  }
  const queue = (enc, max) => new Promise(async (res) => { while (enc.encodeQueueSize > max) await new Promise((r) => { const t = setTimeout(r, 1000); enc.addEventListener("dequeue", () => { clearTimeout(t); r(); }, { once: true }); }); res(); });
  const ch = new MessageChannel(), waiters = []; ch.port1.onmessage = () => waiters.shift()?.();
  const breathe = () => new Promise((r) => { waiters.push(r); ch.port2.postMessage(0); });

  // tl: {W, H, dur, draw(ctx, t), events(), voice}; returns {blob, frames, codec, audio stats}
  async function encode(tl, canvas, { onProgress = () => {}, isCancelled = () => false } = {}) {
    const W = tl.W, H = tl.H, FPS = 30, frames = Math.round(tl.dur * FPS);
    canvas.width = W; canvas.height = H; const ctx = canvas.getContext("2d", { alpha: false });
    const c = await codecs(W, H), mix = root.CLSound.render(tl.events(), frames / FPS, tl.voice || "glass");
    const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: FPS },
      audio: { codec: c.mux, sampleRate: 48000, numberOfChannels: 2 }, fastStart: "in-memory", firstTimestampBehavior: "offset" });
    let failure = null;
    const ve = new VideoEncoder({ output: (k, m) => muxer.addVideoChunk(k, m), error: (e) => failure = e }); ve.configure(c.video);
    const ae = new AudioEncoder({ output: (k, m) => muxer.addAudioChunk(k, m), error: (e) => failure = e }); ae.configure(c.audio);
    try {
      for (let f = 0; f < frames; f++) {
        if (isCancelled()) throw Error("Export cancelled."); if (failure) throw failure;
        tl.draw(ctx, f / FPS);
        const vf = new VideoFrame(canvas, { timestamp: Math.round(f * 1e6 / FPS), duration: Math.round(1e6 / FPS) }); ve.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
        await queue(ve, 5);
        if (f % 30 === 0) { onProgress(f, frames); await breathe(); }
      }
      await ve.flush();
      for (let i = 0; i < mix.len; i += 4800) {
        const n = Math.min(4800, mix.len - i), data = new Float32Array(n * 2); data.set(mix.L.subarray(i, i + n)); data.set(mix.R.subarray(i, i + n), n);
        const ad = new AudioData({ format: "f32-planar", sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i * 1e6 / 48000), data }); ae.encode(ad); ad.close();
        await queue(ae, 8); if (failure) throw failure;
      }
      await ae.flush(); muxer.finalize();
    } finally { try { ve.close(); } catch (e) {} try { ae.close(); } catch (e) {} }
    return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), frames, codec: c.video.codec + " + " + c.audio.codec, rmsDb: mix.rmsDb, peakDb: mix.peakDb, events: mix.events };
  }
  root.CLExport = { codecs, encode };
})(window);
