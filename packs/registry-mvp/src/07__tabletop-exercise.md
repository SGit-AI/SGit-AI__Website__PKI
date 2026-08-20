# 07 — Tabletop Exercise

**pack** Registry MVP · draft-1 · 20 August 2026
**role** The registry walked through on paper before it is walked through in code: four participants, a timeline, six injects, and the expected outcome for each — including the four rules meeting their first population.

---

## Why a tabletop, for a thing this small

Three reasons. The registry's failure modes are **procedural, not cryptographic** — the crypto is settled, and what fails is who wrote where, who checked what first, and what a verifier does when a check fails; those are exactly what a tabletop surfaces. The four published rules **have never met an entry** — the v0.33.61 access report's point that four rules with no records are four assertions — and a tabletop is the cheapest first population of all: an imagined one, run honestly. And every participant can literally be an LLM session, so the tabletop script *is* a rehearsal of the phase-4 demo, runnable today with fixtures and paper.

## Participants

| Seat | Runs | Holds | May not |
|---|---|---|---|
| **Operator / Issuer** | The processor runbook; issues mandates | enum_key, registry write key, issuer key | Write a statement the rules reject |
| **Agent** | Enrolment and acceptance | Its own keypair, an enrolment token | See anything but public URLs and the blind ack |
| **Verifier** | The full verification walk | Nothing — public URLs only | Trust the index, or read a signature before the fixture flag |
| **Red** | The injects | Whatever the inject says | Break cryptography — every inject uses legitimate mechanisms |
| Facilitator | The clock and the log | The inject cards | Answer questions the published pages should answer — every such question is a **finding** |

**The facilitator's rule is the sharp one.** The pack's thesis is that the documentation is the client. So any point where a participant must ask a human something the pages do not answer is logged as a documentation defect — the tabletop tests the pages as much as the design.

## Baseline timeline

| T | Step | Exercises |
|---|---|---|
| T0 | Operator publishes `roots.json`, `params.json`, its own record | Rule 4; the June rule that a register holds no private material |
| T1 | Agent generates a keypair; builds and signs the canonical enrolment statement | Canonicalisation recipe; nonce-inside-payload |
| T2 | Agent posts through the lane; receives `{"ok":true}` | The narrow door; blind ack — Agent must *not* be able to say whether it was accepted |
| T3 | Operator runs the processor runbook; commits identity; regenerates index | Rule 1 as key custody; processor-as-policy |
| T4 | Agent discovers its own recognition via the public read path | The outcome channel is the read path |
| T5 | Operator appends a mandate to **its own** record; Agent appends acceptance to its own | The C5 rule; the five mandate fields, interval included |
| T6 | Verifier runs the full walk and states: subject, capability, until, on whose authority | D5; partial resolution as a legitimate output |

## The injects

**I1 — Revocation mid-exercise.** After T5, the Issuer revokes the mandate with `effective_from` one hour ago. *Expected:* Verifier's answer flips to a refusal citing the revocation and its date; the T6 answer remains historically checkable ("was it valid yesterday?" — yes). *Tests rule 2, and the effective_from semantics.*

**I2 — Write into another's record.** Red submits a well-signed statement whose `subject` is the Agent's record but whose signer is Red. *Expected:* the processor rejects it; the validator would flag it if committed. *Tests rule 1 — the keyserver failure replayed as a card.* The interesting question for the log: does the *rejection* leave any public trace, and should it?

**I3 — The flood.** Red submits 300 valid junk enrolments, and separately pads one record toward the size bound. *Expected:* the lane absorbs the junk (a queue that needs draining — the designed blast radius); the record hits the bound at 256 statements/512 KB and the processor refuses further appends. *Tests rule 3, and produces the first evidence for whether the proposed numbers are right.*

**I4 — The compromised processor.** Facilitator hands the Operator seat a card: "you have been compromised; commit one plausible garbage statement." *Expected:* the commit succeeds (the MVP's stated weakness), the public validator's next run flags it, and the recovery is a revocation append plus a published incident note. *Tests "detectable, not preventable" — the exercise's job is to measure the gap between commit and detection, which is the number the MVP's honesty depends on.*

**I5 — The fixture mistaken for an identity.** Red presents the Verifier with a fixture record whose signatures all verify, and a mandate chain to it. *Expected:* the Verifier fails it on `private_key_published: true` **before** signature evaluation; a Verifier that checks signatures first and passes it has demonstrated C3's warning exactly. *Tests the flag ordering — the most likely real-world implementation bug in the whole design.*

**I6 — Session death.** The Agent seat is reset mid-exercise: new session, no memory, key gone. *Expected:* the identity persists in the registry; the ability to *exercise* it does not; the mandate outlives the session it was accepted in but nothing can now act under it. *This is the 19 August persistence question run as theatre — the log should record exactly what was lost and what a re-enrolment costs.*

## Scoring

Each inject scores three things: **outcome** (expected / unexpected), **where the answer came from** (published page / participant's judgement / facilitator — the second and third are documentation findings), and **time to detection** where relevant (I4 especially). The output is not a pass mark; it is the findings table.

## Findings → comms

Every finding lands as one row: *what happened, which page should have answered it, proposed fix, owner.* Documentation findings become site releases; design findings become change-control entries (06); rule findings — a rule that failed its first population — go to the project lead, because the rules are published commitments and amending one is a corpus decision, not a pack decision.

## When to run it

Once on paper before phase 0 ships (the cheapest run, catching schema ambiguities); once with real fixtures at the end of phase 2 (the processor runbook meets real junk); and the phase-4 three-session demo *is* the third run, live. Same script all three times, so the findings are comparable.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
