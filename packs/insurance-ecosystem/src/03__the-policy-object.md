# The Policy Object: One Schema For Any Unit, The Event It Produces, And Two Worked Policies

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** The schema of a policy, of a ledger event, of a request and a decision, and of the derived balance that is never stored. Field names are a first pass; the separations are the design. Two worked policies follow — the git pilot (built) and the token policy (measured, not yet banded).

---

## Four documents and one derivation

| Document | Written by | When | Edited |
|---|---|---|---|
| `policy/v1` | The issuer | At issue, and at every repricing (a new file, superseding) | Never |
| `event/v1` | The insured's evaluator, at a decision point | Whenever a verdict is not silence | Never |
| `request/v1` | The insured's evaluator, when a draw needs approval | At the decision point, before the action | Never |
| `decision/v1` | The approver | When somebody answers | Never |
| **The balance** | Nobody | Derived by the maintainer from the four above, on every drain | **Never stored** — recomputed, like the delta in the sibling pack |

A stored balance is stale the moment an event lands elsewhere, and a balance maintained inside the insured is the insured marking its own homework. So the room's balance card is a derivation with the ledger commit it came from printed beside it.

## `policy/v1`

```json
{
  "type": "policy/v1",
  "id": "git-pilot-2026-09-03",
  "rules_version": "insurance-ecosystem/draft-1",

  "issuer":       { "who": "the project lead", "basis": "memo 12, 2 September 2026", "record": null },
  "policyholder": { "who": "the pki.sgit.ai estate", "note": "every draw names this party as acceptor; experience rating lands here" },
  "subject":      { "who": "any session committing to github.com/SGit-AI/SGit-AI__Website__PKI",
                    "mandate": "packs/grant-and-mandate/mandates/current.json",
                    "mandate_sha256": "<sha256 of the mandate file this policy was written against>" },

  "interval": { "from": "2026-09-03", "until": "2026-12-31", "reinstatement": "day", "timezone": "UTC" },

  "draw_mode": { "default": "recorded",
                 "requested_above": { "bytes_per_commit": 204800 },
                 "acceptor": "policyholder" },

  "units": [
    { "unit": "bytes_per_commit",
      "meter": "git: uncompressed size of the blobs the index adds or changes, read by the pre-commit hook",
      "normal": 51200, "per_occurrence": 307200, "pool": 1048576, "pool_scope": "per repository, per day",
      "exclusion": { "above": "per_occurrence",
                     "reason": "bytes committed into history are a stock, not a rate: irreversible without rewriting history others hold, and paid by every clone forever. The vendor's published maximum file size is 1 MB recommended, 100 MB hard; this cap sits well inside it" } },
    { "unit": "commits",
      "meter": "ledger: count of this subject's non-refused commit events today",
      "normal": 10, "per_occurrence": 1, "pool": 20, "pool_scope": "per repository, per day" }
  ],

  "reserve": { "share": 0.1, "released_by": "the issuer, by a decision/v1 with kind 'reserve'",
               "note": "the catastrophe layer: no verdict may draw on it" },
  "rating":  { "period": "week", "owner": "the issuer",
               "rule": "draw frequency is the metric; a pool drawn on most days of the period has the wrong normal band, and the response is to raise the band and shrink the pool, never to enlarge the pool" },
  "rate_table": { "owner": "the issuer", "published": false },

  "supersedes": null,
  "does_not_prove": [ "…" ],
  "sig": null
}
```

Rules the schema enforces (the evaluator refuses a policy that breaks one):

- **Every unit names its meter**, in words a reader can re-run. A unit with `meter: null` is refused: a claim in that unit would need a judgement.
- **Every exclusion carries a reason.** The specification requires it, and it is the one place the insurability argument is written down where the refusal will quote it.
- **`rules_version` is present.** A policy is evaluated by the rules it was written against; an evaluator with a different rules version says so rather than guessing.
- **`draw_mode.default` is `recorded`.** `silent` is not a value.
- **`interval.timezone` is present**, because a recurring window without one is the ground disputes are fought on (GM-D80).
- **`subject.mandate_sha256` is present** whenever `subject.mandate` is, so the policy pins the mandate it prices. A mandate that changes is a repricing event.
- **`supersedes` is a policy id or null**, and a superseding policy is a new file; the pointer `current.json` moves.
- **`rate_table.published` is false** until the issuer publishes one; the evaluator never converts between units.

## `event/v1`

One shape for every unit, generic on `unit`:

```json
{
  "type": "event/v1",
  "id": "2026-09-03T14-02-11Z__7c1e2a9b",
  "at": "2026-09-03T14:02:11+00:00", "day": "2026-09-03",
  "policy": "git-pilot-2026-09-03", "rules_version": "insurance-ecosystem/draft-1",
  "subject": "session:844f4a2f", "policyholder": "the pki.sgit.ai estate",
  "point": "pre-commit",
  "unit": "bytes_per_commit", "amount": 152291,
  "verdict": "drawn",
  "drawn": 101091, "pool_left": 947485,
  "acceptor": "the pki.sgit.ai estate",
  "reason": "101,091 B over the normal band, drawn from today's pool",
  "ref": { "head": "ac5ebc6", "branch": "claude/registry-mvp-brief-hpbap8" },
  "test": false
}
```

