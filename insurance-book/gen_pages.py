#!/usr/bin/env python3
"""gen_pages.py — the insurance book's HTML: an index, and one page per chapter.

Each chapter page renders ITS OWN markdown file, so a page cannot describe a
chapter it did not render. The markdown is the source of truth; these pages are
presentation, and every one of them links to the raw file it rendered.

Nav, head and footer are lifted from an existing site page so the book does not
carry a second copy of the site chrome that could drift out of date.
"""
import json, re, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parents[1]
BOOK = ROOT / "insurance-book"
TPL = (ROOT / "book" / "index.html").read_text(encoding="utf-8")

nav = TPL[TPL.index('<nav class="site">'):TPL.index('<main class="doc">')]
footer = TPL[TPL.index('<footer class="site">'):TPL.index("</body>")]
# the lifted slice carries the template page's own reader scripts; strip them,
# because page() appends exactly one pair of its own — the validator caught
# them tripling
footer = footer.split("<script")[0]

book = json.loads((BOOK / "book.json").read_text())
shots = json.loads((BOOK / "shots" / "shots.json").read_text())
chapters = book["chapters"]

PDF = "the-delta-is-where-the-insurance-lives.pdf"


def slug(c):
    return re.sub(r"\.md$", "", c["file"].split("/")[-1]).replace("__", "-")


def page(title, desc, canonical, crumb, body, extra_head=""):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)} &middot; pki.sgit.ai</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="https://pki.sgit.ai/insurance-book/{canonical}">
<meta property="og:url" content="https://pki.sgit.ai/insurance-book/{canonical}">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/bench.css">
<link rel="stylesheet" href="book.css">
{extra_head}</head>
<body>

{nav}<main class="doc">
<div class="crumb">{crumb}</div>
{body}
</main>

{footer}
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="../assets/mdreader.js"></script>
</body>
</html>
"""


# ── one page per chapter ────────────────────────────────────────────────────
order = [c for c in chapters]
for i, c in enumerate(order):
    s = slug(c)
    prev_c, next_c = (order[i - 1] if i else None), (order[i + 1] if i + 1 < len(order) else None)
    nav_links = []
    if prev_c:
        nav_links.append(f'<a class="bk-prev" href="{slug(prev_c)}.html">&larr; {html.escape(prev_c["title"])}</a>')
    if next_c:
        nav_links.append(f'<a class="bk-next" href="{slug(next_c)}.html">{html.escape(next_c["title"])} &rarr;</a>')

    body = f"""<div class="bk-part">{html.escape(c["part"])}</div>
<div class="mdread-label">&#128214; <b>The Delta Is Where the Insurance Lives</b> &middot; {html.escape(c["title"])}
&middot; {c["words"]:,} words &middot; rendered from <a href="{c["file"]}">{html.escape(c["file"])}</a>
(the source of truth) &middot; <code>sha256:{c["sha256"][:16]}&hellip;</code></div>
<div class="mdread" id="mdread" data-src="{c["file"]}"><noscript><p class="dim">In-page
rendering needs JavaScript &mdash; <a href="{c["file"]}">open the raw markdown</a>.</p></noscript></div>

<div class="bk-honesty">
  <b>Carried from the front matter, because a chapter quoted in isolation must still carry it:</b>
  nothing here is insurance &mdash; stage 1 emits a rating, transfers no risk and promises no
  payout; nothing here is built, and no external evidence has been gathered; the register the
  rating would read is fixtures; and a level is never declared, only derived.
  <a href="00-front-matter.html">The full positions &rarr;</a>
</div>

<nav class="bk-nav">{"".join(nav_links)}<a class="bk-toc" href="index.html">Contents</a></nav>"""

    (BOOK / f"{s}.html").write_text(page(
        f"{c['title']} — The Delta Is Where the Insurance Lives",
        f"{c['title']}. {book['about'][:150]}",
        f"{s}.html",
        f'<a href="../index.html">pki.sgit.ai</a> / <a href="index.html">insurance-book</a> / {html.escape(c["number"])}',
        body), encoding="utf-8")

# ── the index ───────────────────────────────────────────────────────────────
rows, seen_part = [], None
for c in order:
    if c["part"] != seen_part:
        seen_part = c["part"]
        rows.append(f'<div class="bk-partrow">{html.escape(seen_part)}</div>')
    rows.append(
        f'<a class="bk-row" href="{slug(c)}.html">'
        f'<span class="bk-num">{html.escape(c["number"])}</span>'
        f'<span class="bk-title">{html.escape(c["title"])}</span>'
        f'<span class="bk-words">{c["words"]:,}w</span></a>')

figrows = "".join(
    f'<tr><td><code>{html.escape(f["id"])}</code></td>'
    f'<td><code>{html.escape(f["tag"])}</code></td>'
    f'<td>{"re-derivable" if f["gate"] != "fresh" else "fresh"}</td>'
    f'<td>{html.escape(f["caption"])}</td></tr>'
    for f in shots["figures"])

idx_body = f"""<h1>The Delta Is Where the Insurance Lives</h1>
<p class="lead">Rating agents without money, and the empty seat a policy fills. {html.escape(book["about"])}</p>

