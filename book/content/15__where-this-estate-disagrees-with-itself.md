# 15 · Where this estate disagrees with itself, and what it does not say

*Part five — Honesty, and a first step*

---

This chapter is findings rather than exposition, and every one of them was **computed rather than recalled** — by fetching the files and comparing them, not by remembering what the packs say. Both sides of every contradiction are quoted, so you can decide whether I have read them fairly.

A four-day-old estate should expect a longer list than an older one, not a shorter one. Here is the list.

---

## Part A — Contradictions

### A1 · The normative signature recipe fails on every statement in the register

The most consequential finding here, because it is the one that would stop somebody's verifier working.

`registry/params.json` is the file the register names as the authority on its own formats. It says:

> `"algorithm": "ECDSA P-256 with SHA-256, DER-encoded, base64"`
> `"sign": "openssl dgst -sha256 -sign private/sign.pem payload.bin | base64"`

`registry/llms.txt` says something different:

> base64 of RAW r||s (64 bytes), ECDSA P-256 over SHA-256 — sgit's format, chosen for Web Crypto interop: a browser can verify these statements with no conversion

Both *stated*. They cannot both be right, so I ran them:

```
$ jq -r '.sig' $R/02__mandate__pr-create__to-agent-a.json | base64 -d | wc -c
64

$ # A: params.json's recipe, taken literally — treat the signature as DER
$ openssl dgst -sha256 -verify $R/public/sign.pem -signature sig.asis payload.bin
Error verifying data

$ # B: llms.txt's recipe — raw r||s converted to DER first
$ openssl dgst -sha256 -verify $R/public/sign.pem -signature sig.der payload.bin
Verified OK
```

Sixty-four bytes is raw `r||s`. DER would be seventy or seventy-two. **`llms.txt` is right and `params.json` is wrong**, and the `sign` command `params.json` publishes would produce signatures the register's own validator rejects.

This matters more than a documentation slip because of what `params.json` is for. It carries a refusal rule — *a verifier that does not implement this canonicalisation version must refuse the statement rather than guess* — which tells an implementer that this file is the specification. An implementer who trusts it fails on all twenty-three statements and has no way to tell whether the register or their code is at fault.

The file does carry a hedge, in a different field: *reconciliation with `sgit pki` fingerprints is an open item.* That flags fingerprints. The signature encoding is stated flatly and is wrong.

### A2 · The estate's own delta block authors part of a grant

Chapter 11 introduced this; here is the evidence.

The pack's first and self-described load-bearing correction, GM1:

> a hand-written grant file is a wish; it records what somebody believed on the day they typed it, which is the thing a grant is not.

The delta block in the gallery describes itself, in its own docstring:

> `"""Recomputed here from the two documents, never stored."""`

Both *stated*. The generator that produces it contains:

```python
observed = ["claude/registry-mvp-brief-hpbap8", "dev", "main"]
excess = [b for b in observed
          if not any(fnmatch.fnmatchcase(b, p.replace("**", "*")) for p in pats)]
```

The mandate side is genuinely read from the signed document. The grant side is a literal. And `main` appears **nowhere** in the library entry the block claims to be rendering:

```
$ grep -c 'main' packs/grant-and-mandate/library/claude-code-remote__ccr-container__2026-08-26.json
0
```

So the gallery's excess-authority row names a branch the measurement never observed, in a block captioned *recomputed from the two documents*, in a pack whose first rule is that grants are discovered rather than authored. It is one row in one gallery and it is the estate's own rule broken by the estate's own tool.

### A3 · The shortfall column is a hardcoded string

Same generator, immediately below:

```python
<div class="gm-delta__col gm-delta__col--shortfall">
  <div class="gm-delta__head">shortfall &mdash; mandate &minus; grant</div>
  <div class="gm-delta__body"><div class="gm-delta__none">none observed &mdash; the
    mandate asks for nothing the grant lacks</div></div>
</div>
```

