# The MVP: Build The Branch Constraint First, Because It Demonstrates The Whole Thesis In An Afternoon

**pack** Grant and Mandate · draft-1 · 26 August 2026
**role** Scope, build order, the acceptance test, and what is deliberately excluded. The first artefact is small on purpose: a mandate that becomes mechanical, in a hook that already exists.

---

## Build order

Ordered so the first step ships something real and each later step depends only on earlier ones:

1. **The branch constraint in an existing hook.** One afternoon. It takes the measured finding — *the branch constraint is prose, the push is enforced* — and closes it: one added test in a session-end hook that already reads the branch, refusing on any branch outside the mandate. It produces the first case where a declared mandate became mechanical, and it demonstrates the whole thesis end to end: here is a mandate, here is the grant it does not cover, here is the delta, here is the delta closed by an enforcement point that already existed.
2. **The grant measurement**, for one environment, generated with provenance and tiers, dated. Done for one already — [the first library entry](../library/claude-code-remote__ccr-container__2026-08-26.json).
3. **The two schemas**, written down, with the delta computed rather than stored. Drafted in [document 02](02__schemas.md).
4. **The mandate for that same environment**, authored, in prohibitions, with the allow-list stored.
5. **The skill** — discover, declare, diff — refusing to enforce.
6. **The compilation target** — the allow-list to Cedar, at which point the mandate becomes evaluable outside the agent's loop.

## The acceptance test

> Run the skill in a fresh environment. It produces a **dated grant document nobody wrote**. Author a mandate that is deliberately narrower. The delta is **non-empty and specific**. Compile one line of it into the existing hook. **Then attempt the prohibited action and be refused by something that is not the agent.**

The last sentence is the whole thing, and until it passes everything above is instrumentation. The agent-path variant of the test is [in document 04](04__workflows.md): the same sequence with no page read by a human anywhere in it.

## What ships where

The pack draws a hard line, and it is the architecture:

| Ships in the **registry** (pki.sgit.ai) | Ships in the **risk product** (riskmandate.ai) |
|---|---|
| The library: measured grants, dated, no personal data | The instance: selections, mandate, deltas, risks |
| The two schemas and the drift gate | The screens, the pack export, the risk derivation |
| The measurement method, published so anyone can re-run it | Everything personal, never published |

This pack builds the left column and specifies the right one. The risk derivation — turning a delta into risks at each altitude, with the plug profile (who holds the stop, blast radius, speed, side effects, recoverability) on each — is RiskMandate's, and it sits at the *end* of the chain, after the delta, never at the start.

## What is deliberately excluded

- **The risk register.** Reality, facts, delta — then risks, downstream, in the risk product. A risk-first flow is out of scope by construction.
- **A new policy language.** Cedar is adopted; inventing one is excluded.
- **An identity design.** Cedar does not do identity; that is the registry's job, already shipped.
- **A hand-written grant.** A typed grant is a wish; only measured grants enter the library.
- **An enforcement skill.** The skill compiles; the hook and Cedar enforce.
- **A census.** Every grant is a floor, marked as such, and the blind-spot delta is what measures the gap.
- **A wallet.** The word is taken by the payments work and promises a held-credential model this design does not use.

## Open questions the MVP does not close

| Question | Notes |
|---|---|
| Who measures a library entry, with what authority? | The candidate is an agent inside the environment — the party being measured. Hence *floor, not census* |
| How often is an entry re-measured? | It is a dated claim about somebody else's product; it ages on their release schedule |
| Does the instance record which library version it used? | Otherwise a user returning next month cannot tell whether their setup changed or the library did |
| What exactly is the history-window field? | Retention differs per product and per plan, and the grant's meaning turns on it |
| Where does the pack live once built? | Browser, vault, or file — and only the vault survives a device. The sgit vault is the natural home, offered not defaulted |
| Is the blind-spot number published per agent? | It is a vendor comparison whether or not it is framed as one |
| Can a hook read a mandate file it does not trust? | The hook is the enforcement point, so the integrity of what it reads is the whole question — and the registry is what makes the mandate checkable |

## Honest tensions

| Tension | Note |
|---|---|
| The branch constraint first | It is the smallest real thing and it works only where somebody controls the environment — the population that needed it least |
| Adopting Cedar | Saves inventing a language; binds the format to somebody else's roadmap |
| Grant by measurement | Honest, and a floor — an agent cannot enumerate what it does not know it has |
| The skill that refuses to enforce | Correct, and the first thing somebody will try to make it do |
| A design pack ahead of a built product | The registry half has one measured entry and a shipped register underneath; the risk half is specified, not built — and the pack says so |

---

*Added after publication, 26 August 2026. No claim above has been changed. Later material that bears on this document:*

- `07__enforcement.md` — **build-order step 1 is built and its acceptance test has been run.** A push to a branch the mandate does not permit was refused by git, `origin/dev` was unchanged, and a permitted push in the same minute succeeded. The constraint reached tier **setting**, exactly as predicted, and not boundary — the hook is inside the grant it bounds. Steps 2 and 3 are also done (the measurement tool, and the two schemas); steps 4–6 (a mandate per environment, the skill, the Cedar target) remain
- The same document records the finding that the control **refused the release that was carrying it**, and that the correct remedy was the issuer amending the mandate rather than any bypass — which is what a mandate is for, and is only visible once the constraint is mechanical

---

*CC BY 4.0.*
