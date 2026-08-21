# 06 — Change Control

**pack** Registry MVP · draft-1 · 20 August 2026
**role** What has changed since draft-1 shipped, why, and on whose authority. Sources stay verbatim (supersede, never rewrite); this page is where the corrections live until draft-2 folds them in.

---

## The rule this page implements

The corpus's own: **a published document is not silently edited.** Draft-1 (documents 00–04) shipped at site v0.1.4 on the morning of 20 August. The same day, three project-lead briefs (v0.33.61) landed that correct and extend it. The sources stay as published; every correction is recorded here with its source and its status; draft-2, when the project lead adopts one, folds them in and this page becomes its change log.

## Corrections from v0.33.61, in order of what they change

### C1 — "Grant" is redefined, and the pack's schema must follow

**Source:** `v0.33.61__strategy-brief__grant-is-not-mandate…`
**Draft-1 said:** a grant is one concrete capability instance issued *under* a mandate (policy → instance).
**The corpus now says:** a **grant is what a credential technically permits** — a fact about access, whether or not anybody wrote it down — and a **mandate is what the holder is authorised and expected to do**. The gap between them is **excess authority**: blast radius measured from the other end, unaccepted by construction, defaulting to critical.
**Consequence for the registry:** recording grants stops being book-keeping and becomes the product. A registry holding identities, mandates *and* grants can compute the row that matters: *this agent's grant covers forty-one repositories; its mandate covered one; the difference has no acceptor and is six weeks old.* Draft-1's issued-instance object survives as the *record of a grant being conferred* — but the definition, and the schema field names, move to the corpus's.
**Status:** adopted for draft-2. The five mandate fields (issuer, subject, scope, **interval**, revocation path) are confirmed against draft-1's schema — present, with the interval rule now stated in the corpus's words: *a mandate with no interval is a grant wearing a mandate's name.*

### C2 — The registry was designed on 5 June; this pack operationalises, it does not design

**Source:** `v0.33.61__arch-brief__register-was-designed-in-june…`, locating `v0.32.4__dev-brief__sg-send-pki-public-key-registry-on-vaults.md`.
**Draft-1 said:** first-pass design, from the four rules and the shipped surface.
**The corpus record:** the June design already settles clues-not-storage, entries as nodes with relationships as the value, two-level trust (downward asserted by the truster, upward self-declared and granting nothing), the register as a vault holding no private data, connectors to any identity provider, and resolution as the caller's job.
**Consequence:** the pack inherits rather than re-derives. Two June positions materially improve draft-1: **explicit distrust is a valid signal**, and **a partial resolution is a legitimate output** ("I followed the chain this far and stopped"). Draft-1's verification walk should return partial results rather than binary ones.
**Status:** adopted for draft-2; the pack's framing corrected from "first pass at a design" to "first pass at operationalising the June design".

### C3 — Fixtures are a class, not a phase-0 convenience

**Source:** the register brief.
**Draft-1 said:** phase 0 ships "hand-made records" as fixtures.
**The correction:** a keypair whose private half is published is **not a weak identity — it is no identity, permanently**: its signatures prove nothing, its lane is a public inbox, it can never be promoted, and it cannot be retired through revocation (anybody can sign the revocation, and anybody can sign the reversal). So fixtures are a bounded class with structural rules: **`private_key_published` is a required field with no default and it is read *before* any signature**; fixtures are never reachable from the real trust graph; retirement means republishing under a fresh key. The fixture programme is also the **conformance test of the four published rules** — it satisfies two (ownership-by-vacancy, size bounds) and voids two (revocation, signature-substance), and knowing which is the finding.
**Status:** adopted for draft-2; phase 0 upgraded from "fixtures exist" to "the fixture class, named and bounded, before any key is generated".

### C4 — The persona format exists: agent cards, signed by a workflow identity

**Source:** the register brief.
**Draft-1 said:** nothing about persona formats.
**The correction:** publish personas as **A2A agent cards** (well-known path, JWS-signed since v1.0, and the spec itself says a card should not carry credentials) — with the fixture keypair as a *deliberately non-conforming, clearly marked companion object*. The signing notary is a **workflow identity with keyless signing** (short-lived certificate, transparency log): the notary must be an agent you run — the two-populations thesis arriving as an implementation constraint. Two operational facts travel with this: platform secret scanning **will block** a pushed private key, and the recorded bypass is *part of the demonstration*; publishing the same key inside vault ciphertext **evades that control and must not be done**.
**Status:** adopted for draft-2, phases 0–2.

