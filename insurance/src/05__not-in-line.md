# Not In Line: The Position, The Scale, And What It Forecloses

*Doctrine document 05. Derived from memo 5 ([brief v0.33.76](../briefs/v0.33.76__strategy-brief__not-in-line-the-schemas-are-the-product-and-the-scale-is-one-to-five.md)). GM-D54 is **settled**; GM-D55 to GM-D57 are proposed.*

---

## 1 · The scale: one to five, settled

**The level scale is 1–5.** Settled by the project lead on 31 August, and it closes the question this folder has carried since memo 1.

The reasoning is better than the answer. **A five-band scale is honest about its own resolution:**

| Scale | Implies | Supportable today |
|---|---|---|
| Currency | A loss distribution | **No** — no agent loss data exists anywhere |
| 1–100 | Meaningful distinctions at one-point resolution | **No** — the inputs are counts, tiers and three-valued facts |
| **1–5** | An ordering with defensible boundaries | **Yes** |

*Less judgmental*, in memo 5's phrase, names the social property and it is the practical one. **A coarse band is arguable in a way a decimal is not.** A team told they are at level 3 argues about what the band means — the useful argument. A team told they are at 62.4 argues about arithmetic, which is not.

> **Coarseness is a feature here, not a compromise.** The scale says only what the evidence can carry (GM-D54).

## 2 · Not in line — a constraint, and what it forecloses

This project sits **outside the path of the transaction**: not the carrier, not the insurance broker, not the execution broker. That is a constraint with a consequence that limits what may ever be claimed.

**A party outside the line cannot enforce.** By the estate's own test — a control bounds a grant only when it is enforced by something the grant does not include — a schema, a connector and a published derivation are none of those.

> **This project can never itself be a boundary.** It ships a check that *becomes* one when installed by somebody who is in line.

| | Who does it | Tier reachable |
|---|---|---|
| Compute the rating, publish the derivation | **This project** | Instrumentation — **expectation** |
| Install the gate in a pipeline the deploying team controls | The customer | **Setting** |
| Install it where the deploying team cannot reach | The customer, or a broker | **Boundary** |

**Every tier above the first is somebody else's action** (GM-D55). This is not a defeat — it is the corpus's own *instrument before you enforce* position applied to the business model, and it produces the honest sentence: **we can tell you what you are carrying; whether anything stops it is your install.**

## 3 · Three brokers, and we are none of them

Memo 5's self-correction — *"our job is to be the broker. Not the broker."* — separates three things one word has been covering:

| | | Us? |
|---|---|---|
| **The execution broker** | Holds the credential, performs the action, returns a receipt. *In line* | **No** — §2 forecloses it |
| **The insurance broker** | Places risk with carriers, holds the client relationship. *In the money path* | **No** — regulated |
| **The connective tissue** | Schemas, flows, mappings, connectors, evidence. *Beside the line* | **Yes** |

**And the third makes the first two possible.** [Document 03](who-pays-and-the-moving-rating.html) established that an execution broker's value is exactly the structural delta it converts to elective. **Somebody must define how a broker states what it converts**, or every broker's claim is unfalsifiable marketing.

> **We do not operate the broker. We define what a broker must be able to show** (GM-D56).

Which is stronger than it sounds: the party defining a market's disclosure format decides what *good* is measurable as, while carrying none of the market's capital or liability.

## 4 · Openness is load-bearing

Three reasons this is structural rather than a licensing preference:

**It is the substitute for capital.** [Document 04](why-insurance-and-what-broke-it.html) observes that insurance's real virtue is creating a party with money at stake in the data being true. Stage 1 has no such party, so the demand for trustworthy data must come from the method being attackable — which requires it to be public. **A closed rating engine in a stage with no money has no honesty mechanism at all.**

**It is the monoculture mitigation.** A single rating standard is a concentration risk. A standard anyone can fork, audit and dispute is one that can be broken on purpose.

**It is the only way this position pays.** A schema's value is proportional to adoption. A proprietary interchange format nobody else implements is not connective tissue — it is a product with an integration problem.

## 5 · Integrate with what exists — and the cost of that, stated before it is paid

Connective tissue that demanded a rebuild would not be connective tissue. So: use whatever maturity a company already has.

**The cost:** a rating computed from existing systems inherits **whatever that data's quality is**, and it varies enormously. Which returns to [document 01's](the-rating.html) two channels — an integration pulling from a CMDB or an asset inventory is producing **declared** facts unless something measures them.

> **A connector labels the evidence class of everything it imports** (GM-D57). Otherwise *integrate with what exists* quietly becomes *launder what exists*.

Cheap to state on the first connector; expensive to retrofit onto the fifth.

## 6 · Acceptance, put back in the frame

[The pivot briefing](../documents/agent-insurance.html) moved the foundation *from* risk acceptance *to* the policy. Memo 5 puts acceptance back — not as a reversal, but as the thing a level makes possible.

> **A rating does not replace acceptance. It makes acceptance specific.**

*"We accept the risk of this agent"* is a sentence nobody can check. *"We accept a level 4 placement, for this quarter, on this service"* has a subject, a threshold and a date — which is what the register was built to hold.

## What this does not prove

- **That the band definitions exist.** The scale is settled at 1–5; **what each band means and what separates them is not**, and that is where the argument will happen.
- **That the not-in-line position is commercially viable.** It is a coherent architecture and an unproven business. Nobody has paid for a schema here.
- **That connectors can label evidence honestly.** §5 states the requirement; no connector exists to test whether an imported fact's provenance is even recoverable in practice.
- **That defining the disclosure format confers influence.** §3 argues it does. Standards bodies sometimes matter and sometimes are ignored, and this one has no adopters.

---

*CC BY 4.0. Source: brief v0.33.76, memo 5 of 10. GM-D54 is settled by the project lead; everything else here is derived and labelled where it extends the memo.*
