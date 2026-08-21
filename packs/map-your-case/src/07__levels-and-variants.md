# 07 — Levels And Variants

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The explanation programme, operationalised from the v0.33.61 levels-and-variants brief: a grid rather than a ladder, five scenarios ordered by grant size, the three sets, and the stopping rule that answers the depth question. This document is where the brief's corrections become this tool's design.

---

## The two axes, separated before anything else

The source memo wanted three to seven scenarios "like levels of a game", varied and tested and fed back on. The brief's first correction is the one everything downstream depends on:

| | What it varies | Held constant | Question it answers |
|---|---|---|---|
| **Level** | Depth of detail | The reader | How much does this person need? |
| **Variant** | Wording, ordering, emphasis, visual form | **The facts, by rule** | Which rendering is understood? |

They are orthogonal, so the design is a **grid**: five levels by three variants is fifteen renderings, and that is fine because they are generated rather than written. The reason to keep them separate is diagnostic: a conflated programme cannot tell whether a poor result came from the wrong depth or the wrong wording — which are **opposite fixes**. A round that changes both learns nothing.

## The variant rule, and why this tool can enforce it mechanically

The governing rule was written on 9 August, eleven days before the memo that needed it:

> **A persona may change emphasis, ordering, vocabulary and format, and may never change what is being accepted.**

Here it stops being guidance and becomes a check, because the library gives facts identity (document 02): every variant of a level renders the same underlying fact set, so **a diff of the fact sets across variants must be empty**. A variant that introduces or drops a fact is not a variant — it is a different assessment — and the difference is detectable without anybody's judgement. The check needs no instrumentation beyond the library itself, which is one more reason the choices-not-answers rule earns its keep.

Two naming decisions travel with the rule, both taken to protect machinery this programme reuses:

| Word | Reserved for | This programme says |
|---|---|---|
| **altitude** | Stakeholder level in a risk chain (each altitude has its own language and acceptor) | **level** or **depth** |
| **persona** | The generator that compiles a view for a named audience, with a source map | **scenario** or **archetype** |

Stakeholder and depth are two axes too: a board member investigating an incident wants *high* detail in *board* language. Collapsing the words makes that case impossible to say.

## Levels are not expertise tiers

The memo's most honest sentence undermines its own ladder: even its author does not always hold the full picture of what an agent can do. **Expertise predicts vocabulary. It does not predict whether somebody knows their own grant.** And the direction is inverted:

| | Non-technical user | Advanced user |
|---|---|---|
| Size of the grant | Small — one hosted assistant | **Large** — several agents, tokens, local execution, permission-skipping flags |
| Prior confidence they understand it | Low | **High** |
| Likely response to being told they are exposed | Curiosity | **Reactance** |

The advanced user holds the biggest gap and the strongest prior that there is nothing to learn — the combination the fear-appeal research makes most likely to produce denial. So the design rule is concrete:

> **Everybody starts at level one.** What changes with audience is the language, not the entry point.

The level-one landing (document 06) is therefore one screen for everyone — and it is the hardest thing in this programme to write, which is why the change-control register carries *who authors level one* as an open item rather than pretending it is a formatting task.

## The five scenarios, ordered by grant

Ordering by grant size rather than job title makes the personas fall out instead of needing to be invented — and resolves the memo's own hesitation about whether these are personas or use cases: they are positions on one axis, each a level in its own right and a scenario in its own right.

| # | Scenario | Mandate | Grant | Why it sits here |
|---|---|---|---|---|
| 1 | **Dictation** — a hosted assistant turning voice notes into documents | Produce a document | The surface's whole capability set: search, memory, file handling | Smallest gap, most relatable |
| 2 | **Document work** — an assistant connected to mail or a drive | Summarise last week from one team | The entire mailbox or drive, including everything anybody ever shared | First time the grant contains **other people's material** |
| 3 | **Vibe coding** — a desktop or web coding tool on a personal project | Build the feature | The user account on that machine | First time the grant includes **execution** |
| 4 | **Professional development** — a CLI agent with a code-host token | Commit to one branch this afternoon | Every repository the person can reach, plus the machine, plus whatever permission-skipping flags are set | The largest grant most people actually hold |
| 5 | **Operations** — an agent with production access | Correct three rows | The estate | Where the gap stops being personal |

