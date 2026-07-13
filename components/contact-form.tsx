"use client";

import { FormEvent, useState } from "react";
import Script from "next/script";
import { ArrowIcon } from "@/components/icons";

type State = { status: "idle" | "sending" | "success" | "error"; message: string };

export function ContactForm() {
  const [state, setState] = useState<State>({ status: "idle", message: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "sending", message: "Sending…" });
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form)) as Record<string, FormDataEntryValue>;
    body.turnstileToken = body["cf-turnstile-response"] ?? "";
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "The message could not be sent.");
      form.reset();
      setState({ status: "success", message: result.message || "Thank you. Your message has been sent." });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "The message could not be sent." });
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}
      <div className="form-grid">
        <label><span>Name</span><input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>
        <label><span>Email</span><input name="email" type="email" autoComplete="email" required maxLength={120} /></label>
      </div>
      <label><span>What would you like to discuss?</span><select name="purpose" defaultValue="research"><option value="research">Research collaboration</option><option value="academic">Academic opportunity</option><option value="engineering">Engineering project</option><option value="other">Something else</option></select></label>
      <label><span>Message</span><textarea name="message" required minLength={20} maxLength={4000} rows={7} /></label>
      <label className="honeypot" aria-hidden="true"><span>Company website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />}
      <div className="form-action"><button className="button button-dark" type="submit" disabled={state.status === "sending"}>Send message <ArrowIcon /></button><p className={`form-status ${state.status}`} role="status">{state.message}</p></div>
    </form>
  );
}
