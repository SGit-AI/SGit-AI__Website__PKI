#!/usr/bin/env python3
"""registry_tool.py — the registry's single tool.

The registry is sgit-native, established by execution rather than assumption
(sgit-ai v0.16.0, 25 Aug 2026): fingerprints are sgit's 16-hex short form
(sha256 over the DER SubjectPublicKeyInfo, truncated), signatures are sgit's
raw r||s ECDSA P-256 over SHA-256 (Web Crypto interop), and identity bundles
are byte-shaped like `sgit pki export`. A statement here verifies with
`sgit pki import` + `sgit pki verify`, with openssl (after raw->DER
conversion), or with python-cryptography — this tool uses the third, calling
the same library sgit itself calls.

Canonicalisation stays `jq -cS 'del(.sig)'` exactly as params.json states.

Subcommands:
  make-fixtures   generate the whole cast: scenario fixtures, role personas
                  (with drop-in sgit keystores), and the authoring session's
                  real identity (private half NOT written into the tree)
  validate        re-verify the entire tree, including: the fixture flag read
                  before any signature, the ownership rule, every signature,
                  every reference, no private key material outside fixture
                  records, keystore/PEM agreement for roles, view drift, and
                  the expected verification answers (the acceptance test)
  verify SUBJECT CAPABILITY [--as-of DATE]
                  run the verification walk for one subject and capability
  enrol --label L [--agent-type T]
                  build and sign a REAL identity (private_key_published:
                  false) from a NEW locally generated keypair; writes the
                  record directory and stores the private halves OUTSIDE the
                  registry tree, printing where. For enrolling yourself.
"""

import base64
import hashlib
import json
import subprocess
import sys
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from cryptography.hazmat.primitives.asymmetric import utils as asym_utils

ROOT = Path(__file__).resolve().parent.parent      # registry/
RECORDS = ROOT / "records"
REGISTRY_NAME = "pki.sgit.ai"

# The scenario is dated: expected answers are computed as of this date so the
# acceptance test stays deterministic forever. A live verifier uses its own
# clock — and the "valid" fixtures genuinely expire on their valid_until,
# which is the registry teaching expiry by living it.
AS_OF = "2026-08-25T12:00:00Z"

# Fixture role keystores are passphrase-encrypted in sgit's own on-disk
# format, and the passphrase is published — they are fixtures, everything
# about them is published, that is the class.
ROLE_PASSPHRASE = "fixture-roles-2026"


# ── primitives: sgit's own recipe, same library, executed-equal ─────────────

def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def canonical_bytes(statement: dict) -> bytes:
    """Canonical bytes = the output of `jq -cS 'del(.sig)'` redirected to a
    file (one trailing newline), exactly as params.json states."""
    raw = json.dumps(statement).encode()
    return sh(["jq", "-cS", "del(.sig)"], input=raw).stdout


def statement_id(statement: dict) -> str:
    """Statement id = full sha256 over `jq -cS .` of the complete statement,
    sig included — a content address, deliberately not truncated."""
    raw = json.dumps(statement).encode()
    full = sh(["jq", "-cS", "."], input=raw).stdout
    return "sha256:" + hashlib.sha256(full).hexdigest()


def fingerprint(pub) -> str:
    """sgit's derivation, verified against PKI__Crypto.compute_fingerprint:
    sha256 over DER SubjectPublicKeyInfo, first 16 hex."""
    der = pub.public_bytes(serialization.Encoding.DER,
                           serialization.PublicFormat.SubjectPublicKeyInfo)
    return "sha256:" + hashlib.sha256(der).hexdigest()[:16]


def pem_public(pub) -> str:
    return pub.public_bytes(serialization.Encoding.PEM,
                            serialization.PublicFormat.SubjectPublicKeyInfo).decode()


