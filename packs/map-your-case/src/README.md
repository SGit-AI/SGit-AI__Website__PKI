# Map Your Case — pack README

**Status:** a hindsight pack around a shipped tool. The assessment at `/assess` is live at v2; this pack captures the principles, library, model and architecture as built (documents 01–04), and specifies what v3 builds from documents rather than memory (07–09, 11) · site-agent authored · awaiting project-lead adoption (corpus version assigned then)
**Date:** 21 August 2026

The dev pack for **Map Your Case** — the workflow where a visitor assembles their own agent installations from a public library and sees the delta between their grant and their mandate, with nothing about them ever leaving their browser. Written the other way round from its sibling pack: the registry MVP pack was design first, build later; this one is written after the thing it specifies, because the tool shipped twice (v1 on 20 August, v2 on 21 August) before its thinking was captured anywhere but commit messages. Documents 07 and 08 operationalise the two v0.33.61 programme briefs — levels-and-variants, and the synthetic-reader tabletop with its screenshot boundary — and document 12 is the honest record of the first MVP: the corrections, the six bugs that became principles, and what was verified before each ship.

## Reading order

1. `00__LEADING-BRIEF.md` — what the tool is, the vocabulary, the five positions, the three sets
2. `01__principles.md` — the thirteen invariants, each with its reason and its check
3. `02__the-library.md` — the single data file: entries, evidence classes, rules for change
4. `03__the-model.md` — choices to delta: the pipeline, and the three places the obvious implementation is wrong
5. `04__architecture.md` — web components without shadow DOM, one state owner, storage with its failure modes
6. `05__workflows-and-user-stories.md` — five users, twenty stories with tests that can fail, the honest feature column
7. `06__screens.md` — the page as the visitor meets it, the rendering rules, the four v3 screens
8. `07__levels-and-variants.md` — the grid, the five grant-ordered scenarios, the three sets, the stopping rule
9. `08__synthetic-readers.md` — the screenshot boundary, exogenous budgets, defects-not-preferences, the two rules
10. `09__sharing.md` — the fragment as the channel; choices-only by construction; the drift notice
11. `10__wardley-maps.md` — four maps: the scarce components are editorial, none mechanical
12. `11__build-order.md` — five phases; documents before code; tabletop before build
13. `12__the-first-mvp.md` — v1, the corrections, the bugs, the verification discipline — the receipts
14. `99__change-control.md` — **the appendix.** Eleven corrections, twenty-seven decisions. Read it second if you are about to build; last if you are reading through. Never not at all

## Below the pack: the synthetic readers

`packs/map-your-case/readers/` — the instrument that tests these pages, kept **outside** the pack
because it feeds the pack rather than belonging to it, and because its output is **simulated
material**. Three archetypes, four fixed instruments, exogenous patience budgets, and the run
records — including **simulated run 001**, performed against /assess at v0.1.22, which found four
defects and confirmed two design decisions from the outside, and its **type B informed analysis**,
which corrected two errors in the run record and added four findings the blind run could not
produce. Findings flow one way, into the appendix above as MC5–MC10.

All content CC BY 4.0.
