# The Build Record: What Was Built Across Four Releases, What It Cost, And What Is Still Only Written Down

**pack** Grant and Mandate · draft-1 · 26 August 2026
**role** The consolidated record of what moved from specified to built between site v0.1.25 and v0.1.29 — across the registry, this pack, and the enforcement point — with the evidence for each claim and an honest column for what remains a document. It spans two packs, so it lives in the newer one and the [registry pack's change control](../../registry-mvp/change-control.html) points here.

*Written because a corpus that records its corrections but not its deliveries will drift into believing it built more than it did — and, in this case, less: the registry pack still described its own subject as unbuilt three days after it shipped. This document is the counterweight, and every row in it names the artefact a reader can fetch.*

---

## The one-paragraph version

In four releases the estate went from **a design pack with no register** to **a running register, a measurement method, and a control that refuses a push**. The register is live at [pki.sgit.ai/registry](../../registry/index.html) with eleven records and twenty-three signed statements, sgit-format-compatible by execution. The grant and mandate documents exist as schemas with two measured library entries behind them. And build-order step 1 is built: a mandate compiled into a git hook that refused a real push to `dev`, with `origin/dev` unchanged afterwards. **What is not built is everything the register would need to be trusted rather than demonstrated** — a real issuer key, a boundary-tier enforcement point, a capability vocabulary, and the entire risk-product half.

## Release by release

| Release | What moved from written to built |
|---|---|
| **v0.1.26** | The **register itself**: 11 records, 23 signed statements, one declared root, four assumable roles, and a validator that reproduces six expected verification answers |
| **v0.1.27** | The **Grant & Mandate pack**: eight documents, the two schemas, the library, and the first measured entry |
| **v0.1.28** | **Enforcement**: a mandate compiled into a `pre-push` hook, and the acceptance test executed — a push refused by git |
| **v0.1.29** | The **second library entry**, measured inside a CI runner, and the two defects it found in the work above it |

## 1 — The register (v0.1.26)

Preceded by a [readiness report](../../registry-mvp/readiness-report.md), which the registry pack's briefing asks a fresh session to produce instead of an implementation plan. It returned **six blocking questions**; three were closed by execution during the build and three remain the project lead's. That table is in §5.

**What exists, at constructed URLs, with no account:**

| Artefact | Detail |
|---|---|
| `records/` | **11 records, 23 statements.** Ten are **fixtures** — private keys published beside public halves, deliberately — and **one is real** (`private_key_published: false`), which is what keeps the flag evidence rather than a column |
| Roles | **Four** — site-agent, processor, verifier, librarian — each shipping a drop-in `sgit` keystore and a published passphrase, so a fresh session assumes a role by retrieval. Executed: `Signature valid (signer: role: site-agent)` |
| Statement types | identity, mandate, acceptance, grant, revocation — including a grant carrying [document 12's](../../registry-mvp/grant-tree.html) tree with per-node control labels |
| `views/expected-verifications.json` | **Six** verification answers as data: valid, revoked, expired, inert, identity-revoked, and a role. The acceptance test for any verifier, shipped as a file |
| `views/excess-authority.json` | The consumable for risk products: 41 permitted vs 1 mandated, **acceptor: none** |
| `tools/registry_tool.py` | `make-fixtures`, `validate`, `verify`, `enrol`. The validator enforces the ownership rule (a valid signature by a non-owner is rejected — the 2019 failure as a test case), reads the fixture flag **before** any signature, and reproduces all six answers |

**Two architectural facts, established rather than asserted.** The record model is **C7's commit graph** — no `seq`/`prev`, the public git history is the chain — making this the first implementation of a correction the registry pack had marked *settled, change queued*. And the register is **sgit-native by execution**, not by assumption: fingerprints are sgit's 16-hex short form, bundles are byte-shaped like `sgit pki export`, and signatures are raw `r||s` ECDSA P-256 chosen in sgit's own source for Web Crypto interop. Round-tripped in both directions against sgit-ai v0.16.0 — which closed the pack's longest-standing dependency flag.

**The write path is a git commit reviewed by a maintainer**, stated plainly rather than dressed up as the account-less append lane the pack designs. That lane remains unbuilt.

## 2 — The pack (v0.1.27)

Eight documents plus a change-control appendix now running to **sixteen corrections and twenty-nine decisions**. Its three load-bearing constraints — reality before the risk register, the library/instance split with references not copies, and the three-term comparison whose blind-spot delta makes a self-report falsifiable — are recorded in [document 00](00__LEADING-BRIEF.md) as constraints rather than options.

The inventory step both source briefs demand was run before anything was designed, and it changed the build: **Cedar adopted** (default-deny, evaluates outside the agent's loop, explicitly does not do identity, so it composes with the register), **graphs.sgit.ai's conventions adopted** (lexicon, edge sets, provenance, drift gate), and **only the mandate document built** — the one thing nothing in the industry provides.

## 3 — Enforcement (v0.1.28)

The pack's acceptance test ends *"attempt the prohibited action and be refused by something that is not the agent."* Executed:

```
$ git push origin HEAD:dev
  ✗ dev  is not permitted by mandate v1
    permitted branches: claude/**
error: failed to push some refs
```

`origin/dev` was unchanged; a push to `claude/**` succeeded in the same minute. Three artefacts: a **mandate document** (issuer-signed, interval-bearing, allow-list stored, prohibitions generated and dated), **`tools/mandate.py`** (issue, verify, check-branch, delta, hook entry point; **default-deny** on missing, unparseable, mis-signed or expired), and **`.githooks/pre-push`**, which reads the mandate at runtime rather than compiling a copy so policy and enforcement point cannot drift.

**The tier reached is `setting`, not `boundary`** — the hook sits inside the grant it bounds. Exactly the tier-three-to-two move the permissions brief predicted, and the refusal banner says so on its own face. Full detail in [document 07](07__enforcement.md).

## 4 — Measurement, and two entries (v0.1.27, v0.1.29)

`tools/measure.py` is the method, published so somebody else can run it and get the same answer. One rule governs it: **presence and reachability, never contents.** A refused probe is recorded `unknown`, never guessed.

| Entry | Environment | The finding that mattered |
|---|---|---|
| **#1** | The Claude Code Remote container that wrote this pack | The measurement **refused to measure itself** — an account-level classifier evaluating outside the agent's loop. A boundary-tier control caught working *on the measuring agent*, which is the cleanest demonstration of the pack's three-tier test, produced by accident |
| **#2** | A GitHub Actions runner, measured by the same tool **inside** it | It is the other end of entry #1's node n3: a push ends there, and this is what happens next, so the two **join at that edge** and together are the blast-radius path |

The contrast is what one entry could not give: the hosted agent sits behind a **mandatory egress proxy**, while the CI runner that deploys its work reached every host **unrestricted**; the agent **retains a session record** (its grant is a union over prior turns) while the runner retains nothing; and the runner's grant is the only one in either entry **declared up front**, in a `permissions:` block the job cannot widen — the one boundary that was designed rather than discovered.

## The four findings that cost something to record

The estate's rule is that a correction is recorded rather than tidied away. Four earned it:

**The control refused the release that was carrying it** (GM12). Within an hour, the hook blocked the push publishing its own documentation. The remedy was not `--no-verify` and not editing the hook: mandate v1 was **wrong**, narrower than the authorisation that actually existed. The issuer amended it, citing the instruction and carrying an interval. *An expectation that was too narrow would have been silently ignored — the refusal is what forced the authorisation to be written down.*

**The measurement caught its own tier change** (GM13). Re-run after the hook was installed, `measure.py` independently reported node n4 as `setting` where the entry recorded `expectation`. The drift detector working one commit after the improvement, in the direction the table calls *somebody improved something*.

**The tool mislabelled a boundary** (GM16). Entry #2's node n1 called the OS user separation a `boundary` while n1a recorded passwordless `sudo` succeeding. The pack's own *setting that reads like a boundary* warning, reproduced by the tool built to detect it, because tiers were decided **in isolation**. *A tier is a property of a node's relationship to the tree, not of the node.* Corrected; the wrong label kept visible under `SUPERSEDED_BY`.

**The hook does not travel with a clone** (GM16, GM-D28). The file is committed; the `core.hooksPath` config that activates it is local. Any fresh clone gets the file and not the enforcement, and nothing announces it. **The control is one un-run command away from being absent** — found by measurement, not review.

## 5 — What the readiness report's six questions became

| Q | Question | Now |
|---|---|---|
| Q1 | Which record model — accumulating, or commit graph? | **Closed.** C7's commit graph, implemented |
| Q4 | What do `sgit pki sign/verify` accept and emit? | **Closed by execution.** Reconciled against sgit-ai v0.16.0, round-tripped both ways |
| Q5 | Processor transparency vs the blind acknowledgement | **Closed for the git write path** — commits are public, so the processor's decisions are the repository history. Still open for the lane |
| Q2 | Does a lane with no anchors accept any token holder? | **Open.** It gates phase 2 entirely, and one experiment against a test lane would answer it |
| Q3 | What is a capability name? | **Open.** A missing type underneath excess authority, not a scoping choice |
| Q6 | Is an unaccepted mandate inert or live on issue? | **Open**, taken provisionally as inert and demonstrated by fixture agent-d |

## What is still only written down

Stated flatly, because a build record that lists only deliveries is a sales document.

| Not built | Why it matters |
|---|---|
| **A real issuer key** | Every mandate here is signed by the **fixture root**, whose private half is published. Anybody can forge it and the hook would enforce the forgery just as diligently. *The enforcement is real and the authority is not*, and they are independent halves |
| **A boundary-tier enforcement point** | The hook is `setting`. A branch protection rule or a required CI check is the same allow-list evaluated where the agent cannot reach it — a change of **location**, not policy |
| **The capability vocabulary** | Without it, excess authority is demonstrable rather than defined, and the shortfall is not computable at all |
| **The append-lane write path** | No lane, no processor runbook, no blind acknowledgement. Phase 2's questions are untouched |
| **The entire risk-product half** | The instance, the six screens, the risk derivation and the plug profile are specified and belong to RiskMandate, not here |
| **A local-install measurement** | The entry where the grant is enormous and the containment available-but-unused. It cannot be produced from a hosted container; the tool is the deliverable for it |
| **Blind-spot deltas** | They need two agents against a common reference. Two entries exist, measured by one agent |

## Honest tensions

| Tension | Note |
|---|---|
| Four releases in three days | Fast because the register is files and the pack is markdown — and nothing here has met a user, a stranger's agent, or an adversary |
| The register is ten-elevenths fixtures | Which is what makes it teachable and what makes every demonstration on it unaccountable. One real enrolment changes that ratio and the argument |
| A build record written by the builder | Every row names a fetchable artefact so a reader can check the claim rather than take it — which is the only mitigation available and is not the same as an audit |
| Recording defects in one's own tools | It is the estate's discipline and it makes the deliverables look weaker than a quieter write-up would. That is the intended trade |

---

*Added to the pack after documents 00–07, 26 August 2026. Nothing above them was rewritten. The registry pack's change control carries C33, which supersedes its own status claim in light of §1.*

*CC BY 4.0.*
