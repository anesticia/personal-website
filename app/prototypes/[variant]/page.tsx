import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrototypeExperience, prototypeDirections, type PrototypeSlug } from "@/components/prototype-experience";

export function generateStaticParams() {
  return prototypeDirections.map(({ slug }) => ({ variant: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ variant: string }> }): Promise<Metadata> {
  const { variant } = await params;
  const direction = prototypeDirections.find((item) => item.slug === variant);
  if (!direction) return {};
  return {
    title: `${direction.name} — Homepage prototype`,
    description: direction.description,
    robots: { index: false, follow: false },
  };
}

export default async function PrototypeVariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!prototypeDirections.some((item) => item.slug === variant)) notFound();
  return <PrototypeExperience slug={variant as PrototypeSlug} />;
}
