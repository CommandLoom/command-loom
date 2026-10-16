# 05 · Magnet Builds

Chrome balls, rods made of stacked magnets, and a magnetic wand. One piece at a time, six shapes snap together: cube, octahedron, Sierpinski pyramid, icosahedron, snail and dodecahedron.

This folder renders the whole video (2:42, 1920×1080, 30 fps, with sound) and three Shorts (icosahedron, snail, hanging octahedron) in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebGL + WebCodecs). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8776` in this folder and open <http://localhost:8776/MagnetBuilds.html>.

## What it is

A **choreographed 3D animation**, not a physics simulation. The build order, the wand and the cinematic camera are designed.

What is real:

- **Buildable geometry:** every rod has the same length, a whole number of 1/8-unit cylinder magnets, so a real set of rods and balls could build each shape. Edge lists are found by distance (all edges exactly one unit).
- **Build order:** bottom to top. Each new ball is first connected by one rod, then the rods that close its triangles are added (`buildPlan`).
- **Snap profile:** the last few millimetres of each snap follow d″ = −1 / (d + s)⁴, a dipole-like attraction, integrated once and reused.
- **Pieces:** ball and rod counts on screen are counted from the shape's own vertex and edge lists.
- **Sound:** one synthesized glass click per snap event of the animation. There are no recorded samples.

## Files

| File | Role |
|------|------|
| `engine/magnets.js` | Shapes, build plan, three.js studio scene, choreography, cinematic camera. |
| `engine/video.js` | Timelines (long video and Shorts), on-screen text, sound events. |
| `engine/sound.js`, `engine/export.js`, `engine/player.js`, `engine/draw.js` | Soundtrack, frame-by-frame MP4 export, the page, text helpers. |
| `MagnetBuilds.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [three.js r128](https://threejs.org) and [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer).
