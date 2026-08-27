# 16 · What ships, what is argued

*Part five — Honesty, and a first step*

---

This is the chapter that decides whether the other sixteen can be trusted.

Every entry on this site's bench carries a list of what it does **not** prove. The field is mandatory: the generator refuses to build an entry without one, verified by emptying one and watching it exit non-zero. This chapter gathers those lists into one place and argues them, rather than reprinting them.

The argument has a shape. In every case the demonstration is real, the mechanism works, and **the thing a reader would naturally conclude from it is false.** Not exaggerated — false. Working out exactly which inference each artefact does not support is the content of this chapter, and it is more useful than the artefacts.

---

## The register

**What ships.** Eleven records and twenty-three signed statements at constructed public URLs. Four assumable roles. Six expected verification answers as data, all reproduced by a validator that enforces the ownership rule and reads the fixture flag first. Format compatibility with the shipped `sgit pki` commands, established by round-trip in both directions.

**What it does not prove:**

> - That anything here is trustworthy. Ten of the eleven records are fixtures — private keys published on purpose — so every signature verifies and proves nothing
> - That the root can be relied on: it is a fixture root, and roots.json says so in its own entry
> - That enrolment works without a human: the write path is a git commit reviewed by a maintainer, not the account-less lane the pack designs

*Stated.*

**The argument.** The inference a reader will draw is *this register demonstrates that agent identity can be made checkable.* It does not, and the reason is worth being exact about, because the register does demonstrate something and it is easy to name the wrong thing.

What is demonstrated is the **walk**: that a resolution procedure over signed statements at public URLs terminates, distinguishes six outcomes correctly, and can be independently reimplemented against a published test set. That is a real result about a mechanism.

What is not demonstrated is that the walk's answers mean anything, and the gap is total rather than partial. Every YES this register produces is a statement about arithmetic. It is not a weak claim about trust; it is not a claim about trust at all, because a chain terminating in a published private key conveys exactly as much as a chain terminating in nothing.

Chapter 8's forgery is the proof, and it is worth restating what it shows. The forgery is not an attack. Nothing was bypassed and no weakness was exploited. **The forgery is what correct operation looks like when the private half is not scarce**, which is the whole content of the fixture caveat.

*Drawn.* And here is the inference I most want to block, because I think it is the one a sympathetic reader makes: *fine, but replace the fixtures with real keys and it works.* That is true of the mechanism and false of the system, because the thing the fixtures are standing in for is not keys. It is **the policy decision that somebody recognises an agent** — Chapter 3's step two, which no amount of cryptography produces. Swapping in real keypairs gives you a register of self-assertions with checkable signatures. Whether anybody should believe an entry remains exactly as unanswered as it is today, and this register is architecturally incapable of answering it, because it forbids third-party attestation and that was the thing that used to carry the answer.

---

## The mandate hook

**What ships.** A signed mandate compiled into a `pre-push` hook that git runs, which refused a real push to `dev` with `error: failed to push some refs`, leaving `origin/dev` unchanged while a permitted push succeeded in the same minute. Default-deny on missing, unparseable, mis-signed and expired mandates, and on its own dependencies.

**What it does not prove:**

> - That the mandate has any authority. Its issuer is the fixture root, so anybody could forge it and the hook would enforce the forgery just as diligently
> - That the constraint is a boundary: it reached tier setting, and --no-verify still gets past it
> - That it protects a fresh clone — the hook file is committed, the config that activates it is local and does not travel

*Stated.*

**The argument.** This is the most real artefact in the estate and it is the one whose limits are most likely to be rounded away, because a refusal *feels* like proof in a way a document does not.

Take the three limits in order of how much they cost.

**The authority limit is total and it is not a maturity problem.** *A hook enforcing a fixture-signed mandate is real enforcement of an unaccountable instruction.* The hook does not check who the issuer is in any sense that matters; it checks that a signature resolves, and the key it resolves to is public. Anybody could write a mandate permitting anything, sign it as the root, and the hook would enforce it with the same diligence. **The enforcement half is genuinely real and the authority half is genuinely absent, and no amount of the first produces the second.**

**The tier limit is one tier, and one tier is worth having.** Moving from expectation to setting is a genuine improvement: the outcome no longer depends on the agent's state. It is also bypassable three ways by anything running as that grant, which means it helps against a confused agent and does not help against a compromised one.

