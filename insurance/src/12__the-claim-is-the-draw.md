# The Claim Is The Draw: Money As A Metric, And The First MVP

*Doctrine document 12, from memo 12 ([brief v0.33.84](../briefs/v0.33.84__strategy-brief__the-claim-is-the-draw-money-as-a-metric-and-a-push-budget-claude-can-run-today.md)). Proposed, not adopted: GM-D97 to GM-D103 await the project lead. **This is the first doctrine document with a build behind it**: [the push policy](push-policy/index.html).*

---

## 1 · The money was always a metric

[Document 11](the-resource-pool.html) said a token pool is *risk pooling in a currency that is not money*. Memo 12 says what the currency is, and why:

> *what is the money used for when you get the claim? … insurance money is paid using tokens, is paid using access grants, is paid using bandwidth. Then we pre-approve the amount that gets paid.*

**The money in a policy is a proxy for what the claim buys. Pay the claim in the thing itself, and the proxy disappears.** In this stage there is nothing to convert: the pool is denominated in the resource, the draw is paid in the resource, and the payment is permission to proceed.

| In insurance | Here |
|---|---|
| A loss occurs | A push is over the normal band |
| A claim is filed | The check runs |
| The claim is adjusted | A subtraction: excess against pool |
| The claim is paid | **The excess is drawn, and the push proceeds** |
| The claims file | The ledger |

> **A draw on the pool is a claim, paid in the resource, settled by the check itself** (GM-D97).

## 2 · Why a claim settles in milliseconds

A carrier's claim takes weeks because the trigger, the cover and the payment are three parties' documents, reconciled by people. Here they are three fields of one document, read by one function.

> **The speed is a property of the mapping, not of the software** (GM-D98).

The memo's stronger claim, that ordinary insurance would be faster with the same clarity, is right, and it is the same argument as why this stage needs no carrier: **nothing here waits on anyone.** [Document 10](the-schemas-and-the-clocks.html) named the per-action gate as the top of a climb and worried about its cost; this is that gate, and it costs a subtraction.

## 3 · The policy, with all four parts, twice

Document 11 said the memo before it named three of the four parts of an excess-of-loss structure. **Memo 12 names all four, for two resources:**

| Part | Pushes, own branch | Pushes, dev | Bytes per push |
|---|---|---|---|
| Deductible — the normal band | 10 a day | 3 a day | 50 KB |
| **Per-occurrence limit** | — | — | **300 KB** |
| Aggregate — the pool | 20 | 10 | **1 MB a day** |
| Interval | a day | a day | a day |

The numbers are the project lead's and are placeholders (§5). The 300 KB is the memo's figure; a message the day before said 250 KB, and the policy records the difference rather than choosing silently.

## 4 · The pool is shared, and pooled fate is policy

*"After three or four agents use 250k each, we don't have a policy any more."*

**The pool is per repository, not per agent.** The ledger lives in the repository, so every agent pushing to it draws from the same megabyte. That is document 11 §3's correlated spike with a mechanism, and it turns document 11's shared-fate warning into a deliberate design:

> **When the pool is out, nobody pushes. The per-occurrence limit is what stops one agent spending it alone** (GM-D99).

## 5 · The ledger is the loss data

*"This then has feedback loops. We learn."* The ledger the check appends to is exactly what [document 11 §4](the-resource-pool.html) said the pivot had never had: dated, quantified, attributable, and measured by git rather than declared by anyone.

> **The policy's numbers are placeholders until the ledger can re-fit them, and the checker's replay of history is the first fit** (GM-D101).

## 6 · "Let Claude manage this" is a setting, and it says so

The memo asks for a skill, run by the agent on itself. Under [document 05](not-in-line.html)'s test that is a **setting**: the check runs where the agent runs, against a ledger the agent can edit. It is above an expectation and below a boundary, and **the skill says so on its own face**, as GM-D42 requires of any gate.

| Who runs the check | Tier |
|---|---|
| The agent, on itself, from a skill | **Setting** — this MVP |
| A pre-push hook in the agent's own clone | Setting — the hook is the agent's to edit |
| A required CI status, or a host push rule | **Boundary** — same policy, same arithmetic, a party the agent cannot reach |

> **The skill is the first rung of a ladder whose upper rungs already have a shape** (GM-D100). Moving up is not a better skill; it is the same `policy.json` read somewhere the agent cannot reach.

## 7 · The measurement, and what it is not

The checker counts the uncompressed size of objects reachable from the agent's head and not from the remote: what git would have to send. git packs and compresses on the wire, so the transfer is smaller, often much smaller for text.

> **The number is a floor on what the agent is asking to send, not a bill** (GM-D102). Wire bytes belong to the host's meter, which is the supplier's boundary of document 11 §5.

## 8 · What it found first: this estate

The checker replays a branch's history as if each commit had been a push. Before this document existed it was run against the last twelve releases on `dev`:

| Releases | Bytes to push | Verdict |
|---|---|---|
| v0.1.53 – v0.1.60, one day | 3.0 – 3.8 MB each | **refused**, 10–12× the per-push maximum |
| v0.1.61, the insurance book | 13.1 MB | refused, 43× |
| v0.1.62 – v0.1.64 | 4.2 – 4.7 MB each | refused, 14–15× |
| two non-release commits | 30 KB · 114 KB | normal · drawn, 63 KB |

**Twelve of twelve releases refused.** The cause is `chrome.py`, which stamps the version into every page on every release, so a one-line change ships 180 changed files. The memo describes this exactly — *a cost paid continuously by every developer, every push* — and the memo is right:

> **A release that touches every page is a policy breach in slow motion. The policy is not mis-calibrated; the estate is** (GM-D103).

So the hook is shipped and **not installed**. Installing it today would block every release until the release stops touching every page — a change worth making, and a separate one.

## What this does not prove

- **That the numbers fit.** They are the memo's. The one fit available says the estate breaches them on every release, and §8 argues the estate is wrong rather than the numbers; that is an argument, not a calibration.
- **That the check is a boundary.** It is a setting, by construction and on its face. Nothing here stops an agent editing the policy, the ledger or the skill.
- **That bytes before the push are the cost.** They are a floor. The bill, if there is one, is the host's.
- **That anyone but this estate has run it.** One repository, twelve commits replayed, zero live pushes checked at the time of writing.
- **That a per-repository pool is the right unit.** The memo implies it; a per-organisation pool or a per-agent one are both constructible from the same ledger and neither has been tried.

---

*CC BY 4.0. Source: brief v0.33.84, memo 12. Everything here is derived from that memo and labelled where it extends it — including §8, which is a measurement of this estate, not a position.*
