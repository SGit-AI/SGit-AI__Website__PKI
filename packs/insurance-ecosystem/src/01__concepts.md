# The Lexicon: Policy, Pool, Draw, Zone, And The One Word That Meant Two Things

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** The scoped vocabulary, in the graphs-site format the sibling pack adopted: each term defined by its edges rather than its label, with its source and its inverse where it has one. Question nine of the specification is settled in the entry for *mandate*.

---

## The ordering rule

Every term sits in one chain, and the chain is the constraint the grant-and-mandate lexicon already states — `reality → twin → facts → finding → risks → decisions` — with one more segment on the end that this pack adds:

```
   GRANT        what the environment can do          (measured)
   MANDATE      what it is expected to do            (authored, issuer-signed, interval)
   POLICY       what it may CONSUME while doing it   (authored against the mandate, issuer-signed, interval)
   METER        the counter the system already runs  (git, the transcript, the lane)
   EVENT        one reading of the meter             (appended, never edited)
   VERDICT      normal · drawn · refused             (a subtraction, in milliseconds)
   ZONE         below cover · drawing · outside      (derived from the verdicts of the day)
```

A policy written before a meter exists is a wish; a verdict without an event behind it is a judgement; a zone typed by hand is a lie. The graphs-site discipline applies: a node carries no inherent meaning, and what a term *is* emerges from the edges traceable from it.

## The terms

### Policy
**A pre-approved risk acceptance with a limit and an expiry**, denominated in a resource the system already counts. Mandate-shaped (issuer, subject, scope, interval — GM-D62), written *against* a mandate it references by hash, and carrying for each unit a **normal band**, a **per-occurrence limit** and a **pool**. Issued by an **issuer**, held by a **policyholder**, exercised by an **insured**. A policy is an artefact: identifier, hash, signature, never a keypair. Superseded, never edited.
*Inverse:* a draw *is-an-instance-of* a policy.
*Source:* memo 12, the 26 August architecture brief, doctrine 07.

### Unit
**A quantity with a named meter.** `commits`, `bytes_per_commit`, `pushes`, `bytes_per_push`, `tokens` (four counters), `vault_bytes`. A unit without a meter is refused by the schema, because a claim in that unit would need a judgement and a judgement does not settle in milliseconds. The ledger is generic on unit type from the first version (6 August, v0.33.56).

### Normal band · deductible
**What the insured may consume without drawing.** The excess in insurance terms, and the better name here: below it, nothing is recorded beyond the meter reading, and **silence is a requirement**.

### Per-occurrence limit
**The most one event may draw**, whatever the pool holds. The component memo 11 did not name and the one that stops one runaway spending everybody's buffer (GM-D93). Above it an event is **refused**, not drawn, and the refusal is an exclusion rather than an exhaustion.

### Pool · aggregate limit
**The shared buffer**, sized for the estate's worst week rather than the sum of every member's, and shared deliberately: when it is out, nobody draws, and that is the pool working (GM-D99). Carries a **reserve** (below) that the pool's arithmetic cannot reach.

### Interval · reinstatement
**The cover period, and the cadence at which the pool refills.** Every policy has an expiry (June: *the only variable is how long you accept it*), and every pool has a reset — a day, in UTC, stated (GM-D80).

### Draw
**A claim, paid in the resource, settled by the check itself** (GM-D97). An acceptance event carrying a named **acceptor**, a timestamp and an amount. Two modes:
- **Recorded** — proceeds, and the acceptance is written, attributed and dated. The default.
- **Requested** — the insured must ask; a named party approves; the action waits. Correct above a threshold the policy names.
A third mode, **silent overflow**, is forbidden by construction: an evaluator that decrements without writing is not this pack's evaluator.
*Inverse:* a pool *is-drawn-by* a draw.

### Verdict
**One of three words**, produced by a subtraction and nothing else: `normal` (inside the band), `drawn` (over the band, inside the per-occurrence limit, pool had enough), `refused` (over the per-occurrence limit, or the pool cannot cover the excess, or a request is waiting). The verdict function is the same at every decision point; only the unit and the meter change.

### Zone
**Where the insured stands today**, derived from the day's verdicts and never stored:

| Zone | Where | The risk that lives there | Owned by |
|---|---|---|---|
| **Below cover** | Inside the normal band | Ordinary operating risk | The policyholder, routinely |
| **Drawing** | Between band and limit | The exposure drawn, and its rating consequence | The policyholder, per draw, dated |
| **Outside cover** | Beyond the limit, exhausted, or excluded | **Operating without authorisation at all** | **Nobody, until somebody accepts it** |

The third zone is not a larger second: an insured past its limit is **uninsured**, and an unaccepted risk defaults to critical and escalates without anybody escalating it. So crossing that line writes an **escalation**, not only a refusal.

### Exclusion
**A hard cap on an irreversible loss.** Not the top of a buffer — the boundary of insurability. Bytes committed into history are paid by every clone forever, so the per-occurrence limit on `bytes_per_commit` is an exclusion with a reason attached, and the schema requires the reason.

### Reserve · catastrophe layer
**A tranche of the pool no automatic draw can touch**, released only by the issuer, for the correlated case — the day every team spends normally because normal changed. Idle capital by design; the first thing an efficiency review removes, and the difference between a bad day and an estate-wide stop.

### Correlation
**Whether draws across policyholders move together.** If they do, the pool is not diversified and its effective size is far smaller than its nominal one. Computed from the ledger from the first week, because the metric everybody builds instead is remaining balance.

