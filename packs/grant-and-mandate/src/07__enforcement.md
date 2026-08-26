# The First Compiled Mandate: A Push Refused By Something That Is Not The Agent — And The Control That Then Blocked Its Own Release

**pack** Grant and Mandate · draft-1 · 26 August 2026
**role** Build-order step 1, built and tested. What was made, what it refused, what tier it actually reached, and the two findings the exercise produced that no diagram would have — including the one where the control blocked the release that was carrying it.

---

## What was built

Three files, and the smallest one is the point.

| File | What it is |
|---|---|
| `mandates/mandate-v1.json` | A mandate document in [document 02](02__schemas.md)'s schema: issuer-signed, interval-bearing, allow-list stored, prohibitions generated from its complement and dated |
| `tools/mandate.py` | Issue, verify, `check-branch`, `delta`, and the hook entry point. **Default-deny**: missing, unparseable, mis-signed or expired all refuse |
| `.githooks/pre-push` | The enforcement point. Git runs it; it refuses by exit code |

The mandate was deliberately authored **narrower than the measured grant**: it permits pushes to `claude/**` and nothing else, while [the library entry](../library/claude-code-remote__ccr-container__2026-08-26.json) records (node n3, `observed`) that the environment can also push to `dev` — the branch that deploys a public site. So the branch-scoped delta is non-empty and specific:

```
branch-scoped delta, mandate v1 vs measured grant node n3
  grant   (measured, tier=expectation): can push to ['claude/…', 'dev']
  mandate (declared)                   : permits ['claude/**']
  EXCESS AUTHORITY                     : ['dev']
     acceptor: none. This is the exposure the hook closes.
```

## The acceptance test, run

> *Run the skill in a fresh environment. It produces a dated grant document nobody wrote. Author a mandate that is deliberately narrower. The delta is non-empty and specific. Compile one line of it into the existing hook. **Then attempt the prohibited action and be refused by something that is not the agent.***

Executed 26 August 2026. `git push origin HEAD:dev`:

```
  ┌─────────────────────────────────────────────────────────────┐
  │  PUSH REFUSED BY A MANDATE                                  │
  └─────────────────────────────────────────────────────────────┘

  ✗ dev  is not permitted by mandate v1
    permitted branches: claude/**
    mandate expires   : 2026-12-31T00:00:00Z

  What you agreed to:
    · will not push to any branch of this repository outside claude/**
    · will not push to any other repository
    · will not act on any resource other than github.com/SGit-AI/…
    (rendered 2026-08-26 over capability set v0)

error: failed to push some refs to 'https://github.com/SGit-AI/…'
```

`origin/dev` was unchanged afterwards, and a push to `claude/**` in the same minute succeeded. **The last line is the whole thing: `error: failed to push some refs` is git's, not the agent's.** The agent did not decide to comply; it was refused by a process that ran outside its turn and returned a non-zero exit code it does not get to argue with.

## The tier it actually reached, stated honestly

The permissions brief predicted this fix moves the constraint *from tier three to tier two*, and that is exactly where it landed — **not** to a boundary:

| | Before | After |
|---|---|---|
| Where the constraint lives | A sentence in the session's instructions | A signed mandate, evaluated by a hook git runs |
| Tier | **Expectation** | **Setting** |
| Bypass | Ignore the sentence | `git push --no-verify`, or `git config --unset core.hooksPath`, or edit the hook |

**The hook is inside the grant it bounds.** The agent runs as a user that can write `.githooks/pre-push`, so by the pack's own test — *a control bounds a grant only when it is enforced by something the grant does not include* — this is a setting that reads like a boundary, which is the exact tier the pack warns is most often mislabelled. The refusal banner says so on its own face, because a control that overstates itself is worse than none.

**Reaching a boundary is the same allow-list, evaluated where the agent cannot reach it**: a branch protection rule on the remote, or a required CI check. That is a one-line change of *location*, not of policy — which is the argument for keeping the policy in a document rather than in the enforcement point.

## Two design choices, and why

