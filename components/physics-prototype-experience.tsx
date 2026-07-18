import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { publication, works } from "@/data/site";

export const physicsDirections = [
  { slug: "phase-portrait", index: "01", name: "Phase Portrait", system: "Dynamical systems", description: "Research trajectories moving through a phase plane of stable and unstable questions." },
  { slug: "vector-field", index: "02", name: "Vector Field", system: "Directional calculus", description: "Projects advected through a field of physical structure, computation, and evidence." },
  { slug: "wave-interference", index: "03", name: "Wave Interference", system: "Superposition", description: "Three coherent research sources generating one shared interference field." },
  { slug: "tensor-manifold", index: "04", name: "Tensor Manifold", system: "Differential geometry", description: "A warped coordinate surface where projects create local curvature and geodesics." },
  { slug: "lagrangian-mechanics", index: "05", name: "Lagrangian Mechanics", system: "Constrained motion", description: "A coupled pendulum and action trace organizing research as physically constrained motion." },
  { slug: "topology-lab", index: "06", name: "Topology Lab", system: "Continuous transformation", description: "One research surface changes form while its important invariants remain visible." },
  { slug: "hamiltonian-contours", index: "07", name: "Hamiltonian Contours", system: "Energy conservation", description: "Current work organized as trajectories moving across conserved energy shells." },
  { slug: "feynman-paths", index: "08", name: "Feynman Paths", system: "Interaction diagrams", description: "Physics, computation, and evidence meet at explicit interaction vertices." },
  { slug: "pde-boundary-lab", index: "09", name: "PDE Boundary Lab", system: "Computational domain", description: "A meshed domain, boundary conditions, and evolving solution become the interface." },
  { slug: "fourier-synthesis", index: "10", name: "Fourier Synthesis", system: "Basis decomposition", description: "Rotating modes and a growing spectrum compose complex research from interpretable parts." },
] as const;

export type PhysicsSlug = (typeof physicsDirections)[number]["slug"];
const featured = works.filter((work) => work.featured);

function PhysicsDock({ active }: { active?: PhysicsSlug }) {
  return (
    <aside className="pa-dock" aria-label="Physics Atlas variations">
      <Link className="pa-dock-title" href="/prototypes/physics"><small>AH / Physics Atlas</small><strong>10 systems</strong></Link>
      <nav>{physicsDirections.map((direction) => <Link key={direction.slug} href={`/prototypes/physics/${direction.slug}`} aria-current={active === direction.slug ? "page" : undefined} title={`${direction.name} — ${direction.system}`}>{direction.index}</Link>)}</nav>
      <Link className="pa-dock-parent" href="/prototypes/constellation-map">Parent / 03</Link>
    </aside>
  );
}

function PhysicsBrand({ dark = false }: { dark?: boolean }) {
  return <Link className={dark ? "pa-brand pa-brand--dark" : "pa-brand"} href="/"><span>AH</span><strong>Andre Huizen</strong></Link>;
}

function ProjectNode({ index, className = "" }: { index: number; className?: string }) {
  const work = featured[index];
  return <Link href={`/work/${work.slug}`} className={`pa-project-node ${className}`}><i /><small>0{index + 1}</small><strong>{work.title}</strong><span>{work.topics[0]} / {work.year}</span></Link>;
}

