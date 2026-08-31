# 13 · The three clocks

*Part four — The machinery*

---

Memo 10 is two memos in one — the interfaces, then time — and its worked example is the sharpest cover condition in the series:

> it's only valid if you have a backup with less than 24 hours. So that means that you know you cannot make a change to the database if the backup, for example, last backup failed, or if you don't have evidence that the last backup is actually operating

*Stated* — memo 10, verbatim. The doctrine reads a definition out of it, and the definition is the chapter:

> **A warranty is a fact plus a maximum age** — `{fact: last_backup_succeeded, max_age: 24h}` — and it fails **three** ways: the fact is false, the fact is stale, or the fact is **unknown**.

*Stated* — doctrine 10, GM-D76. The estate already computes both halves — every evidence pack prints the twin's age because measurements go stale, and facts are already three-valued. A warranty is those two mechanisms combined and pointed at cover instead of at a level.

The third failure mode is the deliberate one. Putting **unknown on the same side as false** is the exact opposite of chapter 6's rating rule, and the asymmetry is design: for a rating, assuming absence manufactures comfort; for a cover condition, assuming presence manufactures liability. The corpus states the pair as one sentence so it cannot be read as an inconsistency, and this book has now kept its chapter 6 promise to show the other rule of the two.

## The gate climbs to its ceiling

Part three watched the gate evaluate once, at go-live, then continuously, on world events. The backup warranty completes the climb: **per action** — *you cannot make a change to the database if…* is a condition checked every time the agent acts. Strongest, most expensive, and the mechanism already exists: chapter 12's handshake, checking on every request, checks the warranties on every request too. The three-row table in doctrine 10 is the whole architecture of enforcement timing, and each row cites the memo that demanded it.

## Three clocks, and how a system like this lies

Cover, it follows, is *continuously conditional* — bounded by an interval and alive only while its conditions hold. So a policy runs on three clocks, and conflating them is how a system like this would lie:

> The policy interval — from when, until when cover exists at all. Twin and world freshness — how current the measurement and the threat picture are. The warranty's check interval — how recently each cover condition was confirmed.

*Drawn* as a compression of doctrine 10 §3's table, which carries the three rows verbatim. The doctrine's example is the one to keep: **a policy in force, computed against a fresh twin, with a warranty last checked eleven days ago, is not covered** — and only a system keeping the third clock separately can say so. It is chapter 12's revocation-latency lesson generalised: every promise in this architecture is bounded by the interval at which somebody actually looks, and the honest design is the one that prints the looking-interval next to the promise.

Even the small clauses carry the discipline. Cover *only over office hours* is a real control — an agent that may act only while somebody is awake has a smaller effective blast radius — and it is an interval with recurrence, a shape the mandate almost has. The trap is that a recurring window without a timezone is ambiguous twice a year, and ambiguity in a *cover* condition is the ground disputes are fought on. *A recurring cover window states its timezone* — cheap now, unpleasant to retrofit into policies already sold.

## Metering uses, not checks

The memo prices a policy by consumption — *ten usages over a period of an hour* — and the corpus checks the idea against chapter 12's rule that pricing verification taxes the wrong behaviour. The idea survives, on the estate's own earlier distinction: **a verification is not a use.** Metering uses is what insurance has always done — per flight, per shipment — and prices what the buyer consumes; metering checks taxes the checking. But the survival has a cost the not-in-line position must pay:

> A usage-boxed policy needs an in-line counter, which this project is not

*Stated* — doctrine 10, GM-D78. To count uses you must observe uses; the relying party can, an execution broker can, and the rater — beside the line, by its own constitution — sees nothing. We define the counting schema; somebody else holds the counter. *Drawn.* Note the pattern completing: every time the machinery needs an in-line capability, the corpus assigns it to a party already in line rather than quietly stepping in — the relying party enforces, the broker counts, the platform grants. Chapter 14 is why that assignment discipline is the position rather than a modesty.

## Schemas, not APIs

The memo asks what APIs the ecosystem needs. The answer follows from the position:

> An API is operated. A schema is implemented.

*Stated* — doctrine 10. An operated API puts this project in the line it swore off; a schema is implemented by whoever is already there. So the deliverable is the policy lifecycle as documents and the transitions between them — and the estate already has every piece: a policy is a signed statement appended to an issuer's record; its criteria are the statement's own warranty fields; hashes over the canonical form are already computed; certifications are signatures verified against published keys; and amending, activating, ending are **appends, never edits** — the register's rule since v0.1.26. The answer to *what APIs do we need* is mostly: none that we build. Interoperability lives in the documents; the API is whatever each party puts in front of them.

*Drawn.* One loose end is preserved exactly as the corpus preserved it, because it is a model of the discipline: the memo's final sentence cuts off mid-thought — *"a 24-hour period where within that window"* — and the doctrine declines to finish it, on the grounds that guessing the end of a sentence and rendering it as the project lead's position is the same error as guessing a survey's findings. The transcript ends where it ends. The schema for warranties, meanwhile, has never been written down; doctrine 10's does-not-prove keeps that on the record, and chapter 17 counts it.
