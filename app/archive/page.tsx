import type { Metadata } from "next";
import { ArchiveClient } from "@/components/archive-client";
import { works } from "@/data/site";

export const metadata: Metadata = { title: "Work archive", description: "Research, software, experiments, and transparently attributed forks by Andre Huizen." };

export default function ArchivePage() {
  return <><header className="page-hero compact section-pad"><p className="page-kicker">Archive / {String(works.length).padStart(2, "0")} entries</p><h1>Work, experiments, and <em>open questions.</em></h1><p className="page-lede">A complete, searchable index of the work I can document responsibly. Original projects and public forks are labelled separately.</p></header><section className="archive-section section-pad"><ArchiveClient works={works} /></section></>;
}
