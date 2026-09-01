# The Broker Market: Who Backs The Claim, And What A Broker Actually Changes

*Doctrine document 06. Derived from memo 6 ([brief v0.33.77](../briefs/v0.33.77__strategy-brief__the-broker-market-is-driven-by-insurance-and-a-broker-must-carry-its-own.md)). Proposed, not adopted: GM-D58 to GM-D61 await the project lead. **This document corrects [document 03](who-pays-and-the-moving-rating.html) §6.***

---

## 1 · "We reduce your level by X" is apparent authority until something backs it

A vendor claiming *use our product and your exposure drops* is asserting authority nobody granted — and it binds anyway, because the buyer acts on it. **That is [apparent authority](../documents/grant-vs-mandate.html), the concept this whole corpus exists to make visible, arriving in the vendor channel rather than the agent channel.**

The broker carrying **its own policy** is what converts the assertion into a warranty: a vendor who is wrong pays, so a vendor who is wrong has reason to be right. Indemnities of this shape exist in the industry — most commonly for intellectual-property claims rather than security outcomes, which is exactly the gap this market would fill.

But the policy alone is not enough, and the sharper rule is:

> **A broker's claimed level reduction is computed by the rating method, never by the broker** (GM-D58).

Otherwise each vendor measures its own reduction favourably and the number is marketing wearing arithmetic. This is [document 02's](the-ecosystem-and-the-gate.html) separation rule — *a rating produced by the party that wants the answer is self-assessment* — in a channel it did not anticipate: **not the deploying team this time, but the vendor selling to them.**

It is also what [document 05's](not-in-line.html) *we define what a broker must be able to show* was for. **The disclosure a broker owes is the derivation of the reduction it claims.**

## 2 · A broker changes the grant's shape — it does not narrow it

[Document 03](who-pays-and-the-moving-rating.html) said a broker's value is *exactly how much structural delta it converts to elective*. **That is true and incomplete**, and memo 6's own SaaS example is what disproves it.

Interposing a broker **removes reach from one tree and adds a party with reach of its own**:

| | Before | After |
|---|---|---|
| The platform credential | Held by the agent; reaches every branch | **Held by the broker.** The agent narrows to what the broker permits |
| The broker relationship | Does not exist | **New nodes**: it sees every request, holds a credential reaching what the agent used to, and — if SaaS — carries decisions across the organisation's boundary |
| Egress | Whatever it was | **Possibly new** |

> **The rating nets what a broker removes against what it adds, and the net is not automatically negative** (GM-D59).

A SaaS broker that narrows platform access while routing every request through a third party has **moved** exposure, not removed it — and whether that is an improvement depends on the placement, not the product. An in-environment broker with no egress is a different proposition **and a different rating**.

**So deployment topology is a first-class rating variable**, and among the more computable ones: *does a decision leave the boundary?* is a question a twin can answer.

## 3 · A broker's rating is systemic

The service-twin brief warned that a broker becomes the highest-value target because it must hold usable credentials. In rating terms that is sharper:

> **A broker's mis-rating propagates to every customer whose level it reduced.**

Which is [document 04's](why-insurance-and-what-broke-it.html) correlated-risk problem in its most concentrated form — one node shared by every placement that trusted it — and the reason a broker's own policy is not optional (GM-D61).

## 4 · The case the delta taxonomy could not hold

[Document 03](who-pays-and-the-moving-rating.html) classified delta as **elective**, **structural** or **defect**. Memo 6 names a case none of them fits: the platform *does* offer the granularity, and makes it so complex that using it is impractical.

It is not structural — the grain exists. And calling it elective charges an operator full price for not adopting something that takes two quarters and a specialist.

**A fourth class is tempting and does not earn its place.** The cleaner fix gives the existing class a dimension it lacked:

> **Elective delta carries a cost to close.** *Latent* delta — offered but impractical — is simply its high-cost region (GM-D60).

That serves fairness and action at once. **A rating that treats all closable delta as equally the operator's fault is nearly as unfair as one charging for structural delta**, and it is less useful: *you could close this in an afternoon* and *you could close this in two quarters* are different instructions wearing the same number.

It also locates the product. A broker selling into **structural** delta sells capability the platform lacks. **A broker selling into latent delta sells absorbed complexity** — and that is the larger market, and the honest description of most of this category.

## 5 · The market exists because the primitive does not

Memo 6: *ideally the permission should be done dynamically, the grant should be done dynamically, and we should be using PKI ... that's not currently possible.*

> **The broker market exists because dynamic, checkable, PKI-backed authorisation does not.**

Two consequences, pointing opposite ways, so both are said:

- **It is the clearest commercial argument for the register.** If the primitive existed, a category of intermediary would be less necessary.
- **And the broker market is transitional by construction.** A vendor whose product is *we absorb the complexity the platform imposed* is betting the platforms stay that way. Worth knowing on both sides of a sale — and not a reason to avoid the market, since the transition may be long.

## 6 · Why a shared method is what makes the market

*Controls should be measured against the reduction of the policies* is [document 02's](the-ecosystem-and-the-gate.html) control-to-premium loop as a measurement principle. **The consistency requirement is the whole thing.**

A buyer cannot weigh broker A's claimed two bands against broker B's claimed three if they were computed differently. **A shared method is what makes vendor claims comparable, and comparability is what makes a market** — which is [document 05's](not-in-line.html) connective-tissue position earning its keep rather than merely being principled.

## What this does not prove

- **That any broker would accept this.** Computing a vendor's claimed reduction by an external method is a constraint vendors have not agreed to and would have reason to resist.
- **That cost-to-close is measurable.** §4 needs it and it is not readable from a twin — it is a judgement about effort, which under [document 01's](the-rating.html) two-channel rule must be marked **declared**, with all the weakness that carries.
- **That the netting in §2 can be computed today.** It requires a grant tree for the broker relationship, and no broker publishes one. The rule is stated; nothing implements it.
- **That indemnity precedent transfers.** Vendor-backed indemnities are commonest for intellectual-property claims; underwriting security outcomes is rarer, and the gap may exist for reasons other than nobody having thought of it.

---

*CC BY 4.0. Source: brief v0.33.77, memo 6. Everything here is derived from that memo and labelled where it extends it — including the correction to document 03.*
