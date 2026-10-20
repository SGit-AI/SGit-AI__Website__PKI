#!/usr/bin/env python3
"""Generates storyboards/: one page per storyboard, the shelf, every panel on one page, and the cast's model sheet.

    python3 admin/build/gen_storyboards.py            write the pages and the published JSON
    python3 admin/build/gen_storyboards.py --check    check the data and exit 1 on a problem or a stale page

The technique is gen-z-developers.sgit.ai's, and so is the code that draws: a storyboard is data
(admin/content/storyboards/NN__<slug>.json), the cast is data (cast.json), and assets/storyboard/storyboard.js (vendored
from the gen-z repository with one local patch) draws both in the browser as sketchy SVG with Rough.js. Nothing is an
image file. assets/storyboard/pki-props.js adds the props this site needs: keys, vaults, QR codes, sealed envelopes,
signed records, servers, arrows, terminals.

The checks, each one a way a storyboard could quietly go wrong:
  - every character a scene names is in the cast; every pose, mood and prop is one the kit draws;
  - every evidence panel's quote is found, word for word, in the file its `source` names (a page of this site, or a
    brief); a line a character says is the storyboard's own and is marked not_a_quote;
  - every "try it" link points at a page that exists.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "admin/content/storyboards"
OUT = ROOT / "storyboards"
POSES = {"stand", "point", "wave", "arms-up", "shrug", "think", "sit"}
MOODS = {"neutral", "happy", "excited", "calm", "worried", "sad", "surprised", "thinking", "confused", "determined"}
PROPS = {"laptop", "desk", "book", "board", "phone", "sign", "key", "vault", "qr", "envelope", "record", "server", "arrow", "mark", "calendar", "terminal", "phoneqr", "padlock"}
KINDS = {"cover", "scene", "evidence", "punchline", "spectrum", "map", "graph"}
e = lambda s: html.escape(str(s or ""), quote=True)

VIEWER = ('<div class="sb-viewer"><div class="sb-tools" role="toolbar" aria-label="How to view the panels"><span class="sb-views" role="group" aria-label="View"><button type="button" data-view="deck" title="One panel at a time (d)">Deck</button><button type="button" data-view="grid" title="Every panel on one page (g)">Grid</button><button type="button" data-view="script" title="The storyboard as text (t)">Script</button></span><label class="sb-for-grid">Per row <select class="sb-cols"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option></select></label><label title="Panels play as they arrive (a)"><input type="checkbox" class="sb-anim"> Animation</label><label class="sb-for-grid" title="Each panel\'s script under it (x)"><input type="checkbox" class="sb-showtext"> Text</label><button type="button" class="sb-playall sb-for-grid" title="Play the panels one after another (p)">Play in order</button><input type="search" class="sb-filter sb-for-list" placeholder="Filter: a word, a name, a mood, a kind" aria-label="Filter the panels"><span class="sb-keys"><kbd>d</kbd> <kbd>g</kbd> <kbd>t</kbd> views &middot; <kbd>a</kbd> animation &middot; <kbd>x</kbd> text &middot; <kbd>+</kbd><kbd>&minus;</kbd> per row &middot; <kbd>/</kbd> filter &middot; <kbd>p</kbd> play &middot; <kbd>&larr;</kbd><kbd>&rarr;</kbd> <kbd>n</kbd> notes <kbd>f</kbd> full screen</span></div>\n'
          '<div class="sb-deck" hidden><div class="sb-track"></div>\n<div class="sb-bar"><button type="button" class="sb-prev" aria-label="Previous panel">&larr;</button><span class="sb-count"></span><button type="button" class="sb-next" aria-label="Next panel">&rarr;</button><button type="button" class="sb-replay" title="Play this panel (p)">&#9654; Play</button><button type="button" class="sb-notes-toggle" title="Notes (n)">Notes</button><button type="button" class="sb-full" title="Full screen (f)">Full screen</button></div>\n<div class="sb-notes"></div></div>\n<div class="sb-grid" hidden></div>\n<div class="sb-script" hidden></div>\n')
CONTACT = ('<div class="sb-contact" data-view="grid"><div class="sb-tools" role="toolbar" aria-label="How to view the panels"><label class="sb-for-grid">Per row <select class="sb-cols"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option></select></label><label title="Panels play as they arrive (a)"><input type="checkbox" class="sb-anim"> Animation</label><label class="sb-for-grid" title="Each panel\'s script under it (x)"><input type="checkbox" class="sb-showtext"> Text</label><button type="button" class="sb-playall sb-for-grid" title="Play the panels one after another (p)">Play in order</button><input type="search" class="sb-filter sb-for-list" placeholder="Filter: a word, a name, a mood, a kind" aria-label="Filter the panels"><span class="sb-keys"><kbd>a</kbd> animation &middot; <kbd>x</kbd> text &middot; <kbd>+</kbd><kbd>&minus;</kbd> per row &middot; <kbd>/</kbd> filter &middot; <kbd>p</kbd> play</span></div>')
SCRIPTS = '<script src="../assets/storyboard/pki-props.js"></script><script src="../assets/vendor/rough-4.6.6.js"></script><script src="../assets/storyboard/storyboard.js"></script>'

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · pki.sgit.ai</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pki.sgit.ai/storyboards/{file}">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/people/people.css">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Patrick+Hand&display=swap">
<link rel="stylesheet" href="../assets/storyboard/storyboard.css">
<link rel="stylesheet" href="../assets/storyboard/pki-storyboards.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="sbmain">
{body}
</main>

<footer class="site"><div class="cols"></div></footer>
{scripts}
</body>
</html>
"""


