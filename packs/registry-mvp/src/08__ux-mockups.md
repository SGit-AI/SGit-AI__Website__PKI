# Every Edge Carries A Badge: The Register Interface Mocked Up Screen By Screen, With "Nobody" As A First-Class Answer

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Engineering, Architecture, Design

**type** Dev brief — user-facing surface

*Ninth document of the registry MVP pack. The v0.33.61 register-UI brief settles the primitive — a badge on every edge — and the policy formulation — a saved query that must return no rows. This document does the next thing down: it writes the screens out as intended output, word for word, so the wording can be argued with before anything is built. Every block below is a mockup of what a user sees, not a description of it. Limitation: these are static mockups against the schemas in document 02 and the corrections in document 06; nothing here has been built, and the two states that most need real data — a crowded agent page and a policy over a real population — are the two least trustworthy mockups in the set.*

---

## What This Is

The register interface, drawn. The pack's other documents describe a data model and three workflows; this one describes what a person sees, and it treats the wording as the design. Several strings below are **load-bearing**: they are the only place a reader learns that a statement nobody can check is being shown to them as a statement nobody can check.

Three inherited constraints shape every screen:

1. **The primitive is the badge, not the layout.** From the v0.33.61 register-UI brief: every line in this interface is a claim by somebody about somebody, and what a reader needs beside each one is who can verify it, by what method, at what cost, when it was last checked and what the answer was.
2. **"Nobody" is a value, not a gap.** An edge no party can check is a correctly rendered fact about the world. Rendering it as a blank produces an interface where everything looks equally solid.
3. **The client is a page.** Document 03's thesis applies here too: an LLM session must be able to reach every one of these answers from published URLs, which is why each mockup ends with the CLI that produces the same information (§M9).

### The acceptance test for this whole document

> A reader opens one agent's page and answers, without leaving it: **what this agent is, who says so, who checked and when, what it may do, what it was authorised to do, and which of those statements nobody can currently verify.**

If a screen below does not move a reader toward that sentence, it should be cut.

## The Badge, As Rendered

The six fields from the register-UI brief, in their compact inline form. This is the atom every other screen is built from:

```
  ┌ badge ─────────────────────────────────────────────────────────────┐
  │  ✓ confirmed   client · signature   free   checked 20 Aug 09:14    │
  └────────────────────────────────────────────────────────────────────┘
```

The five result states, each with its own glyph and its own words. **Three of these are routinely collapsed into one, and collapsing them is the failure this design exists to prevent:**

```
  ✓ confirmed     checked, and it holds
  ✗ denied        checked, and it does not hold        ← a signal, not an error
  ? unknown       checked, and the answer was neither
  ⚠ unreachable   could not check — the authority did not answer
  ○ not checked   nobody has asked yet
```

And the `verifiable by` field, whose third value is the informative one:

```
  client      anybody can check this with published material
  provider    only the party that holds the fact can check it, on request
  nobody      no party can check this claim, by any method, at any price
```

Rendering rule, and it is absolute: **an edge whose `verifiable by` is `nobody` is never shown with a ✓.** It gets the state it has earned:

```
  ○ not checked   nobody · no method   —   this claim cannot be verified by anyone
```

## M1 — The Agent Page

The acceptance test, made concrete. One screen, six answers.

