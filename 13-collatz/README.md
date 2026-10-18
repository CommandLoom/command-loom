# 13 · Collatz

Pick any whole number. Even: halve it. Odd: triple it and add 1. Repeat. Every number anyone has tried ends at 1, and nobody can prove that every number must.

This folder renders the whole video (1:38, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8784` in this folder and open <http://localhost:8784/Collatz.html>.

## The maths

`engine/collatz.js` applies n → n/2 (even) or n → 3n + 1 (odd) with exact integer arithmetic until it reaches 1.

- 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1: 8 steps.
- 27 needs 111 steps and peaks at 9,232 (step 77).
- Below 10,000 the longest path belongs to 6,171: 261 steps.
- The problem is usually credited to Lothar Collatz (1937). As of 2025 every number below 2⁷¹ (about 2.4 × 10²¹) has been checked by computer (D. Barina and colleagues); there is still no proof.

The coral draws each number's path backwards from 1, turning +8.65° on an even value and −16° on an odd value. Those angles are a popular artistic choice, not part of the maths; the paths are exact.

## What is measured, what is display

Computed (checked by `engine/test_collatz.js`): every path, step count and peak on screen, and that every number from 1 to 10,000 reaches 1. Display only: the coral angles, colours and transparency. Sound is synthesized: soft notes for the steps, higher for larger values.

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
