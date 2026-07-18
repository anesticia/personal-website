export type AtlasRecord = {
  slug: string;
  code: string;
  accent: string;
  terrain: [number, number, number];
  methods: string[];
  orientation: string;
  context: string;
  scope: string;
  rationale: string;
  question: string;
  reference: string;
  boundary: string;
  source: string;
};

export const atlasRecords: AtlasRecord[] = [
  {
    slug: "reaction-diffusion",
    code: "RD",
    accent: "#ff8456",
    terrain: [-0.65, -0.68, 0.9],
    methods: ["PDE", "ETDRK4", "FFT", "Benchmarking"],
    orientation: "Forward model",
    context: "Physical system",
    scope: "Reusable simulator",
    rationale: "A numerical model turns reaction laws into comparable pattern dynamics.",
    question: "Do numerical schemes preserve the same pattern dynamics?",
    reference: "Fourier pseudo-spectral + ETDRK4",
    boundary: "Active research; six-scheme benchmark, not a universal solver ranking.",
    source: "Local research record",
  },
  {
    slug: "orbit-pinn",
    code: "OP",
    accent: "#f5b85b",
    terrain: [0.45, -0.58, 0.72],
    methods: ["PINN", "Autodiff", "Fourier features", "Invariants"],
    orientation: "Learned solver",
    context: "Physical system",
    scope: "Research method",
    rationale: "A constrained neural solver learns trajectories while preserving physical structure.",
    question: "Can rolling PINNs preserve long-horizon charged-particle dynamics?",
    reference: "Kinematics, Lorentz-force, and energy residuals",
    boundary: "Active local research; no finished performance claim.",
    source: "Local paper artifacts",
  },
  {
    slug: "wave-pinn-thesis",
    code: "WP",
    accent: "#79b9ff",
    terrain: [-0.05, -0.22, 0.58],
    methods: ["PINN", "FDTD", "PDE", "Benchmarking"],
    orientation: "Hybrid comparison",
    context: "Physical system",
    scope: "Focused study",
    rationale: "PINN predictions are read against a finite-difference reference.",
    question: "How do PINNs compare with FDTD in heterogeneous media?",
    reference: "Finite-difference time-domain",
    boundary: "Thesis in progress; represented as ongoing research.",
    source: "Local thesis artifacts",
  },
  {
    slug: "codex-chess-lab",
    code: "CL",
    accent: "#b2db77",
    terrain: [-0.55, 0.68, 0.95],
    methods: ["C++", "Search", "Benchmarking", "Neural evaluation"],
    orientation: "Search system",
    context: "Software system",
    scope: "Research platform",
    rationale: "An engine, arena, and benchmark protocol form a reusable experimentation system.",
    question: "Does a candidate engine change improve play?",
    reference: "Paired games with confidence gates",
    boundary: "M7 in progress; explicitly not presented as Stockfish-level.",
    source: "Local research record",
  },
  {
    slug: "geoguesser-engine",
    code: "GE",
    accent: "#55d6c2",
    terrain: [0.55, 0.62, 0.72],
    methods: ["Computer vision", "FastAPI", "SQLite", "Data governance"],
    orientation: "Inference system",
    context: "Software + data",
    scope: "System foundation",
    rationale: "Visual evidence, provenance, and local services support explainable ranking.",
    question: "Can geolocation evidence remain explainable and licensed?",
    reference: "Manifest, attribution, duplicate checks, and quality reports",
    boundary: "M4 dataset foundation; not a live-game automation client.",
    source: "Local research record",
  },
  {
    slug: "object-classification-paper",
    code: "EF",
    accent: "#d894ff",
    terrain: [0.25, 0.78, 0.38],
    methods: ["Computer vision", "Random Forest", "Edge features", "Benchmarking"],
    orientation: "Feature inference",
    context: "Software + data",
    scope: "Focused study",
    rationale: "Engineered image features feed a published classifier experiment.",
    question: "Do edge and histogram features improve classification?",
    reference: "Published study split and DOI record",
    boundary: "Published result; full methodology and limits remain in the paper.",
    source: "Public journal article",
  },
];

export const atlasRecordMap = new Map(atlasRecords.map((record) => [record.slug, record]));

export function sharedAtlasMethods(a: AtlasRecord, b: AtlasRecord) {
  return a.methods.filter((method) => b.methods.includes(method));
}
