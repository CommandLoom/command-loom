# 03 · Fireflies

1,000 fireflies flash at random. Nobody leads. Each flash nudges every other firefly a little closer to its own next flash, and after about 41 cycles all 1,000 flash as one.

This folder renders the whole video (1:38, 1920×1080, 30 fps, with sound) in your browser, frame by frame.

## Run it

You need **Node.js** (once, to compute the model), **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).

1. Compute the model runs (about 23 MB, so they are not stored in this repository; it takes a few seconds):
   ```
   node engine/measure_fireflies.js
   ```
   It is deterministic: on any computer it produces the same `seeds.json` / `seeds.js` that were used for the video.
2. Start the page:
   - **Windows:** double-click `start.bat`.
   - **Any system:** run `python -m http.server 8773` in this folder and open <http://localhost:8773/Fireflies.html>.
3. Watch any scene, or press **Export full MP4**.

## The model

**R. E. Mirollo and S. H. Strogatz, "Synchronization of pulse-coupled biological oscillators", SIAM J. Appl. Math. 50(6), 1645–1662 (1990)** ([doi:10.1137/0150098](https://doi.org/10.1137/0150098)).

- Each firefly is an oscillator with phase φ rising at a constant rate; at φ = 1 it flashes and resets to 0.
- State x = f(φ) = ln(1 + (eᵇ − 1)φ) / b with b = 3 (concave, as in the paper).
- When another firefly flashes, x jumps by ε = κ/(N − 1), capped at 1. Fireflies pushed over the threshold flash in the same event (a cascade), and the whole group resets together.
- N = 1,000, κ = 0.05, all-to-all coupling, identical oscillators, random starting phases (seed 3). Event times are solved exactly, not rounded to a time step.
- κ is a model choice, not a measured value for a real species. This is an idealized model inspired by synchronous fireflies (for example *Photinus carolinus*; see Sarfati, Hayes and Peleg, *Science Advances* 7(28), eabg9259, 2021), not a calibrated simulation of one.

## What is measured, what is display

Measured (and checked by `engine/test_sim.js`):

- **"In sync."** and **"One shared pulse."** appear only once all 1,000 identities flash in the same event, and they keep doing so for at least 20 more cycles. In the main run this happens at cycle 40.81.
- **No interaction:** the left panel of the comparison uses the same starting phases with κ = 0; it never synchronizes.
- **One flash, close up:** the ten-firefly scene shows a real single flash and the cascade it triggers, computed with the same equation.
- **Nearby links only:** a separate run where each firefly only sees neighbours within distance 0.35. It also synchronizes, but later (cycle 91.32, checked to cycle 150); the video shows its first 50 cycles.
- **Sound:** each note is a real flash of one of 16 evenly spaced representative fireflies. Notes that arrive together share one strike's loudness.

Display only:

- One model cycle is shown in two video seconds at normal speed; faster or slower parts are labelled on screen (4×, 0.1×, 3.3×, 5×).
- Firefly silhouettes, wings, positions, colours, the glow and its ~1.3 s afterglow, phase rings and connecting lines are illustrative.
- The opening 3 seconds are a labelled excerpt from later in the same run ("Later in this model").
- The short-glass timbre, stereo placement and loudness are designed; the sound is synthesized, not recorded.

## Tests

```
node engine/test_sim.js   # model law, cascades, reproducibility, every on-screen claim at every frame, sound events (needs step 1)
```

## Files

| File | Role |
|------|------|
| `engine/sim.js` | Pulse-coupled oscillator model (no graphics). |
| `engine/pick_seeds.js` | Runs all cases, records flash events and checkpoints; writes `seeds.json` / `seeds.js`. |
| `engine/measure_fireflies.js` | Entry point for regenerating the model data. |
| `engine/world.js` | Drawing (three.js). |
| `engine/sound.js` | Turns measured flashes into the soundtrack. |
| `engine/director.js` | Scenes, timing, on-screen text. |
| `Fireflies.html` | Preview and MP4 export page. |
| `start.bat` | Windows launcher. |

Libraries (included in `vendor/`): [three.js r128](https://threejs.org) and [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer).
