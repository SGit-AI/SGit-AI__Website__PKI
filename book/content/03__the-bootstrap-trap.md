# 3 · The bootstrap trap

*Part one — Why there is nothing to inherit*

---

Chapter 2 explained why the last generation of key repositories was destroyed. This chapter explains why the next generation has not been built. They are different obstacles, and a registry has to clear both.

The second one is worse, because it is not a missing feature. It is a loop.

## The loop

Stated in the form that makes it tractable:

```
   An agent needs an identity
       ↓
   it must request certification
       ↓
   the request must reach trusted infrastructure
       ↓
   that infrastructure requires authentication
       ↓
   the agent must already possess an identity
       ↓
   ──────── back to the top ────────
```

Generating the keypair takes milliseconds. Getting the public half recognised by something that matters is the whole difficulty, and the difficulty is circular rather than hard.

The distinction that carries the argument is on the site at `https://pki.sgit.ai/bootstrap/index.html`, and it is worth memorising: **creating a key is not creating an identity.** A key is a mathematical object anybody can make. An identity is a relationship somebody else has agreed to — and agreement requires a channel.

The loop is a statement about the channel. There is no way in that does not require having already got in.

## Every escape trades a small problem for a larger one

People do not stop shipping agents because of a loop. They escape it, and the escapes are the interesting part. The site enumerates seven, with what each one actually grants:

| Workaround | What it grants |
|---|---|
| The operator's platform credential | Everything that person can do, everywhere |
| Repository write access | The whole repository, permanently |
| A shared bot token | Whatever the bot can do, to everybody holding it |
| A vendor integration | Whatever its permissions cover, which is usually broad |
| A cloud or service credential | Whatever that principal can reach |
| A project signing secret | The ability to sign as the project |
| A bespoke public enrolment server | A new service to secure — and its own identity problem |

Read the right-hand column as a set of sizes and the argument becomes visible without any security expertise. **Every row solves transport by creating a larger identity problem than the one being solved.** You needed to establish that one agent may open one pull request. You have established that one agent may do everything you can do.

The last row deserves a note because it is the one engineers reach for. Building a public enrolment endpoint feels like solving the problem properly. It relocates it: the endpoint must now decide who may enrol, which is the original question, and the endpoint itself needs an identity, a deployment, a key, and an owner. You have converted a loop into a service, and the service contains the loop.

## Two named failure modes underneath

The site names the mechanisms, and naming them is what makes the pattern generalise beyond the seven rows.

**Ambient authority** is privilege a process holds by virtue of where it runs, rather than because it was handed something specific. A borrowed credential is ambient authority by construction — the agent inherits everything the holder could do, whether or not the task needs it.

**The confused deputy** is a party with more authority than its task required, acting on instructions that may not have come from whoever granted it. The workarounds create deputies as a side effect of solving delivery.

The connection to prompt injection is the part most worth carrying, and the site records the published analysis rather than asserting it: ambient authority is identified as the root cause, because an attacker need not break anything and need only ask the holder to use authority it already has.

*Drawn.* The packs do not put it this way, but the consequence for how people talk about agent security seems to me unavoidable: if ambient authority is the root cause, then every mitigation aimed at the *instruction* — better prompts, injection classifiers, output filters — is treating a symptom, and treating it at the only layer with no ability to be sure it is right. The authority is the disease. This is also why Chapter 6's tier test is not a taxonomy exercise: it is the question of whether a control is even in a position to help.

Both failure modes point at the same conclusion, and the site states it in four words: **the fix is not a better credential. It is not needing one.**

## Not theoretical

Two of the seven rows have public evidence, and the site cites them rather than gesturing.

One coding assistant was found holding a token scoped to every repository its developer had authorised — far more than the surgical changes it was making required. That is row one and row two at once, and it is not a misconfiguration: it is what the available mechanism produces when used as designed.

A disclosure at a security conference on 5 August 2026 showed a repository issue, opened by an account with **no repository privileges**, reaching continuous-integration secrets in three vendors' own repositories, under their own default configurations. Three vendors, their own repositories, their own defaults. The confused deputy at industrial scale.

And the platform feature request for short-lived, repository-scoped tokens for AI agents remains open — which is the fact that turns this from a complaint about carelessness into a description of the available options. The workaround persists because it is the workaround, not because nobody thought about it.

## The gradient, and where a registry can actually help

The loop is not escaped by cleverness. It is escaped by noticing that "identity" is not one thing, and that the steps have different costs.

