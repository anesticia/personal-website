import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "About", description: "About Andre Huizen's research practice, interests, and academic background." };

export default function AboutPage() {
  return (
    <>
      <header className="page-hero section-pad"><p className="page-kicker">About / 01</p><h1>Research should leave a trail <em>someone else can follow.</em></h1><p className="page-lede">I am Laurentius Andre Cornelis Rudolf Huizen—usually Andre—an Informatics student and independent researcher in Yogyakarta, Indonesia.</p></header>
      <section className="about-grid section-pad">
        <Reveal className="about-image"><Image src="/images/numerical-methods.26abe82439e0.webp" alt="Six numerical methods compared on the same reaction–diffusion system" fill sizes="(max-width: 900px) 100vw, 48vw" /></Reveal>
        <Reveal className="about-copy" delay={100}><p className="section-number">Position</p><h2>Between mathematical structure and computational experiment.</h2><p>My central interest is scientific machine learning: using physical knowledge, differential equations, and numerical references to make learning systems more trustworthy and useful.</p><p>I also build software experiments—chess engines, geolocation tools, desktop applications—because implementation exposes questions that theory alone can hide.</p><p>My work favors explicit assumptions, reproducible baselines, and honest status reporting. Negative results are evidence, not clutter.</p></Reveal>
      </section>
      <section className="timeline section-pad"><p className="section-number">Academic path</p><div className="timeline-row"><span>2022 — present</span><div><h3>Informatics</h3><p>Atma Jaya University Yogyakarta · Department of Informatics</p></div></div><div className="timeline-row"><span>2023</span><div><h3>First journal publication</h3><p>Object classification using ensemble learning, edge detection, and histogram features.</p></div></div><div className="timeline-row"><span>Current</span><div><h3>Scientific machine learning</h3><p>Wave propagation, reaction–diffusion systems, and physics-informed trajectory learning.</p></div></div></section>
      <section className="identity-links section-pad"><h2>Verified identity</h2><div><a href={site.orcid} target="_blank" rel="noreferrer"><span>ORCID</span><strong>0009-0002-0300-9169</strong><ExternalIcon /></a><a href={site.github} target="_blank" rel="noreferrer"><span>GitHub</span><strong>@anesticia</strong><ExternalIcon /></a><a href={site.doi} target="_blank" rel="noreferrer"><span>Publication DOI</span><strong>10.30864/jsi.v18i1.601</strong><ExternalIcon /></a></div></section>
      <section className="small-cta section-pad"><h2>See the work behind the statement.</h2><Link className="button button-dark" href="/archive">Browse the archive <ArrowIcon /></Link></section>
    </>
  );
}
