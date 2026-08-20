# 06 — Change Control

**pack** Registry MVP · draft-1 · 20 August 2026
**role** What has changed since draft-1 shipped, why, and on whose authority. Sources stay verbatim (supersede, never rewrite); this page is where the corrections live until draft-2 folds them in.

---

## The rule this page implements

The corpus's own: **a published document is not silently edited.** Draft-1 (documents 00–04) shipped at site v0.1.4 on the morning of 20 August. The same day, three project-lead briefs (v0.33.61) landed that correct and extend it. The sources stay as published; every correction is recorded here with its source and its status; draft-2, when the project lead adopts one, folds them in and this page becomes its change log.

## Corrections from v0.33.61, in order of what they change

### C1 — "Grant" is redefined, and the pack's schema must follow

**Source:** `v0.33.61__strategy-brief__grant-is-not-mandate…`
**Draft-1 said:** a grant is one concrete capability instance issued *under* a mandate (policy → instance).
**The corpus now says:** a **grant is what a credential technically permits** — a fact about access, whether or not anybody wrote it down — and a **mandate is what the holder is authorised and expected to do**. The gap between them is **excess authority**: blast radius measured from the other end, unaccepted by construction, defaulting to critical.
**Consequence for the registry:** recording grants stops being book-keeping and becomes the product. A registry holding identities, mandates *and* grants can compute the row that matters: *this agent's grant covers forty-one repositories; its mandate covered one; the difference has no acceptor and is six weeks old.* Draft-1's issued-instance object survives as the *record of a grant being conferred* — but the definition, and the schema field names, move to the corpus's.
**Status:** adopted for draft-2. The five mandate fields (issuer, subject, scope, **interval**, revocation path) are confirmed against draft-1's schema — present, with the interval rule now stated in the corpus's words: *a mandate with no interval is a grant wearing a mandate's name.*

### C2 — The registry was designed on 5 June; this pack operationalises, it does not design

**Source:** `v0.33.61__arch-brief__register-was-designed-in-june…`, locating `v0.32.4__dev-brief__sg-send-pki-public-key-registry-on-vaults.md`.
**Draft-1 said:** first-pass design, from the four rules and the shipped surface.
**The corpus record:** the June design already settles clues-not-storage, entries as nodes with relationships as the value, two-level trust (downward asserted by the truster, upward self-declared and granting nothing), the register as a vault holding no private data, connectors to any identity provider, and resolution as the caller's job.
**Consequence:** the pack inherits rather than re-derives. Two June positions materially improve draft-1: **explicit distrust is a valid signal**, and **a partial resolution is a legitimate output** ("I followed the chain this far and stopped"). Draft-1's verification walk should return partial results rather than binary ones.
**Status:** adopted for draft-2; the pack's framing corrected from "first pass at a design" to "first pass at operationalising the June design".

### C3 — Fixtures are a class, not a phase-0 convenience

**Source:** the register brief.
**Draft-1 said:** phase 0 ships "hand-made records" as fixtures.
**The correction:** a keypair whose private half is published is **not a weak identity — it is no identity, permanently**: its signatures prove nothing, its lane is a public inbox, it can never be promoted, and it cannot be retired through revocation (anybody can sign the revocation, and anybody can sign the reversal). So fixtures are a bounded class with structural rules: **`private_key_published` is a required field with no default and it is read *before* any signature**; fixtures are never reachable from the real trust graph; retirement means republishing under a fresh key. The fixture programme is also the **conformance test of the four published rules** — it satisfies two (ownership-by-vacancy, size bounds) and voids two (revocation, signature-substance), and knowing which is the finding.
**Status:** adopted for draft-2; phase 0 upgraded from "fixtures exist" to "the fixture class, named and bounded, before any key is generated".

### C4 — The persona format exists: agent cards, signed by a workflow identity

**Source:** the register brief.
**Draft-1 said:** nothing about persona formats.
**The correction:** publish personas as **A2A agent cards** (well-known path, JWS-signed since v1.0, and the spec itself says a card should not carry credentials) — with the fixture keypair as a *deliberately non-conforming, clearly marked companion object*. The signing notary is a **workflow identity with keyless signing** (short-lived certificate, transparency log): the notary must be an agent you run — the two-populations thesis arriving as an implementation constraint. Two operational facts travel with this: platform secret scanning **will block** a pushed private key, and the recorded bypass is *part of the demonstration*; publishing the same key inside vault ciphertext **evades that control and must not be done**.
**Status:** adopted for draft-2, phases 0–2.

### C5 — Confirmed, and upgraded from "the pack's call" to "corpus-aligned"

**Source:** the register brief, independently.
Draft-1's most-argued decision — **a mandate lives in the issuer's record; the subject appends an acceptance** — is the same rule the register brief states as *evidence is appended by the asserter to its own record, never the subject's*, derived from the same 2019 failure. Two documents, two directions, one rule. **No change; confidence upgraded.**

### C6 — The site access report: findings the pack's read path must carry

**Source:** `v0.33.61__cross-team-brief__site-access-report…`
Three items land in this pack rather than in site chores: the **path convention should be promised, not merely true** — `registry/llms.txt` must state that every artefact is fetchable by constructed URL, because agents already rely on it; the **cross-site composition gap** means phase 1's pages link *page-to-page* to the shipped documentation (`/docs/pki`, `/docs/vault-messaging`, `/docs/limitations`), never to a domain; and the report confirms **four rules with no entries are four assertions** — the fixture programme is what tests them, which is C3 from a second direction.
**Status:** adopted; the first two are also applied to this site directly at v0.1.5.

### C7 — The record model changes: growth moves to the commit graph