```
 ──────────────────────────────────────────────────────────────────────────────
  AGENT   site-agent (pki.sgit.ai)                        sha256:69d9…790c
 ──────────────────────────────────────────────────────────────────────────────

  IDENTITY                                            record · 6 statements

  ├ signing key       ECDSA P-256, self-signed
  │                   ✓ confirmed   client · signature · free · 20 Aug 09:14
  ├ encryption key    RSA-OAEP 4096, self-signed
  │                   ✓ confirmed   client · signature · free · 20 Aug 09:14
  ├ operated by       operator (sgit.ai)                       claimed
  │                   ○ not checked   nobody · no method
  └ runs on           claude-code, remote                      claimed
                      ○ not checked   nobody · no method
                      └ self-reported by the agent. No vendor signs a
                        statement naming a session's surface.

  MANDATES IN FORCE                                            1 accepted

  └ repo.pull-request.create
      ✓ confirmed   client · signature · free · 20 Aug 09:20
      on         github.com/SGit-AI/SGit-AI__Website__PKI
      scope      branches: dev · paths: briefs/**, documents/**
      issued by  operator (sgit.ai)   sha256:a461…23ac
                 ✓ issuer chains to a declared root of this registry
      valid      20 Aug 2026 → 01 Oct 2026            expires in 42 days
      accepted   by this agent, 20 Aug 09:18, statement 4
                 ✓ confirmed   client · signature · free

  GRANTS HELD                                                  2 recorded

  ├ append token · lane 3 · single use · expires 22 Aug
  │   ✓ confirmed   client · signature · free · 20 Aug 09:21
  │   under mandate  operator record, statement 7
  └ repository write · 41 repositories
      ⚠ unreachable   provider · live lookup · metered
      under mandate  — none
      ┌──────────────────────────────────────────────────────────────────┐
      │  EXCESS AUTHORITY  40 repositories            unaccepted · 6w    │
      │  This grant covers 41 repositories. The mandate covers 1. The    │
      │  difference has no acceptor and has stood for 6 weeks.           │
      └──────────────────────────────────────────────────────────────────┘

  WHAT NOBODY CAN CHECK                                       2 statements

  ├ operated by operator (sgit.ai)     no party can verify this claim
  └ runs on claude-code, remote        no party can verify this claim
      Not a defect on this page. There is no mechanism, at any price, for
      establishing either. Both are shown because hiding them would make
      the rest of this page look more solid than it is.

  HISTORY   6 statements, chain intact                        [ read all ]
 ──────────────────────────────────────────────────────────────────────────────
```

Three things this screen does that a conventional identity page does not:

**It answers "who says so" per line, not per page.** The issuer sits inside the mandate block, with its own badge, because a mandate's standing is the issuer's standing.

**It shows the excess-authority row as a first-class object.** This is correction C1 arriving in the interface: the grant is what the credential technically permits; the mandate is what the holder was authorised to do; the gap is exposure that nobody accepted. Every field in that box is computed from records the registry already holds — which is the argument for holding grants at all.

**It has a section for the unverifiable, and the section is not an error state.** It is the most honest block on the page.

## M2 — One Badge, Expanded

Clicking any badge opens the transcript. The rule: **a badge never asserts more than its transcript shows.**

```
 ── VERIFICATION ───────────────────────────────────────────────────────────────
  CLAIM        This mandate was issued by operator (sgit.ai)
  EDGE         mandate  sha256:a461…23ac / statement 7   →   subject sha256:69d9…790c

  VERIFIABLE BY   client
  METHOD          signature check over canonical bytes
  COST            free — no account, no key, no rate limit
  LAST CHECKED    20 Aug 2026 09:20:14 UTC        by you, in this browser
  RESULT          ✓ confirmed

  TRANSCRIPT
    1  GET  /registry/records/sha256:a461…23ac/00007.json       200   1.4 KB
    2  canonicalise  jq -cS, "sig" removed                      312 bytes
    3  signing key   from statement 1 of the issuer's record    ECDSA P-256
    4  verify        sgit pki verify                            OK
    5  chain         seq 1..7 contiguous, every prev matches     OK
    6  root          issuer appears in roots.json                declared 20 Aug
    7  revocations   none affecting statement 7                  as of read time

  RE-RUN THIS YOURSELF
    curl -s https://pki.sgit.ai/registry/records/sha256:a461…23ac/00007.json \
      | jq -cS 'del(.sig)' | sgit pki verify --key <issuer signing key> --stdin

  NOT ESTABLISHED BY THIS CHECK
    · that the issuer was entitled to issue it — that is roots.json, step 6, and
      roots.json is a declaration by this registry's operator, not a proof
    · that the subject accepted it — separate edge, separate badge
    · that anything the subject did stayed inside it — no registry can say this
 ───────────────────────────────────────────────────────────────────────────────
```

The last block is the one to defend in review. A verification transcript that lists only what it proved reads as a stronger claim than it is; **"not established by this check" is where the page stops overselling itself**, and it is the same discipline the site applies to its own pages.

## M3 — The Register Index

The entry surface. Nodes, counts, and the one number that should be uncomfortable.

