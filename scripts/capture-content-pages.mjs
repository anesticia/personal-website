// Fixed-state full-page captures for all primary routes and evidence dossiers.
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve(process.argv[2] ?? "output/performance/pages-visual");
const url = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
const routes = Object.keys(manifest.routes).filter(route => route === "/" || /^\/(about|archive|contact|research)$/.test(route) || route.startsWith("/work/"));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-gpu"] });
const report = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
    await context.addInitScript(() => { performance.now = () => 10000; });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(url + route);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}); }));
      });
      for (const reveal of await page.locator(".reveal").all()) await reveal.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(400);
      const name = `${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}-${viewport.width}.png`;
      await page.screenshot({ path: path.join(output, name), fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      report.push({ route, viewport, name, overflow });
      console.log(name);
    }
    await context.close();
  }
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
} finally { await browser.close(); }
