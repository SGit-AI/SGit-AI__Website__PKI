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
PARENT = "https://sgit.ai"
PARENT_TITLE = ("sgit.ai — the parent project: the vault layer and the shipped CLI this "
                "registry would be built on")

# The nav, two levels. Twelve flat entries wrapped to two rows on a laptop and four on
# a phone, so they are grouped — the same component sgit.ai uses, ported with its rules
# intact. Each entry is (label, own page, [(sub-label, href), ...], (path prefixes)).
#
# Two rules the structure has to keep:
#   · A group label is always a link to a real page, never a menu-only stub. Nothing on
#     this site should be reachable only by opening a dropdown.
#   · `prefixes` decides the "here" state, so a page that is not itself in the nav
#     (documents/notary.html, packs/registry-mvp/schemas.html, origins/review.html)
#     still lights up the group it belongs to. Without it the deep pages — which is most
#     of the site — would render with nothing highlighted at all.
NAV = [
    ("The registry", "failure/index.html", [
        ("&#9679; The registry, live", "registry/index.html"),
        ("Why they don't exist", "failure/index.html"),
        ("The four rules", "rules/index.html"),
        ("Identity &amp; mandate", "mandate/index.html"),
        ("Build order", "roadmap/index.html"),
        ("Prior art", "rules/prior-art.html"),
    ], ("failure/", "rules/", "mandate/", "roadmap/", "registry/")),
    ("The layers", "bootstrap/index.html", [
        ("The bootstrap trap", "bootstrap/index.html"),
        ("Enrolment", "enrolment/index.html"),
        ("The execution broker", "execution/index.html"),
        ("What already ships", "shipped/index.html"),
    ], ("bootstrap/", "enrolment/", "execution/", "shipped/")),
    ("Map your case", "assess/index.html", [
        ("Map your own case", "assess/index.html"),
        ("The library of trees", "assess/library.html"),
        ("Synthetic readers", "packs/map-your-case/readers/index.html"),
    ], ("assess/",)),
    ("Origins", "origins/index.html", [
        ("Origins: 2026", "origins/index.html"),
        ("The review, redacted", "origins/review.html"),
    ], ("origins/",)),
    ("The bench", "bench/index.html", [
        ("&#9679; The bench &mdash; what is built", "bench/index.html"),
        ("&#9679; The simulator &mdash; play a card", "simulator/index.html"),
        ("&#9679; Experiments", "experiments/index.html"),
        ("&mdash; the chain room", "experiments/the-room/index.html"),
        ("&mdash; the table", "experiments/the-table/index.html"),
        ("&mdash; push to GitHub", "experiments/push-to-github/index.html"),
        ("&mdash; the deploy", "experiments/the-deploy/index.html"),
        ("&mdash; the control room", "experiments/the-control-room/index.html"),
        ("&#9679; The workbench (app)", "workbench/index.html"),
        ("The register, live", "registry/index.html"),
        ("The mandate hook", "packs/grant-and-mandate/enforcement.html"),
        ("The building blocks", "packs/grant-and-mandate/blocks.html"),
        ("Map your own case", "assess/index.html"),
        ("The book (commissioned)", "book/index.html"),
        ("&mdash; its commissioning brief", "book/brief.html"),
    ], ("bench/", "book/", "experiments/", "simulator/", "workbench/")),
    ("Insurance", "insurance/index.html", [
        ("&#9679; Insurance for agents", "insurance/index.html"),
        ("&mdash; what this is, and the rule", "insurance/what-this-is.html"),
        ("&mdash; the rating", "insurance/the-rating.html"),
        ("&mdash; the ecosystem &amp; the gate", "insurance/the-ecosystem-and-the-gate.html"),
        ("&mdash; who pays, &amp; the moving rating", "insurance/who-pays-and-the-moving-rating.html"),
        ("&mdash; why insurance", "insurance/why-insurance-and-what-broke-it.html"),
        ("&mdash; not in line (scale 1&ndash;5)", "insurance/not-in-line.html"),
        ("&mdash; the broker market", "insurance/the-broker-market.html"),
        ("&mdash; the policy as a statement", "insurance/the-policy-as-a-statement.html"),
        ("&mdash; the world model (the MVP)", "insurance/the-world-model.html"),
        ("&mdash; make them insurable", "insurance/make-them-insurable.html"),
        ("The pivot briefing (memo 0)", "documents/agent-insurance.html"),
        ("Rating before money (memo 1)", "documents/insurance-without-money.html"),
        ("The go-live gate (memo 2)", "documents/insurance-ecosystem.html"),
        ("Who pays (memo 3)", "documents/who-pays-for-the-delta.html"),
        ("Why insurance (memo 4)", "documents/why-insurance.html"),
        ("Not in line (memo 5)", "documents/not-in-line.html"),
        ("The broker market (memo 6)", "documents/the-broker-market.html"),
        ("The policy statement (memo 7)", "documents/the-policy-as-a-statement.html"),
        ("The world model (memo 8)", "documents/the-world-model.html"),
        ("Make them insurable (memo 9)", "documents/make-them-insurable.html"),
    ], ("insurance/",)),
    ("Docs", "documents/index.html", [
        ("The documents", "documents/index.html"),
        ("The data viewer", "data/index.html"),
        ("Dev packs", "packs/index.html"),
        ("The registry MVP pack", "packs/registry-mvp/index.html"),
        ("The Grant &amp; Mandate pack", "packs/grant-and-mandate/index.html"),
        ("The Map Your Case pack", "packs/map-your-case/index.html"),
    ], ("documents/", "packs/", "data/")),
    ("Site", "admin/comms.html", [
        ("Comms: tasks &amp; requests", "admin/comms.html"),
        ("Release history", "admin/versions.html"),
        ("Admin &amp; engineering", "admin/index.html"),
        ("Where we lose", "about/participant.html"),
    ], ("admin/", "about/")),
]

