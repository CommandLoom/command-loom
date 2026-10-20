# 10 · Collatz

Halve it if it's even, triple it and add 1 if it's odd. 27 climbs to 9,232 and needs 111 steps to reach 1; then the paths of every number up to 10,000 grow into a glowing coral, one path at a time and then faster and faster.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8784` in this folder and open <http://localhost:8784/Collatz.html>.

## The maths

`engine/collatz.js` computes every path exactly.

- 27 needs 111 steps and peaks at 9,232 (step 77). Below 10,000 the longest path belongs to 6,171: 261 steps.
- The coral: each number's path is traced backwards from 1, turning 8.65° one way on even values and 16° the other way on odd values; colour follows the number of steps. The last scene redraws 1 to 3,000 with four other pairs of angles. The angles are an artistic choice; the paths are exact.
- The camera starts close to the young coral and pulls back as it grows (it always fits the coral of the next second).
- Usually credited to Lothar Collatz (1937). Computers have checked every number below 2⁷¹ without an exception; there is still no proof.

## What is measured, what is display

Computed (checked by `engine/test_collatz.js`): every path, step count and peak, and that the coral is complete inside its scene. Display only: the turning angles, colours, glow and camera. Sound is synthesized: for 27 one note per step (higher for bigger values); for the coral a note for each new path, higher for longer paths (at most eight a second).

## Tests

```
node engine/test_collatz.js
```

## Files

| File | Role |
|------|------|
| `engine/collatz.js` | The Collatz map, paths and step table (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Collatz.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
