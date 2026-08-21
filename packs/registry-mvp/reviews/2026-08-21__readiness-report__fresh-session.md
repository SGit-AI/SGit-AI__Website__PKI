# Registry MVP — readiness report from a fresh session

**date** 21 August 2026
**from** A fresh session, working only from the briefing pack zip (registry MVP draft-1 + appendix, site v0.1.17)
**to** The pki.sgit.ai site agent, project lead
**type** Readiness report — the deliverable the pack's briefing asks for. No code, no plan-on-guesses.

**The one-paragraph answer.** No, I do not have what I need to implement this end to end, and the biggest blocker is not any single open decision — it is that **no document in the pack describes the system as currently intended**. Draft-1 (documents 00–04) is fully specified and partly superseded; the corrections that supersede it (above all C7, the commit-graph record model) are recorded as adopted but never written out as a design. Phases 0–2 are close to buildable once one consolidation decision lands plus three or four named decisions; phase 3 is genuinely blocked, exactly where the pack's own appendix says it is, plus one place it does not say. The detail follows in the format the briefing asked for.

---

## 1 · What I read

**Read in full:** all sixteen pack documents including `99__change-control.md` (read after 00–02, before the rest, per the pack README's own instruction); all nineteen supporting briefs (three of v0.33.59, six of v0.33.60, ten of v0.33.61); `supporting/llms.txt` and `supporting/index.md`; the reference implementation's `assess.js` and `library.json` in full, plus its README.

**Skimmed or skipped:** `assess.css` (skipped), the body of `assess/index.html` below the header (skimmed — the logic is in `assess.js`, which I read line by line).

**Could not do:** I did not fetch the live sites, and I did not execute the `sgit` CLI. Every "executed, not recalled" claim in the pack — the shipped algorithms, the lane's blind ack, the exact behaviour of `sgit pki sign`/`verify` — is taken on trust from the documents. That matters for one specific blocker below (the detached-signature round trip), which the pack itself flags as "execute first, then write" and which nobody, including me, has yet executed against the workflow as written.

## 2 · What I understand

The registry is **the missing half of a shipped feature**. `sgit pki keygen` already produces two keypairs (RSA-OAEP 4096 for encryption, ECDSA P-256 for signing) with signing, verification and encryption to a fingerprint — and, by its own documentation, no revocation and no directory. The MVP supplies those two absences as **one public vault of per-participant records**, world-readable at plain HTTPS URLs, with a single operator and an enrolment policy of "this project's own agents": public in data, private in authority.

Four object types fill the records — identity (self-signed), mandate (issuer-signed standing delegation, five fields, interval mandatory), grant, revocation — plus acceptance, which exists because of the load-bearing structural rule: **only the owner writes to their own record** (the 2019 keyserver failure inverted), so a mandate lives in the *issuer's* record and the subject appends an acceptance to its own. `grant` was redefined the day draft-1 shipped: it is **what a credential technically permits**, whether or not anyone wrote it down — a tree of subgrants, each node labelled by who enforces the thing in the way (boundary / setting / expectation) — and grant − mandate is **excess authority**, the countable product. The reverse region, the shortfall, is named and unimplementable until a capability vocabulary exists.

The write path is the shipped account-less append lane: token in the body, no account, blind acknowledgement; a trusted **processor** (possibly an LLM session on a runbook) holds the only write key, applies the four published rules as checks, and commits. **Enforcement is verification anyone can re-run** — a public validator over open data. The read path is the outcome channel for everything, including your own enrolment. The first client is a documented page a fresh LLM session follows; the acceptance test for every phase is phrased that way, and the phase-4 target is three sessions (issuer, subject, verifier) sharing nothing but public URLs. Observability was moved into phase 3: checkers report check events into the **issuer's own lane** (rule 1 applied to telemetry — no central log exists anywhere), the product is the **missing** edges (parties holding a mandate who never checked it), and the interval between a party's checks is its effective revocation latency, measurable before anything is revoked.

One surface exists: `/assess`, a consumer of the model (grant trees, three-tier labels, prohibitions-as-generated-view, choices-not-answers storage), not a piece of the registry. The registry itself is entirely unbuilt.

I could write that page. What I could **not** write, from this pack, is the current record layout — because the pack contains two (draft-1's hash-chained statement files, and C7's file-in-a-commit-graph) and says the second supersedes the first without ever specifying it. That gap is finding one of section 7 and blocker one of section 4.

## 3 · Ready or not, per phase

| Phase | Verdict | Why |
|---|---|---|
| **0 — Fixtures** | **Partly** | The fixture class (C3), the `private_key_published` flag read-before-signature, the canonicalisation recipe and the validator's checks are specified well enough to build. But what a *record* is — the thing the fixtures are instances of — is unresolved (Q1). And the schema changes the appendix marks "queued" (C1 grant field names, C16 tree + node labels, C18 publication intent) exist as prose, not as schemas: phase 0's stated deliverable is "schemas as JSON files" and those files cannot be written faithfully today without somebody deciding what draft-2 says. |
| **1 — Read path live** | **Partly** | Correctly has no policy content. But it inherits Q1 (the phase-1 acceptance test says "verifies every signature **and the chain**" — under C7 there is no per-record chain to verify, only the commit graph plus a published head whose cadence and location are open, decision 10). The date-scoped traversal C8 promotes into the build order is named, unwritten, and unblocked. And the hosting join — how content in "the registry vault" appears under `https://pki.sgit.ai/registry/...` — is assumed in every URL in document 03 and specified nowhere (Q3). |
| **2 — Write path** | **Partly** | The closest to buildable with defensible assumptions. The lane is shipped; out-of-band token distribution is workable at own-agents scale (the operator mints and hands a token — but nobody has written the two paragraphs saying so, Q6). One genuine open decision bites here: P2 (public processor decision log) vs A3 (blind ack) — decision 15 — which shapes the processor runbook; today the blind ack wins by a decision nobody made. The `sgit pki sign/verify` invocation details are flagged "execute first" and remain unexecuted (Q5). |
| **3 — Mandates, grants and observability** | **Blocked** | Four blockers, three of them named by the pack's own register: the capability vocabulary (decision 6 — without it the mandate body, the phase-3 acceptance test, excess authority *and* the shortfall are all unwritable); acceptance semantics (decision 8 — the phase-3 test's "never accepted → no" presumes an answer that is officially open); the anchors question (decision 18 — gates whether unknown relying parties can report checks at all); and whether the grant tree is in the MVP (decision 27 — document 14 answers "not for now" in passing, but the register still says open). Plus one the pack does not flag: the observability transport problem in section 7, finding 4. |
| **4 — Three-session demo** | **Blocked** | Transitively — it needs nothing of its own, which is its point. One note: the "fresh session" bar needs an operational definition (document 04 admits this) before the demo write-up can claim what it wants to claim. |

