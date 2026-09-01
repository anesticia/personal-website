# Performance and visual stability

## Invariant

Performance work must not intentionally change layout, content, colors, typography, image pixels, animation timing, transition timing, hover behavior, or reduced-motion behavior. Optimization belongs in asset delivery, rendering ownership, cache policy, and bounded server work.

## Implemented changes

### Rendering reuse for integrated graphics and software rendering (2026-08-31)

The visible site is preserved. No CSS, content, effects, image assets, canvas
resolution limits, animation intervals, wave geometry, or simulation parameters
were changed. Both GPU-accelerated and software Canvas 2D use the same optimized
path, without GPU-vendor detection or a reduced-quality mode.

- The homepage terrain and projected coordinates are cached until the view,
  selection, size, or DPR changes. Each animation frame copies the terrain at a
  1:1 backing-pixel ratio, then draws the original connections, nodes, and pulse.
  Terrain lines are no longer recalculated and rasterized every frame.
- The research field caches its unchanged horizontal alpha gradient. The original
  wave paths and drawing order remain, including `destination-in` compositing.
  This removes repeated full-resolution gradient evaluation.
- The homepage stops scheduling frames when offscreen or the document is hidden,
  and resumes on return. Resizing the offscreen research field does not repaint it.
- Portrait/touch layouts no longer run and paint the invisible custom scrollbar.
  The existing native scrollbar remains. The desktop wave equation, parameters,
  interaction, and visible appearance are unchanged.

These caches trade a bounded additional bitmap per mounted visual for less
repeated rendering work. They use the existing DPR limits and are rebuilt on
size/DPR changes. The Gray–Scott simulation and evidence plots were not modified.

#### Matched production-build measurement

Three runs before and three after, on the same Windows host, Chromium via
Playwright, 1440 × 1000 CSS pixels, DPR 1.5, no CPU throttling, and approximately
three seconds per sample. Chromium was launched with `--disable-gpu`. Its reported
Canvas 2D, rasterization, and compositing feature statuses confirmed software
rendering. No other test suites or builds ran during these samples.

| State | Before median (range), ms | After median (range), ms | Reduction |
|---|---:|---:|---:|
| Homepage, visible | 463.6 (449.7–482.0) | 243.1 (241.3–253.3) | 47.6% |
| Research field, visible | 1686.6 (1630.7–1798.6) | 1337.1 (1318.2–1518.0) | 20.7% |
| Homepage, offscreen and settled | 457.5 (454.7–468.8) | 0.43 (0.42–0.45) | 99.9% |

The metric is CDP `Performance.getMetrics().TaskDuration` delta, meaning browser
main-thread task time during the sample, not page-load latency, GPU utilization,
or a claimed FPS increase. Homepage clears stayed at approximately 90 per sample
while visible and fell from 90–91 to zero offscreen. The research field was already
idle offscreen. Absolute timings varied between runs. This is a controlled
software-rendering comparison, not a measurement of Zen running on Intel hardware.

Decoded screenshot pixels matched exactly before and after for the homepage and
research page at 1440 × 1000, 390 × 844, and 768 × 1024, all at DPR 1.5. These six
captures used reduced motion and a fixed clock to avoid temporal differences.
They establish equality for those captured states, not every possible animated
frame or browser. Interaction and animation lifecycle require separate checks.

A full research-background bitmap cache was also measured and rejected because
it increased software-rendering cost. It is not part of the retained change.

Reproduce against a running production build:

```powershell
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
# In another terminal, with no concurrent build or browser test run:
node scripts/profile-rendering.mjs --software=true --output=output/performance/rendering-sample
node scripts/verify-rendering.mjs --software
node scripts/verify-rendering.mjs
```

`profile-rendering.mjs` records raw samples, browser/GPU status, and the six fixed
captures. It also supports `--url=...`, `--route=/research`, `--states=visible`,
`--trials=3`, `--sample=3000`, and `--captures=false` for bounded investigations.
`verify-rendering.mjs` checks pause/resume, a simulated document visibility event,
runtime reduced motion, selection, dragging, source movement, cache invalidation
on resize, native/custom scrollbar transitions, overflow, and browser errors.
Use `PLAYWRIGHT_BASE_URL` to point the verification script at another local port.

