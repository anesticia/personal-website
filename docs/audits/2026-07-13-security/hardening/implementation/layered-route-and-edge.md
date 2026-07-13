# Implementation Plan: Layered route admission plus Vercel Firewall

## Selected Design And Constraints

The user requested complete performance and security optimization while preserving visual output, animation, transitions, and valid behavior. We therefore selected the incremental route-and-edge option. No new paid or durable service is authorized.

## Source Revision And Drift Check

Security evidence is anchored to `e9825804099c6d277643719c61328b4c335d1114`. The implementation begins from that clean revision. Expected drift is limited to the fixes and performance work documented in the implementation log; any unrelated drift must be reviewed before deployment.

## Affected Components

- `app/api/contact/route.ts`
- a new testable contact-security helper under `lib/`
- `components/contact-form.tsx` only if a non-visual hidden timing signal is retained
- `next.config.ts`
- deployment, security, performance, architecture, and implementation docs

## Ordered Work Packages

- Add testable admission helpers and regression coverage.
- Enforce media type, trusted origin, byte bounds, paired Turnstile configuration, and bounded deadlines.
- Bound and sweep the local Map, retaining it only as a secondary guard.
- Add response security headers and immutable versioned asset cache policy.
- Optimize observer ownership, static feed generation, and lossless project imagery.
- Verify locally, deploy, inspect production, and document the edge rule status.

## Compatibility And Migration

The rendered DOM, CSS, timing values, valid JSON body shape, and response message contract remain stable. Rejected abusive requests gain 403/415/413 responses; misconfiguration becomes 503 instead of fail-open delivery.

## Tactical Protections During Migration

Keep Turnstile and the bounded local guard active. Do not remove the local guard after adding an edge rule; it remains a cheap secondary burst control. Do not claim global enforcement before Vercel configuration is read back.

## Tests And Security Validation

Run unit tests for every configuration and request-authority branch, the three original PoCs, `npm audit`, tracked secret scanning, and production header/API probes.

## Performance And Resource Benchmarks

Compare Lighthouse performance, FCP, LCP, TBT, CLS, transfer bytes, build route classification, project-image bytes, and settled desktop/mobile screenshots against the recorded baseline.

## Rollout And Rollback

Deploy one production revision, smoke-test the canonical alias, then verify edge configuration. A source rollback reverts the implementation commit; the firewall rule can be disabled independently if it rejects legitimate submissions.

## Acceptance Criteria

- No intentional pixel, animation, transition, or content change.
- All local checks and builds pass.
- The original cross-origin and Turnstile PoCs no longer reach delivery.
- Project image bytes decrease with decoded pixel equality.
- Production returns the documented security and cache headers.
- Global rate-limit status is either verified or explicitly recorded as an operational follow-up.

## Open Decisions

A durable application limiter remains deferred until traffic, portability, or policy requirements justify a new stateful dependency.

