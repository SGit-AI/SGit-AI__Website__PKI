# v0.2.28

Released 2026-10-24. Every file's full sha256 and SRI hash are in ../manifest.json.

## Security

- Every check starts from a root the caller pins; nothing here reads a root from the register's list of anchors.
- A delegation is bound to one origin (`aud`), one browser key, its uses and its dates, all inside its signature.
- Strong means the issuer's record lists the delegation by hash today; a verifier sees a withdrawal when it next reads the register, so its cache sets how late.
- `sso.js` keeps the browser's private key in that site's localStorage, and checks the nonce of the request on the way back.
- Pin an exact version and its hashes (`manifest.json`, `importmap.integrity`) for code that must not change under you; the channels (`latest`, `v0`, `v0.2`) move.
- Levels: a release (vN) may break anything; a major (vN.M) tries not to; a minor (vN.M.P) is small and never changes after release. Only folders named `latest` move.