Validation completed: `npm test` passed all 12 unit/security tests, TypeScript,
ESLint, the 46-page production build, and all 26 existing browser tests. The
focused rendering checks also passed with default Chromium settings and with
`--disable-gpu`, with no browser errors. No Zen/Intel FPS claim is made.

Raw local evidence is retained in `output/performance/integrated-before/`,
`output/performance/integrated-after/`, and
`output/performance/integrated-comparison.json`. These ignored artifacts are not
shipped in the site bundle. No deployment or GPU/browser settings change is part
of this optimization.

### Route-wide scrolling and worker rendering (2026-08-31, second pass)

The first pass above did not resolve the main scrolling cost on the other pages.
A separate baseline covered all nine primary routes: Home, About, Archive, Contact,
Research, and all four project dossiers. Static pages were already nearly idle
when stationary, but their shared animated wave scrollbar painted expensive paths
on the main thread throughout scrolling. A diagnostic browser-only ablation on
Contact and Orbit-PINN confirmed that the scrollbar accounted for most of that
work. The ablation is not a site change, and the scrollbar remains fully visible
and interactive.

The retained changes are:

- The shared scrollbar, Research wave field, and About reaction-diffusion renderer
  draw their existing frames in workers. The visible canvases receive full-size
  bitmaps. The shared scrollbar change also applies to prototype routes.
- Worker delivery keeps one frame in flight and only the newest pending frame.
  It closes delivered bitmaps and terminates workers on unmount. It does not
  change the configured animation cadence or rendering resolution.
- The original renderers remain available when workers or OffscreenCanvas are
  missing, loading fails, or a worker fails at runtime. A completed visible bitmap
  remains intact during failure recovery until a new frame is needed. A lost
  reaction-diffusion WebGL context can recover with the existing Canvas palette.
- Research labels stay on the main thread so they retain the page's font
  environment. Field drawing retains its backing surface between frames because
  transferring that storage changed pixels in repeated-stroke checks.
- The wave renderer constructs each existing path once for its two strokes and
  reuses field magnitudes across color bands. It retains every sampled vertex.
- The Canvas fallback looks up the exact existing 8-bit chemical color mapping.
  Immutable simulation hold frames keep their existing pixels. Mutable pointer
  fields continue to render. Simulation code, seeds, parameters, history length,
  playback stride, and pointer injection are unchanged.
- Dossier scroll progress updates only its percentage and progress-bar transform.
  It no longer re-renders the chapter navigation for every scroll update.

This moves expensive drawing away from scrolling and input handling. It does not
establish a reduction in total CPU time or GPU utilization. Worker surfaces,
fallback surfaces, cached fades, and bounded state snapshots consume additional
memory. There is no GPU-vendor detection, quality reduction, dependency update,
CSS change, asset change, or content change.

#### Repeated route-wide measurement

The comparison starts from the local version **after the first pass**, not the
original repository or a live deployment. It uses the same Chromium
149.0.7827.55, Windows host, 1440 × 1000 viewport, DPR 1.5, no CPU throttling,
and `--disable-gpu` for both conditions. Three samples per route and state are
retained. Each scroll follows the same four-second down-and-back trajectory
through the complete document. Fonts and images load before sampling. No other
browser tests or builds run during these measurements. CPU frequency and unrelated
host background activity are not locked, so these are repeated local measurements
rather than a laboratory hardware benchmark.

The metric below is main-thread `TaskDuration` during the scroll, in milliseconds.
It is not page-loading time or FPS. Ranges expose the observed run-to-run variation.

| Route | Before median (range), ms | After median (range), ms | Reduction |
|---|---:|---:|---:|
| / | 2543.0 (2438.3–2980.9) | 389.2 (385.4–406.0) | 84.7% |
| /about | 3007.9 (2933.9–3122.7) | 389.5 (370.2–442.5) | 87.0% |
| /archive | 1764.6 (1729.1–2244.2) | 160.2 (159.1–196.0) | 90.9% |
| /contact | 1652.9 (1638.1–2304.6) | 137.9 (137.5–185.1) | 91.7% |
| /research | 3070.7 (3061.6–3186.0) | 523.0 (522.7–610.4) | 83.0% |
| /work/object-classification-paper | 2740.2 (2718.1–2774.1) | 466.2 (459.6–665.0) | 83.0% |
| /work/orbit-pinn | 2870.2 (2834.1–2977.5) | 463.5 (462.3–624.3) | 83.9% |
| /work/reaction-diffusion | 3069.5 (3003.1–3486.7) | 493.9 (490.0–651.1) | 83.9% |
| /work/wave-pinn-thesis | 3082.6 (2931.6–3226.1) | 450.8 (447.6–618.9) | 85.4% |

