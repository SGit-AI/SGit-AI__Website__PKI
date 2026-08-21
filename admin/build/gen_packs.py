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
  origin="Authored by the pki.sgit.ai site agent, 20 August 2026, at the project lead's request. Status: draft-1 plus same-day change control, plus the UX mockups, the Wardley maps, the delivery scope, observability, the grant tree and the key policy — three project-lead briefs (v0.33.61) landed after draft-1 shipped and their corrections are recorded in document 06 rather than silently folded in. Corpus version assigned on adoption.",
  date="20 August 2026 · draft-1 + change control",
  origin_short="Site agent, this repo",
  row_date="20 Aug 2026 · draft + change control",
  one_line="A public key registry on vaults — open data, one operator, and LLM sessions as the first users on both sides. 14 documents.",
  meta_desc="The registry MVP pack, readable in-page: the leading brief, architecture, schemas, workflows, build order, diagrams, change control, the tabletop exercise, the UX mockups, six Wardley maps, the user stories and features, the observability layer, the grant tree and the key policy.",
  three_sentences="An MVP of the registry this site designs: one public vault whose records are append-only, hash-chained, signed statement logs; a processor as the only write-key holder; and every workflow written for its actual first user — a fresh LLM session holding nothing but public URLs. Open data on principle (a registry contains no secrets), and <b>public in data, private in authority</b>: one operator, one root, own-agents enrolment — build-order step 4 with the covers off. Draft-1 shipped the morning of 20 August; three project-lead briefs landed the same day, and what they correct is recorded in <a href='change-control.html'>change control</a> rather than silently patched. Two later documents draw the thing: <a href='ux-mockups.html'>the register interface, screen by screen</a>, and <a href='wardley-maps.html'>six Wardley maps</a> of where the novelty actually sits. <a href='user-stories.html'>Document 10</a> turns all of it into six users, twenty-four stories with tests that can fail, and six workflows; <a href='observability.html'>document 11</a> adds the half that makes the mandate layer defensible \u2014 and answers, by refusing it, the question of who is using a mandate. <a href='grant-tree.html'>Document 12</a> gives the grant the structure C1 implied and never specified, and <a href='keys-and-signatures.html'>document 13</a> settles which things get keypairs \u2014 fewer than proposed.",
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
   dict(slug="change-control", file="06__change-control.md",
    title="06 — Change control",
    role="What v0.33.61 corrects in draft-1, recorded rather than silently patched",
    summary="Draft-1 shipped at site v0.1.4 on the morning of 20 August; three project-lead briefs landed the same day. The corrections, each with source and status: grant redefined as what a credential permits, making excess authority (grant minus mandate) the registry's countable product; the 5 June design (v0.32.4) located, so the pack operationalises rather than designs; fixtures upgraded to a bounded class with a required private_key_published flag read before any signature; personas as signed agent cards with a workflow identity as notary; and the mandate-location decision confirmed independently. Plus the decisions register: four settled, four open for the project lead.",
    concepts=[
     ("C1 — grant redefined", "../../documents/grant-vs-mandate.html", "the v0.33.61 brief this folds in"),
     ("C2 — designed in June", "../../documents/register-fixtures.html", "inherit, don't re-derive: clues-not-storage, two-level trust, partial resolution"),
     ("C5 — confirmed from two directions", "schemas.html", "the mandate-location rule, now corpus-aligned"),
    ],
    ideas=[
     "Sources stay verbatim; corrections live here until draft-2 folds them in — supersede, never rewrite.",
     "Four decisions are settled, four are open, and the register says which is which.",
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

<h2 id="files">The documents</h2>
<div class="tablewrap"><table>
  <thead><tr><th>Document</th><th>Role</th></tr></thead>
  <tbody>
{rows}
  </tbody>
</table></div>

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
