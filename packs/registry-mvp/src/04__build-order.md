# Build Order For The Registry MVP: Read Path Before Write Path, And Every Phase Ends With A Fresh Session Passing Its Test

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Engineering, Architecture

**type** Strategy brief (first pass)

*Fifth and final document of the registry MVP pack. The phases, what each delivers, and the acceptance test that defines done for each — every one phrased the same way: a fresh LLM session, given only public URLs, succeeds or correctly refuses. Nothing in this document requires anything not already shipped except the registry artefacts themselves.*

---

## What This Is

The MVP cut into five phases with one rule: **the read path ships before the write path, and every phase's definition of done is a test a fresh LLM session can run.** Read-before-write is not caution for its own sake — the read path is the half a future genuinely-public registry shares unchanged, it needs no policy decisions, and every later phase's outcome channel *is* the read path, so it is the foundation everything else reports through.

## The Phases

| Phase | Ships | Needs deciding first |
|---|---|---|
| **0 — Fixtures** | Schemas as JSON files; three hand-made records (operator, one agent, one revoked key) committed to the registry tree; the validator script; `params.json`, `roots.json` | The proposed size bounds; the canonicalisation recipe |
| **1 — Read path, live** | The registry tree published at public URLs; `registry/llms.txt`; the verify workflow page, executed then published; validator in CI | Nothing — this phase has no policy content |
| **2 — Write path** | The enrolment lane configured on the operator vault; the processor runbook (an LLM session with enum + write key); the enrol workflow page | The enrolment policy ("this project's agents" — expressed as a list the processor applies); out-of-band token distribution |
| **3 — Mandates and grants** | Issuer record for the operator; mandate/acceptance/grant/revocation flowing end to end; the operate-under-mandate page | The first capability vocabulary (one capability, deeply: `repo.pull-request.create` is the natural candidate); acceptance semantics (pack proposes: unaccepted = inert) |
| **4 — The three-session demo** | The full loop run by three independent LLM sessions — issuer, subject, verifier — sharing nothing but public URLs; written up as a dated, re-runnable page | Nothing new — this phase exists to prove the previous three |

## The Acceptance Tests

Phrased identically on purpose; the phrasing is the standard the site already applies to documentation, promoted to the definition of done.

**Phase 1:** a fresh session, given only `https://pki.sgit.ai/registry/llms.txt`, fetches a record, verifies every signature and the chain, states the record's current status correctly — including the revoked fixture, which it must report as revoked with the effective date.

**Phase 2:** a fresh session with the sgit CLI, curl, and an enrolment token — nothing else — ends with its identity in the public registry, and can demonstrate possession of the enrolled key. A second run with a garbage signature ends with nothing in the registry, and the session cannot tell whether it was declined or is pending.

**Phase 3:** a verifier session answers "may agent X do Y right now?" correctly in all four states: valid mandate (yes, with expiry and authority), expired (no), revoked (no, with effective date), never accepted (no). The refusals are the test as much as the yes.

**Phase 4:** three sessions that have never shared state run issue → accept → verify end to end, and the write-up names the date, the versions, and every step that needed a human — the honest residue being exactly the thing worth publishing.

## What Each Phase Teaches

The MVP's stated purpose is developing the tech and workflows for LLM-session PKI, so each phase is also an experiment with a question:

| Phase | The question it answers |
|---|---|
| 0–1 | Can signature verification be made genuinely followable from a page — where does a literal reader trip? |
| 2 | How long does an agent identity actually live? (Session-scoped keys are a finding, not a failure) |
| 3 | Is the mandate vocabulary usable by the parties who must write and read it, before any broker enforces it? |
| 4 | Where does the human actually remain in the loop — and is each remaining spot a policy choice or a gap? |

## What This Does Not Try To Be

- **Not the public registry.** One operator, one root, own-agents policy; the door widens by decision, not by drift.
- **Not the execution broker.** The registry records mandates; enforcing constraints stays the broker's job.
- **Not a new key format, transport or authorisation model.** The bundle, the lane and the four-tier capabilities are reused as shipped.
- **Not secure against its own operator.** A compromised processor writes detectable garbage; the MVP's answer is public re-validation, and the honest phrase is *detectable, not preventable*.
- **Not a corpus document yet.** A site-agent first pass, for the project lead to reshape, re-version and adopt — or refuse.

## Honest Tensions

| Tension | Note |
|---|---|
| Read-first sequencing | Fixtures make phase 1 testable without policy, and fixtures are fiction; the first real record (phase 2) may reshape the schemas the fixtures froze |
| One capability, deeply | `repo.pull-request.create` exercises the whole shape and drags in provider-specific constraint semantics on day one — that is the point, and it is a commitment |
| The processor runbook as policy | An LLM session applying an enrolment list is the dogfooding and the trust boundary in one place; phase 2 should log every processor decision publicly to keep it auditable |
| Acceptance tests need fresh sessions | Genuinely fresh context is the standard and is operationally awkward to prove; "a session with no prior project context" is the honest practical bar |

## Open Questions

| Question | Notes |
|---|---|
| Who runs the processor, on what cadence? | On-demand at first; the moment enrolments matter, cadence is a service commitment |
| Does phase 4's write-up become the site's first receipt? | The demo's verifier output is nearly a receipt; formalising it would pull receipts into the registry, which brief 02 deliberately did not |
| When does this pack get corpus versions? | On adoption — the project lead's call, recorded on comms |
| What triggers widening the enrolment policy? | The genuine public-registry commitment; it deserves its own brief when it is close |
---

*Added after publication, 20 August 2026 (site v0.1.12). No claim above has been changed — this pack supersedes rather than rewrites; the only edit was moving the licence line below this block so it stays last. Later documents that bear on this one:*

- `09__wardley-maps.md` — **W6** — these phases as a march right-to-left, with fixtures carrying inertia because a fiction that works is hard to replace with an inconvenient fact
- `10__user-stories-and-features.md` — the traceability table — and a finding against this document: **WF-6, running a policy, has no acceptance test here**, because the policy layer did not exist as a concept when these four phases were written. Either phase 3 grows a fifth test or the policy layer is honestly out of the MVP
- `11__observability.md` — an amendment to these phases: observability belongs in **phase 3, with mandates**, because the justification for building declared mandates *is* the evidence it produces. Phase 3's acceptance test grows a fifth case

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
