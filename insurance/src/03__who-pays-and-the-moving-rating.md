# Who Pays, And The Rating That Moves: Delta By Who Could Close It, And The World As An Input

*Doctrine document 03. Derived from memo 3 ([brief v0.33.74](../briefs/v0.33.74__strategy-brief__who-pays-for-the-delta-nobody-chose-and-the-rating-that-moves-overnight.md)). Proposed, not adopted: GM-D45 to GM-D50 are in change control awaiting the project lead.*

---

## 1 · The delta divides by who could have closed it

Documents [01](the-rating.html) and [02](the-ecosystem-and-the-gate.html) rate the delta between grant and mandate. Memo 3 asks the question that was skipped: **whose delta is it?**

> **One transcription artefact, flagged rather than repaired.** The memo reads *"I want to focus on the risks that exists **outside the main**"*, in a passage whose subject is what happens outside the **mandate** — the sentence before it names *"the authorised one, i.e. the mandates"*. Read as *outside the mandate*. Every other memo in the series had its artefacts flagged when it was read; this one did not, and the omission was found on audit rather than on the day.

The worked example is this estate's own. A code host offers read-only or read-write and nothing between. An operator who needs an agent to push at all must confer the ability to push to **every branch** — and, absent signed-commit enforcement, to **author commits as anybody**. The mandate says *your own branch, and dev*. The gap between them is real, dangerous, and **the operator did not choose it and cannot close it.**

No budget, care or diligence makes a platform offer a finer grain. So:

| Class | What it is | Operator can close it? | Whose |
|---|---|---|---|
| **Elective** | More conferred than needed, or an available control skipped — no branch protection, no signed commits, a token scoped to every repo when one would do | **Yes** | **The operator's** — the part effort moves, and the part a rating should charge for |
| **Structural** | The platform's finest grain is coarser than the mandate | **No** | **The platform's**, or nobody's. Identical in every customer's estate at once |
| **Defect** | A vulnerability temporarily widens the grant past its documented shape — repository settings, visibility, other accounts | **No, and could not have known** | **The platform's**, and *temporary* — which is why §3 exists |

> **A rating that does not separate these is unfair and useless in one move.** Unfair, because it charges for the unfixable. Useless, because a level an operator cannot move is not a decision input.

