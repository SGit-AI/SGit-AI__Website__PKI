#!/usr/bin/env python3
"""room.py — the maintainer's derivation. Ledger + policies → room/content.json, inlined into room/index.html.

    room.py                                   # the pack's ledger and policies → the pack's room
    room.py --ledger <vault>/ledger --policies <vault>/policies --out <room-vault>/content.json --html <room-vault>/index.html

Nothing here is typed: every number is derived from files, and the footer names the files (the ledger commit, the
sha256 of each policy). Test events (an acceptance run) are shown in their own lane and excluded from the balance.
Correlation is computed across policyholders when there are two; with one it says so.
"""
import argparse, datetime as dt, json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); PACK = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import policy as P

def git_head(path):
    try:
        r = subprocess.run(["git", "-C", path, "rev-parse", "--short=12", "HEAD"], capture_output=True, text=True)
        return r.stdout.strip() or None
    except Exception: return None

def dir_bytes(d):
    n = 0
    for root, _, files in os.walk(d):
        for f in files: n += os.path.getsize(os.path.join(root, f))
    return n

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ledger", default=os.path.join(PACK, "ledger")); ap.add_argument("--policies", default=os.path.join(PACK, "policies"))
    ap.add_argument("--out", default=os.path.join(PACK, "room", "content.json")); ap.add_argument("--html", default=os.path.join(PACK, "room", "index.html"))
    ap.add_argument("--day"); ap.add_argument("--by", default="the maintainer runbook (tools/room.py)")
    a = ap.parse_args()
    now = P.utcnow(); day = a.day or now.strftime("%Y-%m-%d")
    events = P.read_dir(a.ledger, "events"); requests = P.read_dir(a.ledger, "requests"); decisions = P.read_dir(a.ledger, "decisions")
    decided = {d.get("request"): d for d in decisions}
    policies = []
    for subj in sorted(os.listdir(a.policies)):
        d = os.path.join(a.policies, subj)
        if not os.path.isdir(d) or not os.path.exists(os.path.join(d, "current.json")): continue
        p, path = P.load_current(a.policies, subj)
        errs = P.validate(p)
        acc = [x for x in decisions if x.get("decision") == "accept" and any(r.get("kind") == "acceptance" and r.get("policy") == p["id"] and r["id"] == x.get("request") for r in requests)]
        policies.append({"subject_slug": subj, "id": p["id"], "path": os.path.relpath(path, PACK), "sha256": P.sha256_file(path), "valid": not errs, "errors": errs,
                         "issuer": p["issuer"]["who"], "policyholder": p["policyholder"]["who"], "subject": p["subject"]["who"], "interval": p["interval"],
                         "rules_version": p["rules_version"], "in_force": P.in_force(p, day), "supersedes": p.get("supersedes"), "suspended": p.get("suspended"),
                         "awaiting_acceptance": bool(p.get("supersedes")) and not acc,
                         "units": [{k: u.get(k) for k in ("unit", "kind", "meter", "normal", "per_occurrence", "pool", "bands", "pool_scope", "counters")} for u in p["units"]],
                         "exclusions": [{"unit": u["unit"], "above": u["exclusion"].get("above"), "reason": u["exclusion"]["reason"]} for u in p["units"] if u.get("exclusion")],
                         "requested_above": (p.get("draw_mode") or {}).get("requested_above") or {}, "reserve": p.get("reserve"), "rating": p.get("rating"),
                         "rate_table": p.get("rate_table"), "does_not_prove": p.get("does_not_prove"), "_policy": p})
    balances, zones, freq, disagreements, balances_test = {}, {}, {}, [], {}
    for pol in policies:
        p = pol.pop("_policy")
        if not pol["valid"]: continue
        st = P.derive(p, events, day)
        balances[p["id"]] = st; zones[p["id"]] = P.worst_zone(st) if st else "below"
        stt = P.derive(p, events, day, test=True)
        if any(s["events"] for s in stt.values()): balances_test[p["id"]] = stt
        period = 7 if (p.get("rating") or {}).get("period", "week") == "week" else 30
        days = [(now - dt.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(period)]
        real = [e for e in events if e.get("policy") == p["id"] and not e.get("test")]
        observed = sorted({e["day"] for e in real if e.get("day")})
        drawn_days = sorted({e["day"] for e in real if e.get("verdict") == "drawn"})
        freq[p["id"]] = {"period": (p.get("rating") or {}).get("period", "week"), "days_in_period": period, "days_observed": len([d for d in observed if d in days]),
                         "days_drawn": len([d for d in drawn_days if d in days]), "drawn_days": [d for d in drawn_days if d in days], "rule": (p.get("rating") or {}).get("rule")}
        for e in real:
            if e.get("day") != day or e.get("verdict") != "drawn": continue
            key = e["unit"] if not e.get("band") else f"{e['unit']}[{e['band']}]"
            if key in st and e.get("pool_left") is not None and e["pool_left"] < st[key]["pool_left"] - st[key]["pool_effective"]:
                disagreements.append({"event": e["id"], "note": "pool_left at the time is below what today's derivation allows"})
    holders = sorted({e.get("policyholder") for e in events if e.get("policyholder") and not e.get("test")})
    if len(holders) < 2:
        corr = {"computable": False, "policyholders": len(holders), "days": len({e.get("day") for e in events if not e.get("test")}),
                "note": f"not computable: {len(holders)} policyholder{'s' if len(holders) != 1 else ''}. A pool sized on independence fails on the correlated day; this card needs a second policyholder and is specified from week one so that it exists when one arrives"}
    else:
        bydays = {h: {e["day"] for e in events if e.get("policyholder") == h and e.get("verdict") == "drawn" and not e.get("test")} for h in holders}
        alld = set().union(*bydays.values())
        both = len([d for d in alld if sum(1 for h in holders if d in bydays[h]) >= 2])
        corr = {"computable": True, "policyholders": len(holders), "drawn_days_total": len(alld), "days_two_or_more_drew": both,
                "share": (both / len(alld)) if alld else 0, "note": "share of drawing days on which two or more policyholders drew; near 1 means the pool is not diversified"}
    def brief(e):
        return {k: e.get(k) for k in ("id", "at", "day", "policy", "subject", "policyholder", "point", "level", "band", "amount", "verdict", "drawn", "pool_left", "acceptor", "reason", "via_request", "test", "zone", "cause", "ref")}
    # ---- the levels of enforcement (memo 13): events, refusals and catches by level; the last reconcile run
    real = [e for e in events if not e.get("test")]
    layers = {}
    for lvl, name in ((0, "nothing"), (1, "prompt"), (2, "skill / system prompt"), (3, "hook"), (4, "destination"), (5, "post-action, out of band")):
        evs = [e for e in real if (e.get("level") if e.get("level") is not None else P.LEVELS.get(e.get("point"), 3)) == lvl]
        layers[str(lvl)] = {"name": name, "events": len(evs), "refused": len([e for e in evs if e.get("verdict") == "refused"]),
                            "caught": len([e for e in evs if e.get("verdict") == "caught"]), "drawn": len([e for e in evs if e.get("verdict") == "drawn"])}
    runs = sorted(P.read_dir(a.ledger, "reconcile"), key=lambda r: r.get("at") or "")
    last_run = runs[-1] if runs else None
    reconcile = {"runs": len(runs), "last": ({"at": last_run["at"], "by": last_run.get("by"), "checked": len(last_run.get("checked", [])), "catches": len(last_run.get("catches", []))} if last_run else None),
                 "commits_checked": sum(len(r.get("checked", [])) for r in runs), "catches": [brief(e) for e in real if e.get("verdict") == "caught"]}
    ev_sorted = sorted(events, key=lambda e: e.get("at") or "", reverse=True)
    waiting = [r for r in requests if r["id"] not in decided]
    content = {
        "type": "room/v1", "generated_at": P.iso(now), "generated_by": a.by, "day": day,
        "ledger_commit": git_head(a.ledger), "ledger_path": os.path.relpath(a.ledger, PACK),
        "policies": policies, "balances": balances, "balances_test": balances_test, "zones": zones, "layers": layers, "reconcile": reconcile, "draw_frequency": freq, "correlation": corr, "disagreements": disagreements,
        "events": [brief(e) for e in ev_sorted[:80]],
        "requests": {"waiting": sorted(waiting, key=lambda r: r["at"], reverse=True),
                     "decided": [dict(r, decision=decided[r["id"]]) for r in sorted(requests, key=lambda r: r["at"], reverse=True) if r["id"] in decided][:40]},
        "ledger": {"events": len(events), "test_events": len([e for e in events if e.get("test")]), "requests": len(requests), "decisions": len(decisions), "reconcile_runs": len(runs), "bytes": dir_bytes(a.ledger)},
        "stale_after_hours": 24,
    }
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(content, open(a.out, "w"), indent=1, sort_keys=True); open(a.out, "a").write("\n")
    n = 0
    if a.html and os.path.exists(a.html):
        h = open(a.html).read()
        h2, n = re.subn(r"(/\*__DATA__\*/)(.*?)(;\n)", lambda m: m.group(1) + json.dumps(content, sort_keys=True) + m.group(3), h, count=1, flags=re.S)
        if n: open(a.html, "w").write(h2)
    print(f"room: {os.path.relpath(a.out)} written · {len(events)} events ({content['ledger']['test_events']} test) · {len(waiting)} waiting · zones {zones} · inlined into html: {'yes' if n else 'no'}")
    return 0

if __name__ == "__main__": sys.exit(main())
