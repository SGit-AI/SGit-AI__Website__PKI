# 10 · A push refused by something that is not the agent

*Part three — What was built*

---

Everything in Parts one and two is documents. This chapter is the one place where the estate stopped describing and made something say no.

The acceptance test was written before it was run, and its last clause is the whole thing:

> Run the skill in a fresh environment. It produces a dated grant document nobody wrote. Author a mandate that is deliberately narrower. The delta is non-empty and specific. Compile one line of it into the existing hook. **Then attempt the prohibited action and be refused by something that is not the agent.**

*Stated.* Refused by something that is not the agent. Not *decline to proceed*, not *ask for confirmation*, not *comply with its instructions*. Refused, by a different process, returning a result the agent does not get to argue with.

## Three files, and the smallest is the point

| File | What it is |
|---|---|
| `mandates/mandate-v1.json` | A mandate document: issuer-signed, interval-bearing, allow-list stored, prohibitions generated from its complement and dated |
| `tools/mandate.py` | Issue, verify, `check-branch`, `delta`, and the hook entry point. **Default-deny**: missing, unparseable, mis-signed or expired all refuse |
| `.githooks/pre-push` | The enforcement point. Git runs it; it refuses by exit code |

The mandate was authored deliberately narrower than the measured grant. It permitted pushes to `claude/**` and nothing else, while Chapter 9's library entry records at node n3, evidence class `observed`, that the environment can also push to `dev` — the branch that deploys a public site.

So the delta is non-empty and specific:

```
branch-scoped delta, mandate v1 vs measured grant node n3
  grant   (measured, tier=expectation): can push to ['claude/…', 'dev']
  mandate (declared)                   : permits ['claude/**']
  EXCESS AUTHORITY                     : ['dev']
     acceptor: none. This is the exposure the hook closes.
```

One row. One branch. That is the entire scope of the only real enforcement in this estate, and stating it that small is deliberate.

## The refusal

**Figure 8 · The refused push, re-run at v0.1.28.**
*The last line before the banner is git's exit code, not the agent's decision. Read the Tier line at the bottom: the control names its own weakness on its own face.*

```
$ git worktree add --detach /tmp/hist-v0.1.28 v0.1.28   # the site as it was
$ python3 …/mandate.py check-branch dev …/mandates/mandate-v1.json
REFUSED  dev  (mandate v1 permits ['claude/**'])
$ echo $?
1

  ┌─────────────────────────────────────────────────────────────┐
  │  PUSH REFUSED BY A MANDATE                                  │
  └─────────────────────────────────────────────────────────────┘

  ✗ dev  is not permitted by mandate v1
    permitted branches: claude/**
    mandate expires   : 2026-12-31T00:00:00Z

  What you agreed to:
    · will not push to any branch of this repository outside claude/**
    · will not push to any other repository
    · will not act on any resource other than github.com/SGit-AI/SGit-AI__Website__PKI
    (rendered 2026-08-26 over capability set v0 (registry/capabilities.json))

  This refusal came from .githooks/pre-push, which git ran — not
  from the agent deciding to comply. That is the whole point.

  Mandate : packs/grant-and-mandate/mandates/current.json
  Issuer  : resolves to a record in the public registry
  Tier    : SETTING — this hook is inside the grant it bounds, so
            --no-verify still gets past it. A boundary needs the
            same allow-list evaluated where the agent cannot reach
            it (branch protection, or a required CI check).
```

When the acceptance test was originally run on 26 August, the last line of the real session was git's own:

```
error: failed to push some refs to 'https://github.com/SGit-AI/…'
```

`origin/dev` was unchanged afterwards, and a push to `claude/**` in the same minute succeeded.

**That last line is the whole thing.** `error: failed to push some refs` is git's sentence, not the agent's. The agent did not decide to comply. It was refused by a process that ran outside its turn and returned a non-zero exit code it does not get to argue with.

*Drawn.* I want to be precise about what changed, because it is smaller and stranger than "the agent was stopped". Nothing prevented the agent from *attempting* the push. Nothing detected an intention. What changed is that the attempt now terminates in a result rather than in a choice — the branch name is compared against a list by fifty lines of Python, and the comparison happens whether or not the agent is behaving well, whether or not it read its instructions, whether or not it wants to. The distinction between a control and an expectation is not about strength. **It is about whether the outcome depends on the agent's state.**

## The figure that could not be taken as specified

The commissioning brief asked for this figure to be photographed at v0.1.28 — the release where the acceptance test ran. That instruction turned out to be impossible to follow literally, and the reason is a finding rather than an obstacle.

**The worktree at `v0.1.28` ships mandate v2, not v1.** Its `current.json` permits `dev`. Run the tag's own hook against the tag's own current mandate and it does not refuse:

**Figure 8b · The same tag, the mandate the release actually ships.**
*The same tag, the same command, the mandate the release actually ships — and it PERMITS. The release documenting the refusal cannot contain the state that produced it, because the control refused the release carrying its own documentation until the mandate was amended.*

```
# the SAME tag, the SAME command, against the mandate v0.1.28 ships:
$ python3 …/mandate.py check-branch dev …/mandates/current.json
PERMIT   dev  (mandate v2, allow=['claude/**', 'dev'], expires 2026-12-31T00:00:00Z)
```

