#!/usr/bin/env node

/**
 * Safe local model of the vulnerable Turnstile enablement decision.
 *
 * This probe performs no network I/O and uses a mock mail-delivery sink. It
 * intentionally preserves the vulnerable route's `if (!secret) return true`
 * behavior so the partial-configuration state can be tested in isolation.
 */

function vulnerableVerifyTurnstile({ secret, token }) {
  if (!secret) return true;
  if (!token) return false;

  // Siteverify would run here. The PoC does not contact Cloudflare.
  return token === "locally-valid-control-token";
}

function submitContact({ siteKey, secret, token }) {
  let deliveries = 0;
  const delivered = () => {
    deliveries += 1;
  };

  const verified = vulnerableVerifyTurnstile({ secret, token });
  if (verified) delivered();

  return {
    advertisedAsEnabled: Boolean(siteKey),
    serverVerified: verified,
    deliveries,
  };
}

function requireCondition(condition, message) {
  if (!condition) {
    console.error(`[-] ${message}`);
    process.exitCode = 1;
  }
}

const partial = submitContact({
  siteKey: "public-site-key",
  secret: undefined,
  token: undefined,
});
requireCondition(partial.advertisedAsEnabled, "partial configuration did not advertise Turnstile");
requireCondition(partial.deliveries === 1, "partial configuration did not reach delivery");
console.log("[+] partial configuration: delivery reached without a token");

const complete = submitContact({
  siteKey: "public-site-key",
  secret: "private-secret",
  token: undefined,
});
requireCondition(complete.deliveries === 0, "full configuration accepted a missing token");
console.log("[+] full configuration: missing token rejected");

const disabled = submitContact({
  siteKey: undefined,
  secret: undefined,
  token: undefined,
});
requireCondition(!disabled.advertisedAsEnabled, "disabled mode advertised Turnstile");
requireCondition(disabled.deliveries === 1, "disabled policy unexpectedly rejected delivery");
console.log("[+] intentionally disabled: delivery allowed by policy");

if (!process.exitCode) {
  console.log("[+] confirmed: partial Turnstile configuration fails open");
}
