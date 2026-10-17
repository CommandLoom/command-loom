# 08 · Pendulum Wave

Sixteen pendulums, released together. Each is a little shorter than the last, so it swings a little faster. For one minute they drift into snakes, rows and apparent chaos, and at second 60 every pendulum is back in one straight line.

This folder renders the whole video (1:54, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8779` in this folder and open <http://localhost:8779/PendulumWave.html>.

Pick the long video or a Short, watch it, or press **Export selected MP4**.

## The model

Ideal simple pendulums in the small-angle limit (`engine/pendulum.js`): θₙ(t) = A cos(2πt / Tₙ).

- Pendulum n (n = 0 … 15) makes 51 + n full swings in 60 s, so Tₙ = 60 / (51 + n) and its length is Lₙ = g (Tₙ / 2π)², with g = 9.80665 m/s².
- Lengths run from 34.4 cm to 20.5 cm; periods from 1.176 s to 0.909 s.
- Because every pendulum completes a whole number of swings in 60 s, all of them return to the release position together at 60 s. At t = 60·p/q seconds their phases fall into q groups, which is why 4, 3, 2, 3 and 4 rows appear at 15, 20, 30, 40 and 45 s.
- Design after the Harvard Natural Sciences Lecture Demonstrations "Pendulum Waves" (15 pendulums, 51–65 swings per minute); we use 16.

## What is measured, what is display

Measured (checked by `engine/test_pendulum.js`): every length, period and swing count on screen, the row counts at each labelled moment, and the fact that the pendulums line up only at 0 s and 60 s within the minute.

Display only: the 3D view is a simple perspective drawing; the swing angle (14°) is treated with the small-angle formula, so there is no friction, drag or amplitude dependence. Real pendulum waves slowly lose the pattern because of exactly those effects. Sound is synthesized: one soft note each time a pendulum reaches the right end of its swing, the longest pendulum lowest.

## Tests

```
node engine/test_pendulum.js
```

## Files

| File | Role |
|------|------|
| `engine/pendulum.js` | The pendulum model (no graphics). |
| `engine/video.js` | Camera, scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `PendulumWave.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
