# Partial Turnstile configuration fails open in the contact API

## Executive Summary

The contact endpoint treats an absent `TURNSTILE_SECRET_KEY` as a successful
verification. This is intentional when Turnstile is completely disabled, but
the client and server decide whether Turnstile is enabled from different
environment variables. If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set while
`TURNSTILE_SECRET_KEY` is missing, the browser displays a challenge while the
server accepts requests with no token at all. An unauthenticated remote caller
can therefore bypass the advertised bot check and ask the application to send
email through its configured Resend account.

The confirmed affected revision is
`e9825804099c6d277643719c61328b4c335d1114`. The vulnerable code was introduced
in `c852b3e7e0c87d3f7b3047448dd916f76d61fbfb`; no fixed revision was available
when this report was prepared. I reviewed the vulnerable revision directly and
ran the included local probe with a mocked mail-delivery sink; I did not send
requests to a public deployment or to either external provider.

The practical impact is contact-channel spam and consumption of the site's
email-delivery quota when the deployment is partially configured. Payload
validation, the honeypot field, and the process-local rate limiter remain in
place, so this does not expose data or execute code. I rate the issue **Low
(P3)** with medium impact and medium likelihood.

## Background

The site exposes an unauthenticated `POST /api/contact` route. A visitor
supplies a name, reply address, purpose, and message. The route validates those
fields, applies a small per-IP rate limit, optionally validates a Cloudflare
Turnstile token, and then submits a structured message to Resend.

Turnstile has two halves in this application. The client uses the public site
key to decide whether to load and display the challenge. In
`components/contact-form.tsx`, the same condition controls both the Turnstile
script and widget:

```tsx
{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
  <Script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
    strategy="afterInteractive"
  />}

{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
  <div
    className="cf-turnstile"
    data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  />}
}
```

On submission, the client copies the widget response into the JSON request. An
empty token is still sent when the widget is absent or does not produce a
response:

```tsx
const body = Object.fromEntries(new FormData(form)) as Record<
  string,
  FormDataEntryValue
>;
body.turnstileToken = body["cf-turnstile-response"] ?? "";

const response = await fetch("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
```

The server, however, uses only the private secret to decide whether it should
verify that token. The intended normal states are straightforward:

| Public site key | Private secret | Intended behavior |
| --- | --- | --- |
| absent | absent | Turnstile intentionally disabled |
| present | present | show and verify the challenge |

The missing invariant is that the two configuration values must be absent or
present together. Neither startup nor request handling enforces that pairing.

## Vulnerability Details

We first reach the verification helper in `app/api/contact/route.ts`. Its first
branch returns `true` when the private secret is absent:

```ts
async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  form.set("remoteip", ip);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
```

That branch is safe only if an absent secret unambiguously means that the
feature is disabled. It does not: the client may have been built with a public
site key and may therefore advertise the challenge to every legitimate user.
An attacker does not need to load the page or solve that challenge. They can
construct the JSON body directly and omit `turnstileToken`.

We then carry the helper's `true` result into `POST`. The request must satisfy
the Zod schema and leave the honeypot empty, but neither condition establishes
human interaction. The apparent verification guard passes:

```ts
const parsed = schema.safeParse(payload);
if (!parsed.success) {
  return NextResponse.json(
    { message: "Please check the form and try again." },
    { status: 400 },
  );
}

if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
  return NextResponse.json(
    { message: "Verification failed. Please try again." },
    { status: 400 },
  );
}
```

From here we reach the externally visible operation. When the Resend API key
and destination address are configured, the route sends the attacker-controlled
message to the fixed site-owner address:

```ts
const apiKey = process.env.RESEND_API_KEY;
const to = process.env.CONTACT_TO_EMAIL;
if (!apiKey || !to) {
  return NextResponse.json(
    {
      message:
        "Email delivery is not configured yet. Please use the GitHub link in the footer.",
    },
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
    text:
      `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}` +
      `\nPurpose: ${parsed.data.purpose}\n\n${parsed.data.message}`,
  }),
});
```

