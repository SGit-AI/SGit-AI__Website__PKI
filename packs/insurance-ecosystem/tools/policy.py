#!/usr/bin/env python3
"""policy.py — the insurance-ecosystem evaluator. One verdict function for any unit, at any decision point.

    policy.py check --point pre-commit                     # bytes_per_commit and commits, from the index; refuses by exit code
    policy.py check --point pre-push --branch dev ...      # branch kind, bytes_per_push, pushes
    policy.py check --unit bytes_per_commit --amount 409600   # a manual reading (tests, demonstrations)
    policy.py briefing                                     # the text a session is handed at start (SessionStart hook)
    policy.py request --unit U --amount N --why "…"        # ask for a draw above the requested threshold
    policy.py decide <request-id> --by WHO --approved|--declined|--accept|--suspend [--note …]
    policy.py supersede <policy-id> --as <new-id> --set units.<unit>.<field>=<n> --why "…"   # a repricing event
    policy.py derive [--day D]                             # today's balance, derived from the ledger, never stored
    policy.py validate                                     # the policy against the schema rules in document 03
    policy.py hook-pre-tool-use                            # Claude PreToolUse handler: the same verdict, early, advisory

The verdict is a subtraction and nothing else: the policy says the bands, the ledger says what today has
already used, the meter (git, the transcript) says what this event weighs. A draw is a claim paid in the
resource and settled here (GM-D97); the acceptor of every draw is the POLICYHOLDER, never the session.

This is a SETTING, not a boundary (GM-D100): it runs where the agent runs, on files the agent can edit.
The banner says so. Default-deny on its own dependencies: an unreadable, invalid or expired policy refuses.
"""
import argparse, datetime as dt, hashlib, json, os, re, socket, subprocess, sys, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(PACK))
DEFAULT_POLICIES = os.path.join(PACK, "policies")
DEFAULT_LEDGER = os.path.join(PACK, "ledger")
DEFAULT_SUBJECT = "pki-site-repo"
RULES_VERSION = "insurance-ecosystem/draft-1"
KINDS = ("volume", "count", "reach", "measure")
TIER_LINE = "This is a SETTING, not a boundary: you could bypass it, and the point is that you do not."

# ---------------------------------------------------------------- small helpers
def utcnow(): return dt.datetime.now(dt.timezone.utc)
def iso(t): return t.isoformat(timespec="seconds")
def new_id(t=None): t = t or utcnow(); return t.strftime("%Y-%m-%dT%H-%M-%SZ") + "__" + uuid.uuid4().hex[:8]
def sha256_file(p):
    h = hashlib.sha256(); h.update(open(p, "rb").read()); return h.hexdigest()
def git(*a, check=True):
    r = subprocess.run(["git", *a], capture_output=True, text=True)
    if check and r.returncode: raise RuntimeError(f"git {' '.join(a)}: {r.stderr.strip()}")
    return r.stdout
def fmt(n): return f"{n:,}" if isinstance(n, int) else str(n)
def session_name(ledger):
    if os.environ.get("IE_SESSION"): return os.environ["IE_SESSION"]
    p = os.path.join(ledger, ".session")
    if os.path.exists(p):
        s = open(p).read().strip()
        if s: return s
    return f"session:unknown@{socket.gethostname()}"

# ---------------------------------------------------------------- policies
def load_current(policies, subject):
    d = os.path.join(policies, subject)
    cur = json.load(open(os.path.join(d, "current.json")))["current"]
    path = os.path.join(d, cur + ".json")
    return json.load(open(path)), path

def validate(p):
    """The schema rules of document 03. A policy that breaks one is refused: default-deny."""
    e = []
    if p.get("type") != "policy/v1": e.append("type must be policy/v1")
    if not p.get("rules_version"): e.append("rules_version is required: a policy is evaluated by the rules it was written against")
    for k in ("issuer", "policyholder", "subject"):
        if not (p.get(k) or {}).get("who"): e.append(f"{k}.who is required")
    iv = p.get("interval") or {}
    for k in ("from", "until", "reinstatement", "timezone"):
        if not iv.get(k): e.append(f"interval.{k} is required (a recurring window states its timezone, GM-D80)")
    dm = p.get("draw_mode") or {}
    if dm.get("default") != "recorded": e.append("draw_mode.default must be 'recorded': silent overflow is not a value")
    if dm.get("acceptor") != "policyholder": e.append("draw_mode.acceptor must be 'policyholder': the agent spends, the team carries")
    units = p.get("units") or []
    if not units: e.append("units must be non-empty")
    for u in units:
        n = u.get("unit", "?")
        if not isinstance(u.get("meter"), str) or not u["meter"].strip():
            e.append(f"unit {n}: meter is required — a unit without a meter needs a judgement, and a judgement does not settle in milliseconds")
        if u.get("kind") not in KINDS: e.append(f"unit {n}: kind must be one of {KINDS}")
        if u.get("kind") in ("volume", "count"):
            bands = [u] if "bands" not in u else list(u["bands"].values())
            for b in bands:
                for k in ("normal", "pool"):
                    if not isinstance(b.get(k), int): e.append(f"unit {n}: {k} must be an integer")
            if u.get("kind") == "volume" and not isinstance(u.get("per_occurrence"), int):
                e.append(f"unit {n}: per_occurrence must be an integer")
        if "exclusion" in u and not (u["exclusion"] or {}).get("reason"):
            e.append(f"unit {n}: every exclusion carries a reason")
    if (p.get("subject") or {}).get("mandate") and not (p.get("subject") or {}).get("mandate_sha256"):
        e.append("subject.mandate_sha256 is required when subject.mandate is set: the policy pins the mandate it prices")
    if (p.get("rate_table") or {}).get("published") is not False: e.append("rate_table.published must be false until the issuer publishes one")
    if not (isinstance(p.get("supersedes"), str) or p.get("supersedes") is None): e.append("supersedes must be a policy id or null")
    if not p.get("does_not_prove"): e.append("does_not_prove is required — the one mandatory field on every document in this estate")
    return e

