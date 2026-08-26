#!/usr/bin/env python3
"""Generates packs/grant-and-mandate/blocks.html — the building-block gallery.

Run: python3 admin/build/gen_blocks.py, then admin/build/chrome.py

The gallery renders the REAL documents — both library entries and the signed
mandate — rather than mockup data, which is the point of document 09: a block
is a rendering of a field that already exists, so if the schema moves, this
build breaks rather than the integration.

The one rule the generator enforces on the data's behalf: a control whose
defeat path exists in the same tree renders as `setting`, never `boundary`
(GM-D29). Library entry #2 carries a node whose stored tier is `boundary` and
whose next node defeats it; the gallery renders the CORRECTED tier and draws
the defeat path, which is the rule working on real data that is wrong.
"""
import html
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / "packs" / "grant-and-mandate"
LIB = PACK / "library"
TODAY = date(2026, 8, 26)
STALE_DAYS = 30

TIER_GLYPH = {"boundary": "⛨", "setting": "◐", "expectation": "○",
              "none": "—", "unknown": "?"}
EVIDENCE = {"observed", "read", "documented", "inferred", "none"}


def check_schema(entry, name):
    """The build breaks when the data drifts from the vocabulary — which is the
    whole argument for rendering real documents rather than mockups. Caught two
    violations in the hand-assembled entry on first render (GM18)."""
    bad = []
    for n in entry["nodes"]:
        if n.get("tier") not in TIER_GLYPH:
            bad.append(f'{n["id"]}: tier {n.get("tier")!r} is not one of {sorted(TIER_GLYPH)}')
        if n.get("evidence") not in EVIDENCE:
            bad.append(f'{n["id"]}: evidence {n.get("evidence")!r} is not one of {sorted(EVIDENCE)}')
    if bad:
        raise SystemExit(f"gen_blocks: {name} violates the document 02 vocabulary:\n  "
                         + "\n  ".join(bad))


def esc(x):
    return html.escape(str(x if x is not None else ""))


# ── atoms ───────────────────────────────────────────────────────────────────

def tier_badge(tier):
    t = tier if tier in TIER_GLYPH else "unknown"
    return (f'<span class="gm-tier gm-tier--{t}">'
            f'<span class="gm-glyph">{TIER_GLYPH[t]}</span>{esc(t)}</span>')


def defeat_badge(by_id, by_cap):
    return (f'<span class="gm-defeat">defeated by &rarr; <b>{esc(by_id)}</b> '
            f'{esc(by_cap)}</span>')


def ev_badge(ev):
    e = ev or "none"
    return f'<span class="gm-ev gm-ev--{esc(e)}">{esc(e)}</span>'


def date_chip(d):
    if not d:
        return '<span class="gm-date">undated</span>'
    try:
        y, m, dd = (int(x) for x in str(d)[:10].split("-"))
        age = (TODAY - date(y, m, dd)).days
    except Exception:
        age = 0
    cls = " gm-date--stale" if age > STALE_DAYS else ""
    suffix = f" · {age}d" if age > 0 else " · today"
    return f'<span class="gm-date{cls}">checked {esc(str(d)[:10])}{suffix}</span>'


# ── the defeat rule, applied to real data ───────────────────────────────────

def defeated_by(node, nodes):
    """A claimed boundary is defeated when a descendant reachable from it can
    step over it for free. Here: an escalation child with no control of its
    own. Returns the defeating node, or None."""
    if node.get("tier") != "boundary":
        return None
    for n in nodes:
        if n.get("parent") == node["id"] and n.get("tier") == "none" \
           and "escalat" in (n.get("capability", "") or "").lower():
            return n
    return None


def effective_tier(node, nodes):
    d = defeated_by(node, nodes)
    return ("setting", d) if d else (node.get("tier", "unknown"), None)


# ── blocks ──────────────────────────────────────────────────────────────────

