#!/usr/bin/env python3
"""gen_experiments.py — the experiments hub, from the manifest.

One experiment, one folder, one workflow, one visualisation. The page is
generated from experiments/experiments.json so the listing cannot drift from
the folders — and a manifest entry whose folder does not exist fails the build,
as does a folder no manifest entry names.
"""
import json, os, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EX = os.path.join(ROOT, "experiments")
esc = lambda s: html.escape(str(s), quote=True)

m = json.load(open(os.path.join(EX, "experiments.json"), encoding="utf-8"))
errors = []
declared = {e["id"] for e in m["experiments"]}
actual = {d for d in os.listdir(EX) if os.path.isdir(os.path.join(EX, d))}
for e in sorted(declared - actual):
    errors.append(f"manifest names '{e}' and experiments/{e}/ does not exist")
for d in sorted(actual - declared):
    errors.append(f"experiments/{d}/ exists and the manifest does not name it")
if errors:
    print(f"gen_experiments: {len(errors)} GATE FAILURE(S):")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)

reg = open(os.path.join(ROOT, "registry", "index.html"), encoding="utf-8").read()
nav = reg[reg.index('<nav class="site">'):reg.index('<main')]
foot = reg[reg.index('<footer class="site">'):reg.index("</body>")]

rows = "\n".join(f'''<a class="bk-dl" href="{esc(e['id'])}/index.html"><b>{esc(e['title'])}</b>
<span><b>Workflow:</b> {esc(e['workflow'])}</span>
<span><b>Visualisation:</b> {esc(e['visualisation'])}</span>
<span><b>Honesty:</b> {esc(e['honesty'])} &middot; brief {esc(e['brief'])}</span></a>''' for e in m["experiments"])
rules = "\n".join(f"<li>{esc(r)}</li>" for r in m["rules"])

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Experiments &mdash; game-like environments for the workflows &middot; pki.sgit.ai</title>
<meta name="description" content="One experiment, one folder, one workflow, one visualisation. Game-like environments that simulate the estate's workflows — each with its own generator, its own gates, and its own bench entry saying what it does not prove.">
<link rel="canonical" href="https://pki.sgit.ai/experiments/index.html">
<meta property="og:url" content="https://pki.sgit.ai/experiments/index.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/bench.css">
<link rel="stylesheet" href="../book/book.css">
</head>
<body>

{nav}<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / experiments</div>
<h1>Experiments</h1>
<p class="lead">Game-like environments for the workflows this estate serves &mdash; simulated first,
then supported. <b>One experiment, one folder, one workflow, one visualisation</b>, each with its own
generator, its own gates, and its own bench entry saying what it does not prove.</p>
<div class="bk-downloads" style="grid-template-columns:1fr">
{rows}
</div>
<h2>The rules every experiment inherits</h2>
<ol>{rules}</ol>
<p class="dr-src">Manifest: <a href="experiments.json">experiments.json</a> &mdash; the hub is
generated from it, and a manifest entry without a folder (or a folder without an entry) fails the
build. Convention declared in <a href="../briefs/v0.33.67__dev-brief__the-experiments-the-deck-and-the-table-cards-for-grants-mandates-facts-evidence-and-actions.md">brief v0.33.67</a>.</p>
</main>

{foot}
</body>
</html>
'''
open(os.path.join(EX, "index.html"), "w", encoding="utf-8").write(page)
print(f"gen_experiments: {len(m['experiments'])} experiments -> experiments/index.html")
