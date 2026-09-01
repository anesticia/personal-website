// Production integration checks for worker availability, loading/runtime failure,
// context loss, and client-navigation cleanup. No persistent browser settings.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { chromium } from "playwright";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const browser = await chromium.launch({ args: process.argv.includes("--software") ? ["--disable-gpu"] : [] });
const report = [];
const reference = new Map();
const selectors = { "/contact": ".wave-scrollbar canvas", "/research": ".research-wave-field canvas", "/about": ".atlas-about-simulation canvas" };
try {
  for (const mode of ["worker", "no-worker", "no-offscreen", "load-failure", "runtime-failure"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
    await context.addInitScript(mode => {
      performance.now = () => 10000;
      window.testWorkers = [];
      window.testGL = [];
      if (typeof OffscreenCanvas !== "undefined") {
        const getContext = OffscreenCanvas.prototype.getContext;
        OffscreenCanvas.prototype.getContext = function (type, options) {
          const context = getContext.call(this, type, options);
          if (type === "webgl2" && context && !window.testGL.includes(context)) window.testGL.push(context);
          return context;
        };
      }
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          if (mode === "load-failure") throw new Error("Injected worker loading failure");
          super(...args);
          window.testWorkers.push(this);
        }
        terminate() { this.testTerminated = true; super.terminate(); }
      };
      if (mode === "no-worker") window.Worker = undefined;
      if (mode === "no-offscreen") window.OffscreenCanvas = undefined;
    }, mode);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const [route, selector] of Object.entries(selectors)) {
      await page.goto(baseURL + route);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}); }));
      });
      const canvas = page.locator(selector);
      for (const reveal of await page.locator(".reveal").all()) await reveal.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      if (mode === "worker" || mode === "runtime-failure") {
        await page.waitForFunction(selector => Object.values(document.querySelector(selector).dataset).includes("worker"), selector);
      }
      await page.waitForTimeout(400);
      if (mode === "runtime-failure") {
        await page.evaluate(() => window.testWorkers.forEach(worker => worker.dispatchEvent(new ErrorEvent("error", { cancelable: true, message: "Injected runtime failure" }))));
        await page.waitForFunction(selector => Object.values(document.querySelector(selector).dataset).includes("main"), selector);
      }
      // Compare the displayed result, including the original page background.
      // Reading transparent backing pixels as unpremultiplied PNG can magnify
      // rounding differences at near-zero alpha that do not change the page.
      const pixels = await sharp(await page.screenshot({ fullPage: true })).ensureAlpha().raw().toBuffer();
      if (mode === "worker") reference.set(route, pixels);
      else {
        if (!pixels.equals(reference.get(route))) {
          const expected = reference.get(route);
          let changed = 0;
          let max = 0;
          const examples = [];
          for (let i = 0; i < pixels.length; i++) { const d = Math.abs(pixels[i] - expected[i]); if (d) { changed++; if (examples.length < 5) examples.push({ x: Math.floor(i / 4) % 2160, y: Math.floor(i / 8640), before: expected[i], after: pixels[i] }); } max = Math.max(max, d); }
          console.log(JSON.stringify({ route, mode, changed, max, examples, bytes: pixels.length, expectedBytes: expected.length, canvas: await canvas.evaluate(canvas => ({ css: [canvas.clientWidth, canvas.clientHeight], backing: [canvas.width, canvas.height], data: { ...canvas.dataset }, font: canvas.getContext("2d")?.font })) }));
        }
        assert.ok(pixels.equals(reference.get(route)), `${route}: ${mode} retains the same fixed-state pixels`);
      }
      report.push({ mode, route, pixelsIdentical: true, renderer: await canvas.evaluate(canvas => ({ ...canvas.dataset })) });
    }
    if (mode === "worker") {
      // A lost fallback WebGL context plus worker failure must retain chemistry
      // and recover through the site's existing Canvas 2D palette.
      const before = await page.locator(selectors["/about"]).evaluate(canvas => Array.from(canvas.__reactionDiffusionState));
      await page.evaluate(() => window.testGL.forEach(gl => gl.getExtension("WEBGL_lose_context")?.loseContext()));
      await page.waitForFunction(() => window.testGL.every(gl => gl.isContextLost()));
      await page.evaluate(() => window.testWorkers.forEach(worker => worker.dispatchEvent(new ErrorEvent("error", { cancelable: true }))));
      // The last delivered bitmap survives context loss. Exercise the next
      // requested frame as well, at the same dimensions and deterministic seed.
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await page.waitForFunction(() => document.querySelector(".atlas-about-simulation canvas").dataset.renderer === "canvas2d");
      const after = await page.locator(selectors["/about"]).evaluate(canvas => ({ state: Array.from(canvas.__reactionDiffusionState), colors: new Set(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data).size }));
      assert.deepEqual(after.state, before, "context recovery preserves simulation state");
      assert.ok(after.colors > 20, "context recovery produces a nonblank field");
      report.push({ mode: "context-loss", statePreserved: true, nonblank: true });

      await page.goto(baseURL + "/research");
      await page.waitForFunction(() => document.querySelector(".research-wave-field canvas").dataset.fieldRenderer === "worker");
      await page.evaluate(() => { window.departingWorkers = window.testWorkers.slice(); });
      await page.getByRole("link", { name: "About", exact: true }).first().click();
      await page.waitForURL("**/about");
      await page.waitForFunction(() => window.departingWorkers.some(worker => worker.testTerminated));
      report.push({ mode: "client-navigation", unmountedWorkerTerminated: true });
    }
    assert.deepEqual(errors, [], `${mode}: no uncaught browser errors`);
    console.log(`${mode}: fixed-state rendering and fallback checks PASS`);
    await context.close();
  }
  await writeFile(`output/performance/worker-fallbacks-${process.argv.includes("--software") ? "software" : "default"}.json`, JSON.stringify(report, null, 2));
} finally { await browser.close(); }
