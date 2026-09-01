#!/usr/bin/env python3
"""gen_partner.py — the partner-artefacts folder, from its manifest.

Artefacts produced by the RiskMandate business partner and captured verbatim.
NOTHING IN THIS FOLDER IS THIS ESTATE'S WORK, and the pages say so before they
say anything else — because a third party's marketing rendered inside this
estate's chrome is exactly the apparent-authority problem the corpus exists to
make visible.

The gates are symmetric, as everywhere here:

  * a published artefact declared with no file under src/
  * a src/ artefact that nothing declares
  * a commentary document declared with no file, or a file nothing declares
  * a recorded sha256 that no longer matches the bytes on disk
  * a commentary document with no `does not prove` section

The checksum gate is the one specific to this folder. These are somebody
else's documents: if a byte changes, either the partner sent a new version
and the manifest must say so, or this estate edited an artefact it does not
own. Both need a human, so both stop the build.
"""
import html
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTNER = ROOT / "partner"
SRC = PARTNER / "src"

esc = lambda s: html.escape(str(s), quote=True)


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def check(m):
    errs = []
    declared_files = set()

    for a in m["published"]:
        f = SRC / a["file"]
        declared_files.add(a["file"])
        if a.get("text"):
            declared_files.add(a["text"])
        if not f.exists():
            errs.append(f"published artefact '{a['id']}' declares {a['file']} and it does not exist")
            continue
        # These are somebody else's bytes. If they changed, a human decides why.
        actual = sha256(f)
        if actual != a["sha256"]:
            errs.append(
                f"partner/src/{a['file']} no longer matches its recorded sha256 "
                f"(manifest {a['sha256'][:16]}, on disk {actual[:16]}) — either the partner sent a new "
                f"version and the manifest must say so, or this estate edited an artefact it does not own"
            )
        if a.get("bytes") and f.stat().st_size != a["bytes"]:
            errs.append(f"partner/src/{a['file']} is {f.stat().st_size} bytes, manifest says {a['bytes']}")
        if a.get("text") and not (SRC / a["text"]).exists():
            errs.append(f"published artefact '{a['id']}' declares text extraction {a['text']} and it does not exist")

    for c in m["commentary"]:
        declared_files.add(c["file"])
        p = SRC / c["file"]
        if not p.exists():
            errs.append(f"commentary {c['file']} is declared and does not exist")
            continue
        if not re.search(r"^##+ .*does not prove", p.read_text(encoding="utf-8"), re.I | re.M):
            errs.append(f"partner/src/{c['file']} has no 'What this does not prove' section")

    for p in sorted(SRC.iterdir()):
        if p.is_file() and p.name not in declared_files:
            errs.append(f"partner/src/{p.name} exists and the manifest does not declare it")

    # A held artefact must stay held: if somebody drops the PDF in, the build stops
    # rather than quietly publishing another company's internal strategy.
    for h in m["held"]:
        for stray in SRC.glob(f"*{h['id']}*"):
            errs.append(
                f"partner/src/{stray.name} looks like the HELD artefact '{h['id']}'. "
                f"This site serves every file in the repo: publishing it needs the project lead's "
                f"word and a manifest move from held to published, not a file copy"
            )
    return errs


def page_shell(title, desc, canon, body, extra_head=""):
    reg = (ROOT / "registry" / "index.html").read_text(encoding="utf-8")
    nav = reg[reg.index('<nav class="site">'):reg.index("<main")]
    foot = reg[reg.index('<footer class="site">'):reg.index("</body>")]
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pki.sgit.ai/{canon}">
<meta property="og:url" content="https://pki.sgit.ai/{canon}">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/insurance.css">
{extra_head}</head>
<body>

{nav}
{body}
{foot}
</body>
</html>
"""


BANNER = """<div class="notprov">
  <p><b>Not this estate's work.</b> Everything in this folder was produced by the
  <b>RiskMandate business partner</b> and is reproduced as received. The market claims
  inside these artefacts are a third party's assertions at evidence class
  <code>documented</code> &mdash; <b>this estate has verified none of them</b>.
  See <a href="provenance.html">provenance</a>.</p>