def in_force(p, day):
    iv = p["interval"]; return iv["from"] <= day <= iv["until"]

def unit_spec(p, name):
    for u in p["units"]:
        if u["unit"] == name: return u
    return None

def band(u, kind_key=None):
    if "bands" in u: return u["bands"][kind_key]
    return u

# ---------------------------------------------------------------- ledger
def read_dir(ledger, sub):
    d = os.path.join(ledger, sub)
    if not os.path.isdir(d): return []
    out = []
    for n in sorted(os.listdir(d)):
        if n.endswith(".json"):
            try: out.append(json.load(open(os.path.join(d, n))))
            except Exception as ex: print(f"  ! unreadable {sub}/{n}: {ex}", file=sys.stderr)
    return out

def write_json(ledger, sub, obj):
    d = os.path.join(ledger, sub); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, obj["id"] + ".json")
    if os.path.exists(path): raise RuntimeError(f"refusing to overwrite {path}: ledger files are only ever added")
    with open(path, "w") as f: json.dump(obj, f, indent=1, sort_keys=True); f.write("\n")
    return path

def in_repo(path):
    try:
        top = git("rev-parse", "--show-toplevel").strip()
        return os.path.abspath(path).startswith(top + os.sep)
    except Exception: return False

# ---------------------------------------------------------------- derivation (never stored)
def derive(p, events, day, test=False):
    """Per unit (and per band), today: used, drawn, pool left with the reserve held back, zone.
    Two lanes, never mixed: the real one (test=False) and the acceptance-run one (test=True), which has its own
    balance so that a run can see its own accumulation without touching what the policyholder has spent (IE-D15)."""
    reserve = float((p.get("reserve") or {}).get("share") or 0)
    out = {}
    for u in p["units"]:
        if u.get("kind") not in ("volume", "count"): continue
        keys = list(u["bands"].keys()) if "bands" in u else [None]
        for bk in keys:
            b = band(u, bk)
            evs = [e for e in events if e.get("unit") == u["unit"] and e.get("day") == day and bool(e.get("test")) == bool(test)
                   and (bk is None or e.get("band") == bk)]
            counted = [e for e in evs if e["verdict"] in ("normal", "drawn")]
            used = len(counted) if u["kind"] == "count" else sum(int(e.get("amount") or 0) for e in counted)
            drawn = sum(int(e.get("drawn") or 0) for e in evs if e["verdict"] == "drawn")
            pool_eff = int(b["pool"] * (1 - reserve))
            pool_left = pool_eff - drawn
            refused = [e for e in evs if e["verdict"] == "refused"]
            zone = "outside" if refused or pool_left < 0 else ("drawing" if drawn > 0 else "below")
            key = u["unit"] if bk is None else f"{u['unit']}[{bk}]"
            out[key] = {"unit": u["unit"], "band": bk, "kind": u["kind"], "normal": b["normal"], "per_occurrence": u.get("per_occurrence"),
                        "pool": b["pool"], "reserve_share": reserve, "pool_effective": pool_eff, "used": used, "drawn": drawn,
                        "pool_left": pool_left, "refused": len(refused), "events": len(evs), "zone": zone}
    return out

def worst_zone(state):
    order = {"below": 0, "drawing": 1, "outside": 2}
    z = "below"
    for s in state.values():
        if order[s["zone"]] > order[z]: z = s["zone"]
    return z

