# 11 · Brachistochrone

Frictionless beads race from A to B. The straight line is the shortest and comes last; the cycloid wins every race. Twelve curves race at once and their times form a valley with the cycloid at the bottom; flipped into a bowl, the cycloid makes beads from any height arrive together.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8787` in this folder and open <http://localhost:8787/Brachistochrone.html>.

## The model

`engine/brach.js`: a bead starting at rest has speed v = √(2 g y) at depth y (energy conservation, no friction, g = 9.81 m/s²). Each track is cut into 4,000 short straight pieces; on a piece from depth y₁ to y₂ with length L the bead takes 2L / (v₁ + v₂).

- Race 1, B = (2 m, 1 m): cycloid 0.806 s, circular arc 0.830 s, steep drop then slide 0.892 s, straight line 1.010 s. Race 2 (2.4 m, 0.6 m): 0.938 / 0.979 / 1.050 / 1.442 s. Race 3 (1.4 m, 1.2 m): cycloid 0.678 s, arc 0.691 s, straight line 0.760 s, steep drop 0.766 s.
- Twelve curves: y = line + s × (cycloid − line) for s from 0 to 2.7 on an x grid packed near A. Times fall all the way to s = 1 and rise past it (1.010 → 0.806 → 0.908 s for B = (2, 1)).
- Tautochrone: in a cycloid bowl the motion along the arc is exactly simple harmonic, so every release height reaches the bottom after π√(R/g) = 0.709 s (R = 0.5 m). New beads join one full swing later, at rest, so the bowl goes from 3 to 6 to 12 beads.
- History: Johann Bernoulli posed the problem in June 1696; Newton, Leibniz, Jakob Bernoulli and others solved it.

## What is measured, what is display

Computed (checked by `engine/test_brach.js`): every time and position, the cycloid matching the exact θ√(R/g), the valley of the twelve curves, and the equal bowl times. Display only: the slow motion (5× to 16×, labelled on screen), colours and the painted trail behind each bead. Sound is synthesized: each bead ticks as it moves along its track (closer ticks near A where it is slow), a bell at every finish, and a chord each time the bowl's beads meet.

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
