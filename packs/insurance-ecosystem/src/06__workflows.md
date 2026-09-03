# Workflows: Seven, As Commands, Including The One Where The Session Runs Out

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** Session start, ordinary work, a recorded draw, a requested draw, exhaustion, the maintainer run, and a repricing event — each as the commands a session runs and the files it leaves. Written for the session that reads only this pack; every command names a tool that exists in `tools/`.

---

## Conventions

- `$PACK` is `packs/insurance-ecosystem`. `$LEDGER` is the ledger folder: `$PACK/ledger` in the repository stage, the ledger vault's working copy in the vault stage. `policy.py` takes `--ledger` and `--policies` and defaults to the pack's folders.
- Every file written is **new**. No workflow edits a file that exists.
- Every workflow ends by saying what the room will show, because the room is how somebody watches.
- The hooks are installed (`git config core.hooksPath .githooks`) — the briefing says if they are not.

## W1 · Session start

```bash
# what the SessionStart hook runs; a session may also run it by hand
python3 $PACK/tools/policy.py briefing
```

Output (the briefing, [document 07](07__interface.md) has the full text):

```
   POLICY   git-pilot-2026-09-03 · issued by the project lead · until 2026-12-31 · rules insurance-ecosystem/draft-1
   YOU ARE  the insured (session), under policyholder "the pki.sgit.ai estate"
   TODAY    commits 3 of 10 normal (pool 20, 17 left) · bytes/commit pool 1,048,576 B, 947,485 B left · zone: DRAWING
   AT COMMIT  normal → silent · drawn → one line, acceptor = policyholder · requested (>200 KB) → ask, wait · refused (>300 KB) → stop, escalation written
   AT PUSH    branch outside the mandate → refused · then the same on bytes/push and pushes
   TO ASK     policy.py request --unit bytes_per_commit --amount N --why "…"     (then wait for ledger/decisions/)
   THE ROOM   <room vault read link, or packs/insurance-ecosystem/room/index.html>
   HOOKS      pre-commit installed · pre-push installed
```

Files written: none. **The room shows nothing new.**

## W2 · Ordinary work

```bash
git add … && git commit -m "…"      # pre-commit runs policy.py; inside the band it prints nothing
git push origin HEAD                 # pre-push runs mandate.py then policy.py; inside the band, nothing
```

Files written: one `event/v1` per commit with `verdict: normal` for the countable unit (`commits`), because the eleventh needs the ten before it; **no** event for `bytes_per_commit` inside the band. **The room shows nothing new** except the commit count ticking — and that is the requirement, not an omission: a system that comments on ordinary work is turned off within a week.

## W3 · A recorded draw

The insured stages 140 KB and commits. The hook computes 140 KB − 50 KB = 90 KB over the band, inside the 300 KB limit, pool has it.

```
$ git commit -m "the generated pages"
  DRAWN  bytes_per_commit  143,360 B  · 92,160 B drawn from today's pool (855,325 B left) · acceptor: the pki.sgit.ai estate
[claude/… 1a2b3c4] the generated pages
```

Files written: `ledger/events/<ts>__<id>.json` with `verdict: drawn`, `drawn: 92160`, `acceptor: "the pki.sgit.ai estate"`. The commit proceeds. **The room shows** a new line in the events card, the balance card's pool moving, and the draw-frequency card counting today as a drawing day.

The insured's obligation: **say so** in whatever it reports to the human — that the pool was drawn, and how much is left. The skill for the push MVP already requires it; this pack keeps it.

## W4 · A requested draw

The insured stages 250 KB — above `draw_mode.requested_above` (200 KB), below the exclusion (300 KB).

```
$ git commit -m "all the pages at once"
  REQUESTED  bytes_per_commit  256,000 B is above the requested-draw threshold (204,800 B)
             a request has been written: ledger/requests/2026-09-03T14-05-40Z__5d2f.json
             this commit is refused until a decision exists. Ask the approver; do not split the commit to get under the threshold.
```