**Source:** `v0.33.61__arch-brief__history-is-the-append-only-log…`
**Draft-1 said:** a record is a numbered sequence of immutable signed statement files, hash-chained by `seq`/`prev`, read to the end for current state (documents 01 and 02, diagram D3).
**The correction:** that design carries its own growth, which puts the pack's own rules 2 and 3 into tension exactly as the site's do. **The entry should be a *file inside a commit graph*, not a record that accumulates.** The file carries current state and no history array; the versioning substrate already holds every prior state, content-addressed.
**Consequence:** materially simpler. `seq`/`prev` become the commit graph's job rather than the envelope's; the size bound applies to the entry file and is trivially satisfiable; and "read to the end" becomes "read one object". The verification walk (D5) shortens, and the `acceptance` mechanism gets a second justification — **third-party assertions arrive through a lane that sits outside the commit graph by design**, so rule 1 holds as topology rather than as a check the processor performs.
**Status:** adopted for draft-2. This is the largest single change to the architecture and it removes code rather than adding it.

### C8 — Two corrections about what "append-only" guarantees

**Source:** the same brief.
**Draft-1 implied** that resting on a versioned substrate gives immutable history. **It does not.** Blobs, trees and commits are content-addressed and immutable; **branch references are mutable, and moving one is a shipped command.** So append-only history is a policy about a single pointer.
**Consequence:** the pack must adopt the published-head discipline — the registry publishes its head, signed and dated, on a stated cadence, so a rewrite is falsifiable by any reader who kept the previous one. The site publishes this as a [proposed fifth rule](../../rules/index.html#reference).
**Second correction:** the pack's headline query — *what did this identity look like on this date* — **has no command behind it.** There is no path-scoped log and no blame in the command surface. Content addressing makes it cheap (an unchanged path carries the same tree hash, so the walk is a comparison per commit rather than a diff), but it is unwritten code, and it is the register's product.
**Status:** adopted. The traversal moves into the build order as a named deliverable rather than an assumed capability.

### C9 — Verification is two products, and metering costs the privacy claim

**Source:** `v0.33.61__arch-brief__every-trust-edge-is-a-two-way-conversation…`
**Draft-1 did not address** how a verifier checks a vouching edge beyond "follow references".
**The correction:** a signed assertion verified once and a live lookup checked every time are **two products with opposite properties**, not two settings — offline versus always-current, staleness versus an availability dependency. And only the live one can be metered, because charging per check requires observing every check. What a live notary accumulates is **a relationship graph neither party handed over**, which contradicts the estate's positioning more sharply than any content service could, and cannot be held encrypted.
**Consequence for the MVP:** it takes the published form. A notary that publishes signed dated answers to a location the verifier fetches **cannot meter and cannot surveil, and those are one property**. Two additions to the schemas: *unreachable* becomes a fourth state distinct from confirmed, denied and unknown; and a resolution result records **what it declined to verify and why**, distinguishing unreachable from too-expensive.
**Status:** adopted for draft-2. The commercial choice between issuance and lookup is the project lead's, and the pack does not make it.

### C10 — The interface primitive is a badge on every edge

**Source:** `v0.33.61__dev-brief__register-ui-every-edge-carries-a-verification-badge…`
**Draft-1 had no interface layer** beyond the workflows.
**The addition:** every line in a register is a claim by somebody about somebody, so the primitive is a badge carried by every edge — claim, verifiable-by, method, cost, last-checked, result — with **five result states**, because denied, unreachable and never-checked are three different situations. **"Nobody" is a legitimate and informative value for verifiable-by.** A policy then becomes a saved query that must return no rows, and the badge on the constrained edge decides whether that policy is enforcement or instrumentation.
**And a tested result the pack should carry:** inside a running rented session, the surface is named precisely by environment variables, **no attestation device of any kind is present, and nothing is signed**. The surface is knowable to the agent and unprovable to anybody else. Handing the session a secret makes it worse — a secret proves possession, not location. The vendor *does* record the surface but cannot tell a third party in checkable form, so **the gap is distribution rather than knowledge**, which makes it a product decision rather than a hardware problem.
**Status:** adopted as the pack's phase 6. The badge vocabulary is written before any page exists.

## The decisions register

| # | Decision | Made by | Status |
|---|---|---|---|
| 1 | Mandate lives in the issuer's record | draft-1, confirmed by v0.33.61 | **Settled** |
| 2 | Grant = what a credential permits; excess authority is the countable product | v0.33.61 | **Settled — schema change queued** |
| 3 | Fixture class with required `private_key_published` flag | v0.33.61 | **Settled — schema change queued** |
| 4 | Personas as signed agent cards; workflow identity as notary | v0.33.61 | **Settled for the MVP** |
| 5 | Size bounds (256 / 512 KB / 8 KB) | draft-1 proposal | **Open — awaiting project lead** |
| 6 | First capability (`repo.pull-request.create`) | draft-1 proposal | **Open — awaiting project lead** |
| 7 | Corpus version for this pack | — | **Open — assigned on adoption** |
| 8 | Acceptance semantics (unaccepted mandate = inert) | draft-1 proposal | **Open** |
| 9 | Entry as a file in a commit graph, not an accumulating record | v0.33.61 | **Settled — architecture change queued** |
| 10 | Publish the signed head on a cadence | v0.33.61 | **Settled in principle — cadence open** |
| 11 | Notary takes the published form, not the answering form | v0.33.61 | **Settled for the MVP — the commercial call is the project lead's** |
| 12 | Mandates are allow-lists; prohibitions are annotations only | v0.33.61 | **Settled** |
| 13 | Which verification mode ships first | — | **Open — two products, and building both means neither finishes** |

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
