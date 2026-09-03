#!/usr/bin/env python3
"""Generates the packs/ section: dev packs, presented like the documents.

Run from anywhere: python3 admin/build/gen_packs.py, then admin/build/chrome.py.
Emits packs/index.html (section hub), packs/<pack>/index.html (pack hub with the
file table and a reader for the pack README), and packs/<pack>/<slug>.html per
document (summary, key concepts, key ideas, in-page markdown reader with mermaid
support). Raw sources live verbatim under packs/<pack>/src/ — the source of truth.
Adding a pack or a document = adding a dict here. Same treatment as
nhi.sgit.ai's gen_packs.py, adapted to this site's shared chrome.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GH = "https://github.com/SGit-AI/SGit-AI__Website__PKI"

PACKS = [
 dict(slug="registry-mvp",
  name="The Registry MVP: Open Data, A Single Operator, LLM Sessions First",
  origin="Authored by the pki.sgit.ai site agent, 20 August 2026, at the project lead's request. Status: a design pack \u2014 and as of site v0.1.26 its registry is BUILT: the register is live at /registry/ with eleven records, ten of them fixtures, one real, a fixture root and a write path that is a reviewed git commit rather than the append lane this pack designs. The assessment at /assess is live too. The change-control appendix, which records corrections rather than folding them in silently, now runs to thirty-four corrections and forty-eight decisions \u2014 C33 supersedes the pack's own earlier 'unbuilt' status and C34 records the readiness report a fresh session produced. Corpus version assigned on adoption.",
  date="20 August 2026 · draft-1 + change control",
  origin_short="Site agent, this repo",
  row_date="20 Aug 2026 · draft + change control",
  dl_blurb="""Every source document, every supporting brief, this site's machine-readable front door,
    and the reference implementation — with a briefing for a fresh session picking it up cold.
    It asks for a <em>readiness report</em> rather than an implementation plan: read the supporting
    material, then the pack, then say whether you have what you need or list the questions that
    block you. It names the six things that trip a new reader, and asks for blocking questions
    rather than confidence, because a pack with a third of its decisions still open is one where a
    confident plan probably means the reader missed them.""",
  one_line="A public key registry on vaults — open data, one operator, and LLM sessions as the first users on both sides. 15 documents and four appendixes — a PR/FAQ, a PEP-style specification, and change control — and one of them is built. <a href='registry-mvp/registry-mvp-briefing-pack.zip'>Downloadable as a briefing pack</a>.",
  meta_desc="The registry MVP pack, readable in-page: the leading brief, architecture, schemas, workflows, build order, diagrams, change control, the tabletop exercise, the UX mockups, six Wardley maps, the user stories and features, the observability layer, the grant tree, the key policy, and the assessment that is actually built.",
  three_sentences="An MVP of the registry this site designs: one public vault whose records are append-only, hash-chained, signed statement logs; a processor as the only write-key holder; and every workflow written for its actual first user — a fresh LLM session holding nothing but public URLs. Open data on principle (a registry contains no secrets), and <b>public in data, private in authority</b>: one operator, one root, own-agents enrolment — build-order step 4 with the covers off. Draft-1 shipped the morning of 20 August; three project-lead briefs landed the same day, and what they correct is recorded in <a href='change-control.html'>the change-control appendix</a> rather than silently patched — it sits last because it never stops growing, and it is the one document to read either second or last, never not at all. Two later documents draw the thing: <a href='ux-mockups.html'>the register interface, screen by screen</a>, and <a href='wardley-maps.html'>six Wardley maps</a> of where the novelty actually sits. <a href='user-stories.html'>Document 10</a> turns all of it into six users, twenty-four stories with tests that can fail, and six workflows; <a href='observability.html'>document 11</a> adds the half that makes the mandate layer defensible \u2014 and answers, by refusing it, the question of who is using a mandate. <a href='grant-tree.html'>Document 12</a> gives the grant the structure C1 implied and never specified, and <a href='keys-and-signatures.html'>document 13</a> settles which things get keypairs \u2014 fewer than proposed. <a href='user-assessment.html'>Document 14</a> is the first that describes something shipped: <a href='../../assess/index.html'>map your own case</a>.",
  site_relevance="This pack is <a href='../../roadmap/index.html#order'>build-order step 4</a> made concrete. Its constraints are this site's published pages: <a href='../../rules/index.html'>the four rules</a> (implemented as processor checks plus a public validator), <a href='../../mandate/index.html'>identity vs. mandate</a> (with the mandate living in the <em>issuer's</em> record — the same rule the v0.33.61 register brief derives independently), <a href='../../bootstrap/index.html'>the bootstrap trap</a> (the enrolment workflow walks the gradient as commands), and <a href='../../shipped/index.html'>the shipped surface</a> (the lane, the four capability tiers, and the two absences the registry supplies).",
  docs=[
   dict(slug="dev-brief", file="00__LEADING-BRIEF.md",
    title="00 — The leading brief",
    role="Scope, the four objects, and the reconciliation: public in data, private in authority",
    summary="The MVP scoped: a public store on vaults holding keys, identities, mandates and grants, whose first users on both sides of every workflow are LLM sessions. Confidentiality is out of scope on principle — a registry contains no secrets — while integrity and authenticity are the point. The apparent contradiction with the site's private-before-public build order is resolved head-on: one operator, one trust root, own-agents enrolment; the genuinely public commitments stay behind a policy-closed door. The deliberate inversion: the documented workflow is the first client, and if the page is not sufficient for a fresh session, the MVP is not done.",
    concepts=[
     ("Public in data, private in authority", "../../roadmap/index.html#order", "step 4 with the covers off, not step 6 early"),
     ("Enforcement is verification anybody can re-run", "architecture.html", "the open-data MVP's honest substitute for server-side rules"),
     ("The four objects", "schemas.html", "identity, mandate, grant, revocation — each signed by whose statement it is"),
    ],
    ideas=[
     "The first client is a page, not a program.",
     "Publishing the data early means every workflow is testable by any session anywhere, and our own rule-keeping is checkable from day one.",
     "Receipts stay out of the registry: a receipt is the executor's statement, not the registry's.",
    ]),
   dict(slug="architecture", file="01__architecture.md",
    title="01 — Architecture",
    role="The vault, the records as hash-chained statement logs, the processor as referee",
    summary="The registry as one public vault: one record per participant keyed by signing fingerprint, each record a numbered sequence of immutable signed statement files forming a hash chain, current state read-to-the-end. The write path is the shipped account-less append lane feeding a trusted processor — the only holder of the vault write key, possibly itself an LLM session with a runbook. The four rules are implemented as processor checks plus a public validator in CI; the storage layer never understands the registry, which is both the stated weakness (detectable, not preventable) and the portability property.",
    concepts=[
     ("One record shape for everybody", "../../rules/index.html#fractal", "issuers are participants in roots.json, not a different storage shape"),
     ("The statement envelope", "schemas.html", "seq + prev make a hash chain; signer serves self- and issuer-signed statements in one shape"),
     ("The index carries no authority", None, "a curated convenience, regenerable from the records by anyone"),
    ],
    ideas=[
     "Numbered immutable files fit the platform's one-year-immutable caching contract.",
     "Proposed bounds — 256 statements, 512 KB per record, 8 KB per statement — are published to be argued with.",
     "Canonicalisation (jq -cS, sig absent) is versioned in params.json with the same precision as the key algorithm.",
    ]),
   dict(slug="schemas", file="02__schemas.md",
    title="02 — Schemas",
    role="Identity, mandate, grant, acceptance, revocation — and where a mandate lives",
    summary="The statement bodies, first pass. The structural decision the pack most wanted reviewed — a mandate is the issuer's statement so it lives in the issuer's record, with the subject appending an acceptance — was independently confirmed by the v0.33.61 register brief (evidence is appended by the asserter to its own record, never the subject's). One rule is absolute even with open data: the registry never contains a live capability; a grant records the hash of what was issued. Note: draft-1's grant definition is superseded by v0.33.61 — see change control C1.",
    concepts=[
     ("Where a mandate lives", "change-control.html", "the pack's main call, upgraded to corpus-aligned by C5"),
     ("Never a live capability", "../../shipped/index.html#capabilities", "the hashes-on-the-server discipline applied to registry content"),
     ("The verification walk", "diagrams.html", "roots, record, chain, acceptances, issuer chain, revocations — D5"),
    ],
    ideas=[
     "An unaccepted mandate is issuable but inert (proposed; open decision 8).",
     "Revocations carry effective_from, so history stays answerable.",
     "Identity statements say less on purpose: self-issued is the one place where less is more honest.",
    ]),
   dict(slug="workflows", file="03__workflows.md",
    title="03 — Workflows",
    role="Verify, enrol, operate-under-mandate — copy-paste form for a fresh LLM session",
    summary="The pack's centre of gravity: the client is a published page. Verify needs no writes, no credentials and no state. Enrol walks the bootstrap gradient as commands — keygen, canonical statement, sign, post through the account-less lane, poll the public registry for the outcome, since the read path is the outcome channel. Operate-under-mandate is the three-session shape: issuer, subject and verifier sharing nothing but public URLs. The two not-yet-shipped dependencies (lane-address derivation; exact sign/verify flags) are marked rather than assumed.",
    concepts=[
     ("The hardest easy case", "../../bootstrap/index.html#gradient", "full tooling, no standing state, reads documentation literally"),
     ("The blind ack has no probe value", "../../enrolment/index.html#lane", "pending and declined look identical, by design"),
     ("Session-scoped identities", "change-control.html", "a finding to record — and I6 in the tabletop runs it as theatre"),
    ],
    ideas=[
     "Writing the workflow page is the first acceptance test — executed, not recalled, applies to command blocks.",
     "The verifier refusing correctly is as much the test as the happy path.",
     "The passphrase question is answered on the page: an encrypted vault yes, the repo and the transcript no.",
    ]),
   dict(slug="build-order", file="04__build-order.md",
    title="04 — Build order",
    role="Read path before write path; five phases; every definition of done is a fresh-session test",
    summary="Fixtures, read path, write path, mandates and grants, the three-session demo — with one rule: the read path ships first, because it has no policy content, it is the half a genuinely public registry shares unchanged, and every later phase reports through it. Each phase is also an experiment with a stated question: where does a literal reader trip, how long does an agent identity actually live, is the mandate vocabulary usable before a broker enforces it, and where does the human actually remain in the loop.",
    concepts=[
     ("Fresh-session acceptance tests", "tabletop.html", "the documentation standard promoted to the definition of done"),
     ("One capability, deeply", "../../execution/index.html#interpretation", "repo.pull-request.create drags in constraint semantics on day one — the point"),
     ("Phase 0 upgraded by C3", "change-control.html", "the fixture class, named and bounded, before any key is generated"),
    ],
    ideas=[
     "Phase 1 has no policy content, which is why it goes first.",
     "The processor logs every decision publicly, keeping the trust boundary auditable.",
     "Phase 4's write-up names every step that needed a human — the honest residue is the publishable finding.",
    ]),
   dict(slug="diagrams", file="05__diagrams.md",
    title="05 — Diagrams",
    role="The design as pictures: the estate, the record, the write path, the walk, the demo, the gap",
    summary="Eight diagrams, each stating what it claims and which document it comes from: the three-sites composition the registry sits inside (from the v0.33.61 access report), the registry tree, the record as a hash chain, the enrolment write path, the verification walk, the three-session demo, grant/mandate/excess authority (from v0.33.61, folded in via change control), and the fixture-or-identity decision with the flag read before the signature. Rendered in-page as mermaid.",
    concepts=[
     ("D4 — the write path", "workflows.html", "the shipped lane, the blind ack, and the public read path as the outcome channel"),
     ("D7 — excess authority", "change-control.html", "grant minus mandate, the countable product"),
     ("D8 — the flag before the signature", "change-control.html", "a fixture's signatures verify and prove nothing"),
    ],
    ideas=[
     "Each diagram is a claim, which makes each one checkable against the build.",
     "D6 is the phase-4 acceptance test drawn rather than described.",
    ]),
   dict(slug="tabletop", file="07__tabletop-exercise.md",
    title="07 — Tabletop exercise",
    role="Four participants, six injects, and the four rules meeting their first population",
    summary="The registry walked through on paper before it is walked through in code. Five seats (operator/issuer, agent, verifier, red, facilitator — every one runnable as an LLM session), a baseline timeline from keygen to a verified mandate, and six injects: revocation mid-exercise, a write into another's record, the flood, the compromised processor, the fixture mistaken for an identity, and session death. The facilitator's rule makes it a documentation test too: any question the published pages cannot answer is logged as a finding. Run three times — on paper before phase 0, with real fixtures after phase 2, and live as the phase-4 demo.",
    concepts=[
     ("I4 — detectable, not preventable, measured", "architecture.html", "the gap between commit and detection is the number the MVP's honesty depends on"),
     ("I5 — the flag before the signature", "diagrams.html", "the most likely real-world implementation bug, run as a card"),
     ("Findings → comms", "../../admin/comms.html", "documentation findings become releases; rule findings go to the project lead"),
    ],
    ideas=[
     "The failure modes are procedural, not cryptographic — which is what a tabletop surfaces.",
     "An imagined population, run honestly, is the cheapest first test the four rules will ever get.",
     "Same script all three runs, so findings are comparable.",
    ]),
   dict(slug="ux-mockups", file="08__ux-mockups.md",
    title="08 — UX mockups",
    role="The register interface as intended output, screen by screen, with \u201cnobody\u201d as a first-class answer",
    summary="The v0.33.61 register-UI brief settles the primitive \u2014 a badge on every edge, carrying who can verify it, by what method, at what cost, when it was last checked and what the answer was. This document draws the screens: the agent page that must answer six questions without a reader leaving it, one badge expanded into its transcript (including what the check did <em>not</em> establish), the register index reporting its own unverifiable fraction, the mandate composer showing excess authority before the mandate is signed, a policy page that says \u201c0 rows\u201d and \u201cdetects nothing\u201d on the same screen, the blind-ack enrolment view, the verifier\u2019s answer and its refusal, the empty and failure states, and the CLI that reaches every one of the same answers.",
    concepts=[
     ("The badge, with five result states", "../../documents/register-ui.html", "confirmed, denied, unknown, unreachable, not checked \u2014 and the last three are not the same"),
     ("Verifiable by nobody", "change-control.html", "a rendered fact about the world, never a blank \u2014 C10\u2019s primitive arriving as pixels"),
     ("Excess authority, before signing", "schemas.html", "the composer shows grant minus mandate at issue time, not six weeks later"),
    ],
    ideas=[
     "Seven strings are load-bearing: each is the only place a reader learns something the rest of the screen cannot tell them.",
     "No trust score, no page-level tick, no live capability ever rendered \u2014 three deliberate absences.",
     "The CLI mirrors every screen, because if the page is the only route to the answer the design has acquired a dependency it says it does not have.",
    ]),
   dict(slug="wardley-maps", file="09__wardley-maps.md",
    title="09 — Wardley maps",
    role="Six maps: where the novelty actually sits, and why a policy is worth what its weakest badge is worth",
    summary="The pack\u2019s argument mapped, in mermaid\u2019s <code>wardley-beta</code> diagram type \u2014 the estate\u2019s first use of it, so the maps live in the source and are reviewable in a diff. The verifier\u2019s question (all the novelty is in four schema objects; everything under them is commodity); why a rented agent cannot prove where it ran (its chain terminates in a component that is commodity and worthless as evidence); the shipped surface and its two absences (not underneath it \u2014 on top of it, in Genesis); what a badge is made of; a policy verdict that cannot be more solid than a badge two layers down; and the build order as a march right-to-left. Each map states its claim, what would move it, and where the site agent\u2019s own confidence is thinnest.",
    concepts=[
     ("W2 \u2014 the missing anchor", "../../documents/two-populations.html", "the two-populations thesis in one picture, falsifiable per vendor"),
     ("W3 \u2014 the two absences, positioned", "../../shipped/index.html", "no revocation and no directory, drawn as the cost that sentence carries"),
     ("The working grammar", None, "four <code>wardley-beta</code> constraints found by running the parser, recorded so the next author doesn\u2019t"),
    ],
    ideas=[
     "Positions are judgements, not measurements \u2014 published to be moved, with the thinnest ones named.",
     "This pack is not building infrastructure: it is composing commodity components into four objects and one badge.",
     "sgit.ai\u2019s own maps are inline SVG; mermaid has since shipped Wardley as a diagram type, and text-in-the-repo maps are correctable in a pull request.",
    ]),
   dict(slug="user-stories", file="10__user-stories-and-features.md",
    title="10 \u2014 User stories, features and workflows",
    role="Who gets what, and how we know it works \u2014 six users, twenty-four stories, fourteen features, six workflows",
    summary="The pack turned into something a reviewer can sign off and a builder can work from. Six users \u2014 verifier, agent, issuer, processor, policy owner and <b>auditor</b>, split out as its own seat because it is the only one that exercises <code>effective_from</code>. Twenty-four stories, each with a test that <em>can fail</em> and a tag naming its phase, its defining document and its screen. Fourteen features with a status column whose honest reading is that everything at phase 0\u20131 is designed and nothing is built. Six end-to-end workflows, the mandate lifecycle as states, a traceability table, and a flat list of what the pack does <em>not</em> deliver \u2014 enforcement, receipts, confidentiality, attestation, a graph browser, a trust score, and estimates.",
    concepts=[
     ("The auditor as a separate seat", "schemas.html", "a verifier asks about now and may stop early; only an auditor reads the log backwards"),
     ("WF-6 has no acceptance test", "change-control.html", "a finding against the build order, recorded as C12 rather than tidied away"),
     ("P2 pulls against A3", "workflows.html", "a public processor log is the oracle the blind ack exists to withhold \u2014 unresolved, and named"),
    ],
    ideas=[
     "A story whose acceptance criterion cannot come out negative is a description wearing a story\u2019s clothes.",
     "A3 is a story whose success is an absence \u2014 the easiest thing here to break by accident and the hardest to notice.",
     "Estimates are deliberately absent: a fabricated number in a delivery document outlives every caveat attached to it.",
    ]),
   dict(slug="observability", file="11__observability.md",
    title="11 \u2014 Observability",
    role="Nobody can tell you who is using a mandate \u2014 the issuer's lane can tell you who has never checked one",
    summary="The layer that answers a question this site raised in four places and answered in none: a mandate says what an agent may be <em>authorised</em> to do, not what it does \u2014 so who is using it? The answer refuses the question. What is capturable is <b>verification, not use</b>, and the two come apart both ways: a party that uses a mandate without verifying generates nothing, and the party that never verifies is the party whose relying process is weakest. So the product is the <b>missing</b> edges \u2014 who holds a mandate I issued and has never once checked it \u2014 a join the issuer can compute because it holds both halves. Where the log lives decides everything: a central check log accumulates who is evaluating whom across parties that never consented; a check event written into the <b>issuer's own lane</b> is an owner observing their own asset. And revocation latency becomes measurable before anything is ever revoked.",
    concepts=[
     ("A verification is not a use", "../../mandate/index.html", "the four places this site says a mandate does not observe behaviour \u2014 all still true"),
     ("The gap is the finding", "ux-mockups.html", "the third list of absences in this pack, and again the actionable half"),
     ("Where the log lives", "change-control.html", "C14: rule 1 applied to telemetry resolves C9 rather than contradicting it"),
     ("Effective revocation latency", "schemas.html", "the interval between a party's checks, computable before anything is revoked \u2014 and one of the very few decidable mandate clauses"),
    ],
    ideas=[
     "Without check events, declared mandates produce no evidence \u2014 which would make the pack's own justification for building them indefensible.",
     "The design that protects the positioning is the design that destroys the dataset, and it should be chosen deliberately rather than discovered later.",
     "Draining the lane is an obligation that fails silently: an issuer who stops draining stops receiving evidence without being told.",
     "This is where the badge's \u201clast checked\u201d field comes from \u2014 the observability layer is the interface's evidence, not a second dashboard.",
    ]),
   dict(slug="grant-tree", file="12__grant-tree-and-control-labels.md",
    title="12 \u2014 The grant tree and control labels",
    role="Blast radius is a path through a tree, and the label on each node is the column nobody publishes",
    summary="The grant side, which the pack had specified least and needed most once C1 made the gap between grant and mandate the product. A grant is a <b>tree</b> of subgrants, so blast radius is a path through it rather than an item in a list \u2014 and the load-bearing part is the label on each node, above all <b>who enforces the thing standing in the way</b>. The general test needs no vendor claim: <b>a control bounds a grant only when it is enforced by something the grant does not include</b>, giving boundary, setting and expectation, and placing most of what people currently rely on in the middle tier that reads like a boundary and behaves like a setting. Plus the <b>shortfall</b>, the region C1 never named; the two populations with one hosted tree measured rather than described; prohibitions as a generated presentation layer over a stored allow-list; and the correction that <b>counting acceptances is the one metric that inverts under pressure</b>.",
    concepts=[
     ("The three-tier control test", "change-control.html", "C16: enforced from outside the grant, from inside it, or by nothing at all"),
     ("Excess authority, and the shortfall", "schemas.html", "grant minus mandate hurts security; mandate minus grant hurts operations and is harder to detect"),
     ("A hundred percent acceptance", "user-stories.html", "means the risks are trivial or the process is theatre \u2014 so declines are instrumented first"),
     ("Two populations, neither winning", "wardley-maps.html", "locally the containment is available and unused; hosted it may be excellent and is unverifiable"),
    ],
    ideas=[
     "A safe inside a house you handed the keys to is a delay, not a boundary \u2014 and so is a folder restriction enforced by a tool running as you.",
     "A permission prompt disableable by a flag the agent can write is an expectation wearing a setting's clothes.",
     "Each node carries its own date: a vendor changing one default invalidates one row, and a tree dated as a whole is quietly wrong while looking current.",
     "The fourth list of absences in this pack \u2014 risks that could not be stated is the most informative number in the set.",
    ]),
   dict(slug="keys-and-signatures", file="13__keys-and-signatures.md",
    title="13 \u2014 Keys and signatures",
    role="A key belongs to whatever can keep a secret \u2014 everything else is signed by something that can",
    summary="Which things in this design get keypairs, and why the answer is fewer than proposed. Two principles adopted: <b>a secret is defined by expectation, not by content</b> (which explains the estate's existing key rules in one line, and needs the intention recorded <em>at issue</em>, because a deliberate publication and a leak are indistinguishable afterwards); and <b>a signature's value comes entirely from the scarcity of the private half</b>. One proposal declined \u2014 per-object keypairs with the private half published \u2014 because it leaves a hash wearing a signature's clothes, defeats its own stated use, and would make C3's fixture flag true on every row. <b>A flag that is always true is a column, not evidence</b>, so declining the proposal is what preserves C3 rather than conservatism.",
    concepts=[
     ("A secret is defined by expectation", "change-control.html", "C18: sort by intention rather than by class, and record it at issue"),
     ("Scarcity is what a signature is made of", "schemas.html", "publish the private half and a verifier succeeds and concludes something false"),
     ("Artefacts get signed, principals get keys", "grant-tree.html", "confirmed twice, by two independent routes"),
     ("Sign by default, and publish what anybody checks", "observability.html", "a fully signed graph nobody verifies manufactures the appearance of assurance"),
    ],
    ideas=[
     "Destroying a vault makes its key safe to publish from your server's point of view, and says nothing about the content \u2014 custody without access means mirrors exist that nobody can enumerate.",
     "The one genuine benefit of a per-object key is an address, and the lane derivation is proposed rather than shipped.",
     "Route to the issuer's lane tagged with the object's identifier: one lane per party, not one per document.",
     "Whether a rented instance can hold a private half across sessions is open, and it decides whether instances can hold identities at all.",
    ]),
   dict(slug="user-assessment", file="14__user-assessment.md",
    title="14 \u2014 The user assessment",
    role="The one document here describing something built \u2014 and a conformance test for the site's own claim",
    summary="Specifies the workflow now live at <a href='../../assess/index.html'>/assess</a>, where a visitor assembles their own installations as grant trees and mandates and sees what is reachable that they never intended. Two findings shaped every decision, and both cut against the obvious build. <b>A completed assessment is, assembled, a plan for attacking the visitor</b> \u2014 so the site stores their <em>choices</em> and never their <em>answers</em>, implemented as strictly as it can be: <b>there is no free-text input anywhere on the page</b>. And the objective is behaviour change, which has a measured failure mode: <b>a strong threat with a weak answer produces denial rather than change</b>, so every case ends on something the visitor can actually do \u2014 and the hosted case, which has zero efficacy by construction, ends on a <em>request</em> rather than a pretend remedy.",
    concepts=[
     ("Store the choices, not the answers", "change-control.html", "C20 \u2014 references into a public library, and nothing typed"),
     ("A conformance test for our own claim", "../../assess/index.html", "browser storage makes the privacy claim architectural, and checkable in ten seconds"),
     ("Zero efficacy by construction", "grant-tree.html", "the hosted page is the one most likely to alarm and least able to do anything with the alarm"),
     ("The acceptor is a role, not a name", "user-stories.html", "so this page cannot meet the pack's own named-acceptor standard \u2014 recorded, not hidden"),
    ],
    ideas=[
     "A general page may withhold the answer; a personalised one may not \u2014 the discriminator is whether the message is about the world or about the reader.",
     "Every excess path on a local tree bottoms out at the same node, so the page says it once: this is one problem rather than eleven.",
     "No score out of a hundred: a score gets optimised for how alarming it feels.",
     "The measure set is stated and the page cannot instrument any of it, because it deliberately has no backend.",
    ]),
   dict(slug="pr-faq", file="90__pr-faq.md",
    title="Appendix A \u2014 The PR/FAQ",
    role="The pack written backwards from a customer \u2014 and the customer-quote slot we could not fill",
    summary="Amazon's Working Backwards form applied to the registry: a press release dated at a hypothetical launch, an external FAQ, and an internal FAQ written to hurt. It is the only document in this pack that reasons from a customer inward rather than from the design outward, and the exercise produced three findings the design documents could not have. <b>The honest press release is narrower than the pack's own framing</b> \u2014 every draft wanted to say <em>know what your agents can do</em>, and the register cannot support that sentence. <b>The customer-quote slot is empty</b>, because there is no customer and inventing one is the move this site's participant rules forbid. And two internal-FAQ answers should change what happens next: the model that monetises best contradicts the positioning, and the central value proposition has never been tested on anybody outside the project.",
    concepts=[
     ("Why the operator, not the verifier", "user-stories.html", "the verifier is the seat the design serves and adopts nothing \u2014 the operator is the one who decides"),
     ("Internal FAQ 5 \u2014 the revenue contradiction", "observability.html", "metered verification requires observing every check, which is the dataset we argued against holding"),
     ("Internal FAQ 11 \u2014 the untested claim", "../../assess/index.html", "whether <em>checkable by a third party</em> is worth anything to anybody who is not us"),
    ],
    ideas=[
     "The empty customer quote is a dated readiness marker: the day it can be filled honestly, phase 4 has actually happened.",
     "Fourteen documents of design can be written without noticing that nobody has used this; one press release cannot.",
     "The cheapest next step in the whole pack is asking five operators whether anybody has ever asked them to prove an agent's authority \u2014 and it needs no registry.",
    ]),
   dict(slug="rep-0001", file="91__rep-0001.md",
    title="Appendix B \u2014 REP-0001: The registry core",
    role="The normative specification, in PEP form \u2014 with MUST, MUST NOT, and the sections PEP 1 makes mandatory",
    summary="The design restated as something an implementer works from, borrowing Python's enhancement-proposal format for the sections it <em>forces</em>: <b>Security Implications, How to Teach This, Rejected Ideas and Open Issues are required, not optional</b>, and three of the four are where this design has most to say. Everything normative in documents 01\u201303 and 11\u201313 is collected with RFC 2119 keywords and every recorded corrective applied, which makes it the one place in the pack where the schemas are current rather than superseded-with-a-note. Its <code>Status</code> is <code>Draft</code> and its <code>Sponsor</code> field is <b>empty</b> \u2014 PEP 1 requires a champion, and the gap is accurate rather than an omission.",
    concepts=[
     ("The ownership rule, normatively", "../../failure/index.html", "a valid signature by a non-owner MUST NOT be write authority \u2014 2019 reproduced exactly if you check one and not the other"),
     ("Eleven rejected ideas", "change-control.html", "the section to read before proposing an improvement"),
     ("Read the fixture flag before the signature", "keys-and-signatures.html", "a fixture's signatures verify and prove nothing"),
     ("Teachability as a definition of done", "workflows.html", "if a fresh session cannot complete the walk from the page alone, the spec is not finished"),
    ],
    ideas=[
     "The pack's decisions register is a Status field that has not been formalised yet.",
     "A REP can never move past Draft while there is no accepting authority \u2014 which is the honest state, not a gap to paper over.",
     "PEPs are CC0; this is CC BY 4.0, and the deviation is stated rather than made quietly.",
     "One REP for six separately contestable ideas is against PEP practice, and it should split the moment any one of them is contested.",
    ]),
   dict(slug="interface-rendered", file="15__interface-rendered.md",
    title="15 \u2014 The screens, rendered",
    role="Document 08's twelve screens built by an outside session \u2014 and the six things the fixed-width form was hiding",
    summary="The first document in this pack written by <b>somebody who was not in it</b>: a session working from the briefing pack cold, answering <em>if this were implemented as specified, what would it look like?</em> Twelve screens as real markup at real widths, with all seven of document 08's load-bearing strings <b>verbatim</b> \u2014 a constraint it set itself and met. Five of its six findings are things the ASCII form could not have surfaced, because a 78-column monospace block has no viewport, no colour, no interaction and no wrap point: <b>colour re-collapses the five result states</b>; the badge's wrap point can produce the exact misreading the badge exists to prevent; <code>nobody</code> and <code>not-yet</code> share a glyph; and <b>a column of five ticks is a page-level tick</b>, which document 08 forbids and which no individual rule was broken to produce.",
    concepts=[
     ("The screens themselves", "mockups.html", "twelve tabbed screens, deep-linkable, no framework and no third-party request"),
     ("Adopted as C27\u2013C31", "change-control.html", "three corrections about drawing rather than wording, one standing rule, and what the exercise itself established"),
     ("An inert control over an absent one", "observability.html", "the auditor's screen stays visibly blocked, because the traversal is unwritten code and drawing it would hide that"),
    ],
    ideas=[
     "The strings are the design \u2014 a renderer that paraphrases them in a mockup will paraphrase them in the product.",
     "A story with no screen is how a story quietly does not ship: document 12's I8 and document 13's fixture flag both landed on screens that predate them.",
     "Rendering an unbuilt system in real design tokens makes it look shipped, which is why every screen carries a banner saying it is not.",
     "The first evidence in this record of what <em>know your users</em> and <em>listen to your ecosystem</em> are actually worth \u2014 it took one outside reader.",
    ]),
   dict(slug="doctrine", standalone=True,
    title="Appendix C \u2014 Doctrine",
    role="Wardley's forty doctrines, and an honest self-assessment of this project against every one",
    ),
   dict(slug="change-control", file="99__change-control.md",
    title="Appendix D — Change control",
    role="Every correction and every decision in one place — the errata, and the register of what is settled and what is not",
    summary="The appendix, and the one document in this pack that never stops growing — which is why it sits last rather than at number six. Every correction the corpus has made to a published document in this pack, each with its source and its status, and the decisions register: <b>thirty-two corrections and forty-five decisions</b>, of which roughly a third are still open and belong to the project lead. It exists because of a rule the pack takes from the corpus: <b>a published document is not silently edited</b>. Sources stay verbatim; corrections live here; draft-2 folds them in and this becomes its change log. Read it <b>second</b> if you are about to build from documents 00–04, so you read them with the errata in hand — and <b>last</b> if you are reading the pack through. Never not at all.",
    concepts=[
     ("C1 — grant redefined", "../../documents/grant-vs-mandate.html", "the v0.33.61 brief this folds in"),
     ("C2 — designed in June", "../../documents/register-fixtures.html", "inherit, don't re-derive: clues-not-storage, two-level trust, partial resolution"),
     ("C5 — confirmed from two directions", "schemas.html", "the mandate-location rule, now corpus-aligned"),
    ],
    ideas=[
     "Sources stay verbatim; corrections live here until draft-2 folds them in — supersede, never rewrite.",
     "Four decisions are settled, four are open, and the register says which is which.",
    ]),
  ]),

 dict(slug="map-your-case",
  name="Map Your Case: The Grant–Mandate Delta, Mapped By Its Owner",
  origin="Authored by the pki.sgit.ai site agent, 21 August 2026, at the project lead's request — and written the other way round from its sibling: the tool it specifies is already built. The assessment at /assess shipped as v1 on 20 August and was rebuilt as v2 on 21 August from the project lead's corrections; this pack captures the thinking that produced it and specifies v3, with four corrections and eighteen decisions in the appendix at draft-1. Corpus version assigned on adoption.",
  date="21 August 2026 · draft-1 + change control",
  origin_short="Site agent, this repo",
  row_date="21 Aug 2026 · draft + change control",
  extra="""
