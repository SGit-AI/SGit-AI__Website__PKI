# 05 — Diagrams

**pack** Registry MVP · draft-1 · 20 August 2026
**role** The design as pictures: the estate, the record, the write path, the verification walk, the three-session demo, and the grant/mandate gap. Each diagram states what it claims and which pack document it comes from.

---

## D1 — Three sites, three thirds of one answer

From the v0.33.61 site access report: the composition the registry sits inside. The report's finding is that these cross-link only at the domain level; the pack's read-path phase is where page-level joins land.

```mermaid
flowchart LR
  subgraph nhi["nhi.sgit.ai — the problem"]
    T[Two-populations thesis:<br/>no identity for rented agents]
  end
  subgraph pki["pki.sgit.ai — the design"]
    R[Four rules · identity vs mandate<br/>bootstrap trap · this pack]
  end
  subgraph sgit["sgit.ai — the shipped commands"]
    C[sgit pki keygen/sign/verify/encrypt<br/>append lanes · no revocation, no directory]
  end
  T -->|"the gap this designs for"| R
  R -->|"operationalises onto"| C
  C -->|"its two absences are<br/>exactly what this supplies"| R
```

## D2 — The registry tree (from 01)

```mermaid
flowchart TD
  V["registry/ — one public vault"]
  V --> L["llms.txt<br/>the machine-readable front door"]
  V --> RT["roots.json<br/>declared trust roots"]
  V --> P["params.json<br/>bounds + canonicalisation version"]
  V --> IX["index.json<br/>curated convenience — NO authority"]
  V --> REC["records/"]
  REC --> R1["sha256:69d9…790c/<br/>00001.json · 00002.json · …"]
  REC --> R2["sha256:a461…23ac/<br/>00001.json · …"]
  style IX stroke-dasharray: 5 5
```

## D3 — A record is a hash chain (from 01)

Claim: a mirror cannot drop a middle statement without the chain failing, and current state is read-to-the-end.

```mermaid
flowchart LR
  S1["00001.json<br/>type: identity<br/>seq 1 · prev ∅<br/>sig: subject"]
  S2["00002.json<br/>type: acceptance<br/>seq 2 · prev H(00001)<br/>sig: subject"]
  S3["00003.json<br/>type: revocation<br/>seq 3 · prev H(00002)<br/>sig: subject"]
  S1 --> S2 --> S3
  S3 -.->|"current state"| CUR(("read to<br/>the end"))
```

## D4 — The write path (from 01, transport from the shipped surface)

```mermaid
sequenceDiagram
    participant A as Agent (untrusted<br/>holds: its own key)
    participant L as Append lane<br/>(shipped, account-less)
    participant P as Processor (trusted<br/>holds: enum_key + write key)
    participant V as Registry vault<br/>(public read)
    A->>A: keygen · build statement · sign (canonical bytes)
    A->>L: POST write {append_token, payload}
    L-->>A: {"ok":true} — blind, by design
    P->>L: list / fetch pending
    P->>P: verify sig · seq · size · policy
    P->>V: commit 0000N.json + regenerate index
    P->>L: mark-processed
    A->>V: GET index.json — the outcome channel<br/>is the public read path
```

## D5 — The verification walk (from 02)

```mermaid
sequenceDiagram
    participant W as Verifier (any session)
    participant V as Registry (public URLs)
    W->>V: GET roots.json
    W->>V: GET subject record
    W->>W: verify chain (seq/prev) + every signature
    W->>V: follow acceptance → issuer record
    W->>W: verify issuer chain back to a root
    W->>W: check revocations, both records, to effective_from
    Note over W: answer: "X may do Y until Z, on authority A"<br/>— or refuse, with the reason
```

## D6 — The three-session demo (from 04, phase 4)

```mermaid
sequenceDiagram
    participant I as Session 1 — Issuer
    participant S as Session 2 — Subject
    participant W as Session 3 — Verifier
    participant R as Registry (public)
    I->>R: mandate → ISSUER's record (via lane + processor)
    S->>R: acceptance → SUBJECT's record
    W->>R: fetch both records + roots
    W->>W: full walk (D5)
    Note over I,W: three sessions, nothing shared but public URLs —<br/>the acceptance test that matters
```

## D7 — Grant, mandate, excess authority (from v0.33.61, folded in via 06)

Claim: the registry records all three sides, which is what makes the gap countable.

```mermaid
flowchart TD
  G["GRANT — what the credential permits<br/><i>every repo the human authorised,<br/>read and write, indefinitely</i>"]
  M["MANDATE — what was authorised and expected<br/><i>commit to one branch of one project,<br/>this afternoon, signed, with an interval</i>"]
  X["EXCESS AUTHORITY = grant − mandate<br/>held · unauthorised · unaccepted<br/>defaults to critical, escalates unaided"]
  G ---|difference| X
  M ---|difference| X
  style X stroke-width:3px
```

## D8 — Fixture or identity? (from v0.33.61, folded in via 06)

Claim: the `private_key_published` flag must be read **before** the signature, because a fixture's signatures verify and prove nothing.

```mermaid
flowchart TD
  E[Registry entry] --> Q{private_key_published?}
  Q -->|"true — FIXTURE"| F["signatures prove nothing<br/>lane is a public inbox<br/>never reachable from the trust graph<br/>retire by republishing under a fresh key"]
  Q -->|"false"| K["signature proves possession<br/>trust remains a policy decision<br/>evaluate evidence, walk to a root"]
  Q -->|"absent"| REJ["reject the entry —<br/>the field has no default"]
```
---

*Added after publication, 20 August 2026 (site v0.1.12). No claim above has been changed — this pack supersedes rather than rewrites; the only edit was moving the licence line below this block so it stays last. Later documents that bear on this one:*

- `08__ux-mockups.md` — the same objects as screens rather than structures — what a reader actually sees when D5's walk resolves, or refuses
- `09__wardley-maps.md` — the strategic counterpart: these diagrams say what shape the design is, the maps say where each piece sits and how evolved it is
- `10__user-stories-and-features.md` — a mandate lifecycle state diagram, which is the one shape this document does not carry

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
