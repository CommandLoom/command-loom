# 09 · Predator Prey

A toy ocean with fish, sharks and four rules, shown full screen: blue schools of fish, orange packs of sharks. Nobody steers it, yet the populations fall into a rhythm, and the music is the populations themselves.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8783` in this folder and open <http://localhost:8783/PredatorPrey.html>.

## The model

Wa-Tor (A. K. Dewdney, "Computer Recreations", *Scientific American*, December 1984), in `engine/wator.js`:

- A 160 × 90 grid that wraps around at the edges (the Shorts use 90 × 160). Each step, every animal acts once, in a seeded random order.
- **Fish** move to a random free neighbouring cell; every 5 steps they leave a new fish behind.
- **Sharks** move to a random neighbouring fish and eat it (+3 energy), otherwise to a free cell. Each step costs 1 energy; at 0 they starve. Every 10 steps they leave a new shark behind and split their energy with it.
- Start: 30 % fish, 5 % sharks, seed 7. The long video shows 1,350 steps at 15 steps per second: neither species dies out (at least 602 fish and 4 sharks), the fish peak 10 times, and each shark peak follows a fish peak by 24 to 67 steps (43.8 on average).

Predator–prey cycles were first described mathematically by Alfred Lotka (1925) and Vito Volterra (1926). Real populations are more complicated than this toy model.

## What is measured, what is display

Measured (checked by `engine/test_pred.js`): every cell and counter, the peaks, and that neither species dies out. The captions ("the fish multiply", …) come from the slopes of the measured counts; the strip at the bottom is the population history. Sound is the populations: every 2 steps a marimba note whose pitch follows the fish count, every 6 steps a low bell whose pitch follows the shark count (C major pentatonic).

## Tests

```
node engine/test_pred.js
```

## Files

| File | Role |
|------|------|
| `engine/wator.js` | The Wa-Tor ocean (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `PredatorPrey.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
