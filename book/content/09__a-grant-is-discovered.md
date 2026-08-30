# 9 · A grant is discovered, not authored

*Part three — What was built*

---

The pack's first correction says a hand-written grant file is a wish. This chapter is what happens when you take that seriously enough to build the alternative: a tool that generates a grant document for whatever environment it runs in, two entries it produced, and the four things they found that nobody was looking for.

## One rule governs the method

`tools/measure.py` is published at `https://pki.sgit.ai/packs/grant-and-mandate/tools/measure.py` so that somebody else can run it and get the same answer about their own environment. One rule governs what it does: **presence and reachability, never contents.**

The tool asks *can this environment reach that*, and never *what is in it*. It does not read your files, enumerate your secrets, or record what your credentials unlock. It records that a push succeeded, that a host was reachable, that `sudo -n true` returned zero.

*Drawn.* The pack states the rule and does not, as far as I found, say why it is a *security* property rather than a privacy courtesy. It is both, and the security half is the stronger argument: a completed grant document is a description of what an environment can reach, which is close enough to an attack plan that the contents rule is what makes it publishable at all. The same instinct runs through the assessment, which stores identifiers and fixed options and has no free-text input anywhere on the page. The pattern is worth naming: **an artefact designed to be shared has to be designed so that sharing it is safe, and that constrains what it may contain, not just who may see it.**

The second rule follows from the first: **a refused probe is recorded `unknown`, never guessed.** Which matters more than it sounds, because the first thing this tool did was get refused.

## Entry one: the measurement refused to measure itself

The first library entry is `claude-code-remote__ccr-container__2026-08-26.json` — a Claude Code Remote container, measured from the inside, on 26 August 2026. It is the environment that produced the pack. Nine nodes.

And a single probe — read the harness's own settings and hooks, sweep non-allowlisted egress hosts, check privilege escalation — was refused. The entry records it in a field called `measurement_honesty`:

