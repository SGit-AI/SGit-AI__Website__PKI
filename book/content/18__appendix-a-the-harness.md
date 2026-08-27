# Appendix A · The harness

*Every script that produced a figure or a number, so any claim in this book can be re-derived rather than believed.*

---

Everything here is published with the book at `https://pki.sgit.ai/book/shots/`. Nothing in this book was measured by a method that is not in this appendix.

**Where this harness comes from.** It is a re-implementation of Appendix C of the sibling estate's *Making a Book*, at `https://graphs.sgit.ai/v2/books/making-a-book/content/15__appendix-c-the-harness.md`, which is where the commissioning brief's §4 came from. That appendix states the two operational rules — never reuse a port, always kill what you spawned — and the reason behind them, and this book's brief carried them forward. Saying so is not a courtesy: a book that marks every borrowed sentence and then quietly presents a borrowed method as its own would be making exactly the mistake it spends seventeen chapters on. **The scripts below are this book's own; the technique is not.**

Four things in this harness came from that appendix rather than from the brief's summary of it, and each is recorded at the point it applies: the `--font-render-hinting=none` launch flag (§A.2), the settle rule for anything laid out by script (§A.2), the tags-are-the-substrate refusal (§A.4), and the figure table (§A.7).

## A.1 · Time travel: a figure is taken from the version its caption names

The problem this solves: several figures in this book show pages *as they were*. A figure captioned as the past but photographed today is a reconstruction, and a reconstruction wearing a caption is a claim of authority nobody granted.

A tag, a worktree and a one-shot local server **are** the site as it actually was, and a headless browser can photograph it. `git worktree` is what makes this cheap: a second working copy of any commit, beside the live one, in under a second, without touching the branch.

`book/shots/travel.sh`:

```bash
#!/bin/bash
# travel.sh <tag> <port> <jobs.json> — worktree at <tag>, serve, shoot, tear down
set -u
TAG=$1; PORT=$2; JOBS=$3
REPO=$(git rev-parse --show-toplevel)
WT=$(mktemp -d "/tmp/hist-${TAG}-XXXXXX")
SRV=""

cleanup() {
  [ -n "$SRV" ] && kill "$SRV" 2>/dev/null && wait "$SRV" 2>/dev/null
  if [ "$TAG" != "current" ]; then
    git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1
    rm -rf "$WT" 2>/dev/null
  fi
}
trap cleanup EXIT INT TERM        # <- runs on success, failure and interrupt alike

if [ "$TAG" = "current" ]; then
  WT="$REPO"                      # the site as it stands: the working tree itself
else
  git -C "$REPO" worktree add --detach -f "$WT" "$TAG" >/dev/null 2>&1 || {
    echo "  worktree failed for $TAG"; exit 1; }
fi

python3 -m http.server "$PORT" --directory "$WT" --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
  sleep 0.25
done

# the SHA-256 of each page's BYTES AT THIS TAG
JB=$(basename "$JOBS" .json)
DIGESTS="$REPO/book/shots/.digests-$JB.txt"
: > "$DIGESTS"
for p in $(python3 -c "
import json; print('\n'.join(sorted({j['path'] for j in json.load(open('$JOBS'))['jobs']})))"); do
  f="$WT$p"
  [ -f "$f" ] && echo "$p $(sha256sum "$f" | cut -d' ' -f1)" >> "$DIGESTS" \
              || echo "$p MISSING-AT-$TAG" >> "$DIGESTS"
done

NODE_PATH=$(npm root -g) node "$REPO/book/shots/shot.mjs" "$PORT" "$JOBS"
```

**Two operational rules, and neither is optional.**

**Never reuse a port** — not the server's, not the browser's debug port. One capture, one port, forever. A zombie headless browser holding a port serves stale bytes to every later capture on it, and makes a working page look broken for as long as it takes to suspect the browser instead of the code. `capture-all.sh` allocates ascending ports from a base and never repeats one.

**Always kill what you spawned**, in a block that runs whether the capture succeeded or failed. `trap … EXIT INT TERM`, never the happy path.

## A.2 · The browser: `book/shots/shot.mjs`

Three details decide whether the figures are usable, and one of them changed during this book's production.

**`deviceScaleFactor` is 2 or 3**, so figures are legible in print.

**`--font-render-hinting=none`**, from the sibling appendix, and it is the flag that keeps a digest gate honest: without it, text rendering varies with the host's font configuration, so the same page captured on two machines differs in bytes and a gate fails for a reason that has nothing to do with the page.

