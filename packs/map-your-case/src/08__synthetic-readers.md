# 08 — Synthetic Readers

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The tabletop programme, operationalised from the v0.33.61 screenshot-boundary brief: two agents, a boundary that is the instrument, budgets set from outside the model, and the two rules that keep the whole thing publishable. Also the honest limit — defects, never preferences — and the line the part-two service must be built around.

---

## The shape of a run

Two agents, strictly separated:

- **The renderer** — a caller of the estate's existing browser-automation service: navigates to the page under test, takes screenshots, executes click instructions. Nothing to build here beyond configuration — and one configuration decision that is the whole exercise: the service can also extract page text and structure, and **the renderer must be configured never to pass any of that on.**
- **The reader** — an archetype (never a portrait — below) that receives **pixels and nothing else**, answers a fixed comprehension question at each stop, and issues click instructions **spatially**.

The rule, written down before the first run:

> **The persona agent receives pixels and nothing else.** No page text, no structure, no source, no accessibility tree, no filenames, no knowledge of what the page was trying to achieve.

**The boundary is the instrument, not a limitation of it** — and somebody will try to improve it away. An agent given the page's text reads it perfectly: no scanning, no missed heading, no misjudged hierarchy. It would understand the page better than any human could, and every finding would be optimistic. Two easy accidental breaches:

- **Never brief the reader with the page's purpose.** A reader arriving at a page does not know its intent; brief it and it will find the intent, and the commonest real failure — a page whose purpose is not apparent — becomes undetectable.
- **Clicks are spatial, not semantic.** *Click the thing at the top right*, never *click the assessment button* — naming the element proves recognition already happened and skips exactly the step where a real person fails.

## The page under test is a fixed artefact

Three modes were on the table; one voids the exercise:

| Mode | What it measures |
|---|---|
| Render a real page from real markup | **The design** |
| Render a fixed mockup, authored in advance, in a file, unchanged during the run | **The design** — the before-it-is-built case, and legitimate |
| Generate a mockup during the run | **The model agreeing with itself** |

A page invented per turn is written, however unconsciously, to be reacted to. The requirement is not that the page be built — it is that it be **fixed, authored before the run, and identical across every reader in the round**. A hand-written HTML mockup in a file satisfies this completely, which is what makes the programme's highest-value use — **testing before building** — available at all. For this pack that means: v3's four new screens (document 06) get fixed mockups and a tabletop **before** implementation, per the build order (document 11).

## The patience budget comes from outside the model

Modelling patience is right; generating it is circular. If the same model produces the confusion and the reaction to it, the two cohere: a reader rendered confused will also report losing patience — not because impatience was measured, but because that is the consistent story. What comes out is a plausible narrative, which is worse than an obviously wrong one.

So the budget is exogenous, fixed before the run, spent by mechanical rule:

| Property | Set how | Spent how |
|---|---|---|
| Screens | A fixed number, per reader, before the run | One per screenshot delivered |
| Time | A fixed number of minutes | Estimated per screen by a fixed reading rate — never by the model |
| Clicks | A fixed number | One per instruction |
| **Comprehension** | Not budgeted | **Asked at each stop, recorded** |

Then **abandonment is an event, not an opinion**: the budget ran out before the reader could state what the page told it. Measured, comparable across variants, and no part of it generated.

The comprehension question is fixed wording, every reader, every stop, every variant:

> **What would you do now, and what did that page tell you?**

A varying question produces varying answers that look like findings. Nobody has authority to improve this sentence mid-programme; changing it is a change-control entry.

First-round budget proposal for this tool's pages — stated to be argued with, because the numbers drive every result and there is no basis for the first set beyond judgement (open item, 99): **6 screens, 10 minutes at 200 words/minute estimated per screen, 8 clicks** per reader. Whoever sets the second round's budgets does so from the first round's spend data, which is the only non-arbitrary source available.

## What synthetic readers can and cannot find

**A synthetic reader is a reliable detector of defects and an unreliable reporter of preferences.**

| Will find | Why it can |
|---|---|
| A page that does not answer the question it poses | The failure is internal to the page |
| A term used before it is defined | Detectable from the sequence alone |
| A dead end, or a step with no next action | Structural |
| Two pages that contradict each other | Comparison, not taste |
| A screen whose purpose is not apparent | Provided the reader was not briefed |

| Will not find | Why not |
|---|---|
| Which of two clear designs people prefer | Its preferences are the model's, not a population's |
| Whether the tone lands as confident or arrogant | Same |
| Whether the result feels alarming enough to act on | The outcome measure — unavailable here |

This maps exactly onto document 07's split: **synthetic readers clear the levels, humans judge the variants** — and it is the cheaper order, because defects are removed for free before any recruited human's hour is spent on the only question humans can answer.

## Rule one applies hardest because the runs are published

> **A simulated acceptance must never be confusable with a real one.** Different storage, different rendering, and an indelible marker that survives export.

The runs are to be published — including the historical ones — and **export is exactly the moment a marker is lost**: a published transcript of a reader saying it understood the page is one screenshot away from being quoted as a user saying it. So the marker lives in the artefact, not the interface:

- in the **filename** of every run record;
- in the **document header** and the **running header of every page**;
- **beside each quoted reaction**, inline, so no crop removes it.

The bar: **a synthetic run should be difficult to quote misleadingly even by somebody trying.** Higher than labelling it once at the top, and the right bar for material intended to be shared. The check is in principles P12: quote any fragment out of context; if it can pass as a real user's words, the marker failed.

## Rule two, the third raising, and the narrow exception

> **Simulate the role, not the named individual.** Modelling how a chief financial officer generally responds is a training aid. Modelling how a specific named person will respond, and tuning a presentation against that model, is building a tool for routing around a colleague. The line is between preparing for a conversation and pre-empting a person.

The source memo proposed deriving readers from named real people — the third time the corpus has had to raise this rule. What the rule protects is asymmetric power: modelling a gatekeeper to get past them. A usability reader is somebody you are trying to serve, so the rule should not be applied mechanically — but a variant programme is literally *tuning a presentation against a model of a reader*, so the exception has to be narrow and testable:

| Allowed | Not allowed |
|---|---|
| Sampling properties from several real people | Building a portrait of one |
| Composing an archetype that maps to no individual | A reader whose source could recognise themselves |
| Recording the property list | Recording who it came from |
| Publishing the archetype | Naming, identifying, or describing anybody |

The test, checkable by somebody other than the author: **if the person it came from, or a colleague of theirs, would recognise them in it, it is a portrait rather than an archetype.**

The practical argument points the same way and is worth more than the rule: a portrait is a fixed point and generalises to nobody. An archetype is parameterised — technical level, time available, motivation, prior interest — and **the property list is the archetype**; the named individual is only where properties were sampled. Confusing the two loses the ability to vary parameters independently, which is the whole point of having readers at all. For this tool the parameter set starts as document 07's grant axis plus time-available and prior-interest; how many sources before the property list is stable is open (99).

## The service is one question from the banned tool

The part-two ambition — persona simulation as a service across projects — inherits everything above, and its boundary is **the question it accepts**:

| The question asked | What the product is |
|---|---|
| What would this reader understand? | A usability instrument |
| Where would they be confused? | A usability instrument |
| What would this reader value? | Marketing research — defensible |
| **What would this person approve?** | **The thing rule two forbids** |
| **How should I present this so they say yes?** | **Worse — and it is the natural next feature request** |

The difference is the question, not the technology, so it cannot live in terms of service or guidance. **It is a property of the product**: the interface asks about understanding and confusion, does not accept a question about approval, and a simulated verdict is never rendered as a decision. And the thing that makes the service a product rather than a plausible-opinion generator is the **calibration record, published, including the misses**: how often the synthetic finding matched the real reader's, on what sample, on what date. Without it the output is unfalsifiable — and this estate's own rule says a dated re-runnable test is evidence while an assertion from a participant is marketing.

## Publishing the runs means publishing the failures

A participant publishing synthetic verdicts on its own pages is marketing unless the failures are published too. The comparison rules apply unchanged: state who produced it, publish the method before the findings, publish where it loses. The runs worth publishing most are the ones where the reader ran out of budget without understanding the page — those are the ones that changed the design. **A section of successful runs is an advertisement; three abandoned runs, the change made, and the run that then succeeded is the working method this site exists to demonstrate.** That is the run gallery of document 06.

## Open questions carried into change control

Who sets budgets and from what; how the marker survives every export format; how many archetype sources before the property list is stable; where the calibration record lives; whether a reader gets memory across runs (a returning reader is a different test from a first-time one, and conflating them would be easy). All in [the appendix](99__change-control.md).

---

## Added after publication — 21 August 2026

**The programme described above now exists and has been run once.** It lives in
[the readers area](../readers/index.html), outside this pack, because its output
is simulated material and it feeds the pack rather than belonging to it.

Two things in this document were changed by contact with a first run, and both
are recorded in [change control](99__change-control.md) rather than edited above:

1. **Rule 3 is amended, not overturned (MC6).** This document says the reader
   must never be told what the page is for. Real readers arrive with a sentence
   from whoever sent them the link, so the **arrival condition** becomes a
   per-run parameter — *cold* (told nothing, which preserves exactly the
   detection property rule 3 protects) or *pitched* (a fixed elevator-pitch
   paragraph and nothing else). Both are scheduled; running only the pitched
   form would retire rule 3 by omission.

2. **Two instruments were added around the comprehension question.** An
   **expectation question** before the first screenshot, and a **closing
   question** after the budget is spent. The pair is the measurement: the
   distance between what a reader expected from one sentence and what they took
   away from the page, with neither half generated by the page. The comprehension
   question itself is unchanged and remains fixed wording.

**What the first run established about the method**, separately from what it
found about the tool: the reader quoted the page back across six screens with
**zero invented details** — every string checked verbatim against the page's own
DOM afterwards — and the pre-registered prediction for that archetype was
**wrong**, which is the more useful outcome and is published unchanged.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).