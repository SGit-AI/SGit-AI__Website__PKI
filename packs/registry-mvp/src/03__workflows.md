# The First Client Is A Documented Workflow: An LLM Session Enrols, Fetches And Verifies With Nothing But The CLI And curl

**version** draft-1 (site-agent first pass — corpus version to be assigned on adoption)
**date** 20 August 2026
**from** The site agent
**to** Project lead, Engineering, Architecture

**type** Architecture brief (first pass)

*Fourth document of the registry MVP pack, and its centre of gravity. The MVP's client is not a program: it is a published page an LLM session follows. This brief writes the three workflows out in the copy-paste form the page will carry, states what each step proves, and marks the two places where the workflow depends on something not yet shipped.*

---

## What This Is

The registry's workflows written for their actual first user: **a hosted LLM session — a coding agent exactly like the sessions that built this site — holding no credential, given one URL, expected to end with a registered identity it can prove it controls.** If the workflows below cannot be followed by such a session from the published page alone, the MVP is not done, whatever else works.

Why this is the right first user, and not just a stunt: an LLM session is the *hardest easy case*. It has full tooling (shell, CLI, HTTP) but no standing state, no human at the keyboard mid-flow, no browser session to lean on, and it reads documentation literally. A workflow that survives that user survives almost anybody — and it is the user the whole site's thesis is about.

## Workflow One: Verify (Read Path — No Writes, No Credentials, No State)

The workflow to publish first, because it needs nothing from anybody:

```
# 1. the front door
curl -s https://pki.sgit.ai/registry/llms.txt

# 2. the trust roots and parameters
curl -s https://pki.sgit.ai/registry/roots.json
curl -s https://pki.sgit.ai/registry/params.json

# 3. a subject's record
curl -s https://pki.sgit.ai/registry/records/sha256:69d9b4835ccf790c/00001.json

# 4. verify the chain: seq contiguous, each prev = hash of the prior file
# 5. verify each signature: canonical bytes (jq -cS, sig removed) against
#    the signing key in the record's identity statement / issuer's record
jq -cS 'del(.sig)' 00002.json > payload.json
sgit pki import issuer-bundle.json
sgit pki verify payload.json --signature <sig> --fingerprint sha256:...

# 6. current state = last applicable statement, after revocations
```

What step 5 proves, exactly: the statement was signed by the holder of that private key. What it does not prove: anything about who that holder is beyond what a chain to `roots.json` asserts. The published one-liners travel with the workflow verbatim — *a signature proves possession, trust is a policy decision* — because the read path is where a casual reader will first conflate them.

**Dependency flag:** the exact `sgit pki verify` flags for detached signatures over stdin/bytes need confirming against the shipped CLI before the page states them; the page follows the site's rule — executed, not recalled — so writing this workflow *is* the first acceptance test.

## Workflow Two: Enrol (Write Path — The Bootstrap Gradient, Walked)

The bootstrap trap's gradient, as commands. Initial state: computation, randomness, nothing else.

```
# 1. generate — the agent now controls a private key         [gradient step 1]
sgit pki keygen --label "session-2026-08-20-a"     # prompts for a passphrase
sgit pki export sha256:<fingerprint> > identity-bundle.json

# 2. build the canonical enrolment statement (identity, seq 1, prev null)
jq -cS ... > enrol-payload.json                    # sorted keys, no whitespace

# 3. sign it with the key being enrolled — proof of possession
sgit pki sign enrol-payload.json --fingerprint sha256:<signing fp>

# 4. post it through the narrow door — no account, no access token
curl -X POST https://send.sgraph.ai/api/vault/append/write/$REGISTRY_VAULT \
     -H "Content-Type: application/json" \
     -d '{"append_token":"'$ENROL_TOKEN'","payload":<signed statement>}'
# response: {"ok":true} — blind, by design; the agent learns nothing else

# 5. poll the public registry for the outcome                [gradient step 2]
curl -s https://pki.sgit.ai/registry/index.json | jq '."sha256:<signing fp>"'
# present  -> the project recognised this key (a decision, not a computation)
# absent   -> pending, or declined; the blind ack means these look identical
```

