export const MAX_CONTACT_BODY_BYTES = 16 * 1024;
export const CONTACT_RATE_LIMIT = 5;
export const CONTACT_RATE_WINDOW_MS = 60 * 60 * 1000;
export const CONTACT_RATE_MAX_KEYS = 1_000;

export type RequestRejection = { status: 400 | 403 | 413 | 415; message: string };

export function validateRequestEnvelope(headers: Headers, expectedOrigin: string): RequestRejection | null {
  const mediaType = headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") return { status: 415, message: "Unsupported media type." };

  const fetchSite = headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") return { status: 403, message: "Cross-origin submission rejected." };

  const origin = headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== expectedOrigin) return { status: 403, message: "Cross-origin submission rejected." };
    } catch {
      return { status: 403, message: "Cross-origin submission rejected." };
    }
  }

  const declaredLength = headers.get("content-length");
  if (declaredLength) {
    if (!/^\d+$/.test(declaredLength)) return { status: 400, message: "Invalid request." };
    if (Number(declaredLength) > MAX_CONTACT_BODY_BYTES) return { status: 413, message: "Request is too large." };
  }

  return null;
}

export function contactBodyByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  return forwarded?.split(",", 1)[0]?.trim() || "unknown";
}

export type TurnstileConfiguration =
  | { mode: "disabled" }
  | { mode: "enabled"; secret: string }
  | { mode: "invalid" };

export function resolveTurnstileConfiguration(siteKey: string | undefined, secret: string | undefined): TurnstileConfiguration {
  const hasSiteKey = Boolean(siteKey?.trim());
  const hasSecret = Boolean(secret?.trim());
  if (hasSiteKey !== hasSecret) return { mode: "invalid" };
  if (!hasSecret) return { mode: "disabled" };
  return { mode: "enabled", secret: secret!.trim() };
}

export function containsControlCharacters(value: string) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

export class MemoryRateLimiter {
  private readonly entries = new Map<string, number[]>();

  constructor(
    private readonly limit = CONTACT_RATE_LIMIT,
    private readonly windowMs = CONTACT_RATE_WINDOW_MS,
    private readonly maxKeys = CONTACT_RATE_MAX_KEYS,
  ) {}

  isLimited(key: string, now = Date.now()) {
    for (const [candidate, stamps] of this.entries) {
      const recent = stamps.filter((stamp) => now - stamp < this.windowMs);
      if (recent.length === 0) this.entries.delete(candidate);
      else if (recent.length !== stamps.length) this.entries.set(candidate, recent);
    }

    const recent = this.entries.get(key) ?? [];
    if (recent.length >= this.limit) return true;

    if (!this.entries.has(key) && this.entries.size >= this.maxKeys) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (oldestKey) this.entries.delete(oldestKey);
    }
    this.entries.set(key, [...recent, now]);
    return false;
  }

  get size() {
    return this.entries.size;
  }
}
