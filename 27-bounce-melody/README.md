# 27 · Bounce Melody

A ball bounces inside a ring and every bounce plays the next note of a public-domain melody. The ball gets a little faster after each bounce, so the tune speeds up on its own while the path draws a star. Guess the song before the answer appears.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8799` in this folder and open <http://localhost:8799/BounceMelody.html>.

## The model

`engine/ring.js`:

- The ball moves in straight lines and reflects off the ring (angle in = angle out), so every flight crosses the same angle of the ring: 137.5° (song 1), 144.3° (song 2), 100.7° (song 3).
- Game rule, not physics: after each bounce the ball is a fixed percentage faster, chosen so each song lasts its planned time (2.6%, 2.8% and 3.8% per bounce in the long video).
- One note per bounce: In the Hall of the Mountain King (Grieg, 1875; 104 notes), Ode to Joy (Beethoven, 1824; 62 notes), Für Elise (Beethoven, 1810; 35 notes).

## What is measured, what is display

Computed (checked by `engine/test_melody.js`): every bounce position and time; one bounce per note; equal angles in and out at every bounce; each gap shorter than the one before; the song lengths. Display only: colours, ripples, line widths, the camera push. Sound is synthesized: a marimba note per bounce at the melody's pitch and a soft bell when the answer appears.

## Tests

```
node engine/test_melody.js
```

## Files

| File | Role |
|------|------|
| `engine/ring.js` | Bounce geometry, speed-up rule, the melodies (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `BounceMelody.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
