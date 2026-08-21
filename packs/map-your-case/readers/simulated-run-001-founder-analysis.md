# Informed analysis — simulated run 001, the shipping founder

**run** [Simulated run 001](simulated-run-001-founder-tabletop.html) · type B, informed
**date** 21 August 2026
**subject** The assessment at /assess, site v0.1.22

> **The run this analyses is simulated.** No person said any of the words quoted here. This
> analysis reads a generated transcript; where it quotes the reader, the words are the model's,
> not a user's, and every conclusion inherits that limit.

---

## 1 — What worked, and why

**The dashboard-first inversion carried the run.** Document 12's correction 3 records v1 opening on
an explanation and a privacy essay, and the rule that replaced it: *the page shows what it can
already say before it asks for anything.* The reader flagged the vocabulary at screens 1, 2 and 3 and
kept going each time, because one click had already produced 13 / 9 / 0 and a named weakest link.
R1 was predicted to bounce off the jargon before the finding; the finding arrived first.

**The chokepoint sentence is the product.** Document 03 stage 6 argues a tier histogram on a local
surface reads "all none" and tells nobody anything, so the informative statistic is *one node is the
weakest link on N of M*. The reader quoted it back twice: *"That's a single fix, which is the only
kind of advice I'll act on."* An argument confirmed by a reader who could not see it.

**Conceding the value defused the reactance.** P10 and document 07 hold that the gap is also where
the value came from. Its implementation at the intent step — offering only what is reachable — read
to the archetype rated medium reactance risk as *"a smart flip — it makes the gap mine rather than a
lecture."* And the picture behaved as document 07 predicted when it said to test visual variants
first: the run's only unqualified moment — *"the picture is the moment it clicked"* — came from a
rendering, not a sentence.

## 2 — What did not work, ranked by cost

**a. The truncated delta is worse than an inert affordance.** `components.js` renders
`r.excess.slice(0, 4)` then `<span class="dim">and N more</span>`, with `cursor:auto`. The operator
recorded that it does nothing; the missed part is the direction. Excess is sorted frightening-first,
so the five hidden rows are by construction the *least* alarming, and the reader's *"I want to know
what else is hiding in there"* shows the truncation swapping five mild facts for an imagined worse
set. Document 02's benign-nodes rule exists because *"a tree that only lists frightening capabilities
is measuring its own framing rather than the visitor's setup"* — and `slice(0, 4)` over a
weight-sorted list re-imposes that framing at the one place a reader within budget looks. A P6
problem wearing a UI bug's clothes.

**b. The answer is on the page three times, routed to none of them.** The full excess list renders
as clickable chips in section 5, and `copySummary()` writes every row into the clipboard text behind
the *Copy as text* button the reader had already praised — neither connected to the truncation. The
reader guessed correctly that the list was below, and ran out of budget two sections short.

**c. The escalation finding is a routing failure, not a wording one.** The operator filed F3 as a
wording task on document 06's string list. But the plain sentence already exists — `library.json`
carries *"Anything that can run programs as you can rewrite the file that turns the prompt off"* —
and the reader's own guess (*"it sounds like the safety toggles I assumed were doing something
aren't"*) was correct. They inferred the claim and would not trust the inference, because the
dashboard row is a plain `div` and the confirming sentence sits behind an uncued inspector click.
Story V6 — *"I can see why a 'restriction' doesn't restrict"* — is marked shipped and its test
passes, because it checks the `why` is *available*, not that anybody finds it.

**d. The self-scroll has a one-line cause.** Loading an example calls
`$('dash').scrollIntoView({block:'start'})` against a `position:sticky` nav with no
`scroll-margin-top`, so the card's top lands under the nav. CSS, not the scroll call.

**e. A benign capability inflates the flagship example.** Solo-dev's intent omits `draft`, so "draft
or edit a document for me" (weight 0, group `benign`) sits in excess: the headline reads 9 rather
than 8, and the chokepoint "9 of 9".

## 3 — What it is actually worth to this archetype

Two things, neither of which the page is organised around. **One surprise that changed a stated
behaviour** — *"a transcript is a superset of every file that session read"* → *"I'm going to stop
keeping months of session transcripts lying around"* — carried as a `hint` under a yes/no question.
And **one fix, addressed**: the chokepoint sentence.

