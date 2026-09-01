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
    boundary: "Two active tracks; the numerical target favors its own solver family and neural error rises materially after the middle horizon.",
    source: "Local research record",
  },
  {
    slug: "orbit-pinn",
    code: "SP",
    accent: "#f5b85b",
    terrain: [0.45, -0.58, 0.72],
    methods: ["PINN", "Autodiff", "Fourier features", "Invariants"],
    orientation: "Learned solver",
    context: "Physical system",
    scope: "Research method",
    rationale: "A constrained neural solver learns trajectories while preserving physical structure.",
    question: "Can one shared local flow preserve useful dynamics across three magnetic-field families?",
    reference: "Boris trajectories plus phase, turn, bounce, azimuth, and RMSE diagnostics",
    boundary: "V4 shows limited feasibility; V5 pilot failed and V4.5 remains incomplete. Energy preservation is not trajectory accuracy.",
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
    boundary: "Thesis completed; upgraded layered case reaches 70.04% final relative L2 and the two medium definitions are not exactly matched.",
    source: "Local thesis artifacts",
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
    boundary: "Published study-split result; repeated seeds, leakage checks, and external validation are not reported.",
    source: "Public journal article",
  },
];

export const atlasRecordMap = new Map(atlasRecords.map((record) => [record.slug, record]));

export function sharedAtlasMethods(a: AtlasRecord, b: AtlasRecord) {
  return a.methods.filter((method) => b.methods.includes(method));
}
