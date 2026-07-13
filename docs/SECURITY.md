# Security model and operations

## Current posture

The public site is static-first. Its only server-side mutation is `POST /api/contact`, which sends a validated message to one operator-controlled address. There are no accounts, sessions, protected objects, uploads, database queries, filesystem writes, or user-authored public content.

The repository-wide Codex Security review is preserved at [audits/2026-07-13-security/report.md](audits/2026-07-13-security/report.md). It assessed immutable revision `e9825804099c6d277643719c61328b4c335d1114`, reviewed all 27 source-like tracked files, closed all 12 candidates, and reported three low-severity contact-boundary findings. The audit is intentionally pre-remediation evidence; the controls below describe the implemented follow-up.

## Trust boundaries

1. Anonymous browser or HTTP client to the Vercel edge.
2. Vercel edge to the contact function.
3. Contact function to Cloudflare Siteverify when Turnstile is enabled.
4. Contact function to Resend when email delivery is enabled.
5. Developer-controlled content and environment configuration to public browser output.

The protected assets are provider credentials, fixed-recipient delivery quota, inbox availability, site integrity, predictable function capacity, and visitor trust.

## Contact admission controls

The route applies controls in this order:

1. Require `application/json`.
2. Reject a foreign `Origin` and `Sec-Fetch-Site: cross-site`.
3. Reject a declared body over 16 KiB.
4. Apply a bounded, swept in-memory burst guard.
5. Read the body once and enforce its actual UTF-8 byte length.
6. Parse JSON and validate the exact Zod schema, honeypot, lengths, enum, token bound, and name control characters.
7. Require Turnstile's public site key and private secret to be present or absent together.
8. Fail closed when configured Turnstile verification fails, errors, or exceeds five seconds.
9. Require the fixed Resend credential and destination.
10. Bound Resend delivery to eight seconds and return generic errors.

Every API response carries `Cache-Control: no-store, max-age=0`. The route never stores a message.

The local Map is deliberately a secondary burst guard, not the global security boundary. Production has an enabled Vercel Firewall rule:

| Field | Live value |
|---|---|
| Rule | `Contact submissions per IP` |
| Rule ID | `rule_contact_submissions_per_ip_uwUNIk` |
| Scope | path equals `/api/contact` and method equals `POST` |
| Algorithm | fixed window |
| Budget | 5 requests per 3,600 seconds |
| Key | IP |
| Exceeded action | rate limit |

Read it back with:

```powershell
npx vercel firewall rules inspect rule_contact_submissions_per_ip_uwUNIk --no-color
npx vercel firewall diff --no-color
```

The second command must say that there are no pending changes.

## Turnstile modes

Only two states are valid:

| Site key | Secret | Result |
|---|---|---|
| absent | absent | Deliberately disabled; schema, honeypot, local burst guard, and edge limit remain |
| present | present | Token required and verified |
| present | absent | Configuration error; delivery fails closed |
| absent | present | Configuration error; delivery fails closed |

Never rotate or remove one Turnstile value without changing the other in the same deployment.

## Browser response policy

HTML and API routes receive:

- a restrictive Content Security Policy;
- HSTS for two years with subdomains and preload;
- frame denial through CSP and `X-Frame-Options`;
- MIME sniffing prevention;
- strict referrer policy;
- camera, microphone, geolocation, and browsing-topics denial;
- same-origin opener/resource policy;
- origin agent clustering;
- legacy cross-domain policy denial.

The CSP intentionally retains `unsafe-inline` for scripts and styles because the current statically generated Next.js output uses inline framework bootstrap data, JSON-LD, and existing inline style values. It still denies `eval`, objects, foreign frames, foreign forms, and every third-party script except Cloudflare Turnstile. A nonce-based policy would force a different rendering/deployment architecture and must be benchmarked before adoption. The risk is narrow because no lower-privileged author can publish script or style content.

## Dependency and secret controls

- `npm audit --omit=dev` and the full `npm audit` were clean during the review.
- Tracked-file credential and private-path scans found no secret.
- Provider credentials are server-only and must never use the `NEXT_PUBLIC_` prefix.
- Public project content is curated in `data/site.ts`; production never scrapes local folders or third parties.

## Verification

```powershell
npm run security:test
npm run typecheck
npm run lint
npm run build
npm run ui:test
npm audit
```

The focused suite covers media type, origin, Fetch metadata, byte bounds, normalized IP selection, Turnstile configuration pairing, Map expiry/cardinality, the original cross-origin interface primitive, upstream non-reachability, and no-store responses.

After deployment, inspect the root, API rejection, immutable image cache, and firewall rule. Do not send repeated production probes: the global rule is intentionally strict.

## Incident response

If contact abuse or provider anomalies occur:

1. Inspect Vercel Firewall events, function logs, and Resend quota/activity.
2. Disable delivery by removing `RESEND_API_KEY` or `CONTACT_TO_EMAIL`; the route will fail closed with `503`.
3. Tighten or challenge the firewall rule if legitimate traffic is not affected.
4. Rotate provider credentials if disclosure is suspected.
5. Preserve timestamps, deployment ID, request IDs, and relevant logs before rollback.
6. Re-run the security tests and production read-back after recovery.

The complete threat model, coverage ledger, SARIF, detailed findings, safe local PoCs, and architectural alternatives remain in [the dated audit package](audits/2026-07-13-security/README.md).
