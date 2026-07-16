"use client";

import { useEffect, useRef } from "react";

const RAIL_WIDTH = 64;
const VERTICAL_INSET = 14;
const WAVE_GRID_SIZE = 192;
const MAX_WAVE_DISPLACEMENT = 21;
const SIMULATION_HZ = 60;
const MAX_CATCH_UP_STEPS = 60;
const MAX_WAVE_LIFETIME_MS = 6_500;

const STRAND_CONFIGS = [
  { offset: -6.5, strength: 0.72, courantSquared: 0.46, damping: 0.992, wavelength: 5.6, envelopeWidth: 6.8 },
  { offset: 0, strength: 1, courantSquared: 0.64, damping: 0.994, wavelength: 6.4, envelopeWidth: 7.6 },
  { offset: 6.5, strength: 0.86, courantSquared: 0.82, damping: 0.991, wavelength: 7.2, envelopeWidth: 8.4 },
] as const;

type WaveStrand = {
  current: Float32Array;
  previous: Float32Array;
  next: Float32Array;
  offset: number;
  strength: number;
  courantSquared: number;
  damping: number;
  wavelength: number;
  envelopeWidth: number;
  energy: number;
};

type WaveMotion = {
  strands: WaveStrand[];
  probeEnergy: number;
  driveEnergy: number;
  scrollDirection: -1 | 1;
  propagationDirection: -1 | 1;
  lastEmission: number;
  sourcePosition: number;
  energy: number;
  active: boolean;
  steps: number;
};

function createWaveMotion(): WaveMotion {
  return {
    strands: STRAND_CONFIGS.map((config) => ({
      current: new Float32Array(WAVE_GRID_SIZE),
      previous: new Float32Array(WAVE_GRID_SIZE),
      next: new Float32Array(WAVE_GRID_SIZE),
      ...config,
      energy: 0,
    })),
    probeEnergy: 0,
    driveEnergy: 0,
    scrollDirection: 1,
    propagationDirection: -1,
    lastEmission: 0,
    sourcePosition: 0,
    energy: 0,
    active: false,
    steps: 0,
  };
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function scrollImmediately(top: number) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo({ top, behavior: "auto" });
  root.style.scrollBehavior = previousBehavior;
}

function clearWave(motion: WaveMotion) {
  for (const strand of motion.strands) {
    strand.current.fill(0);
    strand.previous.fill(0);
    strand.next.fill(0);
    strand.energy = 0;
  }
  motion.probeEnergy = 0;
  motion.driveEnergy = 0;
  motion.energy = 0;
  motion.active = false;
}

function injectWave(
  motion: WaveMotion,
  position: number,
  impulse: number,
  propagationDirection: -1 | 1,
) {
  const source = Math.round(clamp(position) * (WAVE_GRID_SIZE - 1));
  const radius = 18;
  const baseAmplitude = 0.22 + impulse * 0.62;

  // A Gaussian-modulated carrier creates a finite train of crests and troughs.
  // Pairing its displacement with the matching initial velocity selects one
  // travelling branch of the 1-D wave equation instead of a symmetric pluck.
  for (const strand of motion.strands) {
    const packet = new Float32Array(radius * 2 + 3);
    for (let offset = -radius - 1; offset <= radius + 1; offset += 1) {
      const normalized = offset / strand.envelopeWidth;
      const envelope = Math.exp(-0.5 * normalized * normalized);
      const carrier = Math.cos((Math.PI * 2 * offset) / strand.wavelength);
      packet[offset + radius + 1] = (
        envelope * carrier * baseAmplitude * strand.strength
      );
    }

    const courant = Math.sqrt(strand.courantSquared);
    for (let offset = -radius; offset <= radius; offset += 1) {
      const index = source + offset;
      if (index <= 0 || index >= WAVE_GRID_SIZE - 1) continue;
      const packetIndex = offset + radius + 1;
      const displacement = packet[packetIndex];
      const spatialDerivative = (packet[packetIndex + 1] - packet[packetIndex - 1]) * 0.5;
      const previousDisplacement = displacement + propagationDirection * courant * spatialDerivative;
      strand.current[index] = clamp(strand.current[index] + displacement, -1.5, 1.5);
      strand.previous[index] = clamp(strand.previous[index] + previousDisplacement, -1.5, 1.5);
    }
  }

  motion.propagationDirection = propagationDirection;
  motion.sourcePosition = clamp(position);
  motion.probeEnergy = Math.max(motion.probeEnergy, impulse);
  motion.active = true;
}

