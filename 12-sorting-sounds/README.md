# 12 · Sorting Sounds

Rainbow bars sorted step by step, and every step is heard: the pitch is the height of the bar being touched. Each algorithm gets a solo, then bubble, insertion, merge and quicksort race on the same 120 bars at the same speed.

This folder renders the whole video (1:38, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8791` in this folder and open <http://localhost:8791/SortingSounds.html>.

## The algorithms

`engine/sorts.js` records each algorithm as a list of steps (compare, swap, write), so any moment can be replayed exactly:

- Bubble sort (with an early exit when a pass makes no swap), insertion sort, top-down merge sort, and quicksort (Lomuto partition, last element as pivot).
- Solos: bubble sort on 40 bars, insertion sort on 60, merge sort and quicksort on 120, each at its own labelled speed.
- Race: the same 120 shuffled bars (seeded), 470 steps per second each. Steps 10,972 / 7,822 / 1,509 / 1,168 for bubble / insertion / merge / quick; they finish after 23.3 / 16.6 / 3.2 / 2.5 s. Comparisons: 7,119 / 3,969 / 677 / 847.

Sorting with sound has a long tradition; Timo Bingmann's "The Sound of Sorting" is the best-known example.

## What is measured, what is display

Measured (checked by `engine/test_sorts.js`): every recorded run really sorts the bars; every counter and finishing time. Display only: the rainbow colours and the finishing sweep. Sound is synthesized: each step plays the height of the bar it touches (up to 14 notes a second in a solo, 5 a second per algorithm in the race, each on its own side), and a rising sweep when a sort is done.

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
