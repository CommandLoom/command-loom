# 17 · Material Sounds

Five balls, dropped one after another onto the same steel spike, in six materials: glass shatters, crystal breaks into big pieces, wood splits, metal bounces, jelly sticks and slides off, water splashes. Every sound is one collision.

This folder renders the whole video (1:32, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8797` in this folder and open <http://localhost:8797/MaterialSounds.html>.

## The model

`engine/materials.js`: side-view simulation (centimetres, g = 981 cm/s², step 1/1200 s). Pieces are circles that collide with the spike's two sides, the tray floor and walls, and the table around the tray; pieces do not collide with each other.

- Five 6 cm balls released 1.1 s apart, 40 cm above the tray floor, at slightly different sideways offsets; every ball reaches the spike.
- Material model: bounciness, sliding friction, and for brittle materials the number and size of pieces (glass 170, crystal 34, wood two halves and 26 splinters, water 320 drops), with seeded burst speeds. Jelly sticks to the spike, wobbles, and slides off after 0.9 s.
- Collisions per 6-second run: glass 3,093, crystal 655, wood 328, metal 36, water 2,136.

## What is measured, what is display

Computed (checked by `engine/test_materials.js`): every path and collision; nothing passes through the floor or table. Display: three.js rendering, depth spread of the pieces, the 2.5× slow motion (labelled). Sound is synthesized: one sound per recorded collision (at most four per frame) in the material's voice, pitch from piece size; jelly's hits and wobbles.

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
