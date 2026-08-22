import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { researchDossierMap } from "@/data/research-dossiers";
import type { Work } from "@/data/site";

export function WorkRow({ work, index }: { work: Work; index: number }) {
  const dossier = researchDossierMap.get(work.slug);
  return (
    <Link className="work-row" href={`/work/${work.slug}`}>
      <span className="work-index">{String(index + 1).padStart(2, "0")}</span>
      <div className="work-copy">
        <p className="eyebrow">{work.eyebrow}</p>
        <h3>{work.title}</h3>
      </div>
      <p className="work-summary">{work.summary}</p>
      <div className="work-meta"><span>{dossier?.maturity ?? work.status}</span><span>{work.year}</span><span>Verified {dossier?.updated ?? work.lastVerified}</span></div>
      <span className="work-arrow"><ArrowIcon /></span>
    </Link>
  );
}
