# 17 · Camouflage

400 moths on a tree. Birds catch the ones that stand out; the survivors have young that look like them. When the bark turns dark the population turns dark, and when the bark pales again, so do the moths.

This folder renders the whole video (1:44, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8788` in this folder and open <http://localhost:8788/Camouflage.html>.

## The model

A toy model of natural selection, inspired by the peppered moth (`engine/evolve.js`):

- Each moth has a heritable shade c from 0 (pale) to 1 (dark). The bark shade changes over 140 generations: pale (0.2), darkening to 0.8, staying dark, then paling back to 0.2.
- Each generation, a moth is caught by birds with probability 5 % + 80 % × |c − bark|.
- Survivors are picked at random as parents to refill the population of 400; a child copies its parent's shade plus a random change (σ = 0.03). Seeded, so every run is identical.
- Measured in this run: 1 % dark at generation 19, 100 % at generation 74, 0 % at generation 139. On dark bark (generations 45–74) birds caught 35 % of the pale moths and 15 % of the dark ones.

This is a simplification, not real moth genetics. Real peppered moths in Britain shifted to the dark form during the Industrial Revolution and back after clean-air laws; a 2018 University of Exeter study confirmed that pale moths are better camouflaged from birds on lichen-covered bark. Similar classroom models exist, such as the NetLogo "Peppered Moths" model.

## What is measured, what is display

Measured (checked by `engine/test_camo.js`): every moth, catch, percentage and curve. Display only: the bark texture, moth shapes and colours, and the moths' positions on the tree. Sound is synthesized: one soft note per generation, lower for a darker population.

## Tests

```
node engine/test_camo.js
```

## Files

| File | Role |
|------|------|
| `engine/evolve.js` | The selection model (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Camouflage.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
