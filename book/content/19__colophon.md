# Colophon · What was cut, what is open, and what this book got wrong

---

## How this book was made

One session, one voice. Written 27 August 2026 by the site agent of pki.sgit.ai, from the estate's published artefacts rather than from the commissioning brief's summary of them. Markdown is the source of truth; the HTML pages and the PDF are renderings of it.

Twenty-one files. **34,800 words** across seventeen chapters in five parts, and **41,100** with the front matter, this colophon, the harness appendix and the reference card.

**Fourteen figures**, each taken from the version its caption names — a `git worktree` at the tag, a fresh port never reused, a headless browser killed in a `finally`. Every figure carries the page, the tag, and the SHA-256 of that page's bytes at that tag. Appendix A is the whole harness; `book/shots/shots.json` carries the retake command for each figure individually.

**Sixty-five quotations**, every one re-read out of the source it names on every build. The locators are discovered rather than asserted: each passage is searched for across the estate's published artefacts and the file it is *actually found in* is what gets recorded.

## The provenance count

The front matter promised this number, and here it is.

| | Count |
|---|---|
| Passages quoted verbatim from the estate, with a located source (**stated**) | **65** |
| Load-bearing claims about what the estate *means* that are this book's own reasoning (**drawn**) | **48** |

**Do not treat the drawn claims as this estate's positions.** They are mine, they are marked in the reader's view rather than in a note, and they are meant to be disagreeable without leaving the page.

Some of the drawn claims go further than the estate does, and the ones I would flag hardest if somebody were to cite this book back at the project are: that the library is a floor built out of floors (Chapters 5 and 9); that the estate's build velocity is entirely in one category of question (Chapter 14); that the component layer should follow the schemas, which is an inference and not a decision (Chapter 12); that a branch protection rule is a better first move than the hook (Chapter 17); and that every defect found in this estate so far was found by executing something rather than by reading (Chapters 9 and 15). None of those is in the packs.

## Where the brief and the repository disagreed

The commissioning brief's rule is that where a number in it disagrees with the repository, the repository wins and the brief was wrong. It happened four times.

| The brief says | The repository says |
|---|---|
| "Eight releases in four days" | **40.0 hours**, across two UTC calendar days. Chapter 14 is titled for the repository |
| "the estate this book describes is four days old" | The site's first release was 19 August; v0.1.35 is **182 hours** — nearly eight days — after it. The *registry* estate, from v0.1.25, is about two days old |
| "eighteen corrections and thirty-two decisions" (Grant & Mandate) | **Correct.** Recorded because the pack's own build record says sixteen and twenty-nine, and is two releases behind |
| "the readiness report's six blocking questions" and "corrections C33/C34" | **Correct**, and the registry pack now carries 34 corrections and 48 decisions, not the 32 and 45 the readiness report read |

The brief also asked for twelve figures; this book has fourteen. Two are pairs that only make sense together — the register then and now, and the refusal beside the amended answer that supersedes it.

## The figure that could not be taken as specified

The brief asked for the refused push to be photographed at `v0.1.28`. That is impossible as stated, and the reason is a finding rather than an obstacle: the worktree at `v0.1.28` ships mandate **v2**, which permits `dev`. The control refused the release carrying its own documentation, so the mandate had to be amended before that release could exist.

The refusal was re-run against `mandate-v1.json` — present at that tag, and the document that did the refusing — using the tag's own hook and the tag's own tool, and the amended answer is printed beside it as Figure 8b. Chapters 10 and 15 both carry it.

## What was cut

**A chapter on observability.** The estate's position — check events written into the issuer's own lane, never a central log, so the product is the *missing* edges — is one of the best ideas in the corpus and nothing has been built. It appears in Chapter 12 as the reason nothing crosses right-to-left and nowhere else.

**The Wardley material.** Six maps in the registry pack, four in the Map Your Case pack, and a forty-doctrine appendix. Chapter 15 uses one finding from the doctrine appendix. The rest is a book of its own and this is not it.

**The synthetic-reader programme, at length.** It gets a bench entry in Chapter 16 and no chapter. The method is genuinely interesting and it has one run against one page, which is too thin to build a chapter on without inflating it.

**Prior art, and the February-to-August origins.** A registry was built in February 2026 and retired in June. That story is on the site at `https://pki.sgit.ai/origins/index.html` and it would have improved Chapter 2. It was cut for length.

