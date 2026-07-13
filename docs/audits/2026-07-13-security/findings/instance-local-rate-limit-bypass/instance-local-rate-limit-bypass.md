# Instance-local contact rate limit can be bypassed across function instances

## Executive Summary

The public `POST /api/contact` handler intends to allow at most five submissions
per source IP address per hour. At revision
`e9825804099c6d277643719c61328b4c335d1114`, however, the complete request
history is held in a module-scoped JavaScript `Map`. That state is private to
one running Node.js function instance. It is neither shared with concurrent
instances nor preserved when an instance is replaced.

An unauthenticated sender who reaches several instances, or simply continues
after an instance is recycled, receives a fresh five-request budget from each
one. When email delivery is configured and the other contact checks pass, every
accepted request reaches the Resend delivery call. The practical impact is a
low-severity, priority P3 abuse-control bypass: it can increase unwanted email
and consume provider quota, but it does not disclose data or grant code
execution.

I reviewed the affected revision and its history directly, and I executed the
included deterministic local model. I did not send requests to any public
deployment or exercise a real email provider. The vulnerable handler was
introduced in commit `c852b3e7e0c87d3f7b3047448dd916f76d61fbfb` and remained
present at the assessed revision; no fixing revision was available during this
review.

## Background

The application exposes a Next.js route handler that accepts contact-form
submissions. It validates the message, optionally checks Cloudflare Turnstile,
and sends a structured email through Resend. The route is public by design, so
its abuse controls form the boundary between an arbitrary Internet client and
an operation that consumes an external delivery service.

Before parsing the body, the handler obtains the caller address from the
forwarded header and consults `isRateLimited`:

```typescript
// app/api/contact/route.ts, POST
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) return NextResponse.json(
    { message: "Too many messages. Please try again later." },
    { status: 429 },
  );

  let payload: unknown;
  try { payload = await request.json(); } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  // Validation and delivery follow.
}
```

The intended invariant is straightforward: all requests attributed to one IP
must consume one shared budget, regardless of which application instance
handles them. A serverless deployment can reuse a warm instance, run several
instances concurrently, and replace old instances after idle periods or
deployments. Process memory is useful as a cache in that model, but it cannot
serve as the authoritative value for a global security quota.

## Vulnerability Details

The rate-limit state and check are implemented entirely in process memory:

```typescript
// app/api/contact/route.ts
const rateLimit = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (rateLimit.get(ip) ?? []).filter(
    (stamp) => now - stamp < 60 * 60 * 1000,
  );
  if (recent.length >= 5) return true;
  rateLimit.set(ip, [...recent, now]);
  return false;
}
```

Within one process this code behaves as expected: calls one through five append
timestamps, and call six returns `true`. The missed invariant appears when we
carry the same IP address to a second function instance. That instance loads
the module independently, so its `rateLimit` variable refers to a new `Map`.
The lookup returns an empty array, the request is counted as its first event,
and the handler permits it.

We can describe the state after five submissions to instance A and one to
instance B as follows:

| Instance | Stored timestamps for the same IP | Next local decision |
| --- | ---: | --- |
| A | 5 | block |
| B | 1 | allow |
| Global intent | 6 | should block |

There is no reconciliation step between A and B. A cold start has the same
effect: replacing A creates a new empty map and erases the only record of its
five accepted submissions. The code therefore enforces `5 * active instances`
requests in the concurrent case and an unbounded sequence of fresh budgets
across instance lifetimes, rather than five requests per IP per hour.

After the local check, a well-formed request proceeds through schema and
Turnstile validation. With delivery credentials configured, the resulting
operation is an external email request:

```typescript
// app/api/contact/route.ts, POST
const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
    to: [to],
    reply_to: parsed.data.email,
    subject: `[Portfolio] ${parsed.data.purpose}: ${parsed.data.name}`,
    text: `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\n` +
      `Purpose: ${parsed.data.purpose}\n\n${parsed.data.message}`,
  }),
});
```

Thus the bypass is not merely an inaccurate counter: accepted submissions can
reach the resource the counter was meant to protect.

## Exploitability Analysis

The strongest practical route is ordinary distributed traffic. We submit at
most five valid messages through each function instance and avoid exhausting
any one local map. The attacker does not choose a specific instance directly,
but concurrency, regional routing, scaling, and routine instance replacement
can all create independent budgets. More parallelism generally makes the
bypass easier and increases the number of emails accepted within one hour.

