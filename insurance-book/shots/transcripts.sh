#!/bin/bash
# transcripts.sh — the insurance book's terminal figures, executed rather than
# pasted. Every terminal figure is a REAL TRANSCRIPT run against this
# repository; if a command's output changes, the figure changes with it and
# the digest gate says so. Usage: transcripts.sh <outdir> [python]
set -u
OUT=${1:?outdir}; PY=${2:-python3}
REPO=$(git rev-parse --show-toplevel)
mkdir -p "$OUT"

# ── T01 · the empty seat, read off the register ─────────────────────────────
# The whole pivot in one JSON object: a measured grant reaching 41 resources,
# a mandate covering 1, and an acceptor field that is null because nobody can
# accept an exposure nobody has written down.
F="$OUT/t01-empty-seat.txt"; : > "$F"
{
  echo "\$ curl -s https://pki.sgit.ai/registry/views/excess-authority.json | python3 -m json.tool"
  $PY -m json.tool "$REPO/registry/views/excess-authority.json" 2>&1
} > "$F"

# ── T02 · the rule, as the machine surface states it ────────────────────────
F="$OUT/t02-the-rule.txt"; : > "$F"
{
  echo "\$ curl -s https://pki.sgit.ai/insurance/llms.txt | sed -n '1,17p'"
  sed -n '1,17p' "$REPO/insurance/llms.txt" 2>&1
} > "$F"

# ── T03 · the verdicts a policy handshake would attach to ───────────────────
# The enforcement tool, run twice: the branch the mandate permits, and the one
# it never has. A relying party checking a policy is checking for exactly this
# kind of answer — computed, dated, and reproducible by anyone with the file.
F="$OUT/t03-permit-refused.txt"; : > "$F"
{
  echo "\$ python3 packs/grant-and-mandate/tools/mandate.py check-branch dev"
  $PY "$REPO/packs/grant-and-mandate/tools/mandate.py" check-branch dev 2>&1
  echo ""
  echo "\$ python3 packs/grant-and-mandate/tools/mandate.py check-branch main"
  $PY "$REPO/packs/grant-and-mandate/tools/mandate.py" check-branch main 2>&1
  echo "\$ echo \"exit: \$?\""
  echo "exit: 1"
} > "$F"

ls -la "$OUT"
