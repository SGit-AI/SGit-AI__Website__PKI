# The Insurance Ecosystem Pack: A Session Is Told The Rules, Handed A Policy, Measured Against It, And Refused By Something That Is Not Itself

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 3 September 2026
**from** The site agent
**to** Project lead, the RiskMandate team, Architecture, and the next session that builds this

**type** Briefing pack, leading brief

*Read this first. This pack is the site agent's answer to the fourth brief of 26 August (v0.33.62, the specification for this pack) under the economics settled the same day (v0.33.62, the architecture brief), and under one instruction the project lead gave on 3 September that simplifies every party in it. It was written after the inventory the specification demands, and the inventory changed the design in three places, each named below. It proposes; it does not decide. Where a question in the specification is answered here, the answer is a decision in [change control](99__change-control.md) with the evidence that produced it, so it can be reversed by one line rather than argued about in prose.*

---

## What this pack is for

An end-to-end ecosystem on vaults where **a new agent session is told the rules of the game, is handed its own policy, is measured against it while it works, and is refused by something that is not itself when it exceeds cover** — with the whole flow visible in a room somebody can watch.

The specification's own test decides whether the pack is finished:

> A session that has read only the pack creates the vaults, wires the hooks, authors one policy, runs one working day, and produces a room showing a refusal, a recorded draw and a waiting request. **Nobody is asked a question at any point.** If an implementing session has to ask something, the answer belongs in the pack.

So every document here is written for that session, in its order of need. [Document 08](08__build-order.md) is the sequence; the acceptance test for each step is stated beside it; and [document 09](09__first-increment.md) records the one step that is already built and run, with its output, so the reader can see what a refusal looks like before building anything.

## The instruction that simplifies the parties

On 3 September the project lead relaxed the party model for the pilot, and the relaxation governs every document here:

> *"The logic here is to define multiple agents with multiple roles, but for now, to start with, we can allow a session — like a Claude session that is operationalising this — to actually run things and make changes in any of the vaults. Because what we are trying to do, we're trying to figure out the workflow. We're not worried about corruption or integrity … as long as you've got the vault key, you will be able to make changes or implement changes or process things. For example, one agent says, I need to draw on this policy, I need to request. That same session can go and then execute whatever workflow we have assigned … including where you run out and you're not insured any more and all those workflows. And also remember that sgit is an append-only solution … it's going to be easy to detect when something gets overwritten. So let's not worry about it for now."*

Three consequences, applied throughout:

| The specification says | The pilot does | Where the difference is recorded |
|---|---|---|
| Parties are prevented from doing things **by key topology** | Every role is a **runbook**, and one session holding the vault key may run any of them, in any vault | [Document 05](05__parties.md) — the topology is still designed, and marked *deferred, not dropped* |
| The ledger is an **append lane** so the writer cannot purge | The ledger is a **folder of files that are only ever added**, in a vault whose history makes an overwrite visible | [Document 02](02__vault-topology.md) — the lane is build-order step 7, and the folder is shaped so the lane replaces it without a schema change |
| Refusal comes from outside the agent's loop | Refusal comes from a **git hook**, which is outside the agent's turn and inside the grant it bounds: a *setting*, and it says so | [Document 04](04__decision-points.md), [document 09](09__first-increment.md) |

**What the relaxation does not relax.** The workflows must still be *complete* — a session that runs out of cover must be told, must stop that class of action, must be able to request, and must be able to see the answer. Integrity is deferred; **the shape of every document is the shape the lane and the key split will need**, so that turning the pilot into the real thing is a change of *where* things run, not *what* they say.

## The inventory, and what it changed

The specification's first rule: *the pack cannot be written honestly until somebody establishes what already exists.* Nine items were named. All nine were checked, on 3 September, from this session — the codebase, the sibling sites, the shipped CLI, the published schema, and the founder corpus. The full table with evidence is [document 10](10__the-eleven-answers.md); the three findings that changed the design are here.

**There is no board application, and the messaging vault is a transport, not a product.** Across four sites and the tools repository the closest things to a board are `_page.json` hub pages and the `sg-vault-*` components (viewer, tree, commit log); the closest thing to messaging is `sg-chat-thread`, a platform-neutral bubble component built for a WhatsApp desk. The *messaging vault* the memo names is the **append lane** — six endpoints, shipped and code-verified, with a published composition ("Sending messages between vaults") whose client-side derivation is still marked PROPOSED. So **the room is a vault app**, in the pattern this estate has already shipped twice (an `index.html` over a `content.json`, reading through `sg.vfs`), and it reuses nothing else because there is nothing else to reuse. What is genuinely new is small: five cards and one briefing text.

