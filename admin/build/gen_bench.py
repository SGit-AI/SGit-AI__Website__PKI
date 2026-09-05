#!/usr/bin/env python3
"""Generates the bench: bench/index.html and bench/llms.txt.

Run: python3 admin/build/gen_bench.py, then admin/build/chrome.py

The bench is where this site ships MVPs and experiments. Adding one is a dict
below plus a folder that holds its own code — the pattern graphs.sgit.ai uses
for its own working surface, where each experiment (the WCLM, the file
explorer) lives in its own folder with its own code and is iterated release by
release against a brief.

ONE FIELD IS MANDATORY AND THE BUILD FAILS WITHOUT IT: `does_not_prove`.

That is the bench's own gate, and it is the whole difference between a bench
and a showcase. Everything here is a working thing that states what it does
NOT establish — the register's signatures verify and prove nothing, the hook
refuses pushes and carries no authority, the measurement is a floor and not a
census. A section that collected demonstrations without that field would
manufacture exactly the false assurance this site exists to argue against.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATES = {
    "live":      ("live", "Built, running, and reachable at a URL right now"),
    "specified": ("specified", "Written down in enough detail to build; not built"),
    "retired":   ("retired", "Was built, superseded — kept because the record is the point"),
}

BENCH = [
 dict(slug="registry", name="The register", state="live",
  where="../registry/index.html", since="v0.1.26", updated="v0.1.48",
  origin=("the <a href='../packs/registry-mvp/index.html'>Registry MVP pack</a>, "
          "after a <a href='../packs/registry-mvp/readiness-report.md'>readiness report</a> "
          "returned six blocking questions"),
  one_line="A static register of agent identities, roles, mandates, grants, acceptances and "
           "revocations — eleven records and twenty-three signed statements at constructed "
           "public URLs, verifiable with the shipped <code>sgit pki</code> commands.",
  demonstrates=[
    "<b>Every record has a rendered page</b> — the fixture/real class first, then each signed statement in append order, with the raw JSON one link away",
    "The four published rules, with entries under them at last — including the ownership rule as a test case: a valid signature by a non-owner is rejected",
    "C7's commit-graph record model, implemented rather than queued — the public git history is the chain",
    "Four <b>assumable roles</b>: a fresh session takes one on by copying a keystore",
    "Six verification answers shipped <b>as data</b>, so any verifier can check itself against them"],
  does_not_prove=[
    "<b>That anything here is trustworthy.</b> Ten of the eleven records are fixtures — private keys published on purpose — so every signature verifies and proves nothing",
    "That the root can be relied on: it is a fixture root, and <code>roots.json</code> says so in its own entry",
    "That enrolment works without a human: the write path is a git commit reviewed by a maintainer, not the account-less lane the pack designs"],
  gates=["<code>registry_tool.py validate</code> — every signature, every reference, the fixture flag read before any signature, and all six expected answers reproduced",
         "the site's key-leak tripwire, which still bans vault-key-shaped strings from the tree"],
  code="registry/, registry/tools/registry_tool.py"),

 dict(slug="mandate-hook", name="The mandate hook", state="live",
  where="../packs/grant-and-mandate/enforcement.html", since="v0.1.28", updated="v0.1.29",
  origin="the <a href='../packs/grant-and-mandate/index.html'>Grant &amp; Mandate pack</a>, build-order step 1",
  one_line="A signed mandate compiled into a <code>pre-push</code> hook that git runs — and that "
           "refused a real push to <code>dev</code> with <code>error: failed to push some refs</code>.",
  demonstrates=[
    "The acceptance test's last sentence, executed: <b>refused by something that is not the agent</b>, with <code>origin/dev</code> unchanged afterwards",
    "A mandate as a living object: v1 was too narrow, refused the release carrying it, and the issuer <b>amended</b> it rather than anyone bypassing the control",
    "Default-deny — a missing, unparseable, mis-signed or expired mandate all refuse"],
  does_not_prove=[
    "<b>That the mandate has any authority.</b> Its issuer is the fixture root, so anybody could forge it and the hook would enforce the forgery just as diligently",
    "That the constraint is a boundary: it reached tier <b>setting</b>, and <code>--no-verify</code> still gets past it",
    "That it protects a fresh clone — the hook file is committed, the config that activates it is local and does not travel"],
  gates=["the hook itself, on every push — and the refusal banner states its own tier rather than overclaiming",
         "<code>mandate.py verify</code> — signature checked against the issuer's public registry record"],
  code=".githooks/pre-push, packs/grant-and-mandate/tools/mandate.py, packs/grant-and-mandate/mandates/"),

 dict(slug="grant-measurement", name="Grant measurement", state="live",
  where="../packs/grant-and-mandate/library.html", since="v0.1.27", updated="v0.1.29",
  origin="the Grant &amp; Mandate pack, documents 03 and 08",
  one_line="A tool that generates a grant document for the environment it runs in, and two "
           "measured entries — a hosted agent container and a CI runner — that join at the push edge.",
  demonstrates=[
    "That a grant can be <b>discovered rather than authored</b>, with provenance and a tier per node",
    "Drift as a diff: re-run after the hook was installed, it independently caught its own node moving from <code>expectation</code> to <code>setting</code>",
    "One rule that makes it safe to run: <b>presence and reachability, never contents</b> — there is nothing sensitive in the output to leak, by construction"],
  does_not_prove=[
    "<b>That the measurement is complete.</b> An agent measuring its own grant reports what it can see; it is a <b>floor, not a census</b>, and says so on its face",
    "Anything about environments nobody has measured — two entries, one agent, and a blind-spot delta needs at least two agents against a common reference",
    "That a hand-assembled entry is as good as a measured one: the gallery caught schema drift in the hand-written entry and none in the tool-generated one"],
  gates=["<code>gen_blocks.py</code> fails the build on an unrecognised tier or evidence class — verified by injecting one",
         "a refused probe is recorded as <code>unknown</code>, never guessed"],
  code="packs/grant-and-mandate/tools/measure.py, packs/grant-and-mandate/library/"),

 dict(slug="building-blocks", name="The building blocks", state="live",
  where="../packs/grant-and-mandate/blocks.html", since="v0.1.31", updated="v0.1.31",
  origin="the Grant &amp; Mandate pack, <a href='../packs/grant-and-mandate/building-blocks.html'>document 09</a>",
  one_line="Nine reusable components — tier and evidence badges, cards, the delta block, the "
           "grant tree — shipped as a stylesheet and a gallery that renders the real documents.",
  demonstrates=[
    "The defeat-path rule working on real data that is wrong: a stored <code>boundary</code> whose own next node defeats it renders as <code>setting</code>, with the path attached",
    "The authority/enforcement split as <b>two indicators, never one</b>",
    "A gap rendered as a gap — the three-term block shows <code>unknown</code> where no self-report exists rather than inventing a number"],
  does_not_prove=[
    "<b>That the components survive contact with a population.</b> They have been exercised against two environments and one mandate, all measured by one agent",
    "That the layouts hold on a phone — the grant tree below 390px has a proposed degradation nobody has tested",
    "That a second consumer will find the contract workable; RiskMandate is committed to consuming it and has not yet"],
  gates=["the gallery renders the actual library entries and mandate, so a schema change breaks the build rather than the integration"],
  code="assets/gm-blocks.css, admin/build/gen_blocks.py"),

 dict(slug="map-your-case", name="Map your own case", state="live",
  where="../assess/index.html", since="v0.1.16", updated="v0.1.19",
  origin="the <a href='../packs/map-your-case/index.html'>Map Your Case pack</a>",
  one_line="A visitor assembles their own agent installations as grant trees, sees the gap, and "
           "records a decision per gap — storing the choices and never the answers.",
  demonstrates=[
    "That the no-collection claim can be <b>architectural rather than operational</b>: there is no free-text input anywhere, so there is nothing to type",
    "The three-tier control test in an interface, with escalation drawn as an edge",
    "A conformance test for this site's own claim, checkable in ten seconds in a browser's network panel"],
  does_not_prove=[
    "<b>That the library covers anybody's real estate.</b> Scenario 5 has no tree to point at at all",
    "That the assessment changes what anybody does — it has no backend, so it can measure none of its own success measures",
    "That the acceptor model is sound: it offers a <b>role</b> where the pack's own standard asks for a named person"],
  gates=["no free-text input anywhere on the page, by construction",
         "browser storage only — nothing leaves the visitor's machine"],
  code="assess/"),

 dict(slug="the-chain-room", name="The chain room", state="live",
  where="../experiments/the-room/index.html", since="v0.1.42", updated="v0.1.43",
  origin="dev brief <a href='../documents/the-chain-room.html'>v0.33.66</a>, at the project lead's direction; genre from newsroom.sgit.ai's floor debrief, CC BY 4.0",
  one_line="The RiskMandate workflow walked end to end as a playable room — eight stations, the "
           "product boundary drawn on the floor, four verbs, and a work item that travels the chain. "
           "The left half is real artefacts; the right half is a marked simulation.",
  demonstrates=[
    "The full chain — <code>reality &rarr; twin &rarr; facts &rarr; finding</code> &#9474; <code>risks &rarr; decisions &rarr; monitoring</code> — as a place, with <b>the library/instance boundary drawn on the floor</b>: references cross, copies bounce, personal data never crosses up",
    "<b>Every word the room speaks is derived at build time</b> from the same files the pipeline runs on — the measured library entry, the signed mandate, the computed excess row, the marked fixture. Nothing about state is hand-written",
    "The handover in one image: left of the line the excess row reads <code>acceptor: none</code>; the exposure gains a named owner only at the acceptance desk, right of the line",
    "<b>Simulate first, then support</b> — the workflow's states and actions exist as walkable, explainable things before any live instance does, the same move the register made with ten labelled fixtures"],
  does_not_prove=[
    "<b>That the workflow works.</b> The right half is synthetic and says so on every surface: no risk has been derived, priced, accepted or monitored by anybody",
    "That a room gets read where a table gets skimmed — the genre's inherited bet, now two implementations old with zero user tests between them",
    "That the conditions can be monitored for real: 3 of 4 hold by observation, and the fourth — the boundary-tier enforcement point — has never held anywhere in this estate",
    "That the acceptance shown right of the line is RiskMandate's actual product behaviour: the shape is read off their positioning card, not their system"],
  gates=["the route gate: the station order drawn must equal the declared chain, or the build fails — the room may not draw a route through a workflow that does not exist",
         "the boundary gate (GM3): the instance fixture stores references, never copies — an embedded grant node fails the build",
         "the decision gate: the fixture's acceptance carries a named acceptor AND an interval, or it is not a decision and the build fails",
         "the observed gate: a condition claiming to hold without an observed_as_of fails — a status is observed, never typed",
         "the marker gate: the generator greps its own output for the SYNTHETIC marker beside every synthetic line"],
  code="experiments/the-room/, packs/grant-and-mandate/instance-fixture.synthetic.json, admin/build/gen_room.py"),

 dict(slug="the-table", name="The table", state="live",
  where="../experiments/the-table/index.html", since="v0.1.43", updated="v0.1.43",
  origin="dev brief <a href='../documents/the-experiments-deck-table.html'>v0.33.67</a> — the deck, the players, and the estate's own incident",
  one_line="Actions resolving against grants and mandates, played as cards: six suits, four players "
           "including the systems, and the estate's real 26 August incident replayed forward as "
           "simulation and backward as audit — with every resolution re-run through the enforcement "
           "tool at build time.",
  demonstrates=[
    "<b>The object layer the room lacked</b>: grants, mandates, facts, evidence and actions each given a card form with a suit — CAN, MAY, IS, SHOWS, DOES, DECIDES — every field read from the artefact the card links",
    "<b>The resolution order as game mechanics</b>: a DOES resolves against CAN, then MAY, and mints an IS backed by a SHOWS. Blast radius is the CAN cards face-up that no MAY card covers",
    "<b>Systems as players</b>: the hook plays reactions, the CI runner holds its own alarming CAN cards, and the DECIDES suit is played only by people — the remedy for a refusal is a decision, never a bypass",
    "<b>Forward is the simulation, backward is the audit, and they are the same cards</b> — the register's <i>was it valid last Tuesday?</i> promise, as play",
    "<b>A live build gate</b>: every turn's resolution is re-run through <code>mandate.py check-branch</code> during the build; a claimed refusal the tool does not reproduce fails it"],
  does_not_prove=[
    "<b>Coverage.</b> One scenario, four turns, one agent, one control — the mechanics, not the space of plays",
    "That a DOES card is a receipt: nothing is signed by the actor at the time of action. The table shows where receipts would sit, which is not the same as having them",
    "<s>That proposed-action simulation works — playing a hypothetical card against the twin is specified in the brief and deliberately not built here.</s> <b>RETIRED at v0.1.46</b>: it is built, at <a href='../simulator/index.html'>/simulator/</a>, where the cards are playable against either twin and every outcome is a precomputed verdict of the real tool. A does-not-prove retired by later work is recorded here, not quietly dropped",
    "That the card grammar survives a population: the genre bets are now three implementations deep across two estates, still with zero user tests"],
  gates=["the resolution gate, live: mandate.py check-branch is executed for each turn at build time and must agree with the table",
         "the transcript gate: every reaction quote must exist byte-for-byte in the captured transcript it cites",
         "the source gate: every card cites a file that must exist, and its fields are read from it, never typed",
         "the manifest gate: a folder without a manifest entry, or an entry without a folder, fails the hub build"],
  code="experiments/the-table/, admin/build/gen_table.py"),

 dict(slug="the-scenario-engine", name="The scenario engine (two worlds)", state="live",
  where="../experiments/push-to-github/index.html", since="v0.1.44", updated="v0.1.44",
  origin="dev brief <a href='../documents/the-scenario-engine.html'>v0.33.68</a> — JSON-driven worlds, the soft mandate as a place, the platform library",
  one_line="One engine, two worlds: <i>Push to GitHub</i> and <i>The Deploy</i> are rendered by the same "
           "generator from two scenario.json files, each referencing a measured twin — the engine holds "
           "no capabilities of its own, and every card is a twin node wearing scene clothes, with a "
           "confidence rung computed from its evidence and a micro-animation per capability kind.",
  demonstrates=[
    "<b>Nothing hardcoded</b>: the engine reads players, grant chain, mandate slots, decor and story from scenario.json, and every capability from the twin the scenario references — adding a world is adding a JSON file, which is the memo's claim made falsifiable by the pair existing",
    "<b>The soft mandate as a place</b>: the constraint that keeps this session off the wrong branch shown in the room it actually occupies — prose in the agent's context (expectation tier), beside the hook it could be (setting) and the platform enforcement it is not (boundary, the doors view's shut door printed in situ)",
    "<b>The contrast the memo predicted</b>: the hosted agent world has a mandatory egress proxy and three occupied mandate slots; the CI runner world that deploys its work has unrestricted egress, no agent, no hook — and the estate's only boundary-tier grant, the workflow's <code>permissions:</code> block",
    "<b>The confidence rung as arithmetic</b>: hypothesis 0, self-observed 1, +documented 2, independent 3 — computed from each node's evidence class, never typed, and both decks print why their maximum is what it is",
    "<b>Capabilities that act</b>: eight micro-animation kinds (push, act-as, edit, egress, recall, escalate, blocked, unknown) — a capability shown acting is legible where a permission string is not, and every animation freezes to its end state under prefers-reduced-motion"],
  does_not_prove=[
    "<b>That two worlds are many.</b> The memo says tonnes of scenarios; the engine has rendered exactly two, both from twins this estate measured itself",
    "That the animations simulate anything — a travelling dot is a depiction of a capability, not an execution of one; no action is resolved here (that is the table's job)",
    "That the platform library exists: Codex, Lovable and the rest are named in the brief as future scenario.json files, and not one has been written — the fact-based variation catalogue is an argument, not an artefact",
    "That a rung above 2 is reachable: independent evidence exists nowhere in this estate, so the scale's top rung has never been exercised",
    "That an agent reads these pages — the memo's claim that agents would also appreciate the visual representation is untested for both humans and agents"],
  gates=["the twin gate: the scenario's twin file must exist and parse, or the build fails",
         "the deck gate: cards == twin nodes exactly — a twin node without decor, or decor naming an absent node, fails the build; the engine may decorate a capability, never add, remove or restate one",
         "the slot gate: every mandate slot derives from a real file (the twin's control text, the signed mandate's enforced_by, the doors view) — and the platform slot must agree with the doors view's enforcement_at_boundary count",
         "the anim gate: every animation kind must be one of the eight the engine defines",
         "the story gate: every beat cites an artefact that exists on disk",
         "the manifest gate: a scenario folder without a manifest entry, or an entry without a folder, fails the hub build"],
  code="experiments/push-to-github/scenario.json, experiments/the-deploy/scenario.json, admin/build/gen_scenario.py, experiments/scenario.css"),

 dict(slug="the-control-room", name="The control room", state="live",
  where="../experiments/the-control-room/index.html", since="v0.1.45", updated="v0.1.45",
  origin="dev brief <a href='../documents/the-control-room.html'>v0.33.69</a> — the project lead's instruction: a new component and UX, thinking game UI and SCADA",
  one_line="Both scenario worlds on one operator board — mimic diagrams, annunciator tiles whose lamp "
           "colour is the tier and nothing else, faceplates on click, and the 26 August incident as a "
           "replayable sequence-of-events log with every verdict re-run through the enforcement tool "
           "at build time. One more renderer, zero new data.",
  demonstrates=[
    "<b>The scenario files are a world model, not a page config</b>: the board is drawn from the same scenario.json files and twins the deck pages use, with nothing added to make it possible — adding a way of seeing is adding a renderer",
    "<b>SCADA's lamp grammar lands exactly on the tier vocabulary</b>: boundary is green (contained), setting amber, expectation amber flashing — one mistake from red — and a capability with <b>no control on it is the alarm state</b>: the CI runner's board lights red where the agent container's does not, visible from across the room",
    "<b>FAULT as a first-class lamp</b>: a refused measurement renders as a hatched sensor-failure tile, never a blank — the industry's oldest honesty convention applied to the estate's most repeated sentence",
    "<b>State at a glance</b>: Unit 1's egress wall is solid and its push line broken by a breaker in the setting position; Unit 2's wall prints NO WALL and its push line runs clean to the asset — the doors page proves this in numbers, the board shows it in geometry",
    "<b>Forward is the simulation, backward is the audit — with transport controls</b>: play, step and reset over the recorded incident; the browser only steps through verdicts the build already re-proved, and with scripting off the board renders complete and final"],
  does_not_prove=[
    "<b>That an operator can run a plant from it.</b> Two units and one recorded incident is a diorama with excellent manners, not a control room under load",
    "That the annunciator scales past twenty tiles a unit, or the log past one incident — the genre solves both (paging, filtering, alarm shelving) and this build implements neither",
    "That anyone reads a mimic faster than a table — the genre bet is now four implementations deep across two estates, still with zero user tests",
    "That REPLAY ever becomes LIVE: a live board needs the registry's write path, monitors feeding facts, and a mandate service — all still stated design, which is why the mode chip is pinned where it is"],
  gates=["the tile gate: tiles == twin nodes exactly, per unit — the board may not simplify a world by omitting its embarrassing tiles",
         "the lamp gate: every lamp class derives from a tier in the closed set; an unknown tier fails rather than guessing a colour",
         "the mimic gate: the wall drawn must agree with the egress node's tier — NO WALL prints if and only if the tier is none",
         "the resolution gate, live: mandate.py check-branch re-run for every push event, and the log may not claim what the tool does not reproduce",
         "the transcript gate: every quoted reaction exists byte-for-byte in its source",
         "the timestamp gate: times are derived (mandate issued_at, tag commit time) or an em-dash — the generator has no field for a typed clock time",
         "the replay gate: the generator greps its own output for the REPLAY chip"],
  code="experiments/the-control-room/, admin/build/gen_control.py"),

 dict(slug="the-simulator", name="The simulator", state="live",
  where="../simulator/index.html", since="v0.1.46", updated="v0.1.46",
  origin="dev brief <a href='../documents/the-simulator.html'>v0.33.70</a> — the project lead's instruction: a card-game view whose plays drive a board, with play and rewind",
  one_line="The first surface here that answers to the visitor rather than replaying this estate's "
           "history: play cards against a measured twin and watch what they do. Every outcome is a "
           "verdict of the real enforcement tool, a reading of the twin, or UNKNOWN — precomputed at "
           "build time, because the browser is not an enforcement point.",
  demonstrates=[
    "<b>It does not predict, it composes.</b> JavaScript cannot run <code>mandate.py</code>, so the whole resolution table — every card, in both worlds, under both mandate states — is precomputed at build and shipped as <a href='../simulator/resolutions.json'>resolutions.json</a> with the tool's own output line in each row. The browser looks answers up; a rule in the page that decided a verdict would be a bug",
    "<b>UNKNOWN is a first-class outcome</b>: where measurement was refused the board says unknown, never <i>no</i> — a simulator that turns a hole into a denial manufactures comfort, and three cards here return holes",
    "<b>The hook card is the argument in one move</b>: installing the pre-push hook changes <b>no verdict at all</b> — <code>dev</code> under mandate v1 is refused before and after — and changes <i>who refuses</i>, from the agent inside its own loop to a hook outside it. The verdict column does not move and the reliability does",
    "<b>Questions history did not ask</b>: <code>push to main</code> is refused under both mandates, which no page here has ever shown, because the estate only ever made the two pushes it made",
    "<b>Rewind is a computation, not an undo stack</b>: board state is a pure function of the event prefix, so stepping back is the same computation with a smaller n — forward is the simulation, backward is the audit, as one control"],
  does_not_prove=[
    "<b>That the simulation is predictive.</b> It composes measured facts and real verdicts; it cannot model an environment nobody measured, and every outcome carries the date of the measurement behind it",
    "That the hand is the space of plays: eight cards, two worlds, one enforcement tool, and a blast radius that is the twin's own reachability rather than a discovered attack path",
    "That anyone learns more by playing than by reading — the genre bet is now five implementations deep across two estates, still with zero user tests",
    "That any of it is live: nothing is executed, and the ladder on the control room says exactly which four doors would have to open before a board here could claim to describe the present"],
  gates=["the table gate: every reachable (card, world, mandate) triple must have a precomputed row, or the build fails rather than letting the browser improvise",
         "the resolution gate, live: every push row is re-run through mandate.py check-branch at build and carries that run's own output line",
         "the unknown gate: a card over a node with no evidence must resolve UNKNOWN — claiming a definite outcome there fails the build",
         "the node gate: every capability card names a node that exists in the world it is offered in, or is declared absent-in-this-world explicitly",
         "the hook gate: the hook card must move no verdict; if a change ever makes it move one, the lesson has changed and the card must be rewritten"],
  code="simulator/, admin/build/gen_simulator.py"),

 dict(slug="workbench", name="The workbench", state="live",
  where="../workbench/index.html", since="v0.1.47", updated="v0.1.47",
  origin="the 30 Aug voice memo: a mini-app over the primitives, evidence packs at decision time, the twin, and the schemas as the product",
  one_line="An experimental app: the primitives on a rail — identities, grants (the twin), mandates, facts, "
           "actions, a simulator — and every decision hands back an evidence pack, because the decision is "
           "disposable and the record is not.",
  demonstrates=[
    "<b>A real real-time check:</b> the live mandate's signature is verified in the visitor's browser — Web Crypto, against the signing key fetched from the issuer's registry record, over the registry's canonical form — not rendered as a badge",
    "The <b>evidence pack</b> (schema <code>evidence-pack/v0</code>, GM-D33): every check with its result, evidence and source; the delta; the twin's age; the enforcement tier; and <code>does_not_prove</code> inside the artefact itself",
    "The <b>twin, operationalised</b>: obligations assessed against a recorded measurement whose age is printed on every pack, with facts attached — and flipping the branch-protection fact moves the enforcement tier from setting to boundary, live (GM-D29 as gameplay, and N12 rehearsable before anyone touches settings)",
    "<b>Default-deny as pedagogy:</b> an unsigned draft mandate refuses everything while still showing the delta it would govern; force-push is refused because the vocabulary cannot express it",
    "It found a real defect on first contact: the live mandate names <code>repo.contents.push</code>, the vocabulary declares <code>repo.contents.write</code> — outside the vocabulary under the registry's own exact-equality rule (GM19)"],
  does_not_prove=[
    "<b>That anything is enforced.</b> The simulator decides nothing outside the page; the live decision points remain the pre-push hook (setting) and a boundary that does not exist (N12) — and every pack says so about itself",
    "That the twin matches the environment now — it is a recording; the memo's real-time question needs a re-measurement at decision time, which this app cannot perform and says it cannot",
    "That a verified signature carries authority — the issuer is a fixture until N11",
    "That <code>evidence-pack/v0</code> is settled — introduced here, proposed to the pack, adopted by nobody"],
  gates=["the signature check is a real verification: corrupt the sig in the fetched document and the badge flips to does-not-verify",
         "default-deny, exercised: no mandate, superseded v1, an unsigned draft and an unexpressible action all refuse — checked headless before every release",
         "same-origin only: every fetch is a reference to a published estate document; nothing typed here leaves the browser"],
  code="workbench/"),

 dict(slug="the-insurance-book", name="The Delta Is Where the Insurance Lives (the insurance book)", state="live",
  where="../insurance-book/index.html", since="v0.1.61", updated="v0.1.61",
  origin="commissioned in one sentence by the project lead on 31 August — <a href='../insurance-book/BRIEF.md'>preserved verbatim</a> — from the ten insurance memos and the pivot briefing",
  one_line="The second volume, by the method of the first: ten voice memos and a pivot briefing, filed "
           "verbatim before they were read, made into one argument — the gap between what an agent can "
           "do and what it was authorised to do is an insurable exposure, and the honest first product "
           "is a rating anybody can recompute, not a premium nobody can check. Seventeen chapters in "
           "five parts, with the audit's six defects walked in full.",
  demonstrates=[
    "<b>The corpus's own disciplines applied to the corpus</b>: 76 quotations re-read out of the memo transcripts, doctrine and machine surfaces on every build — a quote not found where it claims to be fails the build, and 19 of the writing session's first attempts did fail it, mostly for dropping the sources' own emphasis",
    "<b>Every count computed, never typed</b>: 20 gen:stat markers — memo and doctrine counts from the manifest, decision counts from the change-control sources, the 41-against-1 excess from the register's own view, the arc's release span from the tags. The first build corrected four of the writer's own numbers, hours after the writer had read an audit about writers typing numbers",
    "<b>Figures from the version their caption names</b>: eight, including the insurance hub at v0.1.51 — preserved at its tag, believing the series was eight memos — beside the hub today, whose count is computed because believing turned out to be the wrong verb",
    "<b>A coherent argument, not a compilation</b>: memo 1 contradicts memo 0 and the contradiction is kept and answered; memo 6 corrects memo 3 in both documents; the audit's six defects are the closing chapter rather than an appendix",
    "<b>The PDF reads start to finish offline</b> — every figure a data URI, every URL that matters printed in full"],
  does_not_prove=[
    "<b>Anything the corpus does not prove.</b> The book inherits all twenty of the insurance folder's does-not-prove entries and adds none of its own evidence: nothing described is insurance, nothing described is built, and no external fact has been gathered",
    "That the book's coherence is the corpus's. A book's job is the through-line, and a through-line is a choice — the five-part structure and the title are the writing session's, recorded as such in BRIEF.md",
    "That a second volume means the method scales: same harness, same gates, one writer, zero readers so far",
    "That anyone needed the book. The doctrine documents are shorter, the memos are primary, and the book's claim to exist is the argument between them — which is a claim about readers, tested by none yet"],
  gates=["quotes: 76/76 re-read out of the source they name on every build; a miss fails",
         "stats: 20 computed markers; a drifted count fails in check mode",
         "figures: past figures re-derive at their tag; fresh figures must match the live page, and the build fails when the site moves on — which it will, next release",
         "hashes: book.json records the SHA-256 of every chapter; captions: every figure says what to notice"],
  code="insurance-book/ — content/, build.py, build_quotes.py, gen_pages.py, gen_pdf.mjs, shots/"),

 dict(slug="the-book", name="A Key Means Nothing Alone (the book)", state="live",
  where="../book/index.html", since="v0.1.33", updated="v0.1.36",
  origin="a <a href='../book/brief.html'>commissioning brief</a>, draft-2, modelled on graphs.sgit.ai's three finished books",
  one_line="One volume explaining what this site built, how it composes with RiskMandate.ai, and what none "
           "of it proves — 17 chapters in five parts, 14 figures each taken at the release tag its caption "
           "names, and 65 quotations re-read out of their sources on every build.",
  demonstrates=[
    "This estate's habit applied to itself: <b>the specification went up before the thing</b>, and the thing was then checked against it — the brief and the book disagree about four numbers, and the book prints the repository's",
    "<b>Time-travelled figures</b> — each is taken from the release tag its caption names, by git worktree on a port used once, rather than photographed today and captioned as the past. Two gates: a past figure must re-derive from its tag, a present one must still match the live page <b>or the build fails</b>",
    "A provenance rule that forces every load-bearing claim to declare itself <b>stated</b> (a verbatim quote, re-read out of its source on every build — 65 of them) or <b>drawn</b> (the writing session's own reasoning, shown in the reader's view — 48 of them)",
    "A findings chapter <b>computed rather than recalled</b>: twelve places where this estate contradicts itself and seven it does not talk about, both sides of each quoted — including three current artefacts that break the estate's own load-bearing rules",
    "<b>The harness published with the book</b>, so any figure can be re-taken rather than believed, and any number re-derived rather than accepted"],
  does_not_prove=[
    "<b>That the estate it describes is trustworthy.</b> The book's own centre of gravity is a register whose ten fixture records prove nothing and whose root is a fixture — a reader who finishes believing otherwise has read a book that failed",
    "That a participant's account can be neutral. The mitigations are real and are not independence: <b>the strongest bias in such an account is not what it says but what it thinks to check</b>, and there is no way for the writer to know what it did not think to run",
    "That the estate is mature enough to deserve a book — two environments, one agent, one mandate, a fixture root, and <b>one outside reader in its entire history</b>, whose single pass produced half the open contradictions in chapter 15",
    "That any of this is needed. Nobody outside the project has been asked, which the estate's own doctrine appendix rates a Phase I hole rather than a nice-to-have"],
  gates=["the quote gate — every one of the 65 quotations is re-read out of the source it names, and one not found there fails the build (it caught a conflated attribution during writing)",
         "two figure gates: a past figure must be re-derivable from its tag, a present one must still match the live page or the build fails — which it will, on the next release",
         "the hash gate — every chapter's SHA-256 in book.json must match its markdown, so a page cannot describe a chapter it did not render",
         "the caption gate — every figure must carry a caption saying what to notice, never merely what the image is of"],
  code="book/, book/content/, book/shots/, book/build.py"),

 dict(slug="probes", name="Probes, not tables (the capability registry)", state="live",
  where="../probes/index.html", since="v0.1.69", updated="v0.1.70",
  origin=("<a href='../documents/probes-not-tables.html'>brief v0.33.64 (probes, not tables)</a>, with the vocabulary "
          "corrected the same day by <a href='../documents/the-precedents.html'>the precedents brief</a>"),
  one_line="A registry of capability primitives (verb &times; object &times; reach + reversible) and measured grants where a "
           "grant claim never travels alone: it points at the probe that established it, the date, the environment and the "
           "output, so a challenge is a rerun rather than an argument. A runner that emits <code>findings/v1</code> in OpenSSF "
           "Scorecard's probe/finding shape plus reversibility and tier; seven profiles, two of them measured; grants public, "
           "mandates private.",
  demonstrates=[
    "<b>The probe as the unit of contribution</b> &mdash; fourteen probes, twelve safe to run and two described and never run, each with the command and how to read it",
    "<b>The grant is per tool, not per product</b> &mdash; this container's shell and its fetch tool measured separately on 5 September, union and intersection reported",
    "<b>A finding shape adopted, not minted</b> &mdash; Scorecard's probe, message, outcome, remediation and location, plus the two fields this subject needs",
    "<b>A row without evidence is visibly a claim</b> &mdash; the five derived profiles say so on the page, the manifest and llms.txt",
    "<b>An incident that demotes</b> &mdash; the 26 August hook, claimed inline and shown to be a setting, as the first record",
    "The diff between two profiles, in the browser: the same assistant with confirmations on and off differs in one control",
    "<b>Every profile drawn as a graph</b> (<a href='../probes/graph.html'>graph.html</a>): tools, the capability each reaches, the control on the path, and what it cannot reach",
    "<b>A hook is a control on one tool</b> &mdash; this container's code-host API tool writes to the repository by a path the clone's hooks never see (the harness evidence, self-reported)"],
  does_not_prove=[
    "<b>Independence.</b> Every evidence file was produced by the environment it describes &mdash; the weakest tier the model has, and stated on every file",
    "<b>Completeness.</b> A self-run probe reports what the subject can see; a capability it does not know it has will not appear. A floor, not a census",
    "<b>That a derived profile is true of any instance.</b> Five of the seven are reasoned from what a surface architecturally is; no probe has been run on them",
    "That the primitive set is right: a starting set, wrong at the edges from the first week by its own admission"],
  gates=["<code>gen_probes.py</code>: every probe establishes only capabilities that exist and every capability is established by at least one probe; every profile's union and intersection are recomputed from its tools' grants; a row at a measured tier must point at an evidence file holding a True finding for it; every irreversible capability has a reduction",
         "<code>probes/run.py validate</code> on every evidence file: shape, ids, reversibility copied from the primitive, presence-only size",
         "the site's key-leak tripwire, over the evidence files too"],
  code="probes/ (primitives.json, probes.json, run.py, schema/, profiles/, evidence/, incidents/, reductions.json), admin/build/gen_probes.py"),

 dict(slug="authorised", name="What you authorised and never asked for", state="live",
  where="../authorised/index.html", since="v0.1.69", updated="v0.1.69",
  origin=("<a href='../documents/name-the-question.html'>brief v0.33.64 (name the question, not the concept)</a> and "
          "<a href='../documents/the-precedents.html'>the precedents</a>"),
  one_line="A self-assessment that runs in the browser: name your tools, the grant appears from measurements other people "
           "contributed, four questions about work produce the mandate, and the gap is rendered with the irreversible rows first "
           "and the reduction on the same screen. The verdict is a statement, not a grade; the tier is on the result; the "
           "counts-only tuple is shown and never sent.",
  demonstrates=[
    "<b>Value arrives at step three</b> &mdash; before the visitor has typed anything about themselves",
    "<b>The site cannot scan you, and says so</b> &mdash; nothing leaves the tab; the measurement runs where the agent lives, and a <code>findings/v1</code> file can be brought in",
    "<b>A falsifiable assessment</b> &mdash; a surprise is an action outside the grant, so the surprise count is the validity test",
    "<b>The reduction on the same screen as the gap</b>, ticking one moves the verdict",
    "<b>The assessment expires</b> &mdash; dated, pinned to profile versions, stale when a vendor moves a default",
    "The public phrase is a sentence: every coined noun tested collided or needed explaining"],
  does_not_prove=[
    "<b>Anything about the visitor's environment.</b> It matched profiles from answers, or read a file the visitor brought; it saw nothing itself",
    "<b>That the gap is a loss.</b> It is authorised, and most of it is harmless most days; the irreversible rows decide",
    "<b>That the questionnaire is the mandate.</b> Twelve purposes and ten exclusions are coarse; the full elicitation is an agent asking in the person's own words",
    "<b>Calibration.</b> No surprise count exists for any assessment made here; the validity test is stated, not passed"],
  gates=["the arithmetic is <code>app.js</code> and the rows are the profiles' &mdash; no number on the page is typed",
         "the reductions gate in <code>gen_probes.py</code>: every irreversible row in a gap has a way out",
         "no endpoint exists: there is nothing on the page that can send"],
  code="authorised/ (index.html, app.js, README.md), assets/authorised.css"),

 dict(slug="guess-the-agent", name="Which Agent Is It? (the game)", state="live",
  where="../guess/index.html", since="v0.1.69", updated="v0.1.71",
  origin="<a href='../documents/guess-the-agent.html'>brief v0.33.64 (guess the agent)</a>, build-order steps 1 to 5",
  one_line="Named for the question a person has (working title <i>guess the agent</i>). A guessing game whose output is a measurement: cheap questions with obvious answers, ordinary decision-tree "
           "induction over a belief across the public profiles, a prediction step before the reveal, and the prediction gap "
           "with the reduction on one screen. Deterministic, in the browser, the path always shown, nothing sent.",
  demonstrates=[
    "<b>The burden inverted</b> &mdash; fifteen questions people can actually answer, instead of an enumeration nobody can make",
    "<b>The next question splits the belief most evenly</b>, and answers update rather than prune; a wrong answer is recoverable",
    "<b>The prediction step is the instrument</b> &mdash; the gap between what was predicted and what the tree found is the finding",
    "<b>The tree is public and self-tested</b> &mdash; every profile placed from its own modal answers, the count derived at build",
    "<b>The naming collision caught</b> &mdash; a prediction gap, never a surprise",
    "An honest <i>not in the set</i> when no profile dominates, which is a finding rather than a failure"],
  does_not_prove=[
    "<b>Anything about the player's environment.</b> It matched a profile from self-reported answers, the weakest tier available, and produced a hypothesis, not a measurement",
    "<b>That the tree is right.</b> Seven profiles, fifteen questions, probabilities estimated by the author on one day and answered by nobody yet",
    "<b>That a small gap is safety.</b> Predicting the grant correctly does not narrow it",
    "Anything at scale: no tuple has been submitted, and the aggregate is empty"],
  gates=["<code>gen_guess.py</code>: every question carries an expected answer for every profile in the manifest and no other; every profile is placed by its own modal answers within the budget, or the build fails",
         "the model-assisted fallback is deliberately absent: never a model in front of an arithmetic step"],
  code="guess/ (index.html, app.js, tree.json, selftest.json), admin/build/gen_guess.py"),

 dict(slug="synthetic-readers", name="Synthetic readers", state="specified",
  where="../packs/map-your-case/readers/index.html", since="v0.1.23", updated="v0.1.24",
  origin="the Map Your Case pack, document 08",
  one_line="A programme that puts a page in front of an agent which receives pixels and nothing "
           "else — no text, no structure, no knowledge of the project — and watches where it goes.",
  demonstrates=[
    "The screenshot boundary as an <b>instrument</b> rather than a limitation",
    "A patience budget set from outside the model, so abandonment is a measured event rather than a story the model tells about itself",
    "One run performed, with four defects already folded back into change control"],
  does_not_prove=[
    "<b>That synthetic readers can report preferences.</b> They find defects; a preference from a simulated reader is not evidence and the programme says so",
    "That the findings generalise — one run, one archetype, one page",
    "That the simulation marker survives export, which is the rule most likely to be broken by accident"],
  gates=["the simulation marker in the filename, the headers, and beside every quote",
         "the page under test is authored before the run, so the model cannot be agreeing with itself"],
  code="packs/map-your-case/readers/"),
]


def esc(x):
    return html.escape(str(x))


def check():
    """The bench's own gate. An entry that does not say what it fails to
    establish is a showcase entry, and this section is not a showcase."""
    bad = []
    for e in BENCH:
        if not e.get("does_not_prove"):
            bad.append(f'{e["slug"]}: no `does_not_prove` — the one mandatory field')
        if e.get("state") not in STATES:
            bad.append(f'{e["slug"]}: state {e.get("state")!r} not in {sorted(STATES)}')
        if not e.get("gates"):
            bad.append(f'{e["slug"]}: no `gates` — what keeps it honest when nobody is looking?')
    if bad:
        raise SystemExit("gen_bench: the bench's own gate failed:\n  " + "\n  ".join(bad))


def entry_html(e):
    st, _ = STATES[e["state"]]
    dem = "".join(f"<li>{d}</li>" for d in e["demonstrates"])
    dnp = "".join(f"<li>{d}</li>" for d in e["does_not_prove"])
    gates = "".join(f"<li>{g}</li>" for g in e["gates"])
    return f'''
<div class="bench-item" id="{esc(e["slug"])}">
  <div class="bench-item__head">
    <h3><a href="{esc(e["where"])}">{esc(e["name"])}</a></h3>
    <span class="bench-state bench-state--{esc(e["state"])}">{esc(st)}</span>
  </div>
  <p class="bench-item__line">{e["one_line"]}</p>
  <div class="bench-cols">
    <div class="bench-col">
      <div class="bench-col__k">What it demonstrates</div>
      <ul class="bench-list bench-list--yes">{dem}</ul>
    </div>
    <div class="bench-col bench-col--not">
      <div class="bench-col__k">What it does <b>not</b> prove</div>
      <ul class="bench-list bench-list--no">{dnp}</ul>
    </div>
  </div>
  <div class="bench-gates"><b>Gates</b> — what keeps it honest when nobody is looking:
    <ul class="bench-list">{gates}</ul></div>
  <div class="bench-meta">
    <span>from {e["origin"]}</span>
    <span>code: <code>{esc(e["code"])}</code></span>
    <span>on the bench since {esc(e["since"])} · last moved {esc(e["updated"])}</span>
  </div>
</div>'''


def main():
    check()
    live = sum(1 for e in BENCH if e["state"] == "live")
    items = "".join(entry_html(e) for e in BENCH)
    rows = "".join(
        f'    <tr><td><a href="#{esc(e["slug"])}">{esc(e["name"])}</a></td>'
        f'<td><span class="bench-state bench-state--{esc(e["state"])}">{esc(STATES[e["state"]][0])}</span></td>'
        f'<td>{e["one_line"]}</td></tr>' for e in BENCH)

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The bench: what this site has built, and what each thing does not prove · pki.sgit.ai</title>
<meta name="description" content="The bench is where pki.sgit.ai ships MVPs and experiments — the register, the mandate hook, grant measurement, the building blocks, the assessment and the synthetic-reader programme. Every entry states what it demonstrates and, mandatorily, what it does not prove.">
<link rel="canonical" href="https://pki.sgit.ai/bench/index.html">
<meta property="og:url" content="https://pki.sgit.ai/bench/index.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/bench.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / bench</div>
<h1>The bench</h1>
<p class="lead">Where this site ships MVPs and experiments. <b>{live} of the {len(BENCH)} things below are
built and running right now</b> — you can fetch them, run them, and check them. Each one lives in its own
folder with its own code, arrives from a brief or a dev pack, and is iterated release by release.</p>

<div class="bench-rule">
  <div class="bench-rule__k">The rule this section is built on</div>
  <p><b>Every entry must say what it does not prove, and the build fails without it.</b> That is the
  difference between a bench and a showcase. A register whose signatures verify and prove nothing; a hook
  that refuses pushes and carries no authority; a measurement that is a floor and not a census — each of
  those is a real, working thing <em>and</em> a demonstration, and a section that listed only the first half
  would manufacture exactly the false assurance this site exists to argue against.</p>
</div>

<div class="tablewrap"><table>
  <thead><tr><th>On the bench</th><th>State</th><th>What it is</th></tr></thead>
  <tbody>
{rows}
  </tbody>
</table></div>

<h2 id="items">The bench, in full</h2>
{items}

<h2 id="adding">Putting something on the bench</h2>
<p>Three requirements, and the third is the one that matters:</p>
<ol>
  <li><b>Its own folder, its own code.</b> An experiment that entangles itself with the site's other
  machinery cannot be retired, and retiring things is most of what a bench is for.</li>
  <li><b>An origin.</b> A brief, or a dev-pack document. Something that says what question it was built to
  answer, so its result can disappoint.</li>
  <li><b>A <code>does_not_prove</code> list, and gates.</b> Both are mandatory in
  <code>admin/build/gen_bench.py</code>, and the generator refuses to build without them.</li>
</ol>
<p>Then add a dict to that generator and run it. The machine-readable index is
<a href="llms.txt"><code>bench/llms.txt</code></a>.</p>

<div class="note"><b>Why "the bench" and not "labs".</b> In this industry <em>labs</em> has come to mean
<em>unsupported, may vanish, do not depend on it</em> — and the things below are the opposite: they are the
most rigorously checked artefacts on this site. They are simply not finished products. A bench is where you
put something to test it and read the result honestly, which is the same posture the rest of the site takes,
and it sits naturally beside the estate's own vocabulary of measurement, evidence and gates.</div>

<div class="pagenav">
  <a href="../index.html">← Front page</a>
  <a href="../packs/index.html">The dev packs →</a>
</div>
</main>

<footer class="site"></footer>

</body>
</html>
'''
    (ROOT / "bench").mkdir(exist_ok=True)
    (ROOT / "bench" / "index.html").write_text(page)

    lines = ["# pki.sgit.ai/bench — MVPs and experiments, and what each does not prove",
             "#",
             "# Every entry below carries a `does not prove` list. It is mandatory: the",
             "# generator refuses to build an entry without one, because a section that",
             "# collected demonstrations without their limits would manufacture the false",
             "# assurance this site exists to argue against.",
             "#",
             f"# {live} of {len(BENCH)} are built and running. Hub: https://pki.sgit.ai/bench/index.html",
             ""]
    for e in BENCH:
        lines += [f"## {e['name']} — {STATES[e['state']][0]}",
                  f"  where     https://pki.sgit.ai/{e['where'].replace('../', '')}",
                  f"  code      {e['code']}",
                  f"  since     {e['since']} (last moved {e['updated']})",
                  "  is        " + html.unescape(
                      __import__("re").sub(r"<[^>]+>", "", e["one_line"])),
                  "  DOES NOT PROVE:"]
        for d in e["does_not_prove"]:
            lines.append("    - " + html.unescape(__import__("re").sub(r"<[^>]+>", "", d)))
        lines.append("")
    lines += ["# Putting something on the bench: its own folder and its own code, an origin",
              "# (a brief or a dev-pack document), and a does_not_prove list plus gates —",
              "# both enforced by admin/build/gen_bench.py.",
              "# All content CC BY 4.0."]
    (ROOT / "bench" / "llms.txt").write_text("\n".join(lines) + "\n")
    print(f"gen_bench: {len(BENCH)} entries ({live} live) -> bench/index.html + bench/llms.txt")


if __name__ == "__main__":
    main()
