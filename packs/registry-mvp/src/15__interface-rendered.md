# The Screens, Rendered: What Twelve ASCII Mockups Turn Into When They Meet A Viewport — And The Six Things The Fixed-Width Form Was Hiding

**version** draft-1 (external pass — corpus version to be assigned on adoption)
**date** 21 August 2026
**from** A fresh session, working from the briefing pack cold
**to** The site agent, Project lead, Engineering, Design

**type** Dev brief — user-facing surface, and the artefact that goes with it

*Sixteenth document of the registry MVP pack, and the second one describing something built rather than designed — though what is built here is a **mockup**, not a register. Document 08 wrote the register interface out as intended output in fixed-width ASCII, deliberately, so the wording could be argued with before anything existed. This document reports what happened when those same screens were rendered as real markup at real widths: twelve screens, in the site's own design tokens, as one self-contained file. **Five of the six findings below are things the ASCII form could not have surfaced**, because a 78-column monospace block has no viewport, no colour, no interaction and no wrap point. Limitation: this is still a mockup against the schemas rather than against a population, so document 08's own caveat travels unchanged — M1's crowding and M5's policy results are guesses, and rendering them prettily has not made them more trustworthy.*


> **Editorial note from the site agent, on receipt — 21 August 2026.**
> This document is published **as delivered**, because the pack's rule is that sources stay verbatim and that
> applies to a document arriving from another author as much as to one from the corpus. Two things a reader
> should carry into it, neither of them changing its substance:
>
> **The proposed entries are numbered C25–C28 below and were adopted as
> [C27–C30](change-control.html).** C25 and C26 were taken while this document was being written — by the
> walkthrough that rebuilt `/assess`, and by the doctrine appendix. The numbering here is what the delivering
> session could see.
>
> **Finding 3 slightly overstates what document 08 leaves out.** It says the rule for `nobody` "specifies the
> glyph and stops"; in fact document 08's own rendering carries the trailing clause — *this claim cannot be
> verified by anyone* — in its example. What it does not do is state that the clause is **mandatory**, or give
> `nobody` a rendering distinct from *not-yet*. The correction stands and is a real improvement; its
> characterisation of the gap is a shade broader than the gap.
>
> One citation reads `REP-0001 §5.3`. That section is a seven-step numbered list rather than subsections, so
> the reference is to **§5, step 3** — and step 3 does say what the finding says it says.
>
> *Checked on receipt, and all of it held:* all **seven** load-bearing strings from document 08's protection
> table appear verbatim in the build; the C8 citation behind C28 is accurate; and the file loads with
> **no third-party requests and no framework**.

---
---

## What This Is

`registry-mockups.html` — one file, no build step, no dependencies, twelve tabbed screens:

| Tab | Screen | Source |
|---|---|---|
| The badge | The primitive, and the five states as rendered atoms | doc 08 · C10 |
| M3 | The register index, with the checkable-fraction panel | doc 08 |
| M1 | The agent page — the acceptance test made concrete | doc 08 · C1 |
| M2 | One badge expanded, with the transcript and the fixture check | doc 08 · doc 13 |
| Grant tree | The expansion of M1's excess box: path, tiers, per-node dates | doc 12 |
| M4 | The mandate composer, with all three later documents folded in | doc 08 · doc 11 · doc 12 |
| M5 | Policy — instrumentation and enforcement, side by side | doc 08 |
| M6 | Enrolment, with the blind acknowledgement intact | doc 08 |
| M7 | The verifier's answer, and the refusal | doc 08 · C2 |
| Observability | Who has never checked; lane health; the must-not-carry list | doc 11 |
| M8 | Empty and failure states, plus a fixture state doc 08 does not have | doc 08 · C3 |
| M9 | The CLI mirror | doc 08 |

Every load-bearing string from document 08's protection table appears **verbatim**. That was a deliberate constraint on the build rather than a courtesy: the strings are the design, and a renderer that paraphrases them in a mockup is a renderer that will paraphrase them in the product.

## What The Fixed-Width Form Was Hiding

Six findings. The first four are corrections to document 08; the last two are gaps in it.

### 1. Colour alone re-collapses the five states, and the ASCII could not show that

Document 08's whole argument is that *denied*, *unreachable* and *not checked* are three situations routinely collapsed into one. In monospace they are distinguished by glyph and word, and that is sufficient because it is all there is.

**On a screen there is a third channel, and it is the one readers actually use.** Rendered with colour, `✗ denied` (red) and `⚠ unreachable` (amber) sit adjacent on the hue circle and merge for a substantial fraction of readers; `○ not checked` (grey) and `? unknown` (grey) merge for everybody, because both are the absence of colour.

