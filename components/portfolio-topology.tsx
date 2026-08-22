"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowIcon } from "@/components/icons";
import { atlasRecords, sharedAtlasMethods } from "@/data/atlas";
import { works } from "@/data/site";

const workMap = new Map(works.map((work) => [work.slug, work]));
type PlotPoint = { x: number; y: number; index: number };

function TopologyCanvas({ active, onActive }: { active: number; onActive: (index: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<PlotPoint[]>([]);
  const [rotation, setRotation] = useState({ yaw: -0.42, pitch: 0.72 });
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let animationFrame = 0;
    let lastFrame = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (time = 0) => {
      const box = canvas.getBoundingClientRect();
      const compact = box.width < 700;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(box.width * dpr);
      const pixelHeight = Math.round(box.height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, box.width, box.height);

      const surface = (x: number, z: number) => atlasRecords.reduce((sum, record) => {
        const dx = x - record.terrain[0];
        const dz = z - record.terrain[1];
        return sum + record.terrain[2] * Math.exp(-(dx * dx + dz * dz) * 5.4);
      }, 0) * 0.48;

      const project = (x: number, y: number, z: number) => {
        const cy = Math.cos(rotation.yaw);
        const sy = Math.sin(rotation.yaw);
        const cp = Math.cos(rotation.pitch);
        const sp = Math.sin(rotation.pitch);
        const rx = x * cy + z * sy;
        const rz = -x * sy + z * cy;
        const ry = y * cp - rz * sp;
        const depth = y * sp + rz * cp;
        const perspective = 2.4 / (depth + 3.7);
        const scale = Math.min(box.width * 0.37, box.height * 0.54);
        return [box.width * 0.47 + rx * perspective * scale, box.height * 0.64 - ry * perspective * scale] as const;
      };

      const lines = 25;
      context.lineWidth = 1;
      for (let axis = 0; axis < 2; axis += 1) {
        for (let row = 0; row < lines; row += 1) {
          context.beginPath();
          for (let column = 0; column < lines; column += 1) {
            const a = -1.25 + (row / (lines - 1)) * 2.5;
            const b = -1.25 + (column / (lines - 1)) * 2.5;
            const x = axis ? a : b;
            const z = axis ? b : a;
            const [screenX, screenY] = project(x, surface(x, z), z);
            if (column) context.lineTo(screenX, screenY); else context.moveTo(screenX, screenY);
          }
          context.strokeStyle = row % 4 === 0
            ? `rgba(96,52,33,${compact ? ".58" : ".38"})`
            : `rgba(96,52,33,${compact ? ".24" : ".14"})`;
          context.stroke();
        }
      }

      const projected = atlasRecords.map((record, index) => {
        const [x, y] = project(record.terrain[0], surface(record.terrain[0], record.terrain[1]) + 0.04, record.terrain[1]);
        const [baseX, baseY] = project(record.terrain[0], 0, record.terrain[1]);
        return { x, y, baseX, baseY, index };
      });
      const selected = projected[active];

      atlasRecords.forEach((record, index) => {
        if (index === active || !sharedAtlasMethods(atlasRecords[active], record).length) return;
        const point = projected[index];
        context.save();
        context.beginPath();
        context.moveTo(selected.x, selected.y);
        context.lineTo(point.x, point.y);
        context.setLineDash([8, 8]);
        context.lineDashOffset = -(time * 0.018);
        context.strokeStyle = `${record.accent}c9`;
        context.lineWidth = 1.8;
        context.stroke();
        context.setLineDash([]);
        const progress = (time * 0.00018 + index * 0.19) % 1;
        context.beginPath();
        context.arc(selected.x + (point.x - selected.x) * progress, selected.y + (point.y - selected.y) * progress, 3.5, 0, Math.PI * 2);
        context.fillStyle = record.accent;
        context.fill();
        context.restore();
      });

      pointsRef.current = projected.map(({ x, y, baseX, baseY, index }) => {
        const record = atlasRecords[index];
        context.beginPath();
        context.moveTo(baseX, baseY);
        context.lineTo(x, y);
        context.strokeStyle = index === active ? `${record.accent}c9` : "rgba(74,50,36,.22)";
        context.lineWidth = index === active ? 1.6 : 1;
        context.stroke();
        context.beginPath();
        context.arc(x, y, index === active ? 10 : 6, 0, Math.PI * 2);
        context.fillStyle = record.accent;
        context.fill();
        if (index === active) {
          context.beginPath();
          context.arc(x, y, 19 + Math.sin(time * 0.004) * 2, 0, Math.PI * 2);
          context.strokeStyle = record.accent;
          context.lineWidth = 1.6;
          context.stroke();
        }
        context.fillStyle = "#2a2019";
        context.font = "600 12px monospace";
        context.fillText(record.code, x + 14, y - 11);
        return { x, y, index };
      });
    };

    const loop = (time: number) => {
      if (time - lastFrame > 32) {
        draw(time);
        lastFrame = time;
      }
      animationFrame = requestAnimationFrame(loop);
    };
    if (reduceMotion) draw(); else animationFrame = requestAnimationFrame(loop);
    const observer = new ResizeObserver(() => draw(performance.now()));
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [active, rotation]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, ...rotation };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    setRotation({
      yaw: drag.current.yaw + (event.clientX - drag.current.x) * 0.007,
      pitch: Math.max(0.25, Math.min(1.15, drag.current.pitch + (event.clientY - drag.current.y) * 0.005)),
    });
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drag.current && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < 7) {
      const box = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const nearest = pointsRef.current.map((point) => ({ ...point, distance: Math.hypot(point.x - x, point.y - y) })).sort((a, b) => a.distance - b.distance)[0];
      if (nearest?.distance < 34) onActive(nearest.index);
    }
    drag.current = null;
  };

  return <canvas ref={canvasRef} className="atlas-topology-canvas" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-label="Interactive three-dimensional portfolio topology. Use the project buttons for keyboard navigation." />;
}

