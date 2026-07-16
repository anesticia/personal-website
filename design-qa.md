# Wave scrollbar design QA

- Source visual truth: `C:/Users/ACER/.codex/generated_images/019f6825-f540-7571-8840-d54a63d8329b/exec-59fca340-cf18-4800-845d-9e0144e6278b.png`
- Implementation, top state: `E:/Moved/for-fun/personal-website/output/playwright/wave-scrollbar-implementation-top.png`
- Implementation, 28% probe state: `E:/Moved/for-fun/personal-website/output/playwright/wave-scrollbar-implementation-28-percent.png`
- Full-view comparison: `E:/Moved/for-fun/personal-website/output/playwright/wave-scrollbar-qa-full.png`
- Focused rail comparison: `E:/Moved/for-fun/personal-website/output/playwright/wave-scrollbar-qa-focus-28-percent.png`
- FDTD source capture: `E:/Moved/for-fun/personal-website/output/playwright/wave-fdtd-source.png`
- FDTD propagating-front capture: `E:/Moved/for-fun/personal-website/output/playwright/wave-fdtd-propagating.png`
- FDTD separated-front capture: `E:/Moved/for-fun/personal-website/output/playwright/wave-fdtd-separated-fronts.png`
- Viewport: 1440 x 1000 desktop
- States: document top for page composition; 28% document progress for probe geometry; active downward and upward propagation; settled idle

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: The existing Manrope, Source Serif 4, and IBM Plex Mono hierarchy remains unchanged. The scrollbar adds no copy and does not alter wrapping or optical weight.
- Spacing and layout rhythm: The 46-pixel fixed interaction region overlays the quiet right-edge area without shifting page layout. The visible trace occupies roughly the same narrow width and right alignment as the approved mockup.
- Colors and visual tokens: The double-stroked graphite/warm-paper trace and oxide/warm-signal probe preserve contrast over both the dark simulation and light coordinate-paper sections.
- Image quality and asset fidelity: Existing live reaction-diffusion imagery remains unchanged. The waveform is rendered at device-pixel resolution as a functional mathematical control, preventing scaling blur while retaining the approved large-to-medium-to-small propagation profile.
- Copy and content: No site copy or content changed.
- States and interactions: Click seeking landed at 28%, pointer dragging reached 71%, and Home/End keyboard navigation reached both document boundaries. Scroll input now injects a localized disturbance at the probe into a 192-cell field. Its positive and negative phases travel along the fixed trace, reflect no lateral wiggle, and decay through damped absorbing boundaries. The ARIA value tracked those states and no browser console errors were present.
- Responsiveness and accessibility: The custom control is limited to precise-pointer screens above 900 pixels. Narrow and coarse-pointer screens retain the themed native scrollbar. The desktop control exposes scrollbar semantics, a label, current value text, focus treatment, and Arrow, Page, Space, Home, and End behavior.

## Comparison history

### Pass 1

- Earlier P2: Pointer seeking inherited the document's smooth-scroll rule, so dragging lagged behind the pointer.
- Fix: Pointer seeking now temporarily bypasses smooth scrolling while keyboard travel remains smooth.
- Post-fix evidence: Browser interaction at 56% landed immediately at progress `0.5617`; drag verification landed at progress `0.7057`.
- Earlier P2: The small-wave regime was visibly less dense than the approved propagation mockup.
- Fix: The medium regime was raised to 22 cycles per normalized height and the small regime to 80, with smooth transitions at 25–40% and 50–69%.
- Post-fix evidence: `wave-scrollbar-qa-focus-28-percent.png` shows distinct large, medium, and tightly packed small regimes with comparable scale and density.

### Pass 2

- Full-view evidence: `wave-scrollbar-qa-full.png` confirms that page hierarchy, typography, navigation, and hero spacing remain intact while the scrollbar stays subordinate at the right edge.
- Focused evidence: `wave-scrollbar-qa-focus-28-percent.png` confirms the approved propagation sequence, thin dual-contrast trace, and oxide probe at the same illustrative progress.
- Result: no remaining P0, P1, or P2 findings.

### Pass 3

- User feedback: The approved static propagation profile did not visibly move in response to scrolling.
- Rejected prototype: A phase-offset deformation made the whole trace wiggle. It communicated motion, but not wave propagation, and has been removed.

### Pass 4

- User feedback: The disturbance must behave as a genuine wave traveling through a line, not as a line that merely changes shape.
- Fix: The scrollbar now solves the damped one-dimensional wave equation with an explicit finite-difference time-domain update. A localized Ricker impulse is injected at the oxide probe; positive and negative phases are drawn as warm-signal and oxide energy traveling along the fixed large-to-medium-to-small curve.
- Numerical evidence: The control reports `data-wave-solver="fdtd-1d"`, a 192-cell grid, and Courant number `0.693`. A checked pulse advanced from step `14` with energy `0.0331` and a non-zero field signature before returning to `data-wave-animating="false"` and energy `0.0000`.
- Timing evidence: The solver advances against a 60 Hz simulation clock with bounded catch-up, so browser frame throttling does not freeze the physical decay or leave residual energy active indefinitely.
- Visual evidence: `wave-fdtd-source.png`, `wave-fdtd-propagating.png`, and `wave-fdtd-separated-fronts.png` show the emitted disturbance separating and traveling along the stationary trace. A final 1440 x 1000 in-app check confirmed the current tuned build and an empty browser console.
- Accessibility evidence: Reduced-motion coverage verifies that scrolling keeps energy at `0.0000` and never starts the simulation.
- Result: no remaining P0, P1, or P2 findings.

## Implementation checklist

- [x] Continuous large-to-medium-to-small wave trace
- [x] Live oxide probe bound to document progress
- [x] Velocity-scaled, direction-aware propagation from the probe
- [x] Energy decay to a quiet idle state
- [x] Click and pointer-drag seeking
- [x] Keyboard and screen-reader semantics
- [x] Native mobile/coarse-pointer fallback
- [x] Desktop and mobile route regression coverage
- [x] Console and visual comparison checks

## Follow-up polish

No blocking polish remains. Probe brightness can be tuned later if a stronger signal is preferred over the current restrained instrument treatment.

final result: passed
