# The Resource Pool: A Grant That Depletes, And The First Loss Data This Pivot Can Have

*Doctrine document 11, from memo 11 ([brief v0.33.83](../briefs/v0.33.83__strategy-brief__the-resource-pool-a-grant-that-depletes-and-the-first-loss-data-this-pivot-can-have.md)). Proposed, not adopted: GM-D86 to GM-D95 await the project lead. **This document corrects the memo it derives from, in §2.***

---

## 1 · Consumption is a second axis, and this corpus only had one

Everything before this document rates **capability**: what an agent can reach. The grant is measured, the mandate bounds it, and the delta between them is the insurable interest.

**Consumption is orthogonal to all of it.** Two placements with byte-identical grant trees can differ by two orders of magnitude in what they burn, and nothing this estate measures would see it.

It also introduces a node unlike any in the tree:

> **A resource pool is a grant that depletes** (GM-D86).

Every grant here is *static*. A credential reaching forty repositories reaches forty tomorrow; exercising it does not shrink it. A pool is **consumed by its own exercise**, so it carries a `remaining` — a quantity that changes with no re-measurement, which no existing node has. That makes it a **fourth primitive** beside grant, mandate and fact, not a restatement of any of them.

## 2 · A pool bounds volume, never reach

The memo says the pool *"defines what the agent can do... defines in a way the grant."* **It does not, and this is the correction this document exists to make.**

> **The cheapest catastrophic action is cheap.**

| | Expensive | Cheap |
|---|---|---|
| **Harmless** | A runaway loop — **the budget catches it** | Normal operation |
| **Catastrophic** | A long destructive session | One force-push, one visibility flip — **the budget is blind** |

An agent with a million-token licence can destroy a repository for a few hundred tokens. A runaway summarisation loop can burn the whole pool and damage nothing.

> **A pool bounds how much an agent does. The mandate bounds what** (GM-D87). Both are needed; neither implies the other.

Reading the pool as a grant would substitute a spend limit for a blast radius — which is the one error in this memo, and it is worth the space because it is an attractive one.

## 3 · The first mechanism here that does what insurance does

Levels, gates and derivations are **underwriting** — assessment. That is one half of insurance, and [document 00](what-this-is.html) removed the money, which appeared to take the other half with it.

**It did not.** Pooling is variance absorption across a population, and money is only its commonest denomination.

> **A token pool is risk pooling in a currency that is not money** (GM-D88) — no carrier, no capital, no authorisation, and structurally the thing insurance does.

And the memo states the underwriting problem in one line: *it's okay to have one out of 100 to have a spike, but it's not okay to have 100 having the spike.*

**That is correlated risk with a concrete instance at last.** [Document 01](the-rating.html) §5 says *micro risks do not add* and admits the rule is *"stated here as a rule and is not implemented."* Consumption implements it: a per-placement time series, from which correlation between placements is directly computable.

**And agent spikes would correlate**, for reasons the graph already models — a shared prompt template, a shared model version, a shared upstream failure sending every agent into the same retry. A pool sized for one-in-a-hundred and hit by a hundred fails on the day it is needed.

## 4 · This is the loss data the pivot has never had

[Document 08](the-world-model.html) records the gap plainly: the claim is *"a statement — `loss-event/v0`, still undrafted, and the one primitive the whole pivot lacks."*

**A budget overage is a loss event**, and unusually it is one nobody here has to instrument:

| What a claim needs | Where it already is |
|---|---|
| An event that happened | The overage |
| A quantity | Tokens, exact |
| A date | The meter's |
| An insured | The placement |
| An independent record | **The supplier's invoice** |

> **`loss-event/v0` can be drafted against a real instance rather than an imagined one** (GM-D89).

This folder has said since [document 01](the-rating.html) that no agent loss data exists anywhere. **That is true of financial loss and false of consumption** — and consumption is loss data in a currency the estate can observe without anyone's permission.

## 5 · Three things this unblocks

**GM-D78's collision dissolves.** [Document 10](the-schemas-and-the-clocks.html) recorded that a usage-boxed policy *needs an in-line counter, which this project is not*, and filed the collision as the finding. **The counter exists and somebody else runs it** — every token is metered for billing whether or not anybody insures anything. Reading a meter that exists for commercial reasons breaks nothing: we are not in the line, we are reading the invoice (GM-D90).

**Document 07's first mover is found.** [Document 07](the-policy-as-a-statement.html) §7: *"The hard part is not the mechanism, it is who checks first. The handshake needs a relying party with a reason to refuse, and no external platform has one today."*

> **The resource supplier has a reason to refuse: it is paying** (GM-D91). The first candidate in eleven memos that did not have to be argued into caring.

**And the tier is easier here than anywhere else.** [Document 05](not-in-line.html) established this project can never itself be a boundary; document 07 found one only under a condition. **A meter has a natural home outside the agent** — the party supplying a resource is by construction not the party consuming it — so where the supplier enforces the limit, the agent cannot reach the accounting.

**With the condition stated**, because a tier is always a property of the relationship:

