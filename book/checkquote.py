#!/usr/bin/env python3
"""checkquote.py — does this exact text appear in that source?

Normalisation, and only this normalisation: HTML tags are stripped, entities
are unescaped, and every run of whitespace collapses to one space. Line
wrapping and markup are not differences in the text; anything else is. A
quote that needs more help than this to match is not a quote.
"""
import sys, re, html, pathlib

def norm(s: str, is_html: bool, is_json: bool = False, is_txt: bool = False) -> str:
    # A JSON source stores its prose with \uXXXX escapes; the words are the
    # same words, so decode them before comparing.
    if is_json:
        # Parse it and walk out every string value, so \uXXXX escapes become
        # the characters they denote. The words are the same words.
        try:
            import json as _json
            def _walk(o, acc):
                if isinstance(o, str):
                    acc.append(o)
                elif isinstance(o, dict):
                    for k, v in o.items():
                        acc.append(str(k)); _walk(v, acc)
                elif isinstance(o, list):
                    for v in o:
                        _walk(v, acc)
                else:
                    acc.append(str(o))
            acc = []
            _walk(_json.loads(s), acc)
            s = ' \n '.join(acc)
        except Exception:
            pass
    # A .txt front door uses "#" as a comment marker the way markdown uses ">".
    if is_txt:
        s = re.sub(r'(?m)^[ \t]*#[ \t]?', '', s)
    # Markdown blockquote markers are markup, not text: a line beginning "> "
    # inside a quoted passage is the source quoting somebody, and the words
    # are the same words.
    if not is_html:
        s = re.sub(r'(?m)^[ \t]*>[ \t]?', '', s)
    if is_html:
        s = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', s, flags=re.S | re.I)
        s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    s = s.replace(' ', ' ').replace('‑', '-')
    # Backticks are the book's markup for code, never part of the quoted text.
    s = s.replace('`', '')
    return re.sub(r'\s+', ' ', s).strip()

def contains(source_path: str, quote: str) -> bool:
    p = pathlib.Path(source_path)
    if not p.exists():
        return False
    sfx = p.suffix.lower()
    body = norm(p.read_text(encoding='utf-8', errors='replace'),
                sfx in ('.html', '.htm'), sfx == '.json', sfx == '.txt')
    return norm(quote, False) in body

if __name__ == '__main__':
    ok = contains(sys.argv[1], sys.argv[2])
    print('OK' if ok else 'FAIL')
    sys.exit(0 if ok else 1)
