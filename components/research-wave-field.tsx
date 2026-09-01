"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import { createBitmapPainter } from "@/lib/bitmap-painter";
import { createResearchWaveRenderer, renderResearchWaveLabels, type ResearchWaveFrame } from "@/lib/research-wave-renderer";

type Source = { x: number; y: number; startedAt: number };

const TARGET_FPS = 30;

export function ResearchWaveField() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const sourceRef = useRef<Source>({ x: 0.72, y: 0.54, startedAt: 0 });
  const lastLabelUpdateRef = useRef(0);
  const [sourceLabel, setSourceLabel] = useState({ x: 72, y: 54 });
  const [impulse, setImpulse] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!root || !canvas || !context) return;
    // Keep the fallback's drawing state separate from bitmap presentation.
    const fallbackCanvas = document.createElement("canvas");
    const fallbackContext = fallbackCanvas.getContext("2d");
    if (!fallbackContext) return;
    const renderMain = createResearchWaveRenderer(fallbackContext, false);
    if (!renderMain) return;
    const painter = createBitmapPainter<ResearchWaveFrame>(canvas, {
      worker: () => new Worker(new URL("../workers/research-wave.worker.ts", import.meta.url)),
      render: (context, frame) => {
        renderMain(frame);
        if (canvas.width !== fallbackCanvas.width || canvas.height !== fallbackCanvas.height) {
          canvas.width = fallbackCanvas.width;
          canvas.height = fallbackCanvas.height;
        }
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(fallbackCanvas, 0, 0);
        renderResearchWaveLabels(context, frame);
      },
      present: renderResearchWaveLabels,
      snapshot: frame => frame,
      label: "field",
    });

    const portraitInstrument = canvas.getBoundingClientRect().width <= 900;
    if (portraitInstrument && sourceRef.current.x > 0.6) {
      sourceRef.current = { x: 0.52, y: sourceRef.current.y, startedAt: performance.now() };
      setSourceLabel({ x: 52, y: Math.round(sourceRef.current.y * 100) });
    } else {
      sourceRef.current.startedAt = performance.now();
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastFrame = 0;
    let lastTimeLabel = 0;
    let inViewport = true;

    const draw = (now = 0) => {
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(box.width > 1400 ? 1.35 : 1.5, window.devicePixelRatio || 1);
      const elapsed = reducedMotion.matches ? 2.4 : Math.max(0, (now - sourceRef.current.startedAt) / 1000);
      painter.paint({ width: box.width, height: box.height, ratio, elapsed, reducedMotion: reducedMotion.matches, source: { x: sourceRef.current.x, y: sourceRef.current.y } });
      if (timeRef.current && now - lastTimeLabel > 100) {
        timeRef.current.textContent = `t ${elapsed.toFixed(1)} s`;
        lastTimeLabel = now;
      }
    };

    const schedule = () => {
      if (!inViewport || document.hidden || reducedMotion.matches || frame) return;
      frame = requestAnimationFrame(loop);
    };
    const loop = (now: number) => {
      frame = 0;
      if (!inViewport || document.hidden) return;
      if (now - lastFrame >= 1000 / TARGET_FPS) {
        draw(now);
        lastFrame = now;
      }
      schedule();
    };
    const renderStatic = () => {
      if (!inViewport || document.hidden) return;
      draw(performance.now());
      if (!reducedMotion.matches) schedule();
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) renderStatic();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { rootMargin: "120px" });
    const resizeObserver = new ResizeObserver(renderStatic);
    const onVisibilityChange = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!document.hidden) renderStatic();
    };
    const onMotionChange = () => renderStatic();

    visibilityObserver.observe(root);
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionChange);
    renderStatic();

    return () => {
      painter.destroy();
      if (frame) cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, [impulse]);

  const commitSource = (x: number, y: number, restart: boolean) => {
    const next = { x: Math.max(0.5, Math.min(0.86, x)), y: Math.max(0.1, Math.min(0.9, y)) };
    sourceRef.current = { ...next, startedAt: performance.now() };
    const now = performance.now();
    if (restart || now - lastLabelUpdateRef.current > 80) {
      setSourceLabel({ x: Math.round(next.x * 100), y: Math.round(next.y * 100) });
      lastLabelUpdateRef.current = now;
    }
    if (restart) setImpulse((value) => value + 1);
  };

  const pointerSource = (event: ReactPointerEvent<HTMLCanvasElement>, restart: boolean) => {
    const box = event.currentTarget.getBoundingClientRect();
    commitSource((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height, restart);
  };

  const keyboardSource = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-0.025, 0], ArrowRight: [0.025, 0], ArrowUp: [0, -0.025], ArrowDown: [0, 0.025],
    };
    const delta = movement[event.key];
    if (!delta) return;
    event.preventDefault();
    commitSource(sourceRef.current.x + delta[0], sourceRef.current.y + delta[1], true);
  };

  return (
    <div ref={rootRef} className="research-wave-field">
      <canvas
        ref={canvasRef}
        data-field-model="reference"
        data-material-layers="4"
        data-target-fps={TARGET_FPS}
        aria-label="Interactive reference wave field through four material layers. Drag, tap, or use the arrow keys to relocate the source."
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointerSource(event, true);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) pointerSource(event, false);
        }}
        onKeyDown={keyboardSource}
      />
      <div className="research-wave-readout" aria-live="polite">
        <span>Reference field</span>
        <span>Four-layer medium</span>
        <span ref={timeRef}>t 0.0 s</span>
        <span>source {sourceLabel.x} · {sourceLabel.y}</span>
      </div>
      <p>Drag the source through the medium.</p>
    </div>
  );
}
