# pki.sgit.ai — public key infrastructure for agents

Good public key repositories existed, and were destroyed. The global keyserver network
was destroyed in 2019 by a certificate-flooding attack its own maintainer called
**unsalvageable**, and the cause was a design goal stated at the outset — a key server
could add information to a certificate but never delete anything — rather than a bug.

This site publishes that history, and the registry rules it produces, **before the
registry exists**: only the owner writes to their own record, revocation is a signed
append, records are size-bounded, every entry is signed.

Live site: https://pki.sgit.ai (GitHub Pages, deployed from `dev`).

## Structure

- `index.html` — front page: the failure leads, then the three layers and the reframe
- `failure/` — the 2019 keyserver failure, with sources; the append-only resolution
- `bootstrap/` — the bootstrap trap: why agent key registries do not exist
- `rules/` — the four registry rules, published before the registry exists
- `mandate/` — identity and mandate as separate, independently revocable statements
- `enrolment/` — how a key gets in, starting from a keypair and nothing else
- `execution/` — the execution broker, and receipts as the third corner
- `shipped/` — what already ships, what is only proposed, and the two absences
- `roadmap/` — the build order, the honest tensions, the open questions
- `documents/` — the source briefs, readable in-page (raw markdown is the source of truth)
- `briefs/` — those source documents, captured verbatim
- `about/participant.html` — the participant disclosure, and where our approach loses
- `admin/` — engineering: comms (tasks & requests), versions, build tooling
- `admin/build/chrome.py` — the single definition of nav and footer, applied across every page
- `admin/build/gen_documents.py` — generates the `documents/` reader pages
- `assets/site.css` — shared stylesheet (sgit.ai design language)

Content was refactored across from the PKI section of
[nhi.sgit.ai](https://nhi.sgit.ai/pki/index.html), where it was staged, and promoted from
three pages to a site.

## Release process

1. Bump `admin/build/version.txt` (vX.Y.Z, exactly once per release) and add a row to
   `admin/versions.html`; update `admin/comms.html`.
2. `python3 admin/build/chrome.py` — propagates the version badge and any nav/footer change
   to every page. (`gen_documents.py` first, if a document was added.)
3. `node admin/build/validate.js`
4. `git commit -am "site vX.Y.Z: ..." && git push origin dev` — the `site vX.Y.Z:`
   prefix is load-bearing, not decoration: `tag-release` finds the release commit by
   scanning subjects for it, and refuses the release when the newest one it finds
   disagrees with `version.txt`. A subject in any other shape fails the job after the
   push, and nothing deploys until a commit carrying the prefix lands.

Every push to `dev` runs `.github/workflows/deploy-pages.yml`: validate → auto-tag
(`vX.Y.Z`, verified against version.txt and the commit subject, next-minor enforced) →
deploy to GitHub Pages. Pull requests run validation only. Same pipeline as
[SGit-AI__Website](https://github.com/SGit-AI/SGit-AI__Website) and
[SGit-AI__Website__NHI](https://github.com/SGit-AI/SGit-AI__Website__NHI).

All content CC BY 4.0 unless noted. Code under the repository licence.
