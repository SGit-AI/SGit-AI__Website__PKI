# The Enforcement Ladder: Six Levels, A Measured Assurance, And A Catch Above The Hook Is An Incident

*Doctrine document 13, from memo 13 ([brief v0.33.85](../briefs/v0.33.85__strategy-brief__the-enforcement-ladder-six-levels-a-measured-assurance-and-a-catch-above-the-hook-is-an-incident.md)). Proposed, not adopted: GM-D104 to GM-D108 await the project lead. Built the same day into [the insurance ecosystem pack](../packs/insurance-ecosystem/index.html): a revised policy, a level on every event, a reconciliation job, a room card.*

---

## 1 · Six levels on three tiers

[Document 05](not-in-line.html) scores a control by one question: is it enforced by something the grant does not include? Memo 13 walks one policy up every place it could be enforced, and the walk lands on that test:

| Level | Enforced by | Tier | Here |
|---|---|---|---|
| 0 — nothing | nobody | — | before 26 August |
| 1 — the prompt | nobody | expectation | the briefing a session reads at start |
| 2 — a skill, a system prompt | nobody | expectation | the push-policy skill; the advisory `PreToolUse` hook |
| 3 — a hook, a pre-action script | the tool, inside the grant | **setting** | `pre-commit`, `pre-push`, the push check |
| 4 — the destination | a party the agent cannot reach | **boundary** | CI on the pushed ref; a host rule |
| 5 — out of band, after the fact | a replay of what actually happened | **detection** | `reconcile.py` |

> **The levels are the tier test refined, and level five is a tier the test had not named: it does not prevent, it finds out** (GM-D104).

The memo's instinct that a skill outranks a prompt is right for a reason the tier test cannot see: not enforcement, but how reliably an agent complies. That is a measurement, and §2 is about it.

## 2 · Assurance is a number, and the ledger already has it

*"Every one of these layers, in principle, has a level of assurance … over time, we can measure, even on normal usage, what happens."*

Every event in the pack's ledger now carries the level that produced it. The catch rate per level on ordinary work — what level three refused, what level four caught that three let through, what five found that nobody refused — is a derivation from files, in the room's sixth card.

> **Assurance per level is measured from the ledger's catch rate on ordinary work, never asserted** (GM-D105). A prompt's worth is a number, and until the number exists the prompt is worth what the tier test says: nothing.

## 3 · A catch above the hook is an incident

*"If we ever detect any of these breaches of our policy on the server side, then we know that something is seriously wrong."*

The pack had treated a setting as a weaker boundary. The memo makes it a **detector**: a refusal at level four of something level three should have refused means the hook was bypassed, uninstalled, or edited. That is not a volume event. It draws nothing, because the pool is for volume and this is not volume; it is a different policy with no buffer; and it is the third response in the [architecture brief's](../documents/insurance-is-junes-underwriting.html) repricing table — suspension, the loss of the licence to operate, pending an explanation.

> **A catch at a level above the one that should have refused is an incident: no draw, a different policy, an escalation, and a candidate for suspension** (GM-D106).

Client-side enforcement is limited and it is a great signal, in the same sentence: its failure is what the higher level detects.

## 4 · Level five was the cheapest strong control the pack did not have

A hook is bypassed with one flag. The maintainer run recomputed balances from the ledger and never looked at git. The replay the push checker already had is level five: for each commit, is the claim the hook should have written in the ledger, and does the commit's weight agree with it? **A commit that carries no claim is the detection**, because the hook stages its claim into the commit it describes (IE-D12).

Run on 3 September over the eleven commits since the hook was installed: **eleven checked, no catch.** And the same morning's release showed levels three and four working in one afternoon — the hook refused the oversized commits, and the destination's validator caught a broken link the client side could not see, because the file existed locally and was ignored by git.

> **Out-of-band reconciliation against the system of record turns a setting into a detector, and it is the maintainer's job** (GM-D107).

## 5 · Start small: the adoption ladder beside the build order

*"You can start using our solution with a simple skill, which we can publish."* The kit exists: the push-policy skill, two hooks, an evaluator. What the memo adds is the order somebody outside this estate would take — prompt, then skill, then hook, then a destination check, then reconciliation — each a step that needs nothing above it. On standards: SLSA is the published model of numbered assurance levels; the pre-commit framework is how a hook is conventionally shipped; rulesets and required checks are the destination; Cedar is already adopted.

## 6 · The default-deny list already exists, from the other side

The mandate stores the allow-list and renders the prohibitions from its complement ([the sibling pack, document 02](../packs/grant-and-mandate/schemas.html)); the measured grant per platform is *the limitations of the platform made visible*. The GitHub deny list the memo asks for is that rendering, published as a worked example.

## 7 · Naming

*Agent policies* collides with IAM and OPA; *agent insurance policies* borrows the regulated word [document 04](why-insurance-and-what-broke-it.html) warns against, since stage one transfers no risk. The object is a **policy**; the ladder is **the levels of enforcement**.

> **The object stays *policy*; the ladder is *levels of enforcement*; the product name is the project lead's** (GM-D108).

## What this does not prove

- **That the catch rate means anything yet.** One policyholder, one day, no catch: the number exists and is zero.
- **That level five catches a careful adversary.** It catches a missing or mismatched claim; a bypass that forges a plausible claim needs the lane, where the writer cannot read.
- **That level four refuses.** The destination check runs in report mode; making it required is the issuer's decision.
- **That the levels are the right cut.** They are the memo's; SLSA's are similar in shape and different in vocabulary.

---

*CC BY 4.0. Source: brief v0.33.85, memo 13. Everything here is derived from that memo and labelled where it extends it.*
