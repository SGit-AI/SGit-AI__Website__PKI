# pki.sgit.ai/lib: the code other sites use

Three levels, and one rule: **anything named `latest` moves; everything else is written once and never changed.**

| Level | Example | Promise |
|---|---|---|
| release | `v0` | breaking changes: nothing is promised between releases |
| major | `v0.2` | best effort not to break, and it may |
| minor | `v0.2.28` | small changes; an exact version, never changed after release |

Channels: `lib/latest/` (the newest of all), `lib/vN/latest/`, `lib/vN/vN.M/latest/`. Exact versions: `lib/vN/vN.M/vN.M.P/`, each with `manifest.json` (every file's sha256 and SRI hash, an import map with integrity, signed: `manifest.json.sig`) and `notes/release.md`, `notes/security.md`.

For code that must not change under you, pin an exact version and its hashes. A `latest` folder is a choice to take every change.

Newest: v0.2.28. Every version and its hashes: [index.json](index.json).
