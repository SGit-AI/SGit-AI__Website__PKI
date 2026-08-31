# 11 · The broker market

*Part three — Who pays, who rates, who backs the claim*

---

Chapter 9 ended with a rule looking for a market: any party claiming to reduce somebody else's exposure should carry cover against being wrong about it. Memo 6 supplies the market. Access and execution brokers for agents — products that hold the credential, narrow the action, return a receipt — are emerging, and their commercial case is precisely the reduction they produce:

> the practical and the business case for deploying these brokers is that they reduce the insurance level of a particular deployment

*Stated* — memo 6, verbatim. And the claim's problem is the corpus's oldest concept arriving in a new channel. *Use our product and your exposure drops* is an assertion of authority nobody granted — and it binds anyway, because the buyer acts on it. That is **apparent authority**, the thing this whole estate exists to make visible, showing up not in the agent channel but in the vendor channel.

Two mechanisms convert the assertion into something checkable, and the memo demands the first itself:

> they should actually have an insurance policy at their end that will underwrite any mistakes

*Stated.* A broker carrying its own policy turns marketing into warranty: a vendor who is wrong pays, so a vendor who is wrong has reason to be right. The doctrine adds the second, sharper mechanism:

> A broker's claimed level reduction is computed by the rating method, never by the broker

*Stated* — doctrine 06, GM-D58. Otherwise each vendor measures its own reduction favourably and the number is marketing wearing arithmetic — chapter 8's separation rule, in a channel it did not anticipate: not the deploying team this time, but the vendor selling to them.

## The correction: a broker changes the shape, not the size

This chapter contains the corpus's most instructive self-correction. Doctrine 03 had priced a broker cleanly: its value is exactly how much structural delta it converts to elective. True — and incomplete, and memo 6's own example is what breaks it. Interposing a broker **removes reach from one tree and adds a party with reach of its own**: the platform credential moves from the agent to the broker; the agent narrows to what the broker permits; and a new node appears that sees every request, holds a credential reaching everything the agent used to, and — if the broker is SaaS — carries decisions across the organisation's boundary.

> The rating nets what a broker removes against what it adds, and the net is not automatically negative

*Stated* — doctrine 06, GM-D59. A SaaS broker that narrows platform access while routing every request through a third party has *moved* exposure, not removed it. An in-environment broker with no egress is a different proposition and a different rating — which makes **deployment topology a first-class rating variable**, and among the more computable ones: *does a decision leave the boundary* is a question a twin can answer. The memo saw this itself, contrasting the centralised SaaS broker with one that runs inside the environment, locked down, no internet access.

*Drawn.* The correction was recorded in *both* documents — the one that was wrong and the one that found it — under the corpus's rule that a correction only one document knows about is not a correction. That practice, more than any individual claim, is what this book means when it calls the corpus auditable.

## Systemic, and therefore not optional

The broker's rating has a property no other placement's has:

> A broker's mis-rating propagates to every customer whose level it reduced.

*Stated* — doctrine 06. It is chapter 5's correlated-risk problem in its most concentrated form — one node shared by every placement that trusted it — and the reason the broker's own policy is not a nice-to-have. The estate's earlier service-twin work had already warned that a broker becomes the highest-value target because it must hold usable credentials; the rating vocabulary sharpens that from a warning into a structural fact.

## A transitional market, entered anyway

The memo names the gap that makes the market exist:

> ideally the permission should be done dynamically, the grant should be done dynamically, and we should be using PKI and other authorization models and other modes to operate

*Stated.* So: **the broker market exists because dynamic, checkable, PKI-backed authorisation does not.** Two consequences point opposite ways, and the doctrine says both. It is the clearest commercial argument for the register — if the primitive existed, a category of intermediary would be less necessary. And the broker market is transitional by construction: a vendor whose product is *we absorb the complexity the platform imposed* is betting the platforms stay that way. Worth knowing on both sides of a sale — and not a reason to avoid the market, since the transition may be long.

*Drawn.* The chapter's last word belongs to the shared method, because it is what makes any of this a market rather than a shouting match: a buyer cannot weigh broker A's claimed two bands against broker B's claimed three if they were computed differently. Comparability is what the connective-tissue position of chapter 14 sells — the party defining the disclosure format decides what *good* is measurable as, while carrying none of the capital. Whether any broker submits to having its headline number computed by someone else's method is an open question; doctrine 06's does-not-prove lists it first.
