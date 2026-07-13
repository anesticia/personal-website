# Security Review: personal-website

## Scope

Standard repository-wide security scan of the immutable tracked source revision, covering all 27 source-like files and the anonymous contact boundary.

- Scan mode: repository
- Target kind: git_revision
- Target ID: target_sha256_941a8f72d7940cc0f43c8d6be208a0126f7e9e86963dcba899d27db64f10cde2
- Revision: e9825804099c6d277643719c61328b4c335d1114
- Inventory strategy: repository
- Included paths: .
- Excluded paths: none
- Runtime or test status: The exact revision built successfully. Safe local probes exercised contact parsing and mocked control paths without sending email or testing a live public deployment.
- Artifacts reviewed: Git tracked source and configuration, package-lock.json and npm dependency graph, local production build and safe interface probes, generated threat model, coverage ledger, candidate ledgers, validation reports, and attack-path reports
- Scan context: The threat model was generated during the scan from repository and deployment evidence. All twelve candidates received discovery, validation, and attack-path receipts.

Limitations and exclusions:
- Production provider credentials were absent and external email delivery was not exercised.
- The production Vercel Firewall rate-limit configuration could not be proven from repository source and remains an explicit operational follow-up.
- Excluded node_modules/: Third-party installed dependency source; assessed through the package lock and npm audit rather than full-file review.
- Excluded .next/: Generated build output, not source.
- Excluded output/: Ignored local test and scan artifacts, not deployed source.

### Scan Summary

| Field | Value |
| --- | --- |
| Reportable findings | 3 |
| Severity mix | low: 3 |
| Confidence mix | high: 3 |
| Coverage | complete |
| Validation mode | Targeted static source/control/sink trace with bounded local harnesses for reportable contact candidates. |

Canonical artifacts: `scan-manifest.json`, `findings.json`, and `coverage.json`. This report is a deterministic projection of those files.

## Threat Model

A public static portfolio exposes one anonymous server-side mutation: POST /api/contact, which can consume Cloudflare Turnstile and Resend services using server-held credentials. The principal risks are abuse of the fixed-recipient mail action, provider quota/cost, upstream wait occupancy, browser injection, and accidental disclosure of private configuration.

### Assets

- Server-only provider credentials
- Fixed-recipient email delivery quota and inbox availability
- Site integrity and visitor trust
- Function invocation capacity and predictable response behavior

### Trust Boundaries

- Anonymous browser or script to the Vercel contact function
- Vercel function to Cloudflare Siteverify
- Vercel function to Resend email delivery
- Developer-controlled content and environment configuration to public browser output

### Attacker Capabilities

- Send arbitrary anonymous HTTP requests to public routes
- Control contact form fields and request headers within Internet/browser constraints
- Distribute traffic across clients and benefit from serverless scaling
- Host a hostile web origin

### Security Objectives

- Only intended request shapes and configured verification modes may reach email delivery.
- Provider credentials and private configuration remain server-only.
- All untrusted parsing, local state, and upstream waits are bounded.
- Browser-rendered content cannot become executable through lower-privileged input.
- Production abuse budgets apply across function instances.

### Assumptions

- Vercel overwrites forwarded client-IP headers at the public edge.
- Contact delivery remains fixed to an operator-controlled recipient.
- Repository content is authored by the site owner rather than untrusted users.

## Findings