function stepWave(motion: WaveMotion, simulationSteps: number) {
  for (let substep = 0; substep < simulationSteps; substep += 1) {
    for (const strand of motion.strands) {
      for (let index = 1; index < WAVE_GRID_SIZE - 1; index += 1) {
        const laplacian = strand.current[index - 1] - 2 * strand.current[index] + strand.current[index + 1];
        const edgeDistance = Math.min(index, WAVE_GRID_SIZE - 1 - index);
        const absorbingLayer = edgeDistance < 14 ? 0.94 + edgeDistance * 0.0034 : 1;
        const velocity = (strand.current[index] - strand.previous[index]) * strand.damping;
        strand.next[index] = (strand.current[index] + velocity + strand.courantSquared * laplacian) * absorbingLayer;
      }
      strand.next[0] = strand.next[1] * 0.88;
      strand.next[WAVE_GRID_SIZE - 1] = strand.next[WAVE_GRID_SIZE - 2] * 0.88;
      const recycled = strand.previous;
      strand.previous = strand.current;
      strand.current = strand.next;
      strand.next = recycled;
      let mean = 0;
      for (let index = 0; index < WAVE_GRID_SIZE; index += 1) mean += strand.current[index];
      mean /= WAVE_GRID_SIZE;
      for (let index = 0; index < WAVE_GRID_SIZE; index += 1) strand.current[index] -= mean;
    }
    motion.steps += 1;
  }

  let combinedEnergySquared = 0;
  for (const strand of motion.strands) {
    let energySquared = 0;
    for (let index = 0; index < WAVE_GRID_SIZE - 1; index += 1) {
      const velocity = strand.current[index] - strand.previous[index];
      const gradient = strand.current[index + 1] - strand.current[index];
      energySquared += velocity ** 2 + strand.courantSquared * gradient ** 2;
    }
    strand.energy = Math.sqrt(energySquared / WAVE_GRID_SIZE);
    combinedEnergySquared += strand.energy ** 2;
  }
  motion.energy = Math.sqrt(combinedEnergySquared / motion.strands.length);
  if (motion.energy < 0.0015 && motion.probeEnergy < 0.012) clearWave(motion);
}

function sampleField(field: Float32Array, position: number) {
  const coordinate = clamp(position) * (field.length - 1);
  const lower = Math.floor(coordinate);
  const upper = Math.min(field.length - 1, lower + 1);
  const mix = coordinate - lower;
  return field[lower] * (1 - mix) + field[upper] * mix;
}

