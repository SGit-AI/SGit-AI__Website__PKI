# Change Control

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** Every correction and every decision, in the discipline this estate uses: the pack supersedes rather than rewrites, and what a later reading changes is recorded here rather than folded silently into the documents above. Decisions are `IE-D`, corrections `IE-C`; the estate-wide register in the sibling pack is `GM-D`, and this page cites it rather than renumbering it.

---

## The rule this page implements

A claim, once published, is not edited. If it is wrong or overtaken, an entry here supersedes it and says so. Read this page **second** if you are about to build from documents 00–08, so you read them with the errata in hand; **last** if you are reading the pack through. Never not at all. And **an implementing session that has to ask a question files it here as an `IE-C`** with the answer it took, so the pack is amended rather than the question answered in chat.

## What the specification settles (inherited, not argued)

### IE1 — The ledger is an append lane, not a shared vault
**Source:** the pack specification (v0.33.62, fourth of 26 August), from the 19 August lane brief (v0.33.60).
**The rule:** a write key grants configure and purge, so an insured that records its own usage with a write key can delete it; an append token grants write and a blind acknowledgement and nothing else. Design: the lane. Pilot: a folder of files only ever added, in a vault whose history detects a rewrite (IE-D3).
**Status:** adopted (document 02).

### IE2 — Hook types include `http`, and the refusal stays in the git hook
**Source:** the specification; the published settings schema; the hooks reference.
**The rule:** `http` moves the *decision* off the machine. But `PreToolUse` fails open on timeout, so the *refusal* cannot live in a Claude hook; it lives in `pre-commit`/`pre-push`, which fail closed for a draw (IE-D4).
**Status:** adopted, and sharpened by the inventory (document 04).

### IE3 — Token usage has four counters, and the obvious one is wrong
**Source:** the specification (562 vs 91,336,787); re-measured here (68,356 vs 721,095,334).
**The rule:** four counters, never one; the dominant one measures duration; no band until a working day is measured.
**Status:** adopted (document 03, `tools/usage.py`).

### IE4 — June and August use *mandate* for opposite things; August governs
**Source:** the specification; the 18 June naming brief, read in full.
**Status:** adopted as IE-D9 — a decision, taken provisionally, the project lead's to reverse.

### IE5 — The economics are settled and not reopened
**Source:** the architecture brief (v0.33.62, third of 26 August).
**What is taken:** premium in allocation; pooling; correlation and the reserve; experience rating on the team; a draw as an acceptance event whose acceptor is the policyholder; recorded by default, requested above a threshold, silent overflow forbidden; draw frequency over balance; three zones with outside = uninsured = escalate; recoverability decides insurability; units the system already counts; the ledger generic on unit; the rate table needs an owner; a vulnerability is a repricing event with three responses.
**Status:** implemented, each in a named document (leading brief, table).

## What the project lead's instruction changes

### IE6 — The pilot relaxes the parties: one key, one session, every role
**Source:** the project lead, 3 September 2026, in chat (quoted in full in the leading brief).
**The rule:** for now, any session holding a vault key may run any role in any vault; integrity is deferred, not dropped; sgit's append-only history is the detector; the workflows — including running out and being uninsured — are what is being figured out.
**What it changes:** document 05 (roles as runbooks, prevention deferred), document 02 (a folder for the lane, one key set), document 06 (the same session may ask and answer, under two hats, saying so).
**What it does not change:** any file shape, folder name or workflow step (IE-D3).
**Status:** adopted.

## What the pack's own construction added

### IE7 — There is no board application, and the messaging vault is a lane
**Source:** the inventory (document 10, items 1 and 2).
**Consequence:** the room is a vault app; it reuses the skeleton and nothing else; the request thread is a folder (IE-D1).

### IE8 — The platform fails open on `PreToolUse` timeout
**Source:** the hooks reference, read 3 September.
**Consequence:** the git hooks are the enforcement point; the Claude hooks are instrumentation (IE-D4). This is the finding that most changed the design from what the specification imagined.

