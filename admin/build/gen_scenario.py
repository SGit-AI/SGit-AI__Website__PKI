#!/usr/bin/env python3
"""gen_scenario.py — the scenario engine: one engine, many worlds.

A scenario is a JSON file; this renders it; nothing scenario-specific lives
here. The claim is proven by building every experiments/*/scenario.json in one
run — two worlds today, from one engine.

A scenario REFERENCES a twin (a measured library entry) and the engine reads
the capabilities out of the twin at build time. The scenario may only DECORATE
nodes (an animation kind, a caption) — it may not add, remove or restate one.

Gates (each fails the build):
  twin        the referenced twin must exist; cards == twin nodes, exactly
  decor       every decor key must name a twin node; every anim must be a
              kind the engine implements
  slots       every mandate slot must derive from a real file — the context
              slot quotes the twin by byte, the hook slot reads the signed
              mandate, the platform slot must AGREE WITH THE DOORS VIEW
  story       every beat's citation must exist on disk
  rungs       a capability's confidence rung is computed from its evidence
              class and origin, never typed

Specified in brief v0.33.68. Genre: game grammar, this estate's sentences.
"""
import json, os, sys, glob, html, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
esc = lambda s: html.escape(str(s), quote=True)

ANIMS = {"push", "act-as", "edit", "egress", "recall", "escalate", "blocked", "unknown"}


