# Identity, Mandate, Grant, Revocation: The Statement Bodies, First Pass — And Why A Mandate Lives In The Issuer's Record

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Engineering, Architecture

**type** Architecture brief (first pass)

*Third document of the registry MVP pack. The body of each statement type, the mandate/grant split, and the structural decision the pack most wants reviewed: where issuer-signed statements live. Schemas are a first pass — field names are proposals, the separations between objects are the design.*

---

## What This Is

The four statement bodies that fill the envelope defined in brief 01, plus `acceptance`, which exists because of where mandates live. The organising principle throughout: **each object answers one question, is signed by the party whose statement it is, and revokes independently of the others, because each changes at a different time for a different reason.**

## Identity

The subject's own statement, first in every record. Self-signed by the key it describes — which proves possession and, as the site already states, proves nothing about trust.

```json
"body": {
  "bundle": {
    "v": 1,
    "encrypt": "-----BEGIN PUBLIC KEY-----\n...",
    "sign": "-----BEGIN PUBLIC KEY-----\n...",
    "label": "site-agent (pki.sgit.ai)",
    "fingerprint": "sha256:a4615402a0bc23ac",
    "signing_fingerprint": "sha256:69d9b4835ccf790c"
  },
  "agent_type": "llm-session | service | human | operator",
  "operated_by": "sha256:<fingerprint of the operator's record, if claimed>",
  "claims": { "platform": "claude-code", "note": "free text, unverified" }
}
```

The `bundle` is exactly the shipped `sgit pki export` output — the registry adds no key format of its own. `operated_by` is a *claim* pointing at another record; whether anything corroborates it is an issuer decision at mandate time, not an identity property. The MVP resists putting anything verifiable-sounding here precisely because identity statements are self-issued: **the identity statement is the one place where saying less is more honest.**

## Mandate

The issuer's statement of standing delegation. Signed by the issuer; names the subject.

```json
"body": {
  "mandate_subject": "sha256:<subject signing fingerprint>",
  "capability": "repo.pull-request.create",
  "resource": "github.com/SGit-AI/SGit-AI__Website__PKI",
  "constraints": {
    "branches": ["dev"],
    "paths": ["briefs/**", "documents/**"],
    "max_files": 20
  },
  "environment": "production",
  "valid_from": "2026-08-20T00:00:00Z",
  "valid_until": "2026-10-01T00:00:00Z",
  "on_authority_of": "sha256:<issuer's own authorising ref, if chained>"
}
```

The field set is the execution work's mandate object, trimmed to what a registry can host: subject, capability, resource, constraints, environment, validity. The registry **records** mandates; it does not enforce constraints — enforcement is the execution broker's job, and the published caution travels with the schema: *a mandate constrains what an agent may be authorised to do, not what it does within that authority.*

## Grant

The issuer's statement of one concrete instance under a mandate. The policy/instance split:

| | Mandate | Grant |
|---|---|---|
| Answers | What standing delegation exists? | What specific capability instance was issued? |
| Lifetime | Weeks–months | Hours–days, possibly single-use |
| Example | "may open PRs on this repo until October" | "this append token, this lane, single use, expires Friday" |
| Revoked when | The relationship changes | The instance is withdrawn or spent |

```json
"body": {
  "grant_subject": "sha256:<subject signing fingerprint>",
  "under_mandate": { "record": "sha256:<issuer fp>", "seq": 7 },
  "instance": {
    "kind": "append-token | access-url | capability-ref",
    "descriptor": "sha256:<hash of the issued capability — never the capability itself>"
  },
  "uses": 1,
  "valid_until": "2026-08-22T00:00:00Z"
}
```

One rule is absolute even in an open-data MVP: **the registry never contains a live capability.** A grant records the *hash* of what was issued — enough for the holder to prove "this token is that grant" and for an auditor to count instances, never enough for a reader to use it. This is the platform's own hashes-on-the-server discipline applied to registry content, and it is the line between "open data" and "published credentials". The site's key-leak tripwire already bans capability-shaped strings from the tree; the registry inherits that tripwire in its validator.

