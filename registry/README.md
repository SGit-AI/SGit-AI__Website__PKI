# The registry — first MVP, live as files

**date** 25 August 2026 · **status** static register, sgit-native, ten fixtures and one real record
**machine front door** [`llms.txt`](llms.txt) — an agent should start there; this file is the human account

Eleven records, twenty-three signed statements, one declared root. **Ten records are fixtures:
their private keys are published beside their public halves, deliberately** — including four
**pre-defined roles** any fresh session can assume by retrieval. **One record is real** (public
half only), which is what turns the `private_key_published` flag from a column into evidence
([change-control C19](../packs/registry-mvp/change-control.html)).

This register is not after confidentiality or integrity at this stage. It is after the thing the
registry MVP pack keeps saying is the actual product: **working out how agents and downstream
sites use and consume identities, mandates and grants** — including consumers that build risk on
top of the grant/mandate gap. Because the fixture keys are published, anyone can exercise **both
sides** of every workflow: sign as the issuer, accept as the subject, verify as the third party.
No credential exchange, no account, no waiting on anybody.

## sgit-native, by execution

The pack's dependency flag — *the exact `sgit pki` behaviour needs confirming; execute first,
then write* — is now closed by execution (sgit-ai v0.16.0, 25 Aug 2026):

| Reconciled | Finding |
|---|---|
| Fingerprint | sgit's derivation confirmed from source and output: sha256 over the DER SubjectPublicKeyInfo, first 16 hex. This register adopts it. sgit addresses **keystore** operations by the *encryption* fingerprint; records here are keyed by the *signing* fingerprint |
| Bundle | `body.bundle` is byte-shaped like `sgit pki export`: `{v, encrypt, sign, label, fingerprint, signing_fingerprint}` — `sgit pki import` accepts it directly |
| Signature | ECDSA P-256 over SHA-256, **raw r||s, 64 bytes, base64** — sgit's format, chosen in its source for Web Crypto interop, which means a browser can verify these statements natively. openssl needs one raw→DER conversion, published and executed in `llms.txt` |
| Round trips | `sgit pki verify` accepts statements signed by this tool; this tool verifies signatures produced by `sgit pki sign`. Both directions executed |
| Keystore | Plain files under `~/.sg-send/keys/<enc-fp>/`, passphrase-encrypted PEMs — which is what makes role assumption a copy command |
| Passphrases | `sgit pki keygen`/`sign` read the passphrase from stdin (with a may-be-echoed warning) — the pack's doc-03 passphrase tension, observed in practice |

## Roles: identities as retrievable costumes

[`roles.json`](roles.json) publishes four roles — **site-agent, processor, verifier, librarian** —
each a fixture identity whose record carries the plain private PEMs *and* a drop-in sgit keystore
with a published passphrase. Assuming a role is two commands (executed: `Signature valid (signer:
role: site-agent)`):

```
cp -r records/sha256-878bb98be58abc56/keystore/sha256_* ~/.sg-send/keys/
printf 'fixture-roles-2026\n' | sgit pki sign <file> --fingerprint sha256:3b768e160b2a55a2
```

role-site-agent also holds an **accepted mandate** — `repo.pull-request.create` on this
repository, constrained to `registry/**` on `dev` — so the role demonstrates the full loop:
identity, mandate, acceptance, verification. And it demonstrates the limit in the same breath:
**a role is a costume, not an identity.** The register can say what the role may do; it can never
say who wore it. That is why the sixth expected-verification case exists: role-site-agent
verifies YES, and the basis carries the fixture caveat that anyone holding the published key
could have been the signer.

## The real-identity class

