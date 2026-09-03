# The First Increment: Three Git Policies, Two Hooks, And The Three Refusals The Specification Asked For — Run, With Git's Own Output

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** Build-order step 1, built and run. What was made, what it refused, what tier it reached, and the findings the exercise produced that no document above would have. The full transcript of the run is [`tests/acceptance-2026-09-03.log`](../tests/acceptance-2026-09-03.log); every number below is copied from it.

---

## What was built

| File | What it is |
|---|---|
| [`policies/pki-site-repo/git-pilot-2026-09-03.json`](../policies/pki-site-repo/git-pilot-2026-09-03.json) | The policy: five units, memo 12's numbers, the mandate pinned by sha256, an exclusion with its reason, a reserve, a rating rule, an unpublished rate table with an owner |
| [`tools/policy.py`](../tools/policy.py) | The evaluator. One verdict function; `check` at `pre-commit` or `pre-push`; `briefing`, `request`, `decide`, `supersede`, `derive`, `validate`; the Claude `PreToolUse` handler. Default-deny on its own dependencies |
| [`hooks/pre-commit`](../hooks/pre-commit), [`hooks/pre-push`](../hooks/pre-push) | The enforcement points. `pre-push` runs the sibling pack's mandate check first (reach), then the volume policy |
| [`tools/usage.py`](../tools/usage.py) | The token meter: four counters from the transcript |
| [`tools/room.py`](../tools/room.py), [`room/index.html`](../room/index.html) | The maintainer's derivation and the room, rendered from the acceptance run's own lane |
| `ledger/` | Twenty-one events, three requests, one decision — all from the run below, all marked `test: true`, shown in the room's acceptance-run lane and excluded from the real balance |

The three policies the specification named compile as it said they would: **commit rate and diff size to `pre-commit`, branch constraint to `pre-push`** — and the branch constraint was already there, built on 26 August by the sibling pack, so `pre-push` chains it and adds the volume units after it.

## The run

A scratch clone of this repository at `3c69288dc95a`, the pack copied in, `core.hooksPath=.githooks`, both hooks installed, every event marked as an acceptance run (`IE_TEST=1`) so that it lands in its own lane. A bare repository as the remote. Setup commits used `--no-verify` and are labelled as setup, not tests.

### Test A — a 400 KB commit, refused by something that is not the agent

```
$ git commit -m 'a 400 KB file'
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PRE-COMMIT REFUSED BY THE POLICY — a SETTING, not a boundary         │
  └──────────────────────────────────────────────────────────────────────┘
  ✗ bytes_per_commit  409,600 B is over the per-occurrence limit of 307,200 B — an EXCLUSION
    reason: bytes committed into history are a stock, not a rate: irreversible without rewriting
            history others hold, and paid by every clone forever …
    zone: OUTSIDE COVER. This action is uninsured.
    an escalation has been written: ledger/requests/2026-09-03T01-54-09Z__2916da7f.json
    what to do: stop this class of action. Do not split, do not --no-verify, do not edit the policy.
               Tell the human what was refused, with the numbers. The approver answers the escalation.
exit=1
HEAD after: 7257e5d setup: the pack itself
```

`exit=1` is git's, from a hook that ran before the commit object existed. `HEAD` did not move. The exclusion's reason was printed by the thing that refused, which is the point of requiring one.

### Test B — the eleventh commit of the day is told a draw was recorded

Ten small commits said nothing. The eleventh:

```
commit 11 exit=0 ·   DRAWN  commits  1 · commits 11 over the normal 10: 1 drawn from the pool (17 left) · acceptor: the pki.sgit.ai estate
```

Seventeen left of eighteen, because the pool is twenty and the reserve holds ten per cent back before any arithmetic. The acceptor is the policyholder, by copy from the policy, and the commit proceeded.

### Test C — a push outside the mandate, refused

```
$ git push test HEAD:refs/heads/main
  ┌─────────────────────────────────────────────────────────────┐
  │  PUSH REFUSED BY A MANDATE                                  │
  └─────────────────────────────────────────────────────────────┘
  ✗ main  is not permitted by mandate v2
    permitted branches: claude/**, dev
  …
error: failed to push some refs to '…/ie-remote.git'
exit=1
```

The sibling pack's control, unchanged, running first in the chained hook: reach is refused before any byte is counted. The same push to `claude/ie-test` in the same minute succeeded (`* [new branch] HEAD -> claude/ie-test`) and wrote one `pushes[own]` event.

### Test D — a requested draw: refused, asked, decided, drawn

