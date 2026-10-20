# 26 · Hourglass

The same hourglass (16 mm neck) filled with about the same amount of 1, 10, 100, 1,000 and 3,000 balls. The big ones jam, the small ones pour through.

This folder renders the whole video (1:36, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
The simulation data is not stored in the repository; create it once with `node engine/precompute.js` (a few minutes, the same result every time).

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8807` in this folder and open <http://localhost:8807/Hourglass.html>.

## The model

- `engine/grains.js`: A simplified grain model: hard discs that cannot overlap (position-based method, 80 small steps per frame, 3 passes), gravity, simplified friction, no spinning.
- `engine/hourglass.js`: The glass, the 55% fill rule and the placement of the balls on a closed gate.
- `engine/precompute.js`: Runs the five simulations once and writes data/hourglass_<N>.bin; the page plays them back.

## What is measured, what is display

Computed (checked by `engine/test_hourglass.js`): the balls cover 51–56% of the top bulb; every ball inside the glass in every frame; worst overlap 24% of a radius; 1, 10 and 100 balls: none through; 1,000: all through at 5.9 s; 3,000: at 3.7 s; deterministic (rerun check).

Display only: ball colours from starting height, the 2×/4×/7.5× slow motion (labelled). Sound: a wooden tick each time a ball passes the neck.

## Tests

```
node engine/test_hourglass.js
```

## Files

| File | Role |
|------|------|
| `engine/grains.js` | A simplified grain model: hard discs that cannot overlap (position-based method, 80 small steps per frame, 3 passes), gravity, simplified friction, no spinning. |
| `engine/hourglass.js` | The glass, the 55% fill rule and the placement of the balls on a closed gate. |
| `engine/precompute.js` | Runs the five simulations once and writes data/hourglass_<N>.bin; the page plays them back. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Hourglass.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
