#!/usr/bin/env python3
"""registry_tool.py — the fixture registry's single tool.

Everything this registry claims is checkable with two ubiquitous tools:
`openssl` (keys, signatures) and `jq` (canonicalisation). This script is a
thin orchestration of exactly the commands published in registry/llms.txt —
the implementation and the documented workflow are the same commands, so a
drift between them is a bug here, not a nuance there.

Subcommands:
  make-fixtures   generate the whole fixture cast (keys, statements, views)
  validate        re-verify the entire tree: flags, ownership, signatures,
                  references, intervals, revocations, regenerated indexes,
                  and the expected-verification answers (the acceptance test)
  verify SUBJECT CAPABILITY [--as-of DATE]
                  run the verification walk for one subject and capability

Run from anywhere; paths resolve relative to this file.
"""

import base64
import hashlib
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent      # registry/
RECORDS = ROOT / "records"
REGISTRY_NAME = "pki.sgit.ai"

# The scenario is dated: expected answers are computed as of this date so the
# acceptance test stays deterministic forever. A live verifier uses its own
# clock — and the "valid" fixture will genuinely expire on 2026-10-01, which
# is the registry teaching expiry by living it.
AS_OF = "2026-08-25T12:00:00Z"


# ── primitives: exactly the published commands ──────────────────────────────

def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def canonical_bytes(statement: dict) -> bytes:
    """Canonical bytes = the output of `jq -cS 'del(.sig)'` redirected to a
    file (one trailing newline), exactly as params.json states."""
    raw = json.dumps(statement).encode()
    return sh(["jq", "-cS", "del(.sig)"], input=raw).stdout


def statement_id(statement: dict) -> str:
    """Statement id = sha256 over `jq -cS .` of the full statement, sig
    included, same trailing-newline rule."""
    raw = json.dumps(statement).encode()
    full = sh(["jq", "-cS", "."], input=raw).stdout
    return "sha256:" + hashlib.sha256(full).hexdigest()


def fingerprint(pub_pem: bytes) -> str:
    """sha256 over the DER SubjectPublicKeyInfo, prefixed sha256:."""
    der = sh(["openssl", "pkey", "-pubin", "-outform", "DER"], input=pub_pem).stdout
    return "sha256:" + hashlib.sha256(der).hexdigest()


def keygen_ec() -> tuple[bytes, bytes]:
    sk = sh(["openssl", "genpkey", "-algorithm", "EC",
             "-pkeyopt", "ec_paramgen_curve:P-256"]).stdout
    pk = sh(["openssl", "pkey", "-pubout"], input=sk).stdout
    return sk, pk


def keygen_rsa() -> tuple[bytes, bytes]:
    sk = sh(["openssl", "genpkey", "-algorithm", "RSA",
             "-pkeyopt", "rsa_keygen_bits:4096"]).stdout
    pk = sh(["openssl", "pkey", "-pubout"], input=sk).stdout
    return sk, pk


def sign(statement: dict, sk_pem: bytes) -> str:
    payload = canonical_bytes(statement)
    with tempfile.TemporaryDirectory() as d:
        skf, pf = Path(d) / "sk.pem", Path(d) / "payload.bin"
        skf.write_bytes(sk_pem)
        pf.write_bytes(payload)
        der = sh(["openssl", "dgst", "-sha256", "-sign", str(skf), str(pf)]).stdout
    return base64.b64encode(der).decode()


def verify_sig(statement: dict, pub_pem: bytes) -> bool:
    payload = canonical_bytes(statement)
    der = base64.b64decode(statement["sig"])
    with tempfile.TemporaryDirectory() as d:
        pkf = Path(d) / "pk.pem"
        pf = Path(d) / "payload.bin"
        sf = Path(d) / "sig.der"
        pkf.write_bytes(pub_pem)
        pf.write_bytes(payload)
        sf.write_bytes(der)
        r = subprocess.run(["openssl", "dgst", "-sha256", "-verify", str(pkf),
                            "-signature", str(sf), str(pf)], capture_output=True)
    return r.returncode == 0


# ── tree helpers ────────────────────────────────────────────────────────────

