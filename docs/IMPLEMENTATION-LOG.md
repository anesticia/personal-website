# Implementation and verification log

## 2026-07-13 — Initial production release

### Discovery

- Confirmed that the website workspace had no existing application.
- Inspected public GitHub metadata and found that the visible repositories were forks; the site therefore labels them as forks rather than original work.
- Verified the ORCID identity, Atma Jaya University Yogyakarta Informatics affiliation, and research keywords.
- Verified the 2023 JSI publication and DOI `10.30864/jsi.v18i1.601`.
- Searched for Google Scholar but did not find a profile attributable with enough confidence to publish.
- Reviewed local documentation for reaction–diffusion simulation, ORBIT-PINN, thesis wave experiments, Codex Chess Lab, GeoGuesser Engine, and Desktop Gremlin.
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
