# Product Design QA

## Evidence

- Source visual truth: `output/source-research-desktop.png` and `output/source-orbit-desktop.png`
- Rendered implementation: `output/prototype-research-desktop-final.png`, `output/prototype-orbit-desktop-final.png`, `output/prototype-research-mobile-final.png`, and `output/prototype-orbit-mobile-final.png`
- Browser-comment source: five annotated 1564 × 912 captures supplied inline for the active navigation, reading strip, program introduction, charged-particle title, and header geometry
- Browser-comment implementation: `output/research-comments-final-top.png`, `output/research-comments-final-programs.png`, `output/research-comments-final-orbit-entry.png`, and `output/research-comments-final-orbit-detail.png`
- Second browser-comment implementation: `output/qa2-research-transition-desktop.png`, `output/qa2-research-image-desktop.png`, `output/qa2-research-image-mobile.png`, `output/qa2-archive-toolbar-desktop.png`, `output/qa2-archive-toolbar-mobile.png`, `output/qa2-home-closing-desktop.png`, and `output/qa2-home-closing-mobile.png`
- Third browser-comment implementation: `output/qa3-archive-desktop.png`, `output/qa3-about-desktop.png`, `output/qa3-contact-desktop.png`, `output/qa3-archive-mobile.png`, `output/qa3-about-mobile.png`, and `output/qa3-contact-mobile.png`
- Fourth browser-comment implementation: `output/qa4-home-desktop.png`, `output/qa4-home-register-desktop.png`, `output/qa4-about-desktop.png`, `output/qa4-chess-desktop.png`, `output/qa4-reaction-desktop.png`, `output/qa4-home-mobile.png`, `output/qa4-about-mobile.png`, and `output/qa4-reaction-mobile.png`
- Fifth browser-comment implementation: `output/qa5-archive-hover-desktop.png`
- Seventh browser-comment implementation: `output/qa7-home-register-desktop.png`, `output/qa7-home-register-mobile.png`, `output/qa7-home-closing-desktop.png`, `output/qa7-research-transition-desktop.png`, and `output/qa7-research-transition-mobile.png`
- Normalized full-view comparisons: `output/design-qa-research-normalized.png` and `output/design-qa-orbit-normalized.png`
- Focused implementation evidence: `output/prototype-orbit-checkpoint-desktop.png` and `output/prototype-orbit-figure-desktop.png`
- Source capture: 1440 × 1000 CSS pixels at device density 1
- In-app desktop implementation capture: 1280 × 720 CSS pixels at device density 1
- Mobile implementation capture: 390 × 844 CSS pixels at device density 1
- Comparison normalization: the 1440 × 1000 source was proportionally reduced to 1280 px wide and top-cropped to 1280 × 720. The 1280 × 720 implementation was left at native size. The viewport difference is recorded and no pixel-perfect claim is made.
- State: page top for Research and Shared Structure-Preserving Local Flow, plus the charged-particle checkpoint, representative-figure, and open-provenance states

## Full-view comparison

The implementation preserves the source design system rather than replacing it. The paper field, oxide accents, mono research labels, oversized grotesk headings, serif emphasis, fine rules, and scientific-instrument overlays remain consistent. The header is now a straight instrument bar with restrained 10 px corner softening, a quiet active-state tint, and no underline. The Research hero still introduces the field, but the redundant dark reading strip is gone. Its wave field now fades directly into the compact two-column program introduction. The charged-particle work now uses the manuscript-aligned public name `Shared Structure-Preserving Local Flow`, while `ORBIT-PINN V5` remains recorded as the local experiment-series identity.

No P0, P1, or P2 layout, hierarchy, color, image, or copy mismatch remains in the normalized comparisons.

## Focused comparison

- Typography: the existing display, serif, body, and mono roles are retained. Long technical claims wrap without collision at desktop and 390 px portrait widths. Small labels remain legible and are not used for primary reading copy.
- Spacing and layout rhythm: the hero keeps its editorial breathing room, while the program introduction no longer spends a full viewport on sparse copy. Dossier sections switch to a measured reading column, rule-based grids, and a sticky chapter rail. Desktop and mobile checks report zero horizontal overflow.
- Colors and visual tokens: the implementation reuses the atlas paper, ink, dark, oxide, coral, muted, and rule tokens. Project accents are limited to state, coordinate, and evidence cues.
- Image quality and asset fidelity: all added figures are optimized derivatives of current local research artifacts. The hero crop is an intentional teaser. Full figures reappear later with `object-fit: contain`, captions, and their complete scientific context. The first ORBIT representative figure loaded at 870 × 375 natural pixels in the in-app browser.
- Copy and content: status, metrics, failure modes, reproducibility facts, and next gates are sourced from the current evidence audit. The latest notebook still identifies itself as `ORBIT-PINN V5`, while the active manuscript title is `A Shared Structure-Preserving Network for Multi-Field Charged-Particle Dynamics`; the UI now keeps those identities distinct. Pure-neural, fallback, incomplete, failed, draft, thesis, and publication states remain distinct.
- Interaction and accessibility: chapter anchors update `aria-current`, the provenance register expands semantically, the archive retains search and filters, and mobile navigation remains usable. The chapter navigation received an explicit accessible name after automated QA found it missing.

