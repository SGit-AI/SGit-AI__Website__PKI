# 12 — The First MVP

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The honest record of v1 and v2: what was built, what the project lead's corrections changed, the six bugs that became principles, and what was verified before each ship. This is the document the rest of the pack leans on when it says a rule was purchased with a mistake — the receipts.

---

## Why this document is in the pack

The registry pack learned its most valuable lessons from an outside session reading it cold, and recorded them. This pack's equivalent teacher was **shipping**: v1 went live on 20 August, the project lead used it, and a voice-memo's worth of corrections arrived within hours. Capturing that cycle is the point of a hindsight pack — the alternative is that the reasons live in commit messages and evaporate. Anyone proposing a v3 change should read this first: several "obvious improvements" are listed below as the defects they turned out to be.

## v1 — built in a day, right about the spine

v1 was built the same day from the v0.33.61 user-section brief. What it got right survived unchanged into v2 and became document 01's principles:

- **Choices, never answers** — references into a public library, no free-text input anywhere (P1).
- **Same-origin, no backend** — the privacy claim as architecture (P2).
- **`unsure` means present-but-unverified** (P4).
- **Weakest-link labelling** over the grant tree (P5).
- **No score** (P6).

What it got wrong is more instructive.

## The corrections, and what each one taught

### 1 — The tool had "cases"; the user has agents

**Symptom reported:** "every time I press *+ add agent* it creates a new case."
**Actual defect:** not a UI bug — a design vocabulary leaked into the interface. The tool was built around a "case" object the visitor was supposed to manage; the visitor has *installations*, and wanted to add one. The concept was removed entirely rather than repaired: products accumulate into one live state, and no noun called "case" exists in the interface.
**The lesson, now registry-pack C25 / decision 40:** a design vocabulary in an interface produces defects that look like UI bugs. The visitor's nouns are the interface's nouns.

### 2 — "Hosted by a vendor" answered nobody's question

v1's picker offered surface categories, and the hosted category had one entry. The correction memo named real products — Claude Code, Claude Desktop, Claude on the web, ChatGPT, Mistral. A visitor recognises *the thing they installed*, not its taxonomy. v2's picker is thirteen named products in four surface groups; the surface still carries the tree (document 02's basis rule), so naming products did not turn the library into a vendor scorecard.

### 3 — Reading before doing

v1 opened with the explanation and the privacy story, then the work, then the result. The memo's correction: the shareable dashboard is the product — put it first, make the steps feed it, demote the storage essay to a sidenote. v2's order (document 06) is the inversion, and the rule generalised: the page shows what it can already say before asking for anything.

### 4 — Risk acceptance did not belong

v1 let a visitor "accept" a residual risk. The correction: acceptance is a governance act with an acceptor, an interval and a record — it belongs to the risk product, and a browser-storage checkbox called "accepted" is theatre. Removed; controls became *already-true facts with computed effects* (P7). Registry-pack decision 41.

### 5 — "An hour" for a separate account

v1's effort label for running the agent under a separate user account said roughly an hour. The project lead, who has done it: it is **hard — days, and it fights you** — paths, permissions, editors and agents all assume one account, and desktop applications frequently cannot be run that way at all. The label was corrected to say exactly that (P9). An effort label that flatters the control burns the one reader who acts on it.

### 6 — Clicks that looked inert

Nodes and capabilities looked clickable and did nothing visible. v2 gave every click an answer — the inspector's evidence packs and node detail prose — and the render loop one owner (document 04), because the inert-click symptoms traced to state living in more than one place.

## The bugs that became tests

Three shipped defects in v2's own development, each now pinned by a test and quoted in document 03:

1. **Escalation masking.** `viaEscalation` was recorded only on the path that won the weakest-link contest; on local surfaces the direct path always wins (the root is tier `none`), so *every* escalation was invisible. Fix: escalation-existence accumulates across all paths. The bug shipped briefly and was caught by asking why the dashboard never mentioned escalations on the solo-dev example — a question a test now asks permanently.
2. **The missing conversation node.** CLI and desktop trees had no benign conversation capability, so "have a conversation" appeared in a coding agent's **shortfall** — and the test suite asserted the nonsense, because the test encoded the same wrong assumption as the library. Both fixed; the lesson (benign nodes are mandatory, tests verify behaviour not assumptions) is in documents 02 and 03.
3. **Wording ahead of the visitor.** The dashboard said *you said "not sure"* before the visitor had said anything. Untouched facts now read *"not established either way"* (P4's wording rule). Small, and exactly the kind of sentence that decides whether the page reads as honest or presumptuous.

Three more were mechanical, and each left a rule: the JSON colouriser matched `&quot;` that its own escaper never produced (test the highlighter against the escaper's actual output); grid children without `min-width: 0` pushed phones wide; SVG text nodes made the overflow check lie (`scrollWidth` is meaningless on SVG — exclude `SVGElement` from viewport tests).

## What was verified before each ship

The discipline, recorded because it is the part hindsight forgets fastest:

- **The model suite** (`model.test.mjs`) green — pipeline end to end, including the regression pins above.
- **Same-origin check**: full assessment with the network panel open; every request this site's.
- **Five viewport widths** including 390px; overflow test excluding SVG text; both views inside `.gscroll`.
- **Live-byte verification** after deploy: hashes of served files against the repo.
- **The redaction scan** on every captured file — the same gate every published document on this site passes.

## What v2 still owes

Stated here so the pack cannot be read as claiming more than shipped: the library is dated as a whole, not per node (MC3); examples are four, not the five grant-ordered scenarios; there is no level-one landing, no share links, no three-sets dashboard, no tabletop harness, and the entry checker is a convention rather than a script. That list is document 11's phases 1–4, in order.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
