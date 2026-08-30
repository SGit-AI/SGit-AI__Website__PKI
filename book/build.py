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

# ── the stats every count in the prose is generated from ────────────────────
# Adopted from the sibling estate's atlas volume, which carries its counts as
# `gen:stat` markers rather than as typed numbers. The reason is not tidiness:
# a number typed into prose drifts the moment anything moves, silently, while
# still reading as a fact. Two of this book's own counts had already gone stale
# before this was adopted — "thirty-five releases" was true until this book's
# own release made it thirty-six.
def compute_stats(chapters, quotes, shots):
    import subprocess, datetime, re as _re, json as _json

    def sh(cmd):
        return subprocess.run(cmd, shell=True, capture_output=True, text=True,
                              cwd=ROOT).stdout.strip()

    def tag_time(t):
        v = sh(f"git log -1 --format=%cI {t}")
        return datetime.datetime.fromisoformat(v) if v else None

    ch15 = (CONTENT / "15__where-this-estate-disagrees-with-itself.md").read_text()
    reg = ROOT / "registry"
    ids = sorted((reg / "records").glob("*/01__identity.json"))
    fixtures = sum(1 for f in ids
                   if _json.loads(f.read_text()).get("body", {}).get("private_key_published"))
    statements = sum(1 for f in (reg / "records").glob("*/*.json")
                     if f.name != "record.json")

    # Tags are the substrate for every release number in this book AND for the
    # figure harness. A shallow clone has none, and many automated environments
    # make one by default — this book's own writing session started against a
    # clone with zero tags and had to notice. So a missing tag REFUSES rather
    # than reporting zero: a silent 0 would be written into the prose as a fact.
    tags = [t for t in sh("git tag").split() if t]
    if not tags:
        raise SystemExit(
            "build.py: this checkout has NO TAGS, so no release number in the book "
            "can be computed and no past figure can be re-derived.\n"
            "  git fetch --unshallow origin && git fetch --tags origin\n"
            "Refusing rather than writing zeros into the prose.")
    a, b = tag_time("v0.1.25"), tag_time("v0.1.32")
    if not (a and b):
        raise SystemExit("build.py: v0.1.25/v0.1.32 not found — run `git fetch --tags origin`.")
    hours = round((b - a).total_seconds() / 3600, 1)
    first, last = tag_time("v0.1.0"), tag_time(sh("git describe --tags --abbrev=0"))
    site_days = round((last - first).total_seconds() / 86400) if first and last else 0

    body = [c for c in chapters
            if c["number"].isdigit() and 1 <= int(c["number"]) <= 17]
    return {
      "quotes":         len(quotes.get("quotes", [])),  # noqa: E241
      "drawn":          sum(c["drawn_markers"] for c in chapters),
      "figures":        len(shots.get("figures", [])),
      "chapters":       len(body),
      "files":          len(chapters),
      "words_chapters": f"{sum(c['words'] for c in body):,}",
      "words_total":    f"{sum(c['words'] for c in chapters):,}",
      "contradictions": len(_re.findall(r"^### A\d+ ·", ch15, _re.M)),
      "absences":       len(_re.findall(r"^### B\d+ ·", ch15, _re.M)),
      "records":        len(ids),
      "fixtures":       fixtures,
      "statements":     statements,
      "releases":       len(tags),
      "release_hours":  f"{hours:.1f}",
      "site_days":      str(site_days),
    }


MARKER = re.compile(
    r"<!-- gen:stat:([a-z_]+) -->(.*?)<!-- /gen:stat:\1 -->", re.S)


def apply_markers(stats, write: bool):
    """Rewrite every gen:stat marker to the computed value. In --check mode,
    a marker whose printed value has drifted from the computed one FAILS the
    build rather than being quietly corrected."""
    stale, seen = [], 0
    for md in sorted(CONTENT.glob("*.md")):
        text = md.read_text(encoding="utf-8")

        def sub(m):
            nonlocal seen
            seen += 1
            name, printed = m.group(1), m.group(2)
            want = str(stats.get(name, f"UNKNOWN-STAT:{name}"))
            if printed != want:
                stale.append(f"{md.name}: gen:stat:{name} prints {printed!r}, computed {want!r}")
            return f"<!-- gen:stat:{name} -->{want}<!-- /gen:stat:{name} -->"

        new = MARKER.sub(sub, text)
        if write and new != text:
            md.write_text(new, encoding="utf-8")
    return seen, stale


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


# ── stats and markers, BEFORE hashing (book.json records the written bytes) ─
def _scan_chapters():
    out = []
    for md in sorted(CONTENT.glob("*.md")):
        raw = md.read_bytes(); text = raw.decode("utf-8")
        out.append({"file": f"content/{md.name}", "number": md.name[:2],
                    "part": PARTS.get(md.name[:2], "—"),
                    "title": title_of(text, md.stem),
                    "words": len(text.split()),
                    "sha256": hashlib.sha256(raw).hexdigest(),
                    "stated_markers": len(re.findall(r"\*[Ss]tated", text)),
                    "drawn_markers": len(re.findall(r"\*Drawn\.\*", text))})
    return out

_quotes = json.loads((BOOK / "quotes.json").read_text()) if (BOOK / "quotes.json").exists() else {"quotes": []}
_shots = json.loads((BOOK / "shots" / "shots.json").read_text()) if (BOOK / "shots" / "shots.json").exists() else {"figures": []}
STATS = compute_stats(_scan_chapters(), _quotes, _shots)
_seen, _stale = apply_markers(STATS, write=not CHECK_ONLY)
if CHECK_ONLY and _stale:
    failures.extend(_stale)
notes.append(f"stats    : {_seen} gen:stat markers"
             + ("" if not _stale else
                (f", {len(_stale)} STALE" if CHECK_ONLY
                 else f", {len(_stale)} corrected")))
if _stale and not CHECK_ONLY:
    for _s in _stale:
        print(f"  · corrected {_s}")

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
  "stats": STATS,
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

# ── the book's own llms.txt stats block ─────────────────────────────────────
# A machine-readable front door with a hand-typed count is the same failure as
# prose with one, and worse: it is the file an agent reads first.
_llms = BOOK / "llms.txt"
if _llms.exists():
    _t = _llms.read_text(encoding="utf-8")
    _block = (
      "# gen:stats-begin\n"
      f"#   {STATS['chapters']} chapters in five parts, plus front matter, an appendix, a colophon\n"
      f"#   and a reference card — {STATS['files']} files, {STATS['words_chapters']} words of chapters\n"
      f"#   {STATS['figures']} figures · {STATS['quotes']} verified quotations · "
      f"{STATS['drawn']} claims drawn by the writer\n"
      f"#   the estate described: {STATS['records']} records, {STATS['fixtures']} of them fixtures, "
      f"{STATS['statements']} signed statements\n"
      "# gen:stats-end")
    _new = re.sub(r"# gen:stats-begin.*?# gen:stats-end", _block, _t, flags=re.S)
    if _new != _t:
        if CHECK_ONLY:
            failures.append("book/llms.txt: the generated STATS block has drifted")
        else:
            _llms.write_text(_new, encoding="utf-8")
    notes.append("llms.txt : STATS block "
                 + ("STALE" if (CHECK_ONLY and _new != _t) else "regenerated"))

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
