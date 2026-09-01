# Implementation and verification log

## 2026-07-13 — Initial production release

### Discovery

- Confirmed that the website workspace had no existing application.
- Inspected public GitHub metadata and found that the visible repositories were forks; the site therefore labels them as forks rather than original work.
- Verified the ORCID identity, Atma Jaya University Yogyakarta Informatics affiliation, and research keywords.
- Verified the 2023 JSI publication and DOI `10.30864/jsi.v18i1.601`.
- Searched for Google Scholar but did not find a profile attributable with enough confidence to publish.
- Reviewed the local documentation and publication records used by the retained portfolio entries.
- Visually inspected generated research images before approving them as site assets.

### Product and design

- Chosen direction: research-first, full searchable archive, Vercel, protected contact form.
- Defined the visual thesis, interaction thesis, information architecture, privacy boundary, and acceptance criteria in `PLAN.md`.
- Built a full-bleed, research-output-led hero and a cardless editorial system.
- Added staged hero motion, viewport reveals, archive transitions, and reduced-motion behavior.
- Used only generated research outputs for major imagery.

### Application

- Created a Next.js App Router application with TypeScript and plain CSS.
- Added Home, Research, Archive, About, Contact, eight work detail pages, and a custom 404 page.
- Added live archive search and filters.
- Added canonical metadata, sitemap, robots policy, RSS, social image, favicon, and JSON-LD.
- Added a server contact route with bounded validation, a honeypot, per-process IP rate limiting, optional Cloudflare Turnstile, and optional Resend delivery.
- Added the typed content registry and contribution/attribution fields in `data/site.ts`.

### Verification

- Resolved incompatibilities by pinning TypeScript 6 and ESLint 9 to the lines supported by the Next.js lint integration.
- Overrode PostCSS to a patched release after the first dependency audit identified a moderate advisory.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; 21 application routes generated.
- `npm audit --omit=dev`: zero vulnerabilities.
- Browser-tested the desktop hero, 390 × 844 mobile hero, mobile menu, archive navigation, `PINN` search, and contact response.
- Probed every page, detail route, sitemap, feed, social image, and icon: all returned HTTP 200 locally.
- Scanned rendered client/server pages for student identifiers, email addresses, Git token patterns, and local paths: clear.

### Source and deployment

- Initial commit: `c852b3e` (`Build research-first personal website`).
- Published source at `https://github.com/anesticia/personal-website`.
- Connected the repository to Vercel project `anesticias-projects/personal-website`.
- Production deployment ID: `dpl_AzN6nV7Lquc49cgb9coAckZQULvA`.
- Canonical alias: `https://andre-huizen.vercel.app`.

### Remaining external configuration

The website and contact endpoint are deployed, but email cannot be delivered until private service credentials exist. Configure `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and a verified `CONTACT_FROM_EMAIL` in Vercel. Optionally configure the matching Turnstile site/secret pair. Credentials from public search results are intentionally not used.

## 2026-07-13 — Performance and security hardening

### Baseline and review

- Captured a production-build Lighthouse baseline and settled 1440 × 1,000 and 390 × 844 full-page screenshots before changing source.
- Ran a standard repository-wide Codex Security review against immutable revision `e9825804099c6d277643719c61328b4c335d1114`.
- Reviewed 27/27 source-like files; closed 12/12 candidates with discovery, validation, and attack-path receipts.
- Published the sealed report, canonical JSON, SARIF, three source-backed low-severity finding write-ups, safe local PoCs, and an architectural hardening portfolio.
- Preserved the complete pre-remediation package under `docs/audits/2026-07-13-security/`.

### Security implementation

- Added strict JSON, same-origin, Fetch metadata, declared/actual 16 KiB body, schema, honeypot, token-length, and control-character admission checks.
- Made partial Turnstile configuration fail closed; kept both-absent as the documented optional mode.
- Added five-second Siteverify and eight-second Resend deadlines with generic failure responses.
- Bounded and swept the process-local Map; retained it only as a secondary burst guard.
- Added no-store API responses and a defense-in-depth browser header policy: CSP, HSTS, framing denial, MIME protection, strict referrer/permissions, COOP/CORP, and origin isolation.
- Added 12 focused Vitest regressions, including the original hostile-origin `text/plain` primitive and Turnstile configuration matrix.
- Published and read back Vercel Firewall rule `rule_contact_submissions_per_ip_uwUNIk`: exact `POST /api/contact` match, fixed-window 5/hour/IP, enabled, with no pending draft.
- Re-ran full and production-only dependency audits: zero known vulnerabilities.

### Performance implementation

- Converted five PNG assets from 9,710,531 bytes to 6,250,018 bytes of lossless WebP, a 35.64% source reduction.
- Verified every converted file by decoding both sides to RGBA and comparing all raw pixels; stored dimensions, sizes, and SHA-256 values in `public/images/image-manifest.json`.
- Added content-hashed filenames and one-year immutable caching.
- Replaced per-section React state/effects/IntersectionObservers with one shared motion controller while retaining threshold, classes, CSS timing, delays, client-navigation behavior, and reduced-motion behavior.
- Forced RSS to static generation; the final build leaves only `/api/contact` dynamic.
- Scoped document security headers away from framework chunks and static subresources to avoid repeated header overhead.
- Added real-browser desktop/mobile stability tests and client-navigation reveal coverage.

### Performance evidence

- Initial transfer fell from 409,324 to 362,352 bytes (11.48%).
- Median total blocking time fell from 73.5 ms to 43.5 ms; Speed Index from 1,030 ms to 939 ms; main-thread work from 1,137 ms to 955 ms; boot-up from 510 ms to 333 ms.
- CLS remained 0; Accessibility, Best Practices, and SEO remained 100.
- Performance scored 94 versus the single-run baseline of 95. Median synthetic LCP moved from 2.84 s to 3.08 s while the required 1.8-second hero animation remained unchanged; bytes and execution metrics improved.
- Settled screenshot geometry remained exactly 1440 × 5,172 and 390 × 6,143, with no intentional visual, animation, transition, content, or layout change.

### Verification and operations

- `npm run security:test`: 12/12 passed.
- `npm run typecheck`, `npm run lint`, and `npm run build`: passed.
- `npm run ui:test`: desktop, mobile, and client-navigation checks passed.
- Local root responses carried the expected document policy; cross-origin `text/plain` returned `415` before upstream work; versioned WebP returned immutable cache headers.
- The maintenance contract is now documented in `SECURITY.md` and `PERFORMANCE.md`.

### Production release

- Release commit: `5f92c459b0fe5c332ab23db0c613d8aa103f8119` (`Harden and optimize personal website`).
- Pushed the identical commit to `origin/main` and confirmed the remote ref matched.
- Production deployment: `dpl_HJ8VeRf4Mnv2dCvscVuTRA76c1bC`.
- Vercel reported the deployment target as `production` and the final state as `READY` after compiling all 21 application routes.
- Reassigned the canonical alias to the new deployment: `https://andre-huizen.vercel.app`.
- Read back the live firewall configuration after deployment: `Contact submissions per IP` remained enabled at 5 requests per 3,600 seconds, with no pending draft changes.
