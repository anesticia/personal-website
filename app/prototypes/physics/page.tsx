import type { Metadata } from "next";
import { PhysicsPrototypeIndex } from "@/components/physics-prototype-experience";

export const metadata: Metadata = {
  title: "Physics Atlas homepage prototypes",
  description: "Ten physics and mathematics interface variations derived from the spatial research-map concept.",
  robots: { index: false, follow: false },
};

export default function PhysicsPrototypesPage() {
  return <PhysicsPrototypeIndex />;
}
