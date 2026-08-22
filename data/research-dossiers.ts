export type DossierMetric = {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "positive" | "caution";
};

export type DossierFigure = {
  src: string;
  alt: string;
  caption: string;
  label: string;
};

export type ResearchDossier = {
  slug: string;
  updated: string;
  maturity: string;
  evidenceClass: string;
  oneLineClaim: string;
  problem: {
    title: string;
    paragraphs: string[];
  };
  governing: {
    label: string;
    expression: string;
    note: string;
  }[];
  architecture: {
    title: string;
    body: string;
  }[];
  protocol: string[];
  metrics: DossierMetric[];
  figures: DossierFigure[];
  limitations: string[];
  reproducibility: {
    label: string;
    value: string;
  }[];
  nextGate: {
    title: string;
    body: string;
    criteria: string[];
  };
  sources: {
    label: string;
    detail: string;
    href?: string;
  }[];
  related: string[];
};

export const researchDossiers: ResearchDossier[] = [
  {
    slug: "orbit-pinn",
    updated: "2026-08-22",
    maturity: "V5 pilot evaluated",
    evidenceClass: "Local manuscript + hash-scoped experiment artifacts",
    oneLineClaim: "A shared, structure-preserving local flow is feasible across three magnetic-field families, but energy preservation alone does not establish accurate trajectories.",
    problem: {
      title: "Long horizons amplify small geometric mistakes.",
      paragraphs: [
        "Charged-particle motion is locally simple but globally unforgiving. Small phase or curvature errors accumulate over repeated rollout, so a trajectory may conserve speed while drifting into the wrong orbit.",
        "The shared local-flow study asks whether one neural model can learn useful updates for uniform, mirror, and dipole-like magnetic fields without collapsing the physics into three unrelated specialist models.",
      ],
    },
    governing: [
      { label: "Lorentz dynamics", expression: "dx/dt = v,   dv/dt = (q/m) v × B(x)", note: "Magnetic-only dynamics with position-dependent fields." },
      { label: "Invariant", expression: "d‖v‖²/dt = 0", note: "A necessary physical check, not a sufficient trajectory metric." },
      { label: "Learned local flow", expression: "sₖ₊₁ = Φθ(sₖ, B, Δt)", note: "The same parameterized update is composed over the full horizon." },
    ],
    architecture: [
      { title: "Local field frame", body: "The state is expressed relative to the local magnetic direction so one model can reuse geometric structure across field families." },
      { title: "SO(3) velocity update", body: "Velocity is advanced through a rotation-like parameterization that preserves speed by construction." },
      { title: "Integrated position", body: "Position is tied to the learned velocity path rather than predicted as a disconnected output." },
      { title: "Compose, unroll, replay", body: "Training and evaluation expose the model to repeated local application, where long-horizon errors become visible." },
    ],
    protocol: [
      "Train one shared model on uniform, mirror, and dipole-like field families.",
      "Evaluate pure-neural rollout separately from any controller or Boris fallback.",
      "Report trajectory RMSE together with phase, turns, bounce, and azimuth diagnostics.",
      "Treat held-out cases as within-family tests, not evidence of arbitrary-field generalization.",
    ],
    metrics: [
      { label: "V4 accounting", value: "31 / 4 / 1", note: "complete / complete with fallback / failed across 36 cases", tone: "caution" },
      { label: "Uniform mean RMSE", value: "0.387 ± 0.427", note: "V4 pure-neural original-case mean", tone: "neutral" },
      { label: "Mirror mean RMSE", value: "2.215 ± 1.302", note: "V4 pure-neural original-case mean", tone: "caution" },
      { label: "Dipole mean RMSE", value: "0.828 ± 0.188", note: "V4 pure-neural original-case mean", tone: "neutral" },
      { label: "V5 decision", value: "pilot fail", note: "PCGrad pilot did not satisfy the defined pass criteria", tone: "caution" },
      { label: "V4.5 ledger", value: "running", note: "21-model / 126-evaluation plan is not a completed result", tone: "caution" },
    ],
    figures: [
      { src: "/images/research/orbit-architecture.webp", alt: "Shared structure-preserving local-flow architecture from the current manuscript", label: "Figure 01 · Architecture", caption: "The shared local-flow design: field-frame construction, structure-preserving velocity update, integrated position, and repeated rollout." },
      { src: "/images/research/orbit-energy-trajectory.webp", alt: "Comparison showing that energy preservation does not imply trajectory accuracy", label: "Figure 02 · Evidence boundary", caption: "A central negative result: conserving speed can coexist with visible phase and trajectory error." },
      { src: "/images/research/orbit-v4-trajectories.webp", alt: "Representative V4 trajectories for uniform, mirror, and dipole-like magnetic fields", label: "Figure 03 · Representative checkpoint", caption: "Seed 33 illustrates the uneven behavior: strong uniform-field tracking, but material mirror and dipole errors remain." },
    ],
    limitations: [
      "The evidence supports limited multi-family feasibility, not universal charged-particle accuracy.",
      "The mirror family remains the clearest failure mode, including incorrect turn and bounce behavior in representative cases.",
      "Controller-assisted and Boris-fallback outcomes cannot be reported as pure-neural performance.",
      "V4.7 is an optimization diagnostic only, and the V5 PCGrad pilot failed its predeclared gate.",
    ],
    reproducibility: [
      { label: "Primary evidence", value: "PAPER_AUDIT_V4_2026-08-13 + FINAL_ACCOUNTING.json" },
      { label: "Manuscript identity", value: "Final PDF SHA-256 begins 81ABEB" },
      { label: "Experiment identity", value: "ORBIT-PINN V5 · conflict-aware structure-preserving shared local flow" },
      { label: "Evaluation split", value: "Held-out cases within the three modeled field families" },
      { label: "Status policy", value: "Pure neural, fallback, failed, and incomplete evidence remain separate" },
    ],
    nextGate: {
      title: "Improve mirror dynamics without trading away uniform-field behavior.",
      body: "The next credible step is not a larger headline result. It is a controlled candidate that improves the mirror family and survives the original uniform cases under the same evaluation ledger.",
      criteria: ["Complete the V4.5 ledger before comparison", "Keep controller and pure-neural scores separate", "Require mirror period and RMSE improvement", "Retain the uniform original-case threshold"],
    },
    sources: [
      { label: "Current manuscript", detail: "A Shared Structure-Preserving Network for Multi-Field Charged-Particle Dynamics" },
      { label: "V4 audit", detail: "Local claim set, accounting, metrics, and representative trajectories" },
      { label: "V5 pilot", detail: "Conflict-aware optimization decision: pilot_fail" },
    ],
    related: ["reaction-diffusion", "wave-pinn-thesis", "codex-chess-lab"],
  },
  {
    slug: "reaction-diffusion",
    updated: "2026-08-22",
    maturity: "Simulator + long-horizon study active",
    evidenceClass: "Local solver, benchmark outputs, and experiment ledger",
    oneLineClaim: "The project now contains two linked tracks: a reusable two-species simulator and a physics-only long-horizon Gray–Scott study whose error grows materially after the middle horizon.",
    problem: {
      title: "The pattern is the phenomenon, but the solver shapes what can be trusted.",
      paragraphs: [
        "Reaction–diffusion systems turn local reaction laws and diffusion into global spatial structure. The numerical track asks how much of that structure survives a change of integration scheme.",
        "A second track asks whether a physics-only neural approximation can stay aligned with a discrete Gray–Scott reference over increasingly long horizons, including the point where visually plausible patterns no longer imply close agreement.",
      ],
    },
    governing: [
      { label: "Two-species system", expression: "∂u/∂t = Dᵤ∇²u + f(u,v)", note: "First diffusing species with configurable reaction kinetics." },
      { label: "Coupled field", expression: "∂v/∂t = Dᵥ∇²v + g(u,v)", note: "Second field shares the periodic computational domain." },
      { label: "Gray–Scott instance", expression: "f = −uv² + F(1−u),   g = uv² − (F+k)v", note: "The long-horizon neural experiments use this reaction family." },
    ],
    architecture: [
      { title: "Configurable kinetics", body: "Gray–Scott, Brusselator, Schnakenberg, and custom two-species laws share one simulation interface." },
      { title: "Spectral spatial operator", body: "A Fourier pseudo-spectral Laplacian handles periodic domains and supports a high-quality reference lane." },
      { title: "ETDRK4 time integration", body: "Cox–Matthews ETDRK4 separates stiff diffusion from nonlinear reactions in the reference implementation." },
      { title: "Long-horizon neural lane", body: "Physics-only training is evaluated against a discrete finite-difference trajectory across multiple time horizons." },
    ],
    protocol: [
      "Benchmark six spectral and finite-difference schemes on the same 320 × 320, 6000-step CUDA workload.",
      "Use spectral ETDRK4 as the declared reference and avoid reading that self-reference as an unbiased contest win.",
      "Evaluate the neural track at t = 200, 1500, 4500, and 9000 using the saved discrete reference.",
      "Keep solver benchmarking and learned long-horizon approximation as separate evidence tracks.",
    ],
    metrics: [
      { label: "Benchmark grid", value: "320 × 320", note: "6000 integration steps on CUDA", tone: "neutral" },
      { label: "Best non-reference shape", value: "0.9463", note: "spectral Strang similarity against the ETDRK4-generated target", tone: "positive" },
      { label: "t = 200 RMSE", value: "0.01730", note: "best recorded run", tone: "positive" },
      { label: "t = 1500 RMSE", value: "0.01124", note: "best recorded run, discrete lane", tone: "positive" },
      { label: "t = 4500 RMSE", value: "0.10888", note: "error begins to deteriorate materially", tone: "caution" },
      { label: "t = 9000 RMSE", value: "0.19974", note: "best recorded long-horizon run", tone: "caution" },
    ],
    figures: [
      { src: "/images/research/reaction-method-grid.webp", alt: "Comparison grid for six reaction diffusion numerical methods", label: "Figure 01 · Numerical benchmark", caption: "Six schemes under the same workload. The spectral reference is visually self-consistent by construction, so the useful comparison is among the non-reference methods and their costs." },
      { src: "/images/research/reaction-long-horizon.webp", alt: "Long-horizon Gray Scott continuous experiment comparison at time 9000", label: "Figure 02 · Long horizon", caption: "A saved t = 9000 run from the physics-only neural study, where pattern-level plausibility and pointwise agreement diverge." },
    ],
    limitations: [
      "The ETDRK4 reference ranks first against a target generated by the same method family, so it is not an independent ground truth.",
      "Periodic-domain assumptions and specific parameter regimes limit direct generalization to other boundaries or kinetics.",
      "Long-horizon RMSE deterioration becomes substantial after t = 4500, especially around the t = 6000 region in the experiment notes.",
      "Visual pattern similarity cannot replace trajectory-level numerical error.",
    ],
    reproducibility: [
      { label: "Reference solver", value: "Fourier pseudo-spectral + Cox–Matthews ETDRK4" },
      { label: "Benchmark output", value: "outputs/benchmarks/numerical_methods_full" },
      { label: "Neural study", value: "18 recorded runs across four declared horizons" },
      { label: "Boundary", value: "Periodic two-dimensional domains" },
      { label: "Evidence split", value: "Numerical benchmark and PINN experiment reported separately" },
    ],
    nextGate: {
      title: "Explain the mid-horizon break before scaling the claim.",
      body: "The next experiment should localize when and why the neural lane loses the discrete trajectory, then compare interventions under matched seeds and horizon definitions.",
      criteria: ["Add horizon-local error curves", "Run matched seeds across the transition region", "Track conservation and morphology beside RMSE", "Keep the numerical reference fixed"],
    },
    sources: [
      { label: "Simulator", detail: "General two-species spectral ETDRK4 implementation" },
      { label: "Benchmark report", detail: "Six-method full numerical benchmark" },
      { label: "Long-horizon ledger", detail: "THEORY_CATCHUP_ID.md and saved run figures" },
    ],
    related: ["orbit-pinn", "wave-pinn-thesis"],
  },
  {
    slug: "wave-pinn-thesis",
    updated: "2026-08-22",
    maturity: "Thesis completed; paper record not yet publicly verified",
    evidenceClass: "Signed thesis, local paper draft, and conference presentation",
    oneLineClaim: "The study compares PINNs with FDTD across homogeneous and layered media, with a clear failure in the upgraded layered case and a known mismatch between the two medium definitions.",
    problem: {
      title: "Wave interfaces expose both model error and reference mismatch.",
      paragraphs: [
        "The work studies two-dimensional acoustic propagation through homogeneous, reflecting, oblique, and layered media. FDTD supplies evaluation snapshots while the PINN is trained from the governing equation and conditions rather than those labels.",
        "The hardest case also reveals a methodological problem: the FDTD coefficient is piecewise constant while the PINN uses a sigmoid-smoothed interface. A matched-medium reference is needed before assigning the entire discrepancy to optimization failure.",
      ],
    },
    governing: [
      { label: "Acoustic wave", expression: "∂²p/∂t² = c(x,z)² (∂²p/∂x² + ∂²p/∂z²)", note: "Two-dimensional scalar pressure field with spatially varying wave speed." },
      { label: "PINN residual", expression: "rθ = pθ,tt − c²(pθ,xx + pθ,zz)", note: "Automatic differentiation forms the physics loss." },
      { label: "Evaluation", expression: "εrel = ‖pPINN − pFDTD‖₂ / ‖pFDTD‖₂", note: "FDTD is an evaluation reference, not a training label source." },
    ],
    architecture: [
      { title: "Coordinate network", body: "A neural field maps space and time coordinates to acoustic pressure." },
      { title: "Physics-only objective", body: "The PDE, initial condition, and boundary terms supervise the learned field." },
      { title: "FDTD reference lane", body: "Discrete simulations provide independent snapshots for quantitative and visual evaluation." },
      { title: "Scenario matrix", body: "Homogeneous, wall, oblique, and layered configurations test progressively harder propagation structure." },
    ],
    protocol: [
      "Evaluate final-time and mean relative L2 error for each declared scenario.",
      "Do not describe FDTD snapshots as training data for the physics-only PINN.",
      "Separate the completed thesis from the local paper draft and unverified public proceedings status.",
      "Require a coefficient-matched reference before interpreting the upgraded layered failure mechanistically.",
    ],
    metrics: [
      { label: "Homogeneous baseline", value: "8.47%", note: "final relative L2; 6.31% mean", tone: "neutral" },
      { label: "Homogeneous upgraded", value: "15.04%", note: "final relative L2; 7.42% mean", tone: "caution" },
      { label: "Flat wall", value: "15.84%", note: "final relative L2; 13.06% mean", tone: "caution" },
      { label: "Oblique", value: "18.60%", note: "final relative L2; 6.79% mean", tone: "caution" },
      { label: "Basic layered", value: "17.78%", note: "final relative L2; 9.74% mean", tone: "caution" },
      { label: "Upgraded layered", value: "70.04%", note: "final relative L2; 37.85% mean", tone: "caution" },
    ],
    figures: [
      { src: "/images/wave-pinn.688595129c57.webp", alt: "FDTD and PINN wave field snapshots through layered media", label: "Figure 01 · Comparative field", caption: "Representative FDTD and PINN wave-field snapshots from the local thesis artifacts." },
    ],
    limitations: [
      "The upgraded layered case has a major final-time error and does not support a robustness claim.",
      "Piecewise-constant FDTD and sigmoid-smoothed PINN media are not an exactly matched physical problem.",
      "Scenario coverage is focused and does not establish broad out-of-distribution generalization.",
      "A local paper draft and conference deck are not equivalent to a verified proceedings publication.",
    ],
    reproducibility: [
      { label: "Thesis", value: "165-page signed final report, approved 23 May 2026" },
      { label: "Reference", value: "Finite-difference time-domain snapshots" },
      { label: "Training", value: "Physics, initial, and boundary constraints" },
      { label: "Presentation", value: "Local ICOPIA 2026 deck dated 12 August 2026" },
      { label: "Publication status", value: "Public proceedings record not verified" },
    ],
    nextGate: {
      title: "Match the medium before diagnosing the optimizer.",
      body: "The highest-value next step is a controlled FDTD reference using the same smoothed coefficient field as the PINN, followed by repeated training seeds on the layered scenarios.",
      criteria: ["Use identical c(x,z) in both methods", "Repeat seeds and report dispersion", "Measure interface-local error", "Preserve final and mean L2 metrics"],
    },
    sources: [
      { label: "Final thesis", detail: "Pemodelan Gelombang Akustik Dua Dimensi Menggunakan Physics-Informed Neural Network" },
      { label: "Paper draft", detail: "Two-Dimensional Acoustic Wave Modeling using Physics-Informed Neural Networks" },
      { label: "Conference deck", detail: "Local ICOPIA 2026 presentation artifact" },
    ],
    related: ["reaction-diffusion", "orbit-pinn"],
  },
  {
    slug: "codex-chess-lab",
    updated: "2026-08-22",
    maturity: "M7 in progress",
    evidenceClass: "Local engine, registered artifacts, paired-match ledger",
    oneLineClaim: "CodexEngine 0.3.0 is the incumbent, while every learned-evaluation candidate still has to clear a 400-game confidence gate before promotion.",
    problem: {
      title: "A stronger screen is not yet a stronger engine.",
      paragraphs: [
        "Codex Chess Lab is an independent C++ UCI engine and an experiment platform for search and learned evaluation. The central research object is the promotion protocol, not a single attractive match score.",
        "Candidate changes are first screened in paired games, then challenged over 400 games. Draws, failures, side balance, and the lower confidence bound remain visible so noisy wins are not mistaken for reliable progress.",
      ],
    },
    governing: [
      { label: "Search", expression: "v(s) = maxₐ −v(T(s,a))", note: "Negamax search with engine-specific pruning and ordering layers." },
      { label: "Paired score", expression: "S = (W + 0.5D) / N", note: "Color-swapped pairings reduce first-move and side bias." },
      { label: "Promotion", expression: "CI₉₅,lower(S) > 0.50", note: "The gate also requires 400 games and zero technical failures." },
    ],
    architecture: [
      { title: "C++ UCI engine", body: "The engine can run in standard chess tools and the local browser arena." },
      { title: "Deterministic match harness", body: "Paired openings, time controls, seeds, and engine identities are recorded for comparison." },
      { title: "Teacher-data lane", body: "Stockfish-derived positions support linear and neural evaluation experiments without importing Stockfish code." },
      { title: "Promotion registry", body: "Screens, full gates, failures, and rejected candidates remain registered rather than overwritten." },
    ],
    protocol: [
      "Use CodexEngine 0.3.0 as the current incumbent.",
      "Run paired, color-swapped games under matched controls.",
      "Treat a 100-game screen as directional evidence only.",
      "Promote only after 400 paired games, zero failures, and a 95% lower confidence bound above 50%.",
    ],
    metrics: [
      { label: "M7 experiments", value: "96", note: "registered experiment records", tone: "neutral" },
      { label: "Incumbent screens", value: "46", note: "candidate comparisons against 0.3.0", tone: "neutral" },
      { label: "Registered artifacts", value: "152", note: "models, ledgers, and evaluation outputs", tone: "neutral" },
      { label: "Best 100-game screen", value: "58.0%", note: "M4 + broad40k candidate, directional only", tone: "positive" },
      { label: "400-game result", value: "53.5%", note: "99W / 230D / 71L", tone: "neutral" },
      { label: "CI95", value: "48.60–58.33%", note: "lower bound fails promotion gate", tone: "caution" },
    ],
    figures: [],
    limitations: [
      "No current learned-evaluation candidate has cleared the declared promotion gate.",
      "A strong short screen is vulnerable to variance and cannot justify a version promotion.",
      "Teacher-data quality does not by itself prove playing-strength improvement.",
      "The engine is explicitly not presented as Stockfish-level.",
    ],
    reproducibility: [
      { label: "Incumbent", value: "CodexEngine 0.3.0" },
      { label: "Source revision", value: "db14c80 at the 2026-08-22 audit" },
      { label: "Promotion sample", value: "400 paired games" },
      { label: "Uncertainty", value: "95% confidence interval on paired score" },
      { label: "Failure policy", value: "Zero engine or harness failures required" },
    ],
    nextGate: {
      title: "Find a candidate whose uncertainty clears the line.",
      body: "The next promoted engine must improve the confidence floor, not only the point estimate. Existing CPV1 and policy/value artifacts remain inputs to candidate design, not promotion evidence.",
      criteria: ["Pass a bounded 100-game screen", "Complete 400 paired games", "Record zero failures", "Require CI95 lower bound above 50%"],
    },
    sources: [
      { label: "Progress ledger", detail: "docs/PROGRESS.md" },
      { label: "Engine source", detail: "Independent C++ UCI implementation" },
      { label: "Match artifacts", detail: "Registered paired screens and full-gate results" },
    ],
    related: ["geoguesser-engine", "orbit-pinn"],
  },
  {
    slug: "geoguesser-engine",
    updated: "2026-08-22",
    maturity: "D1 data collection blocked",
    evidenceClass: "Local pipeline, compliance checks, synthetic fixture",
    oneLineClaim: "The explainable geolocation system has a tested data foundation, but the real Mapillary corpus is still at zero records because collection credentials are unavailable.",
    problem: {
      title: "Before model accuracy, the dataset must be legal, balanced, and leak-resistant.",
      paragraphs: [
        "The engine is designed to rank likely locations from street imagery while exposing visual, textual, and geographic clues. Its first hard problem is not model architecture but a corpus whose provenance and splits remain auditable.",
        "A small synthetic fixture validates the mechanics. It does not validate real-world geolocation. The D1 gate stays blocked until a balanced Mapillary-only corpus can be collected and checked without sequence or route leakage.",
      ],
    },
    governing: [
      { label: "Target coverage", expression: "107 targets × ≥100 records = 10,700", note: "The declared minimum corpus gate." },
      { label: "Retrieval", expression: "p(location | visual, OCR, script, prior)", note: "The planned baseline combines explainable evidence channels." },
      { label: "Leakage boundary", expression: "route(train) ∩ route(test) = ∅", note: "Sequence and route identity must not cross evaluation splits." },
    ],
    architecture: [
      { title: "Manifest-first ingestion", body: "Every record carries source, license, attribution, coordinates, and capture identity before modeling." },
      { title: "Quality and duplicate checks", body: "The pipeline rejects invalid records and searches for duplicate imagery before split construction." },
      { title: "Explainable baseline", body: "OCR, script or language hints, gazetteer matches, priors, and visual retrieval metadata remain inspectable." },
      { title: "Local API surface", body: "FastAPI and SQLite provide a local-first service boundary for future interfaces." },
    ],
    protocol: [
      "Use Mapillary as the declared real-corpus source for D1.",
      "Collect at least 100 valid records for each of 107 targets.",
      "Reject duplicate, invalid, unattributed, and license-incompatible items.",
      "Split by sequence and route so adjacent captures cannot leak across evaluation sets.",
    ],
    metrics: [
      { label: "Synthetic fixture", value: "4 records", note: "four countries; pipeline mechanics only", tone: "neutral" },
      { label: "Fixture validity", value: "0 invalid", note: "also zero duplicates in the tiny fixture", tone: "positive" },
      { label: "Toy retrieval", value: "1 / 1", note: "not a real-world accuracy estimate", tone: "neutral" },
      { label: "D1 target", value: "10,700", note: "minimum real corpus records", tone: "neutral" },
      { label: "Current real corpus", value: "0", note: "collection token unavailable", tone: "caution" },
      { label: "Automated checks", value: "51 passed", note: "one warning at the latest local audit", tone: "positive" },
    ],
    figures: [],
    limitations: [
      "The four-record fixture demonstrates pipeline behavior only and cannot support a model-quality claim.",
      "No real Mapillary records are present at the current D1 checkpoint.",
      "Geographic balance, route leakage, and retrieval quality remain untested on the intended corpus.",
      "The project is a research and practice assistant, not live-game automation.",
    ],
    reproducibility: [
      { label: "Current milestone", value: "M4 complete; D1 in progress" },
      { label: "Real source", value: "Mapillary-only plan" },
      { label: "Corpus gate", value: "107 targets, at least 100 records each" },
      { label: "Split policy", value: "No sequence or route leakage" },
      { label: "Blocker", value: "Collection token unavailable" },
    ],
    nextGate: {
      title: "Build the corpus before building the accuracy story.",
      body: "Once collection access exists, the next outcome is a complete D1 manifest and quality report. Model training should begin only after every target and leakage gate is satisfied.",
      criteria: ["Collect 10,700 valid records", "Reach 107 of 107 target coverage", "Pass license and attribution checks", "Prove route-disjoint splits"],
    },
    sources: [
      { label: "Progress ledger", detail: "docs/progress.md" },
      { label: "Synthetic fixture", detail: "M4 four-record legal test corpus" },
      { label: "D1 gate", detail: "Mapillary-only collection and coverage criteria" },
    ],
    related: ["codex-chess-lab", "object-classification-paper"],
  },
  {
    slug: "object-classification-paper",
    updated: "2026-08-22",
    maturity: "Published",
    evidenceClass: "Public journal article and DOI record",
    oneLineClaim: "The paper reports a large improvement when histogram features are added to combined edge features on its study split, but the article does not establish external generalization.",
    problem: {
      title: "Can inexpensive handcrafted features make traffic-object classes easier to separate?",
      paragraphs: [
        "The study combines Sobel, Canny, and Roberts edge extraction with a Random Forest classifier, then tests whether intensity histograms add discriminative information.",
        "The result is a public, peer-reviewed record. Its reported split performance should be read within the information the paper exposes, not extrapolated to new datasets, repeated seeds, or deployment conditions that were not evaluated.",
      ],
    },
    governing: [
      { label: "Feature map", expression: "x = [Sobel(I), Canny(I), Roberts(I), hist(I)]", note: "The full configuration concatenates edges and intensity statistics." },
      { label: "Ensemble", expression: "ŷ = mode{T₁(x), …, Tₙ(x)}", note: "Random Forest aggregates decisions from multiple trees." },
      { label: "Evaluation", expression: "accuracy, precision, recall, F1", note: "Metrics are reported on the study's 80/20 split." },
    ],
    architecture: [
      { title: "Edge extraction", body: "Three operators expose complementary boundary structure from the input images." },
      { title: "Histogram augmentation", body: "Intensity-frequency features are concatenated with the edge representation." },
      { title: "Random Forest", body: "A classical ensemble classifier maps the engineered feature vector to object classes." },
      { title: "Ablation-style comparison", body: "Edge-only and edge-plus-histogram configurations reveal the reported contribution of the added feature family." },
    ],
    protocol: [
      "Use the publication and DOI page as the canonical public record.",
      "Report the edge-only and histogram-augmented configurations separately.",
      "Describe results as performance on the study split.",
      "Do not infer repeated-seed stability, leakage resistance, or external validation when those details are not reported.",
    ],
    metrics: [
      { label: "Edge-only accuracy", value: "72.78%", note: "combined Sobel, Canny, and Roberts features", tone: "neutral" },
      { label: "Edge-only precision", value: "72.37%", note: "reported study-split result", tone: "neutral" },
      { label: "Edge-only recall", value: "72.61%", note: "reported study-split result", tone: "neutral" },
      { label: "Edge-only F1", value: "72.45%", note: "reported study-split result", tone: "neutral" },
      { label: "With histogram", value: "99.75%", note: "accuracy, precision, recall, and F1 reported at the same value", tone: "positive" },
      { label: "Published", value: "29 Nov 2023", note: "Jurnal Sistem dan Informatika 18(1), 58–63", tone: "neutral" },
    ],
    figures: [],
    limitations: [
      "The article reports an 80/20 split but does not expose dataset size in the public text audited for this prototype.",
      "Repeated seeds, cross-validation, and uncertainty intervals are not reported.",
      "No external dataset evaluation or deployment test is reported.",
      "The unusually high augmented result should remain tied to the study split unless leakage checks are available.",
    ],
    reproducibility: [
      { label: "DOI", value: "10.30864/jsi.v18i1.601" },
      { label: "Venue", value: "Jurnal Sistem dan Informatika 18(1)" },
      { label: "Pages", value: "58–63" },
      { label: "Split", value: "80% training / 20% testing as reported" },
      { label: "Public status", value: "Published 29 November 2023" },
    ],
    nextGate: {
      title: "Test whether the gain survives stricter evaluation.",
      body: "A modern follow-up would preserve the published result while adding grouped splits, repeated seeds, leakage checks, and an external test set.",
      criteria: ["Recover and document dataset identity", "Repeat multiple seeded splits", "Add duplicate and leakage checks", "Evaluate one external dataset"],
    },
    sources: [
      { label: "Journal record", detail: "Article page, dates, volume, issue, and download", href: "https://jsi.stikom-bali.ac.id/index.php/jsi/article/view/601" },
      { label: "DOI", detail: "Canonical identifier", href: "https://doi.org/10.30864/jsi.v18i1.601" },
    ],
    related: ["geoguesser-engine", "wave-pinn-thesis"],
  },
];

export const researchDossierMap = new Map(researchDossiers.map((dossier) => [dossier.slug, dossier]));