- `verdict` ∈ `normal | drawn | refused | requested`. A `normal` event is written only for **countable** units (a commit is counted even when it drew nothing); for volume units, silence below cover means no event.
- `acceptor` is the **policyholder on every draw**, by copy from the policy, never the session — the agent spends, the team carries.
- `drawn` and `pool_left` are the evaluator's arithmetic *at the time*; the maintainer recomputes both on drain and flags a disagreement rather than trusting either copy.
- `tokens` events carry `amount` as an object: `{"input_tokens": …, "cache_creation_input_tokens": …, "cache_read_input_tokens": …, "output_tokens": …}` — four counters, never one.
- `test: true` marks an event produced by an acceptance run rather than real work; the room shows them in a separate lane and the balance ignores them.

A **refusal** is an event with `verdict: "refused"` and `zone: "outside"`; the evaluator also writes an **escalation** request (below) because an uninsured action is an unaccepted risk, and an unaccepted risk escalates without anybody escalating it.

## `request/v1` and `decision/v1`

```json
{ "type": "request/v1", "id": "2026-09-03T14-05-40Z__5d2f", "kind": "draw",
  "policy": "git-pilot-2026-09-03", "subject": "session:844f4a2f",
  "unit": "bytes_per_commit", "amount": 262144, "excess": 210944,
  "why": "the generated pages for the pack are one natural unit",
  "status": "waiting", "at": "2026-09-03T14:05:40+00:00" }

{ "type": "decision/v1", "request": "2026-09-03T14-05-40Z__5d2f",
  "by": "the project lead", "decision": "approved", "note": "once; the pages are one unit",
  "at": "2026-09-03T15:12:03+00:00" }
```

`kind` ∈ `draw` (above the requested threshold) · `escalation` (outside cover; the answer is an acceptance or a suspension, never a draw) · `reserve` (the issuer releasing the catastrophe tranche). A request with no decision is **waiting**, and waiting is a first-class state the room shows. A decision is an acceptance event in the corpus's sense — named acceptor, dated — and it is the one place in the pilot where the hand that asks and the hand that answers may be the same session: the record still names two roles.

## The derived balance

For each policy, unit and day:

```
   used        = Σ amount over today's non-refused events in this unit
   drawn       = Σ drawn  over today's events
   pool_left   = pool × (1 − reserve.share) − drawn         (the reserve is subtracted first)
   zone        = outside  if any refused event today, or pool_left < 0
               = drawing if drawn > 0
               = below   otherwise
   draw_days   = days in the rating period with drawn > 0  /  days observed
```

The evaluator computes the same thing at the decision point from the events it can see; the maintainer computes it from everything on drain. **Where the two disagree, the maintainer's is the balance and the disagreement is a finding.**

## Worked policy 1 — the git pilot (built)

[`policies/pki-site-repo/git-pilot-2026-09-03.json`](../policies/pki-site-repo/git-pilot-2026-09-03.json) is the policy in force for this repository from 3 September. Five units, from memo 12 and the existing mandate:

| Unit | Meter | Normal | Per occurrence | Pool (per day) | Instrument |
|---|---|---|---|---|---|
| `bytes_per_commit` | git, at pre-commit: new blob bytes in the index | 50 KB | **300 KB — an exclusion** | 1 MB | Budget with an exclusion on top |
| `commits` | ledger: commit events today | 10 | 1 | 20 | Budget |
| `bytes_per_push` | git, at pre-push: new blob bytes to the remote ref | 50 KB | 300 KB | 1 MB | Budget (the existing MVP's) |
| `pushes` | ledger: push events today, by branch kind (`own` 10/20, `dev` 3/10) | | 1 | | Budget (the existing MVP's) |
| `branch` | git, at pre-push: the ref name against the mandate's allow-list | — | — | — | **Exclusion**: reach, not volume; the mandate governs it |

`draw_mode.requested_above.bytes_per_commit` = 200 KB: a commit between 200 KB and 300 KB is not drawn silently — the evaluator writes a request and refuses until a decision exists.

## Worked policy 2 — tokens (measured, not banded)

[`policies/pki-site-session/tokens-measured-2026-09-03.json`](../policies/pki-site-session/tokens-measured-2026-09-03.json) has **no bands** and is instrumentation only. Its one unit is `tokens`, its meter is *the transcript: `message.usage` on every assistant line, summed by `tools/usage.py`*, and its `does_not_prove` says why there are no numbers: nobody has measured a working day yet, and a band typed before the meter has run is the mistake this whole estate exists to stop. What the meter found on this session's own transcript, 25 August to 3 September:

| Counter | Value |
|---|---|
| `input_tokens` | 68,356 |
| `cache_creation_input_tokens` | 33,101,651 |
| `cache_read_input_tokens` | **721,095,334** |
| `output_tokens` | 2,987,014 |

A policy against `input_tokens` would have priced this session at sixty-eight thousand tokens; it moved seven hundred and fifty-seven million. And the dominant counter grows with conversation length, not with work — so a token policy measures **duration** at least as much as activity, and the issuer must decide whether that is intended before any band is written. The four counters stay four; the rate table that would join them is excluded.

## What this does not prove

- **That five is the right number of units.** They are the ones with meters this estate can run today.
- **That 200 KB is the right request threshold.** It is two-thirds of the exclusion, chosen so that the requested-draw workflow is exercised on real commits rather than only in tests.
- **That the reserve share is right.** Ten per cent is a placeholder; its size is the difference between a bad day and an estate-wide stop, and nothing here has measured a bad day.
- **That the derivation is complete.** It has one policyholder; the correlation card in [document 07](07__interface.md) needs two.

---

*CC BY 4.0.*
