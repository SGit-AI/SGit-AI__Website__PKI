# pki.sgit.ai — good public key repositories existed, and were destroyed

> In 2019 the global keyserver network was flooded with garbage signatures until
> importing a poisoned certificate broke your installation. Its own maintainer called it
> **unsalvageable** — and the cause was a design goal stated at the outset, not a bug.
> Anyone proposing a key registry now should be able to show they designed it with that
> history in hand.

*Source: <https://pki.sgit.ai/index.html> · site v0.1.19 · markdown twin of the front page.*

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

## Three questions, three layers

| Question | What answers it | Kind of problem |
|---|---|---|
| Who is this agent? | [Identity](rules/index.html) — a signed statement in a registry | A registry problem |
| What may it do? | [Mandate](mandate/index.html) — a separate statement, revoked separately | A delegation problem |
| Should that produce this effect, now, here? | [Execution](execution/index.html) — a broker holding the credential the agent never sees | A broker problem |

## Not a new product — the missing half of one that ships

The keypairs, signing, encryption to a fingerprint and contacts list already exist. The
documentation says, in its own words, **no revocation, no directory**. Those two absences are
precisely what a registry supplies — a concrete user and a bounded scope.
[What already ships, and what is only proposed](shipped/index.html).

## Why registries for agents don't exist

Generating a keypair is trivial; getting it recognised requires reaching a trusted authority,
every route to which requires authentication, which requires the identity the agent does not
have. **A loop, not a missing feature** — and every common escape hands over authority broader
than the identity being created. [The bootstrap trap](bootstrap/index.html), and
[the account-less door that breaks it](enrolment/index.html).

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

## The registry MVP, proposed

A five-brief first-pass pack proposes the build: a public vault of append-only signed
statements, schemas for identity/mandate/grant/revocation, workflows an LLM session can
follow from a page, and read-path-first phasing.
Now a full dev pack of ten documents — diagrams, change control, a tabletop exercise,
the [interface written out screen by screen](packs/registry-mvp/ux-mockups.html), and
[six Wardley maps](packs/registry-mvp/wardley-maps.html) of where the novelty actually
sits, [the whole thing as deliverables](packs/registry-mvp/user-stories.html) — six users,
twenty-four stories, six workflows — [observability](packs/registry-mvp/observability.html), which answers who is using a
mandate by refusing the question and telling you instead who has never checked one, and
[the grant tree](packs/registry-mvp/grant-tree.html) — blast radius as a path, and the three-tier
test for whether a control is a boundary at all: [start at the pack hub](packs/registry-mvp/index.html).

And one part of it is built rather than designed: [map your own case](assess/index.html) — pick the
agents you run, tick what you meant them to do, and see the difference. It stores your choices and
never your answers, entirely in your browser, and you can check that in the network panel in ten
seconds.

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
