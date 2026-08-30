# What This Is, And The Rule It Runs On

*Doctrine document 00 of the insurance body of work. Derived from memos 0 and 1. The memos are the source; where this document and a memo disagree, the memo wins and the disagreement belongs in change control.*

---

## The body of work

A pivot recorded on 30 August 2026 moves the foundation of the risk approach from **risk acceptance** to the **insurance policy**, on one observation: the delta between what an agent *can* do and what it is *authorised* to do — grant minus mandate — is where the insurance lives. Eight memos are being recorded on it. This folder is where they are read into something buildable.

It is organised as this estate organises everything else. **The memos are filed verbatim as briefs before they are read**, because a transcript outranks any summary of it. **The doctrine here is derived from them and names which memo it came from.** A memo not yet recorded is listed as awaited, never guessed at.

## Two stages, and only one of them is insurance

The single most consequential thing in memo 1 is that it **separates the rating from the money** — and in doing so removes the blocker memo 0 had called fatal.

| | Stage 1 — the rating | Stage 2 — the policy |
|---|---|---|
| What it produces | A **level**, and the derivation behind it | A premium, and a promise to pay |
| Risk transferred | **None** | To a carrier |
| Regulated activity | **No** | Yes — authorisation, capital, conduct rules |
| Needs loss history | **No** — a relative ordering needs no absolute scale | Yes, and none exists for agents anywhere |
| Buildable by this estate | **Today** | Not by this estate, and not soon |

**Everything in this folder is stage 1.** Calling it insurance would be the first dishonesty: it transfers no risk and promises no payout. What it does is tell an operator that *this* placement is several levels worse than *that* one, and which single change moves it — which memo 1 names as the actual goal: *to allow companies to know the risks that they're buying and to allow them to focus their efforts.*

## The rule

Memo 0's argument for the whole pivot was that **money keeps a claim honest**: an acceptance can be a signature over an exposure nobody measured, but somebody loses money if a priced measurement is wrong. Memo 1 takes the money out. That is a real contradiction, not a refinement, and it needs an answer rather than a smoothing.

The answer is the rule this folder runs on:

> **A level nobody can recompute is exactly the theatre a premium would have prevented.**

So: **every rating is computed from published evidence and ships its derivation.** Not a score handed down, but a walk somebody else can repeat and disagree with — the same discipline that makes the register publish its expected verification answers as data and reproduce them on every release. Money is one way to make a claim honest. A reproducible derivation is another, and it is the one available now.

A corollary, because an internal market with a free currency invites gaming more than money does: **a level is never declared, only derived.**

## What is already built that this consumes

Nothing here starts from scratch. The rating's inputs are documents this estate already publishes:

| Rating input | The artefact it reads | Where |
|---|---|---|
| What the environment can reach | The **measured grant** — the twin | [library entries](../packs/grant-and-mandate/library.html) |
| What was authorised | The **mandate** — issuer, subject, scope, interval | [mandates](../packs/grant-and-mandate/mandates/current.json) |
| The exposure being rated | The **delta** — grant minus mandate | [excess-authority view](../registry/views/excess-authority.json) |
| Whether a control is real | The **enforcement tier**, computed against the tree | [the workbench](../workbench/index.html) |
| Whether the reading is current | The twin's **age** | printed on every evidence pack |
| Whether the identity means anything | The **fixture-or-real class**, read before any signature | [the register](../registry/index.html) |

## What this does not prove

Carried here rather than appended, because a page that omitted these would be doing the thing the rule forbids:

- **That any of this is insurance.** It emits a rating, transfers no risk, promises no payout.
- **That the placement orderings are true.** Memo 1 rates Claude-on-a-desktop above Claude-on-the-web; that is the project lead's judgement, and **nobody has measured a desktop agent**, so the estate cannot score its own leading example.
- **That a level means the same thing to two organisations.** Nothing is calibrated against loss data, because no agent loss data exists.
- **That aggregation works.** Correlated risk is named as a graph problem in document 01 and is not solved. Summing micro ratings would be wrong in the dangerous direction.

---

*CC BY 4.0. Sources: briefs v0.33.71 and v0.33.72; this repository at v0.1.51.*