<div class="bk-meta">
  <span><b>{book["counts"]["chapters"]}</b> chapters in five parts</span>
  <span><b>{book["counts"]["words_chapters"]:,}</b> words</span>
  <span><b>{book["counts"]["figures"]}</b> figures, each taken at the tag its caption names</span>
  <span><b>{book["provenance"]["stated_quotations"]}</b> verified quotations</span>
  <span><b>{book["provenance"]["drawn_claims"]}</b> claims drawn by the writer</span>
</div>

<div class="bk-downloads">
  <a class="bk-dl" href="{PDF}"><b>&#128196; The PDF</b>
    <span>Reads start to finish offline, with no link followed</span></a>
  <a class="bk-dl" href="18-reference-card.html"><b>&#127183; The reference card</b>
    <span>One page, written to be pasted into an agent session</span></a>
  <a class="bk-dl" href="llms.txt"><b>&#129302; llms.txt</b>
    <span>The book's front door, carrying the positions a summary must not drop</span></a>
  <a class="bk-dl" href="book.json"><b>&#123;&#125; book.json</b>
    <span>Every chapter with the SHA-256 of its markdown; every figure with its digest</span></a>
</div>

<div class="bk-honesty bk-honesty--big">
<b>Before anything else.</b> Nothing this book describes <b>is insurance</b> &mdash; stage 1
emits a rating, transfers no risk, and promises no payout, which is exactly why it can be
built. <b>Nothing this book describes is built</b>: ten memos are read into doctrine, and the
two specified MVPs remain specifications. <b>No external evidence has been gathered</b> &mdash;
the market survey that could prove any of this wrong has not been run. The register the rating
would read is <b>fixtures</b>, with private keys published on purpose. A reader who finishes
believing an agent can be insured today has read a book that failed.
<a href="00-front-matter.html">The front matter states all eight positions &rarr;</a>
</div>

<h2 id="contents">Contents</h2>
<div class="bk-toclist">{"".join(rows)}</div>

<h2 id="provenance">What the memos state, and what this book concluded</h2>
<p>Every load-bearing claim about what the memos or the estate <i>mean</i> is marked, and the
marking is a sentence rather than a sigil. <b>{book["provenance"]["stated_quotations"]} passages
are quoted verbatim</b> &mdash; from the memo transcripts filed as briefs, the doctrine, and the
estate's own artefacts &mdash; each with a source that is <i>discovered rather than asserted</i>
and <b>re-read out of that source on every build</b>: a quote not found where it claims to be
fails the build. <b>{book["provenance"]["drawn_claims"]} claims are the writing session's own
reasoning</b>, shown in the reader's view rather than in a note.
<b>Do not treat the drawn claims as the project lead's positions.</b>
Every quotation and its source: <a href="quotes.json">quotes.json</a>.</p>

<h2 id="figures">The figures, and the two gates</h2>
<p>Every figure was taken from the version its caption names: a <code>git worktree</code> at the
tag, a one-shot server on a port used once and never again, a headless browser killed in a block
that runs whether the capture succeeded or failed. Each carries the page, the tag, and the
SHA-256 of that page's bytes at that tag. A figure of a <b>past</b> version is
<b>re-derivable</b> &mdash; re-running the harness at that tag reproduces the digest. A figure of
the site <b>as it stands</b> is <b>fresh</b> &mdash; the digest must match the live page, and
<b>the build fails when it stops matching</b>, which it will on the next release. That is
correct and it is inconvenient.</p>
<div class="tablewrap"><table>
<tr><th>Figure</th><th>Tag</th><th>Gate</th><th>What to notice</th></tr>
{figrows}
</table></div>
<p class="dim">The harness is published with the book so any figure can be re-taken rather than
believed: <a href="shots/travel.sh">travel.sh</a>, <a href="shots/shot.mjs">shot.mjs</a>,
<a href="shots/transcripts.sh">transcripts.sh</a>, <a href="shots/shots.json">shots.json</a>.
Gates: <code>python3 insurance-book/build.py --check</code>.</p>

<h2 id="brief">The commission</h2>
<p>This book was commissioned in one sentence and the sentence is preserved:
<a href="BRIEF.md">BRIEF.md</a> records the instruction verbatim, what it inherits from the
first volume's method, and which decisions are the writing session's own &mdash; so they can be
argued with rather than mistaken for the project lead's.</p>"""

(BOOK / "index.html").write_text(page(
    "The Delta Is Where the Insurance Lives — the insurance book",
    "Rating agents without money, and the empty seat a policy fills. " + book["about"],
    "index.html",
    '<a href="../index.html">pki.sgit.ai</a> / insurance-book',
    idx_body), encoding="utf-8")

print(f"pages: index.html + {len(order)} chapter pages")