A slower route relies on lifetime turnover. We first consume the five-request
budget on a warm instance, then wait until later requests are handled by a new
instance. Because the new process has no durable history, we receive another
budget even though the original one-hour window has not necessarily expired.
This route is less deterministic because the attacker does not control when an
instance is retired, but it requires no header spoofing or malformed input.

The primitive has meaningful constraints:

- Each request must still pass body validation.
- A correctly configured Turnstile check adds a separate per-submission hurdle.
- Delivery credentials must be configured before accepted requests produce
  email; otherwise the handler returns `503`.
- Hosting-layer deployment protection or a platform firewall can prevent or
  independently rate-limit access, but those operational controls are not
  represented by this repository and do not restore the application's global
  counter invariant.
- Sending more than five requests repeatedly to one stable instance is a dead
  end: that process correctly returns `429`. The bypass depends on independent
  state, not on arithmetic or window-boundary manipulation.

Because the result is nuisance email and possible delivery-quota consumption,
rather than confidentiality loss or privilege gain, the appropriate final
severity is Low (P3). The likelihood is nevertheless realistic for a public
serverless endpoint, and the source proof gives high confidence in the root
cause.

## Proof of Concept

The `poc/instance-scope-probe.mjs` script is a safe, deterministic model of the
exact `Map`-based decision function. It performs no network requests and sends
no email. We first verify the control case: one instance allows five attempts
and blocks the sixth. We then route the same IP through three independent maps
and observe fifteen allowed attempts. Finally, we replace a saturated instance
with a new map and observe another allowed request inside the same modeled
window.

From the report directory, run:

```sh
cd poc
node instance-scope-probe.mjs
```

Representative output:

```text
[+] single instance: allowed=5 blocked=1
[+] three independent instances: allowed=15 blocked=0
[+] cold-start replacement: request 6 was allowed by fresh state
[+] vulnerable invariant reproduced locally
```

The script exits nonzero if any expected transition differs. It needs only a
current Node.js runtime and changes no external state, so cleanup is simply
deleting the unpacked report bundle.

## Remediation

The invariant to restore is: one IP address must have one authoritative,
atomic submission budget shared by every function instance for the entire
window. The preferred fix is to enforce the rule in the hosting firewall or in
a durable rate-limit service. Application-side enforcement must use an atomic
operation; a separate read followed by a write can itself race across
instances.

A minimal application shape using a distributed limiter is:

```typescript
// The provider must implement an atomic fixed-window or sliding-window update.
const contactLimiter = createDistributedRateLimiter({
  namespace: "contact",
  limit: 5,
  windowSeconds: 60 * 60,
});

export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request);
  const decision = await contactLimiter.consume(ip);

  if (!decision.allowed) {
    return NextResponse.json(
      { message: "Too many messages. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(decision.retryAfterSeconds) },
      },
    );
  }

  // Parse, verify, and deliver the request.
}
```

The concrete store may be a managed Redis/KV service with an atomic Lua script,
a purpose-built distributed rate-limit API, or a platform firewall rule scoped
to `POST /api/contact`. A small in-memory limiter may remain as a secondary
burst guard, but it must not be treated as the security boundary.

Regression coverage should include:

1. six requests for one IP routed through one application instance;
2. six requests for one IP split across two fresh instances;
3. a process restart between requests five and six;
4. independent budgets for two different IP addresses;
5. concurrent submissions near the fifth-request boundary, proving the backing
   operation cannot admit both due to a read/write race;
6. expiry exactly before and after the one-hour window; and
7. a failure mode decision for an unavailable limiter (normally fail closed or
   apply a deliberately tighter emergency policy for this nonessential form).

Turnstile, strict same-origin handling, bounded request bodies, and delivery
timeouts are valuable defense in depth, but none substitutes for shared state.

## Summary

The contact endpoint stores its entire five-per-hour history in a module-level
`Map`. We followed an anonymous request from that instance-local check to the
external mail-delivery call and showed why a second instance or cold start
creates a fresh budget for the same IP. The included local probe demonstrates
both bypass forms without touching a live service.

Replacing the map with an atomic distributed limiter or platform firewall rule
restores the intended invariant. Future variant analysis should look for other
module-scoped maps, counters, caches, or replay guards used as security controls
in serverless handlers, especially where a downstream operation consumes a
paid or externally visible service.
