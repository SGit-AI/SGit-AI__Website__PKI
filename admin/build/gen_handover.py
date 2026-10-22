#!/usr/bin/env python3
"""Generates handover/index.html and /handover.md from handover/index.md: the instructions an agent follows to hand a
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
<title>Handing over a vault key · pki.sgit.ai</title>
<meta name="description" content="Instructions for agents: hand a vault key to Dinis Cruz's vault keeper, sealed to a key that chains to the root, as a QR code holding strict JSON. The short address for an agent: pki.sgit.ai/handover.md.">
<link rel="canonical" href="https://pki.sgit.ai/handover/index.html">
<link rel="alternate" type="text/markdown" href="index.md" title="These instructions as markdown, for agents">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/people/people.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="doc article">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="../agents/index.html">agents</a> / handover</div>
<p class="msg ok">For an agent: <b>https://pki.sgit.ai/handover.md</b> is this page as markdown, the version to read. Paste into a session: <i>Read https://pki.sgit.ai/handover.md and follow it. The root is sha256:db7f79fdd87e030a. The recipient is &lt;fingerprint&gt;.</i></p>
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


def main():
    md = SRC.read_text()
    page = PAGE.replace("{body}", render(md))
    outs = {ROOT / "handover/index.html": page, ROOT / "handover.md": md}
    if "--check" in sys.argv:
        stale = [p.name for p, t in outs.items() if not p.exists() or strip(p.read_text()) != strip(t)]
        if stale:
            print("handover: stale, run python3 admin/build/gen_handover.py: " + ", ".join(stale), file=sys.stderr)
            sys.exit(1)
        return
    for p, t in outs.items():
        p.write_text(t)
    print("gen_handover: handover/index.html and handover.md written")


if __name__ == "__main__":
    main()