```
 ── REGISTER ───────────────────────────────────────────────  registry v0 · 20 Aug
  [ search ]                                       agents · issuers · projects · policies

  AGENTS                                                                        3
   site-agent (pki.sgit.ai)      sha256:69d9…790c   1 mandate   2 grants   ⚠ 1
   site-agent (nhi.sgit.ai)      sha256:0c2f…41ba   1 mandate   0 grants
   processor (registry)          sha256:7b18…9e04   0 mandates  1 grant

  ISSUERS                                                                       1
   operator (sgit.ai)            sha256:a461…23ac   3 issued    0 revoked   root

  PROJECTS                                                                      2
   pki.sgit.ai                   2 agents   1 mandate   1 policy   ⚠ 1
   nhi.sgit.ai                   1 agent    1 mandate   0 policies

 ── HOW MUCH OF THIS REGISTER IS CHECKABLE ────────────────────────────────────
   client-verifiable edges     14     ████████████████░░░░░░░░       58%
   provider-verifiable edges    3     ███░░░░░░░░░░░░░░░░░░░░░       12%
   verifiable by nobody         7     ███████░░░░░░░░░░░░░░░░░       29%
 ───────────────────────────────────────────────────────────────────────────────
```

That last panel is deliberate and is the screen's whole argument. A register that does not report its own unverifiable fraction will drift toward looking authoritative as it grows, because volume reads as substance. **Putting the number on the front page makes growth in the wrong direction visible.** Day one it will read badly. It is supposed to.

## M4 — The Mandate Page, From The Issuer's Side

Rule 1 rendered: the mandate lives in the issuer's record, so the issuer's page is where it is authored. The composer's job is to make the grant/mandate gap visible **before** the mandate is signed, not six weeks later.

```
 ── ISSUE A MANDATE ────────────────────────────────  issuer: operator (sgit.ai)
  SUBJECT       site-agent (pki.sgit.ai)   sha256:69d9…790c        [ change ]
  CAPABILITY    repo.pull-request.create                           [ change ]
  RESOURCE      github.com/SGit-AI/SGit-AI__Website__PKI
  CONSTRAINTS   branches  dev
                paths     briefs/**, documents/**
                max files 20
  INTERVAL      20 Aug 2026  →  01 Oct 2026                        6 weeks

 ── WHAT THE SUBJECT'S CREDENTIAL ACTUALLY PERMITS ─────────────────────────────
   The credential this subject holds covers   41 repositories, contents:write
   This mandate covers                         1 repository, one capability
   EXCESS AUTHORITY                           40 repositories

   Recording this mandate does not narrow the credential. It records what you
   authorised, so the difference becomes measurable and someone can be asked
   to accept it.
                                     [ narrow the credential ]  [ accept the gap ]

 ── BEFORE YOU SIGN ────────────────────────────────────────────────────────────
   ✓ interval set              a mandate with no interval is a grant wearing a
                               mandate's name
   ✓ revocation path           this issuer's record, appended, effective_from
   ⚠ constraints unenforced    this registry records constraints; it does not
                               enforce them. Enforcement is the execution
                               broker's job and the broker is not built.

                                            [ sign and append to my record ]
 ───────────────────────────────────────────────────────────────────────────────
```

The `⚠ constraints unenforced` line is load-bearing and must survive review intact. Without it, a mandate composer reads as a policy engine, and the distance between "recorded" and "enforced" is the exact distance this pack keeps insisting on.

## M5 — A Policy Is A Query That Must Return Empty

The register-UI brief's formulation, rendered. The verdict and the badge that decides what the verdict is worth appear together, never apart.