</div>"""


def build_hub(m):
    r = m["received"]
    pub = "\n".join(
        f"""    <tr>
      <td><a href="{esc(a['page'])}.html"><b>{esc(a['title'])}</b></a></td>
      <td>{esc(a['kind'].upper())}{(' &middot; ' + str(a['pages']) + 'pp') if a.get('pages') else ''}</td>
      <td>{esc(a['audience'])}</td>
      <td><code>{esc(a['sha256'][:16])}</code></td>
    </tr>""" for a in m["published"])

    held = "\n".join(
        f"""    <tr>
      <td><b>{esc(h['title'])}</b></td>
      <td>{h['pages']}pp</td>
      <td>{esc(h['why'])}</td>
    </tr>""" for h in m["held"])

    dnp = "\n".join(f"  <li>{esc(x)}</li>" for x in m["does_not_prove"])
    comm = "\n".join(
        f'    <li><a href="{esc(c["slug"])}.html"><b>{esc(c["title"])}</b></a></li>'
        for c in m["commentary"])

    body = f"""<main>
<h1>Partner artefacts</h1>
<p class="lede">Four documents produced by the RiskMandate business partner on
{esc(r['date'])}, captured here verbatim.</p>

{BANNER}

<p>{esc(r['context'])}</p>

<h2>Captured and published</h2>
<div class="tablewrap"><table>
  <thead><tr><th>Artefact</th><th>Form</th><th>Audience</th><th>sha256</th></tr></thead>
  <tbody>
{pub}
  </tbody>
</table></div>

<h2>Captured and held</h2>
<p><b>This site is public and serves every file in the repository, linked or not</b>
&mdash; so committing these would publish them, and git history would keep them after
any deletion. Publishing another company's internal strategy, naming their customer,
is the project lead's decision and their partner's, not this estate's.
<b>Both are staged and can be added in one commit.</b></p>
<div class="tablewrap"><table>
  <thead><tr><th>Artefact</th><th>Pages</th><th>Why it is held</th></tr></thead>
  <tbody>
{held}
  </tbody>
</table></div>
<p>Their doctrinally relevant substance is carried in the
<a href="concordance.html">concordance</a>, with customer names, target lists and
competitive characterisations deliberately omitted.</p>

<h2>This estate's commentary, labelled as such</h2>
<ul>
{comm}
</ul>

<h2>What this folder does not prove</h2>
<ul>
{dnp}
</ul>

<div class="pagenav">
  <a href="../insurance/index.html">&larr; The insurance folder</a>
  <a href="concordance.html">The concordance &rarr;</a>
</div>
</main>"""
    return page_shell("Partner artefacts &middot; pki.sgit.ai",
                      "Artefacts produced by the RiskMandate business partner, captured verbatim. "
                      "Not this estate's work, and verified by nobody here.",
                      "partner/index.html", body)


def build_commentary(c):
    body = f"""<main>
<div class="mdreader" data-src="src/{esc(c['file'])}">
<noscript><p>This page renders <a href="src/{esc(c['file'])}">src/{esc(c['file'])}</a>
with JavaScript &mdash; <a href="src/{esc(c['file'])}">open the raw markdown</a>.</p></noscript></div>

<div class="pagenav">
  <a href="index.html">&larr; Partner artefacts</a>
  <a href="src/{esc(c['file'])}">The markdown &rarr;</a>
</div>
</main>"""
    return page_shell(f"{esc(c['title'])} &middot; pki.sgit.ai",
                      esc(c["title"]),
                      f"partner/{c['slug']}.html", body,
                      extra_head='<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>\n'
                                 '<script src="../assets/mdreader.js" defer></script>\n')


def build_landing_view(a):
    """The partner's page, shown whole and framed as theirs.

    It is rendered in a sandboxed iframe rather than inlined, so that a third
    party's marketing can never be mistaken for a page of this site — and so
    that nothing this estate does can alter their bytes.
    """
    body = f"""<main>