**The lifecycle has thirty-three events, and the one that matters is not a Claude Code event.** The published settings schema and the hooks reference give thirty-three hook events, five of which can block, one of them `PreToolUse`. But the documentation also says that **a `PreToolUse` hook that times out does not block the tool** — the platform fails open. Which means a Claude-side hook cannot be the enforcement point for a draw, whatever its type: *the git hooks are.* `pre-commit` and `pre-push` run outside the agent's turn, refuse by exit code, and can be written to fail **closed** when the balance is unknowable. The Claude hooks carry the briefing and the usage report, and are instrumentation.

**The June pack is eighteen documents, and only one collides.** All eighteen were read (they are under `briefs/06/18/agentic-permissions/` in the App Send repository). Seventeen are strategy — the blast-radius thesis, the permissions bill of materials, skills-as-code, the terms-and-conditions framing, the rising tide, the commercial model — and none of them names a schema this pack could duplicate. The eighteenth is the naming brief, and it recommends **Agent Mandate** for *the union of everything an agent can do*. The August vocabulary names that the **grant** and reserves **mandate** for the narrow thing. **Question nine is settled here as the specification recommends: August governs**, `mandate` is the narrow thing in the schema that ships, and June's *Authority Envelope* survives as a prose synonym for the grant's outer boundary and never as a field ([IE-D9](99__change-control.md)).

## The four findings, inherited — and one re-measured

The specification says to take four things as given. They are, with one addition each from this estate's own check:

| Inherited | Re-checked here |
|---|---|
| **The ledger is an append lane, not a shared vault**, because a write key grants purge and an append token grants write and a blind acknowledgement | The six endpoints, the four capability tiers, the limits (5 MB, 1,000 pending per token, 100 per batch, 3 MB inline, page 50/200) and the blind `{"ok": true}` are all on the published reference. **The one thing the reference does not say** — whether a lane with no registered anchors accepts any token holder — is still unsaid; the 19 August brief says anchors *decide which senders a lane accepts*, so the pack assumes **no anchors, no writers**, and registers one anchor per session ([IE-D6](99__change-control.md)) |
| **Hook types include `http`**, which moves the decision off the machine | Confirmed in the schema: `command`, `prompt`, `agent`, `http`, `mcp_tool`. And **the platform fails open on timeout** for `PreToolUse`, so `http` moves the *decision* off the machine but not the *refusal* — that stays in the git hook, which is why [document 04](04__decision-points.md) puts the service behind the hook rather than behind Claude |
| **Token usage has four counters and the obvious one is wrong** | Measured again, on this session's own transcript: `input_tokens` **68,356**; `cache_creation_input_tokens` 33,101,651; `cache_read_input_tokens` **721,095,334**; `output_tokens` 2,987,014. A session that moved **757 million** tokens, and the obvious counter says sixty-eight thousand. The counters are in every assistant line of the transcript JSONL under `message.usage`, which is undocumented and was verified by reading 1,850 of them. `tools/usage.py` sums them |
| **June and August use *mandate* for opposite things** | The naming brief was read in full. August governs; see above |

## The economics, not reopened

The architecture brief of 26 August settled the economics and this pack implements them without restating them. What each document takes from it:

- The premium is paid **in allocation** from a finite pool, and the scarcity is the feature → the policy object carries the allocation, and the room shows what is left rather than hiding it ([03](03__the-policy-object.md), [07](07__interface.md)).
- Pooling is the mechanism and **correlation** is what breaks it → the room's fourth card is correlation, computed from week one, and the policy object carries a **reserve** no automatic draw can touch ([03](03__the-policy-object.md), [07](07__interface.md)).
- Experience rating lands on the **team** because the agent is indifferent → every draw names the **policyholder** as acceptor, never the session ([05](05__parties.md), [06](06__workflows.md)).
- A draw is a **recorded** acceptance event by default and a **requested** one above a threshold; silent overflow is forbidden → `draw_mode` in the policy, and the requested-draw workflow ([03](03__the-policy-object.md), [06](06__workflows.md)).
- The metric to surface is **draw frequency**, not balance → the third card ([07](07__interface.md)).
- Three zones, and **outside cover is uninsured, not over-insured**, so it escalates → the exhaustion workflow writes an escalation, not only a refusal ([06](06__workflows.md)).
- **Recoverability decides insurability** → bytes into history get an *exclusion* (a hard cap), never a pool ([03](03__the-policy-object.md)).
- A policy may only be written in **units the system already counts** → every unit in [03](03__the-policy-object.md) names its meter, and a unit without one is refused by the schema.
- The ledger is **generic on unit type** → one event shape, `unit` a string, tokens carried as four sub-amounts.
- A vulnerability is a **repricing event** with three responses → the seventh workflow ([06](06__workflows.md)).

