import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
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
  const index = works.findIndex((item) => item.slug === slug);
  const next = works[(index + 1) % works.length];
  const jsonLd = { "@context": "https://schema.org", "@type": work.kind === "research" ? "ScholarlyArticle" : "SoftwareSourceCode", name: work.title, description: work.summary, author: { "@type": "Person", name: "Laurentius Andre Cornelis Rudolf Huizen" }, dateModified: work.lastVerified, url: `/work/${work.slug}` };
  return (
    <article className="work-page">
      <header className="work-hero section-pad"><div><Link className="back-link" href="/archive">← Archive</Link><p className="page-kicker">{work.eyebrow} · {work.year}</p><h1>{work.title}</h1><p>{work.summary}</p><div className="tag-list">{work.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></div>{work.image && <div className="work-hero-image"><Image src={work.image} alt={work.imageAlt ?? ""} fill priority sizes="(max-width: 900px) 100vw, 50vw" /></div>}</header>
      <section className="work-body section-pad"><aside><p className="section-number">Research record</p>{work.facts.map((fact) => <div className="fact" key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}<div className="fact"><span>Status</span><strong>{work.status}</strong></div><div className="fact"><span>Last verified</span><strong>{work.lastVerified}</strong></div></aside><div className="work-narrative"><h2>The work</h2>{work.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<h2>Contribution</h2><p>{work.contribution}</p><h2>Tools and methods</h2><div className="tech-list">{work.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div>{work.sourceUrl && <a className="button button-dark" href={work.sourceUrl} target="_blank" rel="noreferrer">{work.sourceLabel ?? "Open source"} <ExternalIcon /></a>}{!work.public && <p className="source-note">This project is documented from local research materials. Source access is not implied.</p>}</div></section>
      <footer className="next-work section-pad"><p className="section-number">Next in the archive</p><Link href={`/work/${next.slug}`}><span>{next.eyebrow}</span><strong>{next.title}</strong><ArrowIcon size={30} /></Link></footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}
