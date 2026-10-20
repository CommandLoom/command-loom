# 15 · Chemical Spirals

Drops fall on a dish of excitable chemistry: rings of reaction spread and wipe each other out where they meet. Break one ring and its ends curl into two spirals; break many waves and the dish fills with spirals. White dots listen, and play a note whenever a wave reaches them.

This folder renders the whole video (1:38, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate. The page computes every simulation when it opens (about half a minute).

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8794` in this folder and open <http://localhost:8794/ChemicalSpirals.html>.

## The model

The Barkley model of an excitable medium (D. Barkley, *Physica D* 49, 61, 1991) in `engine/bz.js`, the kind of waves the Belousov–Zhabotinsky reaction makes. Grid 320 × 180 (Shorts 180 × 252).

- Rain of drops: a ring at the centre, then a trigger every 40 frames at a seeded random spot (16 in all); a drop on still-recovering medium does nothing.
- Two separate measured runs check the basic facts: a single ring leaves the dish quiet after it reaches the walls, and two rings that meet vanish (the excited share falls to 0% and stays there).
- Breaking a ring (wiping its lower half) leaves two free ends that curl into mirror-image spirals, each turning once every 44–45 frames.

## What is measured, what is display

Computed (checked by `engine/test_bz.js`): every frame of the medium, the active share, the spiral turns and the listening-point hits. Display only: colours (resting orange-red, excited blue, recovering slate) and the time-lapse speed. Sound: the white dots are a 12 × 7 grid of listening points (7 × 10 in the Shorts); each plays a note when a wave front reaches it, higher near the top, at most two notes per 1/16 s.

## Tests

```
node engine/test_bz.js
```

## Files

| File | Role |
|------|------|
| `engine/bz.js` | The Barkley model (no graphics). |
| `engine/video.js` | Scenes, simulations, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `ChemicalSpirals.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
