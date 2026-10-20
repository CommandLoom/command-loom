# 23 · Wait for Zero

A ball bouncing in a circle, a triangle, a hexagon and a diamond (and a square in Short 2); every bounce shrinks the shape by 1% of its starting size until, at 0%, it is exactly the ball's size.

This folder renders the whole video (1:50, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8803` in this folder and open <http://localhost:8803/WaitForZero.html>.

## The model

- `engine/shrink.js`: Exact parabolic flights inside a circle (bisection) or a regular polygon (quadratic roots); elastic bounces. Game rule: after each bounce the shape is scaled by (100 − n)/(100 − n + 1) around the contact point, so the wall never pushes the ball.

## What is measured, what is display

Computed (checked by `engine/test_zero.js`): exactly 100 bounces to 0%; energy constant within 1e-9; every bounce on the wall, angle in = angle out; the new size is exactly (100 − bounces)% of the start; the ball always inside the current shape; times to 0% (circle 23.3 s, triangle 20.8 s, hexagon 23.6 s, diamond 31.2 s, square 27.3 s).

Display only: faint outlines of passed sizes, the 0.1 s easing of the drawn outline, the trail, the pulse at 0%. Sound: a marimba note per bounce rising as the counter falls, a bell at 0%.

## Tests

```
node engine/test_zero.js
```

## Files

| File | Role |
|------|------|
| `engine/shrink.js` | Exact parabolic flights inside a circle (bisection) or a regular polygon (quadratic roots); elastic bounces. Game rule: after each bounce the shape is scaled by (100 − n)/(100 − n + 1) around the contact point, so the wall never pushes the ball. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `WaitForZero.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
