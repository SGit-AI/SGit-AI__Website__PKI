# The Public Registry MVP: Open Data, A Single Operator, And LLM Sessions As The First Users On Both Sides

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Engineering, Architecture

**type** Briefing pack, leading brief

*Read this first. Four briefs follow. This pack is a first pass produced by the site agent at the project lead's request, for review — it proposes, it does not decide. Everything in it is constrained by the four registry rules already published on pki.sgit.ai, and every claim about the shipped platform is taken from sgit.ai's own executed documentation rather than from memory.*

---

## What This Pack Is For

A buildable MVP of the registry this site has so far only described: **a public store, built on vaults, holding public keys, identities, mandates and grants — where the first users on both sides of every workflow are LLM sessions.**

The deliberate inversion is in that last clause. The usual order is: build the service, then write the client, then document it, then discover whether an agent can use it. This MVP runs the other way: **the documented workflow is the first client.** An LLM session with the sgit CLI and curl — a session exactly like the ones building this site — follows a published page and enrols itself, fetches a record, verifies a mandate. If the page is not sufficient for that, the MVP is not done, whatever code exists.

## The Scope Decision, Stated Honestly

**Confidentiality is out of scope, and that is principled rather than lazy.** A registry's contents — public keys, identity claims, mandates, grants, revocations — are *meant* to be public. There are no secrets in a registry; publishing one plaintext is not a compromise waiting to be fixed, it is what a registry is.

What is **in** scope is the part of security that a registry actually consists of:

| Property | In the MVP? | How |
|---|---|---|
| Confidentiality | **No** — nothing in the registry is confidential | — |
| **Integrity** | **Yes** — it is the point | Every statement signed; anybody can re-verify the whole registry |
| **Authenticity** | **Yes** — it is the point | Signatures resolve against keys the reader can check (rule 4) |
| Availability | Best effort | Static hosting, mirrorable by anybody (a vault property) |
| Enforcement | **By verification, not by server** | See below — the MVP's one honest weakening |

The one honest weakening: in the MVP, the four rules are checked by a **trusted processor** and by **anybody re-running the validator over the public data** — not enforced by the storage layer. The server does not understand registry rules; the referee is a process holding the write key. Because everything is public, a violation is detectable by anyone, which is the MVP's substitute for enforcement: **enforcement is verification anybody can re-run.** That is acceptable for an MVP whose enrolment policy is "our own agents", and it is exactly the kind of gap the site's discipline requires stating rather than hoping nobody notices.

## This Is Not A Reversal Of The Build Order

The site's headline ordering claim is *a private registry is testable; a public one is a commitment*, and this pack proposes something called a public registry, so the apparent contradiction needs resolving before anything else.

**The MVP is public in data and private in authority.** One operator, one trust root, and an enrolment policy of "this project's own agents". The things that make a *public* registry a commitment — strangers enrolling, abuse, moderation, contested trust roots — are all still deferred, because the door is policy-closed even though the data is world-readable. What ships is **the private registry, published**: build-order step 4, with the covers off.

Publishing the data early buys three things a covered private registry would not: every workflow is testable by any LLM session anywhere with no credential handshake first; the validator can be run by anybody, so our own rule-keeping is checkable from day one; and the read path — the half that a future genuinely-public registry shares — gets exercised at real URLs from the start.

## The Four Objects

The registry holds four record types, all as signed statements in append-only records:

| Object | Says | Signed by | Revoked when |
|---|---|---|---|
| **Identity** | This key is this agent | The key itself | The key is compromised |
| **Mandate** | This agent may be authorised to do these things, until this date | The issuing authority | The permission changes |
| **Grant** | This concrete capability instance was issued under that mandate | The issuing authority | The instance is withdrawn |
| **Revocation** | The referenced statement no longer applies, from this date | Whoever could sign the original | — (a revocation is not revoked; it is superseded) |

