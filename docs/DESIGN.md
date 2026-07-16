# Design system

## Thesis

The interface resembles a working computational research notebook interrupted by scientific fields. Warm coordinate paper, graphite and olive-black ink, oxide signal marks, editorial serif headings, and instrument-like mono labels replace generic portfolio gloss. It uses actual output from the documented work, not stock imagery.

## Typography

- Manrope: interface and body text
- Source Serif 4: readable editorial emphasis, reserved for short reflective accents
- IBM Plex Mono: labels, indexes, data, and provenance cues

These are loaded through `next/font` and self-hosted in the production build.
Display sizes use a calmer scale and moderate tracking so long scientific phrases remain legible. Serif text is an accent within the hierarchy, not a second competing headline system.

## Palette

- Ink: `#1b1e19`
- Secondary ink: `#30342c`
- Paper: `#ebe5d5`
- Secondary paper: `#ddd5bf`
- Oxide mark: `#a94630`
- Warm signal: `#df8458`
- Coral reference: `#c86645`

The warm signal color is used sparingly for state and research emphasis. A very faint 32-pixel coordinate grid gives light surfaces the material quality of technical paper. Structure still comes from typography, rules, and whitespace rather than boxed cards.

## Motion

- Hero copy enters in a staged sequence.
- The hero is a live Gray–Scott reaction–diffusion field rendered in Canvas. It records compact chemical-state snapshots and plays them forward and backward.
- The publication feature reuses the bounded simulation engine with a deep mineral-green, oxidized copper, and amber false-color palette; it runs only while its visual panel is in view.
- Its forward timeline is deliberately longer than the hero: 280 recorded states at six PDE steps per state, after a 120-step warm-up, so the Gray–Scott field reaches a visibly mature endpoint before reversing. The endpoint holds for 18 display frames, then playback traverses three stored states per frame to keep the full rewind leg concise.
- Publication pointer perturbations use the exact hero interaction mechanism: the same radius scale, minimum radius, full injection strength, pointer queue, four-step local evolution, and fade. Only the autonomous field parameters, timeline, seed arrangement, and visual palette remain distinct.
- Pointer perturbations run as independent continuous Gray–Scott fields for both visuals. Each interaction begins from the currently displayed autonomous frame, evolves smoothly while the pointer moves, then crossfades back to the ongoing base animation. Pointer states are never written into snapshot history, so rewind and forward playback contain only the autonomous PDE animation.
- Both fields are capped at 30 FPS, pause outside the viewport, and keep bounded 8-bit chemical-state histories instead of full pixel-frame buffers.
- WebGL2 shades those compact states at the canvas's real device-pixel resolution, with adaptive simulation grids, DPR and pixel-budget caps, retained compositing, and a high-quality Canvas 2D fallback.
- A lost WebGL context triggers an immediate visible-canvas replacement and simulation restart on Canvas 2D, preventing a GPU reset from leaving either section blank.
- Sections reveal once when entering the viewport.
- Archive rows use a single directional transition.
- Reduced-motion users receive the complete layout without animation.

## Accessibility

- A skip link bypasses navigation.
- Visible focus behavior inherits high-contrast controls.
- Inputs have programmatic labels and bounded validation.
- Semantic headings preserve page structure.
- Decorative images use empty alternative text; research figures have descriptive text.
- Mobile navigation exposes its expanded state.

## Scroll instrument

- Precise-pointer desktop screens replace the browser rail with a continuous wave-propagation trace: long, high-amplitude waves transition through a medium regime into short, low-amplitude waves.
- An oxide and warm-signal probe marks live document progress. The entire trace can be clicked or dragged, and the focused control supports arrow, page, Home, and End keys.
- The waveform geometry never deforms. It carries a 192-cell one-dimensional finite-difference time-domain wave field with a Courant number near 0.69, damping, and absorbing edge layers.
- Scrolling injects a localized Gaussian displacement and velocity source at the oxide probe. The numerical field propagates away in both directions through superposition; positive and negative phases appear as warm-signal and oxide energy traveling along the fixed curve.
- The solver advances only while measurable energy remains and is disabled for reduced-motion users.
- Touch devices and narrow layouts retain the compact themed native scrollbar as a reliable platform fallback.
