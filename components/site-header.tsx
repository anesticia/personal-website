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
    </header>
  );
}
