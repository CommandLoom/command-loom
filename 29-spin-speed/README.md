# 29 · Spin Speed

80 balls in a spherical bowl spun at 50 to 120 RPM, then one slow spin-up from 0 to 125 RPM: below the critical speed of 94.6 RPM they stay at the bottom, above it they form a ring.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8812` in this folder and open <http://localhost:8812/SpinSpeed.html>.

## The model

- `engine/bowl.js`: Top view, small-slope forces: the bowl's slope pulls towards the centre with g·tanθ; friction drags each ball towards the bowl's surface velocity (model choice). Ring radius ρ* = √(R² − (g/ω²)²) above ω_c = √(g/R).
- `engine/grains.js`: Hard-disc contacts and the rim wall.

## What is measured, what is display

Computed (checked by `engine/test_spin.js`): critical speed 94.6 RPM and the ring formula; below critical the heap stays the same, above it the mean radius approaches the prediction (110 RPM: 6.5 vs 6.7 cm; 120 RPM: 7.5 vs 7.8 cm); balls inside the rim; in the spin-up they leave the centre at 111 RPM.

Display only: the bowl shading and turning spokes, ball colours, the dashed predicted ring. Sound: a glass tick when a ball touches the rim, a marimba note per turn of the bowl.

## Tests

```
node engine/test_spin.js
```

## Files

| File | Role |
|------|------|
| `engine/bowl.js` | Top view, small-slope forces: the bowl's slope pulls towards the centre with g·tanθ; friction drags each ball towards the bowl's surface velocity (model choice). Ring radius ρ* = √(R² − (g/ω²)²) above ω_c = √(g/R). |
| `engine/grains.js` | Hard-disc contacts and the rim wall. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `SpinSpeed.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
