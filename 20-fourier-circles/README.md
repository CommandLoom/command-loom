# 20 · Fourier Circles

A circle on the rim of a spinning circle, another on its rim, and so on. Each turns a whole number of times per lap, and the pen at the end draws a heart, a star, or the Command Loom chevron.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8792` in this folder and open <http://localhost:8792/FourierCircles.html>.

## The maths

`engine/fourier.js`:

- Each closed shape is resampled to 256 points equally spaced along its outline, treated as complex numbers z_n.
- Discrete Fourier transform: c_k = (1/256) Σ z_n e^(−2πi k n / 256) for k = −128 … 127. Circle k has radius |c_k|, turns k times per lap and starts at angle arg c_k. Chained tip to tail, the last tip traces the shape; all 256 circles reproduce every sample point exactly.
- Circles are drawn largest first. The heart's average miss, as a share of its height: 10.2 % (1 circle), 8.8 % (2), 5.6 % (4), 2.0 % (8), 0.5 % (16), 0.2 % (32), 0.05 % (64).
- Shapes: the heart curve x = 16 sin³t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t (a well-known parametric heart), a five-pointed star, and the channel's chevron.

## What is measured, what is display

Computed (checked by `engine/test_fourier.js`): every circle's size, speed and phase; the exact reconstruction with 256 circles; every miss percentage. Display only: colours, line widths and how many laps are shown. Sound is synthesized: a soft note every 1/16 of a lap, pitch following the pen's height.

## Tests

```
node engine/test_fourier.js
```

## Files

| File | Role |
|------|------|
| `engine/fourier.js` | Resampling, the Fourier transform and the circle chain (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `FourierCircles.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
