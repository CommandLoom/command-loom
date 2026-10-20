# 19 · Bounce Melody

A ball bouncing inside a ring; every bounce plays the next note of a public-domain melody, and the ball gets a little faster after each bounce, so the tune speeds up on its own. At the end each ring replays its fastest notes.

This folder renders the whole video (1:35, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8799` in this folder and open <http://localhost:8799/BounceMelody.html>.

## The model

`engine/ring.js`: the ball flies in straight lines and reflects off the ring (angle in = angle out), so every flight crosses the same angle of the ring: 137.5° (song 1), 144.3° (song 2), 100.7° (song 3).

- Game rule, not physics: after each bounce the ball is a fixed percentage faster, chosen so each song lasts its planned time: song 1 30.4 s (+2.28% per bounce, gaps from 0.75 s to 0.073 s), song 2 26.4 s (+2.38%), song 3 20.4 s (+2.83%).
- One note per bounce: 104, 62 and 35 notes. Melodies: Grieg (1875), Beethoven (1824 and 1810), all public domain.
- Close: each ring replays the last 2.4 seconds of its own song, one after the other.

## What is measured, what is display

Computed (checked by `engine/test_melody.js`): every bounce point, reflection and timing. Sound is synthesized: a marimba note per bounce at the melody's pitch; when the answer appears, a bell chord and the song's last three notes an octave up.

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