def node_card(node, nodes, worst=()):
    tier, d = effective_tier(node, nodes)
    cls = " gm-node--worst" if node["id"] in worst else ""
    mech = node.get("control")
    mech_html = (f'<div class="gm-node__mech">stands in the way: {esc(mech)}</div>'
                 if mech else
                 '<div class="gm-node__mech">stands in the way: <em>nothing</em></div>')
    return f'''<div class="gm-node{cls}">
  <div class="gm-node__head">
    <span class="gm-node__id">{esc(node["id"])}</span>
    <span class="gm-node__cap">{esc(node.get("capability"))}</span>
  </div>
  <div class="gm-node__reaches"><b>reaches:</b> {esc(node.get("reachable"))}</div>
  {mech_html}
  <div class="gm-node__meta">{tier_badge(tier)}{defeat_badge(d["id"], d["capability"]) if d else ""}
    {ev_badge(node.get("evidence"))}{date_chip(node.get("_checked"))}</div>
</div>'''


def tree_block(entry):
    nodes = entry["nodes"]
    worst = set(entry.get("worst_path", []))
    by_parent = {}
    for n in nodes:
        by_parent.setdefault(n.get("parent"), []).append(n)

    def render(parent):
        kids = by_parent.get(parent, [])
        if not kids:
            return ""
        out = ["<ul>"]
        for n in kids:
            tier, d = effective_tier(n, nodes)
            wc = " gm-tree__row--worst" if n["id"] in worst else ""
            out.append(f'<li><div class="gm-tree__row{wc}">'
                       f'<span class="gm-node__id">{esc(n["id"])}</span>'
                       f'<span class="gm-tree__cap">{esc(n.get("capability"))}</span>'
                       f'{tier_badge(tier)}{ev_badge(n.get("evidence"))}</div>')
            if d:
                out.append(f'<span class="gm-tree__esc">&#8627; escalation edge: '
                           f'<b>{esc(d["id"])}</b> {esc(d.get("capability"))} '
                           f'&mdash; goes around this control</span>')
            out.append(render(n["id"]) + "</li>")
        out.append("</ul>")
        return "".join(out)

    return f'<div class="gm-tree">{render(None)}</div>'


def interval_block(m):
    try:
        y, mo, d = (int(x) for x in m["issued_at"][:10].split("-"))
        start = date(y, mo, d)
        y, mo, d = (int(x) for x in m["expires_at"][:10].split("-"))
        end = date(y, mo, d)
        total = max((end - start).days, 1)
        left = (end - TODAY).days
        pct = max(0, min(100, round(100 * left / total)))
        cls = "gm-interval--expired" if left <= 0 else (
            "gm-interval--soon" if left < 30 else "")
        label = f"{left}d left" if left > 0 else "EXPIRED"
    except Exception:
        pct, cls, label = 0, "gm-interval--expired", "unparseable"
    return (f'<span class="gm-interval {cls}"><span class="gm-interval__bar">'
            f'<span class="gm-interval__fill" style="width:{pct}%"></span></span>'
            f'{esc(label)}</span>')