There is no computation. *None observed* is a literal, rendered beside a computed excess column, under a caption saying the block is recomputed on render.

The estate is not unaware that shortfall is hard. The lexicon says it is *harder to detect, because it needs the mandate enumerated against real capability names*, and Chapter 15's absence A9 is that the capability vocabulary does not exist. So there is a good reason the column is empty.

**The finding is not that shortfall is uncomputed. It is that an uncomputed thing renders identically to a computed one**, in an estate whose own rule is that `unknown` must never render as absence. The gap renders as a finding of *no gap*, which is the one thing it definitely is not.

### A4 · The release that documents the refusal cannot reproduce it

Chapter 10 has the full account. At tag `v0.1.28` — the release whose notes document the acceptance test — `current.json` is already mandate **v2**, which permits `dev`:

```
$ python3 …/mandate.py check-branch dev …/mandates/current.json    # at v0.1.28
PERMIT   dev  (mandate v2, allow=['claude/**', 'dev'], expires 2026-12-31T00:00:00Z)
```

The refusal is only reproducible against `mandate-v1.json`, also present at that tag.

This is a structural consequence rather than an error: the control refused the release carrying its own documentation, so the mandate had to be amended before the release could exist. It is recorded here because a reader re-deriving Figure 8 from the tag will otherwise conclude the estate fabricated it.

### A5 · Two files disagree about how many things are on the bench

```
$ grep -c '^## ' bench/llms.txt
7
$ grep 'are built and running' bench/llms.txt
# 5 of 7 are built and running.

$ grep -A3 'The bench — MVPs' llms.txt
Six entries, five of them built and running — the register, the mandate hook, grant
measurement, the building blocks, the assessment, and the synthetic-reader programme.
```

The bench ships seven entries. The site's front door says six, and its list omits the seventh, which is **this book**. The book was added to the bench at v0.1.33 and the front door was not updated.

Small, and worth including for two reasons. It is the estate's machine-readable front door, which is the file an agent reads first. And the missing entry was the one whose `does_not_prove` list began *That any of it is written.*

**Fixed by the release that publishes this book.** `llms.txt` now says seven, names the book, and carries a parenthesis recording that it said six until v0.1.36 and why. This is the only one of the twelve that the writing of this book closed rather than merely recorded, and it is included at its original size rather than upgraded: it was a stale count in a front door, the fix took one paragraph, and the interesting part is not the error but that it took an outside pass over the estate's own machine surfaces to notice a file disagreeing with the file it points at.

### A6 · The build record undercounts the pack it is inside

Document 08 states:

> Eight documents plus a change-control appendix now running to **sixteen corrections and twenty-nine decisions**.

*Stated,* and accurate when written. Today:

```
$ grep -oE '\bGM[0-9]+\b' …/99__change-control.md | sort -u | wc -l
18
$ grep -oE '\bGM-D[0-9]+\b' …/99__change-control.md | sort -u | wc -l
32
```

Eighteen and thirty-two. The build record also says *eight documents*; there are ten plus the appendix.

This is the supersede-never-rewrite discipline behaving exactly as designed — the document was true when published and is not edited. It is included because the same page argues that a corpus recording only corrections *will drift into believing it built more than it did — and, in this case, less*, and the document making that argument is itself two releases behind on its own numbers.

### A7 · The briefing zip understates the pack by eleven corrections and twelve decisions

The readiness report found this at v0.1.25 and it is still true. The zip's README:

> **The appendix now runs to twenty-three corrections and thirty-six decisions, and roughly a third of the decisions are open.**

*Stated.* The registry pack today carries **thirty-four corrections and forty-eight decisions**. The report's judgement stands unamended:

> **Regenerating the zip on release is a build step, not a decision**, and until it is one the artefact designed to onboard fresh sessions is the least current thing in the pack.

*Stated.* The gap has grown from nine decisions to twelve since that was written.

### A8 · The specification still points implementers at the superseded record model

The readiness report's most consequential finding, and the estate agrees it stands. C34 records:

