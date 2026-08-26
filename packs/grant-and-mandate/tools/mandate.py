#!/usr/bin/env python3
"""mandate.py — issue, verify, and ENFORCE a mandate.

The pack's build-order step 1, built: a declared mandate compiled into an
enforcement point that runs outside the agent's turn and refuses by exit code.

Crypto is the registry's, unchanged and sgit-native: canonical bytes are
`jq -cS 'del(.sig)'`, signatures are raw r||s ECDSA P-256 over SHA-256
(base64), fingerprints are sgit's 16-hex short form. A mandate signed here
verifies with `sgit pki verify` after the usual repackaging, and its issuer
resolves to a record in the public registry.

Subcommands:
  issue --allow-branches P[,P...] --expires DATE [--supersedes FILE] [--note T]
                  author a mandate, sign it as the issuer, render prohibitions
                  from the allow-list's complement, and write it dated
  verify [FILE]   check the signature against the issuer's registry record,
                  check the interval, and report what it permits
  check-branch B [FILE]
                  the enforcement decision for one branch: exit 0 permit,
                  exit 1 refuse. The whole control, callable
  pre-push        git pre-push hook entry point: reads refs on stdin and
                  refuses the push if any ref is outside the allow-list
  delta [FILE]    the branch-scoped delta against the measured grant:
                  what the environment can push that the mandate does not cover

DEFAULT-DENY. A missing, unparseable, unsigned, mis-signed or expired mandate
refuses the push. That is the adopted Cedar discipline (deny unless a policy
permits) and it is deliberate: a control that fails open is not a control.
"""

import base64
import fnmatch
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric import utils as asym_utils

HERE = Path(__file__).resolve().parent
PACK = HERE.parent                                   # packs/grant-and-mandate/
REPO = PACK.parent.parent                            # repository root
MANDATES = PACK / "mandates"
CURRENT = MANDATES / "current.json"
REGISTRY_RECORDS = REPO / "registry" / "records"
RESOURCE = "github.com/SGit-AI/SGit-AI__Website__PKI"
CAPABILITY = "repo.contents.push"

# The issuer is the registry's operator root. Its private half is PUBLISHED
# (it is a fixture), which is the honest state of this demonstration: the
# ENFORCEMENT below is real, and the AUTHORITY it enforces is a fixture.
# The two halves are independent, and only the second is waiting on a real
# enrolment. See doc 07.
ISSUER_FP = "sha256:90f97984b9cf3930"
SUBJECT_FP = "sha256:f9facb4c94da6c19"      # the session identity (real record)


# ── crypto: the registry's conventions, unchanged ───────────────────────────

def canonical_bytes(doc: dict) -> bytes:
    raw = json.dumps(doc).encode()
    return subprocess.run(["jq", "-cS", "del(.sig)"], input=raw,
                          check=True, capture_output=True).stdout


def fingerprint(pub) -> str:
    der = pub.public_bytes(serialization.Encoding.DER,
                           serialization.PublicFormat.SubjectPublicKeyInfo)
    return "sha256:" + hashlib.sha256(der).hexdigest()[:16]


def sign_raw(doc: dict, priv) -> str:
    der = priv.sign(canonical_bytes(doc), ec.ECDSA(hashes.SHA256()))
    r, s = asym_utils.decode_dss_signature(der)
    return base64.b64encode(r.to_bytes(32, "big") + s.to_bytes(32, "big")).decode()


def verify_raw(doc: dict, pub) -> bool:
    try:
        raw = base64.b64decode(doc["sig"])
        pub.verify(asym_utils.encode_dss_signature(
            int.from_bytes(raw[:32], "big"), int.from_bytes(raw[32:], "big")),
            canonical_bytes(doc), ec.ECDSA(hashes.SHA256()))
        return True
    except Exception:
        return False


def record_dir(fp: str) -> Path:
    return REGISTRY_RECORDS / fp.replace(":", "-", 1)


