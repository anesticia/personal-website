import type { Metadata } from "next";
import { PrototypeIndex } from "@/components/prototype-experience";

export const metadata: Metadata = {
  title: "Homepage interface prototypes",
  description: "Ten structurally distinct comparison studies for the Andre Huizen research website.",
  robots: { index: false, follow: false },
};

export default function PrototypesPage() {
  return <PrototypeIndex />;
}