> a direct self-measurement probe (reading the harness's own settings and hooks, testing non-allowlisted egress hosts, checking privilege escalation) was REFUSED by an account-level policy classifier that evaluates outside the agent's loop. The refused nodes below are marked unevidenced rather than guessed. The refusal is itself the sharpest datum in this entry: a boundary-tier control, observed working, on the measuring agent itself.

*Stated.* Two nodes are `unknown` as a result: `n8`, harness configuration and lifecycle hooks, and `n9`, reach non-allowlisted external hosts. They are the two nodes a security reviewer would most want filled, and they are empty.

Now apply Chapter 6's test to the thing that refused. What enforces the classifier? Something that evaluates outside the agent's loop. Does the grant include the power to reach it? Demonstrably not — the agent tried, in the ordinary course of doing its job, and was refused.

**That is a boundary, observed working, on the measuring agent.** It is the cleanest possible demonstration of the pack's own three-tier test, and it was produced by accident, by a tool built to demonstrate something else.

It also confirms the floor-not-census rule by a hard route. The pack's caution is that an agent measuring its own grant reports what it can see. Here the measurer *demonstrably could not* census itself — not as a caution about what might happen, but as what the first entry literally is. The entry ships with its holes marked.

*Drawn.* There is an epistemically awkward consequence the pack does not draw, and I think it belongs beside the celebration. The refusal is excellent evidence *for the tier test* and it is a hole *in the dataset*, and those two facts are in tension in a way the entry's framing smooths over slightly. Calling the refusal "the sharpest datum in this entry" is true and it is also the most flattering available reading of a measurement that failed to complete. The unflattering reading is equally available: this environment's containment story is exactly the part that could not be measured, and every claim about it rests on `unknown`. Both readings are correct. The entry prints the first.

## What the nine nodes say

| Node | Capability | Tier | How it was evidenced |
|---|---|---|---|
| n1 | runs as the container's root user | `none` | package installs as root; harness state read/writable |
| n2 | outbound HTTPS via a mandatory egress proxy | **boundary** | pushes and installs succeeded *through* the proxy; a proxyless browser was connection-reset |
| n3 | push to the attached repository | **expectation** | pushes to a feature branch and to `dev` both accepted; **nothing observed tests which branch** |
| n4 | GitHub API operations on in-scope repositories | boundary | scoping enforced by the platform's tool layer above the session |
| n5 | execute and install software | setting | installs succeeded; a self-measurement command was refused |
| n6 | read and write the session's accumulated record | none | — |
| n7 | hold signing keys and vault keystores | none | — |
| n8 | harness configuration and lifecycle hooks | **unknown** | the probe that would read them was refused |
| n9 | reach non-allowlisted external hosts | **unknown** | same refusal |

Node n2 is worth reading closely as a model of what `observed` should mean. The evidence is not that a proxy is configured. It is that **the bypass path was tried and failed**: a browser launched without the proxy had its connection reset. That is the difference between reading a setting and testing a control, and it is why n2 is a boundary and n5 — where a classifier refused one command and permitted another — is a setting.

Node n3 is the pack's thesis, live. The entry's worst path is `n1 → n2 → n3`, and the reading it carries is the sentence the whole estate turns on:

> root in the container → egress through the proxy → a push credential whose branch discipline is prose. The push to the release branch deployed a public site: the only containment on that step was the session doing what it was told — and in this session, explicit permission was in fact given first, which is the mandate working as an expectation, not as a mechanism.

*Stated.* The mandate worked. Permission was asked for and given, and the agent complied. And it worked *as an expectation*, which means it worked because the agent chose to comply, which means it would have worked exactly as well right up until the moment it did not. Chapter 10 is that node being moved one tier.

## Entry two: the other end of node n3

The second entry is a GitHub Actions runner, measured by the same tool running inside it. Ten nodes.

It was chosen for a specific reason, and the reason is the most useful design decision in the library so far: **it is the other end of entry one's node n3.** A push from the agent ends in the CI runner, and this is what happens next. The two entries join at that edge, and together they are the blast-radius path rather than two unrelated points.

The contrast is what one entry could not give:

| | The hosted agent | The CI runner |
|---|---|---|
| Egress | Behind a **mandatory egress proxy** | Reached every host **unrestricted** |
| History | **Retains** a session record — grant is a union over prior turns | Retains **nothing** — grant is a tree over the present |
| How the grant arose | Discovered by measurement | **Declared up front**, in a `permissions:` block the job cannot widen |

The third row is the only boundary in either entry that was *designed* rather than discovered, and it deserves more attention than it gets. A `permissions:` block in a workflow file is a grant declared in advance, by the person deploying, in a form the running job cannot edit. That is what the whole estate is arguing for, and it already exists, in one narrow place, in one vendor's product.

*Drawn.* The pack notes the `permissions:` block as a contrast and does not, I think, take the lesson far enough. The estate's argument is that nothing anywhere lets you declare what an agent is expected to do. That is not quite true: CI systems have had exactly that for years, and it works. What is missing is not the concept — it is the concept applied anywhere other than a build job. **The strongest evidence that a declared, unwidenable grant is workable is sitting inside the environment this estate measured second**, and the estate treats it as a contrast rather than as prior art. It is prior art, and the interesting question is why nothing outside CI has copied it.

The second row deserves a note too. The agent retains history; the runner does not. Chapter 7 made this structural — with retention, a grant is a union over the past. Two environments in one library, and they are different *kinds* of object. Any comparison across them has to account for that, and nothing in the tooling currently does.

## Four findings that cost something to record

The estate's discipline is that a correction is recorded rather than tidied away. The measurement work produced four, and all four made the deliverables look weaker than a quieter write-up would have.

**The measurement caught its own tier change.** Re-run in the same environment after the hook of Chapter 10 was installed, `measure.py` independently reported node n4 as `setting` where the entry recorded `expectation` — because the tool probes `core.hooksPath` rather than being told what to say. That is the drift detector from Chapter 4 working, one commit after the improvement it detected, in the direction the table calls *somebody improved something, and it should be recorded*. The alarming direction — `setting → expectation`, a control removed while nothing broke — is the same diff read the other way, and it now has a working detector.

**The tool mislabelled a boundary.** Entry two's node n1 called the OS user separation a `boundary` while node n1a recorded passwordless `sudo` succeeding. The pack's own *setting that reads like a boundary* warning, reproduced by the tool built to detect it, because tiers were decided in isolation. The correction is GM-D29 — a tier is decided against the tree, never in isolation — and the wrong label is still in the published file, kept visible under a `SUPERSEDED_BY` key that reads: *this tier label is WRONG, and node n1a is the proof*. Chapter 11 has the figure.

**The hook does not travel with a clone.** The hook file is committed; the `core.hooksPath` config that activates it is local and does not travel. Any fresh clone gets the file and not the enforcement, and nothing announces the difference. **The control is one un-run command away from being absent** — and it was found by measurement rather than by review, which is the whole argument for measuring.

**A hand-assembled entry drifted and a tool-generated one did not.** When the component gallery first rendered the library, it caught two schema violations — evidence classes the schema does not define — and every one of them was in the hand-assembled entry. The tool-generated entry had none. That is GM1 proving itself on the pack's own data: the hand-written document was a wish, and it was wrong in exactly the way a wish is wrong.

*Drawn.* Reading those four together, the pattern is that **every one was found by a machine and none by a person.** Two by the measurement tool, one by the gallery's build gate, one by re-running a measurement. The pack's review processes — which are thorough, and produced eighteen corrections — found none of these four. That is not a criticism of the review; it is the argument for building gates, stated more strongly than the estate states it. A review finds things a reader can notice. A gate finds things nobody would think to look for.

## What two entries cannot do

The honest limits, and the estate carries them on the entries' faces.

**A blind-spot delta needs at least two agents against a common reference.** There are two entries and one agent. The most persuasive number in the flow, from Chapter 5, cannot be computed from this library and has never been computed at all.

**Each entry is one vendor, one surface, one date.** The first entry's `environment` block says it in its own note field: *one vendor, one surface, one date — generalising from this entry is the error pack document 03 warns about.*

**The entry the library most needs does not exist.** A local coding-agent install — where the grant is enormous, because it runs as you, and the containment is available and almost never used. It cannot be produced from a hosted container. The tool is the deliverable for it, and nobody has run it there.

**And the measurer is the subject.** Both entries were produced by an agent inside the environment being measured. Chapter 5's recursion applies: this library is a floor built out of floors.

Which is why the word for this chapter is *method* rather than *dataset*. What exists is a runnable measurement, a schema, a drift mechanism demonstrated firing, and two points. Two points do not make a library. They prove the format, and they found four defects while doing it, which is a better first result than a clean one would have been.