```
 ── POLICY ──────────────────────────────────────────────────────────────────────
  NAME     No session of mine runs anywhere but surface X
  QUERY    every session node
             whose surface edge is absent
             or whose surface edge names anything but X
  MUST RETURN   no rows

  RESULT   0 rows                                                    20 Aug 09:31

  ┌───────────────────────────────────────────────────────────────────────────┐
  │  THIS POLICY IS INSTRUMENTATION, NOT ENFORCEMENT.                         │
  │                                                                           │
  │  The edge it constrains — "session runs on surface X" — is verifiable by  │
  │  nobody. Every session reports its own surface from an environment        │
  │  variable, which is settable by whoever starts the process and carries no │
  │  signature. This policy returns no rows whether or not it is being        │
  │  complied with. It records an expectation and detects nothing.            │
  │                                                                           │
  │  It would become enforcement if: a vendor signed a statement naming the   │
  │  surface of a session, verifiable by a third party against a published    │
  │  key. No vendor currently offers this. Anybody who can show one changes   │
  │  this box.                                                     [ track ]  │
  └───────────────────────────────────────────────────────────────────────────┘
 ───────────────────────────────────────────────────────────────────────────────
```

**"0 rows" and "detects nothing" on the same screen is the entire point.** A policy dashboard that reports green without reporting what its green is made of manufactures exactly the false assurance this corpus has been documenting.

The contrasting case, for a policy whose constrained edge *is* checkable:

```
  NAME     Every mandate in force has been accepted by its subject
  RESULT   1 row                                                     20 Aug 09:31

   ✗ VIOLATION   site-agent (nhi.sgit.ai) ← mandate operator/statement 9
                 issued 18 Aug · no acceptance statement in the subject's record
                 ✓ confirmed   client · signature · free   — this one is enforcement:
                 the absence is checkable by anybody, from published records.
```

A violation row that carries its own badge is a violation somebody can act on. A violation row without one is a complaint.

## M6 — Enrolment, From The Agent's Side

The narrow door, rendered honestly. The design constraint is unusual and the interface must not soften it: **the acknowledgement is blind, and pending and declined look identical.**

```
 ── ENROL ───────────────────────────────────────────────────────────────────────
  STEP 1   Generate a keypair                                            ✓ done
           You now control a private key. Nothing else knows it exists.

  STEP 2   Sign your identity statement with the key being enrolled      ✓ done
           This proves possession. It proves nothing about trust.

  STEP 3   Post it through the append lane                               ✓ sent
           No account. No access token. The lane accepts writes and
           returns nothing about them.

           RESPONSE   {"ok":true}

           ┌────────────────────────────────────────────────────────────────┐
           │  This response means the lane received bytes. It does not mean │
           │  your enrolment was accepted, queued, read, or declined. Those │
           │  four outcomes are indistinguishable from here, by design — a  │
           │  lane that reported them would be an oracle for guessing them. │
           └────────────────────────────────────────────────────────────────┘

  STEP 4   Watch the public registry                                   ○ waiting
           The read path is the outcome channel. There is no other.

           GET /registry/records/sha256:69d9…790c/00001.json      404
           last checked 09:34:02 · retrying every 60s · 4 attempts

           PRESENT  the project recognised your key. That is a decision
                    somebody made, not a computation that completed.
           ABSENT   pending, or declined. You cannot tell which, and no
                    amount of polling will tell you.
 ───────────────────────────────────────────────────────────────────────────────
```

Every word in the two boxes is load-bearing. An enrolment screen that renders a 404 as "not yet" is lying by omission about a system where "never" renders identically.

## M7 — The Verifier's Answer

The output of the whole design: one sentence a third party can act on, or a refusal that says where it stopped. Partial resolution is a legitimate output — the June trust model's position, adopted in C2.

```
 ── ANSWER ──────────────────────────────────────────────────────────────────────
  QUESTION   May sha256:69d9…790c open a pull request on SGit-AI__Website__PKI?

  ANSWER     YES, until 01 Oct 2026, on the authority of operator (sgit.ai),
             which is a declared root of this registry.

  BASIS      identity      ✓ self-signed, chain intact          client · free
             mandate       ✓ issuer-signed, statement 7         client · free
             acceptance    ✓ subject-signed, statement 4        client · free
             issuer root   ✓ declared in roots.json             client · free
             revocations   ✓ none in either record              client · free

  NOT ANSWERED
             Whether the agent is who its label says it is beyond key control.
             Whether anything it does stays inside this mandate. This register
             records authority; it does not observe behaviour.
 ───────────────────────────────────────────────────────────────────────────────
```

And the refusal, which is the more important screen:

