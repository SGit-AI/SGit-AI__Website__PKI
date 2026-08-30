#!/bin/bash
# capture-all.sh — every figure in the book, each from the version its caption
# names. Ports ascend and are never reused (BRIEF.md §4.1).
set -u
cd "$(git rev-parse --show-toplevel)"
PY_BIN=${PY_BIN:-python3}
SGIT_BIN=${SGIT_BIN:-sgit}
BASE=${BASE_PORT:-8900}

echo "== 1. terminal transcripts, executed =="
./book/shots/transcripts.sh book/shots/transcripts "$PY_BIN" "$SGIT_BIN" >/dev/null
python3 book/shots/mkterm.py book/shots/transcripts book/shots/term

echo "== 2. figures, each at its tag =="
rc=0
i=0
for spec in book/shots/jobs/*.json; do
  tag=$(python3 -c "import json,sys;print(json.load(open('$spec'))['tag'])")
  port=$((BASE + i)); i=$((i + 1))
  ./book/shots/travel.sh "$tag" "$port" "$spec" || rc=1
done

echo "== 3. shots.json =="
python3 book/shots/build-shots.py || rc=1
exit $rc
