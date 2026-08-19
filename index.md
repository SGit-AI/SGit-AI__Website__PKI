# pki.sgit.ai — good public key repositories existed, and were destroyed

> In 2019 the global keyserver network was flooded with garbage signatures until
> importing a poisoned certificate broke your installation. Its own maintainer called it
> **unsalvageable** — and the cause was a design goal stated at the outset, not a bug.
> Anyone proposing a key registry now should be able to show they designed it with that
> history in hand.

*Source: <https://pki.sgit.ai/index.html> · site v0.1.2 · markdown twin of the front page.*

---

## One property, two outcomes

| | Append-only, owner-writes | Append-only, anyone-writes |
|---|---|---|
| Who may write to a record | Only its owner | **Anybody** |
| Can a stranger grow your record? | No | **Without limit** |
| Is every entry attributable? | Yes — signed by the owner | **No** — garbage is indistinguishable |
| Can something be withdrawn? | Yes — a signed append supersedes | **Never** — by design |
| Failure mode | A record grows slowly, in the owner's own hand | **Destroyed the network** |

Append-only is safe when a writer appends only to objects it owns, and fatal when anyone
may append to somebody else's. The rule to carry forward is not "append-only" — it is
*the writer owns what it writes*. [The full argument, with sources](failure/index.html).

## Four rules, published before the registry exists

1. [**Only the owner writes to their own record**](rules/index.html#r1) — turns around:
   anyone may append to anybody's certificate.
2. [**Revocation is a signed append, not a deletion**](rules/index.html#r2) — signed by
   the key being revoked, so the record stays append-only and still supports withdrawal.
3. [**Records are size-bounded**](rules/index.html#r3) — one poisoned key reached
   ~150,000 signatures because certificates had no limit.
4. [**Every entry is signed by something you can check**](rules/index.html#r4) — which is
   what makes untrusted mirrors safe.

## Identity and mandate are separate statements

| Statement | Says |
|---|---|
| **Identity** | This key belongs to this agent |
| **Mandate** | This agent may do these things, until this date, on whose authority |

Both checkable by a third party; the mandate revocable without touching the identity.
And the caution that travels with it: a signed mandate constrains what an agent may be
*authorised* to do, not what it does within that authority.
[Identity and mandate](mandate/index.html).

## Build order

A registry with one organisation's agents in it is testable; a global one is a
commitment — so the private registry comes before the public one.
[The six steps, the honest tensions, and six open questions published unresolved](roadmap/index.html).

## Who is writing this

Published by the sgit project, which builds the vault layer this registry would be built
on. The history is externally verifiable; the design is published as checkable rules
before the thing exists.
[The participant disclosure, including where our own approach loses](about/participant.html).

## Site

- [The documents](documents/index.html) — the scoping brief, verbatim
- [Comms: tasks & requests](admin/comms.html)
- [Release history](admin/versions.html)
- [How this site is built](admin/index.html)
- [llms.txt](llms.txt)