def pem_private(priv, passphrase: str | None = None) -> str:
    enc = (serialization.BestAvailableEncryption(passphrase.encode())
           if passphrase else serialization.NoEncryption())
    return priv.private_bytes(serialization.Encoding.PEM,
                              serialization.PrivateFormat.PKCS8, enc).decode()


def load_public_pem(pem: str):
    return serialization.load_pem_public_key(pem.encode())


def sign_raw(statement: dict, ec_priv) -> str:
    """sgit's signature: ECDSA P-256 / SHA-256, raw r||s, base64."""
    der_sig = ec_priv.sign(canonical_bytes(statement), ec.ECDSA(hashes.SHA256()))
    r, s = asym_utils.decode_dss_signature(der_sig)
    return base64.b64encode(r.to_bytes(32, "big") + s.to_bytes(32, "big")).decode()


def verify_sig(statement: dict, pub) -> bool:
    try:
        raw = base64.b64decode(statement["sig"])
        r = int.from_bytes(raw[:32], "big")
        s = int.from_bytes(raw[32:], "big")
        pub.verify(asym_utils.encode_dss_signature(r, s),
                   canonical_bytes(statement), ec.ECDSA(hashes.SHA256()))
        return True
    except Exception:
        return False


# ── tree helpers ────────────────────────────────────────────────────────────

def dirname_for(fp: str) -> str:
    # ':' is not portable in paths (Windows checkouts) — same bytes, '-' join.
    return fp.replace(":", "-", 1)


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


def find_record_dir(fp: str) -> Path:
    d = RECORDS / dirname_for(fp)
    if not d.is_dir():
        raise SystemExit(f"no record directory for {fp}")
    return d


def resolve_reference(ref: dict) -> tuple[Path, dict]:
    """A reference is {record, statement}; any path field is convenience."""
    rdir = find_record_dir(ref["record"])
    for f, st in statements_of(rdir):
        if statement_id(st) == ref["statement"]:
            return f, st
    raise SystemExit(f"reference does not resolve: {ref}")


# ── the verification walk ───────────────────────────────────────────────────

def walk(subject_fp: str, capability: str, as_of: str = AS_OF) -> dict:
    """The REP §5 walk, C7-shaped (no seq/prev — ordering is the commit
    graph's). The fixture flag is read before any signature, and the caveat
    it produces survives onto every answer."""
    out = {"question": f"may {subject_fp} exercise {capability}?", "as_of": as_of,
           "basis": [], "fixture": False}
    roots = {r["fingerprint"] for r in load_json(ROOT / "roots.json")["roots"]}

    def finish():
        if out["fixture"]:
            out["basis"].append("FIXTURE CAVEAT: the private keys on this "
                                "chain are published; this answer demonstrates "
                                "the walk and proves nothing about anyone")
        return out

    sdir = find_record_dir(subject_fp)
    ident = identity_of(sdir)

    # REP §5 step 3: the flag is read BEFORE any signature is evaluated.
    flag = ident["body"].get("private_key_published")
    if flag is True:
        out["fixture"] = True
        out["basis"].append("subject is a FIXTURE: private key published — "
                            "signatures verify and prove nothing")
    elif flag is False:
        out["basis"].append("subject is not a fixture: a verified signature "
                            "proves possession by whoever holds the private half")
    else:
        out["answer"] = "REFUSED"
        out["basis"].append("private_key_published is absent — the field has "
                            "no default; entry rejected")
        return finish()

    spub = load_public_pem(ident["body"]["bundle"]["sign"])
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

    if not candidates:
        # inert-mandate check (decision 8, provisional): issued but never
        # accepted confers nothing.
        inert = any(st["type"] == "mandate" and
                    st["body"]["mandate_subject"] == subject_fp and
                    st["body"]["capability"] == capability
                    for rdir in record_dirs() for _, st in statements_of(rdir))
        out["answer"] = "NO"
        out["basis"].append(
            "a mandate exists and its subject has never accepted it — inert "
            "(decision 8, provisional)" if inert else
            "no mandate names this subject for this capability")
        return finish()

    mf, mandate = candidates[0]
    issuer_fp = mandate["record"]
    idir = find_record_dir(issuer_fp)
    iident = identity_of(idir)
    if iident["body"].get("private_key_published") is True:
        out["fixture"] = True
        out["basis"].append("issuer is a FIXTURE: private key published")
    ipub = load_public_pem(iident["body"]["bundle"]["sign"])

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
        return finish()
    out["basis"].append("issuer is a declared root of this registry")

    for f, st in statements_of(idir):
        if st["type"] == "revocation" and \
           st["body"]["revokes"]["statement"] == statement_id(mandate) and \
           st["body"]["effective_from"] <= as_of:
            out["answer"] = "NO"
            out["basis"].append(f"mandate revoked ({st['body']['reason']}), "
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
        stmts = [{"file": f.name, "type": st["type"],
                  "statement": statement_id(st)}
                 for f, st in statements_of(rdir)]
        manifest = {"_authority": "NONE — unsigned manifest, regenerable",
                    "record": fp, "dirname": rdir.name,
                    "label": ident["body"]["bundle"]["label"],
                    "fixture": ident["body"]["private_key_published"],
                    "statements": stmts,
                    "private_keys": sorted(p.name for p in (rdir / "private").glob("*.pem")),
                    "public_keys": sorted(p.name for p in (rdir / "public").glob("*.pem")),
                    "keystore": sorted(p.name for p in (rdir / "keystore").glob("*"))}
        write_json(rdir / "record.json", manifest)
        index["records"][fp] = {"path": f"records/{rdir.name}/",
                                "label": manifest["label"],
                                "fixture": manifest["fixture"],
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
            mandate = resolve_reference(b["under_mandate"])[1] if b.get("under_mandate") else None
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
                             "resources": mandated} if mandate else None),
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


