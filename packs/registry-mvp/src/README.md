# Registry MVP — pack README

**Status:** a design pack with **one shipped consumer**. Fifteen documents plus four appendixes — a PR/FAQ, a PEP-style specification, a doctrine assessment and change control; the registry itself is unbuilt, and the assessment at `/assess` is built and live · site-agent authored · awaiting project-lead adoption (corpus version assigned then)
**Date:** 20 August 2026

An MVP of the public key registry on vaults: open data, a single operator, and LLM sessions as the first users on both sides of every workflow. Documents 00–04 are draft-1 as shipped at site v0.1.4. Documents 05 and 07 were added the same day, along with the change-control appendix — which was numbered 06 at the time and has since moved to the end, because it is the one document here that never stops growing. It records what three project-lead briefs (v0.33.61) correct in draft-1 — including the grant redefinition, the 5 June design precedence, and the fixture class — and, later the same day, four more briefs that change the record model itself (C7–C10: growth moves to the commit graph, the reference is mutable, verification is two products, and the interface primitive is a badge on every edge) — and the tabletop exercise that gives the four published rules their first population. Documents 08 and 09 draw what the earlier ones describe: the register interface written out as intended output screen by screen, and six Wardley maps of the same argument, in mermaid's `wardley-beta` diagram type. Document 10 turns the whole pack into deliverables: six users, twenty-four stories each with a test that can fail, fourteen features with a status column, and six workflows — plus a flat list of what the pack does *not* deliver. Document 11 adds the observability layer: check events into the issuer's own lane, the missing-edges join, and effective revocation latency. Documents 12 and 13 take the grant side and the key policy: a grant is a tree whose nodes need control labels, and a key belongs to whatever can keep a secret — everything else is signed by something that can. Document 14 is the first that describes something built rather than designed: the assessment workflow at /assess, where a visitor maps their own grants and mandates — storing their choices and never their answers, because a completed pack is a map of the visitor's own weaknesses. Documents 00–05, 07, 08, 10 and 12 each carry a dated *added after publication* block pointing at the later material; nothing above those lines was rewritten. **The appendix now runs to twenty-three corrections and thirty-six decisions, and roughly a third of the decisions are open.**

## Reading order

1. `00__LEADING-BRIEF.md` — scope, the four objects, public-in-data / private-in-authority
2. `01__architecture.md` — the vault, the records, the processor
3. `02__schemas.md` — the statement bodies (grant definition superseded — see C1)
4. `05__diagrams.md` — the design as pictures
5. `03__workflows.md` — the LLM-session workflows
6. `04__build-order.md` — phases and acceptance tests
7. `07__tabletop-exercise.md` — the rules meet their first population
8. `08__ux-mockups.md` — the interface as intended output, with “nobody” as a first-class answer
9. `09__wardley-maps.md` — six maps of where the novelty actually sits
10. `10__user-stories-and-features.md` — who gets what, and how we know it works
11. `11__observability.md` — who has never checked, and why that is the finding
12. `12__grant-tree-and-control-labels.md` — blast radius as a path, and the label on each node
13. `13__keys-and-signatures.md` — which things get keypairs, and why it is fewer than proposed
14. `14__user-assessment.md` — the workflow that is built, and the two findings that shaped it
15. `15__interface-rendered.md` — the pack's screens **built by an outside session**, and the six things the fixed-width form was hiding. The rendered screens are at `packs/registry-mvp/mockups.html`
16. `90__pr-faq.md` — **Appendix A.** The pack backwards from a customer: a press release, an external FAQ, and an internal FAQ written to hurt
17. `91__rep-0001.md` — **Appendix B.** The normative specification in PEP form. The one place the schemas are current rather than superseded-with-a-note
18. **Appendix C — Doctrine** (a page rather than a source file: `packs/registry-mvp/doctrine.html`). Wardley's forty doctrines, explained, with this project rated against every one
19. `99__change-control.md` — **Appendix D.** Every correction and every decision. Read it *second* if you are about to build from 00–04, so you read them with the errata in hand; read it *last* if you are reading the pack through. Never not at all

All content CC BY 4.0.
