#!/usr/bin/env python3
"""run.py — run the probe registry against the environment this runs in, and
emit findings/v1: one file per tool, presence and reachability only.

    python3 probes/run.py --profile anthropic/claude-code-remote/ccr-container --tool shell --out probes/evidence/<file>.json
    python3 probes/run.py --profile ... --tool fetch --fetch-hosts sgit.ai,pki.sgit.ai      # the second tool, by report
    python3 probes/run.py validate probes/evidence/<file>.json                                # shape + ids
    python3 probes/run.py validate-profile probes/profiles/anthropic/claude-code-remote/ccr-container.json

THE RULE, inherited from packs/grant-and-mandate/tools/measure.py and not negotiable:
PRESENCE AND REACHABILITY, NEVER CONTENTS. No file is opened; no value is printed;
environment variables are reported by name and only when key-shaped; lists are capped.

The result is a FLOOR, not a census, and when the subject runs it on itself the
independence is `self` — the weakest tier the model has, stated on the file.
Nothing here is sent anywhere. The file is yours until you commit it.
"""
import json, os, platform, shutil, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
HOME = Path.home()
REG = json.loads((HERE / "probes.json").read_text())
PRIM = json.loads((HERE / "primitives.json").read_text())
CAPS = {c["id"]: c for c in PRIM["capabilities"]}
PROBES = {p["id"]: p for p in REG["probes"]}
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sh(cmd, timeout=10):
    """(ok, output). Never raises — a probe that cannot run is a finding."""
    try:
        r = subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, (r.stdout or r.stderr).strip()
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def finding(probe, capability, outcome, message, tier="observed", values=None, remediation=None, location=None):
    f = {"probe": probe, "message": message, "outcome": outcome, "capability": capability,
         "reversible": CAPS[capability]["reversible"], "tier": tier, "observed_at": NOW}
    if values is not None: f["values"] = values
    if remediation: f["remediation"] = remediation
    if location: f["location"] = location
    return f


# ── the probes, as findings ─────────────────────────────────────────────────

def p_identity(out):
    uid = os.geteuid() if hasattr(os, "geteuid") else -1
    sudo_ok, _ = sh(["sudo", "-n", "true"]) if shutil.which("sudo") else (False, "")
    root = uid == 0
    vals = {"uid": uid, "passwordless_escalation": sudo_ok, "platform": platform.system()}
    if root or sudo_ok:
        msg = ("runs as root" if root else f"runs as uid {uid} with passwordless escalation") + \
              ": no user boundary stands between the agent and the host"
        for cap in ["execute.process.host", "read.file.host", "write.file.host", "delete.file.host"]:
            out.append(finding("identity.account", cap, "True", msg, values=vals,
                               remediation={"text": "run the agent under a separate user account, or in a container with only the project mounted",
                                            "effort": "hard — days, and it fights you (account) · an afternoon, then ongoing friction (container)", "tier_after": "boundary"}))
    else:
        msg = f"runs as uid {uid}; escalation refused or absent — the OS user separation is a boundary the grant does not include"
        out.append(finding("identity.account", "execute.process.host", "True", msg + " (programs run as this user)", values=vals))
        for cap in ["read.file.host", "write.file.host", "delete.file.host"]:
            out.append(finding("identity.account", cap, "True", msg + " — reach is this user's files, not the host's", values=vals))


def p_write_outside(out):
    pid = os.getpid()
    for target, where in [(Path("/etc") / f".probe-{pid}", "system configuration (/etc)"), (HOME / f".probe-{pid}", "the account's home")]:
        try:
            target.touch(exist_ok=False)
            target.unlink()
            out.append(finding("filesystem.write-outside-tree", "write.file.host", "True",
                               f"a zero-byte file was created and removed in {where}: writing outside the working tree succeeds",
                               values={"where": where}))
            return
        except Exception as e:
            continue
    out.append(finding("filesystem.write-outside-tree", "write.file.host", "False",
                       "no file could be created outside the working tree in /etc or $HOME"))


