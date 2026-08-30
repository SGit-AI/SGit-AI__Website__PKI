# 12 · The library and the instance

*Part four — How it composes*

**Written with the RiskMandate team as its named audience. It is meant to be usable as a contract rather than as a description, and it is written expecting you to disagree with part of it.**

---

Two products. One hard line between them. This chapter states where the line runs, what each side commits to, what crosses, what must never, and the one question that decides what happens when the contract needs to move.

## The line

| | **pki.sgit.ai** | **riskmandate.ai** |
|---|---|---|
| Holds | The **library**: measured grants per environment, dated | The **instance**: this user's selections, mandate, deltas, risks |
| Nature | A public dataset | A private instance over it |
| Personal data | **None. Ever** | All of it |
| Produced by | Re-running a measurement | A person answering questions |
| Shared | Published, one fetch | **Never published** |

The pack states it harder than the source briefs did, and records it as correction GM3:

> the registry holds the library (public, no personal data ever); the risk product holds the instance (all personal data, never published); and **the instance stores references, never copies.**

*Stated.* Everything else in this chapter follows from that sentence, and the last clause is the one that has consequences.

## 1 · References, never copies

The instance stores library identifiers. It does not store the library entries themselves.

This is not a storage optimisation and the size argument is irrelevant — library entries are small. Two consequences make it a design rule.

**A corrected entry improves every instance that referenced it. A copy keeps the stale answer, silently.** The pack's phrasing: *a corrected building block improves every instance that referenced it, while a copy silently keeps the old answer.* The word doing the work is *silently*. A copied entry does not degrade visibly, announce that it is behind, or fail. It answers questions, correctly formatted, with last month's facts.

Chapter 9 is why this is not hypothetical. Two of the four defects in that chapter were **corrections to published library data** — a tier label that was wrong and evidence classes the schema does not define. Any instance that had copied those entries would still be rendering `boundary` on a node with a working escalation path underneath it, and nothing would tell it.

**And it is what makes a finished pack shareable.** This is the property the whole integration exists to preserve, and it deserves stating in full because it is the commercial argument as much as the architectural one.

A finished pack is a list of library references, plus a mandate, plus the computed deltas. Handing somebody that discloses **which products you use and nothing about your machine.** No hostnames, no paths, no credential shapes, no configuration. The library entries it points at are public documents anybody can already fetch; the mandate is a statement of intent; the deltas are arithmetic over the two.

Now consider the alternative. An instance storing copies produces a pack containing a full description of what each of your environments can reach. Assembled, that is a serviceable plan for attacking you. **The difference between a sendable artefact and an unsendable one is exactly the reference/copy decision**, and it is not recoverable later by redaction, because the redaction would have to remove the entries the deltas were computed from.

*Drawn.* The packs make the shareability argument and I want to extend it one step, because I think it decides something about the product rather than only about the schema. If a pack is sendable, it can be *required* — by a customer, an auditor, an insurer, a procurement process. An unsendable one cannot, no matter how good it is. **The reference rule is what makes a mandate pack a thing that can be asked for**, and that is a larger claim about the product's reachable market than the architecture section makes it sound. If RiskMandate ever relaxes it for a good local reason, that is what gets given up.

## 2 · The component contract

Settled by the project lead on 26 August 2026, recorded as decision GM-D32:

> **Settled — RiskMandate CONSUMES it. The library/instance split argued for it and the project lead confirmed: two products, one component contract**

*Stated.* The stylesheet is `assets/gm-blocks.css`. RiskMandate consumes it rather than forking it.

**What consuming commits both sides to.** For pki.sgit.ai: the blocks are now a published interface, and the rendering rules in Chapter 11 are contract terms rather than house style. Specifically, three of them cannot be changed unilaterally because a consumer's correctness depends on them — a defeated control never renders as `boundary`; `unknown` never renders as blank; and there is no page-level verdict and no score. Those are not aesthetic positions. A consumer that inherits a block which quietly starts averaging tiers inherits a wrong answer.

