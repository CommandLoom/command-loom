# 02 · Double Pendulums

1,000 double pendulums start almost exactly in the same place. Neighbouring starting angles differ by one billionth of a radian, so for about nine seconds they move as one. Then the tiny difference grows and every pendulum takes its own path.

This folder renders the whole video (2:20, 1920×1080, 30 fps, with sound) in your browser, frame by frame.

## Run it

You need **Node.js** (once, to compute the physics), **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).

1. Compute the measured runs (the results are about 100 MB, so they are not stored in this repository):
   ```
   node engine/measure_revision.js   # 1,000 pendulums × 5 starting angles, 60 s each (about 4 minutes)
   node engine/measure_sound.js      # centre-line crossings used for the sound (about 3 minutes)
   ```
   Both are deterministic: on any computer they produce the same files that were used for the video.
2. Start the page:
   - **Windows:** double-click `start.bat`.
   - **Any system:** run `python -m http.server 8772` in this folder and open <http://localhost:8772/DoublePendulums.html>.
3. Watch any scene, or press **Export full MP4**.

## The physics

The model is the ideal planar double pendulum from **T. Shinbrot, C. Grebogi, J. Wisdom and J. A. Yorke, "Chaos in a double pendulum", Am. J. Phys. 60(6), 491–499 (1992), Appendix B** ([doi:10.1119/1.16860](https://doi.org/10.1119/1.16860)).

- Assumed: 1 m massless rods, 1 kg point-mass bobs, standard gravity 9.80665 m/s², no friction. The pendulums never interact.
- Integration: 4th-order Runge–Kutta with a 1/600 s step in double precision. Separation times were re-checked with 1/1200 and 1/2400 s steps.
- Energy drift over every displayed trajectory and every step stays below 0.00001% of (m₁+m₂)g·l₁ + m₂g·l₂.
- Main run: upper rod 149.6°, lower rod −55.4°, both at rest. Neighbouring upper-rod angles differ by 10⁻⁹ rad; the whole set spans 9.99 × 10⁻⁷ rad, so the bobs start less than 1 micrometre apart.

## What is measured, what is display

Measured (and checked by `engine/test_presentation.js`):

- **RMS spread** on screen: the root-mean-square distance of the 1,000 bobs from their centre, in metres.
- **Separation:** the spread passes 2 cm at 9.4 s and 50 cm at 13.3 s. "Together through 60 s" (5° start) means the spread stayed below 1 mm at every integration step for 60 s; at 30° and 60° there is no visible separation within 60 s; at 100° it appears at 12.43 s.
- **Sound:** each note is one measured moment when the bob of one of 16 evenly spaced pendulums crosses the vertical line under the pivot (`engine/sound_events.js`). Notes that arrive together share one strike's loudness, so a stacked group sounds like one soft chord.

Display only (labelled or obvious):

- The opening fan spreads the starting angles out so you can see there are 1,000 pendulums; the simulation itself starts from the stacked state ("Starting angles spread out for display").
- The marimba timbre, the stereo placement (by colour) and the loudness are designed; the sound is synthesized, not recorded.
- The short glow on a bob when its note plays, line thickness, colours and trails.
- Slow-motion replay (0.25×) and comparisons (4×) are labelled on screen.

## Tests

```
node engine/test_sim.js            # physics: reproducibility, energy, convergence
node engine/test_presentation.js   # on-screen claims, scene timing, sound events, levels (needs step 1)
```

## Files

| File | Role |
|------|------|
| `engine/sim.js` | Double-pendulum physics (no graphics). |
| `engine/spread.js` | RMS spread measurement and units. |
| `engine/pick_seeds.js` | Chooses the main starting state; writes `seeds.json`. |
| `engine/measure_revision.js` | Runs all cases, measures thresholds, writes the geometry used for drawing. |
| `engine/measure_sound.js` | Measures centre-line crossings for the sound. |
| `engine/world.js` | Drawing (three.js). |
| `engine/sound.js` | Turns the measured crossings into the soundtrack. |
| `engine/director.js` | Scenes, timing, on-screen text. |
| `DoublePendulums.html` | Preview and MP4 export page. |
| `start.bat` | Windows launcher. |

Libraries (included in `vendor/`): [three.js r128](https://threejs.org) and [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer).