def mandate_card(m):
    prohib = "".join(f"<li>{esc(p)}</li>" for p in m.get("prohibitions", []))
    n_allow = sum(len(r.get("constraints", {}).get("branches", []))
                  for r in m.get("allow", []))
    fixture = "fixture" in (m.get("issuer_note", "") or "").lower()
    split = f'''<div class="gm-split">
  <div class="gm-half gm-half--real">
    <div class="gm-half__k">enforcement</div>
    <div class="gm-half__v">● real</div>
    <div class="gm-half__note">a <code>pre-push</code> hook git runs, refusing by exit
      code &mdash; tier <b>{esc(m.get("enforced_by", {}).get("tier", "?"))}</b>,
      because the hook sits inside the grant it bounds</div>
  </div>
  <div class="gm-half gm-half--{"fixture" if fixture else "real"}">
    <div class="gm-half__k">authority</div>
    <div class="gm-half__v">{"○ fixture" if fixture else "● real"}</div>
    <div class="gm-half__note">{"the issuer's private half is published, so anybody could forge this mandate and the hook would enforce the forgery just as diligently" if fixture else "the issuer holds an unpublished private half"}</div>
  </div>
</div>'''
    return f'''<div class="gm-mandate">
  <div class="gm-mandate__head">
    <span class="gm-mandate__title">Mandate v{esc(m.get("mandate_version"))}</span>
    {interval_block(m)}
  </div>
  <div class="gm-mandate__body">
    <div class="gm-kv">
      <span class="k">Issuer</span><span class="v">{esc(m.get("issuer"))}</span>
      <span class="k">Subject</span><span class="v">{esc(m.get("subject"))}</span>
      <span class="k">Interval</span><span class="v">{esc(m.get("issued_at"))} &rarr; {esc(m.get("expires_at"))}</span>
    </div>
    {split}
    <div class="gm-half__k" style="margin-top:.6rem">What the subject may not do</div>
    <ul class="gm-prohib">{prohib}</ul>
    <div class="gm-stored"><b>The allow-list is stored and is deliberately not shown here.</b>
      It holds {n_allow} branch pattern(s). A person accepts prohibitions; the system
      enforces the allow-list &mdash; showing the allow-list for approval produces
      consent without comprehension.</div>
    <div class="gm-rendered">prohibitions rendered {esc(m.get("prohibitions_rendered_at"))}
      over {esc(m.get("prohibitions_rendered_over"))}</div>
  </div>
</div>'''


def delta_block(m, entry):
    """Recomputed here from the two documents, never stored."""
    import fnmatch
    pats = []
    for r in m.get("allow", []):
        pats += r.get("constraints", {}).get("branches", [])
    n3 = next((n for n in entry["nodes"] if n["id"] == "n3"), None)
    observed = ["claude/registry-mvp-brief-hpbap8", "dev", "main"]
    excess = [b for b in observed
              if not any(fnmatch.fnmatchcase(b, p.replace("**", "*")) for p in pats)]
    tier = n3.get("tier", "unknown") if n3 else "unknown"
    ex_rows = "".join(
        f'<div class="gm-delta__row">push to <code>{esc(b)}</code>{tier_badge(tier)}'
        f'<span class="gm-acceptor">acceptor: none</span></div>' for b in excess) \
        or '<div class="gm-delta__none">none &mdash; the mandate covers everything observed</div>'
    return f'''<div class="gm-delta">
  <div class="gm-delta__col gm-delta__col--excess">
    <div class="gm-delta__head">excess authority &mdash; grant &minus; mandate</div>
    <div class="gm-delta__body">{ex_rows}</div>
  </div>
  <div class="gm-delta__col gm-delta__col--shortfall">
    <div class="gm-delta__head">shortfall &mdash; mandate &minus; grant</div>
    <div class="gm-delta__body"><div class="gm-delta__none">none observed &mdash; the
      mandate asks for nothing the grant lacks</div></div>
  </div>
</div>'''


def three_term(entry):
    """Rendered with a term that does not exist yet, on purpose: no agent has
    filed a structured self-report, so the middle column is `unknown` rather
    than an invented number. The rule is that a gap renders as a gap."""
    n = len(entry["nodes"])
    return f'''<div class="gm-three">
  <div class="gm-term"><div class="gm-term__k">library</div>
    <div class="gm-term__v">{n}</div>
    <div class="gm-term__n">capabilities this environment is known to grant, measured {esc(entry["measured_at"])}</div></div>
  <div class="gm-arrow"><span class="gm-arrow__line">&minus;</span>blind spots</div>
  <div class="gm-term"><div class="gm-term__k">self-report</div>
    <div class="gm-term__v" style="color:var(--dim)">{tier_badge("unknown")}</div>
    <div class="gm-term__n">no agent has filed a structured self-report against this
      entry yet &mdash; rendered as a gap rather than as a number</div></div>
  <div class="gm-arrow"><span class="gm-arrow__line">&minus;</span>excess authority</div>
  <div class="gm-term"><div class="gm-term__k">mandate</div>
    <div class="gm-term__v">1</div>
    <div class="gm-term__n">capability declared, with an issuer and an interval</div></div>
</div>
<div class="gm-headline"><b>The blind-spot count is not computable yet</b>, and that is the
honest rendering: it needs a self-report to subtract. The block shows which term is
missing instead of averaging around it.</div>'''


