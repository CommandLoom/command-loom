# 16 · Ellipse String Art

2,048 balls leave one point of a billiard table in every direction. On an ellipse, started from one focus, every path off the wall to the other focus is the same length, so they all meet again. Off the focus, or on a stadium-shaped table, they never do.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8796` in this folder and open <http://localhost:8796/EllipseStringArt.html>.

## The model

`engine/billiard.js`:

- Balls move in straight lines at constant speed and reflect off the wall: angle in = angle out. No gravity, friction or ball-ball contact.
- Each wall hit is solved exactly: a quadratic equation for the circle and the ellipse, lines plus circle arcs for the stadium.
- Tables: circle radius 0.85; ellipse with semi-axes 1 and 0.8 (foci at ±0.6); stadium of two half-circles (radius 0.8) joined by straight sides (half-length 0.5).
- 2,048 balls, directions evenly spaced, speed 1.

## What is measured, what is display

Computed (checked by `engine/test_billiard.js`): every path and bounce; that all 2,048 balls from a focus meet at the other focus within a millionth for 12 meetings (worst 5.5e-8); that every focus-wall-focus path is 2a long; that balls started just beside the focus never meet; that every bounce point lies on the wall. Display only: colours (by starting direction), line widths, the faint string-art lines, the camera push. Sound is synthesized: a glass note per wall hit (at most four per frame, pitch from the position on the wall) and a bell at each meeting.

## Tests

```
node engine/test_billiard.js
```

## Files

| File | Role |
|------|------|
| `engine/billiard.js` | Tables, exact wall hits, reflections (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `EllipseStringArt.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