function drawWave(canvas: HTMLCanvasElement, progress: number, emphasized: boolean, motion: WaveMotion) {
  const width = canvas.clientWidth || RAIL_WIDTH;
  const height = canvas.clientHeight || window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const renderWidth = Math.max(1, Math.round(width * ratio));
  const renderHeight = Math.max(1, Math.round(height * ratio));

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth;
    canvas.height = renderHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const usableHeight = Math.max(1, height - VERTICAL_INSET * 2);
  const centerX = width - 26;
  const strandSamples = motion.strands.map((strand) => {
    const samples: Array<{ x: number; y: number }> = [];
    for (let pixel = 0; pixel <= Math.ceil(usableHeight); pixel += 1) {
      const position = clamp(pixel / usableHeight);
      samples.push({
        x: centerX + strand.offset + sampleField(strand.current, position) * MAX_WAVE_DISPLACEMENT,
        y: VERTICAL_INSET + pixel,
      });
    }
    return samples;
  });

  const stroke = (samples: Array<{ x: number; y: number }>, color: string, lineWidth: number) => {
    context.beginPath();
    samples.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
  };

  motion.strands.forEach((strand, strandIndex) => {
    const samples = strandSamples[strandIndex];
    stroke(samples, "rgba(27, 30, 25, 0.76)", emphasized ? 2.15 : 1.75);
    stroke(samples, "rgba(235, 229, 213, 0.9)", emphasized ? 0.78 : 0.52);

    const energyBands = [
      { threshold: 0.018, width: 1.15, alpha: 0.36, glow: 0 },
      { threshold: 0.12, width: 2.15, alpha: 0.58, glow: 0 },
      { threshold: 0.28, width: 3.45, alpha: 0.88, glow: 5 },
    ];
    for (const band of energyBands) {
      context.beginPath();
      let drawing = false;
      for (let index = 1; index < samples.length; index += 1) {
        const previousPosition = (index - 1) / (samples.length - 1);
        const position = index / (samples.length - 1);
        const previousMagnitude = Math.abs(sampleField(strand.current, previousPosition));
        const magnitude = Math.abs(sampleField(strand.current, position));
        if (Math.max(previousMagnitude, magnitude) < band.threshold) {
          drawing = false;
          continue;
        }
        if (!drawing) context.moveTo(samples[index - 1].x, samples[index - 1].y);
        context.lineTo(samples[index].x, samples[index].y);
        drawing = true;
      }
      context.strokeStyle = `rgba(223, 132, 88, ${band.alpha})`;
      context.lineWidth = band.width;
      context.shadowColor = "rgba(223, 132, 88, 0.34)";
      context.shadowBlur = band.glow;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
      context.shadowBlur = 0;
    }
  });

  const probeIndex = Math.round(clamp(progress) * (strandSamples[0].length - 1));
  const probe = {
    x: strandSamples.reduce((sum, samples) => sum + samples[probeIndex].x, 0) / strandSamples.length,
    y: strandSamples[0][probeIndex].y,
  };
  const probeRadius = (emphasized ? 7.5 : 6.5) + motion.probeEnergy * 1.2;

  context.beginPath();
  context.arc(probe.x, probe.y, probeRadius + 4 + motion.probeEnergy * 3, 0, Math.PI * 2);
  context.fillStyle = `rgba(223, 132, 88, ${0.06 + motion.probeEnergy * 0.14})`;
  context.fill();

  context.beginPath();
  context.moveTo(Math.max(2, probe.x - 18), probe.y);
  context.lineTo(Math.min(width - 2, probe.x + 18), probe.y);
  context.moveTo(probe.x, probe.y - 13);
  context.lineTo(probe.x, probe.y + 13);
  context.strokeStyle = "rgba(223, 132, 88, 0.98)";
  context.lineWidth = (emphasized ? 1.7 : 1.3) + motion.probeEnergy * 0.55;
  context.stroke();

  context.beginPath();
  context.arc(probe.x, probe.y, probeRadius + 2.25, 0, Math.PI * 2);
  context.fillStyle = "rgba(27, 30, 25, 0.76)";
  context.fill();

  context.beginPath();
  context.arc(probe.x, probe.y, probeRadius, 0, Math.PI * 2);
  context.strokeStyle = "#df8458";
  context.lineWidth = 2;
  context.stroke();

  context.beginPath();
  context.arc(probe.x, probe.y, 2, 0, Math.PI * 2);
  context.fillStyle = "#ebe5d5";
  context.fill();
}

