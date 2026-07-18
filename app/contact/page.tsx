import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Contact Andre Huizen about research, academic opportunities, or engineering work." };

export default function ContactPage() {
  return (
    <div className="atlas-contact-page">
      <header><p className="atlas-kicker">Contact · Research and collaboration</p><h1>Bring a difficult system <em>into focus.</em></h1><p>I am open to research conversations, academic opportunities, and technically serious collaborations around scientific machine learning and simulation.</p></header>
      <section className="atlas-contact-workspace">
        <ContactForm />
        <aside><p className="atlas-kicker">A useful first message</p><h2>Give the problem a boundary.</h2><ol><li><span>01</span><p>What system or decision are you working on?</p></li><li><span>02</span><p>Where do the physics, rules, or data come from?</p></li><li><span>03</span><p>What would a useful result make possible?</p></li></ol><p className="privacy-note">Messages are validated and delivered privately. Your address is used only to reply.</p></aside>
      </section>
    </div>
  );
}