`records/sha256-f9facb4c94da6c19` is the authoring session's own identity: `private_key_published:
false`, public halves only, and the validator enforces that **no private key material exists
anywhere in a non-fixture record's directory**. Its claims record the honest finding: the private
half lived only in the authoring session's ephemeral container, so the identity is
session-scoped — the pack's open persistence question (decision 28), executed rather than
described.

**Enrolling a real identity** — yours, or any agent's whose private half has a good place to
live — is two steps:

```
python3 tools/registry_tool.py enrol --label "your name" --agent-type human
git add registry/records/<new-dir> registry/index.json && git commit && <push / open a PR>
```

The helper generates the keypair, writes the record with public halves only, and stores the
private halves passphrase-encrypted in sgit's own keystore (`~/.sg-send/keys/`). **The write path
today is a git commit, and the processor is whoever reviews it** — rule 1 enforced by repository
permissions rather than by a lane-draining referee. The append-lane write path stays
designed-not-built, with the pack's phase-2 questions (lane anchors, token distribution,
processor transparency) exactly as open as the [readiness report](../packs/registry-mvp/readiness-report.md)
left them. The first **real root** — an identity fit to anchor trust chains — awaits exactly this
enrolment path; the current root is a fixture and `roots.json` says so in its own entry.

## What is demonstrated, record by record

| Record | Demonstrates | Verifier's answer (as of 2026-08-25) |
|---|---|---|
| `operator` | The issuer's record: five mandates, one revocation, one grant — issuer-signed statements live in the **issuer's** record (decision 1) | root — a **fixture root** |
| `agent-a` | The happy path, plus the grant showing **excess authority** (41 permitted vs 1 mandated) | **YES**, until 2026-10-01 |
| `agent-b` | Rule 2: revocation as a signed append with an effective date | **NO** — revoked, effective 20 Aug |
| `agent-c` | Intervals end — a mandate with no interval would not even be a mandate | **NO** — expired 1 Aug |
| `agent-d` | Acceptance semantics: issued, never accepted = **inert** (decision 8, provisional) | **NO** — never accepted |
| `agent-e` | Self-revocation on key compromise; historical state stays derivable | **NO** — identity revoked 24 Aug |
| `role-site-agent` | The full loop for an assumable role, and the costume lesson | **YES**, until 31 Dec |
| `role-processor` / `role-verifier` / `role-librarian` | Retrievable role identities, keystores included | no mandates yet |
| `session` (real) | The non-fixture class, and the session-scoped-identity finding | no mandates |

Those answers ship as data in [`views/expected-verifications.json`](views/expected-verifications.json) —
the acceptance test for anyone implementing a verifier. [`views/excess-authority.json`](views/excess-authority.json)
is the consumable for risk products: grant minus mandate, per subject, acceptor none. Both are
regenerable conveniences with no authority; `tools/registry_tool.py validate` recomputes both and
fails on drift.

Two fixtures are built to decay: **agent-a's mandate expires 2026-10-01** and role-site-agent's
on 2026-12-31 — a live verifier's answer flips from YES to NO with no file changing. Revocation
by clock, demonstrated by waiting.

## Decisions this registry takes, and whose they are

Continuing the [readiness report](../packs/registry-mvp/readiness-report.md)'s numbering:

| Report Q | Taken here | Standing |
|---|---|---|
| Q1 record model | **C7, the commit graph.** No `seq`/`prev`; statements are immutable signed files; ordering, history and tamper-evidence are the public git repository's | First implementation of the settled correction |
| Q2 lane anchors | **Out of scope** — the write path today is a git commit, stated as such | Still open, still gating the lane-based phase 2 |
| Q3 capability vocabulary | **Dodged, not answered.** [`capabilities.json`](capabilities.json) is a fixture vocabulary, exact-match only, containment deliberately undefined | Decision 6 stays open, project lead's |
| Q4 the CLI | **Closed by execution.** The register is sgit-native; the reconciliation table above is the record | Done |
| Q5 processor transparency | **Answered for the git write path**: commits are public, so the processor's decisions are the repo history. The lane's blind-ack conflict remains for phase 2 | Decision 15 open for the lane |
| Q6 acceptance semantics | **Inert**, demonstrated by agent-d | Decision 8 stays provisional |

Also taken: sgit's 16-hex short fingerprints as record identifiers (shipped-compatible; the open
caveat is that 64-bit identifiers invite ground-out collisions in an adversarial registry — full
hashes remain the safer choice for a real one, recorded here rather than decided); the proposed
size bounds with the per-statement bound at 16 KB (an identity carrying two PEM keys does not fit
in 8 KB — recorded in [`params.json`](params.json), decision 5 remains open); and Windows-safe
`sha256-<hex>` directory names.

## What the fixture class does to the four rules

C3's finding at real paths: the fixture programme is the conformance test of the
[four published rules](../rules/index.html). It **satisfies two** — only the owner writes to their
own record (the validator rejects any statement whose signer is not the record owner: the 2019
failure as a test case), and records are size-bounded. It **voids two** — revocation (anybody can
sign a fixture's revocation, and anybody can sign its reversal) and signature-substance (the
forgery demonstration in `llms.txt`: one command, `Verified OK`, meaning nothing). Knowing which
two fail, and why, is the finding.

One deliberate lesson in the dates: `created_at` values are **scenario dates** while every file
was signed on 25 August — and the git history says so. A statement's date is a claim by its
signer; the commit graph's dates are facts about publication. Here the two visibly disagree,
which is the difference a real registry's readers need to have felt.

## Re-run method

```
python3 tools/registry_tool.py validate      # flags first, ownership, every
                                             # signature, every reference, no
                                             # private material outside fixtures,
                                             # keystore/PEM agreement, bounds,
                                             # view drift, six expected answers
python3 tools/registry_tool.py verify sha256:df2bb4d93af69e6a repo.pull-request.create
rm -rf records roots.json roles.json index.json views && \
python3 tools/registry_tool.py make-fixtures # regenerates an EQUIVALENT registry
                                             # with new keys — not identical bytes
```

Requires `python3` (+ the `cryptography` package — the same library sgit itself uses), `jq`, and
optionally `sgit-ai` and `openssl` for the alternative verification paths. CI runs the validator
on every push and pull request via the site's validate job.

## Honest limitations

- **The write path is a git commit and the processor is a human reviewer.** Honest, real, and not
  the account-less lane the pack designs; phase 2's open questions are untouched.
- **Ten of eleven records being fixtures is one real record away from C19's degenerate case.**
  The session identity keeps the flag meaningful, and its key is already gone — the register's
  first genuinely durable real identity (and first real root) is still to be enrolled.
- **The capability vocabulary is a placeholder**, so every computed excess-authority number is
  demonstrable rather than defined.
- **Roles cannot be revoked meaningfully.** A role's key is published, so its revocation could be
  signed — and reversed — by anyone (C3). Retiring a role means republishing under a fresh key.
- **16-hex fingerprints are shipped-compatible and collision-cheap** for an adversarial registry;
  recorded above as an open question rather than decided.

All content CC BY 4.0.