<h2 id="readers">Below the pack: the synthetic readers</h2>
<p>The pack is an argument about a tool. <a href="readers/index.html"><b>The readers area</b></a> is the
instrument that tests it — and it sits <b>outside</b> the pack on purpose, because it feeds the pack rather
than belonging to it, and because its output is <b>simulated material</b> that must never be shelved beside
the documents it tested as though it were the same kind of thing.</p>
<p>Two agents: one is a browser and nothing else; one is an archetype that receives <b>pixels and nothing
else</b> — no page text, no structure, no source, no knowledge of the project — and points spatially at where
to go next. Patience is set from outside the model, so abandonment is a measured event rather than a story the
model tells about itself. <b>One run has been performed</b> and its findings are already in
<a href="change-control.html">change control</a> as MC5&ndash;MC9.</p>
<div class="tablewrap"><table>
  <thead><tr><th>Where</th><th>What it holds</th></tr></thead>
  <tbody>
    <tr><td><a href="readers/index.html"><b>The readers area</b></a></td><td>The programme, the run index, the schedule of what has <em>not</em> been run, and the findings so far</td></tr>
    <tr><td><a href="readers/archetypes.html"><b>The three archetypes</b></a></td><td>The shipping founder, the agent-security practitioner, the adoption executive &mdash; property lists, not portraits</td></tr>
    <tr><td><a href="readers/instruments.html"><b>The fixed instruments</b></a></td><td>The elevator pitch, and the expectation, comprehension and closing questions &mdash; fixed wording, all four</td></tr>
    <tr><td><a href="readers/simulated-run-001-founder-tabletop.html"><b>Simulated run 001</b></a></td><td>Six screens, verbatim reactions, the budget ledger, seven findings &mdash; and a pre-registered prediction that turned out wrong</td></tr>
    <tr><td><a href="readers/simulated-run-001-founder-analysis.html"><b>Run 001 &mdash; informed analysis</b></a></td><td>The type B pass: the same run read by an agent that <em>has</em> read the pack</td></tr>
  </tbody>
