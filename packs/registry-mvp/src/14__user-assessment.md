# The User Section Is A Conformance Test For The Site's Own Claim: Store The Choices Rather Than The Answers, Because A Completed Pack Is A Map Of The Visitor's Own Weaknesses

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Engineering, Product, Design

**type** Dev brief — and the only document in this pack describing something that is built

*Fifteenth document of the registry MVP pack, and the first one that is not a design for later. It specifies the assessment workflow now live at [/assess](../../assess/index.html), where a visitor assembles their own agent installations as grant trees and mandates and sees what is reachable that they never intended. Two findings from the v0.33.61 user-section brief shaped every decision in it, and both cut against the obvious build: the pack a visitor assembles is, in aggregate, a plan for attacking them — so the site stores their **choices** and never their **answers**; and the objective is behaviour change, which has a measured failure mode — **a strong threat with a weak answer produces denial rather than change**, so every case must end on something the visitor can actually do. Limitation: the library ships with classes of installation rather than named products, because grading a named product means measuring it and only one hosted tree has been measured — one vendor, one surface, one date.*

---

## What Is Built

A visitor picks a surface, picks one or more agent installations from a public library of pre-computed grant trees, ticks what they actually meant the agent to do, and gets: the tree with every node labelled, the gap between the two, and one action list per surface. Decisions are recorded per gap with an acceptor and an interval.

Everything is held in browser storage. There is no backend.

## The Four Objects, In The Pack's Own Vocabulary

The interface did not need specifying, because each of the four things a visitor selects already had a definition:

| What the visitor picks | Settled as | From |
|---|---|---|
| **Environment** | The surface: your own machine, or a vendor's | The two populations — different *shapes*, not different contents (document 09, W2) |
| **Grant** | A tree of subgrants, each node labelled boundary / setting / expectation, each dated | Document 12 |
| **Evidence** | The label on each node, and its date: tested, documented, derived | Document 12 |
| **Mandate** | An allow-list, stored — presented as prohibitions | C12 and C17 |

**And the output is not a report.** It is a set of gaps, each of which can carry a named acceptor and an interval — which is the test the pack already uses and the thing a risk register consumes. **A page that produces prose has produced nothing.**

## Store The Choices, Not The Answers

The finding that decided the storage design, and it arrives from the direction of helpfulness rather than of malice.

**A completed assessment describes which agents the visitor runs, on which machine, holding which credentials, with which containment, and which of those containments is only a setting.** Individually, unremarkable facts. Assembled, dated and ranked, **a serviceable plan for attacking that person — and the site asked them to write it down.**

Browser storage makes it worse in one specific way: anything stored is readable by any script running on that origin. So the rule:

> **Store references, never descriptions.** What is kept is a list of identifiers from a public library, plus fixed options and dates derived from them. Nothing stored says anything about that person's machine that the library did not already say publicly about everybody's.

| Stored | Not stored |
|---|---|
| Library entry identifiers for the installations chosen | Any path, hostname, account name or project name |
| The surface, from a fixed set of two | Free text describing the setup |
| Capability identifiers ticked as intended | Anything typed by the visitor |
| Decisions: a state, an acceptor **role**, an interval identifier, and the date derived from it | **Any output of a scan of the visitor's own machine** |

**The implementation takes the strictest reading available: there is no free-text input anywhere on the page.** That converts the rule from a promise into a property — *we do not store what you type* becomes *there is nothing to type*, which a visitor can confirm by looking. The place it is most visible is the acceptor: the pack's own standard is a **named** acceptor, and a name is a fact about the visitor's organisation, so the page offers a **role** instead and says why. That is a real reduction in fidelity, taken deliberately, and it is in the tensions below.

**The last row of that table is the line to hold.** A scan is the obvious next feature and it is the point at which the stored pack stops being a set of pointers and becomes an inventory. If a scan is ever added, its output belongs in the visitor's own vault and never in browser storage — **which is an argument for building the vault path before the scan rather than after.**

One pleasant consequence: because the stored artefact is only references into public material, **losing it costs the visitor almost nothing** — exactly the property a demonstration wants, and one no amount of warning copy could otherwise deliver.

## Browser Storage Is The Site's Own Claim, Made Checkable

Local storage here is not a placeholder for the real thing.

The corpus distinguishes a privacy claim that is **architectural** — *we cannot see it because it never comes to us* — from one that is **operational** — *we do not retain it*. The first is a property; the second is a promise.

A user section that keeps everything in the browser, on a statically hosted site, makes the claim architectural — **and makes it checkable in about ten seconds**: open the network panel, complete the assessment, watch nothing leave. There is no backend to send it to. Verified during the build: the page makes exactly four requests, and the only one carrying assessment content is `library.json`, which is the site sending the visitor something.

