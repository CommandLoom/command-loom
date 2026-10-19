# 29 · Perfect Fit

A star, a gear, a heart and a plus sign are dropped onto blocks with a hole of the same shape, 2% bigger. Exact geometry decides whether each one goes in; turned half a degree, none of them does.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8801` in this folder and open <http://localhost:8801/PerfectFit.html>.

## The model

`engine/fit.js`:

- Each hole is the piece's outline scaled to 102%. A piece fits only if its outline, turned and scaled as labelled, lies entirely inside the hole's outline: every corner inside (point-in-polygon test) and no edges crossing (segment intersection test).
- Largest turn that still fits (found by bisection): star 0.457°, gear 0.309°, plus 0.373°. The heart fits at 101.9% of its size and not at 102.1%.
- The drop is free fall from 25 cm with g = 9.81 m/s², shown 4× slower. A piece that does not fit lands on the block and bounces, keeping 35% of its speed each time; a piece that fits drops to the bottom of the hole.
- The pieces only fall straight down; they do not tip or slide.

## What is measured, what is display

Computed (checked by `engine/test_fit.js`): every fit / no-fit verdict on screen; the limit angles and size; the free-fall times and bounces. Display only: materials, wood texture, lighting and camera orbit (three.js). Sound is synthesized: a wood knock per impact (louder when faster) and a bell when a piece seats.

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
