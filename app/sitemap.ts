import type { MetadataRoute } from "next";
import { site, works } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/research", "/archive", "/about", "/contact"];
  return [...pages.map((path) => ({ url: `${site.url}${path}`, lastModified: new Date("2026-07-13"), changeFrequency: path === "" ? "monthly" as const : "yearly" as const, priority: path === "" ? 1 : 0.8 })), ...works.map((work) => ({ url: `${site.url}/work/${work.slug}`, lastModified: new Date(work.lastVerified), changeFrequency: "monthly" as const, priority: work.featured ? 0.8 : 0.6 }))];
}
