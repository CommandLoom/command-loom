# 17 · Material Sounds

The same ball dropped on the same spike in six materials: glass, crystal, wood, metal, jelly and water. Every sound is one collision from the simulation. Which one sounds best?

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8797` in this folder and open <http://localhost:8797/MaterialSounds.html>.

## The model

`engine/materials.js`:

- Side-view (2D) simulation in centimetres with g = 981 cm/s², time step 1/1200 s. A 6 cm ball is released with its centre 40 cm above the tray floor and falls onto a spike 10 cm tall (two straight sides) inside a tray with 9 cm walls.
- Pieces are circles that collide with the spike, floor and walls; there is no piece-to-piece contact. Each collision reflects the normal speed times the material's bounciness and reduces the sliding speed by its friction.
- Brittle materials break on first touching the spike into pieces with random sizes and burst speeds from a fixed seed: glass 170 pieces, crystal 34, wood two halves and 26 splinters, water 320 drops. Metal stays whole and bounces. Jelly is a simplified soft body: it sticks to the spike and wobbles.
- Every collision faster than 25 cm/s is recorded. The 3D view (three.js) places each piece at its simulated position, with a small fixed depth offset for depth.

## What is measured, what is display

Computed (checked by `engine/test_materials.js`): every piece's path; that all six balls touch the spike at the same moment (0.734 s); which materials break; that nothing in play leaves the tray; that the same seed gives the same run; the collision counts (glass 574, crystal 130, wood 62, metal 7, water 365). Display only: materials, lighting and camera; the depth offsets of pieces. Sound is synthesized: one note per recorded collision in the material's voice (glass, bell, wood, metal, plop; at most four per frame, pitch from piece size), plus jelly's wobbles; in slow motion the sound keeps its real pitch.

## Tests

```
node engine/test_materials.js
```

## Files

| File | Role |
|------|------|
| `engine/materials.js` | Drop, break and collision simulation (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `MaterialSounds.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer), [three.js r128](https://threejs.org) for the 3D scene.