def dirname_for(fp: str) -> str:
    # ':' is not portable in paths (Windows checkouts); the full fingerprint
    # stays authoritative inside statements.
    return "sha256-" + fp.split(":", 1)[1][:16]


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")


def load_json(path: Path):
    return json.loads(path.read_text())


def record_dirs():
    return sorted(p for p in RECORDS.iterdir() if p.is_dir())


def statements_of(record_dir: Path):
    for f in sorted(record_dir.glob("[0-9][0-9]__*.json")):
        yield f, load_json(f)


def identity_of(record_dir: Path) -> dict:
    for _, st in statements_of(record_dir):
        if st["type"] == "identity":
            return st
    raise SystemExit(f"{record_dir}: no identity statement")


def signing_key_of(record_dir: Path) -> bytes:
    return identity_of(record_dir)["body"]["bundle"]["sign"].encode()


def find_record_dir(fp: str) -> Path:
    d = RECORDS / dirname_for(fp)
    if not d.is_dir():
        raise SystemExit(f"no record directory for {fp}")
    return d


def resolve_reference(ref: dict) -> tuple[Path, dict]:
    """A reference is {record, statement}; path is convenience only."""
    rdir = find_record_dir(ref["record"])
    for f, st in statements_of(rdir):
        if statement_id(st) == ref["statement"]:
            return f, st
    raise SystemExit(f"reference does not resolve: {ref}")


# ── the verification walk ───────────────────────────────────────────────────

def walk(subject_fp: str, capability: str, as_of: str = AS_OF) -> dict:
    """The REP §5 walk, C7-shaped (no seq/prev — ordering is the commit
    graph's). Returns the answer plus the fixture caveat when it applies."""
    out = {"question": f"may {subject_fp} exercise {capability}?", "as_of": as_of,
           "basis": [], "fixture": False}
    roots = {r["fingerprint"] for r in load_json(ROOT / "roots.json")["roots"]}

    def finish():
        if out["fixture"]:
            out["basis"].append("FIXTURE CAVEAT: every key in this register is "
                                "published; this answer demonstrates the walk "
                                "and proves nothing about anyone")
        return out

    sdir = find_record_dir(subject_fp)
    ident = identity_of(sdir)

    # REP §5 step 3: the flag is read BEFORE any signature is evaluated.
    if ident["body"].get("private_key_published") is True:
        out["fixture"] = True
        out["basis"].append("subject is a FIXTURE: private key published — "
                            "signatures verify and prove nothing")

    spub = ident["body"]["bundle"]["sign"].encode()
    for f, st in statements_of(sdir):
        if not verify_sig(st, spub) or st["signer"] != subject_fp:
            out["answer"] = "REFUSED"
            out["basis"].append(f"{f.name}: signature/ownership check failed")
            return finish()
    out["basis"].append("subject record: every statement owner-signed, verified")

    # subject identity revoked?
    for f, st in statements_of(sdir):
        if st["type"] == "revocation":
            _, target = resolve_reference(st["body"]["revokes"])
            if target["type"] == "identity" and st["body"]["effective_from"] <= as_of:
                out["answer"] = "NO"
                out["basis"].append(
                    f"subject identity revoked ({st['body']['reason']}), "
                    f"effective {st['body']['effective_from']}")
                return finish()

    # acceptances -> mandates in issuer records
    candidates = []
    for f, st in statements_of(sdir):
        if st["type"] == "acceptance":
            mf, mandate = resolve_reference(st["body"]["accepts"])
            if mandate["type"] == "mandate" and \
               mandate["body"]["capability"] == capability and \
               mandate["body"]["mandate_subject"] == subject_fp:
                candidates.append((mf, mandate))

    # inert-mandate check (decision 8, taken provisionally as the pack
    # proposes): a mandate with no acceptance exists but confers nothing.
    unaccepted = []
    for rdir in record_dirs():
        for f, st in statements_of(rdir):
            if st["type"] == "mandate" and \
               st["body"]["mandate_subject"] == subject_fp and \
               st["body"]["capability"] == capability and \
               not any(statement_id(st) == statement_id(m) for _, m in candidates):
                unaccepted.append((f, st))

    if not candidates:
        out["answer"] = "NO"
        if unaccepted:
            out["basis"].append("a mandate exists and its subject has never "
                                "accepted it — inert (decision 8, provisional)")
        else:
            out["basis"].append("no mandate names this subject for this capability")
        return finish()

    mf, mandate = candidates[0]
    issuer_fp = mandate["record"]
    idir = find_record_dir(issuer_fp)
    ipub = signing_key_of(idir)

    iident = identity_of(idir)
    if iident["body"].get("private_key_published") is True:
        out["fixture"] = True
        out["basis"].append("issuer is a FIXTURE: private key published")

    for f, st in statements_of(idir):
        if not verify_sig(st, ipub) or st["signer"] != issuer_fp:
            out["answer"] = "REFUSED"
            out["basis"].append(f"issuer {f.name}: signature/ownership check failed")
            return finish()
    out["basis"].append("issuer record: every statement owner-signed, verified")

    if issuer_fp not in roots:
        out["answer"] = "STOPPED"
        out["basis"].append(f"issuer {issuer_fp} is not in roots.json — "
                            "I followed the chain this far and stopped")
        return out
    out["basis"].append("issuer is a declared root of this registry")

    # revocations in the issuer's record targeting this mandate
    for f, st in statements_of(idir):
        if st["type"] == "revocation":
            if st["body"]["revokes"]["statement"] == statement_id(mandate) \
               and st["body"]["effective_from"] <= as_of:
                out["answer"] = "NO"
                out["basis"].append(
                    f"mandate revoked ({st['body']['reason']}), "
                    f"effective {st['body']['effective_from']}")
                return finish()

    b = mandate["body"]
    if as_of < b["valid_from"]:
        out["answer"] = "NO"
        out["basis"].append(f"mandate not yet valid (from {b['valid_from']})")
    elif as_of > b["valid_until"]:
        out["answer"] = "NO"
        out["basis"].append(f"mandate expired {b['valid_until']}")
    else:
        out["answer"] = "YES"
        out["basis"].append(
            f"valid until {b['valid_until']}, on the authority of {issuer_fp}, "
            f"a declared root of this registry")
        out["resource"] = b["resource"]
        out["constraints"] = b["constraints"]
    return finish()


