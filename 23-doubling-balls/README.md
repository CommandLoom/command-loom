# 23 · Doubling Balls

One ball in a circle, a square and a triangle; every bounce makes a copy of the ball until there are 4,096. Real gravity, no energy lost; shown 5× slower, then all three in real time.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8804` in this folder and open <http://localhost:8804/DoublingBalls.html>.

## The model

- `engine/doubling.js`: Event-driven simulation of balls on exact parabolas (polygon hits by quadratic roots, circle hits by stepping plus bisection with a check for grazing passes). Game rule: at each wall hit a copy appears at the same point, leaving at the bounce direction turned by 20°, until 4,096. Balls pass through each other.

## What is measured, what is display

Computed (checked by `engine/test_doubling.js`): every new ball appears at a bounce at the parent's position, exactly 4,096 in the end; every ball keeps its energy within 1e-9; angle in = angle out; all balls stay inside; 4,096 reached at 4.40 s (circle), 4.78 s (square), 4.28 s (triangle).

Display only: ball colours, tail length, the 5× slow motion (labelled). Sound: a marimba note per bounce (max 3 per frame), a bell at 4,096.

## Tests

```
node engine/test_doubling.js
```

## Files

| File | Role |
|------|------|
| `engine/doubling.js` | Event-driven simulation of balls on exact parabolas (polygon hits by quadratic roots, circle hits by stepping plus bisection with a check for grazing passes). Game rule: at each wall hit a copy appears at the same point, leaving at the bounce direction turned by 20°, until 4,096. Balls pass through each other. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `DoublingBalls.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
