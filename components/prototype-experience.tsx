import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { ReactionDiffusionCanvas, ReactionDiffusionHero } from "@/components/reaction-diffusion-hero";
import { publication, site, works, type Work } from "@/data/site";

export const prototypeDirections = [
  { slug: "journal-cover", index: "01", name: "Journal Cover", short: "Editorial object", description: "A living scientific journal cover with issue furniture and one dominant research statement." },
  { slug: "research-terminal", index: "02", name: "Research Terminal", short: "Command workspace", description: "A useful runtime surface built from active jobs, evidence logs, and research commands." },
  { slug: "constellation-map", index: "03", name: "Constellation Map", short: "Spatial system", description: "Projects become connected questions orbiting a live computational field." },
  { slug: "academic-preprint", index: "04", name: "Academic Preprint", short: "Formal reading", description: "A web-native paper with abstract, numbered sections, citations, and figure plates." },
  { slug: "specimen-gallery", index: "05", name: "Specimen Gallery", short: "Science exhibition", description: "Large research outputs presented as captioned specimens in an exhibition sequence." },
  { slug: "field-observatory", index: "06", name: "Field Observatory", short: "Live instrument", description: "The current simulation becomes an observatory with calibrated operational readouts." },
  { slug: "brutalist-index", index: "07", name: "Brutalist Index", short: "Raw typography", description: "A forceful black, paper, and oxide index that makes titles and provenance unavoidable." },
  { slug: "research-timeline", index: "08", name: "Research Timeline", short: "Chronological record", description: "A homepage organized as a trace from the 2023 publication to current SciML work." },
  { slug: "lab-notebook", index: "09", name: "Lab Notebook", short: "Working pages", description: "Ruled pages, clipped figures, observations, corrections, and next actions." },
  { slug: "cinematic-monograph", index: "10", name: "Cinematic Monograph", short: "Full-screen chapters", description: "A minimal image-led monograph told through a sequence of immersive research chapters." },
] as const;

export type PrototypeSlug = (typeof prototypeDirections)[number]["slug"];

const featured = works.filter((work) => work.featured);

