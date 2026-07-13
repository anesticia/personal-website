import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { publication, site, works } from "@/data/site";

export const metadata: Metadata = { title: "Research", description: "Research in scientific machine learning, PDEs, numerical simulation, and computer vision." };

export default function ResearchPage() {
  const research = works.filter((work) => work.kind === "research" && work.slug !== "object-classification-paper");
  return (
    <>
      <header className="page-hero research-hero section-pad"><p className="page-kicker">Research / Scientific machine learning</p><h1>Learning with the structure of <em>the physical world.</em></h1><p className="page-lede">My research asks how equations, invariants, numerical solvers, and data can work together without hiding their disagreements.</p></header>
      <section className="research-themes section-pad">{research.map((work, index) => <Reveal key={work.slug} className="theme"><div className="theme-head"><span>0{index + 1}</span><p>{work.eyebrow}</p></div>{work.image && <Link href={`/work/${work.slug}`} className="theme-image"><Image src={work.image} alt={work.imageAlt ?? ""} fill sizes="(max-width: 900px) 100vw, 42vw" /></Link>}<div className="theme-copy"><h2>{work.title}</h2><p>{work.summary}</p><Link className="text-link" href={`/work/${work.slug}`}>Open research note <ArrowIcon /></Link></div></Reveal>)}</section>
      <section className="publication-record section-pad"><p className="section-number">Publication record</p><div className="citation"><span>{publication.year}</span><div><h2>{publication.title}</h2><p>{publication.authors.join(", ")}</p><p><em>{publication.venue}</em>, {publication.volume}({publication.issue}), {publication.pages}</p><p>DOI: {publication.doi}</p></div><a className="round-link" href={publication.url} target="_blank" rel="noreferrer" aria-label="Open publication"><ExternalIcon size={22} /></a></div></section>
      <section className="research-note section-pad"><p className="section-number">Research identity</p><h2>Profiles and attribution</h2><p>The ORCID record is the canonical researcher identifier. A Google Scholar profile is intentionally not linked until its ownership and publication association can be verified.</p><a className="button button-dark" href={site.orcid} target="_blank" rel="noreferrer">View ORCID <ExternalIcon /></a></section>
    </>
  );
}