**A second worked example.** Everything in Part three runs on one repository, one agent, one mandate. There is no second example because there is no second environment measured by a second agent.

## What is open, honestly

Named as they actually are, and the people-shaped ones are named as people-shaped.

**Engineering, and answerable by doing:**

- **The lane-anchors experiment.** One test lane, one afternoon. It decides whether the designed enrolment path is possible at all. Nobody has run it, and it is the cheapest de-risking available in the estate.
- **`params.json`'s signature recipe is wrong** and the fix is one field. Chapter 15, A1.
- **The delta block authors part of a grant**, and the shortfall column is a literal. Chapter 15, A2 and A3.
- **REP-0001 §2 still points implementers at the superseded record model.** The fix is one sentence, identified by an outside reader two days ago and still not made.
- **The briefing zip is regenerated by nobody.** It is a build step, not a decision.
- **The pre-push hook does not travel with a clone**, and nothing announces it.

**Design, and needing a decision rather than a keyboard:**

- **What a capability name is.** The largest absence in the estate. Every delta in this book is a set operation over an undefined type, and the shortfall direction is uncomputable without it.
- **Whether the registry accepts third-party attestations at all.** Published unresolved, and it decides whether this register can ever carry a social trust signal or only self-assertions.
- **Whether an unaccepted mandate is inert or live on issue.** Taken provisionally as inert, demonstrated by a fixture, unresolved.
- **What happens when the component contract needs to move.** GM-D32 settled *consume, not fork*. It did not settle who decides, and Chapter 12 names the four shapes that question will arrive in.

**And the people-shaped ones, which are people-shaped and not engineering tasks:**

- **Nobody outside the project has been asked whether any of this is a need.** The estate's own doctrine appendix says asking five operators is a Phase I fix rather than a nice-to-have. It has not been done, and it is the single highest-yield action available.
- **REP-0001 has no sponsor.** The Sponsor field is empty because the specification has no champion. That is the same doctrinal hole as the line above, in a second place.
- **The real issuer key nobody has enrolled.** Not a cryptography problem. It requires a person to decide that an identity is worth vouching for, and to have somewhere durable to keep a private half. The register ships the enrolment path; nobody has walked it.
- **The boundary the hook has not reached.** A branch protection rule is a configuration change somebody has to choose to make on a repository they administer.
- **And a customer quote slot published empty**, in the pack's PR/FAQ, because there is no customer and inventing one is what this site's participant rules forbid.

## Honest tensions in this book

| Tension | Note |
|---|---|
| A book about an estate this young | The material is unusually well documented for its age and unusually thin in population. The value is the reasoning; the risk is that reasoning reads as maturity |
| Figures of a moving site | Past figures are pinned to a tag and never go stale; present figures break the build on the next release. Two maintenance costs rather than none, accepted deliberately — and a maintainer under time pressure will re-record a digest rather than re-examine a figure, which the gate cannot detect |
| One session, one voice | Coherence bought at the cost of a single perspective, and a perspective from inside the estate |
| Written by a participant | Unavoidable, disclosed, and the reason Chapter 16 carries the weight it does. The strongest bias in a participant's account is not what it says but what it thinks to check, and there is no way for me to know what I did not think to run |
| Quoting a corpus that argues | The packs are dense with argument and blend easily into a summary. The stated/drawn discipline exists for that reason and it is a discipline, not a guarantee |
| Marking 48 claims as my own | Enough to be useful, and enough that a reader who skips the markers will attribute a great deal to this estate that it never said |

## Corrections

This book supersedes rather than rewrites, which is the estate's rule. A correction to anything here will be recorded in this colophon rather than folded silently into a chapter.

The one correction made during writing: an early draft of Chapter 3 attributed a passage to the readiness report's Q2 section that had in fact been conflated with the phase table in its section 3. The quote gate caught it before publication. It is recorded here because a gate that catches something and leaves no trace teaches nobody anything.

---

*Sources, tools and figures: `https://pki.sgit.ai/book/`. Everything CC BY 4.0.*

*Built with `python3`, `jq`, `openssl`, `git worktree`, Playwright and `sgit-ai v0.16.0`. No content on this page was written by anybody who had not read the artefact it describes.*
