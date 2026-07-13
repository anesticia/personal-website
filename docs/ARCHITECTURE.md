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
public/images/         Approved derivative research images only
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

The client posts JSON to `/api/contact`. The route validates the payload with Zod, rejects honeypot content, limits repeated submissions per IP within a process, optionally verifies Cloudflare Turnstile, and sends through the Resend HTTP API. It never stores messages.

In-memory rate limiting is a first boundary, not a distributed guarantee. If abuse appears, replace it with Vercel Firewall rules or a durable rate-limit service while keeping the same route contract.

## SEO and identity

The root layout publishes `Person` JSON-LD. Detail pages publish `ScholarlyArticle` or `SoftwareSourceCode` records. The site uses the legal name for scholarly identity and Andre Huizen for display. ORCID and DOI are canonical external identifiers.
