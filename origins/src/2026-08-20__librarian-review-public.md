# What A Cross-Reference Review Of The Corpus Found (Public Edition)

**version** public derivative, draft-1
**date** 20 August 2026
**source** A Librarian cross-reference review of `SGraph-AI__App__Send` at v0.33.61, produced by the SG/Send agentic team
**type** Redacted derivative

*This is a public edition. The original review is not published, and this document says plainly what was removed and why. Everything retained here is either a design lesson, a dated fact about what exists, or an honest count — none of it is actionable against a running system.*

---

## What was removed, and why

The original review is a working document written for an internal audience. Three classes of content in it should not sit on a public site, and they are removed here rather than lightly reworded:

| Removed | Why |
|---|---|
| **A named customer** | It appears across the review, the mapping and the manifest. A rollout customer's name is theirs to disclose, not ours. |
| **Security finding identifiers, severities and preconditions** | The review names unremediated findings against code that is running now, with enough structure to prioritise an attack. The review's own guidance is that publishing them "is publishing an attack roadmap". |
| **Specific implementation weaknesses in live endpoints** | Same reason, one level down: a precise weakness in a running service is a vulnerability report, not a design lesson. |

Also removed: investor-audience material and internal commercial classification schemes, which are confidential and not load-bearing for anything this site argues.

**What is kept:** the narrative, the counts, the honest reality check, and the design lessons. Those are the parts that make the site's claims checkable, and none of them help an attacker.

## The headline

**PKI thinking here is enormous; PKI shipping is small and frozen.** Roughly **110 PKI-relevant documents (~265,000 words)** against roughly **3,900 lines of PKI and crypto code**, essentially all of it written in a **six-day burst between 20 and 22 February 2026** and not materially changed since.

That ratio is the finding. A prior review measured the project-wide proposal-to-build ratio at roughly 5–9× in March 2026. For PKI specifically it is considerably worse.

## The centre of gravity moved four times

This is the arc the site was missing, and it is the strongest provenance asset the project has.

```
   Feb 2026    PKI as MESSAGING        recipient-addressed encryption
   Mar 2026    PKI as PROVENANCE       commit signing, document identity
   Jun 2026    PKI as AGENT IDENTITY   NHI 2.0, vault-to-vault, brokered kernels
   Jul–Aug     PKI as SUBSTRATE        mandate; "the write is the attestation"
```

Two moments in that arc matter more than the rest.

**The supply-chain ≅ agent-chain isomorphism was drawn on 23 February 2026** — four months before non-human identity was named as a programme here. An agent chain has the same shape as a software supply chain: each link consumes what the previous one produced, and a compromise anywhere propagates forward unless each step is independently verifiable.

**The self-challenge was run early and honestly.** In February the project asked *"is PKI even the right primitive?"* and compared the alternatives rather than assuming the answer. That is the same question [the failure page](../../failure/index.html) puts to a reader, arrived at independently and six months earlier.

## The reality check

### Exists and ships today

1. **Admin-console PKI messaging** — RSA-OAEP 4096 (non-extractable) with AES-256-GCM hybrid encryption, ECDSA P-256 signing, SHA-256 fingerprints, IndexedDB key and contact storage. **Admin authentication required; not available to any user.**
2. **An admin key registry** — publish, look up, unpublish, list and log, with short lookup codes, duplicate-fingerprint rejection, soft delete, and a genuinely hash-chained transparency log.
3. **Fingerprint-bound identity** — one key, one user.
4. **Multi-recipient envelope encryption** — one content key wrapped once per recipient.
5. **A public SSH key generator** — Ed25519 and RSA-4096, OpenSSH wire format, fully client-side. Deliberately extractable: a different trust model to the PKI console.
6. **An authenticated channel for vault-in-vault** — ECDSA P-256 signing plus ECDH P-256 agreement to a non-extractable AES-GCM key, with a replay guard. Exercised on one code path.
7. **Null-origin app frames** — app code cannot reach vault secrets by ambient means.
8. **Append/inbox capability gates** — the server stores only hashes of the capability keys.
9. **Symmetric key derivation** — cross-implementation, shipped.

### Design or proposal only

- **PKI in the product.** The send and receive paths users actually touch are **symmetric only**. Every claim describing "PKI mode" as a user capability is describing the admin console.
- **Commit signing.** Only the anonymous mode exists; its provenance guarantee is, in the corpus's own words, *"NONE — someone with the vault key did this."*
- The vault-hosted federated registry · vault-to-vault client crypto · the whole of NHI 2.0 · trust graphs, web of trust, agent trust scores, key rotation · external witnessing for the transparency log · hardware keys · post-quantum and crypto-agility · published agent public keys.

### The blunt version

What exists is a **very good February-2026 prototype behind admin authentication**, plus one production-grade authenticated channel whose blast radius is a single code path. Everything the corpus says about PKI as a product capability, an identity layer, an agent-trust substrate or a provenance guarantee is design.

## Five things this site did not previously say

1. **A registry was built, shipped and then formally retired.** The site argued for a registry from first principles; the project had already built one and knew why it was not enough. [Now published as prior art](../../rules/prior-art.html).
2. **The "is PKI the right primitive?" self-challenge was already run**, in February 2026.
3. **Key custody was tried, costed and deliberately outsourced** — *"storage is easy, recovery is the hard part"*, leading to a partner-recruitment posture rather than a build.
4. **The mandate/identity split** the site's own review called its largest gap is answered by roughly 60 documents written between June and August.
5. **The agent-chain isomorphism predates the programme that needed it** by four months.

## What this forces on the site

Three corrections, all applied at v0.1.7:

- The site's algorithm claim was **over-generalised** — correct for the CLI, wrong for the estate. Ed25519 and ECDH P-256 do ship, under different trust models.
- The site did not distinguish **code-verified** claims from claims **taken on trust**.
- **"No directory" is a retirement, not an absence.**

And one that remains open: several of the site's published open questions have substantial arguments already written behind them, and could honestly be reclassified from *open* to *argued, decision pending*.

## Honest limits of this derivative

- **It is a redaction, not a summary of everything.** Material was removed on judgement, and somebody with access to the original may reasonably disagree with where the line fell.
- **It is a snapshot** at v0.33.61, 20 August 2026. Counts and status will age.
- **It reports a review, not the code.** Where the review and the code disagree, the code wins — and this document has not re-verified the review's code reading independently.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
