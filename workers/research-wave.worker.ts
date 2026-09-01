import { createResearchWaveRenderer, type ResearchWaveFrame } from "../lib/research-wave-renderer";

const scope = globalThis as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent<{ frame: ResearchWaveFrame; sequence: number }>) => void) | null;
};
try {
  const canvas = new OffscreenCanvas(1, 1);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable in this worker.");
  const render = createResearchWaveRenderer(context, false);
  if (!render) throw new Error("Unable to create the wave renderer.");
  scope.onmessage = async ({ data }) => {
    try {
      render(data.frame);
      // Retain the backing surface between frames. Transferring its storage
      // changed repeated-stroke pixels in the renderer equivalence checks.
      const bitmap = await createImageBitmap(canvas);
      scope.postMessage({ bitmap, sequence: data.sequence }, [bitmap]);
    } catch { scope.postMessage({ failed: true }); }
  };
  scope.postMessage({ ready: true });
} catch { scope.postMessage({ failed: true }); }