**The hook reads the mandate at runtime; it does not compile a copy.** The brief's diagram says *compiled to*, and a literal compilation would bake the allow-list into the hook — where it would drift from the mandate exactly as a stored delta goes stale the moment either side moves ([document 02](02__schemas.md)). Reading the signed document at push time means there is one policy, and amending it is amending the mandate.

**Default-deny, and it bites.** A missing, unparseable, unsigned, mis-signed, issuer-mismatched or expired mandate all refuse the push. That is the adopted Cedar discipline and it has a real cost: delete the mandate and nothing can be pushed until it is restored (or `--no-verify`). A control that fails open is not a control, so the cost is the correct one to pay.

## Finding 1 — the control blocked the release that was carrying it

Within an hour of installing it, the hook refused the release push that would have published this document. **Which is the control working, not failing** — and the interesting part is what the correct remedy was.

Not `--no-verify`. Not editing the hook. **The issuer amended the mandate**, because the authority to push to `dev` genuinely exists: the project lead granted it explicitly on 25 August — *"you should push to dev branch to trigger the ci pipeline"*, and *"It is ok to do that on this first mvp stage"*. Mandate v1 was narrower than the real authorisation, so v1 was **wrong**, and the fix was to make the document match the decision that had actually been made:

```
   v1  allow: claude/**              -> refuses dev
   v2  allow: claude/**, dev         -> supersedes v1, cites the instruction
       expires 2026-12-31            -> and the MVP stage is what it is scoped to
```

That sequence — *issue → refuse → discover the mandate was wrong → amend, with a citation and an interval* — is what a mandate is **for**, and it is only visible because the constraint was mechanical. An expectation that was too narrow would have been silently ignored and nobody would have learned anything. **The refusal is what forced the authorisation to be written down.**

## Finding 2 — the measurement caught the tier change on its own

[`tools/measure.py`](../tools/measure.py), run in the same environment after the hook was installed, independently reported node n4 as `setting` where the [26 August entry](../library/claude-code-remote__ccr-container__2026-08-26.json) recorded `expectation` — because the tool probes `core.hooksPath` rather than being told what to say.

That is the drift mechanism from [document 03](03__library.md) working in the direction the table calls *somebody improved something, and it should be recorded* — demonstrated by accident, on the first re-measurement, one commit after the improvement. The alarming direction (`setting → expectation`, a control removed while nothing broke) is the same diff read the other way, and it now has a working detector.

## What is still true after this

**The authority is a fixture and the enforcement is not.** The mandate's issuer is the registry's operator root, whose private half is published — so anybody could forge this mandate, and the hook would enforce the forgery just as diligently. The two halves are independent: *a hook enforcing a fixture-signed mandate is real enforcement of an unaccountable instruction.* Closing that half needs a real issuer key, which is the [enrolment path](../../registry/index.html) the registry already ships and nobody has walked yet.

**Nothing here is Cedar.** The allow-list is evaluated by fifty lines of Python, not by the adopted policy language. That is step 6 of the build order and it is what makes the mandate evaluable by something with a specification behind it; this step proves the shape, not the engine.

**And it is one constraint.** Branches, on one repository, for one subject. The nine other nodes in the measured grant have no mandate at all.

## Honest tensions

| Tension | Note |
|---|---|
| A setting that reads like a boundary | It is a real improvement and it is bypassable in three ways; the banner says so, and saying so is what stops it being believed |
| Default-deny | Correct, and it means a broken mandate file stops all work until fixed |
| The issuer is a fixture | The enforcement is real regardless, which is precisely why the two halves must be reported separately |
| Amending the mandate to unblock a release | It is the designed path and it will look, to a sceptic, exactly like moving the goalposts — which is why the amendment cites the instruction and carries an interval |
| Runtime read over compilation | No drift, and it means the enforcement point depends on a file being present and parseable at push time |

---

*Added to the pack after documents 00–06, 26 August 2026. Nothing above them was rewritten; [document 03](03__library.md) and [document 06](06__mvp.md) carry dated pointers to this one, and the change-control appendix records what it settles.*

*CC BY 4.0.*
