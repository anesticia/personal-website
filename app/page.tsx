import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { WorkRow } from "@/components/work-row";
import { publication, site, works } from "@/data/site";

export default function Home() {
  const featured = works.filter((work) => work.featured);
  return (
    <>
      <section className="hero">
        <div className="hero-image" aria-hidden="true"><Image src="/images/reaction-diffusion.png" alt="" fill priority sizes="100vw" /><div className="hero-shade" /></div>
        <div className="hero-copy">
          <p className="hero-kicker">Andre Huizen · Informatics researcher</p>
          <h1>Learning the rules<br /><em>inside complex systems.</em></h1>
          <p className="hero-intro">I work across scientific machine learning, partial differential equations, numerical simulation, and the software that makes research reproducible.</p>
          <div className="hero-actions"><Link className="button button-light" href="/research">Explore research <ArrowIcon /></Link><Link className="text-link light" href="/archive">Open the archive <ArrowIcon /></Link></div>
        </div>
        <div className="hero-caption"><span>01 / Reaction–diffusion</span><span>Pattern generated from a two-species PDE simulation</span></div>
      </section>

      <section className="statement section-pad">
        <Reveal><p className="section-number">01 — Research practice</p><h2>Equations are not only descriptions. <em>They are instruments for discovering what a system can become.</em></h2></Reveal>
        <Reveal className="statement-side" delay={120}><p>My work joins physical constraints with computational learning: building models that remain inspectable, benchmarking them against numerical references, and documenting when an experiment fails.</p><Link className="text-link" href="/about">More about the practice <ArrowIcon /></Link></Reveal>
      </section>

      <section className="featured section-pad">
        <div className="section-heading"><p className="section-number">02 — Selected work</p><h2>Current investigations</h2><Link className="text-link" href="/archive">View all work <ArrowIcon /></Link></div>
        <div className="work-list">{featured.map((work, index) => <Reveal key={work.slug} delay={index * 80}><WorkRow work={work} index={index} /></Reveal>)}</div>
      </section>

      <section className="publication-feature">
        <div className="publication-visual"><Image src="/images/gray-scott.png" alt="Bright spots emerging in a Gray–Scott reaction–diffusion field" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
        <Reveal className="publication-copy"><p className="section-number">03 — Publication</p><p className="publication-year">JSI · {publication.year}</p><h2>Edge information,<br />combined.</h2><p>{publication.title}</p><p className="publication-meta">{publication.venue}, {publication.volume}({publication.issue}), {publication.pages}</p><a className="button button-light" href={publication.url} target="_blank" rel="noreferrer">Read the paper <ExternalIcon /></a></Reveal>
      </section>

      <section className="method section-pad">
        <Reveal><p className="section-number">04 — Working method</p><h2>Model.<br />Measure.<br /><em>Revise.</em></h2></Reveal>
        <div className="method-steps">
          {[['01', 'Start from the physics', 'Encode the governing structure before optimizing the approximation.'], ['02', 'Build a numerical reference', 'Treat baselines and reproducible tests as part of the research object.'], ['03', 'Preserve negative results', 'Let failed experiments narrow the next question instead of disappearing.']].map(([n, title, copy], index) => <Reveal key={n} delay={index * 90}><article><span>{n}</span><h3>{title}</h3><p>{copy}</p></article></Reveal>)}
        </div>
      </section>

      <section className="closing-cta section-pad"><Reveal><p className="section-number">05 — Contact</p><h2>Interested in scientific models that explain <em>as much as they predict?</em></h2><div><Link className="button button-dark" href="/contact">Start a conversation <ArrowIcon /></Link><a className="text-link" href={site.orcid} target="_blank" rel="noreferrer">ORCID record <ExternalIcon /></a></div></Reveal></section>
    </>
  );
}