def issuer_public():
    """The issuer's signing key, read from its PUBLIC registry record — the
    same bytes any third party would fetch from pki.sgit.ai."""
    pem = (record_dir(ISSUER_FP) / "public" / "sign.pem").read_bytes()
    pub = serialization.load_pem_public_key(pem)
    if fingerprint(pub) != ISSUER_FP:
        raise SystemExit(f"issuer key does not hash to {ISSUER_FP}")
    return pub


def issuer_private():
    return serialization.load_pem_private_key(
        (record_dir(ISSUER_FP) / "private" / "sign.pem").read_bytes(), None)


# ── the allow-list, and the one decision the whole control turns on ─────────

def branch_permitted(branch: str, patterns: list) -> bool:
    """`claude/**` matches claude/anything (including nested). Exact names
    match exactly. Deliberately small: a pattern language is a policy language,
    and the pack's position is to adopt Cedar rather than grow one here."""
    for p in patterns:
        if fnmatch.fnmatchcase(branch, p.replace("**", "*")):
            return True
    return False


def load(path: Path = None) -> dict:
    path = path or CURRENT
    if not path.is_file():
        raise Refusal(f"no mandate at {path.relative_to(REPO)} — DEFAULT-DENY: "
                      f"a control with no policy refuses")
    try:
        return json.loads(path.read_text())
    except Exception as e:
        raise Refusal(f"mandate at {path.name} does not parse ({e}) — DEFAULT-DENY")


class Refusal(Exception):
    pass


def evaluate(branch: str, path: Path = None) -> dict:
    """The whole control, in one function. Returns a decision dict or raises
    Refusal. Everything that can go wrong refuses."""
    doc = load(path)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if not verify_raw(doc, issuer_public()):
        raise Refusal("mandate signature does not verify against the issuer's "
                      "registry record — DEFAULT-DENY")
    if doc.get("issuer") != ISSUER_FP:
        raise Refusal(f"mandate issuer {doc.get('issuer')} is not the expected "
                      f"issuer {ISSUER_FP} — DEFAULT-DENY")
    if not doc.get("expires_at"):
        raise Refusal("mandate carries no interval — a mandate with no interval "
                      "is a grant wearing a mandate's name — DEFAULT-DENY")
    if now > doc["expires_at"]:
        raise Refusal(f"mandate expired {doc['expires_at']} (now {now}) — "
                      f"DEFAULT-DENY")
    if now < doc.get("issued_at", ""):
        raise Refusal(f"mandate not yet valid (from {doc['issued_at']})")

    patterns = []
    for rule in doc.get("allow", []):
        if rule.get("capability") == CAPABILITY and rule.get("resource") == RESOURCE:
            patterns += rule.get("constraints", {}).get("branches", [])

    permitted = branch_permitted(branch, patterns)
    return {"branch": branch, "permitted": permitted, "patterns": patterns,
            "mandate_version": doc.get("mandate_version"),
            "expires_at": doc["expires_at"], "checked_at": now}


# ── issue ───────────────────────────────────────────────────────────────────

def render_prohibitions(patterns: list) -> list:
    """The presented form, GENERATED from the stored allow-list, never
    authored. Carries its own date at the document level, because the moment
    the capability set grows the rendering is stale."""
    branch_list = ", ".join(patterns)
    return [
        f"will not push to any branch of this repository outside {branch_list}",
        "will not push to any other repository",
        "will not act on any resource other than "
        f"{RESOURCE}",
    ]


