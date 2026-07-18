import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "About", description: "About Andre Huizen's research practice, interests, and academic background." };

const path = [
  ["2022 — present", "Informatics", "Atma Jaya University Yogyakarta · Department of Informatics"],
  ["2023", "First journal publication", "Object classification using ensemble learning, edge detection, and histogram features."],
  ["Current", "Scientific machine learning", "Wave propagation, reaction–diffusion systems, and physics-informed trajectory learning."],
];

export default function AboutPage() {
  return (
    <>
      <header className="atlas-page-hero atlas-about-hero"><div><p className="atlas-kicker">About · Research practice</p><h1>Research should leave a trail <em>someone else can follow.</em></h1><p>I am Laurentius Andre Cornelis Rudolf Huizen—usually Andre—an Informatics student and independent researcher in Yogyakarta, Indonesia.</p></div></header>

      <section className="atlas-about-position">
        <Reveal className="atlas-about-image"><Image src="/images/numerical-methods.26abe82439e0.webp" alt="Six numerical methods compared on the same reaction–diffusion system" fill sizes="(max-width: 900px) 100vw, 52vw" /></Reveal>
        <Reveal className="atlas-about-copy" delay={100}><p className="atlas-kicker">Position · Between disciplines</p><h2>Mathematical structure meets computational experiment.</h2><p>My central interest is scientific machine learning: using physical knowledge, differential equations, and numerical references to make learning systems more trustworthy and useful.</p><p>I also build software experiments—chess engines, geolocation tools, and desktop applications—because implementation exposes questions that theory alone can hide.</p><blockquote>Explicit assumptions. Reproducible baselines. Honest status. Negative results kept as evidence.</blockquote></Reveal>
      </section>

      <section className="atlas-timeline section-pad"><header><p className="atlas-kicker">Academic path · Chronology</p><h2>A short path with visible coordinates.</h2></header><div>{path.map(([date, title, copy], index) => <Reveal key={date} delay={index * 70}><article><span>{date}</span><b>0{index + 1}</b><div><h3>{title}</h3><p>{copy}</p></div></article></Reveal>)}</div></section>

      <section className="atlas-identities section-pad"><header><p className="atlas-kicker">Verified identity · External records</p><h2>Attribution you can follow.</h2></header><div><a href={site.orcid} target="_blank" rel="noreferrer"><span>ORCID</span><strong>0009-0002-0300-9169</strong><ExternalIcon /></a><a href={site.github} target="_blank" rel="noreferrer"><span>GitHub</span><strong>@anesticia</strong><ExternalIcon /></a><a href={site.doi} target="_blank" rel="noreferrer"><span>Publication DOI</span><strong>10.30864/jsi.v18i1.601</strong><ExternalIcon /></a></div></section>

      <section className="atlas-small-cta section-pad"><h2>See the records behind the statement.</h2><Link className="atlas-action" href="/archive">Browse the archive <ArrowIcon /></Link></section>
    </>
  );
}
