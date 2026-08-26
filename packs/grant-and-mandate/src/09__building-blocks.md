# The Building Blocks: Badges, Cards, Blocks And Visualisations For Grant And Mandate — And The One Rule That Makes A Tier Badge Honest

**version** draft-1 (site-agent, standing in for the brief the project lead called #3 — derived from the two v0.33.62 dev briefs, the estate's existing badge material, and what this pack's own build found)
**date** 26 August 2026
**from** The site agent
**to** Project lead, the RiskMandate team, Design, Engineering

**type** Dev brief — the user-facing primitives

*The two 26 August briefs ask for design mockups and name the six screens they must cover. This document does the layer underneath: the **reusable primitives** those screens are assembled from, specified as components with rendering rules rather than drawn as pictures — because a mockup is thrown away and a block is used. Everything here is constrained by three things already settled: the badge vocabulary the register published, the rendering rules an outside session found by building it, and the three findings this pack's own build produced. Limitation: these blocks render real documents (the two library entries and the signed mandate) rather than invented data, which is the point — and they have therefore been exercised against exactly two environments and one mandate.*

---

## What This Is, And What It Refuses To Be

Nine primitives. Each one is a **rendering of a field that already exists in a document** — never a new fact, never a computed opinion, never a number that averages things that must stay distinct. The pack's rule that *the agent's output is a document and the interface renders it* applies here without exception: if a block needs data no schema carries, the block is wrong, not the schema.

**It refuses to be a mockup set.** Document 05 already writes the six screens out as intended output. What was missing was the vocabulary those screens spend — and the estate has now proved twice that wording specified without rendering rules gets collapsed the moment it meets a viewport (registry pack C27–C30).

## Do This First: What Already Exists

The inventory instruction both source briefs open with, applied to the interface layer.

| Already published | What it settles | Where |
|---|---|---|
| **The verification badge** — six fields, five result states, `nobody` as a first-class value for *verifiable-by* | The **registry-side** primitive: every edge is a claim by somebody about somebody | registry pack doc 08 |
| **Rendering rules C27–C30** | Colour alone re-collapses the five states; the badge's wrap point can produce the exact misreading it prevents; `nobody` and `not-yet` must not share a rendering; a column of ticks is a page-level tick | registry pack doc 15 |
| **The six screens** | Where these blocks get spent, and that screen four is the trap | this pack, doc 05 |
| **The tier and evidence vocabularies** | `boundary / setting / expectation` and `observed / read / documented / inferred / none` | this pack, docs 01–02 |
| **Two measured entries and a signed mandate** | **Real data to render**, so none of this is drawn against fiction | this pack, doc 08 |

**So this document adds one family and inherits the other.** The verification badge stays exactly as published; the **grant-side** primitives — tier, evidence, freshness — are what did not exist, and they are where the build's findings land.

## The Rule That Makes A Tier Badge Honest

The single most important thing in this document, and it came from the build rather than from design.

Library entry #2 labelled the OS user separation a `boundary`, and the very next node recorded passwordless escalation succeeding. The label was wrong because the tool decided it **in isolation** ([GM16](99__change-control.md)). The correction (GM-D29) is a rule about data, and it has a hard consequence for rendering:

> **A tier is a property of a node's relationship to the tree, not of the node. So a tier badge must be able to show what defeats it — and a defeated control must never render as a boundary.**

Which yields the one absolute rendering rule of this family:

```
   A control whose defeat path exists in the same tree renders as
   SETTING, with the defeat path reachable from the badge itself.

   ✔  ⛨ setting     defeated by → n1a "escalate to administrator"
   ✘  ⛨ boundary    (with the escalation drawn somewhere else on the page)
```

This is the register's own **"escalation is an edge, not an annotation"** finding (registry pack C25) arriving one layer down. Drawing the path is what makes the `setting` tier land; hiding it is how a measurement tool, a vendor datasheet and an interface all independently produce the same lie.

## The Nine Blocks

### 1 · Tier badge — the grant-side atom

Five states, and the three-channel rule from C27 applies unchanged: **never fewer than two channels, and the word is always one of them.**

| State | Means | Rendering |
|---|---|---|
| `boundary` | Enforced by something the grant does **not** include | Solid border, accent. The only state that may look settled |
| `setting` | Enforced by the tool, **inside** the grant | **Dashed** border, warm. Dashes are the second channel |
| `expectation` | Nothing enforces it; it is written down | **Dotted** border, red |
| `none` | No control at all | Plain, dim — an absence, stated |
| `unknown` | Not established by the measurement | Dashed, grey, **and never blank** — a gap is a fact about the floor |

**Absolute rules.** A defeated control never renders `boundary` (above). `unknown` is never rendered as absence. And a tier badge **always carries its evidence badge and its date** — a tier with no provenance is an assertion, which is the thing the grant document exists to stop being.

### 2 · Evidence badge — how the fact was got

`observed · read · documented · inferred · none`. Rendered small and secondary to the tier, because it modifies the tier's weight rather than competing with it. `inferred` and `none` get a visibly weaker treatment: **the four are not equally trustworthy and the interface must not flatten them.**

### 3 · Freshness chip — per node, never per tree

A date, and a staleness state after a stated interval. **Per node, because a tree dated as a whole is wrong in one place while looking current** (registry pack C16). A stale chip does not turn the tier red — staleness is a fact about the *measurement*, not about the control, and conflating them is how a re-measure gets read as a regression.

### 4 · Grant node card

One node of the tree: capability, what it reaches, its tier badge (with defeat path if any), mechanism or `nothing`, evidence badge, freshness chip. **The `reaches` line is the one that does the work** — a list of what is reachable without what stands in the way is the part people already have and the part that misleads.

### 5 · Mandate card

Issuer, subject, interval, and the prohibitions. Three rules, all inherited and all load-bearing:

- **Prohibitions shown, allow-list stored and not displayed.** Screen four's trap: an allow-list presented for approval produces consent without comprehension.
- **The rendering carries its own date and capability-set version**, because it goes stale the moment the capability set grows, and a regenerated view must not retroactively change what was agreed.
- **The interval is rendered as time remaining, not just as a date.** A mandate with no interval is not a mandate; one that expires next week should look different from one that expires in October.

### 6 · Authority/enforcement split indicator — new, and this pack's own finding

[GM14](99__change-control.md): the mandate that refused a real push is signed by a **fixture** root. So *the enforcement is real and the authority is not*, and **the two halves are independent**. Every mandate card therefore carries **two** indicators, never one:

```
   ENFORCEMENT   ● real      a hook git runs, refuses by exit code
   AUTHORITY     ○ fixture   issuer's private half is published —
                             anybody could forge this mandate
```

A single combined status would have to average them, and averaging them is exactly how a demonstration gets mistaken for a control. **This is the first block in the family that exists because building the thing taught us something the design did not know.**

### 7 · Delta block — excess and shortfall, side by side

The product. Excess (security) and shortfall (operations) **side by side, never stacked**, because they have different audiences and different remedies. Each excess row carries **the tier of the capability it names** — an excess capability behind a `boundary` is a different finding from one behind nothing. **No score, ever**: any single number averages tiers that must stay distinct.

### 8 · Three-term comparison block

Library, self-report, mandate — three columns, two deltas drawn between them, and the blind-spot count as the headline: *reported 11 of 19*. The most persuasive thing in the flow, and it **measures the agent as much as the environment**, so it renders as *how much of its own grant this agent found against a common reference* — never as a league table.

### 9 · Grant tree visualisation

The nodes as a **graph**, not a list, because the interesting relationships are containment ones and **blast radius is a path, not an item**. Two requirements the list form cannot meet: **escalation edges are drawn** (block 1's rule, at tree scale), and the **worst path is highlighted** rather than left for the reader to trace. On a narrow viewport the tree degrades to the worst path plus a count of what was collapsed — never to an unordered list, which loses the only thing the graph was for.

## Cross-Cutting Rules

Six, and every one of them is a rule somebody already broke:

| Rule | Because |
|---|---|
| **Two channels minimum, the word always one** | Colour alone re-collapses five states into two for a substantial fraction of readers (C27) |
| **No page-level verdict** | Pages do not have standing; edges do. A column of ticks assembles one anyway, so a group of blocks must keep each row's method visible (C28) |
| **No score out of a hundred** | It averages `boundary`, `unknown` and `none` into one figure — the collapse the whole vocabulary exists to prevent |
| **`unknown` renders as `unknown`** | The gaps are part of the map; a blank reads as a to-do |
| **Every block names its source document and date** | A block is a rendering of a field. If it cannot say which field, it is inventing one |
| **The fixture flag is read before anything else** | A fixture's signatures verify and prove nothing; a block that renders a fixture as confirmed is wrong while looking right |

## How These Ship

**As a stylesheet and a rendered gallery, not as images.** `assets/gm-blocks.css` is the component layer, usable by this site and by RiskMandate; [the gallery](../blocks.html) renders **the actual documents** — both library entries and the signed mandate — so the blocks are exercised against real data on every build, and a schema change that breaks a block is visible immediately rather than at integration.

That is also the honest constraint: they have been exercised against **two environments and one mandate**, all measured by one agent. The blocks are specified for a population they have not met.

## Honest Tensions

| Tension | Note |
|---|---|
| Rendering real documents | It stops the gallery being fiction, and it means the blocks are shaped by two entries — a third environment may not fit |
| The defeat-path rule | It is the most valuable rule here and it makes the badge depend on the whole tree, so a block can no longer be rendered from one node in isolation |
| Two indicators for authority and enforcement | Honest and harder to read at a glance than one; anybody optimising the interface will try to merge them, and merging them is the failure |
| Blocks before a population | Specified against two environments and one mandate. The registry pack's own warning about mockups without a population applies here with less excuse, since real data was available |
| A stylesheet as the deliverable | It is reusable and it commits the estate to a component contract that a second consumer will find constraining |

## Open Questions

| Question | Notes |
|---|---|
| Does RiskMandate consume this stylesheet, or fork it? | Consuming binds two products to one contract; forking guarantees they drift. The instance/library split says consume |
| What is the staleness interval for a freshness chip? | It is per-vendor — a claim about somebody else's product ages on their release schedule |
| How does the tree degrade below 390px? | Worst path plus a collapse count is proposed here and has not been tested on anybody |
| Does a defeated `boundary` keep any trace of the original label? | The library entry keeps it under `SUPERSEDED_BY`; whether the interface should show it, or only the corrected tier, is undecided |
| Who owns the blocks once two sites use them? | A shared component layer with no owner drifts into two |

---

*Ninth document of the pack, and the one the project lead asked to be derived from the two v0.33.62 briefs rather than supplied. Nothing above documents 00–08 was rewritten; the change-control appendix records what this settles.*

*CC BY 4.0.*
