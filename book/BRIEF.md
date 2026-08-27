# Commissioning Brief: *A Key Means Nothing Alone* — The Book Of What This Site Shipped, How It Composes With RiskMandate, And What None Of It Proves

**version** draft-2 (site-agent, written at the project lead's request)
**date** 27 August 2026 — draft-1 the same day; the revision record is below
**from** The site agent, pki.sgit.ai
**to** The writing session that will produce this book

**type** Book-writing brief — a writing round, not a build round

*Modelled on the book-writing pack graphs.sgit.ai used to commission its three books (brief 38, "Three books from this estate"), and on the shape the first of those actually took: fifteen chapters in five parts plus front matter, a colophon and a reference card; markdown as the source of truth; one PDF that reads start to finish offline with no link followed; a machine surface carrying hashes; and the honesty positions travelling with the text rather than being confined to a caveats page. **This is a writing round.** Nothing in the site changes. Limitation: the estate this book describes is four days old, most of it is fixtures on purpose, and the honest word for nearly all of it is *demonstration* — a book that forgets that would be the overclaim this site exists to argue against.*

> **Revision record — draft-1 → draft-2.** Draft-1 was written when one of the sibling estate's three commissioned
> books had been delivered. All three are now finished, and two of them carry disciplines stronger than what draft-1
> specified. Three changes follow, and each is a tightening rather than a new idea:
>
> 1. **§4 — figures are now taken from the version their caption names**, by git tag and worktree, not photographed
>    today and hash-matched. Draft-1's gate proved a figure matched *today's* page; it could not prove a figure of
>    v0.1.28 showed v0.1.28. Book C re-took all twenty of its figures this way and it is the single most reusable
>    thing it published.
> 2. **§6 — every load-bearing claim about what this estate *means* is now marked `stated` or `drawn`**, with a build
>    gate that re-reads every quotation out of the source it names. Book A carries 17 anchored connections against 151
>    authored ones and says so in its front matter. This book's failure mode is exactly that blend.
> 3. **§3 — a findings chapter is added**: where this estate contradicts itself and what it does not say, computed
>    rather than recalled. Book A made it a chapter rather than an appendix, and it was right to.
>
> Draft-1 is superseded, not deleted: it is in this file's git history at tag `v0.1.33`, which is the version of this
> site that published it.

---

## 1 · What this book is

**A single volume that explains what pki.sgit.ai actually built, why the concepts underneath it are shaped the way they are, how it composes with RiskMandate.ai, and — as an equal partner to all of that — what none of it proves.**

It is written for three readers at once, and the brief is explicit about the order because it decides every editorial call:

| Reader | What they need | Weight |
|---|---|---|
| **A practitioner** who runs agents and is accountable for them | The concepts, in order, with the worked example — and a first action they can take tomorrow | **Primary** |
| **The RiskMandate team** | The contract between the two products: what the library holds, what the instance holds, what crosses the boundary and what must never | **Primary** |
| **An agent** given the book and nothing else | A reference card it can act on, and machine-readable structure | Secondary, and served by construction rather than by a separate edition |

**The title is locked: *A Key Means Nothing Alone*.** It is the network's own one-line description of this site, it states the thesis (identity is not authorisation, and authorisation is not enforcement), and it earns its place because the book's whole argument is that the interesting object was never the key. **The subtitle is the writing session's call**; something in the register of *Identity, mandate, and the gap nobody accepted* is the intent, and a better one is welcome.

## 2 · Do this first: read the estate, do not recall it

The instruction that precedes every other, and it is this estate's own house rule. **Everything asserted in this book must be traceable to a published artefact, and the writing session must fetch them rather than work from this brief's summary of them.** This brief is a map, not a source.

| Read | Why |
|---|---|
| `pki.sgit.ai/llms.txt`, then `/bench/llms.txt` | The front door, then the list of everything built with its limits already stated |
| The **registry**: `/registry/llms.txt`, `params.json`, `roots.json`, a record, and `views/expected-verifications.json` | The book's centre of gravity. Run the verification walk yourself before writing a word about it |
| The **Grant & Mandate pack**, all ten documents plus change control (18 corrections, 32 decisions) | The vocabulary, the schemas, the library, the workflows, the blocks, and — in documents 07 and 08 — what was built and what it cost |
| The **Registry MVP pack**, and specifically `readiness-report.md` plus corrections **C33/C34** | The design, its outside criticism, and the entry where the pack supersedes its own status because the register got built |
| The **two library entries** and the **signed mandate** | The only real data in the estate. Every figure in the book should come from these rather than from prose about them |
| `admin/versions.html`, v0.1.25 → v0.1.32 | Eight releases, each with what changed and why. The narrative spine of Part four |
| The three **v0.33.62 / v0.33.61 source briefs** under `/briefs/` | The project lead's own words, which outrank the site agent's readings of them |

**Where this brief and a published artefact disagree, the artefact wins**, and the disagreement is worth a line in the colophon.

**And three more, for method rather than material.** The sibling estate's three commissioned books are all finished,
and two of them solved problems this book has. Read them for how, not for what — none of their content belongs here:

| Read | For |
|---|---|
| `graphs.sgit.ai/v2/books/making-a-book/content/15__appendix-c-the-harness.md` | **The time-travel harness** — §4 of this brief is built on it. Read the appendix before writing the capture scripts, not after |
| `graphs.sgit.ai/v2/books/making-a-book/index.html` | Twenty figures, each re-taken from the tag its caption names, and the sentence that justifies the whole method: *none is a reconstruction* |
| `graphs.sgit.ai/v2/books/fsg-universe/index.html` | **The provenance model** — 17 connections anchored in a corpus quote against 151 authored by the writing session, declared as such. And chapter 10: findings, computed, including the contradictions and the named absences |

## 3 · The shape

Seventeen chapters in five parts, plus front matter, an appendix carrying the harness, a colophon and a reference card — twenty-one files, close to the shape the sibling estate's books converged on. Target **32,000–42,000 words**. Chapter titles below are the intent, not a contract; a better title that keeps the argument is a good edit.

### Front matter
What this book is, who it is for, and — **on the first page, not in an appendix** — the honesty positions from §6. A reader who stops after the front matter must already know that most of what follows is a demonstration.

### Part one — Why there is nothing to inherit
1. **A key means nothing alone.** Identity, authorisation and enforcement as three separate questions the industry routinely answers with one object.
2. **The flood, and the four rules it produced.** 2019, the design goal that was not a bug, and why any registry proposed now must show it was designed with that history in hand.
3. **The bootstrap trap.** Why agent key registries do not exist, and why every workaround hands over a larger identity than the one being established.

### Part two — The vocabulary, and why each word is load-bearing
4. **Grant is not mandate.** Authority nobody decided versus authorisation somebody did — and apparent authority, which binds regardless.
5. **The delta.** Excess, shortfall, and the blind spot that needs a third term. Computed, never stored, and why that follows from the same rule that keeps history out of a register entry.
6. **Boundary, setting, expectation.** The one test — *a control bounds a grant only when it is enforced by something the grant does not include* — and the tier that reads like a boundary and behaves like a setting.
7. **Reality before the risk register.** The ordering rule as a constraint rather than a preference, and what a first screen showing a risk would have cost.

### Part three — What was built
**This is the part the screenshots serve.** Each chapter walks one artefact, shows it, and states its limit in the same breath.
8. **The register.** Eleven records, twenty-three signed statements, and why ten of the eleven are fixtures on purpose. The verification walk, executed. The four rules meeting entries for the first time.
9. **A grant is discovered, not authored.** The measurement method, the two entries, and the moment the measurement refused to measure itself.
10. **A push refused by something that is not the agent.** The mandate, the hook, the acceptance test, and the control that then blocked the release carrying it.
11. **The building blocks.** Nine primitives, the defeat-path rule, and the split that shows enforcement and authority separately because averaging them would mislead.

### Part four — How it composes
12. **The library and the instance.** The hard line: the register holds a public library carrying no personal data ever; RiskMandate holds a private instance that **stores references, never copies**. What that buys — a versionable library, and a pack shareable without describing anybody's estate. **Written with the RiskMandate team as its named audience**; see §5.
13. **Two paths.** The person walks screens and accepts prohibitions; the agent fetches documents and computes deltas. Neither is the other's fallback.
14. **Eight releases in four days.** The narrative: readiness report → register → pack → enforcement → the second measurement → the bench. Told through what each release *learned*, including the four findings that cost something to record.

### Part five — Honesty, and a first step
15. **Where this estate disagrees with itself, and what it does not say.** Findings rather than exposition, and **computed rather than recalled**. The material is already published and mostly already admitted: the readiness report's six blocking questions, the capability vocabulary that does not exist, the lane-anchors question that gates an entire phase, `mandate − grant` defined and never once measured, and a record model that records corrections but no deliveries — which is why the registry pack was still calling its own subject unbuilt three days after it shipped. **Both sides of every contradiction get quoted.** The sibling estate's atlas found six contradictions and nine absences and named TIME as the largest; a four-day-old estate should expect a longer list than a six-day-old one, not a shorter one, and should print it.
16. **What ships, what is argued.** The bench's `does_not_prove` lists, gathered into one chapter and argued rather than listed. **The single most important chapter in the book**, and the reason a reader can trust the other sixteen.
17. **Your first mandate, tomorrow.** The smallest real thing a reader can do: measure their own environment with the published tool, author a mandate narrower than what they find, and compile one line of it into an enforcement point. What it will and will not get them.

> **Merge or split as the writing demands** — the constraint is the five-part arc and the three chapters of part five, not the count. Chapters 15 and 16 are the two that cannot be merged with anything: one says where the estate is inconsistent, the other says where it is unproven, and a book that folds them together will end up doing neither.

### Appendix A — The harness
Every script that produced a figure or a number, so any claim can be **re-derived rather than believed**: `travel.sh`, the screenshot job runner, the blank-figure check, and the commands behind every count in the book. Modelled on the sibling estate's Appendix C, which is where this brief's §4 comes from.

### Colophon — what was cut, and what remains open
The open decisions, honestly: the capability vocabulary that does not exist, the lane-anchors question that gates an entire phase, the real issuer key nobody has enrolled, and the boundary the hook has not reached. **Name the people-shaped ones as people-shaped**, not as engineering tasks.

### Reference card
One page, written to be **pasted into an agent session**: the four rules, the tier test, the delta definitions, the verification walk, the URLs that resolve, and the two sentences an agent must carry if it summarises anything from this estate.

## 4 · Figures, numbers, and the gates that keep them honest

The project lead asked for screenshots. This estate cannot ship an image that might be describing a page it no longer shows — and, as the sibling estate's third book demonstrated after draft-1 of this brief was written, it cannot ship an image of *the past* reconstructed from the present either.

### 4.1 A figure is taken from the version its caption names

Several of this book's figures show pages **as they were**. The push was refused at v0.1.28. The register shipped at v0.1.26 and has changed since. A figure captioned *the register on the day it shipped* that was in fact photographed today is a reconstruction — and a reconstruction wearing a caption is a claim of authority nobody granted, in a book whose entire subject is claims of authority nobody granted.

The repository carries a tag for every release. **A tag, a worktree and a one-shot local server are the site as it actually was**, and a headless browser can photograph it:

```bash
#!/bin/bash
# travel.sh <tag> <port> <jobs.json> — worktree at <tag>, serve, shoot, tear down
set -u
TAG=$1; PORT=$2; JOBS=$3
WT=/tmp/hist-$TAG
git worktree add --detach -f "$WT" "$TAG" >/dev/null 2>&1 || { echo "worktree failed for $TAG"; exit 1; }
python3 -m http.server "$PORT" --directory "$WT" --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
for i in $(seq 1 40); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.25; done
node book/shots/shot.mjs "$PORT" "$JOBS"
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
git worktree remove --force "$WT" >/dev/null 2>&1
```

`git worktree` is what makes this cheap: a second working copy of any commit, beside the live one, in under a second, without touching the branch.

**Two operational rules, learned at the sibling estate's expense and not optional here:**

- **Never reuse a port** — not the server's, not the browser's debug port. One capture, one port, forever. A zombie headless browser holding a port serves stale bytes to every later capture on it, and makes a working page look broken for as long as it takes to suspect the browser instead of the code.
- **Always kill what you spawned**, in a block that runs whether the capture succeeded or failed. `finally`, never the happy path.

Three smaller details that decide whether the figures are usable: set `deviceScaleFactor` to 2 or 3 so they are legible in print; collect `pageerror` and print it beside each result, because **a screenshot that looks fine, taken from a page that threw, is a figure you must not publish**; and run a blank check over the batch — anything under about 3 per cent ink is a white rectangle, and white rectangles are easy to miss in a set of twelve.

### 4.2 What every figure carries, and the two gates

**Every figure carries:** the page, **the tag it was taken at**, the SHA-256 of that page's bytes at that tag, and a caption saying what the reader should *notice* — never merely what the image is of.

`book/shots/shots.json` records all of it. There are two gates, because there are two different claims:

| A figure of | Its claim | Its gate |
|---|---|---|
| **A past version** (tag ≠ current) | "this is how the page was at v0.1.28" | **Re-derivable.** Re-running `travel.sh` at that tag reproduces the recorded digest. Checkable forever, and it never goes stale, because the tag does not move |
| **The site as it stands** (tag = current) | "this is how the page is now" | **Fresh.** The recorded digest must match the live page, and **the build fails when it stops matching** — which it will, on the next release. That is correct and it is inconvenient |

A stale screenshot is the print equivalent of a stale claim, and this estate breaks the build for those.

### 4.3 The minimum set — twelve figures, each with its tag

Each must earn its place by showing something the prose cannot say as quickly.

| # | Tag | Shows | Why it earns its place |
|---|---|---|---|
| 1 | current | `/bench/` — the two columns | The limits at equal weight beside the claims. **The book's thesis in one image** |
| 2 | **v0.1.26 + current** | `/registry/` then and now, two panels | The one figure that needs time travel to exist. What four days of corrections did to a register, side by side |
| 3 | current | `/registry/` — the six verifier answers | The full answer space, including the refusals |
| 4 | current | A record's `01__identity.json`, raw | `private_key_published: true`, read before any signature |
| 5 | current | Terminal: `registry_tool.py validate` | Six answers reproduced, live |
| 6 | current | Terminal: `sgit pki verify` on a fetched statement | Format compatibility with the shipped CLI, executed |
| 7 | current | Terminal: the **forgery** — signing with the published private half | The fixture lesson, unarguable |
| 8 | **v0.1.28** | Terminal: **the refused push**, full banner | The acceptance test's last sentence, photographed at the release where it happened |
| 9 | current | The blocks gallery — tier badges, five states | Two channels, and the word always one of them |
| 10 | current | The blocks gallery — the **defeated boundary** card | The rule working on real data that is wrong |
| 11 | current | The blocks gallery — the authority/enforcement split | Two indicators, never one |
| 12 | current | `/assess/` mid-flow | The one artefact a non-technical reader can use today |

Terminal captures are **real transcripts**, re-run against the checked-out worktree of the tag in the caption — not reconstructions, and not pasted from a release note. Where a command's output has changed since it was first recorded, the book prints both and says which is which.

### 4.4 Every number computed, never recalled

*Eight releases in four days*; eleven records, ten of them fixtures; twenty-three statements; eighteen corrections and thirty-two decisions; the gaps between releases. **Every number in this book is computed from the repository at the moment of writing, and the command that produced it is carried in Appendix A.** Nothing is quoted from this brief, from a release note, or from memory — including the numbers in this sentence, which are draft-1's and may already be wrong. **Where a number in this brief disagrees with the repository, the repository wins and the brief was wrong**, and that disagreement is worth a line in the colophon.

## 5 · The RiskMandate chapter, specified

The project lead asked how this works with RiskMandate.ai, and chapter 12 is the answer. It must be **usable as a contract**, not as a description.

**The settled architecture** (Grant & Mandate pack, GM3 and GM-D32):

| | pki.sgit.ai | riskmandate.ai |
|---|---|---|
| Holds | The **library**: measured grants per environment, dated | The **instance**: this user's selections, mandate, deltas, risks |
| Nature | A public dataset | A private instance over it |
| Personal data | **None. Ever** | All of it |
| Produced by | Re-running a measurement | A person answering questions |
| Shared | Published, one fetch | **Never published** |

Four things the chapter must settle in writing:

1. **References, never copies.** The instance stores library identifiers. A corrected entry improves every instance that referenced it; a copy keeps the stale answer silently. This is also what makes a finished pack **shareable without describing anybody's machine** — the property the whole integration exists to preserve.
2. **The component contract.** RiskMandate **consumes** `assets/gm-blocks.css` rather than forking it (GM-D32, settled by the project lead on 26 August). The chapter states what that commits both sides to, and what happens when one needs a block the other does not.
3. **Where the chain hands over.** `reality → twin → facts → finding → risks → decisions`. **The registry's half ends at *finding*.** Risks, acceptance, acceptors and intervals are RiskMandate's, and the chapter draws that line explicitly so neither side builds the other's half by accident.
4. **What must never cross.** No personal data into the library, ever. The chapter should say what a violation would look like in practice, because a rule with no failure mode described is a rule nobody can check.

**Write it as though the RiskMandate team will disagree with part of it**, and leave the disagreement addressable: name the open question (GM-D32's successor — what happens when the two products need the contract to move) rather than papering over it.

## 6 · The honesty positions, which travel with the text

Non-negotiable, and they belong **in the chapters** rather than quarantined in a caveats section. A reader who quotes any chapter in isolation must still carry these:

- **The register is built; the trustworthy register is not.** Ten of eleven records are fixtures with published private keys. Every signature verifies and proves nothing.
- **The root is a fixture**, and `roots.json` says so in its own entry. No chain in this register carries authority.
- **The enforcement is real and the authority is not.** The hook refuses pushes; its mandate is signed by the fixture root, so anybody could forge it and the hook would enforce the forgery just as diligently.
- **The hook is a `setting`, not a `boundary`** — it sits inside the grant it bounds, and `--no-verify` gets past it.
- **Every grant is a floor, not a census.** An agent measuring its own grant reports what it can see.
- **Two environments, one agent, one mandate.** Everything generalises from a sample that small.
- **The write path is a git commit reviewed by a human**, not the account-less lane the design calls for.
- **This is a participant's account.** Published by the project that builds the layer it argues for, and the disclosure travels with the book.

### The provenance rule: what this estate states, and what this book concluded

The sibling estate's Universe volume, delivered after draft-1 of this brief, carries a discipline this book needs more
than that one did. Of its 168 connections, **17 are anchored in a quote the corpus states and 151 were authored by the
writing session with their reasoning carried instead** — and it says in its own front matter: *do not treat the authored
ones as corpus positions.*

That is this book's likeliest failure. The packs are dense with argument, and a writing session moving at pace will
blend its own inferences into them so smoothly that afterwards neither the reader nor the session can separate them.
**Which is the same error the book is about**: authority nobody granted, assumed because nothing in the presentation
distinguished it from authority that was. A book making that mistake about its own sources cannot credibly diagnose it
in anybody else's agent.

So:

- **Every load-bearing claim about what this estate *means* is marked `stated` or `drawn`.** `stated` carries a
  **verbatim quote** with its document and section. `drawn` carries the writing session's reasoning **in the reader's
  view**, not in a note.
- **`book/quotes.json` records every `stated` quote with its source and locator, and the build re-reads every one of
  them out of the source it names.** A quote not found where it claims to be fails the build. This estate does not
  print quotations it has not checked, and the sibling volume re-reads 165 of them on every build.
- **In prose the distinction is a sentence, not a sigil.** *“Document 02 puts it this way: …”* against *“The packs do
  not say this; reading them together, the reason appears to be …”*. No footnote machinery — a reader must be able to
  tell by reading.
- **The colophon carries the count**, as the sibling volume does: how many of the book's load-bearing claims are the
  estate's, and how many are the book's own.

## 7 · Deliverables

| Deliverable | Detail |
|---|---|
| `book/content/*.md` | **The source of truth.** One file per chapter, CC BY 4.0 |
| `book/index.html` + a page per chapter | Each chapter page renders **its own file**, so a page cannot describe a chapter it did not render |
| `book/a-key-means-nothing-alone.pdf` | One PDF that **reads start to finish offline with no link followed**. Every URL that matters appears in full at least once |
| `book/book.json` | Machine surface: every chapter with its part, word count, and the **SHA-256 of its markdown**; every figure with its page, version and digest |
| `book/shots/` + `shots.json` | The images, each with the **tag it was taken at**, and the two gates of §4.2 |
| `book/shots/travel.sh` + `shot.mjs` | The capture harness, published with the book so any figure can be **re-taken rather than believed** |
| `book/quotes.json` | Every `stated` quotation with its source and locator, **re-read out of the source on every build** |
| `book/llms.txt` | The book's own front door, carrying the §6 positions so a summarising agent cannot drop them |
| A bench entry | The book goes on `/bench/` like everything else — with its own `does_not_prove` |

## 8 · The acceptance test

> Hand the PDF to somebody who has never seen this estate and take the site away. They should finish able to state, in their own words: **what a grant is and how it differs from a mandate; why ten of eleven records are fixtures and what that costs; what the push refusal proved and what it did not; where pki.sgit.ai stops and RiskMandate.ai starts; and one thing they could do tomorrow.** If they finish believing the register is trustworthy, the book has failed — however well it reads.

And the agent half, in this estate's usual discipline: **give a fresh agent the reference card and nothing else. It should reach a correct verification answer against the live register without reading a page.**

## 9 · What this book must not be

- **Not a rewrite of the packs.** They are the design record and stay authoritative; the book is the argument, told once, for somebody who will not read fifteen documents.
- **Not a product announcement.** Nothing here is a product. The word *demonstration* is accurate more often than it is comfortable.
- **Not a second vocabulary.** The lexicon exists (Grant & Mandate document 01). Use it, and if a word is wrong, correct it in change control rather than inventing a parallel term in prose.
- **Not a claim that the estate is finished.** Four days, two environments, one agent, one mandate, a fixture root.
- **Not written across sessions.** Per the sibling estate's own book round: **one book, one fresh session**, so the argument has a single voice.

## 10 · Entry prompt for the writing session

> You are writing **A Key Means Nothing Alone**, a single-volume book about what pki.sgit.ai built between site v0.1.25 and v0.1.32 and how it composes with RiskMandate.ai.
>
> **Start by fetching `https://pki.sgit.ai/llms.txt` and `https://pki.sgit.ai/bench/llms.txt`, then read the estate listed in §2 of `book/BRIEF.md`.** Do not write from the brief's summary of the material; the brief is a map and the artefacts are the sources. Where they disagree, the artefact wins and the disagreement goes in the colophon.
>
> Then run the verification walk yourself and **take the twelve figures from the tags their captions name** — `git worktree` at the tag, a fresh port, a browser killed in a `finally`; §4 carries the harness. Then write seventeen chapters in five parts, plus front matter, the harness appendix, a colophon and a reference card.
>
> **Mark every load-bearing claim about what this estate means as `stated` or `drawn`** — a verbatim quote with its source, or your own reasoning shown in the reader's view. Blending the two is the same error this book is about. Compute every number from the repository; recall none of them.
>
> **The chapter that decides whether the book is honest is *What ships, what is argued*.** Ten of eleven records in the register are fixtures with published private keys; the hook's enforcement is real and its authority is a fixture; every grant is a floor and not a census. Those positions travel inside the chapters, not in an appendix.
>
> Deliver markdown as the source of truth, a PDF that reads offline with no link followed, `book.json` with hashes, and a bench entry carrying its own `does_not_prove`.

---

## Honest tensions in this brief

| Tension | Note |
|---|---|
| A book about a four-day-old estate | The material is unusually well documented for its age and unusually thin in population. The book's value is the reasoning; its risk is that reasoning reads as maturity |
| Screenshots of a moving site | Figures of the past are pinned to a tag and never go stale; figures of the present break the build on the next release. That is two maintenance costs rather than none, accepted deliberately |
| A brief revised before it was executed | Draft-2 tightens three things draft-1 got loosely, on evidence that arrived a day later. The risk is a brief that keeps improving instead of being executed — **the next change to this file should be the book, not draft-3** |
| Written by a participant | Unavoidable, disclosed, and the reason the *what it does not prove* chapter carries the weight it does |
| One session, one voice | Coherence bought at the cost of a single perspective. The sibling estate accepted the same trade deliberately |
| Locking the title | It states the thesis and it is a strong claim to have to live up to for 38,000 words |

---

*CC BY 4.0.*