**A settle after load, for anything laid out by script.** The sibling estate's figures are of a graph laid out by a physics simulation, which is still moving when the network goes quiet; theirs waited six to nine seconds. Only one figure here is script-laid-out — `/assess/`, whose graph is hand-written SVG — and raising its settle from 1.2s to 6s produced a byte-identical capture, so the wait was already sufficient. That is recorded as a checked non-issue rather than left as an assumption.

**`pageerror` and console errors are collected and printed beside each result**, because *a screenshot that looks fine, taken from a page that threw, is a figure you must not publish.* Any job with a problem is marked `ERR` and the batch exits non-zero.

**The blank check is colour-agnostic**, and this is the part that changed. The specified rule was *anything under about 3 per cent ink is a white rectangle*, measured as the fraction of non-near-white pixels. That works for a web page and fails completely for a figure of a dark terminal, which scores ~100% ink by that measure — so a dark page that rendered nothing would have sailed straight through the gate. The metric is now the fraction of pixels that are **not the modal colour**, quantised to 5 bits per channel so anti-aliasing does not read as content:

```javascript
function inkFraction(pngBuffer) {
  const { width, height, data } = PNG.decode(pngBuffer);
  const total = width * height;
  const counts = new Map();
  for (let i = 0; i < total; i++) {
    const k = ((data[i*4] >> 3) << 10) | ((data[i*4+1] >> 3) << 5) | (data[i*4+2] >> 3);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let modal = 0;
  for (const n of counts.values()) if (n > modal) modal = n;
  return (total - modal) / total;      // a blank page of ANY colour scores ~0
}
```

A blank page of any colour now scores near zero and fails. `book/shots/png.mjs` is a minimal PNG decoder published beside it, so the gate that stops a blank figure reaching print has no dependency that could go missing.

## A.3 · The transcripts: `book/shots/transcripts.sh`

Every terminal figure is a **real transcript**, executed rather than pasted, and re-run against the checked-out worktree of the tag its caption names.

```bash
./book/shots/transcripts.sh book/shots/transcripts   # writes t04 … t08b
python3 book/shots/mkterm.py book/shots/transcripts book/shots/term
```

**Where the terminal figures appear in the book.** The six terminal captures are printed in the chapters as their **real transcript text**, because that is what makes the PDF readable and searchable offline. The photographed PNG of each is kept as the archival capture and recorded in `shots.json` with its digest, so a reader can check that the printed text and the captured image are the same bytes. The eight page figures are printed as images.

`mkterm.py` only frames the captured bytes — it does not edit, trim or re-flow them, and it stamps each page with the SHA-256 of the transcript file it rendered. Check any figure against its source:

```bash
sha256sum book/shots/transcripts/*.txt
```

**The one case where the tag could not supply the state.** Figure 8 shows the push refused at `v0.1.28`. That tag ships mandate **v2**, which permits `dev`, because the control refused the release carrying its own documentation and the mandate had to be amended before the release could exist. The refusal was therefore re-run against `mandate-v1.json` — present at that tag, and the document that did the refusing — using the tag's own hook and the tag's own tool. Figure 8b prints the amended answer beside it. Chapter 10 and Chapter 15 both carry the finding.

## A.4 · The gates: `book/build.py`

```bash
python3 book/build.py            # build everything, run every gate
python3 book/build.py --check    # gates only, no writes
```

Four gates, and each fails the build rather than warning.

| Gate | What it enforces |
|---|---|
| **Quotes** | Every `stated` quotation in `quotes.json` is re-read out of the source it names. A quote not found where it claims to be fails the build |
| **Figures — past** | Re-running `travel.sh` at the tag reproduces the recorded page digest. Never goes stale, because the tag does not move |
| **Figures — fresh** | For `tag: current`, the recorded digest must match the live page. **This will break on the next release.** That is correct and it is inconvenient |
| **Chapter hashes** | Every chapter's SHA-256 in `book.json` matches its markdown on disk |
| **Stats** | Every count printed in the prose is a `gen:stat` marker regenerated from the repository. A marker whose printed value has drifted from the computed one fails `--check` |
| **Tags** | A checkout with no tags **refuses** rather than computing zeros |

### The tags refusal, and why it is a gate rather than a caution

Every release number in this book, and every past figure, rests on git tags. A shallow clone has none, and many automated environments make one by default.

**This book's writing session began against exactly that** — `git tag` returned nothing, and the harness §4 depends on `git worktree add <tag>`. The sibling estate's appendix warns about it in its own §3, having hit it too. So it is a gate here rather than a note:

```
$ python3 book/build.py --check          # in a shallow clone
build.py: this checkout has NO TAGS, so no release number in the book can be
computed and no past figure can be re-derived.
  git fetch --unshallow origin && git fetch --tags origin
Refusing rather than writing zeros into the prose.
$ echo $?
1
```

A silent `0` would have been written into the prose as a fact, in a chapter arguing that a gap must never render as an absence.

### The counts in the prose are generated

Adopted from the sibling estate's atlas volume, which carries its counts as `gen:stat` markers rather than as typed numbers:

```markdown
<!-- gen:stat:quotes -->65<!-- /gen:stat:quotes --> quotations, every one re-read…
```

The reason is not tidiness. A number typed into prose drifts the moment anything moves, silently, while still reading as a fact — and two of this book's own counts had already gone stale before the markers were adopted, including a release count that this book's own release falsified.

The quote gate normalises exactly two things and nothing else: HTML tags are stripped, and runs of whitespace collapse to one space, because line wrapping and markup are not differences in the text. A quote needing more help than that is not a quote. It caught one error during writing — a passage attributed to the readiness report's Q2 section that had been conflated with its phase table.

## A.5 · Every number in this book, and the command that produced it

Run from the repository root. These are the commands, not a description of them.

```bash
# ── Releases: eight, and how long they actually took ──────────────────────
for t in v0.1.25 v0.1.26 v0.1.27 v0.1.28 v0.1.29 v0.1.30 v0.1.31 v0.1.32; do
  printf "%-9s %s\n" "$t" "$(git log -1 --format=%cI $t)"; done
#   -> 2026-08-25T01:46:32Z … 2026-08-26T17:48:00Z = 40.0 hours, two UTC days
#      (the commissioning brief says "four days"; the repository wins)

# whole-site span
git log -1 --format=%cI v0.1.0 ; git log -1 --format=%cI v0.1.35
#   -> 2026-08-19T10:41:53Z … 2026-08-27T00:39:29Z = 182 hours

# ── The register ──────────────────────────────────────────────────────────
ls -d registry/records/*/ | wc -l                       # -> 11 records
ls registry/records/*/*.json | grep -v '/record.json' | wc -l   # -> 23 statements

for f in registry/records/*/*.json; do case "$f" in */record.json);; \
  *) jq -r '.type' $f;; esac; done | sort | uniq -c
#   -> 11 identity · 5 mandate · 4 acceptance · 2 revocation · 1 grant

for d in registry/records/*/; do jq -r '.body.private_key_published' \
  $d/01__identity.json; done | sort | uniq -c            # -> 10 true, 1 false

jq '.roots | length' registry/roots.json                 # -> 1 (fixture)
jq '.roles | length' registry/roles.json                 # -> 4
jq '.cases | length' registry/views/expected-verifications.json   # -> 6

# ── The signature encoding contradiction (Chapter 15, A1) ─────────────────
jq -r '.sig' registry/records/sha256-90f97984b9cf3930/\
02__mandate__pr-create__to-agent-a.json | base64 -d | wc -c      # -> 64 (raw r||s)
jq -r '.signature.algorithm' registry/params.json        # -> "…DER-encoded, base64"

# ── Statements carrying seq/prev (Chapter 15, A8) ─────────────────────────
for f in registry/records/*/*.json; do case "$f" in */record.json);; \
  *) jq -r 'if has("seq") then "HAS" else "no" end' $f;; esac; done | sort | uniq -c
#   -> 23 no.  REP-0001 §2 specifies both with MUSTs

# ── The packs ─────────────────────────────────────────────────────────────
grep -oE '\bGM[0-9]+\b'   packs/grant-and-mandate/src/99__change-control.md \
  | sort -u | wc -l                                      # -> 18 corrections
grep -oE '\bGM-D[0-9]+\b' packs/grant-and-mandate/src/99__change-control.md \
  | sort -u | wc -l                                      # -> 32 decisions
grep -oE '\bC[0-9]+\b'    packs/registry-mvp/src/99__change-control.md \
  | sort -u | wc -l                                      # -> 34 corrections
grep -cE '^\| [0-9]+ \|'  packs/registry-mvp/src/99__change-control.md
#   -> 48 decisions  (the briefing zip still says 23 and 36)

# ── The library ───────────────────────────────────────────────────────────
for f in packs/grant-and-mandate/library/*.json; do
  jq -r '"\(input_filename): \(.nodes|length) nodes, worst_path=\(.worst_path)"' $f; done
#   -> entry 1: 9 nodes, ["n1","n2","n3"]   entry 2: 10 nodes, null

grep -c 'main' packs/grant-and-mandate/library/\
claude-code-remote__ccr-container__2026-08-26.json        # -> 0  (Chapter 15, A2)

# ── The bench ─────────────────────────────────────────────────────────────
grep -c '^## ' bench/llms.txt                            # -> 7
grep 'are built and running' bench/llms.txt              # -> "5 of 7"
grep -A3 'The bench — MVPs' llms.txt                     # -> "Six entries"

# ── The excess-authority row ──────────────────────────────────────────────
jq -r '.rows[] | "grant \(.grant.resources) / mandate \(.mandate.resources) \
/ excess \(.excess_authority.resources) / acceptor \(.excess_authority.acceptor)"' \
  registry/views/excess-authority.json
#   -> grant 41 / mandate 1 / excess 40 / acceptor null

# ── This book ─────────────────────────────────────────────────────────────
wc -w book/content/*.md | tail -1
jq -r '.chapters[] | "\(.file)  \(.words)w  \(.sha256[0:16])…"' book/book.json
jq -r '.figures[] | "\(.id)  tag=\(.tag)  gate=\(.gate)"' book/shots/shots.json
```