With the page stationary and its animation visible, the three-second About
samples fell from 1707.1 ms (1689.9–1909.0) to 442.4 ms (375.0–520.2), a 74.1%
median reduction. Research fell from 1160.1 ms (1155.1–1480.6) to 158.5 ms
(156.3–189.6), an 86.3% reduction. Those animation samples are distinct from the
four-second scrolling table above.

Chromium reports software rasterization/compositing under this launch flag, but
it can still expose WebGL2 through SwiftShader. The About canvas in these runs
used WebGL2. The Canvas palette equivalence test therefore provides separate
fallback coverage, not an explanation for the About benchmark improvement.
These results do not measure Zen on the user's Intel driver. Production workers
were confirmed active through the rendered-frame markers, not inferred from a
successful build.

#### Preservation and recovery checks

- All 27 retained before/after full-page captures matched decoded pixels and dimensions:
  nine primary routes at 1440 × 1000, 390 × 844, and 768 × 1024, DPR 1.5. Captures
  use reduced motion, a fixed clock, loaded fonts/images, and revealed content.
- The original and optimized scrollbar drawing functions matched all channels
  across 540 evolving frames at three sizes/DPRs.
- Real worker entry points and bitmap delivery matched the previous renderers
  across 126 frames per browser launch mode: 90 wave frames, 18 Research frames,
  and 18 WebGL simulation frames. Both default and software Chromium passed.
- Every 8-bit U/V pair matched the previous Canvas palette for both simulation
  variants at three output scales: 65,536 states per variant/scale.
- Source comparisons confirmed unchanged wave stepping/injection and unchanged
  reaction-diffusion initialization, stepping, capture/restore, blending,
  playback, and pointer-interaction functions.
- Software Chromium integration checks passed for unavailable workers,
  unavailable OffscreenCanvas, constructor/loading failure, runtime failure,
  simulated context loss followed by redraw, and client-navigation cleanup.
  The available/unavailable/failure modes retained the same settled page pixels.
- `npm test` passed 12 unit/security tests, TypeScript, ESLint, the 46-page build,
  and 26 browser tests. Focused rendering checks passed in default and software
  Chromium for visibility, reduced motion, interactions, resizing, and overflow.

These are bounded equivalence and behavior checks, not proof for every possible
frame, GPU driver, or browser. Intermediate experiments that changed pixels were
rejected or corrected before the retained implementation passed its checks.

Reproduce against the local production preview:

```powershell
node scripts/profile-page-rendering.mjs --trials=3 --output=output/performance/pages-after
node scripts/summarize-page-rendering.mjs
node scripts/capture-content-pages.mjs output/performance/pages-final
node scripts/verify-wave-rendering.mjs --software
node scripts/verify-worker-pixels.mjs --software
node scripts/verify-worker-pixels.mjs
node scripts/verify-simulation-colors.mjs
node scripts/verify-worker-fallbacks.mjs --software
node scripts/verify-rendering.mjs --software
```

Before/after pixel and timing comparisons require the saved baseline artifacts.
Raw evidence is under ignored `output/performance/`: `pages-before-source/`,
`pages-before-scan/`, `pages-before-repeats/`, `pages-after/`,
`pages-comparison.json`, `pages-visual-before/`, `pages-final/`,
`pages-final-comparison.json`, `worker-pixels-*.json`,
`worker-fallbacks-software.json`, `simulation-color-equivalence.json`, and
`model-invariants.json`. Failed intermediate captures remain separate from the
final comparisons. No commit, push, deployment, or browser/OS setting change was
performed for either of these two rendering passes.

### Lossless versioned imagery

