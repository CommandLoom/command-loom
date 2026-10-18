# 23 · Three Body

Three equal stars chase each other on one figure-eight. Push them 3% faster and the dance wobbles but holds. Then Burrau's masses 3, 4 and 5, run twice from almost the same start: one copy throws a star out, the other does not.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8795` in this folder and open <http://localhost:8795/ThreeBody.html>.

## The physics

`engine/threebody.js`:

- Newtonian gravity for three point masses in a plane, G = 1, no softening.
- Adaptive Dormand–Prince 5(4) integration with relative tolerance 1e-12, so close passes (down to 0.0004 apart here) are resolved. Energy drift stays below 1e-8 in every run.
- Figure-eight: equal masses, starting values from C. Simó's computation (period 6.32591398). Found numerically by C. Moore (1993), proved by A. Chenciner & R. Montgomery (2000).
- Nudge: all velocities of the figure-eight multiplied by 1.03.
- Burrau's problem (1913): masses 3, 4, 5 at rest at (1, 3), (−2, −1), (1, −1). The copy moves the mass-3 star by +0.001 in x.

Measured: after 10 laps the figure-eight is back to its start within 0.0000007; the nudged eight stays within 1.35 of the centre for 20 laps; the two 3-4-5 copies separate by more than 0.1 at t = 33.7; the original ejects its mass-3 star (beyond 8 from the centre at t ≈ 62.8) while masses 4 and 5 leave as a pair; the copy keeps all three within 5 of the centre up to t = 100.

## What is measured, what is display

Computed (checked by `engine/test_threebody.js`): every position, every caption number. Display only: colours, star sizes (∝ cube root of mass), trail lengths, the zoom-out after the ejection, edge markers for stars off screen. Sound is synthesized: a bell each time a figure-eight star crosses the centre line, and at each close pass in the 3-4-5 problem.

## Tests

```
node engine/test_threebody.js
```

## Files

| File | Role |
|------|------|
| `engine/threebody.js` | Gravity, the integrator and the starting values (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `ThreeBody.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
