# The push policy: a budget on what an agent may push, run by the agent on itself

*The first MVP of the insurance pivot, from [memo 12](../../briefs/v0.33.84__strategy-brief__the-claim-is-the-draw-money-as-a-metric-and-a-push-budget-claude-can-run-today.md) and [doctrine 12](../the-claim-is-the-draw.html). **It is a setting, not a boundary**, and this page says so before it says anything else: the check runs where the agent runs, against a ledger the agent can edit.*

---

## What it is

Three documents and one function.

| File | Is |
|---|---|
| [`policy.json`](policy.json) | The policy: a mandate-shaped statement with issuer, subject, interval, and for each resource the normal band, the per-occurrence limit and the daily pool. **This is the source of truth** |
| `ledger.jsonl` | Append-only. One line per check: day, branch, bytes, verdict, what was drawn. **The claims file, and the loss data** |
| [`check.py`](check.py) | Measures what git would send, reads the two documents above, returns one of three verdicts, appends to the ledger, exits non-zero on refusal |
| [`pre-push`](pre-push) | A sample git hook that calls the check. Shipped, **not installed** — see the finding below |
| [`.claude/skills/push-policy/`](../../.claude/skills/push-policy/SKILL.md) | The skill: tells Claude to run the check before any push and to stop when refused |

## The policy, in insurance terms

| Part | Pushes, own branch | Pushes, `dev` | Bytes per push |
|---|---|---|---|
| Deductible — the normal band | 10 a day | 3 a day | 50 KB |
| Per-occurrence limit | — | — | 300 KB |
| Aggregate — the pool | 20 | 10 | 1 MB a day |
| Interval | a day, UTC | a day, UTC | a day, UTC |

**The pool is per repository**, because the ledger lives in it: every agent pushing here draws from the same megabyte. A push inside the normal band draws nothing. A push over it, within the per-occurrence limit, with enough pool left, is **drawn** — the excess comes off the pool and the push proceeds; that draw is the claim, paid in bytes. A push over the per-occurrence limit, or one the pool cannot cover, is **refused**, and the agent stops.

## Run it

```bash
python3 insurance/push-policy/check.py --branch dev --dry-run     # the verdict for pushing HEAD to origin/dev; ledger untouched
python3 insurance/push-policy/check.py --branch dev               # the same, and the ledger is appended; exit 1 on refusal
python3 insurance/push-policy/check.py --backtest 12 --ref origin/dev   # what the policy would have said about the last 12 commits
python3 insurance/push-policy/check.py --branch dev --override "<a human's decision, quoted>"   # a refusal a human overrides: both go on the ledger
```

The measurement is the uncompressed size of objects reachable from `HEAD` and not from the remote branch — what git would have to send. It is a floor: packing compresses, so the wire carries less. A floor is what this estate's grant rule prefers over a guess.

## What it found first: this estate

Run against the last twelve releases on `dev` before this page was written:

```
2026-08-31 refused  3,040,844 B  168 blobs  site v0.1.53 …  — over the per-push maximum of 307,200 B
2026-08-31 refused  3,232,722 B  176 blobs  site v0.1.54 …
2026-08-31 refused  3,282,270 B  174 blobs  site v0.1.55 …
2026-08-31 refused  3,394,055 B  177 blobs  site v0.1.56 …
2026-08-31 refused  3,483,057 B  179 blobs  site v0.1.57 …
2026-08-31 refused  3,571,338 B  181 blobs  site v0.1.58 …
2026-08-31 refused  3,730,566 B  185 blobs  site v0.1.59 …
2026-08-31 refused  3,795,239 B  191 blobs  site v0.1.60 …
2026-08-31 refused 13,141,196 B  266 blobs  site v0.1.61: the insurance book …
2026-09-01 refused  4,254,275 B  215 blobs  site v0.1.62 …
2026-09-01 refused  4,233,346 B  213 blobs  site v0.1.63 …
2026-09-01 refused  4,714,674 B  216 blobs  site v0.1.64 …
```

**Twelve of twelve refused**, at ten to forty-three times the per-push maximum. Eight on one day, which would also have drawn five from the `dev` push pool. The cause is not the content of any release: it is `admin/build/chrome.py`, which stamps the version into every page on every release, so a one-line change ships about 180 changed files. Two non-release commits from August, replayed the same way, came out **normal** and **drawn**.

Two readings are possible and memo 12 picks one: *"that is now a cost paid continuously by every developer, every push."* **The policy is not mis-calibrated. The estate's release mechanism is**, and the fix is in the release, not the policy — stamp the version in one place the pages read at load time, and ship only what changed. Until then the hook is shipped and not installed, because installing it would refuse every release including the one that publishes this page.

## The tier, on its own face

| Who runs the check | Tier |
|---|---|
| The agent on itself, from the skill | **Setting** — this MVP |
| A pre-push hook in the agent's clone | Setting — the agent can edit the hook |
| A required CI status, or a host push rule | **Boundary** — same `policy.json`, same arithmetic, a party the agent cannot reach |

Moving up the ladder is not a better skill. It is the same policy read somewhere the agent cannot reach.

## What this does not prove

- **That the numbers fit this repository.** They are memo 12's placeholders. The only fit so far says the estate breaches them on every release, and the page above argues that is the estate's fault; that is an argument, not a calibration from the ledger, which has no live entries yet.
- **That the check is a boundary.** It is a setting by construction. Nothing stops an agent editing `policy.json`, the ledger, the hook or the skill.
- **That bytes before the push are the cost.** They are a floor on what is asked, never a bill.
- **That a per-repository pool is the right unit.** A per-organisation or per-agent pool is constructible from the same ledger; neither has been tried.
- **That anyone but this estate has run it.** One repository, twelve commits replayed.

---

*CC BY 4.0. Built from memo 12 on 2 September 2026. The policy numbers are the project lead's; the finding is a measurement of this estate and not a position.*
