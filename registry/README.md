# The fixture registry — the registry MVP's first shipped surface

**date** 25 August 2026 · **status** all-fixture static registry, authored on a branch, awaiting adoption
**machine front door** [`llms.txt`](llms.txt) — an agent should start there; this file is the human account

Six records, sixteen signed statements, one declared root — and **every private key in this
register is published beside its public half, deliberately.** This register is not after
confidentiality or integrity at this stage. It is after the thing the registry MVP pack keeps
saying is the actual product: **working out how agents and downstream sites use and consume
identities, mandates and grants** — including consumers that build risk on top of the
grant/mandate gap. Anyone can fetch these files, verify every signature, run the whole
verification walk, and — because the private halves are published — exercise **both sides** of
every workflow: sign as the issuer, accept as the subject, verify as the third party. No
credential exchange, no account, no waiting on anybody.

The price of that, stated the way the pack states things: **no signature here proves anything.**
A signature's value is the scarcity of its private half ([change-control C19](../packs/registry-mvp/change-control.html)),
and this register has none. Every identity carries `private_key_published: true`, the flag the
pack made required and default-free ([C3](../packs/registry-mvp/change-control.html)) — and a
verifier that forgets to read it **before** checking signatures will pass five confident wrong
answers in a row, which is precisely the implementation bug this register exists to drill out.

## What is demonstrated, record by record

| Record | Demonstrates | Verifier's answer (as of 2026-08-25) |
|---|---|---|
| `operator` | The issuer's record: four mandates, one revocation, one grant — issuer-signed statements live in the **issuer's** record (decision 1) | root of this registry — a **fixture root** |
| `agent-a` | The happy path: mandate + acceptance, plus the grant showing **excess authority** (41 permitted vs 1 mandated) | **YES**, until 2026-10-01 |
| `agent-b` | Rule 2: revocation as a signed append with an effective date | **NO** — revoked, effective 20 Aug |
| `agent-c` | The interval rule: a mandate with no interval is a grant wearing a mandate's name — and intervals end | **NO** — expired 1 Aug |
| `agent-d` | Acceptance semantics: issued and never accepted = **inert** (decision 8, provisional) | **NO** — never accepted |
| `agent-e` | Self-revocation on key compromise; historical state stays derivable | **NO** — identity revoked 24 Aug |

Those five answers are the pack's phase-1 and phase-3 acceptance tests, shipped as data:
[`views/expected-verifications.json`](views/expected-verifications.json) is the oracle for anyone
implementing a verifier. [`views/excess-authority.json`](views/excess-authority.json) is the
consumable for risk products — grant minus mandate, per subject, acceptor: none. Both are
regenerable conveniences carrying no authority; `tools/registry_tool.py validate` recomputes both
and fails if the committed copies drift from the records.

The valid case is built to decay: **agent-a's mandate genuinely expires on 2026-10-01**, at which
point a live verifier's answer flips from YES to NO with no file changing. That is revocation-by-
clock, demonstrated by waiting.

## Decisions this registry takes, and whose they are

The [readiness report](../packs/registry-mvp/readiness-report.md) found six blocking questions.
This registry answers, dodges or defers each — recorded here in the pack's own discipline, so
nothing is settled quietly:

| Report Q | Taken here | Standing |
|---|---|---|
| Q1 record model | **C7, the commit graph.** No `seq`/`prev` in the envelope; statements are immutable signed files; ordering, history and tamper-evidence are the public git repository's. "What did this say in March" is `git log`, not a chain replay | Operationalises a settled correction (C7); first implementation of it |
| Q2 lane anchors | **Out of scope** — this registry has no write path at all: no lane, no processor, no enrolment | Still open, still gating phase 2; untouched |
| Q3 capability vocabulary | **Dodged, not answered.** [`capabilities.json`](capabilities.json) is a fixture vocabulary, exact-match only, containment deliberately undefined | Decision 6 stays open and awaiting the project lead |
| Q4 the CLI | **Dissolved for fixtures.** The reference client is `openssl` + `jq` — ubiquitous, and sufficient because the keys are published. Reconciliation with `sgit pki` (fingerprint derivation included) stays open | Open item, no longer blocking |
| Q5 processor transparency | **Out of scope** — no processor exists here | Decision 15 stays open |
| Q6 acceptance semantics | **Inert**, the pack's own proposal, demonstrated by agent-d | Decision 8 stays provisional |

Two more taken in passing: the proposed size bounds are adopted with the per-statement bound
raised to 16 KB (an identity carrying two PEM public keys does not fit in 8 KB — recorded in
[`params.json`](params.json) rather than silently resized, and decision 5 remains the project
lead's); and record directories are named `sha256-<hex16>` rather than `sha256:<hex>`, because a
colon in a path breaks Windows checkouts — the full fingerprint inside the statements is the
identifier, the directory name is an address.

## What the fixture class does to the four rules

C3's finding, now demonstrable at real paths: the fixture programme is the conformance test of
the [four published rules](../rules/index.html). It **satisfies two** — only the owner writes to
their own record (checked by the validator: any statement whose signer is not the record owner is
rejected — the 2019 failure as a test case), and records are size-bounded. It **voids two** —
revocation (agent-e's revocation is signed by a published key, so anybody could sign it, and
anybody could sign its reversal) and signature-substance (the forgery demonstration in `llms.txt`:
one `openssl` command, `Verified OK`, meaning nothing). Knowing which two fail, and why, is the
finding.

One deliberate lesson in the dates: `created_at` values are **scenario dates** (a mandate
"issued" 1 July, a revocation "effective" 20 August) while every file was actually authored and
signed on 25 August — and the git history says so. A statement's date is a claim by its signer;
the commit graph's dates are facts about publication. In this register the two visibly disagree,
which is the difference a real registry's readers need to have felt.

## Re-run method

```
python3 tools/registry_tool.py validate      # re-verify everything: flags first,
                                             # ownership, every signature, every
                                             # reference, bounds, view drift, and
                                             # the five expected answers
python3 tools/registry_tool.py verify sha256-6ecf074a638e73b0 repo.pull-request.create
rm -rf records/ && python3 tools/registry_tool.py make-fixtures
                                             # regenerates an EQUIVALENT registry
                                             # with new keys — not identical bytes
```

Requires `python3`, `openssl`, `jq` — nothing else. The tool runs the same commands `llms.txt`
publishes; a drift between the two is a bug. CI wiring for the site is one line in the validate
job of `.github/workflows/deploy-pages.yml`, left for adoption:
`- run: python3 registry/tools/registry_tool.py validate`.

## Honest limitations

- **This is the read path over fixtures.** No write path, no processor, no enrolment, no lane —
  the pack's phase-2 questions (anchors, token distribution, processor transparency) are exactly
  as open as the readiness report left them.
- **A registry that is 100% fixtures is the degenerate case of its own best flag.** C19: a flag
  that is always true is a column, not evidence. The flag becomes evidence on the day the first
  record with an unpublished private half enrols — and on that day GitHub's secret scanning and
  this site's key-leak tripwire flip from bystanders to controls, and publishing a real private
  key here becomes the incident the fixture class exists to prevent.
- **The capability vocabulary is a placeholder**, and therefore so is every computed excess-
  authority number: countable because the fixture grant carries counts, not because the set
  difference is defined.
- **`sgit pki` compatibility is asserted nowhere.** Fingerprint derivation, signature encoding
  and bundle shape here are defined in `params.json` from `openssl` primitives; reconciling them
  with the shipped CLI is open, and the pack's rule applies — execute first, then claim.

All content CC BY 4.0.
