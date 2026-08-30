# 5 · The delta

*Part two — The vocabulary, and why each word is load-bearing*

---

Two documents produce a third thing, and the third thing is the product.

The lexicon calls it the delta and defines it with a constraint attached, which is unusual for a definition and is the most important sentence in this chapter:

> **The finding, computed and never stored.** A stored delta is stale the moment either side moves; the interesting property is that it can be recomputed at any time (the same rule that keeps a register entry free of a history array).

*Stated.* Never stored. Not *should not be cached*, not *refresh periodically* — computed on demand, every time, and if you cannot compute it you do not have it.

## Why never stored

The reasoning is short and it generalises well beyond this estate.

A delta is a relationship between two moving objects. The grant moves when the vendor ships, when a setting changes, when somebody installs something. The mandate moves when a person decides something. Store the relationship and you have created a third object that is correct only when neither of the other two has moved since — and nothing tells you when that stops being true. It does not go wrong loudly. It goes quietly, remains readable, keeps its formatting, and answers questions with yesterday's answer in today's confident tone.

This is the same rule that shapes the register's record model. The pack's C7 correction moved a record from an accumulating hash-chained log to a file in a commit graph: current state in the object, history in the substrate, no `seq`, no `prev`, no history array. Same instinct, different layer — **do not store a thing you can derive, because the stored copy has no way to know it is wrong.**

*Drawn.* The packs treat these as two separate decisions. I think they are one decision applied twice, and stating it as one makes it portable: *derive what you can derive; store only what you cannot.* The register stores signed statements, which are facts about the past and cannot be derived. It derives current state, the excess-authority view, and the verification answer. Every one of those derived things is regenerable by anybody, from the same public files, which is also why none of them carries authority — and the register says so on each, in the file itself.

## Two directions, and the one everybody forgets

The delta is not a number. It is a pair of set differences pointing in opposite directions.

### Excess authority: `grant − mandate`

What the environment can do that nobody asked for. The lexicon's phrasing carries the whole argument:

> Blast radius measured from the other end, **unaccepted by construction**, defaulting to critical. The security direction.

*Stated.* *Unaccepted by construction* is the sharp phrase. Risk acceptance is normally something somebody does to a risk somebody else identified. Excess authority arrives already unaccepted, because by definition nobody decided it — if somebody had, it would be in the mandate and it would not be excess. The acceptor field is `null` not because the form was left blank but because the concept guarantees it.

*Blast radius measured from the other end* is the other half. The usual way to estimate blast radius is to imagine a compromise and reason forward about consequences, which is guesswork dressed as analysis. Excess authority reverses it: start from what the credential demonstrably permits, subtract what was authorised, and the remainder is the reachable-but-unintended set. It is a measurement rather than a scenario.

### Shortfall: `mandate − grant`

What was asked for that the environment cannot do. This is the direction that gets forgotten, and the pack insists on it:

> The operations direction — the agent fails and it looks like a bug. **It matters as much as excess**, because a mandate the grant cannot satisfy is what produces the next over-broad credential.

*Stated.* Follow the causal chain, because it is the reason a security document cares about an operations problem. A mandate authorises something the environment cannot actually do. The agent fails. The failure does not announce itself as a policy problem — it looks like a bug, gets triaged as a bug, and the fastest fix available to whoever is on call is to widen the credential. Nobody records that a mandate was wrong. What gets recorded is that permissions were insufficient, which is a sentence that produces more permissions.

**Shortfall is where the next excess comes from.** Which means a programme measuring only excess is treating the symptom and leaving the generator running.

The pack also says why shortfall is harder: it needs the mandate enumerated against real capability names. Excess can be computed against observed behaviour — you saw the agent reach forty-one repositories. Shortfall requires knowing what a capability *is*, as a type, so that you can ask whether the grant contains it. Chapter 15 records what this estate does about that, and the answer is uncomfortable: the shortfall column in its own rendered delta block is a hardcoded string.

