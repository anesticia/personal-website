"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { publication, works } from "@/data/site";

export const fieldManifoldDirections = [
  { slug: "force-fabric", index: "01", name: "Force Fabric", note: "Projects as attractors in a live vector field" },
  { slug: "curvature-atlas", index: "02", name: "Curvature Atlas", note: "A draggable 3D terrain of research evidence" },
  { slug: "tensor-coordinates", index: "03", name: "Tensor Coordinates", note: "Re-project the portfolio through three bases" },
  { slug: "method-collider", index: "04", name: "Method Collider", note: "Compare two projects at an interaction vertex" },
] as const;

export type FieldManifoldSlug = (typeof fieldManifoldDirections)[number]["slug"];
type Basis = "domain" | "method" | "evidence";

type ProjectRecord = {
  slug: string; code: string; short: string; source: string; stage: string;
  methods: string[]; concepts: string[]; accent: string;
  field: [number, number]; terrain: [number, number, number];
  coordinates: Record<Basis, [number, number, number]>;
};

const projectRecords: ProjectRecord[] = [
  { slug:"reaction-diffusion", code:"RD", short:"Pattern-forming PDE systems", source:"Local + private GitHub", stage:"Active research", methods:["PDE","ETDRK4","FFT","Benchmarking"], concepts:["simulation","pattern formation","numerical reference"], accent:"#ff8456", field:[69,28], terrain:[-.65,-.68,.9], coordinates:{domain:[76,24,.82],method:[70,31,.9],evidence:[78,23,.92]} },
  { slug:"orbit-pinn", code:"OP", short:"Long-horizon charged-particle learning", source:"Local paper artifacts", stage:"Active research", methods:["PINN","Autodiff","Fourier features","Invariants"], concepts:["Lorentz dynamics","rolling windows","hard continuity"], accent:"#f5b85b", field:[73,66], terrain:[.45,-.58,.72], coordinates:{domain:[72,66,.9],method:[53,23,.86],evidence:[68,42,.84]} },
  { slug:"wave-pinn-thesis", code:"WP", short:"PINN and FDTD wave comparison", source:"Local + private GitHub", stage:"Undergraduate thesis", methods:["PINN","FDTD","PDE","Benchmarking"], concepts:["wave equation","heterogeneous media","numerical comparison"], accent:"#79b9ff", field:[46,52], terrain:[-.05,-.22,.58], coordinates:{domain:[56,47,.72],method:[48,43,.72],evidence:[55,58,.7]} },
  { slug:"codex-chess-lab", code:"CL", short:"Evidence-led independent chess engine", source:"Local + private GitHub", stage:"M7 research in progress", methods:["C++","Search","Benchmarking","Neural evaluation"], concepts:["UCI engine","paired gates","failed-experiment record"], accent:"#b2db77", field:[24,27], terrain:[-.55,.68,.95], coordinates:{domain:[22,25,.7],method:[29,67,.84],evidence:[31,22,.95]} },
  { slug:"geoguesser-engine", code:"GE", short:"Explainable image geolocation assistant", source:"Local + private GitHub", stage:"M4 dataset foundation", methods:["Computer vision","FastAPI","SQLite","Data governance"], concepts:["evidence fusion","licensed imagery","ranked candidates"], accent:"#55d6c2", field:[25,70], terrain:[.55,.62,.72], coordinates:{domain:[24,69,.68],method:[30,77,.7],evidence:[28,63,.76]} },
  { slug:"object-classification-paper", code:"EF", short:"Edge and histogram feature classification", source:"Public journal article", stage:"Published 2023", methods:["Computer vision","Random Forest","Edge features","Benchmarking"], concepts:["Sobel / Canny / Roberts","histograms","traffic imagery"], accent:"#d894ff", field:[49,22], terrain:[.25,.78,.38], coordinates:{domain:[31,46,.65],method:[72,72,.62],evidence:[74,76,.88]} },
];

const workMap = new Map(works.map(work => [work.slug, work]));
const getWork = (record: ProjectRecord) => workMap.get(record.slug)!;
const sharedMethods = (a: ProjectRecord, b: ProjectRecord) => a.methods.filter(method => b.methods.includes(method));

