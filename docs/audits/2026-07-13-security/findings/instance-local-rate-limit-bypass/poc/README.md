# Instance-scope rate-limit probe

This safe probe models the contact handler's module-scoped `Map` and its exact
five-request, one-hour decision logic. It demonstrates that one instance blocks
request six while independent instances and replacement state each receive
fresh budgets.

The probe does not contact a website, invoke an email provider, or change
external state.

## Requirements

- Node.js 20 or newer

## Run

From the vulnerability report directory:

```sh
cd poc
node instance-scope-probe.mjs
```

Expected output:

```text
[+] single instance: allowed=5 blocked=1
[+] three independent instances: allowed=15 blocked=0
[+] cold-start replacement: request 6 was allowed by fresh state
[+] vulnerable invariant reproduced locally
```

The process exits with a nonzero status if the modeled transitions do not match
the vulnerable behavior. No build step or cleanup is required.
