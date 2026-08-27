# 2 · The flood, and the four rules it produced

*Part one — Why there is nothing to inherit*

---

Good public key repositories existed. They were destroyed. Anyone proposing a key registry today should be able to show they designed it with that history in hand, and this chapter exists so that this estate can.

The short version is on the site at `https://pki.sgit.ai/failure/index.html`, dated and cited. What follows is that history read for the thing that matters most about it, which is not the attack.

## What happened

In June 2019, an attacker flooded the OpenPGP certificates of two prominent contributors with bogus signatures and uploaded them to the global SKS keyserver network. One key reached roughly 150,000 signatures.

The effect was not that the keys became untrustworthy. It was worse and stranger: anyone who *retrieved* a poisoned certificate broke their own working installation, in hard-to-debug ways. The recommended mitigation became — and this is the sentence to sit with — stop retrieving data from the network entirely.

The network's own maintainer called it unsalvageable. Not "difficult to fix". Unsalvageable, on the grounds that changing a design goal of that magnitude means starting from a fresh sheet of paper rather than fixing anything.

A replacement keyserver was built. It is immune to the attack, and it achieved immunity by stripping all third-party signatures and unverified identities. The web of trust went with them. **The thing that made the system valuable and the thing that made it attackable were the same thing**, and the replacement chose survival.

## The part that matters: it was not a bug

Here is the detail that turns this from a war story into a design constraint. The fatal property was stated as a goal at the outset. The site records it as it was written:

> A key server may add information to a certificate. It may never delete either a certificate or information about one.

*Stated.* Read it twice, because everything follows from it. A key server could add and could never delete. That is not an oversight, a missing feature, or an implementation shortcut. It is a design goal, chosen deliberately, for reasons that were good at the time — a key server that can delete is a key server that can be compelled to delete, and censorship-resistance was the point.

And a design goal is not a bug you patch. That is why the maintainer's assessment was *unsalvageable* rather than *needs work*. You cannot ship a fix for a property the system was built to have.

*Drawn.* The site does not draw this conclusion in these words, but I think it is the most transferable thing on the page: **the failure mode of a well-designed system is usually one of its stated goals, met.** Nothing malfunctioned in 2019. Every component did exactly what it was specified to do. The attack consisted of using the system correctly, at volume, against somebody. Any registry designed today should be asked which of its own stated goals would look like this if somebody used it correctly, at volume, against somebody.

## Three abused properties, four rules

The site's move is to turn each abused property into a rule. Three properties, and the rules follow directly:

| Abused property | Rule it produces |
|---|---|
| A certificate may carry unlimited signatures | Bound the size of a record |
| Anyone may append to anybody's certificate | Only the owner may write to their own record |
| Nothing distinguishes a legitimate signature from garbage | Every entry is signed by something you can check |

The fourth rule comes from the never-delete goal rather than from the attack, and it is the one that looks impossible:

**Rule 1 — Only the owner writes to their own record.** The attack existed because anyone could append to anybody's certificate. Ownership of the written object is the property that separates safe append-only channels from fatal ones, so it is the first rule rather than a policy bolted on later.

**Rule 2 — Revocation is a signed append, not a deletion.** Signed by the key being revoked.

**Rule 3 — Records are size-bounded.** Generous enough to be invisible in normal use, small enough to stop flooding.

**Rule 4 — Every entry is signed by something you can check.** Which is what makes untrusted mirrors safe and the registry's contents portable.

## The tension in rules 1 and 2, and why it dissolves

Rules 1 and 2 are usually assumed to be in conflict. You cannot both refuse deletion and support withdrawal — that is the trap the keyservers fell into, and it is why they could not revoke anything.

The resolution is in rule 2's phrasing and it is worth stating carefully, because it is the single most elegant thing in this estate's design and it costs nothing.

A revocation is an appended statement, signed by the key being revoked. Four things then hold at once. The record stays append-only, so rule 1 is intact. The revocation is verifiable, because only the key holder could have signed it. What the key said before revocation stays checkable — which matters enormously, because the question an auditor actually asks is not *is this valid* but *was this valid last Tuesday*, and deletion destroys that question permanently. And a reader always sees current state by reading to the end.

The register implements this. Chapter 8 walks a record where an identity self-revokes on key compromise, and the verification walk returns NO for the right reason while the pre-revocation state remains derivable.

## The precise lesson about append-only

There is a sloppy lesson available here and the site refuses it. The sloppy lesson is *append-only is dangerous*. That would be a bad conclusion, and an expensive one for this project in particular, since append-only is used in five places across it — write-only telemetry, staging folders, event ledgers, vault inboxes, relay channels — and rightly.

The site's resolution is exact, and it is the sentence to carry out of this chapter:

> Append-only is safe when a writer appends only to objects it owns. It is fatal when anyone may append to somebody else's object.

*Stated.* The distinction is ownership, not appendability. The keyservers were fatal because anyone appended to anybody's certificate *and* nothing could be removed; the second clause turned a bad property into an unrecoverable one, but the first clause is where it went wrong. So the rule to carry forward is not "append-only" — it is that the writer owns what it writes.

## The trade the rules do not resolve

Rules 1 and 3 have a cost, and the site publishes it as its central open question rather than resolving it. It is at `https://pki.sgit.ai/rules/index.html#attestation`.

Third-party attestations — I vouch for this key belonging to this person — are what made the old system valuable. They are also exactly what made it attackable, because an attestation is by construction a write into somebody else's record. Permit them, and rules 1 and 3 must be enforced hard, with all the difficulty that implies. Forbid them, and the registry carries no social trust signal at all: it becomes a directory of self-assertions, which is useful and much less than what was lost.

The site publishes this unresolved. *Drawn.* I think that is the right call and I want to name what it costs, because the estate does not quite: a registry that forbids attestations answers *who claims to be this agent* and can never answer *who else believes it*. Every YES in Chapter 8's verification walk is therefore a statement about arithmetic and never about reputation. That is a real ceiling on what this design can ever be, independent of whether the fixtures are replaced with real keys, and it is not obviously the wrong trade — it is simply not a trade the estate has priced.

## What vaults supply, and what they do not

One more piece of ground-clearing, because it is the thing most likely to be assumed.

The transport layer underneath this design — the sgit vault layer — supplies distribution, custody without access, and versioning. Those are real and they are not nothing.

It does not supply the ownership rule, the size bound, or signature checking. Which is to say: it does not supply the registry logic, and the registry logic is precisely the part that failed last time. A vault is a good place to put a registry. It is not a registry, and a design that assumes otherwise has skipped the entire content of this chapter.

## What this earns

Publishing rules before an implementation is cheap to do in this order and impossible to claim afterwards. The site says so directly, and the value is a testable one: if something ships that breaks one of these rules, the rules page is the evidence.

Chapter 8 is that test, run against the four rules for the first time. The result is not uniform, and the chapter says which rule holds by construction, which holds by a check, and which is still only a proposed number in a parameters file.
