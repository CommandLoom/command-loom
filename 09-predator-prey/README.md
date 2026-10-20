# 09 · Predator Prey

A toy ocean with fish, sharks and four rules. Nobody steers it, yet the populations fall into a rhythm: fish boom, sharks boom, fish crash, sharks starve, and round again.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8783` in this folder and open <http://localhost:8783/PredatorPrey.html>.

## The model

Wa-Tor (A. K. Dewdney, "Computer Recreations", *Scientific American*, December 1984), in `engine/wator.js`:

- A 160 × 90 grid that wraps around at the edges. Each step, every animal acts once, in a seeded random order.
- **Fish** move to a random free neighbouring cell; every 5 steps they leave a new fish behind.
- **Sharks** move to a random neighbouring fish and eat it (+3 energy), otherwise to a free cell. Each step costs 1 energy; at 0 they starve. Every 10 steps they leave a new shark behind and split their energy with it.
- Start: 30 % fish, 5 % sharks, seed 7. In the 900-step run neither species dies out; the fish peak 7 times and every shark peak follows a fish peak, 24 to 74 steps later (45.9 on average).

Predator–prey cycles were first described mathematically by Alfred Lotka (1925) and Vito Volterra (1926). Real populations are more complicated than this toy model.

## What is measured, what is display

Measured (checked by `engine/test_pred.js`): the counters, the peaks and the delay between fish and shark peaks, and that neither species dies out. The curves and the loop use 11-step moving averages, because shark numbers wobble with their 10-step breeding rhythm; the counters show raw numbers. The captions ("the fish multiply", …) come from the slopes of the measured counts. Sound is synthesized: one soft note at every measured peak, high for fish and low for sharks.

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
