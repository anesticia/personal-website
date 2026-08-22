import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { ReactionDiffusionCanvas } from "@/components/reaction-diffusion-hero";
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
        <div className="atlas-about-simulation"><ReactionDiffusionCanvas variant="hero" minimumFieldAspect={1.25} /><div className="atlas-about-simulation-label"><span>Gray–Scott · live field</span><small>Drag · F .037 · K .060</small></div></div>
        <Reveal className="atlas-about-copy" delay={100}><p className="atlas-kicker">What I work on</p><h2>I build and test models for physical systems.</h2><p>My current work covers reaction–diffusion, wave propagation, and charged-particle dynamics. I use numerical solvers as references, then test where learned models help and where they fail.</p><p>I also build chess and geolocation software when the clearest way to understand an idea is to make it run.</p></Reveal>
      </section>

      <section className="atlas-timeline section-pad"><header><p className="atlas-kicker">Academic path · Chronology</p><h2>A short path with visible coordinates.</h2></header><div>{path.map(([date, title, copy], index) => <Reveal key={date} delay={index * 70}><article><span>{date}</span><b>0{index + 1}</b><div><h3>{title}</h3><p>{copy}</p></div></article></Reveal>)}</div></section>

      <section className="atlas-identities section-pad"><header><p className="atlas-kicker">Verified identity · External records</p><h2>Attribution you can follow.</h2></header><div><a href={site.orcid} target="_blank" rel="noreferrer"><span>ORCID</span><strong>0009-0002-0300-9169</strong><ExternalIcon /></a><a href={site.github} target="_blank" rel="noreferrer"><span>GitHub</span><strong>@anesticia</strong><ExternalIcon /></a><a href={site.doi} target="_blank" rel="noreferrer"><span>Publication DOI</span><strong>10.30864/jsi.v18i1.601</strong><ExternalIcon /></a></div></section>

      <section className="atlas-small-cta section-pad"><h2>See the records behind the statement.</h2><Link className="atlas-action" href="/archive">Browse the archive <ArrowIcon /></Link></section>
    </>
  );
}
