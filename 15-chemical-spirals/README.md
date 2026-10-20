# 15 · Chemical Spirals

Trigger one spot of an excitable chemical medium and a ring of reaction spreads out. Two rings that meet both vanish. Break a ring and each free end curls into a spiral that keeps turning: the patterns the Belousov–Zhabotinsky (BZ) reaction is famous for.

This folder renders the whole video (1:38, 1920×1080, 30 fps, with sound) and its two Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate. The page computes every simulation when it opens (about half a minute).

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8794` in this folder and open <http://localhost:8794/ChemicalSpirals.html>.

## The model

`engine/bz.js` is the Barkley model of an excitable medium (D. Barkley, Physica D 49, 61–70, 1991):

- du/dt = (1/ε) u (1 − u) (u − (v + b)/a) + ∇²u and dv/dt = u − v, with a = 0.75, b = 0.02, ε = 0.02.
- u is the fast "excitation" chemical, v the slow "recovery" chemical; while v is high the medium cannot react again, which is why waves never turn back and why colliding waves annihilate.
- Grid 320 × 180 (long video) or 180 × 252 (Shorts), spacing 0.5, time step 0.02, Barkley's semi-implicit reaction step, no-flux edges. Deterministic.
- It is a simplified stand-in for BZ chemistry, not the full reaction scheme, and the playback is not real time.

## What is measured, what is display

Computed (checked by `engine/test_bz.js`): every frame of every scene; the excited share of the dish; the turns of each spiral, counted where waves cross a fixed listening point (one turn every 44–45 frames, 1.5 s on screen); that the two spirals are mirror images. Display only: the colour map (orange-red ready, blue reacting, slate recovering, after the ferroin-indicator dish), the white flash showing where the wave is wiped, the camera push. Sound is synthesized: a glass note each time a wave passes a listening point.

Real BZ spirals: A. N. Zaikin & A. M. Zhabotinsky, Nature 225, 535 (1970); A. T. Winfree, Science 175, 634 (1972).

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
