#!/usr/bin/env bash
# CI owns the version (https://newsroom.sgit.ai/articles/ci-owns-the-version.html), as on web-summit.sgit.ai and
# newsroom.sgit.ai: nobody who pushes writes a number. Called by the release job with BRANCH=dev, after the gate
# passed on the pushed commit:
#   1. take the branch head as it is now (a push that landed meanwhile rides this release),
#   2. read the newest version (the newest tag, or version.txt if it is higher) and bump the last number,
#   3. write admin/build/version.txt and the admin/versions.html row (the pushed subject), stamp the chrome
#      (chrome.py: assets/version.js, llms.txt, index.md), release lib/ when its code changed (release_lib.mjs,
#      signed when PKI_AGENT_KEY is set), and run the gate on exactly that tree,
#   4. commit as GitHub Actions ("site vX.Y.Z: <the pushed subject>"), tag that commit, push the branch, then the
#      tag; if the branch moved, start again from its new head (three tries).
# The release job then deploys the tree this script built and checked. PUSH=0 does everything but push.
set -euo pipefail
BRANCH=${BRANCH:?BRANCH must be set (dev)}
PUSH=${PUSH:-1}
git config user.name 'GitHub Actions'; git config user.email 'actions@github.com'

# guard (a warning, not a stop): only CI writes version.txt; a number written by hand is replaced
if [ -n "${BEFORE:-}" ] && git cat-file -e "$BEFORE" 2>/dev/null; then
  if git log --format=%an "$BEFORE..HEAD" -- admin/build/version.txt | grep -qv '^GitHub Actions$'; then
    echo "::warning::version.txt was edited outside CI since ${BEFORE:0:9}; CI's number replaces it (only CI writes the version)"
  fi
fi

for try in 1 2 3; do
  git fetch --quiet --tags origin "$BRANCH"
  git checkout -q -B "$BRANCH" "origin/$BRANCH"
  SUBJECT=$(git log -1 --format=%s)
  # the head is already CI's release (a re-run): check it and deploy it again, no new number
  HEADVER=$(grep -oP '^site v\K[0-9]+\.[0-9]+\.[0-9]+(?=:)' <<< "$SUBJECT" || true)
  if [ -n "$HEADVER" ] && [ "$(git log -1 --format=%an)" = 'GitHub Actions' ]; then
    echo "the head is already a CI release ($SUBJECT); checking it to deploy, no new number"
    node admin/build/validate.js; exit 0
  fi
  LAST_TAG=$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' | sort -V | tail -1); LAST_TAG=${LAST_TAG:-v0.0.0}
  FILE=$(tr -d '[:space:]' < admin/build/version.txt 2>/dev/null || echo v0.0.0)
  LAST=$(printf '%s\n%s\n' "$LAST_TAG" "$FILE" | sort -V | tail -1)
  IFS=. read -r A B C <<< "${LAST#v}"
  NEW="v$A.$B.$((C + 1))"
  echo "newest version $LAST (tag $LAST_TAG, version.txt $FILE) -> $NEW on $BRANCH"

  printf '%s\n' "$NEW" > admin/build/version.txt
  WHAT=$(sed -E 's/^site v[0-9.]+: //' <<< "$SUBJECT")
  # the release history row, newest first: what shipped is the pushed subject (escaped), and where it came from
  node -e '
    const fs = require("fs"), [v, what, from] = process.argv.slice(1), f = "admin/versions.html"
    const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const d = new Date(), date = `${d.getUTCDate()} ${d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`
    const t = fs.readFileSync(f, "utf8")
    if (t.includes(`class="vnum">${v}<`)) process.exit(0)
    const row = `    <tr>\n<td class="vnum">${v}</td>\n<td class="vdate">${date}</td>\n<td>${esc(what)} <span class="dim">(released by CI from ${from})</span></td>\n    </tr>\n`
    if (!t.includes("<tbody>\n")) { console.error("admin/versions.html: no <tbody> to add the row to"); process.exit(1) }
    fs.writeFileSync(f, t.replace("<tbody>\n", "<tbody>\n" + row))' "$NEW" "$WHAT" "$(git rev-parse --short=9 HEAD)"
  python3 admin/build/chrome.py > /dev/null
  node admin/build/release_lib.mjs
  node admin/build/validate.js
  git add -A
  git commit -q -m "site $NEW: $WHAT" -m "Released by CI from $(git rev-parse --short HEAD) ($SUBJECT)"
  git tag "$NEW"
  [ "$PUSH" = 1 ] || { echo "PUSH=0: would release $NEW"; exit 0; }
  if git push -q origin "HEAD:$BRANCH"; then git push -q origin "refs/tags/$NEW"; echo "released $NEW"; exit 0; fi
  git tag -d "$NEW" > /dev/null
  echo "$BRANCH moved while releasing; taking it in (attempt $try)"
done
echo "::error::$BRANCH kept moving; nothing released"; exit 1