| Who holds the meter | Tier |
|---|---|
| The agent, in its own config | **Setting** — inside the grant it bounds |
| A warning at 80% to somebody who may be asleep | **Expectation** |
| The supplier, refusing at the point of supply | **Boundary** |

**Same policy, three tiers**, decided entirely by who holds the meter.

## 6 · The only warranty that cannot fail the unknown way

[Document 10](the-schemas-and-the-clocks.html) defines a warranty as a fact plus a maximum age, failing three ways: false, stale, or **unknown** — with unknown counted as failure, because for cover, assuming presence manufactures liability.

A budget condition is a warranty of a different shape — **a fact plus a threshold** — and it has a property none of the others do:

> **`remaining > 0` cannot be unknown** (GM-D92). The meter is authoritative and continuous, so the condition fails one way only.

Which makes it the **cheapest per-action check in the pivot**: a subtraction, where document 10's backup warranty needs an evidence lookup. The per-action gate that document names as the top of the climb is affordable here in a way it is nowhere else.

## 7 · The structure is excess-of-loss, and the memo names three of its four parts

**A pool without a per-member draw limit converts one misbehaving agent into an outage for all of them.** If one runaway drains the pool, every member loses its licence, including the ninety-nine that behaved — [document 06's](the-broker-market.html) shared-fate problem with a much shorter fuse.

Insurance solved this centuries ago, and the vocabulary transfers without adjustment:

| Insurance | Here | The memo's words |
|---|---|---|
| **Deductible / excess** | The agent's own budget, spent first | *on average, 20k, 30k tokens* |
| **Limit per occurrence** | Most any one agent may draw in a spike | *up to a certain amount* |
| **Aggregate limit** | The pool | *underwrites a million tokens* |
| **Attachment point** | Where the pool starts paying | *gives you this buffer when you need it* |

> **The memo has described an excess-of-loss treaty** (GM-D93) — and the per-occurrence limit is the component it does not name and the one that stops the outage.

## 8 · The generalisation, and the boundary the memo does not draw

*You could apply this to almost anything* is right, and the abstract shape is good: an asset, a defined scarcity of its use, a buffer around it, distributed across players. Compute-seconds, API calls, egress, storage — and money, the instance everyone already calls insurance.

But *almost anything* goes wrong at the fifth application:

> **The shape applies to a resource metered by somebody who is not the consumer, fungible, and depleting** (GM-D94). All three, or it is not a pool.

| | Tokens | Repository write access |
|---|---|---|
| Metered by a non-consumer | Yes | No |
| Fungible | Yes | **No** — the release repository is not a scratch repository |
| Depleting | Yes | **No** — using it does not consume it |

**Capability fails two of three**, which is why the grant tree needed different machinery and why §2's separation is structural rather than fussy.

## 9 · Two hazards, sharper here than anywhere else in this folder

**Classical moral hazard arrives.** [Document 02](the-ecosystem-and-the-gate.html) — as corrected — says stage 1 escapes the payout channel because there is no payout. **A pool is a payout.** An agent covered by a buffer has less reason to be efficient, which is exactly what a deductible exists for, and §7's structure already contains one.

**And the currency becomes worth gaming.** Stage 1's quasi-currency was points nobody wanted. **Tokens are wanted.** If a better level buys a larger allocation, the incentive to declare favourably stops being theoretical.

> [Document 00's](what-this-is.html) *a level is never declared, only derived* stops being hygiene and becomes the control holding the whole thing up (GM-D95) — and the [two-channel rule](the-rating.html) becomes an anti-fraud mechanism, the same upgrade GM-D73 made for non-disclosure.

## 10 · What this is not: rate limiting

Every platform already caps consumption, so this objection comes first.

**A rate limit is a per-agent ceiling set by somebody who cannot tell a legitimate spike from a runaway** — so it is set low enough to be safe, and therefore low enough to kill the one-in-a-hundred case the memo is explicitly protecting.

> **The pool is what a rate limit cannot be: permissive per agent and bounded in aggregate.** The buffer is the entire product.

## What this does not prove

- **That any pool has been built or run.** Nothing here is implemented. The estate has never metered its own consumption, and the first honest step is to do that before designing a policy over it.
- **That agent consumption actually correlates.** §3 argues it would, and names plausible shared causes. **It is a hypothesis, and it is the one the data would settle first** — which is the strongest reason to run this before designing around it.
- **That the pool holder can be found.** §5 argues the supplier is the natural relying party. No supplier has been asked, and a supplier's interest in refusing is an interest in *its own* limit, not in anybody's policy.
- **That consumption loss data transfers to capability loss data.** §4 supplies loss events about *spend*. Nothing here produces a single data point about what a breach costs, which is the quantity a stage-2 premium would need.
- **That the excess-of-loss numbers can be set.** §7 gives the structure. Sizing a deductible, a per-occurrence limit and an aggregate needs the consumption distribution nobody has measured yet.

---

*CC BY 4.0. Source: brief v0.33.83, memo 11. Everything here is derived from that memo and labelled where it extends it — including §2, which corrects it.*
