# Performance and visual stability

## Invariant

Performance work must not intentionally change layout, content, colors, typography, image pixels, animation timing, transition timing, hover behavior, or reduced-motion behavior. Optimization belongs in asset delivery, rendering ownership, cache policy, and bounded server work.

## Implemented changes

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
