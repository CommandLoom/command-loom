# 01 · Metronomes

100 metronomes start at random on one board. Nothing connects them except the board, which can roll a little. Within about a minute and a half of simulated time they all tick together.

This folder renders the whole video (4:15, 1920×1080, 30 fps, with metronome clicks) in your browser, frame by frame.

## Run it

You need **Chrome or Edge** (for WebCodecs video export) and **Python 3** (only for a tiny local web server).

- **Windows:** double-click `start.bat`. It starts a local server and opens the page.
- **Any system:** in this folder run `python -m http.server 8770`, then open <http://localhost:8770/Metronomes.html>.

On the page you can watch any scene live, or export the full video or a single scene as MP4. The export is frame by frame, so a slow computer just takes longer; the result is the same. You can switch to another window while it runs.

## The physics

The model is taken from **J. Pantaleone, "Synchronization of metronomes", Am. J. Phys. 70, 992 (2002)**, using his Eqs. 1, 5 and 6, generalized from 2 to N metronomes.

- Each metronome is a pendulum with an escapement (a van der Pol-style kick that keeps the swing at about 45°).
- All metronomes stand on one board on rollers. Every swing pushes the board slightly; the board's motion pushes every metronome back. That shared motion is the only coupling.
- Values are the ones measured in the paper: 104 oscillations per minute, amplitude ~45°, escapement μ = 0.010, coupling β = 0.011 for two metronomes on a 58 g board. For N metronomes the coupling is scaled by the total mass (94 g per metronome, 29 g of board per metronome).
- Metronomes are not identical: tempos are spread evenly over ±0.1% (two-metronome scenes) or ±0.3% (10 and 100 metronomes), in random order.
- Integration: 4th-order Runge-Kutta. Random starts use a seeded generator, so the same seed gives the same video on every computer.

The **fixed board** scene uses the same metronomes and the same start, with the board held still (coupling zero). They never sync.

## Honest "In sync."

"In sync." only appears once the sync is **permanent**: every single metronome is within 5° of the shared rhythm, at every simulation step from that moment to the end of the scene (checked well past it). `engine/pick_seeds.js` finds that moment for each scene by checking every step, and the scene lengths follow from it. No timing in the video is faked.

```
node engine/pick_seeds.js   # chooses seeds, writes engine/seeds.js and seeds.json (~20 s)
node engine/test_sim.js     # reproducibility and physics checks
```

`test_sim.js` checks that runs are reproducible, that 10 and 100 metronomes always reach full sync at ~208 ticks per minute, and that on a fixed board two metronomes never sync while on a free board they always do.

## Files

| File | Role |
|------|------|
| `engine/sim.js` | Metronome physics (no graphics). |
| `engine/world.js` | 3D stage and metronomes (three.js). |
| `engine/director.js` | Scenes, cameras, on-screen text, click sound, audio mix. |
| `engine/pick_seeds.js` | Finds seeds and permanent-sync times. |
| `engine/test_sim.js` | Tests. |
| `engine/seeds.js`, `seeds.json` | Seeds used in the video (generated). |
| `Metronomes.html` | Preview and MP4 export page. |
| `start.bat` | Windows launcher. |

Libraries loaded from CDNs: [three.js r128](https://threejs.org) and [mp4-muxer 5.1.3](https://github.com/Vanilagy/mp4-muxer).
