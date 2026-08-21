# 03 — The Model

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The computation from choices to delta: pure functions, one pipeline, and the three places where the obvious implementation is wrong. This is the document to read before touching `assess/js/model.js`.

---

## The contract

`model.js` is pure: **no DOM, no storage, no rendering.** Everything in it is testable by calling it, and everything the page concludes about the visitor comes out of it (principle P3). The one idea the whole file serves:

> A capability is reachable if **some** path of live nodes reaches it, and the honest label for that capability is the **weakest** control on that path. A path is only as bounded as its least-enforced node — which is why escalation edges matter: they create paths that go around a setting.

The tier order is fixed: `boundary (3) > setting (2) > expectation (1) > none (0)`.

## The pipeline

State in, dashboard out — six stages:

```
state {products, facts, controls, intent}
  → surfacesOf        products resolve to surfaces (deduplicated)
  → buildGraph        one live graph per surface: facts prune, controls reshape
  → reachable         weakest route per capability, across every surface
  → computeGap        excess (reach − intent) and shortfall (intent − reach)
  → assess            chokepoint, escalated paths, tier counts, unverified count
  → controlEffect     per control: the before/after diff the visitor sees
```

### Stage 1 — facts prune (`factHolds`, `liveFacts`)

`factHolds` returns true for `yes`, `unsure`, **and undefined** — absence of an answer is not evidence of absence (P4). `liveFacts` computes which questions even apply: a fact is live only if one of its surfaces is in play and its `requires` chain holds, so the question list shrinks with the case.

### Stage 2 — controls reshape (`buildGraph`)

For one surface, apply every ticked control that covers it: collect `removes`, `marks`, `downgrades`, `swaps`. Then walk the raw tree and keep a node only if neither it **nor any ancestor** is removed or fact-pruned — the drop test walks the parent chain, because removing a node must remove its consequences. Survivors get their effective tier (`marks` may re-tier), their effective reach (`swaps` may weaken a capability), and an `unverified` flag when their gating fact is `unsure`.

Escalation edges survive only if both ends are live **and** no ticked control `downgrades` the source. This is where "a container turns the escalation off" is implemented as structure rather than prose.

### Stage 3 — every path, then the weakest (`pathsTo`, `weakest`)

`pathsTo` enumerates every route from the root to a node, following parent edges **and** escalation edges, with a seen-set against cycles. `weakest` reduces a path to its least-enforced node. Neither function is clever; the honesty is entirely in refusing to pick the flattering path.

### Stage 4 — the weakest route wins (`reachable`)

Across all surfaces and all paths, each capability keeps the entry whose weakest node ranks **lowest**: if one surface reaches a capability through a boundary and another through nothing, the honest summary is *nothing*.

**The subtlety that was once a shipped bug:** whether an escalation route *exists* is a property of the capability, not of whichever path happened to win the weakest-link contest. On a local surface the root (tier `none`) is already the weakest node on the *direct* path, so the direct path always wins — and if `viaEscalation` were recorded only on the winner, every escalation in the library would be invisible. The model therefore accumulates `viaEscalation` (any path used one) and `escalationOnly` (all paths did) **across paths**, independently of which entry wins. The comment in the source says exactly this, so the next editor cannot re-simplify it into the bug.

### Stage 5 — the two directions of the gap (`computeGap`)

- **Excess** = reachable but not intended, sorted by capability weight then label — the exposure nobody accepted.
- **Shortfall** = intended but not reachable — what the visitor meant to authorise and cannot actually do. Both directions are named because both are real: a shortfall is an operations problem, and rendering it keeps the tool from being a fear instrument (P10).

### Stage 6 — the sentence, not the histogram (`assess`)

On a local surface the root is the weakest link on *every* path, so a histogram of tiers reads "all none" and tells nobody anything. The informative statistic is the **chokepoint**: the single node that is the weakest link on the most excess paths — *one node accounts for N of M*. That sentence is the dashboard's centre: it says the visitor has **one problem, not eleven**, and names it.

`assess` also returns `escalated` (excess entries whose capability has an escalation route), the unverified count, and the controls split into in-place and available.

### The control diff (`controlEffect`)

A control's effect is computed by running `reachable` twice — with and without the control — and diffing: `closes` (capabilities no longer reachable, excluding intended ones) and `strengthens` (capabilities whose weakest tier improved). Never asserted, always derived from this visitor's own case (P3). It is the most expensive call in the file and it is still instant, because the graphs are tens of nodes, not thousands.

## The three places the obvious implementation is wrong

1. **Recording escalation on the winning path only** (stage 4). Masked every escalation the library had. The fix is in the accumulation, and the regression test pins it.
2. **Dropping a node without walking its ancestors** (stage 2). A removed parent must take its subtree; testing only leaf removal passes while the tree lies.
3. **A tree without benign nodes** (library-side, but the model surfaces it): if the CLI tree cannot reach `chat`, then "have a conversation" lands in the **shortfall** of a coding agent's owner — a nonsense the first test suite *asserted as correct*. The lesson generalises: a test that encodes the author's assumption verifies the assumption, not the behaviour. Document 12, lesson 3.

## Tests

`model.test.mjs` (kept with the site's test harness) asserts the pipeline end to end: fact resolution incl. `unsure`; pruning incl. ancestor-walks and `requires` chains; each control field's structural effect; escalation existence tracked across paths; weakest-route selection across surfaces; gap directions; chokepoint selection; and the empty state. The rule for the file: **every bug in this document's history has a test that fails if it comes back.**

## What the model refuses to compute

No score (P6). No probability, no severity beyond the library's stated weights-for-sorting, no aggregation across visitors (there is nowhere to aggregate — no backend), and no risk-acceptance state (P7). The model's entire output vocabulary is: reachable, tier, evidence, path, excess, shortfall, chokepoint, closes, strengthens. Everything else is presentation.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
