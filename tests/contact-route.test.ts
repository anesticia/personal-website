import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/contact/route";
import { MAX_CONTACT_BODY_BYTES } from "@/lib/contact-security";

const originalEnv = { ...process.env };
const validBody = JSON.stringify({
  name: "Local Test",
  email: "test@example.com",
  purpose: "other",
  message: "This is a local regression test message.",
  website: "",
});

let requestNumber = 1;

function request(body = validBody, headers: HeadersInit = {}) {
  requestNumber += 1;
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "x-vercel-forwarded-for": "192.0.2." + requestNumber,
      ...headers,
    },
  });
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("POST /api/contact security boundary", () => {
  it("rejects the original cross-origin text/plain primitive before any upstream call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(request(validBody, { "content-type": "text/plain", origin: "https://attacker.example" }));
    expect(response.status).toBe(415);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects hostile-origin JSON before any upstream call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(request(validBody, { origin: "https://attacker.example" }));
    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before JSON parsing", async () => {
    const response = await POST(request("x".repeat(MAX_CONTACT_BODY_BYTES + 1), {
      "content-length": String(MAX_CONTACT_BODY_BYTES + 1),
    }));
    expect(response.status).toBe(413);
  });

  it("fails closed when exactly one Turnstile half is configured", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    delete process.env.TURNSTILE_SECRET_KEY;
    process.env.RESEND_API_KEY = "local-test";
    process.env.CONTACT_TO_EMAIL = "owner@example.test";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("marks every API response as non-cacheable", async () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_TO_EMAIL;
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });
});
