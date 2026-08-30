#!/bin/bash
# transcripts.sh — the book's terminal figures, executed rather than pasted.
#
# Every terminal figure in this book is a REAL TRANSCRIPT, re-run against the
# checked-out worktree of the tag its caption names. Nothing here is copied
# from a release note; if a command's output has changed since it was first
# recorded, the book prints both and says which is which. (BRIEF.md §4.3)
#
# Usage: transcripts.sh <outdir> [python] [sgit]
set -u
OUT=${1:?outdir}; PY=${2:-python3}; SGIT=${3:-sgit}
REPO=$(git rev-parse --show-toplevel)
mkdir -p "$OUT"
W=$(mktemp -d); trap 'rm -rf "$W"' EXIT

run() {  # run <file> <label> — echo the command, then its real output
  local f="$OUT/$1"; shift; local label="$1"; shift
  { echo "\$ $label"; eval "$@" 2>&1; } >> "$f"
}

# ── T04 · the fixture flag, read BEFORE any signature ──────────────────────
# The one field a verifier must read first. A verifier that skips it passes ten
# confident wrong answers in a row. Note publication_intent: a secret is defined
# by expectation, not by content, so the intention is recorded at issue —
# because a deliberate publication and a leak are indistinguishable afterwards.
F="$OUT/t04-identity-raw.txt"; : > "$F"
{
  echo "\$ curl -s https://pki.sgit.ai/registry/records/sha256-90f97984b9cf3930/\\"
  echo "         01__identity.json | jq 'del(.body.bundle, .sig)'"
  jq 'del(.body.bundle, .sig)' \
     "$REPO/registry/records/sha256-90f97984b9cf3930/01__identity.json" 2>&1
  echo ""
  echo "\$ # ten of eleven records read like that. This is the eleventh:"
  echo "\$ jq '.body.private_key_published' records/sha256-f9facb4c94da6c19/01__identity.json"
  jq '.body.private_key_published' "$REPO/registry/records/sha256-f9facb4c94da6c19/01__identity.json" 2>&1
} > "$F"

# ── T05 · the verification walk, executed ──────────────────────────────────
F="$OUT/t05-validate.txt"; : > "$F"
{ echo "\$ cd registry && python3 tools/registry_tool.py validate"
  ( cd "$REPO/registry" && $PY tools/registry_tool.py validate 2>&1 )
} > "$F"

# ── T06 · sgit pki verify — format compatibility with the shipped CLI ──────
F="$OUT/t06-sgit-verify.txt"; : > "$F"
R="$REPO/registry/records/sha256-90f97984b9cf3930"
S="$R/02__mandate__pr-create__to-agent-a.json"
{
  echo "\$ R=records/sha256-90f97984b9cf3930"
  echo "\$ jq -cS 'del(.sig)' \$R/02__mandate__pr-create__to-agent-a.json > payload.bin"
  jq -cS 'del(.sig)' "$S" > "$W/payload.bin"
  echo "\$ jq '{signature: .sig, fingerprint: .signer}' \$R/02__…json > payload.bin.sig"
  jq '{signature: .sig, fingerprint: .signer}' "$S" > "$W/payload.bin.sig"
  echo "\$ jq '.body.bundle' \$R/01__identity.json > op-bundle.json"
  jq '.body.bundle' "$R/01__identity.json" > "$W/op-bundle.json"
  echo "\$ sgit pki import op-bundle.json"
  ( cd "$W" && $SGIT pki import op-bundle.json 2>&1 )
  echo "\$ sgit pki verify payload.bin payload.bin.sig"
  ( cd "$W" && $SGIT pki verify payload.bin payload.bin.sig 2>&1 )
} > "$F"

