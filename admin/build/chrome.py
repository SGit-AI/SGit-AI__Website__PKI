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
    # v0.2.0: people first (the 18 October 2026 brief). The agent register and everything built around it stay,
    # one menu deeper, under Archive: kept as the record of the thinking, not as the front of the site.
    ("People", "people/index.html", [
        ("&#9679; The register of people", "people/index.html"),
        ("&#9679; Sign in &amp; your account", "account/index.html"),
        ("&#9679; Your vault &amp; your keys", "vault/index.html"),
        ("&#9679; Send a message", "send/index.html"),
        ("&#9679; Open a message (QR image or link)", "m/index.html"),
        ("&#9679; Invite someone", "invite/index.html"),
        ("&#9679; Identities for agents", "agents/index.html"),
        ("&#9679; Agents &amp; vault keys: what you do", "handover/for-you.html"),
        ("&#9679; Hand over a vault key (for agents)", "handover/index.html"),
        ("&#9679; Storyboards", "storyboards/index.html"),
        ("Articles", "articles/index.html"),
        ("How it works", "people/how.html"),
        ("The brief", "documents/people-directory.html"),
    ], ("handover/", "account/", "login/", "storyboards/", "articles/", "people/", "vault/", "send/", "m/", "invite/", "join/", "agents/")),
    ("The rules", "failure/index.html", [
        ("Why the old ones failed (2019)", "failure/index.html"),
        ("The four rules", "rules/index.html"),
        ("Prior art", "rules/prior-art.html"),
        ("The bootstrap trap", "bootstrap/index.html"),
        ("Identity &amp; mandate", "mandate/index.html"),
        ("Enrolment", "enrolment/index.html"),
    ], ("failure/", "rules/", "mandate/", "bootstrap/", "enrolment/")),
    ("Archive", "archive/index.html", [
        ("&#9679; The archive: what is kept, and why", "archive/index.html"),
        ("The agent register (fixtures)", "registry/index.html"),
        ("The front page, August 2026", "archive/front-2026-08.html"),
        ("The layers: broker &amp; what ships", "execution/index.html"),
        ("Build order (agents)", "roadmap/index.html"),
        ("Measure: probes &amp; the game", "authorised/index.html"),
        ("The bench &amp; experiments", "bench/index.html"),
        ("Insurance for agents", "insurance/index.html"),
        ("Map your case", "assess/index.html"),
        ("Origins: 2026", "origins/index.html"),
        ("The books", "book/index.html"),
    ], ("archive/", "registry/", "execution/", "shipped/", "roadmap/", "authorised/", "guess/", "probes/", "bench/", "book/",
        "experiments/", "simulator/", "workbench/", "insurance/", "insurance-book/", "assess/", "origins/")),
    ("Docs", "documents/index.html", [
        ("The documents", "documents/index.html"),
        ("The data viewer", "data/index.html"),
        ("Dev packs", "packs/index.html"),
    ], ("documents/", "packs/", "data/")),
    ("Site", "admin/comms.html", [
        ("Comms: tasks &amp; requests", "admin/comms.html"),
        ("Release history", "admin/versions.html"),
        ("Admin &amp; engineering", "admin/index.html"),
        ("Where we lose", "about/participant.html"),
    ], ("admin/", "about/")),
]

FOOTER = [
    ("People", [
        ("&#9679; The register", "people/index.html"),
        ("&#9679; Sign in", "login/index.html"),
        ("&#9679; Your account", "account/index.html"),
        ("&#9679; Your vault", "vault/index.html"),
        ("&#9679; Send a message", "send/index.html"),
        ("Open a message", "m/index.html"),
        ("&#9679; Invite someone", "invite/index.html"),
        ("&#9679; Identities for agents", "agents/index.html"),
        ("&#9679; Storyboards", "storyboards/index.html"),
        ("Articles", "articles/index.html"),
        ("How it works", "people/how.html"),
        ("The brief", "documents/people-directory.html"),
    ]),
    ("The rules", [
        ("Why the old ones failed", "failure/index.html"),
        ("The four rules", "rules/index.html"),
        ("Prior art", "rules/prior-art.html"),
        ("The bootstrap trap", "bootstrap/index.html"),
        ("Identity &amp; mandate", "mandate/index.html"),
        ("Enrolment", "enrolment/index.html"),
    ]),
    ("Archive", [
        ("The archive", "archive/index.html"),
        ("The agent register", "registry/index.html"),
        ("Measure", "authorised/index.html"),
        ("The bench", "bench/index.html"),
        ("Insurance for agents", "insurance/index.html"),
        ("Map your case", "assess/index.html"),
        ("Origins: 2026", "origins/index.html"),
    ]),
    ("The sources", [
        ("The documents", "documents/index.html"),
        ("Dev packs", "packs/index.html"),
        ("Where we lose", "about/participant.html"),
    ]),
    ("Site", [
        ("Comms: tasks &amp; requests", "admin/comms.html"),
        ("Release history", "admin/versions.html"),
        ("llms.txt", "llms.txt"),
    ]),
]

BLURB = ("A register of people and their public keys: verified by an anchor first, then by each other, "
         "with a link that only counts when it goes both ways; and the published work behind it. Part of the <a href=\"https://sgit.ai\" "
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
            f'  <span class="stage-pill">people first</span>\n'
            f'  <a class="ver" href="{up}admin/versions.html" title="Site release history" data-site-version></a>\n'
            f'  <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Menu">Menu</button>\n'
            f'  <div class="nav-items">\n{rows}\n  </div>\n'
            f'  <a class="gh signin" href="{up}login/index.html" data-signin>Sign in</a>\n'
            f'  <a class="gh" href="{GH}">★ GitHub</a>\n'
            f'  <script src="{up}assets/version.js" defer></script>\n'
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
            f'    <p class="verline">site <a href="{up}admin/versions.html" data-site-version>release history</a> · '
            f'<a href="{up}admin/index.html">engineering</a>{md_twin}</p>\n'
            f'  </div>\n{cols}\n</div></footer>')


def stamp_text_twins():
    """The version also appears in llms.txt and index.md, and validate.js enforces
    that it agrees. Nothing used to SET it there, so it was hand-edited every
    release — and hand-editing it silently missed twice. Own it here instead.

    And since v0.1.66 the version appears in ONE more place and in no page at all:
    assets/version.js, which every page loads and nav.js reads to fill the badge
    and the footer at load time. Before this, the badge was stamped into every
    page, so a one-line release rewrote ~200 files and the estate's own push
    policy refused 62 of its 67 releases (insurance/push-policy/case-study.md).
    Now a release ships version.txt, version.js, llms.txt, index.md and whatever
    actually changed."""
    out = []
    vjs = ROOT / "assets/version.js"
    want = f'window.SITE_VERSION = "{VERSION}";\n'
    if not vjs.exists() or vjs.read_text() != want:
        vjs.write_text(want)
        out.append("assets/version.js")
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
        # partner/src/ holds artefacts produced by somebody else, captured verbatim.
        # This estate does not inject its nav, its footer or its version stamp into
        # a document it does not own — and gen_partner.py fails the build if a single
        # byte of one changes, so an edit here would stop the release anyway.
        if path.parts[len(ROOT.parts):len(ROOT.parts) + 2] == ("partner", "src"):
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
