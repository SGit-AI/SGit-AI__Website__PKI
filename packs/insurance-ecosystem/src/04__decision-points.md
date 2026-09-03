# Decision Points: Thirty-Three Lifecycle Events, Four That Are Hooked, And The One That Refuses

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** Which events exist to hook, which are enforcement and which are instrumentation, why the git hooks and not the Claude hooks are the enforcement point, and what fails when a policy service is unreachable. Checked against the published settings schema and the hooks reference on 3 September.

---

## The events that exist

The published settings schema and the hooks reference give thirty-three hook events. The ones this pack cares about, and what each can do:

| Event | Fires | Can block? | This pack uses it as |
|---|---|---|---|
| `SessionStart` | Session begins, resumes, clears, compacts or forks (`matcher_value`) | No | **Instrumentation — the briefing.** stdout becomes context the session sees |
| `PreToolUse` | Before a tool runs; `tool_name`, `tool_input` (for Bash, `tool_input.command`) | **Yes** — exit 2, or JSON `permissionDecision: "deny"` | **Instrumentation with an advisory refusal** for `Bash(git commit *)` and `Bash(git push *)`: the same verdict the git hook will give, shown early |
| `PostToolUse` | After a tool succeeds | Yes (feedback) | Not used |
| `Stop` | The session finishes a turn; `stop_hook_active` guards recursion | Yes | **Instrumentation — the usage flush.** Sums the four token counters from `transcript_path` and appends a `tokens` event |
| `SessionEnd` | Session terminates | No — and all `SessionEnd` hooks share a **1.5 second** budget | Not used: too short for a vault write |
| `PermissionRequest` / `PermissionDenied` | A tool needs or is refused permission | Approval only | Not used |
| `SubagentStart` / `SubagentStop` | A subagent spawns or stops | Stop can block | Not used — per-subagent accounting is excluded |
| `PreCompact` / `PostCompact` | Context compaction | No | Not used; the transcript survives compaction and the meter reads the transcript |
| The other twenty-two | Setup, prompt expansion, batches, notifications, tasks, teammates, config, cwd, worktrees, model switches, elicitations | Various | Not used |

**And two events that are not Claude Code events at all**, which is the finding of this document:

| Event | Fires | Can block? | This pack uses it as |
|---|---|---|---|
| **git `pre-commit`** | Before the commit object is written; reads the index | **Yes** — non-zero exit | **Enforcement**: `bytes_per_commit`, `commits` |
| **git `pre-push`** | Before refs are sent; reads `<local ref> <local sha> <remote ref> <remote sha>` on stdin | **Yes** — non-zero exit | **Enforcement**: `branch` (the mandate), `bytes_per_push`, `pushes` |

## Why the git hooks refuse and the Claude hooks do not

The specification's three constraints: *refusal must come from outside the agent's reasoning loop; balance derivation never runs in the agent; silence below cover is a requirement.* A `PreToolUse` hook satisfies the first in one sense — it evaluates outside the loop — and fails it in another, which the platform documents:

> **`PreToolUse`: a timeout doesn't block the tool; the normal permission flow applies.**

So the platform **fails open**. An `http` hook that cannot reach its service lets the action through. That is correct for reporting and wrong for a draw: a draw whose balance cannot be derived is not a draw, it is an uninsured action. A Claude hook cannot express *fail closed*; a git hook can, because it is a script that owns its exit code. Hence the division ([IE-D4](99__change-control.md)):

| | Claude hooks (`SessionStart`, `PreToolUse`, `Stop`) | Git hooks (`pre-commit`, `pre-push`) |
|---|---|---|
| Role | Instrumentation, and an early copy of the verdict | **Enforcement** |
| On unreachable service | Proceed; queue the report locally | **Refuse a draw; proceed with a normal-band event; queue the report** |
| Tier | Setting — the settings file is inside the grant | Setting — `.githooks/` and `core.hooksPath` are inside the grant; `--no-verify` bypasses |
| Reaches boundary by | Cannot | The same policy evaluated by a required CI check or a host push rule |

**Both are settings.** This pack does not claim otherwise, and every refusal banner says so on its face, as the two enforcement points before it did (GM-D42, GM-D100). The ladder to a boundary is a change of *where* the same evaluator runs, and its first rung above the hook is a CI status that runs `tools/policy.py` on the pushed ref.

## The four decision points, in a session's lifetime

