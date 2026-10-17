# 11 · Ink Diffusion

A drop of dye in perfectly still water: 5,000 simulated molecules, each kicked around at random. They never stop moving, yet the drop spreads painfully slowly, and twice the distance takes four times as long.

This folder renders the whole video (1:38, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8782` in this folder and open <http://localhost:8782/InkDiffusion.html>.

## The model

Brownian motion as independent random walks (`engine/diffusion.js`):

- Each molecule takes Gaussian steps of standard deviation √(2 D Δt) along each axis, so the mean squared distance grows as ⟨r²⟩ = 4 D t in two dimensions (A. Einstein, 1905).
- D = 4.25 × 10⁻¹⁰ m²/s for fluorescein in water near room temperature. Published measurements range from about 4 to 7 × 10⁻¹⁰ m²/s depending on method; with the highest values every time quoted below shrinks by about 40 %.
- The drop: 5,000 molecules starting inside a 6 µm disc; 20 s of simulated time in steps of about 0.01 s; seeded, so every run is identical.
- Typical (root-mean-square) distance with this D: 41 µm after 1 s, 319 µm after 1 min, 2.5 mm after 1 h, 1.2 cm after 1 day, 3.2 cm after 1 week, 23 cm after 1 year; half a teacup (4 cm) takes about 11 days.

Real tea is never perfectly still: temperature differences make the water move, so dye spreads much faster than by diffusion alone.

## What is measured, what is display

Measured (checked by `engine/test_diffusion.js`): the dashed ring and the distance counter are the measured root-mean-square distance of the 5,000 molecules; the chart dots are the measured mean squared distance, which follows 4 D t within sampling noise; every number in the scale scene. Display only: the 2D view of a 3D process, the colour and glow of the dye. Sound is synthesized: one soft note each time the typical distance passes another 25 µm ring.

## Tests

```
node engine/test_diffusion.js
```

## Files

| File | Role |
|------|------|
| `engine/diffusion.js` | Random walkers and the diffusion formulas (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `InkDiffusion.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