const topologyProfiles: Record<string, { orientation: string; context: string; scope: string; rationale: string }> = {
  "reaction-diffusion": { orientation: "Forward model", context: "Physical system", scope: "Reusable simulator", rationale: "A numerical model turns reaction laws into comparable pattern dynamics." },
  "orbit-pinn": { orientation: "Learned solver", context: "Physical system", scope: "Research method", rationale: "A constrained neural solver learns trajectories while preserving physical structure." },
  "wave-pinn-thesis": { orientation: "Hybrid comparison", context: "Physical system", scope: "Focused study", rationale: "PINN predictions are read against a finite-difference reference." },
  "codex-chess-lab": { orientation: "Search system", context: "Software system", scope: "Research platform", rationale: "An engine, arena, and benchmark protocol form a reusable experimentation system." },
  "geoguesser-engine": { orientation: "Inference system", context: "Software + data", scope: "System foundation", rationale: "Visual evidence, provenance, and local services support explainable ranking." },
  "object-classification-paper": { orientation: "Feature inference", context: "Software + data", scope: "Focused study", rationale: "Engineered image features feed a published classifier experiment." },
};

const evidenceRegister = [
  { slug: "reaction-diffusion", question: "Do numerical schemes preserve the same pattern dynamics?", reference: "Fourier pseudo-spectral + ETDRK4", boundary: "Active research; six-scheme benchmark, not a universal solver ranking." },
  { slug: "orbit-pinn", question: "Can rolling PINNs preserve long-horizon charged-particle dynamics?", reference: "Kinematics, Lorentz-force, and energy residuals", boundary: "Active local research; no finished performance claim." },
  { slug: "wave-pinn-thesis", question: "How do PINNs compare with FDTD in heterogeneous media?", reference: "Finite-difference time-domain", boundary: "Thesis in progress; represented as ongoing research." },
  { slug: "codex-chess-lab", question: "Does a candidate engine change improve play?", reference: "Paired games with confidence gates", boundary: "M7 in progress; explicitly not presented as Stockfish-level." },
  { slug: "geoguesser-engine", question: "Can geolocation evidence remain explainable and licensed?", reference: "Manifest, attribution, duplicate checks, and quality reports", boundary: "M4 dataset foundation; not a live-game automation client." },
  { slug: "object-classification-paper", question: "Do edge and histogram features improve classification?", reference: "Published study split and DOI record", boundary: "Published result; full methodology and limits remain in the paper." },
] as const;

function FamilyDock({ active }: { active?: FieldManifoldSlug }) {
  return <aside className="fm-dock" aria-label="Field manifold variations">
    <Link href="/prototypes/field-manifold" className="fm-dock-title"><small>AH / FIELD × MANIFOLD</small><strong>4 real-project systems</strong></Link>
    <nav>{fieldManifoldDirections.map(direction => <Link key={direction.slug} href={`/prototypes/field-manifold/${direction.slug}`} aria-current={active === direction.slug ? "page" : undefined}><span>{direction.index}</span><b>{direction.name}</b></Link>)}</nav>
    <Link className="fm-dock-parent" href="/prototypes/physics">Parent atlas ↗</Link>
  </aside>;
}

function FamilyHeader({ dark=false, label, href="/archive" }: { dark?: boolean; label: string; href?: string }) {
  return <header className={`fm-header ${dark ? "fm-header--dark" : ""}`}>
    <Link href="/" className="fm-brand"><span>AH</span><strong>Andre Huizen</strong></Link>
    <p>{label}</p><Link href={href}>Research archive <ArrowIcon /></Link>
  </header>;
}