### IE9 — A commit can carry its own claim
**Source:** building step 1.
**The finding:** a `pre-commit` hook may `git add` the event it writes, so the event lands in the very commit it describes and the ledger never lags a commit — which the push-policy MVP's ledger does. The push event still lags (it is written after the commit exists) and is carried by the next commit.
**Status:** implemented in `tools/policy.py`; recorded in document 09.

### IE10 — The pack's own publication was the first real-lane day
**Source:** document 09, *What the pack's own publication drew*.
**What happened:** six natural units; two drawn (74,979 B and 86,056 B); two requested above the 200 KB threshold and approved under the approver's hat as the project lead allowed for the pilot (the briefs, 254,360 B → 203,160 B drawn; the pages, 216,832 B → 165,632 B drawn); two refused as exclusions and **not** accepted by the session — the wiring sources at 310,858 B, over the cap by 3,658 B, and the badge rewrite at about 4 MB. Escalation `2026-09-03T02-09-05Z__c7278eae` waits for a person. The wiring is preserved as `pending/2026-09-03__wiring-awaiting-acceptance.patch`.
**Status:** recorded; the issuer's decision on the per-commit cap against this estate's large files is N30.

### IE11 — Memo 13 arrived after the pack was published, and it names the ladder the pack was climbing
**Source:** the project lead's voice memo of 3 September ([brief v0.33.85](../../../briefs/v0.33.85__strategy-brief__the-enforcement-ladder-six-levels-a-measured-assurance-and-a-catch-above-the-hook-is-an-incident.md), [doctrine 13](../../../insurance/the-enforcement-ladder.html)), recorded before the pack was read.
**What it adds:** six levels of enforcement on the three tiers, with detection as a fourth; assurance per level as a measured quantity; a catch above the hook as an incident class; and out-of-band reconciliation as the control the pack lacked. **What was built the same day:** policy revision r2 (the `layers` block, `files_per_commit`), a `level` on every event and a `caught` verdict, `tools/reconcile.py`, the destination check in report mode, the room's sixth card, and the queue that ends the dirty-tree loop.
**Status:** adopted into documents 01, 03, 04, 05, 06, 07 and 08 by appended sections; nothing above them was rewritten.

## The decisions register