export function PortfolioTopology() {
  const [active, setActive] = useState(0);
  const record = atlasRecords[active];
  const work = workMap.get(record.slug)!;
  const connections = atlasRecords.map((project, index) => ({ project, index, methods: sharedAtlasMethods(record, project) })).filter((item) => item.index !== active && item.methods.length);

  return (
    <div className="atlas-topology" style={{ "--record-accent": record.accent } as CSSProperties}>
      <div className="atlas-topology-plot">
        <TopologyCanvas active={active} onActive={setActive} />
        <p>Drag to rotate · select a node.</p>
      </div>
      <nav className="atlas-project-switcher" aria-label="Select a project coordinate">
        {atlasRecords.map((project, index) => <button key={project.slug} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><i style={{ background: project.accent }} /><span>{project.code}</span><strong>{workMap.get(project.slug)!.title}</strong></button>)}
      </nav>
      <aside className="atlas-topology-inspector" aria-live="polite">
        <div key={record.slug}>
          <header><span>Active coordinate · {record.code}</span><small>{work.status} · {work.year}</small></header>
          <h2>{work.title}</h2>
          <p>{record.rationale}</p>
          <dl><div><dt>Orientation</dt><dd>{record.orientation}</dd></div><div><dt>Context</dt><dd>{record.context}</dd></div><div><dt>Scope</dt><dd>{record.scope}</dd></div></dl>
          <section><h3>Shared-method ridges</h3>{connections.map((connection) => <button key={connection.project.slug} type="button" onClick={() => setActive(connection.index)}><i style={{ background: connection.project.accent }} /><span>{connection.project.code}</span><b>{connection.methods.join(" + ")}</b></button>)}</section>
          <Link href={`/work/${record.slug}`}>Open research record <ArrowIcon /></Link>
        </div>
      </aside>
    </div>
  );
}