The mandate/grant split is the pack's one addition to the site's published model, and it is the policy/instance distinction: a **mandate** is the standing delegation ("this agent may open pull requests on this repository until October"); a **grant** is one issued instance under it ("this append token, for this lane, single use, expiring Friday"). They revoke independently for the same reason identity and mandate do — they change at different times for different reasons. Receipts, the third corner, stay out of the registry: a receipt is the executor's statement, not the registry's, and the schema reserves the reference slot without owning the object.

## The One Structural Decision Worth Arguing About

**Where does a mandate live?** Rule 1 says only the owner writes to their own record. A mandate is signed by the issuer, about a subject. Putting it in the subject's record means somebody other than the owner wrote there — the exact property that destroyed the keyservers.

The pack's answer: **a mandate is the issuer's statement, so it lives in the issuer's record.** The subject may append an *acceptance* to its own record, pointing at it. Every record then contains only statements its owner signed; the writer owns what it writes, with no exceptions to keep track of. The cost is that answering "what may agent X do?" requires an index across issuer records — which the processor maintains as a **curated convenience carrying no authority**, since the signatures, not the index, are what a verifier trusts. Full treatment in brief 02.

## Why Vaults, Concretely

The reasons are now executed facts rather than design claims. Public vault read requires no authentication, which is what makes the registry a set of plain HTTPS URLs an agent can fetch. The append lane gives an account-less write path for enrolment — a token in the body, no account, blind acknowledgement — which is the narrow door the bootstrap trap requires. And versioning is native, so "what did this record say in March?" is answerable without building an audit log. What vaults do not supply — ownership, size bounds, signature checking — is the processor and validator, which is precisely the part this MVP exists to build.

## Reading Order

| Order | Brief | Covers |
|---|---|---|
| 1 | This document | Scope, the four objects, the ordering reconciliation |
| 2 | `01 — registry as a public vault` | Record layout, statement envelope, the processor, rule enforcement |
| 3 | `02 — schemas, first pass` | Identity, mandate, grant, revocation; canonical serialisation; where mandates live |
| 4 | `03 — the first client is a documented workflow` | The LLM-session workflows, end to end, in copy-paste form |
| 5 | `04 — build order and acceptance tests` | Read path before write path; what done means at each phase |

## Three Things Worth Not Losing

**The first client is a page, not a program.** If a fresh LLM session given only llms.txt cannot complete the workflow, the MVP is not done.

**Enforcement is verification anybody can re-run.** The MVP's substitute for server-side rules, honest because the data is open.

**Public in data, private in authority.** The build order holds; only the covers come off early.

---

## Key Points

| # | Point |
|---|---|
| 1 | The MVP is a public store on vaults holding keys, identities, mandates and grants |
| 2 | Confidentiality is out of scope because registries contain no secrets; integrity and authenticity are the point |
| 3 | The four rules are checked by a processor and by public re-validation, not enforced by the server — stated, not hidden |
| 4 | This is the private registry published, not the public registry built: one operator, one root, own-agents enrolment |
| 5 | Mandate and grant split as policy and instance, revocable independently |
| 6 | A mandate lives in the issuer's record; the subject's record carries an acceptance — rule 1 with no exceptions |
| 7 | The index is a curated convenience carrying no authority; signatures carry the authority |
| 8 | The first client is a documented workflow an LLM session follows, and the acceptance tests are phrased that way |
---

*Added after publication, 20 August 2026 (site v0.1.12). No claim above has been changed — this pack supersedes rather than rewrites; the only edit was moving the licence line below this block so it stays last. Later documents that bear on this one:*

- `99__change-control.md` — **C1 redefines *grant*** — the definition used above (one instance issued under a mandate) is superseded: a grant is what a credential technically permits, whether or not anybody wrote it down, and the gap to the mandate is excess authority
- `09__wardley-maps.md` — **W3** — the two absences this brief scopes around, positioned: not underneath the shipped surface but on top of it, in Genesis
- `10__user-stories-and-features.md` — this scope as fourteen features and six workflows, each tagged with the phase that ships it

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
