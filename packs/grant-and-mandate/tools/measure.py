#!/usr/bin/env python3
"""measure.py — generate a grant document for the environment this runs in.

The pack's rule is that a grant is DISCOVERED, not authored: a hand-written
grant file is a wish. This is the method, published so somebody else can run
it and get the same answer — which is what makes a library entry a dated
claim rather than an opinion.

    python3 measure.py --product "claude-code-local" --surface "laptop, macOS"

One rule governs every probe, and it is not negotiable:

    THIS TOOL REPORTS PRESENCE AND REACHABILITY, NEVER CONTENTS.

It records that a credential file exists at a path, never a byte of what is
in it; that a settings file is present, never what it permits; that history is
retained, never what is in it. A tool that assembled the contents would be
producing exactly the artefact the assessment discipline forbids — a dated,
ranked map of somebody's estate. Run it and read the output: there is nothing
sensitive in it to leak, by construction.

Every node carries its evidence class (`observed`, `read`, `documented`,
`inferred`, `none`) and the method that produced it. A probe that is refused
or cannot run emits a node marked `unknown` with `evidence: none` — never a
guess, and never silence. The refusals are data: a probe blocked by something
outside the agent's control has just measured a boundary.

The result is a FLOOR, not a census: an agent measuring its own grant reports
what it can see, and cannot report a capability it does not know it has. The
document says so on its face, and the library's blind-spot delta is what
measures the gap.
"""

import json
import os
import platform
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HOME = Path.home()


def run(cmd, timeout=10):
    """Returns (ok, stdout). Never raises — a probe that cannot run is data."""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, (r.stdout or r.stderr).strip()
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def node(nid, parent, capability, reachable, tier, control, evidence, method):
    return {"id": nid, "parent": parent, "capability": capability,
            "reachable": reachable, "tier": tier, "control": control,
            "evidence": evidence, "method": method}


def unknown(nid, parent, capability, why):
    return node(nid, parent, capability, "UNKNOWN — not established", "unknown",
                None, "none", why)


# ── probes ──────────────────────────────────────────────────────────────────

def probe_identity(nodes):
    uid = os.geteuid() if hasattr(os, "geteuid") else None
    is_root = uid == 0
    sudo_ok, sudo_out = run(["sudo", "-n", "true"]) if shutil.which("sudo") else (False, "sudo not present")
    nodes.append(node(
        "n1", None,
        "runs as %s" % ("the container/system root user" if is_root else f"uid {uid}"),
        "every file and process this user can reach; "
        + ("no internal user boundary exists" if is_root
           else "bounded by this user's permissions"),
        "none" if is_root else "boundary",
        None if is_root else "the OS user separation",
        "observed", f"geteuid()={uid}; platform={platform.system()}"))
    nodes.append(node(
        "n1a", "n1", "escalate to administrator",
        "everything, without a further credential" if sudo_ok else "not via passwordless sudo",
        "none" if sudo_ok else "setting",
        None if sudo_ok else "sudo requires a credential this process did not supply",
        "observed", f"`sudo -n true` -> {'succeeded' if sudo_ok else 'refused/absent'}"))


def probe_filesystem(nodes):
    """Presence only. Never contents — see the module docstring."""
    candidates = {
        "cloud credentials": [".aws/credentials", ".config/gcloud", ".azure"],
        "code-host credentials": [".git-credentials", ".config/gh/hosts.yml", ".ssh"],
        "package-registry tokens": [".npmrc", ".pypirc", ".cargo/credentials"],
        "signing keys": [".gnupg", ".sg-send/keys"],
        "shell history": [".bash_history", ".zsh_history"],
    }
    found = {}
    for label, paths in candidates.items():
        hits = [p for p in paths if (HOME / p).exists()]
        if hits:
            found[label] = hits
    nodes.append(node(
        "n2", "n1", "read and write this user's home directory",
        "every file this user owns" + (
            f"; credential-shaped paths PRESENT: {found}" if found
            else "; no credential-shaped paths found at the usual locations"),
        "none", None, "observed",
        "existence check at known paths under $HOME — presence only, no file "
        "was opened or read"))
    if found:
        nodes.append(node(
            "n2a", "n2", "read the credentials those files hold",
            "whatever services they authenticate to — the blast-radius path",
            "none", None, "inferred",
            "inferred from presence: a process that can read the file can use "
            "the credential. The files were NOT opened"))