```
  ANSWER     I FOLLOWED THE CHAIN THIS FAR AND STOPPED.

             identity      ✓ self-signed, chain intact
             mandate       ✓ issuer-signed, statement 9
             acceptance    ○ not present in the subject's record
             issuer root   ⚠ issuer sha256:1d40…88c7 is not in roots.json

  MEANING    A mandate exists. Its subject has not accepted it. Its issuer is
             not anchored here. This is not a failure of verification — it is
             what verification found. Two parties disagree about standing, and
             the disagreement is now visible.
```

**"This is not a failure of verification — it is what verification found"** is the sentence that keeps explicit distrust a signal rather than an error page.

## M8 — Empty And Failure States

The states a demo never shows and a real register lives in.

```
  DAY ONE, NO RECORDS
   This register is empty. Four rules are published and nothing has been
   written under them yet. Four rules with no records are four assertions.
                                                      [ read the four rules ]
```

```
  UNREACHABLE ≠ DENIED
   ⚠ unreachable   provider · live lookup · metered · last tried 09:41
     The authority for this edge did not answer. This is not a denial and must
     not be read as one. Last confirmed 19 Aug 14:02 — 19 hours ago.
                                                        [ retry ]  [ history ]
```

```
  STALE
   ✓ confirmed   client · signature · free · checked 12 Jun 2026
     ⓘ This check is 69 days old. The record may have been appended to since.
                                                             [ re-check now ]
```

```
  INDEX DISAGREES WITH RECORDS
   ⚠ The index lists 4 agents; the records directory contains 3.
     The index carries no authority — it is a regenerable convenience. The
     records are the registry. This page is showing you the records.
                                                       [ how to regenerate ]
```

That last one is the architecture's weakest joint (document 01: the index is unsigned and convenient, which is how unsigned conveniences become load-bearing). Rendering the disagreement rather than resolving it silently is the cheapest defence available.

## M9 — The CLI Mirror

Every screen above is a rendering of public bytes, which means the same answers must be reachable without the interface. This is the pack's own thesis applied to its own UI: **if the page is the only way to get the answer, the design has quietly acquired a dependency it says it does not have.**

```console
$ sgit registry show sha256:69d9…790c
site-agent (pki.sgit.ai)                              sha256:69d9…790c
  identity      ECDSA P-256 + RSA-OAEP 4096, self-signed     ✓ client/sig
  mandates      1 in force, 1 accepted                       ✓ client/sig
  grants        2 recorded, 1 unreachable                    ⚠ provider/lookup
  excess        40 repositories, unaccepted, 6 weeks         computed
  unverifiable  2 claims (operated_by, runs_on)              nobody/no method
  history       6 statements, chain intact
```

```console
$ sgit registry policy run no-local-compute
0 rows.

  warning: this policy is instrumentation, not enforcement.
  The constrained edge "session runs on surface X" is verifiable by nobody.
  This result is 0 rows whether or not the policy is being complied with.
```

```console
$ sgit registry verify sha256:69d9…790c --capability repo.pull-request.create
I followed the chain this far and stopped.

  identity     ok
  mandate      ok      operator/00009
  acceptance   MISSING  subject's record has no acceptance of operator/00009
  issuer root  MISSING  sha256:1d40…88c7 not in roots.json

exit 2
```

Two deliberate choices. **The warning prints on the success path**, because a policy that is instrumentation is most misleading when it passes. And **the refusal exits non-zero with the same words the page uses** — one vocabulary for humans and pipelines, because two vocabularies is how a nuance gets dropped in whichever one is read second.

## The Load-Bearing Strings

These are the ones to protect in review. Each is the only place a reader learns something they cannot infer from the rest of the screen:

| String | Without it, the reader concludes |
|---|---|
| "this claim cannot be verified by anyone" | The absence of a tick is a to-do |
| "This policy … records an expectation and detects nothing" | Green means compliant |
| "It does not mean your enrolment was accepted, queued, read, or declined" | `{"ok":true}` means accepted |
| "This is not a failure of verification — it is what verification found" | A refusal is a bug |
| "this registry records constraints; it does not enforce them" | The composer is a policy engine |
| "The index carries no authority" | The index is the registry |
| "The difference has no acceptor" | An excess grant is somebody's decision |

## What This Interface Deliberately Does Not Have