# ---------------------------------------------------------------- requests and decisions
def find_decision(ledger, p, subject, unit, amount, kind, wanted, test=False):
    """An unconsumed decision of the wanted kind ('approved' for a draw request, 'accept' for an escalation)
    on a request for this policy, unit and subject, whose amount covers this one."""
    reqs = {r["id"]: r for r in read_dir(ledger, "requests")}
    consumed = {e.get("via_request") for e in read_dir(ledger, "events") if e.get("via_request")}
    for d in read_dir(ledger, "decisions"):
        r = reqs.get(d.get("request"))
        if not r or d.get("decision") != wanted or r["id"] in consumed: continue
        if r.get("kind") != kind or r.get("policy") != p["id"] or r.get("unit") != unit: continue
        if r.get("subject") != subject or int(r.get("amount") or 0) < int(amount): continue
        if bool(r.get("test")) != bool(test): continue
        return d, r
    return None, None

def waiting_request(ledger, p, subject, unit, amount, kind, test=False):
    decided = {d.get("request") for d in read_dir(ledger, "decisions")}
    for r in read_dir(ledger, "requests"):
        if r["id"] in decided or bool(r.get("test")) != bool(test): continue
        if r.get("kind") == kind and r.get("policy") == p["id"] and r.get("unit") == unit and r.get("subject") == subject and int(r.get("amount") or 0) >= int(amount):
            return r
    return None

# ---------------------------------------------------------------- the verdict
def verdict(p, ledger, state, subject, unit, amount, bk=None, test=False):
    """One subtraction. Returns (verdict, detail dict). Writes nothing."""
    u = unit_spec(p, unit)
    if u is None: return "refused", {"reason": f"unit {unit} is not in policy {p['id']}: uninsured by construction"}
    b = band(u, bk); key = unit if bk is None else f"{unit}[{bk}]"; st = state[key]
    d = {"unit": unit, "band": bk, "amount": amount, "drawn": 0, "pool_left": st["pool_left"], "acceptor": p["policyholder"]["who"]}
    if u["kind"] == "volume":
        if amount > u["per_occurrence"]:
            ex = u.get("exclusion")
            d["reason"] = (f"{fmt(amount)} B is over the per-occurrence limit of {fmt(u['per_occurrence'])} B"
                           + (" — an EXCLUSION" if ex else ""))
            if ex: d["exclusion_reason"] = ex["reason"]
            dec, req = find_decision(ledger, p, subject, unit, amount, "escalation", "accept", test)
            if dec: d.update(via_request=req["id"], accepted_by=dec["by"], reason=d["reason"] + f"; accepted as UNINSURED by {dec['by']} on request {req['id']}"); return "accepted_outside", d
            return "refused", d
        excess = max(0, amount - b["normal"])
    else:
        excess = max(0, st["used"] + amount - b["normal"])
    if excess == 0:
        d["reason"] = f"{fmt(amount)} inside the normal band" if u["kind"] == "volume" else f"{unit} {st['used']+1} of {b['normal']} in the normal band"
        return "normal", d
    thr = ((p.get("draw_mode") or {}).get("requested_above") or {}).get(unit)
    if u["kind"] == "volume" and thr is not None and amount > thr:
        dec, req = find_decision(ledger, p, subject, unit, amount, "draw", "approved", test)
        if dec: d.update(via_request=req["id"], approved_by=dec["by"])
        else:
            w = waiting_request(ledger, p, subject, unit, amount, "draw", test)
            d["reason"] = f"{fmt(amount)} B is above the requested-draw threshold ({fmt(thr)} B)"
            d["waiting"] = w["id"] if w else None
            return "requested", d
    if excess > st["pool_left"]:
        d["reason"] = (f"{fmt(excess)} {'B ' if u['kind']=='volume' else ''}over normal but only {fmt(max(0, st['pool_left']))} left in today's pool of "
                       f"{fmt(st['pool_effective'])} (reserve held back) — the pool is exhausted for every session on this repository today")
        dec, req = find_decision(ledger, p, subject, unit, amount, "escalation", "accept", test)
        if dec: d.update(via_request=req["id"], accepted_by=dec["by"], reason=d["reason"] + f"; accepted as UNINSURED by {dec['by']}"); return "accepted_outside", d
        return "refused", d
    d["drawn"] = excess; d["pool_left"] = st["pool_left"] - excess
    d["reason"] = (f"{fmt(excess)} B drawn from today's pool ({fmt(d['pool_left'])} B left)" if u["kind"] == "volume"
                   else f"{unit} {st['used']+1} over the normal {b['normal']}: 1 drawn from the pool ({fmt(d['pool_left'])} left)")
    if d.get("via_request"): d["reason"] += f" — via request {d['via_request']}, approved by {d['approved_by']}"
    return "drawn", d