</table></div>
""",
  dl_blurb="",
  one_line="The dev pack for <a href='../assess/index.html'>the assessment</a> — the one thing on this site that is built rather than specified. Thirteen documents and a change-control appendix: the principles each purchased with a mistake, the library, the model, the two 20 August programmes (levels × variants, and synthetic readers behind a screenshot boundary), sharing by fragment, four Wardley maps, and the honest record of the first MVP.",
  meta_desc="The Map Your Case pack, readable in-page: the leading brief, thirteen principles, the library, the model, the architecture, user stories, the screens, the levels-and-variants programme, the synthetic-reader tabletop, sharing, four Wardley maps, the v3 build order, the first-MVP retrospective, and change control.",
  three_sentences="The dev pack for <a href='../../assess/index.html'>Map Your Case</a>, written after the thing it specifies: v1 shipped on 20 August, the project lead's corrections arrived within hours, v2 shipped the next day — so half of this pack is capture (the <a href='principles.html'>thirteen principles</a>, <a href='library.html'>the library</a>, <a href='model.html'>the model</a> and <a href='architecture.html'>the architecture</a> as built, with their reasons) and half is specification, expanded in documents first so v3 is built from pages rather than memory. Two v0.33.61 programme briefs land here as first-class documents: <a href='levels-and-variants.html'>levels and variants as two axes</a> — five scenarios ordered by grant size, everybody starts at level one, and the three sets whose third row (<em>held and never used</em>) is the product — and <a href='synthetic-readers.html'>the synthetic-reader tabletop</a>, where the screenshot boundary is the instrument, the patience budget comes from outside the model, and the two 9 August simulation rules are carried verbatim. <a href='first-mvp.html'>Document 12</a> is the extra one a hindsight pack owes: what v1 got wrong, the six bugs that became principles, and what was verified before each ship — the receipts behind every rule the pack states.",
  site_relevance="This pack owns the first thing on this site that is <em>built</em>: the workflow at <a href='../../assess/index.html'>/assess</a>, which the <a href='../registry-mvp/index.html'>registry MVP pack</a> describes from the outside as its document 14 and its one shipped consumer. Its constraints are the site's published positions — <a href='../../documents/grant-vs-mandate.html'>grant is not mandate</a>, <a href='../../documents/grant-tree.html'>the three-tier control test</a>, <a href='../../documents/user-section.html'>store the choices, not the answers</a> — and its two programme documents operationalise <a href='../../documents/levels-and-variants.html'>the levels-and-variants brief</a> and <a href='../../documents/synthetic-readers.html'>the screenshot-boundary brief</a>, both captured verbatim under documents.",
  docs=[
   dict(slug="dev-brief", file="00__LEADING-BRIEF.md",
    title="00 — The leading brief",
    role="What the tool is, the inherited vocabulary, five positions on one axis, and the concession made first",
    summary="The pack scoped, and the inversion named: this pack is written after the thing it specifies, so half is capture and half is v3 specification, with the change-control appendix recording which differences from the shipped tool are deliberate. The tool renders the delta between grant (what an installation can technically reach) and mandate (what its owner meant to authorise) from a public library, with nothing about the visitor ever leaving their browser. The audience is organised by grant size rather than job title — five scenarios from dictation to operations — and the framing concedes the experienced reader's objection before making its argument: the gap is not only where the danger is, it is also where the value came from, so the honest rendering is three sets, and the third — held and never used — is the product.",
    concepts=[
     ("Grant, mandate, excess, shortfall", "../../documents/grant-vs-mandate.html", "the vocabulary is inherited from the corpus, not invented here"),
     ("The registry relationship", "../registry-mvp/user-assessment.html", "same argument, two audiences, opposite direction of computation"),
     ("The three sets", "levels-and-variants.html", "mandated, exercised beyond the mandate, held and never used"),
    ],
    ideas=[
     "The registry computes excess authority from records; this tool computes it from choices — and stores neither.",
     "A reference implementation whose design lives in one retrospective document inside somebody else's pack is a reference to nothing.",
     "Everybody starts at level one: expertise predicts vocabulary, not whether somebody knows their own grant.",
    ]),
   dict(slug="principles", file="01__principles.md",
    title="01 — Principles",
    role="Thirteen invariants, each with its reason and the check that would catch a violation",
    summary="The rules the tool runs on, collected because most are implemented as absences — no free-text input, no backend, no score, no risk acceptance — and an absence is the easiest thing in a codebase to break politely. Each principle carries three parts: the statement, the reason, and how a violation would be caught, because a principle nobody can test is a preference. The set includes the two 9 August simulation rules verbatim (a simulated acceptance must never be confusable with a real one; simulate the role, not the named individual) and the variant rule that makes renderings governable: a persona may change emphasis, ordering, vocabulary and format, and may never change what is being accepted — mechanically checkable here, because the library gives facts identity and a fact-set diff across variants must be empty.",
    concepts=[
     ("Store the choices, never the answers", "../../documents/user-section.html", "P1 — implemented as the absence of any text input"),
     ("Computed, never asserted", "model.html", "P3 — every conclusion about the visitor traces to a model function"),
     ("The variant rule", "levels-and-variants.html", "P11 — an empty fact-set diff, checkable without judgement"),
     ("The two simulation rules", "synthetic-readers.html", "P12 — carried verbatim because document 08 builds the machinery they govern"),
    ],
    ideas=[
     "Nearly every rule here was purchased with a specific mistake — document 12 has the receipts.",
     "“Not sure” resolves to present-but-unverified, because assuming absence is the comfortable error.",
     "Every personalised result ends on something the visitor can do; the hosted case ends on a request.",
     "The gap is conceded as where the value came from before it is named as the danger.",
    ]),
   dict(slug="library", file="02__the-library.md",
    title="02 — The library",
    role="The single data file: what it holds, the rules its entries obey, and why the honesty lives here rather than in the code",
    summary="Everything the tool knows lives in one versioned JSON file, served same-origin, readable raw, and rendered by its own explorer page. The code computes; the library claims — so an argument with the tool is an argument with a library row, reviewable in a pull request. The basis rule keeps named products from becoming a vendor scorecard: every tree is derived from what a surface architecturally is, so the product picks the surface and the surface carries the tree. Facts are questions with a fixed vocabulary and requires-chains; controls are already-true containment with four structural effect fields; nodes carry tier, evidence class and quotable detail prose; escalations carry their why in plain language; and every surface names a public re-run method, because the library never asks to be believed.",
    concepts=[
     ("Architecture, not audit", "../../documents/grant-tree.html", "a CLI agent reaching what your account reaches is a fact about CLI programs, not a claim about a vendor"),
     ("Four evidence classes", "model.html", "derived, third-party, measured, tested — and the weakest on the path labels the answer"),
     ("Benign nodes are mandatory", "first-mvp.html", "a tree that only lists frightening capabilities measures its own framing"),
    ],
    ideas=[
     "Fact-set identity is load-bearing: renaming a fact id breaks every stored assessment and share link, and gets a change-control entry.",
     "The library is dated as a whole at v2, and that is a recorded defect (MC3) — per-node dates are phase 1.",
     "A control's effect is never its description — it is a before/after diff against this visitor's case.",
    ]),
   dict(slug="model", file="03__the-model.md",
    title="03 — The model",
    role="Choices to delta in six stages — and the three places the obvious implementation is wrong",
    summary="The computation, pure and testable: facts prune, controls reshape, every path is enumerated, the weakest link labels the capability, the weakest route wins across surfaces, and the dashboard gets a sentence rather than a histogram — the chokepoint: one node is the weakest link on N of M paths, which says the visitor has one problem rather than eleven. The three documented traps: escalation-existence must be tracked across all paths, not on the winner (the root already wins every direct-path contest, so winner-only tracking hid every escalation the library had); dropping a node must walk its ancestors; and a tree without benign capabilities manufactures false shortfalls that a test suite can happily assert.",
    concepts=[
     ("The weakest link on the path", "library.html", "a path is only as bounded as its least-enforced node — the file's one idea"),
     ("The chokepoint sentence", "screens.html", "on local surfaces the tier histogram reads all-none and tells nobody anything"),
     ("Escalation tracked across paths", "first-mvp.html", "the shipped bug: recording it on the winning path alone masked all of them"),
    ],
    ideas=[
     "The model's entire output vocabulary is: reachable, tier, evidence, path, excess, shortfall, chokepoint, closes, strengthens.",
     "Every bug in this document's history has a test that fails if it comes back.",
     "controlEffect runs the whole pipeline twice and diffs — the most expensive call in the file, and still instant at library scale.",
    ]),
   dict(slug="architecture", file="04__architecture.md",
    title="04 — Architecture",
    role="Web components without shadow DOM, one state owner, and storage that treats its own absence as a case",
    summary="The page as engineering: seven JS files with one-line jobs, six custom elements that are seams rather than boundaries (no shadow DOM — the site's stylesheet should reach in), bubbling CustomEvents up and state down through a single owner in app.js, and a hand-rolled SVG renderer because a chart library is a third-party request. store.js handles storage's three failure modes explicitly, including the opaque-origin case a downloaded copy hits. The v1 lesson stands behind the layout: one large HTML page with everything inline was named in the correction memo, and the v2 split is what made design changes reviewable as diffs of one file.",
    concepts=[
     ("Events up, state down", "first-mvp.html", "every v1 inert-click symptom traced to state living in more than one place"),
     ("Same-origin as architecture", "principles.html", "the network panel after a full pass shows only this site — checked every release"),
     ("Two views, one graph", "screens.html", "the scene for recognition, the DAG for structure"),
    ],
    ideas=[
     "A new section is a new component with its own events — never a script block in the page.",
     "A capability that needs a server is a different page with its own disclosure, not an upgrade to this one.",
     "model.js stays DOM-free, or the test harness goes blind.",
    ]),
   dict(slug="workflows", file="05__workflows-and-user-stories.md",
    title="05 — Workflows and user stories",
    role="Five users, twenty stories with tests that can fail, seven workflows, and the honest feature column",
    summary="The pack as deliverables. Five users — the visitor at five grant positions, the librarian, the sharer and recipient, the run operator, the site agent — and twenty stories each carrying a test that can come out negative, tagged with its defining document and shipped status. The feature table's honest reading is the inverse of the registry pack's: the instrument is built, the programmes around it are not. The flat refusals list is repeated from the principles so a reviewer can disagree in one place: no risk acceptance, no scanning, no backend, no score, no A/B statistics at qualitative sample sizes, no preferences verdict from synthetic readers.",
    concepts=[
     ("A test that can fail", "../registry-mvp/user-stories.html", "the sibling pack's standard, applied — a story that cannot fail is a description"),
     ("The acceptor is nobody", "principles.html", "no user of this tool is ever asked to sign anything — P7 as a user model"),
     ("V8, the standing story", "architecture.html", "no request leaves the origin — re-run before every release"),
    ],
    ideas=[
     "V12 (the three sets) is the one story gated on an open decision rather than on effort.",
     "The librarian's stories become scripts in phase 1; at v2 they are conventions, and the column says so.",
     "Workflow 7 — test a page before building it — is a workflow of this product, not just of its development.",
    ]),
   dict(slug="screens", file="06__screens.md",
    title="06 — The screens",
    role="The page in order, the rendering rules, the load-bearing strings, and the four v3 screens",
    summary="Dashboard first — the page shows what it can already say before it asks for anything, the exact inversion of v1's reading-first order. Each shipped screen with its job and its fixed wording: the chokepoint sentence, “not established either way” for untouched facts, “changes nothing in your current case” for a control that does nothing here. Five rendering rules inherited from the estate's mockup exercise: no page-level verdict, state never rides on colour alone, an absent computation renders as absent, situation copy comes from the model, wide content scrolls in its own container. The v3 screens are specified for the tabletop before they are built: the level-one landing, the three-sets dashboard, the share view, and the run gallery whose job is the working method rather than an advertisement.",
    concepts=[
     ("The order is the argument", "first-mvp.html", "v1 made the visitor pay before seeing the instrument work"),
     ("Strings are design", "../registry-mvp/interface-rendered.html", "a renderer that paraphrases them in a mockup will paraphrase them in the product"),
     ("The run gallery", "synthetic-readers.html", "abandoned runs, the change made, and the run that then succeeded"),
    ],
    ideas=[
     "Wherever a summary number would go, the chokepoint sentence goes instead — a noun the visitor can act on.",
     "A control that closes nothing must say so, or the row reads as broken rather than honest.",
     "The screen this tool will never have is a score.",
    ]),
   dict(slug="levels-and-variants", file="07__levels-and-variants.md",
    title="07 — Levels and variants",
    role="The explanation programme: a grid not a ladder, five grant-ordered scenarios, the three sets, and the stopping rule",
    summary="The v0.33.61 levels-and-variants brief operationalised. Levels vary depth for one reader; variants vary the rendering of one level; they are orthogonal, and a programme that conflates them cannot tell whether a poor result needs different content or different wording. The variant rule is mechanically enforceable here because the library gives facts identity: a fact-set diff across variants must be empty. Everybody starts at level one — the advanced user holds the largest grant and the strongest prior, the reactance combination — and the five scenarios are ordered by grant size, landing in this tool as library examples. The three sets organise the dashboard, with the exercised set's import gated on an open decision because its source is a session transcript. The stopping rule answers the depth question by dissolving it: each level must be a complete answer, a landing rather than a stair.",
    concepts=[
     ("The grid", "../../documents/levels-and-variants.html", "five levels by three variants, generated rather than written"),
     ("The three sets", "screens.html", "the third row — held and never used — is the product"),
     ("The stopping rule", "build-order.html", "shown only level three, the reader says what they would do — or the level failed"),
     ("Reserved words", "../registry-mvp/observability.html", "altitude stays stakeholder; persona stays the generator"),
    ],
    ideas=[
     "Test the visual variants first: a visual eliminated a framing effect significant in text alone, and this tool ends in a picture.",
     "At a few dozen readers this is qualitative research — watch, ask for say-back, count nothing.",
     "Synthetic readers clear the levels; humans judge the variants; that order is also the cheap one.",
    ]),
   dict(slug="synthetic-readers", file="08__synthetic-readers.md",
    title="08 — Synthetic readers",
    role="The tabletop: pixels only, fixed artefacts, exogenous budgets, defects not preferences — and the two rules kept verbatim",
    summary="The v0.33.61 screenshot-boundary brief operationalised. Two agents: a renderer that is a caller of the estate's existing browser-automation service, configured never to pass text or structure on; and a reader that receives pixels and nothing else, is never told the page's purpose, and clicks spatially. The page under test is a fixed artefact authored before the run — a page generated during the run measures the model agreeing with itself — and the patience budget is set exogenously so abandonment is a measured event rather than a coherent story. The honest limit is stated as the method's credibility: synthetic readers find defects and cannot report preferences. Rule one puts the simulation marker in the filename, the headers and beside every quote, because export is where markers die; rule two's narrow exception is the archetype, with a test checkable by somebody other than the author.",
    concepts=[
     ("The screenshot boundary", "../../documents/synthetic-readers.html", "the instrument, not a limitation — and somebody will try to improve it away"),
     ("The fixed comprehension question", "principles.html", "what would you do now, and what did that page tell you — in those words, every time"),
     ("Portrait versus archetype", "levels-and-variants.html", "the property list is the archetype; the individual is only where properties were sampled"),
     ("The service boundary", "build-order.html", "comprehension questions only — and it is a property of the product, not of its terms of service"),
    ],
    ideas=[
     "A synthetic run should be difficult to quote misleadingly even by somebody trying.",
     "The runs worth publishing most are the abandoned ones, because those changed the design.",
     "The calibration record — published, including the misses — is what separates a product from a plausible-opinion generator.",
     "First budgets are stated to be argued with: six screens, ten minutes, eight clicks — and round two's come from round one's spend data.",
    ]),
   dict(slug="sharing", file="09__sharing.md",
    title="09 — Sharing",
    role="The fragment as the channel, identifiers as the payload, and the drift a pinned version makes sayable",
    summary="How a case leaves the browser without describing its owner. The choices-only rule solved sharing before it was designed: the stored artefact is references into a public library, so a share discloses nothing personal by construction. The channel is the URL fragment — never sent to a server — carrying the state object plus the library version it was composed against. On version mismatch the recipient gets today's truth plus a notice, never the old library served as if current. Screenshots get one rule instead of machinery: the dashboard renders its library version where a natural screenshot captures it. And three refusals: not a collaboration backend, not an identity, and never a channel for transcript material.",
    concepts=[
     ("The fragment channel", "../../documents/levels-and-variants.html", "settled on 16 August for keys; the same channel carries a selection"),
     ("Version pinning", "library.html", "the drift count needs per-node dates — one more reason MC3 is phase 1"),
     ("The loaded state is marked", "principles.html", "a share must not be confusable with the recipient's own answers"),
    ],
    ideas=[
     "The obvious backend solution creates exactly the stored answers this tool exists to never hold.",
     "The encoder refuses anything that is not a library identifier or a vocabulary answer — story S1 stays testable.",
     "If the three-sets dashboard ever shares, it shares the visitor's claims, never transcript material.",
    ]),
   dict(slug="wardley-maps", file="10__wardley-maps.md",
    title="10 — Wardley maps",
    role="Four maps: the scarce components are all editorial, none mechanical",
    summary="The tool mapped in mermaid's wardley-beta, inheriting the sibling pack's working grammar. M1 finds the novelty in exactly two components — library curation and the delta framing — with everything between them product-shaped, which is why v1 could be rebuilt as v2 in a day. M2 draws the honesty chain and finds its one genesis component: per-node dating, from which the whole chain's credibility hangs by the same weakest-link rule the model applies to the visitor's paths. M3 splits the testing programmes — defect detection stands on near-product components, preference judgement on the scarcest one, recruited humans — and finds the calibration record at deep genesis. M4 maps the advanced user's reframing and positions the exercised set at genesis for a design reason, not a technical one.",
    concepts=[
     ("The maps agree", "build-order.html", "the genesis components are written, not programmed — the argument for documents-before-code"),
     ("M2 — the honesty chain", "library.html", "a claim's credibility hangs from its least-evolved link"),
     ("The working grammar", "../registry-mvp/wardley-maps.html", "the wardley-beta constraints, found empirically there, applied here"),
    ],
    ideas=[
     "Positions are judgements published to be moved; the thinnest one is named under each map.",
     "If a public evidence-classed library of agent grant trees existed elsewhere, M1's genesis component would be an adoption, not a build — none is known, dated 21 August 2026.",
     "The code is where the hours go and the maps say it is the cheap part — the inverse of how the work feels.",
    ]),
   dict(slug="build-order", file="11__build-order.md",
    title="11 — Build order",
    role="Five phases; documents before code; tabletop before build; every definition of done a run or a check",
    summary="The v3 order, chosen by two rules: the scarce components are editorial (the maps' finding), so writing them is the critical path; and every new screen gets a synthetic-reader round as a fixed mockup before implementation, because a defect found there costs a file edit rather than a refactor. Phase 1 pays the library's debts (per-node dates, the five scenarios, the entry checker as a script). Phase 2 writes and tabletop-tests level one before building it, and publishes the runs including abandonments. Phase 3 ships fragment sharing. Phase 4 ships the three sets on the visitor's claims, with the transcript import waiting for its decision rather than being prototyped around. Phase 5 — only after synthetic rounds cleared the levels — spends the few dozen real readers on visual variants first, qualitatively.",
    concepts=[
     ("Tabletop before build", "synthetic-readers.html", "the programme's highest-value use, scheduled rather than admired"),
     ("Phase 4's gate", "levels-and-variants.html", "the one feature that could breach P1 by accident waits for its decision"),
     ("The standing checks", "principles.html", "same-origin, model suite, the no-free-text grep, the wording rules — every phase"),
    ],
    ideas=[
     "A published tabletop against an unbuilt page is the estate's publish-before-build move one layer deeper.",
     "The persona-simulation service is unscheduled because building it before a calibration record exists is building the unfalsifiable version.",
     "Phase 2 is done when an abandonment produced a change and the changed page's re-run is published beside it.",
    ]),
   dict(slug="first-mvp", file="12__the-first-mvp.md",
    title="12 — The first MVP",
    role="v1 and v2 as they actually happened: the corrections, the six bugs that became principles, and the verification discipline",
    summary="The receipts. v1 was built in a day and was right about the spine — choices-only, same-origin, unsure-means-present, weakest-link, no score — and wrong in six instructive ways: a design vocabulary (“cases”) leaked into the interface and produced a defect that looked like a UI bug; categories answered nobody's question until products were named; the page made the visitor read before doing; risk acceptance sat where it did not belong; an effort label flattered the hardest control; and clicks looked inert because state lived in more than one place. Plus the three v2-era bugs now pinned by tests: escalation masking, the missing conversation node (asserted as correct by its own test), and wording that got ahead of the visitor. Ends with what was verified before each ship and what v2 still owes.",
    concepts=[
     ("The vocabulary leak", "../registry-mvp/change-control.html", "C25/decision 40 — the visitor's nouns are the interface's nouns"),
     ("A test asserting nonsense", "model.html", "a test that encodes the author's assumption verifies the assumption, not the behaviour"),
     ("The verification list", "build-order.html", "model suite, same-origin, five viewports, live-byte hashes, the redaction scan"),
    ],
    ideas=[
     "Several obvious improvements are listed here as the defects they turned out to be — read this before proposing one.",
     "“An hour” for a separate account was corrected by the person who had done it: hard — days, and it fights you.",
     "The correction cycle — ship, be corrected within hours, rebuild — is the working method, and this document is its record.",
    ]),
   dict(slug="change-control", file="99__change-control.md",
    title="Appendix — Change control",
    role="Four corrections, eighteen decisions, and the relationship to the sibling register where the tool grew up",
    summary="The appendix, opening with entries rather than waiting for them, because the tool shipped twice before the pack existed. It runs to <b>eleven corrections and twenty-seven decisions</b> at draft-1. MC1 records the two 20 August programme briefs and what they correct; MC2 makes the pack's after-the-build status a standing entry with a currently-empty disagreement list; MC3 adopts per-node dating as a defect to fix rather than an aspiration; MC4 supersedes the copy-summary with fragment shares; and MC5–MC9 carry the synthetic-readers area, the arrival-condition amendment to document 08, the four defects the first run found, and MC10 — where the informed second pass corrected two errors in this project&#39;s own run record and added four findings the blind run could not produce; MC11 records the readiness-review finding that the scenario table outruns the library — scenario 5 has no tree. The register carries the early decisions forward from the registry pack's register without renumbering them into new authority, and adds what belongs only here — level one's author, the exercised-set import, budget-setting, the marker's export survival, and the archetype count are the open ones.",
    concepts=[
     ("Supersede, never rewrite", "principles.html", "P13 — the correction count only ever goes up"),
     ("MC-D7 — the import gate", "levels-and-variants.html", "the exercised set's source is a transcript, which carries everything the session saw"),
     ("The sibling register", "../registry-mvp/change-control.html", "C20–C25 and decisions 29–35, 40–41 stay the record of when and by whom"),
    ],
    ideas=[
     "A future correction to a shared decision lands in both registers with a cross-reference.",
     "The fixed comprehension question can only be changed here — that is what fixed means.",
    ]),
  ]),
 dict(slug="grant-and-mandate",
  name="Grant and Mandate: Reality Before Risk, The Library In The Registry, The Instance In The Risk Product",
  origin="Authored by the pki.sgit.ai site agent, 26 August 2026, at the project lead's request — a first pass at the pack specified in two v0.33.62 dev briefs. Its library half sits on a shipped register (the registry, v0.1.26); its risk-product half is specified, not built, and the pack says so. The first library entry was generated by measuring the site agent's own environment — which refused to measure itself, and the refusal is recorded as the sharpest datum in it. Corpus version assigned on adoption.",
  date="26 August 2026 · draft-1 + change control",
  origin_short="Site agent, this repo",
  row_date="26 Aug 2026 · draft + change control",
  dl_blurb="",
  one_line="Building blocks for the RiskMandate product: a grant measured, a mandate authored, the delta between them, and a library of measured grants. Ten documents plus change control, two measured library entries, a component stylesheet with a gallery rendering real data, and build-order step 1 built: a push refused by git, not by the agent. Document 08 is the build record — what shipped, and what is still only written down. The registry holds the library (no personal data ever); the risk product holds the instance, storing references not copies.",
  meta_desc="The Grant and Mandate pack, readable in-page: the leading brief, the lexicon, the grant and mandate schemas with the delta computed not stored, the library and its first measured entry, the user and agent workflows, six mockup screens, the MVP build order, and change control.",
  three_sentences="The site agent's first pass at the pack the two 26 August briefs specify: building blocks tying grant and mandate to the commercial product — a <a href='schemas.html'>grant document</a> (what an environment can do, measured), a <a href='schemas.html'>mandate document</a> (what it is expected to do, authored), a delta between them (excess, shortfall, blind spots, computed and never stored), and a <a href='library.html'>library</a> of measured grants. The architecture is one hard line: the <a href='../../registry/index.html'>registry</a> holds the library, carrying no personal data ever, and the risk product holds the private instance over it, storing references rather than copies — which is what makes a finished pack shareable without disclosing anything about the person's machine. Three constraints a reader must not re-derive — <b>reality before the risk register</b>, the <b>library/instance split</b>, and the <b>three-term comparison</b> whose blind-spot delta is the only thing that makes a self-report falsifiable — and two findings inherited settled: the grant is <b>discovered, not authored</b>, and it is <b>authority, not authorisation</b>. The first library entry was generated by measuring the site agent's own container, which <a href='library.html'>refused to measure itself</a> — a boundary-tier control caught working on the measuring agent, the cleanest demonstration of the pack's own three-tier test, produced by accident.",
  site_relevance="This pack is the layer above the <a href='../registry-mvp/index.html'>registry MVP pack</a> and its <a href='../../registry/index.html'>shipped register</a>: the register now holds identities, mandates, grants and control labels at public URLs, and this pack specifies how those objects are <em>generated</em> (by measurement), <em>declared</em> (as a mandate with an issuer and interval) and <em>compared</em> (the delta). Its constraints are this site's published positions — <a href='../../mandate/index.html'>identity vs. mandate</a>, <a href='../registry-mvp/grant-tree.html'>the grant tree and three-tier control test</a>, and <a href='../registry-mvp/keys-and-signatures.html'>artefacts are signed, never keyed</a> — and it adopts, rather than reinvents, Cedar for policy evaluation and graphs.sgit.ai's lexicon and drift gate, building only the one thing nothing provides: a mandate document.",
  docs=[
   dict(slug="dev-brief", file="00__LEADING-BRIEF.md",
    title="00 — The leading brief",
    role="The three constraints, the inventory, and the two settled findings",
    summary="The pack scoped as building blocks for tying grant and mandate to the commercial product, and the three constraints that must not be relitigated: reality before the risk register (a fact before a risk, and a fact is a measurement); the library/instance split with references not copies (which keeps the library versionable and the pack shareable); and the three-term comparison, where library minus self-report is the blind-spot delta that makes a self-report falsifiable at all. Two findings arrive settled from the source briefs: the grant is discovered by measurement rather than authored, because a typed grant is a wish; and the grant is authority rather than authorisation, because nobody decided it and apparent authority binds it anyway. The inventory result decides the build: adopt Cedar and the graphs-site conventions, surface the shipped register, and build only the mandate document — the one thing nothing in the industry provides.",
    concepts=[
     ("Reality before the risk register", "concepts.html", "the ordering rule: a risk named before a fact is a guess"),
     ("Library in the registry, instance in the risk product", "library.html", "references, never copies — versionable, and shareable without disclosing an estate"),
     ("The three-term comparison", "mockups.html", "library − self-report = blind spots, the argument for the library"),
    ],
    ideas=[
     "The grant is authority, not authorisation: nobody decided it, and the law treats the appearance as authority anyway.",
     "With memory retained, a grant is a union over every prior session's reach rather than a tree.",
     "The agent is a primary consumer: one fetch, a document not a rendering, structured before compared.",
    ]),
   dict(slug="concepts", file="01__concepts.md",
    title="01 — The lexicon",
    role="Grant, mandate, delta, excess, shortfall, blind spot, tier — and the ordering rule",
    summary="The scoped vocabulary in the sibling graphs site's format: each term defined by its edges rather than its label, sitting inside one sequence — reality, twin, facts, finding, risks, decisions — that is a constraint rather than a preference. Grant and mandate are both artefacts (identifier, hash, signature, never a keypair); the delta between them is computed and never stored, in three directions with three audiences: excess for security, shortfall for operations, blind spots for whoever is deciding whether to trust the self-assessment. The tier of a control is the one test that decides whether a control is real: it bounds a grant only when enforced by something the grant does not include, and a control that evaluates outside the agent's loop is a boundary even when it is configuration for the platform.",
    concepts=[
     ("The ordering rule", "mvp.html", "reality → twin → facts → finding → risks → decisions, in that order"),
     ("Excess and shortfall", "schemas.html", "grant − mandate, and mandate − grant — different audiences, different remedies"),
     ("The three tiers", "../registry-mvp/grant-tree.html", "boundary, setting, expectation — most controls people rely on are settings that read like boundaries"),
    ],
    ideas=[
     "A node carries no inherent meaning; what a term is emerges from where it sits in the chain.",
     "A mandate stored as prohibitions widens silently; the allow-list is stored, prohibitions are a dated rendering.",
     "History is a time axis on the grant: memory on turns the tree into a union over the past.",
    ]),
   dict(slug="schemas", file="02__schemas.md",
    title="02 — The two documents and the delta",
    role="Grant, mandate, and why the delta is computed and never stored",
    summary="Two files, not one, because they differ on every axis that matters: the grant is generated by measurement and carries a measurement date; the mandate is authored by a person, signed by an issuer, and carries an interval without which it is a grant under another name. Neither gets a keypair — both are artefacts. The grant document carries provenance and a tier per node, keeps unevidenced nodes and marks them rather than dropping them, and carries a history field that changes the meaning of every node beneath it. The mandate stores an allow-list (the enforceable form) and renders prohibitions from its complement, dated, because that is what a person can accept. The delta is recomputed on demand and never persisted, for the same reason a register entry carries no history array: a stored delta is stale the instant either side moves.",
    concepts=[
     ("The grant document", "library.html", "measured, dated, provenance and tier per node, floor not census"),
     ("The mandate document", "workflows.html", "issuer-signed, interval-bearing, allow-list stored, prohibitions generated"),
     ("The delta, computed not stored", "../registry-mvp/change-control.html", "C7's rule applied: derived values are recomputed, never persisted"),
    ],
    ideas=[
     "A node evidenced by nothing is kept and marked, because the gaps are worth mapping too.",
     "A measurement date, not a version, because drift is answered by re-measuring and diffing.",
     "An allow-list that compiles to Cedar inherits evaluation outside the loop; one that compiles to a prompt does not.",
    ]),
   dict(slug="library", file="03__library.md",
    title="03 — The library",
    role="What a building block is, how it is measured — and the first entry, which refused to measure itself",
    summary="A library entry is a measured, dated grant for one environment, published in the registry, carrying no personal data ever, and referenced rather than copied by an instance in the risk product. It is generated, never authored, because a hand-written grant is a wish; drift is caught by re-measuring and diffing, with the alarming case being a node that moved from setting to expectation — a control removed while nothing broke. The first entry was generated by measuring the site agent's own Claude Code Remote container, and the measurement refused itself: a single self-inspection probe was blocked by an account-level classifier evaluating outside the agent's loop, so the two nodes it would have filled are marked unknown rather than guessed. That refusal is a boundary-tier control observed working on the measuring agent — the cleanest demonstration of the pack's own three-tier test, produced by accident — and node n3, a release-branch push whose branch discipline is only prose, is the pack's thesis caught live.",
    concepts=[
     ("The first measured entry", "library/claude-code-remote__ccr-container__2026-08-26.json", "nine nodes, two marked unknown, one refusal that is itself the finding"),
     ("Drift as a diff", "mvp.html", "setting → expectation is the silent case: containment stopped existing"),
     ("Floor, not census", "concepts.html", "the measurer is the subject, so the entry says floor on its face"),
    ],
    ideas=[
     "The refusal to self-measure is the sharpest datum: a boundary caught working on the measuring agent.",
     "Node n3: the environment can push to a release branch that deploys a public site, and only prose says which branch.",
     "One entry proves the format, not the dataset; a blind-spot delta needs two environments and ideally two agents.",
    ]),
   dict(slug="workflows", file="04__workflows.md",
    title="04 — The two paths",
    role="The person walks screens, the agent fetches documents, and the skill compiles but never enforces",
    summary="Two paths, both specified, because the agent is a primary consumer and every requirement it adds is invisible in a screen review. Both run the same three verbs — discover, declare, diff — in the ordering-rule order. The user path renders screens and never shows an allow-list. The agent path reads no page: it fetches the library in one request, produces a structured self-report (schema first, never prose, or the blind-spot delta is a judgement), computes both deltas, and hands back references rather than descriptions. The skill discovers, declares and diffs, and refuses to enforce — because a skill runs inside the agent's loop, so a skill that polices the mandate is the agent marking its own homework. The mandate's allow-list compiles to a hook or to Cedar, both of which evaluate outside the loop; that division — the skill compiles, the hook enforces — is the entire architecture.",
    concepts=[
     ("The agent path", "mvp.html", "one fetch, a document not a rendering, structured before compared"),
     ("The skill that must not enforce", "concepts.html", "inside the loop is homework-marking; the hook runs outside it"),
     ("The compilation target", "schemas.html", "hook or Cedar — outside the loop is what makes it a control"),
    ],
    ideas=[
     "If the interface is where the data lives, the agent path does not exist.",
     "The acceptance test ends: attempt the prohibited action and be refused by something that is not the agent.",
     "No page is read by a human anywhere in the agent path.",
    ]),
   dict(slug="mockups", file="05__mockups.md",
    title="05 — Six screens",
    role="The screens the interface must cover, and why the fourth is the trap",
    summary="Six screens written as intended output. Screen one is choose-the-environment, not a risk question — reality first, enforced by the layout. Screen two is the grant, with the history field prominent because it changes every node's meaning and an unknown node rendered as unknown, never blank. Screen three is the self-report comparison — three terms, two deltas, and the blind-spot count, the most persuasive number in the flow. Screen four is the trap: show the person prohibitions, store the allow-list, and never show the allow-list here, because an allow-list presented for approval produces consent without comprehension. Screen five is the delta as the product, excess and shortfall side by side with their tiers. Screen six is the pack: what it discloses, and that it is references rather than a description of the estate. No score out of a hundred anywhere — the gap is a picture and a count.",
    concepts=[
     ("Screen four, the trap", "schemas.html", "prohibitions shown, allow-list stored and never displayed"),
     ("The blind-spot count", "library.html", "reported N of M — measures the agent as much as the environment"),
     ("Reality on screen one", "concepts.html", "which environment, never a risk-appetite question"),
    ],
    ideas=[
     "Prohibitions carry the date and capability-set version they were generated from, so a regeneration cannot change what was agreed.",
     "The history field is a banner, not a footnote.",
     "A prettier mockup makes an unbuilt flow look shipped; it must carry a not-built marker.",
    ]),
   dict(slug="mvp", file="06__mvp.md",
    title="06 — The MVP",
    role="Build the branch constraint first, the acceptance test, and what is excluded",
    summary="The build order puts the branch constraint first — one afternoon, a few lines added to a session-end hook that already reads the branch, closing the measured gap where the push is enforced and the branch is only prose. It demonstrates the whole thesis end to end: a mandate, the grant it does not cover, the delta, and the delta closed by an enforcement point that already existed. Then the grant measurement (done for one environment already), the two schemas, the mandate, the skill, and the Cedar compilation target. The acceptance test ends with attempting a prohibited action and being refused by something that is not the agent — until that passes, everything is instrumentation. Deliberately excluded: the risk register (downstream, in the risk product), a new policy language, an identity design, a hand-written grant, an enforcement skill, a census, and a wallet.",
    concepts=[
     ("Branch constraint first", "workflows.html", "the smallest real thing, and it makes a declared mandate mechanical"),
     ("What ships where", "library.html", "library and schemas in the registry; instance, screens and risks in the risk product"),
     ("The acceptance test", "concepts.html", "refused by something that is not the agent"),
    ],
    ideas=[
     "The risk derivation — delta to risks with the plug profile — is the risk product's, at the end of the chain.",
     "Only the vault survives a device, so it is the natural home for a built pack — offered, not defaulted.",
     "A design pack ahead of a built product: the registry half has one measured entry, the risk half is specified.",
    ]),
   dict(slug="enforcement", file="07__enforcement.md",
    title="07 — The first compiled mandate",
    role="Built and tested: a push refused by git, the tier it actually reached, and the control that blocked its own release",
    summary="Build-order step 1, built. A mandate authored deliberately narrower than the measured grant — permitting pushes to claude/** while the library entry records that the environment can also push to dev, the branch that deploys a public site — compiled into a pre-push hook that git runs and that refuses by exit code. The acceptance test was executed: the push produced <code>error: failed to push some refs</code>, origin/dev was unchanged, and a permitted push in the same minute succeeded, so the refusal came from git rather than from the agent deciding to comply. The tier reached is stated rather than claimed: <b>setting, not boundary</b>, because the hook is inside the grant it bounds and --no-verify still gets past it — exactly the tier-three-to-tier-two move the brief predicted and no further. Two findings the exercise produced that no diagram would have: within the hour the control refused the release that was carrying it, and the correct remedy was the issuer amending the mandate rather than any bypass; and the measurement tool, re-run afterwards, independently caught its own tier change.",
    concepts=[
     ("Refused by something that is not the agent", "mvp.html", "the acceptance test's last sentence, and the only part that could not be faked"),
     ("Setting, not boundary", "concepts.html", "the hook is inside the grant it bounds — the banner says so on its own face"),
     ("Amend, never bypass", "schemas.html", "v1 was wrong because it was narrower than the authorisation that existed"),
    ],
    ideas=[
     "The hook reads the mandate at runtime rather than compiling a copy, so policy and enforcement point cannot drift.",
     "Default-deny: a missing, unparseable, mis-signed or expired mandate all refuse — a control that fails open is not a control.",
     "An expectation that was too narrow would have been silently ignored; the refusal is what forced the authorisation to be written down.",
     "The authority is a fixture and the enforcement is not — a hook enforcing a fixture-signed mandate is real enforcement of an unaccountable instruction.",
    ]),
   dict(slug="build-record", file="08__build-record.md",
    title="08 — The build record",
    role="What was actually built across four releases, what it cost, and what is still only written down",
    summary="The consolidated record of what moved from specified to built between site v0.1.25 and v0.1.29 — the register, the pack, the enforcement point and two measured library entries — with a fetchable artefact named for every claim. Written because a corpus that records its corrections but not its deliveries will misstate what it has built: three days after the register shipped, the registry pack still described its own subject as entirely unbuilt in three places. It carries the four findings that cost something to record, the table of what the readiness report's six blocking questions became (three closed by execution, three still the project lead's), and a flat list of what remains only written down — a real issuer key, a boundary-tier enforcement point, the capability vocabulary, the append-lane write path, and the entire risk-product half.",
    concepts=[
     ("The register, built", "../../registry/index.html", "eleven records, twenty-three signed statements, sgit-compatible by round-trip"),
     ("What is still only written down", "mvp.html", "a build record that lists only deliveries is a sales document"),
     ("The readiness report's six questions", "../registry-mvp/readiness-report.md", "three answered by building, three still open"),
    ],
    ideas=[
     "The registry is built; the trustworthy registry is not — the root is a fixture and says so.",
     "Three of six blocking questions were answerable by building rather than by deciding.",
     "A build record written by the builder names fetchable artefacts, which is a mitigation and not an audit.",
    ]),
   dict(slug="building-blocks", file="09__building-blocks.md",
    title="09 — The building blocks",
    role="Badges, cards, blocks and visualisations — and the one rule that makes a tier badge honest",
    summary="The brief the project lead called #3, derived from the two v0.33.62 briefs rather than supplied: the reusable primitives the six screens are assembled from, specified as components with rendering rules rather than drawn as pictures, because a mockup is thrown away and a block is used. Nine primitives, each a rendering of a field that already exists in a grant or mandate document. The load-bearing rule came from the build rather than from design: a tier is a property of a node's relationship to the tree, not of the node, so <b>a tier badge must be able to show what defeats it, and a defeated control never renders as a boundary</b> — the register's own escalation-is-an-edge finding arriving one layer down. It also adds the one block that exists because building the thing taught the pack something it did not know: the authority/enforcement split, two indicators and never one, because the enforcement is real and the authority is a fixture and averaging them is how a demonstration gets mistaken for a control. Ships as a stylesheet and <a href='blocks.html'>a gallery rendering the actual documents</a>, not as images.",
    concepts=[
     ("The defeat-path rule", "blocks.html", "a defeated control renders as setting, with the path reachable from the badge"),
     ("The authority/enforcement split", "enforcement.html", "two indicators, never one — merging them is the failure"),
     ("Prohibitions shown, allow-list stored", "mockups.html", "screen four's trap, enforced by the component"),
    ],
    ideas=[
     "A block is a rendering of a field: if it needs data no schema carries, the block is wrong, not the schema.",
     "Two channels minimum and the word is always one — colour alone re-collapses five states into two.",
     "`unknown` renders as `unknown`: the gaps are part of the map, and a blank reads as a to-do.",
     "The gallery renders real documents, so a schema change breaks the build rather than the integration.",
    ]),
   dict(slug="change-control", file="99__change-control.md",
    title="Appendix — Change control",
    role="Seventeen corrections, thirty decisions, the release the control refused, and the discipline that recorded no deliveries",
    summary="The appendix records what the two source briefs settle (GM1–GM8: the grant discovered not authored, authority not authorisation, the library/instance split, reality before risks, the three-term comparison, memory as a time axis, adopt-Cedar-and-graphs-build-only-the-mandate, and the naming checks) and what the pack's own construction added (GM9–GM10: the first library entry refusing to measure itself, and node n3 as the thesis caught live). The decisions register carries twenty-nine entries. GM11-GM14 record build-order step 1 built and tested, and GM15-GM16 record the library's second entry — measured inside a CI runner, joining the first at node n3 — together with the two defects it found: a tier mislabelled because it was decided in isolation, and the pre-push hook not travelling with a clone: the acceptance test passing, the control refusing the release that carried it, the measurement catching its own tier change, and the standing limitation that the authority is a fixture while the enforcement is not — who measures a library entry and with what authority, how often it is re-measured, whether the instance records which library version it referenced, the history-window field, where a built pack lives, whether the blind-spot number is published per agent, whether a hook can trust the mandate it reads, and the corpus version on adoption.",
    concepts=[
     ("Supersede, never rewrite", "../registry-mvp/change-control.html", "the same discipline the sibling register uses"),
     ("GM9 — the refusal as evidence", "library.html", "a boundary control caught working on the measuring agent"),
     ("The eight open decisions", "mvp.html", "measurement authority, cadence, version-pinning, and where the pack lives"),
    ],
    ideas=[
     "The delta is computed not stored, carried from the register's C7.",
     "A future correction to a shared decision lands in both registers with a cross-reference.",
     "The corpus version is assigned on adoption — this is a first pass, for review.",
    ]),
  ]),
 dict(slug="insurance-ecosystem",
  name="The Insurance Ecosystem: A Session Told The Rules, Handed A Policy, Measured, And Refused By Something That Is Not Itself",
  origin="Authored by the pki.sgit.ai site agent, 3 September 2026, at the project lead's request — the pack the fourth v0.33.62 brief specifies, written after the nine-item inventory that brief demands, under the economics the third v0.33.62 brief settles, and under the project lead's instruction of 3 September that for the pilot one session holding the vault key may run any role in any vault. Build-order step 1 is BUILT and its three acceptance tests were run the same day; steps 2–8 are the pack's own acceptance test for the next session. Corpus version assigned on adoption.",
  date="3 September 2026 · draft-1 + change control",
  origin_short="Site agent, this repo",
  row_date="3 Sep 2026 · draft-1, step 1 built",
  dl_blurb="",
  one_line="An end-to-end ecosystem on vaults: three vaults, a policy object generic on unit, a ledger that is only ever added to, git hooks as the enforcement point, Claude hooks as instrumentation, and a room of five cards. Eleven documents plus change control; an evaluator, two hooks, a token meter and a room builder in <code>tools/</code>; and <a href='insurance-ecosystem/first-increment.html'>step 1 built and run</a> — a 400 KB commit refused by git, the eleventh commit of the day recorded as a draw, a push outside the mandate refused. <a href='insurance-ecosystem/room/index.html'>The room</a> renders from the run.",
  meta_desc="The insurance ecosystem pack, readable in-page: the leading brief, the lexicon with question nine settled, the vault topology, the policy object, the decision points, the parties, the seven workflows, the room and the briefing, the build order, the first increment built and run, the eleven answers, and change control.",
  three_sentences="The pack the fourth brief of 26 August specifies: <b>a new agent session is told the rules of the game, is handed its own policy, is measured against it while it works, and is refused by something that is not itself when it exceeds cover</b>, with the whole flow visible in a room somebody can watch. Written after the inventory the brief demands — which found <b>no board application</b> (so <a href='interface.html'>the room</a> is a vault app in the estate's shipped pattern) and found that <b>the platform fails open on a hook timeout</b> (so <a href='decision-points.html'>the git hooks refuse and the Claude hooks instrument</a>) — and under the project lead's pilot relaxation: one session holding the vault key may run any of the <a href='parties.html'>six roles</a> in any of the <a href='vault-topology.html'>three vaults</a>, integrity deferred and detected by sgit's append-only history, the <a href='workflows.html'>seven workflows</a> the thing being figured out, including running out and being uninsured. The <a href='policy-object.html'>policy object</a> is one schema for any unit the system already counts, with a normal band, a per-occurrence limit that becomes an exclusion where the loss is irreversible, a shared pool with a reserve no verdict can reach, a recorded draw by default and a requested one above a threshold, and the policyholder — never the session — as the acceptor of every draw. <a href='first-increment.html'>Document 09</a> is the receipt: three git policies compiled to two hooks, run on 3 September, with git's own output for each of the three refusals the specification asked for, and the two findings the run produced.",
  site_relevance="This pack is the layer above <a href='../../insurance/push-policy/index.html'>the push policy</a> (the first MVP, doctrine 12) and beside the <a href='../grant-and-mandate/index.html'>Grant &amp; Mandate pack</a>, whose signed mandate it pins by hash and whose <code>pre-push</code> hook it chains: reach is the mandate's, volume is the policy's. Its economics are the <a href='../../documents/insurance-is-junes-underwriting.html'>26 August architecture brief</a>, not reopened; its specification is the <a href='../../documents/specification-for-the-insurance-ecosystem-pack.html'>26 August dev brief</a>, answered question by question in <a href='eleven-answers.html'>document 10</a>. It consumes what <a href='../../insurance/index.html'>the insurance folder</a> already publishes — the doctrine that a draw is a claim paid in the resource, the three-tier control test, the rule that a level is derived and never typed — and it adds the one thing the folder had not: <b>a ledger of events that a session's own commits write, and a room that shows them</b>.",
  extra="""
