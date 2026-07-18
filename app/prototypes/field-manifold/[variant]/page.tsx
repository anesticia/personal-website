import { notFound } from "next/navigation";
import { FieldManifoldExperience, type FieldManifoldSlug } from "@/components/field-manifold-experience";

const variants = ["force-fabric", "curvature-atlas", "tensor-coordinates", "method-collider"] as const;
export function generateStaticParams() { return variants.map(variant => ({ variant })); }
export default async function Page({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!variants.some(candidate => candidate === variant)) notFound();
  return <FieldManifoldExperience slug={variant as FieldManifoldSlug} />;
}