# ── generated conveniences (no authority) ───────────────────────────────────

def build_manifests_and_index() -> None:
    index = {"_authority": "NONE — a regenerable convenience; the records are "
                           "the registry (regenerate: registry_tool.py validate)",
             "generated_as_of": AS_OF, "records": {}, "mandates_by_subject": {}}
    for rdir in record_dirs():
        ident = identity_of(rdir)
        fp = ident["record"]
        stmts = []
        for f, st in statements_of(rdir):
            stmts.append({"file": f.name, "type": st["type"],
                          "statement": statement_id(st)})
        manifest = {"_authority": "NONE — unsigned manifest, regenerable",
                    "record": fp, "dirname": rdir.name,
                    "label": ident["body"]["bundle"]["label"],
                    "statements": stmts,
                    "private_keys": sorted(p.name for p in (rdir / "private").glob("*.pem")),
                    "public_keys": sorted(p.name for p in (rdir / "public").glob("*.pem"))}
        write_json(rdir / "record.json", manifest)
        index["records"][fp] = {"path": f"records/{rdir.name}/",
                                "label": manifest["label"],
                                "statements": len(stmts)}
        for f, st in statements_of(rdir):
            if st["type"] == "mandate":
                subj = st["body"]["mandate_subject"]
                index["mandates_by_subject"].setdefault(subj, []).append(
                    {"issuer": fp, "statement": statement_id(st),
                     "path": f"records/{rdir.name}/{f.name}",
                     "capability": st["body"]["capability"]})
    write_json(ROOT / "index.json", index)


