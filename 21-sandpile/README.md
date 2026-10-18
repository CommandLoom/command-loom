# 21 · Sandpile

Each square holds up to 3 grains. A fourth makes it topple: one grain to each neighbour, which may topple in turn. Drop grains one at a time and you get avalanches of every size; pour them all on one square and a pattern grows that nobody drew.

This folder renders the whole video (1:36, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8793` in this folder and open <http://localhost:8793/Sandpile.html>.

## The model

`engine/sandpile.js` is the Abelian sandpile of P. Bak, C. Tang and K. Wiesenfeld (Physical Review Letters 59, 381, 1987):

- A square with 4 or more grains topples: it loses 4 and each of its 4 neighbours gains 1. Grains pushed off the edge are lost. Every toppling counts as 1 toward the avalanche size.
- The final stable state does not depend on the order of topplings, so the centre run can place all grains at once and relax.
- **Random run:** 100 × 100 grid, random starting heights 0–3, 30,000 grains dropped on random squares (seed 21). Measured: 17,586 drops cause no toppling; of the avalanches, the median is 20 topplings, the 99th percentile 10,901, the largest 47,065.
- **Centre run:** 32,768 grains on the middle square of a 151 × 151 grid; no grain reaches the edge.

## What is measured, what is display

Computed (checked by `engine/test_sand.js`): every grid state, every avalanche size, the caption numbers, the histogram. Display only: colours, the white flash on the latest avalanche, camera push. Sound is synthesized marimba: in the random run, a note for the biggest avalanche in each tenth of a second (lower and louder when bigger); in the centre run, a chord each time the grain count doubles.

## Tests

```
node engine/test_sand.js
```

## Files

| File | Role |
|------|------|
| `engine/sandpile.js` | The sandpile rules, random run and centre run (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Sandpile.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
