# The Registry Is A Public Vault: Records Are Append-Only Statement Logs, And The Processor Is The Referee

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Engineering, Architecture

**type** Architecture brief (first pass)

*Second document of the registry MVP pack. The storage layout, the statement envelope, the write path, and exactly where each of the four published rules is checked in a system whose storage layer does not understand them. Everything platform-side cited here is executed behaviour from sgit.ai's own documentation; everything registry-side is proposed.*

---

## What This Is

The registry mapped onto what actually ships: **the registry is one public vault whose tree is a set of append-only records, one per participant, addressed by key fingerprint; each record is a numbered sequence of signed statement files whose current state is read-to-the-end; the write path is the shipped account-less append lane feeding a trusted processor that holds the vault's write key and is the only thing that commits to the tree; and the four rules are implemented as the processor's checks plus a public validator anybody can re-run over the whole registry, because in an open-data MVP, auditability is the enforcement.**

## The Tree

```
registry/
  llms.txt                     the machine-readable front door: how to read,
                               verify, and enrol — the first client's manual
  roots.json                   the trust roots this registry accepts (rule from
                               the fractal section: declared, even when the
                               answer is one operator key)
  params.json                  the published parameters: size bounds, accepted
                               statement types, canonicalisation version
  index.json                   subject fingerprint -> record path, plus a
                               reverse map of mandates naming each subject.
                               CURATED CONVENIENCE — carries no authority
  records/
    sha256:69d9b4835ccf790c/   one record per participant, keyed by SIGNING
      00001.json               fingerprint (statements are signed; the signing
      00002.json               key is the identity that matters here)
      00003.json
```

Choices worth defending:

**One record shape for everybody.** Agents, issuers and the operator are all just participants with records. An issuer is distinguished by appearing in `roots.json` (or being reachable from it), not by a different storage shape. This is the fractal property implemented as uniformity rather than as machinery.

**Keyed by signing fingerprint.** The shipped keygen produces two pairs — RSA-OAEP 4096 for encryption, ECDSA P-256 for signing — with two fingerprints. Registry statements are signed artefacts, so the signing fingerprint is the record key. The identity statement inside the record carries the full exported bundle, both public keys included, so encryption-to-the-agent is still answerable from the record.

**Numbered files, not one growing file.** `00001.json`, `00002.json` — each statement is one immutable object. This fits the platform's caching contract (immutable objects are served with a one-year immutable directive; only the index and record listing are re-fetched), makes the size bound trivially checkable, and means a mirror can fetch a record incrementally.

## The Statement Envelope

Every file in every record is one envelope:

```json
{
  "v": 1,
  "type": "identity | mandate | grant | acceptance | revocation",
  "registry": "pki.sgit.ai",
  "subject": "sha256:<signing fingerprint of the record owner>",
  "seq": 3,
  "prev": "sha256:<hash of statement 00002.json>",
  "created_at": "2026-08-20T12:00:00Z",
  "body": { },
  "signer": "sha256:<signing fingerprint of whoever signed>",
  "sig": "<base64 ECDSA P-256 signature over the canonical bytes of this object minus sig>"
}
```

Three fields carry more weight than they look like they do. **`seq` and `prev`** make each record a hash chain: a mirror cannot silently drop a statement from the middle without the chain failing, and replay of an old statement into a new position is detectable. The enrolment work's warning applies verbatim — the nonce/sequence must be *inside* the signed payload. **`signer`** is what lets one envelope shape serve self-signed statements (identity, revocation-of-identity) and issuer-signed statements (mandate, grant) without a second format.

**Canonicalisation is a published parameter, not an assumption.** The signature is over UTF-8 JSON with lexicographically sorted keys and no insignificant whitespace — the output of `jq -cS` — with the `sig` member absent. `params.json` names this recipe and versions it. A signature over an ambiguously serialised object is a signature over whatever the verifier happens to reconstruct; the MVP treats the serialisation recipe with the same precision as the key algorithm.

## The Write Path

```
   AGENT (untrusted)                              OPERATOR SIDE (trusted)

   generate keypair (sgit pki keygen)
   build + sign statement
        |
        |  POST /api/vault/append/write/{vault}     enrolment lane on the
        |  { append_token, payload }                operator's vault
        +------------------------------------->    blind ack: {"ok":true}
                                                        |
                                                   PROCESSOR (holds enum_key
                                                   + the registry write key)
                                                   - list/fetch pending
                                                   - verify signature, seq, size
                                                   - apply policy (enrolment
                                                     list, issuer check)
                                                   - commit statement file to
                                                     the registry vault
                                                   - regenerate index.json
                                                   - mark processed
```

