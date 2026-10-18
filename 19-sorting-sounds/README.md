# 19 · Sorting Sounds

Four sorting algorithms get the same 120 shuffled bars and the same speed. Quicksort finishes in 4.9 s, merge sort in 6.3 s, insertion sort in 32.6 s and bubble sort in 45.7 s. Every comparison is counted.

This folder renders the whole video (1:38, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8791` in this folder and open <http://localhost:8791/SortingSounds.html>.

## The algorithms

`engine/sorts.js` records each algorithm as a list of steps (compare, swap, write), so any moment can be replayed exactly:

- Bubble sort (with an early exit when a pass makes no swap), insertion sort, top-down merge sort, and quicksort (Lomuto partition, last element as pivot).
- Same shuffle for all four (seeded). At 240 steps per second each: steps 10,972 / 7,822 / 1,509 / 1,168 for bubble / insertion / merge / quick.
- Comparisons for 120 items: 7,119 / 3,969 / 677 / 847. For 1,000 items (counted): 499,290 / 246,083 / 8,726 / 11,642.
- For 1,000,000 items the video shows estimates from the usual formulas (n²/2, n²/4, n log₂ n, 1.39 n log₂ n): about 500 billion vs 20 million comparisons, i.e. about 8 minutes vs 0.02 seconds at a billion comparisons per second.

Sorting with sound has a long tradition; Timo Bingmann's "The Sound of Sorting" is the best-known example.

## What is measured, what is display

Measured (checked by `engine/test_sorts.js`): every recorded run really sorts the bars; every counter and finishing time; the 1,000-item counts. The 1,000,000-item numbers are labelled as estimates. Sound is synthesized: when slow, one note per comparison with pitch following the bar's height; in the race, a soft tick every 150 steps and a short run of notes when an algorithm finishes.

## Tests

```
node engine/test_sorts.js
```

## Files

| File | Role |
|------|------|
| `engine/sorts.js` | The four algorithms as step lists, replay and counting (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `SortingSounds.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