# ---------------------------------------------------------------- meters
def staged_bytes():
    """Uncompressed size of the blobs the index adds or changes, versus HEAD. A floor, never a bill."""
    raw = git("diff", "--cached", "--raw", "--diff-filter=AMCR", check=False)
    shas = []
    for line in raw.splitlines():
        m = re.match(r":\d+ \d+ ([0-9a-f]+) ([0-9a-f]+) (\w+)", line)
        if not m: continue
        src, dst = m.group(1), m.group(2)
        if set(dst) == {"0"} or src == dst: continue
        shas.append(dst)
    if not shas: return 0, 0
    out = subprocess.run(["git", "cat-file", "--batch-check=%(objecttype) %(objectsize)"], input="\n".join(shas), capture_output=True, text=True).stdout
    sizes = [int(l.split()[1]) for l in out.splitlines() if l.startswith("blob ")]
    return sum(sizes), len(sizes)

def push_bytes(local_sha, remote_sha, remote):
    if not local_sha or set(local_sha) == {"0"}: return 0, 0          # a deletion pushes nothing
    if not remote_sha or set(remote_sha) == {"0"}:
        objs = git("rev-list", "--objects", local_sha, "--not", f"--remotes={remote}")
    else:
        objs = git("rev-list", "--objects", local_sha, f"^{remote_sha}")
    ids = [l.split()[0] for l in objs.splitlines() if l.strip()]
    if not ids: return 0, 0
    out = subprocess.run(["git", "cat-file", "--batch-check=%(objecttype) %(objectsize)"], input="\n".join(ids), capture_output=True, text=True).stdout
    sizes = [int(l.split()[1]) for l in out.splitlines() if l.startswith("blob ")]
    return sum(sizes), len(sizes)

def branch_kind(branch): return "dev" if branch == "dev" else "own"

# ---------------------------------------------------------------- check
BANNER = "  ┌──────────────────────────────────────────────────────────────────────┐\n  │  {:<68} │\n  └──────────────────────────────────────────────────────────────────────┘"