function SuiteDock({ active }: { active?: PrototypeSlug }) {
  return (
    <aside className="suite-dock" aria-label="Prototype navigation">
      <Link href="/prototypes" className="suite-dock-title"><small>AH / Study II</small><strong>10 architectures</strong></Link>
      <nav>
        {prototypeDirections.map((direction) => (
          <Link key={direction.slug} href={`/prototypes/${direction.slug}`} aria-current={active === direction.slug ? "page" : undefined} title={`${direction.name} — ${direction.short}`}>
            {direction.index}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function BrandMark({ light = false }: { light?: boolean }) {
  return <Link href="/" className={light ? "p-brand p-brand--light" : "p-brand"}><span>AH</span><strong>Andre Huizen</strong></Link>;
}

function ProjectImage({ work, sizes = "50vw" }: { work: Work; sizes?: string }) {
  if (!work.image) return <div className="p-image-fallback">{work.title.slice(0, 2).toUpperCase()}</div>;
  return <Image src={work.image} alt={work.imageAlt ?? ""} fill sizes={sizes} />;
}

function JournalCover() {
  const work = featured[0];
  return (
    <div className="p-page p-journal">
      <SuiteDock active="journal-cover" />
      <section className="journal-cover">
        <div className="journal-field"><ReactionDiffusionHero /></div>
        <div className="journal-wash" />
        <header><BrandMark light /><span>Journal of computational inquiry</span><span>Vol. 01 · 2026</span></header>
        <p className="journal-vertical">Scientific machine learning · Numerical simulation · Reproducible research</p>
        <div className="journal-title"><small>Cover thesis / Andre Huizen</small><h1>Rules<br />inside<br /><em>complexity.</em></h1><p>Learning physical structure through simulation, approximation, and evidence.</p></div>
        <div className="journal-contents"><span>In this issue</span>{featured.map((item, index) => <Link key={item.slug} href={`/work/${item.slug}`}><small>0{index + 1}</small>{item.title}</Link>)}</div>
      </section>
      <section className="journal-feature">
        <div className="journal-feature-image"><ProjectImage work={work} /></div>
        <div><small>Featured investigation / PDE systems</small><h2>{work.title}</h2><p>{work.summary}</p><Link href={`/work/${work.slug}`}>Read the cover story <ArrowIcon /></Link></div>
      </section>
      <footer className="journal-footer"><span>ISSN / Independent web edition</span><Link href="/contact">Correspondence <ArrowIcon /></Link></footer>
    </div>
  );
}

function ResearchTerminal() {
  return (
    <div className="p-page p-terminal">
      <SuiteDock active="research-terminal" />
      <aside className="terminal-sidebar"><BrandMark light /><nav><a href="#runtime">Runtime</a><a href="#jobs">Active jobs</a><a href="#evidence">Evidence</a><Link href="/archive">Archive ↗</Link></nav><p><i /> system online<br />Jakarta / UTC+7</p></aside>
      <main className="terminal-main">
        <header><span>research://andre-huizen/home</span><span>main · clean</span></header>
        <section id="runtime" className="terminal-runtime">
          <div className="terminal-prompt"><small>$ whoami --research</small><h1>Andre Huizen</h1><p>Scientific machine learning researcher building inspectable models for complex physical systems.</p><div><Link href="/research">./open-research <ArrowIcon /></Link><Link href="/contact">./contact <ArrowIcon /></Link></div></div>
          <div className="terminal-field"><ReactionDiffusionHero /><span>gray_scott.live</span></div>
        </section>
        <section id="jobs" className="terminal-jobs"><header><span>PID</span><span>ACTIVE RESEARCH JOB</span><span>STATE</span><span>YEAR</span></header>{featured.map((work, index) => <Link key={work.slug} href={`/work/${work.slug}`}><span>{2048 + index * 137}</span><strong>{work.title}</strong><span><i /> running</span><span>{work.year}</span></Link>)}</section>
        <section id="evidence" className="terminal-evidence"><div><small>latest_publication.log</small><p>&gt; {publication.title}</p><p>&gt; DOI {publication.doi}</p><a href={publication.url} target="_blank" rel="noreferrer">open canonical output <ExternalIcon /></a></div><pre>{`method = "model → measure → revise"\nreference = true\nnegative_results = "preserved"\nstatus = "question remains open"`}</pre></section>
      </main>
    </div>
  );
}

function ConstellationMap() {
  return (
    <div className="p-page p-map">
      <SuiteDock active="constellation-map" />
      <header className="map-header"><BrandMark light /><nav><Link href="/archive">All coordinates</Link><Link href="/about">Observer</Link></nav></header>
      <section className="map-canvas">
        <div className="map-grid" />
        <div className="map-orbit map-orbit--one" /><div className="map-orbit map-orbit--two" /><div className="map-orbit map-orbit--three" />
        <div className="map-core"><ReactionDiffusionHero /><div><small>Central question</small><h1>What rules<br />produce the pattern?</h1></div></div>
        {featured.map((work, index) => <Link key={work.slug} href={`/work/${work.slug}`} className={`map-node map-node--${index + 1}`}><i /><small>0{index + 1}</small><strong>{work.title}</strong><span>{work.topics[0]} / {work.year}</span></Link>)}
        <div className="map-legend"><span><i /> Active system</span><span>— conceptual relation</span><span>× numerical reference</span></div>
      </section>
      <section className="map-detail"><p>Research map / 2026</p><h2>Different systems.<br /><em>One recurring practice.</em></h2><div><p>Encode the governing structure.</p><p>Construct a numerical reference.</p><p>Keep the failed experiments visible.</p></div></section>
    </div>
  );
}

function AcademicPreprint() {
  return (
    <article className="p-page p-preprint">
      <SuiteDock active="academic-preprint" />
      <header className="preprint-masthead"><span>AH–WP–2026–01</span><span>Working paper · revision 3</span><a href={site.orcid} target="_blank" rel="noreferrer">ORCID ↗</a></header>
      <section className="preprint-title"><p>Scientific machine learning / Research statement</p><h1>Learning the rules inside complex systems</h1><div><strong>Andre Huizen</strong><span>Department of Informatics<br />Atma Jaya University Yogyakarta</span><span>July 2026</span></div></section>
      <section className="preprint-abstract"><h2>Abstract</h2><p>Physical constraints can do more than regularize a model: they can make its failures interpretable. This research practice connects partial differential equations, numerical references, and computational learning to study what a complex system can become.</p><aside><strong>Keywords</strong><span>Scientific machine learning</span><span>Partial differential equations</span><span>Numerical simulation</span></aside></section>
      <section className="preprint-body"><aside><a href="#preprint-method">1. Method</a><a href="#preprint-figures">2. Current figures</a><a href="#preprint-citation">3. Citation</a></aside><div>
        <section id="preprint-method"><h2><span>1.</span> A method built around evidence</h2><p>Start with governing structure, build a numerical comparison, and preserve results that constrain the next question.</p><div className="preprint-equation"><span>∂u/∂t = Dᵤ∇²u − uv² + f(1−u)</span><span>∂v/∂t = Dᵥ∇²v + uv² − (f+k)v</span><small>Eq. 1 — two-species reaction–diffusion system</small></div></section>
        <section id="preprint-figures"><h2><span>2.</span> Current research figures</h2><div className="preprint-figures">{featured.slice(0, 2).map((work, index) => <figure key={work.slug}><div><ProjectImage work={work} /></div><figcaption><b>Figure {index + 1}.</b> {work.summary}</figcaption></figure>)}</div></section>
        <section id="preprint-citation"><h2><span>3.</span> Published record</h2><blockquote>{publication.authors[0]}. “{publication.title}.” <em>{publication.venue}</em> {publication.volume}({publication.issue}), {publication.pages}.</blockquote><a href={publication.url} target="_blank" rel="noreferrer">DOI:{publication.doi} <ExternalIcon /></a></section>
      </div></section>
    </article>
  );
}

function SpecimenGallery() {
  return (
    <div className="p-page p-gallery">
      <SuiteDock active="specimen-gallery" />
      <header className="gallery-header"><BrandMark /><span>Gallery 01 — Computational systems</span><nav><Link href="/archive">Index</Link><Link href="/contact">Visit / contact</Link></nav></header>
      <section className="gallery-opening"><p>Research exhibition / 2026</p><h1>Systems,<br /><em>observed.</em></h1><span>Three active investigations shown through their native research output.</span></section>
      <main className="gallery-specimens">{featured.map((work, index) => <article key={work.slug} className={`gallery-specimen gallery-specimen--${index + 1}`}><div className="gallery-art"><ProjectImage work={work} sizes="80vw" /></div><div className="gallery-caption"><small>Specimen 0{index + 1} / {work.year}</small><h2>{work.title}</h2><p>{work.summary}</p><Link href={`/work/${work.slug}`}>View research notes <ArrowIcon /></Link></div></article>)}</main>
      <section className="gallery-room"><div><ReactionDiffusionCanvas variant="publication" /></div><article><small>Publication room / 2023</small><h2>Edge information,<br />combined.</h2><p>{publication.title}</p><a href={publication.url} target="_blank" rel="noreferrer">Open publication <ExternalIcon /></a></article></section>
    </div>
  );
}

function FieldObservatory() {
  return (
    <div className="p-page p-observatory">
      <SuiteDock active="field-observatory" />
      <header className="observatory-bar"><BrandMark light /><div><span><i /> live observation</span><span>GS–F037–K060</span><span>30 FPS</span></div><Link href="/archive">Research archive</Link></header>
      <main className="observatory-main">
        <section className="observatory-view"><ReactionDiffusionHero /><div className="observatory-reticle" /><p>Pointer input perturbs the local concentration field</p></section>
        <aside className="observatory-panel"><small>Observer / Andre Huizen</small><h1>Complex systems,<br /><em>under observation.</em></h1><p>Live simulation is the interface: research context sits around the evidence, not over it.</p><dl><div><dt>Field</dt><dd>Gray–Scott</dd></div><div><dt>Method</dt><dd>Finite difference</dd></div><div><dt>Boundary</dt><dd>Periodic</dd></div><div><dt>Status</dt><dd><i /> evolving</dd></div></dl><Link href="/research">Open observation notes <ArrowIcon /></Link></aside>
      </main>
      <section className="observatory-queue"><header><span>Channel</span><span>Active study</span><span>Reference</span></header>{featured.map((work, index) => <Link href={`/work/${work.slug}`} key={work.slug}><span>0{index + 1}</span><strong>{work.title}</strong><span>{work.facts[0].value}</span></Link>)}</section>
      <section className="observatory-protocol"><h2>Observation protocol</h2><div><span>01<strong>Model</strong></span><span>02<strong>Measure</strong></span><span>03<strong>Revise</strong></span></div><p>Preserve the path from physical assumptions to numerical evidence.</p></section>
    </div>
  );
}

function BrutalistIndex() {
  return (
    <div className="p-page p-brutalist">
      <SuiteDock active="brutalist-index" />
      <header className="brutalist-header"><BrandMark /><span>Research index / {works.length} records</span><nav><Link href="/about">Info</Link><Link href="/contact">Contact</Link></nav></header>
      <section className="brutalist-hero"><p>Andre Huizen is an informatics researcher working across scientific machine learning, PDEs, and numerical simulation.</p><h1>Research<br />without<br /><em>the gloss.</em></h1><div>Yogyakarta<br />2023—2026</div></section>
      <main className="brutalist-list">{works.map((work, index) => <Link href={`/work/${work.slug}`} key={work.slug}><span>{String(index + 1).padStart(2, "0")}</span><h2>{work.title}</h2><p>{work.kind} / {work.year}</p>{work.image && <div><ProjectImage work={work} sizes="260px" /></div>}<ArrowIcon /></Link>)}</main>
      <section className="brutalist-publication"><span>One published paper</span><h2>{publication.title}</h2><a href={publication.url} target="_blank" rel="noreferrer">DOI {publication.doi} <ExternalIcon /></a></section>
      <footer className="brutalist-footer"><h2>Have a difficult system?</h2><Link href="/contact">Let’s talk <ArrowIcon /></Link></footer>
    </div>
  );
}

function ResearchTimeline() {
  const timeline = [featured[0], featured[1], featured[2], works.find((work) => work.slug === "object-classification-paper")!];
  return (
    <div className="p-page p-timeline">
      <SuiteDock active="research-timeline" />
      <aside className="timeline-intro"><BrandMark /><p>Research record<br />2023—present</p><h1>Questions<br />over time.</h1><nav><Link href="/research">Research themes</Link><Link href="/archive">Full archive</Link></nav></aside>
      <main className="timeline-track"><div className="timeline-line" />{timeline.map((work, index) => <article key={work.slug} className={`timeline-event timeline-event--${index + 1}`}><div className="timeline-year"><i /><span>{work.year}</span></div><div className="timeline-event-copy"><small>{work.eyebrow}</small><h2>{work.title}</h2><p>{work.summary}</p><Link href={`/work/${work.slug}`}>Open record <ArrowIcon /></Link></div>{work.image && <div className="timeline-image"><ProjectImage work={work} sizes="45vw" /></div>}</article>)}<section className="timeline-next"><span>Next</span><h2>Models that remain understandable when the horizon gets longer.</h2><Link href="/contact">Discuss a research question <ArrowIcon /></Link></section></main>
    </div>
  );
}

function LabNotebook() {
  return (
    <div className="p-page p-notebook">
      <SuiteDock active="lab-notebook" />
      <div className="notebook-binding" />
      <header className="notebook-header"><BrandMark /><span>Notebook 04</span><span>13 July 2026</span></header>
      <main className="notebook-pages">
        <section className="notebook-question"><small>Current question</small><h1>How do local rules become <em>global behavior?</em></h1><p className="notebook-note">keep the physics visible ↗</p><p>I test the question through PDE simulation, physics-informed learning, and numerical reference methods.</p><Link href="/research">research notes <ArrowIcon /></Link></section>
        <section className="notebook-spread">{featured.slice(0, 2).map((work, index) => <article key={work.slug} className={`notebook-entry notebook-entry--${index + 1}`}><div className="notebook-photo"><ProjectImage work={work} sizes="45vw" /><i /></div><small>Experiment 0{index + 1}</small><h2>{work.title}</h2><p>{work.summary}</p><Link href={`/work/${work.slug}`}>continue reading →</Link></article>)}<aside><strong>Observation</strong><p>Baselines are not secondary. They define what improvement means.</p></aside></section>
        <section className="notebook-result"><div><ReactionDiffusionCanvas variant="publication" /></div><article><small>Published result / 2023</small><h2>Edge information, combined.</h2><p>{publication.title}</p><p className="notebook-correction">verify against canonical DOI</p><a href={publication.url} target="_blank" rel="noreferrer">open source <ExternalIcon /></a></article></section>
      </main>
    </div>
  );
}

function CinematicMonograph() {
  return (
    <div className="p-page p-monograph">
      <SuiteDock active="cinematic-monograph" />
      <header className="monograph-header"><BrandMark light /><span>A research monograph in four movements</span><nav><Link href="/archive">Index</Link><Link href="/contact">Contact</Link></nav></header>
      <section className="monograph-chapter monograph-opening"><div><ReactionDiffusionHero /></div><article><small>I / Opening field</small><h1>Complexity<br />has a grammar.</h1><p>Andre Huizen · Scientific machine learning</p></article><span>Scroll to read</span></section>
      {featured.map((work, index) => <section key={work.slug} className={`monograph-chapter monograph-work monograph-work--${index + 1}`}><div><ProjectImage work={work} sizes="100vw" /></div><article><small>{["II", "III", "IV"][index]} / {work.topics[0]}</small><h2>{work.title}</h2><p>{work.summary}</p><Link href={`/work/${work.slug}`}>Enter chapter <ArrowIcon /></Link></article></section>)}
      <section className="monograph-chapter monograph-closing"><ReactionDiffusionCanvas variant="publication" /><article><small>Postscript / Publication</small><h2>Evidence leaves<br />a trace.</h2><p>{publication.venue} · {publication.year}</p><a href={publication.url} target="_blank" rel="noreferrer">Read the paper <ExternalIcon /></a></article></section>
    </div>
  );
}

const prototypeRenderers: Record<PrototypeSlug, () => React.ReactNode> = {
  "journal-cover": JournalCover,
  "research-terminal": ResearchTerminal,
  "constellation-map": ConstellationMap,
  "academic-preprint": AcademicPreprint,
  "specimen-gallery": SpecimenGallery,
  "field-observatory": FieldObservatory,
  "brutalist-index": BrutalistIndex,
  "research-timeline": ResearchTimeline,
  "lab-notebook": LabNotebook,
  "cinematic-monograph": CinematicMonograph,
};

export function PrototypeExperience({ slug }: { slug: PrototypeSlug }) {
  const RenderPrototype = prototypeRenderers[slug];
  return <RenderPrototype />;
}

export function PrototypeIndex() {
  return (
    <div className="p-page p-suite-index">
      <SuiteDock />
      <header><BrandMark /><span>Interface study II · July 2026</span></header>
      <main><p>Ten independent homepage architectures</p><h1>Different ideas.<br /><em>Not different skins.</em></h1><div className="suite-index-list">{prototypeDirections.map((direction) => <Link key={direction.slug} href={`/prototypes/${direction.slug}`} className={`suite-index-item suite-index-item--${direction.index}`}><span>{direction.index}</span><div><small>{direction.short}</small><h2>{direction.name}</h2><p>{direction.description}</p></div><b>Open <ArrowIcon /></b></Link>)}</div></main>
      <footer><span>Comparison routes are noindex and absent from production navigation.</span><Link href="/">Return to current homepage <ArrowIcon /></Link></footer>
    </div>
  );
}