FOOTER = [
    ("The bench", [
        ("&#9679; What is built", "bench/index.html"),
        ("&#9679; The simulator", "simulator/index.html"),
        ("&#9679; The workbench (app)", "workbench/index.html"),
        ("The register, live", "registry/index.html"),
        ("The mandate hook", "packs/grant-and-mandate/enforcement.html"),
        ("The building blocks", "packs/grant-and-mandate/blocks.html"),
        ("&#8594; Map your own case", "assess/index.html"),
        ("The book (commissioned)", "book/index.html"),
        ("&mdash; its commissioning brief", "book/brief.html"),
    ]),
    ("Insurance", [
        ("&#9679; Insurance for agents", "insurance/index.html"),
        ("What this is, and the rule", "insurance/what-this-is.html"),
        ("The rating", "insurance/the-rating.html"),
        ("The ecosystem &amp; the gate", "insurance/the-ecosystem-and-the-gate.html"),
        ("Who pays, &amp; the moving rating", "insurance/who-pays-and-the-moving-rating.html"),
        ("Why insurance", "insurance/why-insurance-and-what-broke-it.html"),
        ("Not in line", "insurance/not-in-line.html"),
        ("The broker market", "insurance/the-broker-market.html"),
        ("The policy as a statement", "insurance/the-policy-as-a-statement.html"),
        ("The world model (the MVP)", "insurance/the-world-model.html"),
        ("Make them insurable", "insurance/make-them-insurable.html"),
        ("The pivot briefing", "documents/agent-insurance.html"),
    ]),
    ("The registry", [
        ("Why they don't exist", "failure/index.html"),
        ("The four rules", "rules/index.html"),
        ("Identity &amp; mandate", "mandate/index.html"),
        ("Build order", "roadmap/index.html"),
        ("Prior art", "rules/prior-art.html"),
    ]),
    ("The three layers", [
        ("The bootstrap trap", "bootstrap/index.html"),
        ("Enrolment", "enrolment/index.html"),
        ("The execution broker", "execution/index.html"),
        ("What already ships", "shipped/index.html"),
    ]),
    ("The sources", [
        ("Origins: 2026", "origins/index.html"),
        ("The documents", "documents/index.html"),
        ("The registry MVP pack", "packs/registry-mvp/index.html"),
        ("The Grant &amp; Mandate pack", "packs/grant-and-mandate/index.html"),
        ("The Map Your Case pack", "packs/map-your-case/index.html"),
        ("Where we lose", "about/participant.html"),
    ]),
    ("Site", [
        ("Comms: tasks &amp; requests", "admin/comms.html"),
        ("Release history", "admin/versions.html"),
        ("llms.txt", "llms.txt"),
    ]),
]

