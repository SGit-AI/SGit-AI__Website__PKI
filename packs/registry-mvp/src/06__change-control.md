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

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
