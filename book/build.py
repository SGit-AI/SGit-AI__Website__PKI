#!/usr/bin/env python3
"""build.py — build the book's machine surfaces and run every gate.

    python3 book/build.py            build everything, run every gate
    python3 book/build.py --check    gates only, no writes

Four gates, and each FAILS the build rather than warning:

  quotes     every `stated` quotation is re-read out of the source it names.
             A quote not found where it claims to be fails the build.
  figures    a figure of a PAST version must be re-derivable at its tag;
             a figure of the SITE AS IT STANDS must still match the live page.
             The second WILL break on the next release. That is correct.
  hashes     every chapter's SHA-256 in book.json matches its markdown.
  captions   every figure has a caption, and every caption says what to NOTICE.
"""
import json, re, sys, hashlib, pathlib, subprocess
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from checkquote import contains

ROOT = pathlib.Path(__file__).resolve().parents[1]
BOOK = ROOT / "book"
CONTENT = BOOK / "content"
CHECK_ONLY = "--check" in sys.argv

PARTS = {
    "00": "Front matter",
    "01": "Part one — Why there is nothing to inherit",
    "02": "Part one — Why there is nothing to inherit",
    "03": "Part one — Why there is nothing to inherit",
    "04": "Part two — The vocabulary, and why each word is load-bearing",
    "05": "Part two — The vocabulary, and why each word is load-bearing",
    "06": "Part two — The vocabulary, and why each word is load-bearing",
    "07": "Part two — The vocabulary, and why each word is load-bearing",
    "08": "Part three — What was built",
    "09": "Part three — What was built",
    "10": "Part three — What was built",
    "11": "Part three — What was built",
    "12": "Part four — How it composes",
    "13": "Part four — How it composes",
    "14": "Part four — How it composes",
    "15": "Part five — Honesty, and a first step",
    "16": "Part five — Honesty, and a first step",
    "17": "Part five — Honesty, and a first step",
    "18": "Appendix",
    "19": "End matter",
    "20": "End matter",
}

failures, notes = [], []


def title_of(text, fallback):
    m = re.search(r"^#\s+(.+)$", text, re.M)
    return m.group(1).strip() if m else fallback


# ── book.json ───────────────────────────────────────────────────────────────
chapters = []
for md in sorted(CONTENT.glob("*.md")):
    raw = md.read_bytes()
    text = raw.decode("utf-8")
    num = md.name[:2]
    chapters.append({
        "file": f"content/{md.name}",
        "number": num,
        "part": PARTS.get(num, "—"),
        "title": title_of(text, md.stem),
        "words": len(text.split()),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "stated_markers": len(re.findall(r"\*[Ss]tated", text)),
        "drawn_markers": len(re.findall(r"\*Drawn\.\*", text)),
    })

quotes = json.loads((BOOK / "quotes.json").read_text()) if (BOOK / "quotes.json").exists() else {"quotes": []}
shots = json.loads((BOOK / "shots" / "shots.json").read_text()) if (BOOK / "shots" / "shots.json").exists() else {"figures": []}

book = {
  "title": "A Key Means Nothing Alone",
  "subtitle": "Identity, mandate, and the exposure nobody accepted",
  "about": ("What pki.sgit.ai built between site v0.1.25 and v0.1.32, why the "
            "concepts underneath it are shaped the way they are, how it composes "
            "with RiskMandate.ai, and — as an equal partner to all of that — "
            "what none of it proves."),
  "written": "2026-08-27",
  "licence": "CC BY 4.0",
  "source_of_truth": "book/content/*.md — the HTML pages and the PDF are renderings of it",
  "positions_that_travel_with_every_chapter": [
    "The register is built; the trustworthy register is not. Ten of eleven records are fixtures with published private keys — every signature verifies and proves nothing.",
    "The root is a fixture, and roots.json says so in its own entry. No chain in this register carries authority.",
    "The enforcement is real and the authority is not, and they are independent halves. Anybody could forge the mandate the hook enforces.",
    "The hook is a `setting`, not a `boundary` — it sits inside the grant it bounds, and --no-verify gets past it.",
    "Every grant is a floor, not a census. An agent measuring its own grant reports what it can see.",
    "Two environments, one agent, one mandate. Everything generalises from a sample that small.",
    "The write path is a git commit reviewed by a human, not the account-less lane the design calls for.",
    "This is a participant's account, published by the project that builds the layer it argues for.",
  ],
  "provenance": {
    "rule": ("Every load-bearing claim about what this estate MEANS is marked "
             "`stated` or `drawn`. `stated` carries a verbatim quotation with a "
             "located source; `drawn` carries this book's own reasoning in the "
             "reader's view. DO NOT TREAT THE DRAWN CLAIMS AS THIS ESTATE'S "
             "POSITIONS — they are the book's."),
    "stated_quotations": len(quotes.get("quotes", [])),
    "drawn_claims": sum(c["drawn_markers"] for c in chapters),
  },
  "counts": {
    "files": len(chapters),
    "chapters": sum(1 for c in chapters if c["number"].isdigit() and 1 <= int(c["number"]) <= 17),
    "words_chapters": sum(c["words"] for c in chapters if c["number"].isdigit() and 1 <= int(c["number"]) <= 17),
    "words_total": sum(c["words"] for c in chapters),
    "figures": len(shots.get("figures", [])),
  },
  "chapters": chapters,
  "figures": [
    {k: f[k] for k in ("id", "page", "tag", "page_sha256", "image",
                       "image_sha256", "gate", "caption")}
    for f in shots.get("figures", [])
  ],
  "harness": "book/shots/ — see Appendix A. Every figure can be re-taken rather than believed.",
  "gates": "python3 book/build.py --check",
}

