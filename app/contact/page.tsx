import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Contact Andre Huizen about research, academic opportunities, or engineering work." };

export default function ContactPage() {
  return <div className="contact-page section-pad"><header><p className="page-kicker">Contact / Research & collaboration</p><h1>Bring a difficult system <em>into focus.</em></h1><p>I am open to research conversations, academic opportunities, and technically serious collaborations around scientific machine learning and simulation.</p></header><ContactForm /><aside><p className="section-number">A useful first message</p><ul><li>What problem are you working on?</li><li>Where does the physics or data come from?</li><li>What would a successful collaboration produce?</li></ul><p className="privacy-note">Messages are validated and delivered privately. Your address is used only to reply.</p></aside></div>;
}
