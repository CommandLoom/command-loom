# 04 · Galton Board

Every ball makes 16 choices: left or right, 50/50, independent of everything else. One ball can land anywhere. 10,000 balls build the same bell curve every time.

This folder renders the whole video (1:36, 1920×1080, 30 fps, with sound) and its three Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8775` in this folder and open <http://localhost:8775/GaltonBoard.html>.

Pick the long video or a Short, watch it, or press **Export selected MP4**.

## The model

An ideal Galton board (F. Galton, *Natural Inheritance*, 1889): 16 rows of pegs, and at every peg a ball goes right with probability p, independently. A ball's bin is its number of rights, so bins follow the binomial distribution P(k) = C(16, k) pᵏ (1 − p)¹⁶⁻ᵏ with mean 16p and variance 16p(1 − p) ([NIST/SEMATECH e-Handbook 1.3.6.6.18](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366i.htm)).

- Every ball has its own seeded random stream, so any ball's path can be recomputed exactly; the run is reproducible on any computer.
- Main run: 10,000 balls, p = 0.5. Measured mean bin 8.03, standard deviation 2.02 (prediction 8 and 2).
- Leaning run: 2,000 balls, p = 0.6. Measured mean bin 9.53 (prediction 9.6).
- Why the middle wins: 12,870 of the 65,536 possible left/right sequences end in the middle bin, one at each edge (Pascal's triangle).

## What is measured, what is display

Measured (checked by `engine/test_galton.js`): every ball count, histogram bar, mean and spread on screen; the binomial prediction (white marks) and its normal approximation (dashed line); the claim "The bell curve." only appears once all 10,000 balls have landed.

Display only: ball motion between pegs is animated (not a collision simulation), and the display rate is shown on screen. Sound is synthesized: a soft note at each peg for the single ball, then one note per landing (at most ten a second), pitch following the bin.

## Tests

```
node engine/test_galton.js
```

## Files

| File | Role |
|------|------|
| `engine/galton.js` | The probability model (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `GaltonBoard.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
