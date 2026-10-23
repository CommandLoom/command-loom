# 17 · Marble Round

Marbles roll down a gently tilted, winding track of coloured keys and play Frère Jacques. Each key is as long as the marble travels during its note; four marbles two bars apart make a round.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8798` in this folder and open <http://localhost:8798/MarbleRound.html>.

## The model

`engine/marbles.js`:

- Ideal rolling without slipping on a constant 0.5° slope: a = (5/7)·g·sin θ = 0.061 m/s², released at 1.5 m/s, so s(t) = v₀t + at²/2.
- Each note of the melody becomes a key from s(t_start) to s(t_end), so rolling over the keys plays the notes at the right times. Frère Jacques at 96 beats per minute gives a 42.2 m track; Row, Row, Row Your Boat (played twice) gives 45.3 m.
- Marbles released two bars apart follow the same motion, delayed, which makes a round.
- The track is drawn from above as lanes joined by half-circle turns, scaled to fit the screen.

## What is measured, what is display

Computed (checked by `engine/test_round.js`): every key position and note time; the rolling acceleration (also checked against a step-by-step integration); that each key lasts exactly its note; that entries are exactly two bars apart; the bar counts of both tunes. Display only: key colours (by note: C red … B violet), marble colours, the layout scale, the camera push. Sound is synthesized: one marimba note each time a marble rolls onto a key. Both tunes are traditional (public domain).

## Tests

```
node engine/test_round.js
```

## Files

| File | Role |
|------|------|
| `engine/marbles.js` | Rolling motion, key cutting, the tunes (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `MarbleRound.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
