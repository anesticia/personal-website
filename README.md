# Andre Huizen — Personal Research Website

Research-first personal website for Laurentius Andre Cornelis Rudolf Huizen (Andre Huizen). It presents scientific machine learning research, publications, software experiments, and an explicitly attributed archive of public forks.

## Quick start

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Production verification:

```powershell
npm test
```

## Documentation

- [Product and implementation plan](docs/PLAN.md)
- [Architecture and content model](docs/ARCHITECTURE.md)
- [Content provenance and privacy ledger](docs/CONTENT-PROVENANCE.md)
- [Adding research or projects](docs/ADDING-CONTENT.md)
- [Deployment and operations](docs/DEPLOYMENT.md)
- [Design system](docs/DESIGN.md)

## Contact configuration

Copy `.env.example` to `.env.local` and configure Resend:

```text
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=Portfolio <onboarding@resend.dev>
```

Cloudflare Turnstile is optional. Without mail credentials, the API returns a safe configuration message and no data is stored.

## Core principles

- Original work and forks must be labelled separately.
- Private local source and unpublished artifacts are never copied into the production bundle.
- Claims must point to a public source or an approved local project record.
- Negative research results are described honestly.
- The site is maintained from versioned, reviewed content rather than live filesystem scraping.
