#!/bin/bash
# travel.sh <tag> <port> <jobs.json> — worktree at <tag>, serve, shoot, tear down.
#
# A figure captioned "the register on the day it shipped" that was in fact
# photographed today is a reconstruction — and a reconstruction wearing a
# caption is a claim of authority nobody granted, in a book whose entire
# subject is claims of authority nobody granted. (BRIEF.md §4.1)
#
# A tag, a worktree and a one-shot local server ARE the site as it actually
# was. `git worktree` is what makes this cheap: a second working copy of any
# commit, beside the live one, in under a second, without touching the branch.
#
# NEVER REUSE A PORT — the caller allocates a fresh one per capture and never
# repeats it. ALWAYS KILL WHAT YOU SPAWNED — the trap below runs on success,
# failure and interrupt alike.
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
trap cleanup EXIT INT TERM

echo "travel: $TAG on port $PORT"
if [ "$TAG" = "current" ]; then
  # "current" is the site as it stands: served from the working tree itself,
  # so the digest recorded is the digest of the page a reader fetches today.
  # These are the figures whose gate is FRESH — the build fails when they stop
  # matching, which it will on the next release, and that is correct.
  WT="$REPO"
else
  git -C "$REPO" worktree add --detach -f "$WT" "$TAG" >/dev/null 2>&1 || {
    echo "  worktree failed for $TAG"; exit 1; }
fi

python3 -m http.server "$PORT" --directory "$WT" --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!

# Wait for the server rather than sleeping a guessed amount.
up=0
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:$PORT/" && { up=1; break; }
  sleep 0.25
done
[ "$up" = 1 ] || { echo "  server never came up on $PORT"; exit 1; }

# The SHA-256 of each page's BYTES AT THIS TAG — the digest a figure carries,
# and the thing that makes a past figure re-derivable forever.
JB=$(basename "$JOBS" .json)
DIGESTS="$REPO/insurance-book/shots/.digests-$JB.txt"
: > "$DIGESTS"
for p in $(python3 -c "
import json,sys
spec=json.load(open('$JOBS'))
print('\n'.join(sorted({j['path'] for j in spec['jobs']})))
"); do
  f="$WT$p"
  if [ -f "$f" ]; then
    echo "$p $(sha256sum "$f" | cut -d' ' -f1)" >> "$DIGESTS"
  else
    echo "$p MISSING-AT-$TAG" >> "$DIGESTS"
  fi
done

NODE_PATH=$(npm root -g) node "$REPO/insurance-book/shots/shot.mjs" "$PORT" "$JOBS"
RC=$?
exit $RC
