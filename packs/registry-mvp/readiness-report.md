# Readiness Report: The Registry MVP Pack, Read As An Implementation Brief

**version** delivered draft (not a pack document — the site agent's to adopt, renumber or refuse)
**date** 25 August 2026
**from** A fresh session, working from the repository copy of the pack
**to** The site agent, Project lead, Engineering

**type** Readiness report, in the form the briefing pack asks for

*The briefing in `registry-mvp-briefing-pack.zip` asks a fresh session to read the supporting material and the pack, and then say whether it has what it needs — with blocking questions rather than a confident plan, on the stated grounds that a pack with a third of its decisions open is one where confidence probably means the reader missed them. This is that answer. Six blocking questions, ordered by what they block. The first two are the ones that matter: **the pack's single "current" document specifies a record model the corpus corrected on the day it shipped, and the property that decides whether phase 2 is possible at all is filed in this pack as an observability concern.** Limitation: this is one session, one pass, no code written and nothing executed against the shipped platform, because the CLI the pack's acceptance tests depend on could not be obtained — which is itself finding 4.*

---

## 1 · What I read

Worked from the repository copy at `packs/registry-mvp/`, which is **site v0.1.25** — ahead of the briefing zip, which was built at v0.1.17. That gap matters and is recorded in section 7.

**Read in full, from `src/` (the raw markdown the site treats as the source of truth):**
`README`, `00` leading brief, `01` architecture, `02` schemas, `03` workflows, `04` build order, `05` diagrams, `07` tabletop, `08` UX mockups, `11` observability, `12` grant tree and control labels, `13` keys and signatures, `14` user assessment, `15` interface rendered, `91` REP-0001, `99` change control — all thirty-two corrections and the full forty-five-row decisions register.

**Read in part:** `09` Wardley maps (W3, W6 and the synthesis); `10` user stories (the features table, the six workflows, the not-delivered list, traceability); `90` PR/FAQ (the customer selection, the external FAQ, the internal FAQ headings and the three findings).

**Supporting material** (`supporting/` in the zip): the append-lane brief and the history/commit-graph brief in full — both are load-bearing below; the register-was-designed-in-June brief, the grant-is-not-mandate brief and the enrolment brief at their opening arguments; the remaining briefs skimmed by title and heading, per the briefing's instruction to skim rather than study.

**Skipped:** Appendix C doctrine in its rendered form (read only through C26's summary); the reference implementation's source — `/assess` and `mockups.html` were read as artefacts described by documents 14 and 15, not line by line. Both are consumers of the model rather than pieces of the register, so neither bears on the questions below.

**Also read, outside the pack**, because they change the answer: `admin/comms.html` (N6, N8, N10, T8), the repository `README`, and the git history.

---

## 2 · What I understand

A register of agent authority, published as ordinary files at public URLs, holding no secret at any time.

One subject owns one record. Only the owner writes to it — the 2019 keyserver flood inverted into a rule, and the rule that decides the pack's most-argued structural question: a **mandate** is the issuer's statement, so it lives in the **issuer's** record, and the subject appends an **acceptance** to its own. The alternative needed an exception for issuers, and "anybody may append, except when they may not" is the design that already failed.

Four things get recorded. An **identity** is self-signed and proves possession and nothing about trust. A **mandate** is the standing delegation, with an interval — a mandate with no interval is a grant wearing a mandate's name. A **grant** is what a credential technically permits, whether or not anybody wrote it down; the gap between grant and mandate is **excess authority**, exposure nobody accepted, defaulting to critical. A **revocation** is an append with an effective date, because deletion destroys the question an auditor actually asks: *was it valid last Tuesday?*

Nothing is enforced. The register records authority and does not observe behaviour; enforcement is an execution broker's job and the broker is not built. What replaces server-side enforcement is that everything is public, so the four rules are checked by a processor holding the write key **and by anybody re-running a validator over the whole tree** — enforcement is verification anybody can re-run, honest because the data is open, and honest about its own weakness: a compromised processor writes garbage that is detectable, not preventable.

The first client is a page, not a program. A fresh LLM session holding one URL follows a published workflow and verifies, enrols, or operates under a mandate. If it cannot, the MVP is not done whatever code exists — and that is promoted from a documentation standard to the definition of done for every phase.

Two things are refused rather than deferred. **Who is using a mandate** is unanswerable: what is capturable is verification, not use, and the party that never verifies is both the weakest relying party and the one invisible to the layer. So the product is the **missing** edges — which parties hold a mandate I issued and have never once checked it — computed by the issuer from its own lane, never from a central log, because a central log is a map of who is evaluating whom that nobody consented to. And **metered verification** is declined for the same reason: charging per check requires observing every check, so the revenue model and the surveillance capability are one mechanism.

That is the design, and I can state it. What I cannot do is build it, for the reasons below.

---

## 3 · Ready or not, per phase

| Phase | Verdict | The one thing |
|---|---|---|
| **0 — Fixtures, schemas, validator** | **Blocked** | Q1. Everything else in this phase is buildable today |
| **1 — Read path, live** | **Blocked** | Behind phase 0, plus Q4 — the acceptance test names a tool whose interface the pack does not specify |
| **2 — Write path** | **Blocked** | Q2. Not "needs a decision" — it may be impossible as designed, and nobody has checked |
| **3 — Mandates, grants, observability** | **Blocked** | Q3, and Q6 for the verifier's four answers. Six open decisions land here |
| **4 — Three-session demo** | **Blocked** | Consequentially. It exists to prove 1–3 |

**Nothing is ready.** That is a shorter list than the pack's own status implies, and section 7 argues that two of the five blocks are defects in the pack rather than decisions awaiting a project lead.

The honest qualification: **phase 0 is one answer away from ready**, and the answer is a fork, not research. Q1 could be settled in a sentence by the person who already settled it once.

---

## 4 · Blocking questions

Ordered by what they block, not by difficulty. Each carries what I would assume if forced to proceed, and what breaks if the assumption is wrong.

### Q1 — Which record model is being built: the accumulating record, or the file in the commit graph?

**Blocks:** phase 0 entirely, and therefore everything.

The briefing says *if you are implementing, build from the REP*. REP-0001 §2 specifies a record as a directory of numbered statement files, hash-chained by `seq` and `prev`, read to the end for current state. **C7 says that is superseded** — the entry becomes a file inside a commit graph carrying current state and no history array, `seq`/`prev` become the substrate's job, "read to the end" becomes "read one object", and rule 1 holds as topology rather than as a check the processor performs. C7 is marked **Settled — architecture change queued**, sourced from a project-lead brief, and described in the pack's own words as *the largest single change to the architecture*, one that *removes code rather than adding it*.

REP-0001 knows this. Its Backwards Compatibility section says the change is queued and not applied, that it specifies the accumulating form deliberately, and that *the ground will move*. So the pack's one current document is current on the schemas and superseded on the architecture, and the instruction pointing implementers at it does not say which half is which.

**If forced, I would assume:** the commit graph. It is the later position, it is the project lead's rather than the site agent's, it dissolves the genuine tension between published rules 2 and 3 rather than managing it, and building the form that is already corrected is the one outcome nobody wants.

**What breaks if that is wrong:** phase 0's fixtures freeze the wrong shape into the tree, and W6 records exactly why that is expensive — fixtures carry inertia, and *a fiction that works is very hard to replace with a fact that is inconvenient*. Every artefact in phases 0 and 1 is shaped by this answer: the statement envelope, the validator's chain checks, the verification walk's step 2, the size bound, and the enrolment payload.

### Q2 — Does an append lane with no anchors configured accept any token holder?

**Blocks:** phase 2 in its entirety. Possibly the pack's central claim.

This is decision 18 and comms N10, where it is filed as gating **the coverage of the observability layer**. It gates more than that, and the pack does not say so anywhere I found.

The enrolment workflow's premise is an agent starting from a keypair and nothing else, posting through a lane that requires no account. That is the bootstrap trap broken, and it is the reason the pack says the architecture is *substantially closer to buildable* than earlier briefs suggested. But the append-lane brief — the project lead's own, from the code-verified audit — states that sender authorisation already exists as **registered anchors, hashes of accepted senders configured with the write key**, and draws the conclusion in plain words: *a lane is not open to everybody by default. The recipient decides which senders are accepted, using a credential the senders do not have.*

If anchors are required, the operator must hold a hash of the enrolling agent's key **before** that agent may write. The agent must already be known in order to ask to be known. **That is the bootstrap trap, restored, at the exact point the pack says it is broken** — and phase 2's acceptance test, a fresh session with a token and nothing else ending with its identity in the register, cannot pass.

Two sources point in opposite directions and neither is decisive: the audit says the default is closed, and the reference does not state what a lane with an empty anchor set does. Nobody has run it.

**If forced, I would assume:** anchors are optional and an empty set accepts any token holder, because the blind acknowledgement and the whole narrow-door argument only make sense that way.

**What breaks if that is wrong:** the enrolment workflow, the processor runbook, phase 2's acceptance test, WF-2, feature F8, and the pack's claim that the shipped surface already supplies the narrow door. The fallback — out-of-band anchor registration alongside the out-of-band token — is not a smaller change: it makes enrolment a two-party handshake with prior recognition, which is a different design from the one in document 03.

**This is answerable today by one experiment against a test lane**, and it is the cheapest de-risking available in the whole pack. It should not wait on the parent project's documentation.

### Q3 — What is a capability name?

**Blocks:** phase 3, and the pack's headline product claim.

`capability` is a string. Three documents use `repo.pull-request.create` as an example and none defines what the string *is*: who mints names, what the namespace and grammar are, whether two names can be compared for containment, and what a verifier does with a name it has never seen. Doc 12 states honestly that the **shortfall** is unimplementable without it. The register's Open Issues call it undefined and say it blocks the shortfall computation entirely.

**The pack understates this.** The shortfall is not the only casualty. **Excess authority is `grant − mandate`**, and a set difference over an undefined type is not computable either. Excess authority is what M1's most important box renders, what M4 shows the issuer before signing, what document 12 gives structure to, what the PR/FAQ selects the customer around, and what C1 calls *the product*. Decision 6 is filed as *first capability (`repo.pull-request.create`) — open, awaiting project lead*, which reads as a scoping choice about which capability to do first. It is not. It is a missing type definition underneath the pack's central quantity.

**If forced, I would assume:** dotted-segment names in a single flat namespace minted by the issuer, compared only for exact string equality, with no containment relation.

**What breaks if that is wrong:** exact equality means `repo.pull-request.create` and `repo.*` do not relate, so excess authority over any credential that grants breadth is uncomputable — which is every real case, since the entire premise is that grants are much larger than mandates. The interesting answer requires containment, containment requires a grammar, and a grammar is a standard-shaped commitment the pack elsewhere says it would rather adopt than define (W6: *if a standard emerges, this component is at 0.40 and the pack should adopt rather than define*).

### Q4 — What exactly do `sgit pki sign` and `sgit pki verify` accept and emit?

**Blocks:** phase 1's acceptance test, and with it the pack's thesis.

Document 03 flags this itself — detached versus attached, encoding, stdin support — and says *execute first, then write*. It has not been executed. Phase 1's definition of done is a fresh session verifying every signature and the chain from a published page, and the page cannot carry a command nobody has run.

**Checked in this session:** `sgit` is not present here, and `npm view` returns 404 for the obvious package names, as does PyPI. That is not proof the CLI is unobtainable — it is distributed somewhere I did not find — but it means a fresh session handed the front door cannot currently get to step 5 of workflow one, and **the pack has no acquisition step in any workflow**. The first client is a page, and the page's first missing sentence is how to obtain the tool it assumes.

**If forced, I would assume:** detached ECDSA P-256 signatures, base64, over bytes supplied on stdin, with the public key supplied by file.

**What breaks if that is wrong:** every command block in document 03, the envelope's `sig` encoding, the validator's verification step, and M2's *re-run this yourself* transcript — which is the screen where the pack's honesty about its own claims is most concentrated.

### Q5 — Does the processor publish its decisions, or does the blind acknowledgement win?

**Blocks:** the processor runbook, and therefore phase 2's policy content.

Decision 15 records this as open and adds the sharpest line in the register: *the blind ack currently wins by default, **which is a decision nobody made***. REP-0001 handles it honestly — §6 states both requirements and cross-references the conflict in the same breath, and Open Issues names it *directly conflicting requirements in §6* and leaves it unresolved. So the specification is not hiding this; it is telling an implementer that the choice is theirs and nobody has made it.

Which is fine for a specification and not fine for a build. Document 04 takes a third position without reconciling it — *phase 2 should log every processor decision publicly to keep it auditable* — so the pack's build order assumes a resolution the pack's specification says does not exist.

**If forced, I would assume:** the blind acknowledgement wins absolutely, and processor transparency is satisfied by publishing aggregate counts with no per-submission granularity and no timing.

**What breaks if that is wrong:** the processor's judgement is the enrolment policy, its runbook is a policy document, and an unauditable policy applied by an LLM session inside the trust boundary is the pack's own stated weakest joint. Choosing silence by default is choosing it; it should be chosen out loud.

### Q6 — Is an unaccepted mandate inert or live on issue?

**Blocks:** phase 3's acceptance test, which is four answers and turns on this for one of them.

Decision 8, open. The pack proposes inert; REP §4 takes the stricter reading provisionally with a `SHOULD`. The verifier must answer *never accepted* correctly, and what "correctly" means is exactly this decision. M5's second policy — *every mandate in force has been accepted by its subject* — renders a missing acceptance as a **violation**, which reads as the live-on-issue position in an interface built on the inert one.

**If forced, I would assume:** inert. It is the stricter reading and the pack's own.

**What breaks if that is wrong:** one of the four required answers in phase 3's acceptance test, the mandate lifecycle's `Inert` state in document 10, and M7's refusal screen — which is the screen the pack says matters more than the happy path.

---

## 5 · Non-blocking gaps

Things I would want, and would start without.

**Size bounds (decision 5).** 256 statements / 512 KB / 8 KB are proposals. They are in `params.json`, which is versioned, so they are cheap to change — and Q1 partly dissolves them, since C7 makes the bound apply to one current-state file and *trivially satisfiable*. Pick numbers, publish them, move.

**Corpus version (decision 7).** Assigned on adoption. It blocks nothing technical.

**The auditor's traversal.** C8 records that *what did this identity look like on this date* has no command behind it, and calls it the register's product. Document 15 handles this correctly by shipping the control visibly inert. It is real unwritten work and it is not on the critical path for phases 0–2.

**Publication intent (decision 26).** Proposed beside `private_key_published` for draft-2. Adding a field later is an append; this is genuinely deferrable.

**The grant tree in the MVP (decision 27).** Document 14 answers it in the negative for now — the register holds trees produced elsewhere and produces none itself. That answer is good enough to build phases 0–2 against.

**Decision 39 — ask five operators whether the problem is recognised.** Not a gap in the design; a gap in the evidence for building it. The PR/FAQ calls it the cheapest next step in the pack by a wide margin, Appendix C promotes it from nice-to-have to a Phase I doctrine fix, and it needs no registry, no REP and no code. **It is the only item in this report that could be closed this week, and the only one that could show the whole thing is not worth building.**

---

## 6 · What I would build first

Section 3 has no "ready", so per the briefing this section should say so — and it does. What follows is conditional on Q1 alone, because Q1 is a fork rather than research and the rest of phase 0 does not depend on the other five questions.

**Given an answer to Q1, I would build the fixture class and the canonicalisation-and-signature core first**, in that order, and nothing else.

The fixture class because C3 is settled, model-independent, and structurally sharp: `private_key_published` required with no default, read **before** any signature is evaluated, never reachable from the trust graph, retired only by republishing under a fresh key. It is also, per C3, the conformance test of the four published rules — satisfying two and voiding two — which means the first thing built measures the rules the site has published and never populated. And I8 in the tabletop names the flag-ordering bug as *the most likely real-world implementation bug in the whole design*, so it is worth being the first thing that exists rather than the last.

The canonicalisation core because it is the one thing every later phase depends on and it is a published parameter rather than a decision: `jq -cS`, `sig` removed, versioned in `params.json`, with a verifier that **refuses** an unimplemented canonicalisation version rather than guessing.

**And the first thing that could prove the design wrong is Q4, executed.** Signing one fixture statement and verifying it with the shipped CLI is a morning's work and it tests the pack's actual thesis — that a documented workflow is a sufficient client. If the CLI cannot do detached verification over externally supplied bytes and keys, document 03 is not a page that needs editing; it is a workflow that needs redesigning, and every acceptance test in the build order inherits that.

**Q2 should be run in parallel and is cheaper than either.** One write to a test lane with no anchors configured answers it, and the answer decides whether phase 2 exists.

**What I would not build first:** anything in `records/`. Fixtures are fiction, W6 marks them with inertia for exactly that reason, and committing a populated tree before Q1 is answered is the one mistake this pack has already predicted in writing.

---

## 7 · Where I think the pack is wrong

The briefing says this section is not a courtesy, and that a fresh reader who finds the pack unclear has found a defect in the pack. Taking that at its word.

### 7.1 · The briefing points implementers at the one document that specifies the superseded architecture, and does not say so

This is Q1 restated as a defect, and it is the most consequential thing in this report.

Three instructions are individually correct and jointly wrong. The briefing: *if you are implementing, build from the REP.* REP-0001: `Replaces: documents 01, 02, 03 (normative content only)`, and *the only place the schemas are current rather than superseded-with-a-note*. C7: the record model is superseded, settled, queued, and the largest single change to the architecture.

A reader following the briefing literally builds an accumulating hash-chained record — **the model the corpus corrected on the day draft-1 shipped**. The REP does disclose this, in Backwards Compatibility, seven sections after §2 states the model normatively with MUSTs. The pack's own warning is that a reader without the appendix *will implement `grant` as draft-1 defined it*; the same trap exists one layer up for the record model, and nothing warns about it.

**The cheapest fix is one sentence in REP §2** saying which form is specified and which is queued, and one clause in the briefing's "build from the REP" line. Neither requires rewriting anything, which is the pack's own preferred shape of correction.

### 7.2 · The lane-anchors question is filed under the wrong document

Decision 18, C14, N10 and document 11 all frame the anchors question as *gating the coverage of the observability layer*. Section 4's Q2 argues it gates phase 2 outright, and the source for that is the pack's own supporting brief rather than anything I brought.

This matters beyond filing. It is the difference between an open question that delays a phase-3 feature and one that may invalidate the pack's most-repeated structural claim — that the shipped surface already supplies the narrow door the bootstrap trap requires. **A risk parked under the wrong heading gets the attention of that heading**, and this one is sitting behind a documentation request to another project when it is answerable by one experiment.

### 7.3 · The capability vocabulary is presented as a scoping choice and is a missing type

Decision 6 reads *First capability (`repo.pull-request.create`) — open, awaiting project lead*, which frames the gap as *which one do we do first*. Section 4's Q3 argues the gap is *what is a capability name*, and that it sits under excess authority, not only under the shortfall the pack already flags.

The pack has the evidence for this and does not join it up. Document 12 names the shortfall unimplementable for want of the vocabulary; REP Open Issues says the vocabulary *blocks the shortfall computation entirely*; and both stop there, while `grant − mandate` — the same kind of set operation over the same undefined type — is treated throughout as computable and rendered as a number on two screens. Either both are blocked or neither is.

### 7.4 · The build order assumes a resolution the specification says does not exist

Weaker than it first looked, and worth stating at its real size. REP-0001 does not hide the blind-ack/transparency conflict: §6 cross-references it inline, and Open Issues names it as *directly conflicting requirements in §6*, unresolved. That is the pack behaving exactly as it says it does.

The gap is downstream. Document 04's phase 2 states *phase 2 should log every processor decision publicly to keep it auditable* as a tension to manage, with no note that it contradicts A3 — so a reader building phase 2 from the build order inherits a resolution that the specification, the decisions register and comms all say has not been made. **A build order should not be the document that quietly settles an open decision**, and this is the only place in the pack I found one doing it.

### 7.5 · Workflow two polls the one file the specification forbids relying on

A small, concrete inconsistency between two documents a fresh session reads in sequence. Document 03's enrolment workflow, step 5, discovers the outcome by fetching `index.json`. REP §5 says *a verifier **MUST NOT** rely on `index.json` for any step*. Screen M6 gets it right and polls the record path directly.

The enrolment agent is not strictly a verifier, so this is not a contradiction in the design — it is a contradiction in the copy-paste block that the pack says is the client. Document 03 is the page a fresh session follows, and the pack's own rule is that a literal reader is the standard. **Change the curl in document 03 to the record path** and the inconsistency is gone.

### 7.6 · C31 reads as broader evidence than the exercise produced

C31 concludes *the briefing pack works*, on the strength of an outside session delivering twelve faithful screens with seven protected strings verbatim. It does hedge — it says the result is still a mockup against schemas rather than against a population.

The hedge does not cover the thing I would want covered. That exercise rendered **document 08**, which specifies wording, and it touched none of the open decisions: not the record model, not canonicalisation, not the capability vocabulary, not the anchors question, not a single line of the schemas as data. It was the most architecture-independent artefact in the pack, and it succeeded. **That is evidence the briefing pack transmits an interface specification. It is not yet evidence that it transmits a buildable system**, and C31 is the entry a reader will cite for the second claim.

This report is the first attempt at the second thing, and it came back with six blockers. Both results are real and they are not in tension — they are measurements of different documents.

### 7.7 · The zip is stale, in exactly the dimension it warns about

The briefing README in `registry-mvp-briefing-pack.zip` was built at v0.1.17 and says the appendix carries *twenty-three corrections and thirty-six decisions*. The pack now carries **thirty-two and forty-five**. The zip's own reading order references Appendix C for change control, which C26 re-lettered to D.

The briefing's sixth trip-up warns that *several "decided" things are proposals* and that *roughly a third are open*. A session working only from the zip — which is what the pack hub hands a fresh reader — under-counts the open decisions by nine and misses C27–C32 entirely, including the four corrections from the only outside reader the pack has ever had. **Regenerating the zip on release is a build step, not a decision**, and until it is one the artefact designed to onboard fresh sessions is the least current thing in the pack.

---

## Honest tensions in this report

| Tension | Note |
|---|---|
| Six blockers from one session | The briefing asked for blockers over confidence, so this is the requested shape — and a reader should discount it accordingly: I have read this pack once and its authors have lived in it |
| Nothing executed | Q2 and Q4 are both answerable by experiment and I answered neither. The CLI was unobtainable here; the lane needed credentials I do not have and should not have |
| Section 7 disagrees with a pack that has been right about itself repeatedly | Every finding above except 7.2 and 7.3 is a joining-up of things the pack already states in separate places. That is the expected failure mode of a corpus this size and it is what a fresh reader is for |
| "Blocked" on all five phases | It is the honest verdict and it reads harsher than the situation is. Q1 is a sentence, Q2 is an experiment, and phase 0 is closer to buildable than a row of *blocked* suggests |

## Open questions this report leaves

| Question | Notes |
|---|---|
| Is `sgit` obtainable by a fresh session at all, and from where? | Not found in this environment or in the public package registries. If the answer is "from the estate", the workflows need an acquisition step |
| Does the commit-graph model change the schemas, or only the envelope? | C7 says `seq`/`prev` become the substrate's job. Whether `prev` leaves the envelope entirely, and what the statement identifier becomes, is not written anywhere I found |
| Who owns this report's findings? | 7.1, 7.4 and 7.5 are corrections to pack documents and belong to the site agent. Q1, Q2, Q3 and Q5 are decisions and belong to the project lead. 7.7 is a build step |

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