def J(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def rung_of(node):
    """The memo's gradient, computed: none->0 (hypothesis), self-observed->1
    (floor), +documented->2, any independent origin->3. Both twins are
    self-measured, so nothing here can exceed 2 — and the deck says so."""
    ev = str(node.get("evidence", "none")).lower()
    if ev in ("none", "unevidenced"):
        return 0, "hypothesis — no evidence"
    r, why = 1, f"{ev}, by the measurer (instrument is subject)"
    if "document" in ev or "corroborat" in str(node.get("method", "")).lower():
        r, why = 2, ev + " + documentation"
    return r, why


def anim_svg(kind):
    """Eight verbs of the threat model, watchable. CSS drives the motion;
    prefers-reduced-motion freezes every one of these to its end state."""
    if kind == "push":
        return ('<svg viewBox="0 0 120 44" class="an an-push" aria-hidden="true">'
                '<rect x="4" y="10" width="34" height="24" rx="4" class="an-box"/>'
                '<rect x="82" y="10" width="34" height="24" rx="4" class="an-box"/>'
                '<text x="21" y="26" class="an-t">env</text><text x="99" y="26" class="an-t">repo</text>'
                '<line x1="42" y1="22" x2="78" y2="22" class="an-line"/>'
                '<circle cx="46" cy="22" r="4" class="an-dot"/></svg>')
    if kind == "act-as":
        return ('<svg viewBox="0 0 120 44" class="an an-actas" aria-hidden="true">'
                '<circle cx="34" cy="16" r="8" class="an-fig"/>'
                '<path d="M20,36 a14,12 0 0 1 28,0" class="an-fig"/>'
                '<rect x="62" y="14" width="44" height="14" rx="3" class="an-plate"/>'
                '<text x="84" y="24.5" class="an-t an-t--inv">as: user</text></svg>')
    if kind == "edit":
        return ('<svg viewBox="0 0 120 44" class="an an-edit" aria-hidden="true">'
                '<rect x="38" y="4" width="44" height="36" rx="3" class="an-box"/>'
                '<line x1="46" y1="14" x2="74" y2="14" class="an-stroke s1"/>'
                '<line x1="46" y1="22" x2="70" y2="22" class="an-stroke s2"/>'
                '<line x1="46" y1="30" x2="74" y2="30" class="an-stroke s3"/></svg>')
    if kind == "egress":
        return ('<svg viewBox="0 0 120 44" class="an an-egress" aria-hidden="true">'
                '<line x1="60" y1="4" x2="60" y2="40" class="an-wall"/>'
                '<circle cx="16" cy="22" r="4" class="an-dot"/>'
                '<text x="106" y="26" class="an-t">net</text></svg>')
    if kind == "recall":
        return ('<svg viewBox="0 0 120 44" class="an an-recall" aria-hidden="true">'
                '<rect x="44" y="8" width="32" height="28" rx="2" class="an-box"/>'
                '<line x1="50" y1="16" x2="70" y2="16" class="an-stroke s1"/>'
                '<line x1="50" y1="22" x2="66" y2="22" class="an-stroke s2"/>'
                '<line x1="50" y1="28" x2="70" y2="28" class="an-stroke s3"/>'
                '<text x="14" y="26" class="an-t">t−1…</text></svg>')
    if kind == "escalate":
        return ('<svg viewBox="0 0 120 44" class="an an-esc" aria-hidden="true">'
                '<rect x="54" y="20" width="12" height="20" class="an-wall-low"/>'
                '<circle cx="30" cy="26" r="6" class="an-fig an-hop"/>'
                '<text x="92" y="26" class="an-t">root</text></svg>')
    if kind == "blocked":
        return ('<svg viewBox="0 0 120 44" class="an an-blocked" aria-hidden="true">'
                '<line x1="72" y1="4" x2="72" y2="40" class="an-wall an-wall--solid"/>'
                '<circle cx="20" cy="22" r="4" class="an-dot an-dot--stop"/>'
                '<text x="96" y="26" class="an-t">✕</text></svg>')
    if kind == "unknown":
        return ('<svg viewBox="0 0 120 44" class="an an-unknown" aria-hidden="true">'
                '<rect x="70" y="4" width="46" height="36" rx="3" class="an-fog"/>'
                '<text x="93" y="28" class="an-t an-q">?</text>'
                '<circle cx="20" cy="22" r="4" class="an-dot an-dot--stop"/></svg>')
    return ""


def build_one(scn_path, doors, mandate):
    errors = []
    scn = J(scn_path)
    folder = os.path.dirname(scn_path)
    twin_path = os.path.join(ROOT, scn["twin"])
    if not os.path.exists(twin_path):
        return [f"{scn['id']}: twin {scn['twin']} does not exist"]
    twin = J(twin_path)
    nodes = {n["id"]: n for n in twin["nodes"]}

    # gates ------------------------------------------------------------------
    for k, d in scn["decor"].items():
        if k not in nodes:
            errors.append(f"{scn['id']}: decor names '{k}' and the twin has no such node")
        if d["anim"] not in ANIMS:
            errors.append(f"{scn['id']}: anim '{d['anim']}' is not a kind the engine implements")
    for nid in nodes:
        if nid not in scn["decor"]:
            errors.append(f"{scn['id']}: twin node '{nid}' has no decor — cards must equal twin nodes exactly")
    for b in scn.get("story", []):
        if not os.path.exists(os.path.join(ROOT, b["cites"])):
            errors.append(f"{scn['id']}: story cites {b['cites']}, which does not exist")

    # mandate slots, derived -------------------------------------------------
    slots = []
    for sid in ("context", "hook", "platform"):
        sl = scn["mandate_slots"][sid]
        d = sl["derive"]
        if d == "twin:n3.control":
            quote = nodes.get("n3", {}).get("control", "")
            if not quote:
                errors.append(f"{scn['id']}: context slot derives twin:n3.control and it is empty")
            slots.append((sid, sl["label"], "EXPECTATION", "live",
                          f"the twin, by byte: “{quote[:180]}…”", sl.get("reading", "")))
        elif d == "mandate:enforced_by":
            eb = mandate.get("enforced_by", {})
            if not eb:
                errors.append(f"{scn['id']}: hook slot derives mandate:enforced_by and it is absent")
            slots.append((sid, sl["label"], eb.get("tier", "?").upper(), "live",
                          f"the signed mandate: “{eb.get('why_not_boundary','')[:160]}…”", sl.get("reading", "")))
        elif d == "doors:enforcement_at_boundary":
            row = next((c for c in doors["computed"] if c["metric"] == "enforcement_at_boundary"), None)
            if row is None:
                errors.append(f"{scn['id']}: platform slot cannot find enforcement_at_boundary in the doors view")
            else:
                n = row["count"]
                slots.append((sid, sl["label"], "BOUNDARY", "shut" if n == 0 else "live",
                              f"the doors view: {n} built by this estate — the shut door, inside a scenario",
                              sl.get("reading", "")))
        elif d == "twin:permissions-block":
            hit = next((n for n in twin["nodes"] if "permissions" in str(n.get("control", "")).lower()
                        or "permissions" in str(n.get("method", "")).lower()), None)
            if hit is None:
                errors.append(f"{scn['id']}: platform slot derives twin:permissions-block and no node mentions one")
            else:
                slots.append((sid, sl["label"], str(hit.get("tier", "?")).upper(), "live",
                              f"the twin, node {hit['id']}: “{str(hit.get('control',''))[:150]}…”", sl.get("reading", "")))
        elif d == "none":
            slots.append((sid, sl["label"], "—", "absent", "nothing occupies this slot in this world",
                          sl.get("reading", "")))
        else:
            errors.append(f"{scn['id']}: unknown slot derivation '{d}'")

    if errors:
        return errors

    # render -----------------------------------------------------------------
    kinds = {"person": "◯", "service": "◈", "harness": "▤", "environment": "▣",
             "platform": "▦", "asset": "◆"}
    players = "\n".join(
        f'''<div class="sc-player"><span class="sc-glyph">{kinds.get(p["kind"], "·")}</span>
<div><div class="sc-pname">{esc(p["name"])}<span class="sc-pkind">{esc(p["kind"])}</span>
{'<span class="sc-twinbadge">THE TWIN</span>' if p.get("ref") == "twin" else ''}</div>
<div class="sc-pnote">{esc(p["note"])}</div></div></div>''' for p in scn["players"])

    names = {p["id"]: p["name"] for p in scn["players"]}
    # Each hop (name + verb) stays unbreakable; the chain wraps BETWEEN hops.
    # nowrap+scroll hid the tail of a long chain off the right edge — the
    # screenshot-read caught it cut mid-name, which is worse than wrapping.
    chain = " ".join(
        f'<span class="sc-hop"><span class="sc-cn">{esc(names[a])}</span> <span class="sc-cv">—{esc(v)}→</span></span> '
        for a, v, b in scn["grant_chain"]) + f'<span class="sc-cn">{esc(names[scn["grant_chain"][-1][2]])}</span>'

    rmax = 0
    cards = []
    for nid, node in nodes.items():
        d = scn["decor"][nid]
        r, why = rung_of(node)
        rmax = max(rmax, r)
        # Filled pips == rung, out of three: 0 hypothesis, 1 self-observed,
        # 2 +documented, 3 independent. The first cut lit r+1-ish pips on a
        # four-pip row and the screenshot-read caught rung 1 wearing two.
        pips = "".join(f'<span class="sc-pip{" sc-pip--on" if i < r else ""}"></span>'
                       for i in range(3))
        cards.append(f'''<div class="sc-card sc-card--{esc(d["anim"])}">
  <div class="sc-ctop"><span class="sc-cid">{esc(nid)}</span>
    <span class="sc-rung" title="{esc(why)}">{pips}<span class="sc-rlabel">rung {r}</span></span></div>
  {anim_svg(d["anim"])}
  <div class="sc-ctitle">{esc(node["capability"])}</div>
  <div class="sc-ccap">{esc(d["caption"])}</div>
  <div class="sc-cmeta"><span class="sc-tier sc-tier--{esc(str(node.get("tier","unknown")))}">{esc(str(node.get("tier","?")))}</span>
    <span class="sc-ev">{esc(str(node.get("evidence","?")))}</span>
    <span class="sc-date">as of {esc(twin["measured_at"])}</span></div>
</div>''')

    slots_html = "\n".join(f'''<div class="sc-slot sc-slot--{st}">
  <div class="sc-shead"><span class="sc-stier">{esc(tier)}</span> {esc(label)}
    <span class="sc-sstate sc-sstate--{st}">{esc(st.upper())}</span></div>
  <div class="sc-squote">{esc(src)}</div>
  {f'<div class="sc-sread">{esc(read)}</div>' if read else ''}
</div>''' for _, label, tier, st, src, read in slots)

    story = "\n".join(f'<li>{esc(b["beat"])} <a href="../../{esc(b["cites"])}">the artefact</a></li>'
                      for b in scn.get("story", []))

    reg = open(os.path.join(ROOT, "registry", "index.html"), encoding="utf-8").read()
    nav = reg[reg.index('<nav class="site">'):reg.index('<main')].replace('href="../', 'href="../../').replace('src="../', 'src="../../')
    foot = reg[reg.index('<footer class="site">'):reg.index("</body>")].replace('href="../', 'href="../../').replace('src="../', 'src="../../')

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(scn["title"])} &mdash; a scenario &middot; pki.sgit.ai</title>
<meta name="description" content="{esc(scn["question"])}">
<link rel="canonical" href="https://pki.sgit.ai/experiments/{esc(scn["id"])}/index.html">
<meta property="og:url" content="https://pki.sgit.ai/experiments/{esc(scn["id"])}/index.html">
<link rel="stylesheet" href="../../assets/site.css">
<link rel="stylesheet" href="../../assets/bench.css">
<link rel="stylesheet" href="../scenario.css">
</head>
<body>

