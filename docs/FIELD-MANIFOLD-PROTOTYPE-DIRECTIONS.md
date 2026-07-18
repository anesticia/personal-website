# Field / Manifold Prototype Directions

These four prototypes combine the directional logic of Physics Atlas 02 (Vector Field) with the curved research space of Physics Atlas 04 (Tensor Manifold). They use the six real projects already represented by the website and verified against their local repositories, GitHub records, or publication page.

## Shared content model

- Reaction–diffusion systems — active PDE research; local + private GitHub; Fourier pseudo-spectral ETDRK4 reference and six-method numerical benchmark.
- ORBIT-PINN — active charged-particle research; local paper/notebook artifacts; rolling windows, hard continuity, Lorentz residuals, and energy invariants across uniform, mirror, and dipole fields.
- Wave propagation with PINNs — active undergraduate thesis; local + private GitHub; PINN/FDTD comparison in homogeneous and heterogeneous media.
- Codex Chess Lab — active software research; local + private GitHub; C++ UCI engine, evidence-led paired gates, platform-complete M5, and open M7 research.
- GeoGuesser Engine — active software research; local + private GitHub; local-first explainable geolocation, FastAPI/SQLite baseline, and licensed manifest-first M4 dataset foundation.
- Object classification through edge features — completed public paper; Sobel/Canny/Roberts + histogram features with Random Forest; JSI 18(1), DOI 10.30864/jsi.v18i1.601.

## 01 — Force Fabric

Visual thesis: a near-black instrument field where every project behaves as a force source, bending a dense vector fabric according to its domain and methods.

Content plan: live project field; selected-project evidence rail; method legend; direct archive link.

Interaction thesis: the pointer perturbs local vector direction; hovering or clicking a source reorients the whole field toward that project; the evidence rail updates without navigation.

## 02 — Curvature Atlas

Visual thesis: a warm, tactile 3D wireframe terrain where project peaks curve a shared research surface instead of appearing as disconnected cards.

Content plan: draggable 3D manifold; concise orientation copy; project index; selected-project evidence panel.

Interaction thesis: drag rotates the terrain; selecting a project recenters visual emphasis; projected height communicates evidence breadth, not performance or quality.

### Refined direction

Visual thesis: an archival topographic instrument made from warm paper, oxide survey marks, and a living wireframe surface; it should feel like a scientific atlas that happens to be computational rather than a 3D demo placed inside a website.

Content plan:

1. full-viewport atlas cover with draggable terrain and immediate project selection;
2. scroll-driven evidence strata where each real project becomes a distinct layer in the same surface;
3. a method cross-section showing which techniques create curvature between projects;
4. a final route into the canonical research archive.

Interaction thesis:

- scrolling through a project stratum selects it and rotates the terrain to a new reading angle;
- direct drag remains available, so the atlas is both narrated and explorable;
- the custom wave scrollbar returns as a visible depth rail whose displacement responds to actual page movement.

### Intent correction

The first refinement made the hero terrain and the scroll-led evidence strata perform the same job: both selected a project and restated its record. The revised prototype removes that duplicate interaction and assigns each surface a distinct decision.

1. The 3D topology answers **where does this work sit, and what is it related to?** Its axes encode method orientation, working context, and artifact scope. Selecting a node reveals the coordinate rationale and traces only exact shared-method ridges.
2. The graph contract answers **how should this abstraction be read?** It names all three axes and explicitly states that the topology contains no quality score.
3. The evidence register answers **what supports the work, and where does the claim stop?** It compares the question under test, reference or protocol, source, and current boundary across all six projects.
4. The second terrain and separate method cross-section were removed because their useful functions now belong to the topology itself.

Interaction thesis:

- drag changes the viewing angle without changing the underlying coordinate model;
- selecting a node changes the rationale and animates signals along exact shared-method ridges;
- the register remains deliberately independent from graph selection so it supports comparison rather than becoming another project selector;
- the custom wave scrollbar remains an atlas-position rail on precise-pointer layouts; mobile keeps its native scrollbar instead of rendering an unusable full-page rail.

## 03 — Tensor Coordinates

Visual thesis: a precise editorial coordinate system that can re-project the same portfolio through domain, method, or evidence bases.

Content plan: basis switcher; animated project constellation; relational legend; selected-project method record.

Interaction thesis: basis changes animate every project to a new position and depth; selecting a node isolates its shared-method connections; keyboard-accessible controls mirror pointer behavior.

## 04 — Method Collider

Visual thesis: a high-energy research instrument where two projects enter from opposite channels and produce an interaction manifold of shared and unique methods.

Content plan: two project selectors; animated collision chamber; overlap readout; links to both full project records.

Interaction thesis: choosing either input changes the beam geometry and intersection result; shared methods appear at the collision vertex while unique methods remain on their original trajectories; the chamber keeps moving without obscuring the comparison.

## Boundaries

- Prototype-only routes; the deployed homepage is unchanged.
- Real project claims only. Abstract coordinates are explicitly interface models, not scientific rankings.
- Native SVG, Canvas 2D projection, and CSS transforms; no heavy 3D dependency.
- Reduced-motion mode removes continuous animation while retaining all project-selection behavior.
- The custom wave scrollbar remains, recolored as a measurement rail for this family.