**So the assessment is a conformance test for the claim that this site does not collect**, in the same way the static vault deployment was a conformance test for the claim that the server reads nothing — and the page says so on itself rather than leaving it to be discovered.

The properties are stated on the page in the site's honest-limitations register: per browser, per device, per origin; cleared with site data and when a private window closes; **no recovery of any kind**; readable by scripts on this origin, which is the reason for the references-only rule rather than an argument against storing anything. And a **show me everything stored** panel dumps the exact bytes, because *not a description of it — the bytes* is the strongest version of the claim.

**One failure mode is tested rather than assumed.** A page opened from a local folder gets an opaque origin, so it can neither fetch its own library nor keep anything. **This feature is the one that breaks first if the site is ever distributed as a downloadable bundle** — so it is handled with a message that names the cause, and it belongs in the test matrix rather than in a support conversation.

## The Migration To A Vault Changes Durability, Not Privacy

Worth isolating, because the instinct is that moving to a vault is the moment the data becomes ours. It is not.

| | Browser storage | The visitor's vault |
|---|---|---|
| Who can read it | The visitor, on that device | The visitor, anywhere |
| **Can we read it** | **No** | **No** — encrypted client-side |
| Survives clearing site data | No | Yes |
| Follows them to another device | No | Yes |
| Failure mode | Silent loss, costing little | **A key with no reset** |

The privacy property survives the migration unchanged. What changes is that the visitor acquires something durable enough to lose badly, and escrow is a precondition rather than a nicety. **For a demonstration artefact that is a poor trade** — so browser storage stays the default even after the vault path exists, and the vault is *offered* to people who have decided the pack is worth keeping.

## A Frightening Page With No Answer Performs Worse Than No Page

The objective is behaviour change, not awareness, and **fear appeals have a measured failure mode rather than a suspected one.**

The standing meta-analysis finds two response paths. **Danger control** is the useful one: attitudes and behaviour move toward the recommendation. **Fear control** is the other: defensive avoidance, denial, reactance — aimed at removing the *fear* rather than the *danger*. The determinant is efficacy, and the finding is blunt:

> **Strong fear appeals with low-efficacy messages produce the greatest defensive response. Strong fear appeals with high-efficacy messages produce the greatest behaviour change.** A high-threat message must be accompanied by an equally strong efficacy message, or it backfires.

The two response types correlate **negatively**, so this is not a weaker effect — it is an opposite one. **A frightening picture of somebody's own estate with no credible answer performs worse than saying nothing**, because it actively manufactures the counter-argument.

Two components have to be present, and the second is the one this domain fails:

| Component | The visitor's question | The risk |
|---|---|---|
| Response efficacy | Would the action actually reduce this? | Answerable — the tree visibly shrinks, and the page shows *closes 8 of your 9* |
| **Self-efficacy** | **Could I actually do it?** | **Where it fails** — the broad grant is often the only grant the tool knows how to issue |

**So the tool must not recommend actions the visitor cannot perform**, because a recommendation that fails on arrival confirms that nothing can be done — which is the definition of low efficacy.

Three implementation consequences, all visible on the page: no score out of a hundred, because a score gets optimised for how alarming it feels; every action states **how many of this visitor's own gaps it closes**, computed rather than asserted; and an action that closes none says so — including one that is genuinely worth doing and does not shrink the tree, which is recorded honestly rather than dropped for spoiling the story.

**And one finding the build surfaced that the brief did not.** On a local tree, every excess path bottoms out at the same node — *runs as your user account*. A list of eleven rows each ending in the same sentence buries that, so the page says it once, at the top: **this is one problem rather than eleven.** That is a better efficacy message than any of the individual rows, because it is a single thing to change.

## Which Contradicts The Explainer's No-Remedies Rule, And Both Are Right

Recorded rather than smoothed, because the two pages sit on the same site and somebody will helpfully align them.

The concept explainer has **every remedy deliberately removed**, so the page states the problem and the rest of the site carries the answer. Applying that rule here would produce the worst combination in the meta-analysis. The rule does not generalise, and the reason is precise rather than a matter of taste:

| | A general explainer | A personalised assessment |
|---|---|---|
| Threat level | **Low** — about agents in the abstract | **High** — about this visitor's own machine |
| Effect of withholding the answer | Creates appetite; the reader goes looking | **Creates denial**; the reader has nowhere to put the feeling |
| Correct ending | The problem, stated cleanly | The problem, **and something that works and that they can do** |

> **A general page may withhold. A personalised one may not.** The discriminator is whether the message is about the world or about the reader.

## The Hosted Case Is The One Most Likely To Backfire

