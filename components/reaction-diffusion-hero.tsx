"use client";

import { useEffect, useRef } from "react";
import { createCanvasRenderer, createWebGLRenderer } from "@/lib/reaction-renderer";
import { createReactionPainter } from "@/lib/reaction-painter";

const HERO_HISTORY_LENGTH = 84;
const PUBLICATION_HISTORY_LENGTH = 280;
const FRAME_INTERVAL = 1000 / 30;
const POINTER_RADIUS_SCALE = 0.009;
const POINTER_MINIMUM_RADIUS = 2;
const POINTER_INJECTION_STRENGTH = 1;

type PointerSeed = { x: number; y: number };
type SimulationVariant = "hero" | "publication";
type SimulationField = {
  u: Float32Array;
  v: Float32Array;
  nextU: Float32Array;
  nextV: Float32Array;
};
type DebugCanvas = HTMLCanvasElement & {
  __reactionDiffusionState?: Uint8Array;
  __reactionDiffusionSize?: [number, number];
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = state + 0x6d2b79f5 | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function ReactionDiffusionCanvas({ variant = "hero", minimumFieldAspect = 0.35 }: { variant?: SimulationVariant; minimumFieldAspect?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let canvas = canvasRef.current as DebugCanvas | null;
    if (!canvas) return;
    const initialCanvas = canvas;
    const closestSurface = variant === "hero" ? canvas.closest<HTMLElement>(".hero") ?? canvas.parentElement : canvas.parentElement;
    if (!closestSurface) return;
    const surface: HTMLElement = closestSurface;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canUseWorker = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && "transferToImageBitmap" in OffscreenCanvas.prototype;
    const webgl = canUseWorker ? null : canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true });
    const fallbackContext = webgl ? null : canvas.getContext("2d", { alpha: false });
    if (!webgl && !fallbackContext) return;
    let renderer = webgl ? createWebGLRenderer(canvas, webgl, variant) : canUseWorker ? createReactionPainter(canvas, variant) : createCanvasRenderer(canvas, fallbackContext!, variant);
    let usingFallback = !webgl;

    let width = 0;
    let height = 0;
    let baseField: SimulationField = { u: new Float32Array(), v: new Float32Array(), nextU: new Float32Array(), nextV: new Float32Array() };
    let interactionField: SimulationField | null = null;
    let history: Uint8Array[] = [];
    let playhead = 0;
    let direction = -1;
    let pendingSeeds: PointerSeed[] = [];
    let interactionFrame: Uint8Array<ArrayBufferLike> = new Uint8Array();
    let compositeFrame: Uint8Array<ArrayBufferLike> = new Uint8Array();
    let interactionMix = 0;
    let lastPointerTime = 0;
    let holdRemaining = 0;
    let visible = false;
    let animationFrame = 0;
    let resizeTimer = 0;
    let previousFrameTime = 0;
    let averageWorkTime = 0;
    let interactionRadius = 2;
    let lastRenderedState: Uint8Array | null = null;

    const feed = variant === "hero" ? 0.037 : 0.0545;
    const kill = variant === "hero" ? 0.06 : 0.062;
    const historyLength = variant === "hero" ? HERO_HISTORY_LENGTH : PUBLICATION_HISTORY_LENGTH;
    const stepsPerFrame = variant === "hero" ? 5 : 6;
    const warmupSteps = variant === "hero" ? 128 : 120;
    const playbackStride = variant === "hero" ? 1 : 3;
    const endHoldFrames = variant === "hero" ? 6 : 18;
    const startHoldFrames = variant === "hero" ? 4 : 8;

    canvas.dataset.renderer = renderer.kind;
    canvas.dataset.timelineFrames = String(historyLength);
    canvas.dataset.stepsPerFrame = String(stepsPerFrame);
    canvas.dataset.warmupSteps = String(warmupSteps);
    canvas.dataset.playbackStride = String(playbackStride);
    canvas.dataset.endHoldFrames = String(endHoldFrames);
    canvas.dataset.interactionStrength = POINTER_INJECTION_STRENGTH.toFixed(2);
    canvas.dataset.interacting = "false";

    function setPlaybackState(phase: string, frame: number, playbackDirection: number) {
      canvas!.dataset.phase = phase;
      canvas!.dataset.frame = String(frame);
      canvas!.dataset.direction = String(playbackDirection);
      canvas!.dataset.history = String(history.length);
      canvas!.dataset.workMs = averageWorkTime.toFixed(2);
    }

    function createField(fillU = false): SimulationField {
      const cells = width * height;
      return {
        u: fillU ? new Float32Array(cells).fill(1) : new Float32Array(cells),
        v: new Float32Array(cells),
        nextU: new Float32Array(cells),
        nextV: new Float32Array(cells),
      };
    }

    function seedAt(field: SimulationField, x: number, y: number, radius: number, strength = 1) {
      const radiusSquared = radius * radius;
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          if (offsetX * offsetX + offsetY * offsetY > radiusSquared) continue;
          const px = (x + offsetX + width) % width;
          const py = (y + offsetY + height) % height;
          const cell = py * width + px;
          const falloff = 1 - Math.sqrt(offsetX * offsetX + offsetY * offsetY) / Math.max(1, radius);
          const targetU = 0.12 + (1 - falloff) * 0.24;
          const targetV = 0.72 + falloff * 0.24;
          field.u[cell] = Math.min(field.u[cell], field.u[cell] + (targetU - field.u[cell]) * strength);
          field.v[cell] = Math.max(field.v[cell], field.v[cell] + (targetV - field.v[cell]) * strength);
        }
      }
    }

    function simulate(field: SimulationField) {
      const killAndFeed = kill + feed;
      for (let y = 0; y < height; y += 1) {
        const upRow = (y === 0 ? height - 1 : y - 1) * width;
        const row = y * width;
        const downRow = (y === height - 1 ? 0 : y + 1) * width;
        for (let x = 0; x < width; x += 1) {
          const left = x === 0 ? width - 1 : x - 1;
          const right = x === width - 1 ? 0 : x + 1;
          const center = row + x;
          const localU = field.u[center];
          const localV = field.v[center];
          const laplacianU = -localU + 0.2 * (field.u[row + left] + field.u[row + right] + field.u[upRow + x] + field.u[downRow + x]) + 0.05 * (field.u[upRow + left] + field.u[upRow + right] + field.u[downRow + left] + field.u[downRow + right]);
          const laplacianV = -localV + 0.2 * (field.v[row + left] + field.v[row + right] + field.v[upRow + x] + field.v[downRow + x]) + 0.05 * (field.v[upRow + left] + field.v[upRow + right] + field.v[downRow + left] + field.v[downRow + right]);
          const reaction = localU * localV * localV;
          field.nextU[center] = clamp(localU + laplacianU - reaction + feed * (1 - localU));
          field.nextV[center] = clamp(localV + 0.5 * laplacianV + reaction - killAndFeed * localV);
        }
      }
      [field.u, field.nextU] = [field.nextU, field.u];
      [field.v, field.nextV] = [field.nextV, field.v];
    }

    function captureState(field: SimulationField, reusable?: Uint8Array) {
      const snapshot = reusable?.length === field.u.length * 2 ? reusable : new Uint8Array(field.u.length * 2);
      for (let cell = 0; cell < field.u.length; cell += 1) {
        snapshot[cell * 2] = Math.round(field.u[cell] * 255);
        snapshot[cell * 2 + 1] = Math.round(field.v[cell] * 255);
      }
      return snapshot;
    }

    function restoreState(field: SimulationField, snapshot: Uint8Array) {
      for (let cell = 0; cell < field.u.length; cell += 1) {
        field.u[cell] = snapshot[cell * 2] / 255;
        field.v[cell] = snapshot[cell * 2 + 1] / 255;
      }
    }

    function renderState(snapshot: Uint8Array) {
      // Autonomous history snapshots are immutable. Hold frames can retain the
      // existing pixels, while the mutable pointer field must always render.
      if (!interactionField && snapshot === lastRenderedState) return;
      canvas!.__reactionDiffusionState = snapshot;
      canvas!.__reactionDiffusionSize = [width, height];
      renderer.render(snapshot, width, height);
      lastRenderedState = snapshot;
    }

    function blendStates(baseSnapshot: Uint8Array, overlaySnapshot: Uint8Array, mix: number) {
      compositeFrame = compositeFrame.length === baseSnapshot.length ? compositeFrame : new Uint8Array(baseSnapshot.length);
      for (let index = 0; index < baseSnapshot.length; index += 1) {
        compositeFrame[index] = Math.round(baseSnapshot[index] + (overlaySnapshot[index] - baseSnapshot[index]) * mix);
      }
      return compositeFrame;
    }

    function renderWithInteractions(baseSnapshot: Uint8Array) {
      if (!interactionField && pendingSeeds.length === 0) {
        canvas!.dataset.interacting = "false";
        renderState(baseSnapshot);
        return;
      }

      if (!interactionField) {
        interactionField = createField();
        restoreState(interactionField, baseSnapshot);
      }
      for (const seed of pendingSeeds) {
        seedAt(
          interactionField,
          Math.round(seed.x * (width - 1)),
          Math.round(seed.y * (height - 1)),
          interactionRadius,
          POINTER_INJECTION_STRENGTH,
        );
      }
      pendingSeeds = [];
      const interactionSteps = 4;
      for (let step = 0; step < interactionSteps; step += 1) simulate(interactionField);
      interactionFrame = captureState(interactionField, interactionFrame);

      if (performance.now() - lastPointerTime > 180) interactionMix = Math.max(0, interactionMix - 0.075);
      renderState(interactionMix >= 0.999 ? interactionFrame : blendStates(baseSnapshot, interactionFrame, interactionMix));
      if (interactionMix <= 0) interactionField = null;
      canvas!.dataset.interacting = interactionField ? "true" : "false";
    }

    function switchToCanvasFallback(event: Event) {
      event.preventDefault();
      if (usingFallback || !canvas) return;
      usingFallback = true;
      renderer.destroy();

      const replacement = document.createElement("canvas") as DebugCanvas;
      replacement.className = canvas.className;
      Object.assign(replacement.dataset, canvas.dataset);
      replacement.setAttribute("aria-hidden", "true");
      canvas.replaceWith(replacement);
      canvas = replacement;
      canvasRef.current = replacement;

      const context = replacement.getContext("2d", { alpha: false });
      if (!context) return;
      renderer = createCanvasRenderer(replacement, context, variant);
      replacement.dataset.renderer = renderer.kind;
      initialize();
    }

    function initialize() {
      const bounds = surface.getBoundingClientRect();
      const aspect = Math.max(0.35, minimumFieldAspect, bounds.width / Math.max(bounds.height, 1));
      const hardwareThreads = navigator.hardwareConcurrency || 4;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
      const lowPower = hardwareThreads <= 4 || memory <= 2;
      const compactViewport = window.innerWidth < 700;
      const deviceMaximumDimension = compactViewport ? (lowPower ? 220 : 280) : (lowPower ? 280 : 360);
      const maximumDimension = variant === "publication" ? Math.round(deviceMaximumDimension * 0.9) : deviceMaximumDimension;
      if (aspect >= 1) {
        width = maximumDimension;
        height = Math.max(96, Math.round(maximumDimension / aspect));
      } else {
        height = maximumDimension;
        width = Math.max(96, Math.round(maximumDimension * aspect));
      }

      const targetDpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.15 : 1.75);
      const maximumPixels = lowPower ? 1_300_000 : 2_600_000;
      const requestedPixels = bounds.width * bounds.height * targetDpr * targetDpr;
      const quality = requestedPixels > maximumPixels ? targetDpr * Math.sqrt(maximumPixels / requestedPixels) : targetDpr;
      renderer.resize(bounds.width, bounds.height, quality);
      canvas!.dataset.quality = quality.toFixed(2);
      canvas!.dataset.backing = `${canvas!.width}x${canvas!.height}`;
      canvas!.dataset.simulationGrid = `${width}x${height}`;
      interactionRadius = Math.max(POINTER_MINIMUM_RADIUS, Math.round(maximumDimension * POINTER_RADIUS_SCALE));
      canvas!.dataset.interactionRadius = String(interactionRadius);

      baseField = createField(true);
      interactionField = null;
      history = [];
      pendingSeeds = [];
      interactionFrame = new Uint8Array();
      compositeFrame = new Uint8Array();
      interactionMix = 0;
      lastPointerTime = 0;
      holdRemaining = 0;
      playhead = 0;
      direction = -1;
      averageWorkTime = 0;

      const random = createRandom(variant === "hero" ? 0x4a5c31 : 0x7f2d19);
      const spacing = variant === "hero" ? 22 : 28;
      const columns = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const shouldSeed = variant === "hero" ? random() > 0.28 : (row + column) % 3 === 0 || random() > 0.65;
          if (!shouldSeed) continue;
          seedAt(
            baseField,
            Math.round((column + 0.28 + random() * 0.44) * (width / columns)),
            Math.round((row + 0.28 + random() * 0.44) * (height / rows)),
            Math.max(3, Math.round(maximumDimension / 75)),
          );
        }
      }

      for (let warmup = 0; warmup < warmupSteps; warmup += 1) simulate(baseField);
      const initial = captureState(baseField);
      history.push(initial);
      renderState(initial);
      setPlaybackState(reducedMotion ? "static" : "recording", 0, 0);
    }

    function updateFrame() {
      const started = performance.now();
      if (history.length < historyLength) {
        for (let step = 0; step < stepsPerFrame; step += 1) simulate(baseField);
        const snapshot = captureState(baseField);
        history.push(snapshot);
        playhead = history.length - 1;
        renderWithInteractions(snapshot);
        setPlaybackState("recording", playhead, 1);
        if (history.length === historyLength) {
          direction = -1;
          holdRemaining = endHoldFrames;
          setPlaybackState("hold-end", playhead, 0);
        }
      } else {
        if (holdRemaining > 0) {
          holdRemaining -= 1;
        } else {
          playhead += direction * playbackStride;
          if (playhead <= 0) {
            playhead = 0;
            direction = 1;
            holdRemaining = startHoldFrames;
          } else if (playhead >= history.length - 1) {
            playhead = history.length - 1;
            direction = -1;
            holdRemaining = endHoldFrames;
          }
        }
        renderWithInteractions(history[playhead]);
        const phase = holdRemaining > 0 ? (playhead === 0 ? "hold-start" : "hold-end") : direction < 0 ? "reverse" : "forward";
        setPlaybackState(phase, playhead, holdRemaining > 0 ? 0 : direction);
      }
      const workTime = performance.now() - started;
      averageWorkTime = averageWorkTime === 0 ? workTime : averageWorkTime * 0.9 + workTime * 0.1;
      canvas!.dataset.workMs = averageWorkTime.toFixed(2);
    }

    function animate(time: number) {
      if (visible && !document.hidden && time - previousFrameTime >= FRAME_INTERVAL) {
        previousFrameTime = time - (time - previousFrameTime) % FRAME_INTERVAL;
        updateFrame();
      }
      animationFrame = requestAnimationFrame(animate);
    }

    function queuePointerSeed(event: PointerEvent) {
      const bounds = surface.getBoundingClientRect();
      const seed = { x: clamp((event.clientX - bounds.left) / bounds.width), y: clamp((event.clientY - bounds.top) / bounds.height) };
      canvas!.dataset.pointerX = seed.x.toFixed(4);
      canvas!.dataset.pointerY = seed.y.toFixed(4);
      pendingSeeds.push(seed);
      if (pendingSeeds.length > 8) pendingSeeds.shift();
      lastPointerTime = performance.now();
      interactionMix = 1;
      canvas!.dataset.interacting = "true";
    }

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.01 });
    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(initialize, 180);
    };

    initialCanvas.addEventListener("webglcontextlost", switchToCanvasFallback);
    initialize();
    observer.observe(surface);
    window.addEventListener("resize", handleResize, { passive: true });
    if (!reducedMotion) {
      surface.addEventListener("pointermove", queuePointerSeed, { passive: true });
      surface.addEventListener("pointerdown", queuePointerSeed, { passive: true });
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      initialCanvas.removeEventListener("webglcontextlost", switchToCanvasFallback);
      surface.removeEventListener("pointermove", queuePointerSeed);
      surface.removeEventListener("pointerdown", queuePointerSeed);
      renderer.destroy();
      history = [];
      pendingSeeds = [];
      interactionField = null;
      if (canvas) {
        delete canvas.__reactionDiffusionState;
        delete canvas.__reactionDiffusionSize;
      }
    };
  }, [minimumFieldAspect, variant]);

  return <canvas ref={canvasRef} className={`reaction-diffusion-canvas reaction-diffusion-canvas--${variant}`} data-simulation={variant} aria-hidden="true" />;
}

export function ReactionDiffusionHero() {
  return <ReactionDiffusionCanvas variant="hero" />;
}