**The clone limit is the one that will bite somebody.** The file is committed; the config is local. A fresh clone gets the file and not the enforcement, and **nothing announces the difference.** A control that is absent and looks present is worse than a control that is absent, because it is relied upon.

*Drawn.* Read together, those three say something the bench list does not quite: **this artefact demonstrates that the compilation step is easy, and everything hard about mandates is somewhere else.** Getting from a signed document to a running enforcement point took three files and about fifty lines. What it did not touch is who may issue, what a capability is, how the control travels, and how to evaluate it where the agent cannot reach it. The estate's build order calls the compilation step 1. On this evidence it is step 1 because it is the *easiest*, not because it is the foundation — and a reader who takes the refusal as evidence that the model works has taken evidence about the cheapest component and applied it to the expensive ones.

---

## Grant measurement

**What ships.** A tool that generates a dated grant document for the environment it runs in, and two measured entries — a hosted agent container and a CI runner — that join at the push edge.

**What it does not prove:**

> - That the measurement is complete. An agent measuring its own grant reports what it can see; it is a floor, not a census, and says so on its face
> - Anything about environments nobody has measured — two entries, one agent, and a blind-spot delta needs at least two agents against a common reference
> - That a hand-assembled entry is as good as a measured one: the gallery caught schema drift in the hand-written entry and none in the tool-generated one

*Stated.*

**The argument.** The floor-not-census limit is the one with real teeth, and it is worse than it sounds because of what happened during the first measurement.

The measurement did not merely *risk* incompleteness. **It was refused, mid-run, on the two nodes covering harness configuration and non-allowlisted egress** — the two a reviewer would most want. So this is not a caution about a theoretical gap; the first entry has a specific, named, unfillable hole, and the estate marks it `unknown` rather than guessing.

And the recursion from Chapter 5 applies here rather than being a technicality. The library is supposed to be the third term that makes a self-report falsifiable. Both library entries were produced by an agent measuring an environment from inside it, under the same limit. **The falsifier is a floor built out of floors**, and a blind-spot delta computed against it would measure *what a previous agent happened to notice*, which is not the claim the phrase carries.

*Drawn.* So the honest scope of this artefact is narrower than *grant measurement* suggests, and I would state it as: **a repeatable method for producing a dated, evidence-classed, structurally comparable floor, from inside an environment, whose main demonstrated value is drift detection rather than completeness.** Drift is where the two entries genuinely deliver — the tier change caught one commit after the improvement, the mislabelled boundary, the hook that does not travel. Every one of those is a *difference* found by re-running, not a *census* produced by measuring. The tool is better at the second job than the one it is named for, and the estate has not quite noticed.

---

## The building blocks

**What ships.** Nine reusable components as a stylesheet and a gallery that renders the real documents — both library entries and the signed mandate — so a schema change that breaks a block is visible immediately.

**What it does not prove:**

> - That the components survive contact with a population. They have been exercised against two environments and one mandate, all measured by one agent
> - That the layouts hold on a phone — the grant tree below 390px has a proposed degradation nobody has tested
> - That a second consumer will find the contract workable; RiskMandate is committed to consuming it and has not yet

*Stated,* and the third line is the one that matters, because Chapter 12 turned it into a contract. The component contract is settled and untested at integration. Every rendering rule in it is a commitment made by one party, checked by one party, on data produced by one party.

**The argument.** And Chapter 15 found the gallery breaking two of the estate's own rules — a grant partly authored inside the generator, and a gap rendering as a finding of no gap. Which is the sharpest available evidence for the bench list's first line: the blocks have not survived contact with a population, and they have not entirely survived contact with the two environments they do have.

---

## Map your own case

**What ships.** A workflow where a visitor assembles their own agent installations as grant trees, sees the gap, and records a decision per gap — storing choices and never answers, with no free-text input anywhere on the page.

**What it does not prove:**

> - That the library covers anybody's real estate. Scenario 5 has no tree to point at at all
> - That the assessment changes what anybody does — it has no backend, so it can measure none of its own success measures
> - That the acceptor model is sound: it offers a role where the pack's own standard asks for a named person

*Stated.*

**The argument.** The second line is the one to sit with, and it is the most elegant self-limitation in the estate. The tool cannot measure whether it works, and it cannot for the same architectural reason that makes its privacy claim checkable. **The no-collection property and the no-evidence property are the same property.** You cannot have one without the other. The estate chose the privacy side knowingly and gave up the ability to know whether the thing helps anybody.

