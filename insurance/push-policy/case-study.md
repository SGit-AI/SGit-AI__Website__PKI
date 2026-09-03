# Case study: the release that shipped 198 unchanged pages, and the policy that would have caught it on day one

*Written 3 September 2026, the morning after the push policy refused its own first release. Every number here was measured from this repository's history with `check.py --backtest`, and the measurement is reproducible from the commands at the end. This is a document about this estate, and it is not flattering.*

---

## 1 · What happened

On 20 August 2026, release v0.1.3 added `admin/build/chrome.py`: a script that writes the site's navigation, footer and **current version number** into every HTML page on every release, so that the version in the corner of each page is always right.

It worked. It also meant that from that release on, **every release rewrote every page**, whether or not the page had changed. A one-line fix to one document shipped as a change to every file on the site.

Nobody noticed for 62 releases. The site grew from 23 pages to 214, so the cost grew with it, from 0.4 MB per release to 4.3 MB, and by the end **85 % of what each release pushed was pages whose only change was the version string in the footer.**

It was found on 2 September, not by anyone looking for it, but by a policy that had been written that afternoon for a different reason: the project lead's memo asking for an insurance-shaped budget on what an agent may push. The first thing the budget was run against was the estate's own history, because that was the only history to hand.

## 2 · The numbers

| | |
|---|---|
| Releases since the stamp was introduced | **63** of the site's 67 |
| Releases the policy would have refused | **62 of 67** — 3 drawn, 2 normal |
| First release refused | **v0.1.3, 20 Aug** — the release that introduced the stamp — at 422 KB, 1.4× the per-push maximum |
| Bytes pushed across all releases, as git measures new objects | **170.6 MB** — mean 2.55 MB, largest 13.1 MB |
| The last release, split | 219 files · **198 stamp-only, 3.66 MB** · 21 real, 0.67 MB |
| Cost per page per release | about 17 KB, so it grew linearly: 23 pages → 214 pages, 0.4 MB → 3.7 MB |
| Days with more releases than the `dev` band of 3 | **7** — 11, 11, 6, 5, 5, 8 and 9 releases in a day |
| The repository's pack today | 38.9 MiB for 4,395 objects — git's delta packing recovered 4.4× against the 170 MB of new objects |

The last row is the one that matters for a vault, in §5.

## 3 · Why nobody saw it

Not because it was hidden. Every `git push` printed the object count, and the CI logs had the numbers. It was not seen because **nothing was asking the question**: no threshold, no band, no comparison against what a release *should* weigh. The push succeeded, the site deployed, the version in the corner was right, and success was the only signal anyone read.

Three habits made it invisible:

- **The stamp was a feature.** It made the version correct everywhere, and nobody weighs a feature that works.
- **The cost was gradual.** 0.4 MB at 23 pages is nothing. 4.3 MB at 214 pages is still nothing, on a fast connection, to a person. The growth was linear and the per-release view never changed shape.
- **Every release did it, so no release stood out.** There was no baseline of a *small* release to compare against, because there had not been one since 19 August.

That last point is the whole case for a policy. **A normal band is a baseline you write down before you need it.**

## 4 · How the policy would have detected it, and when

The push policy from memo 12 has two resources, each with a normal band, a per-occurrence limit and a daily pool. Replaying history through it:

### The byte check: refused on day one

v0.1.3, the release that introduced the stamp, pushed 422 KB against a per-push maximum of 300 KB. **The policy refuses it.** The three releases before it, at 60 to 200 KB, had all been *drawn*: over the 50 KB normal band, inside the limit, paid from the pool. So the sequence the ledger would have shown on 20 August is: drawn, drawn, drawn, **refused** — the first refusal on the first release with the stamp.

That refusal would not have said "the version stamp is the cause". A policy is a proxy; it knows the weight, not the reason. But it would have said *this release is 1.4× the largest allowed*, on the day, to the agent about to push, and the agent's next action under the skill is to stop and tell a human. The diff of that release was 38 files. **The cause was one `grep` away, on the day it was created**, instead of 62 releases later.

### The push count: the pool spent by lunchtime

On the same day there were **11 releases** against a `dev` band of 3 with a pool of 10. Releases four through eleven would each have drawn one from the pool; the pool would have been empty at release thirteen, had there been one. The next day had 11 again. **Seven of the estate's fourteen release days breached the count band.** Under the policy that is not a rebuke of the pace; it is a second, independent signal on the same day, and two signals on one day are what make a human look.

### The ledger: the trend by the fourth release

