# Security Hardening Review: personal-website

## Evidence Basis

This review is derived from the complete repository scan of revision `e9825804099c6d277643719c61328b4c335d1114`. Three low-severity contact-route findings survived: [partial Turnstile configuration](../findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md), [instance-local rate limiting](../findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md), and [cross-origin text/plain submission](../findings/cross-origin-contact-submission/cross-origin-contact-submission.md).

I inspected their common entry point and found one useful structural conclusion: the route should own all cheap local admission invariants before parsing or provider I/O, while an edge or durable system must own the cross-instance quota.

## Constraints

We must preserve the current rendered design, animations, transitions, static-first performance, and valid contact workflow. The balanced profile also avoids adding a new stateful or paid service without explicit approval. Those constraints matter because they favor a small local boundary plus an existing hosting control over a new network dependency on every submission.

## Opportunity Portfolio

| Opportunity | Evidence | Options | Recommendation | Proposal |
|---|---|---|---|---|
| Own contact admission at one boundary | Turnstile fail-open, instance-local quota, and cross-origin submission | 1. Layered route + edge; 2. Durable application limiter | Option 1 under current constraints | [Full proposal](proposals/contact-admission-boundary.md) |

## Recommendation Summary

I recommend Option 1: centralize media-type, origin, body-size, configuration, local-state, and upstream-deadline checks in the route, then treat a path-specific Vercel Firewall rule as the authoritative shared rate limit. This closes the two code-local findings with minimal latency and makes the remaining deployment dependency explicit. The in-memory Map can stay only as a bounded secondary burst guard.

Option 2 becomes preferable if the site later needs user-based quotas, portable infrastructure, richer policy, or audit-grade application ownership. It is stronger as an application abstraction but adds a credentialed service, a network hop, a new availability decision, and operating cost that are disproportionate for this fixed-recipient portfolio form today.

## Next Decisions

- Verify or enable the production Vercel Firewall rule for `POST /api/contact`; do not claim the global budget is closed until this read-back exists.
- Revisit the durable-limiter option if traffic or product requirements outgrow IP-based edge control.
- Revisit nonce-based CSP only if the project accepts dynamic rendering or a framework-supported static nonce path without visual/performance regression.