> **The rendering rule the pack needs: never fewer than two channels, and the word is always one of them.** Glyph plus word plus colour is the built form; glyph plus colour alone is a regression to four states.

This is the badge's own thesis arriving one layer down — a design that exists to prevent a collapse acquired a new way to collapse the moment it left monospace.

### 2. The badge does not fit on a phone, and where it wraps is a design decision

Six fields inline is a desktop assumption that fixed-width mockups make invisibly. At 390px the badge wraps, and the wrap point matters:

- Wrapping between **state** and **verifiable-by** leaves a bare `✓` sitting next to a claim, with `nobody · no method` on the line below. That is the exact misreading the badge exists to prevent, produced by a line break.
- Wrapping between **cost** and **last-checked** is harmless.

**So the badge has a required grouping**: `glyph + state + verifiable-by` is one unbreakable unit, and everything after it may wrap freely. In the build this is a flex container with the first three children in a nowrap group. It should be written into document 08 as a rendering rule, because it is not a styling preference — it is the same rule as *an edge whose verifiable-by is nobody is never shown with a ✓*, enforced against a viewport rather than against an author.

### 3. `nobody` and `not-yet` share a glyph, and on screen that is not enough

Document 08 gives both the `○ not checked` state. In monospace they are told apart by the text that follows. Rendered, two edges on the same page carrying the same grey `○` read as the same fact, and the distinction — *nobody has asked yet* versus *no party can ever ask* — is the most important one on the page.

The build gives the `nobody` case a **dashed border and a mandatory trailing clause** (`this claim cannot be verified by anyone`), so the two are separable at a glance and by a screen reader. **This is a proposed correction to document 08's own absolute rule**, which currently specifies the glyph and stops.

### 4. Five stacked ticks are a page-level tick

M7's *basis* block is five confirmed edges in a column. Document 08 forbids a page-level green tick on the grounds that pages do not have standing. Rendered, **five ✓ in a vertical stack is a page-level tick** — the eye reads the column, not the rows, and no individual rule was broken to produce it.

The build's mitigation is that each row carries its own method and cost text, so the column reads as five distinct checks rather than one verdict. It is a mitigation and not a fix, and it is recorded here rather than smoothed, because the honest statement is: **the prohibition on a page-level tick is harder to hold than document 08 states, and it is hardest exactly where the answer is good.**

### 5. Story I8 was written and no screen owned the interaction

Document 12 adds *I8 — see the path, not the count*, and says M1's excess-authority box "should be expandable to the path through the tree". Document 08 was published before document 12 and its M1 has no expander. Neither document owns the resulting interaction, and a story with no screen is how a story quietly does not ship.

The build wires it: M1's box carries **Expand the path through the tree**, which is a cross-screen navigation into the grant tree, landing on the worst path rather than the count. M4's excess block carries the same control, because the composer is where the finding is most actionable — *before* the mandate is signed.

### 6. No screen owns the fixture flag

Document 13 requires M2's transcript to say when a signature verified against a **published** private half. Document 08 predates it, and M8's failure-state list has no fixture entry — so a fixture currently has a rule in the spec, a note in document 13, and nowhere to appear.

The build adds two things: a **fixture check panel in M2**, positioned *before* the result (per REP-0001 §5.3 — the flag is read before any signature is evaluated), and a **fixture state in M8** carrying C3's language in full. A verifier that succeeds and concludes something false is the one failure mode with no visible symptom, so it needs the most conspicuous rendering in the set, not the least.

## What Was Deliberately Not Built

Recorded so the absences are not read as oversights.

**The graph view.** Document 08 defers it on purpose and gives the reason: a graph view without per-edge badges is the diagram-of-assertions failure. The position holds and nothing here changes it. The badge has still not met a real edge.

**The auditor's seat.** M1 carries a *What did this record say on…* control that goes nowhere. Document 10 makes the auditor a separate user, and C8 records that the query behind it — *what did this identity look like on this date* — **has no command behind it**. Drawing a working screen over an unwritten traversal would have been the pack's own overclaiming failure, so the control is present, visibly inert, and the gap stays legible.

**A populated M1 and a real M5.** The two least trustworthy mockups in document 08 are the two least trustworthy screens here, for the same reason. The tabletop in document 07 remains the cheapest way to populate them, and rendering has not substituted for it.

**Search results, and the crowded index.** M3 is drawn at three agents. Nothing is known about how it behaves at three hundred, and the checkable-fraction panel is the part most likely to break — a percentage over 24 edges is a fact; a percentage over 24,000 is a summary statistic, and the pack has a standing objection to those.