```
$ git commit -m 'a 250 KB file'
  │  PRE-COMMIT REFUSED UNTIL A DECISION EXISTS — a requested draw        │
  ? bytes_per_commit  256,000 B is above the requested-draw threshold (204,800 B)
    a request has been written: ledger/requests/2026-09-03T01-54-11Z__a7040934.json
    this action is refused until a decision exists. Ask the approver, quote the id, wait.
exit=1
$ policy.py decide 2026-09-03T01-54-11Z__a7040934 --by 'the project lead (acceptance run)' --approved
decision written: …/decisions/2026-09-03T01-54-11Z__c270221f.json — approved
$ git commit -m 'a 250 KB file, after the decision'
  DRAWN  bytes_per_commit  256,000 B · 204,800 B drawn from today's pool (738,918 B left) — via request 2026-09-03T01-54-11Z__a7040934, approved by the project lead (acceptance run) · acceptor: the pki.sgit.ai estate
  DRAWN  commits  1 · commits 12 over the normal 10: 1 drawn from the pool (15 left) · acceptor: the pki.sgit.ai estate
[claude/… 3534ff3] a 250 KB file, after the decision
 3 files changed, 47 insertions(+)
 create mode 100644 mid.bin
 create mode 100644 packs/insurance-ecosystem/ledger/events/2026-09-03T01-54-11Z__00b272d7.json
 create mode 100644 packs/insurance-ecosystem/ledger/events/2026-09-03T01-54-11Z__c479dbfc.json
```

The whole of [W4](06__workflows.md): refused, a request with an id, a decision naming the approver, the retry finding the decision and drawing **via** it. The same session wrote both, under two hats, and the record names both. And the last three lines are finding IE9: **the commit carries its own two claims** — the hook staged the events it wrote, so the ledger does not lag.

### Test E — exhaustion, and what still proceeds

Four manual readings of 200,000 B each drew 148,800 B; the fifth:

```
  ✗ bytes_per_commit  148,800 B over normal but only 143,718 left in today's pool of 943,718 (reserve held back)
    — the pool is exhausted for every session on this repository today
    zone: OUTSIDE COVER. This action is uninsured.
    an escalation is already waiting: 2026-09-03T01-54-09Z__2916da7f
exit=1
```

And then a commit inside the band still proceeded (`exit=0`), because the pool bounds volume and the band is not the pool — though it drew on the **commits** pool, being the thirteenth of the day, which is a second thing the run showed without being asked.

### What the room shows

After the run, derived by `room.py` from the pack's own ledger: **a refusal** (test A, and test E's), **a recorded draw** (tests B, D, E), **a waiting request** (`2026-09-03T01-54-12Z__22114166`, 230,000 B, left unanswered on purpose), an escalation waiting, one decision, and the acceptance-run balance:

```
bytes_per_commit   used 1,056,000  drawn 800,000  pool_left 143,718 of 943,718  events 7  refused 2  zone outside
commits            used 13         drawn 6        pool_left 12 of 18            events 13 refused 0  zone drawing
pushes[own]        used 1          drawn 0        pool_left 18 of 18            events 1  refused 0  zone below
```

The real lane, meanwhile, is empty: the room's balance card reads *below*, and the acceptance-run lane is a separate, marked block. The three things the specification asked the room to show, it shows — from a run, before any vault existed.

## The tier it reached, stated honestly

| | Where the constraint lives | Tier | Bypass |
|---|---|---|---|
| Before | A policy document nobody evaluated at commit time | **Expectation** | Ignore it |
| After | `.githooks/pre-commit` and `pre-push`, run by git before the object exists | **Setting** | `--no-verify`; `git config --unset core.hooksPath`; edit the hook, the evaluator, the policy or the ledger |

The hooks are inside the grant they bound, so by the estate's own test they are settings that read like boundaries, and the banner says so on every refusal. A boundary is the same `policy.py check` run by a party the agent cannot reach — a required CI status on the pushed ref — which is a change of location, not of policy.

## Findings the exercise produced

**1 · A test lane needs its own balance.** The first run of test B reported nothing at the eleventh commit, because acceptance-run events were excluded from the balance they were supposed to accumulate. The fix (`derive(…, test=True)`) gives the acceptance lane its own arithmetic; the real balance still ignores it. Recorded as the reason `--test` is two lanes and not a flag on one.

**2 · A commit can carry its own claim.** `pre-commit` may stage what it writes. The event for a commit lands in that commit; the push MVP's ledger, by contrast, lags one commit and is committed afterwards. The push event still lags, because it is written after the commit exists.

