# 20 · Gravity Ladder

The same ball, dropped from rest in the same 1 m ring, under the surface gravity of the Moon, Mars, Earth, Jupiter and the Sun, shown in real time with no energy lost on bounces. The path is the same each time; only the clock runs faster.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8800` in this folder and open <http://localhost:8800/GravityLadder.html>.

## The model

`engine/gravity.js`:

- Ring radius 1 m, ball radius 4 cm, dropped from rest at (0.12, 0.8) m.
- Between bounces the ball follows an exact parabola; each bounce is found by bisection to machine precision and the velocity is reflected off the wall (angle in = angle out, no energy lost).
- Surface gravity (NASA planetary fact sheets): Moon 1.62, Mars 3.71, Earth 9.81, Jupiter 24.79, Sun 274 m/s².

## What is measured, what is display

Computed (checked by `engine/test_gravity.js`): every bounce and position; energy constant within 1e-9; the ball never leaves the ring; bounce n on any planet happens at the Moon's time × √(1.62/g); the bounce counts on screen (Moon 14, Mars 20, Earth 31, Jupiter 51, Sun 278 in their scenes). Display only: trail colours (one per flight), line widths, the camera push. Sound is synthesized: one marimba note per bounce (at most three per frame), pitch from the position on the ring.

## Tests

```
node engine/test_gravity.js
```

## Files

| File | Role |
|------|------|
| `engine/gravity.js` | Exact parabolic flights and bounces in a ring (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `GravityLadder.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
