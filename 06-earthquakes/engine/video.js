// 06 Earthquakes: every M4.5+ earthquake of 2025 in the frozen USGS snapshot (quakes.js), on an orthographic globe.
// Dates are UTC. Marker size is symbolic (not rupture area); colour is the reported depth.
(function (root) {
  "use strict";
  const Q = root.QUAKES, LAND = root.LAND, D = root.CLDraw, EV = Q.events, DAY = 86400000, T0 = Q.t0, T1 = Q.t1, MAN = Q.manifest;
  const N = EV.length, rad = Math.PI / 180;
  const BIG = EV.reduce((b, e) => (e[4] > b[4] ? e : b), EV[0]);
  const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
  const perDay = {}; EV.forEach((e) => { const k = dayKey(e[0]); perDay[k] = (perDay[k] || 0) + 1; });
  const BUSY = Object.entries(perDay).reduce((b, kv) => (kv[1] > b[1] || (kv[1] === b[1] && kv[0] > b[0]) ? kv : b), ["", 0]);
  const DAYS = Array.from({ length: 365 }, (_, i) => perDay[dayKey(T0 + i * DAY)] || 0);
  const countAt = (t) => { let a = 0, b = N; while (a < b) { const m = (a + b) >> 1; if (EV[m][0] <= t) a = m + 1; else b = m; } return a; };   // events with time <= t
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fmtDate = (t) => { const d = new Date(t); return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); };
  const fmtTime = (t) => new Date(t).toISOString().slice(11, 16) + " UTC";
  const C = { bg: "#060B14", ocean: "#0C1A2C", rim: "#2A4B73", land: "#16283D", coast: "#3E6C9C", dim: "#9FB0C6", text: "#F5F3EF" };
  const depthColor = (d) => (d < 70 ? "#FFBD38" : d < 300 ? "#EF6FAE" : "#22D9F2");
  const markR = (m, k) => (1.6 + Math.pow(Math.max(0, m - 4.5), 1.55) * 2.6) * k;

  // ---------- orthographic globe ----------
  function proj(view, lon, lat) {
    const l0 = view.lon * rad, p0 = view.lat * rad, l = lon * rad, p = lat * rad;
    const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0);
    return [view.cx + view.R * Math.cos(p) * Math.sin(l - l0), view.cy - view.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0)), cosc];
  }
  function globe(ctx, view) {
    ctx.save(); ctx.beginPath(); ctx.arc(view.cx, view.cy, view.R, 0, 7); ctx.fillStyle = C.ocean; ctx.fill(); ctx.clip();
    ctx.lineWidth = 1.4 * view.k; ctx.strokeStyle = C.coast; ctx.fillStyle = C.land;
    for (const ring of LAND) {
      const pts = ring.map(([x, y]) => proj(view, x, y)); if (!pts.some((p) => p[2] >= 0)) continue;
      // fill: points behind the horizon are pushed onto the rim, so land that crosses the horizon still fills
      ctx.beginPath(); pts.forEach((p, i) => { let x = p[0], y = p[1]; if (p[2] < 0) { const dx = x - view.cx, dy = y - view.cy, l = Math.hypot(dx, dy) || 1; x = view.cx + dx / l * view.R; y = view.cy + dy / l * view.R; } i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); let pen = false;
      for (const p of pts) { if (p[2] < 0) { pen = false; continue; } if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]); }
      ctx.stroke();
    }
    // graticule
    ctx.strokeStyle = "rgba(90,130,180,.12)"; ctx.lineWidth = 1 * view.k;
    for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); let pen = false; for (let lon = -180; lon <= 180; lon += 4) { const p = proj(view, lon, lat); if (p[2] < 0) { pen = false; continue; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } ctx.stroke(); }
    for (let lon = -180; lon < 180; lon += 30) { ctx.beginPath(); let pen = false; for (let lat = -88; lat <= 88; lat += 4) { const p = proj(view, lon, lat); if (p[2] < 0) { pen = false; continue; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } ctx.stroke(); }
    ctx.restore();
    const g = ctx.createRadialGradient(view.cx, view.cy, view.R * .96, view.cx, view.cy, view.R * 1.12); g.addColorStop(0, "rgba(60,120,200,.35)"); g.addColorStop(1, "rgba(60,120,200,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(view.cx, view.cy, view.R * 1.12, 0, 7); ctx.fill();
  }
  // events up to data time t; flashes last `flash` video seconds; vps = data ms per video second
  function quakes(ctx, view, t, vps, opt = {}) {
    const n = countAt(t), flash = opt.flash ?? 1.2, k = view.k;
    ctx.save(); ctx.beginPath(); ctx.arc(view.cx, view.cy, view.R, 0, 7); ctx.clip();
    for (let i = 0; i < n; i++) { const e = EV[i], age = (t - e[0]) / vps; if (age < flash && !opt.noFlash) continue; const p = proj(view, e[1], e[2]); if (p[2] < 0) continue;
      ctx.globalAlpha = opt.cumAlpha ?? .4; ctx.fillStyle = depthColor(e[3]); ctx.beginPath(); ctx.arc(p[0], p[1], markR(e[4], k) * .55, 0, 7); ctx.fill(); }
    if (!opt.noFlash) for (let i = countAt(t - flash * vps); i < n; i++) { const e = EV[i], age = (t - e[0]) / vps, p = proj(view, e[1], e[2]); if (p[2] < 0) continue; const a = 1 - age / flash, r = markR(e[4], k) * (1 + 1.6 * a);
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 2.2); g.addColorStop(0, depthColor(e[3])); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = .35 + .65 * a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r * 2.2, 0, 7); ctx.fill(); ctx.fillStyle = "#FFFFFF"; ctx.globalAlpha = .9 * a; ctx.beginPath(); ctx.arc(p[0], p[1], r * .35, 0, 7); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1; return n;
  }
  // flat equirectangular inset (shows the far side too)
  function flat(ctx, x, y, w, h, t, vps, k = 1) {
    ctx.fillStyle = C.ocean; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "rgba(90,130,180,.35)"; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    const X = (lon) => x + (lon + 180) / 360 * w, Y = (lat) => y + (90 - lat) / 180 * h;
    ctx.fillStyle = C.land; ctx.strokeStyle = C.coast; ctx.lineWidth = .8;
    for (const ring of LAND) { ctx.beginPath(); ring.forEach(([a, b], i) => (i ? ctx.lineTo(X(a), Y(b)) : ctx.moveTo(X(a), Y(b)))); ctx.closePath(); ctx.fill(); }
    const n = countAt(t);
    for (let i = 0; i < n; i++) { const e = EV[i], age = (t - e[0]) / vps; ctx.globalAlpha = age < 1.2 ? 1 : .5; ctx.fillStyle = depthColor(e[3]); const r = age < 1.2 ? 2.4 * k : 1.1 * k; ctx.fillRect(X(e[1]) - r / 2, Y(e[2]) - r / 2, r, r); }
    ctx.globalAlpha = 1;
  }
  function dayBars(ctx, x, y, w, h, t, k = 1) {
    const upto = Math.floor((t - T0) / DAY), bw = w / 365, max = BUSY[1];
    for (let i = 0; i <= Math.min(364, upto); i++) { const v = DAYS[i], hh = v / max * h; ctx.fillStyle = i === upto ? "#FFFFFF" : "rgba(255,189,56,.75)"; ctx.fillRect(x + i * bw, y + h - hh, Math.max(1, bw - .3), hh); }
    ctx.strokeStyle = "rgba(160,176,198,.35)"; ctx.beginPath(); ctx.moveTo(x, y + h + .5); ctx.lineTo(x + w, y + h + .5); ctx.stroke();
    D.text(ctx, "earthquakes per UTC day", x, y + h + 26 * k, 22 * k, C.dim, 500, "left");
  }
  function legend(ctx, x, y, k = 1) {
    [["< 70 km deep", "#FFBD38"], ["70–300 km", "#EF6FAE"], ["> 300 km", "#22D9F2"]].forEach(([s, c], i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 8 * k, y + i * 34 * k, 7 * k, 0, 7); ctx.fill(); D.text(ctx, s, x + 26 * k, y + i * 34 * k, 23 * k, C.dim, 500, "left"); });
    D.text(ctx, "Marker size is symbolic · not rupture area", x, y + 104 * k, 21 * k, C.dim, 500, "left");
  }

  // ---------- full video ----------
  const YEAR_RATE = 4 * DAY;                     // data ms per video second in the chronological year
  const S = [{ id: "hook", t0: 0, t1: 3 }, { id: "intro", t0: 3, t1: 7 }, { id: "year", t0: 7, t1: 7 + 365 / 4 }];
  S.push({ id: "big", t0: S[2].t1, t1: S[2].t1 + 24 }, { id: "sum", t0: S[2].t1 + 24, t1: S[2].t1 + 36 }, { id: "close", t0: S[2].t1 + 36, t1: S[2].t1 + 44 });
  const FULL_DUR = Math.round(S[5].t1 * 30) / 30;
  const BIG_FROM = Date.UTC(2025, 6, 29, 12), BIG_RATE = 2 * 3600000;    // replay 29 Jul 12:00 → 31 Jul 12:00 UTC at 2 hours per second
  const sceneAt = (t) => S.find((s) => t < s.t1) || S[S.length - 1];
  const viewMain = (t) => ({ cx: 640, cy: 570, R: 440, k: 1, lon: 150 + 75 * Math.sin(2 * Math.PI * t / 70), lat: 12 });
  function panel(ctx, t, n, vps, label) {
    D.text(ctx, fmtDate(Math.min(t, T1 - 1)), 1200, 250, 64, C.text, 700, "left");
    D.text(ctx, label, 1200, 306, 28, C.dim, 500, "left");
    D.text(ctx, n.toLocaleString("en-US"), 1200, 392, 92, "#FFBD38", 700, "left"); D.text(ctx, "M4.5+ earthquakes recorded", 1200, 456, 28, C.dim, 500, "left");
    flat(ctx, 1200, 520, 600, 300, t, vps); dayBars(ctx, 1200, 860, 600, 90, t);
  }
  function drawFull(ctx, t) {
    const W = 1920, H = 1080, sc = sceneAt(t); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    if (sc.id === "hook") {
      const v = { ...viewMain(0), lon: 160 + 4 * t }; globe(ctx, v); quakes(ctx, v, T1, YEAR_RATE, { noFlash: true, cumAlpha: .7 });
      flat(ctx, 1200, 360, 600, 300, T1, YEAR_RATE); legend(ctx, 1200, 740);
      D.text(ctx, N.toLocaleString("en-US") + " earthquakes. One year.", W / 2, 90, 72, C.text, 700); D.text(ctx, "All of 2025 at once · USGS catalog, M4.5+", W / 2, 152, 32, "#FFBD38", 600); return;
    }
    if (sc.id === "intro") { const v = viewMain(0); globe(ctx, v); legend(ctx, 1200, 740); D.lines(ctx, ["Every M4.5+ earthquake of 2025,", "as recorded by USGS."], W / 2, 90, 60, C.text, D.fade(t, sc.t0, sc.t1)); D.text(ctx, "Now, one day at a time.", 1200, 300, 40, C.dim, 600, "left", D.fade(t, 4.2, 7)); return; }
    if (sc.id === "year") {
      const dt = T0 + (t - sc.t0) * YEAR_RATE, v = viewMain(t - sc.t0); globe(ctx, v); const n = quakes(ctx, v, dt, YEAR_RATE); panel(ctx, dt, n, YEAR_RATE, "UTC · 4 days per second");
      // M7+ labels, measured from the catalog
      for (const e of EV) { if (e[4] < 7) continue; const age = (dt - e[0]) / YEAR_RATE; if (age < 0 || age > 3) continue; const p = proj(v, e[1], e[2]);
        const a = D.clamp(Math.min(age / .2, (3 - age) / .5)); const s = "M" + e[4].toFixed(1) + " · " + e[7].replace(/^\d+ km [NSEW]+ of /, ""); D.text(ctx, s, 640, 1040, 30, "#FFBD38", 600, "center", a);
        if (p[2] > 0) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = "#FFBD38"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 26 + 30 * (1 - D.clamp(age)), 0, 7); ctx.stroke(); ctx.restore(); } break; }
      D.speed(ctx, "4 DAYS PER SECOND", W); return;
    }
    if (sc.id === "big") {
      const u = t - sc.t0, dt = BIG_FROM + u * BIG_RATE, z = 1 + 2.6 * D.smooth(u / 4), v = { cx: 640, cy: 570, R: 440 * z, k: 1, lon: 150 + (BIG[1] - 150) * D.smooth(u / 4), lat: 12 + (BIG[2] - 12) * D.smooth(u / 4) };
      globe(ctx, v); const n = quakes(ctx, v, dt, BIG_RATE, { flash: 1.4 });
      const after = countAt(dt) - countAt(BIG[0] - 1);
      D.text(ctx, fmtDate(dt), 1200, 250, 56, C.text, 700, "left"); D.text(ctx, fmtTime(dt) + " · 2 hours per second", 1200, 302, 28, C.dim, 500, "left");
      const hit = dt >= BIG[0];
      D.text(ctx, hit ? "M" + BIG[4].toFixed(1) + " (" + BIG[5] + ")" : "Kamchatka, Russia", 1200, 400, 80, "#FFBD38", 700, "left");
      if (hit) { D.text(ctx, "Largest in the 2025 catalog · depth " + BIG[3] + " km", 1200, 460, 28, C.dim, 500, "left"); D.text(ctx, after.toLocaleString("en-US"), 1200, 560, 72, C.text, 700, "left"); D.text(ctx, "M4.5+ earthquakes since the main shock", 1200, 612, 28, C.dim, 500, "left"); }
      if (dt >= Date.UTC(2025, 6, 31)) D.lines(ctx, [BUSY[1] + " recorded on " + fmtDate(Date.parse(BUSY[0])) + " (UTC):", "the busiest day of the year."], 1500, 760, 34, C.text, D.clamp((dt - Date.UTC(2025, 6, 31)) / (2 * BIG_RATE)));
      D.speed(ctx, "REPLAY · 2 HOURS PER SECOND", W);
      D.lines(ctx, ["The largest of the year."], W / 2, 90, 64, C.text, D.fade(u, 0, 6)); return;
    }
    // summary and close: the whole year on the flat map
    const f = D.fade(t, sc.t0, sc.t1), u = t - S[4].t0, z = 1 + .06 * u / 20;      // slow zoom across summary + close
    ctx.save(); ctx.translate(960, 610); ctx.scale(z, z); ctx.translate(-960, -610);
    flat(ctx, 160, 210, 1600, 800, T1, YEAR_RATE, 2);
    // summary steps: M6+, then M7+, then the M8.8 ringed on the map (all from the catalog)
    const steps = [[6, 2.5], [7, 5.5], [8.5, 8.5]];
    for (const e of EV) { let a = 0, r = 0; for (const [m, at] of steps) if (e[4] >= m && u >= at) { a = D.clamp((u - at) / .6); r = m >= 8.5 ? 34 : m >= 7 ? 20 : 11; }
      if (!a) continue; const x = 160 + (e[1] + 180) / 360 * 1600, y = 210 + (90 - e[2]) / 180 * 800;
      ctx.globalAlpha = a * (u > 8.5 && e[4] < 8.5 ? .55 : 1); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = r > 30 ? 4 : 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore();
    if (sc.id === "sum") { const c = MAN.counts, cap = u < 2.5 ? "" : u < 5.5 ? c["M≥6"] + " were M6+ (ringed)" : u < 8.5 ? c["M≥7"] + " were M7+" : "one M8.8: Kamchatka, 29 July";
      if (cap) D.text(ctx, cap, W / 2, 1050, 34, "#FFBD38", 700, "center", f); }
    if (sc.id === "sum") { const c = MAN.counts; D.lines(ctx, [N.toLocaleString("en-US") + " earthquakes M4.5+ · " + c["M≥5"].toLocaleString("en-US") + " M5+ · " + c["M≥6"] + " M6+ · " + c["M≥7"] + " M7+ · one M8.8"], W / 2, 110, 46, C.text, f); D.text(ctx, "The whole year · equirectangular map", W / 2, 166, 28, C.dim, 500, "center", f); }
    else { D.text(ctx, "Recorded events, not every earthquake.", W / 2, 110, 56, C.text, 700, "center", f); D.text(ctx, "Data: USGS ComCat (snapshot " + MAN.downloaded_utc.slice(0, 10) + ") · Natural Earth", W / 2, 1050, 26, C.dim, 500, "center", f); }
  }
  // sound: one soft note per M5.5+ earthquake in the chronological year, at most 8 per second; lower pitch = larger magnitude
  function notes(from, to, rate, offset, minMag, perSec, keep = () => true) {
    const out = [], used = new Set();
    for (let i = countAt(from - 1); i < N && EV[i][0] < to; i++) { const e = EV[i]; if (e[4] < minMag || !keep(e)) continue; const v = offset + (e[0] - from) / rate, slot = Math.floor(v * perSec);
      if (used.has(slot)) continue; used.add(slot); out.push({ t: v, k: Math.round(15 * D.clamp(1 - (e[4] - minMag) / (8.8 - minMag))), gain: .5 + .5 * D.clamp((e[4] - 5) / 3.8), side: e[1] > 150 ? .3 : -.3 }); }
    return out;
  }
  function fullEvents() {
    const s = Object.fromEntries(S.map((x) => [x.id, x]));
    return [...notes(T0, T1, YEAR_RATE, s.year.t0, 5.5, 8),
            ...notes(BIG_FROM, BIG_FROM + 24 * BIG_RATE, BIG_RATE, s.big.t0, 4.5, 8),
            { t: s.hook.t0 + .2, k: 4 }, { t: s.sum.t0 + .3, k: 7 }, { t: s.sum.t0 + 2.6, k: 9 }, { t: s.sum.t0 + 5.6, k: 5 }, { t: s.sum.t0 + 8.6, k: 1 }, { t: s.close.t0 + .3, k: 5 }];
  }

  // ---------- Shorts (1080x1920) ----------
  const VS = (t) => ({ cx: 540, cy: 860, R: 470, k: 1.05, lon: 150 + 80 * Math.sin(2 * Math.PI * t / 40), lat: 12 });
  const S1_RATE = 12 * DAY, S1_DUR = Math.round((365 / 12 + 3) * 30) / 30;
  function drawS1(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const dt = Math.min(T1 - 1, T0 + t * S1_RATE), v = VS(t); globe(ctx, v); const n = quakes(ctx, v, dt, S1_RATE, { flash: .8 });
    D.lines(ctx, t < 30.4 ? ["2025 in 30 seconds."] : [N.toLocaleString("en-US") + " earthquakes."], 540, 150, 76, C.text, 1); D.text(ctx, "Every M4.5+ earthquake · USGS", 540, 240, 32, "#FFBD38", 600);
    D.text(ctx, fmtDate(dt), 540, 1400, 54, C.text, 700); D.text(ctx, n.toLocaleString("en-US") + " so far", 540, 1470, 44, "#FFBD38", 700); D.text(ctx, "12 days per second · UTC", 540, 330, 30, C.dim, 600);
  }
  const S2_RATE = 1.6 * 3600000, S2_FROM = Date.UTC(2025, 6, 29, 14), S2_DUR = 32;
  function drawS2(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const dt = S2_FROM + t * S2_RATE, z = 1 + 2.4 * D.smooth(t / 3), v = { cx: 540, cy: 860, R: 470 * z, k: 1.05, lon: 150 + (BIG[1] - 150) * D.smooth(t / 3), lat: 12 + (BIG[2] - 12) * D.smooth(t / 3) };
    globe(ctx, v); quakes(ctx, v, dt, S2_RATE, { flash: 1.3 }); const hit = dt >= BIG[0], after = countAt(dt) - countAt(BIG[0] - 1);
    D.lines(ctx, hit ? ["M8.8. The largest", "earthquake of 2025."] : ["Kamchatka, Russia.", "29 July 2025."], 540, 150, 70, C.text, 1);
    D.text(ctx, fmtDate(dt) + " · " + fmtTime(dt), 540, 1380, 40, C.text, 700); if (hit) D.text(ctx, after.toLocaleString("en-US") + " M4.5+ quakes since", 540, 1450, 46, "#FFBD38", 700);
    D.text(ctx, "Replay · 1.6 hours per second", 540, 330, 30, C.dim, 600);
  }
  const JP = { lat0: 24, lat1: 46, lon0: 122, lon1: 150 }, inJP = (e) => e[2] >= JP.lat0 && e[2] <= JP.lat1 && e[1] >= JP.lon0 && e[1] <= JP.lon1, JP_N = EV.filter(inJP).length;
  const S3_RATE = 12 * DAY, S3_DUR = S1_DUR;
  function drawS3(ctx, t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 1920); const dt = Math.min(T1 - 1, T0 + t * S3_RATE), v = { cx: 540, cy: 900, R: 470 * 3.2, k: 1.05, lon: 137, lat: 36 };
    globe(ctx, v); quakes(ctx, v, dt, S3_RATE, { flash: .8 });
    // region box
    ctx.save(); ctx.strokeStyle = "rgba(255,189,56,.6)"; ctx.setLineDash([10, 8]); ctx.lineWidth = 2; ctx.beginPath(); let first = true;
    for (const [lo, la] of [[JP.lon0, JP.lat0], [JP.lon1, JP.lat0], [JP.lon1, JP.lat1], [JP.lon0, JP.lat1], [JP.lon0, JP.lat0]]) { const p = proj(v, lo, la); first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false; } ctx.stroke(); ctx.restore();
    let n = 0; for (let i = 0; i < countAt(dt); i++) if (inJP(EV[i])) n++;
    D.lines(ctx, ["A year of earthquakes", "around Japan."], 540, 150, 70, C.text, 1); D.text(ctx, "Box 24–46°N, 122–150°E · M4.5+ · USGS", 540, 330, 30, C.dim, 600);
    D.text(ctx, fmtDate(dt), 540, 1400, 50, C.text, 700); D.text(ctx, n.toLocaleString("en-US") + " in the box", 540, 1470, 46, "#FFBD38", 700);
  }

  const timelines = [
    { id: "full", name: "06 Earthquakes (long)", file: "Command Loom - 06 Earthquakes.mp4", W: 1920, H: 1080, dur: FULL_DUR, draw: drawFull, events: fullEvents, voice: "marimba" },
    { id: "s1", name: "Short 1 · 2025 in 30 seconds", file: "Command Loom - Short 1 - 2025 in 30 Seconds.mp4", W: 1080, H: 1920, dur: S1_DUR, draw: drawS1, voice: "marimba", events: () => notes(T0, T1, S1_RATE, 0, 6, 6) },
    { id: "s2", name: "Short 2 · The largest of 2025", file: "Command Loom - Short 2 - Largest of 2025.mp4", W: 1080, H: 1920, dur: S2_DUR, draw: drawS2, voice: "marimba", events: () => notes(S2_FROM, S2_FROM + S2_DUR * S2_RATE, S2_RATE, 0, 4.5, 7) },
    { id: "s3", name: "Short 3 · Around Japan", file: "Command Loom - Short 3 - Around Japan.mp4", W: 1080, H: 1920, dur: S3_DUR, draw: drawS3, voice: "marimba",
      events: () => notes(T0, T1, S3_RATE, 0, 4.5, 6, inJP) }
  ];
  root.CLVideo = { title: "Command Loom · 06 Earthquakes", timelines };
  root.QuakeVideo = { S, BIG, BUSY, DAYS, JP_N, countAt, inJP, fullEvents, timelines, FULL_DUR, YEAR_RATE };
})(typeof window !== "undefined" ? window : globalThis);
