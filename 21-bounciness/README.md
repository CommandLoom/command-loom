# 21 · Bounciness

The same ball, dropped the same way into the same 1 m ring, with bounciness 0%, 50%, 80%, 95%, 100%, 101% and 105%. Above 100% each bounce adds speed, which no real ball can do; the video labels it.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8802` in this folder and open <http://localhost:8802/Bounciness.html>.

## The model

- `engine/bounce.js`: A ball in a ring under gravity with a coefficient of restitution: exact parabolic flights, bounces found to machine precision; when a bounce would leave less than 5 cm/s the ball slides along the wall (frictionless pendulum, RK4) until the wall can no longer hold it.

## What is measured, what is display

Computed (checked by `engine/test_bounce.js`): each bounce scales the speed towards the wall by the bounciness and keeps the speed along it; energy constant in flight and while sliding; the ball never leaves the ring; energy only falls below 100%, stays at 100%, rises above; bounce counts per scene (1, 7, 22, 25, 30, 37, 68); 105% reaches 100 m/s at 9.5 s.

Display only: trail colours, line widths, the camera push. Sound: a marimba note per bounce, a soft bell when a sliding ball passes the bottom.

## Tests

```
node engine/test_bounce.js
```

## Files

| File | Role |
|------|------|
| `engine/bounce.js` | A ball in a ring under gravity with a coefficient of restitution: exact parabolic flights, bounces found to machine precision; when a bounce would leave less than 5 cm/s the ball slides along the wall (frictionless pendulum, RK4) until the wall can no longer hold it. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Bounciness.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
