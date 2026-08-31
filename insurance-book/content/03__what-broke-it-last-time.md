# 3 · What broke it last time

*Part one — The pivot*

---

A body of work proposing insurance for a technology risk owes its reader one chapter before any machinery: the acknowledgement that this has been tried, at scale, recently — and that it went badly for everyone involved. The fourth memo supplies it unprompted, about the market nearest to this one:

> the cyber insurance is already a good example of a market that grew quite high when you know you couldn't really quantify things very well. That then a lot of people lost lost a lot of money, and there was a lot of cyber insurance policies that either were not worth what they they had, or actually had a lot of payouts that really hit the insurers because they they couldn't quantify what's happening

*Stated* — memo 4, verbatim. Note who got hurt: both sides. Buyers held policies worth less than they thought; carriers took payouts they had not priced. The doctrine document derived from this memo compresses the diagnosis into a sentence this book considers the most important in the corpus after the title:

> A market can be enthusiastically data-driven and still be pricing fiction, if the data is not checkable.

*Stated* — doctrine 04. Cyber insurance was not short of data. It was short of data anyone could *verify* — self-attested questionnaires, unaudited control claims, quantification nobody could recompute. The market's failure was not an absence of numbers; it was an abundance of unfalsifiable ones.

## The failure is the argument for the rule

The pivot's founding rule — stated fully in chapter 4 — is that *a level nobody can recompute is exactly the theatre a premium would have prevented*. It would be easy to read that as a house style, this estate applying its usual reproducibility reflex to a new domain. The cautionary tale upgrades it to an empirical claim:

*Drawn.* The rule is the thing whose absence broke the nearest comparable market. Cyber insurance is what a rating ecosystem looks like when the derivations are private and the inputs are declared: it grows fast, prices fiction, and detonates on both sides at once. This is why the priority ordering in the doctrine reads the way it does — a rating engine's first obligation is not to be *accurate*, which nobody can be without loss data; it is to be **checkable**, so that being wrong is discoverable rather than accumulating. Accuracy is a destination. Checkability is a property you can ship on day one, and the one the last market shipped without.

## What insurance is actually for, per the memo

The same memo makes a distinction that sounds small and decides much of parts two and three:

> it's a market that demands the creation of trustworthy data

*Stated.* Not *uses* — **demands**. Many disciplines consume data. Insurance creates a party with money at stake in the data being *true*, which manufactures demand for measurement nobody would otherwise fund. That is the honest description of what this pivot does to the estate's existing work: the register, the twin, the evidence pack and the computed tiers all predate insurance and were justified on security grounds. Insurance gives them a second sponsor — and the second sponsor asks harder questions, because the second sponsor is the one who is wrong *expensively*.

*Drawn.* It also names, precisely, what stage 1 gives up by removing the money — the subject of the next chapter, flagged here so the reader carries it in: with no capital at stake, the demand for trustworthy data must come from somewhere else, and the only somewhere else available is a published method that anyone can attack. Openness, in this corpus, is not generosity. It is the substitute for the forcing function the money used to be.

## The quantity security could never say out loud

The memo's second gift is a diagnosis of why security spending has always been hard to defend in a budget meeting:

> if you invest in an incident response team, only what you're doing is you might not be reducing the number of incidents, but you're reducing the impact of those incidents

*Stated.* Frequency is countable. **Impact reduction is counterfactual** — the disaster that would have been worse appears in no log. Insurance is the one instrument civilisation has built that routinely prices counterfactuals, which is why the memo wants it in the room.

And here the corpus does something worth pausing on, because it is the audit chapter's second defect arriving early: the doctrine's first draft claimed the estate's three-tier control test *was* this quantity — impact reduction, under another name. The audit corrected it. The tier test asks whether a control is enforced by something the grant does not include; that ranks **how much of the grant is reachable in practice** — blast-radius reduction, not severity reduction. An incident response team makes a loss smaller *after* it happens; a boundary makes fewer attempts *become* losses at all. Adjacent quantities, not the same one:

> The tier ranks how much of the grant is reachable in practice. That is blast-radius reduction, not severity reduction

*Stated* — doctrine 04, as corrected. The doctrine then leans on the proxy anyway, with the lean declared: for an agent placement, what it can reach bounds what it can damage, so blast radius is *most* of severity. That is an argument, not a measurement, and it is weakest exactly where a small reach touches something critical. Nothing in this corpus measures severity at all — memo 4 asked for that quantity, and the estate does not have it. The doctrine says so in its own does-not-prove block, and this book repeats it because a reader who carries away "the tiers price impact" has been misled by one word.

## The firm was already underwriting

The memo's last reframe is the one that makes the internal market of part three feel less like an invention:

> you can actually argue that what a company is is fundamentally a gigantic insurance sort of company

*Stated.* Budget approvals, vendor selections, deployment sign-offs, exception processes: a firm at scale takes underwriting decisions continuously — without a rating, usually without a record, never under that name. *Drawn.* An internal rating market is therefore not a new activity a company must adopt; it is an existing activity made legible. The company was already underwriting the agent. It was doing it in a meeting, and the meeting kept no rating basis. Everything in part two is a proposal about what it would mean to do the same thing with a number somebody can check.