# ── generation ──────────────────────────────────────────────────────────────

SCENARIO = [
    ("operator", "fixture-operator (pki.sgit.ai)", "operator", None),
    ("agent-a",  "fixture-agent-a — valid, accepted mandate", "llm-session", None),
    ("agent-b",  "fixture-agent-b — mandate revoked by issuer", "llm-session", None),
    ("agent-c",  "fixture-agent-c — mandate expired", "llm-session", None),
    ("agent-d",  "fixture-agent-d — mandate issued, never accepted", "llm-session", None),
    ("agent-e",  "fixture-agent-e — identity self-revoked", "llm-session", None),
]

ROLES = [
    ("role-site-agent", "role: site-agent",
     "maintains a published site under mandate: reads the repo, opens pull "
     "requests, never pushes to the release branch"),
    ("role-processor", "role: processor",
     "the referee of a write path: drains an inbox, applies published policy, "
     "commits what passes — the runbook is a policy document"),
    ("role-verifier", "role: verifier",
     "a third party answering 'may agent X do Y right now?' from public "
     "records and signature checks alone"),
    ("role-librarian", "role: librarian",
     "curates a corpus: locates sources, tiers them for publication, keeps "
     "the manifest that says what is where"),
]

CAP_PR = "repo.pull-request.create"
CAP_WRITE = "repo.contents.write"
RESOURCE = "github.com/SGit-AI/SGit-AI__Website__PKI"


def new_pair():
    ssk = ec.generate_private_key(ec.SECP256R1())
    esk = rsa.generate_private_key(public_exponent=65537, key_size=4096)
    return ssk, esk


def bundle_for(label, ssk, esk):
    return {"v": 1, "encrypt": pem_public(esk.public_key()),
            "sign": pem_public(ssk.public_key()), "label": label,
            "fingerprint": fingerprint(esk.public_key()),
            "signing_fingerprint": fingerprint(ssk.public_key())}


def envelope(type_, record_fp, body, created_at):
    return {"v": 1, "type": type_, "registry": REGISTRY_NAME,
            "record": record_fp, "signer": record_fp,
            "created_at": created_at, "body": body}