**3 · The escalation matcher is loose.** Test E's exhaustion found test A's escalation *already waiting* because both were the same unit and subject and A's amount covered E's. Correct for the room (one waiting escalation, not two) and worth tightening once escalations carry a `cause` (exclusion vs exhaustion), which is an `IE-C` for the implementing session.

**4 · The count pool draws on ordinary days.** Thirteen commits in a working session is unremarkable and it drew three from the commits pool. If a real week looks like the run, the draw-frequency card will say the normal band of ten is wrong, and the rating rule says to raise it — which is the loop working as designed, and the first thing the issuer will be asked to decide.

**5 · Reach before volume is the right order, and it is free.** The mandate check refused `main` before a byte was counted; chaining the sibling pack's hook cost one line.

## What is still true after this

- **The ledger is a folder in the repository**, not a vault and not a lane. Steps 2–4 make it a vault; step 7 makes it a lane.
- **Every acceptance in the run is self-accepted**, under the pilot relaxation, and named as two roles. The economics say a draw's acceptor must be the policyholder and the run says so; whether the hand was different is the key split's job.
- **The token meter ran once**, on this session's transcript, and appended nothing to the ledger: the Stop hook is step 5.
- **The pack's own commits** in this repository run through the same `pre-commit` from the moment it is installed here, and what they draw is on the real lane. [Change control](99__change-control.md) IE10 records what happened.

## What the pack's own publication drew

The hook was installed in this repository before the pack was committed, so the pack's publication is the first real-lane day on the ledger. Six natural units, in order, each measured by `pre-commit` as the whole size of every blob it added or changed:

| Commit | Bytes | Verdict | On the ledger |
|---|---|---|---|
| The documents (`src/`) | 126,179 | **drawn** 74,979 B | event, acceptor the estate |
| The tools, hooks, policies, acceptance ledger, room | 137,256 | **drawn** 86,056 B | event |
| The two briefs and their reader pages | 254,360 | **requested** → approved → **drawn** 203,160 B | request `2026-09-03T02-04-39Z__04375181`, decision `…02-05-44Z__1be46c34` |
| The pack's twelve reader pages and hub | 216,832 | **requested** → approved → **drawn** 165,632 B | request `…02-09-02Z__3197aed5`, decision `…02-09-02Z__b9f10977` |
| The wiring sources (`gen_packs.py`, both `llms.txt`, the two hubs, `insurance.json`) | **310,858** | **refused — an exclusion**, over the cap by 3,658 B | escalation `2026-09-03T02-09-05Z__c7278eae`, **waiting** |
| The badge rewrite (the last one; [T49](../../../admin/comms.html)) | ~4,000,000 | **refused — an exclusion** | waits on the same acceptance |

Pool after the four draws: 413,891 B of 943,718 B. The two requested draws were approved by the same session under the approver's hat, as the project lead allowed for the pilot on 3 September, and the decisions say so. **The two exclusions were not accepted by this session**: outside cover is a person's call, and the escalation waits. The wiring is preserved as [a patch on the branch](../pending/2026-09-03__wiring-awaiting-acceptance.patch) beside the request that waits — which is what a waiting request looks like in practice.

**Finding 6 — a one-line change to a large file costs the whole file.** The wiring commit is over the cap because the meter counts blobs, not diffs, and this estate's generators and front doors are large single files (`gen_documents.py` 142 KB, `versions.html` 167 KB). That is the case study's append-only finding arriving at commit time, and it is the first thing the issuer is asked to decide ([N30](../../../admin/comms.html)).

**Finding 7 — the operator's own mistake produced a wrong reading, and the matcher hid it.** The wiring was once staged on top of the briefs, so a reading of 784,174 B measured two units as one and wrote escalation `…02-04-40Z__37f7a0f5`. When the units were then measured alone, the loose matcher (finding 3) reported that escalation as *already waiting* for both, so neither got its own. The matcher now requires the same cause and the same amount for an escalation to count as waiting (IE-C1); the stale escalation was suspended with a note that itself names the wrong id (IE-C2), because a ledger file is never edited and the correction lives here.

## Honest tensions

| Tension | Note |
|---|---|
| A run in a scratch clone | Real git, real hooks, real refusals — and a remote that is a folder. Nothing on GitHub was refused |
| Random bytes as the payload | Incompressible, which the meter does not care about; the measurement is uncompressed sizes either way |
| Self-approval in the run | The workflow was exercised end to end; the acceptance means nothing as an acceptance and everything as a test |
| The exclusion at 300 KB | It refused a 400 KB file in a test and it will refuse a pack's generated pages in real work — which is loss data, not a defect |

---

*Built and run 3 September 2026. The log is the evidence; this page quotes it.*

*CC BY 4.0.*