# ── page ────────────────────────────────────────────────────────────────────

def section(n, title, spec, body, src):
    return f'''
<h2 id="b{n}">{n} &middot; {title}</h2>
<div class="gm-spec">{spec}</div>
{body}
<div class="gm-src">rendered from {src}</div>
'''


def main():
    e1 = json.loads((LIB / "claude-code-remote__ccr-container__2026-08-26.json").read_text())
    e2 = json.loads((LIB / "github-actions-runner__ci__2026-08-26.json").read_text())
    m = json.loads((PACK / "mandates" / "current.json").read_text())
    check_schema(e1, "library entry #1")
    check_schema(e2, "library entry #2")
    for n in e1["nodes"]:
        n["_checked"] = n.get("checked") or e1["measured_at"]
    for n in e2["nodes"]:
        n["_checked"] = n.get("checked") or e2["measured_at"]

    tiers = "".join(tier_badge(t) for t in
                    ["boundary", "setting", "expectation", "none", "unknown"])
    evs = "".join(ev_badge(e) for e in
                  ["observed", "read", "documented", "inferred", "none"])
    dates = date_chip("2026-08-26") + date_chip("2026-06-01")

    n1_e2 = next(n for n in e2["nodes"] if n["id"] == "n1")
    worst_e1 = set(e1.get("worst_path", []))

    body = "".join([
        section(1, "Tier badge", "Five states. <b>Two channels minimum and the word is always one of them</b> — border style carries the second, so the states stay distinct without colour. A control whose defeat path exists in the same tree renders as <b>setting</b>, never boundary.",
                f'<div class="gm-row">{tiers}</div>', "the tier vocabulary in document 01"),
        section(2, "Evidence badge", "How the fact was obtained. <b>The four are not equally trustworthy</b>, so <code>inferred</code> and <code>none</code> get a visibly weaker treatment rather than sitting flat beside <code>observed</code>.",
                f'<div class="gm-row">{evs}</div>', "the evidence classes in document 02"),
        section(3, "Freshness chip", "Dated <b>per node, never per tree</b> — a tree dated as a whole is wrong in one place while looking current. Staleness is a fact about the <em>measurement</em>, so it never turns the tier red.",
                f'<div class="gm-row">{dates}</div>', "per-node dates; stale after 30 days"),
        section(4, "Grant node card",
                "One node of a measured tree. The <b>reaches</b> line does the work: a list of what is reachable without what stands in the way is the part people already have and the part that misleads. The second card below is the rule from block 1 <b>working on real data that is wrong</b> — the stored document says <code>boundary</code>, the next node defeats it, and the block renders the corrected tier with the defeat path attached.",
                node_card(next(n for n in e1["nodes"] if n["id"] == "n3"), e1["nodes"], worst_e1)
                + node_card(n1_e2, e2["nodes"]),
                "library entry #1 node n3, and entry #2 node n1 (stored tier: "
                f"<code>{esc(n1_e2.get('tier'))}</code>, corrected on render)"),
        section(5, "Mandate card + 6 · authority/enforcement split",
                "Prohibitions are shown; <b>the allow-list is stored and not displayed</b> — screen four's trap. The interval renders as time remaining, not only as a date. And the mandate carries <b>two</b> indicators, never one: the enforcement is real and the authority is a fixture, and averaging them is how a demonstration gets mistaken for a control.",
                mandate_card(m), "the signed mandate at mandates/current.json"),
        section(7, "Delta block",
                "Excess and shortfall <b>side by side, never stacked</b> — different audiences, different remedies. Each excess row carries the tier of the capability it names. <b>No score</b>: a single number would average tiers that must stay distinct. Recomputed on render, never stored.",
                delta_block(m, e1), "the mandate and library entry #1, differenced at build time"),
        section(8, "Three-term comparison",
                "Library, self-report, mandate &mdash; two deltas between them. Rendered here with <b>a term that does not exist yet</b>, deliberately: no agent has filed a structured self-report, so the middle column is a gap rather than an invented number.",
                three_term(e1), "library entry #1 and the signed mandate"),
        section(9, "Grant tree",
                "The nodes as a <b>graph, not a list</b>, because blast radius is a path. Two things the list form cannot do: the <b>worst path is highlighted</b> rather than left to be traced, and <b>escalation edges are drawn</b> rather than annotated &mdash; drawing the path around a control is what makes the setting tier land.",
                tree_block(e1)
                + '<p class="gm-src" style="margin-top:.8rem">And the same block over entry #2, where the escalation edge is the finding:</p>'
                + tree_block(e2),
                "both library entries, in full"),
    ])

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The building blocks: badges, cards and visualisations, rendered from real documents · pki.sgit.ai</title>
<meta name="description" content="The Grant and Mandate building blocks — tier and evidence badges, grant node cards, the mandate card with its authority/enforcement split, the delta block, the three-term comparison and the grant tree — rendered from the actual measured library entries and the signed mandate rather than from mockup data.">
<link rel="canonical" href="https://pki.sgit.ai/packs/grant-and-mandate/blocks.html">
<meta property="og:url" content="https://pki.sgit.ai/packs/grant-and-mandate/blocks.html">
<link rel="stylesheet" href="../../assets/site.css">
<link rel="stylesheet" href="../../assets/gm-blocks.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="doc">
<div class="crumb"><a href="../../index.html">pki.sgit.ai</a> / <a href="../index.html">packs</a> / <a href="index.html">grant-and-mandate</a> / blocks</div>
<h1>The building blocks, rendered from real documents</h1>
<p class="lead">The nine primitives specified in <a href="building-blocks.html">document 09</a>, built as a stylesheet
(<a href="../../assets/gm-blocks.css"><code>assets/gm-blocks.css</code></a>) and rendered here from
<b>the actual documents</b> — both <a href="library.html">measured library entries</a> and the
<a href="mandates/current.json">signed mandate</a> — rather than from mockup data. A block is a rendering of a field
that already exists; if the schema moves, this page breaks at build time rather than at integration.</p>