The consequence nobody would predict, and it falls out of the two findings above.

For an agent on the visitor's own machine, efficacy is available: the containment is theirs, they can inspect it, and there are real actions — a separate account, a container, an egress policy. Response efficacy is demonstrable because the tree visibly shrinks; self-efficacy is plausible because they own the machine.

**For a hosted agent there is nothing.** The containment belongs to the vendor, cannot be inspected, cannot be changed, and — tested, not assumed — cannot be attested. Every honest recommendation reduces to *use it less* or *use something else*.

**That is zero efficacy by construction, which is precisely the condition that produces maximal denial. So the page most likely to alarm a visitor is the page least able to do anything with the alarm.**

The exit is not a remedy and does not pretend to be one:

> **Convert the helpless position into a request.** The visitor cannot change the containment, and they can ask for the one thing that would make it verifiable: **a vendor endpoint that signs an existing audit record for a named relying party, with the surface field in it.**

The page ships that as copyable wording, labelled `a request, not a remedy`, and it passes both efficacy tests — genuinely doable in five minutes, and aimed at the only party who can close the gap. It also feeds the research site's dated tripwire, because every visitor who asks is a data point in whether any vendor answers.

**One thing the implementation adds.** The hosted case is not quite zero: **the hosted grant reaches what you put in front of it**, and that part of the containment *is* the visitor's. So the hosted case ships one genuine remedy — *put less into the session* — beside the request. It is small, and it is not nothing, and offering it is better than a page whose only advice is to write a letter.

## What To Measure

Document 12 established that counting acceptances inverts. **The equivalent trap here is measuring shock**: a tool optimised on how alarming the result feels converges on a number nobody believes.

| Measure | Why it is the honest one |
|---|---|
| Assessments completed rather than abandoned | An abandoned assessment is fear control happening in real time |
| **Visitors who take a named action afterwards** | The only measure of danger control, and the one to instrument first |
| Risks stated with an acceptor and an interval | Document 12's primary measure, unchanged |
| Risks declined or sent back | A hundred percent acceptance means the assessment is not saying anything |
| **Visitors who report the result as wrong** | The gap — and the most valuable input the library will ever get |

**And the honest problem with all five: this page has no backend, so it can measure none of them.** That is not an oversight; it is the same property that makes the privacy claim architectural. If any of these numbers is ever wanted, it has to be collected somewhere that says so, and that is a decision with a cost — stated here rather than solved quietly.

## The Acceptance Test

> A visitor completes the assessment in under five minutes, can state in their own words what their agent could reach that nobody intended, can name one thing they will do about it, and can verify by opening the network panel that nothing they entered left the browser.

The third clause fails if the efficacy exit is missing. The fourth is the one that makes the site's own argument.

## Honest Tensions

| Tension | Note |
|---|---|
| **References rather than descriptions** | It leaves nothing worth stealing, and it caps how specific the assessment can ever be — which is exactly what a visitor will ask for next |
| **Roles instead of named acceptors** | The pack's standard is a *named* acceptor; a name is a fact about the visitor's organisation, so this page cannot meet its own standard. A real reduction, taken on purpose |
| Browser storage as a feature | It makes the privacy claim checkable, and it guarantees the visitor loses their work — which reads as unfinished rather than principled unless the page explains it, so the page explains it |
| Efficacy required alongside threat | It is what makes the message work, and it obliges the site to recommend actions — which the explainer page was deliberately built to avoid |
| The hosted exit as a request | It is honest, and it asks the visitor to do something with no guarantee anybody answers |
| Measuring action rather than completion | It is the real measure, it happens off the site, and this page has no way to see it |
| A participant assessing other people's products | The library is the whole interface, and it is a dated judgement maintained indefinitely — which is why it ships with classes rather than named products |

## Open Questions

| Question | Notes |
|---|---|
| **When do library entries become named products?** | Naming one means measuring it, under the participant rules: a verification date, a published re-run method, and the participant named on the page. Until then the library is honest and less useful than it looks |
| What happens when a visitor wants specificity? | The choices-only rule caps the assessment, and the vault path is the answer — which means building it sooner |
| Who maintains the library? | Every node is dated, and a vendor default change invalidates rows silently |
| Is the local-folder case supported at all? | It is not, and the page says so by name. It is in the test matrix |
| What is the efficacy list for each surface? | Taken from this pack's own findings rather than from a survey of what actually works — the weakest input in the whole build |
| Where does escrow sit for the vault path? | It becomes a visitor's problem rather than ours the moment that ships |
| Should the assessment be exportable? | A file the visitor keeps is the natural next ask, and it is also the moment the plan-for-attacking-them leaves the browser under their control rather than ours |

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