## Findings

- No actionable P0, P1, or P2 design findings remain.
- P3: the wide scientific figure in the ORBIT hero is deliberately cropped on desktop and portrait. This is acceptable because the hero is an orientation surface and the complete figure is available in the Representative figures chapter.

## Comparison history

### Pass 1

- Compared the existing Research and ORBIT-PINN source captures with the rendered implementation.
- No visual P0, P1, or P2 mismatch was found.
- Automated interaction QA found that the visible chapter rail's inner `nav` lacked an explicit accessible name. Added `aria-label="Research dossier chapters"` and reran both affected tests.
- Post-fix evidence: the complete-dossier test and chapter-navigation/provenance test both pass.

### Pass 2 · browser comments

- Removed the inherited navigation underline and the custom wavy SVG geometry. The final header has a measured 64 px desktop height, zero border radius, and no generated active-link line.
- Removed the standalone `How to read this field` strip because its four labels repeated information already present in every dossier row.
- Rebuilt the Research Programs introduction as a tighter two-column composition. At 1564 × 912 it shows the section statement, evidence-boundary copy, divider, and the start of dossier 01 in one viewport.
- Verified naming against local sources. `New/ORBIT-PINN_Full_v5.ipynb` still says `ORBIT-PINN V5` and `CONFLICT-AWARE STRUCTURE-PRESERVING SHARED LOCAL FLOW`; the active manuscript uses `A Shared Structure-Preserving Network for Multi-Field Charged-Particle Dynamics`. The public UI therefore uses `Shared Structure-Preserving Local Flow`, with the experiment-series name retained in the reproducibility record.
- Rechecked the exact annotated desktop viewport in the in-app browser and a 390 × 844 emulated viewport. The mobile DOM reports no horizontal overflow, a 360 px header inside the 380 px layout viewport, no reading-strip node, no wave-geometry node, and no generated active-link underline.
- Post-fix automation: typecheck, lint, production build, 12 security tests, and all 21 UI tests pass.

### Pass 3 · composition and redundancy comments

- Replaced the hard Research hero-to-index boundary with a paper-toned field fade and removed the one-pixel section seam. At 1564 × 912 the hero and program grid meet at the same coordinate with no spacer or intervening band.
- Scoped full-image treatment to the Shared Structure-Preserving Local Flow architecture only. The slot follows the source figure's wide ratio and uses `object-fit: contain`; measured source pixels are 688 × 297, and the figure remains complete at both 1564 × 912 and 390 × 844. Other research images retain their original editorial crop.
- Moved the archive result count into the search and filter toolbar. On portrait it remains a single compact row with the five filters fully visible, 340 px content width, 340 px scroll width, and zero document overflow.
- Removed the duplicate `Research records` header link. `/archive` now has exactly one header destination, the numbered Archive navigation item. The straight header geometry remains and receives a 10 px radius to soften its edges.
- Removed the sparse `Model. Measure. Revise.` home section. The publication record now hands directly to the conversation section with a measured zero-pixel structural gap and no orphaned empty viewport.
- Exact desktop visual inspection was performed at 1564 × 912. Portrait inspection was performed at 390 × 844. The in-app browser reported zero console errors in the final session.
- Post-fix automation: typecheck, lint, webpack production build, 12 security tests, and all 22 UI tests pass. After the final portrait filter refinement, the four affected UI checks passed again.

### Pass 4 · archive, about, and contact comments

- Removed italic shaping from the Archive hero emphasis so `open questions` keeps the serif contrast without the distorted italic `p` and `i` forms.
- Replaced the empty half of the Archive hero with a six-record index sourced from the real work data. Each row exposes the record title, current status, and a direct dossier link. The generic `How to read the archive` block was removed, and the search toolbar now follows the hero directly.
- Replaced the About screenshot with the existing live Gray-Scott solver. The browser selected WebGL2, rendered a 360 × 288 desktop field, continued updating while visible, and registered pointer interaction. The portrait layout renders the same simulation at a stable 280 × 224 internal grid with touch scrolling preserved outside deliberate interaction.
- Rewrote the About position copy as two short, factual paragraphs and removed the slogan-like blockquote.
- Reduced Contact to its actual job: a short introduction and one message form. The unrelated prompt-writing aside was removed, while the only relevant delivery detail now sits beside the form as `Your email is only used to reply.`
- Exact desktop visual inspection was performed at 1564 × 912. Portrait inspection was performed at 390 × 844. All three routes report zero horizontal overflow, and the in-app browser reports zero warnings or errors in the final About preview.
- Post-fix automation: typecheck, lint, default Turbopack production build with all 46 pages generated, 12 security tests, and all 23 UI tests pass.

