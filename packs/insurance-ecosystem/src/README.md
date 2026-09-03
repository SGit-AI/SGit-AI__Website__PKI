# Insurance Ecosystem — pack README

**Status:** a site-agent first pass at the pack the fourth brief of 26 August (v0.33.62) specifies, written after the nine-item inventory that brief demands, under the economics the third brief of the same day settles, and under the project lead's instruction of 3 September that for the pilot **one session holding the vault key may run any role in any vault**. Eleven documents plus change control; a policy object with five units; an evaluator, two git hooks, a usage meter and a room builder in `tools/`; and — as of 3 September — **build-order step 1 built and its three acceptance tests run**: a 400 KB commit refused by git, the eleventh commit of the day recorded as a draw, a push outside the mandate refused. Corpus version assigned on adoption.
**Date:** 3 September 2026

An end-to-end ecosystem on vaults where **a new agent session is told the rules of the game, is handed its own policy, is measured against it while it works, and is refused by something that is not itself when it exceeds cover**, with the whole flow visible in a room somebody can watch. Three vaults (policies, ledger, room), a **policy object** generic on unit, a **ledger** of events that are only ever added, **git hooks** as the enforcement point, Claude hooks as instrumentation, and a **room** of five cards.

Three things a reader must not re-derive: **refusal comes from outside the agent's reasoning loop** — here a git hook, which is also why it is a *setting* and says so; **the balance is never derived inside the insured** — the briefing and the verdict are how it learns what it has; and **silence below cover is a requirement** — a system that comments on ordinary work is turned off within a week. Two findings the inventory produced that changed the design: **there is no board application** (the room is a vault app), and **the platform fails open on `PreToolUse` timeout** (so the git hooks refuse and the Claude hooks do not).

## Reading order

1. `00__LEADING-BRIEF.md` — what this is, the project lead's relaxation, what the inventory changed, the four findings re-checked, the economics not reopened
2. `01__concepts.md` — the lexicon, and question nine settled: `mandate` is the narrow thing, August governs
3. `02__vault-topology.md` — three vaults, which key does what, the pilot's one key set, the lane as the end state
4. `03__the-policy-object.md` — `policy/v1`, `event/v1`, `request/v1`, `decision/v1`, the derived balance, and two worked policies
5. `04__decision-points.md` — thirty-three events, four hooked, two that refuse
6. `05__parties.md` — six roles as runbooks, and what the keys will prevent
7. `06__workflows.md` — seven workflows as commands, including running out
8. `07__interface.md` — the room's five cards and the briefing, verbatim
9. `08__build-order.md` — eight steps, an acceptance test each
10. `09__first-increment.md` — **step 1 built and run**, with git's own output
11. `10__the-eleven-answers.md` — the inventory and the eleven questions, each with its evidence
12. `99__change-control.md` — every decision (`IE-D`) and correction (`IE-C`); read it second if building, last if reading through

## What is in `tools/`, `hooks/`, `policies/`, `ledger/`, `room/`

| Path | Is |
|---|---|
| `tools/policy.py` | The evaluator: `check` (at `pre-commit` or `pre-push`), `briefing`, `request`, `decide`, `supersede`, `derive`, `validate`, `hook-pre-tool-use` |
| `tools/usage.py` | The token meter: four counters summed from a transcript, appended as a `tokens` event |
| `tools/room.py` | The maintainer's derivation: ledger + policies → `room/content.json`, inlined into `room/index.html` |
| `hooks/pre-commit`, `hooks/pre-push` | The enforcement points; install with `cp hooks/* .githooks/ && git config core.hooksPath .githooks` |
| `policies/<subject>/` | The git pilot policy (in force) and the measured token policy (unbanded); `current.json` pointers |
| `ledger/events/`, `requests/`, `decisions/` | The pilot's ledger, in the repository until the ledger vault exists; files are only ever added |
| `room/index.html`, `app.json`, `content.json` | The room, as a vault app that also renders here |

## The pack's acceptance test

> A session that has read only the pack creates the vaults, wires the hooks, authors one policy, runs one working day, and produces a room showing a refusal, a recorded draw and a waiting request. Nobody is asked a question at any point.

If you had to ask, file the question and the answer you took as an `IE-C` in change control. That is the amendment.

All content CC BY 4.0.
