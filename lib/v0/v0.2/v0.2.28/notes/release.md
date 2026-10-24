# v0.2.28

Released 2026-10-24. Every file's full sha256 and SRI hash are in ../manifest.json.

## Changed

| File | Before | After |
|---|---|---|
| `keys.js` | new | `7c97cbd9dab3c396…` |
| `message.js` | new | `ad91e33ab9a711ca…` |
| `directory.js` | new | `7369832f63eb4b4f…` |
| `delegation.js` | new | `0ecb7f7b9dc52055…` |
| `sso.js` | new | `f250b6766e3f9550…` |

## Notes

The first release of pki.sgit.ai's code for other sites, as a versioned library:

- `keys.js`: key pairs (RSA-OAEP 4096, ECDSA P-256), signatures, the register's canonical JSON, sgit's envelope.
- `message.js`: sealed messages, k1 key codes, the strict JSON QR shapes, vault keys found in text and sent as files.
- `directory.js`: reading records, the graph, standing, trust from a pinned root; the `delegates` link.
- `delegation.js`: sign-in requests, delegations (soft and strong), signed notes, and their checks.
- `sso.js`: the client a site uses: login, finish, sign, verify.
