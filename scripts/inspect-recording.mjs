import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const source = process.argv[2];
const destination = path.resolve(process.argv[3] ?? "output/playwright/video-frames");
if (!source) throw new Error("Pass a video URL to inspect.");

await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
await page.goto(source, { waitUntil: "load" });
const video = page.locator("video");
await video.waitFor({ state: "visible" });
const duration = await video.evaluate((element) => new Promise((resolve) => {
  if (Number.isFinite(element.duration)) resolve(element.duration);
  else element.addEventListener("loadedmetadata", () => resolve(element.duration), { once: true });
}));

const frameCount = Number(process.argv[4] ?? 12);
await video.evaluate((element) => {
  element.controls = false;
  element.playbackRate = 4;
  return element.play();
});
for (let index = 0; index < frameCount; index += 1) {
  const time = duration * index / (frameCount - 1);
  await page.waitForFunction((target) => document.querySelector("video")?.currentTime >= target, time, { timeout: 15_000 });
  await page.screenshot({ path: path.join(destination, `frame-${String(index).padStart(2, "0")}.png`) });
}

console.log(JSON.stringify({ duration, frameCount, destination }, null, 2));
await browser.close();