### Pass 5 · dossier density and home-label comments

- Reduced the About simulation overlay from a large serif instruction block to one 29 px-high mono readout. The interaction and exact Gray-Scott parameters remain visible without competing with the live field.
- Reworked the shared dossier orientation instead of patching individual records. At 1564 × 912 all four retained hero regions measure 601–644 px high, with zero horizontal overflow. Copy, image, ledger, and diagnostic surfaces stay equal-height.
- Replaced the Reaction-diffusion hero image with an interactive long-horizon RMSE trace based on the four recorded checkpoints: t=200, 1500, 4500, and 9000. The visualization marks the mid-horizon break, supports pointer and button selection, and changes the visible readout to the selected recorded value. It is a diagnostic plot, not a reuse of the live Gray-Scott field on About.
- Removed the six explanatory axis-end labels from the topology surface. The graph, project selector, inspector, and drag instruction remain, while the dedicated Graph contract below continues to explain the three-axis model once.
- Removed the entire Latest research status strip. Its three links duplicated project status and next-gate information already available in the topology inspector and dossier register.
- Kept `The graph locates.` and `The register qualifies.` as two complete desktop lines. Each phrase is now a no-wrap line at the annotated viewport, with normal wrapping restored for portrait layouts.
- Portrait checks at 390 × 844 cover Home, About, Reaction-diffusion, and a ledger dossier. All report zero horizontal overflow; the diagnostic canvas renders at 340 × 260 CSS-independent pixels and remains interactive.
- Post-fix automation: typecheck, lint, default Turbopack production build with all 46 pages generated, 12 security tests, and all 25 UI tests pass.

### Pass 6 · archive row hover contrast

- Fixed the Archive row hover stacking context. The dark sliding surface previously used `z-index: -1` without a local stacking context, so it could fall behind the paper section after reveal transitions while the text still changed to the light hover color.
- Each Archive row now creates an isolated stacking context. The hover surface remains behind the row content but above the page background, keeping the existing dark interaction and restoring readable contrast for the title, summary, metadata, and index.
- At 1564 × 912 the final hover state computes to light text `rgb(235, 229, 213)` over the dark surface `rgb(29, 23, 19)`, with the surface transform fully settled. The full 26-test UI suite passes after the regression check was added.

### Pass 7 · editorial simplification

- Removed the entire `Graph contract` section from Home. The topology hero now hands directly to the evidence register, so the page no longer pauses to explain the same axes a second time.
- Removed the `Evidence register`, `Next coordinate`, and dated Research hero kicker labels while retaining the headings and actions that carry actual meaning.
- Removed the complete Research Programs introduction instead of replacing it with new filler. The first dossier now starts directly after the interactive hero with a compact 38–60 px section inset.
- Added structural regression checks for the removed nodes and for the new direct-sibling transitions. The shared desktop and portrait layouts report zero horizontal overflow.
- Exact desktop inspection was performed at 1564 × 912 and portrait inspection at 390 × 844. The final Research preview reports zero browser warnings or errors.
- Post-fix automation: typecheck, lint, default Turbopack production build with all 46 pages generated, 12 security tests, and all 26 UI tests pass.

## Primary interactions tested

- All four research dossier routes render with the expected chapter, metric, limitation, manifest, and next-gate structures.
- Sticky chapter links navigate to the correct section and update the active location.
- The representative-figure lazy load completes after navigation.
- The provenance register opens and exposes its evidence sources.
- Research program, research-engineering, and publication shelves render together.
- Archive search and filters, site navigation, contact behavior, metadata routes, topology, wave field, and legacy prototype routes remain covered by the existing browser suite.
- In-app browser console: zero errors in the final desktop and mobile QA sessions.

## Residual test gaps

- The original full-prototype source set uses 1440 × 1000, while the browser-comment pass was rechecked at the exact supplied 1564 × 912 and 390 × 844 viewports.
- An earlier pass encountered transient external Google Fonts download failures under Turbopack and used the webpack production path. The current final pass completed the default Turbopack production build, typechecked, and generated all 46 pages successfully. This does not establish that the external font endpoint will always be reachable.
- No deployment or production URL was tested because publishing was not requested.

final result: passed