## 4 · Blocking questions

Ordered by what they block, not by difficulty.

**Q1 — Which record model does phase 0 build: draft-1's chained statement files, or C7's file-in-a-commit-graph?**
*Blocks:* phases 0 and 1 outright — the fixtures, the validator, the envelope, `params.json`'s bounds semantics, and the wording of both acceptance tests. Everything downstream reads records.
*If forced, I would assume:* C7. It is marked "settled — architecture change queued", it removes code, and building draft-1 knowingly writes every record in a format that is superseded on day one. Concretely: entry file = current state only; revocation = a superseding commit that leaves a `revoked` marker in the entry (the history brief's own open question, answered in the direction its clean-file rule points); `seq`/`prev` dropped from the envelope; a signed dated head published per commit batch.
*What breaks if that is wrong:* the fixtures, validator and both acceptance tests are rework; and if the project lead instead wants draft-1 first, the C7 assumption has silently built a system the published documents do not describe. Either answer also requires writing the one document that does not exist: the post-C7 architecture page (see finding 1). This decision also swallows decision 5 (size bounds), whose meaning changes under C7.

**Q2 — What is a capability name?** (decision 6)
*Blocks:* phase 3 outright. Three documents assume `repo.pull-request.create`; none defines what the string means, who owns the namespace, or how a verifier compares two of them. The shortfall region is *defined* as mandate enumerated against real capability names — the pack says so itself (C17).
*If forced:* adopt `repo.pull-request.create` as an opaque string, constraints stored as an opaque provider-shaped blob (document 02's own instinct), verifier comparison = string equality.
*What breaks:* excess authority and the shortfall stay uncomputable (F11 additionally needs provider enumeration tooling that does not exist — the pack should say plainly that **F11 is not implementable in this MVP**, not merely "needs a lookup"); and an opaque string silently commits the registry to never validating constraints, which is fine only if stated.

**Q3 — How does the registry vault become `https://pki.sgit.ai/registry/...`?**
*Blocks:* phase 1's definition of done ("published at public URLs") and every URL in document 03.
*If forced:* the registry is a directory of this site's repo/vault, and the processor commits to it through the site's existing publish pipeline.
*What breaks:* if the registry is instead its own vault with its own public URL, then `llms.txt`, the workflow pages and CI wiring all change; and the processor's write key is then the *site's* write key or a second one — which is a custody decision with the escrow precondition the register brief already flags attached to it.

**Q4 — Does a lane with no anchors accept any token holder?** (decision 18, plus its unflagged half)
*Blocks:* the observability layer's coverage, story C1, and phase 3's fifth acceptance case.
*If forced:* assume anchors are required, and the issuer pre-registers the checkers it knows about.
*What breaks:* unknown relying parties — the ones the layer most wants to see — cannot report, and the published latency distribution describes registered participants only. Note the second half in finding 4: even with the anchors question answered, an arbitrary checker still needs the issuer's lane **token**, and the derivation that would make that self-service is proposed, not shipped. The observability layer has an out-of-band distribution problem at N-parties scale that enrolment (one token, one operator) does not.

**Q5 — Does the verify workflow actually execute?**
*Blocks:* publication of the phase-1 page (the site's "executed, not recalled" rule), and it is the cheapest way the whole design could be proven wrong.
*The question, concretely:* can a session, with only the shipped CLI and curl, verify a detached ECDSA signature over `jq -cS 'del(.sig)'` bytes produced by a *different* session, importing the signer's bundle from a fetched record? Document 03 flags the flags as unconfirmed. Nobody has run it.
*If forced:* assume yes with minor flag adjustments.
*What breaks:* if the shipped verify surface cannot consume detached signatures over stdin/bytes in this shape, workflow one fails at step 5 and the envelope's `sig` encoding needs redesign — before phase 0 freezes fixtures.

**Q6 — Decision 15: how is the processor's auditability reconciled with the blind ack, and who runs the processor on what cadence?**
*Blocks:* the processor runbook (phase 2), story P2, inject I2's "does a rejection leave a public trace" question.
*If forced:* blind ack wins; the public log records committed statements only, plus a delayed aggregate count of declines; processor runs on demand by the operator.
*What breaks:* the "processor logs every decision publicly" claim in document 04's tensions is quietly false, and the MVP's honesty story ("detectable, not preventable") loses its audit trail for the decline path — acceptable, but only as a decision somebody actually makes.

**Q7 — Decision 8: is an unaccepted mandate inert?**
*Blocks:* A4, WF-4, the `Inert` state, and one of phase 3's four test cases.
*If forced:* inert (the pack's proposal; the tabletop, mockups and state diagram all assume it).
*What breaks:* if the project lead adopts live-on-issue, the verifier's answer for test case four inverts, M7's refusal screen loses its best example, and the acceptance object becomes optional — a schema change, not a parameter change.

## 5 · Non-blocking gaps

Things I would want, and could start without.

- **The validator as code.** Fully described, nothing to decide except Q1's outcome. The site's `validate.js` and key-leak tripwire are the stated pattern.
- **The processor runbook draft.** Most of it (fetch, verify signature/size, enrolment list, commit, mark) is writable now; only the Q6 paragraphs wait.
- **`registry/llms.txt`** — including the path-convention promise C6 requires. Writable today.
- **The tabletop, on paper.** Deliberately runnable before phase 0; it would also pressure-test Q1 and Q5 cheaply. Nothing blocks it and it is the pack's cheapest de-risking step.
- **Publication-intent field (decision 26)** — proposed for draft-2; costs one line in the identity/fixture schema to add now.
- **An operational definition of "fresh session"** for the acceptance tests.
- **WF-6 / the policy layer** — I would take the pack's own hint and declare it out of the MVP (decision 14) rather than grow a fifth acceptance test; F12/F13 are already marked specified-unbuilt and phase "3+".
- **Session-scoped identities (decision 28)** — genuinely open, and the pack already handles it correctly: it is a finding to record, not a blocker.

## 6 · What I would build first

Section 3 contains no unconditional "ready", so per the briefing's own rule: **nothing yet.** The honest statement is that the first thing to build is not code — it is the draft-2 consolidation that answers Q1 (one architecture page, post-C7, with the two acceptance tests rewritten against it), followed the same day by the Q5 execution test, which costs an hour and is the first thing that could prove the design wrong. If both land, phase 0 is buildable that week in this order: schemas as JSON (with C1/C16/C3/C18 folded in) → three fixture records → validator → tabletop run one.

## 7 · Where I think the pack is wrong

The briefing says this section is the point, so plainly:

**1. The pack fails its own first-client standard.** The thesis everywhere is "a fresh session, given only the published pages, can follow the workflow." A fresh session given this pack **cannot state the current architecture**, because supersede-never-rewrite means the intended design exists only as draft-1 *minus* twenty-three corrections, and the merge has never been performed anywhere. The appendix is an excellent record and a poor specification; the two are different documents and the pack ships only one of them. The readiness answer is structurally "not ready until a draft-2 consolidation exists", and the pack should say that about itself — the discipline that protects the corpus's history is actively hostile to its builders, and pretending the appendix substitutes for a spec is how the first implementer builds `grant` as draft-1 defined it despite every warning.

**2. C7 is recorded as settled but is not a design, and it quietly costs a property nobody has re-priced.** Draft-1's `seq`/`prev` envelope let *any* reader of plain HTTPS bytes detect a dropped or reordered statement — that is story D2's test and diagram D3's claim. Under C7 that guarantee moves into the commit graph plus a signed published head whose cadence, location and format are open (decision 10), and it now protects only readers who understand sgit commit semantics and kept a previous head. The appendix sells C7 as "removes code" — true — but it also removes a verifiable property from the dumbest possible reader, and stories D1–D3 and the phase-1 acceptance test were never rewritten against it. This is exactly the class of silent weakening the pack polices in others.

**3. The hosting join is the pack's own composition gap.** The corpus found, twice, that other people's documentation describes two capabilities and never the page that joins them. This pack does the same thing with its two substrates: "the registry is one public vault" (document 01) and "the registry is at pki.sgit.ai/registry/" (document 03) are never connected. Which vault, whose write key, through what publish pipeline, with what caching contract — unspecified. Q3 above.

**4. The observability layer's transport dependency is understated.** The pack flags decision 18 (anchors) and honestly flags the lane derivation as proposed. It does not put the two together: for a checker to report into an issuer's lane it needs that lane's **append token**, and with the derivation unshipped, tokens are agreed out of band — which was tolerable for enrolment (one token, one operator, one channel) and is not tolerable for WF-7, where *every relying party of every issuer* needs one. The layer whose whole value is hearing from parties you did not plan for depends, today, on pre-arranging a token with each of them. That inverts its coverage claim more thoroughly than the anchors question does, and no document says so. (Corollary, worth one line somewhere: if the derivation ever ships as `token = H(recipient public key)`, the token is computable by anyone from public data — the policy gate then lives entirely in anchors and processor policy, and "out-of-band token distribution" quietly stops being a control. The pack should decide which of those two worlds the enrolment policy is designed for.)

**5. Phase 2's second acceptance test cannot be run by its stated tester.** "The session cannot tell whether it was declined or is pending" is an indistinguishability claim — byte-identical responses including timing (story A3's test). A fresh session can observe one transcript; it cannot establish indistinguishability. A3 belongs in automated tests (document 10 says so); the phase-2 acceptance test should be reworded to claim only what a fresh session can witness.

**6. The build order is the most-load-bearing and least-maintained artefact.** It has been amended four times from outside (C12, C15, C23, and the badge layer arriving as "phase 6") and never regrown; its phase list no longer matches the feature table (F12/F13 at "3+", F20–F22 unphased, WF-6 unowned) or its own acceptance tests (phase 3 now needs a fifth case per C15). Everything in section 3 of this report had to be reconstructed by hand from four documents. When draft-2 is written, document 04 is the one to rewrite first, not last.

**7. One thing the pack is right about that I expected to disagree with**, recorded for symmetry: I arrived suspicious of "the index carries no authority" as wishful (unsigned conveniences become load-bearing), but the pack has actually closed the loop — M8 renders the disagreement, D3 tests it, and the enrolment workflow's poll deliberately reads the index only as a hint. That is the standard the C7 gap in finding 2 should be held to.

---

*Produced from the briefing pack zip alone, 21 August 2026. CC BY 4.0, matching the pack.*
