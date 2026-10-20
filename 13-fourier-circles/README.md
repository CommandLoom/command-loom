# 13 · Fourier Circles

Circles on the rims of circles, each turning a whole number of times per lap. Added one by one they draw a heart; then a star, a flower, an infinity sign and the channel's logo, faster and faster.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8792` in this folder and open <http://localhost:8792/FourierCircles.html>.

## The maths

`engine/fourier.js`: each shape is resampled to 256 points along its length, and a discrete Fourier transform turns them into 256 circles (radius |c_k|, k turns per lap, starting angle arg c_k), sorted from largest to smallest. Using all 256 reproduces every point exactly.

- Heart, average miss as a share of its height: 1 circle 10.2%, 2 circles 8.8%, 4 circles 5.6%, 8 circles 2.0%, 16 circles 0.54%, 32 circles 0.17%, 64 circles 0.05%.
- Star (64 circles) 0.009%, flower (32) 0.026%, infinity (32, the lemniscate of Gerono) 0.033%, logo (128) 0.025%, measured at the sample points.
- The drawing speeds up lap after lap; the circles' speeds stay whole numbers per lap.

## What is measured, what is display

Computed (checked by `engine/test_fourier.js`): every circle, every miss, and the lap clock. Display only: colours, the glowing trail and the speed-up. Sound is synthesized: the pen plays a note 16 times per lap (fewer when laps get fast), higher when the pen is higher, and a bell each time a lap closes.

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
