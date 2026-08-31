#!/usr/bin/env python3
"""gen_insurance.py — the insurance hub and its doctrine pages, from the manifest.

The insurance body of work: eight voice memos on the pivot, each filed verbatim
as a brief before it is read, and the doctrine derived from them here.

The gates are symmetric, as everywhere on this estate — a manifest that
disagrees with the folder fails the build in EITHER direction:

  * a doctrine document declared with no file in src/
  * a src/*.md that nothing declares
  * a memo marked processed whose brief does not exist
  * an MVP declared whose folder does not exist, or a folder nothing declares
  * a memo count that disagrees with the manifest's own `expected`

And one that is specific to this folder: every doctrine document must carry a
`does_not_prove` section, for the same reason the bench refuses an entry
without one. A rating that omits its limits is the theatre the rule forbids.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INS = ROOT / "insurance"
SRC = INS / "src"
BRIEFS = ROOT / "briefs"

esc = lambda s: html.escape(str(s), quote=True)


def check(m):
    """Every gate. Returns a list of failures; a non-empty list stops the build."""
    errs = []

    declared_docs = {d["file"] for d in m["doctrine"]}
    actual_docs = {p.name for p in SRC.glob("*.md")}
    for f in sorted(declared_docs - actual_docs):
        errs.append(f"manifest declares doctrine '{f}' and insurance/src/{f} does not exist")
    for f in sorted(actual_docs - declared_docs):
        errs.append(f"insurance/src/{f} exists and the manifest does not declare it")

    # A doctrine document without its limits is the thing the folder's own rule forbids.
    for p in sorted(SRC.glob("*.md")):
        if not re.search(r"^##+ .*does not prove", p.read_text(encoding="utf-8"), re.I | re.M):
            errs.append(f"insurance/src/{p.name} has no 'What this does not prove' section")

    for item in m["memos"]["items"]:
        if item["state"] == "processed":
            if not (BRIEFS / item["brief"]).exists():
                errs.append(f"memo {item['n']} is marked processed and briefs/{item['brief']} does not exist")
            page = (INS / item["page"]).resolve()
            if not page.exists():
                errs.append(f"memo {item['n']} names reader page {item['page']} and it does not exist")

    # Memo 0 is the pivot briefing that precedes the series; only n >= 1 counts
    # toward the eight, because the hub's counter is a claim and it must be true.
    n_proc = sum(1 for i in m["memos"]["items"] if i["state"] == "processed" and i["n"] >= 1)
    if n_proc > m["memos"]["expected"]:
        errs.append(f"{n_proc} memos of the series processed but the manifest expects only {m['memos']['expected']}")
    ns = [i["n"] for i in m["memos"]["items"]]
    if len(ns) != len(set(ns)):
        errs.append("two memo entries share a number")

    declared_mvps = {x["id"] for x in m["mvps"]}
    actual_mvps = {d.name for d in INS.iterdir() if d.is_dir() and d.name != "src"}
    for x in sorted(declared_mvps - actual_mvps):
        errs.append(f"manifest declares MVP '{x}' and insurance/{x}/ does not exist")
    for d in sorted(actual_mvps - declared_mvps):
        errs.append(f"insurance/{d}/ exists and the manifest does not declare it")

    if not m.get("does_not_prove"):
        errs.append("the manifest has no does_not_prove — the one mandatory field")
    return errs


def page_shell(title, desc, canon, css_depth, body, extra_head=""):
    """Borrow nav/footer from the register, which chrome.py keeps current."""
    reg = (ROOT / "registry" / "index.html").read_text(encoding="utf-8")
    nav = reg[reg.index('<nav class="site">'):reg.index("<main")]
    foot = reg[reg.index('<footer class="site">'):reg.index("</body>")]
    up = "../" * css_depth
    if css_depth != 1:  # the register's chrome is written for depth 1
        nav = nav.replace('href="../', f'href="{up}').replace('src="../', f'src="{up}')
        foot = foot.replace('href="../', f'href="{up}')
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pki.sgit.ai/{canon}">
<meta property="og:url" content="https://pki.sgit.ai/{canon}">
<link rel="stylesheet" href="{up}assets/site.css">
<link rel="stylesheet" href="{up}assets/insurance.css">
{extra_head}</head>
<body>

{nav}
{body}
{foot}
</body>
</html>
"""


