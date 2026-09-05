# Incidents

An incident is a first-class evidence type, not a folder of stories. **A guardrail that an incident bypassed is not the guardrail it was claimed to be**: the incident is evidence about the control's strength, and its effect is to demote the claimed evidence mode. An incident record names the profile, the capability, the control that was claimed, the rung it was claimed at, the rung it demotes it to, and a link to the public account. That is how the registry gets more honest over time rather than more confident.

Shape: `schema.json` in this folder. Records: one JSON file each, `YYYY-MM-DD__<slug>.json`.

## The rungs, as this estate names them

The evidence-mode ladder of the 4 September architecture brief, read against this estate's levels of enforcement: `asserted` (a claim) · `documented` (written down) · `manual` (checked at a cadence) · `out-of-band` (enforced by something the actor cannot reach, after the fact) · `inline` (enforced before the action, by something the actor cannot reach). An inline check the actor can disable is `out-of-band` at best: the enforcer is named and whether the actor can reach it decides the rung.

## The first record

`2026-08-26__mandate-hook-narrower-than-the-authorisation.json` — not a bypass, and kept because it is the other failure an incident can show: a control claimed as the boundary on pushes was a **setting** (a pre-push hook in the agent's own clone, `--no-verify` still passes), and within the hour it refused the release that was carrying it. The demotion is from the claimed *inline* to *out-of-band*: the enforcer is in the actor's reach.

No bypass has been recorded yet. The reconciliation job (`packs/insurance-ecosystem/tools/reconcile.py`, level five) is where the first one would come from: a commit that carries no claim is the detection, and a catch above the hook is an incident (GM-D106).
