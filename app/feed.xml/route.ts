import { site, works } from "@/data/site";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  const items = works.map((work) => `<item><title><![CDATA[${work.title}]]></title><link>${site.url}/work/${work.slug}</link><guid>${site.url}/work/${work.slug}</guid><description><![CDATA[${work.summary}]]></description><pubDate>${new Date(work.lastVerified).toUTCString()}</pubDate></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Andre Huizen — Research archive</title><link>${site.url}</link><description>${site.description}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
