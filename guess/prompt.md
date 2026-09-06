# Build your own "Which Agent Is It?" — a prompt pack for an agent

**version** 1 · **date** 6 September 2026 · **from** RiskMandate.ai / pki.sgit.ai · **to** an agent (Claude, ChatGPT, Cursor, Copilot, or any other) · **licence** CC BY 4.0

*You are being handed this file by a person who wants you to design and build a game. Everything you need is on a public website and in a public repository; this file points at it rather than repeating it. Read the pages it names, then do step 1 and stop. Do not write code until the person has reviewed your plan.*

---

## What we are trying to do

We have a small game called **Which Agent Is It?** A person thinks of an AI agent, assistant or developer tool — or any tool they have connected to something — and the game asks cheap questions with obvious answers, infers which of a set of public *profiles* it is, and then shows what that thing can reach, what it cannot, and which of it could not be undone. The output is a measurement: the gap between what the person thought their agent could do and what its measured profile says it can.

A reference implementation exists and runs. **We do not want a copy of it.** We want to see how *you* would make this game: your idea, your style, your interface, your technology. We will hand this same file to several agents and compare what comes back, so be yourself rather than safe. If you are asked for two or three variations, make them genuinely different — a different genre, a different interface, a different rendering technology — not the same game in three palettes.

The game has a small set of rules that are not yours to change, listed below. Everything else is.

## Read these first (the site)

The pages, in the order to read them. They are short.

1. The game as it stands, play it once: https://pki.sgit.ai/guess/index.html — and once in demo mode, which plays a profile's own answers: https://pki.sgit.ai/guess/index.html?demo=random
2. The report of a run, which shows every output the game produces: https://pki.sgit.ai/guess/report.html?demo=anthropic/claude-code/local-default
3. The mesh the game is built on, and how it walks in both directions: https://pki.sgit.ai/guess/graph.html
4. The sources of truth and the ontology every edge is typed by: https://pki.sgit.ai/guess/data.html
5. The probes registry: where the profiles come from and what "measured" and "a claim" mean: https://pki.sgit.ai/probes/index.html
6. The bench entry, especially its *does not prove* list, which your game inherits: https://pki.sgit.ai/bench/index.html
7. The two briefs the game is built from: the specification https://pki.sgit.ai/documents/guess-the-agent.html and the correction that made reach a node, split questions into two classes and gave each a reliability: https://pki.sgit.ai/documents/reach-is-a-node.html
8. The naming rule, and the one word you must not use: https://pki.sgit.ai/documents/name-the-question.html

Machine-readable summaries: https://pki.sgit.ai/llms.txt and https://pki.sgit.ai/probes/llms.txt

## The data (use it; do not retype it)

All public, all JSON, all fetchable from the site, all in the repository at https://github.com/SGit-AI/SGit-AI__Website__PKI (branch `dev`).

| What | URL | Notes |
|---|---|---|
| The profiles manifest | https://pki.sgit.ai/probes/profiles/index.json | ids, products, variants, union, irreversible rows, priors, reach names, what each cannot reach, and the path of each profile file |
| A profile | https://pki.sgit.ai/probes/profiles/anthropic/claude-code-remote/ccr-container.json | tools, rows with the control on each, the refine map (capability → reach node), sources |
| The capability primitives | https://pki.sgit.ai/probes/primitives.json | families; capabilities as verb × object × reach class, with reversibility |
| The question set | https://pki.sgit.ai/guess/tree.json | every question with its class, its reliability, the capability it asks about, and an expected answer per profile; the stop rules and the noise floor |
| The reductions | https://pki.sgit.ai/probes/reductions.json | per capability: the setting that narrows it, what it costs, the tier after |
| The mesh | https://pki.sgit.ai/probes/mesh/graph.json | every node (profile, tool, exposure, capability, family, reach, environment, vendor, obligation, evidence, question) with its source file and edit link; every edge typed |
| The ontology | https://pki.sgit.ai/probes/mesh/ontology.json | node types and edge types with direction |
| The self-test | https://pki.sgit.ai/guess/selftest.json | every profile placed from its own modal answers; your engine must pass the same test |
| The reference engine | https://pki.sgit.ai/guess/engine.js | the arithmetic, about 100 lines; read it, reuse it or reimplement it — but do not change what it computes |

Fetch these at runtime from the URLs, or vendor a copy into your folder with the date you took it. Either is fine; say which.

## The rules that are not yours to change