<h2 id="built">What is built, and where</h2>
<div class="tablewrap"><table>
  <thead><tr><th>Path</th><th>Is</th></tr></thead>
  <tbody>
    <tr><td><a href="tools/policy.py"><code>tools/policy.py</code></a></td><td>The evaluator: one verdict for any unit at <code>pre-commit</code> or <code>pre-push</code>; the briefing; request, decide, supersede, derive, validate; the Claude <code>PreToolUse</code> handler</td></tr>
    <tr><td><a href="hooks/pre-commit"><code>hooks/pre-commit</code></a> · <a href="hooks/pre-push"><code>hooks/pre-push</code></a></td><td>The enforcement points — settings, and the banner says so</td></tr>
    <tr><td><a href="policies/pki-site-repo/git-pilot-2026-09-03.json"><code>policies/pki-site-repo/</code></a> · <a href="policies/pki-site-session/tokens-measured-2026-09-03.json"><code>policies/pki-site-session/</code></a></td><td>The git pilot policy (in force) and the measured token policy (no bands)</td></tr>
    <tr><td><a href="tools/usage.py"><code>tools/usage.py</code></a></td><td>The token meter: four counters from the transcript, never one</td></tr>
    <tr><td><a href="room/index.html"><code>room/index.html</code></a> · <a href="tools/room.py"><code>tools/room.py</code></a></td><td>The room, as a vault app that also renders here, and the maintainer's derivation that feeds it</td></tr>
    <tr><td><a href="ledger/"><code>ledger/</code></a> · <a href="tests/acceptance-2026-09-03.log"><code>tests/acceptance-2026-09-03.log</code></a></td><td>The acceptance run's events, requests and decisions (all marked as a test lane), and the run's full transcript</td></tr>
  </tbody>