## Revocation

The append that withdraws, exactly as rule 2 published it:

```json
"body": {
  "revokes": { "record": "sha256:<fp>", "seq": 4 },
  "reason": "key-compromise | superseded | policy | expired-early",
  "effective_from": "2026-08-21T09:00:00Z"
}
```

Signed by whoever could sign the original: identity revocations by the subject key (self-revocation on compromise), mandate and grant revocations by the issuer. `effective_from` keeps the historical question answerable — what a key said *before* revocation stays checkable, which is the property a deletion could never give.

## Acceptance — And The Decision This Pack Most Wants Reviewed

Rule 1: only the owner writes to their own record. A mandate is the issuer's statement about a subject. Writing it into the subject's record breaks the rule the site is built on; the alternatives are:

| Option | Rule 1 | Cost |
|---|---|---|
| **A. Mandate lives in the issuer's record; subject appends an acceptance pointing at it** | **Intact, no exceptions** | "What may X do?" needs an index across issuer records |
| B. Mandate lives in the subject's record, as a carve-out for issuer-signed types | Broken, with an exception to document forever | Simple lookup |
| C. Both records carry a copy | Intact-ish | Two copies that can diverge — the worst property a registry can have |

**The pack chooses A.** The keyserver failure was precisely "anyone may append to anybody's record", and the first design decision after publishing that history cannot be "except issuers". A is also what the corpus's own ownership formulation implies: *the writer owns what it writes* — a mandate is the issuer's writing.

```json
"type": "acceptance",
"body": {
  "accepts": { "record": "sha256:<issuer fp>", "seq": 7 },
  "as": "mandate"
}
```

The acceptance closes the loop: a subject's record shows what it has agreed to operate under (a mandate the subject never accepted is issuable but inert), and a verifier reads one record to find the subject's view, follows references for the authority. The index makes the join cheap; the signatures make it true.

## The Verification Walk

What a verifier does with all of this — the workflow the whole design exists to serve:

```
   1  fetch roots.json               who may anchor a chain here
   2  fetch subject record           verify chain (seq/prev) and every sig
   3  identity = statement 1         key bundle, self-signed
   4  follow acceptances             to mandates in issuer records
   5  verify issuer chain            issuer's record, back to a root
   6  check revocations              in BOTH records, to effective_from
   7  current state = the last applicable statement, both sides
```

Every step is a fetch of a public URL plus a signature check with the shipped CLI — no accounts, no API keys, no state. That is what makes it an LLM-session workflow, which brief 03 writes out as one.

## Honest Tensions

| Tension | Note |
|---|---|
| Option A's index dependency | The rule-clean design makes the most common query need the one unsigned file; mitigated by the index being regenerable-by-anyone, never by trusting it |
| Grants in a registry at all | Instance-level records are high-churn for an append-only store; the size bound will be felt here first, and grants may belong in a separate higher-churn record class |
| Self-issued identity claims | `claims` invites people to read verified facts into unverified text; the schema keeps it, small, because labels are humanly necessary |
| Constraint vocabulary | `constraints` is provider-shaped (the execution brief's interpretation problem); the registry stores it opaquely and must resist growing a generic schema it cannot enforce |

## Open Questions

| Question | Notes |
|---|---|
| Is `acceptance` mandatory for a mandate to be considered live? | The pack says an unaccepted mandate is inert; the alternative reading (live on issue) is simpler and weaker |
| Do grants belong in the same records as identities? | Churn says maybe not; uniformity says yes; the MVP starts uniform and measures |
| Key rotation | A new identity statement for a new key, chained by cross-signature from the old — sketched but not schema'd in this pass |
| Multiple issuers per subject | Nothing prevents it and nothing yet ranks them; a verifier with two conflicting mandates has no tie-break rule |

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
