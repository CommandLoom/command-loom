// Command Loom preview / export page. The video module sets window.CLVideo = {title, ready?: Promise, timelines: [...]}
// where each timeline is {id, name, file, W, H, dur, draw(ctx, t), events(), voice}.
// Batch use (local only): ?render=full,s1&post=1 posts finished MP4s to http://127.0.0.1:8771 ; ?stills=full:3.5,s1:10 posts JPEG frames.
(async function () {
  "use strict";
  const $ = (id) => document.getElementById(id), V = window.CLVideo, params = new URLSearchParams(location.search);
  const canvas = $("screen"), ctx = canvas.getContext("2d", { alpha: false });
  const msg = (s) => { $("message").textContent = s; };
  let cur = 0, time = 0, playing = false, last = 0, busy = false, cancel = false, audio = null, source = null; const mixes = {};
  const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  function size() { const tl = V.timelines[cur]; canvas.width = tl.W; canvas.height = tl.H; canvas.style.aspectRatio = tl.W + "/" + tl.H; canvas.style.maxHeight = tl.H > tl.W ? "82vh" : ""; canvas.style.width = tl.H > tl.W ? "auto" : "100%"; canvas.style.height = tl.H > tl.W ? "82vh" : "auto"; }
  function draw(t) {
    const tl = V.timelines[cur]; tl.draw(ctx, t);
    if ($("ui").checked && tl.H > tl.W) { ctx.fillStyle = "rgba(255,40,40,.22)"; ctx.fillRect(0, tl.H * .8, tl.W, tl.H * .2); ctx.fillRect(tl.W * .88, tl.H * .42, tl.W * .12, tl.H * .38); }
    $("position").value = t; $("clock").textContent = mmss(t) + " / " + mmss(tl.dur);
  }
  function select(i) { cur = i; time = 0; stopAudio(); size(); $("position").max = V.timelines[i].dur - 1 / 30; document.querySelectorAll("#list button").forEach((b, j) => b.classList.toggle("on", j === i)); draw(0); }
  function stopAudio() { try { source?.stop(); } catch (e) {} source = null; }
  async function startAudio() {
    stopAudio(); if (!playing || !$("sound").checked) return; const tl = V.timelines[cur];
    audio = audio || new AudioContext(); await audio.resume();
    const m = mixes[tl.id] || (mixes[tl.id] = CLSound.render(tl.events(), tl.dur, tl.voice || "glass"));
    const b = audio.createBuffer(2, m.len, 48000); b.copyToChannel(m.L, 0); b.copyToChannel(m.R, 1);
    source = audio.createBufferSource(); source.buffer = b; source.connect(audio.destination); source.start(0, Math.min(time, tl.dur - .02));
  }
  function save(blob, name) { const a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 60000); }
  async function post(blob, name) { const r = await fetch("http://127.0.0.1:8771/?name=" + encodeURIComponent(name), { method: "POST", body: blob }); if (!r.ok) throw Error("post failed"); }
  async function exportOne(i, toServer) {
    const tl = V.timelines[i]; select(i); playing = false; stopAudio();
    const off = document.createElement("canvas");
    const r = await CLExport.encode(tl, off, { onProgress: (f, n) => msg(tl.name + " · frame " + f + " / " + n), isCancelled: () => cancel });
    if (toServer) await post(r.blob, tl.file); else save(r.blob, tl.file);
    msg(tl.file + " · " + (r.blob.size / 1048576).toFixed(1) + " MB · " + r.frames + " frames · " + r.codec + " · audio peak " + r.peakDb.toFixed(1) + " dB");
    return { id: tl.id, file: tl.file, frames: r.frames, bytes: r.blob.size, codec: r.codec, peakDb: r.peakDb, rmsDb: r.rmsDb, events: r.events };
  }
  async function run(list, toServer = false) {
    if (busy) return; busy = true; cancel = false; document.querySelectorAll("button").forEach((b) => b.disabled = true); $("cancel").disabled = false;
    const out = [];
    try { for (const i of list) out.push(await exportOne(i, toServer)); } catch (e) { msg("Error: " + (e && e.message || e)); out.push({ error: String(e && e.message || e) }); }
    finally { busy = false; document.querySelectorAll("button").forEach((b) => b.disabled = false); }
    return out;
  }
  function loop(now) { if (last && playing && !busy) { const tl = V.timelines[cur]; time = Math.min(tl.dur - 1 / 30, time + (now - last) / 1000); draw(time); if (time >= tl.dur - 1 / 30) { playing = false; stopAudio(); } } last = now; requestAnimationFrame(loop); }
  try {
    msg("Loading…"); if (V.ready) await V.ready;
    $("title").textContent = V.title;
    V.timelines.forEach((tl, i) => { const b = document.createElement("button"); b.textContent = tl.name + " (" + mmss(tl.dur) + ")"; b.onclick = () => { if (!busy) select(i); }; $("list").appendChild(b); });
    $("position").oninput = (e) => { time = Number(e.target.value); draw(time); startAudio(); };
    $("play").onclick = () => { playing = !playing; startAudio(); }; $("sound").onchange = startAudio; $("ui").onchange = () => draw(time);
    $("export").onclick = () => run([cur]); $("all").onclick = () => run(V.timelines.map((_, i) => i)); $("cancel").onclick = () => cancel = true;
    select(0); msg("Ready."); window.__app = { V, select, draw, run, exportOne };
    const stills = params.get("stills"), render = params.get("render");
    if (stills) {
      const done = [];
      for (const item of stills.split(",")) { const [id, t] = item.split(":"); const i = V.timelines.findIndex((x) => x.id === id); select(i); draw(Number(t));
        const b = await new Promise((r) => canvas.toBlob(r, "image/jpeg", .92)); const name = "still_" + id + "_" + t + ".jpg"; await post(b, name); done.push(name); }
      window.__stills = done;
    }
    if (render) { window.__done = await run(render.split(",").map((id) => V.timelines.findIndex((x) => x.id === id)), params.get("post") === "1"); }
    requestAnimationFrame(loop);
  } catch (e) { msg("Error: " + (e && e.stack || e)); window.__done = [{ error: String(e) }]; }
})();
