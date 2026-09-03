# Vault Topology: Three Vaults, Who Holds Which Key, And The Pilot Where One Session Holds Them All

**pack** Insurance Ecosystem · draft-1 · 3 September 2026
**role** Which vaults exist, why each capability tier was chosen, what the pilot relaxes and how the relaxation is lifted without a schema change. The inventory decided most of this: there is no board application to inherit, and the messaging vault is a lane.

---

## The three vaults

| Vault | Holds | Written by | Read by | Why it is separate |
|---|---|---|---|---|
| **policies** | One folder per subject; one dated file per policy version; `current.json` a pointer | The **issuer** | Everyone with the read key, including every session at start | A policy is authored by one party and read by all; mixing it with the ledger would give the writer of usage the power to change the terms |
| **ledger** | Usage events, draws, refusals, escalations, requests, decisions | Every **insured** (events, requests); the **approver** (decisions); the **maintainer** (drain marks) | The **maintainer** and the **auditor** | The claims file. Its writer must not be able to read others' usage or delete its own — which is the lane's shape, and the folder's shape until the lane is wired |
| **room** | `index.html`, `app.json`, `content.json` (derived), a snapshot of the policies it rendered | The **maintainer**, on every drain | Anyone with the **read key** — this is the vault that gets shared | The rendered state is derived and disposable; regenerating it from the ledger must always be possible, so it never holds anything the other two do not |

Three, not one, because the three have different writers and the separation is what will later become the key split. Three, not more, because the policy is a document (not a credential, so not the key-vault pattern) and the instance — which environment, which mandate, which delta — already lives in the risk product and is referenced by hash ([IE-D2](99__change-control.md)).

```
   ISSUER ──write──▶ policies ◀──read── every session at start
                                 ◀──read── room builder

   INSURED ──append──▶ ledger ◀──enum── MAINTAINER ──write──▶ room ◀──read── anyone
   APPROVER ──append──▶ ledger                                  ▲
                                                                │
                                              AUDITOR ──read────┘ (and the ledger, with the enum key)
```

## The capability tiers, and why each

sgit gives every vault a **vault key** (read and write), a **read key** (derived, one-way, read only), and — through append lanes — an **append token** (write only, blind) and an **enumeration key** (list, fetch, mark-processed). Server-side access is gated separately by an access token. Each vault uses the smallest tier that does its job:

| Vault | Tier for writers | Tier for readers | The property bought |
|---|---|---|---|
| policies | Vault key, held by the issuer only | Read key, published to every session | A session can read its terms and cannot change them |
| ledger | **Append token per session** (the lane); enumeration key for the maintainer; vault/write key for the issuer only (configure, purge) | Enumeration key | A session can record its usage and can neither read anybody else's nor delete its own; the blind acknowledgement means it cannot learn how much cover is left by writing |
| room | Vault key, held by the maintainer | **Read key, shared** | The watchable surface is read-only by construction and holds nothing derived-from-nothing |

**The blind acknowledgement is load-bearing beyond tidiness.** An insured that could infer remaining cover from the lane's response would treat the buffer as capacity. It cannot: the write returns `{"ok": true}` and nothing else. What the insured knows about its balance it learns from the **briefing** at session start and from the **verdict** on each event — both computed by an evaluator that reads the ledger with a key the insured does not hold.

## The pilot relaxation

The project lead's instruction for the pilot: *as long as you've got the vault key, you will be able to make changes … in any of the vaults … let's not worry about [integrity] for now.* Applied:

| Design | Pilot | Detects a violation by |
|---|---|---|
| Three vaults, three key sets | **Three vaults, one key set**, handed to any session in chat (never written into a vault) | — |
| The ledger is a lane; the writer cannot purge | The ledger is a **folder of files that are only ever added** (`ledger/events/`, `ledger/requests/`, `ledger/decisions/`), each file named by timestamp and id, never rewritten | `sgit history log --file <path>` shows two commits for a file that should have one. sgit is content-addressed and append-only; a rewrite is a second object, visible forever |
| The insured cannot read others' usage | It can. Nothing depends on it not being able to in the pilot, because the *briefing* already tells it what it needs | — |
| The maintainer alone derives balances | Any session can run `tools/room.py`. The derivation is deterministic, so two sessions produce the same room | Two room commits from one ledger state differ → a bug, not an attack |
| The issuer alone writes policies | Any session can. A policy file carries its issuer field and (later) a signature; the pilot trusts the field | A policy without a superseded predecessor, appearing mid-interval, is visible in the vault's history |