{nav}<main class="doc doc--wide">
<div class="crumb"><a href="../../index.html">pki.sgit.ai</a> / <a href="../index.html">experiments</a> / {esc(scn["id"])}</div>

<h1>{esc(scn["title"])}</h1>
<p class="lead">{esc(scn["question"])}</p>

<div class="rmark"><b>One engine, many worlds.</b> This page is rendered by the scenario engine from
<a href="scenario.json">scenario.json</a>, which holds no capabilities of its own — it
<b>references a twin</b>, <a href="../../{esc(scn["twin"])}">{esc(os.path.basename(scn["twin"]))}</a>,
and every card below is read out of the twin at build time. The scenario may decorate a card; it may
not add, remove or restate one, and the build fails if it tries.</div>

<h2>The players <span class="tdim">&mdash; and the grant chain between them</span></h2>
<div class="sc-players">{players}</div>
<div class="sc-chain">{chain}</div>

<h2>Where the mandate lives <span class="tdim">&mdash; the same constraint, three possible rooms</span></h2>
<p>The soft mandate, shown as a place: the thing that keeps this world on the right branch lives in
one of three slots, and the slot decides the tier. <b>Every status below is derived from a file,
never typed.</b></p>
<div class="sc-slots">{slots_html}</div>

<h2>The capabilities <span class="tdim">&mdash; watchable, evidenced, rung-scored, dated</span></h2>
<p>Each card is a twin node wearing scene clothes: a micro-animation of the capability acting, its
tier and evidence class, and a <b>confidence rung computed from the evidence</b> — the gradient from
hypothesis to reality as arithmetic. <b>No card in this world exceeds rung {rmax}</b>, because every
measurement here is self-measurement: nothing in this estate has independent evidence yet, and that
shut door prints on every deck it affects.</p>
<div class="sc-deck">{cards and "".join(cards)}</div>