For RiskMandate: the blocks render fields that exist in documents. A block that needs data no schema carries is a request for a schema change, submitted to this side, rather than a local patch. That is the constraining part, and it will be felt first, and it is the price of the two products not drifting into two vocabularies.

**What happens when one needs a block the other does not.** The honest answer is that this is not settled, and the pack's own open questions name it: *who owns the blocks once two sites use them?* — with the observation that a shared component layer with no owner drifts into two.

*Drawn.* The estate has settled *consume, not fork* and has not settled *who decides*. Those are different questions and the second is the one that bites in month three. My reading of the material is that the answer implied by the library/instance split is that **the component layer follows the schemas, and the schemas follow the registry** — because the blocks are renderings of fields, the fields live in documents, and the documents are the registry's. That gives a tiebreak. It is an inference, not a decision, and the disagreement it will produce is a real one: it means RiskMandate can be blocked on a schema change for a screen it needs, which is exactly the kind of coupling a product team is right to push back on. Naming it now is cheaper than discovering it.

## 3 · Where the chain hands over

The ordering rule from Chapter 7, with the boundary marked:

```
   REALITY  →  TWIN  →  FACTS  →  FINDING  ┃  RISKS  →  DECISIONS
   ─────────── pki.sgit.ai ────────────────┃── riskmandate.ai ──
                                            ┃
   the environment,   the grant     the delta ┃  derived at each   named acceptor,
   as installed       (measured)    (computed)┃  altitude, in that interval
                      the mandate             ┃  altitude's language
                      (authored)              ┃
```

**The registry's half ends at *finding*.** Risks, acceptance, acceptors and intervals are RiskMandate's.

That line is drawn explicitly so neither side builds the other's half by accident, and it has already been enforced once at cost. The assessment at `https://pki.sgit.ai/assess/index.html` shipped a first version *with* risk acceptance in it. It was removed, because acceptance belongs to the risk product and the version that had it was wrong. Removing the satisfying end of a flow is not a cheap decision, and it was made before there was a second product to hand it to.

**What crosses the line, in each direction.**

Left to right: library identifiers, library entry content (public, fetchable by anybody), the schemas, and the component layer. All public, all versionable, all obtainable in one fetch with no account.

Right to left: **nothing.** There is no callback, no telemetry, no usage signal, no aggregate. This is stronger than it may appear and it is deliberate. The estate's observability position — check events are written by the checker into the issuer's own lane, never a central log — is rule 1 applied to telemetry, and it forecloses the aggregate on purpose. A registry that learned which library entries were popular would be learning which products its users run.

*Drawn.* The packs do not say this, and it is the thing I would most want the RiskMandate team to push back on if they think it is wrong: **the registry has deliberately given up the ability to know whether anybody uses it.** No fetch counts that mean anything, no instance telemetry, no adoption signal. That is a coherent position and it has a cost that lands entirely on the product side, because RiskMandate will be asked which library entries matter and the registry cannot answer. If that becomes intolerable, the thing to change is not the rule quietly — it is the rule explicitly, with the surveillance consequence stated, because the two are one mechanism.

## 4 · What must never cross

**No personal data into the library. Ever.**

A rule with no failure mode described is a rule nobody can check, so here is what a violation looks like in practice. Each of these is a plausible, well-intentioned change:

| A violation would look like | Why it is one |
|---|---|
| A library entry naming the machine, user, hostname, or account it was measured on | The entry becomes a statement about a person's estate rather than about a class of environment |
| An entry whose `environment.surface` is specific enough to identify one installation | Same failure with more steps. "One vendor, one surface, one date" is a category, not an instance |
| A `reaches` field listing actual resource names — repositories, buckets, hosts | This is the one that will happen. A measurement naturally produces real names, and publishing them describes somebody's estate exactly |
| An entry contributed back from an instance without being re-measured | The instance holds personal data by design. Anything derived from it inherits that until proven otherwise |
| A capability descriptor carrying a live preimage rather than a hash | The register's *no live capability, ever* rule; the one descriptor in the register had its preimage discarded before publication |

