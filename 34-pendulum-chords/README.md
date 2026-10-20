# 34 · Pendulum Chords

The 16 pendulums of a pendulum wave seen from above; each plays its note of a C major seventh chord (four octaves) at every swing, so the patterns become arpeggios and chords.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8806` in this folder and open <http://localhost:8806/PendulumChords.html>.

## The model

- `engine/pendulum.js`: Ideal small-angle pendulums: pendulum n makes 51 + n swings in 60 s (Harvard lecture-demo design), θ = A cos(2πt/T), L = g(T/2π)². Notes C, E, G, B over four octaves, longest lowest; one note at each right-hand turn.

## What is measured, what is display

Computed (checked by `engine/test_chords.js`): 51 + n swings in 60 s and lengths from T = 2π√(L/g); notes are chord tones C2–B5; group counts at 0, 15, 20, 30, 40, 45, 60, 75, 80 and 90 s; at 15 s each group is one note name, at 30 s the groups are {C, G} and {E, B}; at 45 s the arpeggio runs the other way.

Display only: the top view, the drifting traces, the keyboard strip. Sound: a marimba at the exact pitch of each note.

## Tests

```
node engine/test_chords.js
```

## Files

| File | Role |
|------|------|
| `engine/pendulum.js` | Ideal small-angle pendulums: pendulum n makes 51 + n swings in 60 s (Harvard lecture-demo design), θ = A cos(2πt/T), L = g(T/2π)². Notes C, E, G, B over four octaves, longest lowest; one note at each right-hand turn. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `PendulumChords.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