**What the relaxation keeps unchanged:** every file shape, every folder name, every workflow step. The pilot's `ledger/events/2026-09-03T10-41-07Z__a3f8.json` is exactly the payload that the lane's `write` will carry; the drain runbook that copies lane files into `ledger/events/` is the only step that does not exist yet. That is the design constraint that makes the pilot honest: **turning integrity on is a change of where things run, not what they say** ([IE-D3](99__change-control.md)).

## Addressing and naming

- Vaults are created with `sgit init` in an empty folder, named `insurance-policies`, `insurance-ledger`, `insurance-room`, and pushed to the default remote (`https://dev.send.sgraph.ai`) with the access code the human gives in chat. `sgit vault info` prints the vault key, the read key and the web URL; the **read key** of the room is what is shared.
- Inside the ledger, every event file is `events/<UTC timestamp, colons as hyphens>__<8 hex>.json`. Sortable, unique, and the same shape the lane assigns (`{epoch_ms}_{24-hex}.enc`) once the lane is wired: the drain renames on the way in and records the lane's id in the event.
- Inside policies, `<subject-slug>/<policy-id>.json` and `<subject-slug>/current.json` holding `{"current": "<policy-id>"}`. A superseding policy adds a file and moves the pointer; nothing is deleted.
- The room's `content.json` carries `generated_at`, the ledger commit it was derived from, and the sha256 of every policy it rendered — so a screenshot of the room is a claim about a named ledger state.

## The lane, when it arrives (build-order step 7)

One append lane on the ledger vault. The issuer configures it once with the write key: `append_anchors` = one sha256 per session's `append_token`; `enum_key_hash` = the maintainer's key. Each session is handed its token in chat at start (never written into any vault). It writes events with `POST /api/vault/append/write/{vault_id}` — account-less, blind. The maintainer lists with `include_content: false`, fetches by id in batches of at most 100, writes each into `ledger/events/`, marks processed, and purges `processed` after the ledger commit is pushed.

**Limits to design against, from the published reference:** 5 MB per write (an event is under 1 KB); **1,000 pending files per token** — the binding one, and why the drain is an obligation; 100 ids per batch; 3 MB inline content when listing (never list with content); page size 50 by default, 200 at most.

**The one thing the reference does not state:** whether a lane with no registered anchors accepts any token holder. The 19 August brief says registered anchors *decide which senders a lane accepts*. This pack **assumes no anchors means no writers** and registers an anchor per session, so the assumption is never load-bearing ([IE-D6](99__change-control.md)). The implementing session should confirm with one write against an unconfigured lane, and record the answer in change control either way.

## Retention

Draining is obligatory; purging is a policy nobody has set. Proposed ([IE-D7](99__change-control.md)): the lane holds nothing after a drain (purge `processed` once the ledger commit is pushed); the ledger vault holds everything forever, because it is the loss data and the whole point; the room holds only the current derivation and the previous one. The number to revisit is the ledger vault's size at a year, which the room's fifth card shows.

## What this does not decide

- **Whether the three vaults are one vault with three folders.** They could be, for the pilot, since one key opens all three. They are kept as three because the key split later is a *file* change if the vaults are already separate and a *migration* if they are not.
- **Who holds the ledger's enumeration key when the maintainer is a session.** A session-held key is a session-scoped identity, which the registry pack already found to be the wrong lifetime for anything that must outlive a container. Deferred with the key split.
- **Whether the room is public.** The read key can be shared with anyone; whether it should be is the project lead's call, and it decides whether the room's cards may carry policyholder names.

---

*CC BY 4.0.*
