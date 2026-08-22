import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DossierRail, type DossierChapter } from "@/components/dossier-rail";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { ReactionDiffusionHorizon } from "@/components/reaction-diffusion-horizon";
import { atlasRecordMap } from "@/data/atlas";
import { researchDossierMap } from "@/data/research-dossiers";
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
  const record = work ? atlasRecordMap.get(work.slug) : undefined;
  const dossier = work ? researchDossierMap.get(work.slug) : undefined;
  if (!work || !record || !dossier) notFound();

  const chapters: DossierChapter[] = [
    { id: "orientation", label: "Orientation", index: "00" },
    { id: "problem", label: "Problem", index: "01" },
    { id: "governing-structure", label: "Governing structure", index: "02" },
    { id: "architecture", label: "Architecture", index: "03" },
    { id: "evaluation", label: "Evaluation", index: "04" },
    { id: "checkpoint", label: "Checkpoint", index: "05" },
    ...(dossier.figures.length ? [{ id: "representative-figures", label: "Figures", index: "06" }] : []),
    { id: "limitations", label: "Limitations", index: dossier.figures.length ? "07" : "06" },
    { id: "reproducibility", label: "Reproducibility", index: dossier.figures.length ? "08" : "07" },
    { id: "next-gate", label: "Next gate", index: dossier.figures.length ? "09" : "08" },
  ];

  const index = works.findIndex((item) => item.slug === slug);
  const next = works[(index + 1) % works.length];
  const related = dossier.related.map((relatedSlug) => works.find((item) => item.slug === relatedSlug)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": work.kind === "research" ? "ScholarlyArticle" : "SoftwareSourceCode",
    name: work.title,
    description: work.summary,
    author: { "@type": "Person", name: "Laurentius Andre Cornelis Rudolf Huizen" },
    dateModified: dossier.updated,
    url: `/work/${work.slug}`,
  };

  return (
    <article className="dossier-page" style={{ "--record-accent": record.accent } as CSSProperties}>
      <header className="dossier-hero" id="orientation">
        <div className="dossier-hero-copy">
          <Link className="atlas-back-link" href="/research">← Research field</Link>
          <p className="atlas-kicker">{record.code} · Complete research dossier · {work.year}</p>
          <h1>{work.title}</h1>
          <p className="dossier-deck">{dossier.oneLineClaim}</p>
          <div className="dossier-status-line">
            <span><i />{dossier.maturity}</span>
            <span>{dossier.evidenceClass}</span>
            <span>Verified {dossier.updated}</span>
          </div>
        </div>
        {work.slug === "reaction-diffusion" ? (
          <ReactionDiffusionHorizon />
        ) : work.image ? (
          <figure className="dossier-hero-image">
            <Image src={work.image} alt={work.imageAlt ?? ""} fill priority sizes="(max-width: 900px) 100vw, 48vw" />
            <figcaption>Primary visual record · {record.source}</figcaption>
          </figure>
        ) : (
          <div className="dossier-hero-ledger" aria-label="Current project coordinate">
            <span>Current coordinate / {record.code}</span>
            <dl>
              <div><dt>Orientation</dt><dd>{record.orientation}</dd></div>
              <div><dt>Context</dt><dd>{record.context}</dd></div>
              <div><dt>Scope</dt><dd>{record.scope}</dd></div>
              <div><dt>Evidence</dt><dd>{dossier.evidenceClass}</dd></div>
            </dl>
          </div>
        )}
      </header>

      <div className="dossier-coordinate-strip">
        <p>Portfolio coordinate</p>
        <dl>
          <div><dt>Orientation</dt><dd>{record.orientation}</dd></div>
          <div><dt>Context</dt><dd>{record.context}</dd></div>
          <div><dt>Scope</dt><dd>{record.scope}</dd></div>
          <div><dt>Boundary</dt><dd>{record.boundary}</dd></div>
        </dl>
      </div>

      <div className="dossier-shell section-pad">
        <DossierRail chapters={chapters} />
        <main className="dossier-content">
          <section className="dossier-chapter dossier-problem" id="problem">
            <ChapterHeading index="01" kicker="Physical problem" title={dossier.problem.title} />
            <div className="dossier-reading-copy">{dossier.problem.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </section>

          <section className="dossier-chapter" id="governing-structure">
            <ChapterHeading index="02" kicker="Governing structure" title="The constraints are part of the interface." />
            <div className="dossier-equations">
              {dossier.governing.map((equation) => <article key={equation.label}><span>{equation.label}</span><p>{equation.expression}</p><small>{equation.note}</small></article>)}
            </div>
          </section>

          <section className="dossier-chapter" id="architecture">
            <ChapterHeading index="03" kicker="Model architecture" title="How the research object is assembled." />
            <div className="dossier-method-grid">
              {dossier.architecture.map((item, itemIndex) => <article key={item.title}><span>{String(itemIndex + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}
            </div>
          </section>

          <section className="dossier-chapter dossier-evaluation" id="evaluation">
            <ChapterHeading index="04" kicker="Baseline and evaluation protocol" title="The comparison must stay visible." />
            <ol>{dossier.protocol.map((item, itemIndex) => <li key={item}><span>{String(itemIndex + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>
          </section>

          <section className="dossier-chapter" id="checkpoint">
            <ChapterHeading index="05" kicker="Latest checkpoint" title="Numbers with their conditions attached." />
            <div className="dossier-metric-grid">
              {dossier.metrics.map((metric) => <article key={metric.label} data-tone={metric.tone ?? "neutral"}><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.note}</p></article>)}
            </div>
          </section>

          {dossier.figures.length > 0 && (
            <section className="dossier-chapter" id="representative-figures">
              <ChapterHeading index="06" kicker="Representative figures" title="One figure should answer one question." />
              <div className="dossier-figures">
                {dossier.figures.map((figure) => <figure key={figure.src}><div><Image src={figure.src} alt={figure.alt} fill sizes="(max-width: 900px) 100vw, 68vw" /></div><figcaption><span>{figure.label}</span><p>{figure.caption}</p></figcaption></figure>)}
              </div>
            </section>
          )}

          <section className="dossier-chapter dossier-limitations" id="limitations">
            <ChapterHeading index={dossier.figures.length ? "07" : "06"} kicker="Failure modes and limits" title="Where the claim must stop." />
            <ul>{dossier.limitations.map((item, itemIndex) => <li key={item}><span>{String(itemIndex + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ul>
          </section>

          <section className="dossier-chapter" id="reproducibility">
            <ChapterHeading index={dossier.figures.length ? "08" : "07"} kicker="Reproducibility manifest" title="Enough identity to find the evidence again." />
            <dl className="dossier-manifest">{dossier.reproducibility.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
            <details className="dossier-provenance"><summary>Open provenance register <span>+</span></summary><div>{dossier.sources.map((source) => <p key={source.label}><strong>{source.label}</strong>{source.href ? <a href={source.href} target="_blank" rel="noreferrer">{source.detail} <ExternalIcon size={14} /></a> : <span>{source.detail}</span>}</p>)}</div></details>
          </section>

          <section className="dossier-chapter dossier-next-gate" id="next-gate">
            <ChapterHeading index={dossier.figures.length ? "09" : "08"} kicker="Next gate" title={dossier.nextGate.title} />
            <p>{dossier.nextGate.body}</p>
            <ol>{dossier.nextGate.criteria.map((criterion, itemIndex) => <li key={criterion}><span>{itemIndex + 1}</span><p>{criterion}</p></li>)}</ol>
          </section>

          <section className="dossier-related" aria-labelledby="related-title">
            <p className="atlas-kicker">Related research coordinates</p>
            <h2 id="related-title">Continue across the field.</h2>
            <div>{related.map((item) => { const relatedRecord = atlasRecordMap.get(item.slug)!; return <Link key={item.slug} href={`/work/${item.slug}`}><span>{relatedRecord.code}</span><strong>{item.title}</strong><small>{relatedRecord.orientation} · {relatedRecord.context}</small><ArrowIcon /></Link>; })}</div>
          </section>
        </main>
      </div>

      <footer className="atlas-next-work section-pad"><p className="atlas-kicker">Next archive record</p><Link href={`/work/${next.slug}`}><span>{next.eyebrow}</span><strong>{next.title}</strong><ArrowIcon size={32} /></Link></footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </article>
  );
}

function ChapterHeading({ index, kicker, title }: { index: string; kicker: string; title: string }) {
  return <header className="dossier-chapter-heading"><span>{index}</span><div><p className="atlas-kicker">{kicker}</p><h2>{title}</h2></div></header>;
}