def p_credentials(out):
    cands = {"cloud": [".aws/credentials", ".config/gcloud", ".azure", ".kube/config"],
             "code-host": [".git-credentials", ".config/gh/hosts.yml", ".ssh"],
             "package-registry": [".npmrc", ".pypirc", ".cargo/credentials"],
             "signing": [".gnupg", ".sg-send/keys"]}
    present = {k: [p for p in ps if (HOME / p).exists()] for k, ps in cands.items()}
    present = {k: v for k, v in present.items() if v}
    if present:
        out.append(finding("filesystem.credential-presence", "read.credential.host", "True",
                           f"credential-shaped paths present at the usual locations: {sorted(present)} — presence only, nothing opened",
                           values={"present": present}, location={"path": "$HOME", "note": "existence check at known paths"},
                           remediation={"text": "keep credentials out of the account the agent runs as; a container with only the project mounted removes this row",
                                        "effort": "an afternoon, then ongoing friction", "tier_after": "boundary"}))
        tenant = [k for k in present if k in ("cloud", "code-host", "package-registry")]
        out.append(finding("filesystem.credential-presence", "create.record.world", "True" if "package-registry" in present else "False",
                           ("a package-registry token is present: publishing under the account's name, inferred from presence" if "package-registry" in present
                            else "no package-registry token at the usual locations"), tier="inferred", values={"present": present.get("package-registry", [])}))
        out.append(finding("filesystem.credential-presence", "authenticate-as.credential.tenant",
                           "True" if tenant else "False",
                           (f"inferred from presence: a process that can read {tenant} credentials can use them" if tenant
                            else "no cloud, code-host or registry credential paths found"), tier="inferred", values={"classes": tenant}))
    else:
        out.append(finding("filesystem.credential-presence", "read.credential.host", "False",
                           "no credential-shaped paths at the usual locations under $HOME"))
        out.append(finding("filesystem.credential-presence", "authenticate-as.credential.tenant", "False",
                           "nothing found to infer from", tier="inferred"))


def p_history(out):
    hits = [p for p in [".bash_history", ".zsh_history", ".claude/projects", ".claude/history.jsonl"] if (HOME / p).exists()]
    out.append(finding("filesystem.history-presence", "read.record.history", "True" if hits else "False",
                       (f"a retained record is present at {hits}: the effective grant is the union of every prior turn's reach" if hits
                        else "no shell history or session record found at the usual paths"), values={"present": hits}))


def p_process(out):
    ok, n = sh("ps -e 2>/dev/null | wc -l")
    ok2, cpus = sh(["nproc"]) if shutil.which("nproc") else (False, "?")
    try: count = int(n.strip())
    except Exception: count = None
    host = count is not None and count > 12
    out.append(finding("process.visibility", "execute.process.host" if host else "execute.process.self", "True",
                       f"{count if count is not None else 'an unknown number of'} processes visible, {cpus.strip() if ok2 else '?'} cpu(s): " +
                       ("process reach is the host" if host else "a handful of processes — a sandbox"), values={"processes": count, "cpus": cpus.strip() if ok2 else None}))