## The third term, and the blind spot

Two terms are not enough, and the reason is the most persuasive argument in the pack.

An agent asked to report its own grant is both the instrument and the subject. It reports what it can see. It cannot report a capability it does not know it has. So a self-report is a **floor, not a census** — and, critically, it is *unfalsifiable alone*. Nothing in a self-report distinguishes a thorough one from a lazy one.

The leading brief sets out the fix:

```
   LIBRARY   ---minus--->  SELF-REPORT    = BLIND SPOTS
             what the environment is       what this agent noticed
             known to grant                it has, and did not report

   SELF-REPORT ---minus-->  MANDATE        = EXCESS AUTHORITY
             what this agent noticed        what was asked for
```

The library is a published dataset of measured grants per environment. Subtract what this agent reported from what its environment is known to grant, and the remainder is what it missed.

The brief calls this the argument for building the library at all — without it there is no way to tell a thorough self-assessment from a lazy one — and it says the number is the most persuasive in the flow: *this agent reported eleven of the nineteen capabilities its environment is known to have.*

*Stated,* and now the honest part, which the estate also states. **No such number has ever been produced here.** The three-term comparison block in the gallery renders with its middle column empty on purpose, because no agent has filed a structured self-report. The library has two entries measured by one agent, and a blind-spot delta needs at least two agents against a common reference. The most persuasive number in the flow is an illustration of a calculation, not a result.

*Drawn.* And there is a recursion in it the packs do not name. The blind-spot delta measures the agent as much as the environment — that is stated. But the library entries are themselves produced by an agent measuring an environment from inside it, under the same floor-not-census limit. So the reference against which self-reports would be falsified is a floor too. Blind spots computed against it would be *blind spots relative to what a previous agent happened to notice*, which is a weaker claim than it looks and is not the claim the phrase suggests. The fix is not more agents measuring themselves; it is at least one measurement taken from outside the environment, and nothing in this estate has one.

## Why it needs a third term at all

Step back from the arithmetic, because the shape is the point.

Two terms let you compare a claim against a claim. Three terms let you check one of the claims. The library is not a richer source of grants — it is the falsifier, and its whole value is that it was produced independently of the agent being assessed.

That is why the library belongs in the registry rather than in the risk product, which is Chapter 12's contract. A falsifier held privately by the party being assessed is not a falsifier. It has to be public, versionable, and shared, or the third term collapses back into the first.

## What the delta is not

**It is not a score.** The rule is absolute across the estate: no score, ever, because any single number averages tiers that must stay distinct. An excess capability sitting behind a boundary is a different finding from one sitting behind nothing, and one figure that combines them tells you neither. Document 09 puts the reason as a rule about what averaging destroys: it collapses `boundary`, `unknown` and `none` into one figure, which is the exact collapse the whole vocabulary exists to prevent.

**It is not a risk.** This is the ordering rule of Chapter 7 arriving early. A delta is a *finding* — a computed fact about two documents. Turning a finding into a risk requires an altitude, a language, and somebody's judgement, and that work belongs to the risk product. The registry's half of the chain ends at *finding*, and Chapter 12 draws that line explicitly so neither side builds the other's half by accident.

**It is not accepted.** Excess authority arrives unaccepted by construction. Acceptance is a separate node with a named acceptor and an interval, and it lives on the other side of the boundary in Chapter 12.

## The one row that exists

Everything above is scaffolding for a single published row, and it is worth ending on how small it is.

One subject. One grant statement recording `repo.contents.write` across 41 resources. One mandate covering `repo.pull-request.create` on 1. Excess: 40 resources, acceptor `null`, observed 2026-08-25.

One row, on a fixture subject, in a register where ten of eleven records have published private keys. The arithmetic is right and the arithmetic is the only thing here that is right. Chapter 8 walks the record it came from and Chapter 16 says what it is worth.
