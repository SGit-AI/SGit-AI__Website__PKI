#!/usr/bin/env python3
"""Generates the documents/ reader pages — one per captured markdown document.

Run from anywhere: python3 admin/build/gen_documents.py

Each page carries the same apparatus (metadata, summary, key concepts, key ideas)
and then renders the raw markdown in-page via assets/mdreader.js. The raw file
under briefs/ stays the source of truth; the page is presentation. Adding a
document = adding a dict here, then running admin/build/chrome.py.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "documents"
V = (ROOT / "admin/build/version.txt").read_text().strip()
GH = "https://github.com/SGit-AI/SGit-AI__Website__PKI"

DOCS = [
 dict(slug="briefing-pack",
  title="Agent Identity, Mandate And Execution: What The Site Has And What It Is Missing",
  md="v0.33.60__briefing-pack__agent-identity-mandate-and-execution.md",
  version="v0.33.60", date="19 August 2026", dtype="Briefing pack, leading brief",
  summary="The leading brief of the pack that reshaped this site. It sets out a three-layer picture nobody set out to build — identity is a registry problem, mandate a delegation problem, and whether a delegation should produce this effect now is a broker problem — and observes that the site answered only the first. Four recommendations follow, in order of what they change: publish the mandate, publish the bootstrap trap, reframe the registry as the missing half of a shipped feature, and reuse the existing capability model rather than inventing a second one. It also carries two corrections that would otherwise be copied into an implementation: the append lane is shipped and account-less, and the shipped cryptography is RSA-OAEP 4096 and ECDSA P-256 rather than X25519 or Ed25519.",
  concepts=[
   ("The three layers", "../execution/index.html#three", "identity, mandate, execution — and the three questions each answers"),
   ("The mandate gap", "../mandate/index.html", "the site answered whose key this is and not what the key may do"),
   ("The bootstrap trap", "../bootstrap/index.html", "named the most linkable argument in the set"),
   ("The missing half of a shipped feature", "../shipped/index.html", "no revocation and no directory are exactly what a registry supplies"),
  ],
  ideas=[
   "Encryption restricts who may read a mandate; the signature and subject binding establish who may exercise it.",
   "A signature proves possession of a private key and proves nothing about trustworthiness — trust is a policy decision made afterwards.",
   "A mandate constrains what an agent may be authorised to do, not what it does within that authority.",
   "The execution layer needs renaming, because twin already means something specific in this corpus.",
  ],
  pages="Reshaped the site: the bootstrap, enrolment, execution and shipped pages all come from this pack, and the mandate page was extended from it."),
 dict(slug="site-review",
  title="What pki.sgit.ai Is Missing: Mandate Is The Gap, And The Registry Is The Missing Half",
  md="v0.33.60__cross-team-brief__pki-site-review-mandate-is-the-gap-registry-is-the-missing-half.md",
  version="v0.33.60", date="19 August 2026", dtype="Cross-team brief",
  summary="A review of this site with seven recommended additions, written under a stated limitation the review itself treats as a finding: the site could not be read directly, because a fetch was refused by tooling that only permits URLs a search has already returned, and a search for the subdomain did not return the site. So the review works from the main site's index entry. It identifies the mandate as the largest gap, the bootstrap trap as the most linkable argument available, and the reframing that makes everything concrete — the shipped PKI has no revocation and no directory, which is precisely what a registry supplies.",
  concepts=[
   ("The four questions", "../index.html#layers", "whose key, what may it do, how does it get in, what happened when it was exercised"),
   ("Receipts as the third corner", "../execution/index.html#receipts", "recording identity and delegation without recording exercise leaves the most auditable event unrecorded"),
   ("Reuse the capability model", "../shipped/index.html#capabilities", "four tiers with the server holding only hashes, already implemented"),
   ("Trust roots stay open", "../rules/index.html#fractal", "a fractal structure requires each store to declare which roots it accepts"),
  ],
  ideas=[
   "A registry that records identity and not delegation is half a system.",
   "The registry is the missing half of a feature that already ships, which is a far stronger pitch than a general argument about key repositories.",
   "A second authorisation model in the same platform is a second thing to reason about, get wrong and document.",
   "The site being unreadable to an agent under a common tooling restriction is itself the finding — documentation that is excellent and unreachable.",
  ],
  pages="Every recommendation in it is now either shipped on the site or published as an open question; the review's own text is captured here unchanged, including the recommendations that were already met before it could be read."),
 dict(slug="bootstrap-trap",
  title="The Bootstrap Trap: Every Workaround Hands Over A Larger Identity",
  md="v0.33.60__strategy-brief__bootstrap-trap-every-workaround-hands-over-a-larger-identity.md",
  version="v0.33.60", date="19 August 2026", dtype="Strategy brief",
  summary="Why non-human identity is hard, stated as a circular dependency rather than a cryptographic problem. Generating a keypair is trivial; getting the public half recognised by something that matters requires reaching a trusted authority, every route to which requires authentication, which requires the identity the agent does not have. That is a loop rather than a gap, and every common escape — the operator's credential, repository write access, a shared bot token, a vendor integration, a cloud credential, a project signing secret, a bespoke enrolment server — solves transport by creating a larger identity problem. The answer is not a better credential but a channel narrow enough to require nothing.",
  concepts=[
   ("The loop", "../bootstrap/index.html#loop", "creating a key is not creating an identity, because an identity is a relationship somebody agreed to"),
   ("Ambient authority and the confused deputy", "../bootstrap/index.html#failure-modes", "the two named failure modes underneath every workaround"),
   ("Authority choreography", "../bootstrap/index.html#choreography", "the constraint is transport rather than cryptography"),
   ("The gradient", "../bootstrap/index.html#gradient", "I control this key, the project recognises it, the project delegates this mandate"),
  ],
  ideas=[
   "A system can use excellent cryptography and still have a weak bootstrap if the first instruction is to hand over a platform token.",
   "The workarounds are the mechanism behind documented incidents rather than a theoretical concern.",
   "Recognition is a decision rather than a computation, so a signature is never an endorsement.",
   "The remaining work is long, and the gain is that none of it needs a high-authority identity first.",
  ],
  pages="Became the bootstrap page, which the site review named the most linkable argument available."),
 dict(slug="enrolment",
  title="Agent Enrolment Without Borrowed Authority: The Append Lane Is The Narrow Door",
  md="v0.33.60__arch-brief__agent-enrolment-without-borrowed-authority-append-lane-is-the-narrow-door.md",
  version="v0.33.60", date="19 August 2026", dtype="Architecture brief",
  summary="An enrolment architecture that lets an agent obtain a project-recognised identity starting from nothing but a keypair — no repository credential, no project token, no certificate authority key, no vault key, no administrator identity — because every one of those grants authority broader than the identity being created. The agent signs a canonical request over its own public key, delivers it through an append lane whose granted capability is to add an object to an inbox and nothing else, and a trusted processor holding the issuing key reads the inbox, applies policy and publishes the result. Identity and mandate stay separate signed statements throughout.",
  concepts=[
   ("The initial state is the design", "../enrolment/index.html#initial", "computation, randomness, its own private key, and nothing else"),
   ("The enrolment request", "../enrolment/index.html#request", "the canonical fields, and what proof of possession does and does not establish"),
   ("The narrow door", "../enrolment/index.html#lane", "append-only ingress: add to an inbox, never read it"),
   ("The trusted side", "../enrolment/index.html#trusted", "the untrusted side never holds more than its own key"),
  ],
  ideas=[
   "Possession of this private key lets the agent act as itself, rather than as the project or the human operator.",
   "The nonce is not optional, and the canonical form must be specified precisely or the signature covers whatever the verifier reconstructs.",
   "A hostile agent can add junk to an enrolment inbox and can reach nothing else — the blast radius of the ingress is a queue that needs draining.",
   "Registries recognising registries works, and requires each to declare which roots it accepts.",
  ],
  pages="Became the enrolment page. Its milestones were revised down by the append-lane correction published two days later."),
 dict(slug="append-lane",
  title="The Append Lane Is Already Shipped And Account-Less: Four Tiers And Five Corrections",
  md="v0.33.60__arch-brief__append-lane-is-shipped-and-account-less-four-tiers-and-five-corrections.md",
  version="v0.33.60", date="19 August 2026", dtype="Architecture brief (correction)",
  summary="The vault-to-vault message transport as it actually exists, and the corrections it forces on work already written. The finding that changes the most: posting to an append lane requires only a token in the request body — no account and no access token — and returns a blind acknowledgement, which is precisely the narrow account-less ingress the enrolment architecture treated as the thing that had to be built. The capability model is four tiers rather than one credential, with the server storing only hashes of the first three. Five earlier claims are corrected, and the shipped-versus-proposed boundary is preserved exactly, because two halves of the mechanism are in different states.",
  concepts=[
   ("Four tiers, hashes on the server", "../shipped/index.html#capabilities", "append token, enumeration key, write key, and a private key never sent"),
   ("Registered anchors", "../shipped/index.html#anchors", "the recipient decides which senders are accepted, using a credential they do not have"),
   ("Shipped versus proposed", "../shipped/index.html#proposed", "the lane is verified; the client sealing layer and the address derivation are not"),
   ("The composition gap", "../shipped/index.html#composition", "every piece documented, and nothing saying they combine"),
  ],
  ideas=[
   "The blind acknowledgement enforces the write-only property in the response itself, which is a stronger form of the pattern than a permission model alone.",
   "A total compromise of the server yields hashes rather than capabilities — the catastrophic failure principle implemented rather than asserted.",
   "If it is not code-verified, label it proposed: a page that says not yet is better than one an agent trusts and acts on.",
   "Documenting capabilities separately and never documenting that they combine is how a working feature becomes invisible.",
  ],
  pages="Became the shipped page, and revised the enrolment page from a build into a configuration."),
 dict(slug="execution-broker",
  title="The Execution Broker: The Agent Never Holds The Credential",
  md="v0.33.60__arch-brief__service-twin-agent-never-holds-the-credential-closes-the-authorised-misuse-boundary.md",
  version="v0.33.60", date="19 August 2026", dtype="Architecture brief",
  summary="An execution broker that performs actions against external services on an agent's behalf, so the agent never receives the service credential. The unit of delegation stops being credential access and becomes authorised action: the agent presents an identity, a signed mandate, the specific action and its evidence; the broker verifies all of it, performs only the permitted operation using credentials held inside its own boundary, and returns a signed receipt. This closes a boundary three earlier pieces of work each named as the limit of their control — an authorised party misusing authority it legitimately holds — and it closes it by construction rather than by policy. Published here under a different name from the source document, which called it a Service Twin.",
  concepts=[
   ("The shift", "../execution/index.html#shift", "from credential access to authorised action"),
   ("The boundary this closes", "../execution/index.html#boundary", "named three times, each as the stated limit of a control"),
   ("Receipts as the evidence chain", "../execution/index.html#receipts", "a fact with provenance, produced by the party that performed the action"),
   ("The concentration risk", "../execution/index.html#concentration", "the broker holds every credential, which inverts the property everything else depends on"),
  ],
  ideas=[
   "Encryption restricts who can read a mandate; the signature and subject binding establish who may exercise it.",
   "An agent that never holds a credential cannot leak one, whatever is injected into it.",
   "Enforcement is interpretation rather than proxying, so the broker is an interpreter per provider per capability.",
   "Self-hosting is the mitigation for concentration, not an enterprise upsell.",
  ],
  pages="Became the execution page — renamed from Service Twin, because a digital twin represents a thing and this acts on one."),
 dict(slug="relay-pattern",
  title="The Relay Pattern: Encryption, Signing And Ordering Are Three Mechanisms",
  md="v0.33.59__arch-brief__relay-pattern-encryption-signing-and-ordering-are-three-mechanisms.md",
  version="v0.33.59", date="16 August 2026", dtype="Architecture brief",
  summary="Untangles three mechanisms that get bundled as one: encryption says who may read, signing says who acted, and ordering comes from data dependencies rather than from either. The brief that raised per-agent keys and the names-are-identities problem a registry would answer — and that stated, as the limit of its own control, that per-agent keys constrain which agent acts at which step and not what that agent does within its step. That stated limit is one of the three the execution broker closes.",
  concepts=[
   ("Three mechanisms, not one", "../execution/index.html#mandate-object", "the same discipline applied to authorisation rather than messaging"),
   ("The stated limit", "../execution/index.html#boundary", "which agent acts when, not what it does within its step"),
   ("Who may claim to be a participant", "../shipped/index.html#anchors", "left open here, answered by registered anchors"),
   ("Replay protection", "../enrolment/index.html#request", "needs a nonce inside the signed payload, and is easily left out"),
  ],
  ideas=[
   "A compromised agent can read its input, do something wrong, sign it correctly and pass it on, with every cryptographic check passing.",
   "Ordering is not a cryptographic property and should not be sought from encryption or signatures.",
   "Per-agent keys are the attribution mechanism; the registry is where the verifying keys would live.",
   "If anybody can register a name and publish a key for it, a message chain can be redirected.",
  ],
  pages="Foundation. Supplies the three-mechanisms discipline the mandate and execution pages both rely on."),
 dict(slug="two-populations",
  title="nhi.sgit.ai: The Question Splits Into Two Populations",
  md="v0.33.59__strategy-brief__nhi-site-two-populations-industry-answers-only-agents-you-run.md",
  version="v0.33.59", date="16 August 2026", dtype="Strategy brief",
  summary="The brief that scoped the sibling site. The question of how to give an identity to AI agents splits into agents you run and agents you rent; the industry's mature answer is attestation-based and serves only the first, while every agent practitioners actually name belongs to the second — where the honest current practice is to hand over a broad credential and hope. This site is the cryptographic half of that gap, and the bootstrap trap is the mechanism behind it: the reason rented agents have no identity is that the loop has no exit without a narrow ingress.",
  concepts=[
   ("The two populations", "https://nhi.sgit.ai/thesis/index.html", "agents you run vs. agents you rent — only one is served"),
   ("Why the workarounds persist", "../bootstrap/index.html#evidence", "the bootstrap trap supplies the mechanism behind the thesis"),
   ("Identity without attestation", "../execution/index.html#rented", "a hosted agent can hold a key and present a mandate"),
   ("The empty rows", "../mandate/index.html#problem", "no surveyed system supports per-agent keys"),
  ],
  ideas=[
   "For rented agents the equivalent capability is an open feature request, not a product.",
   "The site's thesis is the observation; the bootstrap trap is the explanation, and they are stronger together.",
   "A collection without a position is an archive — the thesis belongs on the front page.",
   "Vendor lists date in weeks; scenarios are comparable, checkable and re-runnable.",
  ],
  pages="Foundation. The identity gap this site is the cryptographic half of."),
 dict(slug="pki-registry",
  title="pki.sgit.ai: The Public Key Registry Has A Documented Failure To Learn From",
  md="v0.33.59__strategy-brief__pki-sgit-keyserver-failure-append-only-ownership-rule.md",
  version="v0.33.59", date="16 August 2026", dtype="Strategy brief",
  summary="The brief that scoped this site. It takes one historical lesson — the global keyserver network was destroyed in 2019 by a certificate-flooding attack its own maintainer called unsalvageable, and the cause was a stated design goal (never delete), not a bug — and turns it into the registry's design. The three abused properties become rules. The tension with the corpus's own append-only pattern is resolved precisely rather than by instinct: append-only is safe when the writer owns what it writes. Revocation becomes a signed append rather than a deletion. Identity and mandate separate into independently revocable signed statements. And the build order puts a private registry before a public one: testable versus commitment.",
  concepts=[
   ("The 2019 keyserver failure", "../failure/index.html", "~150,000 garbage signatures on one key; unrepairable by design"),
   ("The ownership rule", "../failure/index.html#append-only", "append-only is a guarantee when writers own their records, an attack surface when anyone appends to another's"),
   ("The four registry rules", "../rules/index.html", "owner-only writes, revocation as signed append, size bounds, every entry signed"),
   ("Identity vs. mandate", "../mandate/index.html", "who the key belongs to vs. what the agent may do, separately revocable"),
  ],
  ideas=[
   "Third-party attestations are what made the old system valuable and what made it attackable — the central design choice, to be made deliberately.",
   "Vaults supply distribution, safe mirroring and versioning; the ownership rule, size bound and signature checking are the registry logic still to build.",
   "Fractal trust structures require declared roots, or the graph is unevaluable.",
   "Lead with the failure page — the most linkable thing the site will have, and proof the design knew the history.",
  ],
  pages="Became the site: the failure page, the four rules, identity and mandate, and the build order."),

 dict(slug="registry-mvp-pack",
  title="The Public Registry MVP: Open Data, A Single Operator, LLM Sessions First",
  md="pack-registry-mvp__00__leading-brief__open-data-single-operator-llm-sessions-first.md",
  version="draft-1", date="20 August 2026", dtype="Briefing pack, leading brief (site-agent first pass)",
  summary="The leading brief of the registry MVP pack — a first pass authored by the site agent at the project lead's request, for review. It scopes a buildable MVP: a public store on vaults holding keys, identities, mandates and grants, whose first users on both sides of every workflow are LLM sessions. Confidentiality is out of scope on principle (a registry contains no secrets); integrity and authenticity are the point. The apparent contradiction with the site's build order is resolved head-on: this is public in data and private in authority — the private registry, published — with the genuine public-registry commitments still deferred behind a policy-closed door.",
  concepts=[
   ("The first client is a page", "../documents/registry-first-client.html", "if a fresh session cannot follow the published workflow, the MVP is not done"),
   ("Enforcement is verification anybody can re-run", "../documents/registry-vault.html", "the MVP's honest substitute for server-side rules"),
   ("Public in data, private in authority", "../roadmap/index.html#order", "build-order step 4 with the covers off, not step 6 early"),
   ("Mandate vs grant", "../documents/registry-schemas.html", "policy and instance, revocable independently"),
  ],
  ideas=[
   "A registry's contents are meant to be public — publishing plaintext is what a registry is, not a compromise.",
   "A mandate lives in the issuer's record; the subject appends an acceptance — rule 1 with no exceptions.",
   "The index is a curated convenience carrying no authority; signatures carry the authority.",
   "Receipts stay out of the registry: a receipt is the executor's statement, not the registry's.",
  ],
  pages="The pack proposing build-order step 4. Four briefs follow: the vault architecture, the schemas, the first-client workflows, and the phased build order."),
 dict(slug="registry-vault",
  title="The Registry Is A Public Vault: Append-Only Statement Logs",
  md="pack-registry-mvp__01__arch__registry-as-public-vault-append-only-statement-logs.md",
  version="draft-1", date="20 August 2026", dtype="Architecture brief (site-agent first pass)",
  summary="The registry mapped onto what ships: one public vault whose tree is a set of append-only records, one per participant, keyed by signing fingerprint; each record a numbered sequence of signed statement files forming a hash chain, current state read-to-the-end. The write path is the shipped account-less append lane feeding a trusted processor — the only holder of the vault write key, and possibly itself an LLM session with a runbook. The four rules are implemented as processor checks plus a public validator anybody can re-run, which is the open-data MVP's enforcement story.",
  concepts=[
   ("One record shape for everybody", "../rules/index.html#fractal", "agents, issuers and the operator are all participants; roots.json is the only distinction"),
   ("The statement envelope", "../documents/registry-schemas.html", "seq and prev make each record a hash chain; signer lets one shape serve self- and issuer-signed statements"),
   ("The processor as referee", "../enrolment/index.html#trusted", "rule 1 as key custody plus one process's correctness"),
   ("Canonicalisation as a published parameter", "../documents/registry-first-client.html", "jq -cS, versioned in params.json — treated with the same precision as the key algorithm"),
  ],
  ideas=[
   "Numbered immutable statement files fit the platform's one-year-immutable caching contract and make the size bound trivially checkable.",
   "The validator runs in CI and is public: anybody who distrusts the operator can re-run the operator's honesty.",
   "The storage layer never understands the registry — a weakness (detectable-not-preventable garbage) and a portability property.",
   "Proposed bounds: 256 statements, 512 KB per record, 8 KB per statement — cheap to argue about now.",
  ],
  pages="Brief 01 of the registry MVP pack."),
 dict(slug="registry-schemas",
  title="Identity, Mandate, Grant, Revocation: The Statement Bodies, First Pass",
  md="pack-registry-mvp__02__arch__schemas-identity-mandate-grant-revocation-first-pass.md",
  version="draft-1", date="20 August 2026", dtype="Architecture brief (site-agent first pass)",
  summary="The four statement bodies plus acceptance, and the structural decision the pack most wants reviewed: where issuer-signed statements live. A mandate is the issuer's statement, so it lives in the issuer's record; the subject appends an acceptance pointing at it — keeping rule 1 intact with no exceptions, at the cost of an index for the join. The mandate/grant split is policy versus instance. One rule is absolute even with open data: the registry never contains a live capability — a grant records the hash of what was issued, never the thing itself.",
  concepts=[
   ("Where a mandate lives", "../rules/index.html#r1", "the first design decision after publishing the keyserver history cannot be \"except issuers\""),
   ("The verification walk", "../documents/registry-first-client.html", "roots, record, chain, acceptances, issuer chain, revocations — all public fetches plus signature checks"),
   ("Never a live capability", "../shipped/index.html#capabilities", "the hashes-on-the-server discipline applied to registry content"),
   ("Identity says less on purpose", "../mandate/index.html#principles", "self-issued statements are the one place where saying less is more honest"),
  ],
  ideas=[
   "An unaccepted mandate is issuable but inert — the subject's record shows what it agreed to operate under.",
   "Revocations carry effective_from, so what a key said before revocation stays checkable.",
   "Grants are high-churn for an append-only store; the size bound will be felt there first.",
   "A verifier with two conflicting mandates has no tie-break rule yet — published as open.",
  ],
  pages="Brief 02 of the registry MVP pack."),
 dict(slug="registry-first-client",
  title="The First Client Is A Documented Workflow",
  md="pack-registry-mvp__03__arch__the-first-client-is-a-documented-workflow.md",
  version="draft-1", date="20 August 2026", dtype="Architecture brief (site-agent first pass)",
  summary="The MVP's centre of gravity: the client is not a program but a published page an LLM session follows — verify, enrol, and operate-under-mandate, written in copy-paste form. An LLM session is the hardest easy case: full tooling, no standing state, no human mid-flow, and it reads documentation literally. A workflow that survives that user survives almost anybody. The enrolment flow walks the bootstrap gradient as commands, the outcome channel is the public registry itself, and the two not-yet-shipped dependencies (the lane-address derivation; exact sign/verify flags) are marked rather than assumed.",
  concepts=[
   ("The hardest easy case", "../bootstrap/index.html#gradient", "the gradient walked as commands, by the user the thesis is about"),
   ("The blind ack has no probe value", "../enrolment/index.html#lane", "pending and declined look identical to the sender, by design"),
   ("The outcome channel is the read path", "../documents/registry-vault.html", "an agent discovers recognition the way any third party would"),
   ("Session-scoped identities", "../bootstrap/index.html#unfixed", "a finding to record, not a failure to hide"),
  ],
  ideas=[
   "Writing the workflow page is the first acceptance test — executed, not recalled, applies to command blocks.",
   "The three-session shape is the test that matters: issuer, subject and verifier sharing nothing but public URLs.",
   "The verifier refusing correctly is as much the test as the happy path.",
   "The passphrase question must be answered on the page: an encrypted vault is acceptable, the repo and the transcript are not.",
  ],
  pages="Brief 03 of the registry MVP pack."),
 dict(slug="registry-build-order",
  title="Registry MVP Build Order: Read Path First, Every Phase Ends With A Fresh Session",
  md="pack-registry-mvp__04__strategy__build-order-read-path-first-acceptance-tests.md",
  version="draft-1", date="20 August 2026", dtype="Strategy brief (site-agent first pass)",
  summary="Five phases — fixtures, read path, write path, mandates and grants, the three-session demo — with one rule: the read path ships before the write path, and every phase's definition of done is a test a fresh LLM session can run. Each phase is also an experiment with a stated question, because the MVP's purpose is developing the tech and workflows for LLM-session PKI: where does a literal reader trip, how long does an agent identity actually live, is the mandate vocabulary usable before a broker enforces it, and where does the human actually remain in the loop.",
  concepts=[
   ("Read before write", "../documents/registry-vault.html", "the half a genuinely public registry shares unchanged, and every phase's outcome channel"),
   ("Acceptance tests as fresh sessions", "../shipped/index.html#composition", "the documentation standard promoted to the definition of done"),
   ("One capability, deeply", "../execution/index.html#interpretation", "repo.pull-request.create exercises the whole shape on day one"),
   ("Refusals are the test", "../mandate/index.html", "valid, expired, revoked, never-accepted — all four states answered correctly"),
  ],
  ideas=[
   "Phase 1 has no policy content, which is why it goes first.",
   "The processor should log every decision publicly, keeping the trust boundary auditable.",
   "Phase 4's write-up names every step that needed a human — the honest residue is the publishable finding.",
   "Corpus versions are assigned on adoption; this pack proposes and does not decide.",
  ],
  pages="Brief 04 of the registry MVP pack."),
]

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · documents · pki.sgit.ai</title>
<meta name="description" content="Original document, readable in-page: summary, key concepts and key ideas, then the full markdown. {dtype}, {version}, {date}. CC BY 4.0.">
<link rel="canonical" href="https://pki.sgit.ai/documents/{slug}.html">
<link rel="stylesheet" href="../assets/site.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="index.html">documents</a> / {slug}</div>
<h1>{title}</h1>

<div class="docmeta">
  <span class="k">Type</span><span class="v">{dtype}</span>
  <span class="k">Version</span><span class="v">{version}</span>
  <span class="k">Date</span><span class="v">{date}</span>
  <span class="k">Author</span><span class="v">Dinis Cruz (project lead) and collaborators</span>
  <span class="k">Licence</span><span class="v">CC BY 4.0</span>
  <span class="k">Source</span><span class="v"><a href="{mdpath}">raw markdown</a> · <a href="{gh}/blob/dev/briefs/{md}">view on GitHub</a></span>
</div>

<h2 id="summary">Summary</h2>
<p>{summary}</p>

<h2 id="concepts">Key concepts</h2>
<ul>
{concepts}
</ul>

<h2 id="ideas">Key ideas</h2>
<ul>
{ideas}
</ul>

<h2 id="on-site">On this site</h2>
<p>{pages}</p>

<h2 id="read">Read the document</h2>
<div class="mdread-label">📄 Original document · {version} · {date} · rendered from the <a href="{mdpath}">raw markdown</a> (the source of truth)</div>
<div class="mdread" id="mdread" data-src="{mdpath}"><noscript><p class="dim">In-page rendering needs JavaScript — <a href="{mdpath}">open the raw markdown</a>.</p></noscript></div>

<div class="pagenav">
  <a href="index.html">← All documents</a>
  <a href="{mdpath}">Raw markdown →</a>
</div>
</main>

<footer class="site"><div class="cols"></div></footer>

<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="../assets/mdreader.js"></script>
</body>
</html>
"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for d in DOCS:
        mdpath = "../briefs/" + d["md"]
        assert (ROOT / "briefs" / d["md"]).exists(), f"missing brief: {d['md']}"
        concepts = "\n".join(
            f'  <li><a href="{href}"><b>{name}</b></a> — {gloss}</li>' for name, href, gloss in d["concepts"])
        ideas = "\n".join(f"  <li>{i}</li>" for i in d["ideas"])
        fields = {k: v for k, v in d.items() if k not in ("concepts", "ideas")}
        (OUT / f"{d['slug']}.html").write_text(PAGE.format(
            mdpath=mdpath, gh=GH, concepts=concepts, ideas=ideas, **fields))
    print(f"gen_documents: {len(DOCS)} reader page(s) written to documents/")


if __name__ == "__main__":
    main()
