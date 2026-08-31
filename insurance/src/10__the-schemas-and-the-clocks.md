# The Schemas And The Clocks: A Warranty Is A Fact With A Maximum Age

*Doctrine document 10, from memo 10 — the last of the series ([brief v0.33.81](../briefs/v0.33.81__strategy-brief__the-schemas-the-clocks-and-a-warranty-is-a-fact-with-a-maximum-age.md)). Proposed, not adopted: GM-D76 to GM-D80 await the project lead.*

---

## 1 · A warranty is a fact plus a maximum age

The memo's backup example is the sharpest cover condition in the series, and it yields a definition:

> *only valid if you have a backup with **less than 24 hours** ... you cannot make a change to the database if the last backup failed, **or if you don't have evidence** that the last backup is actually operating*

> **A warranty is a fact plus a maximum age** — `{fact: last_backup_succeeded, max_age: 24h}` — and it fails **three** ways: the fact is false, the fact is stale, or the fact is **unknown**.

Putting unknown on the same side as false is the correct and uncomfortable choice for a cover condition, and it is the opposite of the rule for *rating*, where [document 01](the-rating.html) insists unknown is never scored as absent. **The asymmetry is deliberate: for a rating, assuming absence manufactures comfort; for cover, assuming presence manufactures liability.**

**The estate already computes this shape.** Every evidence pack prints the twin's age because a measurement goes stale; facts are already three-valued. A warranty is those two mechanisms combined and pointed at cover rather than at a level (GM-D76).

## 2 · The gate has been climbing, and this is the top of it

| Gate | Evaluated | From |
|---|---|---|
| **Go-live** | Once, at deployment | [Document 02](the-ecosystem-and-the-gate.html) |
| **Running agent** | On world events | [Document 03](who-pays-and-the-moving-rating.html) |
| **Per action** | **Every time the agent acts** | **Here** — *you cannot make a change to the database if…* |

The third is strongest and most expensive, and [the handshake](the-policy-as-a-statement.html) already supplies the mechanism: a relying party checking on every request checks the warranty on every request too.

## 3 · Three clocks, and conflating them is how a system like this lies

Cover is **continuously conditional**, not merely bounded by an interval. So:

| Clock | What it measures |
|---|---|
| **The policy interval** | From when, until when cover exists at all |
| **Twin and world freshness** | How current the measurement and the threat picture are |
| **The warranty's check interval** | **How recently each cover condition was confirmed** |

> **A policy in force, computed against a fresh twin, with a warranty last checked eleven days ago, is not covered** — and only a system keeping the third clock separately can say so (GM-D77).

Same lesson as [document 07's](the-policy-as-a-statement.html) revocation latency: **a promise is bounded by the interval at which somebody actually looks.**

## 4 · Metering uses is sound; metering checks is not

*Ten usages over an hour* is a usage-boxed policy, and it is **not** the thing [document 07](the-policy-as-a-statement.html) argued against. The corpus's own line is the distinction:

> **"a verification is not a use."**

Metering uses is what insurance has always done — per flight, per shipment — and it prices what the buyer consumes. Metering checks taxes the behaviour the system wants.

**But it collides with the not-in-line position.** To count uses you must observe uses, and a relying party that does not verify generates nothing at all:

| Who can count uses | |
|---|---|
| The relying party | **Yes** — it is the one being asked |
| An execution broker | **Yes** — it performs the action |
| The rater / this project | **No** — [not in line](not-in-line.html), so it sees nothing |

> **A usage-boxed policy needs an in-line counter, which this project is not** (GM-D78). We define the counting schema; somebody else holds the counter.

## 5 · Office hours, and the timezone trap

Cover *only over office hours* is an interval with **recurrence** — a small extension to a shape the mandate already has, and a real control rather than an administrative nicety: an agent that may act only during business hours has a smaller blast radius because somebody is awake.

The trap is specific. **A recurring window without a timezone is ambiguous, and daylight saving moves it twice a year.** Ambiguity in a *cover* condition is materially worse than in a schedule, because it is the ground disputes are fought on.

> **A recurring cover window states its timezone** (GM-D80). Cheap now; unpleasant to retrofit into policies already sold.

## 6 · Schemas, not APIs

The memo asks what APIs are needed. The answer follows from [document 05](not-in-line.html):

> **An API is operated. A schema is implemented.** The not-in-line position permits only the second.

So the artefact is not *the policy API* — it is **the policy lifecycle as documents and the transitions between them**. And the estate already has every piece:

| The need | The existing shape |
|---|---|
| Creating a policy | A signed statement appended to the issuer's record |
| Criteria for it to exist | The statement's own fields — the warranty set |
| "Hashes to create" | Statement hashes over the canonical form, already computed |
| "Certifications to create" | Signatures, verified against a published key |
| Amending, activating, ending | **Appends. Never edits** — the register's rule since v0.1.26 |

> **The answer to *what APIs do we need* is mostly: none that we build** (GM-D79). Interoperability lives in the documents; the API is whatever each party puts in front of them.

## 7 · Where memos 9 and 10 meet

*Some of these are done by spreadsheets — where does that intersection occur?* is [document 09's](make-them-insurable.html) survey question from the other side. Memo 9 asks *what format does the market accept*; memo 10 asks *where does that format meet ours*.

**One question, and the survey answers it.** If the market fills in spreadsheets, the connector renders an evidence pack into a spreadsheet — **carrying the evidence classes across**, or a measured fact and a declared one land in adjacent cells looking identical.

> **A connector that flattens provenance into a spreadsheet would create the very defect this pivot exists to detect** — [GM-D73's](../packs/grant-and-mandate/change-control.html) material non-disclosure, manufactured by our own tooling.

## What this does not prove

- **That the backup example is complete.** The transcript ends mid-sentence at *"a 24-hour period where within that window"*. The thought is unfinished and is not completed here, because guessing the end of a sentence and rendering it as the project lead's position is the same error as guessing a survey's findings.
- **That three clocks are enough.** Three are identified; nothing establishes that a fourth is not lurking, and each was found only when a memo happened to need it.
- **That a warranty breach voids rather than suspends.** Insurance has voiding, suspension and downgrade, and they differ materially — voiding is retroactive. The memo implies refusal of the action, which is closest to suspension, and this is not settled.
- **That any of the schemas exist.** Nothing in this document is drafted. `policy/v0` has a shape, `loss-event/v0` does not, and the warranty set described here has never been written down as a schema.

---

*CC BY 4.0. Source: brief v0.33.81, memo 10 — the last of the series. Everything here is derived from that memo and labelled where it extends it.*
