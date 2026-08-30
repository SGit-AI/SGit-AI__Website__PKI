# 17 · Your first mandate, tomorrow

*Part five — Honesty, and a first step*

---

Everything in this book is a demonstration. This chapter is the one thing in it you can do yourself, on your own environment, in about an hour, and it is deliberately small.

Three steps. Measure what your environment can actually do. Author a mandate narrower than what you find. Compile one line of it into an enforcement point that already exists.

Then read the last section, which is what it will and will not get you, because the estate's own rule is that a strong threat with a weak answer produces denial — the standing meta-analysis on fear appeals finds defensive response and behaviour change correlate negatively, so a frightening page with no credible action performs worse than saying nothing.

---

## Step 1 · Measure, do not write

```bash
curl -sO https://pki.sgit.ai/packs/grant-and-mandate/tools/measure.py
python3 measure.py > my-grant.json
```

Read it before doing anything else, and read it for three things rather than for the list of capabilities.

**The `tier` on every node.** How many are `boundary`? In the two entries this estate has measured, out of nineteen nodes across both, **three** were boundaries that survived scrutiny. If your answer is *most of them*, check the next thing.

**The defeat paths.** For every node you called `boundary`, look for a child node that gets around it. Chapter 6's rule: a tier is a property of a node's relationship to the tree, not of the node. The estate's own tool got this wrong on published data — it labelled OS user separation a boundary on a machine where `sudo -n true` succeeded. Run that command. It takes a second and it is the single highest-yield check in this list.

**The `unknown` nodes.** These are the ones that matter most and read as least important. A node marked `unknown` is a place your measurement could not reach, which frequently means a place *you* cannot inspect. Do not delete them to tidy the file.

The rule the tool follows is **presence and reachability, never contents** — it records that a push succeeded, not what is in your repository. That is what makes the output safe to keep and, later, safe to send.

*Drawn.* If you do only one thing from this chapter, do this step and stop. My reading of the estate's own evidence is that **the measurement is where nearly all the value is, and the mandate and the hook are where nearly all the work is.** Every one of the four findings in Chapter 9 came from measuring, and every one was a surprise to the people who built the thing being measured. The odds that your first measurement contains nothing you expected are low.

---

## Step 2 · Author a mandate, and make it too narrow

Now write down what you *meant*. This is the one document nothing in the industry provides, and the reason is that it cannot be measured — there is nothing to look at, because if nobody has decided, the answer does not exist.

Four fields, and a mandate missing any of them is a grant under another name:

```json
{
  "issuer":     "<who this authority belongs to>",
  "subject":    "<which agent>",
  "expires_at": "<a date. not optional>",
  "allow":      [ { "capability": "repo.contents.push",
                    "resource":   "github.com/you/your-repo",
                    "constraints": { "branches": ["feature/**"] } } ]
}
```

**Make it deliberately narrower than what you measured.** This is the instruction most likely to be softened, and softening it removes the point. If the mandate matches the grant, the delta is empty and you have learned nothing. If it is narrower, the delta is a specific list of things your environment can do that you did not authorise — and that list is the output.

The estate's own first mandate permitted `claude/**` while the measurement showed the environment could also push to `dev`. One row of excess. That was enough to produce the most useful finding in the estate.

**Store the allow-list; render the prohibitions.** For yourself as much as for anyone: three sentences beginning *will not* are checkable against your intent in a way that forty permitted operations are not.

*Drawn.* Expect this step to be uncomfortable in a specific way, because the estate's own experience predicts it. You will find at least one thing your environment can do that you cannot decide whether you meant. Not *did not mean* — cannot decide. The temptation is to permit it, because refusing feels like breaking something. **Refuse it, and let the enforcement point tell you when you were wrong**, which is exactly what happened in Chapter 10: the mandate was too narrow, the hook refused a legitimate push, and the remedy was an amendment citing the authorisation that actually existed. That sequence is what a mandate is for. It only happens if the first draft is too tight.

---

## Step 3 · Compile one line into something that already exists

Not a new control. One line of your delta, moved into an enforcement point you already have.

```bash
git config core.hooksPath .githooks     # activate it
```

with a hook that reads the mandate at runtime rather than compiling a copy, so policy and enforcement point cannot drift.

Three properties to preserve, each of which has a reason behind it in this book:

**Default-deny, including on dependencies.** Missing, unparseable, mis-signed or expired all refuse. If the interpreter or the crypto library is absent, refuse rather than wave the push through. A control that fails open is not a control, and this costs you real inconvenience the first time the mandate file is malformed.

