import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { atlasRecordMap } from "@/data/atlas";
import { works } from "@/data/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return works.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = works.find((item) => item.slug === slug);
  if (!work) return {};
  return { title: work.title, description: work.summary, openGraph: work.image ? { images: [work.image] } : undefined };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = works.find((item) => item.slug === slug);
  if (!work) notFound();
  const record = atlasRecordMap.get(work.slug)!;
  const index = works.findIndex((item) => item.slug === slug);
  const next = works[(index + 1) % works.length];
  const jsonLd = { "@context": "https://schema.org", "@type": work.kind === "research" ? "ScholarlyArticle" : "SoftwareSourceCode", name: work.title, description: work.summary, author: { "@type": "Person", name: "Laurentius Andre Cornelis Rudolf Huizen" }, dateModified: work.lastVerified, url: `/work/${work.slug}` };

  return (
    <article className="atlas-work-page" style={{ "--record-accent": record.accent } as CSSProperties}>
      <header className="atlas-work-hero">
        <div className="atlas-work-heading"><Link className="atlas-back-link" href="/archive">← Research archive</Link><p className="atlas-kicker">{record.code} · {work.eyebrow} · {work.year}</p><h1>{work.title}</h1><p>{work.summary}</p><div className="atlas-work-status"><span>{work.status}</span><span>{record.source}</span><span>Verified {work.lastVerified}</span></div></div>
        {work.image ? <div className="atlas-work-hero-image"><Image src={work.image} alt={work.imageAlt ?? ""} fill priority sizes="(max-width: 900px) 100vw, 50vw" /></div> : <div className="atlas-work-hero-image atlas-work-hero-glyph" aria-hidden="true"><span>{record.code}</span><p>{record.orientation}<br />{record.context}<br />{record.scope}</p></div>}
      </header>

      <section className="atlas-work-coordinates"><p>Portfolio coordinate</p><dl><div><dt>Orientation</dt><dd>{record.orientation}</dd></div><div><dt>Context</dt><dd>{record.context}</dd></div><div><dt>Scope</dt><dd>{record.scope}</dd></div></dl></section>

      <section className="atlas-work-body section-pad">
        <aside><p className="atlas-kicker">Evidence boundary</p><h2>What this record can support.</h2><dl><div><dt>Question</dt><dd>{record.question}</dd></div><div><dt>Reference</dt><dd>{record.reference}</dd></div><div><dt>Current boundary</dt><dd>{record.boundary}</dd></div>{work.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></aside>
        <div className="atlas-work-narrative"><p className="atlas-kicker">Research dossier</p><h2>The work</h2>{work.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<h2>Contribution</h2><p>{work.contribution}</p><h2>Tools and methods</h2><div className="atlas-tech-list">{work.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>{work.sourceUrl ? <a className="atlas-action" href={work.sourceUrl} target="_blank" rel="noreferrer">{work.sourceLabel ?? "Open source"} <ExternalIcon /></a> : <p className="atlas-source-note">This project is documented from local research materials. Source access is not implied.</p>}</div>
      </section>

      <footer className="atlas-next-work section-pad"><p className="atlas-kicker">Next research coordinate</p><Link href={`/work/${next.slug}`}><span>{next.eyebrow}</span><strong>{next.title}</strong><ArrowIcon size={32} /></Link></footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
