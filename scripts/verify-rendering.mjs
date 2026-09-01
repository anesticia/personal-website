// Regression checks for canvas cache invalidation and animation lifecycle.
// Uses the existing Playwright runtime, without changing browser/OS settings.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ args: process.argv.includes("--software") ? ["--disable-gpu"] : [] });
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
  await context.addInitScript(() => {
    const counts = new WeakMap();
    const original = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      counts.set(this.canvas, (counts.get(this.canvas) ?? 0) + 1);
      return original.apply(this, args);
    };
    window.canvasDrawCount = (canvas) => counts.get(canvas) ?? 0;
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const draws = (canvas) => canvas.evaluate((element) => window.canvasDrawCount(element));
  const expectStill = async (canvas, message) => {
    await page.waitForTimeout(150);
    const before = await draws(canvas);
    await page.waitForTimeout(350);
    assert.equal(await draws(canvas), before, message);
  };
  const expectMoving = async (canvas, message) => {
    const before = await draws(canvas);
    await page.waitForTimeout(350);
    assert.ok(await draws(canvas) > before + 2, message);
  };
  for (const [route, selector] of [["/", ".atlas-topology-canvas"], ["/research", ".research-wave-field canvas"]]) {
    await page.goto(baseURL + route);
    await page.waitForTimeout(1500);
    const canvas = page.locator(selector);
    await expectMoving(canvas, `${route}: visible animation runs`);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await expectStill(canvas, `${route}: offscreen animation stops`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expectMoving(canvas, `${route}: animation resumes`);

    // Exercise the visibility handler deterministically. This is an event
    // simulation, not a claim about a particular browser's background throttling.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expectStill(canvas, `${route}: hidden-document handler stops work`);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expectMoving(canvas, `${route}: visible-document handler resumes`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectStill(canvas, `${route}: reduced motion is static`);

    const beforeInteraction = await canvas.evaluate((element) => element.toDataURL());
    if (route === "/") {
      await page.getByRole("navigation", { name: "Select a project coordinate" }).getByRole("button").nth(1).click();
      await page.waitForTimeout(150);
      assert.notEqual(await canvas.evaluate((element) => element.toDataURL()), beforeInteraction, "project selection redraws the cached terrain overlay");
      const beforeDrag = await canvas.evaluate((element) => element.toDataURL());
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.55);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.6, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(150);
      assert.notEqual(await canvas.evaluate((element) => element.toDataURL()), beforeDrag, "dragging invalidates the terrain cache");
    } else {
      await canvas.focus();
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(150);
      assert.notEqual(await canvas.evaluate((element) => element.toDataURL()), beforeInteraction, "source movement redraws the field with the cached fade");
      assert.match(await page.locator(".research-wave-readout").innerText(), /source 70/i);
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
      await page.setViewportSize(viewport);
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const size = await canvas.evaluate((element) => ({ width: element.width, height: element.height, cssWidth: element.getBoundingClientRect().width }));
      assert.ok(size.width >= size.cssWidth, `${route}: backing resolution is retained after resize`);
      assert.ok(size.height > 200);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 1, "no horizontal overflow");
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expectMoving(canvas, `${route}: motion resumes when preference changes back`);
    console.log(`${route}: visible/offscreen, visibility handler, reduced motion, interaction and resize PASS`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL + "/archive");
  const rail = page.locator(".wave-scrollbar canvas");
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  await expectStill(rail, "portrait native-scrollbar layout does not paint the hidden wave canvas");
  assert.equal(await draws(rail), 0, "hidden scrollbar never rasterizes");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "instant" }));
  await expectMoving(rail, "the desktop wave scrollbar resumes after resize");
  assert.deepEqual(errors, [], "no browser errors");
  console.log("Scrollbar portrait/desktop transitions and browser errors PASS");
} finally {
  await browser.close();
}