**Read the document at runtime.** Do not bake the allow-list into the hook. Chapter 5's rule: a stored copy of a derived thing has no way to know it is wrong.

**Say what tier you reached, on the control's own face.** The estate's banner prints `Tier: SETTING — this hook is inside the grant it bounds, so --no-verify still gets past it`. That is the sentence that stops the control being believed more than it deserves, and you will be tempted to leave it out because it undersells your own work.

And then **run the thing you just prohibited.** A control you have not seen refuse anything is a control you are assuming works.

---

## What this gets you

**A grant you did not write.** Dated, evidence-classed, and re-runnable. Next month you diff it, and the direction that matters is a node moving from `setting` to `expectation` — a control that stopped existing while nothing broke and nothing alarmed.

**One decision made explicit.** The authority to do the thing you prohibited either exists or does not. Before this exercise it was neither; afterwards it is a document with a date on it.

**A refusal that does not depend on the agent's state.** The outcome is now a comparison rather than a choice. That is one tier, and one tier is the entire difference between a control and an intention.

**And a specific list of what you did not authorise.** With, most likely, nobody's name against any of it.

## What it does not get you

**It is a `setting`, not a boundary.** The hook is inside the grant it bounds. Anything that can run code as that grant can edit it, unset the config, or pass `--no-verify`. It helps against an agent behaving badly by accident and does not help against one behaving badly on purpose.

**It does not travel.** The hook file commits; the config does not. Every fresh clone gets the file and not the enforcement, and nothing announces it. **Your control is one un-run command away from being absent** — the estate found this by measurement, not review, and it will be true of your copy too.

**Your grant is a floor.** You measured what you could see. The `unknown` nodes are not empty; they are unmeasured, and in a hosted environment they are frequently unmeasurable by you.

**Your mandate has no authority anybody can check.** You signed it, or nothing did. That is fine for a control you are imposing on yourself, and it is not a claim anybody else can rely on. This is exactly the estate's own position, at a smaller scale.

**And you have no receipt.** You know what your agent may do. You still do not know what it did.

---

## If you want the boundary

The move from `setting` to `boundary` is **a change of location, not of policy** — the same allow-list, evaluated where the agent cannot reach it. Concretely: a branch protection rule on the remote, or a required CI check.

That is the strongest practical argument in this book for keeping policy in a document rather than in an enforcement point. Move the document, and the tier improves without the policy changing. Bake the policy into the hook, and relocating it means rewriting the control.

*Drawn.* And I would put the priority differently from the estate's build order, on the evidence in this book. The estate built the hook first because it was cheapest, and the hook has been genuinely instructive. But **the boundary version is a configuration change on most platforms**, available to most readers today, requiring no tooling from anybody. If you are choosing one thing to do rather than three, a branch protection rule enforcing your narrowest honest mandate is a better first move than the hook, and it is the one this book's own Chapter 10 spends four qualifications explaining that the hook is not.

## And if your environment is hosted

Then the containment is the vendor's, and it is uninspectable and unattestable by you. The estate calls this case **zero efficacy by construction** and ends it on a request rather than a remedy, because there is no honest remedy to offer:

**Ask your vendor for an endpoint that signs an existing audit record for a named relying party.**

Not a new product. Not a standard. They already have the audit record; the request is for a signature over it, addressed to somebody. That single capability would turn the whole `boundary + documented` cell from Chapter 6 — a strong claim resting on a vendor's description of their own product — into something a third party could check.

*Drawn.* And it is worth being clear about why this chapter ends on a letter for the largest group of readers. It is not a gap in the design. **It is what the design correctly reports about a situation where the containment belongs to a party who has not agreed to be measured.** The vocabulary works, the measurement runs, the delta computes — and the answer it produces for a hosted agent is that the only party who could improve the tier is not in the room. Saying so is more useful than offering a hook that would not help.

---

## The last thing

Chapter 16's honest summary of this whole estate was one sentence: the three questions are separable, and separating them produces objects you can fetch, verify, diff, and be refused by.

Nothing in this estate establishes that anybody wants them separated. It has one agent, two environments, one mandate, a fixture root, and one outside reader in its entire history.

**You measuring your own environment, finding one thing you did not authorise, and writing down whether you meant it is the smallest thing that would start to answer that** — and it is worth doing whether or not any of the rest of this is ever built.
