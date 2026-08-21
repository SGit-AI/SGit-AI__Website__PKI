# 05 — Workflows And User Stories

**pack** Map Your Case · draft-1 · 21 August 2026
**role** Who gets what, and how we know it works: five users, twenty stories with tests that can fail, seven workflows, and the feature table with an honest status column.

---

## The users

| User | Who they are | What they get |
|---|---|---|
| **The visitor** | A person at one of the five grant positions (document 00) who has used an agent and does not know what it can reach | A dashboard naming their delta, a picture they recognise, and something they can do |
| **The librarian** | Whoever curates `library.json` | A reviewable data file whose every claim carries tier, evidence and a re-run method |
| **The sharer & recipient** | A visitor passing their case to a colleague, and the colleague | A link whose fragment holds identifiers only — nothing personal by construction (document 09) |
| **The run operator** | Whoever runs the synthetic-reader tabletop (document 08) | Fixed artefacts, exogenous budgets, and a publishable run record |
| **The site agent** | The session maintaining the tool | Pure functions with tests, one state owner, and this pack |

The visitor is five positions, not five personas — the levels brief settles that the scenarios fall out of grant-size ordering rather than needing to be invented. And the acceptor is deliberately **nobody**: this page has no risk acceptance (P7), so no user of this tool is ever asked to sign anything.

## The stories

Each story carries a test that **can fail** — a story whose acceptance criterion cannot come out negative is a description wearing a story's clothes (registry pack, document 10). Tags name the defining document and the shipped status.

### The visitor

- **V1** — I pick the product I actually installed, by name, and the tool knows its surface. *Test: every product in the picker exists in the library with a surface; picking one renders that surface's tree.* `[02 · shipped]`
- **V2** — Before I answer anything, the dashboard already shows the architectural truth of my pick, marked unverified. *Test: with all facts untouched, every gated node renders with the `?` marker; wording is "not established either way".* `[03 · shipped]`
- **V3** — Answering "no" to a fact question visibly shrinks the tree. *Test: set `creds=no`; the credential node and its dependants leave both views and the excess list.* `[03 · shipped]`
- **V4** — I say what I meant to authorise, and the page shows the delta both ways. *Test: an intended-but-unreachable capability appears as shortfall; reachable-but-unintended as excess.* `[03 · shipped]`
- **V5** — The dashboard tells me how many problems I actually have. *Test: with the solo-dev example, the chokepoint sentence renders "one node is the weakest link on N of M" with N/M from the model, not prose.* `[03 · shipped]`
- **V6** — I can see why a "restriction" doesn't restrict. *Test: the escalation edge renders dashed with its `why` available on click; ticking the container control removes it.* `[02/03 · shipped]`
- **V7** — Ticking a control shows what it closes **for me**. *Test: control effect lists differ between the solo-dev and hosted-only examples.* `[03 · shipped]`
- **V8** — Nothing I do produces a request to anybody's server. *Test: network panel after a full pass shows same-origin only.* `[01 · shipped, re-run each release]`
- **V9** — I can load a case like mine and edit away from it. *Test: each example loads a complete valid state; every edit re-renders.* `[02 · shipped]`
- **V10** — When my case is hosted-only, the page ends on a request, not a remedy. *Test: hosted-only example's final rendered block is the request copy; no control promises containment.* `[01 · shipped]`
- **V11** — I can hand my case to a colleague without describing my machine. *Test: the share artefact decodes to library identifiers and answers only.* `[09 · designed]`
- **V12** — I see three sets, not two: mandated, exercised, held-and-never-used. *Test: given an exercised set, the dashboard renders the third set distinctly and first-class.* `[07 · designed — gated on the import question, MC-D7]`

### The librarian

