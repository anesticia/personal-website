export type SimulationVariant = "hero" | "publication";
export type ReactionFrame = { width: number; height: number; ratio: number; state: Uint8Array; fieldWidth: number; fieldHeight: number; variant: SimulationVariant };

export function createOffscreenReactionRenderer(canvas: OffscreenCanvas, variant: SimulationVariant) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true });
  if (gl) return createWebGLRenderer(canvas, gl, variant);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Reaction-diffusion rendering is unavailable.");
  return createCanvasRenderer(canvas, context, variant);
}
export type StateRenderer = {
  kind: "webgl2" | "canvas2d";
  resize: (width: number, height: number, quality: number) => void;
  render: (state: Uint8Array, width: number, height: number) => void;
  destroy: () => void;
};

const VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = position;
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uResolution;
uniform int uVariant;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 chemistry = texture(uState, uv).rg;
  float localU = chemistry.r;
  float concentration = chemistry.g;
  float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.012;

  if (uVariant == 1) {
    float neighbors = max(max(texture(uState, uv + vec2(uTexel.x, 0.0)).g, texture(uState, uv - vec2(uTexel.x, 0.0)).g),
                          max(texture(uState, uv + vec2(0.0, uTexel.y)).g, texture(uState, uv - vec2(0.0, uTexel.y)).g));
    float displayConcentration = max(concentration, neighbors * 0.86);
    float field = smoothstep(0.02, 0.24, displayConcentration);
    float activity = smoothstep(0.025, 0.24, 1.0 - localU);
    float core = smoothstep(0.16, 0.37, displayConcentration);
    vec3 color = vec3(0.025, 0.035, 0.031)
      + field * vec3(0.240, 0.120, 0.055)
      + activity * vec3(0.020, 0.100, 0.090)
      + core * vec3(0.530, 0.310, 0.120);
    outColor = vec4(clamp(color + grain, 0.0, 1.0), 1.0);
    return;
  }

  float field = smoothstep(0.025, 0.27, concentration);
  float outline = smoothstep(0.035, 0.095, concentration) * (1.0 - smoothstep(0.17, 0.28, concentration));
  float antialias = max(fwidth(outline) * 0.3, 0.002);
  outline = smoothstep(0.03 - antialias, 0.97 + antialias, outline);
  vec3 color = vec3(0.467, 0.459, 0.388) - outline * vec3(0.325, 0.357, 0.322) - field * vec3(0.031, 0.024, 0.020);
  outColor = vec4(clamp(color + grain, 0.0, 1.0), 1.0);
}`;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create reaction-diffusion shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function createWebGLRenderer(canvas: HTMLCanvasElement | OffscreenCanvas, gl: WebGL2RenderingContext, variant: SimulationVariant): StateRenderer {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create reaction-diffusion program.");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link reaction-diffusion program.");

  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to create reaction-diffusion texture.");
  const texelLocation = gl.getUniformLocation(program, "uTexel");
  const resolutionLocation = gl.getUniformLocation(program, "uResolution");
  const variantLocation = gl.getUniformLocation(program, "uVariant");
  let textureWidth = 0;
  let textureHeight = 0;

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, "uState"), 0);
  gl.uniform1i(variantLocation, variant === "publication" ? 1 : 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);

  return {
    kind: "webgl2",
    resize(displayWidth, displayHeight, quality) {
      canvas.width = Math.max(1, Math.round(displayWidth * quality));
      canvas.height = Math.max(1, Math.round(displayHeight * quality));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    },
    render(state, width, height) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (textureWidth !== width || textureHeight !== height) {
        textureWidth = width;
        textureHeight = height;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, width, height, 0, gl.RG, gl.UNSIGNED_BYTE, state);
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RG, gl.UNSIGNED_BYTE, state);
      }
      gl.useProgram(program);
      gl.uniform2f(texelLocation, 1 / width, 1 / height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    },
  };
}

const colorTables: Partial<Record<SimulationVariant, Uint32Array>> = {};

function colorTable(variant: SimulationVariant) {
  if (colorTables[variant]) return colorTables[variant];
  // States already contain 8-bit U/V. Enumerate the exact existing color
  // mapping once, retaining Uint8ClampedArray's rounding for every channel.
  const colors = new Uint8ClampedArray((variant === "hero" ? 256 : 65536) * 4);
  for (let cell = 0; cell < colors.length / 4; cell += 1) {
    const localU = (cell >>> 8) / 255;
    const concentration = (cell & 255) / 255;
    const field = smoothstep(0.02, 0.25, concentration);
    const offset = cell * 4;
    if (variant === "publication") {
      const activity = smoothstep(0.025, 0.24, 1 - localU);
      const core = smoothstep(0.16, 0.37, concentration);
      colors[offset] = clamp(6 + field * 61 + activity * 5 + core * 135, 0, 255);
      colors[offset + 1] = clamp(9 + field * 31 + activity * 26 + core * 79, 0, 255);
      colors[offset + 2] = clamp(8 + field * 14 + activity * 23 + core * 31, 0, 255);
    } else {
      const outline = smoothstep(0.035, 0.095, concentration) * (1 - smoothstep(0.17, 0.28, concentration));
      colors[offset] = clamp(119 - outline * 83 - field * 8, 0, 255);
      colors[offset + 1] = clamp(117 - outline * 91 - field * 6, 0, 255);
      colors[offset + 2] = clamp(99 - outline * 82 - field * 5, 0, 255);
    }
    colors[offset + 3] = 255;
  }
  const table = new Uint32Array(colors.buffer);
  colorTables[variant] = table;
  return table;
}

export function createCanvasRenderer(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, variant: SimulationVariant): StateRenderer {
  const source = typeof document === "undefined" ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
  const sourceContext = source.getContext("2d", { alpha: false }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!sourceContext) throw new Error("Unable to create reaction-diffusion fallback renderer.");
  let pixels = sourceContext.createImageData(1, 1);
  let packedPixels = new Uint32Array(pixels.data.buffer);
  const palette = colorTable(variant);

  return {
    kind: "canvas2d",
    resize(displayWidth, displayHeight, quality) {
      canvas.width = Math.max(1, Math.round(displayWidth * quality));
      canvas.height = Math.max(1, Math.round(displayHeight * quality));
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    },
    render(state, width, height) {
      if (source.width !== width || source.height !== height) {
        source.width = width;
        source.height = height;
        pixels = sourceContext.createImageData(width, height);
        packedPixels = new Uint32Array(pixels.data.buffer);
      }
      for (let cell = 0; cell < width * height; cell += 1) {
        const color = variant === "hero" ? state[cell * 2 + 1] : state[cell * 2] * 256 + state[cell * 2 + 1];
        packedPixels[cell] = palette[color];
      }
      sourceContext.putImageData(pixels, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
    },
    destroy() {},
  };
}