The third row is the realistic one and it is worth a defence in depth rather than a policy. The measurement rule from Chapter 9 — **presence and reachability, never contents** — is the first line, and it holds for the tool. But `reaches` is a free-text field, and a hand-assembled entry can put anything in it. Chapter 9 already recorded that the hand-assembled entry was the one that drifted from the schema and the tool-generated one did not.

*Drawn.* So the practical safeguard is not the rule; it is the same finding stated as a policy: **entries should be tool-generated, and a hand-assembled entry should be treated as a draft that has not passed a gate.** The estate's evidence for this is its own — every schema violation in the library was in the hand-written entry. Nothing currently enforces it. A build gate that rejects a library entry with no `measured_by` block, or that flags free-text `reaches` fields containing path-like or host-like strings, would be a small and useful addition, and I am recording it here as a suggestion rather than as something the estate has.

## 5 · What this side has not built, so you do not build against it

Stated flatly, because a contract chapter that lists only what exists is a sales document.

**No capability vocabulary.** `registry/capabilities.json` is a fixture set, v0. *What a capability name is* remains one of the three blocking questions. This matters to you more than to us: excess authority is demonstrable without it and **shortfall is not computable at all**, and the shortfall direction is the operations half of your product.

**No real root, and no real issuer.** Every mandate here is signed by a fixture root. Any chain you resolve through this register terminates in a published private key.

**No boundary-tier enforcement point.** Chapter 10's hook is a `setting`.

**No blind-spot deltas.** Two library entries, one agent. The three-term comparison renders with its middle column empty because no structured self-report exists.

**No append-lane write path**, and Chapter 3's Q2 is unanswered — the question of whether a lane with no anchors accepts any token holder, which may make the designed enrolment path impossible as specified.

**And a library of two.** The entry you most need — a local install, where the grant is enormous and the containment available and unused — does not exist, and cannot be produced from a hosted container.

## The open question, named rather than papered over

GM-D32 settled that RiskMandate consumes the stylesheet. What it did not settle is its own successor: **what happens when the two products need the contract to move.**

The concrete shapes this will take, in rough order of likelihood:

1. **RiskMandate needs a block whose data no schema carries.** Document 09's rule says the block is wrong, not the schema. In practice the schema will sometimes be wrong, and there is no process for establishing which.
2. **A rendering rule blocks a screen.** *No page-level verdict* and *no score* are correct and they are also the two things a risk product's customers ask for most. When that request arrives, it will arrive as a customer requirement rather than as a design disagreement.
3. **The library needs an entry only an instance could produce.** A local install measured on somebody's actual machine is exactly the entry the library most needs and exactly the data the library may never hold.
4. **A schema change breaks a consumer.** There is currently no versioning story for `gm-blocks.css` and no deprecation window.

*Drawn.* Item 2 is the one I would flag hardest, because it is where the two products' incentives genuinely diverge rather than merely differ. The registry's rules against scores exist because a score averages tiers that must stay distinct. That reasoning does not weaken when a customer asks for a score — but the pressure is real, it lands on RiskMandate rather than here, and *the party that bears the cost of a rule is not the party that set it.* That is an unstable arrangement regardless of who is right. The version of this contract that survives contact is one where the rules have a stated amendment path, and there is not one yet.

## What I would ask you to disagree with

Three things, listed so the disagreement has somewhere to go.

**That right-to-left is empty.** No telemetry at all is a strong position taken for a good reason. If it is wrong, it is wrong now rather than later, and the argument against it is not weak.

**That the component layer follows the schemas.** That is my inference, not a decision. If RiskMandate needs a different tiebreak, this is the moment it costs least.

**That `capability` can stay undefined this long.** The registry has treated the capability vocabulary as an open question for the whole of this estate's life. It is the type underneath your shortfall computation. My reading is that this is filed as a scoping choice and is actually a missing type — and that framing came from an outside reviewer rather than from inside the estate, which is some evidence it is the right one.
