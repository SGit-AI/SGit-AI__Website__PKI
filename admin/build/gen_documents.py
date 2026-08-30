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


 dict(slug="register-fixtures",
  title="The Register Was Designed In June: Published Keypairs Are Fixtures, Not Identities",
  md="v0.33.61__arch-brief__register-was-designed-in-june-published-keypairs-are-fixtures-not-identities.md",
  version="v0.33.61", date="20 August 2026", dtype="Architecture brief",
  summary="The register the memo asks for was designed on 5 June (v0.32.4): clues not storage, entries as nodes with relationships as the value, two-level trust in which self-declaration grants nothing, the register as a vault holding no private data, connectors to any identity provider, and resolution as the caller's job — so today's work is operationalisation, not design. The correction that matters: a keypair whose private half is published is not a weak identity but no identity, permanently — a fixture, whose whole purpose is to exercise the plumbing, marked by a required private_key_published flag read before any signature, never reachable from the real trust graph, and retired only by republishing under a fresh key. Personas ship as signed agent cards; the notary is a workflow identity with keyless signing; and push protection will block the published key, which makes the recorded bypass part of the demonstration.",
  concepts=[
   ("The fixture class", "../packs/registry-mvp/change-control.html", "adopted into the MVP pack as change C3 — the flag before the signature"),
   ("Evidence to the asserter's record", "../rules/index.html#r1", "the 2019 rule applied to vouching — the same rule the MVP pack chose independently"),
   ("A fixture voids two rules", "../packs/registry-mvp/tabletop.html", "revocation and signature-substance — which is what makes fixtures the rules' first test"),
   ("Retrieval is not persistence", "../bootstrap/index.html#unfixed", "fetching a key works only while the key is public; the 19 August question stays open"),
  ],
  ideas=[
   "Whether the private half is published is the most consequential evidence an entry can carry.",
   "A fixture's append lane is a public inbox — anything sent to it is readable by anybody.",
   "The notary must be an agent you run: the two-populations thesis as an implementation constraint.",
   "Publishing a key inside vault ciphertext evades secret scanning rather than satisfying it.",
  ],
  pages="Folded into the registry MVP pack as change-control entries C2, C3 and C4; the tabletop's inject I5 runs its central warning as an exercise card."),
 dict(slug="grant-vs-mandate",
  title="Grant Is Not Mandate: The Gap Between Them Is Exposure Nobody Accepted",
  md="v0.33.61__strategy-brief__grant-is-not-mandate-the-gap-is-the-exposure-nobody-accepted.md",
  version="v0.33.61", date="20 August 2026", dtype="Strategy brief",
  summary="Superseded in place by a sharpened same-day version, which adds the argument below on prohibitions. A vocabulary split with a measurement inside it: a grant is the union of capabilities conferred at assignment, a mandate is what the holder is authorised and expected to do, and in practice the first is much larger than the second. The difference — excess authority — is blast radius measured from the other end, and it is unaccepted by construction, so it defaults to critical and escalates without anybody escalating it. The brief corrects a 17 July claim (to grant is to mandate — they coincide only in the rare case), gives a mandate its five required fields (issuer, subject, scope, interval, revocation path — a mandate with no interval is a grant wearing a mandate's name), separates enforcement (an execution broker, where grant and mandate coincide by construction) from instrumentation (a declared mandate, honest only when called that), and notes an instruction in a chat is not a mandate at all.",
  concepts=[
   ("Excess authority", "../packs/registry-mvp/diagrams.html", "grant minus mandate — the registry's countable product, drawn as D7"),
   ("The five fields", "../mandate/index.html#fields", "issuer, subject, scope, interval, revocation path — four already published here"),
   ("Enforcement vs instrumentation", "../execution/index.html#boundary", "the broker bounds the grant; a declared mandate measures it"),
   ("Agent cards as the partial home", "../packs/registry-mvp/change-control.html", "scope-of-authority declared; the issuer signature and interval are the missing half"),
  ],
  ideas=[
   "A deny-list mandate widens SILENTLY every time the provider ships a feature — the world is open, so an allow-list is the only form that stays correct.",
   "Excess authority is only well defined against an allow-list: a difference taken against a deny-list is the whole open world minus three named items.",
   "Prohibitions still belong in the record as annotations — they carry intent an allow-list cannot express — but never as what a checker consults.",
   "An instruction in a chat has no issuer, no interval, no record and no revocation path — a different kind of object.",
   "Mandate compliance measured on a cooperative agent says nothing about an injected one.",
  ],
  pages="Folded into the registry MVP pack as change-control entry C1 — the grant redefinition that makes excess authority the registry's countable product."),
 dict(slug="site-access-report",
  title="Site Access Report: Three Findings Closed, The Composition Gap Moved Up A Layer",
  md="v0.33.61__cross-team-brief__site-access-report-three-findings-closed-composition-gap-moved-up-a-layer.md",
  version="v0.33.61", date="20 August 2026", dtype="Cross-team brief",
  summary="A field report from an agent that could reach the estate's three sites, verifying two briefs written the same day by a session that could not. Three 19 August findings are closed: the page joining transport to cryptography exists, the acceptance test passes in two fetches, and the statement that made an agent stop looking is gone. The discoverability finding is restated as harness-conditional. And the actionable finding: the composition gap has moved up a layer — three sites hold three thirds of one answer (the problem, the design, the shipped commands) and cross-link only at the domain level. A domain link is a referral, not a composition; the fix is page-to-page links and one sentence per site saying which third it holds.",
  concepts=[
   ("Three thirds of one answer", "../packs/registry-mvp/diagrams.html", "drawn as D1; this site's third is the design"),
   ("The path convention as a promise", "../llms.txt", "agents already rely on constructed URLs; stating it makes it dependable"),
   ("Four rules with no entries are four assertions", "../packs/registry-mvp/tabletop.html", "the fixture programme is the conformance test"),
   ("Fetch the words", "../documents/site-review.html", "the near-miss: a summary suggested a blur the literal text did not contain"),
  ],
  ideas=[
   "A page that confirms the capability and enumerates the gaps keeps the reader; a page that denies it sends them away.",
   "An acceptance test for the cross-site gap: from the research site alone, reach the shipped commands and know what you can do this afternoon.",
   "The estate marks its own homework unless somebody else runs the test.",
  ],
  pages="Acted on at v0.1.5: this site now states which third it holds and links page-to-page into the shipped documentation; the composition finding is drawn as the pack's D1."),

 dict(slug="history-append-only",
  title="History Is The Append-Only Log: The Objects Are Immutable And The Reference Is Not",
  md="v0.33.61__arch-brief__history-is-the-append-only-log-objects-immutable-reference-is-not.md",
  version="v0.33.61", date="20 August 2026", dtype="Architecture brief",
  summary="The brief that dissolves a tension between two of this site's own published rules. Revocation-as-a-signed-append and size-bounded records pull against each other only while the entry is treated as a record that accumulates; seen as a file inside a commit graph, the two rules govern different structures and the conflict disappears. It also corrects a comfortable assumption: blobs, trees and commits are content-addressed and immutable, but branch references are mutable and a history reset is a shipped command — so append-only history is a policy about one pointer, not a property of the store. The fix is the site's own standard: publish the head, signed and dated, so a rewrite becomes falsifiable by any reader who kept the last one. And it names the register's central query — what did this identity look like on this date — as the one piece with no command behind it.",
  concepts=[
   ("Two append-only structures", "../rules/index.html#r1", "the commit graph gated by the write key, the lane open to token holders — rule 1 as topology, not policy"),
   ("The reference is mutable", "../packs/registry-mvp/change-control.html", "objects cannot be altered undetectably; the pointer that selects them can be moved"),
   ("Publish the head", "../rules/index.html#reference", "turning an append-only promise into something a reader can falsify"),
   ("The missing traversal", "../packs/registry-mvp/build-order.html", "path-scoped history is the register's product and has no command"),
  ],
  ideas=[
   "A third party has nowhere to write into the owner's record — that is a stronger form of rule 1 than a rule can be.",
   "The entry file carries current state and no history array; a consumer wanting the answer fetches one object, one wanting the story clones.",
   "Content addressing makes the traversal a hash comparison per commit rather than a diff, so it is cheaper than it looks.",
   "A mandate's trust ceiling is its issuer's, not its subject's — and it will read as a defect the first time a familiar agent resolves to an unrecognised mandate.",
  ],
  pages="Folded into the MVP pack as change-control entries C7 and C8, and into the rules page as the proposed fifth rule about the reference."),
 dict(slug="user-section",
  title="The User Section Is A Conformance Test For The Site's Own Claim",
  md="v0.33.61__dev-brief__user-section-is-a-conformance-test-store-the-choices-not-the-answers.md",
  version="v0.33.61", date="20 August 2026", dtype="Dev brief",
  summary="The user area, the one thing that must not be stored in it, and the documented reason its stated objective can backfire. What a visitor assembles \u2014 which agents run where, holding which credentials, with which containment \u2014 is in aggregate a serviceable plan for attacking them, so the site stores their choices rather than their answers: references into a public library of pre-computed trees, and nothing describing their machine. Browser storage then stops being a compromise and becomes a demonstration of the site's own thesis, checkable in the network panel in ten seconds. And the objective is behaviour change, which has a measured failure mode: strong fear appeals with low-efficacy messages produce the greatest defensive response, so a frightening page with no credible answer performs worse than one that says nothing. That contradicts the explainer's no-remedies rule, and both are right, because a general page may withhold and a personalised one may not. The hardest case is hosted, where the honest answer is that nothing the visitor can do changes the containment \u2014 zero efficacy by construction \u2014 so its exit is a request rather than a remedy.",
  concepts=[
   ("Store the choices, not the answers", "../assess/index.html", "the rule, running \u2014 and there is no free-text input on the page at all"),
   ("A privacy claim that is architectural", "../packs/registry-mvp/user-assessment.html", "a property rather than a promise, because there is no backend to send to"),
   ("Zero efficacy by construction", "../packs/registry-mvp/grant-tree.html", "the hosted page alarms most and can do least, so its exit is a request"),
   ("Measure action, not alarm", "../packs/registry-mvp/change-control.html", "C22 \u2014 and the honest admission that a page with no backend can measure none of it"),
  ],
  ideas=[
   "A general page may withhold the answer; a personalised one may not \u2014 withholding creates appetite in one and denial in the other.",
   "Losing the stored pack costs the visitor almost nothing, which is exactly what a demonstration wants.",
   "A local-folder copy of the site gets an opaque origin, so this is the feature that breaks first in a downloadable bundle.",
   "A visitor saying \u201cthat is not what my setup looks like\u201d is the cheapest correction the library will ever receive.",
  ],
  pages="Became document 14 of the registry MVP pack and the workflow at /assess \u2014 the first thing on this site that is built rather than specified."),
 dict(slug="grant-tree",
  title="The End-To-End Flow Is The August Worked Example With An Agent Installation As The Twin",
  md="v0.33.61__arch-brief__end-to-end-flow-is-the-august-worked-example-grant-tree-needs-control-labels.md",
  version="v0.33.61", date="20 August 2026", dtype="Architecture brief",
  summary="The flow from what an agent can reach to somebody accepting a risk does not need designing \u2014 it is the 2 August worked example with an agent installation as the twin, and excess authority plays the role a regulatory provision played there, which is what makes the finding computed rather than asserted. Four corrections follow. A grant is a tree of subgrants, so blast radius is a path through it; and the load-bearing part is the label on each node, because a control bounds a grant only when it is enforced by something the grant does not include \u2014 giving boundary, setting and expectation, and placing most current containment in the middle tier. The two scenarios are the two populations and neither dominates: locally the containment is available and unused, hosted it may be excellent and is unverifiable. Grants and mandates are artefacts, so they get signed rather than keyed. And counting acceptances is the one metric that inverts, because it is maximised by making risks easy to accept.",
  concepts=[
   ("A control bounds a grant only if the grant does not include it", "../packs/registry-mvp/grant-tree.html", "three tiers, and no vendor-specific claim required"),
   ("Blast radius is a path, not an item", "../packs/registry-mvp/schemas.html", "containment relationships are what makes the tree worth having"),
   ("Neither population dominates", "../documents/two-populations.html", "a large grant with a boundary you own, against a small one with a boundary you cannot see"),
   ("Declines are the cheapest test", "../packs/registry-mvp/user-stories.html", "a hundred percent acceptance means the risks are trivial or the process is theatre"),
  ],
  ideas=[
   "A permission prompt that a flag in a writable file can disable is an expectation wearing a setting's clothes.",
   "One hosted container measured: root inside, passwordless escalation, and an egress allowlist that root could not defeat.",
   "Prohibitions are the presentation layer and the allow-list is the enforcement layer, generated from each other and dated.",
   "Publishing a prepared tree is a dated assessment of somebody else's product, so every node carries its own date and a re-run method.",
  ],
  pages="Became document 12 of the registry MVP pack, and gives the grant the structure the excess-authority finding had been assuming since C1."),
 dict(slug="keys-and-signatures",
  title="A Secret Is Defined By Expectation And A Signature By Scarcity",
  md="v0.33.61__arch-brief__a-secret-is-defined-by-expectation-a-signature-by-scarcity.md",
  version="v0.33.61", date="20 August 2026", dtype="Architecture brief",
  summary="A brief that adopts a proposal's opening principle and its closing pattern and rejects the proposal in between, and says so rather than smoothing the difference. The principle: a secret is defined by expectation rather than by content, which explains read-keys-yes and write-keys-never in one line and sorts key material by intention rather than by class \u2014 with the qualification that the intention has to be recorded at issue, since a deliberate publication and a leak are indistinguishable afterwards. The rejection: publishing a private half destroys the integrity it was meant to supply, because a signature's value comes entirely from scarcity, so what is left is a hash wearing a signature's clothes \u2014 worse than a hash, because a verifier checks it, succeeds, and concludes something false. And the closing pattern, promoted to the governing rule: an instance generates its own keypair and a project key endorses it, so a key belongs to whatever can keep a secret and everything else is signed by something that can.",
  concepts=[
   ("A signature is made of scarcity", "../packs/registry-mvp/keys-and-signatures.html", "publish the private half and verification stops carrying information"),
   ("A flag that is always true is a column", "../packs/registry-mvp/change-control.html", "publish-by-default would make the fixture flag true on every row"),
   ("Custody without access", "../rules/prior-art.html", "destroying a vault does not make the ciphertext other people already hold unreadable"),
   ("Route to the issuer's lane", "../packs/registry-mvp/observability.html", "the addressing benefit of per-object keys, without the keys"),
  ],
  ideas=[
   "A key belongs to whatever can keep a secret; everything else is signed by something that can.",
   "The proposal's own use \u2014 sealing to a specific object \u2014 requires exactly the scarcity the proposal removes.",
   "Sign by default, and publish which signatures anybody actually checks.",
   "A memo has now raised per-object keys twice, which says the first explanation did not stick.",
  ],
  pages="Became document 13 of the registry MVP pack. It reinforces the fixture flag rather than amending it: the flag survives precisely because per-object published keys are declined."),
 dict(slug="observability",
  title="Observability Is The Usage Graph Nobody Has To Declare: Check Events Belong In The Issuer's Own Lane",
  md="v0.33.61__arch-brief__observability-is-the-usage-graph-check-events-in-the-issuers-lane-a-verification-is-not-a-use.md",
  version="v0.33.61", date="20 August 2026", dtype="Architecture brief",
  summary="The observability layer, and the one decision inside it that separates a security property from a surveillance product. Observability goes in at the beginning, not because it is good practice but because the case for declared mandates is that they produce the evidence saying where enforcement earns its cost \u2014 and without check events they produce none. The correction the proposal needs: a verification is not a use, and the error runs both ways, since a party that uses a mandate without verifying generates nothing while a resolver walking the chain generates an event with no usage behind it. So the primary output is the missing edges \u2014 the parties holding a mandate that have never once checked it \u2014 which the issuer can compute because it holds both halves. Where the events are written decides what this is: a central log accumulates who is evaluating whom across parties that never consented; the issuer's own lane makes it an owner observing their own asset. And because nothing is pushed, the interval between a party's checks is its effective revocation latency, measurable before anything is ever revoked.",
  concepts=[
   ("A verification is not a use", "../mandate/index.html", "the party that never verifies is the weakest relying process, and the one this cannot see"),
   ("The missing edges are the product", "../packs/registry-mvp/observability.html", "issued-to minus has-checked, computable by the issuer alone"),
   ("The location of the log is the design", "../packs/registry-mvp/change-control.html", "rule 1 applied to telemetry: the asserter appends to its own record"),
   ("Effective revocation latency", "../rules/index.html#revocation", "no push means propagation happens at the rate parties check \u2014 so the rate is measurable in advance"),
  ],
  ideas=[
   "The design that protects the positioning is the design that destroys the dataset, and it should be chosen deliberately.",
   "A thousand pending files per token makes draining an obligation that fails silently.",
   "Whether a lane with no anchors accepts any token holder is absent from the reference, and it gates the whole layer's coverage.",
   "\u201cVerify this mandate at least once every twenty-four hours\u201d is one of the very few mandate clauses that is actually decidable.",
  ],
  pages="Became document 11 of the registry MVP pack, and answers a question the mandate page had been raising since it was published \u2014 by refusing it: nobody can say who is using a mandate, and the issuer can say who has never checked one."),
 dict(slug="notary",
  title="Every Trust Edge Is A Two-Way Conversation: Signed Once Against Checked Every Time",
  md="v0.33.61__arch-brief__every-trust-edge-is-a-two-way-conversation-notary-signed-once-vs-checked-every-time.md",
  version="v0.33.61", date="20 August 2026", dtype="Architecture brief",
  summary="The verification half of the registry. A claim naming an authority should be checkable by going to that authority and asking — which is not a new requirement but the step that turns the self-declaration of upward trust into a signal. The fork the memo states in passing is the whole design: a signed assertion verified once and a live lookup checked every time are two products with opposite properties, not two settings. Only the live one can be metered, because charging per check requires observing every check — and what a live notary accumulates is a relationship graph that neither party handed over, which contradicts the estate's positioning more sharply than any content-handling service could. A notary that publishes rather than answers cannot meter and cannot surveil, and those turn out to be one property.",
  concepts=[
   ("Unreachable is a fourth state", "../packs/registry-mvp/schemas.html", "a resolver rendering it as untrusted manufactures incidents; as trusted, it has no security property"),
   ("Metering and surveillance are one capability", "../execution/index.html#concentration", "removing one removes the other, so the privacy cost is a consequence of the revenue model"),
   ("Publish, don't answer", "../rules/index.html#reference", "the same move as the published head, applied to verification"),
   ("A budget is a trust boundary", "../packs/registry-mvp/build-order.html", "a resolver stopping because the next check cost too much is a new reason for a partial result"),
  ],
  ideas=[
   "The notary was specified in March as a countersignature naming its attester, with verification depth as a client-side setting.",
   "Issuance is better for the customer and worse for recurring revenue; a site arguing for honest disclosure should say which it chose.",
   "A resolution result must distinguish not-checked-because-unreachable from not-checked-because-it-cost-too-much.",
   "A third party's pricing decision quietly changes the assurance level of every verifier downstream.",
  ],
  pages="Folded into the MVP pack as change-control entry C9; its published-answer shape is the same move the rules page now proposes for the reference."),
 dict(slug="register-ui",
  title="The Register Interface: Every Edge Carries A Verification Badge",
  md="v0.33.61__dev-brief__register-ui-every-edge-carries-a-verification-badge-policy-is-a-query.md",
  version="v0.33.61", date="20 August 2026", dtype="Dev brief",
  summary="The interface, and a tested result that sharpens the whole thesis. Every line in a register is a claim by somebody about somebody, so the design primitive is a badge on each edge — who can verify it, by what method, at what cost, when it was last checked, and the answer, with five result states because denied, unreachable and never-checked are three different situations. A policy then becomes a saved query that must return no rows, and the badge on the constrained edge decides whether that policy is enforcement or instrumentation. The surface question was tested inside a running rented session rather than argued: the surface is named precisely by environment variables, no attestation device of any kind is present, and nothing is signed — so the surface is knowable to the agent and unprovable to anybody else.",
  concepts=[
   ("Nobody is a legitimate badge value", "../packs/registry-mvp/change-control.html", "an edge no party can check is a correctly rendered fact, and hiding it makes everything look equally solid"),
   ("A policy is a query that must return empty", "../packs/registry-mvp/tabletop.html", "checkable, explainable, and it dates itself"),
   ("Handing the session a secret makes it worse", "../bootstrap/index.html#workarounds", "a secret proves possession, not location — the bootstrap trap pattern exactly"),
   ("The gap is distribution, not knowledge", "https://nhi.sgit.ai/thesis/index.html", "the vendor records the surface and has no way to tell a third party in checkable form"),
  ],
  ideas=[
   "Attestation from nothing is a hardware problem; signing a record you already hold, for a named relying party, is a product decision.",
   "The register's most valuable page will be the one listing every edge that nobody can check.",
   "The session that tested the question runs on the surface reported as having no audit coverage at all.",
   "The narrower, dated tripwire: no vendor issues a signed third-party-verifiable statement naming a session's surface. Anybody who shows one refutes it.",
  ],
  pages="Folded into the MVP pack as change-control entry C10; the badge vocabulary and the policy-as-query are queued as the register's interface layer."),
 dict(slug="levels-and-variants",
  title="Levels And Variants Are Two Axes Rather Than One: The Worked Instance Is This Session",
  md="v0.33.61__dev-brief__levels-and-variants-are-two-axes-the-worked-instance-is-this-session.md",
  version="v0.33.61", date="20 August 2026", dtype="Dev brief",
  summary="The experimentation programme for explaining the grant–mandate gap, and the reframing that makes it land on people who have actually used an agent. Levels (depth of detail) and variants (rendering of one level) are orthogonal, so the design is a grid rather than a ladder — a programme that conflates them cannot tell whether a poor result came from the wrong depth or the wrong wording. Expertise predicts vocabulary and not self-knowledge, so everybody starts at level one and the advanced user — largest grant, strongest prior — is the hardest case, not the easiest. Five scenarios ordered by grant size replace personas by job title. And the worked instance is the session that wrote the brief: capabilities outside the stated mandate were not merely held, they were exercised repeatedly and improved the output — so the honest scenario shows three sets, mandated, exercised-beyond-mandate, and held-and-never-used, and the third set is the product.",
  concepts=[
   ("Two axes, not one", "../packs/map-your-case/levels-and-variants.html", "level varies depth for one reader; variant varies rendering of one level; conflating them makes results undiagnosable"),
   ("The variant rule, written eleven days early", "../packs/map-your-case/principles.html", "a persona may change emphasis, ordering, vocabulary and format, and may never change what is being accepted — mechanically checkable as an empty fact-set diff"),
   ("Everybody starts at level one", "../packs/map-your-case/levels-and-variants.html", "the advanced user holds the largest grant and the strongest prior that there is nothing to learn"),
   ("The three sets", "../assess/index.html", "mandated, exercised beyond the mandate, held and never used — the third is the one nobody can defend"),
  ],
  ideas=[
   "The gap is not only where the danger is — it is also where the value came from, which is precisely why nobody closes it.",
   "Each level must be a complete answer, not a step towards one: a reader who stops at any level has gained something whole.",
   "A visual eliminated a framing effect that was significant in text alone, so test the visual variants first.",
   "At a few dozen readers this is qualitative research; reporting it as A/B measurement would be false precision used to pick a design.",
   "A share is a link whose fragment holds library identifiers — the choices-only rule makes it disclose nothing by construction.",
  ],
  pages="Became document 07 of the Map Your Case pack — the levels-and-variants programme — and reframed the assessment's dashboard around the three sets."),
 dict(slug="synthetic-readers",
  title="The Screenshot Boundary Is The Instrument And The Patience Budget Must Come From Outside The Model",
  md="v0.33.61__dev-brief__screenshot-boundary-is-the-instrument-patience-budget-must-be-exogenous.md",
  version="v0.33.61", date="20 August 2026", dtype="Dev brief",
  summary="The tabletop programme for testing pages with synthetic readers, and the three methodological corrections that decide whether it measures anything. Two agents: one renders the site and takes screenshots (an existing browser-automation service — a caller, not a build), one acts as a persona that receives pixels and nothing else and answers with spatial clicks. The screenshot boundary is the instrument, not a limitation: a persona that can read the source understands the page better than any human could. The page under test must be a fixed artefact authored before the run — a page generated during the run measures the model agreeing with itself — and the patience budget must be set exogenously, because patience generated by the same model that generates the confusion will always cohere with it. The honest limit: synthetic readers find defects and cannot report preferences, so they clear the levels and humans judge the variants. And the brief raises, for the third time, the rule against simulating named individuals — proposing the narrow, testable exception: an archetype composed from several people that none of them would recognise.",
  concepts=[
   ("The screenshot boundary", "../packs/map-your-case/synthetic-readers.html", "pixels and nothing else — no text, no structure, no purpose, and clicks named spatially rather than semantically"),
   ("The fixed-artefact requirement", "../packs/map-your-case/build-order.html", "a hand-written mockup satisfies it completely, which is what makes testing before building available"),
   ("The exogenous patience budget", "../packs/map-your-case/synthetic-readers.html", "screens, minutes and clicks fixed before the run — abandonment becomes a measured event rather than a narrative"),
   ("Portrait versus archetype", "../packs/map-your-case/principles.html", "if the person it came from, or a colleague of theirs, would recognise them in it, it is a portrait"),
  ],
  ideas=[
   "Synthetic readers find defects, not preferences — a page that does not answer its own question, a term used before definition, a dead end.",
   "The comprehension question is fixed wording every time: what would you do now, and what did that page tell you.",
   "A simulated acceptance must never be confusable with a real one — and export is exactly the moment a marker is lost.",
   "The part-two service is one question away from the banned tool: comprehension and confusion yes, what would this person approve, never.",
   "The runs worth publishing most are the abandoned ones, because those are the ones that changed the design.",
  ],
  pages="Became document 08 of the Map Your Case pack — the synthetic-reader programme — with the two simulation rules carried verbatim into the pack's principles."),
 dict(slug="registry-not-thinking-in-graphs",
  title="The Registry Is Not Thinking In Graphs: Trust Is A Confidence Computed From Independent Evidence, Not A Verdict",
  md="v0.33.63__strategy-brief__the-registry-is-not-thinking-in-graphs-trust-is-a-computed-confidence-not-a-verdict.md",
  version="v0.33.63", date="27 August 2026", dtype="Strategy brief",
  summary="The project lead's reframe after reading the book: the registry has been built as an ORACLE and should have been built as a NODE. Trust is not a verdict handed down by a body of truth — it is a confidence the consumer computes from the independent evidence they can reach, it is a spectrum, and it is specific to the use case, because the assurance needed to accept a message is not the assurance needed to accept a contract. The registry's job is to be one more place that stores evidence and clues. The brief shows that this family's corpus already published the philosophy, older than this site: a public key in isolation gives you nothing, the confidence ladder makes assurance computable from connectivity, independence beats count, and when confidence is low the remedy is more edges rather than more validation rules. Four contradictions with the shipped register, three of them computed — roots.json is a gate where the corpus specifies an anchor with no authority; the verifier returns a verdict where the evidence should be the product; rule 2 is contradicted by the earliest graph-native sentence in the corpus, which is itself about PKI; and graphs.sgit.ai is mentioned zero times on this site's front door, which is the mechanical cause of the drift.",
  concepts=[
   ("Meaning through connectivity", "https://graphs.sgit.ai/network/index.html#pki", "a key in isolation gives you nothing — it is the graph it connects to, and this site's book is named after it"),
   ("The four rules", "../rules/index.html", "rules 1 and 4 stand; rule 2 is qualified, and rule 3 stops being the load-bearing defence"),
   ("The registry, live", "../registry/index.html", "roots.json as a gate, and the verifier's basis array as the seed of the right design"),
   ("The attestation trade", "../rules/index.html#attestation", "the site's central open question, which independence weighting may dissolve"),
  ],
  ideas=[
   "The registry should not be trusted by default — it is one more place that stores evidence and clues, not a source of truth.",
   "Trust is a spectrum and it is context specific: what you need to accept a message is not what you need to accept a contract.",
   "Weight by independence, not by count — ten citations of one source are one source, and DNS checked independently of TLS is why corroboration counts.",
   "Revocation is the absence of trust, not the presence of a revocation entry; a revocation list can only tell you about the revocations it happens to know about.",
   "When confidence is low the remedy is more edges, never more validation rules — enrichment, not enforcement.",
   "Every path in this register terminates in the same published private key, so under independence weighting the whole register currently carries one origin.",
  ],
  pages="Proposes anchors.json in place of roots.json, a verifier that returns a rung, an evidence set and the gaps with the verdict left to the caller, a views/gaps.json, and closing ask N2 by linking graphs.sgit.ai from this site's front door."),

 dict(slug="registry-has-no-opinion",
  title="The Registry Has No Opinion: Seven Signed Primitives, A Fractal Of Registries, And The Context That Belongs To The Consumer",
  md="v0.33.64__arch-brief__the-registry-has-no-opinion-seven-signed-primitives-and-a-fractal-of-registries.md",
  version="v0.33.64 · draft-2", date="27 August 2026", dtype="Architecture brief — the refactor",
  summary="The refactor that follows v0.33.63's critique, revised to draft-2 once the project lead removed the backwards-compatibility constraint: nobody is using this site, its artefacts or its primitives, so everything can change. That licence made three of draft-1's proposals visibly worse than they needed to be — so seven statement types collapse to ONE ENVELOPE IN TWO GENRES (assertion and decision) with the primitives carried as predicates, roots.json is deleted rather than renamed, answer is removed rather than deprecated, and the fixture register is regenerated rather than migrated. The registry registers, and it does not have an opinion — structurally, not modestly, because an opinion needs context and the context lives with the consumer. The corpus supplies the mechanism: the grounding ladder's upward path says each step up is an interpretation somebody is accountable for, and a verdict is an upward step. What the registry supplies instead is signed nodes and edges whose worth to any consumer is a function of that consumer's trust in this registry, which is one of many in a fractal, on the shape of the root DNS servers with an eventually consistent SLA. Seven primitives in two layers that must not be blurred: three identities (agent, environment/provider, user) saying WHO; two evidence objects (fact, evidence) saying WHAT IS THE CASE; and two authority objects (grant, mandate) saying what is possible and what was decided. The biggest delta is environment identity: a grant becomes a signed fact about a keyed environment by a named measurer, which turns the book's floor-not-a-census caveat into a computable independence attribute — and makes the honest number visible, since both library entries state that the instrument IS the subject, so the library today holds zero independent measurements.",
  concepts=[
   ("The grounding ladder", "https://graphs.sgit.ai/depth/index.html#ladder", "fact grounds to evidence grounds to measure — and upward, each step is an interpretation somebody is accountable for"),
   ("Fractal, made falsifiable", "https://graphs.sgit.ai/depth/boundaries.html#fractal", "if zooming in needs a new format, a new validator or a special case, the claim is false — and roots.json is that special case"),
   ("The register, live", "../registry/index.html", "five statement types, all authority objects; fact and evidence are what change the register's genre"),
   ("Grant measurement", "../packs/grant-and-mandate/library.html", "two entries, unsigned, both measured from inside the thing they measure"),
   ("The strategy brief this refactors from", "registry-not-thinking-in-graphs.html", "v0.33.63, which established the oracle problem and left this question open"),
  ],
  ideas=[
   "The registry registers. It does not have an opinion, because an opinion needs context and the context is the consumer's.",
   "One envelope, two genres — assertion and decision — with the seven primitives as predicates rather than types, because seven types is the family-per-level the scale-invariance rule forbids.",
   "Acceptance and revocation were never types: an acceptance is a decision about a mandate, and the five statement types collapse to two genres without losing a distinction.",
   "The freedom to break everything and the absence of anybody to break it for are the same fact — which makes the refactor cheap and is also the strongest argument that it is not the bottleneck.",
   "A verdict is an upward step on the grounding ladder, and each step up is an interpretation somebody is accountable for — which the registry cannot discharge.",
   "PKI does not establish trust; it makes edges attributable, and attributable edges are the only thing independence weighting can operate on.",
   "A grant is not a new primitive — it is a fact whose subject is an environment, which is why the delta computes at all.",
   "Cache the evidence, never the conclusion: a cached confidence with no staleness model is a stored trust value wearing a fresh name.",
   "Attach, never mutate makes abundance a feature — you can accept a hundred evidence packs because accepting one costs nothing you cannot undo, which answers 2019 by arithmetic rather than by a size bound.",
   "Cryptography gives a lower bound on origin-counting and cannot prove two keys are two parties, so independence is asserted rather than proven — the weakest joint in the design.",
  ],
  pages="Proposes fact and evidence as statement types, identities for environments and providers, synthetic user identities carrying a declared synthetic flag, anchors.json in place of roots.json, and a verifier returning statements, a rung, an independence count and the gaps with verdict null."),

 dict(slug="the-doors-page",
  title="The Doors Page: A Computed State Map Of This Estate's Own Ladders, Where The Build Breaks When A Door Opens",
  md="v0.33.65__dev-brief__the-doors-page-a-computed-state-map-where-the-build-breaks-when-a-door-opens.md",
  version="v0.33.65", date="27 August 2026", dtype="Dev brief",
  summary="Ported from newsroom.sgit.ai's debrief on rendering an agentic team as a point-and-click room — but the room is NOT what was ported. That debrief says its second surface, the state map, turned out to be the more useful of the two, and this estate agrees for a reason specific to it: our problem is not that our state is badly presented, it is that almost nothing has passed its own gates. So: one generated page rendering this estate's four declared ladders as rungs with computed instance counts, each carrying a DOOR — the condition the next rung will not accept work without. Nine of twelve doors are shut. The declaration holds no counts; the generator computes every number from the repository; and a door whose computed state disagrees with the declaration FAILS THE BUILD IN EITHER DIRECTION, so the build breaks when the estate makes progress — a door opening is news, and news that does not interrupt anybody is news nobody reads.",
  concepts=[
   ("The doors, live", "../registry/doors.html", "nine of twelve shut, every count derived at build time"),
   ("The bootstrap gradient", "../bootstrap/index.html", "the ladder whose designed append lane nobody has ever walked"),
   ("The tier ladder", "../packs/grant-and-mandate/concepts.html", "boundary observed four times in other people's products, built here zero"),
   ("The register, live", "../registry/index.html", "eleven records and twenty-three statements, all terminating in one origin"),
  ],
  ideas=[
   "The load-bearing idea is the DOOR: not what a rung is, but the condition the next rung will not accept work without.",
   "A door opening breaks the build, exactly as a door closing does — the gate is symmetric by construction rather than by intention.",
   "Nine of twelve doors are shut; three could be opened by this project alone and six need somebody who is not this project, and the page computes that split rather than asserting it.",
   "The three that are ours are the more uncomfortable half, because nothing is stopping them.",
   "A gate that compares a drawing to a declaration cannot check the declaration: name the wrong ladders and everything agrees and everything is wrong.",
   "The room was declined, not deferred — a well-drawn room over a system where nothing has passed its own gates would make the estate look more finished, which is the one direction it must not move.",
  ],
  pages="Adds registry/doors.html, registry/doors.declared.json, registry/views/doors.json and admin/build/gen_doors.py, linked from the register, llms.txt and the sitemap."),

 dict(slug="the-chain-room",
  title="The Chain Room: The RiskMandate Workflow As A Playable Simulation — Simulate First, Then Support",
  md="v0.33.66__dev-brief__the-chain-room-the-riskmandate-workflow-as-a-playable-simulation.md",
  version="v0.33.66", date="27 August 2026", dtype="Dev brief",
  summary="The course-correction of v0.33.65, which ported the newsroom's state map and declined its room. The project lead's response: the refusal missed the key requirement — the point is to create the core elements for the RiskMandate.ai workflows, and for that the game-like environment is not decoration, it is the deliverable: the workflows and their states and actions are to be simulated first, then supported. So: one playable room at /room/, eight stations, the product boundary drawn on the floor, a work item that travels the chain, and every word derived at build time. The left half is real — the measured library entry, the signed mandate, the computed excess row. The right half is synthetic and marked on every surface, in the shape of RiskMandate's own positioning card: risk band, named acceptor, blast radius, expiry, reviewer, and accepted conditions each carrying an observed status. Five gates, including the GM3 rule enforced structurally on the demo itself: the instance fixture stores references, never copies, because a demo that violates the architecture it demonstrates teaches the violation.",
  concepts=[
   ("The chain room, live", "../experiments/the-room/index.html", "pick a verb, then a station — or run the walk"),
   ("The instance fixture", "../packs/grant-and-mandate/instance-fixture.synthetic.json", "synthetic, marked in the filename, references-only, a named acceptor and an interval"),
   ("The contract it walks", "../book/12-the-library-and-the-instance.html", "chapter 12: the library/instance split, as a floor a visitor crosses"),
   ("The doors it does not open", "../registry/doors.html", "nine of twelve still shut; the room makes one explainable to the person who might open it"),
  ],
  ideas=[
   "An accepted-risk card is not a certificate — it is a live join between a decision and a stream of measurements, which is why the workflow needs the registry at all.",
   "Every field on the positioning card resolves to a primitive this estate already holds: the acceptor and interval are the decision, the conditions are mandate constraints monitored by evidence.",
   "The delta desk has no drawers; the counter answers every question with documents; the acceptor's name appears only right of the line — game details that are rules, not decoration.",
   "The simulation is not a compromise on the way to the product: it is how the product's shape gets taught, tested and criticised before it exists.",
   "Phase 2 needs nothing from RiskMandate: this estate already logs enough to replay a real session against the conditions.",
  ],
  pages="Adds /room/, the synthetic instance fixture, and admin/build/gen_room.py with five gates; reverses v0.33.65's refusal of the room on a changed requirement, recorded rather than rewritten."),

 dict(slug="the-experiments-deck-table",
  title="The Experiments, The Deck, And The Table: Cards For Grants, Mandates, Facts, Evidence And Actions",
  md="v0.33.67__dev-brief__the-experiments-the-deck-and-the-table-cards-for-grants-mandates-facts-evidence-and-actions.md",
  version="v0.33.67", date="27 August 2026", dtype="Dev brief",
  summary="Three things. A CONVENTION: /experiments/, one folder per experiment, each with its own generator, gates and bench entry — the chain room moves in as first occupant, free because nothing is deployed. THE DECK: the five objects the project lead names — grants, mandates, facts, evidence, actions — each given a card form with a suit (CAN, MAY, IS, SHOWS, DOES, DECIDES), because the room gave desks to the processes and nothing to the objects; a card is a rendering of a signed statement, and the resolution order is the ordering rule as game mechanics. THE TABLE: the second experiment, where players including the systems replay the estate's own 26 August incident — push refused, mandate amended, push landing — forward as simulation and backward as audit, with the enforcement tool re-run at build time. And the twin question answered from the corpus: a grant document IS a twin, the experiments are twin theatres, and a simulation is running a proposed action against the twin instead of reality.",
  concepts=[
   ("The experiments hub", "../experiments/index.html", "one folder, one workflow, one visualisation — generated from a manifest"),
   ("The table, live", "../experiments/the-table/index.html", "six suits, four players, four turns, every resolution re-run"),
   ("The chain room", "../experiments/the-room/index.html", "the first occupant, moved in"),
   ("The grounding ladder", "https://graphs.sgit.ai/depth/index.html#ladder", "measure is taken on a twin, a twin is grounded in its connection to reality"),
  ],
  ideas=[
   "The room visualised the process; the deck visualises the objects; the table visualises the actions — and actions had no representation anywhere in the estate.",
   "A DOES card resolves against CAN, then MAY, and mints an IS backed by a SHOWS — the ordering rule as game mechanics.",
   "Blast radius is the CAN cards face-up on the table that no MAY card covers.",
   "Forward is the simulation, backward is the audit, and they are the same cards in the same order.",
   "The library entry is a twin; a simulation is running a proposed action against the twin instead of against reality — which is what makes it a rehearsal rather than a cartoon.",
   "A twin that is not re-measured is a stale delta with a nicer name.",
  ],
  pages="Declares /experiments/ and its five inherited rules, moves the room, and builds the table with its live resolution gate."),

 dict(slug="the-scenario-engine",
  title="The Scenario Engine: JSON-Driven Worlds, The Soft Mandate, And The Platform Library",
  md="v0.33.68__dev-brief__the-scenario-engine-json-driven-worlds-the-soft-mandate-and-the-platform-library.md",
  version="v0.33.68", date="29 August 2026", dtype="Dev brief",
  summary="The third memo, processed: everything JSON-driven, nothing hardcoded, because the destination is tonnes of scenarios and a game engine that becomes a product. One engine (admin/build/gen_scenario.py) renders any world from a scenario.json that references a measured twin — the engine holds no capabilities of its own, and the deck gate forces cards == twin nodes exactly. Two worlds prove the claim by existing: PUSH TO GITHUB, the memo's worked example — this session's own grant chain, user → GitHub App → scoped token → container → Claude Code → Claude → repo — with the soft mandate shown as a place: the thing that keeps this world off the wrong branch is prose in the agent's context, an expectation-tier constraint living exactly where the memo says mistakes occur, beside the hook it could be and the platform boundary it is not. THE DEPLOY, the counter-world: the CI runner with no agent, no hook, unrestricted egress — and the estate's only boundary-tier grant. Plus the confidence rung computed from evidence (hypothesis 0 → independent 3), eight capability micro-animations, and the platform library rules for future fact-based variation entries — where the rung is the libel guard.",
  concepts=[
   ("Push to GitHub, live", "../experiments/push-to-github/index.html", "the worked example — this session's own chain, the soft mandate in its three possible rooms"),
   ("The Deploy, live", "../experiments/the-deploy/index.html", "same engine, different JSON — the world without the guardrails"),
   ("The twin it references", "../packs/grant-and-mandate/library/claude-code-remote__ccr-container__2026-08-26.json", "measured from inside this session's own environment"),
   ("The doors view it must agree with", "../registry/doors.html", "the platform slot derives from enforcement_at_boundary, and the build fails on disagreement"),
  ],
  ideas=[
   "The engine holds no capabilities of its own: it may decorate a card, never add, remove or restate one — adding a world is adding a JSON file.",
   "The soft mandate is a place, not a strength: the same constraint is expectation-tier as prose in a context window, setting-tier as a hook, boundary-tier as platform config — and the slot it occupies decides what a mistake costs.",
   "A capability shown acting is legible where a permission string is not — which is why each animation kind depicts the act, and why depiction is declared to be all it is.",
   "The confidence rung is arithmetic over evidence origins, never typed: more independent places saying the same thing move a claim from hypothesis toward reality, and a rung above self-measurement is unreachable from inside.",
   "The platform library's rule for writing about other people's products: every entry is a dated, evidenced scenario.json, an incident is evidence, and the rung is the libel guard.",
   "The pair is the proof: one world rendered by an engine is a hardcoded page with extra steps; the second world is what makes nothing hardcoded falsifiable.",
  ],
  pages="Adds the engine, two scenario worlds, the shared scenario.css with eight micro-animations, and six gates; amends the experiments convention to allow a shared engine driven by per-world scenario.json."),

 dict(slug="the-control-room",
  title="The Control Room: A SCADA Board And A Game HUD Over The Scenario Worlds",
  md="v0.33.69__dev-brief__the-control-room-a-scada-board-and-game-hud-over-the-scenario-worlds.md",
  version="v0.33.69", date="29 August 2026", dtype="Dev brief",
  summary="The project lead's instruction, verbatim: create a new component and UX for that simulation — think game UI and SCADA control systems UIs. The answer: one board, both worlds, ZERO NEW DATA. The control room is a second renderer over the same scenario.json files the deck pages already use, which is the point — if it needed its own data file the scenario engine would be a page generator with a JSON config; because it does not, the scenario files are what v0.33.68 said they were: a world model, renderer-independent. Two genres borrowed, conventions only: from SCADA the annunciator panel, the mimic diagram, the faceplate, the sequence-of-events log, and the deepest convention of all — a sensor that cannot be read is a FAULT lamp, not a blank space. From games the HUD, the replay scrubber, and inspect-on-click. The mapping is exact: lamp colour is the tier and nothing else, which makes a capability with no control on it THE ALARM STATE — the CI runner's board lights red where the agent container's does not, and the memo's contrast becomes pre-verbal. The 26 August incident is the log, every verdict re-run through mandate.py at build; timestamps are derived or absent; the mode chip is pinned to REPLAY because a live board needs everything that is still stated design.",
  concepts=[
   ("The control room, live", "../experiments/the-control-room/index.html", "two units, nineteen tiles, four events — click a tile for its faceplate, play the incident"),
   ("The worlds it renders", "../experiments/push-to-github/index.html", "the same scenario.json, seen as a deck — nothing was added to make the board possible"),
   ("The incident it replays", "../experiments/the-table/index.html", "the table's four turns, now with transport controls"),
   ("The enforcement tool it re-runs", "../packs/grant-and-mandate/enforcement.html", "mandate.py check-branch, executed at build for every push event on the log"),
  ],
  ideas=[
   "Adding a world is adding a JSON file; adding a way of seeing is adding a renderer — and the data does not move.",
   "In SCADA colour grammar green is contained and red is alarm: mapped onto tiers, an unbounded capability is the alarm condition, and the contrast between the two units becomes visible from across the room.",
   "A sensor that cannot be read is a FAULT lamp, never a blank — industrial operators have always known what this estate keeps re-learning, that unknown is a state and it is displayed.",
   "The replay is baked, not computed: JavaScript animates, it never adjudicates — the browser only steps through verdicts the build already re-proved.",
   "Timestamps are derived or absent: the one signed, timestamped row on the log is the operator's DECIDES — which is the whole architecture in one line of a SOE log.",
   "REPLAY never becomes LIVE on this page: the mode chip is the honest inverse of the roadmap — a live board needs the write path, monitors and a mandate service, all still shut doors.",
  ],
  pages="Adds /experiments/the-control-room/ (generated board, control.css, control.js — transport only), admin/build/gen_control.py with seven gates, and the manifest entry."),

 dict(slug="the-simulator",
  title="The Simulator: Playable Cards Against A Twin — And The Ladder From REPLAY To LIVE",
  md="v0.33.70__dev-brief__the-simulator-playable-cards-against-a-twin-and-the-ladder-to-live.md",
  version="v0.33.70", date="29 August 2026", dtype="Dev brief",
  summary="Two instructions in one message. First, the control room's next step: its does-not-prove said REPLAY never becomes LIVE and named what LIVE would require — that prose is now a COMPUTED ladder of four doors (the append lane, a real issuer key, signed facts, an independent measurement) and the mode chip is derived from them rather than typed, with the doors page's symmetric gate in its sharpest form: when the last one opens, the build fails. Second, a card game: /simulator/, on its own base folder because it is a tool rather than an experiment — the first page here that answers to the visitor instead of replaying the estate's history. The load-bearing rule is that it does not predict, it COMPOSES: JavaScript cannot run mandate.py, so the entire resolution table is precomputed at build and shipped as resolutions.json with the tool's own output in each row; every outcome is a real verdict, a reading of the twin, or UNKNOWN, and there is no fourth. Eight cards in three suits, two worlds, play/step/rewind/reset — and the sharpest card in the deck, the pre-push hook, changes no verdict at all and everything about who refuses. It also retires a stated limit: v0.33.67 said proposed-action simulation was deliberately not built, and it is built here.",
  concepts=[
   ("The simulator, live", "../simulator/index.html", "play a card, watch the board, rewind"),
   ("The resolution table", "../simulator/resolutions.json", "every answer the browser can give, precomputed by the real tool"),
   ("The ladder to LIVE", "../experiments/the-control-room/index.html", "four doors, computed — and the chip that flips itself"),
   ("The doors it reads", "../registry/doors.html", "the state map the ladder is drawn from; nothing new is claimed here"),
  ],
  ideas=[
   "A simulator invites exactly one dishonesty — inventing consequences — and this one is built so that it cannot: the browser looks answers up and never adjudicates.",
   "UNKNOWN is not no. A simulator that turns a hole in the measurement into a denial manufactures comfort, which is worse than having no simulator.",
   "Installing the hook changes nothing about the answer and everything about whether you can rely on it — the whole argument of this estate, as one card.",
   "The simulator can ask questions history did not: pushing to main was never attempted here, and is refused under both mandates.",
   "Rewind is not an undo stack: board state is a pure function of the event prefix, so backwards is the same computation with a smaller n — forward is the simulation, backward is the audit.",
   "A does-not-prove retired by later work is recorded as retired, with the version that retired it, never quietly dropped.",
  ],
  pages="Adds /simulator/ as a new base folder (generated index, sim.css, sim.js, resolutions.json) with five gates; makes the control room's mode chip computed and adds the LIVE ladder with a gate that fails the build when the last door opens."),

 dict(slug="agent-insurance",
  title="Insurance For Agents: The Policy Replaces The Acceptance At The Foundation, And The Delta Is Where The Insurance Lives",
  md="v0.33.71__strategy-brief__insurance-for-agents-the-delta-is-where-the-insurance-lives.md",
  version="v0.33.71", date="30 August 2026", dtype="Strategy brief — a pivot briefing",
  summary="A pivot in the risk approach, recorded before anything is built on it: the foundation of the RiskMandate pyramid moves from risk acceptance to the insurance policy, on the argument that the delta between grant and mandate is where the insurance lives. The brief carries the voice memo verbatim, then reads it against the corpus: the register already publishes \"acceptor\": null on every measured delta, and the pivot names who sits in the empty seat — the insurer, an acceptor of last resort who accepts for money what no owner accepted. Two insurances are separated (harm inside the mandate is ordinary liability; harm from the delta is the agent-specific exposure nobody carries, and the memo's subject); the payout logic is identified as parametric insurance described without the word — the right first shape, because every trigger it would name is already computable from published evidence packs while loss data does not exist anywhere; and the memo's agentic insurance maturity model is read directly off the estate's existing rating variables: identity class, enforcement tier, twin freshness, delta size. The one primitive the estate lacks is the one insurance cannot do without: the loss event. Proposed into change control as GM-D35/36/37; four questions go back to the project lead, including who the insured actually is.",
  concepts=[
   ("The empty seat", "../registry/index.html", "the excess-authority view's acceptor:null — the field a policy fills"),
   ("The delta", "../packs/grant-and-mandate/concepts.html", "grant − mandate: the insurable interest of Cover B"),
   ("The evidence pack", "../workbench/index.html", "underwriting evidence ex ante, proof of loss ex post — one schema, both jobs"),
   ("The maturity model", "../admin/comms.html", "bands 0–3 read off existing tiers; N11, N12 and GM-D16 become premium reductions"),
  ],
  ideas=[
   "A premium cannot be theatre: an acceptance can be a signature over an exposure nobody measured, but someone loses money if a priced measurement is wrong — the pivot upgrades the audience for the estate's evidence from the owner who ought to read it to an underwriter paid to disbelieve it.",
   "When grant equals mandate, Cover B's premium goes to zero — the delta is the rating variable, so narrowing a grant becomes a visible discount and least privilege becomes financially legible.",
   "For rented agents the two-populations thesis meets its commercial completion: where control is unavailable, transfer is what remains — hand over a credential and hope, with the hope priced.",
   "A parametric agent policy is, mechanically, a rule evaluated over evidence packs: the trigger data is strong and the loss data does not exist, which is exactly the trade parametric insurance was invented for.",
   "Insurance answers an open decision by accident: policies renew on a date, so twins must re-measure on a date — GM-D16 gains the forcing function it lacked.",
   "Whoever's schema records the loss events owns the eventual actuarial table — the strategic case for loss-event/v0 stated plainly.",
  ],
  pages="Recorded as proposed in Grant & Mandate change control (GM-D35 the policy as acceptor of last resort, GM-D36 the policy/v0 and loss-event/v0 schemas, GM-D37 parametric as the first demonstrable shape); comms rows T34 and N16. No published surface is rebuilt on the pivot until it is adopted."),

 dict(slug="insurance-without-money",
  title="Insurance Without Money First: The Rating Is The Product, And Micro-Policies Scale Where Entity Cover Never Did",
  md="v0.33.72__strategy-brief__insurance-without-money-first-the-rating-is-the-product-and-micro-policies-scale.md",
  version="v0.33.72", date="30 August 2026", dtype="Strategy brief — memo 1 of 8 on the insurance pivot",
  summary="The memo that makes the pivot buildable. It separates insurance from money and keeps the half that matters: a policy is first a decision-making mechanism and a way to assign a rating to an environment, expressed in points, tokens or levels inside an internal marketplace before any currency is attached. That dissolves the blocker v0.33.71 called fatal — a rating engine emitting levels rather than money transfers no risk, promises no payout, is therefore not a regulated activity, and needs no carrier, no capital and no loss history. It also CONTRADICTS the earlier brief's central argument, which said a premium cannot be theatre because someone loses money if the measurement is wrong; the contradiction is named rather than smoothed, and answered with the rule the folder now runs on: a level nobody can recompute is exactly the theatre a premium would have prevented, so every rating ships its derivation. Plus: micro-policies as the scale insurance never reached (the barrier was cost per unit, and for an agent placement that cost approaches zero); the placement variables named concretely enough to test — desktop under a user identity, asset accretion, network egress; the questionnaire identified as a declared-fact collector that must never merge with measured facts; and the aggregation trap the memo does not name, since micro risks do not add and correlation is readable off shared graph nodes.",
  concepts=[
   ("The insurance folder", "../insurance/index.html", "the body of work: the memos, the doctrine derived from them, the MVPs"),
   ("The rating", "../insurance/the-rating.html", "what is scored, from what evidence, and what must never merge"),
   ("The pivot briefing", "agent-insurance.html", "memo 0 — the position this memo materially changes"),
   ("The measured grant", "../packs/grant-and-mandate/library.html", "the twin: the measured channel the rating reads"),
  ],
  ideas=[
   "A rating engine that emits levels rather than money transfers no risk and promises no payout — so it is not insurance in the regulated sense, which is exactly why it can be built this week rather than in three years.",
   "A relative ordering is easier than an absolute price and is most of the value: an operator does not need to know the exposure is worth £40,000, they need to know this placement is three levels worse than that one and which change moves it.",
   "A level nobody can recompute is exactly the theatre a premium would have prevented — the rule that replaces money as the discipline, and the reason every rating ships its derivation.",
   "Insurance never scaled below the entity because assessing each unit required a human; an agent placement's inputs are already machine-readable, so the marginal cost of rating one more approaches zero. That, not insurability, is what makes the micro reachable.",
   "The wellness questionnaire is a declared-fact collector, and this estate already refuses to average declarations with measurements: library minus self-report equals blind spots.",
   "Micro risks do not add. Five hundred placements summed will be wrong in the dangerous direction, because correlation is shared structure — and shared structure is a shared node the graph already knows about.",
   "The ratable unit is a placement, not an agent: the same model is a different risk on a desktop and in a browser, which is what the memo's own examples actually say.",
  ],
  pages="Creates /insurance/ as a new base folder — manifest, hub, two doctrine documents, and a generator whose gates are symmetric in both directions plus one that refuses a doctrine document with no does-not-prove section. Proposes GM-D38 to GM-D41."),

 dict(slug="insurance-ecosystem",
  title="The Ecosystem Without The Money: Insurance As A Go-Live Gate, And The Roles Are The Integrity Mechanism",
  md="v0.33.73__strategy-brief__the-ecosystem-without-the-money-insurance-as-a-go-live-gate.md",
  version="v0.33.73", date="30 August 2026", dtype="Strategy brief — memo 2 of 8 on the insurance pivot",
  summary="The structure memo 1's rating had no home in. The memo asks how an insurer-like ecosystem runs inside a company with no financial numbers, and answers by taking the industry's ROLES rather than its money — insurer, underwriter, the party carrying the capital — because the roles are what separate the party who wants to ship from the party who rates. That completes the rule from memo 1: a level nobody can recompute is theatre, AND a level computed by the party that wants to ship is theatre even when recomputable. Method and separation, both. The memo's most consequential move is putting the rating in the path of a deployment — do we go live, what would this have to reach, reduce the risk by this quantity — which makes it a GATE rather than a report, and drags in a requirement a report does not have: the derivation must decompose, or the instruction to reduce by a quantity cannot be given. The estate's own three-tier control test then applies to the insurance apparatus itself, unflatteringly: a gate on a dashboard is an expectation, a CI check the deploying team can edit is a setting, and only a check evaluated by a party they do not control is a boundary — so the roles and the tier turn out to be the same question asked twice. Also: reinsurance named as the fractal's three-century precedent, which supplies the rollup's shape but not the correlation arithmetic; and the control-to-premium loop, which the workbench already computes and which is scale-free, partly retracting the claim that the first MVP waits on the level scale.",
  concepts=[
   ("The ecosystem and the gate", "../insurance/the-ecosystem-and-the-gate.html", "doctrine 02: who rates, what it gates, and the gate's own tier"),
   ("The three-tier control test", "../packs/grant-and-mandate/concepts.html", "the estate's own test, turned on the insurance apparatus"),
   ("The control-to-premium loop", "../workbench/index.html", "flip a fact, watch the tier move — the loop, already running"),
   ("Rating before money", "insurance-without-money.html", "memo 1, whose rule this memo completes"),
  ],
  ideas=[
   "An assessment produced by the party that wants the answer to be yes is not an assessment — which is why an insurer is a third party for structural reasons, and why moving the ecosystem inside a company means the separation has to be manufactured rather than inherited.",
   "Stage 1 is a captive insurer with the capital removed, which is exactly why it is unregulated — and names what stage 2 would become.",
   "Reduce the risk by this quantity is unsayable unless the rating decomposes: the derivation is not only an audit artefact, it is the actionable half of the gate.",
   "The roles and the enforcement tier are the same question asked twice — an underwriter who IS the deploying team produces a setting no matter how good the arithmetic.",
   "The payout is the part that carries the moral hazard, so a rating that pays nothing cannot be used to stop caring. That is a better reason to defer the money than the regulatory one.",
   "Reinsurance supplies the rollup's shape and none of its correlation: the connection between placements is the graph, not the org chart.",
   "The control-to-premium counterfactual is scale-free — this control buys more than that one, here — so it needs no agreed range and does not wait on the level scale.",
   "The rating prices one side of a two-sided question and says so: what risk you are buying, not whether it is worth it.",
  ],
  pages="Adds insurance doctrine 02; proposes GM-D42 (the rating is a gate and declares its own tier), GM-D43 (the rater is separated from the deployer) and GM-D44 (the derivation decomposes); narrows GM-D41; comms T36 and N18."),

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