def cmd_check(a):
    ledger, policies = a.ledger, a.policies
    subject = a.subject_instance or session_name(ledger)
    try:
        p, ppath = load_current(policies, a.subject)
    except Exception as ex:
        print(BANNER.format("REFUSED: no readable policy — default-deny") + f"\n  {ex}", file=sys.stderr); return 1
    errs = validate(p)
    if errs:
        print(BANNER.format("REFUSED: the policy fails its own schema — default-deny"), file=sys.stderr)
        for e in errs: print("   · " + e, file=sys.stderr)
        return 1
    now = utcnow(); day = now.strftime("%Y-%m-%d")
    if not in_force(p, day):
        print(BANNER.format(f"REFUSED: policy {p['id']} is not in force on {day}") + f"\n  interval {p['interval']['from']} → {p['interval']['until']}. Uninsured.", file=sys.stderr); return 1
    events = read_dir(ledger, "events")
    state = derive(p, events, day, test=bool(a.test))
    ref = {}
    # --- the readings
    if a.point == "pre-commit":
        n, blobs = staged_bytes()
        readings = [("bytes_per_commit", n, None), ("commits", 1, None)]
        ref = {"blobs": blobs, "branch": git("rev-parse", "--abbrev-ref", "HEAD", check=False).strip()}
    elif a.point == "pre-push":
        kind = branch_kind(a.branch)
        n, blobs = push_bytes(a.local_sha, a.remote_sha, a.remote)
        readings = [("bytes_per_push", n, None), ("pushes", 1, kind)]
        ref = {"blobs": blobs, "branch": a.branch, "remote": a.remote, "head": (a.local_sha or "")[:12]}
    else:
        if not a.unit or a.amount is None: print("--unit and --amount are required without --point", file=sys.stderr); return 2
        readings = [(a.unit, a.amount, a.band)]
    # --- the verdicts, all computed before anything is written
    results = []
    for unit, amount, bk in readings:
        v, d = verdict(p, ledger, state, subject, unit, amount, bk, test=bool(a.test))
        results.append((v, d))
    blocking = [(v, d) for v, d in results if v in ("refused", "requested")]
    written = []
    def event(v, d, extra=None):
        e = {"type": "event/v1", "id": new_id(now), "at": iso(now), "day": day, "policy": p["id"], "rules_version": p["rules_version"],
             "subject": subject, "policyholder": p["policyholder"]["who"], "point": a.point or "manual",
             "unit": d["unit"], "amount": d["amount"], "verdict": v, "drawn": d.get("drawn", 0), "pool_left": d.get("pool_left"),
             "acceptor": (p["policyholder"]["who"] if v == "drawn" else d.get("accepted_by")), "reason": d["reason"], "ref": ref, "test": bool(a.test)}
        if d.get("band"): e["band"] = d["band"]
        if d.get("via_request"): e["via_request"] = d["via_request"]
        if v in ("refused", "accepted_outside"): e["zone"] = "outside"
        if extra: e.update(extra)
        if not a.dry_run: written.append(write_json(ledger, "events", e))
        return e
    def request(kind, d):
        r = {"type": "request/v1", "id": new_id(now), "kind": kind, "at": iso(now), "policy": p["id"], "subject": subject,
             "unit": d["unit"], "amount": d["amount"], "excess": max(0, d["amount"] - band(unit_spec(p, d["unit"]), d.get("band"))["normal"]) if unit_spec(p, d["unit"])["kind"] == "volume" else 1,
             "why": d["reason"], "status": "waiting", "test": bool(a.test)}
        if not a.dry_run: written.append(write_json(ledger, "requests", r))
        return r
    if blocking:
        v, d = blocking[0]
        if v == "refused":
            print(BANNER.format(f"{(a.point or 'ACTION').upper()} REFUSED BY THE POLICY — a SETTING, not a boundary"))
            print(f"  ✗ {d['unit']}  {d['reason']}")
            if d.get("exclusion_reason"): print(f"    reason: {d['exclusion_reason']}")
            print(f"    zone: OUTSIDE COVER. This action is uninsured.")
            event("refused", d)
            w = waiting_request(ledger, p, subject, d["unit"], d["amount"], "escalation", bool(a.test))
            if w: print(f"    an escalation is already waiting: {w['id']}")
            else:
                r = request("escalation", d)
                print(f"    an escalation has been written: ledger/requests/{r['id']}.json")
            print("    what to do: stop this class of action. Do not split, do not --no-verify, do not edit the policy.")
            print("               Tell the human what was refused, with the numbers. The approver answers the escalation.")
        else:
            print(BANNER.format(f"{(a.point or 'ACTION').upper()} REFUSED UNTIL A DECISION EXISTS — a requested draw"))
            print(f"  ? {d['unit']}  {d['reason']}")
            if d.get("waiting"): print(f"    a request is already waiting: ledger/requests/{d['waiting']}.json")
            else:
                r = request("draw", d)
                print(f"    a request has been written: ledger/requests/{r['id']}.json")
            print("    this action is refused until a decision exists. Ask the approver, quote the id, wait.")
            print("    do not split the action to get under the threshold.")
        print(f"  {TIER_LINE}")
        if a.dry_run: print("  (dry run: nothing written)")
        return 1
    # --- nothing blocked: write what the ledger needs, say only what must be said
    for v, d in results:
        u = unit_spec(p, d["unit"])
        if v == "drawn":
            if not a.dry_run: print(f"  DRAWN  {d['unit']}  {fmt(d['amount'])}{' B' if u['kind']=='volume' else ''} · {d['reason']} · acceptor: {p['policyholder']['who']}")
            event("drawn", d)
        elif v == "accepted_outside":
            if not a.dry_run: print(f"  ACCEPTED AS UNINSURED  {d['unit']}  {d['reason']}")
            event("accepted_outside", d)
        elif v == "normal" and u["kind"] == "count":
            event("normal", d)                       # countable: the eleventh needs the ten before it
        # volume + normal: silence below cover
    if a.point == "pre-commit" and written and not a.dry_run and in_repo(ledger):
        git("add", "--", *written)                   # the commit carries its own claim (IE-D12)
    if a.dry_run:
        for v, d in results: print(f"  {v.upper()}  {d['unit']}  {d['reason']}")
    return 0

# ---------------------------------------------------------------- briefing
def hooks_installed():
    hp = git("config", "core.hooksPath", check=False).strip()
    top = git("rev-parse", "--show-toplevel", check=False).strip()
    if not hp or not top: return "core.hooksPath NOT set — the hooks do not run", False
    d = os.path.join(top, hp)
    pc = os.path.exists(os.path.join(d, "pre-commit")); pp = os.path.exists(os.path.join(d, "pre-push"))
    return f"pre-commit {'installed' if pc else 'MISSING'} · pre-push {'installed' if pp else 'MISSING'} · core.hooksPath={hp}", pc and pp