In this tool, scenarios land as **library examples** (document 02): each is a complete state — products, facts, controls, intent — so loading one is loading a level, and the fifteen-cell grid is fifteen renderings of four state objects plus one. v2's four examples are the seed; v3 replaces them with these five.

## The three sets, and the concession that buys the reader

The worked instance is the session that wrote the brief, measured rather than assumed: its stated mandate was *produce a memo*; the capabilities beyond that — search, shell execution, workspace writes, cloning a repository, reading its own transcript directory — were **exercised, repeatedly, and improved the output**. Three of its held capabilities (signing identity, passwordless escalation, other accounts on the machine) were never touched.

So the honest rendering is three sets, not two:

| Set | What the reader thinks |
|---|---|
| Mandated | Obviously fine |
| **Exercised beyond the mandate** | **I needed that. Now we are having an honest conversation** |
| **Held and never exercised** | **Why does it have that?** |

> **The gap is not only where the danger is. It is also where the value came from.** That is precisely why nobody closes it — and a scenario that pretends otherwise will be dismissed by the only people who could act on it.

The third row is the product: measurable, undeniable, and it costs the reader nothing to agree with. It is also the set that shrinks without anybody losing anything — which makes it the one actionable output this programme has for the advanced user specifically.

**The gate:** the exercised set is derivable — a session transcript is an ordinary file on disk — but importing it into the page reopens the storage rule, because a transcript carries every secret the session saw. The decision (import mechanism, or a paste-nothing checklist the visitor walks themselves) is open: change control, MC-D7. Until it is taken, the three-sets dashboard renders the third set from **intent minus exercised-as-claimed**, i.e. the visitor ticks what they remember using — weaker, and honest about being weaker.

## What the experiment will and will not detect

Two warnings inherited with the programme, both from work already done in this corpus:

- **The visual washes out framing effects.** Presenting a visual alongside text eliminated a framing effect that was significant in text alone — and this tool's output culminates in a rendered tree. So wording variants tested around the picture may show nothing, and the correct conclusion would be that the picture is doing the work. **Test the visual variants first**; that is where the effect lives.
- **The sample supports qualitative work only.** Fifteen cells against a few dozen readers is not an A/B programme. Run it as qualitative research: watch somebody use it, ask them to say back what it told them, count nothing. Reporting false precision would be the expensive failure, because it would be used to pick a design.

And the split with [document 08](08__synthetic-readers.md) is exact: **synthetic readers clear the levels** (completeness defects — a term before its definition, a dead end, a purpose that is not apparent), **humans judge the variants** (preferences — which clear rendering lands). That is also the cheap order: defects are removed for free before any human time is spent.

## The stopping rule answers the depth question

The memo asked what the right altitude is for explaining the gap. There is not one, and looking for it is the wrong shape. The testable property instead:

> **Each level must be a complete answer, not a step towards one.** A reader who stops at any level has gained something whole.

Checkable without instrumentation: show somebody only level three and ask what they would do about it. If the answer is *keep reading*, level three failed — not because it was too shallow, but because it was written as scaffolding rather than as an answer. This removes audience-routing entirely: a reader finds their own depth when every stop is a landing rather than a stair, and the programme's job is to make each landing complete.

## What lands where

| From the brief | In this pack |
|---|---|
| The grid, the variant rule, the diff check | This document; the check leans on document 02's fact identity |
| Five grant-ordered scenarios | Library examples (02), the picker's world (06), v3 build order (11) |
| Everybody starts at level one | The level-one landing (06); open: who authors it (99) |
| The three sets | The v3 dashboard (06); the import gate (99, MC-D7) |
| Visual-first testing, qualitative-only | The programme rules here; run order in 11 |
| Shareable without disclosure | Document 09 — the fragment carries the selection |
| Reserved words | Change control, decided (99) |

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