The resulting bad state can be summarized as follows:

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY = configured
TURNSTILE_SECRET_KEY           = absent
attacker token                 = absent
verifyTurnstile()              = true
Resend request                 = reached
```

This is a configuration-dependent fail-open, not a universal Turnstile bypass.
When both Turnstile values are present, an absent token is rejected and a
supplied token is sent to Cloudflare for verification. When both values are
absent, delivery without a token is an explicit deployment mode rather than
the finding described here.

## Exploitability Analysis

The strongest route is direct API automation. We do not need to execute the
client JavaScript, receive a challenge, or forge a Cloudflare response. We only
need a schema-valid JSON object with an empty honeypot. The fixed destination
prevents choosing arbitrary recipients, but the attacker controls the reply
address, sender name, purpose label, and up to 4,000 characters of message
content. Repeated requests can create inbox noise and consume the site's Resend
allowance.

Several existing controls constrain reliability and severity:

- The route records up to five accepted attempts per apparent IP per hour in a
  process-local map. An attacker may need multiple source addresses, multiple
  server instances, or pauses between batches. This is friction, not proof of
  a human interaction.
- The honeypot rejects only clients that populate the hidden `website` field.
  A direct caller can leave it absent or empty.
- Zod length and enum constraints require well-formed content, but they do not
  distinguish an automated caller from a browser user.
- `CONTACT_TO_EMAIL` fixes the recipient. We cannot turn this primitive into an
  open relay for arbitrary third parties through the reviewed code.
- Missing Resend configuration stops at a `503`, so the bug has no mail-delivery
  impact in deployments where the contact feature itself is disabled.

An alternative route is browser automation that loads the page but suppresses
or ignores the widget response. It reaches the same server state, yet it is
strictly more complex than posting JSON directly and adds no useful primitive.
Forging a Turnstile token is also a dead end for this configuration: the helper
never consults the token or Cloudflare because it returns before either step.

The public widget may make the deployment look protected during manual review,
which raises the likelihood of this state surviving an environment-variable
mistake. Still, exploitation produces spam and quota consumption rather than
confidentiality loss, server compromise, or attacker-selected outbound email.
Those constraints support the Low (P3) rating.

## Proof of Concept

The `poc/turnstile-fail-open-probe.mjs` script is a local, dependency-free
control-flow probe. It reproduces the vulnerable enablement decision and uses a
mock delivery function instead of making network requests. The probe compares
three configurations:

1. a public site key without a private secret, which should be rejected as a
   configuration error but reaches delivery;
2. both keys present, where a missing token is rejected; and
3. both keys absent, the intentionally disabled mode.

Run it from the report directory:

```sh
cd poc
node turnstile-fail-open-probe.mjs
```

Representative output from the vulnerable model is:

```text
[+] partial configuration: delivery reached without a token
[+] full configuration: missing token rejected
[+] intentionally disabled: delivery allowed by policy
[+] confirmed: partial Turnstile configuration fails open
```

The script binds no sockets, uses no credentials, and performs no network I/O,
so no cleanup is required. It exits nonzero if the partial-configuration case
does not reproduce or if the control cases behave unexpectedly.

## Remediation

The invariant should be explicit: the public site key and private verification
secret must be configured together. If exactly one is present, contact delivery
must fail closed. If both are absent, the application may retain its documented
honeypot-only mode; if both are present, every accepted message must carry a
token that Siteverify accepts.

A minimal request-time repair is:

```ts
type TurnstileConfig =
  | { enabled: false }
  | { enabled: true; secret: string };

function getTurnstileConfig(): TurnstileConfig {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (Boolean(siteKey) !== Boolean(secret)) {
    throw new Error("Turnstile site key and secret must be configured together");
  }

  return secret ? { enabled: true, secret } : { enabled: false };
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const config = getTurnstileConfig();
  if (!config.enabled) return true;
  if (!token) return false;

  const form = new FormData();
  form.set("secret", config.secret);
  form.set("response", token);
  form.set("remoteip", ip);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
```

The route should catch the configuration error and return a generic `503`
without attempting delivery. A stronger structural option is an explicit
server-only `TURNSTILE_MODE=required|disabled` setting: `required` should demand
both keys at startup or deployment validation, while `disabled` should make the
absence of bot verification a deliberate, reviewable choice. Provider errors
and timeouts should also fail closed when the mode is `required`.

Regression tests should cover the full configuration matrix and the actual
delivery sink:

- both values absent: delivery follows the documented disabled policy;
- both values present plus a valid mocked Siteverify result: delivery occurs;
- both values present plus no token or a failed result: delivery does not occur;
- public site key only: `503`, with no Siteverify or Resend call;
- private secret only: `503`, with no Siteverify or Resend call.

Deployment documentation should list the values as a pair and include a CI or
post-deployment configuration check. That prevents the same bug from returning
through a dashboard edit even after the server branch is repaired.

## Summary

The contact form's client and server independently infer whether Turnstile is
enabled. When only the public site key is present, legitimate visitors see a
challenge but the server interprets the missing private secret as successful
verification. We traced that `true` result through the apparent verification
guard to the Resend call and demonstrated it with a safe local probe.

The resulting primitive is bounded but useful for abuse: an unauthenticated
caller can submit schema-valid messages without solving Turnstile, causing
inbox spam and consuming delivery quota. Enforcing a paired configuration and
failing closed on partial states restores the intended security boundary.
Future variant analysis should check other optional controls whose client and
server enablement is inferred from separate environment variables, especially
where an absent secret is treated as success.