Why? Because of the next section. The hook refused the release that was carrying its own documentation, and the mandate had to be amended before that release could be pushed at all. **The tag that documents the refusal cannot, by construction, contain the state that produced it.**

So Figure 8 was taken by running the tag's own tool and the tag's own hook against `mandate-v1.json`, which is present at that tag — the document that actually did the refusing — and Figure 8b prints the amended answer beside it. The commissioning brief's own rule covers this case: where a command's output has changed since it was first recorded, print both and say which is which. Both are printed above.

*Drawn.* This is the sharpest thing the time-travel discipline caught, and it is a general hazard rather than a quirk of this estate. **A release note describing an event is not evidence that the release contains the event's preconditions** — and when the event is a control firing, the successful remediation is very likely to have removed them, because that is what remediation is. Any estate that documents its own controls firing has this problem. Chapter 15 records it as a contradiction; it is really a structural feature of recording your own corrections.

## The finding that justifies the whole exercise

Within an hour of installation, the hook refused the release push that would have published its own documentation.

**Which is the control working, not failing** — and the interesting part is what the correct remedy was.

Not `--no-verify`. Not editing the hook. Not a temporary exception. **The issuer amended the mandate**, because the authority to push to `dev` genuinely existed: the project lead had granted it explicitly on 25 August, in words the amendment cites — *"you should push to dev branch to trigger the ci pipeline"*, and *"It is ok to do that on this first mvp stage"*.

Mandate v1 was narrower than the real authorisation. So v1 was **wrong**, and the fix was to make the document match the decision that had actually been made:

```
   v1  allow: claude/**              -> refuses dev
   v2  allow: claude/**, dev         -> supersedes v1, cites the instruction
       expires 2026-12-31            -> and the MVP stage is what it is scoped to
```

The pack states what that sequence is worth:

> That sequence — *issue → refuse → discover the mandate was wrong → amend, with a citation and an interval* — is what a mandate is **for**, and it is only visible because the constraint was mechanical. An expectation that was too narrow would have been silently ignored and nobody would have learned anything. **The refusal is what forced the authorisation to be written down.**

*Stated,* and it is the best argument in the estate for mechanical constraints over written ones. Not that they stop bad things — this one stopped a good thing. That they **force a decision that was previously implicit to become explicit and dated.** Before the refusal, the authority to push to `dev` existed only as a sentence in a chat log. After it, it exists as a signed document with an interval, citing its source.

*Drawn.* And the estate names the risk in this without quite resolving it, so I will state it plainly: **amending a mandate to unblock your own release looks exactly like moving the goalposts**, and no amount of citation makes the two shapes different from the outside. The mitigation the estate uses is that the amendment carries the instruction it relies on and an expiry. That is the right mitigation and it is not proof. What would distinguish the two cases is an issuer who is not the subject — and in this estate the issuer is a fixture root controlled by the same party. The honest position is that this sequence is *what the designed path looks like*, and that nothing structural currently prevents the undesigned one from looking identical.

## Two design choices, and why

**The hook reads the mandate at runtime; it does not compile a copy.** The brief's diagram says *compiled to*, and a literal compilation would bake the allow-list into the hook, where it would drift from the mandate exactly as a stored delta goes stale. Reading the signed document at push time means there is one policy, and amending it is amending the mandate. Chapter 5's rule, applied to an enforcement point.

**Default-deny, and it bites.** A missing, unparseable, unsigned, mis-signed, issuer-mismatched or expired mandate all refuse the push. The hook is default-deny on its own dependencies too: if `python3` or the `cryptography` package is absent, it refuses rather than waving the push through, and says so. The cost is real — delete the mandate and nothing can be pushed until it is restored. A control that fails open is not a control, so the cost is the correct one to pay.

## The tier it actually reached

Stated by the pack rather than claimed, and it landed exactly where the source brief predicted:

| | Before | After |
|---|---|---|
| Where the constraint lives | A sentence in the session's instructions | A signed mandate, evaluated by a hook git runs |
| Tier | **Expectation** | **Setting** |
| Bypass | Ignore the sentence | `git push --no-verify`, or `git config --unset core.hooksPath`, or edit the hook |

One tier. Not two. The hook is inside the grant it bounds, and the banner prints that at the moment of refusing, which is the only thing that stops it being believed.

## What is still true after this

**The authority is a fixture and the enforcement is not.** The mandate's issuer is the registry's operator root, whose private half is published. Anybody could forge this mandate, and the hook would enforce the forgery just as diligently. The pack's formulation is the one to carry:

> *a hook enforcing a fixture-signed mandate is real enforcement of an unaccountable instruction.*

*Stated.* Two independent halves. Closing the second needs a real issuer key, which is the enrolment path the registry already ships and nobody has walked.

**Nothing here is Cedar.** The allow-list is evaluated by fifty lines of Python, not by the adopted policy language. That is step 6 of the build order. This step proves the shape, not the engine.

**And it is one constraint.** Branches, on one repository, for one subject. The nine other nodes in the measured grant have no mandate at all — and one of them is `n1`, *runs as the container's root user*, tier `none`.

**And it does not travel.** The hook file is committed; the config that activates it is local. A fresh clone gets the file and not the enforcement.

Four qualifications on one refusal. The refusal is still the most real thing in this book, and it is still one branch on one repository, enforced by a file the thing it constrains can delete.