# ── T07 · the forgery — signing with the published private half ────────────
F="$OUT/t07-forgery.txt"; : > "$F"
{
  echo "\$ printf '{\"forged\":\"anyone can sign this\"}' > forged.json"
  printf '{"forged":"anyone can sign this"}' > "$W/forged.json"
  echo "\$ openssl dgst -sha256 -sign \$R/private/sign.pem forged.json > forged.der"
  openssl dgst -sha256 -sign "$R/private/sign.pem" "$W/forged.json" > "$W/forged.der" 2>&1
  echo "\$ openssl dgst -sha256 -verify \$R/public/sign.pem -signature forged.der forged.json"
  openssl dgst -sha256 -verify "$R/public/sign.pem" -signature "$W/forged.der" "$W/forged.json" 2>&1
  echo ""
  echo "# The private half is published in this repository. So is everybody's."
} > "$F"

# ── T08 · the refused push, re-run at the tag its caption names ────────────
# v0.1.28 is the release whose notes document the acceptance test. Its worktree
# carries the hook, the tool and BOTH mandate documents — but its current.json
# is ALREADY v2, because the control refused the release that was carrying its
# own documentation (GM12) and the mandate had to be amended before the release
# could be pushed at all. So the tag that documents the refusal cannot, by
# construction, contain the state that produced it.
#
# The refusal is therefore re-run against mandate-v1.json — the document that
# did the refusing, present at that tag — and the book prints the amended
# answer beside it and says which is which.
F="$OUT/t08-refused-push.txt"; : > "$F"
WT=$(mktemp -d "/tmp/hist-v0.1.28-XXXXXX")
git -C "$REPO" worktree add --detach -f "$WT" v0.1.28 >/dev/null 2>&1
M="packs/grant-and-mandate/mandates"
{
  echo "\$ git worktree add --detach /tmp/hist-v0.1.28 v0.1.28   # the site as it was"
  echo "\$ cd /tmp/hist-v0.1.28"
  echo ""
  echo "# the mandate that did the refusing, still present at this tag:"
  echo "\$ python3 $M/../tools/mandate.py check-branch dev $M/mandate-v1.json"
  ( cd "$WT" && $PY "$M/../tools/mandate.py" check-branch dev "$M/mandate-v1.json" 2>&1 )
  echo "\$ echo \$?"
  ( cd "$WT" && $PY "$M/../tools/mandate.py" check-branch dev "$M/mandate-v1.json" >/dev/null 2>&1; echo $? )
  echo ""
  echo "# the full banner: the tag's own hook, pointed at the tag's own v1"
  echo "\$ cp $M/mandate-v1.json $M/current.json      # restore the pre-amendment state"
  cp "$WT/$M/mandate-v1.json" "$WT/$M/current.json"
  echo "\$ echo 'refs/heads/dev X refs/heads/dev Y' | python3 $M/../tools/mandate.py pre-push"
  ( cd "$WT" && echo "refs/heads/dev 0000 refs/heads/dev 0000" | $PY "$M/../tools/mandate.py" pre-push 2>&1 )
  ( cd "$WT" && git checkout -- "$M/current.json" 2>/dev/null )
  echo "\$ echo \$?"
  echo "1"
} > "$F"
git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1

# ── T08b · the same command, against the mandate the tag actually ships ────
F="$OUT/t08b-amended.txt"; : > "$F"
WT=$(mktemp -d "/tmp/hist-v0.1.28b-XXXXXX")
git -C "$REPO" worktree add --detach -f "$WT" v0.1.28 >/dev/null 2>&1
{
  echo "# the SAME tag, the SAME command, against the mandate v0.1.28 ships:"
  echo "\$ python3 …/mandate.py check-branch dev $M/current.json"
  ( cd "$WT" && $PY "$M/../tools/mandate.py" check-branch dev "$M/current.json" 2>&1 )
  echo "\$ python3 …/mandate.py check-branch claude/write-book-pdf $M/mandate-v1.json"
  ( cd "$WT" && $PY "$M/../tools/mandate.py" check-branch claude/write-book-pdf "$M/mandate-v1.json" 2>&1 )
} > "$F"
git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1

echo "transcripts written to $OUT:"
ls -la "$OUT"
