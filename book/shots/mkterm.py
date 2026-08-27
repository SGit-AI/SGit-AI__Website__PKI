#!/usr/bin/env python3
"""mkterm.py <transcripts-dir> <out-dir> — wrap each real transcript in a
terminal-styled page so it can be photographed at a known scale.

The transcript is the artefact; this only gives it a frame. Nothing here
edits, trims or re-flows the captured bytes — the file on disk is what the
figure shows, and `sha256sum book/shots/transcripts/*.txt` in Appendix A is
what a reader checks it against.
"""
import sys, html, pathlib, hashlib

SRC, OUT = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

TPL = """<!doctype html><meta charset="utf-8"><title>{title} · pki.sgit.ai</title>
<link rel="canonical" href="https://pki.sgit.ai/book/shots/term/{title}.html">
<meta name="robots" content="noindex">
<style>
 html,body{{margin:0;background:#0f1115}}
 .term{{font:13px/1.55 ui-monospace,"SF Mono",Menlo,Consolas,monospace;
   color:#d8dee9;background:#0f1115;padding:22px 24px;white-space:pre;
   -webkit-font-smoothing:antialiased}}
 .term .p{{color:#7aa2f7}}          /* the prompt */
 .term .c{{color:#5c6370;font-style:italic}}  /* a comment */
 .term .ok{{color:#9ece6a}}          /* an affirmative result */
 .term .no{{color:#f7768e}}          /* a refusal */
 .cap{{font:11px/1.4 ui-monospace,monospace;color:#5c6370;
   padding:0 24px 16px;background:#0f1115}}
 .sheet{{display:inline-block;background:#0f1115;min-width:100%}}
</style>
<div class="sheet"><div class="term">{body}</div>
<div class="cap">{sha}</div></div>
"""

def mark(line: str) -> str:
    e = html.escape(line)
    s = line.lstrip()
    if s.startswith("$"):
        return f'<span class="p">{e}</span>'
    if s.startswith("#"):
        return f'<span class="c">{e}</span>'
    if any(k in line for k in ("Verified OK", "Signature valid", "PERMIT",
                               "validate: OK", "✓", "Imported contact")):
        return f'<span class="ok">{e}</span>'
    if any(k in line for k in ("REFUSED", "PUSH REFUSED", "✗", "Error verifying",
                               "not permitted")):
        return f'<span class="no">{e}</span>'
    return e

for f in sorted(SRC.glob("*.txt")):
    raw = f.read_bytes()
    text = raw.decode("utf-8")
    body = "\n".join(mark(l) for l in text.rstrip("\n").split("\n"))
    digest = hashlib.sha256(raw).hexdigest()
    out = OUT / (f.stem + ".html")
    out.write_text(TPL.format(
        title=f.stem, body=body,
        sha=f"{f.name} · sha256:{digest[:32]}…"), encoding="utf-8")
    print(f"  {out.name}  sha256:{digest[:16]}…")