def identity_body(bundle, agent_type, published: bool, intent: str, claims: dict,
                  key_paths=None):
    body = {"bundle": bundle, "agent_type": agent_type,
            "private_key_published": published,
            "publication_intent": intent, "claims": claims}
    if key_paths:
        body["private_key_paths"] = key_paths
    return body


def make_fixtures() -> None:
    if RECORDS.exists():
        raise SystemExit("records/ already exists — remove it first to regenerate "
                         "(regeneration mints NEW keys: an equivalent registry, "
                         "not identical bytes)")

    cast = {}

    def mint(name, label):
        ssk, esk = new_pair()
        cast[name] = dict(label=label, ssk=ssk, esk=esk,
                          fp=fingerprint(ssk.public_key()),
                          bundle=bundle_for(label, ssk, esk))
        print(f"  {name:16s} {cast[name]['fp']}")
        return cast[name]

    def save(name, filename, st):
        c = cast[name]
        st["sig"] = sign_raw(st, c["ssk"])
        write_json(RECORDS / dirname_for(c["fp"]) / filename, st)
        return st

    def write_keys(name, keystore=False):
        c = cast[name]
        d = RECORDS / dirname_for(c["fp"])
        (d / "private").mkdir(parents=True, exist_ok=True)
        (d / "public").mkdir(parents=True, exist_ok=True)
        (d / "private" / "sign.pem").write_text(pem_private(c["ssk"]))
        (d / "private" / "encrypt.pem").write_text(pem_private(c["esk"]))
        (d / "public" / "sign.pem").write_text(pem_public(c["ssk"].public_key()))
        (d / "public" / "encrypt.pem").write_text(pem_public(c["esk"].public_key()))
        if keystore:
            # sgit's on-disk keystore layout (~/.sg-send/keys/<enc-fp>/, with
            # ':' as '_'), passphrase-encrypted with the PUBLISHED passphrase —
            # drop this directory into ~/.sg-send/keys/ and `sgit pki sign`
            # signs as this role.
            ks = d / "keystore" / c["bundle"]["fingerprint"].replace(":", "_")
            ks.mkdir(parents=True, exist_ok=True)
            (ks / "private_key.pem").write_text(pem_private(c["esk"], ROLE_PASSPHRASE))
            (ks / "public_key.pem").write_text(pem_public(c["esk"].public_key()))
            (ks / "signing_private.pem").write_text(pem_private(c["ssk"], ROLE_PASSPHRASE))
            (ks / "signing_public.pem").write_text(pem_public(c["ssk"].public_key()))
            write_json(ks / "metadata.json", {
                "label": c["label"], "algorithm": "RSA-OAEP", "key_size": 4096,
                "encryption_fingerprint": c["bundle"]["fingerprint"],
                "signing_fingerprint": c["fp"], "created": 1756108800})
            (d / "keystore" / "PASSPHRASE.txt").write_text(
                ROLE_PASSPHRASE + "\n# published on purpose — this role is a "
                "fixture; anyone may assume it, which is the point and the limit\n")

    # ── scenario fixtures ──
    for name, label, agent_type, _ in SCENARIO:
        c = mint(name, label)
        body = identity_body(
            c["bundle"], agent_type, True, "deliberate",
            {"note": "FIXTURE — exists to exercise the plumbing; its "
                     "signatures prove nothing (change-control C3)"},
            ["private/sign.pem", "private/encrypt.pem"])
        cast[name]["identity"] = save(name, "01__identity.json",
                                      envelope("identity", c["fp"], body,
                                               "2026-08-25T09:00:00Z"))
        write_keys(name)

    # ── role personas: published identities a fresh session can assume ──
    for name, label, definition in ROLES:
        c = mint(name, label)
        body = identity_body(
            c["bundle"], "llm-session", True, "deliberate",
            {"role": name.removeprefix("role-"),
             "role_definition": definition,
             "note": "FIXTURE ROLE — the private half (and the keystore "
                     "passphrase) are published so any fresh session can "
                     "assume this role by retrieval. A role is a costume, "
                     "not an identity: knowing the key says nothing about "
                     "who is wearing it"},
            ["private/sign.pem", "private/encrypt.pem",
             "keystore/ (sgit on-disk format, passphrase in keystore/PASSPHRASE.txt)"])
        cast[name]["identity"] = save(name, "01__identity.json",
                                      envelope("identity", c["fp"], body,
                                               "2026-08-25T10:00:00Z"))
        write_keys(name, keystore=True)

    # ── the authoring session's REAL identity: public half only ──
    c = mint("session", "site-session-2026-08-25 (authoring session of this registry)")
    body = identity_body(
        c["bundle"], "llm-session", False, "none",
        {"platform": "claude-code, remote container",
         "persistence": "session-scoped: the private half exists only inside "
                        "the authoring session's ephemeral container and is "
                        "not stored anywhere durable. When that session ends "
                        "the key is gone and nothing can sign as this "
                        "identity again — recorded as the pack's session-"
                        "scoped-identity finding, executed rather than "
                        "described",
         "note": "the one non-fixture record in this register, which is what "
                 "makes private_key_published evidence rather than a column "
                 "(change-control C19)"})
    cast["session"]["identity"] = save("session", "01__identity.json",
                                       envelope("identity", c["fp"], body,
                                                "2026-08-25T11:00:00Z"))
    d = RECORDS / dirname_for(c["fp"])
    (d / "public").mkdir(parents=True, exist_ok=True)
    (d / "public" / "sign.pem").write_text(pem_public(c["ssk"].public_key()))
    (d / "public" / "encrypt.pem").write_text(pem_public(c["esk"].public_key()))
    # the private halves go OUTSIDE the registry tree, and only there
    outside = Path("/tmp") / "session-identity-keys"
    outside.mkdir(parents=True, exist_ok=True)
    (outside / "sign.pem").write_text(pem_private(c["ssk"]))
    (outside / "encrypt.pem").write_text(pem_private(c["esk"]))
    print(f"  session identity private halves -> {outside} (NOT in the tree)")

    op = cast["operator"]

    def mandate(n, to, cap, res, constraints, vfrom, vuntil, created):
        body = {"mandate_subject": cast[to]["fp"], "capability": cap,
                "resource": res, "constraints": constraints,
                "environment": "fixture",
                "valid_from": vfrom, "valid_until": vuntil}
        return save("operator", n, envelope("mandate", op["fp"], body, created))

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
    m_role = mandate("08__mandate__pr-create__to-role-site-agent.json",
                     "role-site-agent", CAP_PR, RESOURCE,
                     {"branches": ["dev"], "paths": ["registry/**"],
                      "max_files": 50},
                     "2026-08-25T00:00:00Z", "2026-12-31T00:00:00Z",
                     "2026-08-25T10:05:00Z")

    save("operator", "06__revocation__of-03.json",
         envelope("revocation", op["fp"], {
             "revokes": {"record": op["fp"], "statement": statement_id(m_b)},
             "reason": "policy", "effective_from": "2026-08-20T00:00:00Z"},
             "2026-08-20T09:00:00Z"))

    # the grant: what the credential ACTUALLY permits (C1), with the doc-12
    # tree and its control labels. The descriptor is a hash; its preimage was
    # discarded before publication — even a fixture register never holds a
    # live capability.
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
        save(name, "02__acceptance.json", envelope("acceptance", cast[name]["fp"], {
            "accepts": {"record": op["fp"], "statement": statement_id(m)},
            "as": "mandate"}, created))

    accept("agent-a", m_a, "2026-08-25T09:20:00Z")
    accept("agent-b", m_b, "2026-08-01T10:00:00Z")
    accept("agent-c", m_c, "2026-07-01T10:00:00Z")
    accept("role-site-agent", m_role, "2026-08-25T10:10:00Z")
    _ = m_d  # agent-d: deliberately never accepted — the inert case

    # agent-e self-revokes its identity — key compromise
    e = cast["agent-e"]
    save("agent-e", "02__revocation__of-own-identity.json",
         envelope("revocation", e["fp"], {
             "revokes": {"record": e["fp"],
                         "statement": statement_id(e["identity"])},
             "reason": "key-compromise", "effective_from": "2026-08-24T00:00:00Z"},
             "2026-08-24T09:00:00Z"))

    # roots — one fixture root, and it says so
    write_json(ROOT / "roots.json", {
        "v": 1, "registry": REGISTRY_NAME,
        "roots": [{"fingerprint": op["fp"], "label": op["label"],
                   "private_key_published": True,
                   "warning": "FIXTURE ROOT — the private half of this root is "
                              "published in this repository. A chain anchored "
                              "here demonstrates the walk and proves nothing. "
                              "The first real root awaits an identity whose "
                              "private half has a good place to live."}]})

    # roles.json — the published role directory
    write_json(ROOT / "roles.json", {
        "v": 1,
        "_what_this_is": "pre-defined agent roles with PUBLISHED keypairs, so "
                         "a fresh session can assume a role by retrieval "
                         "alone. A role is a costume, not an identity: the "
                         "register can say what the role may do (its mandate) "
                         "and can never say who wore it.",
        "keystore_passphrase": ROLE_PASSPHRASE,
        "assume_with_sgit": [
            "pip3 install sgit-ai",
            "curl (or clone) the role's keystore/ directory",
            "cp -r keystore/sha256_* ~/.sg-send/keys/",
            "sgit pki sign <file> --fingerprint <ENCRYPTION fingerprint — "
            "bundle.fingerprint, the keystore's address>  "
            "# passphrase: see keystore/PASSPHRASE.txt"],
        "assume_with_openssl": [
            "fetch the role's private/sign.pem (unencrypted PEM)",
            "openssl dgst -sha256 -sign private/sign.pem <file>  "
            "# emits DER; convert to raw r||s for registry statements"],
        "roles": [{"role": name.removeprefix("role-"),
                   "record": cast[name]["fp"],
                   "path": f"records/{dirname_for(cast[name]['fp'])}/",
                   "definition": definition}
                  for name, label, definition in ROLES]})

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
            ("agent-e", CAP_PR, "NO", "subject identity revoked, effective 2026-08-24"),
            ("role-site-agent", CAP_PR, "YES",
             "the role holds a valid accepted mandate — and anyone holding "
             "the published key can exercise it, which is the lesson")]:
        expected["cases"].append({"subject": cast[name]["fp"],
                                  "subject_label": cast[name]["label"],
                                  "capability": cap,
                                  "expected": want, "because": why})
    write_json(ROOT / "views" / "expected-verifications.json", expected)

    build_manifests_and_index()
    build_views()
    print("registry generated")