## Integration Notes

**The file inlines a copy of the site's design tokens.** It reads `--bg`, `--panel`, `--accent`, the four semantic colours and the terminal palette from `assets/site.css` and reproduces them in a `<style>` block so the file stands alone. **In the repository this copy will drift**, and a drifted copy of a design system is worse than no copy, because it looks current. Two options, and the second is better:

| Option | Consequence |
|---|---|
| Keep it self-contained | Portable, sendable, drifts silently |
| Link `../assets/site.css` and move the mockup-specific rules to `assets/mockups.css` | Tracks the site, and the file stops working when opened from a local folder — **the same opaque-origin failure document 14 already records for /assess**, so the failure mode is known and already in the test matrix |

**No JavaScript beyond tab switching**, and no storage of any kind — which keeps the /assess conformance claim intact if this lands on the same origin. Anyone can open the network panel and watch nothing leave, for the same reason: there is nothing to send.

**Accessibility floor as built:** visible keyboard focus, `prefers-reduced-motion` respected, `role="tablist"` on the screen rail, and the two-channel state rule from finding 1 above. Not audited beyond that.

## Proposed Change-Control Entries

In Appendix C's format, and marked **proposed** rather than adopted, because the corrections belong to the site agent to accept and this session is not it.

**C25 — The badge has rendering rules, not only authoring rules.** Document 08 specifies what a badge must *say*. Findings 1–3 above specify how it must be *drawn*: two channels minimum with the word always one of them; an unbreakable `glyph + state + verifiable-by` group; and a distinct rendering for `nobody` versus `not-yet`. *Status: proposed for document 08.*

**C26 — A page-level tick can be assembled from edge-level ticks.** M7's basis block produces one without breaking any rule. The prohibition needs a rendering constraint beside it, not just a principle. *Status: proposed, unresolved — the mitigation in the build is partial.*

**C27 — I8 and the fixture flag have no owning screen.** Two requirements from documents 12 and 13 land on screens specified in document 08 before those documents existed. Either document 08 grows the screens or the requirements name their own. *Status: proposed; the build takes the first reading.*

**C28 — The auditor's screen is blocked on C8, and should stay visibly blocked.** The traversal is unwritten code and the register's product. A drawn screen would hide that. *Status: proposed as a standing rule for this interface — inert controls over absent ones, where the absence is the finding.*

## Honest Tensions

| Tension | Note |
|---|---|
| A prettier mockup is a more persuasive one | Rendering these screens in the site's real tokens makes an unbuilt system look shipped. The file carries `mockup · nothing here is built` in its chrome on every screen, and that is a mitigation rather than a solution |
| Twelve tabs is a navigation the product will not have | The tab rail is an artefact of presenting screens side by side. A real register is navigated by fingerprint, not by screen name, and nothing here tests that path |
| The build folded later documents into earlier screens | M4 now carries inputs from documents 08, 11 and 12 and is the most crowded screen in the set. That is faithful to the corrections and it is also the first evidence that **the composer is where every later document lands** — worth watching |
| Verbatim strings are a constraint on the design | Several load-bearing strings are long, and they set the width of the boxes containing them. The wording won, twice, over a tidier layout. That is the correct order and it is visible in the result |
| One session, one pass, no user | Same limitation as the pack itself. Nothing here has been put in front of anybody who did not already know what a mandate is |

## Open Questions

| Question | Notes |
|---|---|
| Does this become a site page, or stay a pack artefact? | A page inherits the site's obligations — the participant disclosure, the versioning, the honest-limitations register. A zipped artefact does not, and reaches fewer readers |
| Self-contained or linked to `site.css`? | The drift argument says linked; the portability argument says not. The decision belongs with whoever maintains the site's assets |
| Do the C25 rendering rules belong in document 08 or in a new document? | They are rules about drawing, and document 08 is explicitly about wording. A separate short document may be the honest home |
| Is `⚠ unreachable` rendered as amber sustainable? | Amber reads as *warning* and unreachable is not a warning about the subject — it is a fact about the authority. No better colour was found, and the word is carrying the distinction alone |
| What is the mobile form of the grant tree? | Nesting four levels deep inside a 390px viewport is the one layout in this set that has no good answer yet, and it is the screen document 12 most wants read |

---

*Added on delivery, 21 August 2026. This document supersedes nothing. It reports on documents 08, 11, 12, 13 and REP-0001 §§4–5 from the outside, and the corrections it proposes are proposals — the pack's rule is that corrections are recorded rather than silently folded in, and that rule applies to corrections arriving from a fresh session as much as to the ones arriving from the corpus.*

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
