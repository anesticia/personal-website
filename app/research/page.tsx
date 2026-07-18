import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { ResearchWaveField } from "@/components/research-wave-field";
import { Reveal } from "@/components/reveal";
import { atlasRecordMap } from "@/data/atlas";
import { publication, site, works } from "@/data/site";

export const metadata: Metadata = { title: "Research", description: "Research in scientific machine learning, PDEs, numerical simulation, and computer vision." };

export default function ResearchPage() {
  const research = works.filter((work) => work.kind === "research" && work.slug !== "object-classification-paper");
  return (
    <>
      <header className="atlas-page-hero atlas-research-hero">
        <div className="atlas-research-hero-copy"><p className="atlas-kicker">Research field · Scientific machine learning</p><h1>Learning with the structure of <em>the physical world.</em></h1><p>These investigations ask how equations, invariants, numerical solvers, and data can work together without hiding their disagreements.</p></div>
        <ResearchWaveField />
      </header>

      <section className="atlas-research-index section-pad">
        <header><p className="atlas-kicker">Active investigations · {String(research.length).padStart(2, "0")}</p><h2>Questions with an explicit reference.</h2><p>Each record names its comparison structure and current boundary before it presents a result.</p></header>
        <div className="atlas-research-list">{research.map((work, index) => {
          const record = atlasRecordMap.get(work.slug)!;
          return <Reveal key={work.slug}><article style={{ "--record-accent": record.accent } as CSSProperties}><header><span>0{index + 1}</span><p>{work.status} · {work.year}</p></header>{work.image && <Link className="atlas-research-image" href={`/work/${work.slug}`}><Image src={work.image} alt={work.imageAlt ?? ""} fill sizes="(max-width: 900px) 100vw, 44vw" /></Link>}<div className="atlas-research-copy"><p>{record.code} · {record.orientation}</p><h3>{work.title}</h3><p>{work.summary}</p><dl><div><dt>Question</dt><dd>{record.question}</dd></div><div><dt>Reference</dt><dd>{record.reference}</dd></div><div><dt>Boundary</dt><dd>{record.boundary}</dd></div></dl><Link className="atlas-text-link" href={`/work/${work.slug}`}>Open research record <ArrowIcon /></Link></div></article></Reveal>;
        })}</div>
      </section>

      <section className="atlas-publication-record">
        <div><p className="atlas-kicker">Publication record · Public evidence</p><span>{publication.year}</span></div>
        <div><h2>{publication.title}</h2><p>{publication.authors.join(", ")}</p><p><em>{publication.venue}</em> · {publication.volume}({publication.issue}) · {publication.pages}</p><p>DOI {publication.doi}</p></div>
        <a href={publication.url} target="_blank" rel="noreferrer" aria-label="Open publication"><ExternalIcon size={24} /></a>
      </section>

      <section className="atlas-research-identity section-pad"><p className="atlas-kicker">Attribution · Verified identity</p><h2>Follow the researcher, not an inferred profile.</h2><p>The ORCID record is the canonical researcher identifier. A Google Scholar profile is intentionally not linked until ownership and publication association can be verified.</p><a className="atlas-action" href={site.orcid} target="_blank" rel="noreferrer">View ORCID <ExternalIcon /></a></section>
    </>
  );
}