function EvidencePanel({ record, number=true }: { record: ProjectRecord; number?: boolean }) {
  const work = getWork(record);
  return <aside className="fm-evidence" style={{"--project-accent":record.accent} as CSSProperties}>
    <div><span>{number ? record.code : work.year}</span><small>{record.source}</small></div>
    <p>{record.stage}</p><h2>{work.title}</h2><p>{work.summary}</p>
    <dl>{work.facts.slice(0,3).map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    <div className="fm-methods">{record.methods.map(method => <span key={method}>{method}</span>)}</div>
    <Link href={`/work/${record.slug}`}>Open complete record <ArrowIcon /></Link>
  </aside>;
}

function ForceFabric() {
  const [active, setActive] = useState(0);
  const [pointer, setPointer] = useState<[number,number]>([52,46]);
  const arrows = useMemo(() => {
    const result: {x:number;y:number;angle:number;strength:number}[] = [];
    for(let y=92;y<=650;y+=72) for(let x=70;x<=930;x+=78) {
      let vx=.34, vy=0;
      projectRecords.forEach((project,index) => {
        const px=project.field[0]*10, py=project.field[1]*7;
        const dx=px-x, dy=py-y, dist=Math.max(75,Math.hypot(dx,dy));
        const pull=(index===active ? 105 : 24)/(dist*dist);
        vx+=dx*pull; vy+=dy*pull;
      });
      const dx=pointer[0]*10-x, dy=pointer[1]*7-y, dist=Math.max(60,Math.hypot(dx,dy));
      vx+=dx*50/(dist*dist); vy+=dy*50/(dist*dist);
      result.push({x,y,angle:Math.atan2(vy,vx)*180/Math.PI,strength:Math.min(1,.3+Math.hypot(vx,vy)*1.8)});
    }
    return result;
  },[active,pointer]);
  const onMove = (event:ReactPointerEvent<HTMLElement>) => { const box=event.currentTarget.getBoundingClientRect(); setPointer([((event.clientX-box.left)/box.width)*100,((event.clientY-box.top)/box.height)*100]); };
  return <div className="fm-page fm-force"><FamilyDock active="force-fabric" /><FamilyHeader label="Vector calculus × curved research space" />
    <main className="force-stage" onPointerMove={onMove}>
      <section className="force-intro"><small>Live portfolio field / move the pointer</small><h1>Every project<br /><em>changes the field.</em></h1><p>Six real investigations exert different pulls through physics, computation, evidence, and software.</p></section>
      <svg className="force-vectors" viewBox="0 0 1000 700" aria-hidden="true"><defs><marker id="fm-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" /></marker></defs>{arrows.map((arrow,index)=><line key={index} x1={arrow.x-16} y1={arrow.y} x2={arrow.x+16} y2={arrow.y} transform={`rotate(${arrow.angle} ${arrow.x} ${arrow.y})`} opacity={arrow.strength} markerEnd="url(#fm-arrow)" />)}</svg>
      <div className="force-projects">{projectRecords.map((project,index)=><button key={project.slug} className={active===index ? "is-active" : ""} style={{"--x":`${project.field[0]}%`,"--y":`${project.field[1]}%`,"--project-accent":project.accent} as CSSProperties} onPointerEnter={()=>setActive(index)} onFocus={()=>setActive(index)} onClick={()=>setActive(index)}><i /><span>{project.code}</span><strong>{getWork(project).title}</strong></button>)}</div>
      <EvidencePanel record={projectRecords[active]} />
      <div className="force-equation">F(x) = Σᵢ wᵢ · (pᵢ − x) / ‖pᵢ − x‖² <span>Interface model, not a project ranking</span></div>
    </main>
  </div>;
}

type ProjectPoint = {x:number;y:number;index:number};
function CurvatureCanvas({active,onActive,className=""}:{active:number;onActive:(index:number)=>void;className?:string}) {
  const canvasRef=useRef<HTMLCanvasElement>(null); const pointsRef=useRef<ProjectPoint[]>([]);
  const [rotation,setRotation]=useState({yaw:-.42,pitch:.72}); const drag=useRef<{x:number;y:number;yaw:number;pitch:number}|null>(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return; const context=canvas.getContext("2d"); if(!context) return;
    let animationFrame=0; let lastFrame=0; const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw=(time=0)=>{
      const box=canvas.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1), pixelWidth=Math.round(box.width*dpr), pixelHeight=Math.round(box.height*dpr); if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight} context.setTransform(dpr,0,0,dpr,0,0); context.clearRect(0,0,box.width,box.height);
      const surface=(x:number,z:number)=>projectRecords.reduce((sum,p)=>{const dx=x-p.terrain[0],dz=z-p.terrain[1];return sum+p.terrain[2]*Math.exp(-(dx*dx+dz*dz)*5.4)},0)*.48;
      const project=(x:number,y:number,z:number)=>{const yaw=rotation.yaw,pitch=rotation.pitch;const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch); const rx=x*cy+z*sy, rz=-x*sy+z*cy; const ry=y*cp-rz*sp, rz2=y*sp+rz*cp; const f=2.4/(rz2+3.7), scale=Math.min(box.width,box.height)*.72; return [box.width*.5+rx*f*scale,box.height*.58-ry*f*scale] as const;};
      const lines=25; context.lineWidth=1;
      for(let axis=0;axis<2;axis++) for(let i=0;i<lines;i++){context.beginPath(); for(let j=0;j<lines;j++){const a=-1.25+(i/(lines-1))*2.5,b=-1.25+(j/(lines-1))*2.5; const x=axis?a:b,z=axis?b:a,y=surface(x,z); const [sx,sy]=project(x,y,z); if(j) context.lineTo(sx,sy); else context.moveTo(sx,sy);} context.strokeStyle=i%4===0?"rgba(98,49,31,.38)":"rgba(98,49,31,.14)";context.stroke();}
      const projected=projectRecords.map((record,index)=>{const [x,y]=project(record.terrain[0],surface(record.terrain[0],record.terrain[1])+.04,record.terrain[1]);const [baseX,baseY]=project(record.terrain[0],0,record.terrain[1]);return{x,y,baseX,baseY,index}}); const selected=projected[active];
      projectRecords.forEach((record,index)=>{if(index===active)return;const methods=sharedMethods(projectRecords[active],record);if(!methods.length)return;const point=projected[index];context.save();context.beginPath();context.moveTo(selected.x,selected.y);context.lineTo(point.x,point.y);context.setLineDash([7,7]);context.lineDashOffset=-(time*.018);context.strokeStyle=`${record.accent}bb`;context.lineWidth=1.6;context.stroke();context.setLineDash([]);const progress=(time*.00018+index*.19)%1;const pulseX=selected.x+(point.x-selected.x)*progress,pulseY=selected.y+(point.y-selected.y)*progress;context.beginPath();context.arc(pulseX,pulseY,3,0,Math.PI*2);context.fillStyle=record.accent;context.fill();context.restore()});
      pointsRef.current=projected.map(({x,y,baseX,baseY,index})=>{const record=projectRecords[index];context.beginPath();context.moveTo(baseX,baseY);context.lineTo(x,y);context.strokeStyle=index===active?`${record.accent}bb`:"rgba(80,56,42,.18)";context.lineWidth=index===active?1.5:1;context.stroke();context.beginPath();context.arc(x,y,index===active?10:5,0,Math.PI*2);context.fillStyle=record.accent;context.fill(); if(index===active){context.beginPath();context.arc(x,y,18+Math.sin(time*.004)*2,0,Math.PI*2);context.strokeStyle=record.accent;context.lineWidth=1.5;context.stroke();} context.fillStyle="#2a2019";context.font="700 10px monospace";context.fillText(record.code,x+13,y-11);return{x,y,index};});
    }; const loop=(time:number)=>{if(time-lastFrame>32){draw(time);lastFrame=time}animationFrame=requestAnimationFrame(loop)}; if(reduceMotion)draw();else animationFrame=requestAnimationFrame(loop); const observer=new ResizeObserver(()=>draw(performance.now())); observer.observe(canvas); return()=>{observer.disconnect();cancelAnimationFrame(animationFrame)};
  },[active,rotation]);
  const onPointerDown=(event:ReactPointerEvent<HTMLCanvasElement>)=>{drag.current={x:event.clientX,y:event.clientY,...rotation};event.currentTarget.setPointerCapture(event.pointerId)};
  const onPointerMove=(event:ReactPointerEvent<HTMLCanvasElement>)=>{if(!drag.current)return;setRotation({yaw:drag.current.yaw+(event.clientX-drag.current.x)*.007,pitch:Math.max(.25,Math.min(1.15,drag.current.pitch+(event.clientY-drag.current.y)*.005))})};
  const onPointerUp=(event:ReactPointerEvent<HTMLCanvasElement>)=>{if(drag.current&&Math.hypot(event.clientX-drag.current.x,event.clientY-drag.current.y)<7){const box=event.currentTarget.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;const nearest=pointsRef.current.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(nearest?.d<30)onActive(nearest.index)}drag.current=null};
  return <canvas ref={canvasRef} className={`curvature-canvas ${className}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-label="Draggable three-dimensional portfolio topology showing project method, context, and scope" />;
}

function CurvatureAtlas() {
  const [active,setActive]=useState(0); const record=projectRecords[active]; const profile=topologyProfiles[record.slug]; const connections=projectRecords.map((project,index)=>({project,index,methods:sharedMethods(record,project)})).filter(item=>item.index!==active&&item.methods.length);
  return <div className="fm-page fm-curvature"><FamilyDock active="curvature-atlas" /><FamilyHeader dark label="Portfolio topology / drag to inspect relationships" />
    <main className="curvature-stage"><section className="curvature-intro"><small>Curvature Atlas / 06 research systems</small><h1>Research has<br /><em>terrain.</em></h1><p>The surface maps what each project is, not how good it is: computational orientation, working context, and artifact scope.</p><a href="#evidence-register">Compare the evidence <ArrowIcon /></a></section>
      <div className="curvature-viewport"><CurvatureCanvas active={active} onActive={setActive} /><span className="curvature-axis curvature-axis--x">Forward model <b>method orientation</b> learned inference</span><span className="curvature-axis curvature-axis--z">Physical system <b>working context</b> software + data</span><span className="curvature-axis curvature-axis--y">Artifact scope ↑</span><p>Drag to rotate · select a node to trace exact shared methods</p></div>
      <nav className="curvature-index" aria-label="Select a project coordinate">{projectRecords.map((project,index)=><button key={project.slug} onClick={()=>setActive(index)} aria-pressed={active===index} className={active===index?"is-active":""}><span>{project.code}</span><strong>{getWork(project).title}</strong><i style={{background:project.accent}} /></button>)}</nav>
      <aside className="curvature-inspector" aria-live="polite" style={{"--project-accent":record.accent} as CSSProperties}><div className="curvature-inspector-body" key={record.slug}><header><span>Active coordinate / {record.code}</span><small>{record.stage}</small></header><h2>{getWork(record).title}</h2><p>{profile.rationale}</p><dl><div><dt>Orientation</dt><dd>{profile.orientation}</dd></div><div><dt>Context</dt><dd>{profile.context}</dd></div><div><dt>Scope</dt><dd>{profile.scope}</dd></div></dl><section><span>Method ridges / {connections.length}</span>{connections.length ? connections.map(item=><button key={item.project.slug} onClick={()=>setActive(item.index)}><i style={{background:item.project.accent}} />{item.project.code}<b>{item.methods.join(" + ")}</b></button>) : <p>No exact method overlap in the current taxonomy.</p>}</section><Link href={`/work/${record.slug}`}>Open complete record <ArrowIcon /></Link></div></aside>
    </main>
    <section className="curvature-model" aria-labelledby="topology-model-title"><header><small>Graph contract / navigational model</small><h2 id="topology-model-title">Three axes.<br/><em>No hidden score.</em></h2><p>Position explains the kind of work. Animated ridges appear only when two projects share an exact method label.</p></header><ol><li><span>x</span><h3>Method orientation</h3><p>From forward simulation and search toward learned inference.</p></li><li><span>z</span><h3>Working context</h3><p>From physical systems toward software and data systems.</p></li><li><span>y</span><h3>Artifact scope</h3><p>From a focused study toward a reusable research system.</p></li></ol></section>
    <section className="curvature-register" id="evidence-register" aria-labelledby="evidence-register-title"><header><small>Evidence register / verification layer</small><h2 id="evidence-register-title">The graph locates.<br/><em>The register qualifies.</em></h2><p>This is where the interface changes jobs: compare each project’s question, reference, and honest current boundary.</p></header><div className="curvature-table-wrap"><table><thead><tr><th>Project</th><th>Question under test</th><th>Reference or protocol</th><th>Current boundary</th><th>Record</th></tr></thead><tbody>{evidenceRegister.map(row=>{const project=projectRecords.find(item=>item.slug===row.slug)!;return <tr key={row.slug} style={{"--project-accent":project.accent} as CSSProperties}><th scope="row"><i /> <span>{project.code}</span>{getWork(project).title}<small>{project.source}</small></th><td>{row.question}</td><td>{row.reference}</td><td>{row.boundary}</td><td><Link href={`/work/${project.slug}`} aria-label={`Open ${getWork(project).title} research record`}><ArrowIcon /></Link></td></tr>})}</tbody></table></div></section>
    <section className="curvature-exit"><small>End of measured surface</small><h2>Topology is orientation.<br/><em>The record is proof.</em></h2><div><Link href="/archive">Enter the research archive <ArrowIcon/></Link><Link href="/prototypes/field-manifold">Return to four systems <ArrowIcon/></Link></div></section>
  </div>;
}

function TensorCoordinates() {
  const [basis,setBasis]=useState<Basis>("domain"); const [active,setActive]=useState(0); const selected=projectRecords[active];
  const connections=projectRecords.map((record,index)=>({record,index,shared:sharedMethods(selected,record)})).filter(item=>item.index!==active&&item.shared.length);
  return <div className="fm-page fm-tensor"><FamilyDock active="tensor-coordinates" /><FamilyHeader dark label="Project tensor / change coordinate basis" />
    <main className="tensor-stage"><section className="tensor-intro"><small>Tᵢⱼ / portfolio coordinates</small><h1>Same work.<br /><em>Different basis.</em></h1><p>Re-project the portfolio to see domain, method, or evidence relationships.</p></section>
      <div className="tensor-bases" role="group" aria-label="Coordinate basis">{(["domain","method","evidence"] as Basis[]).map(item=><button key={item} aria-pressed={basis===item} onClick={()=>setBasis(item)}><span>{item==="domain"?"x₁":item==="method"?"x₂":"x₃"}</span>{item}</button>)}</div>
      <div className="tensor-plane"><span className="tensor-axis tensor-axis--x">{basis==="domain"?"software → physical systems":basis==="method"?"systems → learning":"developing → canonical"}</span><span className="tensor-axis tensor-axis--y">{basis==="domain"?"vision → dynamics":basis==="method"?"empirical → constrained":"private → public"}</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{connections.map(item=>{const a=selected.coordinates[basis],b=item.record.coordinates[basis];return <line key={item.record.slug} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />})}</svg>
        {projectRecords.map((record,index)=>{const [x,y,z]=record.coordinates[basis];return <button key={record.slug} onClick={()=>setActive(index)} onPointerEnter={()=>setActive(index)} className={active===index?"is-active":""} style={{"--x":`${x}%`,"--y":`${y}%`,"--z":z,"--project-accent":record.accent} as CSSProperties}><i /><span>{record.code}</span><strong>{getWork(record).title}</strong></button>})}
      </div>
      <aside className="tensor-record"><span>Selected tensor / {selected.code}</span><h2>{getWork(selected).title}</h2><p>{selected.short}</p><div>{connections.map(item=><p key={item.record.slug}><b>{item.record.code}</b><span>{item.shared.join(" + ")}</span></p>)}</div><Link href={`/work/${selected.slug}`}>Inspect evidence <ArrowIcon /></Link></aside>
      <p className="tensor-disclaimer">Coordinates are navigational abstractions, never research rankings.</p>
    </main>
  </div>;
}

function ProjectSelector({side,value,onChange}:{side:"A"|"B";value:number;onChange:(index:number)=>void}) {
  return <div className={`collider-selector collider-selector--${side.toLowerCase()}`}><span>Input {side}</span>{projectRecords.map((record,index)=><button key={record.slug} aria-pressed={value===index} onClick={()=>onChange(index)}><i style={{background:record.accent}} />{record.code}<strong>{getWork(record).title}</strong></button>)}</div>;
}

function MethodCollider() {
  const [left,setLeft]=useState(0),[right,setRight]=useState(2); const a=projectRecords[left],b=projectRecords[right]; const shared=sharedMethods(a,b),uniqueA=a.methods.filter(m=>!shared.includes(m)),uniqueB=b.methods.filter(m=>!shared.includes(m));
  return <div className="fm-page fm-collider"><FamilyDock active="method-collider" /><FamilyHeader label="Comparative instrument / choose two inputs" />
    <main className="collider-stage"><section className="collider-intro"><small>Interaction amplitude / live comparison</small><h1>Projects meet<br /><em>at methods.</em></h1><p>Choose two bodies of work. Shared methods emerge at the vertex; unique methods keep their original trajectory.</p></section>
      <ProjectSelector side="A" value={left} onChange={setLeft} /><ProjectSelector side="B" value={right} onChange={setRight} />
      <svg className="collider-chamber" viewBox="0 0 1000 600" aria-hidden="true"><defs><filter id="vertex-glow"><feGaussianBlur stdDeviation="12" /></filter></defs><path className="beam beam--a" d="M30 145 C260 145 340 300 500 300" style={{stroke:a.accent}}/><path className="beam beam--b" d="M970 455 C740 455 660 300 500 300" style={{stroke:b.accent}}/><path className="beam beam--out" d="M500 300 C650 300 745 125 970 125"/><circle className="vertex-halo" cx="500" cy="300" r="58" filter="url(#vertex-glow)"/><circle className="vertex" cx="500" cy="300" r="17"/><path className="collision-wave" d="M430 300 q18 -42 36 0t36 0t36 0t36 0"/></svg>
      <div className="collider-label collider-label--a"><span>{a.code}</span><strong>{getWork(a).title}</strong></div><div className="collider-label collider-label--b"><span>{b.code}</span><strong>{getWork(b).title}</strong></div>
      <section className="collision-result"><span>Interaction vertex / {shared.length || "∅"}</span><h2>{shared.length ? shared.join(" + ") : "No exact method overlap"}</h2><div><p><b>{a.code} unique</b>{uniqueA.join(" · ")||"All selected methods overlap"}</p><p><b>{b.code} unique</b>{uniqueB.join(" · ")||"All selected methods overlap"}</p></div><footer><Link href={`/work/${a.slug}`}>Open {a.code} <ArrowIcon /></Link><Link href={`/work/${b.slug}`}>Open {b.code} <ArrowIcon /></Link></footer></section>
      <a className="collider-publication" href={publication.url} target="_blank" rel="noreferrer">Public evidence channel / DOI {publication.doi} <ExternalIcon /></a>
    </main>
  </div>;
}

const renderers:Record<FieldManifoldSlug,()=>React.ReactNode>={"force-fabric":ForceFabric,"curvature-atlas":CurvatureAtlas,"tensor-coordinates":TensorCoordinates,"method-collider":MethodCollider};
export function FieldManifoldExperience({slug}:{slug:FieldManifoldSlug}) { const Render=renderers[slug]; return <Render/>; }

export function FieldManifoldIndex() {
  return <div className="fm-page fm-index"><FamilyDock/><FamilyHeader dark label="Derived from Physics Atlas 02 + 04" />
    <main><p>Field / Manifold studies</p><h1>Real projects.<br/><em>Four research spaces.</em></h1><section>{fieldManifoldDirections.map(direction=><Link key={direction.slug} href={`/prototypes/field-manifold/${direction.slug}`}><span>{direction.index}</span><div><small>{direction.note}</small><h2>{direction.name}</h2></div><b>Enter system <ArrowIcon/></b></Link>)}</section></main>
    <footer><p>Built from six verified portfolio records across local repositories, private GitHub repositories, and one public journal article.</p><Link href="/archive">Open canonical archive <ArrowIcon/></Link></footer>
  </div>;
}
