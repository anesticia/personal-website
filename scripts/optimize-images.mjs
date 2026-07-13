import { createHash } from "node:crypto";
import { readdir, stat, unlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

const imageDirectory = join(process.cwd(), "public", "images");
const sources = (await readdir(imageDirectory)).filter((name) => name.endsWith(".png")).sort();

if (sources.length === 0) {
  throw new Error("No PNG sources found in public/images.");
}

const manifest = {};

for (const sourceName of sources) {
  const sourcePath = join(imageDirectory, sourceName);
  const sourceFile = await stat(sourcePath);
  const stem = basename(sourceName, ".png");
  const source = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const encoded = await sharp(source.data, { raw: source.info })
    .webp({ lossless: true, effort: 6 })
    .toBuffer();
  const encodedHash = createHash("sha256").update(encoded).digest("hex");
  const outputName = stem + "." + encodedHash.slice(0, 12) + ".webp";
  const outputPath = join(imageDirectory, outputName);
  const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  if (
    decoded.info.width !== source.info.width ||
    decoded.info.height !== source.info.height ||
    decoded.info.channels !== source.info.channels ||
    !decoded.data.equals(source.data)
  ) {
    throw new Error("Decoded pixels differ for " + sourceName);
  }

  for (const candidate of await readdir(imageDirectory)) {
    if (candidate !== outputName && new RegExp("^" + stem + "\\.[a-f0-9]{12}\\.webp$").test(candidate)) {
      await unlink(join(imageDirectory, candidate));
    }
  }

  await writeFile(outputPath, encoded);
  manifest["/images/" + sourceName] = {
    output: "/images/" + outputName,
    width: source.info.width,
    height: source.info.height,
    channels: source.info.channels,
    sourceBytes: sourceFile.size,
    rawBytes: source.data.length,
    encodedBytes: encoded.length,
    rawPixelSha256: createHash("sha256").update(source.data).digest("hex"),
  };
}

await writeFile(
  join(imageDirectory, "image-manifest.json"),
  JSON.stringify({ format: "lossless-webp", generatedBy: "scripts/optimize-images.mjs", images: manifest }, null, 2) + "\n",
);

for (const [source, details] of Object.entries(manifest)) {
  console.log(source + " -> " + details.output + " (" + details.encodedBytes + " bytes)");
}