Each check appends a line. After four releases the ledger would have read 60 KB, 120 KB, 200 KB, 422 KB, and after ten it would have shown the number growing with the page count. **That growth is visible in the ledger by the end of the first day.** Nobody has to notice it in a push log, because the ledger is the one file whose only purpose is to be read for exactly that.

### The tiers: what each would have done

| If the check had been… | On 20 August it would have… |
|---|---|
| **An expectation** — a dashboard | Shown a number nobody was looking at. Same as what happened |
| **A setting** — the skill, the agent on itself | **Stopped the agent before the push and made it report** the refusal to a human, with the bytes. This is the MVP as built |
| **A boundary** — a required CI check | **Blocked the push** until a human overrode it, on the record. Same `policy.json`, same arithmetic, a party the agent cannot reach |

The setting would have been enough here. The failure was not an agent trying to get past a check; it was nobody asking. A setting asks.

### The claim as the draw

Under memo 12's reading, each release over the band is a claim paid from the pool. The pool is 1 MB a day. **On 20 August the eleven releases would have claimed about 4 MB against it**, and the pool would have been exhausted by the fourth release. A pool that empties on the first day it exists is not a failed policy; it is a policy telling you the baseline is wrong or the behaviour is. Both were true, and the ledger would have shown which.

## 5 · What this costs in a vault, and why it is worse than git

The estate mirrors its work into SG/Send vaults, and a vault is content-addressable on the plaintext: an object's identity is the SHA-256 of what it contains, and deduplication works only for identical content. **A one-byte change to a page is a new object.** So every stamped release adds one new encrypted object per page: 198 objects, 3.66 MB, per release, today.

Then the discount git gives disappears. git packs deltas: the repository's 170 MB of new objects is stored in a 39 MiB pack because near-identical files compress against each other. **An encrypted vault cannot do that**, because the server never sees plaintext and the ciphertexts of two near-identical pages share nothing. The vault stores and transfers the full size of every changed object, every time.

| | git | an encrypted vault |
|---|---|---|
| New objects per release | ~200 | ~200 |
| Bytes stored per release | a few KB of deltas after packing | **the full 3.66 MB** |
| Over 63 releases | 39 MiB pack, all history | on the order of **170 MB** of objects |

The same tech debt, with the compression removed. This is the one place the case study reasons rather than measures: no vault of this site's history exists to weigh. The arithmetic follows from the design, and the design is the point of a zero-knowledge store.

## 6 · What the policy would *not* have caught

Honesty about the instrument:

- **The cause.** A refusal names the weight, not why. The human still has to read the diff. What the policy buys is that the human reads it on day one.
- **The append-only files.** With the stamp gone, the last release is still 654 KB, because three files that grow every release — the versions table, the comms log, the documents generator — are re-sent whole. The policy counts new objects, which is what git and a vault both create; whether an append-only log should be measured by its growth is a calibration question the ledger will raise, and the policy's numbers are placeholders until it does.
- **The wire.** Bytes are measured before the push as uncompressed new objects: a floor, not a bill. The bill, where there is one, is the host's.

## 7 · What changes

1. **The release stops touching pages that did not change.** The version moves to one file the pages read at load time; `chrome.py` stops rewriting 198 pages to change a string. A release then ships what it changed, in git and in a vault alike. This is the fix, and it is before v0.1.66.
2. **The hook gets installed** once the fix lands, so the skill's refusals are real rather than overridden.
3. **The ledger decides the numbers.** After a few releases of real content, the normal band and the pool are re-fitted from what the ledger shows, not from the memo's placeholders.
4. **The append-only files get a measure.** Growth, not size, or an exclusion list, or a larger band. One of the three, chosen from the ledger.

## 8 · The lesson, stated once

**A normal band is a baseline you write down before you need it.** The stamp was not hidden and the numbers were not secret. What was missing was a written expectation of what a release should weigh, checked automatically, at the moment of the push, by the party about to push. The policy supplied that expectation on the afternoon it was written, and the first thing it found was three weeks old.

The memo that asked for the policy said *"that is now a cost paid continuously by every developer, every push."* It was describing this repository, and did not know it.

## Reproduce it

```bash
python3 insurance/push-policy/check.py --backtest 200 --ref origin/dev      # every release, replayed
git log --format="%h %cs %s" --diff-filter=A -- admin/build/chrome.py         # when the stamp arrived
git diff --name-only HEAD~1..HEAD | wc -l                                     # files a release touches
git count-objects -vH                                                         # what git's packing recovered
```

---

*CC BY 4.0. A measurement of this estate, made with its own tool, on the morning after that tool refused its own release. The project lead overrode that refusal once, on the ledger, so that the release carrying the policy could ship; this document is the reason the override should be the last.*
