// Compare production builds with the same browser, viewport, DPR and sample length.
// This measures browser main-thread work, not GPU utilization or Zen frame rate.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const options = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, "").split("=");
  return [key, value.join("=") || "true"];
}));
const baseURL = options.url ?? "http://127.0.0.1:3100";
const output = path.resolve(options.output ?? "output/performance/rendering");
const trials = Number(options.trials ?? 3);
const sampleMs = Number(options.sample ?? 3000);
const software = options.software === "true";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: software ? ["--disable-gpu"] : [] });
const browserSession = await browser.newBrowserCDPSession();
const system = await browserSession.send("SystemInfo.getInfo");
const report = {
  browser: browser.version(), software, viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1.5, sampleMs, trials, gpu: system.gpu, samples: [],
};

try {
  for (let trial = 1; trial <= trials; trial += 1) {
    for (const route of options.route ? [options.route] : ["/", "/research"]) {
      const context = await browser.newContext({ viewport: report.viewport, deviceScaleFactor: report.deviceScaleFactor });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      // Count repaints without reading pixels, which can change canvas acceleration.
      await page.addInitScript(() => {
        window.__canvasClears = {};
        const clear = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function (...args) {
          if (this.canvas.isConnected) {
            const key = this.canvas.className || this.canvas.parentElement?.className || "canvas";
            window.__canvasClears[key] = (window.__canvasClears[key] ?? 0) + 1;
          }
          return clear.apply(this, args);
        };
      });
      const session = await context.newCDPSession(page);
      await session.send("Performance.enable");
      await page.goto(baseURL + route);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1800);
      for (const state of options.states?.split(",") ?? ["visible", "offscreen"]) {
        if (state === "offscreen") {
          await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          // Let the existing finite scrollbar wave expire before sampling idle work.
          await page.waitForTimeout(7200);
        }
        const before = await session.send("Performance.getMetrics");
        const clearsBefore = await page.evaluate(() => ({ ...window.__canvasClears }));
        await page.waitForTimeout(sampleMs);
        const after = await session.send("Performance.getMetrics");
        const clearsAfter = await page.evaluate(() => ({ ...window.__canvasClears }));
        const metrics = Object.fromEntries(after.metrics.map(({ name, value }) => [name, value - (before.metrics.find((metric) => metric.name === name)?.value ?? 0)]));
        const sample = {
          trial, route, state,
          elapsedMs: metrics.Timestamp * 1000,
          taskMs: metrics.TaskDuration * 1000,
          scriptMs: metrics.ScriptDuration * 1000,
          layoutMs: metrics.LayoutDuration * 1000,
          styleMs: metrics.RecalcStyleDuration * 1000,
          clears: Object.fromEntries(Object.entries(clearsAfter).map(([key, value]) => [key, value - (clearsBefore[key] ?? 0)])),
          errors,
        };
        report.samples.push(sample);
        console.log(JSON.stringify(sample));
      }
      await context.close();
    }
  }
  // Deterministic reduced-motion captures allow comparison without temporal noise.
  for (const viewport of options.captures === "false" ? [] : [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.addInitScript(() => { performance.now = () => 10000; });
    for (const route of ["/", "/research"]) {
      await page.goto(baseURL + route);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(output, `${route === "/" ? "home" : "research"}-${viewport.width}.png`) });
    }
    await context.close();
  }
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
} finally {
  await browser.close();
}