Two properties of this flow are the design, not accidents. **The blind acknowledgement means enrolment has no probe value**: a flood of junk requests learns nothing about the inbox, other requests, or policy. And **the outcome channel is the public registry itself** — the agent discovers recognition the same way any third party would, by reading public state, which means the read path is exercised by every enrolment.

**Dependency flags:** `$ENROL_TOKEN` is agreed out of band — the lane-address derivation is PROPOSED platform-side and this page must not document it as shipped. And key persistence across sessions is the bootstrap brief's open question in practice: an MVP session that cannot carry its passphrase-protected key forward is a new identity next session. The MVP accepts session-scoped identities as a real observation to record, not a failure to hide — how long agent identities actually live is exactly the kind of thing this MVP exists to learn.

## Workflow Three: Operate Under A Mandate

The loop that makes the registry useful rather than decorative:

```
# issuer side (operator session, holding the issuer key):
#   append mandate to ISSUER's record (processor commits it)
# agent side:
sgit pki sign acceptance-payload.json ...          # accept, via the lane
# verifier side (ANY third session):
#   walk: subject record -> acceptance -> issuer record -> roots.json
#   check validity window, check revocations both sides
#   answer: "agent X may do Y until date Z, on authority A" — or refuse
```

The three-session shape is the acceptance test that matters: **issuer, subject and verifier are three different LLM sessions sharing nothing but public URLs.** When that runs end to end, the registry is doing its job. The verifier refusing correctly — expired window, revoked mandate, missing acceptance — is as much the test as the happy path.

## The Page Contract

The workflows live on the site under the same disciplines the site already enforces, which become the client's guarantees:

| Site discipline | What it gives the workflow |
|---|---|
| Executed, not recalled | Every command block was run before being published |
| Shipped vs proposed, labelled | An agent cannot be led into coding against the derivation |
| llms.txt front door | The session's entry point is machine-readable by construction |
| Validator in CI | The registry a reader fetches has passed the same checks the page describes |
| Key-leak tripwire | The tree the workflows fetch from cannot carry a live capability |

## Honest Tensions

| Tension | Note |
|---|---|
| A page as a client | It is the thesis and it is slower than a library; the library comes after the page has been walked by real sessions, encoding what they tripped on |
| Blind ack vs debuggability | "Pending" and "declined" are indistinguishable to the agent; honest, and it will frustrate — a declined-with-reason statement type is a tempting later addition with abuse implications |
| Passphrase handling in sessions | keygen requires one; a session scripting it on stdin is storing it somewhere — the workflow must say where is acceptable (an encrypted vault) and where is not (the repo, the transcript) |
| Session-scoped identities | Accepting them is honest and risks normalising throwaway identity; the mandate lifetime should be the counterweight |

## Open Questions

| Question | Notes |
|---|---|
| What exactly do `sgit pki sign/verify` emit and accept? | Detached vs attached, encoding, stdin support — determines the payload envelope details; execute first, then write |
| Where does a hosted session keep its private key? | The agent's own encrypted vault is the natural answer and needs its own worked page |
| Should the processor publish declined enrolments? | Transparency vs abuse-probe surface; the blind ack currently wins |
| How does a session prove it is the SAME session later? | Possession of the key is the whole answer today; whether that is enough is a mandate-policy question |
---

*Added after publication, 20 August 2026 (site v0.1.12). No claim above has been changed — this pack supersedes rather than rewrites; the only edit was moving the licence line below this block so it stays last. Later documents that bear on this one:*

- `08__ux-mockups.md` — **M6 and M7** — these three workflows as screens: the blind-ack enrolment view, the verifier's answer, and the refusal that names where it stopped
- `09__wardley-maps.md` — **W1** — why the read path is cheap — everything under the four schema objects is commodity
- `10__user-stories-and-features.md` — WF-1 and WF-2 with acceptance criteria per story, and the note that a blind ack is a success condition that is an absence — easy to break by accident, hard to notice
- `11__observability.md` — **WF-7**, the workflow these three did not have: the checker reports its check into the issuer's lane, and the issuer computes who never reported at all
- `13__keys-and-signatures.md` — the enrolment shape here is the general rule: an instance generates its own keypair and a project key endorses the public half. **A key belongs to whatever can keep a secret**, which is also why the session-scoped identity note above is load-bearing rather than a caveat

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
