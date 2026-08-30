# 6 · Boundary, setting, expectation

*Part two — The vocabulary, and why each word is load-bearing*

---

Every control you rely on falls into one of three tiers, and one test separates them. The test needs no vendor claim, no datasheet, and no trust in anybody's marketing:

> **a control bounds a grant only when it is enforced by something the grant does not include.**

*Stated.* That is the whole thing. Ask what enforces the control. Then ask whether the grant includes the power to reach that enforcer. If it does, the control is inside the thing it is supposed to constrain, and it is not a boundary however it is labelled.

## The three tiers

| Tier | Enforced by | Worth |
|---|---|---|
| **Boundary** | Something *outside* the grant: OS, separate account, container, network policy, a remote service | Real — holds against a compromised agent |
| **Setting** | The tool itself, running *inside* the grant | Bypassable by anything that can run code as that grant |
| **Expectation** | Nothing — it is written in a prompt or a policy file | None; it is a mandate, and a mandate is not a control |

The third row is the one that should sting, and the pack does not soften it: *it is a mandate, and a mandate is not a control.* A sentence in a system prompt saying the agent will only push to feature branches is not a weak control. It is not a control at all. It is a statement of intent, and it belongs in the mandate document where intents live — where, crucially, it can be compared against a grant and found to be unenforced.

*Drawn.* The packs do not put it this way, but I think the tier vocabulary's real function is to give people a place to put the things they are currently calling controls. The instinct on being told a prompt is not a control is to argue. The tier table redirects that: the prompt is fine, it is simply a mandate, and the interesting question is what enforces it. That reframing is why this is a vocabulary chapter and not a scolding.

## The middle tier is where most real deployments live

The site's own summary is that the test places most of what people rely on in the middle tier that reads like a boundary and behaves like a setting. This is the practical content of the chapter.

Consider the things a careful team actually configures: allow-lists in a tool's config file, hooks the tool runs, sandbox flags, a `permissions:` block, a policy file the agent reads. Every one of them is evaluated by something the agent could reach if it wanted to. They are real improvements. They are all settings.

A setting is genuinely worth having, and it is worth being precise about what it buys: **a setting protects against an agent that is behaving normally and does not protect against an agent that is not.** Which is exactly backwards from what people assume they are buying when they configure one. If your threat model is a confused agent, settings help enormously. If your threat model is a compromised one — an injected instruction, a poisoned tool result, a malicious dependency — the setting is code the attacker's code can edit.

## The refinement the measurement forced

The pack carries a note that saves the test from being too crude to use, and it came from measuring a real environment rather than from design:

> a control that *evaluates in a separate process outside the agent's loop* is a boundary for the agent even when it is configuration for the platform operator — which is why hooks and Cedar are the natural compilation targets, and why a prompt is not.

*Stated.* Tier is relative to the principal being bounded. The same object can be a boundary for the agent and a setting for the operator, and both statements are true because the grants are different. A permission classifier that a hosted platform runs outside the agent's turn is, from the agent's position, unreachable — it is a boundary. From the platform operator's position it is a config file — a setting.

This is not a loophole in the test; it is the test applied correctly. *A control bounds a grant* — which grant? Name the principal, then evaluate. A tier stated without a principal is meaningless, and Chapter 9 records the estate's measurement tool getting this wrong in a way that produced a wrong label in published data.

## The rule that came from the build

The single most valuable rule in this chapter did not come from design. It came from the tool getting it wrong.

Library entry #2 labelled the OS user separation on a CI runner a `boundary`. The very next node in the same tree recorded `sudo -n true` succeeding — passwordless escalation to root, observed. Both facts are correct; the label is not. The pack recorded it as correction GM16, and the correction is a rule about data:

> **A tier is a property of a node's relationship to the tree, not of the node. So a tier badge must be able to show what defeats it — and a defeated control must never render as a boundary.**

*Stated.* The tool decided each node's tier in isolation. Read alone, "runs as uid 1001, bounded by the OS user separation" is a boundary. Read against the child node that escalates without a further credential, it is not a boundary at all — it is a setting, and a thin one.

Which yields the absolute rendering rule of the whole component family:

```
   A control whose defeat path exists in the same tree renders as
   SETTING, with the defeat path reachable from the badge itself.

   ✔  ⛨ setting     defeated by → n1a "escalate to administrator"
   ✘  ⛨ boundary    (with the escalation drawn somewhere else on the page)
```

The estate connects this to a finding one layer up — that escalation is an edge, not an annotation. Drawing the path is what makes the `setting` tier land. Hiding it is how a measurement tool, a vendor datasheet and an interface all independently produce the same lie, and they produce it without anyone intending to, because each of them is describing one node accurately.

Chapter 11 has the figure: the stored document says `boundary`, the block renders `setting` with the defeat path attached. It is the rule working on real data that is wrong, and the wrong data is this estate's own.

## The tier the estate's own enforcement reached

Now apply the test to the thing this estate built, because the test is only worth anything if it is applied to the home team.

Chapter 10 describes a signed mandate compiled into a `pre-push` hook that refuses pushes. Ask the question. What enforces it? A hook file in the repository, activated by a local git config, executed by git as the same user the agent runs as.

Does the grant include the power to reach that enforcer? It includes the power to edit `.githooks/pre-push`, to run `git config --unset core.hooksPath`, and to pass `--no-verify`. Three ways, all trivial.

So it is a **setting**. The pack states this plainly, and the refusal banner prints it on its own face at the moment of refusing:

> **The hook is inside the grant it bounds.** The agent runs as a user that can write `.githooks/pre-push`, so by the pack's own test — *a control bounds a grant only when it is enforced by something the grant does not include* — this is a setting that reads like a boundary, which is the exact tier the pack warns is most often mislabelled.

*Stated.* The move from expectation to setting is real and it is worth having. It is also exactly one tier, and the estate refuses to round it up.

**Reaching a boundary is the same allow-list evaluated where the agent cannot reach it** — a branch protection rule on the remote, or a required CI check. That is a change of *location*, not of policy, which is the strongest argument in the pack for keeping policy in a document rather than in an enforcement point. Move the document; the policy is unchanged; the tier improves. Bake the policy into the hook and you have to rewrite the control to relocate it.

## The evidence axis, which is not the same axis

One more distinction, because it is easy to collapse and the interface rules forbid collapsing it.

Tier says how strong a control is. **Evidence** says how the fact was established: `observed` by running a command · `read` from a settings file · `documented` in the vendor's docs · `inferred` · or `none`, for a node that could not be evidenced and is marked rather than dropped.

The four are not equally trustworthy and the interface must not flatten them. A `boundary` established by `inferred` and a `boundary` established by `observed` are different claims, and a badge that shows only the tier presents them identically.

*Drawn.* The packs keep tier and evidence as separate fields and separate badges but do not, as far as I found, say what the *combination* means. Reading the two vocabularies together, the cell that should worry a reader most is `boundary` + `documented` — a strong claim resting on a vendor's description of their own product, which is the one evidence class the estate has no way to falsify. Every hosted environment's containment story lands in that cell. Chapter 17's last suggestion is what to do about it, and it is a request rather than a remedy for exactly this reason.

## And `unknown` is a fact

The fifth state exists because the alternative is worse. A node the measurement could not establish is marked `unknown`, and the rendering rule is absolute: `unknown` renders as `unknown`, never as blank, because a gap is a fact about the floor and a blank reads as a to-do.

Two nodes in the first library entry are `unknown` because the probe that would have filled them was refused mid-measurement. Chapter 9 is about what happened there, and about why the refusal turned out to be the sharpest datum in the entry rather than the biggest hole in it.