export function WaveScrollbar() {
  const railRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const emphasizedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const motionRef = useRef<WaveMotion>(createWaveMotion());

  useEffect(() => {
    const rail = railRef.current;
    const canvas = canvasRef.current;
    if (!rail || !canvas) return;

    const precisePointer = window.matchMedia("(min-width: 901px) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastFrameTime = 0;
    let lastScrollY = window.scrollY;

    const render = (time: number) => {
      frameRef.current = null;
      const motion = motionRef.current;
      const waveExpired = motion.lastEmission > 0 && time - motion.lastEmission >= MAX_WAVE_LIFETIME_MS;
      if (waveExpired) {
        clearWave(motion);
      } else if (!reducedMotion.matches && (motion.active || motion.probeEnergy > 0)) {
        const elapsed = lastFrameTime > 0 ? Math.min(1, (time - lastFrameTime) / 1_000) : 1 / SIMULATION_HZ;
        const simulationSteps = Math.min(
          MAX_CATCH_UP_STEPS,
          Math.max(1, Math.round(elapsed * SIMULATION_HZ)),
        );
        stepWave(motion, simulationSteps);
        motion.probeEnergy *= Math.exp(-elapsed * 4.2);
        motion.driveEnergy *= Math.exp(-elapsed * 3.1);
        if (motion.probeEnergy < 0.012) motion.probeEnergy = 0;
        if (motion.driveEnergy < 0.01) motion.driveEnergy = 0;
      } else if (reducedMotion.matches) {
        clearWave(motion);
      }
      lastFrameTime = time;
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const progress = maximum > 0 ? clamp(window.scrollY / maximum) : 0;
      progressRef.current = progress;
      rail.dataset.progress = progress.toFixed(4);
      rail.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
      rail.setAttribute("aria-valuetext", `${Math.round(progress * 100)}% through the page`);
      rail.hidden = maximum <= 1;
      let peakIndex = 0;
      let peakMagnitude = 0;
      let signature = 0;
      for (const strand of motion.strands) {
        for (let index = 0; index < WAVE_GRID_SIZE; index += 1) {
          const magnitude = Math.abs(strand.current[index]);
          if (magnitude > peakMagnitude) {
            peakMagnitude = magnitude;
            peakIndex = index;
          }
          signature += strand.current[index] * (index + 1) * (strand.offset + 8);
        }
      }
      const animating = motion.active || motion.probeEnergy > 0;
      rail.dataset.waveAnimating = String(animating);
      rail.dataset.waveState = animating ? "propagating" : "still";
      rail.dataset.waveDirection = motion.scrollDirection > 0 ? "down" : "up";
      rail.dataset.wavePropagation = motion.propagationDirection > 0 ? "down" : "up";
      rail.dataset.waveSource = motion.sourcePosition.toFixed(4);
      rail.dataset.waveEnergy = motion.energy.toFixed(4);
      rail.dataset.waveDrive = motion.driveEnergy.toFixed(3);
      rail.dataset.wavePeak = (peakIndex / (WAVE_GRID_SIZE - 1)).toFixed(4);
      rail.dataset.waveMaxDisplacement = (peakMagnitude * MAX_WAVE_DISPLACEMENT).toFixed(3);
      rail.dataset.waveSignature = signature.toFixed(4);
      rail.dataset.waveSteps = String(motion.steps);
      rail.dataset.waveSolver = "fdtd-1d";
      rail.dataset.waveGrid = String(WAVE_GRID_SIZE);
      rail.dataset.waveStrands = String(motion.strands.length);
      rail.dataset.waveCourant = motion.strands.map((strand) => Math.sqrt(strand.courantSquared).toFixed(3)).join(",");
      rail.dataset.waveStrengths = motion.strands.map((strand) => strand.strength.toFixed(2)).join(",");
      document.documentElement.classList.toggle("wave-scrollbar-active", precisePointer.matches && maximum > 1);
      drawWave(canvas, progress, emphasizedRef.current, motion);
      if (animating) scheduleRender();
    };

    const scheduleRender = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(render);
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      if (!reducedMotion.matches && Math.abs(delta) > 0.25) {
        const motion = motionRef.current;
        motion.scrollDirection = delta > 0 ? 1 : -1;
        const propagationDirection = motion.scrollDirection > 0 ? -1 : 1;
        const instantaneousImpulse = clamp(Math.abs(delta) / 105, 0.16, 0.94);
        motion.driveEnergy = clamp(motion.driveEnergy * 0.62 + instantaneousImpulse * 0.78, 0.16, 1);
        const impulse = motion.driveEnergy;
        const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = clamp(scrollY / maximum);
        const now = performance.now();
        if (now - motion.lastEmission >= 58) {
          injectWave(motion, progress, impulse, propagationDirection);
          motion.lastEmission = now;
        }
        lastFrameTime = 0;
      }
      lastScrollY = scrollY;
      scheduleRender();
    };

    const scrollToPointer = (clientY: number) => {
      const bounds = rail.getBoundingClientRect();
      const position = clamp((clientY - bounds.top - VERTICAL_INSET) / Math.max(1, bounds.height - VERTICAL_INSET * 2));
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      scrollImmediately(maximum * position);
      progressRef.current = position;
      scheduleRender();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (draggingRef.current) scrollToPointer(event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      emphasizedRef.current = false;
      rail.releasePointerCapture?.(event.pointerId);
      scheduleRender();
    };

    const handleMediaChange = () => {
      if (reducedMotion.matches) {
        clearWave(motionRef.current);
      }
      scheduleRender();
    };
    const resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleRender, { passive: true });
    rail.addEventListener("pointermove", handlePointerMove);
    rail.addEventListener("pointerup", handlePointerUp);
    rail.addEventListener("pointercancel", handlePointerUp);
    precisePointer.addEventListener("change", handleMediaChange);
    reducedMotion.addEventListener("change", handleMediaChange);
    scheduleRender();

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleRender);
      rail.removeEventListener("pointermove", handlePointerMove);
      rail.removeEventListener("pointerup", handlePointerUp);
      rail.removeEventListener("pointercancel", handlePointerUp);
      precisePointer.removeEventListener("change", handleMediaChange);
      reducedMotion.removeEventListener("change", handleMediaChange);
      document.documentElement.classList.remove("wave-scrollbar-active");
    };
  }, []);

  const moveBy = (amount: number) => window.scrollBy({ top: amount, behavior: "smooth" });

  return (
    <div
      ref={railRef}
      className="wave-scrollbar"
      role="scrollbar"
      aria-label="Page position"
      aria-controls="main"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      onFocus={() => {
        emphasizedRef.current = true;
        if (canvasRef.current) drawWave(canvasRef.current, progressRef.current, true, motionRef.current);
      }}
      onBlur={() => {
        emphasizedRef.current = false;
        if (canvasRef.current) drawWave(canvasRef.current, progressRef.current, false, motionRef.current);
      }}
      onPointerEnter={() => {
        emphasizedRef.current = true;
        if (canvasRef.current) drawWave(canvasRef.current, progressRef.current, true, motionRef.current);
      }}
      onPointerLeave={() => {
        if (draggingRef.current) return;
        emphasizedRef.current = false;
        if (canvasRef.current) drawWave(canvasRef.current, progressRef.current, false, motionRef.current);
      }}
      onPointerDown={(event) => {
        draggingRef.current = true;
        emphasizedRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = clamp((event.clientY - bounds.top - VERTICAL_INSET) / Math.max(1, bounds.height - VERTICAL_INSET * 2));
        const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        scrollImmediately(maximum * position);
      }}
      onKeyDown={(event) => {
        const pageStep = window.innerHeight * 0.82;
        if (event.key === "ArrowDown") moveBy(64);
        else if (event.key === "ArrowUp") moveBy(-64);
        else if (event.key === "PageDown" || event.key === " ") moveBy(pageStep);
        else if (event.key === "PageUp") moveBy(-pageStep);
        else if (event.key === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
        else if (event.key === "End") window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
        else return;
        event.preventDefault();
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
