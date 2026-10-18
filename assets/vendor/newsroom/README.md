# The newsroom's vault module, vendored

`newsroom-vault.js` is `assets/newsroom-vault.js` from [newsroom.sgit.ai](https://newsroom.sgit.ai)
([SGit-AI/SGit-AI__Website__Newsroom](https://github.com/SGit-AI/SGit-AI__Website__Newsroom), commit
`3ca7116a8ada07c25c89ce12f3b21087b709ad40`), copied unchanged, so that pki.sgit.ai opens vaults with the same code the
newsroom does rather than with a second design (the build brief: "reuse it; do not design a second one").

| File | SHA-256 |
|---|---|
| `newsroom-vault.js` | `fbcbb66d04bcc8f178ee4d387d587d6285c94be7d52e96a616882b8fe1f04d59` |

`assets/people/door.js` is the newsroom's `assets/door.js` with one constant changed (`RP_FOR_DERIVATION`, so a
door here is this site's). The newsroom's file, at the same commit, hashes to
`740779876d19acebd24e493da9616d132a968f8885c013880f383c15d6ef4dff`; `admin/build/test_people_vault.mjs` undoes the one change and
checks the result against that hash.

The vault library under `../sg-vault/` and the QR code generator under `../qrcode-generator/` were copied from the
newsroom at the same commit, unchanged; each folder records its own provenance and hashes.
