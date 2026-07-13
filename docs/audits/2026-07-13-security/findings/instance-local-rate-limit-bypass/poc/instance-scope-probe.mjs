#!/usr/bin/env node

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const IP = "203.0.113.10";
const NOW = 1_750_000_000_000;

function isRateLimited(rateLimit, ip, now) {
  const recent = (rateLimit.get(ip) ?? []).filter(
    (stamp) => now - stamp < WINDOW_MS,
  );

  if (recent.length >= LIMIT) return true;

  rateLimit.set(ip, [...recent, now]);
  return false;
}

function issue(instance, count) {
  let allowed = 0;
  let blocked = 0;

  for (let request = 0; request < count; request += 1) {
    if (isRateLimited(instance, IP, NOW + request)) blocked += 1;
    else allowed += 1;
  }

  return { allowed, blocked };
}

function requireResult(condition, message) {
  if (!condition) {
    console.error(`[-] ${message}`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

const singleInstance = issue(new Map(), 6);
console.log(
  `[+] single instance: allowed=${singleInstance.allowed} ` +
  `blocked=${singleInstance.blocked}`,
);

const instances = [new Map(), new Map(), new Map()];
const distributed = instances
  .map((instance) => issue(instance, LIMIT))
  .reduce(
    (total, result) => ({
      allowed: total.allowed + result.allowed,
      blocked: total.blocked + result.blocked,
    }),
    { allowed: 0, blocked: 0 },
  );
console.log(
  `[+] three independent instances: allowed=${distributed.allowed} ` +
  `blocked=${distributed.blocked}`,
);

const saturated = new Map();
issue(saturated, LIMIT);
const replacementAllowed = !isRateLimited(new Map(), IP, NOW + LIMIT);
console.log(
  `[+] cold-start replacement: request 6 was ` +
  `${replacementAllowed ? "allowed" : "blocked"} by fresh state`,
);

const checks = [
  requireResult(
    singleInstance.allowed === LIMIT && singleInstance.blocked === 1,
    "the single-instance control did not enforce five requests",
  ),
  requireResult(
    distributed.allowed === LIMIT * instances.length &&
      distributed.blocked === 0,
    "independent instances did not expose independent budgets",
  ),
  requireResult(
    replacementAllowed,
    "fresh instance state unexpectedly retained the prior budget",
  ),
];

if (checks.every(Boolean)) {
  console.log("[+] vulnerable invariant reproduced locally");
}
