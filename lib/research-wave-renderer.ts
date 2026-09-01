export type ResearchWaveFrame = { width: number; height: number; ratio: number; elapsed: number; reducedMotion: boolean; source: { x: number; y: number } };
const BOUNDARIES = [0.26, 0.49, 0.73] as const;
const SPEEDS = [1, 0.74, 1.12, 0.66] as const;

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

export function createResearchWaveRenderer(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, includeLabels = true) {
  const canvas = context.canvas;
  let source = { x: 0.72, y: 0.54 };
  const fade = typeof document === "undefined" ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
  const fadeContext = fade.getContext("2d");
  if (!fadeContext) return;
  let fadeWidth = 0;
  let fadeHeight = 0;
  let fadeDpr = 0;

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
      const x = source.x + Math.cos(angle) * radius;
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

  const draw = (frame: ResearchWaveFrame) => {
    source = frame.source;
    const box = { width: frame.width, height: frame.height };
    const dpr = frame.ratio;
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
    const elapsed = frame.elapsed;
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

    const sourceOptical = opticalY(source.y);
    for (let ring = 0; ring < 13; ring += 1) {
      const radius = ((elapsed * 0.12 + ring * 0.105) % 1.38) + 0.018;
      const alpha = Math.max(0.06, 0.42 * (1 - radius / 1.45));
      drawPath(sourceOptical, radius, width, height, alpha);

      BOUNDARIES.forEach((boundary) => {
        const boundaryOptical = opticalY(boundary);
        const travel = Math.abs(sourceOptical - boundaryOptical);
        const reflectedRadius = radius - travel * 2;
        if (reflectedRadius <= 0.025) return;
        const sourceAbove = source.y < boundary;
        const mirroredCenter = boundaryOptical * 2 - sourceOptical;
        drawPath(mirroredCenter, reflectedRadius, width, height, alpha * 0.28, { boundary, above: sourceAbove });
      });
    }

    context.save();
    context.globalCompositeOperation = "destination-in";
    if (fadeWidth !== width || fadeHeight !== height || fadeDpr !== dpr) {
      fadeWidth = width;
      fadeHeight = height;
      fadeDpr = dpr;
      fade.width = pixelWidth;
      fade.height = pixelHeight;
      fadeContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fieldFade = fadeContext.createLinearGradient(0, 0, width, 0);
      if (width <= 900) {
        // Portrait screens stack the narrative above the instrument instead of
        // reserving a desktop-sized quiet column on the left.
        fieldFade.addColorStop(0, "rgba(0,0,0,.42)");
        fieldFade.addColorStop(0.22, "rgba(0,0,0,.7)");
        fieldFade.addColorStop(0.46, "rgba(0,0,0,1)");
      } else {
        fieldFade.addColorStop(0, "rgba(0,0,0,.08)");
        fieldFade.addColorStop(0.3, "rgba(0,0,0,.2)");
        fieldFade.addColorStop(0.5, "rgba(0,0,0,.76)");
        fieldFade.addColorStop(0.64, "rgba(0,0,0,1)");
      }
      fadeContext.fillStyle = fieldFade;
      fadeContext.fillRect(0, 0, width, height);
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.drawImage(fade, 0, 0);
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
      const distance = Math.hypot(sensorX / width - source.x, opticalY(normalizedY) - sourceOptical);
      const layerResponse = 0.8 + SPEEDS[BOUNDARIES.filter((boundary) => normalizedY > boundary).length] * 0.22;
      const amplitude = Math.sin(distance * 67 - elapsed * 8.6) * Math.exp(-distance * 1.65) * layerResponse;
      const x = sensorX + amplitude * Math.min(18, width * 0.012);
      if (y === height * 0.12) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = "rgba(179,75,54,.82)";
    context.lineWidth = 1.35;
    context.stroke();

    const sourceX = source.x * width;
    const sourceY = source.y * height;
    const pulse = frame.reducedMotion ? 0 : Math.sin(elapsed * 5.2) * 2.2;
    context.beginPath();
    context.arc(sourceX, sourceY, 18 + pulse, 0, Math.PI * 2);
    context.strokeStyle = "rgba(179,75,54,.66)";
    context.lineWidth = 1.3;
    context.stroke();
    context.beginPath();
    context.arc(sourceX, sourceY, 5, 0, Math.PI * 2);
    context.fillStyle = "#b34b36";
    context.fill();

    if (includeLabels) renderResearchWaveLabels(context, frame);
  };
  return draw;
}

export function renderResearchWaveLabels(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ResearchWaveFrame) {
  // Font resolution on a worker does not inherit the page's font environment.
  // Paint these few labels on the visible canvas, after the matching wave frame.
  const { width, height, ratio, source } = frame;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = "rgba(37,29,24,.68)";
  context.font = "500 11px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.fillText("SOURCE", source.x * width + 25, source.y * height - 10);
  if (width >= 700) {
    const layerLabelX = width <= 900 ? width * 0.08 : width * 0.58;
    context.fillText("SENSOR", width * 0.89 + 10, height * 0.12 - 8);
    [0, ...BOUNDARIES].forEach((start, index) => {
      const y = Math.max(112, start * height + 22);
      context.fillText(`LAYER 0${index + 1}  ·  c/c₀ ${SPEEDS[index].toFixed(2)}`, layerLabelX, y);
    });
  }
}