The commit is refused (exit 1). The insured **asks** — in chat, to the approver, quoting the request id — and waits. It may do other work below cover meanwhile.

The approver (in the pilot, possibly the same session under the approver's hat):

```bash
python3 $PACK/tools/policy.py decide 2026-09-03T14-05-40Z__5d2f --by "the project lead" --approved --note "once; the pages are one unit"
# or --declined
```

Then the insured retries the same commit; the hook finds the approved decision matching the request (same unit, same subject, amount at or below the request), records the draw with `via_request`, and proceeds. A declined decision leaves the refusal in place and the insured makes the commit smaller *as a natural unit* or drops it.

Files written: a `request/v1`, then a `decision/v1`, then an `event/v1` with `verdict: drawn` and `via_request`. **The room shows** the request in the waiting card until the decision lands, then the draw.

## W5 · Exhaustion — and running uninsured

Two ways in, one state.

**The exclusion.** The insured stages 400 KB:

```
$ git commit -m "the videos"
  ┌──────────────────────────────────────────────────────────────────────┐
  │  COMMIT REFUSED BY THE POLICY — this is a SETTING, not a boundary    │
  └──────────────────────────────────────────────────────────────────────┘
  ✗ bytes_per_commit  409,600 B is over the per-occurrence limit of 307,200 B — an EXCLUSION
    reason: bytes committed into history are a stock, not a rate: irreversible without rewriting
            history others hold, and paid by every clone forever …
    zone: OUTSIDE COVER. This action is uninsured. An escalation has been written:
          ledger/requests/2026-09-03T15-30-02Z__9e01.json
    what to do: stop this class of action. Do not split, do not --no-verify, do not edit the policy.
               Tell the human what was refused, with the numbers. The approver answers the escalation.
```

**The pool.** The insured's fourth draw of the day would take 120 KB from a pool with 80 KB left:

```
  ✗ bytes_per_commit  122,880 B over normal but only 81,920 B left in today's 943,718 B pool (reserve held back)
    zone: OUTSIDE COVER — the pool is exhausted for every session on this repository today, not only this one …
```

Either way the insured is **uninsured for that class of action** and the rule is the corpus's: an unaccepted risk defaults to critical and escalates without anybody escalating it. So the evaluator writes a `request/v1` with `kind: escalation` — the answer to which is an **acceptance** of the uninsured action by a named acceptor, or a **suspension** until the pool reinstates, never a larger draw. The insured stops that class of action (it may still commit below the band? **No**: an exclusion refuses the one commit; an exhausted pool refuses every commit over the band until reinstatement, and commits *inside* the band still proceed, because the pool bounds volume and the band is not the pool).

Files written: an `event/v1` with `verdict: refused`, `zone: outside`; a `request/v1` with `kind: escalation`. **The room goes red** for that policy: the zone card says OUTSIDE COVER, the events card shows the refusal, the waiting card shows the escalation.

The approver's answers:

```bash
python3 $PACK/tools/policy.py decide <id> --by "the project lead" --accept   --note "accepted as uninsured, once: …"   # the action proceeds on retry, recorded as accepted-uninsured
python3 $PACK/tools/policy.py decide <id> --by "the project lead" --suspend  --note "until tomorrow's reinstatement"     # nothing proceeds; the room stays red until the day rolls
```

An **accepted-uninsured** action is not a draw: it is written with `verdict: accepted_outside` and the acceptor's name, and it never touches the pool — because the pool did not cover it, a person did.

## W6 · The maintainer run

At least once a working day, and before anybody reads the room:

```bash
# vault stage: pull the ledger and the policies first
sgit pull   # in each vault's working copy
# lane stage (step 7): drain first — list without content, fetch by id in batches of 100, write each into ledger/events/, mark processed
python3 $PACK/tools/room.py --ledger $LEDGER --policies $PACK/policies --out $PACK/room/content.json
# then commit and push the room vault; the read link does not change
sgit commit "room: $(date -u +%FT%TZ)" && sgit push
```

`room.py` recomputes every balance from every event, ignores `test: true` events for the balance and shows them in their own lane, computes draw frequency over the rating period, computes correlation across policyholders (or prints *not computable: one policyholder*), lists waiting requests, records the ledger commit it read and the sha256 of each policy it rendered, and flags any event whose stored `drawn`/`pool_left` disagree with the recomputation.

Files written: `room/content.json` (new derivation; the previous one is history). **The room shows** everything, with `generated_at` and the ledger commit in the footer, and a **stale** banner if the last run is older than the reinstatement interval.

## W7 · A repricing event

Something changed what the policy is worth: a re-measured grant grew (a control stopped existing), a vulnerability was published, the mandate the policy pins changed hash. The issuer decides one of three, **never automatically**:

```bash
python3 $PACK/tools/policy.py supersede git-pilot-2026-09-03 --as git-pilot-2026-09-10 \
    --set units.bytes_per_commit.normal=25600 --why "reprice: the grant grew at n4; the band halves until it is re-measured"
# or  --exclude "<unit>" --why "coverage change: …"     # a new exclusion
# or  --suspend --why "suspension: cover withdrawn pending remediation of …"
```

`supersede` writes a **new** policy file with `supersedes` set, moves `current.json`, and writes an `event/v1` of `unit: policy` recording the change. The next briefing shows the new terms; the next commit is evaluated against them. And because June says acceptance has an interval, a repriced policy is arguably a new one: **the policyholder re-accepts** by a `decision/v1` with `kind: acceptance` against the new policy id, and until it does the room shows the policy as *superseded, awaiting acceptance* — cover continues under the old terms only if the old interval has not ended, which is the honest state and the room says it.

Files written: a policy, a pointer, an event, and a decision. **The room shows** the supersession on the policy card and the acceptance when it lands.

## The working day, as the acceptance test

One session, reading only this pack, does W1, then W2 for a few commits, then W3 once, then W4 once (asking and answering under two hats, saying so), then W5 once, then W6. The room then shows **a refusal, a recorded draw and a waiting request** — the three the specification asks for — and the ledger holds the events, the request and the decision that produced them. [Document 09](09__first-increment.md) has the first run of W3, W4 and W5 against real git, before any vault existed.

## What this does not prove

- **That the threshold split (200/300 KB) produces a requested draw on real work.** It produced one on this pack's own publication; one instance.
- **That the approver answers.** A waiting request that is never answered is a state the room shows and nothing resolves; the retention question applies to requests too.
- **That an accepted-uninsured action is safe.** It is accepted, which is a different thing, and the corpus's *accepted is not acceptable* applies in full.

---

*Added after publication, 3 September 2026, from memo 13.*

## W8 · A catch above the hook

Two ways in, one state. The destination check refuses something the hook should have refused; or the maintainer's reconciliation finds a commit that carries no claim, or whose weight disagrees with the claim it carries.

```bash
python3 $PACK/tools/reconcile.py                 # the maintainer, at least daily; or CI in report mode
#   ✗ <sha> <when> <bytes> <files> <subject>
#       CATCH no-claim: no pre-commit claim within the window: the hook did not run for this commit
```

Files written: an `event/v1` with `verdict: caught`, `level: 5` (or 4), `zone: outside`, dated to the commit; a run record under `ledger/reconcile/` so no commit is checked twice. **No draw.** The room's sixth card goes red. The insured stops that class of action. The issuer answers with an explanation accepted (`decide … --accept`, recorded as accepted-uninsured with the reason) or a suspension (`--suspend`), and the rating lands on the policyholder either way. A catch is never approved as a draw, because it was never inside cover.

Run on 3 September over the eleven commits since the hook was installed: no catch. The first real one will calibrate levels four and five, which have caught nothing yet.

---

*CC BY 4.0.*
