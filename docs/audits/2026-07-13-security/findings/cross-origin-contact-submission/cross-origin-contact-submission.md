# Cross-origin `text/plain` requests can submit the contact form

## Executive Summary

The public `POST /api/contact` handler accepts a JSON document without checking
the request origin or requiring an `application/json` media type. A hostile web
page can therefore send the same JSON bytes as the CORS-safelisted
`text/plain` type. The browser sends that request without a preflight, and the
server can continue as far as the configured email-delivery operation even
though browser CORS policy prevents the attacking page from reading the
response.

The practical impact is abuse of a fixed-recipient contact channel: unwanted
mail, consumption of email-provider quota, and nuisance content attributed to
site visitors. The attacker cannot choose the recipient or read response data,
and the in-process rate limiter and an enabled Turnstile integration constrain
reliability. I rate the issue **Low severity (P3)** with high confidence.

I reviewed vulnerable revision
`e9825804099c6d277643719c61328b4c335d1114` directly and reproduced the
delivery-configuration branch using a local instance with email delivery
disabled; I did not send mail or test a public deployment. The vulnerable route
was introduced in commit `c852b3e7e0c87d3f7b3047448dd916f76d61fbfb` on
2026-07-13. No fixed revision was available at the time of review.

## Background

The portfolio exposes a public contact form backed by a Next.js route handler.
The intended React client serializes its form state as JSON and explicitly sets
`Content-Type: application/json`:

```tsx
// components/contact-form.tsx
const response = await fetch("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
```

On the server, Zod limits the accepted fields and a honeypot field named
`website` must remain empty. The handler also records up to five attempts per
source IP per hour in a process-local map. Cloudflare Turnstile verification is
optional: when `TURNSTILE_SECRET_KEY` is absent, `verifyTurnstile()` returns
success without requiring a token.

The normal security invariant for this state-changing browser endpoint should
be: only the intended same-origin frontend may submit a request, and the server
must accept only the media type that frontend emits. CORS response headers alone
do not establish that invariant. Browsers may send a cross-origin "simple"
request before applying response-read restrictions. In particular,
`text/plain` is safelisted and avoids an OPTIONS preflight.

## Vulnerability Details

We first reach the public route in `app/api/contact/route.ts`. The function
extracts an IP address and applies its local rate limiter, but it never examines
`Origin`, `Sec-Fetch-Site`, or `Content-Type`:

```ts
// app/api/contact/route.ts, POST()
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")
    ?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
```

`request.json()` parses the body as JSON regardless of its declared media type.
If we carry a JSON string sent as `text/plain` into this call, it becomes the
same JavaScript object the legitimate client would have produced. The Zod
schema then validates attacker-selected `name`, `email`, `purpose`, and
`message` fields. The empty honeypot does not distinguish the hostile request
from a normal one.

After optional Turnstile verification, the parsed fields reach the Resend API:

```ts
// app/api/contact/route.ts, POST()
if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
  return NextResponse.json(
    { message: "Verification failed. Please try again." },
    { status: 400 },
  );
}

const apiKey = process.env.RESEND_API_KEY;
const to = process.env.CONTACT_TO_EMAIL;
if (!apiKey || !to) {
  return NextResponse.json(
    { message: "Email delivery is not configured yet. Please use the GitHub link in the footer." },
    { status: 503 },
  );
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: process.env.CONTACT_FROM_EMAIL ||
      "Portfolio <onboarding@resend.dev>",
    to: [to],
    reply_to: parsed.data.email,
    subject: `[Portfolio] ${parsed.data.purpose}: ${parsed.data.name}`,
    text: `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}` +
      `\nPurpose: ${parsed.data.purpose}\n\n${parsed.data.message}`,
  }),
});
```

This is the decisive transition. With email delivery configured and Turnstile
disabled, the server converts a request initiated by an unrelated origin into
an authenticated Resend request. The missing check is server-side; whether the
attacking script can read the response does not affect delivery.

The local validation used a hostile `Origin` and a `text/plain` JSON body. The
route returned its 503 email-configuration message, proving that parsing,
schema validation, and optional verification had all completed. Email
credentials were deliberately absent, so the test stopped immediately before
the external delivery request.

## Exploitability Analysis

The strongest realistic route is a lure page that submits once when a visitor
interacts with it. We can use `fetch()` with `Content-Type: text/plain`; that
header is safelisted, so a conforming browser does not preflight the request.
The browser adds the hostile `Origin`, but the vulnerable route ignores it. The
request body controls the message contents and reply-to address while the site
owner's configuration supplies the Resend credential and fixed recipient.

