// Compare the actual old/new wave renderer functions on identical solver states.
// Pass a saved source path as the first argument. No site code is mocked/replaced.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";
import { chromium } from "playwright";

const baseline = process.argv.slice(2).find(argument => !argument.startsWith("--")) ?? "output/performance/pages-before-source/wave-scrollbar.tsx";
const compile = async file => {
  const source = (await readFile(file, "utf8")).split("export function WaveScrollbar()")[0];
  return ts.transpileModule(source + "\nexport { createWaveMotion, injectWave, stepWave, drawWave };", { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
};
const before = await compile(baseline);
const after = ts.transpileModule(await readFile("lib/wave-renderer.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const browser = await chromium.launch({ args: process.argv.includes("--software") ? ["--disable-gpu"] : [] });
try {
  const page = await browser.newPage();
  const report = await page.evaluate(({ before, after }) => {
    const load = code => { const exports = {}; new Function("exports", "require", code)(exports, () => ({})); return exports; };
    const old = load(before);
    const next = load(after);
    next.createWaveMotion = old.createWaveMotion;
    next.injectWave = old.injectWave;
    next.stepWave = old.stepWave;
    next.drawWave = (canvas, progress, emphasized, motion) => next.renderWave(canvas.getContext("2d"), { width: canvas.clientWidth, height: canvas.clientHeight, ratio: Math.min(window.devicePixelRatio, 2), progress, emphasized, motion });
    const profiles = [ { width: 44, height: 1000, dpr: 1.5 }, { width: 64, height: 911, dpr: 1.25 }, { width: 44, height: 844, dpr: 2 } ];
    const results = [];
    for (const profile of profiles) {
      Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: profile.dpr });
      const canvases = [old, next].map(() => {
        const canvas = document.createElement("canvas");
        canvas.style.width = profile.width + "px";
        canvas.style.height = profile.height + "px";
        document.body.append(canvas);
        return canvas;
      });
      const states = [old.createWaveMotion(), next.createWaveMotion()];
      let changedChannels = 0;
      let maxDifference = 0;
      let frames = 0;
      for (let frame = 0; frame < 180; frame++) {
        const position = (Math.sin(frame * 0.07) + 1) / 2;
        for (let index = 0; index < 2; index++) {
          const api = index ? next : old;
          if (frame % 4 === 0) api.injectWave(states[index], position, 0.2 + (frame % 10) / 12, frame < 90 ? -1 : 1);
          api.stepWave(states[index], 1);
          states[index].probeEnergy = 0.35;
          api.drawWave(canvases[index], position, frame % 9 < 3, states[index]);
        }
        const pixels = canvases.map(canvas => canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data);
        for (let index = 0; index < pixels[0].length; index++) {
          const delta = Math.abs(pixels[0][index] - pixels[1][index]);
          if (delta) changedChannels++;
          maxDifference = Math.max(maxDifference, delta);
        }
        frames++;
      }
      results.push({ ...profile, frames, changedChannels, maxDifference });
      canvases.forEach(canvas => canvas.remove());
    }
    return results;
  }, { before, after });
  console.log(JSON.stringify(report, null, 2));
  await mkdir("output/performance", { recursive: true });
  await writeFile(`output/performance/wave-equivalence-${process.argv.includes("--software") ? "software" : "default"}.json`, JSON.stringify(report, null, 2));
  assert.ok(report.every(result => result.changedChannels === 0), "wave renderer pixels must match the saved implementation");
} finally { await browser.close(); }
