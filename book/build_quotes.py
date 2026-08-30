#!/usr/bin/env python3
"""build_quotes.py — extract every quotation from the chapters and LOCATE it.

The locator is discovered rather than asserted: each quoted passage is searched
for across the estate's published artefacts, and the file it is actually found
in is what gets recorded. A quotation found nowhere is a failure, printed and
counted, because this estate does not print quotations it has not checked.
"""
import re, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from checkquote import norm

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONTENT = ROOT / "book" / "content"

# The estate's published artefacts, in the order a locator should prefer them:
# raw pack sources first (the site treats them as the source of truth), then
# machine surfaces, then rendered pages.
CANDIDATES = []
for pat in ("packs/*/src/*.md", "packs/*/readiness-report.md",
            "registry/llms.txt", "registry/*.json", "registry/views/*.json",
            "llms.txt", "bench/llms.txt", "book/BRIEF.md",
            "packs/*/library/*.json", "packs/*/mandates/*.json",
            "admin/build/*.py", "*/index.html", "packs/*/*.html"):
    CANDIDATES += sorted(ROOT.glob(pat))

# The briefing zip's README is a published artefact too, and Chapter 15 quotes
# it. Extract it once so its text is locatable like any other source.
ZIP = ROOT / "packs/registry-mvp/registry-mvp-briefing-pack.zip"
ZIP_TEXT = {}
if ZIP.exists():
    import zipfile
    try:
        with zipfile.ZipFile(ZIP) as z:
            for n in z.namelist():
                if n.lower().endswith(("readme.md", "readme.txt")):
                    ZIP_TEXT[f"{ZIP.relative_to(ROOT)}!{n}"] = norm(
                        z.read(n).decode("utf-8", "replace"), False)
    except Exception:
        pass

CACHE = {}
def body(p):
    if p not in CACHE:
        try:
            sfx = p.suffix.lower()
            CACHE[p] = norm(p.read_text(encoding="utf-8", errors="replace"),
                            sfx in (".html", ".htm"), sfx == ".json", sfx == ".txt")
        except Exception:
            CACHE[p] = ""
    return CACHE[p]

def locate(quote: str):
    q = norm(quote, False)
    if len(q) < 25:
        return None
    for p in CANDIDATES:
        if q in body(p):
            return str(p.relative_to(ROOT))
    for name, text in ZIP_TEXT.items():
        if q in text:
            return name
    return None

quotes, unlocated = [], []
for md in sorted(CONTENT.glob("*.md")):
    text = md.read_text(encoding="utf-8")
    lines = text.split("\n")
    i = 0
    while i < len(lines):
        if lines[i].startswith("> "):
            block, start = [], i
            while i < len(lines) and (lines[i].startswith(">")):
                block.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
            # a quotation is a blockquote followed (within 2 lines) by a
            # stated marker; anything else is the book's own display text
            tail = " ".join(lines[i:i + 3])
            if not re.search(r"\*[Ss]tated|[Bb]oth \*stated\*", tail):
                continue
            passage = "\n".join(block).strip()
            # bullet lists inside a quote are checked line by line
            parts = ([re.sub(r"^[-*]\s+", "", l).strip()
                      for l in passage.split("\n") if l.strip().startswith(("-", "*"))]
                     or [passage])
            for part in parts:
                part = part.strip()
                if len(norm(part, False)) < 25:
                    continue
                src = locate(part)
                rec = {"chapter": md.name, "text": part, "source": src,
                       "verified": src is not None}
                quotes.append(rec)
                if src is None:
                    unlocated.append(rec)
        else:
            i += 1

out = {
  "what_this_is": ("Every quotation this book marks as `stated`, with the source "
    "it was found in. The locator is DISCOVERED, not asserted: each passage is "
    "searched for across the estate's published artefacts and the file it is "
    "actually found in is what is recorded. `book/build.py` re-reads every one of "
    "them out of the source it names on every build; a quote not found where it "
    "claims to be fails the build."),
  "normalisation": ("HTML tags stripped, entities unescaped, markdown blockquote "
    "markers removed, runs of whitespace collapsed to one space — and nothing "
    "else. Line wrapping and markup are not differences in the text."),
  "count": len(quotes),
  "unlocated": len(unlocated),
  "quotes": quotes,
}
(ROOT / "book" / "quotes.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
print(f"quotes: {len(quotes)} extracted, {len(quotes)-len(unlocated)} located, {len(unlocated)} NOT LOCATED")
for r in unlocated:
    print(f"  ! {r['chapter']}: {r['text'][:100]!r}")