def cmd_briefing(a):
    ledger = a.ledger
    if a.from_hook:                      # SessionStart passes its JSON on stdin; by hand there is nothing to read
        try:
            j = json.load(sys.stdin)
            sid = j.get("session_id")
            if sid:
                os.makedirs(ledger, exist_ok=True)
                open(os.path.join(ledger, ".session"), "w").write(f"session:{sid[:8]}\n")
        except Exception: pass
    subject = a.subject_instance or session_name(ledger)
    try: p, ppath = load_current(a.policies, a.subject)
    except Exception as ex:
        print(f"INSURANCE POLICY — none readable ({ex}). You are UNINSURED: every commit will be refused by default-deny."); return 0
    now = utcnow(); day = now.strftime("%Y-%m-%d")
    events = read_dir(ledger, "events"); state = derive(p, events, day)
    decided = {d.get("request") for d in read_dir(ledger, "decisions")}
    waiting = [r for r in read_dir(ledger, "requests") if r["id"] not in decided]
    hooks, ok = hooks_installed()
    L = []
    L.append("INSURANCE POLICY — read this before your first commit.")
    L.append("")
    L.append(f"You are the INSURED ({subject}): a session acting as {p['subject']['who']} under policy {p['id']},")
    L.append(f"issued by {p['issuer']['who']}, in force {p['interval']['from']} → {p['interval']['until']}, rules {p['rules_version']}.")
    L.append(f"The POLICYHOLDER is {p['policyholder']['who']}: every draw you make is accepted in its name, and the rating lands on it, not on you.")
    if not in_force(p, day): L.append(f"!! The policy is NOT IN FORCE today ({day}). You are uninsured; every commit will be refused.")
    L.append("")
    L.append(f"TODAY ({day}, {p['interval']['timezone']}), on this repository, all sessions together:")
    for key, s in state.items():
        unit = key
        if s["kind"] == "count":
            L.append(f"  {unit:<22} {s['used']} of {s['normal']} in the normal band · pool {s['pool_effective']} (reserve held back), {s['pool_left']} left")
        else:
            L.append(f"  {unit:<22} normal {fmt(s['normal'])} B · limit {fmt(s['per_occurrence'])} B{' (an exclusion)' if unit_spec(p, s['unit']).get('exclusion') else ''} · pool {fmt(s['pool_effective'])} B, {fmt(s['pool_left'])} B left")
    z = worst_zone(state)
    L.append(f"  {'zone':<22} {z.upper()}" + {"below": " — nothing drawn today", "drawing": " — a draw was recorded today", "outside": " — a refusal today: this repository is OUTSIDE COVER for that unit"}[z])
    L.append(f"  {'waiting':<22} {len(waiting)} request(s)" + ("".join(f"\n{'':24}{r['id']} · {r['kind']} · {r['unit']} {fmt(r['amount'])}" for r in waiting) if waiting else ""))
    L.append("")
    thr = ((p.get("draw_mode") or {}).get("requested_above") or {})
    bpc = unit_spec(p, "bytes_per_commit")
    L.append("WHAT HAPPENS AT EACH COMMIT (the pre-commit hook decides, not you):")
    L.append("  inside the band       nothing is said")
    L.append("  over the band         DRAWN: one line is printed; say so in your report, with what is left")
    if bpc and thr.get("bytes_per_commit"): L.append(f"  over {fmt(thr['bytes_per_commit'])} B        REQUESTED: the commit is refused until a decision exists; ask, quote the id, wait")
    if bpc: L.append(f"  over {fmt(bpc['per_occurrence'])} B        REFUSED: an exclusion; an escalation is written; stop this class of action")
    L.append("  pool exhausted        REFUSED for every session today; commits inside the band still proceed")
    L.append("AT EACH PUSH: a branch outside the mandate is refused first; then the same on bytes per push and pushes.")
    L.append("")
    L.append("RULES: never edit the policy, the ledger, the hooks or the evaluator to pass. Never split a commit")
    L.append("to get under a limit. Never --no-verify. A refusal is a finding: report it with the numbers.")
    L.append(f"TO ASK:  python3 {os.path.relpath(os.path.abspath(__file__))} request --unit <u> --amount <n> --why \"…\"")
    L.append(f"THE ROOM: {os.path.relpath(os.path.join(PACK, 'room', 'index.html'))}  (or the room vault's read link)")
    L.append(f"HOOKS:   {hooks}")
    L.append(TIER_LINE)
    print("\n".join(L)); return 0

# ---------------------------------------------------------------- request / decide / supersede / derive / validate
def cmd_request(a):
    p, _ = load_current(a.policies, a.subject); now = utcnow()
    subject = a.subject_instance or session_name(a.ledger)
    r = {"type": "request/v1", "id": new_id(now), "kind": a.kind, "at": iso(now), "policy": p["id"], "subject": subject,
         "unit": a.unit, "amount": a.amount, "why": a.why, "status": "waiting", "test": bool(a.test)}
    u = unit_spec(p, a.unit)
    if u and u["kind"] == "volume": r["excess"] = max(0, a.amount - u["normal"])
    path = write_json(a.ledger, "requests", r)
    print(f"request written: {os.path.relpath(path)} — quote the id {r['id']} to the approver and wait"); return 0

