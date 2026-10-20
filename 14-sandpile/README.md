# 14 · Sandpile

Each square holds up to 3 grains; a fourth makes it topple onto its neighbours. Pour every grain onto one square, slowly at first and then faster and faster, and the pile grows into a symmetric mandala nobody drew.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8793` in this folder and open <http://localhost:8793/Sandpile.html>.

## The model

The Abelian sandpile (P. Bak, C. Tang, K. Wiesenfeld, *Physical Review Letters* 59, 381, 1987) in `engine/sandpile.js`: a square holding 4 or more grains topples, giving one grain to each of its 4 neighbours; grains falling off the edge are lost.

- Long video: 65,536 grains poured onto the centre of a 221 × 221 grid over 83 s, starting at 6 grains a second and speeding up (n(t) = a(e^{bt} − 1)). 77,107,818 topplings; the pile ends 94 squares from the centre and never reaches the edge.
- Hook and Short 1: 32,768 grains on 161 × 161. Short 2: 2,000 grains on 49 × 49.
- The final pattern does not depend on the order of topplings ("Abelian"): pouring frame by frame ends exactly where pouring everything at once ends, and the finished mandala is symmetric under 90° turns and mirroring.

## What is measured, what is display

Computed (checked by `engine/test_sand.js`): every grain, toppling and count. Squares flash white in the frame they topple (fainter when most of the pile topples at once); the camera keeps the pile filling the screen. Sound is synthesized: a soft tick for each grain while grains are few, a marimba note for each frame with an avalanche (lower and louder for bigger ones), and a bell each time the number of grains doubles.

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
