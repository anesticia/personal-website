import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { EvidenceRegister } from "@/components/evidence-register";
import { PortfolioTopology } from "@/components/portfolio-topology";
import { Reveal } from "@/components/reveal";
import { publication, site } from "@/data/site";

const axes = [
  ["x", "Method orientation", "Forward simulation and search → learned inference"],
  ["z", "Working context", "Physical systems → software and data systems"],
  ["y", "Artifact scope", "Focused study → reusable research system"],
];

export default function Home() {
  return (
    <>
      <section className="atlas-home-hero">
        <header className="atlas-home-intro">
          <p className="atlas-kicker">Portfolio topology · Six documented systems</p>
          <h1>Research has<br /><em>terrain.</em></h1>
          <p>The surface maps what each project is—not how good it is—across computational orientation, working context, and artifact scope.</p>
          <div><Link className="atlas-action" href="/research">Understand the research <ArrowIcon /></Link><Link className="atlas-text-link" href="/archive">Browse every record <ArrowIcon /></Link></div>
        </header>
        <PortfolioTopology />
      </section>

      <section className="atlas-contract">
        <Reveal className="atlas-contract-heading"><p className="atlas-kicker">Graph contract · Navigational model</p><h2>Three axes.<br /><em>No hidden score.</em></h2><p>Topology is useful only when its abstraction is visible. The graph positions projects by type and traces exact shared-method labels; it never ranks research quality.</p></Reveal>
        <ol>{axes.map(([axis, title, description], index) => <Reveal key={axis} delay={index * 80}><li><span>{axis}</span><div><h3>{title}</h3><p>{description}</p></div></li></Reveal>)}</ol>
      </section>

      <section className="atlas-home-register section-pad">
        <Reveal className="atlas-register-heading"><div><p className="atlas-kicker">Evidence register · Verification layer</p><h2>The graph locates.<br /><em>The register qualifies.</em></h2></div><p>Compare what each project asks, which reference or protocol makes the question testable, and where the current claim stops.</p></Reveal>
        <EvidenceRegister />
      </section>

      <section className="atlas-publication">
        <div className="atlas-publication-image"><Image src="/images/numerical-methods.26abe82439e0.webp" alt="Six numerical methods compared on the same reaction–diffusion system" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
        <Reveal className="atlas-publication-copy"><p className="atlas-kicker">Published evidence · {publication.year}</p><h2>One public record.<br /><em>Methods exposed.</em></h2><p>{publication.title}</p><dl><div><dt>Venue</dt><dd>{publication.venue}</dd></div><div><dt>Volume</dt><dd>{publication.volume}({publication.issue}), {publication.pages}</dd></div><div><dt>DOI</dt><dd>{publication.doi}</dd></div></dl><a className="atlas-action atlas-action-light" href={publication.url} target="_blank" rel="noreferrer">Read the paper <ExternalIcon /></a></Reveal>
      </section>

      <section className="atlas-method section-pad">
        <Reveal><p className="atlas-kicker">Research practice · Operating sequence</p><h2>Model.<br />Measure.<br /><em>Revise.</em></h2></Reveal>
        <div>{[
          ["01", "Start from governing structure", "Encode equations, constraints, or explicit system rules before optimizing an approximation."],
          ["02", "Build a reference", "Treat numerical baselines, paired tests, and reproducible protocols as part of the research object."],
          ["03", "Preserve the boundary", "Document uncertainty, incomplete milestones, and negative results instead of rewriting them as success."],
        ].map(([number, title, copy], index) => <Reveal key={number} delay={index * 80}><article><span>{number}</span><h3>{title}</h3><p>{copy}</p></article></Reveal>)}</div>
      </section>

      <section className="atlas-closing section-pad"><Reveal><p className="atlas-kicker">Next coordinate · Conversation</p><h2>Interested in scientific models that explain <em>as much as they predict?</em></h2><div><Link className="atlas-action" href="/contact">Start a conversation <ArrowIcon /></Link><a className="atlas-text-link" href={site.orcid} target="_blank" rel="noreferrer">ORCID record <ExternalIcon /></a></div></Reveal></section>
    </>
  );
}
