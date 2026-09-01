// Route-wide production rendering profile. Software rendering is a controlled
// stress path, not a substitute for measuring Zen on the user's Intel driver.
import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const options = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, "").split("=");
  return [key, value.join("=") || "true"];
}));
const url = options.url ?? "http://127.0.0.1:3100";
const output = path.resolve(options.output ?? "output/performance/pages");
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
const routes = options.routes?.split(",") ?? Object.keys(manifest.routes).filter((route) =>
  route === "/" || /^\/(about|archive|contact|research)$/.test(route) || route.startsWith("/work/") || (options.prototypes === "true" && route.startsWith("/prototypes")));
const software = options.software !== "false";
const trials = Number(options.trials ?? 3);
const browser = await chromium.launch({ args: software ? ["--disable-gpu"] : [] });
const report = { browser: browser.version(), software, viewport: { width: 1440, height: 1000 }, dpr: 1.5, trials, samples: [] };
await mkdir(output, { recursive: true });
try {
  const browserSession = await browser.newBrowserCDPSession();
  report.gpu = (await browserSession.send("SystemInfo.getInfo")).gpu;
  for (let trial = 1; trial <= trials; trial++) for (const route of routes) {
    const context = await browser.newContext({ viewport: report.viewport, deviceScaleFactor: report.dpr });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    if (options.cpuRail === "true") await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, settings) {
        if (type === "2d" && this.parentElement?.classList.contains("wave-scrollbar")) return getContext.call(this, type, { ...settings, willReadFrequently: true });
        return getContext.call(this, type, settings);
      };
    });
    await page.addInitScript(() => {
      window.renderSamples = [];
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = callback => raf.call(window, time => {
        const start = performance.now();
        callback(time);
        window.renderSamples.push(performance.now() - start);
      });
    });
    const session = await context.newCDPSession(page);
    await session.send("Performance.enable");
    await page.goto(url + route);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}); }));
    });
    await page.waitForTimeout(1800);
    if (options.railLayer === "true") await page.addStyleTag({ content: ".wave-scrollbar { will-change: transform; contain: paint; }" });
    if (options.noRail === "true") {
      // Profiling ablation only: override the exact media query used by the rail
      // before navigating again, without touching the repository implementation.
      await page.addInitScript(() => {
        const match = window.matchMedia.bind(window);
        window.matchMedia = query => {
          const result = match(query);
          if (query === "(min-width: 901px) and (pointer: fine)") Object.defineProperty(result, "matches", { value: false });
          return result;
        };
      });
      await page.reload();
      await page.waitForTimeout(1800);
    }
    for (const state of options.states?.split(",") ?? ["idle", "scroll"]) {
      if (state === "simulation" || state === "pointer") {
        await page.locator(".atlas-about-simulation").scrollIntoViewIfNeeded();
        await page.waitForTimeout(7000);
      }
      const before = await session.send("Performance.getMetrics");
      await page.evaluate(() => { window.renderSamples = []; });
      if (options.trace === "true") { await session.send("Profiler.enable"); await session.send("Profiler.start"); }
      if (state === "scroll") {
        await page.evaluate(() => new Promise(resolve => {
          let start;
          const maximum = document.documentElement.scrollHeight - innerHeight;
          const move = now => {
            start ??= now;
            const progress = Math.min(1, (now - start) / 4000);
            window.scrollTo({ top: maximum * (0.5 - Math.cos(progress * Math.PI * 2) * 0.5), behavior: "instant" });
            if (progress < 1) requestAnimationFrame(move); else resolve();
          };
          requestAnimationFrame(move);
        }));
      } else if (state === "pointer") {
        const box = await page.locator(".atlas-about-simulation").boundingBox();
        for (let step = 0; step < 60; step++) {
          await page.mouse.move(box.x + box.width * (0.5 + Math.sin(step * 0.2) * 0.3), box.y + box.height * (0.5 + Math.cos(step * 0.2) * 0.3));
          await page.waitForTimeout(50);
        }
      } else await page.waitForTimeout(3000);
      if (options.trace === "true") {
        const { profile } = await session.send("Profiler.stop");
        await writeFile(path.join(output, `${route.replaceAll("/", "_")}-${state}-${trial}.cpuprofile`), JSON.stringify(profile));
      }
      const after = await session.send("Performance.getMetrics");
      const metrics = Object.fromEntries(after.metrics.map(({ name, value }) => [name, value - (before.metrics.find(metric => metric.name === name)?.value ?? 0)]));
      const callbacks = await page.evaluate(() => window.renderSamples);
      const sorted = callbacks.toSorted((a, b) => a - b);
      const sample = {
        trial, route, state, elapsedMs: metrics.Timestamp * 1000, taskMs: metrics.TaskDuration * 1000,
        scriptMs: metrics.ScriptDuration * 1000, layoutMs: metrics.LayoutDuration * 1000, styleMs: metrics.RecalcStyleDuration * 1000,
        callbackCount: callbacks.length, callbackP95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0, callbackMaxMs: sorted.at(-1) ?? 0,
        renderers: await page.locator("canvas").evaluateAll(canvases => canvases.map(canvas => ({ className: canvas.className, ...canvas.dataset }))),
        errors,
      };
      report.samples.push(sample);
      console.log(JSON.stringify(sample));
      await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
    }
    await context.close();
  }
} finally { await browser.close(); }
