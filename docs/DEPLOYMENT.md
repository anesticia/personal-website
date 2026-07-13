# Deployment and operations

## Current production

- Canonical URL: `https://andre-huizen.vercel.app`
- Vercel project: `anesticias-projects/personal-website`
- Git repository: `https://github.com/anesticia/personal-website`
- Production is connected to the GitHub repository.
- First production deployment: 2026-07-13

## Vercel deployment

The project is intended for Vercel. From the repository root:

```powershell
npm test
npx vercel deploy --prod -y
```

For an unclaimed bootstrap deployment, use the fallback script documented by the local Vercel deployment skill and claim the returned project before adding secrets or a domain.

## Environment variables

Configure these for Production and Preview:

| Variable | Required | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical production origin |
| `RESEND_API_KEY` | Contact delivery | Resend API credential |
| `CONTACT_TO_EMAIL` | Contact delivery | Private recipient |
| `CONTACT_FROM_EMAIL` | Contact delivery | Verified sender identity |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Client challenge site key |
| `TURNSTILE_SECRET_KEY` | Optional | Server verification secret |

Never commit real values.

The Turnstile values are a pair: configure both or neither. Exactly one value is a deployment error and the contact API will return `503` without delivery.

## Required firewall rule

The production edge must retain this live rule:

- Name: `Contact submissions per IP`
- ID: `rule_contact_submissions_per_ip_uwUNIk`
- Match: path equals `/api/contact` AND method equals `POST`
- Action: fixed-window rate limit, 5 requests per 3,600 seconds, keyed by IP

Verify after deployment:

```powershell
npx vercel firewall rules inspect rule_contact_submissions_per_ip_uwUNIk --no-color
npx vercel firewall diff --no-color
```

Do not replace this with the process-local Map. If the project leaves Vercel, provision an atomic durable limiter before moving traffic.

## Domain checklist

1. Add the chosen domain in Vercel.
2. Apply the DNS records shown by Vercel.
3. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin.
4. Redeploy so sitemap, canonical metadata, RSS, and JSON-LD use the final domain.
5. Test both apex and `www`; redirect one to the canonical host.

## Release checklist

- Run `npm test`.
- Confirm the firewall rule is live and there are no unpublished draft changes.
- Review all changed work records and provenance notes.
- Check the preview on mobile and desktop.
- Submit a real contact test after mail variables are configured.
- Verify `/sitemap.xml`, `/robots.txt`, `/feed.xml`, and the social preview.
- Promote the reviewed deployment to production.
- Read back CSP, HSTS, no-store API, and immutable image headers from the canonical origin.

## Recovery and portability

Content and design live in Git; no CMS database is required. Vercel-specific behavior is limited to ordinary serverless execution and image optimization. The application can move to another Node-compatible host by preserving environment variables and build commands.
