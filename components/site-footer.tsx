import Link from "next/link";
import { ExternalIcon } from "@/components/icons";
import { site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="footer-name">Andre Huizen</p>
        <p>Scientific machine learning, numerical simulation, and software experiments.</p>
      </div>
      <div className="footer-links">
        <a href={site.orcid} target="_blank" rel="noreferrer">ORCID <ExternalIcon /></a>
        <a href={site.github} target="_blank" rel="noreferrer">GitHub <ExternalIcon /></a>
        <Link href="/contact">Contact</Link>
      </div>
      <p className="footer-meta">© {new Date().getFullYear()} Andre Huizen<br />Built from documented, attributable research.</p>
    </footer>
  );
}
