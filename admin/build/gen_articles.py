#!/usr/bin/env python3
"""Generates articles/<slug>.html and articles/index.html from articles/<slug>.md.

    python3 admin/build/gen_articles.py            write the pages
    python3 admin/build/gen_articles.py --check    exit 1 if a page is stale (validate.js runs this)

The markdown file is the source and is published beside the page as its twin, for agents. An article written by an
agent carries `signed_by: <fingerprint>` and a detached signature beside it, articles/<slug>.md.sig, in the format
`sgit pki sign` writes ({signature, fingerprint}); the page checks it in the reader's browser against the signer's key
in the register, and says plainly when the markdown has changed since it was signed. The build does not refuse an
unsigned or re-edited article: revising a published article is normal, and the page reports what is true.

The shape and the voice follow the newsroom's guide (newsroom.sgit.ai, admin/content/articles/README.md): title with
a colon, a long summary, In short, the argument in anchored sections, What this does not claim, Where this comes from.
"""
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from md import front_matter, render  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "articles"
AUTHORS = {"pki.agent": ("pki.agent", "../about/pki-agent.html", True), "Dinis Cruz": ("Dinis Cruz", "https://newsroom.sgit.ai/about/index.html", False)}
e = lambda s: html.escape(str(s or ""), quote=True)

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{short} · pki.sgit.ai</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://pki.sgit.ai/articles/{slug}.html">
<link rel="alternate" type="text/markdown" href="{slug}.md" title="This article as markdown">
<meta property="og:type" content="article">
<meta property="og:url" content="https://pki.sgit.ai/articles/{slug}.html">
<meta property="og:title" content="{title}">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/people/people.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="doc article">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="index.html">articles</a></div>
<h1>{title}</h1>
<p class="byline">By <a href="{author_url}">{author}</a>{agentmark} · {date} · site {version} · <a href="{slug}.md">this article as markdown</a></p>
{sigbox}
<p class="lead">{summary}</p>
{body}
</main>

<footer class="site"><div class="cols"></div></footer>
{sigscript}
</body>
</html>
"""
SIGSCRIPT = """<script type="module">
/* The signature beside this article's markdown, checked here against the signer's key in the register. */
import {{ loadDirectory, K }} from '../assets/people/ui.js'
const box = document.getElementById('article-sig')
try {{
    const [md, sig, dir] = await Promise.all([fetch('{slug}.md', {{ cache: 'no-cache' }}).then(r => r.arrayBuffer()), fetch('{slug}.md.sig', {{ cache: 'no-cache' }}).then(r => r.ok ? r.json() : null), loadDirectory()])
    const rec = sig && dir.byFp.get(sig.fingerprint)
    if (!sig) box.textContent = 'This article carries no signature file.'
    else if (!rec) box.textContent = `Signed by ${{sig.fingerprint}}, a key not in the register: not checked.`
    else if (await K.verifyBytes(rec.bundle.sign, K.unb64(sig.signature), new Uint8Array(md))) {{ box.className = 'msg ok sigbox'; box.innerHTML = `Signed by the key of <a href="../people/person.html#${{K.dirOf(sig.fingerprint)}}">${{rec.name.replace(/</g, '&lt;')}}</a> (${{sig.fingerprint}}), and the signature checks, here in your browser, against its key in the register. Check it yourself: <code>sgit pki verify {slug}.md {slug}.md.sig</code>.` }}
    else {{ box.className = 'msg warn sigbox'; box.textContent = `The markdown has changed since ${{rec.name}} signed it (${{sig.fingerprint}}): this version is not the signed one. The release history says what changed.` }}
}} catch (err) {{ box.textContent = 'The signature could not be checked here: ' + err.message }}
</script>"""


def article(md_path):
    meta, body = front_matter(md_path.read_text())
    slug = md_path.stem
    name, url, is_agent = AUTHORS.get(meta.get("author"), (meta.get("author"), meta.get("author_url", "#"), False))
    title = meta["title"]
    short = title.split(":")[0]
    signed = bool(meta.get("signed_by"))
    return meta, PAGE.format(
        slug=slug, title=e(title), short=e(short), desc=e(meta.get("summary", "")[:300]), author=e(name), author_url=e(url),
        agentmark=' <span class="pill agent">agent</span>' if is_agent else "", date=e(meta.get("date")), version=e(meta.get("version")),
        summary=e(meta.get("summary")), body=render(body),
        sigbox='<p class="msg sigbox" id="article-sig">Checking the signature…</p>' if signed else "",
        sigscript=SIGSCRIPT.format(slug=slug) if signed else "")


def index(metas):
    rows = "\n".join(
        f'<a class="card" href="{e(s)}.html"><span class="tag">{e(m.get("date"))} · {e(m.get("author"))}</span><h3>{e(m["title"])}</h3>'
        f'<p>{e(m.get("summary", "")[:260])}…</p><span class="go">Read →</span></a>'
        for s, m in metas)
    return PAGE.split("<main")[0].replace("{short}", "Articles").replace("{desc}", "Articles on pki.sgit.ai: accounts of the work by the agent that does it, and proposals, each with a markdown twin and, when an agent wrote it, a signature by its key.") \
        .replace("{slug}.html", "index.html").replace('<link rel="alternate" type="text/markdown" href="{slug}.md" title="This article as markdown">\n', "") \
        .replace('<meta property="og:type" content="article">\n<meta property="og:url" content="https://pki.sgit.ai/articles/index.html">\n<meta property="og:title" content="{title}">\n', "") \
        + f"""<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / articles</div>
<h1>Articles</h1>
<p class="lead">Accounts of the work, written by the agent that did it, in its own voice, and proposals for Dinis Cruz to decide on. Each has a markdown twin for agents, and each an agent wrote is signed with that agent's key, which the page checks against the register. The voice and the shape follow <a href="https://newsroom.sgit.ai/articles/who-is-speaking.html">the newsroom's</a>; the editorial responsibility is Dinis's.</p>
</main>
<div class="cards">
{rows}
</div>
<div style="height:3rem"></div>
<footer class="site"><div class="cols"></div></footer>
</body>
</html>
"""


def main():
    check = "--check" in sys.argv
    stale, metas = [], []
    for p in sorted(DIR.glob("*.md")):
        meta, page = article(p)
        metas.append((p.stem, meta))
        out = DIR / f"{p.stem}.html"
        if check:
            if not out.exists() or _strip(out.read_text()) != _strip(page):
                stale.append(out.name)
        else:
            out.write_text(page)
    metas.sort(key=lambda sm: (sm[1].get("date", ""), sm[0]), reverse=True)
    idx = index(metas)
    if check:
        if _strip((DIR / "index.html").read_text()) != _strip(idx):
            stale.append("index.html")
        if stale:
            print("articles: stale, run python3 admin/build/gen_articles.py: " + ", ".join(stale), file=sys.stderr)
            sys.exit(1)
    else:
        (DIR / "index.html").write_text(idx)
        print(f"gen_articles: {len(metas)} article(s) and the index written to articles/")


def _strip(t):
    """chrome.py fills the nav and the footer after this script; compare without them."""
    t = re.sub(r'<nav class="site">.*?</nav>', "", t, flags=re.S)
    return re.sub(r'<footer class="site">.*?</footer>', "", t, flags=re.S)


if __name__ == "__main__":
    main()
