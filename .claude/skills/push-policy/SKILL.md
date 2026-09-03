---
name: push-policy
description: Before any git push from this repository, check it against the push policy in insurance/push-policy/policy.json — a budget on pushes per day and bytes per push with a shared daily pool — append the verdict to the ledger, and stop if refused. Use whenever you are about to run `git push` here.
---

# Push policy — run the check before you push, and stop when it says so

This repository carries an insurance-shaped budget on what an agent may push
(`insurance/push-policy/`). **You are the enforcement point.** That makes this a *setting*, not a
boundary — you could skip it — and the whole point of the exercise is that you do not.

## Before every `git push`

```bash
python3 insurance/push-policy/check.py --branch <target-branch>
```

It measures what git would send to `origin/<target-branch>` from `HEAD`, reads `policy.json` and
today's ledger, prints one of three verdicts, and queues the verdict in `ledger.queue.jsonl` (ignored by git); the pack's pre-commit hook drains the queue into `ledger.jsonl` at the next commit, so a push leaves the tree clean:

| Verdict | Means | You |
|---|---|---|
| `NORMAL` | Inside the normal band; nothing drawn | push |
| `DRAWN` | Over the normal band, within the per-push limit, pool had enough; the excess is drawn from today's pool | push — **and say in your message that the pool was drawn, and how much is left** |
| `REFUSED` | Over the per-push maximum, or the pool cannot cover it; exit code 1 | **do not push.** Tell the human what was refused, why, and the numbers. Do not split the push to get under the limit; do not edit the policy or the ledger. The human decides |

Run it for the branch you are actually pushing to. `dev` has its own, tighter band; anything
else counts as your own branch.

## Rules

- **Never edit `policy.json`, `ledger.jsonl` or `ledger.queue.jsonl` to pass.** The policy is the project lead's; the ledger is append-only and is the loss data the numbers will be re-fitted from.
- **Run it even when you are sure.** Twelve of twelve site releases would have been refused when this was first measured (`README.md`); the estate did not know until the check said so.
- **A refusal is a finding, not a failure.** Report it with the bytes and the limit. If the cause is the release touching every page, say that.
- `--dry-run` gives the verdict without touching the ledger; use it while deciding, then run it for real before the push.
- **Only a human may override a refusal**, and only by telling you to. Then re-run with `--override "<their words, and where they said it>"`: the refusal and the exception both go on the ledger. Never write an override yourself.

## What this is not

Not a boundary. A hook you cannot edit, a required CI check, or a host push rule would be. The
policy and the arithmetic are the same; only who runs them differs. That ladder is in
`insurance/push-policy/README.md`.
