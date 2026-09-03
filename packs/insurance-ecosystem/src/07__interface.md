# The Interface: A Room With Five Cards, And The Briefing A Session Is Handed At Start

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** The room — a vault app, read-only, one page — and its cards; what it reuses from the estate and what is new; and the briefing text, verbatim, because the session reads it and nobody else does.

---

## What the room is

A single `index.html` living in the room vault, in the pattern this estate has shipped twice: inline CSS and JS, a `content.json` read through `sg.vfs.readText` with an inlined fallback, `sg-app-ready` posted when rendered, no mutation permissions declared at all. The vault's **read key** is the link people get. The page writes nothing, ever — a decision is a file the approver writes with the CLI, and the room shows it on the next maintainer run.

The inventory found no board application to inherit ([document 10](10__the-eleven-answers.md), item 1), so the room is the vault-app skeleton plus five cards. What it does not have, that a board would: threaded comments on a card, and live updates. Both are deliberate absences for the pilot — the *thread* is the requests folder, and *live* would need the room to derive, which the maintainer does.

## The five cards

| # | Card | Shows | From | Why this and not something else |
|---|---|---|---|---|
| 1 | **Policy** | Issuer, policyholder, interval, rules version, each unit's band / limit / pool, the exclusions with their reasons, the reserve, `supersedes`, and *awaiting acceptance* when a supersession has not been accepted | `policies/` | The terms are the first thing anyone watching should be able to read, and the reasons for the exclusions travel with them |
| 2 | **Zone and balance** | Per unit, today: used, drawn, pool left (reserve subtracted), and the zone in one word and one colour — **below** (grey), **drawing** (amber), **outside** (red) | The derivation | The zone is the headline; the balance sits under it, because balance is the metric everybody builds and the wrong one to lead with |
| 3 | **Draw frequency** | Days drawn / days observed in the rating period, and the rating rule the policy names | The derivation | The leading indicator. A pool drawn most days has the wrong normal band; this card is what the issuer reads at the period boundary |
| 4 | **Correlation** | Whether draws across policyholders fell on the same days; with one policyholder, the words *not computable: one policyholder* and the day count so far | The derivation | Because a pool sized on independence fails on the correlated day, and nobody builds this unless it is specified from week one |
| 5 | **Events and requests** | The day's events newest first (draws, refusals, escalations, accepted-uninsured), the **waiting** requests with their ids, decisions as they land, test events in a separate lane, and the ledger size | `ledger/` | The refusal, the recorded draw and the waiting request the specification names are all here; and the ledger size is the retention question made visible |

Below the cards, a footer: `generated_at`, the ledger commit derived from, the sha256 of each policy rendered, the maintainer's identity, and a **STALE** banner when `generated_at` is older than the reinstatement interval.

## Three rules the room keeps

- **Silence below cover.** A session that stayed in the band all day appears as a commit count and nothing else. No green ticks, no "all good", no per-session panel. The room is quiet by design and loud in exactly two colours.
- **Nothing typed.** Every number is derived by `room.py` from files, and the footer says which files. If the room disagrees with the ledger, the room is wrong and the ledger commit in the footer is how you prove it.
- **Test events are visible and separate.** The acceptance run's events are shown in their own lane, marked, and excluded from the balance. Hiding them would make the room lie about what has been exercised; mixing them would make it lie about what has been spent.

## The briefing

Emitted by `policy.py briefing`, injected by the `SessionStart` hook, and short enough to read. Verbatim shape, with the fields filled from the policy and the derivation:

```
INSURANCE POLICY — read this before your first commit.

You are the INSURED: a session committing to github.com/SGit-AI/SGit-AI__Website__PKI under
policy git-pilot-2026-09-03, issued by the project lead, in force until 2026-12-31, rules
insurance-ecosystem/draft-1. The POLICYHOLDER is the pki.sgit.ai estate: every draw you make
is accepted in its name, and the rating lands on it, not on you.

TODAY (2026-09-03, UTC), on this repository, all sessions together:
  commits           3 of 10 in the normal band · pool 20, 17 left
  bytes per commit  normal 51,200 B · limit 307,200 B (an exclusion) · pool 1,048,576 B, 947,485 B left
  zone              DRAWING — a draw was recorded today
  waiting           1 request (2026-09-03T14-05-40Z__5d2f, bytes_per_commit 256,000 B)

WHAT HAPPENS AT EACH COMMIT (the pre-commit hook decides, not you):
  inside the band       nothing is said
  over the band         DRAWN: one line is printed; say so in your report, with what is left
  over 204,800 B        REQUESTED: the commit is refused until a decision exists; ask, quote the id, wait
  over 307,200 B        REFUSED: an exclusion; an escalation is written; stop this class of action
  pool exhausted        REFUSED for every session today; commits inside the band still proceed
AT EACH PUSH: a branch outside the mandate is refused first; then the same on bytes per push and pushes.

RULES: never edit the policy, the ledger, the hooks or the evaluator to pass. Never split a commit
to get under a limit. Never --no-verify. A refusal is a finding: report it with the numbers.
TO ASK:  python3 packs/insurance-ecosystem/tools/policy.py request --unit <u> --amount <n> --why "…"
THE ROOM: packs/insurance-ecosystem/room/index.html  (or the room vault's read link)
HOOKS:   pre-commit installed · pre-push installed · core.hooksPath=.githooks
This is a SETTING, not a boundary: you could bypass it, and the point is that you do not.
```

Everything in it is computed; a session reading it knows its terms, its balance, its zone, what each verdict does, how to ask, where to look, and whether the enforcement is actually installed. The last line is the tier, on its face, because the two enforcement points before this one said so and a control that overstates itself is worse than none.

## What is new and what is reused

| | Reused | New |
|---|---|---|
| The page | The vault-app skeleton (`index.html` + `app.json` + `content.json`, `sg.vfs`, `sg-app-ready`, inlined fallback) — this session's video vault, and the `vault-html-app` skill | — |
| Rendering | The estate's `gm-blocks.css` idiom (tier badge, freshness chip) in spirit; inlined, because a vault app may not link a stylesheet | The five cards |
| Data | `event/v1`, `request/v1`, `decision/v1`, `policy/v1` from [document 03](03__the-policy-object.md) | `content.json`'s derived shape |
| The briefing | The push-policy skill's rules | The text |
| A chat thread | `sg-chat-thread` exists (an ES module for a WhatsApp desk); not used, because the pilot's thread is a folder | — |

## What this does not prove

- **That five cards are enough.** They are the specification's minimum (a refusal, a recorded draw, a waiting request) plus the two the economics insist on (draw frequency, correlation).
- **That anyone will watch.** The room has been rendered from one repository's pilot ledger; the sample is one policyholder and one day.
- **That the briefing is read.** It is injected as context; whether a session acts on it is what the hooks are for.

---

*Added after publication, 3 September 2026, from memo 13.*

## The sixth card — catches by level

| # | Card | Shows | From |
|---|---|---|---|
| 6 | **Catches by level** | For each level 0–5: events, draws, refusals, and **catches**; the last reconciliation run (when, by whom, commits checked, catches); every catch with its commit and its cause | The derivation over events' `level`, and `ledger/reconcile/` |

Red when a catch exists, because a catch is an incident. The line under the table says *no catch above the hook: nothing has been seen that the hook should have refused* until that is no longer true. Assurance per level is this card read over a period, which is why the room and not the briefing carries it.

---

*CC BY 4.0.*
