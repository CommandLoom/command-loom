# 08 · Turing Patterns

Two chemicals, two rules, one dot. Spots grow, stretch and split by themselves until the screen is covered; change two numbers and the same rules grow stripes, a maze or rings.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate. The simulation runs live in the page, so exporting takes a few minutes.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8780` in this folder and open <http://localhost:8780/TuringPatterns.html>.

## The model

Gray–Scott reaction–diffusion (P. Gray & S. K. Scott 1984; patterns catalogued by J. E. Pearson, *Science* 261, 1993) in `engine/rd.js`, discretised as in Karl Sims' tutorial: dt = 1, D_U = 1, D_V = 0.5, 3×3 Laplacian, periodic edges.

- Grid 320 × 180 (Shorts 180 × 320), seeded with one small square of V in the centre.
- Feed / kill: spots 0.0367 / 0.0649, stripes 0.029 / 0.057, maze 0.0545 / 0.062, rings 0.039 / 0.058.
- End of each scene (measured): spots 165 pieces covering 20% of the screen; stripes 6 bands, 42%; maze 1 band, 52%; rings 4 pieces, 65%.
- Alan Turing proposed patterning by reacting and spreading chemicals in 1952; the first clear laboratory demonstration was the CIMA reaction (Castets et al., 1990).

## What is measured, what is display

Measured (checked by `engine/test_turing.js`): the spot counter (separate regions of V), how far each pattern has spread, and the labels (spots, stripes, maze, rings). Display only: colours and the number of simulation steps shown per frame (each pattern has its own speed). Sound is synthesized: a note each time the spot count goes up or the pattern reaches another half percent of the screen (at most eight a second), and a bell at the start of each pattern.

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