| Finding | Severity | Confidence | Detailed write-up |
| --- | --- | --- | --- |
| [Cross-origin text/plain requests can submit the contact form](#finding-1) | low | high | [Open report](findings/cross-origin-contact-submission/cross-origin-contact-submission.md) |
| [Instance-local contact rate limit can be bypassed across function instances](#finding-2) | low | high | [Open report](findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md) |
| [Partial Turnstile configuration fails open in the contact API](#finding-3) | low | high | [Open report](findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md) |

### Confidence Scale

| Label | Meaning |
| --- | --- |
| high | Direct evidence supports the finding with no material unresolved blocker. |
| medium | Evidence supports a plausible issue, but material runtime or reachability proof remains. |
| low | Evidence is incomplete and the item is retained only for explicit follow-up. |

<a id="finding-1"></a>

### [1] Cross-origin text/plain requests can submit the contact form

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | A hostile-Origin text/plain request against the local vulnerable server reached the delivery-configuration branch, proving that parsing, validation, and optional verification completed. |
| Category | Origin validation error |
| CWE | CWE-346 |
| Affected lines | app/api/contact/route.ts:38-43, app/api/contact/route.ts:46-52 |

#### Summary

See the [detailed technical write-up](findings/cross-origin-contact-submission/cross-origin-contact-submission.md).

#### Validation

See the [detailed technical write-up](findings/cross-origin-contact-submission/cross-origin-contact-submission.md).

#### Dataflow

See the [detailed technical write-up](findings/cross-origin-contact-submission/cross-origin-contact-submission.md).

#### Reachability

See the [detailed technical write-up](findings/cross-origin-contact-submission/cross-origin-contact-submission.md).

#### Severity

See the [detailed technical write-up](findings/cross-origin-contact-submission/cross-origin-contact-submission.md).

#### Remediation

See the [detailed technical write-up](findings/cross-origin-contact-submission/cross-origin-contact-submission.md).

<a id="finding-2"></a>

### [2] Instance-local contact rate limit can be bypassed across function instances

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | The state lifetime follows directly from the module-scoped Map, and a deterministic local model reproduced independent budgets and cold-start reset behavior. |
| Category | Improper rate-limit scope |
| CWE | CWE-799 |
| Affected lines | app/api/contact/route.ts:15-22, app/api/contact/route.ts:38-52 |

#### Summary

See the [detailed technical write-up](findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md).

#### Validation

See the [detailed technical write-up](findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md).

#### Dataflow

See the [detailed technical write-up](findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md).

#### Reachability

See the [detailed technical write-up](findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md).

#### Severity

See the [detailed technical write-up](findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md).

#### Remediation

See the [detailed technical write-up](findings/instance-local-rate-limit-bypass/instance-local-rate-limit-bypass.md).

<a id="finding-3"></a>

### [3] Partial Turnstile configuration fails open in the contact API

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | Direct source review and a local mocked-delivery harness confirmed that the partial configuration accepts a missing token and reaches the delivery boundary. |
| Category | Fail-open security configuration |
| CWE | CWE-636 |
| Affected lines | app/api/contact/route.ts:27, app/api/contact/route.ts:46-52 |

#### Summary

See the [detailed technical write-up](findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md).

#### Validation

See the [detailed technical write-up](findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md).

#### Dataflow

See the [detailed technical write-up](findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md).

#### Reachability

See the [detailed technical write-up](findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md).

#### Severity

See the [detailed technical write-up](findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md).

#### Remediation

See the [detailed technical write-up](findings/turnstile-partial-configuration-fails-open/turnstile-partial-configuration-fails-open.md).

## Structural Hardening

The scan also produced derived, unsealed design guidance based on the complete finding collection. These proposals describe options and tradeoffs; they do not indicate that any finding has been remediated.

[Open the structural hardening portfolio](hardening/hardening.md)

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
| --- | --- | --- | --- |
| Contact command, query, template, and code injection | Injection and execution sinks | No issue found | Full route review found no shell, database, dynamic template, eval, or code-execution sink. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Contact email field handling | Header injection | Rejected | Structured Resend JSON fields prevent raw SMTP-header concatenation; control-character rejection remains defense in depth. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Contact body parsing and abuse controls | Parsing and rate limiting | Reported | The instance-local rate-limit finding survived; body and in-memory cardinality candidates were rejected under platform bounds. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Fixed upstream requests | SSRF and upstream availability | Rejected | Turnstile and Resend destinations are fixed. Explicit timeouts remain a hardening action, but no attacker-selected destination or attacker-created stall survived. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Runtime filesystem access | File, upload, and path traversal | Not applicable | No filesystem mutation, upload, archive, or attacker-selected path API exists. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Authentication and object isolation | Authentication and authorization | Not applicable | The application has no account, protected object, privileged role, or private state surface. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Static content and structured rendering | XSS, XML, and JSON-LD injection | Rejected | Values are developer-controlled and are escaped or serialized for their contexts; no lower-privileged authoring boundary exists. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Contact browser boundary | Cross-origin actions and third-party script policy | Reported | The cross-origin submission finding survived; CSP and script allowlisting are tracked as hardening. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Environment and provider configuration | Secret handling and fail-open configuration | Reported | Partial Turnstile configuration survived as a finding; secrets remain server-only. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Dependencies and build configuration | Supply chain and framework exposure | No issue found | Production and full npm audits reported zero known vulnerabilities. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Browser and CDN response policy | Framing, MIME, transport, and caching | No issue found | No standalone vulnerability survived; explicit security headers, no-store API responses, and immutable versioned assets are tracked as hardening. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |
| Public bundle and repository data | Secrets and private provenance | No issue found | Tracked-file secret scanning found no credential pattern or private local path. Evidence: artifacts/03_coverage/repository_coverage_ledger.md |

## Open Questions And Follow Up

- Is a global POST /api/contact rate-limit rule enabled in the Vercel Firewall for the production project?
  - Follow-up prompt: Inspect the Vercel Firewall configuration for an atomic per-client POST /api/contact budget and document the verified rule without creating billable infrastructure.