<h1>{esc(a['title'])}</h1>
<p class="lede">The partner's public landing page, reproduced byte-for-byte.</p>

{BANNER}

<p><b>{a['bytes']:,} bytes</b> &middot; <code>sha256 {esc(a['sha256'])}</code> &middot;
<a href="src/{esc(a['file'])}">open the raw file</a>. The build refuses to run if
a single byte of it changes.</p>

<p>It is shown below in a sandboxed frame so that a third party's page is never
mistaken for a page of this site, and so that nothing here can alter their markup.</p>

<iframe src="src/{esc(a['file'])}" title="{esc(a['title'])} (the partner's page, sandboxed)"
        loading="lazy" sandbox="allow-scripts"
        style="width:100%;height:78vh;border:1px solid var(--rule,#d8dbe1);border-radius:8px;background:#fff"></iframe>

<div class="pagenav">
  <a href="index.html">&larr; Partner artefacts</a>
  <a href="src/{esc(a['file'])}">The raw HTML &rarr;</a>
</div>
</main>"""
    return page_shell(f"{esc(a['title'])} &middot; pki.sgit.ai",
                      "The RiskMandate partner's public landing page, captured verbatim.",
                      f"partner/{a['page']}.html", body)


def build_deck_view(a):
    body = f"""<main>
<h1>{esc(a['title'])}</h1>
<p class="lede">{a['pages']} slides, reproduced as received.</p>

{BANNER}

<p><b>{a['bytes']:,} bytes</b> &middot; <code>sha256 {esc(a['sha256'])}</code> &middot;
<a href="src/{esc(a['file'])}">download the PDF</a>. The build refuses to run if a
single byte of it changes.</p>

<p>Below is a <b>machine text extraction</b> of the PDF, produced with <code>pypdf</code>
and unedited. It exists so the deck is searchable and quotable.
<b>Where the extraction and the PDF differ, the PDF wins.</b></p>

<div class="mdreader" data-src="src/{esc(a['text'])}">
<noscript><p>This page renders <a href="src/{esc(a['text'])}">src/{esc(a['text'])}</a>
with JavaScript &mdash; <a href="src/{esc(a['file'])}">or open the PDF</a>.</p></noscript></div>

<div class="pagenav">
  <a href="index.html">&larr; Partner artefacts</a>
  <a href="src/{esc(a['file'])}">The PDF &rarr;</a>
</div>
</main>"""
    return page_shell(f"{esc(a['title'])} &middot; pki.sgit.ai",
                      "The RiskMandate partner's design partner deck, captured verbatim.",
                      f"partner/{a['page']}.html", body,
                      extra_head='<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>\n'
                                 '<script src="../assets/mdreader.js" defer></script>\n')


def main():
    m = json.loads((PARTNER / "partner.json").read_text(encoding="utf-8"))
    errs = check(m)
    if errs:
        print(f"gen_partner: {len(errs)} GATE FAILURE(S):", file=sys.stderr)
        for e in errs:
            print(f"  ✗ {e}", file=sys.stderr)
        sys.exit(1)

    (PARTNER / "index.html").write_text(build_hub(m), encoding="utf-8")
    n = 1
    for c in m["commentary"]:
        (PARTNER / f"{c['slug']}.html").write_text(build_commentary(c), encoding="utf-8")
        n += 1
    for a in m["published"]:
        html_out = build_landing_view(a) if a["kind"] == "html" else build_deck_view(a)
        (PARTNER / f"{a['page']}.html").write_text(html_out, encoding="utf-8")
        n += 1
    print(f"gen_partner: {n} page(s); {len(m['published'])} artefact(s) published, "
          f"{len(m['held'])} held, checksums verified")


if __name__ == "__main__":
    main()
