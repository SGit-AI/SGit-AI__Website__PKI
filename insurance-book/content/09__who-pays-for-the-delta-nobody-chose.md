# 9 · Who pays for the delta nobody chose

*Part three — Who pays, who rates, who backs the claim*

---

Two chapters of rating machinery have quietly assumed the delta belongs to whoever operates the agent. Memo 3 asks the question that assumption skips, and asks it with the estate's own worked example. A code host offers read-only or read-write and nothing between. An operator who needs an agent to push at all must confer the ability to push to **every branch** — and, absent signed-commit enforcement, to author commits as anybody:

> right now my only options is to give it read only or read write. Right, I don't have more granularity than that

*Stated* — memo 3, verbatim, describing GitHub, though the shape is any platform. The mandate says *your own branch, and dev*. The gap between what was conferred and what was authorised is real, dangerous — and **the operator did not choose it and cannot close it.** No budget, care or diligence makes a platform offer a finer grain.

## The taxonomy

So the delta divides by *who could have closed it*, and the doctrine's three classes are the pivot's fairness mechanism:

> **Elective** delta — more conferred than needed, or an available control skipped: no branch protection, no signed commits, a token scoped to every repo when one would do. The operator can close it, so it is the operator's — the part effort moves, and the part a rating should charge for. **Structural** delta — the platform's finest grain is coarser than the mandate. Nobody's budget closes it; it is identical in every customer's estate at once, and it is the platform's, or nobody's. **Defect** delta — a vulnerability temporarily widens the grant past its documented shape. The operator could not even have known, and it is temporary, which is why chapter 10 exists.

*Drawn* as a compression — doctrine 03 §1 carries the full table this paragraph compresses. The conclusion, though, is printed there as a rule:

> A rating that does not separate these is unfair and useless in one move.

*Stated.* Unfair, because it charges for the unfixable. Useless, because a level an operator cannot move is not a decision input. Chapter 8 required the derivation to decompose; this chapter says the decomposition's first cut is *what they can move and what they cannot*.

## The class the taxonomy could not hold

Three memos later the taxonomy met a case that did not fit, and the way the corpus handled it is worth recording as method. Memo 6 names platforms that *do* offer the granularity — and make it so complex that using it is impractical: *"when they do, they make it so crazy complex that it's again is impractical to have that lowest privilege execution."* That is not structural; the grain exists. Calling it elective charges an operator full price for not adopting something that takes two quarters and a specialist.

A fourth class was the tempting fix. The doctrine refused it:

> **Elective delta carries a cost to close.** *Latent* delta — offered but impractical — is simply its high-cost region

*Stated* — doctrine 06, GM-D60. *Drawn.* The refusal matters more than the fix. Taxonomies rot by accreting classes for every awkward case; a dimension added to an existing class keeps the structure falsifiable and gives the rating something a fourth class never would: *you could close this in an afternoon* and *you could close this in two quarters* are different instructions, and a fair rating distinguishes them without inventing a new kind of blame.

## The only public good in the apparatus

The structural class has a corollary the corpus flags as unique. How coarse a platform's permissions are is a **fact about the platform** — identical for every customer. Measure it once, publish it once, reference it everywhere; never re-derive it per estate. That is the estate's library/instance rule one level up, and it is the only part of the whole insurance apparatus that is a public good: one honest measurement of a platform's permission model serves every customer of it.

*Drawn.* It also hands the platform an argument aimed at itself, which the doctrine states as countable: a platform that shipped branch-scoped tokens would convert a whole class of delta from structural to elective *for every customer simultaneously*. Structural delta's natural payer, meanwhile, is the pool — a risk nobody can individually avoid and everybody shares is the textbook shape of pooled cover. The taxonomy thus prices three different conversations: the operator's (close your elective delta), the platform's (your coarseness is countable), and the market's (the structural remainder pools or goes uncovered).

## The vendor who would underwrite itself

Buried in memo 3's list of candidate payers is the question this book regards as the most forward-looking sentence in the series:

> is Claude going to actually have a policy on its own to cover any mistakes?

*Stated* — memo 3, verbatim. Today the answer is no; model vendors disclaim liability for output, and that is the industry's settled position rather than an oversight. But the doctrine draws out what an answer would *mean*: a vendor offering cover against its own model's mistakes would be making a **falsifiable quality claim** — the first in the category. Everything a model vendor currently publishes about reliability is a benchmark or a disclaimer. A policy is neither: it is a number somebody pays when they are wrong.

The rule generalises, and the corpus generalised it three memos later when the same structure reappeared in the broker channel:

> any party claiming to reduce somebody else's exposure should carry cover against being wrong about it

*Stated* — doctrine 03 §8, GM-D83, flagged in place as speculation about the vendors and structure about the claim. Chapter 11 is that rule meeting the market it was made for.

## The question this estate refuses to answer

Memo 3 ends in the territory every agent-risk conversation ends in — *who's responsible for that hallucination?* — and the corpus's response is a model of staying in competence:

> The estate cannot say who pays. **It can make the question answerable rather than a swearing contest**, which is what the parties actually lack.

*Stated* — doctrine 03 §7. Liability for agent harm is unsettled law, being worked out in courts and contracts, and a schema project pretending to settle it would be theatre in a wig. What any liability determination will need is exactly what an evidence pack already is: what happened, under whose authority, against which mandate, with which controls in place, dated and signed. *Drawn.* This is the delta taxonomy's real product. Not an allocation of blame — an end to the era in which the allocation had to be fought over with no shared record of what the delta even was.