<h2>The story <span class="tdim">&mdash; each beat cites its artefact</span></h2>
<ol class="sc-story">{story}</ol>

<p class="dr-notprove"><b>What this scenario does not claim.</b> The animations illustrate; they do
not simulate — a travelling dot is a depiction of a capability, not an execution of one. The rungs
top out at {rmax} because the twin is self-measured, and a claim about somebody else's product at
rung &le; 2 is a floor, not a census. Version-stamped {esc(twin["measured_at"])}: a capability claim
without a date is a claim about all versions at once, which is a claim about none.</p>

<p class="dr-src">Engine: <code>admin/build/gen_scenario.py</code> &middot; specified in
<a href="../../briefs/v0.33.68__dev-brief__the-scenario-engine-json-driven-worlds-the-soft-mandate-and-the-platform-library.md">brief v0.33.68</a>
&middot; gates: twin must exist; cards == twin nodes exactly; every decor key names a node; every
slot derives from a real file, and the platform slot must agree with the doors view; every story
beat cites an artefact that exists.</p>
</main>

{foot}
</body>
</html>
'''
    open(os.path.join(folder, "index.html"), "w", encoding="utf-8").write(page)
    return []


def main():
    doors = J(os.path.join(ROOT, "registry", "views", "doors.json"))
    mandate = J(os.path.join(ROOT, "packs", "grant-and-mandate", "mandates", "current.json"))
    scns = sorted(glob.glob(os.path.join(ROOT, "experiments", "*", "scenario.json")))
    all_errors, built = [], 0
    for s in scns:
        errs = build_one(s, doors, mandate)
        if errs:
            all_errors += errs
        else:
            built += 1
    if all_errors:
        print(f"gen_scenario: {len(all_errors)} GATE FAILURE(S):")
        for e in all_errors:
            print(f"  ✗ {e}")
        sys.exit(1)
    print(f"gen_scenario: one engine, {built} worlds -> " +
          ", ".join(os.path.relpath(os.path.dirname(s), ROOT) for s in scns))


if __name__ == "__main__":
    main()
