import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveClient } from "@/components/archive-client";
import { ArrowIcon } from "@/components/icons";
import { works } from "@/data/site";

export const metadata: Metadata = { title: "Work archive", description: "Research, software, experiments, and transparently attributed records by Andre Huizen." };

export default function ArchivePage() {
  return (
    <>
      <header className="atlas-page-hero atlas-archive-hero">
        <div className="atlas-archive-hero-copy"><p className="atlas-kicker">Research archive · {String(works.length).padStart(2, "0")} records</p><h1>Work, experiments, and <em>open questions.</em></h1><p>Six records. Open one to see the current evidence, limits, and what remains unresolved.</p></div>
        <nav className="archive-hero-index" aria-label="Archive record index">
          <header><span>Record</span><span>Status</span></header>
          <ol>{works.map((work, index) => <li key={work.slug}><Link href={`/work/${work.slug}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{work.title}</strong><small>{work.status}</small><ArrowIcon /></Link></li>)}</ol>
        </nav>
      </header>
      <section className="archive-section atlas-archive-section section-pad"><ArchiveClient works={works} /></section>
    </>
  );
}