def cmd_issue(args) -> None:
    patterns = args["allow_branches"].split(",")
    today = args.get("issued_at") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    version = args.get("version") or "1"
    doc = {
        "v": 0,
        "mandate_version": version,
        "issuer": ISSUER_FP,
        "issuer_note": "the registry's operator root — a FIXTURE: its private "
                       "half is published, so this mandate's ENFORCEMENT is "
                       "real and its AUTHORITY is not. The two halves are "
                       "independent; the second awaits a real enrolment",
        "subject": SUBJECT_FP,
        "subject_note": "the authoring session's identity (a real record: "
                        "private_key_published false)",
        "issued_at": today,
        "expires_at": args["expires"],
        "revocation": "an append to the issuer's registry record, carrying an "
                      "effective_from date",
        "allow": [{
            "capability": CAPABILITY,
            "resource": RESOURCE,
            "constraints": {"branches": patterns},
        }],
        "prohibitions_rendered_at": today[:10],
        "prohibitions_rendered_over": "capability set v0 "
                                      "(registry/capabilities.json)",
        "prohibitions": render_prohibitions(patterns),
        "enforced_by": {
            "point": ".githooks/pre-push",
            "tier": "setting",
            "why_not_boundary": "the hook file is inside the grant it bounds — "
                                "the agent can edit it, unset core.hooksPath, "
                                "or pass --no-verify. It moves the constraint "
                                "from expectation to setting, which is exactly "
                                "what the brief predicted, and no further",
            "how_to_reach_boundary": "the same allow-list evaluated where the "
                                     "agent cannot reach it: a branch "
                                     "protection rule, or a required CI check",
        },
    }
    if args.get("supersedes"):
        doc["supersedes"] = args["supersedes"]
    if args.get("note"):
        doc["note"] = args["note"]

    doc["sig"] = sign_raw(doc, issuer_private())
    MANDATES.mkdir(parents=True, exist_ok=True)
    out = MANDATES / f"mandate-v{version}.json"
    out.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n")
    CURRENT.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n")
    print(f"issued mandate v{version} -> {out.relative_to(REPO)}")
    print(f"  allow branches : {patterns}")
    print(f"  expires        : {args['expires']}")
    print(f"  current.json   : updated")


# ── verify / check / delta ──────────────────────────────────────────────────

def cmd_verify(path=None) -> None:
    doc = load(path)
    ok = verify_raw(doc, issuer_public())
    print(f"mandate v{doc.get('mandate_version')} ({(path or CURRENT).name})")
    print(f"  signature   : {'VALID' if ok else 'INVALID'} "
          f"against issuer {doc['issuer']}")
    print(f"  issuer       : {doc['issuer']}  (FIXTURE — authority is a "
          f"demonstration, enforcement is not)")
    print(f"  subject      : {doc['subject']}")
    print(f"  interval     : {doc['issued_at']} -> {doc['expires_at']}")
    for rule in doc.get("allow", []):
        print(f"  allow        : {rule['capability']} on {rule['resource']} "
              f"branches={rule['constraints']['branches']}")
    print(f"  prohibitions (rendered {doc.get('prohibitions_rendered_at')}):")
    for p in doc.get("prohibitions", []):
        print(f"      · {p}")
    sys.exit(0 if ok else 1)


def cmd_check_branch(branch: str, path=None) -> None:
    try:
        d = evaluate(branch, path)
    except Refusal as r:
        print(f"REFUSED  {branch}: {r}")
        sys.exit(1)
    if d["permitted"]:
        print(f"PERMIT   {branch}  (mandate v{d['mandate_version']}, "
              f"allow={d['patterns']}, expires {d['expires_at']})")
        sys.exit(0)
    print(f"REFUSED  {branch}  (mandate v{d['mandate_version']} permits "
          f"{d['patterns']})")
    sys.exit(1)


def cmd_delta(path=None) -> None:
    """The branch-scoped delta: what the measured grant can push that the
    mandate does not cover. Narrow on purpose — a general set difference needs
    the capability vocabulary, which is open (GM-D9/decision 6)."""
    doc = load(path)
    patterns = doc["allow"][0]["constraints"]["branches"]
    entry = json.loads((PACK / "library" /
                        "claude-code-remote__ccr-container__2026-08-26.json").read_text())
    n3 = next(n for n in entry["nodes"] if n["id"] == "n3")
    observed = ["claude/registry-mvp-brief-hpbap8", "dev"]
    excess = [b for b in observed if not branch_permitted(b, patterns)]
    print("branch-scoped delta, mandate v%s vs measured grant node n3"
          % doc.get("mandate_version"))
    print(f"  grant   (measured, tier={n3['tier']}): can push to {observed} "
          f"— observed, {entry['measured_at']}")
    print(f"  mandate (declared)                   : permits {patterns}")
    print(f"  EXCESS AUTHORITY                     : {excess or 'none'}")
    if excess:
        print("     acceptor: none. This is the exposure the hook closes.")
    print("  shortfall                            : none observed "
          "(the mandate asks for nothing the grant lacks)")
    print("  NOTE: branch-scoped only. The general delta needs a capability "
          "vocabulary, which is open.")


