export type BitmapFrame = { width: number; height: number; ratio: number };
export type BitmapPainter<Frame> = { paint: (frame: Frame) => void; destroy: () => void };
type Options<Frame> = { worker: () => Worker; render: (context: CanvasRenderingContext2D, frame: Frame) => void; present?: (context: CanvasRenderingContext2D, frame: Frame) => void; snapshot: (frame: Frame) => Frame; label: string };
export function createBitmapPainter<Frame extends BitmapFrame>(canvas: HTMLCanvasElement, options: Options<Frame>): BitmapPainter<Frame> {
  const context = canvas.getContext("2d");
  let worker: Worker | null = null;
  let ready = false;
  let busy = false;
  let disposed = false;
  let latest: Frame | null = null;
  let pending: Frame | null = null;
  let inFlight: Frame | null = null;
  let presented: Frame | null = null;
  let sequence = 0;

  const fallback = () => {
    worker?.terminate();
    worker = null;
    ready = false;
    busy = false;
    pending = null;
    inFlight = null;
    canvas.dataset[`${options.label}Renderer`] = "main";
    // A completed bitmap remains valid after a worker failure. Retain it until
    // there is a new state to draw, including reduced-motion/static frames.
    if (!disposed && context && latest && latest !== presented) {
      options.render(context, latest);
      presented = latest;
    }
  };
  const send = (frame: Frame) => {
    if (!worker) return;
    busy = true;
    inFlight = frame;
    try { worker.postMessage({ frame, sequence: ++sequence }); } catch { fallback(); }
  };

  // Keep the visible canvas on the main thread. This permits an immediate
  // fallback if workers, OffscreenCanvas, or worker loading are unavailable.
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && "transferToImageBitmap" in OffscreenCanvas.prototype) {
    try {
      worker = options.worker();
      worker.onmessage = (event: MessageEvent<{ ready?: boolean; failed?: boolean; bitmap?: ImageBitmap; sequence?: number }>) => {
        const { bitmap } = event.data;
        if (disposed || !worker) { bitmap?.close(); return; }
        if (event.data.failed) { fallback(); return; }
        if (event.data.ready) {
          ready = true;
          if (latest) send(latest);
          return;
        }
        busy = false;
        const rendered = inFlight;
        inFlight = null;
        if (bitmap && context && latest) {
          const width = Math.max(1, Math.round(latest.width * latest.ratio));
          const height = Math.max(1, Math.round(latest.height * latest.ratio));
          if (bitmap.width === width && bitmap.height === height) {
            if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, width, height);
            context.drawImage(bitmap, 0, 0);
            if (rendered) options.present?.(context, rendered);
            presented = rendered;
            canvas.dataset[`${options.label}Renderer`] = "worker";
            canvas.dataset[`${options.label}PaintedFrame`] = String(event.data.sequence);
          }
        }
        bitmap?.close();
        if (pending) { const next = pending; pending = null; send(next); }
      };
      worker.onerror = (event) => { event.preventDefault(); fallback(); };
      worker.onmessageerror = fallback;
    } catch { fallback(); }
  }

  return {
    paint(frame) {
      if (disposed || !context) return;
      latest = options.snapshot(frame);
      if (!worker || !ready) {
        options.render(context, latest);
        presented = latest;
        canvas.dataset[`${options.label}Renderer`] = "main";
      } else if (busy) {
        // At most one in-flight frame and one newest pending frame. A busy
        // renderer cannot build up a stale animation queue or grow memory.
        pending = latest;
      } else send(latest);
    },
    destroy() {
      disposed = true;
      worker?.terminate();
      worker = null;
      pending = latest = inFlight = presented = null;
    },
  };
}