- **L1** — Every claim I add must state its tier, evidence and detail. *Test: a node missing any of the three fails the library check.* `[02 · shipped as convention; check scripted in v3]`
- **L2** — I can see any change as a picture before shipping it. *Test: library.html renders the edited node, clickable, with raw JSON highlighted.* `[04 · shipped]`
- **L3** — A fact-id rename is caught as the breaking change it is. *Test: stored-state and share-link compatibility check fails on rename.* `[02 · designed]`

### The sharer and recipient

- **S1** — The link I send contains choices only. *Test: decode the fragment; every token is a library identifier or vocabulary answer.* `[09 · designed]`
- **S2** — The recipient reconstructs my view from public material. *Test: opening the link with empty storage renders the same dashboard.* `[09 · designed]`
- **S3** — A library-version mismatch is said, not silently absorbed. *Test: a link pinned to an older library version renders the notice.* `[09 · designed — open decision]`

### The run operator

- **R1** — My persona agent receives pixels and nothing else. *Test: the render channel's transcript contains no page text, structure or purpose statement.* `[08 · designed]`
- **R2** — Abandonment is an event: the budget ran out before comprehension. *Test: every run record shows budgets fixed before the run and spend per screen/click.* `[08 · designed]`
- **R3** — Nothing from a run can be quoted as a real user. *Test: any fragment of the published record carries the simulation marker (rule one).* `[08 · designed]`

## The workflows

1. **First visit** — dashboard first: the page opens on what it can already say (nothing yet, honestly) and the examples; the steps follow. The v1 ordering — read a privacy essay, then work, then see — is recorded as a defect in document 12.
2. **Map my case** — pick products → answer only the facts that apply → state intent → read the delta and the chokepoint sentence.
3. **Interrogate** — click any capability for its evidence pack: paths, weakest evidence, re-run method; click any node for its detail prose.
4. **Try a control** — tick what is already true; read what it closes and strengthens, computed.
5. **Explore the library** — the explorer page, for the visitor who wants to argue with a row (and the librarian who must).
6. **Share** *(v3)* — mint a fragment link; the recipient reconstructs from the public library (document 09).
7. **Test a page before building it** *(v3)* — author the fixed mockup, set budgets, run the tabletop, publish the run including failures (documents 08, 11).

## The features, with the honest column

| # | Feature | Doc | Status |
|---|---|---|---|
| F1 | Named-product picker, four surfaces | 02 | **Shipped (v2)** |
| F2 | Fact questions with `requires` chains, unsure-means-present | 02/03 | **Shipped (v2)** |
| F3 | Scene view + graph view, one toggle | 04 | **Shipped (v2)** |
| F4 | Escalation edges with plain-language why | 02 | **Shipped (v2)** |
| F5 | Chokepoint sentence | 03 | **Shipped (v2)** |
| F6 | Computed control effects, honest effort labels | 02/03 | **Shipped (v2)** |
| F7 | Evidence packs with re-run methods | 02 | **Shipped (v2)** |
| F8 | Examples, prefilled | 02 | **Shipped (v2)** |
| F9 | Library explorer (graph + raw JSON) | 04 | **Shipped (v2)** |
| F10 | Copy-summary from library labels | 04 | **Shipped (v2)** |
| F11 | Fragment share links | 09 | Designed |
| F12 | Level-one landing + five scenarios | 07 | Designed |
| F13 | The three sets (exercised-set import) | 07 | Designed — **gated on an open decision** |
| F14 | Synthetic-reader tabletop harness | 08 | Designed |
| F15 | Variant rounds (qualitative) | 07 | Designed |
| F16 | Library entry checker (L1/L3 as scripts) | 02 | Designed |

The honest reading of the column: **the instrument is built; the programmes around it are not.** That is the inverse of the registry pack's column, and this pack exists partly because hindsight is cheaper captured than reconstructed.

## What this pack does not deliver

Risk acceptance, machine scanning, any backend, visitor telemetry, a score, A/B statistics at qualitative sample sizes, or a preferences verdict from synthetic readers. Each refusal is a principle in document 01 with its reason; the list is repeated here flat so a reviewer can disagree with it in one place.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