# ── enrolment of a real identity ────────────────────────────────────────────

def enrol(label: str, agent_type: str = "human") -> None:
    """Generate a NEW keypair locally, write a real-identity record (public
    halves only), store the private halves outside the tree. The write path
    today is a git commit; the processor is whoever reviews it."""
    ssk, esk = new_pair()
    fp = fingerprint(ssk.public_key())
    bundle = bundle_for(label, ssk, esk)
    body = identity_body(bundle, agent_type, False, "none",
                         {"note": "real identity — private half held by its "
                                  "owner, never published"})
    st = envelope("identity", fp, body,
                  datetime_now_utc())
    st["sig"] = sign_raw(st, ssk)
    d = RECORDS / dirname_for(fp)
    write_json(d / "01__identity.json", st)
    (d / "public").mkdir(parents=True, exist_ok=True)
    (d / "public" / "sign.pem").write_text(pem_public(ssk.public_key()))
    (d / "public" / "encrypt.pem").write_text(pem_public(esk.public_key()))
    outside = Path.home() / ".sg-send" / "keys" / bundle["fingerprint"].replace(":", "_")
    outside.mkdir(parents=True, exist_ok=True)
    import getpass
    pw = getpass.getpass("passphrase to protect the private halves: ")
    (outside / "private_key.pem").write_text(pem_private(esk, pw))
    (outside / "public_key.pem").write_text(pem_public(esk.public_key()))
    (outside / "signing_private.pem").write_text(pem_private(ssk, pw))
    (outside / "signing_public.pem").write_text(pem_public(ssk.public_key()))
    write_json(outside / "metadata.json", {
        "label": label, "algorithm": "RSA-OAEP", "key_size": 4096,
        "encryption_fingerprint": bundle["fingerprint"],
        "signing_fingerprint": fp, "created": 0})
    build_manifests_and_index()
    print(f"enrolled {fp} ({label})")
    print(f"  record:        {d}")
    print(f"  private halves: {outside} — sgit keystore format; NOT in the tree")
    print("  next: commit the record directory and index.json; the maintainer "
          "reviewing the commit is the processor")


