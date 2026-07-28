"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";

const links = [
  ["/research", "01", "Research"],
  ["/archive", "02", "Archive"],
  ["/about", "03", "About"],
  ["/contact", "04", "Contact"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header atlas-site-header">
      <svg key={pathname} className="nav-island-geometry" viewBox="0 0 1320 68" preserveAspectRatio="none" aria-hidden="true">
        <path className="nav-island-surface" d="M43 2C24 2 10 13 8 31C6 49 20 61 42 62C204 66 332 58 494 61C652 64 778 69 946 60C1087 52 1194 65 1278 61C1302 60 1315 48 1312 29C1309 11 1297 4 1276 4C1100 1 973 7 818 4C665 1 521 7 371 3C241 0 146 5 43 2Z" />
      </svg>
      <Link className="wordmark" href="/" aria-label="Andre Huizen, home" onClick={() => setOpen(false)}>
        <span>AH</span><strong>Andre Huizen</strong>
      </Link>
      <button className="menu-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? "Close menu" : "Open menu"}>
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      <nav id="primary-navigation" className={open ? "nav-links is-open" : "nav-links"} aria-label="Primary navigation">
        {links.map(([href, index, label]) => (
          <Link key={href} href={href} className={pathname === href || (href === "/archive" && pathname.startsWith("/work/")) ? "active" : ""} onClick={() => setOpen(false)}><span>{index}</span><b>{label}</b></Link>
        ))}
      </nav>
      <Link className="header-record-link" href="/archive">Research records <span>↗</span></Link>
    </header>
  );
}
