# 15 · Half Life

Nobody can say when one radioactive atom will decay. Yet with 10,000 atoms, every half-life almost exactly half of what is left is gone. Then the same rule as a clock: carbon-14 and the age of old bones.

This folder renders the whole video (1:44, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8786` in this folder and open <http://localhost:8786/HalfLife.html>.

## The model

`engine/decay.js`: every atom has the same constant chance per unit time to decay, independent of its age. Each atom's decay time is drawn once from the exponential distribution, t = −(T½ / ln 2) · ln U, with a seeded generator, so the run is identical every time.

- 10,000 atoms, half-life 8 s of video (6 half-lives in the grid scene).
- Measured: 10,000 → 4,952 → 2,512 → 1,300 → 630 → 315 → 161 after 0–6 half-lives (exact halving: 10,000 → 5,000 → 2,500 → 1,250 → 625 → 313 → 156).
- Carbon-14: half-life about 5,730 years (Godwin 1962: 5,730 ± 40; a 2019 review gives 5,700 ± 30). 25 % left ⇒ two half-lives ⇒ about 11,460 years. Real radiocarbon dates also need calibration curves.

## What is measured, what is display

Measured (checked by `engine/test_half.js`): every count, table entry and curve point; each half-life's count stays within three standard deviations of exact halving. Display only: the 8-second half-life (real ones range from fractions of a second to billions of years), colours and flashes. Sound is synthesized: one soft note for every 100 atoms that decay, so the notes slow down by half every half-life.

## Tests

```
node engine/test_half.js
```

## Files

| File | Role |
|------|------|
| `engine/decay.js` | Decay times, counts and the carbon-14 formula (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `HalfLife.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