```
   SESSION START ──▶ briefing        (SessionStart hook · policy.py briefing · stdout → context)
        │
        │  ordinary work: nothing is said, nothing is written    ← silence below cover
        │
   git commit ─────▶ pre-commit      (policy.py check --point pre-commit · refuses by exit code)
        │               ├ normal   : a countable event is appended (commits), nothing printed
        │               ├ drawn    : the draw is appended with the policyholder as acceptor; one line printed
        │               ├ requested: a request/v1 is written; the commit is REFUSED until a decision exists
        │               └ refused  : the commit is refused; an escalation request is written; the banner says why
        │
   git push ───────▶ pre-push        (mandate.py pre-push → policy.py check --point pre-push)
        │               ├ branch outside the mandate : refused (reach, not volume)
        │               └ then the same four verdicts on bytes_per_push and pushes
        │
   TURN ENDS ──────▶ Stop hook       (usage.py --append · four counters from the transcript · a tokens event)
```

The `PreToolUse` hook on `Bash(git commit *)` and `Bash(git push *)` runs `policy.py check --dry-run` and returns the verdict as `permissionDecisionReason`. It **denies** only on `refused` or `requested` — the same outcome the git hook would give a second later — so the session hears the reason from the platform rather than from a stderr it might not read. It is advisory in the sense that removing it changes nothing about what git will do.

## The hook definitions

Project-level, in `.claude/settings.json`, which the settings reference says is honoured and merged with the user's own. **Whether a user must approve project hooks is not documented**; the implementing session records what it observes.

```json
{
  "hooks": {
    "SessionStart": [ { "hooks": [ { "type": "command",
        "command": "python3 packs/insurance-ecosystem/tools/policy.py briefing --from-hook" } ] } ],
    "PreToolUse": [ { "matcher": "Bash", "if": "Bash(git commit *)", "hooks": [ { "type": "command",
        "command": "python3 packs/insurance-ecosystem/tools/policy.py hook-pre-tool-use" } ] },
      { "matcher": "Bash", "if": "Bash(git push *)", "hooks": [ { "type": "command",
        "command": "python3 packs/insurance-ecosystem/tools/policy.py hook-pre-tool-use" } ] } ],
    "Stop": [ { "hooks": [ { "type": "command",
        "command": "python3 packs/insurance-ecosystem/tools/usage.py --from-hook --append", "timeout": 20 } ] } ]
  }
}
```

The git side is two files and one config line:

```
   .githooks/pre-commit   →  python3 packs/insurance-ecosystem/tools/policy.py check --point pre-commit
   .githooks/pre-push     →  python3 packs/grant-and-mandate/tools/mandate.py pre-push  (branch)
                             python3 packs/insurance-ecosystem/tools/policy.py check --point pre-push --branch <ref>
   git config core.hooksPath .githooks
```

The last line is local and **does not travel with a clone** — the sibling pack found this on its second library entry, and it is the same one-command-away absence here. The briefing prints whether the hooks are installed, so a session that starts without them is told.

## The `http` variant, for anything real

The schema allows `type: "http"`: the same JSON the command hook receives is POSTed to `url`, with `headers` interpolating only variables named in `allowedEnvVars`, and the response body is read in the same shape a command hook would print. Two consequences for this design:

- **The decision can move off the machine** — a service holding the authoritative ledger evaluates and answers — and that is the property the specification wanted, *because the script on the machine can be edited by whatever it is policing*.
- **But the refusal cannot**, for the reason above. So the real design puts the service **behind the git hook**: `policy.py check --service <url>` posts the reading, receives the verdict, and when the service is unreachable applies the fail-closed rule locally. The Claude `http` hook can carry the briefing and the usage report — instrumentation, where failing open is right.

For the pilot: **local script**, offline, no availability risk, ledger in a folder. That is the specification's own recommendation and the inventory found no reason to depart from it.

## What this does not prove

- **That a hook is a boundary.** It is not, and the banner says so.
- **That `PreToolUse` sees every commit.** A commit made by a subagent, by a script the session wrote, or from a tool other than Bash is seen by git and not by the Claude hook. That is why the git hook is the enforcement point and the Claude hook is the courtesy.
- **That the transcript is the right meter for tokens.** It is the one that exists; its counters are undocumented; and a hook receives no usage fields of its own.
- **That project-level hooks run without a prompt.** Not documented; to be observed and recorded.

---

*CC BY 4.0.*
