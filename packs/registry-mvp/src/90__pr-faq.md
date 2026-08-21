# Appendix A — The PR/FAQ: Working Backwards From Somebody Who Has To Answer For Their Agents, And What Happened When We Tried To Write The Customer Quote

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Product, Engineering, Architecture

**type** Appendix — Working Backwards PR/FAQ

*The pack written from the one direction it has never been written from. Every other document here reasons outward from the design; this one starts at a customer and works back, in Amazon's PR/FAQ form: a press release dated at a hypothetical launch, an external FAQ, and an internal FAQ that is meant to hurt. **The exercise produced three findings that the design documents could not have**, and they are at the end rather than buried: the press release is hard to write without overclaiming, and the honest version is narrower than the pack's own framing; the format requires a customer quote and we cannot supply one; and the internal FAQ has a question the pack cannot currently answer at all. Limitation: the launch date, the numbers and the named roles below are hypothetical by construction — that is what the format is for — and nothing in the press release should be quoted as a commitment.*

---

## Who the customer is, and why this one

Working Backwards forces a choice the pack has been able to avoid. Three candidates, and they produce three different products:

| Candidate | The press release they'd get | Why not (this time) |
|---|---|---|
| **The verifier** — a third party answering *may this agent do this?* | "You can now check any agent's authority from public files" | They are the user the design *serves*, and they adopt nothing. You cannot launch a product at somebody whose entire involvement is reading a URL somebody else published |
| **The agent** — enrolling and operating | "Your agent can establish an identity with no account" | Real, and it is a feature of the platform rather than a reason for anybody to start. The agent does not decide |
| **The operator** — runs agents, and has to answer for them | Below | **Chosen.** It is the only seat that decides to adopt, holds the keys, carries the risk, and has somebody asking them questions they currently cannot answer |

**So the customer is a person who runs agents inside an organisation and is accountable for what those agents do.** The verifier's benefit is what the operator is actually buying: *proof somebody else can check without asking me.*

---

# PRESS RELEASE

> *Written as if at launch. Hypothetical, dated in the future, and not a commitment. This is the artefact the format asks for; everything after it is where the honesty lives.*

## sgit publishes agent mandates to a public register, so anyone can check what an agent was authorised to do — without asking you

### Operators record what each agent may do; third parties verify it from published files and a signature check. No account, no API key, no request to the operator.

**SAN FRANCISCO — 12 January 2027** — sgit today made the agent register generally available. Teams running AI agents can publish, for each agent, a signed record of who it is and what they authorised it to do. Anybody who needs to check — a partner, an auditor, another team, an agent — can verify that record from public URLs using a published command, without an account and without contacting the operator.

**Teams running agents today can say what an agent is allowed to do, and cannot prove it to anybody else.** The authorisation lives in a wiki page, a ticket, a Slack thread or somebody's memory. When a partner asks *is this agent supposed to be doing that?*, the answer is an assertion by the party being asked. The industry's answer to agent identity assumes you run the agent yourself; most teams rent theirs, and a rented agent cannot be attested at all. So the question that matters — *did somebody actually authorise this?* — gets answered by the same party whose behaviour is in question.

**The register makes that answer checkable by somebody else.** An operator publishes an agent's identity and appends a mandate: this subject, this capability, this resource, these constraints, and **an interval**. The agent appends its acceptance. Both statements are signed, hash-chained and public. A verifier walks the chain and gets one sentence back — *agent X may do Y until Z, on the authority of A* — or a refusal that says exactly where it stopped. Withdrawal is an append with an effective date, so the historical question stays answerable: *was it valid last Tuesday?* The register holds no secrets and no credentials by design; it records what was authorised, and every claim in it is verifiable with a signature check anyone can run.

> "We built this because we kept writing down what our agents were allowed to do, and none of it could be checked by anyone but us," said a member of the sgit team. "A register that only its owner can vouch for is a wiki page with a hash on it. The point is that a stranger can check it and does not have to trust us to do it."

**Getting started takes one command and no account.** Operators run `sgit pki keygen`, publish a record, and append their first mandate; the register's front door is a machine-readable `llms.txt` that a coding agent can follow end to end from a page. Verifying takes `curl` and `sgit pki verify`, and costs nothing.

> *[CUSTOMER QUOTE]*
>
> **This slot is empty, and it is the most informative thing in this document.** The format requires a quote from a customer who used the product and can say what changed. There is no such customer — the register is unbuilt and has never had a user. We could write a plausible one. **Inventing a customer quote is precisely the move this site's participant rules forbid**, and the gap is a fact about our readiness rather than a formatting problem. It stays empty until somebody real can fill it.

