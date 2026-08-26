# Six Screens, And The Fourth Is The One That Will Be Got Wrong

**pack** Grant and Mandate · draft-1 · 26 August 2026
**role** The screens the interface must cover, written as intended output. Six of them; the fourth is the trap. These are specifications for mockups, not the mockups — the design capability produces those, and screen four's rule must survive the handoff intact.

---

## The six screens

| # | Screen | Must show |
|---|---|---|
| 1 | **Choose the environment** | Library entries, each with its **measurement date**. Not a risk question. This is *reality first*, enforced by being screen one |
| 2 | **The grant** | The measured tree; each node's **tier** and **provenance**; the **history field prominent**, because it changes the meaning of every node |
| 3 | **The self-report comparison** | Three terms, two deltas, and the count: *this agent reported N of M capabilities its environment is known to have* |
| 4 | **Declare the mandate** | **Prohibitions — because that is what a person can accept.** The allow-list is stored and **not shown here** |
| 5 | **The delta** | Excess and shortfall **side by side**, as the product |
| 6 | **The pack** | What is in it, what it discloses, and that it is **references rather than a description** |

## Screen 1 — reality first, by construction

The first thing a person sees is a list of environments and their measurement dates, and the act is *pick which one you are in*. It is not a risk register and not a risk-appetite questionnaire. Putting a risk on screen one would reproduce the exact habit the pack exists to fix, so the ordering rule is enforced by the layout: you cannot reach a risk without passing through a fact, and the fact is on screen two.

## Screen 2 — the grant, with history prominent

The measured tree, rendered in the graphs-site grammar: nodes connected by edges with distinct inverses, each node carrying its tier badge (`boundary` / `setting` / `expectation` / `none` / `unknown`) and its provenance (`read` / `observed` / `documented` / `inferred` / `none`). The **history field is not a footnote** — a banner, because *memory on* turns the whole tree into a union over prior sessions, and a reader who misses it misreads every node below it. An `unknown` node renders as `unknown`, never as absence — the gaps are part of the map.

## Screen 3 — the most persuasive screen in the flow

Three columns — **library**, **self-report**, **mandate** — and two deltas drawn between them. The headline is the blind-spot count: *reported 11 of 19*. It is the argument for the library made visible, and it measures the agent as much as the environment, which is exactly why it is persuasive and exactly why it will be read as a vendor comparison. Render it honestly: it is *how much of its own grant this agent found*, against a common reference, not a league table.

## Screen 4 — the trap

**Show the person prohibitions. Store the allow-list. Never show the allow-list here.**

An allow-list presented for approval produces consent without comprehension — a person clicks *approve* on a list they did not read and a signature is manufactured that says somebody considered it. Prohibitions are what a person can actually accept or refuse:

```
   STORED (enforceable)          SHOWN (what a person accepts)
   allow:                        "This agent will NOT:
     repo.contents.push            · push to any branch outside agent/*
       branches: agent/*           · act outside this repository
   ...                             · reach any other machine"
                                  Generated 26 Aug 2026 over capability set v0
```

The prohibitions carry the **date and capability-set version** they were generated from, because the moment the capability set grows, the rendering is stale — and a regenerated view must not retroactively change what a person agreed to. What was accepted was a *rendering*; the acceptance record names which one.

## Screen 5 — the product

Excess and shortfall side by side, because they have different audiences and different remedies. Excess is the security finding: capabilities the environment has that the mandate did not ask for, each with its tier (an excess capability behind a `boundary` is a different finding from one behind `nothing`). Shortfall is the operations finding: things the mandate asked for that the grant cannot do — the row that, ignored, produces the next over-broad credential. Neither is a score. The delta is computed live from the two documents, so this screen is always current.

## Screen 6 — the sendable object

What the pack contains (references, a mandate, the computed deltas), what it discloses (which products, not which machine), and an explicit statement that it is **references rather than a description of your estate**. This is the screen that makes the shareability property legible: a person should be able to see, before they send it, that the pack says *I use these products under this mandate* and says nothing about their files, their credentials, or their history.

## What the mockups must not do

- **No score out of a hundred.** The gap is a picture and a count of what each action closes; a single number averages tiers that must stay distinct (registry pack C22).
- **No risk on screen one**, and ideally no risk in this flow at all — risks are the risk product's, downstream of the pack.
- **No allow-list on screen four.** The single most important rule in the set.
- **No `unknown` rendered as blank.** An unmeasured node is a fact about the floor, not an omission.

## Honest tensions

| Tension | Note |
|---|---|
| The blind-spot count | The most persuasive number in the flow, and it reads as a vendor comparison whether or not it is framed as one |
| Prohibitions generated from allow | Legible and safe, and it means the person accepts a *view*, so the acceptance record must name the version shown |
| A prettier mockup is more persuasive | Rendering an unbuilt flow in real tokens makes it look shipped; the mockups must carry a *not built* marker, which is a mitigation, not a fix |
| History as a banner | It is the clearest lay example in the product and it makes every library entry incomplete for a real user by construction |

---

*CC BY 4.0.*
