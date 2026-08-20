#!/usr/bin/env python3
"""The single definition of this site's nav and footer, and the tool that applies it.

Run from anywhere: python3 admin/build/chrome.py

Every page is hand-written static HTML — that stays true, because a human should
be able to open any file and edit it. What is NOT hand-maintained is the chrome:
the nav row (including the version badge that validate.js requires to agree
everywhere) and the footer columns. Those are defined once here and rewritten in
place across the tree, which is what stops an eleven-page site from drifting.

Adding a page: add it to NAV or FOOTER if it belongs there, write the file with
any nav/footer block at all, then run this. The block contents are replaced; the
`here` state is set from the page's own path.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION = (ROOT / "admin/build/version.txt").read_text().strip()
GH = "https://github.com/SGit-AI/SGit-AI__Website__PKI"

# (nav key, href from site root, label). The nav key matches a page when the
# page's own root-relative path equals the href.
NAV = [
    ("failure/index.html",   "The failure"),
    ("bootstrap/index.html", "Bootstrap"),
    ("rules/index.html",     "The rules"),
    ("mandate/index.html",   "Mandate"),
    ("enrolment/index.html", "Enrolment"),
    ("execution/index.html", "Execution"),
    ("shipped/index.html",   "Shipped"),
    ("roadmap/index.html",   "Build order"),
    ("packs/index.html",     "Packs"),
    ("documents/index.html", "Docs"),
    ("admin/comms.html",     "Comms"),
]

FOOTER = [
    ("The registry", [
        ("Why they don't exist", "failure/index.html"),
        ("The four rules", "rules/index.html"),
        ("Identity &amp; mandate", "mandate/index.html"),
        ("Build order", "roadmap/index.html"),
    ]),
    ("The three layers", [
        ("The bootstrap trap", "bootstrap/index.html"),
        ("Enrolment", "enrolment/index.html"),
        ("The execution broker", "execution/index.html"),
        ("What already ships", "shipped/index.html"),
    ]),
    ("The sources", [
        ("The documents", "documents/index.html"),
        ("The registry MVP pack", "packs/registry-mvp/index.html"),
        ("Where we lose", "about/participant.html"),
    ]),
    ("Site", [
        ("Comms: tasks &amp; requests", "admin/comms.html"),
        ("Release history", "admin/versions.html"),
        ("llms.txt", "llms.txt"),
        ("nhi.sgit.ai", "https://nhi.sgit.ai"),
        ("sgit.ai", "https://sgit.ai"),
    ]),
]

BLURB = ("Public key infrastructure for agents: a registry designed from a documented failure, "
         "and the published work behind it. All content CC BY 4.0.")
PARTNOTE = ('⚠ Participant disclosure: published by the sgit project, which builds the vault layer '
            'this registry would be built on. <a href="{up}about/participant.html" '
            'style="display:inline;padding:0">Read the disclosure</a>.')
PARTNOTE_SELF = '⚠ Participant disclosure: published by the sgit project. You are on the disclosure page.'


def nav_html(rel, up):
    rows = "\n".join(
        f'  <a class="nl{" here" if href == rel else ""}" href="{up}{href}">{label}</a>'
        for href, label in NAV)
    return (f'<nav class="site"><div class="row">\n'
            f'  <a class="brand" href="{up}index.html">pki<span>.sgit.ai</span></a>\n'
            f'  <span class="stage-pill">mvp draft</span>\n'
            f'  <a class="ver" href="{up}admin/versions.html" title="Site release history">{VERSION}</a>\n'
            f'{rows}\n'
            f'  <a class="gh" href="{GH}">★ GitHub</a>\n'
            f'</div></nav>')


def footer_html(rel, up):
    partnote = PARTNOTE_SELF if rel == "about/participant.html" else PARTNOTE.format(up=up)
    md_twin = f' · <a href="{up}index.md">this page as markdown</a>' if rel == "index.html" else ""
    cols = "\n".join(
        "  <div>\n"
        f"    <h4>{head}</h4>\n"
        + "\n".join(f'    <a href="{l if l.startswith("http") else up + l}">{t}</a>' for t, l in links)
        + "\n  </div>"
        for head, links in FOOTER)
    return (f'<footer class="site"><div class="cols">\n'
            f'  <div>\n'
            f'    <div class="brandline">pki<span>.sgit.ai</span></div>\n'
            f'    <p>{BLURB}</p>\n'
            f'    <p class="partnote">{partnote}</p>\n'
            f'    <p class="verline">site <a href="{up}admin/versions.html">{VERSION}</a> · '
            f'<a href="{up}admin/index.html">engineering</a>{md_twin}</p>\n'
            f'  </div>\n{cols}\n</div></footer>')


def main():
    changed = []
    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts:
            continue
        rel = path.relative_to(ROOT).as_posix()
        up = "../" * (len(path.relative_to(ROOT).parts) - 1)
        text = path.read_text()
        before = text
        text, n_nav = re.subn(r'<nav class="site">.*?</nav>', lambda _: nav_html(rel, up),
                              text, count=1, flags=re.S)
        text, n_foot = re.subn(r'<footer class="site">.*?</footer>', lambda _: footer_html(rel, up),
                               text, count=1, flags=re.S)
        if not n_nav or not n_foot:
            print(f"  ! {rel}: missing {'nav' if not n_nav else ''}{' and ' if not n_nav and not n_foot else ''}"
                  f"{'footer' if not n_foot else ''} block", file=sys.stderr)
        if text != before:
            path.write_text(text)
            changed.append(rel)
    print(f"chrome: {VERSION} applied — {len(changed)} page(s) updated")
    for c in changed:
        print(f"  · {c}")


if __name__ == "__main__":
    main()
