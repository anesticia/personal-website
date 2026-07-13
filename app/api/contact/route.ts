import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(120),
  purpose: z.enum(["research", "academic", "engineering", "other"]),
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(0).optional(),
  turnstileToken: z.string().optional(),
});

const rateLimit = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (rateLimit.get(ip) ?? []).filter((stamp) => now - stamp < 60 * 60 * 1000);
  if (recent.length >= 5) return true;
  rateLimit.set(ip, [...recent, now]);
  return false;
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  form.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) return NextResponse.json({ message: "Too many messages. Please try again later." }, { status: 429 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ message: "Please check the form and try again." }, { status: 400 });
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) return NextResponse.json({ message: "Verification failed. Please try again." }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return NextResponse.json({ message: "Email delivery is not configured yet. Please use the GitHub link in the footer." }, { status: 503 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to: [to],
      reply_to: parsed.data.email,
      subject: `[Portfolio] ${parsed.data.purpose}: ${parsed.data.name}`,
      text: `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\nPurpose: ${parsed.data.purpose}\n\n${parsed.data.message}`,
    }),
  });

  if (!response.ok) return NextResponse.json({ message: "The message could not be delivered. Please try again later." }, { status: 502 });
  return NextResponse.json({ message: "Thank you. Your message has been sent." });
}