| # | Decision | Source | Status |
|---|---|---|---|
| IE-D1 | **The room is a vault app** in the estate's shipped pattern; no board application exists to reuse; what is new is five cards and one briefing | Inventory 1, 10 · Q1, Q10 | **Proposed** |
| IE-D2 | **Policies live in a new vault**, `insurance-policies`, one folder per subject, one dated file per version, `current.json` a pointer; not the risk product (instance, referenced by hash) and not the credential store | Q2 | **Proposed** |
| IE-D3 | **The pilot changes where things run, never what they say.** Every file shape and workflow step is the lane's and the key split's; the folder stands in for the lane; turning integrity on is a location change | IE6 | **Proposed — the constraint that keeps the relaxation honest** |
| IE-D4 | **The git hooks refuse; the Claude hooks instrument.** `pre-commit`/`pre-push` fail closed for a draw when the balance is unknowable; `SessionStart`/`PreToolUse`/`Stop` carry the briefing, an advisory verdict and the usage flush; any service sits behind the git hook | IE2, IE8 · Q3, Q4 | **Proposed** |
| IE-D5 | **Six roles as runbooks**: issuer, policyholder, insured, approver, maintainer, auditor; the estate is the policyholder; the RiskMandate team is not a party; in the pilot one session may run any | Q5, IE6 | **Proposed** |
| IE-D6 | **No anchors means no writers, assumed**; one anchor per session registered; to be confirmed by one write at step 7 and recorded either way | Inventory 9 | **Proposed — an assumption, and marked as one** |
| IE-D7 | **Drain at least daily; retention: lane empty after drain, ledger forever, room two derivations**; the room's STALE banner watches the drain | Q6 | **Proposed** |
| IE-D8 | **The first policy's units and numbers**: `bytes_per_commit` 50 KB / 300 KB exclusion / 1 MB; `commits` 10 / 1 / 20; the push MVP's bands; `branch` from the mandate; requested above 200 KB; reserve 10 %; tokens measured, unbanded | Q7 · memo 12 | **Proposed — placeholders until the ledger re-fits them (GM-D101)** |
| IE-D9 | **`mandate` is the narrow thing; August governs.** `grant` is the union; *Authority Envelope* a prose synonym, never a field; *Blast Radius* the consequence; power of attorney the analogy | Q9 · the June naming brief | **Proposed — a naming decision belonging to the project lead, taken provisionally on the specification's recommendation** |
| IE-D10 | **The issuer owns the rate table**, which stays unpublished; the evaluator never converts between units | Q8 | **Proposed** |
| IE-D11 | **The first refusal is a 400 KB commit refused by `pre-commit`**, shown to the project lead with git's output | Q11 · document 09 | **Done** |
| IE-D12 | **A `pre-commit` hook stages the event it writes**, so a commit carries its own claim; the push event lags one commit | IE9 | **Done** |
| IE-D13 | **Outside cover writes an escalation, not only a refusal**; the answers are accept-as-uninsured (never touching the pool) or suspend; an accepted-uninsured action is recorded as `accepted_outside` | The architecture brief's third zone | **Proposed** |
| IE-D14 | **A supersession must be re-accepted** by the policyholder; until then the room shows *awaiting acceptance* and cover continues under the old terms only inside the old interval | W7 · June's interval rule | **Proposed** |
| IE-D15 | **Test events are visible, separate and excluded from the balance**, and the acceptance-run lane has its own balance so a run can see its own accumulation | Document 07, document 09 finding 1 | **Proposed** |
| IE-D16 | **The session never accepts an action outside cover.** A requested draw inside the pool may be approved under the approver's hat in the pilot; an exclusion or an exhausted pool waits for a person, and the refused change is preserved beside the request as a patch | Document 09, *what the pack's own publication drew* | **Proposed — the line the pilot relaxation stops at** |
| IE-D17 | **Every event carries its level of enforcement (0–5)**, derived from its point when absent; a policy may name its `layers` with tier, consequence and buffer | Memo 13 §1 · GM-D104 | **Proposed** |
| IE-D18 | **Assurance per level is derived from the ledger**, as a catch rate on ordinary work, and shown in the room; never typed | Memo 13 §2 · GM-D105 | **Proposed** |
| IE-D19 | **A catch above the hook is an incident**: the verdict `caught` belongs to levels 4 and 5, never draws, always escalates, and is answered by an explanation accepted or a suspension, never by an approval | Memo 13 §3 · GM-D106 | **Proposed** |
| IE-D20 | **Reconciliation is the maintainer's job**, run at least daily and by CI in report mode; a commit with no claim, or a claim that disagrees with the commit's weight, is a catch dated to the commit | Memo 13 §4 · GM-D107 | **Proposed — built and run; eleven commits, no catch** |
| IE-D21 | **The destination check ships in report mode.** Making `policy-report.yml` a required check that refuses is the issuer's decision (N31); the day it is, a refusal there is a catch | Document 04 | **Proposed** |
| IE-D22 | **The git pilot policy was superseded, not edited**, to carry the layers and `files_per_commit`; the re-acceptance was made under the pilot relaxation by the same session, and says so | Document 03 · IE-D14 | **Done** |
| IE-D23 | **The limits were raised for now, by the issuer, on the ledger's first day** — bands ×4 (200 KB normal per commit and per push), the exclusion at the vendor's recommended maximum file size (1 MB), pools ×4 (4 MB per day), counts ×2 — by supersession to `git-pilot-2026-09-03-r3` and a revision recorded inside the push policy's own file; to be reviewed against the ledger. The first re-fit from loss data (GM-D101): one pack's publication drew a whole pool, a one-line change to a large generator costs the whole file, a release weighs 250–300 KB | The project lead, 3 Sep, in chat | **Done — placeholders still, now with a day behind them** |

## Corrections

### IE-C1 — An escalation is *already waiting* only for the same cause and the same amount
**Found:** document 09, finding 7. The first matcher treated any waiting escalation on the same unit whose amount covered the new reading as the same escalation, so two different refusals (784,174 B and 310,858 B; then 216,832 B measured alone) shared one, and the second and third never got their own.
**Change:** `request/v1` carries `cause` (`exclusion` | `exhausted`); `waiting_request` matches an escalation on unit, cause **and** amount; a draw request still covers any smaller reading. `tools/policy.py`, 3 September.
**Status:** done.

