# Parties: Six Roles As Runbooks, What Each Will Be Prevented From Doing, And The Pilot Where One Session Runs Them All

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** Who may issue, approve, draw, drain and audit; which of them already exist as people with responsibilities; what the key topology prevents once it is on; and the project lead's relaxation, applied honestly.

---

## The rule the specification sets

*Parties are people with existing responsibilities, not roles invented for a diagram*, and each is prevented from doing things **by key topology rather than by instruction**. The pilot keeps the first half and defers the second, on the project lead's word. So every role below has three columns: who it actually is today, what it does (a runbook a session can execute), and what the keys will stop it doing once they are split.

## The six

| Role | Who it is today | Runbook | Prevented, by key topology, once split |
|---|---|---|---|
| **Issuer** | The project lead, who set the numbers in memo 12 and owns the pool | Author a `policy/v1`; supersede one at a repricing event; release the reserve; own the rate table | Cannot append usage (holds no append token); cannot derive the balance for anyone else (the room is the maintainer's) |
| **Policyholder** | The pki.sgit.ai estate — the owner of this repository, which is where the pool lives | Hold the allocation; be named as acceptor on every draw; carry the rating consequence; name an approver | Cannot write policies (no vault key to `policies`); cannot delete usage |
| **Insured** | A session with the vault key, committing to this repository — today, the site agent | Read the briefing at start; work; let the hooks evaluate; **ask** when a draw is above threshold; **stop** the class of action when refused | Holds an append token only: writes usage and requests, reads nothing from the ledger, learns its balance only from the briefing and the verdicts |
| **Approver** | The project lead, until the policyholder names someone | Read waiting requests in the room; write a `decision/v1` | Cannot change the policy or the ledger's events; the decision is an append |
| **Maintainer** | A session under the maintainer runbook, run at least daily | Drain the lane (later); recompute balances; compute draw frequency and correlation; rebuild the room; push it | Holds the enumeration key and the room's vault key: reads all usage, purges nothing (the purge needs the issuer's write key) |
| **Auditor** | Anyone with the read key of the room, and the enumeration key of the ledger if given one | Read; recompute; disagree in writing | Writes nothing anywhere |

Two of these are existing responsibilities named in this estate's public comms: the **project lead** (issuer, approver) and the **site agent** (insured, maintainer). The **RiskMandate team** is not a party to a policy; it holds the instance the policy is written against. The **registry's operator root** signs mandates and, once the policy is a signed statement, would sign policies too — as a fixture today, which the sibling pack records as *enforcement real, authority not*.

## The pilot: one session, every role

The project lead, 3 September: *allow a session … to actually run things and make changes in any of the vaults … as long as you've got the vault key.* Applied:

| | Design | Pilot |
|---|---|---|
| Keys | Six roles, four key kinds | One key set per vault, handed in chat to whichever session is working |
| Who may act | Decided by the key | Decided by **which runbook the session is running**, stated in the event it writes |
| The same hand asking and answering | Impossible | **Allowed**, and recorded: a request names the insured, a decision names the approver, and the two fields may resolve to one session |
| Integrity | Prevented | **Detected**: sgit is append-only and content-addressed, so an overwritten file has two objects in history and `sgit history log --file` shows both |

What this buys is the thing the project lead asked for: **the workflows get exercised this week.** A session that runs out of cover can write its own escalation, put on the approver's hat, decide, and continue — and every step leaves the record the real topology will leave. What it costs is stated in the leading brief: every acceptance in the pilot is self-accepted, which is the one thing the economics say a draw must not be. The acceptor is still *named* as the policyholder, so the record is right even when the hand is the same.

## What each role must never do, key or no key

These are instructions, which is the weaker tier, and they are written down because the pilot has nothing stronger:

- **The insured never edits a policy, an event, a request or a decision**, and never writes a decision to its own request under the insured's hat. It changes hats, says so in the `by` field, and the record shows it.
- **The insured never edits the hooks or the evaluator to pass.** A refusal is a finding; the response is a request or a stop.
- **Nobody deletes a ledger file.** Retention is the issuer's policy and is executed by the issuer's purge, later.
- **The maintainer never types a balance.** It runs the derivation and commits what it produced, with the ledger commit it read.
- **The approver never approves a draw above the per-occurrence limit.** That is an exclusion; the answer to an escalation is an acceptance of the uninsured action or a suspension, and the amount is not the question.

## Where experience rating lands

On the **policyholder**, by construction: the insured is indifferent to the loss, so the discipline has to come from the party whose allocation shrinks. The rating rule in the policy is applied by the issuer at the period boundary, and its input is **draw frequency**, the third card. In the pilot the policyholder is this estate and the issuer is the project lead, so the first rating decision will be the project lead reading the room after a week and moving a number. That is the workflow, and it is enough.

## What this does not prove

- **That six is the right number.** It is the number the specification's verbs (issue, approve, draw, drain, audit) produce plus the policyholder the economics require.
- **That a session can hold a role over time.** A session-scoped identity dies with its container; the maintainer's enumeration key is the first thing that needs an identity that outlives one, and that is the registry pack's open question, not this one's.
- **That the pilot's self-acceptances mean anything.** They do not, as acceptances. They mean something as *workflow runs*, which is what they are for.

---

*CC BY 4.0.*
