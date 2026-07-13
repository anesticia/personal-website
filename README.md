# Andre Huizen — Personal Research Website

Research-first personal website for Laurentius Andre Cornelis Rudolf Huizen (Andre Huizen). It presents scientific machine learning research, publications, software experiments, and an explicitly attributed archive of public forks.

**Production:** [andre-huizen.vercel.app](https://andre-huizen.vercel.app)

**Source:** [github.com/anesticia/personal-website](https://github.com/anesticia/personal-website)

## Quick start

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Production verification:

```powershell
npx playwright install chromium
npm test
```

## Documentation

- [Product and implementation plan](docs/PLAN.md)
- [Architecture and content model](docs/ARCHITECTURE.md)
- [Content provenance and privacy ledger](docs/CONTENT-PROVENANCE.md)
- [Adding research or projects](docs/ADDING-CONTENT.md)
- [Deployment and operations](docs/DEPLOYMENT.md)
- [Security model, controls, and incident response](docs/SECURITY.md)
- [Performance budgets and visual verification](docs/PERFORMANCE.md)
- [Dated security audit package](docs/audits/2026-07-13-security/README.md)
- [Design system](docs/DESIGN.md)
- [Implementation and verification log](docs/IMPLEMENTATION-LOG.md)

## Contact configuration

Copy `.env.example` to `.env.local` and configure Resend:

```text
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=Portfolio <onboarding@resend.dev>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Cloudflare Turnstile is optional, but its site key and secret must be configured together. A partial configuration fails closed. Without mail credentials, the API returns a safe configuration message and no data is stored.

## Core principles

- Original work and forks must be labelled separately.
- Private local source and unpublished artifacts are never copied into the production bundle.
- Claims must point to a public source or an approved local project record.
- Negative research results are described honestly.
- The site is maintained from versioned, reviewed content rather than live filesystem scraping.