One attacking browser address is limited to five attempts per hour by the
process-local map. A distributed lure can nevertheless obtain a separate small
allowance from each visitor's source address, and serverless scaling can make
the process-local limit less deterministic across instances. These constraints
keep the issue in nuisance and quota-abuse territory; they do not erase the
cross-origin primitive.

There are also important limits:

- The recipient is fixed by `CONTACT_TO_EMAIL`, so this is not an open mail
  relay.
- Browser CORS policy normally hides the response from the hostile page. The
  attacker can trigger delivery but cannot use this route to read secrets.
- If Turnstile is fully configured, a missing or invalid token is rejected.
  The demonstrated path applies when that optional integration is disabled or
  otherwise bypassed by configuration.
- The honeypot only catches clients that fill the hidden `website` field. A
  targeted request leaves it empty.
- A native script can already call a public unauthenticated contact endpoint;
  the browser-specific security failure is that arbitrary websites can recruit
  visitors' browsers without an explicit API client or preflight.

An ordinary HTML `<form>` is an informative dead end for this exact payload:
standard form encodings do not conveniently produce the JSON body expected by
`request.json()`. JavaScript `fetch()` with a safelisted `text/plain` content
type is the reliable route.

## Proof of Concept

The accompanying `poc/` directory contains two local-only probes:

- `cross-origin.html` is the browser demonstration. Serve it from port 8081
  while the vulnerable application runs on port 3000, click the button, and
  inspect the Network panel. The browser sends a cross-origin `text/plain`
  POST without an OPTIONS preflight.
- `probe.mjs` sends the same headers and payload from Node.js and prints the
  response. It is useful for confirming which server branch was reached when
  browser CORS correctly hides the response body.

Both artifacts refuse non-loopback target URLs. From the report directory:

```sh
cd poc
python -m http.server 8081
```

In another terminal, with the vulnerable application running locally:

```sh
cd poc
node probe.mjs
```

Representative vulnerable output with delivery intentionally unconfigured is:

```text
[+] target: http://127.0.0.1:3000/api/contact
[+] sent Origin: http://attacker.example
[+] sent Content-Type: text/plain;charset=UTF-8
[+] status: 503
[+] response: Email delivery is not configured yet. Please use the GitHub link in the footer.
[+] vulnerable branch reached: the request passed parsing and schema validation
```

After remediation, the same probe should stop at the media-type or origin gate:

```text
[+] status: 415
[+] response: Unsupported media type.
[+] fixed behavior: request rejected before contact processing
```

The PoC does not send mail when the local application has no
`RESEND_API_KEY`/`CONTACT_TO_EMAIL`. Do not configure delivery credentials for
this test. No cleanup is required beyond stopping the local servers.

## Remediation

Restore two invariants before parsing or rate-limit accounting: browser
submissions must be same-origin, and the endpoint must accept only JSON. The
media-type check makes a hostile browser use a non-safelisted header, which
forces a preflight; the explicit origin check provides the server-side decision
and remains necessary even outside normal browser CORS behavior.

A minimal defensive shape is:

```ts
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return NextResponse.json(
      { message: "Unsupported media type." },
      { status: 415 },
    );
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Cross-origin submission rejected." },
      { status: 403 },
    );
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json(
      { message: "Cross-site submission rejected." },
      { status: 403 },
    );
  }

  // Apply rate limiting, parse, validate, verify, and deliver only now.
}
```

Deployments behind proxies should compare against a trusted configured public
origin if `request.nextUrl.origin` can be derived from untrusted forwarding
headers. If clients without an `Origin` header are not required, rejecting a
missing origin is stricter. If they are required, they should have an explicit
authentication mechanism rather than inheriting browser trust assumptions.

Regression tests should cover:

1. same-origin `application/json` succeeds through validation;
2. hostile-origin `text/plain` is rejected before parsing and delivery;
3. hostile-origin `application/json` is rejected even in a non-browser test
   client that does not enforce preflight;
4. `Sec-Fetch-Site: cross-site` is rejected;
5. malformed and oversized bodies remain bounded and fail closed; and
6. the rejection path never calls Turnstile or Resend.

Defense in depth should retain a production-grade rate limit and Turnstile,
but neither should replace the request-origin invariant.

## Summary

The contact endpoint trusts any syntactically valid JSON body, independent of
where the browser request originated or which media type it declared. By
carrying JSON in a CORS-safelisted `text/plain` request, we can reach the
fixed-recipient email-delivery path from an unrelated website without a
preflight. The primitive is constrained by rate limiting, optional Turnstile,
and a fixed recipient, so the validated impact is low-severity mail and quota
abuse rather than data compromise.

The durable fix is to reject non-JSON and cross-origin requests before parsing
or any external operation, then lock that behavior in regression tests. Future
variant analysis should review other state-changing route handlers for the same
assumption that unreadable cross-origin responses imply unsubmitted requests.
