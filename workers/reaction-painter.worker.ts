import { createOffscreenReactionRenderer, type ReactionFrame, type StateRenderer } from "../lib/reaction-renderer";

const scope = globalThis as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent<{ frame: ReactionFrame; sequence: number }>) => void) | null;
};
try {
  const canvas = new OffscreenCanvas(1, 1);
  let renderer: StateRenderer | null = null;
  canvas.addEventListener("contextlost", () => scope.postMessage({ failed: true }));
  canvas.addEventListener("webglcontextlost", () => scope.postMessage({ failed: true }));
  scope.onmessage = ({ data }) => {
    try {
      const frame = data.frame;
      renderer ??= createOffscreenReactionRenderer(canvas, frame.variant);
      const width = Math.max(1, Math.round(frame.width * frame.ratio));
      const height = Math.max(1, Math.round(frame.height * frame.ratio));
      if (canvas.width !== width || canvas.height !== height) renderer.resize(frame.width, frame.height, frame.ratio);
      renderer.render(frame.state, frame.fieldWidth, frame.fieldHeight);
      const bitmap = canvas.transferToImageBitmap();
      scope.postMessage({ bitmap, sequence: data.sequence }, [bitmap]);
    } catch { scope.postMessage({ failed: true }); }
  };
  scope.postMessage({ ready: true });
} catch { scope.postMessage({ failed: true }); }