## A.6 · Reproducing the verification walk

```bash
git clone https://github.com/SGit-AI/SGit-AI__Website__PKI && cd SGit-AI__Website__PKI
pip3 install cryptography
cd registry && python3 tools/registry_tool.py validate
#   -> 11 records (10 fixtures, 1 real), 23 statements, every signature verified,
#      every reference resolves, all 6 expected answers reproduced
```

And the forgery, which needs nothing but `openssl`:

```bash
R=registry/records/sha256-90f97984b9cf3930
printf '{"forged":"anyone can sign this"}' > forged.json
openssl dgst -sha256 -sign $R/private/sign.pem forged.json > forged.der
openssl dgst -sha256 -verify $R/public/sign.pem -signature forged.der forged.json
#   -> Verified OK.
```

## A.7 · Reproducing every figure

```bash
./book/shots/capture-all.sh      # transcripts, then figures, then shots.json
```

Or one at a time, with a port you have not used:

```bash
./book/shots/travel.sh v0.1.26 8902 book/shots/jobs/v0.1.26.json
./book/shots/travel.sh current  8903 book/shots/jobs/current.json
./book/shots/travel.sh current  8904 book/shots/jobs/term.json
```

`shots.json` carries the retake command for every figure individually, alongside its tag, its gate, and the digest that gate checks.

### The figures in this book

| # | Tag | Gate | Page |
|---|---|---|---|
| 1 | current | fresh | `/bench/index.html` |
| 2a | **v0.1.26** | re-derivable | `/registry/index.html` |
| 2b | current | fresh | `/registry/index.html` |
| 3 | current | fresh | `/registry/index.html`, the answers table |
| 4 | current | fresh | terminal — the fixture flag, `jq` over a record |
| 5 | current | fresh | terminal — `registry_tool.py validate` |
| 6 | current | fresh | terminal — `sgit pki import` + `verify` |
| 7 | current | fresh | terminal — the forgery |
| 8 | **v0.1.28** | fresh | terminal — the refused push, re-run against that tag's `mandate-v1.json` |
| 8b | **v0.1.28** | fresh | terminal — the same command against the mandate that tag ships |
| 9 | current | fresh | the blocks gallery, tier badges |
| 10 | current | fresh | the blocks gallery, the defeated boundary |
| 11 | current | fresh | the blocks gallery, the authority/enforcement split |
| 12 | current | fresh | `/assess/index.html` |

Figures 8 and 8b are transcripts produced at `v0.1.28` and rendered today, so their gate is the freshness of the rendered page rather than the re-derivability of a page at a tag; the transcript bytes are what carry the tag, and `sha256sum book/shots/transcripts/*.txt` is what checks them.

Every one of them can be re-taken, by anybody, with the scripts in this appendix. That is the property this book rests on: not that you should trust the figures, but that you do not have to.

## A.8 · What this harness does not establish

**It proves a figure came from a version. It does not prove the version was honest.** Every gate here checks provenance — that this image came from that tag, that this quote is in that file. None of them checks whether the page was telling the truth at the time.

**The fresh gate is a maintenance cost, not a guarantee.** It fails on the next release, which is the point, and a maintainer under time pressure re-records the digest rather than re-examining the figure. The gate cannot tell the difference.

**And the transcripts were run in one environment.** `registry_tool.py validate` needed a working `cryptography` install, which the system Python in the writing environment did not have; a virtual environment supplied it. The outputs are real and they are one machine's.
