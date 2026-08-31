# Why Insurance, And What Broke It Last Time

*Doctrine document 04. Derived from memo 4 ([brief v0.33.75](../briefs/v0.33.75__strategy-brief__why-insurance-and-the-cautionary-tale-is-cyber-insurance-itself.md)). Proposed, not adopted: GM-D51 to GM-D53 await the project lead.*

---

## 1 · The cautionary tale is the argument for the rule

Cyber insurance is offered here as the **warning**, not the model. It grew fast on quantification nobody could check; policies turned out to be worth less than buyers thought; payouts hit insurers who had not priced them.

**The failure landed on both sides at once**, which kills the comfortable reading that bad quantification only hurts the counterparty.

> **A market can be enthusiastically data-driven and still be pricing fiction, if the data is not checkable.**

So [the rule this folder runs on](what-this-is.html) — *a level nobody can recompute is theatre*, completed in [document 02](the-ecosystem-and-the-gate.html) by *and a level computed by the party that wants to ship is theatre even when recomputable* — is not a habit borrowed from this estate's style. **It is the thing whose absence broke the nearest comparable market** (GM-D51).

And it fixes the priority: a rating engine's first obligation is **not to be accurate**, which nobody can be yet. It is to be **checkable**, so that being wrong is discoverable rather than accumulating.

## 2 · Insurance does not use trustworthy data — it demands it

The sharpest distinction in memo 4, and a different claim from *insurance is data-driven*. Many disciplines consume data. **Insurance creates a party with money at stake in the data being true**, which manufactures demand for measurement nobody would otherwise fund.

That is honestly what this pivot does to the estate's existing work. The register, the twin, the evidence pack and the computed tiers all predate it and were justified on security grounds. **Insurance gives them a second sponsor — and the second sponsor asks harder questions, because they are the one who is wrong expensively.**

**It also names what stage 1 gives up.** With no money there is no party losing anything, so the demand for trustworthy data must come from somewhere else: **the published derivation, which anyone can attack.** That is a weaker forcing function than capital, and it is the only one available before capital — which is why [document 05](not-in-line.html) treats openness as load-bearing rather than generous.

## 3 · Impact reduction is what security buys — and the tier measures the neighbouring quantity

A long-standing problem, stated precisely: an incident response team does not reduce the *number* of incidents, it reduces their *impact*. Frequency is countable; **impact reduction is counterfactual**, and counterfactuals appear in no log.

**The three-tier test computes something adjacent to that, and the difference has to be said before the claim is worth anything.** The test asks whether a control is enforced by something the grant does not include — which says nothing about how often an agent tries, and everything about whether a try succeeds:

| Tier | Attempts | What an attempt achieves |
|---|---|---|
| **Expectation** | Unchanged | Whatever the grant permits |
| **Setting** | Unchanged | Blocked unless the agent chooses otherwise — and it can |
| **Boundary** | Unchanged | Blocked by something the agent cannot reach |

Insurance splits a loss into **how often** and **how bad**. The memo's incident-response team is squarely the second: the incident happened, and the team makes it smaller. **The tier is neither.** It sits between them — attempts are unchanged, but fewer of them become losses at all.

> **The tier ranks how much of the grant is reachable in practice. That is blast-radius reduction, not severity reduction** (GM-D82, narrowing GM-D52).

Which is still the useful half, because for an agent placement the blast radius *is* most of the severity: what an agent can reach bounds what it can damage. But the two are not the same quantity, and this document originally claimed the tier was the incident-response team's quantity under a different name. **It is not, and a rating that conflates them would credit a boundary control for post-incident recovery capability it has nothing to do with.**

Stated carefully, then: the tiers do not **price** anything. They **rank** reachability, on three positions with a defeat path, computed from facts. **Ranking is what a level needs**, which is why this is the closest thing here to a novel claim and why it must not be overstated — into a price, or into a claim about severity.

## 4 · The firm is already an unpriced insurer

A company at scale already underwrites: budget approvals, vendor choices, deployment sign-offs, exception processes. All are underwriting decisions taken without a rating, usually without a record, and never called that.

> **An internal rating market is not a new activity. It makes an existing one legible.**

The company was already underwriting the agent. It was doing it in a meeting.

## 5 · What this estate can and cannot quantify

Memo 4 lists lock-in, the cost of removing a product, the cost of stopping a service. **These are genuinely quantifiable and outside this estate's competence.** The boundary matters more than the territory:

| | Can this estate rate it? |
|---|---|
| The grant an agent holds, and its delta from the mandate | **Yes** — measured, and the subject |
| Whether a control bounds that grant | **Yes** — computed tier |
| Lock-in; cost of removal; cost of stopping a service | **No.** Needs commercial and operational data the estate has no access to and no business holding |

The connective tissue is real: all of them answer *what would it cost if this had to change?* at different altitudes. **That is an argument for the schema generalising later, not for claiming the ground now.**

And the guard-rail: **a rating that reduces activity has failed; one that redirects it has worked.**

## 6 · Diversification, and the monoculture this project would create

Concentrating cover in one carrier is a risk — hence layered towers and syndicates. In a stage with no money the analogue is **multiple independent raters, and disagreement between them is signal**: two raters agreeing is weak evidence a level is right; two disagreeing is strong evidence something in the derivation is contestable, and points at where (GM-D53).

**Which turns the argument back on this project.** [Document 05](not-in-line.html) proposes supplying the schemas everyone uses — and **a single rating standard is itself a concentration risk**, the same correlated-failure problem [document 03](who-pays-and-the-moving-rating.html) raised about placements sharing a credential, one altitude up.

The mitigation is the openness memo 5 proposes anyway: **a standard anyone can fork, audit and dispute is a monoculture that can be broken on purpose.**

## What this does not prove

- **That five bands are the right resolution.** [Document 05](not-in-line.html) settles the scale at 1–5 and argues for it; nothing validates it against outcomes, because there are no outcomes yet.
- **That blast radius is a good proxy for severity.** §3 corrects the identification of the tier with impact reduction and then leans on the proxy anyway: *what an agent can reach bounds what it can damage*. That is an argument, not a measurement, and it is weakest exactly where a small reach touches something critical.
- **That the tier ranks reachability correctly.** Whether the gap between setting and boundary is larger than between expectation and setting is unmeasured, and probably varies by placement.
- **That anything here measures severity at all.** Nothing in this folder computes how bad a loss is once it occurs. The memo asked for that quantity; the estate does not have it.
- **That a second rater exists.** §6's disagreement signal requires somebody else to rate, and nobody does.
- **That cyber insurance's failure is fully diagnosed here.** The account is the memo's and is consistent with the public record, but this estate has done no primary research into that market and should not be read as having done so.

---

*CC BY 4.0. Source: brief v0.33.75, memo 4 of 10. Everything here is derived from that memo and labelled where it extends it.*
