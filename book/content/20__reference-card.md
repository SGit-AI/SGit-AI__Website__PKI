# Reference card

*One page, written to be pasted into an agent session. Everything below is checkable against files at public URLs, with no account, no API key and no session.*

---

## The two sentences you must carry

If you summarise anything from this estate, carry these with the claim. Dropping them misrepresents the source.

> **1. The register is built; the trustworthy register is not.** Ten of its eleven records are fixtures with private keys published on purpose, and the root is a fixture. Every signature verifies and proves nothing.
>
> **2. The enforcement is real and the authority is not, and they are independent halves.** A git hook genuinely refuses pushes; the mandate it enforces is signed by a fixture root, so anybody could forge it and the hook would enforce the forgery just as diligently.

## The three questions, never collapsed

| Question | Layer | Answered where |
|---|---|---|
| **Who is this agent?** | Identity — a registry problem | `pki.sgit.ai/registry/` |
| **What may it do?** | Mandate — a delegation problem | A signed mandate with an issuer and an interval |
| **Should this happen now?** | Execution — a broker problem | Named, **not built** |
| **What did it actually do?** | The receipt | **Nothing here supplies it** |

## The vocabulary

- **grant** — what the environment *can* do. A tree, measured, dated, provenance per node. **Never authored**; a hand-written grant is a wish. Authority nobody decided — and binding anyway, under apparent authority.
- **mandate** — what it is *expected* to do. Authored, issuer-signed, subject-bound, **carrying an interval — without one it is a grant under another name.** Allow-list stored; prohibitions are a dated rendering of its complement.
- **delta** — the finding. **Computed, never stored**, because a stored delta is stale the moment either side moves.
  - **excess authority** = `grant − mandate` — the security direction. Unaccepted by construction; defaults to critical.
  - **shortfall** = `mandate − grant` — the operations direction. The agent fails, it looks like a bug, and somebody widens the credential. **It matters as much as excess.**
  - **blind spots** = `library − self-report` — the third term, and the only thing that makes a self-report falsifiable.
- **self-report** — what *this* agent noticed. **A floor, not a census.**
- **library entry** — a measured, dated grant for one environment. Public, **no personal data ever**. Referenced by an instance, **never copied**.

## The one test for a control

> **A control bounds a grant only when it is enforced by something the grant does not include.**

| Tier | Enforced by | Worth |
|---|---|---|
| `boundary` | Something outside the grant — OS, separate account, container, network policy, a remote service | Holds against a compromised agent |
| `setting` | The tool itself, inside the grant | Bypassable by anything that can run code as that grant |
| `expectation` | Nothing — a prompt or a policy file | None. It is a mandate, and a mandate is not a control |

**A tier is a property of a node's relationship to the tree, not of the node.** A control whose defeat path exists in the same tree is a `setting`, never a `boundary`. Evidence classes: `observed · read · documented · inferred · none` — not equally trustworthy. `unknown` is a fact and renders as `unknown`, never as blank.

## The ordering rule

```
REALITY → TWIN → FACTS → FINDING ┃ RISKS → DECISIONS
────────── pki.sgit.ai ──────────┃── riskmandate.ai ──
```

A risk named before a fact is a guess. A decision recorded before a delta accepts nothing measurable. **The registry's half ends at *finding*.**

## The four registry rules

1. **Only the owner writes to their own record.** (A valid signature by a non-owner is the 2019 keyserver failure, not write authority.)
2. **Revocation is a signed append, not a deletion** — signed by the key being revoked.
3. **Records are size-bounded.** *Proposed only; not enforced.*
4. **Every entry is signed by something you can check.**

*Append-only is safe when a writer appends only to objects it owns, and fatal when anyone may append to somebody else's.*

## The verification walk

