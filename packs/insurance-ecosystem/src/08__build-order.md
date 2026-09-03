# Build Order: Eight Steps By Dependency, An Acceptance Test Each, And The One That Is Already Done

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** The sequence a session that has read only this pack follows. Each step names what it depends on, what it produces, and a test that can fail. Step 1 is built and its tests were run ([document 09](09__first-increment.md)); steps 2 to 8 are the pack's acceptance test.

---

## The order

| Step | Builds | Depends on | Acceptance test |
|---|---|---|---|
| **1** | **Three git policies compiled to two hooks**: `bytes_per_commit` and `commits` to `pre-commit`; `branch`, `bytes_per_push` and `pushes` to `pre-push`. One evaluator, one policy file, a ledger folder in the repository | Nothing. No vault | A 400 KB commit is refused by git, not by the agent. The eleventh commit of the day is told a draw was recorded. A push outside the mandate is refused. **Run 3 September; output in document 09** |
| 2 | **The policies vault**: `sgit init` in `insurance-policies/`, the git pilot policy and the measured token policy in `<subject>/`, `current.json` pointers, pushed | Step 1's policy file | A fresh clone of the vault by read key yields a policy whose sha256 matches the one in the room footer; `policy.py --policies <clone>` gives the same verdict as the repository copy |
| 3 | **The ledger vault**: `sgit init` in `insurance-ledger/`, `events/`, `requests/`, `decisions/` folders, the repository-stage ledger copied in as the first day, pushed | Step 2 | `sgit history log --file events/<any>` shows exactly one commit per file. A second commit touching an existing event file is visible as two |
| 4 | **The room vault and app**: `sgit init` in `insurance-room/`, `index.html` + `app.json` + `content.json` from `room.py`, pushed; the **read key** shared | Steps 2, 3 | Opening the read link shows five cards; the footer's ledger commit matches the ledger vault's HEAD; a session below cover all day appears as a count and nothing else |
| 5 | **The Claude hooks**: `.claude/settings.json` with `SessionStart` (briefing), `PreToolUse` on `git commit`/`git push` (advisory verdict), `Stop` (usage flush) | Step 1 | A new session sees the briefing before its first prompt is answered; `git commit` of 250 KB through Bash returns the REQUESTED reason from the platform, not from stderr; after a turn, a `tokens` event with four counters exists |
| 6 | **The working day**: W1–W6 run by one session reading only this pack | Steps 1–5 | The room shows a refusal, a recorded draw and a waiting request; nobody was asked a question; every question the session *wanted* to ask is filed as a pack amendment |
| 7 | **The lane**: `configure` the ledger vault's lane with one anchor per session; sessions write events with `append` instead of files; the maintainer drains | Step 3, and the anchors question answered | An event written through the lane appears in `events/` after a drain with the lane's file id recorded; a session's token cannot list; the 1,001st pending write is refused with 507 and the drain clears it |
| 8 | **The key split**: separate vault keys for policies, ledger and room; the enumeration key to the maintainer; the pilot relaxation lifted | Step 7 | The insured, holding only an append token, cannot read the ledger or change a policy — tested by trying, and recording the error |

Steps 2–4 are a morning. Step 5 is an hour. Step 6 is the day. Steps 7 and 8 are the pilot becoming the design, and they wait on the anchors answer (step 7) and a session-independent identity for the maintainer (step 8), both recorded as open.

## The rule for every step

**Write the acceptance test before the step, run it after, record the output in document 09 with the commit it ran at**, and if it passed for the wrong reason (the sibling pack's *setting that reads like a boundary* was found exactly this way) say so. A step whose test cannot fail is not a step.

## The pack's own acceptance test

> A session that has read only the pack creates the vaults, wires the hooks, authors one policy, runs one working day, and produces a room showing a refusal, a recorded draw and a waiting request. Nobody is asked a question at any point.

Every question the implementing session has to ask is a gap in the pack. The session files it as an **IE-C** correction in [change control](99__change-control.md) with the answer it took, and the pack is amended rather than the question answered in chat.

## What the build order excludes

Carried from the specification, with the reason each stays excluded after the inventory:

| Excluded | Still excluded because |
|---|---|
| Real money | The currency is internal; the units are bytes, commits, tokens. No rail exists in this estate and none is designed |
| Automatic repricing | W7 ends in a person's acceptance; the drift feed produces the *trigger*, not the decision |
| Hosted agents | Every enforcement point here is a git hook in a clone somebody controls |
| Bandwidth | No meter. The transcript counts tokens and git counts bytes; nothing here counts egress |
| Per-subagent accounting | The transcript carries `agent_id` on subagent lines — promising, unverified, and no policy depends on it |
| A published rate table | Units settled, prices a judgement; the policy carries the field with an owner and `published: false` |

## What this does not prove

- **That the order is right past step 6.** Steps 7 and 8 depend on two unanswered questions; their order could invert if the identity question is answered first.
- **That a session can do steps 2–6 in a day.** Estimated, not measured — and the pack's own acceptance test is the measurement.

---

*CC BY 4.0.*