Not evidenced: **the sharing claim**. They said they would screenshot the card and send it — an
intention, not an act, and document 08 puts "compelling enough to act on" out of scope. Record it as
*the card reads as sendable*, no further.

Also not evidenced: **the controls half**, never reached. P8 requires every path to end on something
the visitor can do, and its check enumerates end-states of the *document* — wrongly, since the
end-state that matters is where the budget ends. P8 survived only because the sentence at the top
happened to be an action.

## 4 — Expectation against close

Q1 asked for a blast-radius picture in seconds, two or three questions, something not already
assumed, *"an obvious 'here's the one thing to change' at the end"*, and named two exits: a security
lecture, or container settings. Q3 returned *"Better than I expected, and it respected my time."* One
surprise, one picture, one fix; neither exit fired.

The distance is small and points one way: the page met an expectation it had not set. The reader
wanted a picture and a single fix; the page happens to be built around a scene and a chokepoint
sentence — a match by construction rather than by communication. The near-miss sits inside the same
measurement: everything flagged as nearly-fatal happened *before* the first result, everything valued
after it. The Q1–Q3 distance is therefore not a comprehension gap but an **arrival** gap, narrow
enough to close by ordering rather than rewriting.

## 5 — What should change, in order

1. **Un-truncate the dashboard delta.** *(behaviour — document 06, MC7 F1.)* Render every excess row,
   or make "and N more" a real disclosure — but not by making the span clickable and keeping the
   sort, because frightening-first plus truncation is the defect.
2. **Route the escalation row to its explanation.** *(behaviour — documents 05 and 06.)* Make *Around
   a stated control* open the inspector on an escalated capability, and re-specify V6's test to fail
   on discoverability rather than only on availability.
3. **`scroll-margin-top` on the dashboard.** *(behaviour — document 06 rendering rules.)* One line.
4. **Add `draft` to solo-dev's intent.** *(behaviour — document 02.)*
5. **Re-scope P8's check to the budget, not the document.** *(structural — documents 01 and 08.)* The
   last thing a reader sees within six screens must be an action.
6. **The vocabulary — keep MC-D23 open.** *(structural.)* The reader called the eyebrow *"jargon
   soup"* three times. But "grant" and "mandate" are inherited corpus terms the computation depends
   on: a grant is what an installation technically permits, a mandate is what the holder is
   authorised to do *with an interval*, and excess authority is the subtraction. "What it can reach"
   and "what you meant" lose the interval, and with it the join to the registry and the risk product;
   document 07 reserves "altitude" and "persona" on the same reasoning. So take the observation, not
   the reader's fix. **The page already holds the plain-language version** — the h1 says *"What your
   agents can reach, and what you meant"*, with the technical eyebrow above it. Lead with the h1 and
   let the terms appear where the computation defines them: the arrival cost paid without spending
   the vocabulary. F2 also conflates two owners — the eyebrow is the assessment's copy, the nav is
   site chrome, and a tool arriving by link carries the whole site's furniture, which is a document 09
   question.
7. **Write level one.** *(structural — MC-D16, document 07, phase 2.)* The whole near-loss happened
   in the ten seconds before a result, which is exactly what a level-one landing owns — an argument
   for promoting the pack's hardest editorial item.

## 6 — What this does not license

The programme's four stated limits apply: shared model family, an instructed rather than enforced
pixel boundary, a local artefact, n = 1. Add three. Nothing supports a claim about **tone** —
*"respected my time"* is a preference, which document 08 puts out of scope. Nothing supports the
**sharing** claim, an intention. Nothing supports any claim about **the controls section**, whose
absence from the transcript is a fact about the budget.

One record-keeping correction, because this instrument exists to be quotable: `readers.json` maps
F1→MC5, F2→MC6, F3→MC7, F4→MC8, while the register numbers MC5 as the readers area, MC6 as the
arrival condition, MC7 as all four defects and MC8 as the do-not-edit rule — and `readers.json` marks
F2 "Adopted" where MC7 records it as deliberately unresolved. Both belong in the record, per P13.

## 7 — If we change one thing

**Un-truncate the delta.** Not the largest defect — the vocabulary question is more consequential —
but the only one that both cost budget *and* inverted a principle. It made the page quietly more
alarming than its own data, at the moment the reader was deciding whether to trust it, in a tool
whose sixth principle is that nothing on the page may be optimised for how alarming it feels. It is
also the cheapest item on the list. Do it before run 008.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
