# 10 — Wardley Maps

**pack** Map Your Case · draft-1 · 21 August 2026
**role** Four maps of the tool: where its novelty actually sits, why the code is the cheap part, which component the whole instrument's credibility hangs from, and what v3 moves. Drawn in mermaid's `wardley-beta`, so the maps live in the source and are correctable in a pull request.

---

## How to read these

Y is visibility (top = the visitor touches it; bottom = plumbing). X is evolution (Genesis → Custom Built → Product → Commodity). An `evolve` arrow is where this pack expects a component to move, not where it is. Positions are judgements, stated to be disputed; the thinnest ones are named under each map. The `wardley-beta` grammar notes from the registry pack's document 09 apply unchanged (no bare numbers or `.,/&'` in component names; `label` before `inertia`).

## M1 — The visitor's need

**User need:** knowing what my agent can actually reach — and what I never authorised.

```mermaid
wardley-beta
title M1 — What the answer stands on
anchor Visitor [0.97, 0.30]
component The delta named [0.90, 0.22] label [-40, -14]
component Chokepoint sentence [0.82, 0.28] label [12, 16]
component Scene and graph views [0.76, 0.44] label [12, 16]
component Gap computation [0.66, 0.38] label [-60, -14]
component Grant trees [0.56, 0.30] label [-46, -14]
component Library curation [0.46, 0.18] label [-64, -14]
component Surface architecture facts [0.40, 0.52] label [12, 16]
component Web components [0.26, 0.72] label [-64, 18]
component Browser storage [0.18, 0.88] label [-70, 18]
component Static hosting [0.08, 0.92] label [-60, 18]
Visitor->The delta named
The delta named->Chokepoint sentence
The delta named->Scene and graph views
Chokepoint sentence->Gap computation
Scene and graph views->Gap computation
Gap computation->Grant trees
Grant trees->Library curation
Grant trees->Surface architecture facts
Scene and graph views->Web components
Web components->Browser storage
Web components->Static hosting
evolve Library curation 0.44
```

**The claim.** Everything below the middle is commodity or product: browser storage, static hosting, hand-rolled SVG over web platform APIs. The model's computation is custom-built but *settled* custom — weakest-link over a DAG is not research. **The novelty is exactly two components: the library curation (what claims go in, with what evidence, dated how) and the delta framing at the top (three sets, chokepoint-not-score).** The code between them is the cheap part, which is why v1 could be rebuilt as v2 in a day once the framing corrections landed.

**Thinnest position:** library curation at genesis-custom boundary. If a public, maintained, evidence-classed library of agent-surface grant trees existed anywhere else, this component would be product-shaped and the right move would be adoption. None is known to exist; that absence is checkable and dated 21 August 2026.

## M2 — The honesty chain

**User need:** a sceptical reader deciding whether to believe the page.

```mermaid
wardley-beta
title M2 — What a checkable claim stands on
anchor Sceptical reader [0.97, 0.30]
component A checkable claim [0.88, 0.26] label [-52, -14]
component Evidence classes [0.76, 0.34] label [12, 16]
component Rerun methods [0.68, 0.26] label [-58, -14]
component Per node dating [0.58, 0.12] label [12, -8]
component Published audit tooling [0.48, 0.62] label [12, 16]
component Network panel check [0.36, 0.82] label [12, 16]
component Same origin rule [0.26, 0.68] label [-64, 18]
component Raw library rendering [0.44, 0.40] label [-84, 18]
Sceptical reader->A checkable claim
A checkable claim->Evidence classes
A checkable claim->Rerun methods
A checkable claim->Raw library rendering
Evidence classes->Per node dating
Rerun methods->Published audit tooling
A checkable claim->Network panel check
Network panel check->Same origin rule
evolve Per node dating 0.38
```

**The claim.** The tool's differentiation is not its code — it is this chain: every claim carries its evidence class, names its re-run method, and renders its own raw source. Most of the chain is already product or commodity (the network panel, published audit tools, a JSON file rendered raw). **The one genesis component is per-node dating** — the library is dated as a whole at v2, which is quietly wrong while looking current — and the whole chain's credibility hangs from its least-evolved link, the same weakest-link rule the model applies to the visitor's paths. The evolve arrow is MC3 in change control: v3 moves it or the chain stays honest only in bulk.

## M3 — The testing programmes

**User need:** knowing a page works before spending the only humans available.

```mermaid
wardley-beta
title M3 — Defects are cheap and preferences are scarce
anchor Design decision [0.97, 0.30]
component Preference judgement [0.88, 0.20] label [-80, -14]
component Defect detection [0.80, 0.40] label [12, 16]
component Recruited humans [0.72, 0.14] label [-66, 18]
component Synthetic reader runs [0.64, 0.36] label [12, 16]
component Calibration record [0.54, 0.10] label [12, -8]
component Archetype property lists [0.48, 0.28] label [12, 16]
component Exogenous budgets [0.42, 0.34] label [-76, 18]
component Fixed mockups [0.36, 0.48] label [12, 16]
component Browser automation service [0.22, 0.72] label [-100, 18]
Design decision->Preference judgement
Design decision->Defect detection
Preference judgement->Recruited humans
Defect detection->Synthetic reader runs
Synthetic reader runs->Archetype property lists
Synthetic reader runs->Exogenous budgets
Synthetic reader runs->Fixed mockups
Synthetic reader runs->Browser automation service
Preference judgement->Calibration record
evolve Calibration record 0.32
evolve Archetype property lists 0.44
```

**The claim.** The two needs split exactly as document 08 says: defect detection stands on components that are custom-to-product (runs, budgets, mockups, an existing automation service — a caller, not a build), while preference judgement stands on the scarcest component on the map, recruited humans. **The map's finding is the calibration record at deep genesis**: it is the least interesting thing to build and the only thing that makes synthetic output falsifiable — every other component can be excellent and the programme still unfalsifiable without it. Cheap detection first, scarce humans second, is the map's ordering as much as the brief's.

## M4 — The advanced user

**User need:** the reader with the largest grant discovering the one set they cannot defend.

```mermaid
wardley-beta
title M4 — The third set is the product
anchor Advanced user [0.97, 0.30]
component Why does it have that [0.88, 0.16] label [-40, -14]
component Three sets rendered [0.78, 0.30] label [12, 16]
component Level one landing [0.70, 0.24] label [-70, -14]
component Exercised set [0.58, 0.16] label [12, -8]
component Mandated set [0.54, 0.40] label [12, 16]
component Held set [0.50, 0.28] label [-40, 18]
component Session transcript [0.36, 0.56] label [12, 16]
component Grant trees [0.30, 0.34] label [-46, 18]
Advanced user->Why does it have that
Why does it have that->Three sets rendered
Three sets rendered->Level one landing
Three sets rendered->Exercised set
Three sets rendered->Mandated set
Three sets rendered->Held set
Exercised set->Session transcript
Held set->Grant trees
Mandated set->Grant trees
evolve Exercised set 0.40
```

**The claim.** The component the whole reframing turns on — the exercised set — sits at genesis not because deriving it is hard (a transcript is an ordinary file) but because **getting it into a page that stores nothing is an unsettled design problem** (MC-D7). Until it evolves, the three-sets dashboard runs on the visitor's claims, which the map shows as the weaker dependency path. The level-one landing is deliberately positioned custom-built rather than genesis: writing it is hard, but what it must contain is fully specified by the stopping rule.

## What the maps agree on

Read together: **this tool's scarce components are all editorial, none mechanical** — library curation, per-node dating, the calibration record, level one's prose, the archetype property lists. Every mechanical component is product or commodity already. That is the inverse of how the work feels day to day (the code is where the hours go), and it is the pack's strongest argument for documents-before-code in the v3 build order: the genesis components are written, not programmed.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