The five approved PNG files were converted to lossless WebP. `scripts/optimize-images.mjs` decodes each source to RGBA, encodes it, decodes the result again, and refuses the output unless every raw pixel, dimension, and channel matches. The generated content hash is part of the filename, allowing a one-year immutable cache.

| Asset set | Bytes |
|---|---:|
| Original PNG sources | 9,710,531 |
| Lossless WebP outputs | 6,250,018 |
| Reduction | 3,460,513 (35.64%) |

Exact dimensions, encoded sizes, and raw-pixel SHA-256 values are recorded in `public/images/image-manifest.json`.

For a newly approved PNG:

```powershell
npm run assets:optimize
```

Review the generated manifest and update the content registry/reference before removing the superseded source.

### One reveal observer

`Reveal` is a server component that emits the same wrapper class and `--reveal-delay` style as before. `MotionController` owns one `IntersectionObserver` for the route and applies the same `is-visible` class at threshold `0.12`. This removes per-reveal React state/effects while preserving the `.7s` opacity/transform transition and every delay value.

The controller rebinds after client navigation, so new route content retains the same reveal behavior.

### Static and cache behavior

- `/feed.xml` is forced static and no longer consumes a function invocation.
- All content pages remain static or statically generated.
- Only `/api/contact` is dynamic.
- Versioned WebP files carry `public, max-age=31536000, immutable`.
- The contact API is explicitly non-cacheable.
- Full document security headers are not repeated on framework chunks, fonts, or optimized image responses; this avoids roughly 900 bytes of irrelevant header overhead per static subresource.

### Render stability

The build retains explicit image containers and responsive `sizes`. The post-change Lighthouse sample records `CLS = 0`. Settled full-page screenshots have identical geometry:

| Viewport | Before | After |
|---|---|---|
| Desktop | 1440 × 5,172 | 1440 × 5,172 |
| Mobile | 390 × 6,143 | 390 × 6,143 |

Visual inspection found no layout, content, transition, or image-pixel change. Automated UI tests scroll every reveal into view, wait for the unchanged transitions, check browser console/page errors, capture both viewports, and verify that client navigation rebinds motion.

## Lighthouse evidence

Local production builds were audited on the same machine. The baseline was one captured run; the post-change values below are the median of three repeated `localhost` runs, so small timing differences should not be overinterpreted.

| Metric | Baseline | Post-change median | Direction |
|---|---:|---:|---:|
| Transferred bytes | 409,324 | 362,352 | 11.48% lower |
| FCP | 762 ms | 760 ms | effectively unchanged |
| LCP | 2,840 ms | 3,083 ms | synthetic variance / unchanged hero animation boundary |
| Total blocking time | 73.5 ms | 43.5 ms | 40.8% lower |
| Speed Index | 1,030 ms | 939 ms | 8.9% lower |
| Main-thread work | 1,137 ms | 955 ms | 16.0% lower |
| Boot-up time | 510 ms | 333 ms | 34.8% lower |
| CLS | 0 | 0 | stable |
| Accessibility | 100 | 100 | stable |
| Best Practices | 100 | 100 | stable |
| SEO | 100 | 100 | stable |
| Performance score | 95 | 94 median | LCP-weighted synthetic result |

The hero image still uses the original `1.8s` settle animation, as required by the visual invariant. Synthetic LCP therefore remains dominated by the animation boundary even though bytes, blocking, main-thread work, and Speed Index improved.

Artifacts are under ignored local `output/performance/` and `output/playwright/`.

## Reproduction

```powershell
npm test
npm start
npx lighthouse http://localhost:3000 --output=json --output-path=output/performance/lighthouse.json --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo
```

On this Windows host, Lighthouse can write a complete JSON report and then return a nonzero exit because Chrome keeps its temporary directory open during cleanup. Validate the JSON file and scores before classifying that cleanup-only `EPERM` as an audit failure.

## Budgets and maintenance

- Keep CLS at `0`.
- Do not increase initial transferred bytes above the 409,324-byte baseline without a documented reason.
- Preserve 100 Accessibility, Best Practices, and SEO scores.
- Require pixel-equivalence verification for any format-only image migration.
- Run desktop and mobile UI tests after changing `Reveal`, image containers, fonts, global CSS, navigation, or the hero.
- Re-baseline only for an intentional, reviewed visual change.
