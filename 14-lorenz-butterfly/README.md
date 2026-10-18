# 14 · Lorenz Butterfly

Three short equations with no randomness anywhere, and a path that never repeats. Two starts one billionth apart end up on different wings; 10,000 starts packed into a tiny box smear over the whole butterfly.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8785` in this folder and open <http://localhost:8785/LorenzButterfly.html>.

## The model

The Lorenz system (E. N. Lorenz, "Deterministic Nonperiodic Flow", *J. Atmos. Sci.* 20, 130–141, 1963), in `engine/lorenz.js`:

- dx/dt = σ(y − x), dy/dt = x(ρ − z) − y, dz/dt = xy − βz with σ = 10, ρ = 28, β = 8/3.
- Fourth-order Runge–Kutta with time step 0.005. Halving the step changes the path by less than 10⁻⁴ at time 5; later, as in any chaotic system, tiny differences grow, which is the point of the video.
- Path: starts at (1, 1, 1). Twin: starts at (1 + 10⁻⁹, 1, 1); the two are more than 1 unit apart by time 32.6.
- Cloud: 10,000 points in a 0.01-wide box on the attractor; after 25 time units about half are on each wing.

## What is measured, what is display

Measured (checked by `engine/test_lorenz.js`): the distance counter and its log-scale chart, the split time, the wing-switch counter, the cloud's spread and right-wing share. Display only: the 3D-to-2D projection and the slowly swinging viewpoint, colours and trail fading. Sound is synthesized: one soft note each time a path jumps to the other wing.

## Tests

```
node engine/test_lorenz.js
```

## Files

| File | Role |
|------|------|
| `engine/lorenz.js` | The Lorenz equations, RK4 and the point cloud (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `LorenzButterfly.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