</table></div>
""",
  docs=[
   dict(slug="dev-brief", file="00__LEADING-BRIEF.md",
    title="00 — The leading brief",
    role="What this is for, the project lead's relaxation, what the inventory changed, the four findings re-checked, the economics not reopened",
    summary="The pack scoped by the specification's own test — a session that has read only the pack builds the vaults, wires the hooks, authors a policy, runs a working day and produces a room showing a refusal, a recorded draw and a waiting request, asking nobody a question — and by the project lead's instruction of 3 September that for the pilot one session with the vault key may run any role in any vault, integrity deferred and detected rather than prevented. The inventory the specification demanded was done first and changed the design in three places: there is no board application, so the room is a vault app; the platform fails open when a hook times out, so the git hooks are the enforcement point and the Claude hooks are instrumentation; and the eighteen June briefs were read, and only the naming brief collides. The four inherited findings are each re-checked here, including the four token counters measured again on this session's own transcript: sixty-eight thousand on the obvious counter, seven hundred and fifty-seven million in all.",
    concepts=[
     ("The pilot relaxation", "parties.html", "one key, one session, every role — and every file shape unchanged"),
     ("The platform fails open", "decision-points.html", "why the git hooks refuse and the Claude hooks do not"),
     ("The four findings, re-measured", "policy-object.html", "lane, http, four counters, and the word that meant two things"),
    ],
    ideas=[
     "Every question the implementing session has to ask is a gap in the pack, and is filed as an amendment rather than answered in chat.",
     "Turning integrity on is a change of where things run, not what they say.",
     "A session that moved 757 million tokens reads as 68 thousand on the obvious counter.",
    ]),
   dict(slug="concepts", file="01__concepts.md",
    title="01 — The lexicon",
    role="Policy, unit, band, limit, pool, draw, verdict, zone, exclusion, reserve, correlation, ledger, lane, room, briefing — and question nine settled",
    summary="The scoped vocabulary in the graphs-site format, each term defined by its edges. The chain the sibling lexicon states gains one segment: grant, mandate, then the policy that prices what a session may consume, the meter the system already runs, the event that is one reading of it, the verdict that is a subtraction, and the zone derived from the day's verdicts. The three zones are named with their owners, and the third is not a larger second: outside cover is uninsured, and an unaccepted risk escalates without anybody escalating it. Question nine is decided in the entry for mandate: August governs, the mandate is the narrow thing, the grant is the union, and June's Authority Envelope survives as prose and never as a field.",
    concepts=[
     ("Draw", "workflows.html", "a claim paid in the resource, settled by the check; recorded by default, requested above a threshold"),
     ("Zone", "interface.html", "below, drawing, outside — and outside means uninsured"),
     ("Mandate, settled", "change-control.html", "IE-D9: the narrow thing, August governs"),
    ],
    ideas=[
     "A policy written before a meter exists is a wish; a zone typed by hand is a lie.",
     "Silent overflow is not a value: an evaluator that decrements without writing is not this pack's evaluator.",
     "There is no insurer, and any page that borrows the vocabulary says so.",
    ]),
   dict(slug="vault-topology", file="02__vault-topology.md",
    title="02 — Vault topology",
    role="Three vaults, who holds which key, the pilot's one key set, the lane as the end state, and the anchors question",
    summary="Policies, ledger and room: three vaults with three writers, kept separate now so that the key split later is a file change rather than a migration. The capability tiers each buys, the blind acknowledgement as a load-bearing property rather than tidiness, and the pilot relaxation applied line by line: one key set, a folder of files that are only ever added standing in for the lane, detection by sgit's history in place of prevention. Every file shape and folder name is the lane's, so the drain runbook is the only step that does not exist yet. The published lane limits are designed against, the unstated anchors question is assumed conservatively and marked, and retention is proposed.",
    concepts=[
     ("The blind acknowledgement", "../../enrolment/index.html#lane", "an insured cannot learn its remaining cover by writing"),
     ("A folder for a lane", "change-control.html", "IE-D3: the same schema, a different location"),
     ("No anchors, no writers", "eleven-answers.html", "assumed, marked, to be confirmed by one write at step 7"),
    ],
    ideas=[
     "A write key grants purge, so the ledger's writer must not hold one.",
     "The room holds nothing the other two vaults do not, so it can always be regenerated.",
     "One thousand pending files per token makes draining an obligation.",
    ]),
   dict(slug="policy-object", file="03__the-policy-object.md",
    title="03 — The policy object",
    role="policy/v1, event/v1, request/v1, decision/v1, the derived balance, and two worked policies",
    summary="Four documents and one derivation. The policy carries its rules version, its issuer and policyholder, the mandate it prices pinned by hash, an interval with a timezone, a draw mode whose default is recorded and whose threshold makes a draw requested, one entry per unit with a named meter, and an exclusion with a reason wherever the loss is irreversible. The event is generic on unit, names the policyholder as acceptor on every draw, and carries tokens as four counters. The balance is never stored: derived by the maintainer from the four documents with the reserve subtracted first, and where the evaluator's arithmetic at the time disagrees with the derivation, the derivation wins and the disagreement is a finding. The git pilot policy is built; the token policy is measured and deliberately unbanded.",
    concepts=[
     ("Every unit names its meter", "concepts.html", "a unit without one is refused by the schema"),
     ("The reserve is subtracted first", "interface.html", "the catastrophe layer no verdict may reach"),
     ("Four counters, no bands", "first-increment.html", "the token policy as instrumentation"),
    ],
    ideas=[
     "A stored balance is stale the moment an event lands elsewhere, and a balance maintained inside the insured is the insured marking its own homework.",
     "A hard cap on bytes into history is not the top of the buffer; it is the boundary of insurability.",
     "The request threshold is two-thirds of the exclusion so that the requested-draw workflow is exercised on real commits.",
    ]),
   dict(slug="decision-points", file="04__decision-points.md",
    title="04 — Decision points",
    role="Thirty-three lifecycle events, four hooked, and the two that refuse are git's",
    summary="The published schema and hooks reference give thirty-three events; SessionStart carries the briefing, PreToolUse an advisory copy of the verdict, Stop the usage flush. But a PreToolUse hook that times out does not block the tool, which the documentation states: the platform fails open. A draw whose balance cannot be derived is not a draw, and a Claude hook cannot express fail-closed. A git hook can, because it owns its exit code. So pre-commit and pre-push are the enforcement points, both settings and both say so; the http variant moves the decision off the machine but not the refusal, so any service sits behind the git hook. Local script for the pilot, as the specification recommended.",
    concepts=[
     ("Fails open on timeout", "../../packs/grant-and-mandate/concepts.html", "the tier test applied to a platform property"),
     ("The service behind the hook", "build-order.html", "step 7's shape"),
     ("Advisory, not enforcement", "workflows.html", "the PreToolUse handler returns the same verdict a second early"),
    ],
    ideas=[
     "A commit made by a subagent or a script is seen by git and not by the Claude hook, which is why git is the enforcement point.",
     "Whether project-level hooks run without a prompt is not documented and is to be observed.",
    ]),
   dict(slug="parties", file="05__parties.md",
    title="05 — Parties",
    role="Six roles as runbooks, who each is today, and what the keys will prevent once split",
    summary="Issuer, policyholder, insured, approver, maintainer, auditor — each mapped to a responsibility that exists today (the project lead, the estate, the site agent) and each with the runbook a session executes and the prevention the key topology will impose. The pilot lifts the prevention on the project lead's word: one session may run any role, the same hand may ask and answer under two hats, and the record names both. What that costs is stated: every acceptance in the pilot is self-accepted, which the economics say a draw must never be; the acceptor is still named as the policyholder so the record is right even when the hand is the same. Experience rating lands on the policyholder because the session is indifferent to the loss.",
    concepts=[
     ("Prevention deferred, not dropped", "vault-topology.html", "roles as runbooks until the key split"),
     ("The acceptor is the policyholder", "policy-object.html", "the agent spends, the team carries"),
     ("Never approve an exclusion", "workflows.html", "the answer to an escalation is acceptance as uninsured or suspension, never a larger draw"),
    ],
    ideas=[
     "The RiskMandate team holds the instance a policy is written against and is not a party to the policy.",
     "A session-held enumeration key is a session-scoped identity, which the registry pack already found to be the wrong lifetime.",
    ]),
   dict(slug="workflows", file="06__workflows.md",
    title="06 — Workflows",
    role="Session start, ordinary work, a recorded draw, a requested draw, exhaustion, the maintainer run, a repricing event — as commands",
    summary="Seven workflows, each as the commands a session runs, the files it leaves and what the room then shows. Ordinary work writes a countable event and says nothing, because silence below cover is a requirement. A recorded draw prints one line and names the policyholder. A requested draw refuses the commit, writes a request with an id, waits for a decision file and draws via it on retry. Exhaustion, by exclusion or by an empty pool, refuses, writes an escalation and leaves the insured uninsured for that class of action; the approver's answers are acceptance as uninsured, which never touches the pool, or suspension. The maintainer run derives everything; a repricing event supersedes the policy with a new file the policyholder must re-accept.",
    concepts=[
     ("W4 — the requested draw", "first-increment.html", "run end to end on 3 September, under two hats"),
     ("W5 — uninsured", "concepts.html", "an escalation, not only a refusal"),
     ("W7 — repricing", "change-control.html", "IE-D14: a supersession must be re-accepted"),
    ],
    ideas=[
     "Do not split a commit to get under a threshold; ask, quote the id, wait.",
     "An accepted-uninsured action is not a draw: the pool did not cover it, a person did.",
     "The working day is the acceptance test: W1 to W6, then the room shows the three things.",
    ]),
   dict(slug="interface", file="07__interface.md",
    title="07 — The interface",
    role="The room's five cards, three rules it keeps, and the briefing verbatim",
    summary="A vault app in the estate's shipped pattern, read-only, one page: policy, zone and balance, draw frequency, correlation, events and requests. The zone is the headline and the balance sits under it, because balance is the metric everybody builds and the wrong one to lead with. Silence below cover, nothing typed, and test events visible in their own lane and excluded from the balance. The briefing a session is handed at start is printed verbatim, computed field by field, ending with the tier on its face. What is reused is the skeleton; what is new is five cards and one text; the chat-thread component that exists is not used because the pilot's thread is a folder.",
    concepts=[
     ("Draw frequency before balance", "policy-object.html", "the leading indicator, and the issuer's input at the period boundary"),
     ("Correlation from week one", "../../insurance/the-resource-pool.html", "because nobody builds it later"),
     ("The briefing", "workflows.html", "W1, injected by SessionStart"),
    ],
    ideas=[
     "The room is quiet by design and loud in exactly two colours.",
     "If the room disagrees with the ledger, the room is wrong and the ledger commit in the footer is how you prove it.",
    ]),
   dict(slug="build-order", file="08__build-order.md",
    title="08 — Build order",
    role="Eight steps by dependency, an acceptance test each, and what stays excluded",
    summary="Step 1 (three git policies to two hooks) is built and run. Steps 2 to 4 are the three vaults, a morning. Step 5 is the Claude hooks. Step 6 is the working day and the pack's own acceptance test. Steps 7 and 8 are the lane and the key split, which wait on the anchors answer and a session-independent identity for the maintainer. Every step names a test that can fail and the rule that it is written before, run after, recorded with the commit it ran at. The exclusions from the specification are carried with the reason each stays excluded after the inventory.",
    concepts=[
     ("Step 1, done", "first-increment.html", "with git's own output"),
     ("Step 6, the pack's test", "dev-brief.html", "nobody is asked a question"),
     ("Steps 7 and 8", "vault-topology.html", "the pilot becoming the design"),
    ],
    ideas=[
     "A step whose test cannot fail is not a step.",
     "If a test passed for the wrong reason, say so; the sibling pack's setting-that-reads-like-a-boundary was found exactly that way.",
    ]),
   dict(slug="first-increment", file="09__first-increment.md",
    title="09 — The first increment, built and run",
    role="Three git policies, two hooks, and the three refusals the specification asked for — with git's own output",
    summary="Run on 3 September in a scratch clone with both hooks installed and every event marked as a test lane. A 400 KB commit was refused by pre-commit with the exclusion's reason printed and HEAD unmoved; the eleventh commit of the day was told a draw was recorded, seventeen of eighteen left because the reserve holds ten per cent back; a push to main was refused by the mandate before a byte was counted and a push to a permitted branch succeeded in the same minute. Then the whole requested-draw workflow: refused, a request with an id, a decision, a retry that drew via it, and a commit that carried its own two claims. Then exhaustion at the fifth reading, with the earlier escalation found already waiting, and a commit inside the band still proceeding. Five findings, including that a test lane needs its own balance, found because the first run of the eleventh commit reported nothing.",
    concepts=[
     ("The acceptance log", "tests/acceptance-2026-09-03.log", "every number on the page is copied from it"),
     ("A commit carries its own claim", "change-control.html", "IE-D12"),
     ("Setting, not boundary", "../grant-and-mandate/enforcement.html", "the same tier the two enforcement points before it reached"),
    ],
    ideas=[
     "exit=1 is git's, from a hook that ran before the commit object existed.",
     "The count pool drew three times on an ordinary session; the rating rule will say the band is wrong, which is the loop working.",
     "Nothing on GitHub was refused: the remote was a folder, the hooks and the refusals were real.",
    ]),
   dict(slug="eleven-answers", file="10__the-eleven-answers.md",
    title="10 — The eleven answers",
    role="The nine-item inventory with evidence, and the specification's eleven questions answered",
    summary="What was found on 3 September, item by item: no board application; the messaging vault is the append lane with its client-side derivation still proposed; sgit 0.16.0's command surface with no lane command; thirty-three hook events and the fail-open finding; the risk product holding the instance; the real parties; all eighteen June briefs read; the graphs-site lexicon format; and the anchors question still unstated. Then the eleven questions, each answered with the evidence it came from and the decision it produced, question nine marked as a decision taken provisionally on the specification's recommendation and the project lead's to reverse. The one thing the specification said was attached and was not available — the measured primitives reference — was substituted by measuring again.",
    concepts=[
     ("Question nine", "concepts.html", "mandate is the narrow thing; August governs"),
     ("Where policies live", "vault-topology.html", "a new vault, not the risk product, not the credential store"),
     ("The first refusal", "first-increment.html", "a 400 KB commit, to the project lead, with git's output"),
    ],
    ideas=[
     "The inventory looked at four repositories and one sparse checkout in a day; the estate has nineteen sites.",
     "The eleven answers are evidenced, which is different from right; the evidence column is what to argue with.",
    ]),
   dict(slug="change-control", file="99__change-control.md",
    title="99 — Change control",
    role="What the specification settles, what the project lead's instruction changes, what the build added — fifteen decisions, no corrections yet",
    summary="The appendix in the estate's discipline: the pack supersedes rather than rewrites. IE1 to IE5 are inherited from the two briefs and not argued; IE6 is the project lead's relaxation and what it changes and does not; IE7 to IE10 are what the inventory and the build added, including the fail-open finding and the commit that carries its own claim. The decisions register runs to fifteen, all proposed except the two that are done. The first correction will be a question the implementing session had to ask.",
    concepts=[
     ("IE-D4 — git refuses, Claude instruments", "decision-points.html", "the decision the inventory most changed"),
     ("IE-D9 — August governs", "concepts.html", "the naming decision, taken provisionally"),
     ("IE-D12 — a commit carries its own claim", "first-increment.html", "done"),
    ],
    ideas=[
     "Read it second if building, last if reading through, never not at all.",
     "An implementing session that has to ask files the question and the answer it took here.",
    ]),
  ]),
]

NAV_STUB = '<nav class="site"><div class="row"></div></nav>'
FOOT_STUB = '<footer class="site"><div class="cols"></div></footer>'
READER_TAIL = '''
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="{up}assets/mdreader.js"></script>'''


def head(title, desc, canonical, up):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pki.sgit.ai/{canonical}">
<link rel="stylesheet" href="{up}assets/site.css">
</head>
<body>

{NAV_STUB}
'''


def concepts_html(items):
    out = []
    for name, href, gloss in items:
        label = f'<a href="{href}"><b>{name}</b></a>' if href else f'<b>{name}</b>'
        out.append(f'  <li>{label} — {gloss}</li>')
    return "\n".join(out)


def write_pack(p):
    base = ROOT / "packs" / p["slug"]
    zippath = base / f'{p["slug"]}-briefing-pack.zip'
    dl_block = ''
    if zippath.exists():
        import zipfile
        with zipfile.ZipFile(zippath) as zf:
            n = len([x for x in zf.namelist() if not x.endswith('/')])
        zipsize = f'{zippath.stat().st_size // 1024} KB · {n} files'
        dl_block = f'''
<div class="dl">
  <div>
    <b>Take the whole pack with you.</b>
    <p>{p["dl_blurb"]}</p>
  </div>
  <a class="dlbtn" href="{zippath.name}" download>&#8595; Briefing pack<span>{zipsize}</span></a>
</div>
'''
    # ---- pack hub ----
    rows = "\n".join(
        f'    <tr><td><a href="{d["slug"]}.html"><b>{d["title"]}</b></a></td><td>{d["role"]}</td></tr>'
        for d in p["docs"])
    hub = head(f'{p["name"]} · packs · pki.sgit.ai', p["meta_desc"], f'packs/{p["slug"]}/index.html', "../../") + f'''
<main class="doc">
<div class="crumb"><a href="../../index.html">pki.sgit.ai</a> / <a href="../index.html">packs</a> / {p["slug"]}</div>
<h1>{p["name"]}</h1>
<p class="lead">{p["three_sentences"]}</p>

<div class="note"><b>Origin.</b> {p["origin"]}</div>
{dl_block}
<h2 id="files">The documents</h2>
<div class="tablewrap"><table>
  <thead><tr><th>Document</th><th>Role</th></tr></thead>
  <tbody>
{rows}
  </tbody>
</table></div>
{p.get("extra", "")}
<h2 id="relevance">Why it is on this site</h2>
<p>{p["site_relevance"]}</p>

<h2 id="readme">The pack README</h2>
<div class="mdread-label">📄 Pack overview · README.md · rendered from the <a href="src/README.md">raw markdown</a> (the source of truth)</div>
<div class="mdread" id="mdread" data-src="src/README.md"><noscript><p class="dim">In-page rendering needs JavaScript — <a href="src/README.md">open the raw markdown</a>.</p></noscript></div>

<div class="pagenav">
  <a href="../index.html">← All packs</a>
  <a href="{p["docs"][0]["slug"]}.html">First document →</a>
</div>
</main>

{FOOT_STUB}
{READER_TAIL.format(up="../../")}
</body>
</html>
'''
    (base / "index.html").write_text(hub)

    # ---- reader pages ----
    docs = p["docs"]
    docs = [d for d in docs if not d.get("standalone")]
    for i, d in enumerate(docs):
        prev_l = f'<a href="{docs[i-1]["slug"]}.html">← {docs[i-1]["title"]}</a>' if i else '<a href="index.html">← Pack hub</a>'
        next_l = f'<a href="{docs[i+1]["slug"]}.html">{docs[i+1]["title"]} →</a>' if i+1 < len(docs) else '<a href="index.html">Pack hub →</a>'
        ideas = "\n".join(f"  <li>{x}</li>" for x in d["ideas"])
        page = head(f'{d["title"]} · {p["slug"]} · pki.sgit.ai',
                    f'{d["role"]}. Pack document, readable in-page; the raw markdown under src/ is the source of truth.',
                    f'packs/{p["slug"]}/{d["slug"]}.html', "../../") + f'''
<main class="doc">
<div class="crumb"><a href="../../index.html">pki.sgit.ai</a> / <a href="../index.html">packs</a> / <a href="index.html">{p["slug"]}</a> / {d["slug"]}</div>
<h1>{d["title"]}</h1>

<div class="docmeta">
  <span class="k">Pack</span><span class="v"><a href="index.html">{p["name"]}</a></span>
  <span class="k">Role</span><span class="v">{d["role"]}</span>
  <span class="k">Date</span><span class="v">{p["date"]}</span>
  <span class="k">Origin</span><span class="v">{p["origin_short"]}</span>
  <span class="k">Source</span><span class="v"><a href="src/{d["file"]}">raw markdown</a> · <a href="{GH}/blob/dev/packs/{p["slug"]}/src/{d["file"]}">on GitHub</a></span>
</div>

<h2 id="summary">Summary</h2>
<p>{d["summary"]}</p>

<h2 id="concepts">Key concepts</h2>
<ul>
{concepts_html(d["concepts"])}
</ul>

<h2 id="ideas">Key ideas</h2>
<ul>
{ideas}
</ul>

<h2 id="read">Read the document</h2>
<div class="mdread-label">📄 Pack document · {d["file"]} · rendered from the <a href="src/{d["file"]}">raw markdown</a> (the source of truth)</div>
<div class="mdread" id="mdread" data-src="src/{d["file"]}"><noscript><p class="dim">In-page rendering needs JavaScript — <a href="src/{d["file"]}">open the raw markdown</a>.</p></noscript></div>

<div class="pagenav">
  {prev_l}
  {next_l}
</div>
</main>

{FOOT_STUB}
{READER_TAIL.format(up="../../")}
</body>
</html>
'''
        (base / f'{d["slug"]}.html').write_text(page)


def write_section_hub():
    rows = "\n".join(
        f'    <tr><td><a href="{p["slug"]}/index.html"><b>{p["name"]}</b></a></td><td>{p["row_date"]}</td><td>{p["one_line"]}</td></tr>'
        for p in PACKS)
    hub = head("Dev packs · pki.sgit.ai",
               "Dev packs: implementation-plan packs captured verbatim, with a hub per pack and a reader page per document — architecture, diagrams, change control and the tabletop exercise included.",
               "packs/index.html", "../") + f'''
<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / packs</div>
<h1>Dev packs</h1>
<p class="lead">Implementation-plan packs, captured verbatim and presented the same way as the site's <a href="../documents/index.html">documents</a>: a hub per pack, and a reader page per document with a summary, key concepts, key ideas and the full markdown (diagrams rendered). The treatment follows <a href="https://nhi.sgit.ai/packs/index.html">nhi.sgit.ai's packs section</a>; a pack here carries its architecture, its diagrams, its change control and its tabletop exercise as first-class documents.</p>

<div class="tablewrap"><table>
  <thead><tr><th>Pack</th><th>Date · status</th><th>In one line</th></tr></thead>
  <tbody>
{rows}
  </tbody>
</table></div>

<div class="note"><b>Adding a pack.</b> Sources land under <code>packs/&lt;name&gt;/src/</code> verbatim; the pages are one entry in <code>admin/build/gen_packs.py</code>, then <code>chrome.py</code> applies the shared nav and footer.</div>

<div class="pagenav">
  <a href="../documents/index.html">← The documents</a>
  <a href="{PACKS[0]["slug"]}/index.html">First pack →</a>
</div>
</main>

{FOOT_STUB}

</body>
</html>
'''
    (ROOT / "packs" / "index.html").write_text(hub)


def main():
    for p in PACKS:
        write_pack(p)
    write_section_hub()
    n = sum(len(p["docs"]) + 1 for p in PACKS) + 1
    print(f"gen_packs: {n} page(s) written under packs/")


if __name__ == "__main__":
    main()
