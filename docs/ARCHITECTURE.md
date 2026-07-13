# Architecture

## Stack

- Next.js App Router
- React and TypeScript
- Plain CSS design system in `app/globals.css`
- Static generation for all content pages
- One Node.js route handler for contact delivery
- Vercel-compatible image optimization, metadata, sitemap, and social-image generation

## Project map

```text
app/                   Routes, metadata, API, and global styles
components/            Shared navigation, archive, form, and reveal behavior
data/site.ts           Canonical profile, publication, and work records
lib/                   Testable request-admission and security primitives
public/images/         Approved derivative research images only
scripts/               Reproducible asset tooling
tests/                 Unit, route, and real-browser regression coverage
docs/                  Product, provenance, maintenance, and deployment guidance
```

## Content data flow

`data/site.ts` is the only content registry. Pages filter or select from that registry. Every work record supplies status, kind, attribution, topics, methods, contribution, visibility, and last verification date.

The live site does not call GitHub, ORCID, or the local filesystem at runtime. This prevents third-party outages or a new local folder from changing production unexpectedly.

## Routes

- `/`
- `/research`
- `/archive`
- `/about`
- `/contact`
- `/work/[slug]`
- `/api/contact`
- `/feed.xml`
- `/sitemap.xml`
- `/robots.txt`
- `/opengraph-image`

## Contact flow

The client posts JSON to `/api/contact`. A cheap admission phase first enforces media type, browser origin, declared/actual byte bounds, and a bounded local burst guard. The route then validates the exact payload with Zod, rejects honeypot and control-character content, requires a fully paired or fully disabled Turnstile configuration, bounds each upstream call, and sends to one Resend destination. It never stores messages, and every response is non-cacheable.

The in-memory limiter is secondary. The authoritative production budget is a Vercel Firewall fixed-window rule for `POST /api/contact` at five requests per IP per hour. A durable application limiter remains the documented portability option if the hosting edge changes.

## Motion and image delivery

`Reveal` remains a server component with the original CSS contract. One client `MotionController` owns route reveal observation, which avoids a separate React state/effect/observer for every section and rebinds after client navigation.

Approved source images are encoded as content-hashed lossless WebP files. `public/images/image-manifest.json` proves decoded-pixel equality and records source/output sizes. Hashed files receive immutable one-year caching; Next.js still produces responsive optimized variants.

## SEO and identity

The root layout publishes `Person` JSON-LD. Detail pages publish `ScholarlyArticle` or `SoftwareSourceCode` records. The site uses the legal name for scholarly identity and Andre Huizen for display. ORCID and DOI are canonical external identifiers.
