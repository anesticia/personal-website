import type { Metadata } from "next";
import { ArchiveClient } from "@/components/archive-client";
import { works } from "@/data/site";

export const metadata: Metadata = { title: "Work archive", description: "Research, software, experiments, and transparently attributed records by Andre Huizen." };

export default function ArchivePage() {
  return (
    <>
      <header className="atlas-page-hero atlas-archive-hero">
        <div><p className="atlas-kicker">Research archive · {String(works.length).padStart(2, "0")} records</p><h1>Work, experiments, and <em>open questions.</em></h1></div>
        <p>A searchable ledger of work that can be documented responsibly. Status, provenance, and incomplete boundaries stay visible.</p>
      </header>
      <section className="atlas-archive-intro section-pad"><div><p className="atlas-kicker">How to read the archive</p><h2>Records before claims.</h2></div><ol><li><span>01</span><p>Search by project, method, topic, or tool.</p></li><li><span>02</span><p>Filter by the actual kind of work.</p></li><li><span>03</span><p>Open a dossier for evidence and limits.</p></li></ol></section>
      <section className="archive-section atlas-archive-section section-pad"><ArchiveClient works={works} /></section>
    </>
  );
}