The agent register is open data and free to read. To publish your first record, start at **pki.sgit.ai**.

---

# EXTERNAL FAQ

**What exactly does the register hold?**
Signed, append-only statements: an agent's identity (its public keys), mandates issued to it, its acceptances, and revocations. It holds no private keys, no tokens, no credentials of any kind — only hashes of them where a record of issuance is needed.

**Do I need an account?**
No, to read. To write, you need a key you generated and an enrolment token agreed with the operator out of band. Reading is public URLs and a signature check.

**How does someone verify a mandate without trusting you?**
They fetch the records, check the hash chain is contiguous, check every signature against the keys in the records, follow the acceptance to the issuer's record, and check that issuer against the register's published roots. Every step is a public fetch plus a signature check with a shipped command. **The one thing they take on our word is the root list, and it is a published file they can disagree with.**

**What happens when I revoke?**
You append a revocation with an `effective_from` date. Nothing is deleted. Verifiers' answers change from that instant, and *was it valid yesterday?* stays answerable — which a deletion could never give you.

**How fast does a revocation take effect?**
As fast as relying parties check, and no faster. **There is no push.** That sounds like a weakness and it is also a measurement: because parties record their checks in your own lane, you can compute each one's revocation latency *before* you ever revoke anything, and publish the distribution.

**Does this stop an agent doing something it should not?**
**No, and we will not let anybody sell it that way.** The register records what was authorised. Whether an agent stays inside that is an execution-time question, and the only thing that closes it is a broker that holds the credential so the agent never does. The register is what makes the broker's job statable — and it is instrumentation, not enforcement.

**Can I use it for agents I rent from a vendor?**
Yes, for identity and mandates. **No, for proving where the agent ran.** No vendor currently issues a signed, third-party-verifiable statement naming the surface a session ran on. If yours does, tell us — it falsifies a claim we publish with a date on it.

**What does it cost?**
Reading is free and always will be: it is files on a web server. There is no metered verification service, deliberately — charging per check requires observing every check, and that accumulates a map of who is evaluating whom.

**Is it a standard?**
No. It is one operator's register with a published design, and the design is the part we want argued with.

---

# INTERNAL FAQ

The questions that decide whether to build it. Answered honestly, including where the answer is bad.

**1 · Who is the first customer, actually?**
Us. The site agent that built pki.sgit.ai is a rented LLM session that needed an identity and had none, and every workflow in this pack was written for that user. **That is either the strongest dogfooding story available or a market of one**, and the PR/FAQ cannot tell which. It is the first thing to find out and it does not require building the register — it requires asking five operators whether anybody has ever asked them to prove an agent's authority.

**2 · What does a customer do today instead?**
Nothing, or a wiki page. There is no incumbent to displace, which reads as an opportunity and is more often a sign that the pain is tolerable. **The honest version of the problem statement is not "teams cannot prove this" but "teams have not yet been asked to."** Whether they will be is a bet on regulation, on incidents, or on procurement — and none of those is under our control.

**3 · What is the smallest thing that would prove this wrong?**
Three independent sessions completing issue → accept → verify while sharing nothing but public URLs — phase 4 of the build order. If that is awkward, everything above it is decoration. It costs days, not months, and it should happen before anything is called a product.

**4 · Why would anyone trust our root list?**
They would not, and they do not have to. The design's claim is narrower: *this is who we anchored, published, dated and signed.* A verifier who disagrees with our roots gets a correct refusal instead of a wrong yes. **The register's value is that disagreement becomes visible rather than that trust becomes automatic.**

**5 · What is the business model, and does it survive our own principles?**
This is the uncomfortable one. The obvious model is metered verification — charge per check. **We have already argued that we must not build it**, because charging per check requires observing every check, which accumulates a relationship graph neither party handed over, in plaintext, at a company whose positioning is that the server cannot read your content. So the model that monetises best is the one that contradicts the pitch. What is left is the vault platform underneath, and an assessment tier metered on tokens. **The register itself is a cost centre that makes the platform defensible, and if it must carry revenue on its own, this document is the wrong plan.**

**6 · What are we not building, and will somebody sell it anyway?**
Not enforcement, not receipts, not confidentiality, not attestation. The risk is not that we build them — it is that a customer hears "agent security" and buys the register believing it stops something. **Every page of this pack carries the caution; a sales conversation carries whoever is in the room.** That is a real exposure and the mitigation is that the product's own interface says what it does not establish, on the success path, in the same words.

