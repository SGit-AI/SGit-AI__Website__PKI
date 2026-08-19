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

- `index.html` — front page
- `assets/site.css` — shared stylesheet (sgit.ai design language)
- `admin/` — engineering: comms (tasks & requests), versions, build tooling

Content sections are refactored across from the PKI section of
[nhi.sgit.ai](https://nhi.sgit.ai/pki/index.html), where they were staged.

## Release process

1. Bump `admin/build/version.txt` (vX.Y.Z, exactly once per release) and add a row to
   `admin/versions.html`; update `admin/comms.html`.
2. `node admin/build/validate.js`
3. `git commit -am "site vX.Y.Z: ..." && git push origin dev`

Every push to `dev` runs `.github/workflows/deploy-pages.yml`: validate → auto-tag
(`vX.Y.Z`, verified against version.txt and the commit subject, next-minor enforced) →
deploy to GitHub Pages. Pull requests run validation only. Same pipeline as
[SGit-AI__Website](https://github.com/SGit-AI/SGit-AI__Website) and
[SGit-AI__Website__NHI](https://github.com/SGit-AI/SGit-AI__Website__NHI).

All content CC BY 4.0 unless noted. Code under the repository licence.
