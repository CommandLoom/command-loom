# 11 · Brachistochrone

Four frictionless beads slide from A to B on four tracks. The straight line is the shortest and comes last; the cycloid wins by dropping steeply first and even dipping below the finish. Flipped into a bowl, the same curve makes beads from any height arrive together.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8787` in this folder and open <http://localhost:8787/Brachistochrone.html>.

## The model

`engine/brach.js`: a bead starting at rest at depth 0 has speed v = √(2 g y) at depth y (energy conservation, no friction, g = 9.81 m/s²). Each track is cut into 4,000 short straight pieces; on a piece from depth y₁ to y₂ with length L the bead accelerates uniformly and takes 2L / (v₁ + v₂).

- A to B: 2 m across, 0.8 m down.
- Times: cycloid 0.818 s (matches the exact θ√(R/g)), circular arc 0.847 s, steep drop then slide 0.902 s, straight line 1.087 s (matches √(2L²/(g h))).
- The cycloid dips about 10 cm below B.
- Tautochrone: in a cycloid bowl with R = 0.5 m, beads released from three heights all reach the bottom after π√(R/g) = 0.709 s.
- History: Johann Bernoulli posed the problem in June 1696; Newton, Leibniz, Jakob Bernoulli and others solved it.

## What is measured, what is display

Computed (checked by `engine/test_brach.js`): every time, speed curve and result, the 10 cm dip, and the equal tautochrone times. Display only: the 12× (long video) and 15× (Shorts) slow motion, which is labelled on screen, and colours. Sound is synthesized: soft notes at the start, at the quarter marks and at each finish.

## Tests

```
node engine/test_brach.js
```

## Files

| File | Role |
|------|------|
| `engine/brach.js` | Tracks, timing from energy conservation, cycloid fit and tautochrone (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Brachistochrone.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
