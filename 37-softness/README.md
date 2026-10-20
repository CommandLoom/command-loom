# 37 · Softness

The same 10 cm soft ball dropped on the floor with softness 0% to 100%, then 0% vs 100% in slow motion, all six from 1 m, and the softest from four heights.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8809` in this folder and open <http://localhost:8809/Softness.html>.

## The model

- `engine/jelly.js`: 48 points on a ring, springs to the 1st, 2nd and 3rd neighbours, gas pressure and an almost-constant-area term; softness weakens springs (×10^(−3s)) and pressure (×10^(−1.5s)). Floor contacts keep 10% of the speed into the floor. 900 small steps per frame.

## What is measured, what is display

Computed (checked by `engine/test_soft.js`): softer means lower bounce and flatter squash at every step (bounce back 13.1 … 0.3 cm); area within 10% in every frame; nothing goes through the floor; landing time matches √(2h/g); deterministic.

Display only: colours, highlight, the 4× slow motion (labelled). Sound: a soft plop per impact.

## Tests

```
node engine/test_soft.js
```

## Files

| File | Role |
|------|------|
| `engine/jelly.js` | 48 points on a ring, springs to the 1st, 2nd and 3rd neighbours, gas pressure and an almost-constant-area term; softness weakens springs (×10^(−3s)) and pressure (×10^(−1.5s)). Floor contacts keep 10% of the speed into the floor. 900 small steps per frame. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Softness.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
