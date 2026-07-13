# Local PoC

This package demonstrates that the vulnerable contact endpoint accepts a
cross-origin, CORS-safelisted `text/plain` request containing JSON. It is
intentionally limited to loopback targets.

## Safety conditions

- Run only against a local checkout of the vulnerable revision.
- Leave `RESEND_API_KEY` and `CONTACT_TO_EMAIL` unset so the route stops before
  external email delivery.
- Do not alter the loopback guard or point the probe at a public deployment.
- The route counts attempts before parsing, so restart the local application if
  prior tests have exhausted its five-attempt process-local allowance.

## Browser demonstration

Start the vulnerable portfolio on port 3000. Then, from this directory:

```sh
python -m http.server 8081
```

Open `http://127.0.0.1:8081/cross-origin.html`, open the browser's Network
panel, and press **Send local probe**. The network trace should show a
`text/plain` POST to port 3000 with no preceding OPTIONS request. The browser
may report a CORS read error; that happens after the server receives the POST.

## Response-visible probe

Node.js 18 or newer is required. With the local portfolio still running:

```sh
node probe.mjs
```

Expected output on the vulnerable revision with delivery disabled:

```text
[+] target: http://127.0.0.1:3000/api/contact
[+] sent Origin: http://attacker.example
[+] sent Content-Type: text/plain;charset=UTF-8
[+] status: 503
[+] response: Email delivery is not configured yet. Please use the GitHub link in the footer.
[+] vulnerable branch reached: the request passed parsing and schema validation
```

A fixed route should reject the request with status 403 or 415 before parsing,
verification, or delivery. Stop the local HTTP and portfolio servers after the
test; no other cleanup is needed.