### Experience rating
**A premium that rises after a draw**, landing on the **policyholder** (whose allocation shrinks) and never on the session (which is indifferent to the loss). The standard control for moral hazard, and here the only one that can work. The correct response to a pool drawn daily is to **raise the normal band and shrink the buffer**, not to enlarge the buffer.

### Ledger
**The claims file and the loss data.** One event per meter reading that produced a verdict other than silence, appended and never edited, generic on unit. In the pilot a folder of files; in the design an **append lane**. The balance is **derived** from it, never maintained, and never derived inside the insured.

### Lane · append lane
**A write-only channel attached to a vault**: an `append_token` writes and learns nothing (the acknowledgement is blind), an `enum_key` lists and fetches, a `write_key` configures and purges, and the private key decrypts and never leaves the owner. Six endpoints, shipped. The reason the ledger cannot be a shared vault: a write key grants purge, and an insured that can delete its own usage has no usage.

### Drain
**The obligation to read the lane and settle it into the ledger** before the 1,000-pending-per-token limit refuses the next write. In the pilot, a runbook the maintainer runs at least daily; in the design, the same runbook with an enumeration key nobody else holds.

### Room
**The vault app that renders the ledger and the policies as cards** — five of them — for somebody to watch. Reads only; writes nothing; shows the balance, the zone, the draw frequency, the correlation and the events, and above all shows **nothing at all** for a session that stayed below cover.

### Briefing
**The text a session is handed at start**: which policy governs it, today's balance, which zone it is in, what each verdict will do to it, how to request, and where the room is. Emitted by the evaluator; injected by a `SessionStart` hook.

### Repricing event
**A change in the world that changes what a policy is worth**: a vulnerability, a control that stopped existing, a grant that grew. Three responses, each a decision by the issuer, never automatic: **reprice** (the band moves), **coverage change** (a new exclusion), **suspension** (cover withdrawn pending remediation). Each produces a superseding policy that must be re-accepted.

### Grant
Unchanged from the sibling lexicon: **what the environment can actually do**, measured, dated, provenance per node. The union. June's *Agent Mandate* and *Authority Envelope* both name this object.

### Mandate — question nine, settled
**What the environment is expected to do**: authored, issuer-signed, interval-bearing, the narrow thing. **This is the only meaning of `mandate` in any schema that ships from this pack** ([IE-D9](99__change-control.md)). The 18 June naming brief recommended *Agent Mandate* for the union — the opposite object — and the collision is the expensive kind because both readings are plausible. August governs: it is later, it is what every document since 20 August uses, and it is the only reading that lets the delta be expressed at all. What survives from June: the passport critique (a passport is singular, static, limited, and about authentication), **Authority Envelope** as a prose synonym for the grant's outer boundary, **Blast Radius** for the consequence, and **power of attorney** as the explanatory analogy — *an agent acts on your behalf under delegated authority with a defined scope*, which is exactly what a policy prices.

### Parties
**Issuer** (writes and signs the policy; owns the numbers, the rate table and the reserve) · **Policyholder** (holds the allocation; the acceptor of every draw; where rating lands) · **Insured** (the session; spends; never accepts) · **Approver** (answers a requested draw; the policyholder or someone it names) · **Maintainer** (drains the lane, derives the balances, rebuilds the room) · **Auditor** (reads everything, writes nothing). In the pilot, one session holding the vault key may run any of them; [document 05](05__parties.md) says what each will be *prevented* from doing once the keys are split.

## Words this pack refuses

| Word | Why |
|---|---|
| **Insurer** | There is none. The absent external party is where regulation would sit, and any page that borrows the vocabulary says so |
| **Wallet** | Taken by the payments work; promises a held-credential model this design does not use |
| **Balance** as the headline | It is derived, it is the metric everybody builds, and it is the wrong one to surface first; draw frequency is |
| **Rate limit** | A per-agent ceiling set by somebody who cannot tell a spike from a runaway; the pool is what a rate limit cannot be — permissive per agent, bounded in aggregate |
| **Agent Mandate** | June's name for the grant. Retired in favour of *grant*, with *Authority Envelope* as the prose synonym |

---

*Added after publication, 3 September 2026, from memo 13 ([doctrine 13](../../../insurance/the-enforcement-ladder.html)). No term above has been changed.*

### Level of enforcement
**Where a verdict was produced**, on a ladder of six: 0 nothing · 1 the prompt · 2 a skill or system prompt · 3 a hook in the agent's own clone · 4 the destination · 5 out of band, after the fact. Levels 0 to 2 are *expectations*, 3 is a *setting*, 4 a *boundary*, and 5 is **detection** — a tier the control test had not named because it does not prevent, it finds out. Every `event/v1` carries its `level` (IE-D17).

### Assurance
**How reliably a level does its job, measured.** The catch rate per level on ordinary work, derived from the ledger, never asserted. A prompt's worth is a number; until the number exists the tier test's answer stands (IE-D18).

### Catch
**A verdict at a level above the one that should have refused.** Not a draw and not a volume event: it means the lower level was bypassed, uninstalled or broken. A catch is an *incident* — no pool, a different policy, an escalation, and a candidate for suspension of the licence to operate (IE-D19). The verdict word is `caught`, and it is level 4's and level 5's alone.

### Reconciliation
**Level five, as a job:** replay the system of record (git) against the ledger and ask, for every commit, whether the claim the hook should have written is there and agrees with the commit's weight. A commit that carries no claim is the detection. `tools/reconcile.py`; the maintainer's job (IE-D20).

---

*CC BY 4.0.*
