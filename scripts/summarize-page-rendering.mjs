// Summarize the matched route-wide measurements without hiding trial ranges.
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const beforeFiles = ["output/performance/pages-before-scan/report.json", "output/performance/pages-before-repeats/report.json"];
const afterFile = process.argv[2] ?? "output/performance/pages-after/report.json";
const before = await Promise.all(beforeFiles.map(async file => JSON.parse(await readFile(file, "utf8"))));
const after = JSON.parse(await readFile(afterFile, "utf8"));
for (const sample of before) for (const key of ["browser", "software", "viewport", "dpr"]) assert.deepEqual(sample[key], after[key], `${key} must match`);
const baseline = before.flatMap(report => report.samples);
const stats = values => {
  assert.equal(values.length, 3, "three measurements are required per route/state");
  const sorted = values.toSorted((a, b) => a - b);
  return { median: sorted[1], minimum: sorted[0], maximum: sorted[2], n: sorted.length };
};
const results = [];
for (const route of [...new Set(baseline.map(sample => sample.route))]) for (const state of ["idle", "scroll"]) {
  const select = samples => samples.filter(sample => sample.route === route && sample.state === state);
  const first = select(baseline);
  const second = select(after.samples);
  const beforeStats = stats(first.map(sample => sample.taskMs));
  const afterStats = stats(second.map(sample => sample.taskMs));
  assert.ok([...first, ...second].every(sample => sample.errors.length === 0), `${route}: browser errors`);
  if (state === "scroll") assert.ok(second.every(sample => sample.renderers.some(renderer => renderer.waveRenderer === "worker")), `${route}: shared worker must really run`);
  results.push({ route, state, before: beforeStats, after: afterStats, reductionPercent: 100 * (1 - afterStats.median / beforeStats.median), beforeElapsed: stats(first.map(sample => sample.elapsedMs)), afterElapsed: stats(second.map(sample => sample.elapsedMs)) });
}
const format = value => `${value.median.toFixed(1)} (${value.minimum.toFixed(1)}–${value.maximum.toFixed(1)})`;
const table = ["| Route | Before median (range), ms | After median (range), ms | Reduction |", "|---|---:|---:|---:|", ...results.filter(result => result.state === "scroll").map(result => `| ${result.route} | ${format(result.before)} | ${format(result.after)} | ${result.reductionPercent.toFixed(1)}% |`)].join("\n");
await writeFile("output/performance/pages-comparison.json", JSON.stringify({ sources: { before: beforeFiles, after: afterFile }, browser: after.browser, viewport: after.viewport, dpr: after.dpr, software: after.software, results }, null, 2));
await writeFile("output/performance/pages-comparison.md", table + "\n");
console.log(table);