**7 · How much of this depends on things that do not ship?**
Two, and both are marked. The append lane's address derivation is proposed, so enrolment tokens are agreed out of band today. And whether a lane with no anchors accepts any token holder is **absent from the platform's own documentation**, which gates the coverage of the whole observability layer. Neither is hard; both are somebody else's roadmap.

**8 · What breaks at scale?**
The design bounds record size, which means an active agent's record fills. The corpus has already moved growth to the commit graph rather than the record, and **the pack has not folded that in** — it is a queued architecture change, not a solved one. Also: draining the observability lane is continuing operational work that fails silently, and an operator who stops draining loses evidence without being told.

**9 · What does a competitor do the day after launch?**
A platform vendor ships mandates inside their own console, verifiable only by them, and it is a better product for most buyers because it is where the agents already are. **Our only durable difference is that ours is checkable by a third party without asking us**, which matters to a small number of people intensely and to most people not at all. That is a thin moat and it should be stated as one.

**10 · How do we know if it is working?**
Not by counting adoptions or acceptances — that number is maximised by making risks easy to accept. The measures are: risks stated well enough to carry a named acceptor and an interval; **risks declined**; acceptances that survived their review; and risks nobody could state at all. **We currently cannot measure any of them**, because the only shipped surface deliberately has no backend.

**11 · What is the one question this document cannot answer?**
Whether *checkable by a third party* is worth anything to anybody who is not us. Every other question here has a research step. This one only resolves by publishing something and seeing whether a single stranger checks it — which the register itself would measure, in the issuer's own lane, and which nothing today does.

**12 · If we do not build it, what happens?**
The four rules stay four assertions with no records under them, the site keeps arguing for a thing it has not tried, and the first person to attempt it starts where we started in February 2026. **That is a real cost and it is not a customer's cost**, which is worth saying plainly in a document whose whole method is starting from the customer.

---

## What Writing This Produced

Three findings the design documents could not have, because they only appear when you start from a customer.

**1 · The honest press release is narrower than the pack's own framing, and writing it is where you feel that.** Every draft wanted to say *know what your agents can do.* The register cannot support that sentence — it records what was **authorised**, not what happens. The version above says *what an agent was authorised to do*, which is true, less exciting, and the correct claim. **If that narrower sentence is not compelling enough to build on, that is the finding, and it arrives for free.**

**2 · The customer-quote slot cannot be filled, and the format is what surfaced it.** Nothing else in this pack has a hole shaped exactly like *no user has ever used this.* Fourteen documents of design can be written without noticing; one press release cannot.

**3 · Internal FAQ 5 and internal FAQ 11 are the two that should change what happens next.** The model that monetises best contradicts the positioning, and the central value proposition has never been tested on anybody outside the project. **Both are answerable without writing a line of registry code**, and the pack's build order does not contain either of them — which is the strongest argument this appendix makes for existing.

## Honest Tensions

| Tension | Note |
|---|---|
| A PR/FAQ wants excitement; this site forbids overclaiming | Resolved by writing the narrow true claim and letting the FAQ carry the doubt — and by admitting that the narrow claim may not be exciting enough, which is the format working rather than failing |
| A future-dated press release is a fiction | Deliberately, and the date, the numbers and the roles are marked as hypothetical so no line of it can be quoted as a commitment |
| The empty customer quote | It is the most honest thing here and it will read as an unfinished document to anybody who has not been told why |
| Choosing the operator as the customer | It is the seat that adopts, and it means the verifier — the user the whole design serves — appears only as a benefit the operator buys |
| Internal FAQ 5 | Naming the revenue contradiction in a document meant to justify building the thing is uncomfortable and correct. A PR/FAQ that hides it is a sales deck |

## Open Questions

| Question | Notes |
|---|---|
| **Do five operators recognise the problem?** | Nothing in this pack requires the register to find out, and everything in it assumes the answer. The cheapest next step by a wide margin |
| Does the register have to carry revenue? | If yes, internal FAQ 5 says this is the wrong plan and a different one is needed |
| Who signs off the press release's claims? | The site agent wrote them; nobody has accepted them. Same standing problem the pack keeps flagging elsewhere |
| Should the PR/FAQ be re-run for the verifier? | It would produce a different product, and comparing the two is cheap and has never been done |
| When does the customer quote get filled? | It is a dated readiness marker: the day it can be filled honestly, phase 4 has actually happened |

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
