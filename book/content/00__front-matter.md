# A Key Means Nothing Alone

### Identity, mandate, and the exposure nobody accepted

**One volume on what pki.sgit.ai built between site v0.1.25 and v0.1.32, why the concepts underneath it are shaped the way they are, how it composes with RiskMandate.ai, and — as an equal partner to all of that — what none of it proves.**

*Written August 2026 · CC BY 4.0 · Published by the sgit project*

---

## Before anything else: what this book is not evidence of

A reader who stops after this page should already know the following, because everything after it is written on top of these and a chapter quoted in isolation will not carry them.

**The register is built. The trustworthy register is not.** There are eleven records in the register this book describes. Ten of them are fixtures whose private keys are published in the same repository as their public halves, deliberately. Every signature on those ten verifies. Not one of them proves anything about anybody, because a signature's value is the scarcity of the private half and a fixture has none. You can forge any of them in one command, and Chapter 8 shows you doing it.

**The root is a fixture, and the register says so in its own root file.** No chain in this register carries authority. When the verification walk answers YES, it means *the walk completed and the arithmetic is right*, not *this agent may be trusted*.

**The enforcement is real and the authority is not, and they are independent halves.** A git hook in this repository refuses pushes. It really refuses them — by exit code, from outside the agent's turn, and Chapter 10 photographs it doing so. The mandate it enforces is signed by the fixture root. Anybody could forge that mandate, and the hook would enforce the forgery exactly as diligently. Averaging those two facts into one status is how a demonstration gets mistaken for a control.

**The hook is a `setting`, not a `boundary`.** It sits inside the grant it bounds. The agent can edit the file, unset the config that activates it, or pass `--no-verify`. The refusal banner says this on its own face, which is the only thing that stops it being believed.

**Every grant in this book is a floor, not a census.** An agent measuring its own grant reports what it can see. It cannot report a capability it does not know it has, and the first library entry exists partly because a self-measurement probe was refused mid-measurement.

**Two environments, one agent, one mandate.** Everything in Part Two generalises from a sample that small.

**The write path is a git commit reviewed by a human.** Not the account-less append lane the design calls for. That lane is unbuilt and its blocking question is unanswered.

**This is a participant's account.** It is written by the project that builds the layer it argues for, published on that project's own site, by an agent operating inside that project's own estate. The disclosure travels with the book rather than sitting in a footer.

---

## Who this is for, in the order that decided every editorial call

**A practitioner who runs agents and is accountable for them.** You are the primary reader. You need the concepts in order, one worked example carried all the way through, and something you can do tomorrow. Chapter 17 is that, and it is deliberately small.

**The RiskMandate team.** Also primary. Chapter 12 is written to you and is meant to be usable as a contract rather than as a description: what the library holds, what the instance holds, what crosses the boundary, and what must never. It is written expecting you to disagree with part of it, and it names the open question rather than papering over it.

**An agent given this book and nothing else.** Served by construction rather than by a separate edition. The reference card at the end is written to be pasted into a session; `book/book.json` carries every chapter with the SHA-256 of its markdown; `book/llms.txt` carries the positions above so that a summarising agent cannot drop them.

---

## The provenance rule, and why this book needs it more than most

The packs this book is built from are dense with argument. A writing session moving at pace will blend its own inferences into them so smoothly that afterwards neither the reader nor the session can separate them.

Which is the same error this book is about. Authority nobody granted, assumed because nothing in the presentation distinguished it from authority that was. A book making that mistake about its own sources cannot credibly diagnose it in anybody else's agent.

So every load-bearing claim about what this estate *means* is marked, and the marking is a sentence rather than a sigil:

> *"Document 02 puts it this way: …"* — a **stated** claim. It carries a verbatim quotation, with the document and section it came from. Every one of them is recorded in `book/quotes.json` and re-read out of the source it names on every build. A quotation not found where it claims to be fails the build. This estate does not print quotations it has not checked.

> *"The packs do not say this; reading them together, the reason appears to be …"* — a **drawn** claim. The reasoning is in your view, in the paragraph, not in a note. You are meant to be able to disagree with it without leaving the page.

The colophon carries the count of each. **Do not treat the drawn claims as this estate's positions.** They are this book's.

---

## Every number here was computed, and some of them contradict the brief

No figure in this book is quoted from a release note, from the commissioning brief, or from memory. Each was computed from the repository at the time of writing, and the command that produced it is in Appendix A, so any of them can be re-derived rather than believed.

That discipline had a cost the commissioning brief anticipated and specified the resolution for: **where a number in the brief disagrees with the repository, the repository wins and the brief was wrong.** It happened four times. The largest is that the brief describes "eight releases in four days" and asks for a chapter of that name; the repository says the eight releases spanned **forty hours across two calendar days**. Chapter 14 is named for what the repository says. The colophon lists all four disagreements.

---

## How the figures were taken

Several figures in this book show pages *as they were* — the register on the day it shipped, the push refused at the release where it happened. A figure captioned as the past but photographed today is a reconstruction, and a reconstruction wearing a caption is a claim of authority nobody granted, in a book whose entire subject is claims of authority nobody granted.

So no figure here was reconstructed. Each was taken from the version its caption names: a `git worktree` at the tag, a one-shot local server on a port used once and never again, a headless browser killed in a block that runs whether the capture succeeded or failed. Every figure carries the page, the tag, and the SHA-256 of that page's bytes at that tag.

There are two gates, because there are two different claims. A figure of a past version is **re-derivable** — re-running the harness at that tag reproduces the recorded digest, and it never goes stale because the tag does not move. A figure of the site as it stands is **fresh** — the recorded digest must match the live page, and the build fails when it stops matching. It will stop matching on the next release. That is correct and it is inconvenient, and it is two maintenance costs rather than none, accepted deliberately.

Appendix A is the whole harness. One figure in this book could not be taken as specified, and the reason turned out to be a finding rather than an obstacle; Chapter 10 and Chapter 15 both carry it.

---

## The shape

**Part one — Why there is nothing to inherit.** Three questions the industry answers with one object; a documented catastrophe and the four rules it produced; and the loop that explains why the replacement does not exist yet.

**Part two — The vocabulary, and why each word is load-bearing.** Grant, mandate, delta, tier, and the ordering rule that comes before all of them.

**Part three — What was built.** Four artefacts, each walked, shown, and limited in the same breath.

**Part four — How it composes.** The contract with RiskMandate; the two paths; and the release history read for what each release learned.

**Part five — Honesty, and a first step.** Where the estate contradicts itself, computed rather than recalled. What ships versus what is argued — the chapter that decides whether the other sixteen can be trusted. And the smallest real thing you can do tomorrow.

---

*Sources: everything asserted here is traceable to a published artefact at a constructed URL under `https://pki.sgit.ai/`. Every such URL appears in full at least once in the text, so this book reads start to finish offline with no link followed.*