function PhasePortrait() {
  return (
    <div className="physics-page pa-phase">
      <PhysicsDock active="phase-portrait" /><header className="pa-header"><PhysicsBrand /><span>Dynamical systems / phase plane</span><Link href="/archive">Research states ↗</Link></header>
      <main className="phase-plane">
        <div className="phase-title"><small>Central state / current research</small><h1>Rules shape<br /><em>trajectories.</em></h1><p>Physical constraints change which futures a learned system can reach.</p></div>
        <svg className="phase-graphic" viewBox="0 0 1000 700" role="img" aria-label="Animated phase portrait with solution trajectories">
          <defs><marker id="phase-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" /></marker></defs>
          <line className="phase-axis" x1="70" y1="350" x2="940" y2="350" /><line className="phase-axis" x1="500" y1="50" x2="500" y2="650" />
          <path id="phase-path-a" className="phase-curve" d="M90 590 C220 610 270 470 350 390 C430 310 470 330 500 350 C560 390 660 340 720 225 C785 100 870 75 930 95" markerEnd="url(#phase-arrow)" />
          <path id="phase-path-b" className="phase-curve phase-curve--b" d="M120 100 C235 80 315 165 350 260 C390 365 455 390 500 350 C555 300 610 185 720 155 C820 128 895 180 930 245" markerEnd="url(#phase-arrow)" />
          <path id="phase-path-c" className="phase-curve phase-curve--c" d="M100 400 C230 430 250 325 330 300 C410 275 460 305 500 350 C545 400 620 470 735 500 C825 525 885 490 930 445" markerEnd="url(#phase-arrow)" />
          <circle className="phase-equilibrium" cx="500" cy="350" r="10" /><circle className="phase-tracer" r="7"><animateMotion dur="7s" repeatCount="indefinite" path="M90 590 C220 610 270 470 350 390 C430 310 470 330 500 350 C560 390 660 340 720 225 C785 100 870 75 930 95" /></circle>
          <text x="925" y="340">model state x</text><text x="515" y="65">residual velocity ẋ</text>
        </svg>
        <ProjectNode index={0} className="phase-node phase-node--1" /><ProjectNode index={1} className="phase-node phase-node--2" /><ProjectNode index={2} className="phase-node phase-node--3" />
      </main>
      <section className="phase-basins"><span>Stable practice</span><h2>Model → measure → revise</h2><div><p>Physics defines reachable states.</p><p>Numerical references expose drift.</p><p>Negative results reshape the basin.</p></div></section>
    </div>
  );
}

function VectorField() {
  const arrows = Array.from({ length: 56 }, (_, index) => ({ x: 75 + (index % 8) * 125, y: 85 + Math.floor(index / 8) * 90, angle: ((index % 8) - 3.5) * 10 + (Math.floor(index / 8) - 3) * -8 }));
  return (
    <div className="physics-page pa-vector">
      <PhysicsDock active="vector-field" /><header className="pa-header"><PhysicsBrand dark /><span>Vector calculus / research forces</span><Link href="/research">Components ↗</Link></header>
      <main className="vector-stage">
        <div className="vector-copy"><small>Resultant direction</small><h1>Follow the<br /><em>field.</em></h1><p>Physical structure, computation, and evidence act together on every research decision.</p></div>
        <svg className="vector-graphic" viewBox="0 0 1100 720" role="img" aria-label="Animated directional vector field">
          <defs><marker id="vector-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" /></marker></defs>
          {arrows.map((arrow, index) => <line key={index} className="vector-arrow" x1={arrow.x - 23} y1={arrow.y} x2={arrow.x + 23} y2={arrow.y} style={{ "--vector-rotation": `${arrow.angle}deg`, "--vector-delay": `${(index % 9) * -0.18}s` } as React.CSSProperties} markerEnd="url(#vector-arrow)" />)}
          <path className="vector-stream" d="M30 620 C240 590 250 390 450 410 S720 195 1060 120" />
          <circle className="vector-particle" r="6"><animateMotion dur="8s" repeatCount="indefinite" path="M30 620 C240 590 250 390 450 410 S720 195 1060 120" /></circle>
        </svg>
        <ProjectNode index={0} className="vector-node vector-node--1" /><ProjectNode index={1} className="vector-node vector-node--2" /><ProjectNode index={2} className="vector-node vector-node--3" />
        <div className="vector-legend"><span>F₁ physical constraints</span><span>F₂ numerical reference</span><span>F₃ inspectability</span></div>
      </main>
      <section className="vector-result"><span>F = F₁ + F₂ + F₃</span><h2>Direction is a result,<br />not a decoration.</h2><Link href="/about">Read the research practice <ArrowIcon /></Link></section>
    </div>
  );
}

