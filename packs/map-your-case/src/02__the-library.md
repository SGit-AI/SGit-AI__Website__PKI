# 02 — The Library

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The single data file everything else consumes: what it holds, the rules its entries must obey, and why the library — not the code — is where this tool's honesty lives.

---

## One file, one job

Everything the tool knows lives in `assess/library.json` — one versioned JSON document, served same-origin, readable raw by anybody, and rendered by [its own explorer page](../../assess/library.html) as both a graph and colourised source. The code computes; **the library claims.** Every sentence the dashboard shows traces to a library entry, so an argument with the tool is an argument with a library row — reviewable, correctable in a pull request, and dated.

This is the same shape as the corpus's comparison discipline: the library is a **dated assessment of other people's products**, so every claim carries its evidence class and every surface carries a re-run method. The visitor is never asked to trust the library; they are given the means to check it.

## The top level

| Key | What it holds | Count at v2 |
|---|---|---|
| `version` | The library's date — `"2026-08-21"` | — |
| `basis` | The epistemic ground rule (below) | prose |
| `evidence` | The four evidence classes, defined | 4 |
| `tiers` | The three-tier control test, in the visitor's language | 4 (incl. `none`) |
| `surfaces` | Where an agent runs: `cli`, `desktop`, `web`, `agentbox` | 4 |
| `products` | Named products mapping to surfaces | 13 |
| `facts` | The questions about the visitor's machine | 10 |
| `controls` | Containment that may already be true | 7 |
| `nodes` | Per-surface grant trees | 12 / 11 / 5 / 6 |
| `escalations` | Edges that go around settings | 2 |
| `capabilities` | What reach means, in outcomes | 17 |
| `examples` | Prefilled cases a visitor can load | 4 |
| `rerun` | Per-surface re-run methods | 4 |

## The basis: architecture, not audit

The library's own opening rule:

> Every tree here is derived from what a surface **architecturally is**, not from a security assessment of any vendor.

That a command-line agent running under your account can reach what your account can reach is a fact about command-line programs — true of all of them, and not a claim about any vendor's competence. This is what lets the library name products (Claude Code, Codex CLI, Gemini CLI, Claude Desktop, ChatGPT, Mistral…) without becoming a vendor scorecard: **the product picks the surface; the surface carries the tree.** Products exist because "hosted by a vendor" answered nobody's question — a visitor recognises *the thing they installed*, not a category. (v1 shipped categories; the correction is recorded in [document 12](12__the-first-mvp.md).)

Naming a product carries an obligation inherited from the participant rules: a named row must be re-checkable, which is what the `rerun` methods and per-claim evidence classes are for. The registry pack holds the open half of this (decision 34: naming means measuring); the library's answer at v2 is to keep every named product's tree derived-from-surface, with `measured` rows marked as one vendor, one surface, one date, never generalised.

## Evidence classes

Every node carries `evidence`, one of four values defined in the library itself:

| Class | Meaning |
|---|---|
| `derived` | Reasoned from what the surface is. True by construction — and nobody has checked this instance. |
| `third-party` | From a published read-only audit tool's module list, so the row is comparable with something public. |
| `measured` | Observed inside a running installation on the stated date. One vendor, one surface, one date. Not generalised. |
| `tested` | The boundary was probed by making the attempt. |

The dashboard's evidence packs render these classes per path, and the **weakest evidence on the path** labels the answer — the same weakest-link discipline the tiers use, applied to how well anything is known.

## Facts: questions with a fixed vocabulary

A fact is a question about the visitor's machine whose answers are `yes | no | unsure` — never text. Shape: `id`, `surfaces` (where it applies), optional `requires` (asked only if a parent fact holds), the question `q`, an optional `hint`, and `default: "unsure"`.

Two rules:

- **`unsure` means present-but-unverified** (principle P4). The library's defaults are all `unsure`, so an untouched assessment shows the surface's full architectural tree, marked unverified — the tool's starting claim is the derivable one, not the comfortable one.
- **`requires` chains prune questions, not just nodes.** A visitor who answers "no credential files" is never asked whether those files open a cloud account. The question list is itself computed (`liveFacts`), which keeps the page short for small cases — the dictation scenario sees almost no questions at all.

## Controls: already-true, with computed effects

