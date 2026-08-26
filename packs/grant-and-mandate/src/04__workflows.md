# Two Paths, Both Specified: The Person Walks Screens, The Agent Fetches Documents, And Only One Of Them Reads A Page

**pack** Grant and Mandate · draft-1 · 26 August 2026
**role** The user path and the agent path, which are different and must both be specified, because the agent is a primary consumer and every requirement it adds is invisible in a design review that looks only at screens.

---

## Why two paths

The memo is explicit: *we are as much talking to a user that's going to do this as we're talking to an agent.* A person navigates a rendered interface and accepts prohibitions they can read. An agent fetches structured documents, produces a structured self-report, and computes deltas — and reads no page anywhere. If the interface is where the data lives, the agent path does not exist. So the data lives in documents, and the interface renders them.

Both paths run the same three verbs — **discover, declare, diff** — in the same order, which is the ordering rule: reality, then facts, then the finding.

## The user path

```
   1  CHOOSE ENVIRONMENT   pick a library entry; see its measurement date
   2  DISCOVER (grant)     the measured tree, tiers, provenance, HISTORY field
                           + the self-report comparison: three terms, two deltas,
                             and "this agent reported N of M capabilities"
   3  DECLARE (mandate)    author the mandate AS PROHIBITIONS; the allow-list is
                           stored, not shown. Interval required
   4  DIFF (delta)         excess and shortfall, side by side — the product
   5  PACK                 references + mandate + deltas; what it discloses,
                           and that it is references rather than a description
```

The person never sees an allow-list to approve. Screen 3 is the trap the mockups document names: **showing a person an allow-list and asking them to approve it produces consent without comprehension.** Prohibitions are what a person can actually accept or refuse, so prohibitions are the presentation layer — generated from the allow-list, dated.

Reality before the risk register is enforced by the screen order: screen 1 is *which environment*, not *what is your risk appetite*. A risk appears nowhere in this path — risks are the risk product's, derived after the pack leaves here.

## The agent path

No screens. The agent is handed the machine-readable index and produces documents.

```
   1  FETCH        the library in ONE request (concatenated or archived)
   2  SELF-REPORT  produce a STRUCTURED grant self-report — schema first,
                   never prose, or the blind-spot delta is a judgement
   3  DIFF vs LIB  library − self-report = blind spots (measured, not argued)
   4  MANDATE      read a mandate the user wrote in prohibitions
   5  DIFF vs MAND self-report − mandate = excess; mandate − self-report = shortfall
   6  PACK         hand back references, not descriptions
```

Three requirements, none of them interface requirements:

- **One fetch.** An agent that cannot follow links can only use what one request returns, so the library is obtainable as a single concatenated document or archive. The constraint is harness-dependent and the mitigation costs nothing.
- **A document, not a rendering.** The agent's output is a grant document and a mandate document. The renderer is downstream.
- **Structured before compared.** The skill hands the agent the schema first. An agent asked to describe its grant in prose produces something incomparable, and the blind-spot delta stops being computable.

## The skill: discover, declare, diff — and never enforce

The skill an agent is given does exactly three things and refuses a fourth:

| Verb | Does |
|---|---|
| **Discover** | Runs the measurement; produces the grant document with provenance and tiers |
| **Declare** | Walks the person through authoring a mandate in prohibitions, storing the allow-list |
| **Diff** | Computes the delta; re-runs discovery to answer the drift question |

| Must not | Why |
|---|---|
| **Enforce** | A skill runs *inside* the agent's loop, so a skill that polices the mandate is the agent marking its own homework — the tier-three failure this whole exercise exists to expose |

**The skill compiles; the hook enforces.** That division is the entire architecture. Getting it wrong produces something that looks like a control and is an expectation — worse than nothing, because it would be believed.

## The compilation target, where enforcement actually happens

The mandate's allow-list compiles to two things, and the difference between them is the difference between a control and a wish:

- **A lifecycle hook** — the branch constraint compiled into a session-end check that refuses by exit code. It runs *outside* the agent's turn, so its exit code is not something the agent argues with. This is the first shipped artefact, and it is a few lines added to a hook that already exists.
- **Cedar** — the allow-list evaluated in a separate process, default-deny, outside the reasoning loop. Any mandate that compiles here inherits *evaluated outside the loop*; any mandate that compiles to a prompt does not.

```
   MANDATE (declared)   "push only to branches matching agent/*"
        | compiled to
        v
   HOOK / CEDAR         evaluated OUTSIDE the agent's loop, refuses by exit code
        |               or default-deny decision
        v
   EFFECT               the constraint moves from expectation to setting/boundary
```

## The acceptance test

> Give a fresh agent the machine-readable index and nothing else. It fetches the library in one request, produces a structured self-report of its own grant, computes both deltas against a mandate the user wrote in prohibitions, and hands back a pack containing references rather than descriptions. **No page is read by a human anywhere in that sequence.** Then compile one line of the mandate into the existing hook, attempt the prohibited action, and be refused by something that is not the agent.

The last sentence is the whole thing. Until it passes, everything above is instrumentation.

## Honest tensions

| Tension | Note |
|---|---|
| Two paths | The agent path is where the leverage is and every requirement it adds is invisible in a screen review |
| The skill that refuses to enforce | Architecturally correct, and the first thing somebody will ask it to do anyway |
| Compiling to hooks | Real enforcement available today — and only where somebody controls the environment, which is the population that needed it least |
| One fetch | Cheap to honour and easy to forget, which is why it is a stated requirement rather than a nicety |

---

*CC BY 4.0.*