def probe_egress(nodes):
    hosts = ["https://github.com", "https://pypi.org", "https://example.com"]
    results = {}
    for h in hosts:
        ok, out = run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                       "--max-time", "8", h])
        results[h] = out if ok else f"FAIL ({out[:40]})"
    proxied = bool(os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy"))
    nodes.append(node(
        "n3", "n1", "outbound network access",
        f"hosts reachable: {results}",
        "boundary" if proxied else "none",
        "a mandatory egress proxy configured above this process" if proxied
        else None,
        "observed",
        f"curl to {len(hosts)} hosts; HTTPS_PROXY {'set' if proxied else 'not set'}"))


def probe_vcs(nodes):
    ok, remote = run(["git", "config", "--get", "remote.origin.url"])
    if not ok:
        nodes.append(unknown("n4", "n3", "push to a version-control remote",
                             "no git remote configured here"))
        return
    hooks_ok, hooks = run(["git", "config", "--get", "core.hooksPath"])
    enforced = hooks_ok and hooks.strip()
    nodes.append(node(
        "n4", "n3", "push commits to the configured remote",
        f"the repository at {remote}",
        "setting" if enforced else "expectation",
        (f"a pre-push hook at {hooks} evaluating a signed mandate — refuses by "
         f"exit code, and is bypassable with --no-verify") if enforced
        else "branch discipline, if any, lives in prose",
        "observed",
        f"git remote present; core.hooksPath={'`'+hooks+'`' if enforced else 'unset'}"))


def probe_agent_config(nodes):
    """Agent-harness configuration. On a local install these are readable and
    are the whole tier story; in a managed environment the read may be
    refused, which is itself a boundary measurement."""
    paths = [HOME / ".claude" / "settings.json", Path(".claude/settings.json"),
             HOME / ".claude" / "settings.local.json"]
    present, refused = [], []
    for p in paths:
        try:
            if p.exists():
                p.stat()
                present.append(str(p))
        except PermissionError as e:
            refused.append(f"{p}: {e}")
        except Exception:
            pass
    if refused:
        nodes.append(unknown(
            "n5", "n1", "read the agent harness's own configuration",
            f"probe refused: {refused} — a control the measuring agent could "
            f"not inspect, which is a boundary observed from the inside"))
    elif present:
        nodes.append(node(
            "n5", "n1", "agent harness configuration is present and readable",
            f"settings files at {present}; a readable settings file can be "
            f"WRITTEN by anything running as this user, which is what makes "
            f"tool-enforced permissions a setting rather than a boundary",
            "setting", "the harness enforces its own permissions block",
            "observed", "existence check only — contents not read"))
    else:
        nodes.append(unknown(
            "n5", "n1", "agent harness configuration",
            "no settings file found at the usual paths; whether one exists "
            "above this session was not established"))


def probe_history(nodes):
    """The time axis. With history retained the grant is a union over every
    prior session's reach, not a tree over the present."""
    candidates = [HOME / ".claude" / "projects", HOME / ".claude" / "history.jsonl"]
    hits = [str(p) for p in candidates if p.exists()]
    nodes.append(node(
        "n6", "n1", "read this environment's accumulated session record",
        (f"transcripts/tool outputs retained at {hits} — a superset of every "
         f"file any prior session read" if hits
         else "no retained session record found at the usual paths"),
        "none" if hits else "unknown", None,
        "observed" if hits else "none",
        "existence check only — no transcript was opened"))
    return bool(hits)


# ── assemble ────────────────────────────────────────────────────────────────

def measure(product: str, surface: str, identity_record: str = None) -> dict:
    nodes = []
    probe_identity(nodes)
    probe_filesystem(nodes)
    probe_egress(nodes)
    probe_vcs(nodes)
    probe_agent_config(nodes)
    retained = probe_history(nodes)

    refused = [n for n in nodes if n["tier"] == "unknown"]
    return {
        "v": 0,
        "_what_this_is": "A grant document, generated by measurement rather "
                         "than authored. Presence and reachability only — no "
                         "file contents anywhere in it, by construction.",
        "environment": {"product": product, "surface": surface,
                        "vendor_named": False,
                        "note": "one environment, one date — generalising from "
                                "a single entry is the error the pack warns of"},
        "measured_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "measured_by": {
            "who": "the session running inside the environment — the "
                   "instrument IS the subject",
            "identity_record": identity_record,
            "tool": "packs/grant-and-mandate/tools/measure.py",
            "caveat_floor_not_census": "an agent measuring its own grant "
                                       "reports what it can see; a capability "
                                       "it does not know it has will not appear"},
        "history": {
            "retained": retained,
            "window": "not established by this tool — retention is a platform "
                      "property and must be read from the vendor's terms",
            "why_this_field_exists": "with history retained the grant is a "
                                     "UNION over every prior session's reach, "
                                     "not a tree over the present"},
        "measurement_honesty": {
            "probes_refused_or_unknown": len(refused),
            "detail": [n["reachable"] for n in refused] or "none",
            "rule": "a refused probe is recorded as unknown, never guessed — "
                    "and a probe blocked by something outside the agent's "
                    "control has measured a boundary"},
        "nodes": nodes,
        "licence": "CC BY 4.0",
    }


def main():
    a = sys.argv[1:]
    def opt(n, d=None):
        return a[a.index(n) + 1] if n in a else d
    doc = measure(opt("--product", "unknown"), opt("--surface", "unknown"),
                  opt("--identity-record"))
    out = opt("--out")
    text = json.dumps(doc, indent=2, sort_keys=True) + "\n"
    if out:
        Path(out).write_text(text)
        print(f"wrote {out}: {len(doc['nodes'])} nodes, "
              f"{doc['measurement_honesty']['probes_refused_or_unknown']} unknown")
    else:
        print(text)


if __name__ == "__main__":
    main()
