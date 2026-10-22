#!/usr/bin/env python3
"""Generates handover/index.html and /handover.md from handover/index.md, and handover/for-you.html from
handover/for-you.md (the same flows from Dinis's side: what he does).

handover/index.md is the instructions an agent follows to hand a
vault key over, sealed, as a QR code. The markdown is the source, and is published twice: at handover/index.md beside
the page, and at /handover.md, the short address Dinis gives an agent.

    python3 admin/build/gen_handover.py            write them
    python3 admin/build/gen_handover.py --check    exit 1 if either is stale (validate.js runs this)
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from md import render  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "handover/index.md"
PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · pki.sgit.ai</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pki.sgit.ai/handover/{slug}.html">
<link rel="alternate" type="text/markdown" href="{slug}.md" title="This page as markdown">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/people/people.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="doc article">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="../agents/index.html">agents</a> / {crumb}</div>
{banner}
{body}
<p class="dim small">The tool: <a href="../agents/pki-agent.mjs">agents/pki-agent.mjs</a> (<code>seal</code>, <code>read-qr</code>, <code>open</code>, <code>trust</code>). Why it is built this way: <a href="../articles/agents-vault-keys-and-the-root.html">agents, vault keys and the root</a>; drawn: <a href="../storyboards/a-vault-key-handed-over.html">a vault key, handed over</a>.</p>
</main>

<footer class="site"><div class="cols"></div></footer>
</body>
</html>
"""


def strip(t):
    t = re.sub(r'<nav class="site">.*?</nav>', "", t, flags=re.S)
    return re.sub(r'<footer class="site">.*?</footer>', "", t, flags=re.S)


PAGES = {
    "index": dict(title="Handing over a vault key", crumb="handover",
                  desc="Instructions for agents: hand a vault key to Dinis Cruz's vault keeper, sealed to a key that chains to the root, as a QR code holding strict JSON. The short address for an agent: pki.sgit.ai/handover.md.",
                  banner='<p class="msg ok">For an agent: <b>https://pki.sgit.ai/handover.md</b> is this page as markdown, the version to read. Paste into a session: <i>Read https://pki.sgit.ai/handover.md and follow it. The root is sha256:db7f79fdd87e030a. The recipient is &lt;fingerprint&gt;.</i> What you do, from your side: <a href="for-you.html">agents and vault keys: what you do</a>.</p>'),
    "for-you": dict(title="Agents and vault keys: what you do", crumb="what you do",
                    desc="Four recipes for Dinis Cruz, the root: give an agent a vault key he holds, onboard a new agent, have one agent hand a vault key to another, receive a key himself. Each key travels sealed; he carries an image.",
                    banner='<p class="msg ok">This is your side. The agents\' side, to give them: <a href="../handover.md">pki.sgit.ai/handover.md</a>.</p>'),
}


def main():
    outs = {}
    for slug, meta in PAGES.items():
        md = (ROOT / f"handover/{slug}.md").read_text()
        page = PAGE
        for k, v in meta.items():
            page = page.replace("{" + k + "}", v)
        outs[ROOT / f"handover/{slug}.html"] = page.replace("{slug}", slug).replace("{body}", render(md))
        if slug == "index":
            outs[ROOT / "handover.md"] = md
    if "--check" in sys.argv:
        stale = [p.name for p, t in outs.items() if not p.exists() or strip(p.read_text()) != strip(t)]
        if stale:
            print("handover: stale, run python3 admin/build/gen_handover.py: " + ", ".join(stale), file=sys.stderr)
            sys.exit(1)
        return
    for p, t in outs.items():
        p.write_text(t)
    print("gen_handover: " + ", ".join(str(p.relative_to(ROOT)) for p in outs) + " written")


if __name__ == "__main__":
    main()
