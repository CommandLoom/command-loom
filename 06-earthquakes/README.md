# 06 · Earthquakes of 2025

Every earthquake of magnitude 4.5 or more that the USGS catalog recorded in 2025 (8,556 events), one day at a time on a turning globe, then the largest of the year (M8.8, Kamchatka, 29 July) and its aftershocks.

This is a **data visualization**, not a simulation: every dot is a real catalog event at its reported time and place. This folder renders the whole video (2:24, 1920×1080, 30 fps, with sound) and its three Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). The frozen data snapshot is already in `engine/quakes.js`.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8777` in this folder and open <http://localhost:8777/Earthquakes.html>.

Pick the long video or a Short, watch it, or press **Export selected MP4**.

## The data

- **Earthquakes:** USGS ANSS Comprehensive Earthquake Catalog (ComCat), FDSN event web service, US public domain. Query:
  `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2025-01-01T00:00:00Z&endtime=2026-01-01T00:00:00Z&minmagnitude=4.5&eventtype=earthquake&orderby=time-asc`
- **Land outlines:** [Natural Earth](https://www.naturalearthdata.com/) 1:110m land, public domain.
- Snapshot downloaded 2026-10-16 (UTC). `data/manifest.json` records the query, download time, SHA-256 of the raw file and every headline number. Catalogs are revised over time, so a fresh download can differ slightly.

To rebuild the snapshot yourself: save the query result as `data/raw/usgs_2025_m45.geojson`, the Natural Earth land GeoJSON as `data/raw/ne_110m_land.geojson`, write the download time to `data/raw/downloaded_utc.txt`, then run `python engine/prepare_data.py`. It rewrites `engine/quakes.js` and `data/manifest.json`.

Snapshot numbers: 8,556 events (all located); 2,128 M5+, 145 M6+, 16 M7+, one M8.8 (us6000qw60, mww, 29 July 2025 23:24 UTC, depth 35 km). Busiest UTC day: 30 July 2025 with 422 events.

## What is measured, what is display

Measured (checked by `engine/test_quakes.js`): every counter, date, magnitude label, the per-day bar chart, the Japan box count (24–46°N, 122–150°E: 646 events), and the summary numbers. All are computed from the snapshot at render time; nothing is typed in by hand.

Display only: marker size grows with magnitude but is symbolic (not rupture area); colour is depth (amber < 70 km, pink 70–300 km, cyan > 300 km). Playback rates (4 days per second, 2 hours per second, …) are shown on screen. Sound is synthesized from the data: one soft note per M5.5+ event, at most eight a second, lower notes for larger magnitudes. These are not seismic recordings.

## Tests

```
node engine/test_quakes.js
```

## Files

| File | Role |
|------|------|
| `engine/prepare_data.py` | Freezes the raw downloads into `quakes.js` and `manifest.json`. |
| `engine/quakes.js` | The frozen snapshot (events + land rings + manifest). |
| `engine/video.js` | Globe projection, scenes, timing, drawing and sound events. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `data/manifest.json` | Provenance and headline numbers. |
| `Earthquakes.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