def p_egress_shell(out):
    hosts = ["pypi.org", "registry.npmjs.org", "api.github.com", "example.com", "sgit.ai", "pki.sgit.ai"]
    reach = []
    for h in hosts:
        ok, code = sh(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "8", f"https://{h}/"])
        code = code.strip()[-3:] if code else "000"
        reach.append({"host": h, "http": code, "reachable": ok and code not in ("000", "403", "407")})
    proxied = bool(os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy"))
    answered = [r["host"] for r in reach if r["reachable"]]
    refused = [r["host"] for r in reach if not r["reachable"]]
    if refused or proxied:
        out.append(finding("network.egress-shell", "send.endpoint.allowed", "True",
                           f"{len(answered)} of {len(hosts)} hosts answer from the shell; {len(refused)} do not; proxy variable {'set' if proxied else 'not set'} — the hosts that answered are the allow-list as observed",
                           values={"reach": reach, "proxied": proxied, "answered": answered, "refused": refused}))
        out.append(finding("network.egress-shell", "send.endpoint.world", "False",
                           "the shell cannot reach every host: world reach is bounded by something above this process", values={"refused": refused}))
    else:
        out.append(finding("network.egress-shell", "send.endpoint.world", "True",
                           f"all {len(hosts)} probed hosts answer and no proxy is configured: UNRESTRICTED egress from the shell",
                           values={"reach": reach, "proxied": False},
                           remediation={"text": "route outbound traffic through an allow-list", "effort": "an hour, if you already have somewhere to put it", "tier_after": "boundary"}))
        out.append(finding("network.egress-shell", "send.endpoint.allowed", "NotApplicable", "no allow-list is in force"))


def p_egress_second_tool(out, fetch_hosts):
    if not fetch_hosts:
        out.append(finding("network.egress-second-tool", "send.endpoint.allowed", "NotAvailable",
                           "a shell cannot observe another tool; pass --fetch-hosts with the hosts the operator saw the fetch tool reach", tier="unknown"))
        return
    out.append(finding("network.egress-second-tool", "send.endpoint.allowed", "True",
                       f"the operator reports the fetch tool reached {len(fetch_hosts)} host(s) during ordinary use; what it cannot reach is unknown from here",
                       tier="self-reported", values={"answered": fetch_hosts, "not_measured": "hosts the fetch tool cannot reach"}))


def p_vcs(out):
    ok, remote = sh(["git", "config", "--get", "remote.origin.url"])
    if not ok or not remote:
        out.append(finding("vcs.remote-hooks-signing", "write.repository.tenant", "NotApplicable", "no git remote configured here"))
        return
    hooks_ok, hooks = sh(["git", "config", "--get", "core.hooksPath"])
    hook_files = sorted(p.name for p in Path(hooks.strip()).glob("pre-*")) if hooks_ok and hooks.strip() and Path(hooks.strip()).is_dir() else []
    remote_shown = remote.strip().split("@")[-1]  # never a credential embedded in a URL
    out.append(finding("vcs.remote-hooks-signing", "write.repository.project", "True", "a repository is attached and writable", values={"remote": remote_shown}))
    out.append(finding("vcs.remote-hooks-signing", "read.file.project", "True", "the attached working tree is readable", values={"remote": remote_shown}))
    out.append(finding("vcs.remote-hooks-signing", "write.file.project", "True", "the attached working tree is writable", values={"remote": remote_shown}))
    out.append(finding("vcs.remote-hooks-signing", "write.repository.tenant", "True",
                       (f"commits can leave for {remote_shown}; hooks at {hooks.strip()} ({', '.join(hook_files)}) refuse by exit code — a SETTING, --no-verify still passes" if hook_files
                        else f"commits can leave for {remote_shown}; branch discipline, if any, lives in prose — an EXPECTATION"),
                       values={"remote": remote_shown, "hooksPath": hooks.strip() if hooks_ok else None, "hooks": hook_files},
                       remediation={"text": "a branch protection rule at the host, which the agent cannot edit", "effort": "minutes", "tier_after": "boundary"}))
    s_ok, gpgsign = sh(["git", "config", "--get", "commit.gpgsign"])
    k_ok, _ = sh(["git", "config", "--get", "user.signingkey"])
    f_ok, fmt = sh(["git", "config", "--get", "gpg.format"])
    signing = (s_ok and gpgsign.strip() == "true") or k_ok
    out.append(finding("vcs.remote-hooks-signing", "authenticate-as.credential.signing", "True" if signing else "False",
                       (f"a signing key is configured ({fmt.strip() if f_ok else 'gpg'}) and commits are signed by default: the agent signs as the account" if signing
                        else "no signing key configured"), values={"gpgsign": gpgsign.strip() if s_ok else None, "format": fmt.strip() if f_ok else None}))


def p_agent_config(out):
    paths = [HOME / ".claude" / "settings.json", Path(".claude/settings.json"), HOME / ".claude" / "settings.local.json"]
    present, refused = [], []
    for p in paths:
        try:
            if p.exists():
                p.stat(); present.append(str(p).replace(str(HOME), "$HOME"))
        except PermissionError as e:
            refused.append(str(p).replace(str(HOME), "$HOME"))
        except Exception:
            pass
    if refused:
        out.append(finding("agent.config-presence", "grant.credential.self", "NotAvailable",
                           f"the read was refused at {refused}: a control the measuring agent could not inspect — a boundary observed from inside", tier="unknown", values={"refused": refused}))
    elif present:
        out.append(finding("agent.config-presence", "grant.credential.self", "True",
                           f"harness settings present and readable at {present}; anything running as this account can write them, so tool-enforced permissions are a SETTING", values={"present": present}))
    else:
        out.append(finding("agent.config-presence", "grant.credential.self", "NotAvailable",
                           "no settings file at the usual paths; whether one exists above this session was not established", tier="unknown"))


def p_schedule(out):
    have = [b for b in ["crontab", "systemctl", "at"] if shutil.which(b)]
    cron_d = Path("/etc/cron.d").exists()
    ok, first = sh("crontab -l 2>&1 | head -1") if "crontab" in have else (False, "")
    if not have and not cron_d:
        out.append(finding("schedule.persistence", "create.schedule.host", "NotAvailable",
                           "no scheduler binary and no cron directory on this host: nothing found that outlives the turn", values={"schedulers": []}))
    else:
        out.append(finding("schedule.persistence", "create.schedule.host", "True",
                           f"scheduler(s) present: {have}{' and /etc/cron.d exists' if cron_d else ''}; something created here could outlive the turn",
                           values={"schedulers": have, "cron_d": cron_d, "crontab_first_line": (first[:60] if ok else None)}))


def p_key_env(out):
    names = sorted(k for k in os.environ if k.upper().endswith(("_API_KEY", "_TOKEN", "_SECRET")))
    names = names[:20]
    if names:
        out.append(finding("identity.key-shaped-env", "authenticate-as.credential.tenant", "True",
                           f"{len(names)} key-shaped variable(s) set in the environment (names only): a credential the process holds", tier="inferred", values={"names": names}))
        metered = [n for n in names if any(s in n.upper() for s in ("OPENAI", "ANTHROPIC", "OPENROUTER", "AWS", "GCP", "AZURE", "STRIPE"))]
        out.append(finding("identity.key-shaped-env", "write.budget.tenant", "True" if metered else "NotAvailable",
                           (f"{len(metered)} of them name a metered service: spend the agent can incur, inferred from the name" if metered
                            else "none of the names is recognisably a metered service; spend is not established from here"), tier="inferred", values={"metered": metered}))
    else:
        out.append(finding("identity.key-shaped-env", "authenticate-as.credential.tenant", "False", "no key-shaped variable names in the environment", tier="inferred"))
        out.append(finding("identity.key-shaped-env", "write.budget.tenant", "NotAvailable", "no metered credential visible from here; spend is not established", tier="inferred"))


def p_ci(out):
    if not os.environ.get("GITHUB_ACTIONS"):
        out.append(finding("ci.permissions-block", "write.repository.tenant", "NotApplicable", "not a CI job"))
        return
    wf = os.environ.get("GITHUB_WORKFLOW", "?"); repo = os.environ.get("GITHUB_REPOSITORY", "?")
    out.append(finding("ci.permissions-block", "write.repository.tenant", "True",
                       f"workflow '{wf}' on {repo}: the token's scope is the workflow's permissions block, set above the job by something the job cannot edit — a BOUNDARY",
                       values={"workflow": wf, "repository": repo, "token_present": "GITHUB_TOKEN" in os.environ}))


def p_described(out):
    out.append(finding("communication.send", "send.message.world", "NotAvailable",
                       "described, not run: sending is irreversible; established only from configured connectors, at the documented tier", tier="documented"))
    out.append(finding("money.spend", "write.budget.tenant", "NotAvailable",
                       "described, not run: a probe that spends is not run; see identity.key-shaped-env for the safe proxy", tier="inferred"))


# ── assemble ────────────────────────────────────────────────────────────────

def run(profile, tool, subject, fetch_hosts, identity_record, independent):
    out = []
    if tool == "fetch":
        p_egress_second_tool(out, fetch_hosts)
    else:
        p_identity(out); p_write_outside(out); p_credentials(out); p_history(out); p_process(out)
        p_egress_shell(out); p_vcs(out); p_agent_config(out); p_schedule(out); p_key_env(out); p_ci(out); p_described(out)
    return {
        "type": "findings/v1",
        "subject": subject,
        "profile": profile,
        "tool": tool,
        "measured_at": NOW,
        "measured_by": {
            "who": ("an independent party running the probes in the subject's environment" if independent
                    else "the session running inside the environment — the instrument IS the subject"),
            "independence": "independent" if independent else "self",
            "identity_record": identity_record,
            "runner": "probes/run.py"},
        "environment": {"platform": platform.system(), "machine": platform.machine(),
                        "note": "one environment, one tool, one date — generalising from a single file is the error the pack warns of"},
        "findings": out,
        "not_measured": ["hosts a second tool can reach (a shell cannot observe another tool)",
                         "anything above this process: whether a settings file exists above the session, the retention window of history, the supplier's meter",
                         "capabilities the subject does not know it has — a floor, not a census"],
        "disclaimer": REG["rule"],
        "licence": "CC BY 4.0",
    }


# ── validate ────────────────────────────────────────────────────────────────

OUTCOMES = {"True", "False", "NotApplicable", "NotAvailable", "Error"}
TIERS = {"observed", "self-reported", "documented", "derived", "inferred", "unknown"}


def validate_findings(path):
    d = json.loads(Path(path).read_text()); bad = []
    for k in ["type", "subject", "profile", "tool", "measured_at", "measured_by", "findings"]:
        if k not in d: bad.append(f"missing {k}")
    if d.get("type") != "findings/v1": bad.append("type is not findings/v1")
    if d.get("measured_by", {}).get("independence") not in ("self", "independent"): bad.append("measured_by.independence must be self|independent")
    for i, f in enumerate(d.get("findings", [])):
        for k in ["probe", "message", "outcome", "capability", "reversible", "tier", "observed_at"]:
            if k not in f: bad.append(f"finding {i}: missing {k}")
        if f.get("probe") not in PROBES: bad.append(f"finding {i}: unknown probe {f.get('probe')}")
        if f.get("capability") not in CAPS: bad.append(f"finding {i}: unknown capability {f.get('capability')}")
        elif f.get("reversible") != CAPS[f["capability"]]["reversible"]: bad.append(f"finding {i}: reversible disagrees with the primitive")
        if f.get("outcome") not in OUTCOMES: bad.append(f"finding {i}: outcome {f.get('outcome')}")
        if f.get("tier") not in TIERS: bad.append(f"finding {i}: tier {f.get('tier')}")
        if f.get("probe") in PROBES and f.get("capability") not in PROBES[f["probe"]]["establishes"]:
            bad.append(f"finding {i}: probe {f['probe']} does not establish {f['capability']}")
        text = json.dumps(f)
        if len(text) > 4000: bad.append(f"finding {i}: too large to be presence-only ({len(text)} B)")
    return bad


def validate_profile(path):
    d = json.loads(Path(path).read_text()); bad = []
    for k in ["type", "id", "vendor", "product", "variant", "version", "tools", "union", "intersection"]:
        if k not in d: bad.append(f"missing {k}")
    if d.get("type") != "profile/v1": bad.append("type is not profile/v1")
    rel = Path(path).resolve().relative_to(HERE).as_posix()
    if rel != f"profiles/{d.get('id')}.json": bad.append(f"id {d.get('id')} does not match path {rel}")
    grants = []
    for t in d.get("tools", []):
        ev = t.get("evidence")
        if ev:
            if not (HERE / ev).exists(): bad.append(f"tool {t.get('tool')}: evidence file {ev} missing")
            else:
                e = json.loads((HERE / ev).read_text())
                if e.get("profile") != d.get("id"): bad.append(f"evidence {ev} is for profile {e.get('profile')}")
                held = {f["capability"] for f in e["findings"] if f["outcome"] == "True"}
                for g in t.get("grant", []):
                    if g.get("tier") in ("observed", "self-reported", "inferred") and g["capability"] not in held:
                        bad.append(f"tool {t.get('tool')}: {g['capability']} claimed at tier {g.get('tier')} but no True finding in {ev}")
        else:
            for g in t.get("grant", []):
                if g.get("tier") in ("observed", "self-reported", "inferred"):
                    bad.append(f"tool {t.get('tool')}: {g['capability']} at tier {g.get('tier')} with no evidence file — a measured tier needs a measurement")
        caps = set()
        for g in t.get("grant", []):
            if g.get("capability") not in CAPS: bad.append(f"tool {t.get('tool')}: unknown capability {g.get('capability')}")
            caps.add(g.get("capability"))
        grants.append(caps)
    union = set().union(*grants) if grants else set()
    inter = set.intersection(*grants) if grants else set()
    if set(d.get("union", [])) != union: bad.append(f"union does not equal the union of the tools' grants: {sorted(union ^ set(d.get('union', [])))}")
    if set(d.get("intersection", [])) != inter: bad.append(f"intersection does not equal the intersection of the tools' grants: {sorted(inter ^ set(d.get('intersection', [])))}")
    return bad


def main():
    a = sys.argv[1:]
    if a and a[0] == "validate":
        bad = [b for p in a[1:] for b in [f"{p}: {x}" for x in validate_findings(p)]]
        print("\n".join(bad) if bad else f"findings OK: {len(a[1:])} file(s)"); sys.exit(1 if bad else 0)
    if a and a[0] == "validate-profile":
        bad = [b for p in a[1:] for b in [f"{p}: {x}" for x in validate_profile(p)]]
        print("\n".join(bad) if bad else f"profiles OK: {len(a[1:])} file(s)"); sys.exit(1 if bad else 0)
    def opt(n, d=None):
        return a[a.index(n) + 1] if n in a else d
    hosts = [h for h in (opt("--fetch-hosts", "") or "").split(",") if h]
    doc = run(opt("--profile", "unknown/unknown/unknown"), opt("--tool", "shell"), opt("--subject", "agent:unknown"),
              hosts, opt("--identity-record"), "--independent" in a)
    text = json.dumps(doc, indent=2) + "\n"
    out = opt("--out")
    if out:
        Path(out).write_text(text)
        held = sum(1 for f in doc["findings"] if f["outcome"] == "True")
        print(f"wrote {out}: {len(doc['findings'])} findings, {held} True, tool={doc['tool']}, independence={doc['measured_by']['independence']}")
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
