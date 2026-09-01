// Exhaustively compare the original and optimized fallback palette, using every
// 8-bit U/V pair and the real Canvas 2D renderer, including high-quality scaling.
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";
import { chromium } from "playwright";

const compile = async file => {
  const source = (await readFile(file, "utf8")).split("export function ReactionDiffusionCanvas(")[0];
  return ts.transpileModule(source + (file.includes("lib/") ? "" : "\nexport { createCanvasRenderer };"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
};
const before = await compile(process.argv[2] ?? "output/performance/pages-before-source/reaction-diffusion-hero.tsx");
const after = await compile("lib/reaction-renderer.ts");
const browser = await chromium.launch({ args: ["--disable-gpu"] });
try {
  const page = await browser.newPage();
  const report = await page.evaluate(({ before, after }) => {
    const load = code => { const exports = {}; new Function("exports", "require", code)(exports, () => ({})); return exports; };
    const old = load(before);
    const next = load(after);
    const state = new Uint8Array(65536 * 2);
    for (let cell = 0; cell < 65536; cell++) { state[cell * 2] = cell >>> 8; state[cell * 2 + 1] = cell & 255; }
    const results = [];
    for (const variant of ["hero", "publication"]) for (const quality of [1, 1.25, 1.75]) {
      const pixels = [old, next].map(api => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        const renderer = api.createCanvasRenderer(canvas, context, variant);
        renderer.resize(256, 256, quality);
        renderer.render(state, 256, 256);
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      let changedChannels = 0;
      for (let index = 0; index < pixels[0].length; index++) if (pixels[0][index] !== pixels[1][index]) changedChannels++;
      results.push({ variant, quality, chemicalStates: 65536, changedChannels });
    }
    return results;
  }, { before, after });
  console.log(JSON.stringify(report, null, 2));
  await writeFile("output/performance/simulation-color-equivalence.json", JSON.stringify(report, null, 2));
  assert.ok(report.every(result => result.changedChannels === 0), "all fallback colors and scaled pixels must match");
} finally { await browser.close(); }