> **The REP still points a fresh implementer at the superseded form**, and the cheapest fix remains one sentence at §2 saying which half is current.

*Stated,* and verified today. REP-0001 §2 still normatively specifies `seq` and `prev` with MUSTs:

```
$ grep -n 'seq' packs/registry-mvp/src/91__rep-0001.md | head -3
 98:  "seq": 7,
107:- `seq` **MUST** begin at 1 and increase by exactly 1 with no gaps.
108:- `prev` **MUST** be `null` at `seq` 1 and otherwise the hash of the preceding statement file.
```

And the register, built to C7's commit graph instead:

```
$ for f in registry/records/*/*.json; do jq -r 'if has("seq") then "HAS" else "no" end' $f; done | sort | uniq -c
     23 no
```

Twenty-three statements, none carrying `seq`. The one document the briefing tells implementers to build from specifies a model with MUSTs that the shipped register does not implement in a single statement.

### A9 · The client workflow polls the file the specification forbids relying on

Also from the readiness report, also still open:

```
$ grep -n 'index.json' packs/registry-mvp/src/03__workflows.md
71:curl -s https://pki.sgit.ai/registry/index.json | jq '."sha256:<signing fp>"'

$ grep -n 'MUST NOT.*index.json' packs/registry-mvp/src/91__rep-0001.md
179:A verifier **MUST NOT** rely on `index.json` for any step.
```

Document 03 is the page the pack says a fresh session follows. The fix the report proposed — change the curl to the record path — has not been made.

### A10 · A published library entry contains a field the estate knows is false

`library/github-actions-runner__ci__2026-08-26.json`, node n1:

```json
{ "id": "n1", "tier": "boundary", "control": "the OS user separation",
  "SUPERSEDED_BY": "see interpretation.finding_1 — this tier label is WRONG, and node n1a is the proof" }
```

Chapter 11 argues this is the estate at its best — a rendering rule demonstrated against data that is wrong is a test rather than an assertion. It is listed here as well because both things are true: the library, which is the falsifier that makes self-reports checkable, contains a tier label its own owner has marked WRONG, corrected only at render time. Anybody consuming the JSON rather than the gallery gets the wrong tier.

### A11 · One library entry has no worst path

```
$ jq -c '.worst_path' library/claude-code-remote__ccr-container__2026-08-26.json
["n1","n2","n3"]
$ jq -c '.worst_path' library/github-actions-runner__ci__2026-08-26.json
null
```

The block specification requires that **the worst path is highlighted** rather than left for the reader to trace. Entry two is the environment with passwordless escalation to root and unrestricted egress, and it is the one with no worst path recorded. The tool-generated entry is missing the field the hand-assembled one has.

### A12 · The release history and the repository date six releases differently

Six of the site's thirty-five releases carry a page date earlier than the tag's commit date, v0.1.25 by four days. Chapter 14 covers the reason — the page dates the work, git dates the release — and it is listed here because *eight releases in four days* and *eight releases in forty hours* are both derivable from this estate's own artefacts.

---

## Part B — What this estate does not say

Contradictions are cheap to find. Absences are the ones that decide what the estate can become, and these are named rather than counted.

### B1 · There is no capability vocabulary

`registry/capabilities.json` is a fixture set, v0. *What a capability name is* is blocking question Q3, still open, and the readiness report argues the filing is wrong:

> Decision 6 reads *First capability (`repo.pull-request.create`) — open, awaiting project lead*, which frames the gap as *which one do we do first*. Section 4's Q3 argues the gap is *what is a capability name*, and that it sits under excess authority, not only under the shortfall the pack already flags.

*Stated.* And the report catches the estate in an inconsistency about its own gap: the pack says the missing vocabulary blocks shortfall entirely, while treating `grant − mandate` — *the same kind of set operation over the same undefined type* — as computable and rendering it as a number on two screens. **Either both are blocked or neither is.**

This is the largest absence in the estate. Every delta in this book is a set operation over a type nobody has defined.

