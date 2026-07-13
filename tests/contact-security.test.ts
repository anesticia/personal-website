import { describe, expect, it } from "vitest";
import {
  MAX_CONTACT_BODY_BYTES,
  MemoryRateLimiter,
  contactBodyByteLength,
  getClientIp,
  resolveTurnstileConfiguration,
  validateRequestEnvelope,
} from "@/lib/contact-security";

describe("contact request admission", () => {
  it("requires JSON before parsing", () => {
    const headers = new Headers({ "content-type": "text/plain" });
    expect(validateRequestEnvelope(headers, "https://site.example")).toMatchObject({ status: 415 });
  });

  it("rejects hostile browser origins and cross-site fetch metadata", () => {
    const hostile = new Headers({ "content-type": "application/json", origin: "https://attacker.example" });
    expect(validateRequestEnvelope(hostile, "https://site.example")).toMatchObject({ status: 403 });
    const crossSite = new Headers({ "content-type": "application/json", "sec-fetch-site": "cross-site" });
    expect(validateRequestEnvelope(crossSite, "https://site.example")).toMatchObject({ status: 403 });
  });

  it("accepts same-origin JSON and rejects oversized declarations", () => {
    const valid = new Headers({ "content-type": "application/json; charset=utf-8", origin: "https://site.example" });
    expect(validateRequestEnvelope(valid, "https://site.example")).toBeNull();
    valid.set("content-length", String(MAX_CONTACT_BODY_BYTES + 1));
    expect(validateRequestEnvelope(valid, "https://site.example")).toMatchObject({ status: 413 });
  });

  it("measures UTF-8 bytes instead of JavaScript code units", () => {
    expect(contactBodyByteLength("é")).toBe(2);
  });

  it("prefers the Vercel-normalized client IP", () => {
    const headers = new Headers({ "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "198.51.100.9" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });
});

describe("Turnstile configuration", () => {
  it("allows only the fully disabled or fully paired states", () => {
    expect(resolveTurnstileConfiguration(undefined, undefined)).toEqual({ mode: "disabled" });
    expect(resolveTurnstileConfiguration("site", "secret")).toEqual({ mode: "enabled", secret: "secret" });
    expect(resolveTurnstileConfiguration("site", undefined)).toEqual({ mode: "invalid" });
    expect(resolveTurnstileConfiguration(undefined, "secret")).toEqual({ mode: "invalid" });
  });
});

describe("secondary in-memory rate limit", () => {
  it("limits a key, expires it, and caps key cardinality", () => {
    const limiter = new MemoryRateLimiter(2, 100, 2);
    expect(limiter.isLimited("a", 0)).toBe(false);
    expect(limiter.isLimited("a", 1)).toBe(false);
    expect(limiter.isLimited("a", 2)).toBe(true);
    expect(limiter.isLimited("b", 2)).toBe(false);
    expect(limiter.isLimited("c", 2)).toBe(false);
    expect(limiter.size).toBe(2);
    expect(limiter.isLimited("a", 200)).toBe(false);
  });
});
