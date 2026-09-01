export const VERTICAL_INSET = 14;
export const MAX_WAVE_DISPLACEMENT = 21;
export type WaveRenderFrame = { width: number; height: number; ratio: number; progress: number; emphasized: boolean; motion: { strands: Array<{ current: Float32Array; offset: number }>; probeEnergy: number } };
function clamp(value: number, minimum = 0, maximum = 1) { return Math.min(maximum, Math.max(minimum, value)); }

function sampleField(field: Float32Array, position: number) {
  const coordinate = clamp(position) * (field.length - 1);
  const lower = Math.floor(coordinate);
  const upper = Math.min(field.length - 1, lower + 1);
  const mix = coordinate - lower;
  return field[lower] * (1 - mix) + field[upper] * mix;
}
export function renderWave(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: WaveRenderFrame) {
  const { width, height, ratio, progress, emphasized, motion } = frame;
  const canvas = context.canvas;
  const renderWidth = Math.max(1, Math.round(width * ratio));
  const renderHeight = Math.max(1, Math.round(height * ratio));

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth;
    canvas.height = renderHeight;
  }


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

  const stroke = (color: string, lineWidth: number) => {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
  };

  motion.strands.forEach((strand, strandIndex) => {
    const samples = strandSamples[strandIndex];
    context.beginPath();
    samples.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    stroke("rgba(27, 30, 25, 0.76)", emphasized ? 2.15 : 1.75);
    stroke("rgba(235, 229, 213, 0.9)", emphasized ? 0.78 : 0.52);

    // Each band samples the same field at the same positions. Reuse the exact
    // magnitudes instead of interpolating both ends again for all three bands.
    const magnitudes = samples.map((_, index) => Math.abs(sampleField(strand.current, index / (samples.length - 1))));

    const energyBands = [
      { threshold: 0.018, width: 1.15, alpha: 0.36, glow: 0 },
      { threshold: 0.12, width: 2.15, alpha: 0.58, glow: 0 },
      { threshold: 0.28, width: 3.45, alpha: 0.88, glow: 5 },
    ];
    for (const band of energyBands) {
      context.beginPath();
      let drawing = false;
      for (let index = 1; index < samples.length; index += 1) {
        if (Math.max(magnitudes[index - 1], magnitudes[index]) < band.threshold) {
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
