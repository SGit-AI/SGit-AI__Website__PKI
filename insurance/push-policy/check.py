#!/usr/bin/env python3
"""check.py — the push-policy check. A verdict from two documents and one measurement.

    python3 check.py --branch dev                 # verdict for pushing HEAD to origin/dev; appends to the ledger
    python3 check.py --branch dev --dry-run       # verdict only, ledger untouched
    python3 check.py --backtest 12                # what the policy would have said about the last 12 commits on this branch

The measurement: bytes of objects reachable from HEAD and not from the remote ref — what git
would have to send — as uncompressed object sizes. That is a floor (packing compresses), and a
floor is what this estate's grant rule prefers over a guess.

The verdict is a subtraction. There is no model, no score, no judgement: the policy says the
bands, the ledger says what today has already used, git says what this push weighs.
"""
import argparse, datetime as dt, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
POLICY = os.path.join(HERE, "policy.json")
LEDGER = os.path.join(HERE, "ledger.jsonl")          # tracked: the loss data, carried by commits
QUEUE = os.path.join(HERE, "ledger.queue.jsonl")     # ignored by git: what the push checks wrote since the last commit
# A push check runs AFTER the commit it measures exists, so its entry cannot be in that commit. Writing it
# straight into the tracked ledger left the tree dirty after every push, forever (IE9, IE-C6). The entry
# now goes to the queue, and the pack's pre-commit hook drains the queue into ledger.jsonl and stages it,
# so the next commit carries the previous pushes' entries and the tree is clean after a push (IE-C8).

def git(*a):
    return subprocess.run(["git", *a], capture_output=True, text=True, check=True).stdout

def bytes_between(base, head):
    """Sum of uncompressed sizes of objects reachable from head and not from base."""
    objs = git("rev-list", "--objects", head, f"^{base}").split("\n")
    ids = [l.split()[0] for l in objs if l.strip()]
    if not ids: return 0, 0
    out = subprocess.run(["git", "cat-file", "--batch-check=%(objecttype) %(objectsize)"], input="\n".join(ids), capture_output=True, text=True, check=True).stdout
    total = sum(int(l.split()[1]) for l in out.split("\n") if l.startswith("blob "))
    n = sum(1 for l in out.split("\n") if l.startswith("blob "))
    return total, n

def today_entries(ledger, day, branch_kind):
    for line in ledger:
        e = json.loads(line)
        if e["day"] == day and e["branch_kind"] == branch_kind and e["verdict"] != "refused":
            yield e

