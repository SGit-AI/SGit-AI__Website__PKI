# The World Model: The MVP, And The Rule That Keeps It Honest

*Doctrine document 08, from memo 8 — the last of the series ([brief v0.33.79](../briefs/v0.33.79__strategy-brief__the-world-model-an-mvp-that-explains-and-must-show-its-own-emptiness.md)). Proposed, not adopted: GM-D67 to GM-D71 await the project lead. **This document corrects the MVP shape [the site agent had been proposing](../admin/comms.html) for four releases.***

---

## 1 · The first MVP explains; it does not calculate

The site agent had been proposing the same MVP repeatedly: *a placement rated 1–5 with its derivation, plus a which-control-buys-the-most view.* **That is an instrument.** Memo 8 asks for something else, and gives the reason twice: *users is going to be the first important thing*, and *ultimately that's what we can use to explain this.*

> **An instrument answers a question somebody already knows how to ask. An explainer creates the person who can ask it.**

Nobody currently holds a mental model of grant-minus-mandate priced as insurance — so a rating engine has no audience yet, and building it first would be building the second thing first.

**Corrected: the first MVP is the explanatory world** (GM-D67). The rating still exists underneath it, as the thing the world *demonstrates* rather than the thing that ships.

It also reframes what is already here. The [simulator](../simulator/index.html), the [experiments](../experiments/index.html) and the [workbench](../workbench/index.html) are instruments — they answer questions for somebody who already has the vocabulary.

> **This estate has instruments and a card game. It has no world.**

## 2 · Cost needs assets, and stage 1 needs only their class

The estate measures what an agent can *reach* and knows nothing about what those things are *worth*. Every count it produces is **unweighted** — and forty repositories of test fixtures is not forty production systems.

