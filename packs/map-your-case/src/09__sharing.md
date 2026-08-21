# 09 — Sharing

**pack** Map Your Case · draft-1 · 21 August 2026
**role** How a case leaves the browser without describing its owner: the fragment as the channel, identifiers as the payload, and the library version as the one thing a share can silently get wrong.

---

## The problem, stated against the obvious solution

The visitor wants to hand their case to a colleague — *look what my setup can reach* — and the obvious artefact is a picture of what their agent can reach, which is **a description of their own estate**. The obvious backend solution (store the case server-side, mint a short link) is worse: it creates exactly the stored answers this tool exists to never hold.

The choices-only rule already solved this, before sharing was designed: the stored artefact is a set of references into a public library, so **a share discloses nothing personal by construction** rather than by care.

## The channel: the URL fragment

Settled in this corpus on 16 August: the fragment is the key channel because **it is never sent to the server** — not in the request line, not in logs, not in referrer headers to this site. The same channel carries a selection:

```
https://pki.sgit.ai/assess/index.html#s=<version>.<encoded state>
```

- **Payload:** the state object only — product ids, fact answers (`yes|no|unsure`), control ids, capability ids — plus the **library version** it was composed against. Every token must be a library identifier or a vocabulary answer; the encoder refuses anything else, which keeps story S1 testable.
- **Never in the payload:** free text (there is nowhere it could come from — P1), timestamps beyond the library version, names, or anything computed. The recipient's browser recomputes the dashboard from the public library; the sender ships choices, not conclusions.
- **The recipient** opens the link with empty storage and sees the same dashboard the sender saw (story S2), reconstructed entirely from public material. One pattern, two payloads: the fragment that keeps a key off the server is the fragment that keeps a case off it.

Loading a share must not silently overwrite the recipient's own stored case: a share renders in a clearly-marked loaded state, and adopting it is an explicit action. (The marked state also keeps a share from being confusable with the recipient's own answers — rule one's shape, applied one level down.)

## The drift problem

A recipient opening the link next month may reconstruct a **different tree**, because the library moved — and neither party would know. The brief flags it; this pack decides it:

- The share **pins** the library version it was composed against.
- On mismatch, the page renders the current library's answer **plus a notice**: *this case was composed against the library of 2026-08-21; the library has since changed; N of the referenced entries moved.* The recipient gets today's truth, told that it is today's.
- Serving the *old* library instead is rejected: it would require the site to keep every historical library resolvable and would quietly hand the recipient a stale assessment as if current — the exact failure mode a dated tree exists to prevent.

The counting of "N entries moved" needs per-entry dates, which is one more reason MC3 (per-node dating, document 02) is queued for v3 rather than someday.

## Screenshots

The other share path is a picture of the dashboard, and it needs one rule rather than machinery: the dashboard renders its **library version and date visibly** in the region a natural screenshot captures, so a shared picture carries its own dating. If a screenshot ever includes simulated content (a run gallery view, document 06), the inline simulation markers are already in the pixels — which is why rule one puts them beside each quote rather than at the top of the page.

## What sharing never becomes

- **Not a collaboration backend.** Two people editing one case means server-held state; the honest version of that feature is the vault path (registry pack decision 35's territory), a different page with its own disclosure.
- **Not an identity.** A share link names no one, and the page never renders "shared by …" — there is nothing truthful it could render.
- **Not a channel for the exercised set.** A transcript-derived exercised set (document 07) contains precisely the material a fragment must never carry; if the three-sets dashboard ever shares, it shares the visitor's *claims* (ticked capabilities), never transcript material.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
