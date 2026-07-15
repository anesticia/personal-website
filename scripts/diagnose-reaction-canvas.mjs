import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(2_500);

const canvases = await page.locator("[data-simulation]").evaluateAll((elements) => elements.map((element) => {
  const context = element.getContext("webgl2");
  const pixels = new Uint8Array(16 * 16 * 4);
  context?.readPixels(0, 0, 16, 16, context.RGBA, context.UNSIGNED_BYTE, pixels);
  const state = element.__reactionDiffusionState ?? [];
  let stateMinimum = 255;
  let stateMaximum = 0;
  for (const value of state) {
    stateMinimum = Math.min(stateMinimum, value);
    stateMaximum = Math.max(stateMaximum, value);
  }
  return {
    simulation: element.dataset.simulation,
    dataset: { ...element.dataset },
    contextLost: context?.isContextLost(),
    glError: context?.getError(),
    pixelMinimum: pixels.length ? Math.min(...pixels) : null,
    pixelMaximum: pixels.length ? Math.max(...pixels) : null,
    pixelMean: pixels.reduce((sum, value) => sum + value, 0) / Math.max(1, pixels.length),
    stateMinimum: state.length ? stateMinimum : null,
    stateMaximum: state.length ? stateMaximum : null,
  };
}));

console.log(JSON.stringify({ errors, canvases }, null, 2));
await browser.close();
