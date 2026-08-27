# 7 · Reality before the risk register

*Part two — The vocabulary, and why each word is load-bearing*

---

There is one sequence underneath every term in Part two, and the pack is explicit that it is a constraint rather than a preference:

```
   REALITY     the agentic environment, as installed and configured
   TWIN        that installation — the thing every fact attaches to
   FACTS       the GRANT (measured, dated, provenance per node)
               the MANDATE (authored, signed, with an interval)
   FINDING     the DELTA (computed, not argued)
   RISKS       derived, at each altitude, in that altitude's language
   DECISIONS   separate nodes: named acceptor, interval
```

The leading brief states the rule and its consequence in one paragraph:

> A grant is a *fact*, and a fact is a *measurement*. You cannot author a risk before you have a fact. So the first screen of the MVP is not a risk register and not a risk-appetite questionnaire — it is *which environment, and here is what it can do*. A pack whose first screen is a risk register reproduces exactly the habit it exists to fix.

*Stated.* And the detail worth noticing is where this correction came from. The pack records it as GM4, sourced from *the pack-spec brief, correcting its own approach mid-sentence.* The brief that specified this work started down the risk-register path and stopped itself. The ordering rule is a recorded self-correction, not a principle somebody arrived at cleanly, which is a small point in its favour.

## What the ordering rule forbids

Read the chain backwards and each step names something that becomes incoherent if you skip its predecessor.

**A risk named before a fact is a guess.** It has no measurement behind it, so it cannot be checked, and it cannot be closed by evidence — only by argument. This is most of what risk registers contain, and the reason they age so badly.

**A decision recorded before a delta accepts nothing measurable.** Somebody signs off on an exposure whose size is unknown. The signature is real; what it applies to is not. When the exposure later turns out to be four times larger, nobody can say whether it was accepted or not, because there was never a number to accept.

**A fact attached to nothing is unusable.** This is what `twin` is for, and it is the step most likely to be dismissed as ceremony. A grant is not a general truth; it is a property of *one installation*. Two people running the same product have different grants if their configurations differ — and, once memory enters, different grants if their *histories* differ. Without a twin to attach facts to, a grant is a vendor-shaped generalisation and cannot be differenced against anybody's mandate.

## The time axis, which makes this harder than it looks

Memory is where the ordering rule earns its keep, and it is the clearest argument in the whole estate because it needs no security expertise to follow.

With memory off, a grant is a tree — a property of the environment. With memory on, it is that tree unioned with everything any prior session reached, for as long as history is retained. So it is a property of the environment *and its past*.

The leading brief makes the case for why this is the argument to lead with:

> This is the clearest case in the whole product, because it needs no security argument — anybody understands that a tool which remembers everything you have shown it can be asked about any of it, and the asking need not come from you.

*Stated.* Nothing in that sentence requires believing anything about threat models. It is a description of what retention means.

The consequence for the vocabulary is structural: `history` is a top-level field on the grant document rather than a node, because it changes the meaning of every other node. And the consequence for the architecture is the one Chapter 12 depends on — a library entry can never be the whole answer for a real user, because the library publishes the *static* term and only an instance can carry the *accumulated* one.

The two real library entries differ on exactly this axis, and the contrast is the most useful thing about having two. The hosted agent container **retains a session record**, so its grant is a union over prior turns. The CI runner **retains nothing**, so its grant is a tree over the present. Same tool, same measurer, same day, and a structurally different kind of object at the end.

## What a risk-first screen would have cost

The pack enforces the ordering rule through screen order, and the counterfactual is worth stating because it is where the rule stops being philosophy.

A first screen showing a risk has to have got that risk from somewhere. There are only two places available. Either it came from a library of generic risks — in which case it is about a category of product rather than about the reader's installation, and the reader's honest response is *how do you know that applies to me*, to which there is no answer. Or it came from a questionnaire — in which case the reader has just been asked to self-report their own exposure, which is precisely the unfalsifiable floor Chapter 5 exists to correct, and now it is upstream of everything.

Either way the delta becomes uncomputable, because there is no measured grant to subtract from. The screens can still render. They render an argument rather than a finding.

*Drawn.* The packs do not say this, and I think it is the strongest practical version of the rule: **a risk-first flow is not just methodologically backwards, it is architecturally unable to produce the one number the product exists to produce.** The ordering rule is enforced by screen order because that is where it is cheap to enforce, but it is not a UX convention — it is the difference between a tool that computes and a tool that asserts.

## The shipped consumer, and where it stops

The assessment at `https://pki.sgit.ai/assess/index.html` is the ordering rule with a user interface on it, and it is the one artefact in this estate that a non-technical reader can use today. Chapter 13 covers the two paths it serves; here it matters for what it deliberately does *not* do.

Risk acceptance is not in it. It was in the first version, and it was removed — because acceptance belongs to the risk product, and the version that had it was wrong. That is a costly removal: acceptance is the satisfying end of the flow, the thing that makes a session feel finished. Cutting it leaves the tool ending on a gap rather than on a resolution.

The estate cut it anyway, and the ordering rule is why. `DECISIONS` is the last node in the chain and it lives on the other side of the boundary Chapter 12 draws.

*Drawn.* There is a tension here the estate names but does not resolve, and I want to leave it visible rather than tidy it. The chain runs `finding → risks → decisions`, and the registry's half ends at `finding`. But the assessment does end on something — the visitor is shown a gap and offered an action. That action is not a *decision* in the chain's sense, since there is no acceptor and no interval, and the tool cannot store one because it stores choices and never answers. So the shipped consumer of the ordering rule stops one step short of where the rule says a flow should stop, for a reason that is about data protection rather than about the model. The two constraints point in different directions here, and this estate has resolved it by ending on a request instead of a record. That is defensible and it is not the same thing as the chain being complete.

## Why this chapter closes Part two

The four vocabulary chapters are really one argument in four pieces.

**Grant and mandate** are separate because what exists and what was decided are different quantities. **The delta** is computed and never stored because it is a relationship between two moving things. **The tier test** exists because a control's label is worthless without knowing what enforces it. And **the ordering rule** is what stops all three from being used out of sequence, where each of them quietly becomes something else: a grant that was authored is a wish, a delta that was stored is stale, a tier decided in isolation is a mislabel, and a risk named before a fact is a guess.

Every one of those four failure modes has an example in this estate's own artefacts, produced by this estate's own tools, and recorded in its own change control. Part three is where they get shown.