**Stage 1 does not need asset value**, which reconciles this with [document 04's](why-insurance-and-what-broke-it.html) boundary:

> **A level is relative. Ranking two placements needs no absolute value; pricing one does.**

| | Stage 1 (rank) | Stage 2 (price) |
|---|---|---|
| Asset **class** — production or not, personal data or not, customer-facing or not | **Needed, and cheap** — a declared fact, marked as such under the [two-channel rule](the-rating.html) | Needed |
| Asset **value** in time, money, recoverability, liability | **Not needed** | **Required, and outside this estate's competence** |

The four dimensions memo 8 names are the right eventual requirement and are correctly deferred. **Recording them now still matters**: they are the columns a future valuation fills, and naming them stops a resource count being mistaken for a cost (GM-D68).

## 3 · Fibonacci is about band definitions, not about the scale

Memo 8's probable *Fibonacci* — 1, 2, 3, 5, 8, 13 — is used in estimation precisely because its gaps widen, encoding that confidence falls as numbers rise. **It is a good instinct**, and the exposure difference between a level 4 and a level 5 placement is almost certainly larger than between 1 and 2, which a linear scale hides.

It appears to disturb a settled decision. It does not, because these are two questions wearing one:

- **What are the bands called?** — 1 to 5. **Settled** ([GM-D54](../packs/grant-and-mandate/change-control.html)).
- **What do the bands represent — even steps or widening ones?** — **open**, and it is the band-definition question already recorded as unanswered.

> **Fibonacci is a proposal about band definitions, not about the scale.** Bands labelled 1–5 whose underlying steps widen satisfy both.

Put to the project lead rather than adopted, because GM-D54 is theirs.

## 4 · Three new actors, under the existing rules

| Actor | In the estate's existing model |
|---|---|
| **Underwriter** | An identity issuing [`policy/v0`](the-policy-as-a-statement.html) statements — a rater, and separated from whoever wants to ship |
| **Insurer** | The party carrying capital. **Absent in stage 1 by construction**, and shown as absent rather than greyed-in as though pending |
| **Claim** | A statement — `loss-event/v0`, still undrafted, and **the one primitive the whole pivot lacks** |

**Each declares fixture-or-real like every other identity here** (GM-D70). An underwriter in a demonstration whose private half is published is not an underwriter; it is a fixture, and the world says so as prominently as the [record pages](../registry/index.html) do.

## 5 · The world shows its own emptiness

**The load-bearing rule of this document.**

A world with departments and data visibly flying between them **implies a working system** — smooth, populated, confident. Of everything this estate would depict:

- ten of eleven register identities are **fixtures whose private keys are published**;
- both twins are **servers**; nobody has measured a desktop agent;
- the claim shape **does not exist**;
- the world-state feed that would move a rating **exists nowhere for anybody**;
- no insurer, underwriter or relying party has ever been implemented.

> **A polished simulation is the most effective mechanism yet devised for making a demonstration look like a product.**

That is this corpus's own anxiety — *a control that overstates itself is worse than none*; apparent authority binds because nothing in the presentation distinguished it from the real thing — arriving in the user interface. **A rendered world is a continuous, wordless claim about how much of this exists.**

> **So: unmeasured places look unmeasured. Fixture identities look like fixtures. Mechanisms that do not exist are visibly absent, not smoothly rendered.** A player sees which parts of the city are built and which are drawn, without reading a caveat (GM-D69).

This is more interesting than the alternative. **A city with construction sites and empty lots explains where this work actually stands better than a finished skyline does** — and it makes the roadmap part of the fiction rather than a footnote beneath it.

## 6 · A world before a 3D world

The direction is right; the sequencing is engineering advice. **Most of the explanatory value is spatial, not dimensional** — places you move between, actors with roles, things moving along edges. All three work in 2D, and this estate already draws graphs by hand in SVG with no charting library and no third-party requests.

| Stage | What it proves | Cost |
|---|---|---|
| **2D world** — places, actors, assets on edges, a scripted walkthrough | Whether the **explanation lands**. This is the whole risk | Low; the primitives exist |
| **3D** | Whether immersion adds to an explanation that already works | High, and irreversible in effort |

> **Build the 2D world first** (GM-D71). A 3D world that explains badly is expensive to discover and expensive to abandon.

Memo 8's own split maps onto what exists and what does not: **replay exists** — the simulator and chain room replay this estate's history — and **connect-the-dots does not**. A live walk from a delta, through a policy, to a claim has never been rendered.

## 7 · The MVP, specified

**A 2D world with places, walking one worked example end to end.** The delta is the starting point, per the memo.

**Places** are the actors: the **environment** (where the twin is measured), the **operator**, the **underwriter**, the **relying party**, and an empty lot marked *insurer — stage 2*.

**Moving things** are documents this estate already publishes: a grant, a mandate, the delta between them, a policy statement, a verification.

**The walkthrough:** measure the environment → see the grant → read the mandate → **watch the delta appear** → get it rated → install a control and watch the level move → a zero day lands and the level moves again → the policy is revoked → the relying party refuses.

Every step is a document or a computation the estate already has — **except two: the claim, and the world-state feed.** Those appear as construction sites, per §5.

## What this does not prove

- **That a world explains better than a document.** It is the memo's hypothesis and the site agent's agreement, and neither is evidence. The 2D-first sequencing exists precisely so this is tested cheaply.
- **That the emptiness rule survives contact with a demo.** Showing what does not exist is easy to write down and hard to keep when somebody wants to impress a room. It is the first thing that will be argued away.
- **That asset class is enough to rank.** §2 argues it is; nothing tests whether a declared class carries enough signal to separate placements that a resource count cannot.
- **That the walkthrough is the right one.** §7's sequence is assembled from the memos, not from watching anybody fail to understand this. The first user is the test, and there has not been one.

---

*CC BY 4.0. Source: brief v0.33.79, memo 8 of 8 — the last of the series. Everything here is derived from that memo and labelled where it extends it, including the correction to the site agent's own MVP proposal.*