def cmd_decide(a):
    reqs = {r["id"]: r for r in read_dir(a.ledger, "requests")}
    if a.request not in reqs: print(f"no such request: {a.request}", file=sys.stderr); return 1
    r = reqs[a.request]; now = utcnow()
    kind_ok = {"draw": ("approved", "declined"), "escalation": ("accept", "suspend"), "reserve": ("approved", "declined"), "acceptance": ("accept",)}
    if a.decision not in kind_ok.get(r["kind"], ()):
        print(f"a {r['kind']} request takes {kind_ok.get(r['kind'])}, not --{a.decision}", file=sys.stderr); return 1
    if r["kind"] == "draw":
        p, _ = load_current(a.policies, a.subject); u = unit_spec(p, r["unit"])
        if u and u["kind"] == "volume" and r["amount"] > u["per_occurrence"]:
            print(f"refusing: {fmt(r['amount'])} is above the per-occurrence limit ({fmt(u['per_occurrence'])}) — an exclusion; the approver never approves one. Answer the escalation instead.", file=sys.stderr); return 1
    d = {"type": "decision/v1", "id": new_id(now), "request": r["id"], "at": iso(now), "by": a.by, "decision": a.decision, "note": a.note or "", "test": bool(r.get("test"))}
    path = write_json(a.ledger, "decisions", d)
    print(f"decision written: {os.path.relpath(path)} — {a.decision} by {a.by}"); return 0

def set_path(obj, dotted, value):
    keys = dotted.split("."); cur = obj
    if keys[0] == "units":
        u = unit_spec(obj, keys[1]); cur = u; keys = keys[2:]
    for k in keys[:-1]: cur = cur[k]
    cur[keys[-1]] = value

def cmd_supersede(a):
    d = os.path.join(a.policies, a.subject)
    old = json.load(open(os.path.join(d, a.policy + ".json")))
    new = json.loads(json.dumps(old)); now = utcnow()
    new["id"] = a.new_id; new["supersedes"] = a.policy
    new["issued_at"] = iso(now); new["why"] = a.why
    for s in a.set or []:
        k, v = s.split("=", 1); set_path(new, k, int(v) if v.lstrip("-").isdigit() else v)
    if a.exclude:
        u = unit_spec(new, a.exclude)
        if not u: print(f"no unit {a.exclude}", file=sys.stderr); return 1
        u["exclusion"] = {"above": "per_occurrence", "reason": a.why}
    if a.suspend:
        new["suspended"] = {"at": iso(now), "why": a.why, "note": "cover withdrawn pending remediation; every event is refused while suspended"}
        new["interval"]["until"] = now.strftime("%Y-%m-%d")
    errs = validate(new)
    if errs:
        for e in errs: print("   · " + e, file=sys.stderr)
        return 1
    path = os.path.join(d, a.new_id + ".json")
    if os.path.exists(path): print(f"refusing to overwrite {path}", file=sys.stderr); return 1
    json.dump(new, open(path, "w"), indent=2); open(path, "a").write("\n")
    json.dump({"current": a.new_id, "moved_at": iso(now), "from": a.policy}, open(os.path.join(d, "current.json"), "w"), indent=2)
    e = {"type": "event/v1", "id": new_id(now), "at": iso(now), "day": now.strftime("%Y-%m-%d"), "policy": a.new_id, "rules_version": new["rules_version"],
         "subject": "the issuer", "policyholder": new["policyholder"]["who"], "point": "supersede", "unit": "policy", "amount": 1, "verdict": "measured",
         "drawn": 0, "pool_left": None, "acceptor": None, "reason": f"policy {a.policy} superseded by {a.new_id}: {a.why}", "ref": {"set": a.set or [], "exclude": a.exclude, "suspend": bool(a.suspend)}, "test": False}
    write_json(a.ledger, "events", e)
    print(f"superseded: {a.policy} → {a.new_id} ({os.path.relpath(path)}); current.json moved; awaiting the policyholder's acceptance (decide … --accept on an acceptance request)"); return 0

def cmd_derive(a):
    p, _ = load_current(a.policies, a.subject)
    day = a.day or utcnow().strftime("%Y-%m-%d")
    state = derive(p, read_dir(a.ledger, "events"), day, test=bool(a.test))
    if a.json: print(json.dumps({"policy": p["id"], "day": day, "lane": "acceptance-run" if a.test else "real", "zone": worst_zone(state), "units": state}, indent=1)); return 0
    print(f"{p['id']} · {day} · {'ACCEPTANCE-RUN lane' if a.test else 'real lane'} · zone {worst_zone(state).upper()}")
    for k, s in state.items():
        print(f"  {k:<22} used {fmt(s['used'])}  drawn {fmt(s['drawn'])}  pool_left {fmt(s['pool_left'])} of {fmt(s['pool_effective'])} (reserve {s['reserve_share']:.0%} held)  events {s['events']}  refused {s['refused']}  zone {s['zone']}")
    return 0

def cmd_validate(a):
    p, path = load_current(a.policies, a.subject)
    errs = validate(p)
    print(f"{os.path.relpath(path)}: {'valid' if not errs else 'INVALID'}")
    for e in errs: print("   · " + e)
    return 1 if errs else 0