### B2 · The lane-anchors question is unanswered, and it may invalidate the enrolment design

Chapter 3 has it in full. One experiment against a test lane would answer whether an append lane with no anchors accepts any token holder. If it does not, the bootstrap trap is restored at exactly the point the estate says it is broken, and phase 2's acceptance test cannot pass. Nobody has run it.

### B3 · `mandate − grant` is defined and has never once been measured

The shortfall is defined in the lexicon, argued to matter as much as excess, given a column in the delta block — and the column is a literal string. There is no instance of a computed shortfall anywhere in this estate.

### B4 · No identity in the register has a place for its private half to live

Chapter 8's finding. Four roles are costumes anybody can wear. Six are fixtures with published keys. One is real and session-scoped: its private half lived only in an ephemeral container that has since been reclaimed. **The design's central case — an identity whose private half has a good place to live — has zero instances**, at the root and at every subject.

### B5 · No blind-spot delta has ever been computed

The most persuasive number in the flow, per the leading brief. It needs at least two agents against a common reference. There are two entries and one agent, and the three-term block renders with its middle column deliberately empty.

### B6 · Nothing here records what anything did

Chapter 1's fourth row. Identity, mandate and delta are all statements about *permission*. The receipt — what the agent actually did — is named as the execution broker's job and is not built, not specified in any pack, and not represented anywhere in the register's five statement types.

### B7 · Nobody outside the project has been asked whether this is needed

The estate's own doctrine appendix rates it against forty Wardley doctrines and reports the shape of the result as the finding: strong exactly where a documentation-heavy solo effort can be strong alone, weak on every doctrine that needs other people. It records that *"nobody outside the project has been asked whether this is a need"* and *"REP-0001 has no sponsor"* are the same doctrinal hole in two places.

One outside session has ever read this material cold. It produced the readiness report, and six of the <!-- gen:stat:contradictions -->12<!-- /gen:stat:contradictions --> contradictions above are findings from that single reading — three of which it found and are still open.

*Drawn.* That ratio is the most useful number in this chapter. **One outside reader, one pass, produced half the open contradictions in an estate that reviews itself continuously and has recorded fifty-two corrections across two packs.** Not because the internal review is weak — it is unusually rigorous — but because it is the same reader every time. The estate's own doctrine appendix says asking five operators is a Phase I fix rather than a nice-to-have. On this evidence it is the highest-yield thing available, and it has not been done.

---

## What this chapter is worth

<!-- gen:stat:contradictions -->12<!-- /gen:stat:contradictions --> contradictions and <!-- gen:stat:absences -->7<!-- /gen:stat:absences --> absences, from an estate that is <!-- gen:stat:release_hours -->40.0<!-- /gen:stat:release_hours --> hours old in its current form and has published <!-- gen:stat:releases -->44<!-- /gen:stat:releases --> releases in <!-- gen:stat:site_days -->10<!-- /gen:stat:site_days --> days.

*Drawn.* I want to say plainly what I think this list means, because there are two wrong readings available.

The first wrong reading is that the estate is careless. It is not. Almost every contradiction above is a *dated document remaining honest about when it was written*, which is the estate's stated discipline working. A5, A6 and A7 are all the supersede-never-rewrite rule producing exactly what it is designed to produce.

The second wrong reading is that this proves the discipline works, so nothing needs doing. That is not right either. Three of these — A1, A2 and A3 — are not stale documents. They are **current artefacts that contradict the estate's own load-bearing rules**: a specification that fails against its own data, a grant partly authored inside a generator, and a gap rendering as a finding. None was caught by the estate's review process. A1 and A2 were found by running the thing rather than reading it.

Which is the same lesson Chapter 9 drew from the four measurement findings: **every defect in this estate found so far was found by executing something, and none by reading.** That is not an argument against the review. It is an argument that a corpus this careful has already extracted most of what reading can give it, and that the remaining yield is in gates, experiments, and outside readers — the three things it has least of.
