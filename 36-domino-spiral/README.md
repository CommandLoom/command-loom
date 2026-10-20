# 36 · Domino Spiral

10, 100, 1,000 and 10,000 dominoes seen from above, on a line and on rainbow spirals, then 450 in a heart that winds inwards.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8808` in this folder and open <http://localhost:8808/DominoSpiral.html>.

## The model

- `engine/domino.js`: Each domino is a rigid block tipping over its front edge (RK4). Simplified hand-over (model choice): the next domino starts with 90% of the spin at the touch; the falling one rests leaning on it.

## What is measured, what is display

Computed (checked by `engine/test_domino.js`): energy of a falling block conserved within 0.01% until the touch; each domino starts exactly when the previous one touches it; no domino passes its resting angle; wave speed 0.93 m/s; layout times (10: 0.6 s, 100: 4.1 s, 1,000: 38.8 s, 10,000: 386 s, heart: 17.6 s).

Display only: colours, the footprint drawing, the speed-ups and slow-downs (labelled). Sound: a wooden tick per domino hit.

## Tests

```
node engine/test_domino.js
```

## Files

| File | Role |
|------|------|
| `engine/domino.js` | Each domino is a rigid block tipping over its front edge (RK4). Simplified hand-over (model choice): the next domino starts with 90% of the spin at the touch; the falling one rests leaning on it. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `DominoSpiral.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
