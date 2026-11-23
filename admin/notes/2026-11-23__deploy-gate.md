# A push alone must not reach prod: the deploy gate (open, to revisit)

23 November 2026 · status: **open, not started** · written by the dev@pki.sgit.ai session after the review of the
23 Nov release changes

## The problem

pki.sgit.ai holds a register: who is trusted, which agents Dinis operates. Today anything that can push to `dev`
releases and deploys it:

- Every agent session pushes **as Dinis** on GitHub (the runs' actor is `DinisCruz`), through the one GitHub
  connection all sessions share. GitHub cannot tell Dinis and his agents apart.
- Agents can change the pipeline itself: the 23 Nov session rewrote `.github/workflows/deploy-pages.yml`. So **any
  check that lives in this repo can be removed by the same push it is meant to stop.**
- Archiving a session stops that session; it does not revoke push access, which is the shared connection.

Goal: even someone who can push to this repo (an agent, a stolen token) cannot get a change rendered and deployed.
Ideally even someone holding Dinis's key cannot change the register or the pipeline alone.

## Constraint: no click per release

Rejected: a required reviewer on the `github-pages` environment (one approval per deploy). Every push is a release,
so it would block all work on Dinis. The only human step should be the one that already exists: **confirming an
agent in the vault**, in the browser, with the passkey, once per session.

## The shape (PKI-native)

1. **One writer at a time.** The session allowed to release this repo has a session key, enrolled like any agent
   (`handover.md` section C). Dinis's `operates` link to it carries a **behaviour policy** naming what it may do,
   e.g. `release: SGit-AI/SGit-AI__Website__PKI`. Changing writer = a signature in the vault, not a GitHub setting
   and not a secret to rotate.
   - The writer's record says where it lives (its session link, and an account label, e.g. "account A"), so Dinis
     can always find which session holds the pen.
   - The verifier honours only the newest unexpired writer link for a repo: exactly one writer across everything.
2. **Every release is attested.** The writer signs the hash of the tree it pushes (`pki-agent.mjs attest`, to be
   written). The signature binds the content: it cannot be moved onto another tree.
3. **The verifier lives outside this repo**, with the root `sha256:db7f79fdd87e030a` pinned in its own config (a
   root read from this repo could be changed by the push it is judging). It accepts a tree when the attestation
   checks, the signer chains to the root through an unexpired `operates` link, and that link's policy covers this
   repo.

## Where the verifier can run (no per-release click)

| Option | How | Bypassable by a pusher? | Notes |
|---|---|---|---|
| **A. Custom deployment protection rule** on `github-pages` | A small GitHub App + function; GitHub asks it before each deploy, it approves or rejects automatically | No: enforced by GitHub, code and config elsewhere | Check availability for this repo/plan |
| **B. Separate deploy repo** | A repo no agent session is ever attached to pulls `dev`, verifies, deploys (Pages or S3) | No, while no session gets that repo | This repo stops deploying itself |
| C. Required reviewer | Settings → Environments | No | **Rejected**: one click per release |

Open question for A and B: should changes to `directory/records/**` and `.github/**` need something more than an
attestation (a second signature, made in the vault), to cover a stolen root key? It must not become a click per
release; register changes are rare, pipeline changes rarer.

## To check before building

- The Claude GitHub App's permissions: if it has *Administration*, *Environments* or *Deployments* write, an agent
  can undo repo-settings controls, and A/C are weaker than they look.
- Whether a workflow that omits `environment: github-pages` can still deploy Pages (test on a branch). If it can,
  A alone is not enough and B is the safer shape.
- Custom deployment protection rules: available for this repo on the current plan?

## The structural fix, later

Agents get their own GitHub identity (a machine user, or the app acting as itself) instead of Dinis's. Then
GitHub's own controls (rulesets, reviews, "cannot approve your own change") can tell a person from an agent.

## Pieces to build when this is picked up

- A `policy` field on `operates` links that the verifier reads (what repo, what action), set in the vault's
  Confirm an agent.
- `pki-agent.mjs attest` (sign a tree hash) and `verify-release` (the verifier, usable from A or B).
- The verifier's home (A or B), with the root pinned there.
