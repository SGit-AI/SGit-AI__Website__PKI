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

### IE10 — The pack's own publication was the first requested draw
**Source:** document 09.
**Status:** recorded there with the request and decision ids.

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
| IE-D15 | **Test events are visible, separate and excluded from the balance** | Document 07 | **Proposed** |

## Corrections

*None yet. The first `IE-C` will be a question the implementing session had to ask.*

---

*CC BY 4.0.*
