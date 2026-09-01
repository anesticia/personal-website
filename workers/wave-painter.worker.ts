import { renderWave, type WaveRenderFrame } from "../lib/wave-renderer";

const scope = globalThis as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent<{ frame: WaveRenderFrame; sequence: number }>) => void) | null;
};

try {
  const canvas = new OffscreenCanvas(1, 1);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable in this worker.");
  scope.onmessage = ({ data }) => {
    try {
      renderWave(context, data.frame);
      const bitmap = canvas.transferToImageBitmap();
      scope.postMessage({ bitmap, sequence: data.sequence }, [bitmap]);
    } catch { scope.postMessage({ failed: true }); }
  };
  scope.postMessage({ ready: true });
} catch { scope.postMessage({ failed: true }); }