This sharpens [document 02's](the-ecosystem-and-the-gate.html) requirement that a derivation decompose: it must decompose **into what they can move and what they cannot** (GM-D45).

**Structural delta has a natural payer, and it is not a party — it is the pool.** A risk nobody can individually avoid and everybody shares is the textbook shape of pooled cover. It is also the shape of an argument a platform should be making to itself: **a platform that shipped branch-scoped tokens would convert a whole class of delta from structural to elective for every customer simultaneously**, and that conversion is countable.

## 2 · Platform granularity is a library artefact — and the only public good here

How coarse a platform's permissions are is **a fact about the platform**, identical for everyone. Measure it once, publish it once, reference it from every placement; never re-derive it per estate.

That is [the library/instance rule](../packs/grant-and-mandate/library.html) one level up: the registry holds the public library carrying no personal data, the instance holds references. **A platform-granularity library is the same object as a grant library, at a higher altitude** — the fractal the memos keep pointing at, in a form that is buildable rather than aspirational (GM-D46).

Worth naming: it is **the only part of this apparatus that is a public good.** One honest measurement of a platform's permission model serves every customer of it.

## 3 · The rating is a function of the world, not only the placement

A vulnerability lands. **The twin does not change** — the measurement recorded what it recorded, and the credential still reaches what it reached. What changed is **what that reach is worth.**

> **rating = f(placement twin, world state, mandate)** — and the twin and the world have **independent freshness**.

The estate already prints twin age on every evidence pack. A moving rating needs a **second age**: how current is our picture of the world? A rating against a six-day-old twin and a three-minute-old advisory is a different object from one where both are stale, and only saying so keeps it honest (GM-D47).

What this needs, none of which exists here:

| Requirement | State |
|---|---|
| A feed of platform-affecting events | Not in this estate; the inputs are public |
| **A mapping from an event to the grant nodes it widens** | **Does not exist anywhere.** Advisory feeds describe software, not capability trees |
| A re-rating trigger and notification | Mechanically small, once the above exist |

The middle row is the real work — *"this advisory widens node n4 from in-scope repositories to all repositories"* is a judgement somebody makes and records. **It is a library artefact too** (§2): made once, used by everyone.

## 4 · What a moving rating may say, and what it may not

Memo 3's *"gone 10x"* is the right instinct and the wrong output. **The magnitude is not computable and will not be for years**, because it needs loss data nobody has. Printing a multiplier would be false precision of exactly the kind this estate refuses elsewhere.

**The direction and the mechanism are computable today**, and they carry the decision:

- *"This placement's grant now reaches repository settings and visibility, which it did not yesterday"* — a named capability and a node count.
- *"A control that was a boundary is now defeated"* — a tier recomputation, which [the workbench](../workbench/index.html) already performs.
- *"Two mandate constraints are now unenforceable"* — a mandate-versus-grant recomputation.

> **A re-rating states what changed, which way, and which controls are implicated. Never a multiplier** (GM-D48).

An operator asked *is the value still worth it* is better served by *"your agent can now change repository visibility"* than by *"10x"* — the first is actionable, the second is a number they cannot check.

## 5 · Pulling the plug is a gate that closes on something already running

[Document 02](the-ecosystem-and-the-gate.html) made the rating a gate on go-live. Memo 3 extends it to a **continuous obligation**: *do we pull the plug, for an hour or a week.* That is harder — a go-live gate evaluates at a decision point; this one must evaluate on world events, when nobody is asking.

**The far end of the mechanism is already built.** A mandate is revoked by an append to the issuer's record — a signed statement with an effective date, never a deletion — and the register publishes a fixture demonstrating it, with the enforcement path from revocation to a refused push demonstrated at v0.1.28.

> **A rating crossing a threshold may emit a revocation** (GM-D49). Everything except the world-state input exists.

And the tier question bites here hardest: **a "pull the plug" that emails somebody is an expectation; one that revokes a mandate the agent's own hook honours is a setting; one the agent cannot reach is a boundary.** It declares which.

The memo's alternative — *buy temporary cover to keep operating* — is the same event with the opposite response, and in a stage with no money it has a direct analogue: **a time-boxed exception, recorded, that expires by itself.** Which is a mandate with a short interval, and the estate has those.

## 6 · The broker becomes a product with a measurable value

Memo 3 names *a broker service that facilitates access in a more privileged granularity way* — [the execution broker](../documents/execution-broker.html) the corpus designed in August as a security control, arriving from the commercial direction.

§1 gives it a price tag: **a broker's value is exactly how much structural delta it converts to elective.** The platform's finest grain is read-write and you cannot narrow it; interpose a broker that holds the credential and enforces the branch constraint, and the delta becomes something you *chose* to leave open or close.

That is the first commercially legible statement of what an execution broker is worth. The original warning gets sharper with it: the broker holds usable credentials and becomes the highest-value target in the estate — **so the broker needs its own rating, and it is the one placement where a bad rating is systemic.**

> **Superseded, in part.** [Document 06](the-broker-market.html) §2 shows this is true and incomplete: interposing a broker **removes reach from one tree and adds a party with reach of its own**, so the rating nets the two and the net is not automatically negative. The correction is recorded here as well as there, because a correction only one document knows about is not a correction.

## 7 · Liability: make the question answerable, do not answer it

*Who is responsible for the hallucination?* is unsettled law, being worked out in courts and contracts. **This estate should not pretend to settle it.**

There is a precise contribution available instead: any liability determination needs to know **what happened, under whose authority, against which mandate, with which controls in place** — and that is an evidence pack. The estate cannot say who pays. **It can make the question answerable rather than a swearing contest**, which is what the parties actually lack.

## 8 · The model vendor as its own underwriter — the memo asked it first

Memo 3 runs a list of candidate payers — *is it GitHub, is it the customer, is it the service provider* — and then asks one that stands apart from the rest:

> is Claude that actually owns that risk, or underwrites that — **is Claude going to actually have a policy on its own to cover any mistakes?**

**Today the answer is no.** Model vendors disclaim liability for output in their terms, which is the industry's settled position and not a gap somebody forgot to fill.

But the question is the more interesting half, because of what an answer would mean:

> **A vendor offering cover against its own model's mistakes would be making a falsifiable quality claim** — the first one in the category. Everything a model vendor currently publishes about reliability is a benchmark or a disclaimer. A policy is neither: it is a number somebody pays when they are wrong.

**This is the same structure [document 06](the-broker-market.html) later makes central**, arriving three memos early and aimed at a different party. Memo 6 argues a broker claiming *we reduce your level* must carry its own policy or the claim is unbacked marketing. Memo 3 asked it of the **model vendor** first, and the reasoning transfers without modification: *a vendor who is wrong pays, so a vendor who is wrong has reason to be right.*

> **The rule generalises: any party claiming to reduce somebody else's exposure should carry cover against being wrong about it** (GM-D83). Broker, platform, or model vendor — the argument does not care which.

Flagged as speculation about the vendors, because it is. **The structural point is not speculation**, and it belongs in the taxonomy above rather than as an aside: a party that could close a delta and does not is one thing; a party that claims the delta is smaller than it is, is another, and only the second is answerable with a policy.

## What this does not prove

- **That the three delta classes can be told apart automatically.** Distinguishing elective from structural requires knowing the platform's finest available grain — which is §2's library, and it does not exist yet. Today the classification is a judgement.
- **That anyone will accept the taxonomy.** "Structural delta is the platform's" is an argument, not a settled allocation, and platforms have not agreed to it.
- **That dynamic re-rating is close.** The event-to-grant-node mapping exists nowhere, for anybody, and it is the hard part — not the trigger, not the notification.
- **That the magnitude is knowable.** §4 is explicit: direction and mechanism, never a multiplier, until loss data exists.
- **That any vendor would offer §8's cover.** Model vendors disclaim liability today, and the reasons are commercial and legal rather than oversight. The section argues what such a policy would *mean*, not that one is coming.
- **That the estate's own measurement is complete.** Memo 3 named a grant node `measure.py` misses — commit authorship — which is a defect found by conversation rather than by the tool, and the honest reading is that there are probably others.

---

*CC BY 4.0. Source: brief v0.33.74, memo 3. Everything here is derived from that memo and labelled where it extends it.*
