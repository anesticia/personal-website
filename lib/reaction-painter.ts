import { createBitmapPainter } from "./bitmap-painter";
import { createCanvasRenderer, createOffscreenReactionRenderer, type ReactionFrame, type SimulationVariant, type StateRenderer } from "./reaction-renderer";

export function createReactionPainter(canvas: HTMLCanvasElement, variant: SimulationVariant): StateRenderer {
  let surface = new OffscreenCanvas(1, 1);
  let renderer = createOffscreenReactionRenderer(surface, variant);
  let width = 1;
  let height = 1;
  let ratio = 1;
  const painter = createBitmapPainter<ReactionFrame>(canvas, {
    worker: () => new Worker(new URL("../workers/reaction-painter.worker.ts", import.meta.url)),
    render(context, frame) {
      // A GPU reset may affect both worker and fallback contexts. Keep the
      // current simulation state and recover with the existing Canvas palette.
      if (renderer.kind === "webgl2" && surface.getContext("webgl2")?.isContextLost()) {
        renderer.destroy();
        surface = new OffscreenCanvas(1, 1);
        const fallback = surface.getContext("2d", { alpha: false });
        if (!fallback) return;
        renderer = createCanvasRenderer(surface, fallback, variant);
        canvas.dataset.renderer = renderer.kind;
      }
      const pixelWidth = Math.max(1, Math.round(frame.width * frame.ratio));
      const pixelHeight = Math.max(1, Math.round(frame.height * frame.ratio));
      if (surface.width !== pixelWidth || surface.height !== pixelHeight) renderer.resize(frame.width, frame.height, frame.ratio);
      renderer.render(frame.state, frame.fieldWidth, frame.fieldHeight);
      const bitmap = surface.transferToImageBitmap();
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
    },
    snapshot: frame => ({ ...frame, state: frame.state.slice() }),
    label: "simulation",
  });
  return {
    kind: renderer.kind,
    resize(displayWidth, displayHeight, quality) {
      width = displayWidth;
      height = displayHeight;
      ratio = quality;
      // Keep sizing/debug dimensions synchronous with the existing interface.
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
    },
    render(state, fieldWidth, fieldHeight) { painter.paint({ width, height, ratio, state, fieldWidth, fieldHeight, variant }); },
    destroy() { painter.destroy(); renderer.destroy(); },
  };
}
