# Design system

## Thesis

The interface resembles a precise research notebook interrupted by vivid scientific fields. It uses actual output from the documented work, not stock imagery.

## Typography

- Manrope: interface and body text
- Source Serif 4: readable editorial emphasis, reserved for short reflective accents
- IBM Plex Mono: labels, indexes, data, and provenance cues

These are loaded through `next/font` and self-hosted in the production build.
Display sizes use a calmer scale and moderate tracking so long scientific phrases remain legible. Serif text is an accent within the hierarchy, not a second competing headline system.

## Palette

- Ink: `#11110f`
- Paper: `#f1efe6`
- Secondary paper: `#e7e4d9`
- Acid highlight: `#c7ff3f`
- Coral reference: `#ff6b4a`

The acid color is used sparingly for state and research emphasis. Structure comes from typography, rules, and whitespace rather than boxed cards.

## Motion

- Hero copy enters in a staged sequence.
- The hero is a live Gray–Scott reaction–diffusion field rendered in Canvas. It records compact chemical-state snapshots and plays them forward and backward.
- The publication feature reuses the bounded simulation engine with a black, violet, and coral concentration palette; it runs only while its visual panel is in view.
- Its forward timeline is deliberately longer than the hero: 280 recorded states at six PDE steps per state, after a 120-step warm-up, so the Gray–Scott field reaches a visibly mature endpoint before reversing. The endpoint holds for 18 display frames, then playback traverses three stored states per frame to keep the full rewind leg concise.
- Publication pointer perturbations use a moderately larger simulation-space brush so the response remains obvious in its narrower visual panel without forming blunt stamps.
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
