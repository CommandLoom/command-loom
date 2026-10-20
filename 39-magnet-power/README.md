# 39 · Magnet Power

A magnet passes over 441 steel balls with power 10, 30, 100, 300, 1,000 and 3,000.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8811` in this folder and open <http://localhost:8811/MagnetPower.html>.

## The model

- `engine/magnet.js`: Simplified magnet: pull = P · m g · (1 cm / d)⁴ (constant inside 2.1 cm); a resting ball moves only when the pull beats static friction (0.3 g), a moving one feels rolling friction (0.05 g); balls do not magnetise each other.
- `engine/grains.js`: Hard-disc contacts between the balls.

## What is measured, what is display

Computed (checked by `engine/test_magnet.js`): more power moves more balls at every step (63 / 65 / 105 / 147 / 189 / 231); at the reach circle the pull equals static friction; balls more than 3 cm beyond the reach of the path never move; overlaps below 15% of a radius.

Display only: steel shading, the dashed reach circle, the slow motion (labelled). Sound: a metal click when a ball starts to move.

## Tests

```
node engine/test_magnet.js
```

## Files

| File | Role |
|------|------|
| `engine/magnet.js` | Simplified magnet: pull = P · m g · (1 cm / d)⁴ (constant inside 2.1 cm); a resting ball moves only when the pull beats static friction (0.3 g), a moving one feels rolling friction (0.05 g); balls do not magnetise each other. |
| `engine/grains.js` | Hard-disc contacts between the balls. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `MagnetPower.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
