// Exercise the real worker entry points and ImageBitmap delivery against the
// saved main-thread renderers at identical states, sizes, sources and clocks.
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import ts from "typescript";
import { chromium } from "playwright";

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const read = file => readFile(file, "utf8");
const saved = "output/performance/pages-before-source/";
const waveSource = (await read(saved + "wave-scrollbar.tsx")).split("export function WaveScrollbar()")[0];
const reactionSource = (await read(saved + "reaction-diffusion-hero.tsx")).split("export function ReactionDiffusionCanvas(")[0];
const fieldSource = await read(saved + "research-wave-field.tsx");
const fieldBaseline = fieldSource.split("export function ResearchWaveField()")[0] + `
export function createBaseline(canvas) {
  const context = canvas.getContext("2d");
  const sourceRef = { current: { x: 0.72, y: 0.54, startedAt: 0 } };
  const reducedMotion = { matches: false };
  const timeRef = { current: null };
  let lastTimeLabel = 0;
  ${fieldSource.slice(fieldSource.indexOf("    const fade ="), fieldSource.indexOf("    const portraitInstrument ="))}
  ${fieldSource.slice(fieldSource.indexOf("    const drawPath ="), fieldSource.indexOf("    const schedule ="))}
  return frame => {
    sourceRef.current = { ...frame.source, startedAt: 0 };
    reducedMotion.matches = frame.reducedMotion;
    draw(frame.elapsed * 1000);
  };
}`;
const files = ["lib/wave-renderer.ts", "lib/research-wave-renderer.ts", "lib/reaction-renderer.ts", "workers/wave-painter.worker.ts", "workers/research-wave.worker.ts", "workers/reaction-painter.worker.ts"];
const modules = Object.fromEntries(await Promise.all(files.map(async file => [file.replace(/\.ts$/, ""), compile(await read(file))])));
const baseline = {
  wave: compile(waveSource + "\nexport { createWaveMotion, injectWave, stepWave, drawWave };"),
  field: compile(fieldBaseline),
  reaction: compile(reactionSource + "\nexport { createWebGLRenderer, createCanvasRenderer };"),
};
const software = process.argv.includes("--software");
const browser = await chromium.launch({ args: software ? ["--disable-gpu"] : [] });
try {
  const page = await browser.newPage();
  const results = await page.evaluate(async ({ modules, baseline, staticFrames }) => {
    const load = code => { const exports = {}; new Function("exports", "require", code)(exports, () => ({})); return exports; };
    const old = Object.fromEntries(Object.entries(baseline).map(([name, code]) => [name, load(code)]));
    const fieldLabels = load(modules["lib/research-wave-renderer"]).renderResearchWaveLabels;
    const workerFor = async entry => {
      const workerSource = `const modules = ${JSON.stringify(modules)}; const cache = {};
        function load(name) {
          if (cache[name]) return cache[name];
          const exports = cache[name] = {};
          new Function("exports", "require", modules[name])(exports, path => load(path.startsWith("../") ? path.slice(3) : path));
          return exports;
        }
        load(${JSON.stringify(entry)});`;
      const url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
      const worker = new Worker(url);
      await new Promise((resolve, reject) => {
        worker.onmessage = ({ data }) => data.ready ? resolve() : reject(new Error("worker failed to initialize"));
        worker.onerror = event => reject(new Error(event.message));
      });
      URL.revokeObjectURL(url);
      let sequence = 0;
      return {
        paint: frame => new Promise((resolve, reject) => {
          worker.onmessage = ({ data }) => data.bitmap ? resolve(data.bitmap) : reject(new Error("worker could not paint frame"));
          worker.postMessage({ frame, sequence: ++sequence });
        }),
        close: () => worker.terminate(),
      };
    };
    const makeCanvas = (width, height) => {
      const canvas = document.createElement("canvas");
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      document.body.append(canvas);
      return canvas;
    };
    const compare = (a, b, result) => {
      if (a.width !== b.width || a.height !== b.height) throw new Error("backing dimensions changed");
      // The legacy WebGL canvas is copied without scaling, just as the bitmap is.
      const copy = document.createElement("canvas");
      copy.width = a.width; copy.height = a.height;
      copy.getContext("2d").drawImage(a, 0, 0);
      const first = copy.getContext("2d").getImageData(0, 0, a.width, a.height).data;
      const second = b.getContext("2d").getImageData(0, 0, b.width, b.height).data;
      for (let i = 0; i < first.length; i++) {
        const difference = Math.abs(first[i] - second[i]);
        if (difference) result.changedChannels++;
        result.maxDifference = Math.max(result.maxDifference, difference);
      }
      result.frames++;
    };
    const deliver = async (worker, canvas, frame) => {
      const bitmap = await worker.paint(frame);
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      if ("elapsed" in frame) fieldLabels(canvas.getContext("2d"), frame);
      bitmap.close();
    };
    const results = [];
    for (const profile of [{ width: 44, height: 1000, ratio: 1.5 }, { width: 64, height: 911, ratio: 1.25 }, { width: 44, height: 844, ratio: 2 }]) {
      Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: profile.ratio });
      const canvases = [makeCanvas(profile.width, profile.height), makeCanvas(profile.width, profile.height)];
      const worker = await workerFor("workers/wave-painter.worker");
      const motion = old.wave.createWaveMotion();
      const result = { kind: "wave", ...profile, frames: 0, changedChannels: 0, maxDifference: 0 };
      for (let index = 0; index < 30; index++) {
        const progress = (Math.sin(index * 0.21) + 1) / 2;
        old.wave.injectWave(motion, progress, 0.5, index < 15 ? -1 : 1);
        old.wave.stepWave(motion, 1);
        motion.probeEnergy = 0.35;
        const emphasized = index % 4 === 0;
        old.wave.drawWave(canvases[0], progress, emphasized, motion);
        await deliver(worker, canvases[1], { ...profile, progress, emphasized, motion });
        compare(...canvases, result);
      }
      results.push(result); worker.close(); canvases.forEach(canvas => canvas.remove());
    }
    for (const profile of [{ width: 1440, height: 800, ratio: 1.35 }, { width: 768, height: 620, ratio: 1.5 }, { width: 390, height: 480, ratio: 1.5 }]) {
      Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: profile.ratio });
      const canvases = [makeCanvas(profile.width, profile.height), makeCanvas(profile.width, profile.height)];
      const render = old.field.createBaseline(canvases[0]);
      const worker = await workerFor("workers/research-wave.worker");
      const result = { kind: "research", ...profile, frames: 0, changedChannels: 0, maxDifference: 0 };
      for (let index = 0; index < 6; index++) {
        const frame = staticFrames ? { ...profile, elapsed: 2.4, reducedMotion: true, source: { x: 0.72, y: 0.54 } } : { ...profile, elapsed: index === 5 ? 2.4 : index * 1.7, reducedMotion: index === 5, source: { x: 0.52 + index * 0.055, y: 0.14 + index * 0.14 } };
        render(frame); await deliver(worker, canvases[1], frame); compare(...canvases, result);
      }
      results.push(result); worker.close(); canvases.forEach(canvas => canvas.remove());
    }
    for (const variant of ["hero", "publication"]) for (const ratio of [1, 1.25, 1.75]) {
      const profile = { width: 480, height: 320, ratio };
      const canvases = [makeCanvas(profile.width, profile.height), makeCanvas(profile.width, profile.height)];
      const gl = canvases[0].getContext("webgl2", { alpha: false, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true });
      if (!gl) throw new Error("WebGL comparison unavailable");
      const renderer = old.reaction.createWebGLRenderer(canvases[0], gl, variant);
      renderer.resize(profile.width, profile.height, ratio);
      const worker = await workerFor("workers/reaction-painter.worker");
      const result = { kind: "reaction-webgl", variant, ...profile, frames: 0, changedChannels: 0, maxDifference: 0 };
      for (let index = 0; index < 3; index++) {
        const state = new Uint8Array(128 * 96 * 2);
        for (let cell = 0; cell < state.length; cell++) state[cell] = (cell * 73 + index * 37) % 256;
        renderer.render(state, 128, 96);
        await deliver(worker, canvases[1], { ...profile, variant, state, fieldWidth: 128, fieldHeight: 96 });
        compare(...canvases, result);
      }
      results.push(result); worker.close(); renderer.destroy(); gl.getExtension("WEBGL_lose_context")?.loseContext(); canvases.forEach(canvas => canvas.remove());
    }
    return results;
  }, { modules, baseline, staticFrames: process.argv.includes("--static") });
  console.log(JSON.stringify(results, null, 2));
  await writeFile(`output/performance/worker-pixels-${software ? "software" : "default"}.json`, JSON.stringify(results, null, 2));
  assert.ok(results.every(result => result.changedChannels === 0), "worker bitmap pixels must match the previous renderer");
} finally { await browser.close(); }