# ── the enforcement point: git pre-push ─────────────────────────────────────

def cmd_pre_push() -> None:
    """Refuses by exit code, from outside the agent's turn. Git runs this;
    the agent does not get to argue with the result."""
    refs = []
    for line in sys.stdin:
        parts = line.split()
        if len(parts) >= 3:
            local_ref, _, remote_ref = parts[0], parts[1], parts[2]
            if remote_ref.startswith("refs/heads/"):
                refs.append(remote_ref[len("refs/heads/"):])
            elif local_ref.startswith("refs/heads/"):
                refs.append(local_ref[len("refs/heads/"):])

    if not refs:
        return          # tags or deletes only — this mandate is about branches

    bad = []
    for b in sorted(set(refs)):
        try:
            d = evaluate(b)
        except Refusal as r:
            sys.stderr.write(banner([f"{b}: {r}"], None))
            sys.exit(1)
        if not d["permitted"]:
            bad.append((b, d))

    if bad:
        lines = [f"{b}  is not permitted by mandate v{d['mandate_version']}"
                 for b, d in bad]
        sys.stderr.write(banner(lines, bad[0][1]))
        sys.exit(1)


def banner(lines, d) -> str:
    doc = None
    try:
        doc = load()
    except Refusal:
        pass
    out = ["",
           "  ┌─────────────────────────────────────────────────────────────┐",
           "  │  PUSH REFUSED BY A MANDATE                                  │",
           "  └─────────────────────────────────────────────────────────────┘",
           ""]
    for l in lines:
        out.append(f"  ✗ {l}")
    if d:
        out.append(f"    permitted branches: {', '.join(d['patterns'])}")
        out.append(f"    mandate expires   : {d['expires_at']}")
    if doc:
        out.append("")
        out.append("  What you agreed to:")
        for p in doc.get("prohibitions", []):
            out.append(f"    · {p}")
        out.append(f"    (rendered {doc.get('prohibitions_rendered_at')} over "
                   f"{doc.get('prohibitions_rendered_over')})")
    out += ["",
            "  This refusal came from .githooks/pre-push, which git ran — not",
            "  from the agent deciding to comply. That is the whole point.",
            "",
            "  Mandate : packs/grant-and-mandate/mandates/current.json",
            "  Issuer  : resolves to a record in the public registry",
            "  Tier    : SETTING — this hook is inside the grant it bounds, so",
            "            --no-verify still gets past it. A boundary needs the",
            "            same allow-list evaluated where the agent cannot reach",
            "            it (branch protection, or a required CI check).",
            ""]
    return "\n".join(out) + "\n"


# ── cli ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    cmd, rest = sys.argv[1], sys.argv[2:]

    def opt(name, default=None):
        return rest[rest.index(name) + 1] if name in rest else default

    if cmd == "issue":
        cmd_issue({"allow_branches": opt("--allow-branches"),
                   "expires": opt("--expires"),
                   "version": opt("--version"),
                   "issued_at": opt("--issued-at"),
                   "supersedes": opt("--supersedes"),
                   "note": opt("--note")})
    elif cmd == "verify":
        cmd_verify(Path(rest[0]) if rest else None)
    elif cmd == "check-branch":
        cmd_check_branch(rest[0], Path(rest[1]) if len(rest) > 1 else None)
    elif cmd == "pre-push":
        cmd_pre_push()
    elif cmd == "delta":
        cmd_delta(Path(rest[0]) if rest else None)
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