if not CHECK_ONLY:
    (BOOK / "book.json").write_text(json.dumps(book, indent=2, ensure_ascii=False) + "\n")

# ── gate 1 · quotes ─────────────────────────────────────────────────────────
qs = quotes.get("quotes", [])
bad_q = 0
for q in qs:
    src = q.get("source")
    if not src or not contains(str(ROOT / src.split("!")[0]) if "!" not in src else str(ROOT / src.split("!")[0]), q["text"]):
        if src and "!" in src:          # inside the briefing zip
            import zipfile
            zp, inner = src.split("!", 1)
            try:
                with zipfile.ZipFile(ROOT / zp) as z:
                    from checkquote import norm
                    if norm(q["text"], False) in norm(z.read(inner).decode("utf-8", "replace"), False):
                        continue
            except Exception:
                pass
        bad_q += 1
        failures.append(f"quote not found in {src or '<no source>'}: {q['text'][:80]!r}")
notes.append(f"quotes   : {len(qs) - bad_q}/{len(qs)} re-read out of the source they name")

# ── gate 2 · figures ────────────────────────────────────────────────────────
def page_digest_at(tag, page):
    """The SHA-256 of a page's bytes at a tag — the thing a figure claims."""
    rel = page.lstrip("/")
    if tag == "current":
        p = ROOT / rel
        return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
    try:
        blob = subprocess.run(["git", "-C", str(ROOT), "show", f"{tag}:{rel}"],
                              capture_output=True)
        return hashlib.sha256(blob.stdout).hexdigest() if blob.returncode == 0 else None
    except Exception:
        return None

fresh = stale = derivable = 0
for f in shots.get("figures", []):
    now = page_digest_at(f["tag"], f["page"])
    ok = (now == f["page_sha256"])
    if f["gate"] == "fresh":
        if ok:
            fresh += 1
        else:
            stale += 1
            failures.append(
                f"FRESH figure {f['id']} no longer matches the live page "
                f"({f['page']}). Re-take it: {f['retake'] if 'retake' in f else ''}")
    else:
        if ok:
            derivable += 1
        else:
            failures.append(
                f"PAST figure {f['id']} does not re-derive at {f['tag']} "
                f"({f['page']}) — recorded {f['page_sha256'][:16]}…, got "
                f"{(now or 'MISSING')[:16]}…")
    img = BOOK / f["image"]
    if not img.exists():
        failures.append(f"figure {f['id']}: image missing at {f['image']}")
    elif hashlib.sha256(img.read_bytes()).hexdigest() != f["image_sha256"]:
        failures.append(f"figure {f['id']}: image bytes changed since shots.json was built")
notes.append(f"figures  : {derivable} re-derivable at their tag, {fresh} fresh"
             + (f", {stale} STALE" if stale else ""))

# ── gate 3 · chapter hashes ─────────────────────────────────────────────────
bad_h = 0
if (BOOK / "book.json").exists():
    stored = json.loads((BOOK / "book.json").read_text())
    for c in stored.get("chapters", []):
        p = BOOK / c["file"]
        if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest() != c["sha256"]:
            bad_h += 1
            failures.append(f"chapter hash mismatch: {c['file']}")
notes.append(f"hashes   : {len(chapters) - bad_h}/{len(chapters)} chapters match book.json")

# ── gate 4 · captions ───────────────────────────────────────────────────────
bad_c = 0
for f in shots.get("figures", []):
    cap = f.get("caption", "")
    if not cap or cap == "MISSING CAPTION" or len(cap) < 40:
        bad_c += 1
        failures.append(f"figure {f['id']}: caption missing or too short to say what to notice")
notes.append(f"captions : {len(shots.get('figures', [])) - bad_c}/{len(shots.get('figures', []))} figures carry a caption")

# ── report ──────────────────────────────────────────────────────────────────
print("book gates")
for n in notes:
    print(f"  {n}")
if failures:
    print(f"\n  {len(failures)} FAILURE(S):")
    for f in failures:
        print(f"  ✗ {f}")
    sys.exit(1)
print("  ── all gates pass")