def build_views() -> None:
    rows = []
    for rdir in record_dirs():
        for f, st in statements_of(rdir):
            if st["type"] != "grant":
                continue
            b = st["body"]
            m_ref = b.get("under_mandate")
            mandate = resolve_reference(m_ref)[1] if m_ref else None
            granted = b["permits"]["resources_count"]
            mandated = 1 if mandate else 0
            rows.append({
                "subject": b["grant_subject"],
                "grant": {"statement": statement_id(st),
                          "capability": b["permits"]["capability"],
                          "resources": granted},
                "mandate": ({"statement": statement_id(mandate),
                             "capability": mandate["body"]["capability"],
                             "resource": mandate["body"]["resource"],
                             "resources": mandated} if mandate
                            else None),
                "excess_authority": {"resources": granted - mandated,
                                     "acceptor": None,
                                     "observed_at": b["observed_at"],
                                     "note": "the difference has no acceptor"},
            })
    write_json(ROOT / "views" / "excess-authority.json", {
        "_authority": "NONE — derived from the records; recompute it yourself "
                      "(registry_tool.py validate does)",
        "what_this_is": "grant minus mandate, per subject: the exposure nobody "
                        "accepted (change-control C1); built for downstream "
                        "risk consumers",
        "generated_as_of": AS_OF, "rows": rows})


# ── fixture generation ──────────────────────────────────────────────────────

CAST = [
    ("operator",       "fixture-operator (pki.sgit.ai)", "operator"),
    ("agent-a",        "fixture-agent-a — valid, accepted mandate", "llm-session"),
    ("agent-b",        "fixture-agent-b — mandate revoked by issuer", "llm-session"),
    ("agent-c",        "fixture-agent-c — mandate expired", "llm-session"),
    ("agent-d",        "fixture-agent-d — mandate issued, never accepted", "llm-session"),
    ("agent-e",        "fixture-agent-e — identity self-revoked", "llm-session"),
]

CAP_PR = "repo.pull-request.create"
CAP_WRITE = "repo.contents.write"
RESOURCE = "github.com/SGit-AI/SGit-AI__Website__PKI"


def envelope(type_, record_fp, body, created_at):
    return {"v": 1, "type": type_, "registry": REGISTRY_NAME,
            "record": record_fp, "signer": record_fp,
            "created_at": created_at, "body": body}


