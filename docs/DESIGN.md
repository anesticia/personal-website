# Design system

## Thesis

The interface resembles a precise research notebook interrupted by vivid scientific fields. It uses actual output from the documented work, not stock imagery.

## Typography

- Manrope: interface and body text
- Instrument Serif: reflective emphasis and editorial contrast
- IBM Plex Mono: labels, indexes, data, and provenance cues

These are loaded through `next/font` and self-hosted in the production build.

## Palette

- Ink: `#11110f`
- Paper: `#f1efe6`
- Secondary paper: `#e7e4d9`
- Acid highlight: `#c7ff3f`
- Coral reference: `#ff6b4a`

The acid color is used sparingly for state and research emphasis. Structure comes from typography, rules, and whitespace rather than boxed cards.

## Motion

- Hero copy enters in a staged sequence.
- The hero image settles from a slight scale increase.
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