function WaveInterference() {
  return (
    <div className="physics-page pa-wave">
      <PhysicsDock active="wave-interference" /><header className="pa-header"><PhysicsBrand /><span>Wave physics / superposition</span><Link href="/research">Sources ↗</Link></header>
      <main className="wave-stage">
        <div className="wave-copy"><small>Superposed inquiry</small><h1>Meaning appears<br /><em>in the overlap.</em></h1></div>
        <div className="wave-source wave-source--1">{[1,2,3,4,5].map(n => <i key={n} style={{ "--ring": n } as React.CSSProperties} />)}<ProjectNode index={0} /></div>
        <div className="wave-source wave-source--2">{[1,2,3,4,5].map(n => <i key={n} style={{ "--ring": n } as React.CSSProperties} />)}<ProjectNode index={1} /></div>
        <div className="wave-source wave-source--3">{[1,2,3,4,5].map(n => <i key={n} style={{ "--ring": n } as React.CSSProperties} />)}<ProjectNode index={2} /></div>
        <svg className="wave-superposition" viewBox="0 0 1200 400" aria-hidden="true"><path d="M0 220 Q50 80 100 220 T200 220 T300 220 T400 220 T500 220 T600 220 T700 220 T800 220 T900 220 T1000 220 T1100 220 T1200 220" /><path d="M0 230 Q75 130 150 230 T300 230 T450 230 T600 230 T750 230 T900 230 T1050 230 T1200 230" /></svg>
        <div className="wave-hotspot"><span>Σ</span><p>physics + learning + evidence</p></div>
      </main>
      <section className="wave-proof"><h2>Three sources.<br />One research field.</h2><p>Simulation, physics-informed learning, and numerical comparison become more useful where their evidence overlaps.</p><Link href="/archive">Inspect the component signals <ArrowIcon /></Link></section>
    </div>
  );
}

function TensorManifold() {
  return (
    <div className="physics-page pa-tensor">
      <PhysicsDock active="tensor-manifold" /><header className="pa-header"><PhysicsBrand dark /><span>Differential geometry / metric field</span><Link href="/archive">Coordinates ↗</Link></header>
      <main className="tensor-stage">
        <div className="tensor-copy"><small>Metric gᵢⱼ(x)</small><h1>Structure bends<br /><em>the path.</em></h1><p>Research decisions follow the geometry created by assumptions, constraints, and evidence.</p></div>
        <div className="tensor-surface">{Array.from({length:12},(_,i)=><i key={`x${i}`} className="tensor-line tensor-line--x" style={{"--line":i} as React.CSSProperties} />)}{Array.from({length:12},(_,i)=><i key={`y${i}`} className="tensor-line tensor-line--y" style={{"--line":i} as React.CSSProperties} />)}<div className="tensor-geodesic"><b /></div></div>
        <ProjectNode index={0} className="tensor-node tensor-node--1" /><ProjectNode index={1} className="tensor-node tensor-node--2" /><ProjectNode index={2} className="tensor-node tensor-node--3" />
        <div className="tensor-equation">ds² = gᵢⱼ dxⁱ dxʲ</div>
      </main>
      <section className="tensor-notes"><span>Local curvature</span><h2>Every method changes<br />the research geometry.</h2><div><p>Constraints define the metric.</p><p>Baselines reveal curvature.</p><p>Evidence selects a geodesic.</p></div></section>
    </div>
  );
}

function LagrangianMechanics() {
  return (
    <div className="physics-page pa-lagrange">
      <PhysicsDock active="lagrangian-mechanics" /><header className="pa-header"><PhysicsBrand dark /><span>Analytical mechanics / action</span><Link href="/research">Measured motion ↗</Link></header>
      <main className="lagrange-stage">
        <div className="lagrange-copy"><small>δS = 0</small><h1>Motion,<br /><em>constrained.</em></h1><p>The strongest model is not free to move anywhere. Physical law shapes its path.</p></div>
        <svg className="pendulum-graphic" viewBox="0 0 700 760" role="img" aria-label="Animated double pendulum and trajectory">
          <path className="pendulum-trace" d="M360 590 C520 650 625 540 590 405 C555 270 390 300 405 465 C420 625 215 700 120 560 C30 425 135 260 300 325" />
          <g className="pendulum-arm pendulum-arm--one"><line x1="350" y1="90" x2="350" y2="360" /><circle cx="350" cy="360" r="25" /><g className="pendulum-arm pendulum-arm--two"><line x1="350" y1="360" x2="350" y2="625" /><circle cx="350" cy="625" r="32" /></g></g>
          <circle className="pendulum-pivot" cx="350" cy="90" r="9" />
        </svg>
        <ProjectNode index={0} className="lagrange-node lagrange-node--1" /><ProjectNode index={1} className="lagrange-node lagrange-node--2" /><ProjectNode index={2} className="lagrange-node lagrange-node--3" />
        <div className="lagrange-energy"><span>T kinetic</span><i /><span>V potential</span><b /></div>
      </main>
      <section className="lagrange-action"><span>S = ∫ L(q, q̇, t)dt</span><h2>Preserve the path,<br />not only the endpoint.</h2><p>Reproducible research records the action: assumptions, measurements, failures, and revisions.</p></section>
    </div>
  );
}