def make_fixtures() -> None:
    if RECORDS.exists():
        raise SystemExit("records/ already exists — remove it first to regenerate "
                         "(regeneration mints NEW keys: an equivalent registry, "
                         "not identical bytes)")

    cast = {}
    for name, label, agent_type in CAST:
        ssk, spk = keygen_ec()
        esk, epk = keygen_rsa()
        fp = fingerprint(spk)
        efp = fingerprint(epk)
        cast[name] = dict(label=label, agent_type=agent_type, ssk=ssk, spk=spk,
                          esk=esk, epk=epk, fp=fp, efp=efp)
        print(f"  {name:10s} {fp}")

    def save(name, filename, st):
        c = cast[name]
        st["sig"] = sign(st, c["ssk"])
        d = RECORDS / dirname_for(c["fp"])
        write_json(d / filename, st)
        return st

    # identities — statement 1 of every record
    for name, _, _ in CAST:
        c = cast[name]
        body = {
            "bundle": {"v": 1, "encrypt": c["epk"].decode(),
                       "sign": c["spk"].decode(), "label": c["label"],
                       "fingerprint": c["efp"], "signing_fingerprint": c["fp"]},
            "agent_type": c["agent_type"],
            "private_key_published": True,
            "publication_intent": "deliberate",
            "private_key_paths": ["private/sign.pem", "private/encrypt.pem"],
            "claims": {"note": "FIXTURE — this identity exists to exercise the "
                               "plumbing; its signatures prove nothing "
                               "(change-control C3)"}}
        st = envelope("identity", c["fp"], body, "2026-08-25T09:00:00Z")
        cast[name]["identity"] = save(name, "01__identity.json", st)
        d = RECORDS / dirname_for(c["fp"])
        (d / "private").mkdir(parents=True, exist_ok=True)
        (d / "public").mkdir(parents=True, exist_ok=True)
        (d / "private" / "sign.pem").write_bytes(c["ssk"])
        (d / "private" / "encrypt.pem").write_bytes(c["esk"])
        (d / "public" / "sign.pem").write_bytes(c["spk"])
        (d / "public" / "encrypt.pem").write_bytes(c["epk"])

    op = cast["operator"]

    def mandate(n, to, cap, res, constraints, vfrom, vuntil, created):
        body = {"mandate_subject": cast[to]["fp"], "capability": cap,
                "resource": res, "constraints": constraints,
                "environment": "fixture",
                "valid_from": vfrom, "valid_until": vuntil}
        st = envelope("mandate", op["fp"], body, created)
        return save("operator", n, st)

    m_a = mandate("02__mandate__pr-create__to-agent-a.json", "agent-a", CAP_PR,
                  RESOURCE, {"branches": ["dev"],
                             "paths": ["briefs/**", "documents/**"],
                             "max_files": 20},
                  "2026-08-25T00:00:00Z", "2026-10-01T00:00:00Z",
                  "2026-08-25T09:05:00Z")
    m_b = mandate("03__mandate__contents-write__to-agent-b.json", "agent-b",
                  CAP_WRITE, RESOURCE, {"branches": ["dev"]},
                  "2026-08-01T00:00:00Z", "2026-12-31T00:00:00Z",
                  "2026-08-01T09:00:00Z")
    m_c = mandate("04__mandate__pr-create__to-agent-c.json", "agent-c", CAP_PR,
                  RESOURCE, {"branches": ["dev"]},
                  "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z",
                  "2026-07-01T09:00:00Z")
    m_d = mandate("05__mandate__pr-create__to-agent-d.json", "agent-d", CAP_PR,
                  RESOURCE, {"branches": ["dev"]},
                  "2026-08-25T00:00:00Z", "2026-10-01T00:00:00Z",
                  "2026-08-25T09:10:00Z")

    # the issuer revokes agent-b's mandate — rule 2: a signed append
    rev = envelope("revocation", op["fp"], {
        "revokes": {"record": op["fp"], "statement": statement_id(m_b)},
        "reason": "policy", "effective_from": "2026-08-20T00:00:00Z"},
        "2026-08-20T09:00:00Z")
    save("operator", "06__revocation__of-03.json", rev)

    # the grant: what the credential ACTUALLY permits (change-control C1),
    # with the doc-12 tree and its control labels. The descriptor is a hash;
    # its preimage was discarded before publication — even a fixture register
    # never holds a live capability.
    import secrets
    discarded_token = secrets.token_urlsafe(32)
    descriptor = "sha256:" + hashlib.sha256(discarded_token.encode()).hexdigest()
    del discarded_token
    grant_body = {
        "grant_subject": cast["agent-a"]["fp"],
        "credential": {"kind": "code-host-token", "descriptor": descriptor,
                       "descriptor_note": "hash of the issued credential; the "
                                          "preimage was discarded before "
                                          "publication"},
        "permits": {"capability": CAP_WRITE, "resources_count": 41,
                    "resources_sample": [RESOURCE,
                                         "github.com/SGit-AI/SGit-AI__Website__NHI",
                                         "github.com/SGit-AI/SGit-AI__Website"],
                    "note": "fixture: the count is the scenario, the sample is "
                            "real repository names, the credential is fiction"},
        "tree": [
            {"id": "n1", "parent": None,
             "reaches": ["holds the code-host token in process environment"],
             "mechanism": None, "enforced_by": "none",
             "evidence": "asserted", "checked": "2026-08-25"},
            {"id": "n2", "parent": "n1",
             "reaches": [f"{CAP_WRITE} on 41 repositories"],
             "mechanism": None, "enforced_by": "none",
             "evidence": "asserted", "checked": "2026-08-25"},
            {"id": "n3", "parent": "n2",
             "reaches": ["modify CI workflows, reaching deploy credentials"],
             "mechanism": "branch protection on dev",
             "enforced_by": "setting",
             "evidence": "documented", "checked": "2026-08-25"},
            {"id": "n4", "parent": "n2",
             "reaches": ["publish to the Pages deployment"],
             "mechanism": "environment restricted to the dev branch",
             "enforced_by": "boundary",
             "evidence": "documented", "checked": "2026-08-25"}],
        "under_mandate": {"record": op["fp"], "statement": statement_id(m_a)},
        "basis": "asserted",
        "observed_at": "2026-08-25"}
    save("operator", "07__grant__code-host-token__agent-a.json",
         envelope("grant", op["fp"], grant_body, "2026-08-25T09:15:00Z"))

    # acceptances — the subject's own statement, in the subject's own record
    def accept(name, m, created):
        st = envelope("acceptance", cast[name]["fp"], {
            "accepts": {"record": op["fp"], "statement": statement_id(m)},
            "as": "mandate"}, created)
        save(name, "02__acceptance.json", st)

    accept("agent-a", m_a, "2026-08-25T09:20:00Z")
    accept("agent-b", m_b, "2026-08-01T10:00:00Z")
    accept("agent-c", m_c, "2026-07-01T10:00:00Z")
    # agent-d: deliberately no acceptance — the inert case
    _ = m_d

    # agent-e self-revokes its identity — key compromise
    e = cast["agent-e"]
    rev_e = envelope("revocation", e["fp"], {
        "revokes": {"record": e["fp"],
                    "statement": statement_id(e["identity"])},
        "reason": "key-compromise", "effective_from": "2026-08-24T00:00:00Z"},
        "2026-08-24T09:00:00Z")
    save("agent-e", "02__revocation__of-own-identity.json", rev_e)

    # roots — one fixture root, and it says so
    write_json(ROOT / "roots.json", {
        "v": 1, "registry": REGISTRY_NAME,
        "roots": [{"fingerprint": op["fp"],
                   "label": op["label"],
                   "private_key_published": True,
                   "warning": "FIXTURE ROOT — the private half of this root is "
                              "published in this repository. A chain anchored "
                              "here demonstrates the walk and proves nothing."}]})

    # the expected answers — the acceptance test, as data
    expected = {"_what_this_is": "the verification walk's expected answers, as "
                                 "of the scenario date — the acceptance test "
                                 "for anyone implementing a verifier against "
                                 "this registry",
                "as_of": AS_OF, "cases": []}
    for name, cap, want, why in [
            ("agent-a", CAP_PR, "YES", "valid mandate, accepted, issuer is a root"),
            ("agent-b", CAP_WRITE, "NO", "mandate revoked, effective 2026-08-20"),
            ("agent-c", CAP_PR, "NO", "mandate expired 2026-08-01"),
            ("agent-d", CAP_PR, "NO", "mandate issued, never accepted — inert"),
            ("agent-e", CAP_PR, "NO", "subject identity revoked, effective 2026-08-24")]:
        expected["cases"].append({"subject": cast[name]["fp"],
                                  "subject_label": cast[name]["label"],
                                  "capability": cap,
                                  "expected": want, "because": why})
    write_json(ROOT / "views" / "expected-verifications.json", expected)

    build_manifests_and_index()
    build_views()
    print("fixture registry generated")