### IE-C2 — A decision note names the wrong id, and the ledger is not edited to fix it
**Found:** decision `2026-09-03T02-06-11Z__5489fd4e` suspends the stale 784,174 B escalation and says the true reading for the pages alone is escalation `…37f7a0f5` — the stale one itself, because under the first matcher no new escalation had been written. The true readings are 310,858 B (the wiring, escalation `…c7278eae`) and 216,832 B (the pages, a requested draw, approved).
**Change:** none to the ledger — files are only ever added. The correction is this entry, and document 09 carries it.
**Status:** recorded.

### IE-C8 — The push record precedes the push, through a queue
**Found:** IE9 and IE-C6: a push check runs after the commit it measures exists, so its entry was the one uncommitted file after every push, forever.
**Change:** `check.py` writes to `ledger.queue.jsonl` and the pack's `pre-push` point writes to `ledger/queue/`, both ignored by git; the next commit's `pre-commit` hook (and `policy.py drain`) moves them into the tracked ledgers and stages them, so the commit carries the previous pushes' records and the tree is clean after a push. Balances read the queue too, so nothing is missed in between.
**Status:** done.

### IE-C7 — A script that pushes must check that the commit happened
**Found:** the v0.1.67 release. The release commit came back as a requested draw and did not happen; the operator's script pushed anyway, sent nothing new to the branch (spending push 10 of 10 for 0 B) and sent the previous, non-release commit to `dev`, where it failed the same validate check. Two runbook lines: **check the commit's exit before any push**, and **never chain a `dev` push after a commit that can be refused**.
**Status:** recorded; the runbook in document 06 is amended by this entry.

### IE-C6 — The push-policy ledger is paperwork too, and it moved a reading
**Found:** the v0.1.67 release. IE-C4 excepted the pack's `ledger/` from the meter; `insurance/push-policy/ledger.jsonl` is the other ledger in this repository, is not under that path, and gained two lines between a request and its commit, moving the reading from 244,808 B to 245,386 B and voiding the decision. The release was re-requested and re-decided at the new reading.
**Change:** none to the meter yet. The two ledgers are one subject for N30: either the push-policy MVP's ledger folds into the pack's, or the meter excepts both. Until then the rule is IE-C5's: nothing is staged after a decision.
**Status:** recorded.

### IE-C5 — An acceptance is of a reading, and nothing is changed after it
**Found:** the same release commit. After the first acceptance (4,461,039 B) the operator added the IE-C4 fix and its correction to the commit, the reading moved to 4,511,911 B, and the hook refused again because a decision covers a reading only up to the amount that was accepted. The acceptance was re-recorded on the new escalation (`2026-09-03T03-16-00Z__8c7fcd4f`) in the project lead's same words, and the commit was made with nothing further added.
**Rule:** once a person has accepted a reading, the commit is made as read. A correction found in the meantime is the next commit. The bound is deliberate: an acceptance of *the release* without an amount would cover a forty-megabyte commit as readily as a four-megabyte one.
**Status:** recorded; no code change.

### IE-C4 — The ledger's own files are never weighed
**Found:** the release commit of 3 September. The escalation for the 4,461,039 B rewrite was accepted, the decision file was staged into the same commit, and the retry read 4,462,511 B — larger than the accepted amount by the size of the decision and the escalation themselves — so it was refused again and wrote a second escalation (`2026-09-03T03-15-03Z__76196baf`, suspended with a note).
**Change:** `staged_bytes` skips every path under `ledger/`. A commit's claim, request and decision are the paperwork of the reading, not part of it.
**Status:** done; the second escalation stands suspended, and this entry is the correction.

### IE-C3 — The dry run said *has been written* about files it did not write
**Found:** `check --dry-run` printed the request and escalation paths as written. Nothing is written in a dry run.
**Change:** the wording is now *would be written* under `--dry-run`.
**Status:** done.

---

*CC BY 4.0.*
