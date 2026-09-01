import { createBitmapPainter, type BitmapPainter } from "./bitmap-painter";
import { renderWave, type WaveRenderFrame } from "./wave-renderer";

export type WavePainter = BitmapPainter<WaveRenderFrame>;
export function createWavePainter(canvas: HTMLCanvasElement): WavePainter {
  return createBitmapPainter(canvas, {
    worker: () => new Worker(new URL("../workers/wave-painter.worker.ts", import.meta.url)),
    render: renderWave,
    snapshot: frame => ({ ...frame, motion: { probeEnergy: frame.motion.probeEnergy, strands: frame.motion.strands.map(strand => ({ offset: strand.offset, current: strand.current.slice() })) } }),
    label: "wave",
  });
}