**No trust score.** Any single number over these edges would average confirmed, unreachable and unverifiable into one figure, which is precisely the collapse the badge exists to prevent.

**No green tick at the page level.** Pages do not have standing; edges do. A page-level tick would inherit the standing of its weakest edge and display the standing of its strongest.

**No inline capability values, ever.** Grants render as descriptors and hashes. Rule inherited from document 02, and it applies to the UI with no exception: an interface that can display a live capability is an interface that will eventually paste one into a screenshot.

**No write path for mandates outside the issuer's own record.** The composer in M4 appends to the issuer's record and offers no alternative, because offering one would make rule 1 a preference.

## Honest Tensions

| Tension | Note |
|---|---|
| The unverifiable fraction on the front page | It is the right number and it will read as a failing grade for months; the temptation to move it will be strongest exactly when it is most informative |
| ASCII mockups vs. a real graph browser | The register-UI brief asks for a hyperlinked graph; these screens are node-centric because a graph view without per-edge badges is the diagram-of-assertions failure the brief names — the graph view should come *after* the badge is real, not before |
| Excess authority needs data the registry cannot verify | The "41 repositories" figure comes from a provider lookup, so the most important box on M1 is the one most often `⚠ unreachable`; it should render the staleness, not the number alone |
| Five states raise the authoring cost of every edge | Every integration must now decide four things it could previously leave blank; that is the cost of the design and it should be paid, but it will be felt at the third integration, not the first |
| Mockups without a population | M3's counts and M1's crowding are guesses; the tabletop (document 07) is the cheapest way to populate them before building |

## Open Questions

| Question | Notes |
|---|---|
| Who re-checks, and on whose clock? | "Last checked" implies a checker. Browser-side on view is free and inconsistent; a server-side re-checker is a service commitment and a new trusted party |
| Does the register store check results, or only recompute them? | Storing them makes the register hold claims about its own claims — an edge whose badge is itself an edge |
| Is `⚠ unreachable` cached, and for how long? | Caching a failure makes an outage look like a policy; not caching it makes a metered lookup expensive |
| Should a policy verdict be signable? | A signed "0 rows at time T" is a receipt, and document 02 deliberately kept receipts out of the registry |
| Does the excess-authority box belong to the registry or the broker? | It is computed from registry content but it is a risk statement; the pack's instinct is registry-computed, broker-actioned |
| What does the graph view look like once badges exist? | Deferred on purpose — this document's position is that it cannot be designed honestly before the badge has met real edges |
---

*Added after publication, 20 August 2026 (site v0.1.12). No claim above has been changed — this pack supersedes rather than rewrites; the licence line, missing when this document shipped at v0.1.10, was added below. Later documents that bear on this one:*

- `09__wardley-maps.md` — **W4 and W5** — the badge and the policy positioned: five of the badge's six inputs already exist as commodity, and a policy verdict cannot be more solid than the badge two layers down
- `10__user-stories-and-features.md` — the stories these screens serve — V1–V5, A1–A4, I3, Y1–Y3 — each with the screen named in its tag, and F12 and F13 marked *specified, unbuilt*
- `11__observability.md` — the data source the badge's **last checked** field did not have. It is the issuer's own lane, which also means M4 should show a subject's check interval before a second mandate is issued to it
- `12__grant-tree-and-control-labels.md` — two screens change without changing layout: M1's excess-authority box should expand into the **path through the tree** that produces its count, and M4 should render the mandate **as prohibitions** for the person signing while storing the allow-list, with the rendering dated
- `13__keys-and-signatures.md` — one addition to M2's transcript: where a signature verified against a **published** private half, the result must say so, because that is the exact case where a verifier succeeds and concludes something false
- `14__user-assessment.md` — the first screens in this pack that were **built** rather than mocked. Two of its decisions cut against M1 and M4: the acceptor is a **role**, because a name is a fact about the visitor's organisation, and the gap is shown as a picture with no score at all
- `15__interface-rendered.md` — **these twelve screens, built**, by an outside session working from the briefing pack cold. Four corrections came back (C27–C30), and three of them are about **drawing** rather than wording: colour re-collapses the five states, the badge's wrap point can produce the exact misreading it exists to prevent, and a column of five ticks is a page-level tick this document forbids

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