def build_hub(m):
    st = m["stage"]

    memo_rows = []
    for i in m["memos"]["items"]:
        proc = i["state"] == "processed"
        memo_rows.append(f"""
    <div class="ins-memo ins-memo--{esc(i['state'])}">
      <div class="ins-memo-n">{i['n'] if i['n'] >= 1 else '&mdash;'}</div>
      <div>
        <b>{esc(i['title'])}</b>{'' if i['n'] >= 1 else ' <span class="dim">— the pivot briefing, which precedes the series of eight</span>'}
        <p>{esc(i['gave'])}</p>
        {'<a href="' + esc(i['page']) + '">the brief, rendered &rarr;</a> <a class="ins-raw" href="../briefs/' + esc(i['brief']) + '">raw</a>'
         if proc else '<span class="dim">not yet recorded</span>'}
      </div>
    </div>""")
    awaited = m["memos"]["expected"] - sum(
        1 for i in m["memos"]["items"] if i["state"] == "processed" and i["n"] >= 1)
    if awaited > 0:
        memo_rows.append(f"""
    <div class="ins-memo ins-memo--awaited">
      <div class="ins-memo-n">&hellip;</div>
      <div><b>{awaited} more awaited</b>
      <p>Listed as awaited rather than guessed at. Each will be filed verbatim as a brief before it is read,
      and the doctrine will say which memo it came from.</p></div>
    </div>""")

    doc_cards = "\n".join(f"""
    <a class="ins-card" href="{esc(d['slug'])}.html">
      <div class="ins-card-top"><b>{esc(d['title'])}</b><span class="dim">from {esc(d['from'])}</span></div>
      <p>{esc(d['one_line'])}</p>
    </a>""" for d in m["doctrine"])

    mvp_block = ("\n".join(f"""
    <a class="ins-card" href="{esc(x['id'])}/index.html">
      <div class="ins-card-top"><b>{esc(x['title'])}</b><span class="dim">{esc(x.get('state',''))}</span></div>
      <p>{esc(x.get('one_line',''))}</p></a>""" for x in m["mvps"])
        if m["mvps"] else
        """<div class="note"><b>None yet, and that is the honest state.</b> The doctrine is two documents old and
        the first MVP waits on one decision: whether a level rates 1&ndash;5, a continuous score, or letter grades
        &mdash; because every surface built on it inherits that choice. The rating engine itself needs nothing
        that is not already published.</div>""")

    dnp = "\n".join(f"<li>{esc(x)}</li>" for x in m["does_not_prove"])

    body = f"""<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / insurance</div>
<h1>Insurance for agents</h1>
<p class="lead">A pivot: the foundation of the risk approach moves from <b>risk acceptance</b> to the
<b>insurance policy</b>, because the delta between what an agent <i>can</i> do and what it is <i>authorised</i>
to do is where the insurance lives. Eight memos are being recorded on it. This is where they are read into
something buildable.</p>

<div class="ins-stage">
  <div class="ins-stage-now">{esc(st['now'])}</div>
  <p>{esc(st['why'])}</p>
  <p class="ins-rule">{esc(st['rule'])}</p>
  {'<p class="ins-settled"><b>Settled:</b> ' + esc(st['settled']) + '</p>' if st.get('settled') else ''}
</div>

<h2 id="stages">Two stages, and only one of them is insurance</h2>
<div class="tablewrap"><table>
  <thead><tr><th></th><th>Stage 1 — the rating</th><th>Stage 2 — the policy</th></tr></thead>
  <tbody>
    <tr><td>Produces</td><td><b>A level, and its derivation</b></td><td>A premium, and a promise to pay</td></tr>
    <tr><td>Risk transferred</td><td><b>None</b></td><td>To a carrier</td></tr>
    <tr><td>Regulated activity</td><td><b>No</b></td><td>Yes — authorisation, capital, conduct rules</td></tr>
    <tr><td>Needs loss history</td><td><b>No</b> — a relative ordering needs no absolute scale</td><td>Yes, and none exists for agents anywhere</td></tr>
    <tr><td>Buildable here</td><td><b>Today</b></td><td>Not by this estate, and not soon</td></tr>
  </tbody>
</table></div>
<p><b>Everything in this folder is stage 1.</b> Calling it insurance would be the first dishonesty: it transfers no
risk and promises no payout. What it does is tell an operator that <i>this</i> placement is several levels worse than
<i>that</i> one, and which single change moves it.</p>

<h2 id="memos">The memos</h2>
<p>Each is filed <b>verbatim as a brief</b> before it is read, because a transcript outranks any summary of it. The
count below is computed from the manifest, never typed.</p>
<div class="ins-memos">{''.join(memo_rows)}</div>

<h2 id="doctrine">The doctrine</h2>
<p>Derived from the memos, naming which memo each part came from. The markdown under
<code>insurance/src/</code> is the source of truth; these pages render it.</p>
<div class="ins-cards">{doc_cards}</div>

<h2 id="mvps">The MVPs</h2>
{mvp_block}

<h2 id="reads">What it consumes</h2>
<p>Nothing here starts from scratch — the rating's inputs are documents this estate already publishes:
the <a href="../packs/grant-and-mandate/library.html">measured grant</a> (the twin),
the <a href="../packs/grant-and-mandate/mandates/current.json">signed mandate</a>,
the <a href="../registry/views/excess-authority.json">delta</a> with its
<code>acceptor: null</code>, the enforcement tier computed in
<a href="../workbench/index.html">the workbench</a>, and the fixture-or-real class read from
<a href="../registry/index.html">the register</a> before any signature.</p>

<h2 id="does-not-prove">What this does not prove</h2>
<ul class="ins-dnp">{dnp}</ul>

<div class="pagenav">
  <a href="../bench/index.html">&larr; The bench</a>
  <a href="{esc(m['doctrine'][0]['slug'])}.html">Start with the doctrine &rarr;</a>
</div>
</main>"""

    return page_shell(
        "Insurance for agents &mdash; the rating, before the money &middot; pki.sgit.ai",
        "A pivot: the foundation moves from risk acceptance to the insurance policy, because the delta between "
        "grant and mandate is where the insurance lives. Stage 1 emits a rating rather than a premium — not a "
        "regulated activity, and buildable today. Eight memos, read into doctrine.",
        "insurance/index.html", 1, body)


