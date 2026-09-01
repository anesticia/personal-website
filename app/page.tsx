import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { EvidenceRegister } from "@/components/evidence-register";
import { PortfolioTopology } from "@/components/portfolio-topology";
import { Reveal } from "@/components/reveal";
import { publication, site } from "@/data/site";

export default function Home() {
  return (
    <>
      <section className="atlas-home-hero">
        <header className="atlas-home-intro">
          <p className="atlas-kicker">Portfolio topology · Four documented systems</p>
          <h1>Research has<br /><em>terrain.</em></h1>
          <p>The surface maps what each project is—not how good it is—across computational orientation, working context, and artifact scope.</p>
          <div><Link className="atlas-action" href="/research">Understand the research <ArrowIcon /></Link><Link className="atlas-text-link" href="/archive">Browse every record <ArrowIcon /></Link></div>
        </header>
        <PortfolioTopology />
      </section>

      <section className="atlas-home-register section-pad">
        <Reveal className="atlas-register-heading"><div><h2><span>The graph locates.</span><em>The register qualifies.</em></h2></div><p>Compare what each project asks, which reference or protocol makes the question testable, and where the current claim stops.</p></Reveal>
        <EvidenceRegister />
      </section>

      <section className="atlas-publication">
        <div className="atlas-publication-index" aria-label="Publication record identifier"><span>PUBLIC<br />RECORD</span><strong>01</strong><p>Peer-reviewed article<br />Open DOI record<br />Study-split evidence</p></div>
        <Reveal className="atlas-publication-copy"><p className="atlas-kicker">Published evidence · {publication.year}</p><h2>One public record.<br /><em>Methods exposed.</em></h2><p>{publication.title}</p><dl><div><dt>Venue</dt><dd>{publication.venue}</dd></div><div><dt>Volume</dt><dd>{publication.volume}({publication.issue}), {publication.pages}</dd></div><div><dt>DOI</dt><dd>{publication.doi}</dd></div></dl><a className="atlas-action atlas-action-light" href={publication.url} target="_blank" rel="noreferrer">Read the paper <ExternalIcon /></a></Reveal>
      </section>

      <section className="atlas-closing section-pad"><Reveal><h2>Interested in scientific models that explain <em>as much as they predict?</em></h2><div><Link className="atlas-action" href="/contact">Start a conversation <ArrowIcon /></Link><a className="atlas-text-link" href={site.orcid} target="_blank" rel="noreferrer">ORCID record <ExternalIcon /></a></div></Reveal></section>
    </>
  );
}