def verdict(policy, ledger_lines, branch_kind, nbytes, day):
    b = policy["resources"]["bytes"]; p = policy["resources"]["pushes"]["branches"][branch_kind]
    used = list(today_entries(ledger_lines, day, branch_kind))
    pushes_so_far = len(used)
    bytes_drawn_so_far = sum(e.get("bytes_drawn", 0) for e in used)
    pushes_drawn_so_far = sum(1 for e in used if e.get("push_drawn"))
    reasons = []
    # bytes: per-occurrence limit first (a single breach is refused whatever the pool holds)
    if nbytes > b["max_per_push"]:
        return "refused", {"reason": f"{nbytes:,} B is over the per-push maximum of {b['max_per_push']:,} B", "bytes_drawn": 0, "push_drawn": False}
    bytes_excess = max(0, nbytes - b["normal_per_push"])
    bytes_pool_left = b["pool_per_day"] - bytes_drawn_so_far
    if bytes_excess > bytes_pool_left:
        return "refused", {"reason": f"{bytes_excess:,} B over normal but only {max(0,bytes_pool_left):,} B left in today's {b['pool_per_day']:,} B pool", "bytes_drawn": 0, "push_drawn": False}
    # pushes: count
    push_excess = 1 if pushes_so_far + 1 > p["normal"] else 0
    push_pool_left = p["pool"] - pushes_drawn_so_far
    if push_excess and push_pool_left <= 0:
        return "refused", {"reason": f"push {pushes_so_far+1} of the day: normal is {p['normal']} and the pool of {p['pool']} is spent", "bytes_drawn": 0, "push_drawn": False}
    v = "drawn" if (bytes_excess or push_excess) else "normal"
    if bytes_excess: reasons.append(f"{bytes_excess:,} B drawn from the byte pool ({bytes_pool_left - bytes_excess:,} B left after)")
    if push_excess: reasons.append(f"push {pushes_so_far+1} over the normal {p['normal']}: 1 drawn from the push pool ({push_pool_left-1} left after)")
    return v, {"reason": "; ".join(reasons) or f"{nbytes:,} B, push {pushes_so_far+1} of {p['normal']} normal", "bytes_drawn": bytes_excess, "push_drawn": bool(push_excess)}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--branch", help="target branch name (dev, or the agent's own)")
    ap.add_argument("--remote", default="origin")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--override", metavar="REASON", help="record that a HUMAN decided the push proceeds despite a refusal; the reason goes on the ledger. Never for the agent's own convenience")
    ap.add_argument("--backtest", type=int, metavar="N", help="replay the last N commits as if each had been a push (ledger replayed from empty)")
    ap.add_argument("--ref", default="HEAD", help="with --backtest: the ref to walk back from, e.g. origin/dev (default HEAD)")
    a = ap.parse_args()
    policy = json.load(open(POLICY))
    ledger_lines = [l for f in (LEDGER, QUEUE) if os.path.exists(f) for l in open(f).read().splitlines() if l.strip()]

    if a.backtest:
        branch = a.ref if a.ref != "HEAD" else git("rev-parse", "--abbrev-ref", "HEAD").strip()
        kind = "dev" if branch.split("/")[-1] == "dev" else "own"
        commits = git("log", f"-{a.backtest}", "--format=%H %cI %s", a.ref).strip().split("\n")[::-1]
        print(f"backtest: last {len(commits)} commits on {branch} (treated as '{kind}' branch), each as a push, ledger replayed from empty")
        replay = []
        for line in commits:
            h, when, *subj = line.split(" ", 2); subj = subj[0] if subj else ""
            # a root commit, or the boundary of a shallow clone, has no parent to diff against
            if subprocess.run(["git", "rev-parse", "--verify", "-q", f"{h}~1"], capture_output=True).returncode != 0:
                print(f"  {when[:10]} skipped {'':>9}   {'':>4}        {subj[:60]}  — no parent (root commit or shallow boundary)"); continue
            nbytes, nblobs = bytes_between(f"{h}~1", h)
            day = when[:10]
            v, d = verdict(policy, replay, kind, nbytes, day)
            replay.append(json.dumps({"day": day, "branch_kind": kind, "verdict": v, "bytes": nbytes, **d}))
            print(f"  {day} {v:7s} {nbytes:>9,} B {nblobs:>4} blobs  {subj[:60]}  — {d['reason']}")
        return

    if not a.branch: ap.error("--branch is required (or --backtest N)")
    kind = "dev" if a.branch == "dev" else "own"
    git("fetch", a.remote, a.branch)
    nbytes, nblobs = bytes_between(f"{a.remote}/{a.branch}", "HEAD")
    day = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
    v, d = verdict(policy, ledger_lines, kind, nbytes, day)
    entry = {"at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "day": day, "branch": a.branch, "branch_kind": kind, "bytes": nbytes, "blobs": nblobs, "verdict": v, **d, "head": git("rev-parse", "HEAD").strip()}
    print(f"{v.upper()}: {a.branch} ← {nbytes:,} B in {nblobs} new blobs — {d['reason']}")
    if v == "refused" and a.override:
        entry["override"] = a.override
        print(f"OVERRIDDEN by a human decision, on the record: {a.override}")
    # mode: "refuse" (the default — a refusal exits 1 and the push stops) or "notify" — the project lead's relaxation
    # of 5 September (revision 3 in policy.json): the same verdict is computed and recorded; a refusal no longer stops
    # the push. Every entry says which mode produced it, so the ledger stays readable as loss data either way.
    notify = policy.get("mode", "refuse") == "notify"
    entry["mode"] = "notify" if notify else "refuse"
    if v == "refused" and notify and not a.override:
        print("NOTIFICATION ONLY: the policy is in notify mode — this refusal is on the ledger and the push proceeds")
    if not a.dry_run:
        with open(QUEUE, "a") as f: f.write(json.dumps(entry) + "\n")
        print(f"ledger: queued ({os.path.relpath(QUEUE)}) — the next commit drains it into ledger.jsonl")
    sys.exit(0 if (v != "refused" or a.override or notify) else 1)

if __name__ == "__main__":
    main()