# ── validation: the whole tree, re-checked ──────────────────────────────────

def validate() -> None:
    errors, notes = [], []
    params = load_json(ROOT / "params.json")
    max_stmt = params["bounds"]["max_statement_bytes"]
    max_count = params["bounds"]["max_statements_per_record"]

    for rdir in record_dirs():
        stmts = list(statements_of(rdir))
        if not stmts:
            errors.append(f"{rdir.name}: empty record")
            continue
        first_file, first = stmts[0]
        if first["type"] != "identity":
            errors.append(f"{rdir.name}: first statement is not an identity")
            continue

        # C3: the flag is REQUIRED, has no default, and is read FIRST.
        flag = first["body"].get("private_key_published")
        if not isinstance(flag, bool):
            errors.append(f"{rdir.name}: private_key_published absent or not "
                          f"boolean — the field has no default; reject")
            continue
        if flag:
            notes.append(f"{rdir.name}: FIXTURE (private key published)")
            for rel in first["body"].get("private_key_paths", []):
                if not (rdir / rel).is_file():
                    errors.append(f"{rdir.name}: claims published private key "
                                  f"at {rel}, file absent")

        owner = first["record"]
        if rdir.name != dirname_for(owner):
            errors.append(f"{rdir.name}: directory name does not match owner "
                          f"fingerprint {owner}")
        pub = first["body"]["bundle"]["sign"].encode()
        if fingerprint(pub) != owner:
            errors.append(f"{rdir.name}: bundle signing key does not hash to "
                          f"the record fingerprint")

        if len(stmts) > max_count:
            errors.append(f"{rdir.name}: {len(stmts)} statements > bound {max_count}")
        for f, st in stmts:
            if f.stat().st_size > max_stmt:
                errors.append(f"{f.name}: {f.stat().st_size} bytes > bound {max_stmt}")
            # THE ownership rule: a valid signature by a non-owner is the 2019
            # failure and is not write authority.
            if st["record"] != owner or st["signer"] != owner:
                errors.append(f"{rdir.name}/{f.name}: record/signer is not the "
                              f"owner — the 2019 failure, rejected")
            if not verify_sig(st, pub):
                errors.append(f"{rdir.name}/{f.name}: signature does not verify")
            if st["type"] == "mandate":
                b = st["body"]
                if not (b.get("valid_from") and b.get("valid_until")):
                    errors.append(f"{f.name}: mandate with no interval is a "
                                  f"grant wearing a mandate's name — rejected")
            if st["type"] == "revocation":
                if not st["body"].get("effective_from"):
                    errors.append(f"{f.name}: revocation without effective_from")
                _, target = resolve_reference(st["body"]["revokes"])
                if target["signer"] != st["signer"]:
                    errors.append(f"{f.name}: revocation not signed by whoever "
                                  f"signed the original")
            if st["type"] == "acceptance":
                _, target = resolve_reference(st["body"]["accepts"])
                if target["type"] != "mandate":
                    errors.append(f"{f.name}: acceptance of a non-mandate")
            if st["type"] == "grant":
                d = st["body"]["credential"]["descriptor"]
                if not d.startswith("sha256:"):
                    errors.append(f"{f.name}: grant descriptor is not a hash — "
                                  f"the register never holds a live capability")

    # regenerate the conveniences and confirm nothing drifted
    before = {p: p.read_text() for p in
              [ROOT / "index.json", ROOT / "views" / "excess-authority.json"]
              + [d / "record.json" for d in record_dirs()]}
    build_manifests_and_index()
    build_views()
    for p, old in before.items():
        if p.read_text() != old:
            errors.append(f"{p.relative_to(ROOT)}: not reproducible from the "
                          f"records — regenerated content differs")

    # the acceptance test: the walk, against the expected answers
    expected = load_json(ROOT / "views" / "expected-verifications.json")
    for case in expected["cases"]:
        got = walk(case["subject"], case["capability"], expected["as_of"])
        ok = got["answer"] == case["expected"]
        mark = "✓" if ok else "✗"
        reason = next(b for b in reversed(got["basis"])
                      if not b.startswith("FIXTURE CAVEAT"))
        print(f"  {mark} {case['subject_label']}: {got['answer']} "
              f"(expected {case['expected']}) — {reason}")
        if not ok:
            errors.append(f"walk({case['subject_label']}): got {got['answer']}, "
                          f"expected {case['expected']}")
        if not got["fixture"]:
            errors.append(f"walk({case['subject_label']}): fixture caveat "
                          f"missing — the flag was not read first")

    for n in notes:
        print(f"  · {n}")
    if errors:
        print(f"registry validate: {len(errors)} error(s)")
        for e in errors:
            print("  ✗ " + e)
        sys.exit(1)
    n_recs = len(record_dirs())
    n_stmts = sum(1 for d in record_dirs() for _ in statements_of(d))
    print(f"registry validate: OK — {n_recs} records, {n_stmts} statements, "
          f"every signature verified, every reference resolves, all "
          f"{len(expected['cases'])} expected answers reproduced "
          f"(all records are fixtures, deliberately)")


# ── cli ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    cmd = sys.argv[1]
    if cmd == "make-fixtures":
        make_fixtures()
    elif cmd == "validate":
        validate()
    elif cmd == "verify":
        as_of = AS_OF
        args = sys.argv[2:]
        if "--as-of" in args:
            i = args.index("--as-of")
            as_of = args[i + 1]
            del args[i:i + 2]
        if len(args) == 2 and not args[0].startswith("sha256:"):
            # accept a record dirname for convenience
            args[0] = identity_of(RECORDS / args[0])["record"]
        print(json.dumps(walk(args[0], args[1], as_of), indent=2))
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