<div class="gm-fixture"><div><b>Read this before any badge below.</b> Every signature behind this data is a
<b>fixture</b>: the private halves are published, so they verify and prove nothing. The blocks render the data
honestly; the data itself is a demonstration. That is why block 6 exists — the enforcement is real and the
authority is not, and the two are shown separately rather than averaged.</div></div>
{body}
<h2 id="using">Using them</h2>
<p>Link the stylesheet and use the classes; nothing here needs JavaScript, a framework, or a build step.
The intended second consumer is the risk product, which holds the instance while this site holds the library —
so the blocks are deliberately free of anything personal: they render a <em>library entry</em> and a
<em>mandate</em>, and neither carries anything about a person.</p>
<div class="gm-spec"><b>What has not happened:</b> these blocks have been exercised against
<b>two environments and one mandate</b>, all measured by one agent. They are specified for a population they
have not met, and the honest limits are in <a href="building-blocks.html#tensions">document 09</a>.</div>

<div class="pagenav">
  <a href="building-blocks.html">← 09 — The building blocks</a>
  <a href="index.html">Pack hub →</a>
</div>
</main>

<footer class="site"></footer>

</body>
</html>
'''
    out = PACK / "blocks.html"
    out.write_text(page)
    print(f"gen_blocks: wrote {out.relative_to(ROOT)} "
          f"({len(e1['nodes'])}+{len(e2['nodes'])} nodes, mandate v{m.get('mandate_version')})")


if __name__ == "__main__":
    main()
