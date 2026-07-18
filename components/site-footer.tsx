import Link from "next/link";
import { ExternalIcon } from "@/components/icons";
import { site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-intro">
        <p className="footer-name">Andre Huizen</p>
        <p>Scientific machine learning, numerical simulation, and software experiments—documented as research records rather than polished claims.</p>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link href="/research">Research</Link>
        <Link href="/archive">Archive</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className="footer-links footer-links-external">
        <a href={site.orcid} target="_blank" rel="noreferrer">ORCID <ExternalIcon /></a>
        <a href={site.github} target="_blank" rel="noreferrer">GitHub <ExternalIcon /></a>
      </div>
      <p className="footer-meta">© {new Date().getFullYear()} Andre Huizen<br />Built from documented, attributable research.</p>
    </footer>
  );
}
