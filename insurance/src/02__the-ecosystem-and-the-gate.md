# The Ecosystem And The Gate: Who Rates, What It Gates, And The Tier The Gate Itself Has

*Doctrine document 02. Derived from memo 2 ([brief v0.33.73](../briefs/v0.33.73__strategy-brief__the-ecosystem-without-the-money-insurance-as-a-go-live-gate.md)). Proposed, not adopted: GM-D42 to GM-D44 are in change control awaiting the project lead.*

---

## 1 · The roles, and why they are the integrity mechanism

Stage 1 takes the insurance industry's **roles** and leaves its **money**. That is not a partial adoption — the roles are the part that makes an assessment worth anything.

An insurer is a third party for a structural reason: **an assessment produced by the party that wants the answer to be *yes* is not an assessment.** Move the ecosystem inside a company and that separation stops being free and has to be manufactured.

| Role | What it does | Inside a company |
|---|---|---|
| **The insured** | Carries the exposure, wants to ship | The team deploying the agent |
| **The underwriter** | Rates the placement, sets the terms | The rating authority — and *not* the team above |
| **The capital** | Stands behind the payout | **Absent in stage 1, deliberately** |
| **The regulator** | Says the method is sound | **The published derivation**, arguable by anybody |

The money-holding version of this has a name — a **captive insurer**, a subsidiary a firm forms to insure its own risks, ordinary in large companies. **Stage 1 is a captive with the capital removed**, which is exactly why it is unregulated, and worth knowing because it names what stage 2 would become.

## 2 · The rule, completed

[Document 00](what-this-is.html) carries the rule this folder runs on, from memo 1:

> A level nobody can recompute is exactly the theatre a premium would have prevented.

Memo 2 supplies its missing half:

> **A level computed by the party that wants to ship is theatre even when it is recomputable.**

**Method and separation, both.** A reproducible derivation stops the arithmetic being invented; an independent rater stops the *inputs* being chosen to flatter. Neither substitutes for the other.

## 3 · The rating is a gate

Memo 1 produced a rating. Memo 2 puts it in the path of a deployment — *do we go live, what would this have to reach before it ships, reduce the risk by this quantity.* That is a different object:

| | A rating that reports | A rating that gates |
|---|---|---|
| Answers | "here is the level" | **"not until this changes"** |
| Read by | Whoever chooses to | The deploy pipeline |
| Can be ignored | Silently | Only visibly |
| Requires | A number | **A threshold, and a decomposition** |

**"Reduce the risk by this quantity" is unsayable unless the rating decomposes.** You cannot ask a team to move from level 4 to level 2 without naming which inputs contribute what and which changes would move them. So the derivation is not only an audit artefact — **it is the actionable half of the gate**, and a rating that ships one is the only kind you can be asked to improve (GM-D44).

## 4 · The gate has a tier, and this estate already owns the test

The pack's test applies to the insurance apparatus itself:

> **A control bounds a grant only when it is enforced by something the grant does not include.**

| Where the gate lives | Tier |
|---|---|
| A dashboard someone is meant to check | **Expectation** — nothing stands between the deploy and production but intention |
| A CI check the deploying team can override, skip or edit | **Setting** — inside the grant it bounds, the same failure as the pre-push hook |
| A required check evaluated by a party the deploying team does not control | **Boundary** — §1's separation, made mechanical |

**The roles and the tier are the same question asked twice.** An underwriter who *is* the deploying team produces a setting no matter how good the arithmetic.

> **So the rating engine declares its own tier, on its own face** — as the mandate hook's refusal banner does. A control that overstates itself is worse than none; an insurance gate that overstates itself is worse still, because it will be believed (GM-D42).

## 5 · A decision, not an offset — and why that argues for building this half first

Memo 2's sharpest line separates **insurance as a risk decision mechanism** from **insurance as something you offload the risk into and forget.**

Conventional cover has a documented failure mode: **cover substitutes for control.** If the loss is paid, the incentive to prevent it weakens — which is why insurers spend so much design effort on deductibles, exclusions, warranties and control credits.

**Stage 1 is structurally immune, because there is no payout to offload into.** A rating that pays nothing cannot be used to stop caring. This is a second and better reason to defer the money than the regulatory one: **the payout is the part that carries the moral hazard**, and the discipline learned without it is what a money stage would have to carry.

## 6 · The fractal has a name, and it settles less than it looks like

*Insurers of insurers of insurance* is **reinsurance** — three centuries old, and it exists precisely because correlated catastrophe breaks a single carrier.

| | What it gives | What it does not |
|---|---|---|
| **Shape** | The hierarchy: placement → service → estate → group, each a rated entity, with precedent for how levels relate | — |
| **Correlation** | — | **Nothing.** Reinsurance is how capital is held against correlated loss; it does not compute *which* risks are correlated |

So [document 01's](the-rating.html) aggregation rule stands and narrows: **the fractal supplies the rollup's shape; shared-node detection still supplies its arithmetic.** Two placements whose grant trees converge on the same credential node are correlated, and the graph already says so. *"You should be able to connect all of them"* is right — **and the connection is the graph, not the org chart.**

## 7 · The control-to-premium loop, which needs no new machinery

> when you invest in a control to reduce a risk, you ... [change] the insurance premium

[The workbench](../workbench/index.html) already runs this loop: flip the branch-protection fact and the enforcement tier moves from `setting` to `boundary`, computed from the facts rather than stored. Rename the output and the mechanism is done.

Two consequences:

- **It is scale-free.** Ordering controls by how much they move a rating — *this one buys more than that one, here* — needs no agreed range. It works on bands 1–5, a continuous score, or letter grades. **The counterfactual view does not wait on the scale question.**
- **It is the honest form of the questionnaire.** [Document 01](the-rating.html) has the wellness questionnaire asking *do you have a control*; the loop asks **what would this control buy you here** — prospective, placement-specific, computed from that placement's own tree rather than a checkbox averaged across an industry.

## 8 · One thing this cannot answer

Memo 2 asks whether the value an agent adds exceeds the risk being bought. **The rating is one side of that.** Valuing the contribution — throughput, cost displaced, quality — needs a model this estate has no basis for and no data on.

> **The rating prices one side of a two-sided question, and says so.**

It tells an operator what risk they are buying; whether it is worth it stays a judgement made by someone who knows what the agent is worth. The same division of labour lets a surveyor value a building without deciding whether you should buy it.

## What this does not prove

- **That an internal underwriter is actually independent.** §1 describes the separation; whether any given organisation achieves it is an org-design outcome no schema can enforce, and a captive that reports to the deploying business is a setting with a nicer name.
- **That the gate would be honoured.** A gate is only worth its tier, and the tier depends on where it is installed — which is the operator's choice, not this estate's.
- **That reinsurance solves aggregation.** §6 is explicit: it supplies shape, not correlation. Nothing here computes which placements fail together.
- **That the rating answers the value question.** §8. It answers half, and the other half is not a modelling gap to be closed later — it is somebody else's judgement.

---

*CC BY 4.0. Source: brief v0.33.73, memo 2 of 8. Everything here is derived from that memo and labelled where it extends it.*