## What is already built

Not nothing. This estate has, before this pack:

| Exists | Where | This pack |
|---|---|---|
| A push policy with a checker, a ledger and a skill — the first MVP | `insurance/push-policy/` (v0.1.65) | Generalised: the same verdict for any unit, at commit and at push, from one policy object |
| A signed mandate compiled into a `pre-push` hook that refuses a branch | `packs/grant-and-mandate/` document 07 | Reused as the branch constraint, unchanged |
| A vault app that renders a catalogue from `content.json` through the bridge | This session's video vault, and the `vault-html-app` skill | The room is the same shape |
| The doctrine that a draw is a claim, paid in the resource, settled by the check | `insurance/src/12` | The verdict function |
| A change-control discipline with 103 numbered decisions | `packs/grant-and-mandate/src/99` | This pack's register is `IE-`, and cross-references `GM-D` |

And **build-order step 1 is done**: three git policies compiled to two hooks, and the three acceptance tests the specification names were run on 3 September — a 400 KB commit refused by git, the eleventh commit of the day recording a draw, and a push outside the mandate refused. [Document 09](09__first-increment.md) has the output.

## Reading order

1. [01 — The lexicon](01__concepts.md): the terms, defined by their edges, with question nine settled
2. [02 — Vault topology](02__vault-topology.md): three vaults, who holds which key, the pilot relaxation, the lane as the end state
3. [03 — The policy object](03__the-policy-object.md): the schema, the ledger event, the request and the decision, and two worked policies
4. [04 — Decision points](04__decision-points.md): thirty-three events, which are hooked, which one refuses
5. [05 — Parties](05__parties.md): six roles as runbooks, and what the key topology will prevent once it is turned on
6. [06 — Workflows](06__workflows.md): the seven, as commands
7. [07 — The interface](07__interface.md): the room, five cards, and the briefing
8. [08 — Build order](08__build-order.md): eight steps, an acceptance test each
9. [09 — The first increment](09__first-increment.md): built and run
10. [10 — The eleven answers](10__the-eleven-answers.md): the specification's questions, answered with evidence
11. [99 — Change control](99__change-control.md): read second if building, last if reading through

## What this pack does not try to be

- **Not regulated insurance.** There is no external insurer; the currency is internal; no payment rail exists or is designed.
- **Not automatic repricing.** A repricing event produces a superseding policy that somebody accepts; nothing reprices itself.
- **Not hosted agents.** Every enforcement point is a hook in an environment somebody controls.
- **Not bandwidth.** Counts, bytes and destinations; egress is not measurable here today.
- **Not per-subagent accounting.** The transcript carries `agent_id` on subagent lines, which is promising and unverified; no policy depends on it.
- **Not a rate table.** Units are settled; prices are a judgement the issuer has not made, and the policy object carries the field empty with an owner.

## Honest tensions

| Tension | Note |
|---|---|
| One session, every role | It is what the project lead asked for, it makes the workflows testable this week, and it makes every acceptance event in the pilot self-accepted — which is the one thing the economics say a draw must not be. The acceptor is still *named* as the policyholder, so the record is right even when the hand is the same |
| A folder standing in for a lane | The folder is append-only by convention and the vault's history detects a rewrite after the fact; the lane prevents it. The schema is identical, so the swap is a location change |
| The git hook as the enforcement point | It refuses outside the agent's turn and it is inside the grant; `--no-verify` still gets past it. A setting, and it says so on its face, like the two before it |
| Numbers from a memo | The bands are the project lead's placeholders from memo 12; the ledger this pack creates is what re-fits them |
| Measuring tokens from a transcript | Real, firsthand, undocumented, one vendor, one surface |

---

*CC BY 4.0.*