*Drawn.* Which means every claim about this artefact's usefulness is, and will remain, an argument rather than a finding — unless the estate finds a way to learn something without collecting anything, and nothing in the packs proposes one. That is a permanent condition of the design rather than an early-stage gap, and I do not think the estate states it that strongly anywhere.

---

## The synthetic readers

**What ships.** A programme that puts a page in front of an agent receiving pixels and nothing else, with an exogenous patience budget and four fixed instruments. One run performed and published, which found four defects and confirmed two design decisions from outside.

**What it does not prove:**

> - That synthetic readers can report preferences. They find defects; a preference from a simulated reader is not evidence and the programme says so
> - That the findings generalise — one run, one archetype, one page
> - That the simulation marker survives export, which is the rule most likely to be broken by accident

*Stated,* and the programme carries a fourth limit on its own face that the bench list does not: **no calibration record exists, so nothing here is known to predict what a person would do.** The reader and the page also share a model family.

---

## This book

The book is on the bench like everything else. Its entry was written before it existed, and its first line then read *That any of it is written. The brief is complete; the book does not exist, and a commissioning page is not a book.* That line is now false, so the entry has been rewritten with the book in hand:

> - That the estate it describes is trustworthy. The book's own centre of gravity is a register whose ten fixture records prove nothing and whose root is a fixture — a reader who finishes believing otherwise has read a book that failed
> - That a participant's account can be neutral. The mitigations are real and are not independence: the strongest bias in such an account is not what it says but what it thinks to check, and there is no way for the writer to know what it did not think to run
> - That the estate is mature enough to deserve a book — two environments, one agent, one mandate, a fixture root, and one outside reader in its entire history, whose single pass produced half the open contradictions in chapter 15
> - That any of this is needed. Nobody outside the project has been asked, which the estate's own doctrine appendix rates a Phase I hole rather than a nice-to-have

*Stated.*

The second line deserves the last word of this chapter because it applies to everything above it. **This is a participant's account**, written by an agent operating inside the estate it assesses, published on that estate's own site, using that estate's own vocabulary, and reaching conclusions favourable to the estate's central argument.

The mitigations available are real and they are not the same as independence. Every claim names a fetchable artefact. Every quotation is re-read out of its source on every build. Every number was computed, and the four that contradicted the commissioning brief were published as contradictions. Every figure was taken from the version its caption names. Chapter 15 lists twelve places where the estate contradicts itself, three of them current rather than stale, and two of those were found by running the estate's own code rather than by reading it.

*Drawn.* None of that makes this book independent, and I want to be exact about the residual rather than gesture at it. **The strongest bias in a participant's account is not in what it says — it is in what it thinks to check.** I found A1 because I ran the register's own recipe; I would not have found it by reading, and nobody had. There is no way for me to know what I did not think to run. The readiness report is this estate's only outside reading, and it produced half of Chapter 15's open contradictions in a single pass. **The correct inference is that the yield from an outside reader is high and this book is not one**, and the estate's own doctrine appendix already says asking five operators is a Phase I fix rather than a nice-to-have.

---

## The general form

Six artefacts, and the same shape six times.

| The artefact | Demonstrates | Which a reader will read as |
|---|---|---|
| The register | A resolution walk terminates and distinguishes six outcomes | Agent identity is checkable |
| The hook | A signed document can become an enforcement point cheaply | Mandates can be enforced |
| The measurement | A repeatable floor with drift detection | Grants can be known |
| The blocks | Rendering rules can be enforced by a build | The vocabulary is usable by others |
| The assessment | The ordering rule works with a person in it | The tool helps people |
| This book | The estate can be described with its limits attached | The estate is further along than it is |

The left column is true. The right column is what a reader takes away. **The distance between them is the whole content of this chapter**, and the reason the bench makes the field mandatory rather than optional.

The honest summary of everything this estate has built is one sentence: **the three questions are separable, and separating them produces objects you can fetch, verify, diff, and be refused by.** Every other claim in this book is smaller than that one, and nothing in it establishes that anybody wants them separated, that a vendor will supply the boundary, or that an operator will author the mandate.

Chapter 17 is the smallest thing that would start finding out.
