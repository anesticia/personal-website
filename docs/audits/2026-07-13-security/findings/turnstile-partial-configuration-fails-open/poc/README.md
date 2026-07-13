# Turnstile partial-configuration probe

This dependency-free Node.js probe models the vulnerable contact route's
Turnstile enablement decision and replaces email delivery with a local counter.
It does not bind a socket, use credentials, or contact Cloudflare, Resend, or a
deployed website.

## Requirements

- Node.js 18 or newer

## Run

```sh
node turnstile-fail-open-probe.mjs
```

Expected output:

```text
[+] partial configuration: delivery reached without a token
[+] full configuration: missing token rejected
[+] intentionally disabled: delivery allowed by policy
[+] confirmed: partial Turnstile configuration fails open
```

The process exits nonzero if the vulnerable partial-configuration behavior or
either control case is not observed. No cleanup is required.