### C5 — Confirmed, and upgraded from "the pack's call" to "corpus-aligned"

**Source:** the register brief, independently.
Draft-1's most-argued decision — **a mandate lives in the issuer's record; the subject appends an acceptance** — is the same rule the register brief states as *evidence is appended by the asserter to its own record, never the subject's*, derived from the same 2019 failure. Two documents, two directions, one rule. **No change; confidence upgraded.**

### C6 — The site access report: findings the pack's read path must carry

**Source:** `v0.33.61__cross-team-brief__site-access-report…`
Three items land in this pack rather than in site chores: the **path convention should be promised, not merely true** — `registry/llms.txt` must state that every artefact is fetchable by constructed URL, because agents already rely on it; the **cross-site composition gap** means phase 1's pages link *page-to-page* to the shipped documentation (`/docs/pki`, `/docs/vault-messaging`, `/docs/limitations`), never to a domain; and the report confirms **four rules with no entries are four assertions** — the fixture programme is what tests them, which is C3 from a second direction.
**Status:** adopted; the first two are also applied to this site directly at v0.1.5.

### C7 — The record model changes: growth moves to the commit graph

**Source:** `v0.33.61__arch-brief__history-is-the-append-only-log…`
**Draft-1 said:** a record is a numbered sequence of immutable signed statement files, hash-chained by `seq`/`prev`, read to the end for current state (documents 01 and 02, diagram D3).
**The correction:** that design carries its own growth, which puts the pack's own rules 2 and 3 into tension exactly as the site's do. **The entry should be a *file inside a commit graph*, not a record that accumulates.** The file carries current state and no history array; the versioning substrate already holds every prior state, content-addressed.
**Consequence:** materially simpler. `seq`/`prev` become the commit graph's job rather than the envelope's; the size bound applies to the entry file and is trivially satisfiable; and "read to the end" becomes "read one object". The verification walk (D5) shortens, and the `acceptance` mechanism gets a second justification — **third-party assertions arrive through a lane that sits outside the commit graph by design**, so rule 1 holds as topology rather than as a check the processor performs.
**Status:** adopted for draft-2. This is the largest single change to the architecture and it removes code rather than adding it.

### C8 — Two corrections about what "append-only" guarantees

