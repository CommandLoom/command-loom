# 20 · Perfect Fit

A star, a gear, a heart and a plus sign dropped onto rows of blocks with a hole 2% bigger. Eight blocks per shape, one piece after another, each turned a little less or made a little smaller, until one drops in.

This folder renders the whole video (1:30, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8801` in this folder and open <http://localhost:8801/PerfectFit.html>.

## The model

`engine/fit.js`: a piece goes in only if its outline, turned and scaled as labelled, lies completely inside the hole's outline (the piece's own outline scaled to 102%): every corner inside and no edges crossing.

- Rows: star 30° → 0.3°, gear 15° → 0.2°, heart 115% → 101.9%, plus 10° → 0.3°. In every row only the last piece fits.
- Largest turn that still fits: star 0.457°, gear 0.309°, plus 0.373°. The heart fits at 101.9% and not at 102.2%.
- Drop: free fall from 25 cm (g = 9.81 m/s²), shown 4× slower; a piece that does not fit bounces on the block, keeping 35% of its speed each bounce. Pieces only fall straight down.

## What is measured, what is display

Computed (checked by `engine/test_fit.js`): every fit and every drop. Display: three.js rendering and the camera. Sound is synthesized: a click and a note at each release (one step higher along the row), a soft note as the piece passes two thirds and one third of the drop height, a wood knock and a marimba note for every impact (louder when faster), and bells when a piece drops in. The camera follows the falling piece, then pulls back to the whole row.

## Tests

```
node engine/test_fit.js
```

## Files

| File | Role |
|------|------|
| `engine/fit.js` | Outlines, exact fit test, drop and bounce motion (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `PerfectFit.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer), [three.js r128](https://threejs.org) for the 3D scene.
