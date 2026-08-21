# 06 — The Screens

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The page as the visitor meets it: the shipped screens in order, the rendering rules they obey, and the four screens v3 adds. Wording is design here — the load-bearing strings are quoted, because a renderer that paraphrases them in a mockup will paraphrase them in the product.

---

## The order is the argument

v2's page order is: **dashboard → examples → picker → facts → picture → intent → delta → controls → sidenote.** The dashboard comes first because v1's order (explanation, privacy essay, then work, then result) made the visitor pay before seeing the instrument work — and the correction memo said so. The rule generalises: **the page shows what it can already say before it asks for anything.**

## Screen by screen, as shipped

### 1 — The dashboard

The running answer, always current, updated on every choice. Its blocks, in order: what is in play (products/surfaces); the delta counts **as counts of named things, never a score**; the chokepoint sentence — *one node is the weakest link on N of M paths* — because on a local surface that sentence is the whole diagnosis; the escalated entries; and the unverified count with the exact wording rule: an untouched fact is **"not established either way"** — never "you said 'not sure'", because the visitor has not said anything yet.

### 2 — The examples row

Four cases (document 02) loadable in one click. Their job is recognition and a working demonstration before any work; editing away from an example is the intended path, composing from nothing is the fallback.

### 3 — The picker

Named products in surface groups, with an "other" per surface. Big boxes, product names — *the thing you installed*, not a category. Multiple picks accumulate surfaces; there is no "case" object anywhere in the interface (the noun was v1's central defect — document 12, lesson 1).

### 4 — The facts

Only the questions that apply (live-facts pruning), each `yes / no / not sure`, with the hint text from the library. Answering visibly changes the picture and the dashboard — the feedback loop that makes the questions feel like levers rather than a form.

### 5 — The picture (scene ⇄ graph)

One toggle, two views of the same live graph: **"As a picture"** (the scene — machine frame, vendor frame, boundary line, reach lines with stop-circles) and **"As a graph"** (the layered DAG with tier bars, `?` markers, dashed escalation edges). Beside it the **inspector**: click a capability for its evidence pack (paths → weakest evidence → re-run method), click a node for its detail prose. Every click answers *why is this here*, which is what made v1's inert-looking nodes a reported bug rather than a nitpick.

### 6 — The intent

*"What did you actually mean to authorise?"* — capability checkboxes in the three groups, benign group present and pre-checkable, because a mandate that cannot include "have a conversation" is a fear instrument's mandate (P10).

### 7 — The delta

Excess and shortfall, both directions, sorted frightening-first within excess. Each row opens the inspector. The hosted-only path ends this section on a **request** rather than a remedy (P8).

### 8 — The controls

*"Which of these is already true of your setup?"* — one verb, no acceptance. Each row: honest effort label, then the computed effect for this case: *closes these, strengthens those*. A control that does nothing for this visitor says "changes nothing in your current case" — the string is load-bearing; without it the row reads as broken rather than honest.

### 9 — The sidenote

Storage: the raw bytes on demand, wipe and reset, and the storage-unavailable notices. Demoted to the end deliberately; the privacy claim's proof is the network panel (P2), not an essay.

### The explorer (library.html)

Surface tabs, the tree drawn, and the raw JSON colourised with the selected node highlighted in both. The librarian's review surface and the visitor's exit from trust — the two audiences one page can serve because both need the same thing: *show me the row.*

## Rendering rules

Inherited from this estate's mockup exercise (registry pack C27–C30) and this tool's own history, restated here as this page's rules:

1. **No page-level verdict.** No total tick, no grade, no colour that sums the page (P6). A column of per-row states must not visually add up to one.
2. **State never rides on colour alone.** Tier and evidence render as glyph + word + colour; the `?` marker survives monochrome.
3. **An absent computation renders as absent.** A control effect that is not computed for this case is not drawn as a neutral tick — it is not drawn.
4. **Copy that names the visitor's situation comes from the model** (P3). The strings above are fixed; the numbers in them are computed.
5. **Wide content scrolls inside its own container** — the graphs live in `.gscroll`; the page never scrolls horizontally on a phone. (Two shipped mobile bugs stand behind this sentence — document 12.)

## The v3 screens

Specified here first, built later (documents 07–09, 11):

- **The level-one landing.** One screen, complete in itself (the stopping rule: *a landing, not a stair*), in plain language, for every visitor including the advanced one — the entry point does not vary, the language deeper in does.
- **The three-sets dashboard.** Mandated / exercised beyond the mandate / held and never used, with the middle set conceded as where the value came from and the third as the question (*why does it have that?*). Gated on the exercised-set import decision (change control, MC-D7) because the source is a session transcript, and getting it into the page reopens the storage rule.
- **The share view.** What a recipient sees from a fragment link: the reconstructed dashboard, the library version it was pinned to, and the mismatch notice when the library has moved (document 09).
- **The run gallery.** Published synthetic-reader runs — including, prominently, the abandoned ones and what changed because of them. Every quoted reaction carries the simulation marker inline (rule one); the gallery's job is the working method, not an advertisement.

## The one screen this tool will never have

A score. The refusal is renderable: wherever a summary number would go, the chokepoint sentence goes instead — a sentence with a noun in it that the visitor can act on, rather than a number they can feel.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