BLURB = ("Public key infrastructure for agents: a registry designed from a documented failure, "
         "and the published work behind it. Part of the <a href=\"https://sgit.ai\" "
         "style=\"display:inline;padding:0\"><b>sgit.ai</b></a> network — the vault layer and "
         "the shipped CLI this registry is designed onto. All content CC BY 4.0.")
PARTNOTE = ('⚠ Participant disclosure: published by the sgit project, which builds the vault layer '
            'this registry would be built on. <a href="{up}about/participant.html" '
            'style="display:inline;padding:0">Read the disclosure</a>.')
NETLINE = ('<a href="https://sgit.ai"><b>↗ sgit.ai</b></a> — the parent project, and the vault layer '
           'this is designed onto · <a href="https://nhi.sgit.ai">↗ nhi.sgit.ai</a> — the problem · '
           '<a href="https://sentinel.sgit.ai">↗ sentinel.sgit.ai</a> · '
           '<a href="https://sgit.ai/network/index.html">↗ the network</a>')
PARTNOTE_SELF = '⚠ Participant disclosure: published by the sgit project. You are on the disclosure page.'


def nav_html(rel, up):
    groups = []
    for label, own, subs, prefixes in NAV:
        active = rel == own or any(rel.startswith(pre) for pre in prefixes)
        links = "\n".join(
            f'      <a class="sl{" here" if href == rel else ""}" href="{up}{href}">{text}</a>'
            for text, href in subs)
        groups.append(
            f'    <div class="ni ni-has">\n'
            f'      <a class="nl{" here" if active else ""}" href="{up}{own}">{label}'
            f'<span class="caret">&#9662;</span></a>\n'
            f'      <div class="sub">\n{links}\n      </div>\n'
            f'    </div>')
    rows = "\n".join(groups)
    return (f'<nav class="site"><div class="row">\n'
            f'  <a class="brand" href="{up}index.html">pki<span>.sgit.ai</span></a>\n'
            f'  <a class="parent" href="{PARENT}" title="{PARENT_TITLE}">↗ part of <b>sgit.ai</b></a>\n'
            f'  <span class="stage-pill">mvp draft</span>\n'
            f'  <a class="ver" href="{up}admin/versions.html" title="Site release history">{VERSION}</a>\n'
            f'  <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Menu">Menu</button>\n'
            f'  <div class="nav-items">\n{rows}\n  </div>\n'
            f'  <a class="gh" href="{GH}">★ GitHub</a>\n'
            f'  <script src="{up}assets/nav.js" defer></script>\n'
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
            f'    <p class="netline">{NETLINE}</p>\n'
            f'    <p class="partnote">{partnote}</p>\n'
            f'    <p class="verline">site <a href="{up}admin/versions.html">{VERSION}</a> · '
            f'<a href="{up}admin/index.html">engineering</a>{md_twin}</p>\n'
            f'  </div>\n{cols}\n</div></footer>')


def stamp_text_twins():
    """The version also appears in llms.txt and index.md, and validate.js enforces
    that it agrees. Nothing used to SET it there, so it was hand-edited every
    release — and hand-editing it silently missed twice. Own it here instead."""
    out = []
    llms = ROOT / "llms.txt"
    t = llms.read_text()
    t2, n = re.subn(r"Site version: v\d+\.\d+\.\d+", f"Site version: {VERSION}", t, count=1)
    if n and t2 != t:
        llms.write_text(t2)
        out.append("llms.txt")
    md = ROOT / "index.md"
    t = md.read_text()
    t2, n = re.subn(r"· site v\d+\.\d+\.\d+ ·", f"· site {VERSION} ·", t, count=1)
    if n and t2 != t:
        md.write_text(t2)
        out.append("index.md")
    return out


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
    changed += stamp_text_twins()
    print(f"chrome: {VERSION} applied — {len(changed)} file(s) updated")
    for c in changed:
        print(f"  · {c}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        # piped into head/less — not an error
        sys.stdout = None
