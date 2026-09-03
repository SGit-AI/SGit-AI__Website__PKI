#!/usr/bin/env python3
"""reconcile.py — level 5: out-of-band verification of the ledger against git itself (memo 13, doctrine 13).

    reconcile.py                       # every commit since the hook was installed that no run has checked yet; writes catches
    reconcile.py --report              # the same, writing nothing (CI, a maintainer looking)
    reconcile.py --last 20 --report    # the last twenty commits on this branch

A hook is a SETTING: it can be bypassed with --no-verify, uninstalled with one config line, or edited. This job
does not try to prevent that. It replays the repository's own history — the thing the hook was supposed to
police — and asks, for each commit, whether the ledger carries the claim the hook should have written, and
whether the commit's measured weight agrees with the verdict recorded for it. A commit with no claim, or a
claim that does not match, is a CATCH: evidence that a lower level failed, and by memo 13's rule an incident
rather than a volume event. Catches are appended as events (point "reconcile", level 5) and each run is
recorded under ledger/reconcile/ so that no commit is checked twice.
"""
import argparse, datetime as dt, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); PACK = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import policy as P

def git(*a): return subprocess.run(["git", *a], capture_output=True, text=True).stdout

def hook_install_commit():
    out = git("log", "--diff-filter=A", "--format=%H", "--", ".githooks/pre-commit").split()
    return out[-1] if out else None

def commit_weight(sha):
    """Uncompressed bytes of blobs reachable from sha and not from its parent, the ledgers' own files excepted; and the file count."""
    if subprocess.run(["git", "rev-parse", "--verify", "-q", f"{sha}~1"], capture_output=True).returncode: return None, None
    objs = git("rev-list", "--objects", sha, f"^{sha}~1").splitlines()
    ids = []
    for l in objs:
        parts = l.split(" ", 1)
        path = parts[1] if len(parts) > 1 else ""
        if "/ledger/" in "/" + path or path.startswith("insurance/push-policy/ledger"): continue
        ids.append(parts[0])
    if not ids: return 0, 0
    out = subprocess.run(["git", "cat-file", "--batch-check=%(objecttype) %(objectsize)"], input="\n".join(ids), capture_output=True, text=True).stdout
    sizes = [int(l.split()[1]) for l in out.splitlines() if l.startswith("blob ")]
    return sum(sizes), len(sizes)