function TopologyLab() {
  return (
    <div className="physics-page pa-topology">
      <PhysicsDock active="topology-lab" /><header className="pa-header"><PhysicsBrand dark /><span>Topology / invariants</span><Link href="/archive">Research surface ↗</Link></header>
      <main className="topology-stage">
        <div className="topology-copy"><small>Continuous deformation</small><h1>Change the form.<br /><em>Keep the truth.</em></h1></div>
        <svg className="topology-graphic" viewBox="0 0 900 700" role="img" aria-label="Continuously morphing topology surface">
          <defs><linearGradient id="topology-fill" x1="0" x2="1"><stop stopColor="#ec8e5a" /><stop offset="1" stopColor="#8148c7" /></linearGradient></defs>
          <path className="topology-shape" fill="url(#topology-fill)" d="M180 350 C180 120 720 120 720 350 C720 580 180 580 180 350 Z">
            <animate attributeName="d" dur="9s" repeatCount="indefinite" values="M180 350 C180 120 720 120 720 350 C720 580 180 580 180 350 Z; M210 180 C450 70 720 210 650 430 C590 640 250 610 170 390 C110 240 130 220 210 180 Z; M180 350 C180 120 720 120 720 350 C720 580 180 580 180 350 Z" />
          </path>
          <ellipse className="topology-hole" cx="450" cy="350" rx="115" ry="78" /><circle className="topology-marker topology-marker--1" cx="260" cy="235" r="8" /><circle className="topology-marker topology-marker--2" cx="650" cy="340" r="8" /><circle className="topology-marker topology-marker--3" cx="330" cy="510" r="8" />
        </svg>
        <ProjectNode index={0} className="topology-node topology-node--1" /><ProjectNode index={1} className="topology-node topology-node--2" /><ProjectNode index={2} className="topology-node topology-node--3" />
        <div className="topology-invariant">χ = V − E + F <span>invariant / evidence</span></div>
      </main>
      <section className="topology-proof"><p>Different model.<br />Different numerical method.<br />Different scale.</p><h2>The invariant is an honest comparison against evidence.</h2></section>
    </div>
  );
}

function HamiltonianContours() {
  return (
    <div className="physics-page pa-hamiltonian">
      <PhysicsDock active="hamiltonian-contours" /><header className="pa-header"><PhysicsBrand /><span>Hamiltonian flow / energy shells</span><Link href="/research">Invariants ↗</Link></header>
      <main className="hamiltonian-stage">
        <div className="hamiltonian-copy"><small>H(q,p) = E</small><h1>Change state.<br /><em>Preserve structure.</em></h1><p>Useful learning systems move without losing the invariants that make them interpretable.</p></div>
        <svg className="hamiltonian-graphic" viewBox="0 0 900 700" role="img" aria-label="Animated Hamiltonian energy contours">
          {[0,1,2,3,4,5].map(i => <ellipse key={i} className="energy-shell" cx="450" cy="350" rx={120+i*50} ry={70+i*35} style={{"--shell":i} as React.CSSProperties} />)}
          <path className="energy-separatrix" d="M110 350 C250 140 340 140 450 350 C560 560 650 560 790 350 C650 140 560 140 450 350 C340 560 250 560 110 350 Z" />
          <circle className="energy-particle" r="9"><animateMotion dur="8s" repeatCount="indefinite" path="M170 350 A280 175 0 1 0 730 350 A280 175 0 1 0 170 350" /></circle>
        </svg>
        <ProjectNode index={0} className="hamiltonian-node hamiltonian-node--1" /><ProjectNode index={1} className="hamiltonian-node hamiltonian-node--2" /><ProjectNode index={2} className="hamiltonian-node hamiltonian-node--3" />
      </main>
      <section className="hamiltonian-invariant"><span>Conserved quantity</span><h2>Inspectability survives<br />the trajectory.</h2><div><b>H₁</b><p>Physical constraints</p><b>H₂</b><p>Numerical reference</p><b>H₃</b><p>Recorded failures</p></div></section>
    </div>
  );
}