def norm(s):
    """Text as a reader sees it: tags removed, whitespace collapsed, no space left before punctuation a tag split off."""
    return re.sub(r"\s+([.,;:!?])", r"\1", " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s)).split()))


def load():
    cast = json.loads((SRC / "cast.json").read_text())
    boards = [json.loads(p.read_text()) for p in sorted(SRC.glob("[0-9][0-9]__*.json"))]
    return cast, boards


def check(cast, boards):
    problems, ids = [], {c["id"] for c in cast["characters"]}
    for b in boards:
        where = b["slug"]
        for i, s in enumerate(b["scenes"], 1):
            at = f"{where} panel {i}"
            if s["kind"] not in KINDS: problems.append(f"{at}: unknown kind {s['kind']}")
            for c in s.get("cast", []):
                if c["who"] not in ids: problems.append(f"{at}: {c['who']} is not in the cast")
                if c.get("pose", "stand") not in POSES: problems.append(f"{at}: pose {c.get('pose')}")
                if c.get("mood", "neutral") not in MOODS: problems.append(f"{at}: mood {c.get('mood')}")
                if c.get("says") and not s.get("not_a_quote") and s["kind"] != "evidence": problems.append(f"{at}: a line said without not_a_quote")
            for p in s.get("props", []):
                if p["kind"] not in PROPS: problems.append(f"{at}: unknown prop {p['kind']}")
            if s["kind"] == "evidence":
                src = ROOT / s["source"]
                if not src.exists(): problems.append(f"{at}: the evidence source {s['source']} is not a file here")
                elif norm(s["evidence"]["quote"]) not in norm(src.read_text()): problems.append(f"{at}: the quote is not in {s['source']}, word for word")
        for label, href in b.get("try_it", []):
            if not (ROOT / href.split("#")[0]).exists(): problems.append(f"{where}: try it → {href} does not exist")
    return problems


def faces(b, cast):
    seen = []
    for s in b["scenes"]:
        for c in s.get("cast", []):
            if c["who"] not in seen: seen.append(c["who"])
    names = {c["id"]: c["name"] for c in cast["characters"]}
    return "".join(f'<svg class="sbx-face" data-who="{e(w)}" role="img" aria-label="{e(names[w])}"><title>{e(names[w])}</title></svg>' for w in seen)


def board_page(b, cast):
    data = json.dumps({"storyboard": b, "cast": cast}, ensure_ascii=False).replace("</", "<\\/")
    tries = "".join(f'<a class="btn{" primary" if i == 0 else ""}" href="../{e(h)}">{e(l)} →</a>' for i, (l, h) in enumerate(b.get("try_it", [])))
    panels = "".join(f'<li><a href="#scene-{i}">{i}</a>. {e(s.get("caption") or s.get("punchline") or s.get("title"))} <span class="small dim">({e(s["kind"])}; {e(s.get("source"))})</span></li>' for i, s in enumerate(b["scenes"], 1))
    status = '<span class="pill">proposed: not built yet</span> ' if b["status"] == "proposed" else '<span class="pill verified">built</span> '
    body = f"""<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="index.html">storyboards</a> / {e(b['title'])}</div>
<h1 class="sbtitle">{e(b['title'])}</h1>
<p class="lead">{status}{e(b['subtitle'])}</p>
<div class="acts sbtry"><span class="small dim">Try it, for real:</span> {tries}</div>
{VIEWER}<script type="application/json" class="sb-data">{data}</script></div>
<h2 id="panels">The panels</h2>
<ol class="small">{panels}</ol>
<p class="small dim">{e(b['by'])}. {e(b['rule'])} The data is <a href="{e(b['slug'])}.json">{e(b['slug'])}.json</a> and <a href="cast.json">cast.json</a>; the panels are drawn in your browser from it by <code>assets/storyboard/storyboard.js</code>, <a href="https://gen-z-developers.sgit.ai/storyboards/index.html">gen-z-developers.sgit.ai's storyboard kit</a>, with Rough.js. Nothing is an image file.</p>"""
    return PAGE.format(title=f"{b['title']}: a storyboard", desc=e(b["subtitle"]), file=f"{b['slug']}.html", body=body, scripts=SCRIPTS)


def shelf_page(cast, boards):
    data = json.dumps({"cast": cast, "boards": {b["slug"]: {"scenes": b["scenes"]} for b in boards}}, ensure_ascii=False).replace("</", "<\\/")
    n_panels = sum(len(b["scenes"]) for b in boards)
    shelves, order = {}, []
    for b in boards:
        if b["shelf"] not in shelves: shelves[b["shelf"]] = []; order.append(b["shelf"])
        shelves[b["shelf"]].append(b)
    names = [c["name"] for c in cast["characters"]]
    first = boards[0]
    secs = []
    for k, name in enumerate(order, 1):
        cards = []
        for b in shelves[name]:
            n = len(b["scenes"])
            strip = "".join(f'<svg class="sbx-thumb" data-board="{e(b["slug"])}" data-scene="{i}" viewBox="0 0 1600 1000" role="img" aria-label="Panel {i + 1}"></svg>' for i in range(1, 4))
            cards.append(f'<article class="sbx-card"><a class="sbx-cover" href="{e(b["slug"])}.html" aria-label="{e(b["title"])}: open the deck"><svg class="sbx-thumb" data-board="{e(b["slug"])}" data-scene="0" viewBox="0 0 1600 1000" role="img" aria-label="Panel 1"></svg><span class="sbx-tag">{b["scenes"] and str(boards.index(b) + 1).zfill(2)}</span></a>'
                         f'<a class="sbx-strip" href="{e(b["slug"])}.html?view=grid" aria-label="{e(b["title"])}: every panel">{strip}</a>'
                         f'<div class="sbx-body"><h3><a href="{e(b["slug"])}.html">{e(b["title"])}</a></h3><p>{e(b["subtitle"])}</p><div class="sbx-meta"><span class="sbx-faces">{faces(b, cast)}</span><span>{n} panels &middot; {e(b["status"])}</span></div>'
                         f'<div class="sbx-actions"><a class="sbx-btn sbx-btn-go" href="{e(b["slug"])}.html?view=deck">&#9654; Play</a><a class="sbx-btn" href="{e(b["slug"])}.html?view=grid">All {n}</a><a class="sbx-btn" href="{e(b["slug"])}.html?view=script">Script</a></div></div></article>')
        secs.append(f'<section class="sbx-shelf" aria-labelledby="sbx-shelf-{k}"><div class="sbx-head"><h2 id="sbx-shelf-{k}">{e(name)}</h2></div><div class="sbx-cards">{"".join(cards)}</div></section>')
    cast_cards = "".join(f'<div class="sbcast"><svg class="sbx-figure" data-who="{e(c["id"])}" data-pose="stand" data-mood="happy" viewBox="0 0 600 1000" role="img" aria-label="{e(c["name"])}"></svg><h3>{e(c["name"])}</h3><p class="small"><b>{e(c["role"][:1].upper() + c["role"][1:])}.</b> {e(c["stands_for"][:1].upper() + c["stands_for"][1:])}.</p><p class="small dim">“{e(c["line"])}”</p></div>' for c in cast["characters"])
    body = f"""<div class="sbx">
<section class="sbx-hero" aria-labelledby="sbx-h1">
<p class="sbx-count">{len(boards)} storyboards &middot; {n_panels} panels &middot; {len(names)} characters &middot; all drawn from data</p>
<h1 id="sbx-h1">The keys, one panel at a time</h1>
<svg class="sbx-underline" aria-hidden="true" viewBox="0 0 620 22" preserveAspectRatio="none"><path d="M4 14 Q 160 4 310 12 T 616 8"></path></svg>
<p class="sbx-lede">Every workflow on this site as a storyboard: a passkey and a vault, the two-way rule, an invitation, a secret by QR code, an access key sealed to a key, an agent getting a key, and the next one, in person. Flick through them as a deck, see every panel at once, or read them as a script; then try each one for real.</p>
<div class="sbx-actions"><a class="sbx-btn sbx-btn-ink" href="{e(first['slug'])}.html">Start with {e(first['title'])} &rarr;</a><a class="sbx-btn sbx-btn-marker" href="all.html">Every panel on one page</a><a class="sbx-btn sbx-btn-line" href="#cast">Meet the cast</a><a class="sbx-btn sbx-btn-line" href="model-sheet.html">The model sheet</a></div>
<svg class="sbx-lineup" role="img" aria-label="The cast in a row: {e(', '.join(names))}"></svg>
<div class="sbx-names" style="--n:{len(names)}">{"".join(f'<span>{e(x)}</span>' for x in names)}</div>
</section>
{"".join(secs)}
<section class="sbx-shelf" id="cast"><div class="sbx-head"><h2>The cast</h2><p>Fictional people and agents, each standing for a part someone plays in the register. Proposed by pki.agent for Dinis to accept, change or replace; the Anchor stands for the part Dinis plays for now, and whether it is drawn as him is his decision.</p></div><div class="sbcasts">{cast_cards}</div></section>
<script type="application/json" class="sb-data">{data}</script>
</div>
<p class="small dim">The technique, the drawing code and the viewer are <a href="https://gen-z-developers.sgit.ai/storyboards/index.html">gen-z-developers.sgit.ai's</a>, vendored with one local patch so this site can add props (keys, vaults, QR codes, sealed envelopes). The data: <a href="cast.json">cast.json</a> and one JSON file per storyboard, checked by <code>admin/build/gen_storyboards.py</code>.</p>"""
    return PAGE.format(title="Storyboards: the keys, one panel at a time", desc="Every PKI workflow on pki.sgit.ai as an interactive storyboard, drawn from data: passkey and vault, two-way links, invitations, secrets by QR code, sealed access keys, agents, and in person.", file="index.html", body=body, scripts=SCRIPTS)


def all_page(cast, boards):
    data = json.dumps({"boards": [{"storyboard": b} for b in boards], "cast": cast}, ensure_ascii=False).replace("</", "<\\/")
    body = f'<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="index.html">storyboards</a> / every panel</div>\n<h1 class="sbtitle">Every panel, on one page</h1>\n{CONTACT}<script type="application/json" class="sb-data">{data}</script></div>'
    return PAGE.format(title="Every storyboard panel", desc="Every panel of every pki.sgit.ai storyboard on one page, with a filter.", file="all.html", body=body, scripts=SCRIPTS)


def sheet_page(cast):
    data = json.dumps({"cast": cast}, ensure_ascii=False).replace("</", "<\\/")
    body = f'<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="index.html">storyboards</a> / the model sheet</div>\n<h1 class="sbtitle">The model sheet</h1>\n<p class="lead">How animators check a character is on model: every face in every mood, every body in every pose, drawn by the same code as the panels.</p>\n<div class="sb-sheet"><script type="application/json" class="sb-data">{data}</script></div>'
    return PAGE.format(title="The storyboards' model sheet", desc="The cast of pki.sgit.ai's storyboards, every mood and pose.", file="model-sheet.html", body=body, scripts=SCRIPTS)


def main():
    cast, boards = load()
    problems = check(cast, boards)
    pages = {f"{b['slug']}.html": board_page(b, cast) for b in boards}
    pages["index.html"] = shelf_page(cast, boards)
    pages["all.html"] = all_page(cast, boards)
    pages["model-sheet.html"] = sheet_page(cast)
    jsons = {f"{b['slug']}.json": json.dumps(b, indent=1, ensure_ascii=False) + "\n" for b in boards}
    jsons["cast.json"] = json.dumps(cast, indent=1, ensure_ascii=False) + "\n"
    strip = lambda t: re.sub(r'<footer class="site">.*?</footer>', "", re.sub(r'<nav class="site">.*?</nav>', "", t, flags=re.S), flags=re.S)
    if "--check" in sys.argv:
        for name, text in {**pages, **jsons}.items():
            p = OUT / name
            if not p.exists() or strip(p.read_text()) != strip(text): problems.append(f"storyboards/{name} is stale: run python3 admin/build/gen_storyboards.py")
        if problems:
            print("storyboards:\n  " + "\n  ".join(problems), file=sys.stderr); sys.exit(1)
        return
    if problems:
        print("storyboards: refused, nothing written:\n  " + "\n  ".join(problems), file=sys.stderr); sys.exit(1)
    OUT.mkdir(exist_ok=True)
    for name, text in {**pages, **jsons}.items(): (OUT / name).write_text(text)
    print(f"gen_storyboards: {len(boards)} storyboards, {sum(len(b['scenes']) for b in boards)} panels, {len(cast['characters'])} characters")


if __name__ == "__main__":
    main()