A control is containment that may **already be true** of the visitor's setup — never an intention, never an acceptance (P7). Shape: `id`, `surfaces`, `label`, `effort`, `tier`, and up to four effect fields the model applies structurally:

| Field | Effect on the graph |
|---|---|
| `removes` | Drops nodes (and their subtrees) entirely |
| `marks` | Re-tiers a node — e.g. a container turns "reach the network" from nothing into a boundary |
| `downgrades` | Disables escalation edges out of a node |
| `swaps` | Replaces one reached capability with a weaker one |

The effect the visitor sees is **never the library's description — it is a before/after diff** computed against their own case (`controlEffect`): *ticking this closes these three paths and strengthens these two.* A control that closes nothing for this visitor says so, which is the honesty that makes the list worth reading.

Effort labels are honest to the point of discouragement (P9): `sep-account` is *"hard — days, and it fights you"*, with the note that desktop applications frequently cannot be run that way at all. The label was corrected from "an hour" by the person who had actually done it; the lesson is recorded in document 12.

## Nodes: the grant trees

One tree per surface. Shape: `id`, `parent`, `label`, `tier` (from the three-tier test), `evidence`, optional `requires` (a fact id), optional `reaches` (capability ids), optional `mechanism` (what enforces the tier, named), and `detail` — the prose shown when the node is clicked, written to be quoted.

Three structural rules:

- **The root is the grant.** On local surfaces the root is *"Runs as your user account"*, tier `none`, and the detail says the load-bearing thing: everything below is a consequence, not a separate decision.
- **Benign nodes are mandatory.** Every tree contains the capabilities the visitor actually wanted — the conversation node reaches `chat`, `draft`, `explain`. A tree that only lists frightening capabilities is measuring its own framing rather than the visitor's setup; and their absence produces false shortfalls (*"have a conversation" is beyond your grant* — shipped once, as a bug asserted by its own test; document 12, lesson 3).
- **A `mechanism` names what enforces a `setting`.** *"The tool's own directory restriction"* — so the escalation edge that defeats it reads as a fact about the mechanism, not an insult to the vendor.

## Escalations: the edges around settings

An escalation is an edge stating that reaching one node yields another, regardless of any setting in between — with a `why` in plain language: *anything that can run programs as you can rewrite the file that turns the prompt off.* Two ship at v2 (`exec→cfg`, `exec→creds`, both on `cli` and `desktop`), and they are the reason a `setting` tier is honest: the graph shows the route around it rather than asking the visitor to intuit one.

## Capabilities: outcomes, in three groups

Reach is stated in outcomes a person recognises, grouped `benign` / `work` / `reach`, each with a `weight` used only for sort order — never summed into a score (P6). Seventeen at v2. The benign group's weights are zero: the tool sorts the frightening things first *within the excess list*, and refuses to aggregate.

## Examples: recognition before work

Four prefilled cases (`solo-dev`, `careful-dev`, `mixed`, `hosted-only`), each a complete state object — products, facts, controls, intent. They exist because the empty state asks the visitor to work before showing them anything; loading an example shows the whole instrument working in one click, and editing away from an example is easier than composing from nothing. Examples are also the seed of [document 07](07__levels-and-variants.md)'s scenario library: the five grant-ordered scenarios land here as library entries in v3.

## Rerun: the library's exit from trust

Per-surface, prose, naming a public method — e.g. running a published read-only agent-risk audit locally and comparing its module list with the tree. The library never asks to be believed; it says how to check, which is the estate's comparison discipline (*dated, re-runnable, method before findings*) applied to the library's own claims.

## Rules for changing the library

1. **A new claim needs a tier, an evidence class and a detail** — a node without all three is not addable.
2. **`version` moves whenever any entry moves.** At v2 the date is library-wide; per-node dates are queued for v3 ([change control](99__change-control.md), MC3) because a tree dated as a whole is quietly wrong while looking current — one vendor default change invalidates one row, not the file.
3. **Fact-set identity is load-bearing.** The variant rule's mechanical check (P11) diffs fact sets across renderings; renaming a fact id is therefore a breaking change to every stored assessment and every future share link, and gets a change-control entry, not a quiet rename.
4. **The explorer is the review surface.** Every library change is reviewed by loading [library.html](../../assess/library.html), where the graph and the raw JSON render side by side and the changed node can be clicked and read.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
