import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import { MotionController } from "@/components/motion-controller";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WaveScrollbar } from "@/components/wave-scrollbar";
import { site } from "@/data/site";
import "./globals.css";
import "./atlas.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Scientific machine learning`, template: `%s — ${site.name}` },
  description: site.description,
  keywords: ["Andre Huizen", site.legalName, "scientific machine learning", "physics-informed neural networks", "PDE", "numerical simulation"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: site.name, description: site.description, url: site.url, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: site.name, description: site.description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#e8decc", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.legalName,
    alternateName: site.name,
    url: site.url,
    sameAs: [site.github, site.orcid],
    affiliation: { "@type": "CollegeOrUniversity", name: "Atma Jaya University Yogyakarta" },
    knowsAbout: ["Scientific machine learning", "Physics-informed neural networks", "Partial differential equations", "Numerical simulation", "Computer vision"],
  };
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body><a className="skip-link" href="#main">Skip to content</a><SiteHeader /><main id="main">{children}</main><SiteFooter /><MotionController /><WaveScrollbar /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }} /></body>
    </html>
  );
}
