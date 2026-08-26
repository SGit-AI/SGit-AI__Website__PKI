# The Two Documents And The Delta Between Them: Grant, Mandate, And Why The Delta Is Never Stored

**pack** Grant and Mandate · draft-1 · 26 August 2026
**role** The grant document, the mandate document, and the delta computed between them. Two files, not one, because they have different authors, different lifecycles and different trust properties. Field names are a first pass; the separations are the design.

---

## Two files, because they differ in every axis that matters

| | `grant` | `mandate` |
|---|---|---|
| Produced by | **Measurement**, generated | **A person**, authored |
| Authority of | The environment as it is | The issuer |
| Signed by | Whoever ran the measurement | **The issuer** — this is what makes it a mandate |
| Carries an interval | No — a **measurement date** | **Yes** — without one it is a grant under another name |
| Changes when | The environment changes | Somebody decides |
| Keyed | **No** — an artefact | **No** — an artefact |

Neither gets a keypair, settled in the registry pack (C19): a signature's value is the scarcity of its private half, and an artefact cannot keep a secret. Both get an identifier, a content hash, and a signature — the grant the measurer's, the mandate the issuer's.

## The grant document

Generated, dated, provenance per node, and a `history` field that changes the meaning of everything under it.

```json
{
  "v": 0,
  "environment": { "product": "...", "surface": "...", "vendor_named": false },
  "measured_at": "2026-08-26",
  "measured_by": { "who": "...", "identity_record": "sha256:...",
                   "caveat_floor_not_census": true },
  "history": {
    "retained": true,
    "window": "session-scoped; container reclaimed after inactivity",
    "note": "with history retained the grant is a UNION over prior sessions,
             not a tree over the present — this field changes every node below"
  },
  "nodes": [
    {
      "id": "n1", "parent": null,
      "capability": "what it can do",
      "reachable": "what that reaches",
      "tier": "boundary | setting | expectation | none | unknown",
      "control": "what stands in the way, or null",
      "evidence": "read | observed | documented | inferred | none",
      "method": "how this node was evidenced, and when"
    }
  ],
  "worst_path": ["n1", "n2", "n3"],
  "sig": "<the measurer's signature over the canonical bytes>"
}
```

Three rules the format enforces:

- **Every node names its source and method.** `read | observed | documented | inferred | none` — and a node evidenced by `none` is kept and marked, because *the gaps are worth mapping too* (graphs-site discipline). Omitting an unevidenced node would silently upgrade the document from a floor to a claimed census.
- **Every node names its tier**, from the one test in [document 01](01__concepts.md). A list of what is reachable *without* what stands in the way is the part people already have and the part that misleads.
- **A measurement date, not a version.** Drift is answered by re-measuring and diffing, not by asking anyone to remember — so the date is the anchor, and the method is published so somebody else can run it and get the same answer.

The `measured_by.caveat_floor_not_census` flag is required and load-bearing: the agent measuring its own grant is the instrument and the subject, so the document says *floor* on its face.

## The mandate document

Authored, issuer-signed, interval-bearing. The allow-list is stored; the prohibitions are generated.

```json
{
  "v": 0,
  "issuer": "sha256:<issuer signing fingerprint>",
  "subject": "sha256:<the environment/agent this governs>",
  "issued_at": "2026-08-26T00:00:00Z",
  "expires_at": "2026-12-31T00:00:00Z",
  "revocation": "issuer's record, appended, effective_from",
  "allow": [
    { "capability": "repo.contents.push",
      "resource": "github.com/SGit-AI/SGit-AI__Website__PKI",
      "constraints": { "branches": ["agent/*"] } }
  ],
  "prohibitions_rendered_at": "2026-08-26",
  "prohibitions": [
    "will not push to any branch outside agent/*",
    "will not act outside the named repository"
  ],
  "sig": "<the issuer's signature>"
}
```

- **`allow` is the enforceable form; `prohibitions` is a dated rendering of its complement.** A deny-list stored as the rule widens silently the moment a provider ships a capability it could not have excluded — so the allow-list is stored, and prohibitions are *generated* over a known capability set, carrying the date they were generated from (registry pack C12/C17). The person accepts the prohibitions; the system enforces the allow-list.
- **The interval is mandatory.** A mandate with no `expires_at` is rejected — it is a grant wearing a mandate's name.
- **The compilation target matters.** An `allow` list that compiles to Cedar inherits *evaluation outside the agent's loop*; one that compiles to a prompt does not. See [document 04](04__workflows.md).

## The delta — computed, never stored

```json
{
  "computed_at": "2026-08-26T00:00:00Z",
  "against": { "grant": "sha256:...", "mandate": "sha256:...",
               "library": "sha256:...", "self_report": "sha256:..." },
  "excess":     [ "in grant, not in allow — the exposure nobody accepted" ],
  "shortfall":  [ "in allow, not in grant — the operations gap" ],
  "blind_spots":[ "in library, not in self-report — what the agent missed" ]
}
```

**The delta is recomputed on demand and never persisted**, for the same reason a register entry carries no history array (registry pack C7): a stored delta is stale the instant either side moves, and the whole value of the system is that it can be recomputed at any time. What *is* stored is the two documents and the references; the finding is always fresh.

Three deltas, three audiences: **excess** for security, **shortfall** for operations, **blind spots** for whoever is deciding whether to trust this agent's self-assessment at all.

## Honest tensions

| Tension | Note |
|---|---|
| The grant is a floor | An agent cannot enumerate what it does not know it has; the document says so, and the blind-spot delta measures exactly the gap |
| Two documents to keep current | It separates the measured from the decided, at the cost of two lifecycles instead of one |
| Prohibitions as a generated view | It reconciles legibility with safety — and it means what the person accepted is a *rendering* of the stored rule, dated so a regeneration cannot retroactively change what was agreed |
| The delta computed not stored | Always fresh, and it means there is no durable "finding" object to point at — the finding is a function of two documents, run when asked |

---

*CC BY 4.0.*