```
1  GET /registry/llms.txt · params.json · roots.json
2  GET /registry/records/<fp>/01__identity.json
3  READ body.private_key_published  ← BEFORE evaluating any signature
4  verify every statement against the OWNER's key;
   reject any statement whose signer is not the owner      (rule 1)
5  check identity revocations
6  follow acceptances → mandates in the ISSUER's record; verify it the same way
7  require the issuer in roots.json; check revocations; check the interval
8  answer YES (with expiry + authority) · NO (with the reason)
              · STOPPED (with where the chain ended)
```

**STOPPED is a legitimate output, not a failure.** Distinguish *confirmed*, *denied*, *unknown*, *unreachable*, *not checked* — and never render *unreachable* as *denied*.

**Signature format:** base64 of **raw `r||s`, 64 bytes**, ECDSA P-256 over SHA-256 — *not* DER. Canonical bytes: `jq -cS 'del(.sig)' statement.json`. (`params.json` says DER and is wrong; see Chapter 15, A1.)

## The acceptance test, as data

```
GET https://pki.sgit.ai/registry/views/expected-verifications.json
```

Six cases: `agent-a` YES · `agent-b` NO, revoked · `agent-c` NO, expired · `agent-d` NO, never accepted (inert) · `agent-e` NO, identity self-revoked · `role-site-agent` YES, *and anyone holding its published key can exercise it.*

Reproduce all six and you implement this register's walk. **Pass any of them without surfacing the fixture caveat and you have skipped the flag rule — you are wrong while looking right.**

## URLs that resolve

```
https://pki.sgit.ai/llms.txt                         the site's front door
https://pki.sgit.ai/bench/llms.txt                   what is built, and its limits
https://pki.sgit.ai/registry/llms.txt                the register's front door
https://pki.sgit.ai/registry/params.json             recipes (signature field: wrong)
https://pki.sgit.ai/registry/roots.json              one root, and it is a fixture
https://pki.sgit.ai/registry/roles.json              four roles; a role is a costume
https://pki.sgit.ai/registry/views/expected-verifications.json
https://pki.sgit.ai/registry/views/excess-authority.json    41 permitted / 1 mandated
https://pki.sgit.ai/registry/records/<sha256-hex16>/01__identity.json
https://pki.sgit.ai/registry/tools/registry_tool.py  validate · verify · enrol
https://pki.sgit.ai/packs/grant-and-mandate/tools/measure.py    measure your own grant
https://pki.sgit.ai/packs/grant-and-mandate/concepts.html       the lexicon
https://pki.sgit.ai/packs/grant-and-mandate/change-control.html 18 corrections, 32 decisions
https://pki.sgit.ai/packs/registry-mvp/readiness-report.md      the only outside reading
https://pki.sgit.ai/assess/index.html                the assessment, for a person
https://pki.sgit.ai/book/                            this book, its harness and its gates
```

## Run it yourself

```bash
git clone https://github.com/SGit-AI/SGit-AI__Website__PKI
cd SGit-AI__Website__PKI/registry && pip3 install cryptography
python3 tools/registry_tool.py validate
#  -> 11 records (10 fixtures, 1 real), 23 statements, all 6 answers reproduced

# and feel what a fixture signature is worth:
R=records/sha256-90f97984b9cf3930
printf '{"forged":"anyone can sign this"}' > forged.json
openssl dgst -sha256 -sign $R/private/sign.pem forged.json > forged.der
openssl dgst -sha256 -verify $R/public/sign.pem -signature forged.der forged.json
#  -> Verified OK.   A signature anybody can produce conveys nothing.
```

## What is not here

No capability vocabulary (`capabilities.json` is a fixture set, v0 — *what a capability name is* is unresolved). No append-lane write path; the write path is a git commit reviewed by a human, and the question of whether a lane with no anchors accepts any token holder is **unanswered and may make the designed enrolment path impossible**. No boundary-tier enforcement point. No blind-spot delta, ever computed. No receipts. No real root, and no identity anywhere with a durable place for its private half. Two environments, one agent, one mandate.

---

*CC BY 4.0 · `https://pki.sgit.ai/book/`*
