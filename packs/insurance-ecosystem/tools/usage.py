#!/usr/bin/env python3
"""usage.py — the token meter. Four counters summed from a Claude Code transcript, never one.

    usage.py --transcript PATH               # print the four totals, and the span they cover
    usage.py --from-hook --append            # a Stop hook: transcript_path and session_id from stdin; append a tokens event
    usage.py --transcript PATH --append      # the same by hand

Every assistant line of the transcript JSONL carries message.usage with input_tokens,
cache_creation_input_tokens, cache_read_input_tokens and output_tokens. That is undocumented, was verified
by reading 1,850 such lines on 3 September 2026, and is the only meter for tokens this environment has.
A policy written against input_tokens alone would be wrong by four orders of magnitude (document 03).

Appending is idempotent per transcript: a tokens event records the timestamp it counted through, and
the next run counts only lines after it. Verdict is "measured": the token policy has no bands yet.
"""
import argparse, datetime as dt, json, os, sys, uuid
HERE = os.path.dirname(os.path.abspath(__file__)); PACK = os.path.dirname(HERE)
COUNTERS = ("input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens")

def new_id(t): return t.strftime("%Y-%m-%dT%H-%M-%SZ") + "__" + uuid.uuid4().hex[:8]

def measure(path, after=None):
    tot = {k: 0 for k in COUNTERS}; n = 0; first = last = None; session = None
    for line in open(path, encoding="utf-8", errors="replace"):
        try: d = json.loads(line)
        except Exception: continue
        if d.get("type") != "assistant": continue
        u = (d.get("message") or {}).get("usage")
        ts = d.get("timestamp")
        if not u or not ts: continue
        if after and ts <= after: continue
        session = session or d.get("sessionId")
        n += 1; first = first or ts; last = ts
        for k in COUNTERS: tot[k] += int(u.get(k) or 0)
    return tot, n, first, last, session

def last_through(ledger, transcript):
    d = os.path.join(ledger, "events"); best = None
    if not os.path.isdir(d): return None
    for n in sorted(os.listdir(d)):
        if not n.endswith(".json"): continue
        try: e = json.load(open(os.path.join(d, n)))
        except Exception: continue
        if e.get("unit") == "tokens" and (e.get("ref") or {}).get("transcript") == transcript:
            t = (e.get("ref") or {}).get("through")
            if t and (best is None or t > best): best = t
    return best

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--transcript"); ap.add_argument("--from-hook", action="store_true")
    ap.add_argument("--append", action="store_true"); ap.add_argument("--ledger", default=os.path.join(PACK, "ledger"))
    ap.add_argument("--policies", default=os.path.join(PACK, "policies")); ap.add_argument("--subject", default="pki-site-session")
    ap.add_argument("--all", action="store_true", help="count from the start even if an earlier tokens event exists")
    ap.add_argument("--test", action="store_true")
    a = ap.parse_args()
    session_id = None
    if a.from_hook:
        try: j = json.load(sys.stdin); a.transcript = j.get("transcript_path"); session_id = j.get("session_id")
        except Exception: return 0
    if not a.transcript or not os.path.exists(a.transcript): print("no transcript", file=sys.stderr); return 0 if a.from_hook else 1
    after = None if a.all else last_through(a.ledger, a.transcript)
    tot, n, first, last, sess = measure(a.transcript, after)
    session_id = session_id or sess or "unknown"
    total = sum(tot.values())
    print(f"transcript {os.path.basename(a.transcript)} · {n} assistant messages{' after ' + after if after else ''} · {first} → {last}")
    for k in COUNTERS: print(f"  {k:<30} {tot[k]:>15,}")
    print(f"  {'all four together':<30} {total:>15,}   (the obvious counter alone: {tot['input_tokens']:,})")
    if not a.append or n == 0: return 0
    try:
        cur = json.load(open(os.path.join(a.policies, a.subject, "current.json")))["current"]
        p = json.load(open(os.path.join(a.policies, a.subject, cur + ".json")))
    except Exception as ex:
        print(f"no token policy readable ({ex}); the event is written without one", file=sys.stderr); p = {"id": None, "rules_version": None, "policyholder": {"who": None}}
    now = dt.datetime.now(dt.timezone.utc)
    e = {"type": "event/v1", "id": new_id(now), "at": now.isoformat(timespec="seconds"), "day": now.strftime("%Y-%m-%d"),
         "policy": p.get("id"), "rules_version": p.get("rules_version"), "subject": f"session:{str(session_id)[:8]}",
         "policyholder": (p.get("policyholder") or {}).get("who"), "point": "stop", "unit": "tokens", "amount": tot, "verdict": "measured",
         "drawn": 0, "pool_left": None, "acceptor": None, "reason": f"{total:,} tokens over {n} assistant messages; no bands in force",
         "ref": {"transcript": a.transcript, "from": first, "through": last, "messages": n}, "test": bool(a.test)}
    d = os.path.join(a.ledger, "events"); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, e["id"] + ".json")
    json.dump(e, open(path, "w"), indent=1, sort_keys=True); open(path, "a").write("\n")
    print(f"appended {os.path.relpath(path)}"); return 0

if __name__ == "__main__": sys.exit(main())
