# 01 — Principles

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The invariants. Every rule the tool runs on, each with its reason and the check that would catch a violation — because most of these are implemented as absences, and an absence is the easiest thing in a codebase to break politely.

---

## Why this document exists

Nearly every rule below was purchased with a specific mistake — [document 12](12__the-first-mvp.md) has the receipts. Collected here, each rule has three parts: the statement, the reason, and **how a violation would be caught**, because a principle nobody can test is a preference.

## P1 — Store the choices, never the answers

**The rule.** The visitor's stored state is a set of references into the public library — product identifiers, fact answers from a fixed vocabulary, control identifiers, capability identifiers — and never a description of their machine. Implemented as strictly as it can be: **there is no free-text input anywhere on the page.**

**The reason.** A completed assessment is, assembled, a serviceable plan for attacking the visitor. References into a public library describe the library; only the *selection* is the visitor's, and a selection of public facts is the minimum this tool can hold and still work.

**The check.** Grep the page for `<input`, `<textarea>`, `contenteditable`. Inspect the stored object: every value must be an identifier that appears in `library.json` or one of `yes | no | unsure`. Anything else is a violation, whatever it is called.

## P2 — No backend, no third-party request, same origin only

**The rule.** The page makes no request to any host other than its own. No CDN scripts, no chart libraries, no fonts, no telemetry. Storage is the browser's.

**The reason.** The privacy claim must be **architectural rather than promised** — a property checkable in the network panel in ten seconds, not a policy document. This is also the site's own thesis demonstrated: the page is a conformance test for the claim that useful work does not require handing data over.

**The check.** Open the network panel, complete an assessment: every request resolves to the site's origin. This is re-run before every release.

## P3 — Computed, never asserted

**The rule.** Every conclusion the page shows about the visitor — what is reachable, the delta, what a control would change, the chokepoint — is computed by the model from the library and the visitor's choices. The page never hand-writes a conclusion about the visitor, and a control's effect is a before/after diff, never a marketing sentence.

**The reason.** An asserted conclusion is an opinion with the tool's authority attached. A computed one is checkable: wrong output means a wrong library entry or a wrong function, both of which are correctable in public.

**The check.** Every sentence on the dashboard that mentions the visitor's situation must trace to a model function. The model is pure (no DOM, no storage), so the trace is runnable: `model.test.mjs` asserts the pipeline end to end.

## P4 — "Not sure" resolves to present-but-unverified

**The rule.** Fact answers are `yes | no | unsure`, and `unsure` is treated as *present, marked unverified* — never as absent.

**The reason.** Assuming absence is the comfortable error, and this tool has no business making it on the visitor's behalf. An unverified path is rendered with its marker (`?`) so the visitor can tell measured from assumed — but it is rendered.

**The check.** `factHolds()` returns true for `unsure`; the test asserts it. And the dashboard wording for an untouched fact is *"not established either way"* — never *"you said not sure"*, because the visitor has not said anything yet.

## P5 — The weakest link on the path labels the capability

**The rule.** A capability's honest label is the weakest control on the strongest claim's path to it — and if any surface reaches it through nothing, the summary is *nothing*, whatever the other surfaces do. Escalation edges are first-class: a route that goes around a setting exists in the graph, so a setting with an escalation around it is cosmetic and is shown as such.

**The reason.** A path is only as bounded as its least-enforced node. Averaging tiers, or reporting the best path, manufactures assurance.

**The check.** The model tracks whether an escalation route *exists* as a property of the capability across all paths, not of whichever path won the weakest-link contest — the distinction that was once a shipped bug ([document 12](12__the-first-mvp.md), lesson 2).

## P6 — No score

**The rule.** The page never renders a number-out-of-a-hundred, a grade, a colour-coded total, or any scalar that summarises the visitor's situation.

**The reason.** A score gets optimised — by the library curator, for how alarming it feels; by the visitor, for how comfortable it feels. The chokepoint sentence (*one node is the weakest link on N of M paths*) carries more information than any scalar and cannot be gamed into a badge.

**The check.** Textual: no element on the page renders a quantity that is not a count of named things.

## P7 — No risk acceptance

