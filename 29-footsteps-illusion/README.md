# 29 · Footsteps Illusion

A yellow block and a dark blue block slide over black and white stripes and seem to take turns stepping, though both move at one constant speed the whole time. Then the stripes are taken away, the reason is shown, stripe widths are compared, and six blocks race to a tie. The footsteps illusion was first shown by Stuart Anstis (2003).

This folder renders the whole video (1:40, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export).
No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8813` in this folder and open <http://localhost:8813/FootstepsIllusion.html>.

## The model

- `engine/steps.js`: A lane of black and white stripes (period P) and a block of length w (a whole number of periods) moving at constant speed v. Both edges of the block always sit on the same colour. A light block has strong edge contrast on black, a dark block on white; a "step" is the moment a block's edges move onto the stripes of strong contrast. Steps per second = v / P.

## What is measured, what is display

Computed (checked by `engine/test_steps.js`): every block moves at constant speed, frame by frame; both edges of each block always lie on the same colour; the yellow and the dark blue block step in turns; steps per second equal v / P (4, 2 and 1 per second on 16, 32 and 64 px stripes); in the race all six fronts reach the finish line in the same frame.

Display only: colours, the edge marks and labels, the ruler of half-second positions. Sound: a marimba note for every step (light blocks higher, dark blocks lower), even glass ticks while the stripes are gone.

## Tests

```
node engine/test_steps.js
```

## Files

| File | Role |
|------|------|
| `engine/steps.js` | Stripes, constant-speed blocks, edge contrast and the moments of each step. |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
