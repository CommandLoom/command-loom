# 25 · Pixel Sort

5,000 coloured pixels (50 rows × 100), every row in its own random order, sorted into a rainbow by bubble sort, insertion sort, selection sort, merge sort, quicksort and heapsort, then all six racing at the same speed.

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8805` in this folder and open <http://localhost:8805/PixelSort.html>.

## The model

- `engine/sorts.js`: The six algorithms, each recording every comparison and every write in order, so a row can be shown exactly as it was after any number of operations.

## What is measured, what is display

Computed (checked by `engine/test_sorts.js`): every algorithm sorts every row and replaying the writes gives the same result; swap-based sorts never lose a colour; rows are shuffled, different, reproducible; operation counts (most in one row: bubble 10,580 … merge 1,229) and race times at 661 operations per second per row (merge 1.9 s … bubble 16.0 s).

Display only: the hue colour map, the single-algorithm scenes are sped up to fit 11.5 s (labelled). Sound: a glass note for writes in the middle row, a bell when a sort finishes.

## Tests

```
node engine/test_sorts.js
```

## Files

| File | Role |
|------|------|
| `engine/sorts.js` | The six algorithms, each recording every comparison and every write in order, so a row can be shown exactly as it was after any number of operations. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `PixelSort.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
