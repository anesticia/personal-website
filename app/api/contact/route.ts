import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CONTACT_RATE_WINDOW_MS,
  MAX_CONTACT_BODY_BYTES,
  MemoryRateLimiter,
  contactBodyByteLength,
  containsControlCharacters,
  getClientIp,
  resolveTurnstileConfiguration,
  validateRequestEnvelope,
} from "@/lib/contact-security";

export const runtime = "nodejs";
export const maxDuration = 10;

const TURNSTILE_TIMEOUT_MS = 5_000;
const RESEND_TIMEOUT_MS = 8_000;

const schema = z.object({
  name: z.string().trim().min(2).max(80).refine((value) => !containsControlCharacters(value)),
  email: z.email().max(120),
  purpose: z.enum(["research", "academic", "engineering", "other"]),
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(0).optional(),
  turnstileToken: z.string().max(2048).optional(),
});

const rateLimit = new MemoryRateLimiter();

function json(message: string, status = 200, headers?: HeadersInit) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store, max-age=0", Vary: "Origin", ...headers } },
  );
}

async function verifyTurnstile(secret: string, token: string | undefined, ip: string) {
  if (!token) return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  form.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const envelopeRejection = validateRequestEnvelope(request.headers, request.nextUrl.origin);
  if (envelopeRejection) return json(envelopeRejection.message, envelopeRejection.status);

  const ip = getClientIp(request.headers);
  if (rateLimit.isLimited(ip)) {
    return json("Too many messages. Please try again later.", 429, {
      "Retry-After": String(Math.ceil(CONTACT_RATE_WINDOW_MS / 1000)),
    });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json("Invalid request.", 400);
  }
  if (contactBodyByteLength(rawBody) > MAX_CONTACT_BODY_BYTES) return json("Request is too large.", 413);

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json("Invalid request.", 400);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) return json("Please check the form and try again.", 400);

  const turnstile = resolveTurnstileConfiguration(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    process.env.TURNSTILE_SECRET_KEY,
  );
  if (turnstile.mode === "invalid") return json("Contact verification is not configured correctly.", 503);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return json("Email delivery is not configured yet. Please use the GitHub link in the footer.", 503);

  if (turnstile.mode === "enabled" && !(await verifyTurnstile(turnstile.secret, parsed.data.turnstileToken, ip))) {
    return json("Verification failed. Please try again.", 400);
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: parsed.data.email,
        subject: "[Portfolio] " + parsed.data.purpose + ": " + parsed.data.name,
        text:
          "Name: " + parsed.data.name +
          "\nEmail: " + parsed.data.email +
          "\nPurpose: " + parsed.data.purpose +
          "\n\n" + parsed.data.message,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });

    if (!response.ok) return json("The message could not be delivered. Please try again later.", 502);
  } catch {
    return json("The message could not be delivered. Please try again later.", 502);
  }

  return json("Thank you. Your message has been sent.");
}
