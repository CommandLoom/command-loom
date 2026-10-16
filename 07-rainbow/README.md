# 07 · Rainbow

A rainbow is not an object in the sky. It is an angle. Follow one ray of sunlight through one raindrop, then hundreds of rays, and the 42° circle appears by itself: red at 42.4°, violet at 40.6°, and a fainter, reversed second bow near 51°.

This folder renders the whole video (1:30, 1920×1080, 30 fps, with sound) and its three Shorts in your browser, frame by frame.

## Run it

You need **Python 3** (a tiny local web server) and **Chrome or Edge** (WebCodecs video export). No data files to generate.

- **Windows:** double-click `start.bat`.
- **Any system:** run `python -m http.server 8778` in this folder and open <http://localhost:8778/Rainbow.html>.

Pick the long video or a Short, watch it, or press **Export selected MP4**.

## The model

Geometric optics of a spherical water drop (`engine/optics.js`):

- **Water:** refractive index at 20 °C from the measured dispersion of M. Daimon and A. Masumura, *Applied Optics* 46(18), 3811–3820 (2007) (Sellmeier fit). n = 1.3436 at 400 nm, 1.3347 at 550 nm, 1.3305 at 700 nm.
- **Rays:** traced as vectors, with Snell's law at entry and exit and mirror reflection inside, for one internal reflection (primary bow) or two (secondary bow).
- **Brightness:** each ray carries its unpolarized Fresnel transmission and reflection fractions. Rays are spread uniformly over the drop's cross-section, binned by exit angle and blurred by the Sun's 0.53° disc. That angular profile, for 16 wavelengths, builds the sky images.
- **Check:** the traced extreme angles equal the analytic minimum-deviation formula (cos i = √((n² − 1)/(k(k + 2)))) to within 0.01° for every wavelength tested.

## What is measured, what is display

Computed (checked by `engine/test_rainbow.js`): every angle on screen, the red-versus-violet ordering, the ray histogram and its 41.8° peak for green light, the colour brightness curves, the dimmer secondary bow and the dark band between the bows.

Display only: spectral colours are an approximate wavelength-to-RGB mapping; the sky uses a tone map and a saturation boost so the bands read on screen (angles are unchanged); rain streaks and the slow camera zoom are decoration. Geometric optics leaves out wave effects, so there are no supernumerary bands. Sound is synthesized: soft notes at each step, and one note for every eighth traced ray in the sweep, its pitch following the exit angle.

## Tests

```
node engine/test_rainbow.js
```

## Files

| File | Role |
|------|------|
| `engine/optics.js` | Water dispersion, ray tracing, Fresnel weights, angular profiles (no graphics). |
| `engine/video.js` | Scenes, timing, drawing and sound events for the long video and the Shorts. |
| `engine/sound.js` | Turns events into the soundtrack. |
| `engine/export.js`, `engine/player.js`, `engine/draw.js` | Frame-by-frame MP4 export, the page, shared text helpers. |
| `Rainbow.html` | Preview and export page. |
| `start.bat` | Windows launcher. |

Libraries (in `vendor/`): [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer) (three.js r128 is included for the shared page but not used here).
