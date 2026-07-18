import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhysicsPrototypeExperience, physicsDirections, type PhysicsSlug } from "@/components/physics-prototype-experience";

export function generateStaticParams() {
  return physicsDirections.map(({ slug }) => ({ variant: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ variant: string }> }): Promise<Metadata> {
  const { variant } = await params;
  const direction = physicsDirections.find((item) => item.slug === variant);
  if (!direction) return {};
  return { title: `${direction.name} — Physics Atlas prototype`, description: direction.description, robots: { index: false, follow: false } };
}

export default async function PhysicsVariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!physicsDirections.some((item) => item.slug === variant)) notFound();
  return <PhysicsPrototypeExperience slug={variant as PhysicsSlug} />;
}
