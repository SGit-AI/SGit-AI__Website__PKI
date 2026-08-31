# 2 · Two insurances, one subject

*Part one — The pivot*

---

The pivot memo catches something in its own flow that a tidier document would have missed, and the catch is load-bearing:

> there's actually two risks here, right? Two two type of insurances

*Stated* — the memo, verbatim. Separating them decides what is actually novel about this whole programme, because the two covers are priced off different objects and only one of them lacks a market.

**Cover A** insures against harm done while doing what was *authorised*. The agent pushes to the dev branch, exactly as mandated, and the push takes production down. Its insurable interest is the **mandate**. The human analogues are old and priced: employers' liability, professional indemnity — harm in the course of sanctioned work. There is loss history, there are markets, and an agent version of it resembles existing operational cover closely enough that an existing carrier could approximate it.

**Cover B** insures against harm done through what was *possible but never authorised*. The credential reached forty other repositories, and something exercised that reach. Its insurable interest is the **delta** — grant minus mandate. And the search for a human analogue comes back nearly empty, which is the finding:

*Drawn.* The nearest human shape is insuring a contractor who was handed the master key to the building in order to fix one tap. The building trade's answer to that situation is not an insurance product; it is *do not hand over that key*. The delta exposure exists at scale for agents precisely because, for agents, not handing over the key is frequently impossible — the platform offers read-write or nothing, the identity is the user's whole identity or nothing. Chapter 9 gives that impossibility a taxonomy. Here it is enough to say: **Cover B has no loss history, no rating basis and no market, and it is the memo's subject** — *"the one of the ones that we are connecting."*

## The premium that falls to zero

One consequence of putting Cover B's insurable interest on the delta is so clean it reads like an incentive design, although the memo arrives at it as a description:

*Drawn.* When grant equals mandate, Cover B's premium is zero — there is nothing outside the authorisation to insure. The delta is not merely *a* rating variable; it is the insurable interest itself, so an operator who narrows a grant is literally buying down premium. Least privilege has been a virtue for fifty years. A premium tracking the delta is the first mechanism in this corpus that makes it *financially* legible: the difference between "you should scope that token" and "scoping that token is worth two levels" is the difference between advice and a price.

The two-populations thesis this estate published earlier in August lands here with its commercial half attached. For agents you run, you can attest the workload and narrow the grant — control is available. For agents you *rent*, you cannot see inside the vendor's environment, and your only lever is the credential you hand over:

> **hand over a broad credential and hope.**

*Stated* — the two-populations brief's own summary of the practitioner's honest position, published ten days before the pivot. Cover B is the commercial completion of that sentence. Where control is not available, *transfer* is what remains — and the hope becomes a premium, which is at least a number somebody computed.

## Which questions each cover answers

*Drawn.* The split also sorts the awkward questions this corpus keeps being asked into the covers that own them.

*The agent did what we told it and it was still a disaster* is Cover A, and it is not agent-specific at all — it is ordinary operational risk wearing a new actor, which is why the memos spend so little time on it. *The agent did something nobody told it to do* is Cover B when the capability was in the grant, and a claim dispute when it was not. And the question that dominates public conversation about agent risk — *the model hallucinated* — turns out to distribute across both: a hallucination that stays inside the mandate is a quality problem for Cover A; a hallucination that exercises the delta is exactly what Cover B exists for, and the delta was there before the hallucination arrived. The memos' framing quietly reprices the hallucination debate: the model's unreliability is the *trigger*, but the *exposure* was conferred by whoever left the delta open.

That reframe has a person on the end of it, and chapter 9 is about them. Before that, the memos do something rarer than proposing a market: they name the market that already tried this and describe how it failed.