function FeynmanPaths() {
  return (
    <div className="physics-page pa-feynman">
      <PhysicsDock active="feynman-paths" /><header className="pa-header"><PhysicsBrand dark /><span>Interaction diagram / research process</span><Link href={publication.url} target="_blank">Published channel ↗</Link></header>
      <main className="feynman-stage">
        <div className="feynman-copy"><small>Interaction amplitude</small><h1>Ideas meet<br /><em>at vertices.</em></h1><p>Physics, computation, and evidence interact to produce work that none can create alone.</p></div>
        <svg className="feynman-graphic" viewBox="0 0 1100 700" role="img" aria-label="Animated Feynman-style interaction diagram">
          <line className="fermion-line" x1="70" y1="120" x2="480" y2="350" /><line className="fermion-line" x1="70" y1="580" x2="480" y2="350" /><line className="fermion-line" x1="620" y1="350" x2="1030" y2="120" /><line className="fermion-line" x1="620" y1="350" x2="1030" y2="580" />
          <path className="photon-line" d="M480 350 q18 -35 35 0 t35 0 t35 0 t35 0" />
          <circle className="feynman-vertex" cx="480" cy="350" r="10" /><circle className="feynman-vertex feynman-vertex--2" cx="620" cy="350" r="10" />
          <circle className="feynman-particle" r="7"><animateMotion dur="4s" repeatCount="indefinite" path="M70 120 L480 350" /></circle><circle className="feynman-particle feynman-particle--b" r="7"><animateMotion begin="1.1s" dur="4s" repeatCount="indefinite" path="M70 580 L480 350" /></circle>
          <text x="60" y="100">physics</text><text x="55" y="615">computation</text><text x="940" y="100">research output</text><text x="955" y="615">evidence</text>
        </svg>
        <ProjectNode index={0} className="feynman-node feynman-node--1" /><ProjectNode index={1} className="feynman-node feynman-node--2" /><ProjectNode index={2} className="feynman-node feynman-node--3" />
      </main>
      <section className="feynman-output"><span>Observed channel / publication</span><h2>Edge information,<br />combined.</h2><p>{publication.title}</p><a href={publication.url} target="_blank" rel="noreferrer">DOI {publication.doi} <ExternalIcon /></a></section>
    </div>
  );
}

function PDEBoundaryLab() {
  return (
    <div className="physics-page pa-pde">
      <PhysicsDock active="pde-boundary-lab" /><header className="pa-header"><PhysicsBrand /><span>Computational domain / boundary value problem</span><Link href="/research">Solver notes ↗</Link></header>
      <main className="pde-stage">
        <div className="pde-copy"><small>Ω ⊂ ℝ²</small><h1>Define the domain.<br /><em>Then solve.</em></h1><p>Good research makes the boundary, assumptions, and reference solution explicit.</p></div>
        <div className="pde-domain"><div className="pde-mesh" /><svg viewBox="0 0 800 580" aria-hidden="true"><defs><radialGradient id="pde-heat"><stop stopColor="#ffb45f" stopOpacity=".9" /><stop offset="1" stopColor="#ffb45f" stopOpacity="0" /></radialGradient></defs><circle className="pde-pulse pde-pulse--1" cx="250" cy="220" r="170" fill="url(#pde-heat)" /><circle className="pde-pulse pde-pulse--2" cx="590" cy="390" r="150" fill="url(#pde-heat)" /><path className="pde-contour" d="M90 420 C190 310 260 360 330 285 S510 170 710 250" /><path className="pde-contour pde-contour--2" d="M70 330 C180 235 275 270 355 210 S560 110 730 190" /></svg><span className="pde-boundary pde-boundary--top">u = 0 / Dirichlet</span><span className="pde-boundary pde-boundary--right">∂u/∂n = 0</span><span className="pde-boundary pde-boundary--bottom">periodic boundary</span></div>
        <ProjectNode index={0} className="pde-node pde-node--1" /><ProjectNode index={1} className="pde-node pde-node--2" /><ProjectNode index={2} className="pde-node pde-node--3" />
      </main>
      <section className="pde-protocol"><h2>Solver protocol</h2><ol><li><span>01</span>State the governing equation.</li><li><span>02</span>Expose the boundary conditions.</li><li><span>03</span>Compare against a numerical reference.</li></ol><code>∂u/∂t = D∇²u + R(u)</code></section>
    </div>
  );
}