def datetime_now_utc() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── validation ──────────────────────────────────────────────────────────────

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

        has_private_material = any(
            "PRIVATE KEY" in p.read_text()
            for p in rdir.rglob("*") if p.is_file() and p.suffix in (".pem", ".txt"))
        if flag:
            notes.append(f"{rdir.name}: FIXTURE (private key published)")
            if not (rdir / "private" / "sign.pem").is_file():
                errors.append(f"{rdir.name}: fixture without its published "
                              f"private signing key")
            ks = rdir / "keystore"
            if ks.is_dir():
                # the published keystore must decrypt with the published
                # passphrase and contain the SAME signing key
                for sp in ks.rglob("signing_private.pem"):
                    k = serialization.load_pem_private_key(
                        sp.read_bytes(), ROLE_PASSPHRASE.encode())
                    if fingerprint(k.public_key()) != first["record"]:
                        errors.append(f"{rdir.name}: keystore signing key does "
                                      f"not match the record")
        else:
            notes.append(f"{rdir.name}: REAL identity (private half not published)")
            if has_private_material:
                errors.append(f"{rdir.name}: claims private_key_published: "
                              f"false but the record directory contains "
                              f"private key material — the flag would be a lie")

        owner = first["record"]
        if rdir.name != dirname_for(owner):
            errors.append(f"{rdir.name}: directory name does not match owner "
                          f"fingerprint {owner}")
        pub = load_public_pem(first["body"]["bundle"]["sign"])
        if fingerprint(pub) != owner:
            errors.append(f"{rdir.name}: bundle signing key does not hash to "
                          f"the record fingerprint")
        if first["body"]["bundle"]["signing_fingerprint"] != owner:
            errors.append(f"{rdir.name}: bundle signing_fingerprint disagrees "
                          f"with the record")

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
        reason = next(b for b in reversed(got["basis"])
                      if not b.startswith("FIXTURE CAVEAT"))
        print(f"  {'✓' if ok else '✗'} {case['subject_label']}: {got['answer']} "
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
    n_fix = sum(1 for d in record_dirs()
                if identity_of(d)["body"]["private_key_published"])
    print(f"registry validate: OK — {n_recs} records ({n_fix} fixtures, "
          f"{n_recs - n_fix} real), {n_stmts} statements, every signature "
          f"verified, every reference resolves, no private material outside "
          f"fixture records, all {len(expected['cases'])} expected answers "
          f"reproduced")


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
            args[0] = identity_of(RECORDS / args[0])["record"]
        print(json.dumps(walk(args[0], args[1], as_of), indent=2))
    elif cmd == "enrol":
        args = sys.argv[2:]
        label = args[args.index("--label") + 1]
        at = args[args.index("--agent-type") + 1] if "--agent-type" in args else "human"
        enrol(label, at)
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
