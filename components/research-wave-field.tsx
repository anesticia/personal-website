"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

type Source = { x: number; y: number; startedAt: number };

const BOUNDARIES = [0.26, 0.49, 0.73] as const;
const SPEEDS = [1, 0.74, 1.12, 0.66] as const;
const TARGET_FPS = 30;

function opticalY(y: number) {
  let optical = 0;
  let start = 0;
  for (let band = 0; band < SPEEDS.length; band += 1) {
    const end = BOUNDARIES[band] ?? 1;
    if (y <= end) return optical + (y - start) / SPEEDS[band];
    optical += (end - start) / SPEEDS[band];
    start = end;
  }
  return optical;
}

function physicalY(optical: number) {
  let consumed = 0;
  let start = 0;
  for (let band = 0; band < SPEEDS.length; band += 1) {
    const end = BOUNDARIES[band] ?? 1;
    const span = (end - start) / SPEEDS[band];
    if (optical <= consumed + span) return start + (optical - consumed) * SPEEDS[band];
    consumed += span;
    start = end;
  }
  return 1 + (optical - consumed) * SPEEDS[SPEEDS.length - 1];
}

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

    sourceRef.current.startedAt = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastFrame = 0;
    let lastTimeLabel = 0;
    let inViewport = true;

    const drawPath = (
      centerOpticalY: number,
      radius: number,
      width: number,
      height: number,
      alpha: number,
      restrictTo?: { boundary: number; above: boolean },
    ) => {
      const steps = width > 1400 ? 190 : width > 800 ? 160 : 126;
      context.beginPath();
      let drawing = false;

      for (let step = 0; step <= steps; step += 1) {
        const angle = (step / steps) * Math.PI * 2;
        const x = sourceRef.current.x + Math.cos(angle) * radius;
        const normalizedY = physicalY(centerOpticalY + Math.sin(angle) * radius);
        const allowed = !restrictTo || (restrictTo.above ? normalizedY <= restrictTo.boundary : normalizedY >= restrictTo.boundary);
        const inside = x >= -0.03 && x <= 1.03 && normalizedY >= -0.04 && normalizedY <= 1.04 && allowed;
        if (!inside) {
          drawing = false;
          continue;
        }
        const screenX = x * width;
        const screenY = normalizedY * height;
        if (!drawing) context.moveTo(screenX, screenY);
        else context.lineTo(screenX, screenY);
        drawing = true;
      }

      context.strokeStyle = `rgba(179,75,54,${alpha * 0.38})`;
      context.lineWidth = 3.2;
      context.stroke();
      context.strokeStyle = `rgba(43,31,24,${alpha})`;
      context.lineWidth = 1.05;
      context.stroke();
    };

    const draw = (now = 0) => {
      const box = canvas.getBoundingClientRect();
      const maxDpr = box.width > 1400 ? 1.35 : 1.5;
      const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      const pixelWidth = Math.max(1, Math.round(box.width * dpr));
      const pixelHeight = Math.max(1, Math.round(box.height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, box.width, box.height);

      const width = box.width;
      const height = box.height;
      const elapsed = reducedMotion.matches ? 2.4 : Math.max(0, (now - sourceRef.current.startedAt) / 1000);
      const layerEdges = [0, ...BOUNDARIES, 1];
      const layerFills = [
        "rgba(251,245,232,.12)",
        "rgba(179,75,54,.035)",
        "rgba(251,245,232,.16)",
        "rgba(37,29,24,.025)",
      ];

      layerFills.forEach((fill, index) => {
        context.fillStyle = fill;
        context.fillRect(0, layerEdges[index] * height, width, (layerEdges[index + 1] - layerEdges[index]) * height);
      });

      context.fillStyle = "rgba(78,55,40,.12)";
      const grid = width > 1200 ? 48 : 40;
      for (let x = grid / 2; x < width; x += grid) {
        for (let y = grid / 2; y < height; y += grid) context.fillRect(x, y, 1, 1);
      }

      BOUNDARIES.forEach((boundary, index) => {
        const y = boundary * height;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.strokeStyle = index === 1 ? "rgba(179,75,54,.32)" : "rgba(52,38,29,.21)";
        context.lineWidth = 1;
        context.setLineDash(index === 1 ? [7, 7] : [3, 7]);
        context.stroke();
        context.setLineDash([]);
      });

      const sourceOptical = opticalY(sourceRef.current.y);
      for (let ring = 0; ring < 13; ring += 1) {
        const radius = ((elapsed * 0.12 + ring * 0.105) % 1.38) + 0.018;
        const alpha = Math.max(0.06, 0.42 * (1 - radius / 1.45));
        drawPath(sourceOptical, radius, width, height, alpha);

        BOUNDARIES.forEach((boundary) => {
          const boundaryOptical = opticalY(boundary);
          const travel = Math.abs(sourceOptical - boundaryOptical);
          const reflectedRadius = radius - travel * 2;
          if (reflectedRadius <= 0.025) return;
          const sourceAbove = sourceRef.current.y < boundary;
          const mirroredCenter = boundaryOptical * 2 - sourceOptical;
          drawPath(mirroredCenter, reflectedRadius, width, height, alpha * 0.28, { boundary, above: sourceAbove });
        });
      }

      context.save();
      context.globalCompositeOperation = "destination-in";
      const fieldFade = context.createLinearGradient(0, 0, width, 0);
      fieldFade.addColorStop(0, "rgba(0,0,0,.08)");
      fieldFade.addColorStop(0.3, "rgba(0,0,0,.2)");
      fieldFade.addColorStop(0.5, "rgba(0,0,0,.76)");
      fieldFade.addColorStop(0.64, "rgba(0,0,0,1)");
      context.fillStyle = fieldFade;
      context.fillRect(0, 0, width, height);
      context.restore();

      const sensorX = width * 0.89;
      context.beginPath();
      context.moveTo(sensorX, height * 0.12);
      context.lineTo(sensorX, height * 0.88);
      context.strokeStyle = "rgba(37,29,24,.16)";
      context.setLineDash([2, 7]);
      context.stroke();
      context.setLineDash([]);

      context.beginPath();
      for (let y = height * 0.12; y <= height * 0.88; y += 3) {
        const normalizedY = y / height;
        const distance = Math.hypot(sensorX / width - sourceRef.current.x, opticalY(normalizedY) - sourceOptical);
        const layerResponse = 0.8 + SPEEDS[BOUNDARIES.filter((boundary) => normalizedY > boundary).length] * 0.22;
        const amplitude = Math.sin(distance * 67 - elapsed * 8.6) * Math.exp(-distance * 1.65) * layerResponse;
        const x = sensorX + amplitude * Math.min(18, width * 0.012);
        if (y === height * 0.12) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = "rgba(179,75,54,.82)";
      context.lineWidth = 1.35;
      context.stroke();

      const sourceX = sourceRef.current.x * width;
      const sourceY = sourceRef.current.y * height;
      const pulse = reducedMotion.matches ? 0 : Math.sin(elapsed * 5.2) * 2.2;
      context.beginPath();
      context.arc(sourceX, sourceY, 18 + pulse, 0, Math.PI * 2);
      context.strokeStyle = "rgba(179,75,54,.66)";
      context.lineWidth = 1.3;
      context.stroke();
      context.beginPath();
      context.arc(sourceX, sourceY, 5, 0, Math.PI * 2);
      context.fillStyle = "#b34b36";
      context.fill();

      context.fillStyle = "rgba(37,29,24,.68)";
      context.font = "500 11px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillText("SOURCE", sourceX + 25, sourceY - 10);
      if (width >= 700) {
        context.fillText("SENSOR", sensorX + 10, height * 0.12 - 8);
        layerEdges.slice(0, -1).forEach((start, index) => {
          const y = Math.max(112, start * height + 22);
          context.fillText(`LAYER 0${index + 1}  ·  c/c₀ ${SPEEDS[index].toFixed(2)}`, width * 0.58, y);
        });
      }

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
