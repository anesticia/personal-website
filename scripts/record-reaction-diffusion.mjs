import { chromium } from "playwright";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const label = process.argv[2] ?? "capture";
const outputDirectory = path.resolve("output", "playwright", "recordings", label);
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1200, height: 760 },
  deviceScaleFactor: 1.5,
  recordVideo: { dir: outputDirectory, size: { width: 1200, height: 760 } },
});
const page = await context.newPage();
const errors = [];
const samples = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

async function sampleCanvas(canvas, surface, elapsed) {
  const reading = await canvas.evaluate((element) => {
    const state = element.__reactionDiffusionState;
    const [stateWidth, stateHeight] = element.__reactionDiffusionSize ?? [0, 0];
    const signature = [];
    const columns = 24;
    const rows = 16;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = Math.min(stateWidth - 1, Math.floor((column + 0.5) * stateWidth / columns));
        const y = Math.min(stateHeight - 1, Math.floor((row + 0.5) * stateHeight / rows));
        const offset = (y * stateWidth + x) * 2;
        signature.push(state?.[offset + 1] ?? 0);
      }
    }
    return {
      phase: element.dataset.phase,
      frame: Number(element.dataset.frame ?? 0),
      direction: Number(element.dataset.direction ?? 0),
      renderer: element.dataset.renderer,
      backing: element.dataset.backing,
      simulationGrid: element.dataset.simulationGrid,
      quality: Number(element.dataset.quality ?? 0),
      workMs: Number(element.dataset.workMs ?? 0),
      timelineFrames: Number(element.dataset.timelineFrames ?? 0),
      stepsPerFrame: Number(element.dataset.stepsPerFrame ?? 0),
      warmupSteps: Number(element.dataset.warmupSteps ?? 0),
      playbackStride: Number(element.dataset.playbackStride ?? 0),
      interactionRadius: Number(element.dataset.interactionRadius ?? 0),
      endHoldFrames: Number(element.dataset.endHoldFrames ?? 0),
      signature,
    };
  });
  samples.push({ surface, elapsed, ...reading });
}

async function moveAcross(canvas) {
  const bounds = await canvas.boundingBox();
  if (!bounds) return;
  for (let step = 0; step <= 14; step += 1) {
    const progress = step / 14;
    await page.mouse.move(
      bounds.x + bounds.width * (0.2 + progress * 0.62),
      bounds.y + bounds.height * (0.3 + Math.sin(progress * Math.PI) * 0.35),
    );
    await page.waitForTimeout(70);
  }
  await page.mouse.move(bounds.x + bounds.width + 20, bounds.y + bounds.height + 20);
}

async function observe(canvas, surface, duration) {
  const started = Date.now();
  while (Date.now() - started < duration) {
    await sampleCanvas(canvas, surface, Date.now() - started);
    await page.waitForTimeout(250);
  }
}

await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
const hero = page.locator('[data-simulation="hero"]');
await page.waitForTimeout(700);
await moveAcross(hero);
await observe(hero, "hero", 7_500);
await page.locator(".hero").screenshot({ path: path.join(outputDirectory, "hero-final.png") });

const publication = page.locator('[data-simulation="publication"]');
await publication.scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await moveAcross(publication);
await observe(publication, "publication", 16_500);
await page.locator(".publication-feature").screenshot({ path: path.join(outputDirectory, "publication-final.png") });

const video = page.video();
await context.close();
const generatedVideoPath = await video.path();
const stableVideoPath = path.join(outputDirectory, `${label}.webm`);
await rename(generatedVideoPath, stableVideoPath);
await browser.close();

function summarize(surface) {
  const surfaceSamples = samples.filter((sample) => sample.surface === surface);
  const differences = [];
  const differencesByPhase = {};
  for (let index = 1; index < surfaceSamples.length; index += 1) {
    const previous = surfaceSamples[index - 1].signature;
    const current = surfaceSamples[index].signature;
    let total = 0;
    for (let pixel = 0; pixel < current.length; pixel += 1) total += Math.abs(current[pixel] - previous[pixel]);
    const difference = total / current.length;
    differences.push(difference);
    const phase = surfaceSamples[index].phase;
    if (phase === surfaceSamples[index - 1].phase) (differencesByPhase[phase] ??= []).push(difference);
  }
  return {
    samples: surfaceSamples.length,
    phases: [...new Set(surfaceSamples.map((sample) => sample.phase))],
    renderer: surfaceSamples[0]?.renderer,
    backing: surfaceSamples[0]?.backing,
    simulationGrid: surfaceSamples[0]?.simulationGrid,
    quality: surfaceSamples[0]?.quality,
    timelineFrames: surfaceSamples[0]?.timelineFrames,
    stepsPerFrame: surfaceSamples[0]?.stepsPerFrame,
    warmupSteps: surfaceSamples[0]?.warmupSteps,
    playbackStride: surfaceSamples[0]?.playbackStride,
    interactionRadius: surfaceSamples[0]?.interactionRadius,
    endHoldFrames: surfaceSamples[0]?.endHoldFrames,
    meanStateDeltaByPhase: Object.fromEntries(
      Object.entries(differencesByPhase).map(([phase, values]) => [phase, values.reduce((sum, value) => sum + value, 0) / values.length]),
    ),
    meanStateDelta: differences.reduce((sum, value) => sum + value, 0) / Math.max(1, differences.length),
    maxStateDelta: Math.max(0, ...differences),
    meanWorkMs: surfaceSamples.reduce((sum, sample) => sum + sample.workMs, 0) / Math.max(1, surfaceSamples.length),
    maxWorkMs: Math.max(0, ...surfaceSamples.map((sample) => sample.workMs)),
  };
}

const report = {
  label,
  errors,
  hero: summarize("hero"),
  publication: summarize("publication"),
  samples,
  video: stableVideoPath,
};
await writeFile(path.join(outputDirectory, "metrics.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ video: stableVideoPath, hero: report.hero, publication: report.publication, errors }, null, 2));