**The rule.** The tool never offers "accept this risk". Controls are ticked as *already true of my setup*, with a computed effect — never as intentions, never as acceptances.

**The reason.** Accepting a risk is a governance act: it has an acceptor, an interval and a record, and it belongs to the risk product where those exist. A checkbox that says "accepted" in browser storage is theatre wearing governance's clothes. (Registry pack decision 41, taken by the project lead on 21 August.)

**The check.** The controls section's copy offers exactly one verb — *is this already true?* — and the stored value is membership in a set of control identifiers, nothing more.

## P8 — Every personalised result ends on something the visitor can do

**The rule.** No dead-end alarm. Every path through the tool ends on an action — and the hosted case, where nothing the visitor does changes the containment, ends on a **request** (to the vendor, to the workplace) rather than a pretend remedy.

**The reason.** The measured failure mode of fear appeals: a strong threat with a weak answer produces denial rather than change. A general explainer may withhold remedies; a personalised page may not.

**The check.** For every reachable end-state of the page, list the final rendered element: it must be an action or a request, and the hosted-only path must never render a remedy it cannot deliver.

## P9 — Honest effort labels

**The rule.** A control's cost is stated as it is, including when the honest label is discouraging: separate accounts are *"hard — days, and it fights you"*, and desktop applications frequently cannot be run that way at all.

**The reason.** An effort label that flatters the control gets the visitor halfway into a migration that fails, which converts one alarmed reader into one burned one. The tool's credibility is spent at the exact moment somebody acts on it.

**The check.** Effort labels live in the library, so they are reviewable in a diff — and the standing test is whether the project lead, reading one, says "that is not what it took me".

## P10 — Concede the value before naming the danger

**The rule.** The gap is presented as three sets — **mandated**, **exercised beyond the mandate**, **held and never used** — and the middle set is acknowledged as *where the value came from*, before the third is named as the product.

**The reason.** Measured in the session that wrote the levels brief: the out-of-mandate capabilities were exercised, repeatedly, and improved the output. Every experienced reader knows this. A tool that opens with *look what could go wrong* is dismissed by the only people who could act on it; a tool that opens with *you needed that one — now, why does it hold this one?* is having an honest conversation.

**The check.** The framing question anywhere on the page is never *what could go wrong* — it is *which parts of your grant did you actually use*.

## P11 — The variant rule

**The rule**, verbatim from the 9 August executive-view brief, applied here to every alternative rendering of an assessment:

> **A persona may change emphasis, ordering, vocabulary and format, and may never change what is being accepted.**

**The reason.** Framing is unavoidable, which makes it a governance question. A "variant" that adds or drops a fact is not a variant — it is a different assessment wearing the same name.

**The check.** Mechanical, and the library makes it so: every variant renders the same underlying fact set, so **a diff of the fact sets across variants must be empty**. The library gives facts identity; the diff needs no judgement.

## P12 — The two simulation rules

Set on 9 August, non-negotiable, and carried into this pack verbatim because [document 08](08__synthetic-readers.md) builds the machinery they govern:

> **A simulated acceptance must never be confusable with a real one.** Different storage, different rendering, and an indelible marker that survives export.

> **Simulate the role, not the named individual.** Modelling how a chief financial officer generally responds is a training aid. Modelling how a specific named person will respond, and tuning a presentation against that model, is building a tool for routing around a colleague. The line is between preparing for a conversation and pre-empting a person.

The narrow exception document 08 operationalises — an archetype composed from several people — carries its own test, checkable by somebody other than the author: **if the person it came from, or a colleague of theirs, would recognise them in it, it is a portrait rather than an archetype.**

**The check.** For rule one: quote any fragment of a published synthetic run out of context; if the fragment can pass as a real user's words, the marker failed. For rule two: the archetype's recorded property list is published; its sources never are.

## P13 — Supersede, never rewrite

**The rule.** Published sources are not silently edited. Corrections live in [the change-control appendix](99__change-control.md) with their source and status; later drafts fold them in and the appendix becomes the change log.

**The reason.** The record of *why* a thing changed is most of what a design pack is worth — this pack's own document 12 could not have been written without the registry pack having kept that discipline.

**The check.** The appendix's correction count only ever goes up.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