# ---------------------------------------------------------------- the Claude PreToolUse handler (advisory)
def cmd_hook_pre_tool_use(a):
    try: j = json.load(sys.stdin)
    except Exception: return 0
    cmd = ((j.get("tool_input") or {}).get("command") or "")
    out = {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow", "permissionDecisionReason": ""}}
    args = ["python3", os.path.abspath(__file__), "check", "--dry-run", "--ledger", a.ledger, "--policies", a.policies, "--subject", a.subject]
    if re.search(r"\bgit\s+commit\b", cmd) and "--amend" not in cmd:
        r = subprocess.run(args + ["--point", "pre-commit"], capture_output=True, text=True)
    elif re.search(r"\bgit\s+push\b", cmd):
        m = re.search(r"\bgit\s+push\b[^|;&]*?\b(\S+)\s+(?:HEAD:)?(\S+)\s*$", cmd.strip()) or re.search(r"\bgit\s+push\b.*?\s(\S+)\s+(?:HEAD:)?(\S+)", cmd)
        remote, branch = (m.group(1), m.group(2)) if m else ("origin", git("rev-parse", "--abbrev-ref", "HEAD", check=False).strip())
        branch = branch.replace("refs/heads/", "")
        local = git("rev-parse", "HEAD", check=False).strip()
        remote_sha = git("rev-parse", f"{remote}/{branch}", check=False).strip() or "0" * 40
        r = subprocess.run(args + ["--point", "pre-push", "--branch", branch, "--remote", remote, "--local-sha", local, "--remote-sha", remote_sha], capture_output=True, text=True)
    else:
        print(json.dumps(out)); return 0
    text = (r.stdout + r.stderr).strip()
    if r.returncode:
        out["hookSpecificOutput"]["permissionDecision"] = "deny"
        out["hookSpecificOutput"]["permissionDecisionReason"] = "The insurance policy would refuse this (the git hook will, a second from now):\n" + text
    else:
        out["hookSpecificOutput"]["permissionDecisionReason"] = "Policy check (advisory copy of the git hook's verdict):\n" + text
    print(json.dumps(out)); return 0

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ledger", default=DEFAULT_LEDGER); ap.add_argument("--policies", default=DEFAULT_POLICIES)
    ap.add_argument("--subject", default=DEFAULT_SUBJECT, help="the policies/<subject>/ folder to evaluate against")
    ap.add_argument("--subject-instance", help="who is acting, e.g. session:844f4a2f (default: $IE_SESSION, ledger/.session, or session:unknown@host)")
    sp = ap.add_subparsers(dest="cmd", required=True)
    c = sp.add_parser("check"); c.add_argument("--point", choices=["pre-commit", "pre-push"]); c.add_argument("--branch"); c.add_argument("--remote", default="origin")
    c.add_argument("--local-sha"); c.add_argument("--remote-sha"); c.add_argument("--unit"); c.add_argument("--amount", type=int); c.add_argument("--band")
    c.add_argument("--dry-run", action="store_true"); c.add_argument("--test", action="store_true", help="mark the events as an acceptance run: visible, separate, excluded from the balance")
    b = sp.add_parser("briefing"); b.add_argument("--from-hook", action="store_true", help="read the SessionStart JSON on stdin and remember session_id")
    r = sp.add_parser("request"); r.add_argument("--unit", required=True); r.add_argument("--amount", type=int, required=True); r.add_argument("--why", required=True)
    r.add_argument("--kind", default="draw", choices=["draw", "escalation", "reserve", "acceptance"]); r.add_argument("--test", action="store_true")
    d = sp.add_parser("decide"); d.add_argument("request"); d.add_argument("--by", required=True); d.add_argument("--note")
    g = d.add_mutually_exclusive_group(required=True)
    for k in ("approved", "declined", "accept", "suspend"): g.add_argument(f"--{k}", dest="decision", action="store_const", const=k)
    s = sp.add_parser("supersede"); s.add_argument("policy"); s.add_argument("--as", dest="new_id", required=True); s.add_argument("--set", action="append"); s.add_argument("--exclude"); s.add_argument("--suspend", action="store_true"); s.add_argument("--why", required=True)
    v = sp.add_parser("derive"); v.add_argument("--day"); v.add_argument("--json", action="store_true"); v.add_argument("--test", action="store_true", help="the acceptance-run lane instead of the real one")
    sp.add_parser("validate"); sp.add_parser("hook-pre-tool-use")
    a = ap.parse_args()
    return {"check": cmd_check, "briefing": cmd_briefing, "request": cmd_request, "decide": cmd_decide, "supersede": cmd_supersede,
            "derive": cmd_derive, "validate": cmd_validate, "hook-pre-tool-use": cmd_hook_pre_tool_use}[a.cmd](a)

if __name__ == "__main__":
    sys.exit(main())
