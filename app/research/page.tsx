import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { ResearchWaveField } from "@/components/research-wave-field";
import { Reveal } from "@/components/reveal";
import { atlasRecordMap } from "@/data/atlas";
import { researchDossierMap } from "@/data/research-dossiers";
import { publication, site, works } from "@/data/site";

export const metadata: Metadata = { title: "Research", description: "Current, evidence-bounded research in scientific machine learning, PDEs, numerical simulation, and research software." };

const primarySlugs = ["reaction-diffusion", "orbit-pinn", "wave-pinn-thesis"];
const systemsSlugs = ["codex-chess-lab", "geoguesser-engine"];

export default function ResearchPage() {
  const primary = primarySlugs.map((slug) => works.find((work) => work.slug === slug)!);
  const systems = systemsSlugs.map((slug) => works.find((work) => work.slug === slug)!);
  return (
    <>
      <header className="atlas-page-hero atlas-research-hero">
        <div className="atlas-research-hero-copy"><h1>Learning with the structure of <em>the physical world.</em></h1><p>Enter quickly through the question and current state. Open a dossier when you need equations, protocol, checkpoints, failures, provenance, and the next gate.</p></div>
        <ResearchWaveField />
      </header>

      <section className="atlas-research-index section-pad research-programs">
        <div className="atlas-research-list">{primary.map((work, index) => <ResearchRecord key={work.slug} work={work} index={index} />)}</div>
      </section>

      <section className="research-systems section-pad">
        <header><p className="atlas-kicker">Research engineering · 02 systems</p><h2>The protocol is part of the product.</h2><p>These systems turn experimentation into a repeatable instrument. Their current blocker or promotion gate is displayed before any aspirational capability.</p></header>
        <div>{systems.map((work) => { const record = atlasRecordMap.get(work.slug)!; const dossier = researchDossierMap.get(work.slug)!; return (
          <Reveal key={work.slug}><Link className="research-system-row" href={`/work/${work.slug}`} style={{ "--record-accent": record.accent } as CSSProperties}>
            <span>{record.code}</span><div><p>{work.eyebrow}</p><h3>{work.title}</h3></div><p>{dossier.oneLineClaim}</p><dl><div><dt>State</dt><dd>{dossier.maturity}</dd></div><div><dt>Next gate</dt><dd>{dossier.nextGate.title}</dd></div></dl><ArrowIcon />
          </Link></Reveal>
        ); })}</div>
      </section>

      <section className="atlas-publication-record research-publication-record">
        <div><p className="atlas-kicker">Published evidence · Public record</p><span>{publication.year}</span></div>
        <div><h2>{publication.title}</h2><p>{publication.authors.join(", ")}</p><p><em>{publication.venue}</em> · {publication.volume}({publication.issue}) · {publication.pages}</p><p>DOI {publication.doi}</p><Link className="atlas-text-link" href="/work/object-classification-paper">Open evidence dossier <ArrowIcon /></Link></div>
        <a href={publication.url} target="_blank" rel="noreferrer" aria-label="Open publication"><ExternalIcon size={24} /></a>
      </section>

      <section className="atlas-research-identity section-pad"><p className="atlas-kicker">Attribution · Verified identity</p><h2>Follow the researcher, not an inferred profile.</h2><p>The ORCID record is the canonical researcher identifier. A Google Scholar profile is intentionally not linked until ownership and publication association can be verified.</p><a className="atlas-action" href={site.orcid} target="_blank" rel="noreferrer">View ORCID <ExternalIcon /></a></section>
    </>
  );
}

function ResearchRecord({ work, index }: { work: (typeof works)[number]; index: number }) {
  const record = atlasRecordMap.get(work.slug)!;
  const dossier = researchDossierMap.get(work.slug)!;
  return (
    <Reveal>
      <article style={{ "--record-accent": record.accent } as CSSProperties}>
        <header><span>0{index + 1}</span><p>{dossier.maturity} · {work.year}</p></header>
        {work.image && <Link className={`atlas-research-image${work.slug === "orbit-pinn" ? " atlas-research-image--contain" : ""}`} href={`/work/${work.slug}`}><Image src={work.image} alt={work.imageAlt ?? ""} fill sizes="(max-width: 900px) 100vw, 44vw" /></Link>}
        <div className="atlas-research-copy"><p>{record.code} · {record.orientation}</p><h3>{work.title}</h3><p>{dossier.oneLineClaim}</p><dl><div><dt>Question</dt><dd>{record.question}</dd></div><div><dt>Reference</dt><dd>{record.reference}</dd></div><div><dt>Boundary</dt><dd>{record.boundary}</dd></div><div><dt>Evidence class</dt><dd>{dossier.evidenceClass}</dd></div></dl><Link className="atlas-text-link" href={`/work/${work.slug}`}>Open complete dossier <ArrowIcon /></Link></div>
      </article>
    </Reveal>
  );
}