**Source:** the same brief.
**Draft-1 implied** that resting on a versioned substrate gives immutable history. **It does not.** Blobs, trees and commits are content-addressed and immutable; **branch references are mutable, and moving one is a shipped command.** So append-only history is a policy about a single pointer.
**Consequence:** the pack must adopt the published-head discipline — the registry publishes its head, signed and dated, on a stated cadence, so a rewrite is falsifiable by any reader who kept the previous one. The site publishes this as a [proposed fifth rule](../../rules/index.html#reference).
**Second correction:** the pack's headline query — *what did this identity look like on this date* — **has no command behind it.** There is no path-scoped log and no blame in the command surface. Content addressing makes it cheap (an unchanged path carries the same tree hash, so the walk is a comparison per commit rather than a diff), but it is unwritten code, and it is the register's product.
**Status:** adopted. The traversal moves into the build order as a named deliverable rather than an assumed capability.

### C9 — Verification is two products, and metering costs the privacy claim

**Source:** `v0.33.61__arch-brief__every-trust-edge-is-a-two-way-conversation…`
**Draft-1 did not address** how a verifier checks a vouching edge beyond "follow references".
**The correction:** a signed assertion verified once and a live lookup checked every time are **two products with opposite properties**, not two settings — offline versus always-current, staleness versus an availability dependency. And only the live one can be metered, because charging per check requires observing every check. What a live notary accumulates is **a relationship graph neither party handed over**, which contradicts the estate's positioning more sharply than any content service could, and cannot be held encrypted.
**Consequence for the MVP:** it takes the published form. A notary that publishes signed dated answers to a location the verifier fetches **cannot meter and cannot surveil, and those are one property**. Two additions to the schemas: *unreachable* becomes a fourth state distinct from confirmed, denied and unknown; and a resolution result records **what it declined to verify and why**, distinguishing unreachable from too-expensive.
**Status:** adopted for draft-2. The commercial choice between issuance and lookup is the project lead's, and the pack does not make it.

### C10 — The interface primitive is a badge on every edge

**Source:** `v0.33.61__dev-brief__register-ui-every-edge-carries-a-verification-badge…`
**Draft-1 had no interface layer** beyond the workflows.
**The addition:** every line in a register is a claim by somebody about somebody, so the primitive is a badge carried by every edge — claim, verifiable-by, method, cost, last-checked, result — with **five result states**, because denied, unreachable and never-checked are three different situations. **"Nobody" is a legitimate and informative value for verifiable-by.** A policy then becomes a saved query that must return no rows, and the badge on the constrained edge decides whether that policy is enforcement or instrumentation.
**And a tested result the pack should carry:** inside a running rented session, the surface is named precisely by environment variables, **no attestation device of any kind is present, and nothing is signed**. The surface is knowable to the agent and unprovable to anybody else. Handing the session a secret makes it worse — a secret proves possession, not location. The vendor *does* record the surface but cannot tell a third party in checkable form, so **the gap is distribution rather than knowledge**, which makes it a product decision rather than a hardware problem.
**Status:** adopted as the pack's phase 6. The badge vocabulary is written before any page exists.

## Additions from the pack itself, 20 August 2026

The entries above record what the *corpus* corrects. These record what the pack's own later documents change, which is a different thing and belongs on the same page for the same reason.

### C11 — Three documents added after draft-1: the screens, the maps, and the deliverables

**Source:** documents 08, 09 and 10 of this pack, site-agent authored at the project lead's request (site v0.1.10 and v0.1.12).
**What they add:** the register interface written out as intended output (08), the pack's argument as six Wardley maps in mermaid's `wardley-beta` (09), and the whole pack restated as six users, twenty-four stories, fourteen features and six workflows (10).
**What they change in draft-1:** nothing above any published line. Each of documents 00–05 and 07 now carries a dated *added after publication* block pointing at the later material that bears on it — additive, never a rewrite, which is the rule this page implements.
**Status:** adopted as pack material. Documents 08 and 09 are drawings of decisions already taken; document 10 is a reading of them, and where it appears to decide something it is reading documents 00–09.

### C12 — Two findings the deliverables document surfaced, neither of them design corrections

**Source:** document 10.
**The first, against document 04.** The build order's four phases were written before the policy layer existed as a concept, so **WF-6 — running a policy — has no acceptance test.** It is specified in 08 and mapped in W5 and has no definition of done. Either phase 3 grows a fifth acceptance test, or the policy layer is honestly declared out of the MVP. This is not a defect in 04; it is a phase list that a later document overtook.
**The second, between two stories.** *P2 — the processor logs every decision publicly* and *A3 — the acknowledgement tells the agent nothing* are in direct conflict for **declined** submissions: a public decision log is precisely the oracle the blind ack exists to withhold. Delay or aggregation are the plausible resolutions. Today the blind ack wins by default, **which is a decision nobody actually made** — the reason it is recorded here rather than resolved in the document that found it.
**Status:** both open, both added to the register below as decisions 14 and 15.

### C13 — Observability, and the question the site kept asking without answering

**Source:** `v0.33.61__arch-brief__observability-is-the-usage-graph…`, and document 11 of this pack.
**The question, raised in four places on this estate and answered in none:** a mandate says what an agent may be *authorised* to do, not what it does — so **how does anybody know who is using it?**
**The answer, and it refuses the question as asked.** You cannot know. What is capturable is **verification, not use**, and the two come apart in both directions: a mandate used by a party that does not bother verifying generates **nothing**, while a resolver walking past one generates an event with no usage behind it. So the graph is a verification graph, and the error runs in the worst direction — the party that never verifies is the party whose relying process is weakest, and it is the one this layer cannot see.
**What makes it worth building anyway:** the primary output is the **missing** edges. *Which parties hold a mandate I issued and have never once checked it?* The issuer holds both halves — who it issued to, and who wrote to its lane — so the join is computable, small, and every row is a relying party accepting a mandate on faith.
**And it makes something already published either true or empty.** C1's position was that declared mandates are instrumentation rather than enforcement, and worth building because they produce the evidence that says where enforcement earns its cost. **Without check events they produce no evidence at all.** Observability is not an adjunct to the mandate layer; it is the half that makes the pack's own description of that layer honest.
**Status:** adopted. Document 11 written. **The pack's four "does not observe behaviour" statements stay exactly as they are** — this layer measures around the edge of that hole rather than filling it, and softening them would be the overclaim this site exists to argue against.

### C14 — Where the check log lives, which resolves C9 rather than contradicting it

**Source:** the same brief.
**The tension the pack was carrying.** C9 warned that a live notary accumulates a map of who is evaluating whether to trust whom, that neither party handed it over, and that holding that graph in plaintext is the sharpest available contradiction of the estate's positioning. Observability proposes building that dataset **as a security feature**. Both are right; the difference is entirely **who accumulates it**.
**The resolution, and it is the pack's own rule rather than a new preference.** Evidence is appended by the asserter to its own record — rule 1, taken from the 2019 keyserver failure. So **the checker writes the check event into the issuer's own lane**, never into a central log at the registry. The issuer learns who checked the mandates *it* issued. No party learns who checked everybody's, because no such record exists anywhere.
**The cost, chosen rather than discovered:** the aggregate is foreclosed. The operator cannot see, sell or reason over the whole graph — which removes precisely the asset C9 named as more valuable than the answers being sold. **The design that protects the positioning is the design that destroys the dataset.**
**Two consequences the pack inherits.** The shipped append lane is the mechanism, and its **thousand-pending-files-per-token** limit makes **draining an obligation that fails silently** — an issuer who stops draining stops receiving evidence without being told, so the drain needs monitoring more than the lane does. And **one property the layer depends on is absent from the parent's API reference**: whether a lane with no anchors configured accepts any token holder, or refuses everything. That decides whether unknown relying parties — the ones you most want to observe — can report at all. On comms as a documentation gap, not as a pack decision.
**Status:** adopted for the MVP. Decisions 16–19 below.

### C15 — Effective revocation latency, and the phase this forces

**Source:** the same brief.
**The observation.** In this design there is no push: a revocation sits in the register until a relying party looks, so it propagates at exactly the rate parties check. Usually stated as a weakness — it is also a **measurement**. A relying party's **effective revocation latency is the interval between its checks**, computable per party and per mandate **before anything has ever been revoked**. Conventional key infrastructure cannot do this because the consumers of a revocation list are invisible to the issuer; here they wrote to the issuer's lane.
**And it yields one of the very few decidable mandate clauses:** *verify this mandate at least once every twenty-four hours.* A party in breach is visible in the issuer's own lane without any cooperation from that party.
**The honest limit, stated in the same breath:** for a party that never checks, the latency is infinite and invisible, so the published distribution describes the participants rather than the population.
**The consequence for the build order.** Observability cannot be a later phase, because the justification for building declared mandates *is* the evidence it produces. **It belongs in phase 3, with mandates**, and phase 3's acceptance test grows a fifth case: an issuer names a holder that has never checked. Document 04 is amended by this entry rather than edited.
**Status:** adopted; decision 20.

### C16 — A grant is a tree, and the label on each node is the load-bearing part

**Source:** `v0.33.61__arch-brief__end-to-end-flow-is-the-august-worked-example…`, and document 12.
**Draft-1 and C1 treated a grant as a flat capability instance**, and screen M4 renders excess authority as a count: *41 repositories against 1*.
**The correction:** a grant is a **tree of subgrants**, and the interesting relationships are containment ones — running as your user contains reading your files, which contains reading your credential files, which contains reaching every service those credentials open. **Blast radius is a path through the tree, not an item in a list.** Enumerating the tree is the easy half; the half that decides whether any of it is worth reading is the **label on each node**: what is reachable, what stands in the way, **who enforces it**, the evidence class, and a date **per node rather than per tree**.
**And the general test that makes those labels writable** without any vendor-specific claim, which matters because vendor security assertions age in weeks: *a control bounds a grant only when it is enforced by something the grant does not include.* Three tiers — **boundary** (outside the grant: OS, separate account, container, network policy), **setting** (the tool itself, running inside the grant), **expectation** (nothing; it is written in a prompt). **Most of what people currently rely on is a setting that reads like a boundary**, and a permission prompt disableable by a flag the agent can write is an expectation wearing a setting's clothes.
**Status:** adopted. Document 12 written. Schema additions queued for draft-2: a parent reference, and the five-field node label with `enforced_by ∈ {boundary, setting, expectation}`.

### C17 — The shortfall, and the metric that inverts

**Source:** the same brief.
**The addition C1 was missing.** `grant − mandate` is excess authority. The other direction is the **shortfall** — `mandate − grant`, where the holder was authorised to do something its credential cannot do. It hurts operations rather than security, and the failure looks like a bug. **It is the harder of the two to detect**, because excess needs the grant enumerated and the shortfall needs the *mandate* enumerated against real capability names — which the pack cannot do, since its `capability` field draws on a vocabulary that does not exist. Named as a region; unimplementable until decision 6 lands.
**The metric correction, which the pack had not stated and would have adopted.** *How many risks get accepted* is maximised by making risks easy to accept: shorter statements, softer wording, one button. **A product optimised on it converges on blanket acceptance by people who did not read — worse than no register at all, because it manufactures evidence that somebody considered it.** The corpus already separated *accepted* from *acceptable*. So the primary measure is **risks stated well enough to be accepted** — able to carry a named acceptor and an interval — with acceptances secondary, **declines and escalations counted beside them** (a hundred percent acceptance means the risks are trivial or the process is theatre), and **risks that could not be stated** as the most informative number in the set.
**And one presentation finding that does not conflict with C12.** C12 established that a mandate written as prohibitions widens silently, so the **stored** form must be an allow-list. That is about storage. Presentation is a different layer: prohibitions are far more legible, and are what a person can actually accept or refuse. **Generate one from the other** — the person accepts the prohibitions, the system enforces the allow-list — and **date the rendering**, because it goes stale the moment the capability set grows. A deny-list is unsafe as a stored rule and safe as a generated view.
**Status:** adopted; decisions 21–23.

### C18 — A secret is defined by expectation, and it has to be recorded at issue

**Source:** `v0.33.61__arch-brief__a-secret-is-defined-by-expectation-a-signature-by-scarcity…`, and document 13.
**The principle, promoted to a house rule:** *a secret is defined by expectation, not by content* — the same bytes are a disclosure or a publication depending on whether somebody believed they were private. It explains the estate's existing rules in one line (read keys published, write keys never; plaintext beside ciphertext only where the key is already published) and it tells a reader which question to ask: not *is this key material*, which sorts by class, but **did anybody expect this to be private**, which sorts by intention.
**The operational half, and it is the one that will be dropped:** *expectation has to be recorded at issue, not recalled afterwards.* A key published deliberately in March and a key leaked in March are indistinguishable in June unless somebody wrote down which was which at the time. **This strengthens C3's required flag and proposes a second field for draft-2 — publication intent, stated at issue** — because *published* and *published on purpose* are different facts and only one of them is currently recorded.
**One manoeuvre corrected in passing, because the pack will reach for it.** Destroying a vault server-side leaves its key unable to write, and **does not make the content unreadable**: custody without access means mirrors exist that nobody can enumerate, so publishing the key of a destroyed vault publishes its contents permanently, to everybody. *Destroying the vault makes the key safe to publish from the point of view of your server, and says nothing about the content.* Both halves must be true, and only the first is under your control. For the registry's own records the second is satisfied by construction; for fixtures and anything staged privately it is the one to check.
**Status:** adopted.

### C19 — A signature is defined by scarcity, so per-object keypairs are declined — and that is what preserves C3

**Source:** the same brief.
**The proposal:** give every grant, mandate, claim and evidence node a keypair, **with the private half published**, on the grounds that this supplies integrity even without confidentiality.
**Declined, and the reason is one sentence.** A signature's entire value comes from **the scarcity of the private half**. Verification answers exactly one question — *was this produced by somebody holding the key?* — and if the key is published the answer is *yes* for everybody, so the question stops carrying information. Publishing it leaves **a hash wearing a signature's clothes**, which is worse than a hash: a hash makes no promise and is honest; a signature anybody can forge makes a promise it cannot keep, **to a verifier that succeeds and concludes something false**. The proposal's own stated use — sealing or signing *to* a specific object — requires exactly the scarcity it removes.
**The one genuine benefit, answered more cheaply.** A public key is an **address**, and the lane is addressed by the hash of one. But that derivation is **proposed rather than shipped** (the dependency flag document 03 already carries), and document 11 solved the same problem without keys: route to the **issuer's** lane, tagged with the object's identifier. One lane per party rather than one per document, on the shipped surface today.
**And the argument that should decide it for this pack.** C3 made `private_key_published` a required field and called it the single most consequential piece of evidence an entry can carry, because it lets the register answer in one query which of its entries are decorative. **Under publish-by-default every row is true, the query returns everything, and the field distinguishes nothing. A flag that is always true is a column, not evidence.** So declining the proposal is not conservatism — **it is what preserves C3.**
**The rule adopted instead**, which the proposal itself described near its end: **a key belongs to whatever can keep a secret, and everything else is signed by something that can.** People, projects and agent instances get keypairs; grants, mandates, claims and evidence get an identifier, a content hash and an issuer signature. **This confirms C16's artefacts-not-principals position by a second, independent route** — and the same proposal has now been raised twice, which says the first statement of the reason did not stick.
**One caveat that is not small:** whether a rented agent instance can hold a private half across sessions is open, and it decides whether the agent-instance row is achievable or aspirational.
**Status:** adopted; decisions 24–26. **C3 reinforced, not amended.**

### C20 — The first thing in this pack that is built, and the rule that shaped it

**Source:** `v0.33.61__dev-brief__user-section-is-a-conformance-test…`, and document 14.
**What shipped:** an assessment workflow at `/assess`, where a visitor assembles their own agent installations as grant trees (C16) and mandates (C17), sees the gap, and records a decision per gap with an acceptor and an interval. It is the first thing in this pack that exists rather than being specified — and it exercises C16, C17 and C12 against a real interface rather than a mockup.
**The rule that shaped every decision in it:** a completed assessment describes which agents somebody runs, holding which credentials, with which containment — and assembled, dated and ranked, **that is a serviceable plan for attacking them, which the site asked them to write down.** So: **store the choices, never the answers.** What is kept is identifiers from a public library plus fixed options and derived dates. The implementation takes the strictest available reading — **there is no free-text input anywhere on the page** — which turns *we do not store what you type* into *there is nothing to type*.
**One consequence the pack should own rather than hide:** the pack's own standard is a **named** acceptor, and a name is a fact about the visitor's organisation. The page offers a **role** instead, so **it cannot meet the pack's own standard** — a real reduction in fidelity, taken deliberately and recorded here rather than in a footnote.
**And browser storage is not a placeholder.** It makes the no-collection claim **architectural rather than operational** — a property, not a promise — and checkable in ten seconds in the network panel. The assessment is a conformance test for the site's own claim, in the same way the static deployment was a conformance test for the server reading nothing. Migrating to a vault later changes **durability**, not privacy, and swaps silent loss that costs little for a key with no reset — so browser storage stays the default and the vault is offered rather than defaulted.
**Status:** shipped at site v0.1.16. Decisions 29–31.

### C21 — A strong threat with a weak answer produces denial, which decides how every result page ends

**Source:** the same brief.
**The finding, measured rather than intuited.** The standing meta-analysis on fear appeals: **strong fear appeals with low-efficacy messages produce the greatest defensive response** — avoidance, denial, reactance — while strong appeals with high-efficacy messages produce the greatest behaviour change. The two correlate **negatively**, so this is an opposite effect rather than a weaker one. **A frightening picture of somebody's own estate with no credible answer performs worse than saying nothing.**
**Two components, and the second is the one this domain fails.** Response efficacy — *would it work?* — is answerable, because the tree visibly shrinks. **Self-efficacy — *could I do it?* — is where it fails**, because the broad grant is often the only grant a tool knows how to issue. So the tool must not recommend actions the visitor cannot perform: a recommendation that fails on arrival confirms that nothing can be done.
**This contradicts the explainer's no-remedies rule, and both stand.** A general page may withhold the answer, because withholding creates appetite. **A personalised one may not, because withholding creates denial.** The discriminator is whether the message is about the world or about the reader, and it belongs in whatever guides this site's authors — otherwise the two pages look inconsistent and somebody will align them.
**The hardest case is hosted, and it is structurally the worst one.** The containment belongs to the vendor, cannot be inspected, changed or attested, so honest advice reduces to *use it less*. **Zero efficacy by construction — which makes the page most likely to alarm a visitor the page least able to do anything with the alarm.** Its exit is a **request rather than a remedy**: ask the vendor for an endpoint that signs an existing audit record for a named relying party, with the surface field in it. The build adds one thing the brief did not: the hosted grant reaches **what you put in front of it**, and that part of the containment *is* the visitor's — so the hosted case ships one genuine remedy beside the request.
**And a finding the build itself surfaced.** On a local tree every excess path bottoms out at the same node — *runs as your user account* — so a list of eleven rows each ending in the same sentence buries it. The page says it once, at the top: **this is one problem rather than eleven**, which is a better efficacy message than any individual row.
**Status:** adopted, and implemented. Decision 32.

### C22 — What to measure, and the honest admission that this page cannot

**Source:** the same brief.
C12 established that counting acceptances inverts. **The equivalent trap here is measuring shock**: a tool optimised on how alarming its result feels converges on a number nobody believes. So no score out of a hundred — the gap is shown as a picture and a count of what each action closes.
**The measure family:** assessments completed rather than abandoned (an abandoned one is fear control in real time); **visitors who take a named action afterwards** (the only measure of danger control, and the one to instrument first); risks stated with an acceptor and an interval; risks declined; and **visitors who report the result as wrong**, which is the cheapest correction the library will ever get.
**The admission:** the page has no backend, so it can measure **none** of them. That is the same property that makes the privacy claim architectural. If any of these numbers is ever wanted it has to be collected somewhere that says so, which is a decision with a cost — stated rather than solved quietly.
**Status:** adopted as the measure set; unmeasurable as built, deliberately. Decision 33.

### C23 — Part of this pack is now built, which changes how the rest of it should be read

**Source:** the assessment at `/assess`, shipped at site v0.1.16, specified by document 14.
**What changes.** Until v0.1.16 every document here was a design, and the pack said so. One surface now exists, and it was not built from the abstract parts: **it was built from C16's grant tree, C16's three-tier control test, C17's prohibition rendering and C17's metric family**, which means four corrections that had only ever been argued have now been implemented once each. That is the first evidence in this pack that its own corrections are buildable rather than merely defensible.
**Three things the build changed about the pack's own claims, and they belong here rather than in a quiet edit:**

**1. Document 10's feature table needs a footnote it cannot carry.** Its honest reading was *everything at phase 0–1 is designed and nothing is built.* That is still true of every registry feature, F1–F19 — and it is no longer true of the pack as a whole. The distinction to keep is that **what shipped is a consumer of the registry's model, not a piece of the registry**: it renders grant trees and mandates and stores nothing on anybody's behalf. The registry itself remains entirely unbuilt.

**2. The build order gained a phase nobody planned, before phase 0.** Document 04 sequences fixtures → read path → write path → mandates → demo. The assessment sits *before* all of it and depends on none of it, because it needs no registry: it needs a **library** and an **interface**. That is worth stating as a finding rather than a scheduling note — **the first useful thing this pack produced needed none of the infrastructure the pack is about**, and a design pack whose first shipped artefact bypasses its own architecture should say so out loud.

**3. One of the pack's own standards was found unmeetable in the field.** Document 10's test is that a risk carries a **named acceptor**. The first interface to try it discovered that a name is a fact about the visitor's organisation and has nowhere safe to live, so it offers a **role** instead (decision 30). The standard is not wrong; it is **unreachable on a page that stores nothing about the visitor**, and the two constraints are in genuine conflict. Recorded so the next builder meets it as a known tension rather than as a surprise.

**Status:** adopted as the pack's status. Decision 36.

## The decisions register

| # | Decision | Made by | Status |
|---|---|---|---|
| 1 | Mandate lives in the issuer's record | draft-1, confirmed by v0.33.61 | **Settled** |
| 2 | Grant = what a credential permits; excess authority is the countable product | v0.33.61 | **Settled — schema change queued** |
| 3 | Fixture class with required `private_key_published` flag | v0.33.61 | **Settled — schema change queued** |
| 4 | Personas as signed agent cards; workflow identity as notary | v0.33.61 | **Settled for the MVP** |
| 5 | Size bounds (256 / 512 KB / 8 KB) | draft-1 proposal | **Open — awaiting project lead** |
| 6 | First capability (`repo.pull-request.create`) | draft-1 proposal | **Open — awaiting project lead** |
| 7 | Corpus version for this pack | — | **Open — assigned on adoption** |
| 8 | Acceptance semantics (unaccepted mandate = inert) | draft-1 proposal | **Open** |
| 9 | Entry as a file in a commit graph, not an accumulating record | v0.33.61 | **Settled — architecture change queued** |
| 10 | Publish the signed head on a cadence | v0.33.61 | **Settled in principle — cadence open** |
| 11 | Notary takes the published form, not the answering form | v0.33.61 | **Settled for the MVP — the commercial call is the project lead's** |
| 12 | Mandates are allow-lists; prohibitions are annotations only | v0.33.61 | **Settled** |
| 13 | Which verification mode ships first | — | **Open — two products, and building both means neither finishes** |
| 14 | Does the policy layer (WF-6) belong in the MVP? | pack doc 10 (C12) | **Open — specified and mapped, with no acceptance test** |
| 15 | How P2 (public decision log) is reconciled with A3 (blind ack) | pack doc 10 (C12) | **Open — the blind ack currently wins by default** |
| 16 | Check events go to the issuer's own lane, never a central log | v0.33.61 (C14) | **Settled — rule 1 applied to telemetry** |
| 17 | A check event never carries what the checker was authorising | v0.33.61 (C14) | **Settled — the consent argument depends on it** |
| 18 | Does a lane with no anchors accept any token holder? | — | **Open — absent from the parent's API reference; gates the layer's coverage** |
| 19 | Who drains the lane, and what watches the drain? | — | **Open — the failure is silent and the layer is worthless once it starts** |
| 20 | Observability ships in phase 3, with mandates | v0.33.61 (C15) | **Settled — build order amended, not edited** |
| 21 | A grant is a tree; blast radius is a path through it | v0.33.61 (C16) | **Settled — schema change queued** |
| 22 | Node labels carry `enforced_by` ∈ boundary / setting / expectation, dated per node | v0.33.61 (C16) | **Settled — schema change queued** |
| 23 | Success is measured by risks stated well enough to be accepted, with declines counted beside acceptances | v0.33.61 (C17) | **Settled — supersedes the obvious metric before it was adopted** |
| 24 | Prohibitions are a generated, dated view; the allow-list is what is stored | v0.33.61 (C17) | **Settled — reconciles with C12 rather than contradicting it** |
| 25 | Grants, mandates, claims and evidence get signatures, never keypairs | v0.33.61 (C19) | **Settled — confirmed twice, by two routes** |
| 26 | Publication intent recorded at issue, beside `private_key_published` | v0.33.61 (C18) | **Open — proposed field for draft-2** |
| 27 | Is the grant tree in the MVP at all? | pack doc 12 | **Open — it needs enumeration tooling the pack does not have** |
| 28 | Can an agent instance persist a private half across sessions? | — | **Open since 19 Aug — gates whether instances can hold identities** |
| 29 | Store references into a public library, never descriptions of the visitor's machine | v0.33.61 (C20) | **Settled — implemented as no free-text input at all** |
| 30 | Acceptor is a role, not a name, on the user-facing page | pack doc 14 (C20) | **Settled — and it means that page cannot meet the pack's own named-acceptor standard** |
| 31 | Browser storage is the default; the vault is offered, never defaulted | v0.33.61 (C20) | **Settled — the vault changes durability, not privacy** |
| 32 | Every personalised result page ends on an action the visitor can perform | v0.33.61 (C21) | **Settled — and it does not generalise to the explainer** |
| 33 | Measure action taken, not alarm produced | v0.33.61 (C22) | **Settled as the measure set — and unmeasurable as built, with no backend** |
| 34 | When do library entries become named products? | pack doc 14 | **Open — naming one means measuring it under the participant rules** |
| 35 | Is a scan ever added, and where does its output go? | pack doc 14 | **Open — never browser storage, which argues for the vault path before the scan** |
| 36 | The pack is a design pack with one shipped consumer; the registry itself is unbuilt | pack doc 14 (C23) | **Settled as the pack's status** |

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
