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
