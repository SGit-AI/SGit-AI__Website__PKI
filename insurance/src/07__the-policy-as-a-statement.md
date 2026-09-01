# The Policy As A Statement: The Handshake, And Where The Boundary Finally Sits

*Doctrine document 07. Derived from memo 7 ([brief v0.33.78](../briefs/v0.33.78__strategy-brief__the-policy-is-a-signed-statement-and-the-relying-party-is-the-boundary.md)). Proposed, not adopted: GM-D62 to GM-D66 await the project lead. **This document resolves the limit recorded in [document 05](not-in-line.html) §2.***

---

## 1 · A policy is a mandate-shaped statement

*A policy becomes a signed document* is more tractable than it sounds, because the shape already exists in the register:

| | A **mandate** says | A **policy** says |
|---|---|---|
| issuer | who authorised | who rated or underwrote |
| subject | the agent placement | the same placement |
| scope | capability on resource, with constraints | the level, and what it is contingent on |
| interval | valid from → until | the cover period |
| revocation | an append to the issuer's record | an append to the issuer's record |
| signature | raw r‖s over the canonical form | the same |

> **`policy/v0` is a mandate-shaped statement issued by a rater rather than an operator** (GM-D62).

Which answers the open shape question with **no new register machinery**: one more statement `type` beside `identity`, `mandate`, `acceptance`, `revocation` and `grant`. The [record pages](../registry/index.html) would render it the day it existed.

## 2 · A policy does not sign — its subject does

Two mechanisms hide in *"can you sign it for me using this?"*, and separating them prevents designing a confused object:

- **A policy is signed** by its issuer, which makes it verifiable.
- **A holder signs a request**, proving possession of the private half of the identity the policy names as subject.

**The policy never signs.** A key signs; the policy establishes what that signature is *worth*. The corpus stated this on 19 August, before any of the insurance work:

> **"A signature proves possession of a private key and proves nothing about trustworthiness."** Trust is a policy decision made afterwards, and conflating the two is the most likely way to misread any of this.

**Memo 7 describes exactly that afterwards** (GM-D63). So the handshake is three checks, all of which the register already answers:

1. **Is this the subject?** — the signature verifies against the identity's published key.
2. **Is a policy in force for that subject?** — a statement with an interval and no revoking append.
3. **Does its issuer mean anything to me?** — the relying party's own root decision, which the register deliberately makes for nobody.

## 3 · The relying party is the boundary

[Document 05](not-in-line.html) recorded a hard limit: a party outside the line cannot enforce, so **this project can never itself be a boundary** — only ship a check that becomes one when somebody in line installs it.

**Memo 7 names who installs it.** *I'm only going to give you the data if you have a policy* puts the check in the **relying party** — the system being asked — and a relying party is **by construction outside the requesting agent's grant**. It holds the data; the agent cannot reach in and disable its check.

> **The policy handshake is the first mechanism in this pivot that can reach tier `boundary`** — and it gets there without this project standing in the line, because the enforcement point is the counterparty (GM-D64).

**With its condition attached**, because the tier is always a property of the relationship: it is a boundary only where the relying party is genuinely independent of the requester. An internal service enforcing a check on an agent run by the same team, on infrastructure that team administers, is back to a **setting**.

## 4 · Trust is a path — and the corpus said it first

*It's whether when I need to verify something, there is a path* restates the registry pivot from oracle to graph. **The corpus published the same sentence on 27 August:**

> **"trust is a path and revocation is that path no longer existing"**

Memo 7 arrives at it from the insurance direction and adds *revocation by removing the link* — the same statement about the same object. **Two independent derivations four days apart**, which means the policy layer needs no new trust model: it is the one the registry pivot already adopted, with one more node type on the path.

The fractal claim follows without strain. **Policies of policies is a path with more hops** — an internal regime rolling up into one external signature is a subgraph summarised by an edge. And *manual processes that get correlated* enter as **declared** facts under [document 01's](the-rating.html) two-channel rule, and must be marked, or the roll-up launders them.

## 5 · Ten minutes is a ceiling, not a promise

The corpus already named the quantity that bounds a fast-revocation clause, in the observability brief of 20 August:

> **revocation propagates only at the rate relying parties check, which makes the interval between a party's checks its effective revocation latency** — computable per party and per mandate before anything is ever revoked.

So a policy promising revocation in ten minutes delivers ten minutes **only to parties who check that often.** To a party caching for a day it is a one-day promise wearing a ten-minute label.

> **A revocation SLA states the required check interval, or it is a hope with a number on it** (GM-D66).

**And the handshake is the fix.** A relying party verifying **on every request** has a revocation latency of one request — the shortest achievable. That is the strongest argument for the handshake design and memo 7 does not make it: the handshake is not only how you check, **it is what makes fast revocation mean anything.**

Two conditions stay open and are already-recorded gaps: the trigger needs [document 03's](who-pays-and-the-moving-rating.html) world-state feed and its event-to-grant-node mapping, which exists nowhere; and the ten minutes is a claim about the *issuer's* reaction time, which nothing measures.

## 6 · Metering verification: a business model, and three hazards

Charging for the check is real, and the estate's observability design anticipated the whole surface.

**A verification is not a use.** A resolver walking a chain generates an event with no usage behind it; a relying party that never bothers to verify generates nothing at all. **The metric is a verification graph, and the silent case is the dangerous one** — the most valuable output is not the checks recorded but *the parties holding a policy who have never once checked it.*

**Metering means the provider learns who checks what, when.** The corpus settled where such events belong precisely to avoid this: a central check log *accumulates who is evaluating whom across parties that never consented*, whereas a check event written by the checker into the **issuer's own lane** is an owner observing their own asset.

**And pricing a check discourages checking.** Rational relying parties would cache, batch and skip — raising the revocation latency §5 says the handshake exists to lower.

> **A per-verification price is a tax on the behaviour the system most wants** (GM-D65). Price by seat, policy or period.

## 7 · The operating licence, and who checks first

*Without that, we cannot operate* is the clearest existing analogue for a gate that **stops work rather than reporting on it** — regulated firms cannot trade without cover; contractors cannot start without certificates. It is why the pattern is culturally legible to a business in a way a security score is not.

**The hard part is not the mechanism, it is who checks first.** The handshake needs a relying party with a reason to refuse, and no external platform has one today.

| First relying parties | Why they would check |
|---|---|
| **Internal services** in one organisation | The organisation sets its own rule — [document 01's](the-rating.html) internal marketplace with the handshake as its enforcement, needing nobody else's cooperation |
| **A broker** | Self-protection: its own policy ([document 06](the-broker-market.html)) is exposed to what it lets through |
| External platforms | **Not yet.** No incentive exists |

## What this does not prove

- **That the handshake is a boundary anywhere today.** §3 gives the condition — genuine independence between relying party and requester — and nothing has been built or installed to test it.
- **That ten-minute revocation is achievable.** §5 shows it is bounded by check interval, and the trigger needs a world-state feed that exists nowhere for anybody.
- **That anyone will be the first relying party.** §7 argues internal services and brokers have reasons; neither has done it, and the pattern needs an adopter before it is a pattern.
- **That a policy provider can meter without surveilling.** §6 states where check events belong; whether a commercial provider would accept writing them into somebody else's lane rather than its own log is untested and against its short-term interest.

---

*CC BY 4.0. Source: brief v0.33.78, memo 7. The three corpus quotations are verbatim and were re-read out of the briefs they name.*
