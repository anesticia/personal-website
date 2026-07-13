# Adding research or projects

## Add a record

1. Open `data/site.ts`.
2. Add a `Work` object with a unique lowercase slug.
3. State the contribution in first-person-neutral, evidence-based language.
4. Choose the correct kind: `research`, `software`, `experiment`, or `fork`.
5. Set status to `active`, `completed`, `exploratory`, or `archived`.
6. Add `lastVerified` in `YYYY-MM-DD` format.
7. If the repository is private, keep `public: false` and omit `sourceUrl`.
8. Add the evidence source to `CONTENT-PROVENANCE.md`.

The archive and detail page are generated automatically from the record.

## Add an image

- Use an output you created or an asset with documented permission.
- Prefer PNG, WebP, or AVIF; keep the source aspect ratio meaningful.
- Place it in `public/images/` using a descriptive filename.
- Add useful alt text when the image carries information. Decorative images use empty alt text.
- Do not publish screenshots containing local paths, tokens, private email, or student numbers.

## Add a publication

The current release has one canonical publication record in `data/site.ts`. For multiple publications, convert `publication` into a typed array and render it from newest to oldest. Each record should include DOI, authors in published order, venue, volume/issue/pages, and a canonical URL.

## Validate

```powershell
npm test
```

Then inspect `/`, `/research`, `/archive`, and the new detail route at desktop and mobile widths.