function FourierSynthesis() {
  return (
    <div className="physics-page pa-fourier">
      <PhysicsDock active="fourier-synthesis" /><header className="pa-header"><PhysicsBrand /><span>Harmonic analysis / basis functions</span><Link href="/archive">Spectrum ↗</Link></header>
      <main className="fourier-stage">
        <div className="fourier-copy"><small>f(x) = Σ aₙeⁱⁿˣ</small><h1>Complexity,<br /><em>decomposed.</em></h1><p>Interpretable modes can combine into behavior that no single component explains.</p></div>
        <svg className="fourier-graphic" viewBox="0 0 1100 700" role="img" aria-label="Animated Fourier epicycles and generated signal">
          <circle className="fourier-orbit fourier-orbit--1" cx="250" cy="350" r="135" /><circle className="fourier-orbit fourier-orbit--2" cx="385" cy="350" r="70" /><circle className="fourier-orbit fourier-orbit--3" cx="455" cy="350" r="38" />
          <g className="fourier-arm fourier-arm--1"><line x1="250" y1="350" x2="385" y2="350" /><circle cx="385" cy="350" r="8" /></g><g className="fourier-arm fourier-arm--2"><line x1="385" y1="350" x2="455" y2="350" /><circle cx="455" cy="350" r="7" /></g><g className="fourier-arm fourier-arm--3"><line x1="455" y1="350" x2="493" y2="350" /><circle cx="493" cy="350" r="6" /></g>
          <line className="fourier-guide" x1="493" y1="350" x2="570" y2="350" /><path className="fourier-signal" d="M570 350 C610 230 650 470 690 350 S770 230 810 350 S890 470 930 350 S1010 230 1050 350" />
        </svg>
        <div className="fourier-spectrum">{[.92,.68,.48,.34,.22,.16,.1,.07].map((height,index)=><i key={index} style={{"--amplitude":height,"--frequency":index} as React.CSSProperties} />)}<span>amplitude / mode n</span></div>
        <ProjectNode index={0} className="fourier-node fourier-node--1" /><ProjectNode index={1} className="fourier-node fourier-node--2" /><ProjectNode index={2} className="fourier-node fourier-node--3" />
      </main>
      <section className="fourier-modes"><span>Dominant modes</span><h2>Physics. Numerics. Learning.</h2><p>Three interpretable components, synthesized into one research practice.</p><Link href="/about">Read the full composition <ArrowIcon /></Link></section>
    </div>
  );
}

const physicsRenderers: Record<PhysicsSlug, () => React.ReactNode> = {
  "phase-portrait": PhasePortrait, "vector-field": VectorField, "wave-interference": WaveInterference, "tensor-manifold": TensorManifold, "lagrangian-mechanics": LagrangianMechanics, "topology-lab": TopologyLab, "hamiltonian-contours": HamiltonianContours, "feynman-paths": FeynmanPaths, "pde-boundary-lab": PDEBoundaryLab, "fourier-synthesis": FourierSynthesis,
};

export function PhysicsPrototypeExperience({ slug }: { slug: PhysicsSlug }) { const Render = physicsRenderers[slug]; return <Render />; }

export function PhysicsPrototypeIndex() {
  return <div className="physics-page pa-index"><PhysicsDock /><header><PhysicsBrand /><span>Derived from prototype 03 / spatial research map</span></header><main><p>Physics Atlas / ten systems</p><h1>One spatial idea.<br /><em>Ten physical laws.</em></h1><div>{physicsDirections.map(direction => <Link key={direction.slug} href={`/prototypes/physics/${direction.slug}`} className={`pa-index-row pa-index-row--${direction.index}`}><span>{direction.index}</span><section><small>{direction.system}</small><h2>{direction.name}</h2><p>{direction.description}</p></section><b>Open system <ArrowIcon /></b></Link>)}</div></main><footer><Link href="/prototypes/constellation-map">Return to parent prototype <ArrowIcon /></Link><Link href="/prototypes">All architecture studies <ArrowIcon /></Link></footer></div>;
}