The site sets out a gradient at `https://pki.sgit.ai/bootstrap/index.html`:

- **I control this private key.** Free. Proves possession, and nothing else.
- **The project recognises this key.** A policy decision, not a computation.
- **The project delegates this mandate.** Scoped, dated, revocable.

Step one costs nothing and is worth almost nothing on its own. Step three is what people actually want. Step two is the hard one, and the important word in it is *decision*: recognition is not something a system computes, it is something somebody chooses. No amount of cryptography produces it.

Which yields the estate's second stated principle, and it is the one most often skipped:

> A signature over an enrolment request proves the submitter controls the corresponding private key. It does not prove that the project should trust the agent. Trust is a policy decision made afterwards.

*Stated.* A verified signature on an enrolment request tells you the submitter holds the key. That is all it tells you. Everything else — should this agent exist, should it be recognised, should it be given anything — happens afterwards and happens in somebody's head.

## The narrow door

If step two is a decision, then the registry's job at bootstrap is not to *make* the decision but to make the *submission* possible without handing anything over. The site's framing is that the exit is a door narrow enough that walking through it requires nothing.

The candidate is an append lane: post to it with a token carried in the body, no account and no access token, and receive a blind acknowledgement that tells you nothing. Nothing is handed over because nothing is held. The submission is a claim, and the decision happens later, somewhere else, by someone.

This is the design, at `https://pki.sgit.ai/enrolment/index.html`, and it is the load-bearing claim in the estate's whole bootstrap argument: the path is buildable rather than theoretical, because the shipped platform already has the lane.

## What is actually true today, stated flatly

And here the chapter has to turn, because this book is not a product announcement and the lane is where the estate's honesty is most tested.

**The append-lane write path is not built.** No lane, no processor, no blind acknowledgement. The write path to the register described in Chapter 8 is a git commit, reviewed by a human maintainer. The register's own front door says so without softening it, and so does this book.

**The question that decides whether the lane works at all is open and unanswered.** A fresh session reading the registry pack as an implementation brief filed it as blocking question Q2 — *does an append lane with no anchors configured accept any token holder?* — and the answer, if it goes the wrong way, does not delay the lane. It removes it.

The mechanism is worth following, because it is the sharpest piece of criticism anybody outside this estate has produced about it. The append lane already has sender authorisation, in the form of registered anchors: hashes of accepted senders, configured with the write key. The project lead's own code-verified audit draws the conclusion in plain words — a lane is not open to everybody by default, and the recipient decides which senders are accepted, using a credential the senders do not have.

Now apply that to enrolment. If anchors are required, the operator must hold a hash of the enrolling agent's key *before* that agent may write. The readiness report states the consequence, and I quote it because the estate's own reviewer put it better than I would:

> The agent must already be known in order to ask to be known. **That is the bootstrap trap, restored, at the exact point the pack says it is broken** — and phase 2's acceptance test, a fresh session with a token and nothing else ending with its identity in the register, cannot pass.

*Stated.* The report is careful about what it does and does not know: two sources point in opposite directions and neither is decisive. The audit says the default is closed; the reference does not state what a lane with an *empty* anchor set does. If an empty set accepts any token holder, the narrow door exists. If it does not, the door is a wall with a doorknob painted on it.

Nobody has run it. The report says so, and says what it costs:

> **This is answerable today by one experiment against a test lane**, and it is the cheapest de-risking available in the whole pack.

*Stated.* Chapter 15 records that the report also found this question filed under the wrong document — parked as an observability concern, where it gets the attention of that heading rather than the attention of a question that may invalidate the estate's most-repeated structural claim.

*Drawn.* Reading the bootstrap page and the readiness report together, the honest position is narrower than the site's own summary suggests. What the estate has established is that the loop is real, that the escapes are worse than the problem, and that a narrow door is the shape of the exit. What it has *not* established is that this particular narrow door exists, because the property that would make it a door rather than a wall has never been tested. That distinction is not in the bootstrap page, and it should be.

## Why this chapter comes before the vocabulary

Part two is going to spend four chapters on words. That is only defensible if the words are load-bearing, and the bootstrap trap is why they are.

If the loop were escapable cheaply, the difference between what an agent can do and what somebody decided it should do would be a modest gap. It is not modest, and the seven workarounds are why: the escape routes do not produce slightly-too-large credentials, they produce credentials sized to a *person* being used by a *process*. The distance between the two quantities is not an inefficiency. It is the exposure, and Chapter 5 is about the fact that nobody has accepted it.