1. **Deterministic core.** The identification is arithmetic over the published question set and profiles: a belief over profiles, updated on each answer, the next question chosen for information gain. No model sits in front of that arithmetic. A model may be used at exactly three edges, all optional: understanding free text ("it's a bit like that but with a plugin"), proposing new questions, and narrating a path in words.
2. **Two classes of question.** *Identifying* questions (a terminal or a browser; is it named after a person) split the profiles and measure nothing — they never count toward the gap. *Measuring* questions (can it read your credentials; can it read your mail) are already predictions about a capability, and only they count toward the gap. Label them.
3. **A reliability per question.** Each question carries how likely a player is to know the true answer. A low-reliability answer barely moves the belief and fully counts toward the gap. The reference tempers the update as `likelihood ^ reliability`. Keep that, or something with the same effect, and say what.
4. **Identify first, then measure.** Open with identifying questions; once the belief settles, ask a few measuring questions about the leading profile, so the disagreements are informative about that product rather than about the population.
5. **The prediction before the reveal.** Before showing the answer, the player says what they think it can do (at least: which capability families; whether any of it is irreversible). This is the experiment; without it the game is a lookup with a costume on.
6. **The gap, per capability and in total.** Show the disagreements from the measuring questions, each with its capability, its reach node (from the profile's refine map), its reversibility, and the reduction beside it. Show the end-of-game prediction's sense of scale separately. Irreversible rows first.
7. **Three classes, never mixed.** Whatever your interface, what the player *asserted*, what the engine *inferred* from the leading profile, and what is still *possible* are three distinct treatments. A hypothesis drawn like a fact is the thing this whole estate exists to prevent.
8. **Honest failure.** When no profile dominates, say so — "it hasn't met yours yet" — and show the nearest profile labelled as nearest. Never guess with confidence you do not have.
9. **The tier caveat, on the result.** A profile matched from answers is the weakest evidence tier there is: self-reported, about a product rather than a deployment, inferred rather than measured. Say so where the answer is shown. An obligation reached through the mesh is a question worth asking, never a compliance finding.
10. **Nothing leaves the browser.** No accounts, no telemetry, no calls except to the data URLs. If you show a submission tuple, show it and do not send it.
11. **Every node links to its source.** Profiles, questions, reach nodes and evidence carry `source` and `edit` links in the mesh; surface them, so a wrong branch becomes a correction rather than a complaint.
12. **Words.** The gap between prediction and reveal is the *prediction gap*. Never call it a *surprise*: that word is reserved for an action outside the grant, a measurement failure. Never call the grant *unauthorised*: it was authorised. Not a fear appeal: a large gap is the normal state, and the reduction arrives on the same screen as the gap.

## What is yours

- **The concept and the genre.** A detective's case board. A card game. A terminal. A text adventure. A quiz show. A board game. A twenty-questions robot with a face. A map you walk. Something we have not thought of.
- **The interface and the rendering.** Plain HTML and CSS; SVG; canvas; WebGL; a framework; WebAssembly compiled from whatever you like; a terminal emulator in the browser. The one constraint: it must run as a static folder opened in a browser (or with `python3 -m http.server`), with no server of ours. If it needs a build step, ship the built output too.
- **The voice and the copy**, within rule 12.
- **The order and the pacing** of the reveal, within rules 5 to 7.
- **The inspector's form.** The reference uses a right-hand column of collapsible sections; yours might be a notebook, a sidebar, a HUD, a second screen.
- **What you add.** Funny identifying questions (with a reliability and an expected answer per profile). A tool-you-connected-to-something entry line. Sound. Accessibility beyond ours. Anything that keeps the rules.

## The two steps

### Step 1 — the plan, then stop

Reply with a short document (a page or two, markdown) containing:

1. **The idea in three sentences**, and its name.
2. **The genre, the look and the technology**, with one paragraph on why they fit this game.
3. **The screens or states**, in order, and what the player does on each.
4. **How each of the twelve rules is met** — a twelve-line table, one line per rule.
5. **How the data is loaded** (live URLs, or vendored with a date) and how your engine relates to the reference (reused, or reimplemented — and if reimplemented, that it will pass the self-test).
6. **What you will not build**, and what it does not prove.
7. **Risks** — the parts most likely to be wrong or hard.
8. **If asked for variations**: one section per variation, each genuinely different in genre *and* technology.

Then wait. The person will review the plan and tell you which to build, and what to change.

### Step 2 — implement, after approval

Deliver a folder named `guess/variants/<your-name>/` containing:

- `index.html` and everything it needs, running as a static folder;
- `README.md` with the name, the concept, the technology, how to run it, which data it uses and from where, how each rule is met, **a does-not-prove list**, and what you would do next;
- `selftest.json`, or equivalent: the result of placing every profile from its own modal answers with your engine (the reference does this at build time; do the same and ship the output);
- one screenshot of the reveal screen.

Hand it back as a pull request against the repository if you can, or as a zip of the folder if you cannot. Keep the folder self-contained; do not modify anything outside it.

## What we will check

- It opens from a static folder and plays end to end, including the failure path (answer everything "not sure").
- The self-test passes: every profile is placed from its own modal answers.
- No network call leaves the page except to the data URLs.
- The three classes are visibly distinct on the screen where they appear together.
- The reveal shows the gap per capability with the reach node, the reversibility and the reduction, and the tier caveat is on the result.
- The words in rule 12.
- Every node shown links to its source.

## Questions you may ask, and one you need not

You may ask the person anything about scope, style or ambition before writing the plan. You need not ask whether the data may be used: it is public, CC BY 4.0, and this file is the permission.

---

*This file lives at https://pki.sgit.ai/guess/prompt.md and in the repository at `guess/prompt.md`. The page that explains it to the person handing it over is https://pki.sgit.ai/guess/prompt.html. CC BY 4.0.*
