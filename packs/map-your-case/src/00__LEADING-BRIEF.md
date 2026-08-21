# Map Your Case: The Grant–Mandate Delta, Mapped By Its Owner

**version** draft-1 (site-agent capture and forward specification — corpus version to be assigned on adoption)
**date** 21 August 2026
**from** The site agent
**to** Project lead, Product, Design, Engineering

**type** Briefing pack, leading brief

*Read this first. This pack is written the other way round from its sibling. The registry MVP pack was design first, build later — and its change-control appendix records what the build taught the design. This pack is written **after** the thing it specifies: the assessment at [/assess](../../assess/index.html) shipped as v1 on 20 August, was rebuilt as v2 on 21 August after a round of project-lead corrections, and is live. So half of this pack is capture — the thinking, principles and corrections that produced what exists, written down before they evaporate into commit messages — and half is specification, the topics expanded here first so that v3 can be built from documents rather than from memory. Where the pack and the shipped tool disagree, the pack is the intent and [the change-control appendix](99__change-control.md) says which differences are deliberate.*

---

## What This Pack Is For

**Map Your Case** is the workflow at `/assess`: a visitor assembles, from a public library of pre-computed facts, which agent products they run and where — and the page renders the delta between their **grant** (what those installations can technically reach) and their **mandate** (what they meant to authorise). The delta is **excess authority**: exposure that exists whether or not anybody wrote it down, unaccepted by construction.

The corpus vocabulary is inherited, not invented here:

| Term | Meaning | Source |
|---|---|---|
| **Grant** | What a credential or installation technically permits — a fact about access | v0.33.61, grant-is-not-mandate |
| **Mandate** | What the holder is authorised and expected to do, with an interval | same |
| **Excess authority** | Grant minus mandate — blast radius measured from the other end | same |
| **Shortfall** | Mandate minus grant — what you meant to authorise and cannot actually do | pack doc 03 |
| **The three-tier control test** | A control bounds a grant only when it is enforced by something the grant does not include: boundary, setting, expectation | v0.33.61, end-to-end flow |

## The Relationship To The Registry

The registry MVP and Map Your Case are the same argument pointed at two audiences, and the direction of computation is opposite:

| | The registry | Map Your Case |
|---|---|---|
| Who it serves | Organisations, operators, verifiers | **One person, about their own machine** |
| Excess authority computed from | Records: signed grants and mandates in a public store | **Choices: references into a public library, held in the visitor's browser** |
| What it stores | Everything, publicly, signed | **Nothing — the visitor's browser stores their choices; the site stores no answers** |
| Its first user | A fresh LLM session following a published page | **A person who has used an agent and suspects, correctly, that they do not know what it can reach** |
| Status | Designed, unbuilt | **Built, v2 live** |

The registry pack's document 14 describes this tool from the registry's side — as the pack's one shipped consumer and as a conformance test of the site's own storage claim. This pack owns the tool itself. Nothing in document 14 is superseded; it is the outside view, and this is the inside one.

## Why It Gets Its Own Pack

Three reasons, in ascending order of weight.

**It is the estate's reference implementation.** The registry briefing pack ships `/assess` as its reference implementation — the one worked answer to "what does this project's discipline look like in code". A reference implementation whose design lives in one retrospective document inside somebody else's pack is a reference to nothing.

**Its principles are load-bearing and mostly invisible.** *Store the choices, never the answers* is implemented as the absence of a text input — an absence is easy to break in any later edit by anyone who does not know it is a rule. The rules are collected in [document 01](01__principles.md) precisely so that breaking one requires contradicting a published sentence rather than merely editing a file.

**Two programmes landed for it on 20 August.** The levels-and-variants brief and the synthetic-readers brief (both v0.33.61) specify how this tool's explanations should be structured and how its pages should be tested — a grid of depths and renderings, and a tabletop of persona agents behind a screenshot boundary. Both are operationalised here as [documents 07](07__levels-and-variants.md) and [08](08__synthetic-readers.md), and neither had anywhere to live before this pack existed.

## The Scope, Stated Honestly

**In scope:** the public library and its rules (02); the computation from choices to delta (03); the page architecture (04); the users, stories and workflows (05); the screens (06); the levels-and-variants programme (07); the synthetic-readers programme (08); sharing without disclosure (09); the Wardley maps (10); the v3 build order (11); and the honest record of v1 and v2 (12).

**Out of scope, deliberately:**

| Not here | Why | Where it lives |
|---|---|---|
| Risk acceptance | Accepting a risk is a governance act with an acceptor, an interval and a record — a product, not a checkbox | The risk product (registry pack decision 41) |
| Scanning the visitor's machine | A scan's output is a description of the visitor, which is the thing this tool exists to never hold | Open — registry pack decision 35 gates it on the vault path |
| Any backend, any telemetry | The privacy claim is architectural: there is nothing to send to | [Document 01](01__principles.md), principle 2 |
| Measuring visitors | The objective is behaviour change; the measure set exists and the page cannot instrument any of it, and says so | Registry pack decision 33 |
| A score | A score gets optimised for how alarming it feels | [Document 01](01__principles.md), principle 6 |

## Who It Is For: Five Positions On One Axis

The levels-and-variants brief settles what organises the audience: **not job titles, grant size.** Five scenarios, each a position on the axis, each a level in its own right:

1. **Dictation** — a hosted assistant turning voice notes into documents. Smallest gap, most relatable.
2. **Document work** — an assistant connected to mail or a drive. The first time the grant contains other people's material.
3. **Vibe coding** — a desktop or web coding tool on a personal project. The first time the grant includes execution.
4. **Professional development** — a command-line agent with a code-host token. The largest grant most people actually hold.
5. **Operations** — an agent with production access. Where the gap stops being personal.

And one rule above the ladder, from the same brief: **everybody starts at level one.** Expertise predicts vocabulary, not whether somebody knows their own grant — the advanced user holds the largest grant and the strongest prior that there is nothing to learn, which is the combination most likely to produce denial rather than change.

## The One Concession The Tool Must Make First

The worked instance in the levels brief was measured in the session that wrote it: the capabilities outside the stated mandate were not merely held — **they were exercised, repeatedly, and they are the reason the output was any good.** Every experienced reader knows this about their own sessions. So:

> **The gap is not only where the danger is. It is also where the value came from.** A tool that pretends otherwise will be dismissed by the only people who could act on what it shows.

The consequence runs through every document here: the framing is never *look what could go wrong* — it is *which parts of your grant did you actually use*, three sets rather than two: **mandated**, **exercised beyond the mandate**, and **held and never used**. The third set is the product, because it is the one nobody can defend and the one that shrinks without anybody losing anything.

## How To Read This Pack

Documents 01–04 are mostly capture: the principles, the library, the model and the architecture as built, with their reasons. Documents 05–06 are half and half. Documents 07–09 are mostly specification: the two 20 August programmes and sharing, expanded in prose first so v3 builds from documents. Documents 10–11 are the maps and the order. Document 12 is the history — read it first if you want to know *why* the principles are the principles, because nearly every one of them was purchased with a specific mistake. The change-control appendix is last because it never stops growing; read it second if you are about to build, and last if you are reading through. Never not at all.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