The lane is the shipped surface, used exactly as documented: the sender holds an append token, posts with no account, learns nothing from the blind acknowledgement. The processor is the only holder of the registry vault's write key, which makes it the referee — and makes rule 1 a fact about key custody rather than a policy the storage layer is trusted to apply.

**The processor can itself be an LLM session.** A scheduled or on-demand session holding the enum key and write key, following its own documented runbook: fetch, verify, decide, commit. That is not a stopgap — it is the dogfooding the MVP exists for, with the honest caveat that the processor's judgement *is* the enrolment policy, and its runbook is therefore a policy document, not just an ops page.

## Where Each Rule Is Checked

| Rule | MVP implementation | Checked by |
|---|---|---|
| 1 — only the owner writes to their own record | Every statement in a record is signed by its subject (acceptances) or committed only after the processor verifies the issuer relationship (never a third party) | Processor on write; validator on read |
| 2 — revocation is a signed append | `revocation` statement type, signed by whoever signed the original; nothing is ever deleted from a record | Processor on write; validator on read |
| 3 — records are size-bounded | `params.json` proposes: ≤ 256 statements and ≤ 512 KB per record, ≤ 8 KB per statement — numbers chosen to be invisible in normal use and cheap to argue about | Processor on write; validator on read |
| 4 — every entry is signed by something you can check | Envelope `sig` verifies against a key that is either in this record's identity statement or reachable from `roots.json` | Validator, and any reader |

The validator is a small public script in the registry repo: fetch the whole tree, re-verify every chain, every signature, every bound, and exit non-zero on any violation. **It is the MVP's enforcement story**, so it runs in CI on every processor commit, and its output is publishable. The interesting property of open data is that anybody who distrusts the operator can run the same script — the operator's honesty about rules 1–4 is checkable without trusting the operator.

## What The Server Never Understands

Worth stating the negative space: the storage layer knows nothing about identities, mandates, rules or records. It stores files, gates the lane's operations by capability hashes, and serves public reads. Every registry property lives in the statement format, the processor and the validator. That is the MVP's weakness (a compromised processor can write garbage — detectably, but it can) and its portability (nothing about this design is coupled to the vault provider; any static host plus any append channel could carry it).

## Honest Tensions

| Tension | Note |
|---|---|
| Processor as referee | Rule 1 is key custody plus one process's correctness; a compromised processor writes detectable-but-real garbage until caught |
| The index | It must exist for "what may X do" to be answerable, and it is the one file signatures do not protect — hence: convenience, no authority, regenerable from the records by anyone |
| Numbered files | Clean immutability, and a record with hundreds of statements costs hundreds of fetches — acceptable at MVP scale, a real cost later |
| The lane address derivation | PROPOSED platform-side; the MVP agrees enrolment tokens out of band and must not document the derivation as if it shipped |
| LLM processor | The dogfooding is the point, and it puts a model's judgement inside the trust boundary — the runbook is a policy document |

## Open Questions

| Question | Notes |
|---|---|
| Are the proposed bounds right? | 256 statements / 512 KB / 8 KB are defensible and unargued; arguing about them is cheap now |
| One vault or one-per-record? | One vault is simpler and matches one-operator authority; per-record vaults would make record ownership a platform fact — worth revisiting at the fractal stage |
| Does the processor sign its commits? | A processor countersignature per commit would make the referee auditable too; costs a statement type |
| How does a mirror announce itself? | Mirroring is free by construction; discovery of mirrors is not designed |
---

*Added after publication, 20 August 2026 (site v0.1.12). No claim above has been changed — this pack supersedes rather than rewrites; the only edit was moving the licence line below this block so it stays last. Later documents that bear on this one:*

- `99__change-control.md` — **C7** — growth moves to the commit graph: an entry is a file inside a commit graph rather than a record that accumulates, which makes rule 1 topology rather than policy
- `08__ux-mockups.md` — **M8** — the index-disagrees-with-records state, rendered rather than silently resolved — the countermeasure for the unsigned convenience this document names as its weakest joint
- `10__user-stories-and-features.md` — features F1–F9, and stories D2 and D3, which are the chain and index properties above written as tests that can fail

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
