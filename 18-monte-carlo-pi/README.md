# 18 · Monte Carlo Pi

Throw darts at random at a square with a circle inside it. Four times the share that lands inside the circle approaches π, but slowly: 100,000 darts get three digits right. Then Buffon's needles (1777) do the same with a striped floor.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8789` in this folder and open <http://localhost:8789/MonteCarloPi.html>.

## The maths

`engine/mc.js`, with seeded pseudo-random numbers so every run is identical:

- **Darts:** points uniform in the square [−1, 1]². The unit circle covers π/4 of the square, so π ≈ 4 × inside ÷ all. This run: 100 → 3.20, 1,000 → 3.132, 10,000 → 3.1632, 100,000 → 3.14248.
- **Error:** the typical error shrinks like 1.64/√N, so 100× more darts buys about one more digit.
- **Buffon's needles** (G.-L. Leclerc, Comte de Buffon, 1777): needles of length L on lines spaced L apart cross a line with probability 2/π, so π ≈ 2 × needles ÷ crossings. 5,000 needles give 3.167.

## What is measured, what is display

Computed (checked by `engine/test_pi.js`): every estimate, counter and error-chart point, recounted independently in the tests; the 100,000-dart estimate has three correct digits; the needle estimate is within three standard deviations of π. Display only: colours and the speed at which throws are shown. Sound is synthesized: one soft note per dart or needle while they are slow enough to hear (at most eight a second).

## Tests

```
node engine/test_pi.js
```

## Files

| File | Role |
|------|------|
| `engine/mc.js` | Darts, needles and digit counting (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `MonteCarloPi.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
