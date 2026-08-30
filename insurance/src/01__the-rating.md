# The Rating: What Is Scored, From What Evidence, And What Must Never Merge

*Doctrine document 01. Derived from memo 1 ([brief v0.33.72](../briefs/v0.33.72__strategy-brief__insurance-without-money-first-the-rating-is-the-product-and-micro-policies-scale.md)). Proposed, not adopted: GM-D38 to GM-D41 are in change control awaiting the project lead.*

---

## 1 · The ratable unit is a placement, not an agent

Memo 1's own examples decide this, and it is worth making explicit because it changes what the object is:

> the insurance for Claude running on a desktop under a user identity should be higher than the insurance of Claude running on the web

**The same model is a different risk in a different place.** Rating "Claude" is meaningless; rating *Claude, on this desktop, under this identity, with this credential reach* is the thing an operator can act on. So:

> **A rating attaches to a placement — an agent in an environment under an identity — not to an agent and not to a vendor.**

This is convenient rather than awkward, because a placement is exactly what the estate already measures. A library entry *is* a placement: the CCR container entry rates that container, not Claude.

It also fixes what the memo's *"micro insurances"* are micro **about**. Not smaller companies — **smaller units of assessment**: one placement, not one enterprise.

## 2 · Why the micro is now reachable, when it never was

Memo 1's diagnosis holds: cyber cover is bought at the entity. A company buys a policy; a project does not, a service does not, an employee does not. The exceptions — a footballer's leg, a pianist's hands — are exactly where an asset is singular, identified, and valuable enough to justify a human underwriter for one unit.

**The barrier was never principle, it was cost per unit.** Bespoke underwriting is expensive because assessing each unit required a person. An agent placement's assessment inputs are already machine-readable:

| An underwriter needs | For an agent placement, it already exists |
|---|---|
| Who is the insured | An identity in a register, with its class read before any signature |
| What can they reach | A grant, **discovered by measurement** rather than declared |
| What are they supposed to do | A mandate — issuer, subject, scope, interval, signed |
| What controls are in place | Enforcement tiers, **computed against the tree** rather than claimed |
| Is the survey current | The twin's age, printed |

**The marginal cost of rating one more placement approaches zero**, and that — not any change in insurability — is what makes the micro reachable. Memo 1's *"insurance in the past never really scaled, and I think now we are in a position where we can"* is right, for this reason.

## 3 · The two channels, which never merge

Memo 1 reaches for the wellness-insurance questionnaire — *do you smoke* becomes *do you have an incident response team, a security programme, a way to contain the agent* — and calls it how premiums should be calculated. The instinct is right and it collides with a rule this estate already holds:

> `library − self-report = blind spots`

**Every question in that questionnaire is self-reported.** "Do you have a way to contain the agent," answered *yes*, is a **declaration**. The pre-push hook found by `measure.py` is a **measurement**. Averaging them launders an assertion into a number.

| Channel | Source | Weight | The failure mode it carries |
|---|---|---|---|
| **Measured** | The twin: `measure.py`, the register, computed tiers | Full | **Under-reports.** A grant is a floor, not a census — what the measurer could not see is missing, not absent |
| **Declared** | The questionnaire; the agent card | **Discounted, and rendered as declared** | **Over-reports.** Nobody answers *no* to "do you have incident response" |
| **Unknown** | Neither | **Kept as unknown** | Scoring unknown as absent is the comfortable error, and it manufactures reassurance |

This is not new machinery. It is the estate's five evidence classes — `observed`, `read`, `documented`, `inferred`, `none` — applied to rating inputs. **The questionnaire is a declared-class fact collector**, and naming it that keeps it honest.

It also gives memo 1's *"the insurance then also will promote the idea of the card"* a precise meaning: **the agent card is where declared facts live**, and a declaration becomes checkable wherever a measurement exists to check it against. **The gap between the card and the twin is itself a rating input** — an operator who declares a containment control the twin cannot find has told you something.

## 4 · The placement variables, first cut

Memo 1's four comparisons, with the estate's reading of *why* each ordering holds. **These are the project lead's judgements, and none has been measured.**

| Variable | Ordering | Why, in this estate's vocabulary |
|---|---|---|
| **Identity the agent runs under** | Desktop under a *user identity* ≫ a scoped service identity | The grant becomes the **union of everything that user reaches**. This is the bootstrap trap as a rating variable: the workaround hands over a larger identity than the one being established |
| **Asset accretion in the account** | Months of accumulated data ≫ a clean account | Blast radius scales with reachable assets, and **time in an account is accretion nobody re-measures**. The grant was fixed at assignment; the assets were not |
| **Network egress** | Egress present ≫ none | Egress turns a containment boundary into a setting, and it is the path that makes every other exposure realisable rather than theoretical |
| **Surface** | Desktop ≫ hosted web session | Follows from the first three rather than standing alone — which is worth saying, because it means "desktop is riskier" is a *conclusion*, not an axiom |

**The estate cannot score its own leading example.** Its two library entries are a CCR container and a GitHub Actions runner; neither is a desktop or a browser session. Rating Claude-on-a-desktop requires measuring one, and nobody has. That is the cheapest next experiment available and it tests the memo's strongest claim.

## 5 · The aggregation problem

Memo 1 wants the micro to roll up: *"deal in the micro, which then goes to the macro... graphs of graphs of graphs."* The composition is the right ambition and it has a trap in it that the memo does not name.

> **Micro risks do not add.**

Five hundred placements rated individually and then summed or averaged will produce an estate rating that is **wrong in the dangerous direction**, because the risks are correlated: placements sharing a credential pattern, a base image, a model provider, or one misconfigured branch protection fail *together*. This is the oldest problem in the industry — it is why reinsurance exists, and why a flood book is not priced like a fire book.

**For this estate it is a graph problem, which is the good news.** Correlation is shared structure, and shared structure is a shared node. Two placements whose grant trees converge on the same credential node are not independent, **and the graph already says so.**

> **Aggregation reads correlation off shared nodes rather than assuming it away.**

That is a real contribution the graphs-of-graphs framing makes available and which no spreadsheet rollup would find. It is stated here as a rule and is **not implemented**.

## 6 · What the rating must ship with itself

From the rule in [document 00](what-this-is.html): a level nobody can recompute is theatre. So a rating is not a number, it is a small document:

- **The level**, on whatever scale is settled (open question — memo 1 says *"level three, level five"* without fixing a range).
- **The inputs**, each with its channel — measured, declared, or unknown — and a link to the artefact it came from.
- **The derivation**: which inputs moved the level, in which direction, by how much.
- **The twin's age**, because a rating computed against a stale measurement is a rating of the past.
- **What it does not prove**, inside the artefact, as everywhere else on this estate.

Which is very nearly the shape of `evidence-pack/v0` already emitted by [the workbench](../workbench/index.html) — one more argument that the rating is a new *terminal node* for the machine already built rather than a new machine.

## What this does not prove

- **That the orderings in §4 are correct.** They are judgements, and the estate cannot yet score the example it leads with.
- **That the two channels are weighted correctly.** That declared facts should be discounted is argued; *how much* is not, and no data exists to settle it.
- **That aggregation works.** §5 names the problem and states a rule; nothing implements it.
- **That any of this is insurance.** It is a rating. It transfers no risk.

---

*CC BY 4.0. Source: brief v0.33.72, memo 1 of 8. Everything here is derived from that memo and labelled where it extends it.*
