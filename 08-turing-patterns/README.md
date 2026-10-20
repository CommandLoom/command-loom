# 08 · Turing Patterns

Two chemicals, two simple rules and a small square in the middle of a dish. The spots grow, stretch and split by themselves until the dish is covered; change only the feed and kill rates and the same rules make stripes, a labyrinth or holes.

This folder renders the whole video (1:44, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate. The simulation runs live in the page, so exporting takes a few minutes.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8780` in this folder and open <http://localhost:8780/TuringPatterns.html>.

## The model

The Gray–Scott reaction–diffusion model (`engine/rd.js`): P. Gray and S. K. Scott (1984); pattern catalogue by J. E. Pearson, *Science* 261, 189–192 (1993).

- Chemical U is fed in at rate F; V is removed at rate F + k; the reaction U + 2V → 3V converts U into V.
- Both diffuse, U twice as fast as V (D_U = 1, D_V = 0.5), on a square grid with periodic edges; time step 1; 3×3 Laplacian (centre −1, sides 0.2, corners 0.05), as in Karl Sims' reaction–diffusion tutorial.
- Start: U = 1 everywhere, plus a small square with U ≈ 0.5 and V ≈ 0.25 (seeded noise, so every run is identical).

| Panel | Feed F | Kill k | Measured after the panel scene |
|------|------|------|------|
| spots that split | 0.0367 | 0.0649 | 48 separate spots, 20 % covered |
| stripes | 0.029 | 0.057 | 3 bands, 42 % covered |
| labyrinth | 0.0545 | 0.062 | 1 connected maze, 53 % covered |
| holes | 0.039 | 0.058 | 1 sheet with holes, 72 % covered |

Alan Turing proposed the idea in "The Chemical Basis of Morphogenesis" (1952). The first clear laboratory Turing pattern was found in the CIMA reaction (V. Castets, E. Dulos, J. Boissonade, P. De Kepper, *Phys. Rev. Lett.* 64, 2953, 1990). The video shows the mathematical model, not a specific real chemical system or animal.

## What is measured, what is display

Measured (checked by `engine/test_turing.js`): every pattern label matches what the simulation produces (spot counts and coverage), and the spot counter in the growing dish really rises as spots split. Display only: the colour map and the image smoothing when the grid is enlarged. Sound is synthesized: one soft note each time the spot count rises (at most eight a second).

## Tests

```
node engine/test_turing.js
```

(about a minute: it runs the four panels to the end).

## Files

| File | Role |
|------|------|
| `engine/rd.js` | The Gray–Scott simulation and the spot counter (no graphics). |
| `engine/video.js` | Scenes, timing, colour map and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `TuringPatterns.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