def build_doc(d, m):
    body = f"""<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="index.html">insurance</a> / {esc(d['slug'])}</div>
<h1>{esc(d['title'])}</h1>
<p class="lead">{esc(d['one_line'])}</p>

<div class="docmeta">
  <span class="k">Document</span><span class="v">{esc(d['file'].split('__')[0])} of the insurance doctrine</span>
  <span class="k">Derived from</span><span class="v">{esc(d['from'])}</span>
  <span class="k">Status</span><span class="v">Proposed &mdash; GM-D38 to GM-D41 await the project lead</span>
  <span class="k">Source</span><span class="v"><a href="../data/index.html?src=insurance/src/{esc(d['file'])}">rendered &amp; raw</a>
    &middot; <a href="src/{esc(d['file'])}">the markdown</a>, which is the source of truth</span>
</div>

<div class="mdread-label">&#128196; Rendered from <a href="src/{esc(d['file'])}">the markdown</a> &mdash; the file is
the source of truth and this page is presentation.</div>
<div class="mdread" id="mdread" data-src="src/{esc(d['file'])}"><noscript><p class="dim">In-page rendering needs
JavaScript &mdash; <a href="src/{esc(d['file'])}">open the raw markdown</a>.</p></noscript></div>

<div class="pagenav">
  <a href="index.html">&larr; Insurance</a>
  <a href="src/{esc(d['file'])}">The markdown &rarr;</a>
</div>
</main>"""
    return page_shell(
        f"{esc(d['title'])} &middot; pki.sgit.ai",
        esc(d["one_line"]),
        f"insurance/{d['slug']}.html", 1, body,
        extra_head='<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>\n'
                   '<script src="../assets/mdreader.js" defer></script>\n')


def main():
    m = json.loads((INS / "insurance.json").read_text(encoding="utf-8"))
    errs = check(m)
    if errs:
        print(f"gen_insurance: {len(errs)} GATE FAILURE(S):")
        for e in errs:
            print(f"  ✗ {e}")
        sys.exit(1)

    (INS / "index.html").write_text(build_hub(m), encoding="utf-8")
    for d in m["doctrine"]:
        (INS / f"{d['slug']}.html").write_text(build_doc(d, m), encoding="utf-8")

    n_proc = sum(1 for i in m["memos"]["items"] if i["state"] == "processed" and i["n"] >= 1)
    print(f"gen_insurance: hub + {len(m['doctrine'])} doctrine page(s); "
          f"{n_proc} of {m['memos']['expected']} series memos processed "
          f"(+ the pivot briefing), {len(m['mvps'])} MVP(s)")


if __name__ == "__main__":
    main()
