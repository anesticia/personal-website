import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Contact Andre Huizen about research, academic opportunities, or engineering work." };

export default function ContactPage() {
  return (
    <div className="atlas-contact-page">
      <header><p className="atlas-kicker">Contact</p><h1>Send me a message.</h1><p>For research, academic, or engineering work. I’ll reply by email.</p></header>
      <section className="atlas-contact-workspace">
        <ContactForm />
      </section>
    </div>
  );
}
