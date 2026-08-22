"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const checkpoints = [
  { time: 200, rmse: 0.0173, note: "Short-horizon agreement" },
  { time: 1500, rmse: 0.01124, note: "Best recorded checkpoint" },
  { time: 4500, rmse: 0.10888, note: "Material deterioration begins" },
  { time: 9000, rmse: 0.19974, note: "Long-horizon divergence" },
] as const;

export function ReactionDiffusionHorizon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const compact = width < 560;
      const inset = compact
        ? { left: 34, right: 20, top: 34, bottom: 42 }
        : { left: 64, right: 42, top: 58, bottom: 62 };
      const plotWidth = width - inset.left - inset.right;
      const plotHeight = height - inset.top - inset.bottom;
      const maxTime = 9000;
      const maxRmse = 0.22;
      const point = (time: number, rmse: number) => ({
        x: inset.left + (time / maxTime) * plotWidth,
        y: inset.top + plotHeight - (rmse / maxRmse) * plotHeight,
      });

      context.strokeStyle = "rgba(239,229,213,.13)";
      context.lineWidth = 1;
      context.font = `${compact ? 9 : 10}px ui-monospace, SFMono-Regular, Consolas, monospace`;
      context.fillStyle = "rgba(239,229,213,.48)";
      context.textBaseline = "middle";
      for (let row = 0; row <= 4; row += 1) {
        const value = (maxRmse / 4) * row;
        const y = inset.top + plotHeight - (row / 4) * plotHeight;
        context.beginPath();
        context.moveTo(inset.left, y);
        context.lineTo(width - inset.right, y);
        context.stroke();
        if (!compact || row % 2 === 0) context.fillText(value.toFixed(2), 4, y);
      }

      const breakX = point(4500, 0).x;
      context.fillStyle = "rgba(239,123,84,.07)";
      context.fillRect(breakX, inset.top, width - inset.right - breakX, plotHeight);
      context.setLineDash([5, 7]);
      context.strokeStyle = "rgba(239,123,84,.46)";
      context.beginPath();
      context.moveTo(breakX, inset.top);
      context.lineTo(breakX, inset.top + plotHeight);
      context.stroke();
      context.setLineDash([]);

      context.beginPath();
      checkpoints.forEach((entry, index) => {
        const current = point(entry.time, entry.rmse);
        if (index === 0) context.moveTo(current.x, current.y);
        else context.lineTo(current.x, current.y);
      });
      context.strokeStyle = "#ef7b54";
      context.lineWidth = compact ? 2 : 2.5;
      context.stroke();

      checkpoints.forEach((entry, index) => {
        const current = point(entry.time, entry.rmse);
        context.beginPath();
        context.arc(current.x, current.y, index === active ? 7 : 4, 0, Math.PI * 2);
        context.fillStyle = index === active ? "#f4ead9" : "#ef7b54";
        context.fill();
        if (index === active) {
          context.beginPath();
          context.arc(current.x, current.y, 12, 0, Math.PI * 2);
          context.strokeStyle = "rgba(239,123,84,.62)";
          context.lineWidth = 1;
          context.stroke();
        }
      });

      context.fillStyle = "rgba(239,229,213,.55)";
      context.textBaseline = "top";
      checkpoints.forEach((entry) => {
        const current = point(entry.time, 0);
        const label = `t=${entry.time}`;
        const labelWidth = context.measureText(label).width;
        const x = Math.min(width - inset.right - labelWidth, Math.max(inset.left, current.x - labelWidth / 2));
        context.fillText(label, x, inset.top + plotHeight + 14);
      });

      context.fillStyle = "rgba(239,123,84,.72)";
      context.textBaseline = "top";
      context.fillText("MID-HORIZON BREAK", Math.min(breakX + 10, width - 130), inset.top + 12);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [active]);

  const selectFromPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalized = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const time = normalized * 9000;
    let nearest = 0;
    checkpoints.forEach((entry, index) => {
      if (Math.abs(entry.time - time) < Math.abs(checkpoints[nearest].time - time)) nearest = index;
    });
    setActive(nearest);
  };

  const selected = checkpoints[active];

  return (
    <section className="reaction-horizon" aria-label="Interactive long-horizon RMSE diagnostic">
      <header><span>Long-horizon diagnostic</span><small>Discrete reference / physics-only lane</small></header>
      <canvas ref={canvasRef} data-diagnostic="reaction-horizon" onPointerMove={selectFromPointer} onPointerDown={selectFromPointer} aria-label="RMSE checkpoints at time 200, 1500, 4500, and 9000" />
      <div className="reaction-horizon-readout" aria-live="polite">
        <span>t = {selected.time}</span>
        <strong>{selected.rmse.toFixed(5)} RMSE</strong>
        <small>{selected.note}</small>
      </div>
      <div className="reaction-horizon-controls" aria-label="Select a recorded horizon">
        {checkpoints.map((entry, index) => (
          <button key={entry.time} type="button" aria-pressed={index === active} onClick={() => setActive(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>t = {entry.time}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
