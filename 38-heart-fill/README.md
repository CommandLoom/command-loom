# 38 · Heart Fill

A 30 cm heart filled with balls of four sizes until no more fit: 42, 190, 1,032 and 3,216.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
The simulation data is not stored in the repository; create it once with `node engine/precompute.js` (a few minutes, the same result every time).

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8810` in this folder and open <http://localhost:8810/HeartFill.html>.

## The model

- `engine/grains.js`: The simplified grain model (as in 35 Hourglass), extended so balls can be added one by one.
- `engine/heart.js`: The heart curve as 240 wall pieces, inside test and wall distance.
- `engine/precompute.js`: Adds balls at free spots in the heart's upper part until none is free for 2 s, lets them settle and writes data/heart_<N>.bin.

## What is measured, what is display

Computed (checked by `engine/test_heart.js`): every ball inside the heart in every frame; count and cover rise at every step (42 / 190 / 1,032 / 3,216; 65.0 / 75.4 / 81.0 / 83.7%); the count never changes after full; worst overlap 13% of a radius.

Display only: colours by arrival, the speed-ups (labelled). Sound: a glass note per new ball, a bell when full.

## Tests

```
node engine/test_heart.js
```

## Files

| File | Role |
|------|------|
| `engine/grains.js` | The simplified grain model (as in 35 Hourglass), extended so balls can be added one by one. |
| `engine/heart.js` | The heart curve as 240 wall pieces, inside test and wall distance. |
| `engine/precompute.js` | Adds balls at free spots in the heart's upper part until none is free for 2 s, lets them settle and writes data/heart_<N>.bin. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `HeartFill.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