def parse_ts(s):
    try: return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception: return None

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ledger", default=os.path.join(PACK, "ledger")); ap.add_argument("--policies", default=os.path.join(PACK, "policies"))
    ap.add_argument("--subject", default=P.DEFAULT_SUBJECT); ap.add_argument("--since", help="commit (exclusive) to start from; default: the commit that installed .githooks/pre-commit")
    ap.add_argument("--last", type=int, help="instead of --since: the last N commits on HEAD"); ap.add_argument("--window", type=int, default=240, help="seconds between a commit and its claim")
    ap.add_argument("--report", action="store_true", help="write nothing"); ap.add_argument("--by", default="the maintainer runbook (tools/reconcile.py)")
    a = ap.parse_args()
    p, _ = P.load_current(a.policies, a.subject)
    bpc = P.unit_spec(p, "bytes_per_commit")
    since = a.since or hook_install_commit()
    if a.last: rng = ["-n", str(a.last), "HEAD"]
    elif since: rng = [f"{since}..HEAD"]
    else: print("no --since, no --last, and no .githooks/pre-commit in history: nothing to reconcile"); return 0
    log = git("log", "--format=%H|%cI|%s", "--no-merges", *rng).splitlines()
    commits = [l.split("|", 2) for l in log if l.strip()][::-1]
    # A commit made before the hook existed carries no claim and is not a catch: it predates the policy.
    # Whatever the range, only commits after the installing commit are judged (IE-C9).
    install = hook_install_commit()
    if install:
        policed = set(git("rev-list", f"{install}..HEAD").split())
        before = [c for c in commits if c[0] not in policed]
        commits = [c for c in commits if c[0] in policed]
        if before: print(f"  {len(before)} commit(s) in range predate the hook ({install[:12]}) and are not judged: before the policy is not a bypass")
    already = set()
    for r in P.read_dir(a.ledger, "reconcile"): already.update(r.get("checked", []))
    events = [e for e in P.read_dir(a.ledger, "events") if not e.get("test")]
    claims = [e for e in events if e.get("point") == "pre-commit" and e.get("unit") == "commits" and e.get("verdict") in ("normal", "drawn")]
    byte_claims = [e for e in events if e.get("point") == "pre-commit" and e.get("unit") == "bytes_per_commit"]
    used = set(); checked = []; catches = []
    print(f"reconcile · {len(commits)} commit(s) in range · {len([c for c in commits if c[0] not in already])} unchecked · window ±{a.window}s · {'REPORT ONLY' if a.report else 'writing'}")
    for sha, when, subj in commits:
        if sha in already: continue
        t = parse_ts(when); nbytes, nfiles = commit_weight(sha)
        near = lambda e: (e.get("at") and t and abs((parse_ts(e["at"]) - t).total_seconds()) <= a.window)
        cands = [e for e in claims if e["id"] not in used and near(e)]
        cands.sort(key=lambda e: abs((parse_ts(e["at"]) - t).total_seconds()))
        claim = cands[0] if cands else None
        if claim: used.add(claim["id"])
        found = []
        if claim is None:
            found.append(("no-claim", "no pre-commit claim within the window: the hook did not run for this commit"))
        if nbytes is not None and bpc:
            bc = [e for e in byte_claims if near(e)]
            if nbytes > bpc["per_occurrence"] and not any(e.get("verdict") == "accepted_outside" for e in bc):
                found.append(("over-exclusion-unrecorded", f"{nbytes:,} B is over the exclusion ({bpc['per_occurrence']:,} B) and no accepted-as-uninsured claim exists for it"))
            elif bpc["normal"] < nbytes <= bpc["per_occurrence"] and not any(e.get("verdict") == "drawn" for e in bc):
                found.append(("draw-unrecorded", f"{nbytes:,} B is over the normal band and no draw was recorded for it"))
        mark = "✗" if found else "·"
        print(f"  {mark} {sha[:12]} {when[:19]} {'' if nbytes is None else f'{nbytes:>10,} B'} {'' if nfiles is None else f'{nfiles:>3} files'}  {subj[:56]}" + ("".join(f"\n      CATCH {c}: {why}" for c, why in found)))
        checked.append(sha)
        for cause, why in found:
            catches.append({"sha": sha, "at": when, "cause": cause, "why": why, "bytes": nbytes, "files": nfiles, "subject_line": subj})
    print(f"checked {len(checked)} · catches {len(catches)}")
    if a.report or not checked: return 0
    now = P.utcnow()
    for c in catches:
        e = {"type": "event/v1", "id": P.new_id(now), "at": P.iso(now), "day": now.strftime("%Y-%m-%d"), "policy": p["id"], "rules_version": p["rules_version"],
             "subject": a.subject, "policyholder": p["policyholder"]["who"], "point": "reconcile", "level": 5, "unit": "bytes_per_commit" if c["cause"] != "no-claim" else "commits",
             "amount": c["bytes"] if c["cause"] != "no-claim" else 1, "verdict": "caught", "cause": c["cause"], "drawn": 0, "pool_left": None, "acceptor": None,
             "reason": f"{c['why']} — commit {c['sha'][:12]} '{c['subject_line'][:60]}'", "zone": "outside", "ref": {"head": c["sha"][:12], "committed_at": c["at"]}, "test": False}
        P.write_json(a.ledger, "events", e)
    run = {"type": "reconcile/v1", "id": P.new_id(now), "at": P.iso(now), "by": a.by, "range": rng, "checked": checked, "catches": catches, "window_seconds": a.window, "policy": p["id"]}
    path = P.write_json(a.ledger, "reconcile", run)
    print(f"run recorded: {os.path.relpath(path)}" + (f" · {len(catches)} catch event(s) appended (level 5)" if catches else ""))
    return 0

if __name__ == "__main__": sys.exit(main())
