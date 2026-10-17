# 10 · Same Average

A fair coin: heads multiplies your money by 1.5, tails by 0.6. On average that is +5% per flip. 10,000 simulated players each play 40 rounds. The average gets more than four times richer; the typical player loses almost 90%.

This folder renders the whole video (1:42, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8781` in this folder and open <http://localhost:8781/SameAverage.html>.

## The model

The multiplicative coin game used by Ole Peters to explain ergodicity economics (O. Peters, "The ergodicity problem in economics", *Nature Physics* 15, 1216–1221, 2019), in `engine/coin.js`:

- Every player starts with $100 and flips their own fair coin each round: ×1.5 for heads, ×0.6 for tails. Coins are seeded, so any player's history can be recomputed.
- Expected change per round ×1.05; typical (time-average) change ×√(1.5 × 0.6) = ×0.949.
- After 40 rounds of this run: average $456, median $12.16, 20.8% of players above $100, richest 1% holding 54.3% of all the money.

The bars show how many players sit at each possible amount (after a rounds, a player with h heads has 100 · 1.5ʰ · 0.6ᵃ⁻ʰ dollars). Between rounds each bar splits into the players who flipped tails (moving down) and heads (moving up), using the actual flips.

A toy model of repeated multiplicative bets, not financial advice.

## What is measured, what is display

Measured (checked by `engine/test_sameavg.js`): every percentage, average, median and dollar amount on screen; the fairness of the coins (49.84% heads over 400,000 flips); and every claim in the captions. Display only: the log scale of the money axis and the smooth motion between rounds. Sound is synthesized: one soft note per round, higher when more players are above $100.

## Tests

```
node engine/test_sameavg.js
```

## Files

| File | Role |
|------|------|
| `engine/coin.js` | The coin game and its statistics (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `SameAverage.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
