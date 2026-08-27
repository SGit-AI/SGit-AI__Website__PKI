# Commissioning Brief: *A Key Means Nothing Alone* — The Book Of What This Site Shipped, How It Composes With RiskMandate, And What None Of It Proves

**version** draft-1 (site-agent, written at the project lead's request)
**date** 27 August 2026
**from** The site agent, pki.sgit.ai
**to** The writing session that will produce this book

**type** Book-writing brief — a writing round, not a build round

*Modelled on the book-writing pack graphs.sgit.ai used to commission its three books (brief 38, "Three books from this estate"), and on the shape the first of those actually took: fifteen chapters in five parts plus front matter, a colophon and a reference card; markdown as the source of truth; one PDF that reads start to finish offline with no link followed; a machine surface carrying hashes; and the honesty positions travelling with the text rather than being confined to a caveats page. **This is a writing round.** Nothing in the site changes. Limitation: the estate this book describes is four days old, most of it is fixtures on purpose, and the honest word for nearly all of it is *demonstration* — a book that forgets that would be the overclaim this site exists to argue against.*

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

## 3 · The shape

Fifteen chapters in five parts, plus front matter, a colophon and a reference card — eighteen files, the shape the sibling estate's first book converged on. Target **30,000–40,000 words**. Chapter titles below are the intent, not a contract; a better title that keeps the argument is a good edit.

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
15. **What ships, what is argued.** The bench's `does_not_prove` lists, gathered into one chapter and argued rather than listed. **The single most important chapter in the book**, and the reason a reader can trust the other fourteen.
16. **Your first mandate, tomorrow.** The smallest real thing a reader can do: measure their own environment with the published tool, author a mandate narrower than what they find, and compile one line of it into an enforcement point. What it will and will not get them.

> Parts one to five hold fifteen chapters; the numbering above runs to sixteen because chapter 14 does double duty as narrative and evidence. **Merge or split as the writing demands** — the constraint is the five-part arc, not the count.

### Colophon — what was cut, and what remains open
The open decisions, honestly: the capability vocabulary that does not exist, the lane-anchors question that gates an entire phase, the real issuer key nobody has enrolled, and the boundary the hook has not reached. **Name the people-shaped ones as people-shaped**, not as engineering tasks.

### Reference card
One page, written to be **pasted into an agent session**: the four rules, the tier test, the delta definitions, the verification walk, the URLs that resolve, and the two sentences an agent must carry if it summarises anything from this estate.

## 4 · Screenshots, and the gate that keeps them honest

The project lead asked for screenshots, and this estate cannot ship an image that might be describing a page it no longer shows.

**Capture method** — already exercised in this repo and reproducible:
```
python3 -m http.server <port>          # serve the working tree
/opt/pw-browsers/chromium --headless --disable-gpu --no-sandbox \
  --window-size=<W>,<H> --screenshot=<out>.png http://localhost:<port>/<page>
```
The headless browser cannot reach the live site through this environment's egress proxy, so **capture locally and prove equivalence by hash** — fetch the live page, `sha256sum` both, and record the digest beside the image. That is the practice the release notes already use and it is not optional here.

**Every screenshot carries:** the page it shows, the **site version** it was taken at, the **SHA-256 of the page's bytes**, and a one-line caption saying what the reader should notice — never merely what the image is of.

**The gate:** `book/shots/shots.json` records those digests, and **the build fails when a recorded digest no longer matches the page**. A stale screenshot is the print equivalent of a stale claim, and this estate breaks the build for those.

**The minimum set** — twelve, and each must earn its place by showing something the prose cannot say as quickly:

| # | Shows | Why it earns its place |
|---|---|---|
| 1 | `/bench/` — the two columns | The limits at equal weight beside the claims. **The book's thesis in one image** |
| 2 | `/registry/` — the six verifier answers | The full answer space, including the refusals |
| 3 | A record's `01__identity.json`, raw | `private_key_published: true`, read before any signature |
| 4 | Terminal: `registry_tool.py validate` | Six answers reproduced, live |
| 5 | Terminal: `sgit pki verify` on a fetched statement | Format compatibility with the shipped CLI, executed |
| 6 | Terminal: the **forgery** — signing with the published private half | The fixture lesson, unarguable |
| 7 | Terminal: **the refused push**, full banner | The acceptance test's last sentence |
| 8 | The blocks gallery — tier badges, five states | Two channels, and the word always one of them |
| 9 | The blocks gallery — the **defeated boundary** card | The rule working on real data that is wrong |
| 10 | The blocks gallery — the authority/enforcement split | Two indicators, never one |
| 11 | The three-term comparison, with `unknown` | A gap rendered as a gap |
| 12 | `/assess/` mid-flow | The one artefact a non-technical reader can use today |

Terminal captures are **real transcripts**, re-run for the book, not reconstructions. Where a command's output has changed since it was first recorded, the book prints the new output and says so.

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

## 7 · Deliverables

| Deliverable | Detail |
|---|---|
| `book/content/*.md` | **The source of truth.** One file per chapter, CC BY 4.0 |
| `book/index.html` + a page per chapter | Each chapter page renders **its own file**, so a page cannot describe a chapter it did not render |
| `book/a-key-means-nothing-alone.pdf` | One PDF that **reads start to finish offline with no link followed**. Every URL that matters appears in full at least once |
| `book/book.json` | Machine surface: every chapter with its part, word count, and the **SHA-256 of its markdown**; every figure with its page, version and digest |
| `book/shots/` + `shots.json` | The images and their gate |
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
> Then run the verification walk yourself, re-capture the twelve figures with their hashes, and write fifteen chapters in five parts plus front matter, a colophon and a reference card.
>
> **The chapter that decides whether the book is honest is *What ships, what is argued*.** Ten of eleven records in the register are fixtures with published private keys; the hook's enforcement is real and its authority is a fixture; every grant is a floor and not a census. Those positions travel inside the chapters, not in an appendix.
>
> Deliver markdown as the source of truth, a PDF that reads offline with no link followed, `book.json` with hashes, and a bench entry carrying its own `does_not_prove`.

---

## Honest tensions in this brief

| Tension | Note |
|---|---|
| A book about a four-day-old estate | The material is unusually well documented for its age and unusually thin in population. The book's value is the reasoning; its risk is that reasoning reads as maturity |
| Screenshots of a moving site | The hash gate keeps them honest and it means the book breaks when the site moves — which is correct and will be inconvenient |
| Written by a participant | Unavoidable, disclosed, and the reason the *what it does not prove* chapter carries the weight it does |
| One session, one voice | Coherence bought at the cost of a single perspective. The sibling estate accepted the same trade deliberately |
| Locking the title | It states the thesis and it is a strong claim to have to live up to for 38,000 words |

---

*CC BY 4.0.*
