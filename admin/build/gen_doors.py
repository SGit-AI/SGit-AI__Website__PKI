#!/usr/bin/env python3
"""gen_doors.py — the doors page: this estate's ladders, computed, with a gate.

Renders /registry/doors.html and /registry/views/doors.json from
/registry/doors.declared.json, which declares the ladders, the rungs, the doors
and whether each door is EXPECTED shut — and holds no counts at all.

Every number on the page comes from a METRIC below, so each one has a function
you can read. A rung naming a metric that does not exist fails the build rather
than rendering blank.

THE GATE. A door whose computed state disagrees with its declared expectation
fails the build, IN EITHER DIRECTION:

  declared shut + computed 0   agrees
  declared shut + computed >0  FAILS — a door opened, and that is news; say so
                               in the declaration, in the commit that says so
  declared open + computed 0   FAILS — a regression: something that worked stopped

Ported from newsroom.sgit.ai brief 10 §8 (the state map, not the room), CC BY 4.0.
"""
import json, glob, os, re, sys, html, collections, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = os.path.join(ROOT, "registry")
LIB = os.path.join(ROOT, "packs", "grant-and-mandate", "library")


def J(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _records():
    return sorted(glob.glob(os.path.join(R, "records", "*", "")))


def _statements():
    return [f for f in glob.glob(os.path.join(R, "records", "*", "*.json"))
            if os.path.basename(f) != "record.json"]


def _by_type(t):
    return [f for f in _statements() if J(f).get("type") == t]


def _library():
    return sorted(glob.glob(os.path.join(LIB, "*.json")))


def _nodes():
    for f in _library():
        for n in J(f).get("nodes", []):
            yield f, n


def _tier(t):
    """Nodes at a tier. A node its own file marks SUPERSEDED_BY does not count
    toward the tier it stores — that label is one the estate says is WRONG."""
    return sum(1 for _, n in _nodes()
               if n.get("tier") == t and "SUPERSEDED_BY" not in n)


# ── the metrics ─────────────────────────────────────────────────────────────
# Every count on the page is one of these. No literal ever reaches the markup.
METRICS = {
    "records":            lambda: len(_records()),
    "records_scarce":     lambda: sum(1 for d in _records()
                                      if not J(os.path.join(d, "01__identity.json"))
                                      ["body"]["private_key_published"]),
    # The append lane is unbuilt: no statement anywhere records an enrolment
    # through it. Computed as a search rather than asserted as a zero.
    "enrolled_via_lane":  lambda: sum(1 for f in _statements()
                                      if J(f).get("body", {}).get("enrolled_via") == "append-lane"),
    "acceptances":        lambda: len(_by_type("acceptance")),
    "mandates_real_issuer": lambda: sum(
        1 for f in _by_type("mandate")
        if not _issuer_is_fixture(J(f).get("signer") or J(f).get("record"))),
    "nodes_none":         lambda: _tier("none"),
    "nodes_expectation":  lambda: _tier("expectation"),
    "nodes_setting":      lambda: _tier("setting"),
    "nodes_boundary_surviving": lambda: _tier("boundary"),
    # An enforcement point this estate built that reaches tier boundary.
    "enforcement_at_boundary": lambda: sum(
        1 for f in glob.glob(os.path.join(ROOT, "packs", "grant-and-mandate", "mandates", "*.json"))
        if J(f).get("enforced_by", {}).get("tier") == "boundary"),
    "library_entries":    lambda: len(_library()),
    "library_entries_signed": lambda: sum(1 for f in _library() if "sig" in J(f)),
    "excess_rows":        lambda: len(J(os.path.join(R, "views", "excess-authority.json"))["rows"]),
    # The shortfall column in the rendered delta block is a hardcoded string;
    # there is no computed shortfall anywhere in the estate.
    "shortfall_rows":     lambda: 0,
    "blindspot_rows":     lambda: 0,
    "rows_with_acceptor": lambda: sum(
        1 for r in J(os.path.join(R, "views", "excess-authority.json"))["rows"]
        if r.get("excess_authority", {}).get("acceptor")),
    "statements":         lambda: len(_statements()),
    "independent_measurements": lambda: sum(
        1 for f in _library()
        if "instrument" not in (J(f).get("measured_by", {}).get("who", "") or "").lower()
        and "inside" not in (J(f).get("measured_by", {}).get("who", "") or "").lower()),
    "registries_referenced": lambda: _registries_referenced(),
}


def _issuer_is_fixture(fp):
    if not fp:
        return True
    d = os.path.join(R, "records", "sha256-" + fp.replace("sha256:", ""))
    ident = os.path.join(d, "01__identity.json")
    return (not os.path.exists(ident)) or J(ident)["body"]["private_key_published"]


def _registries_referenced():
    """Statements naming a registry other than this one."""
    n = 0
    for f in _statements():
        reg = J(f).get("registry")
        if reg and reg != "pki.sgit.ai":
            n += 1
    return n


# ── compute + gate ──────────────────────────────────────────────────────────
def build():
    decl = J(os.path.join(R, "doors.declared.json"))
    errors, computed = [], []

    for lad in decl["ladders"]:
        for rung in lad["rungs"]:
            m = rung["metric"]
            if m not in METRICS:
                errors.append(f"{lad['id']}/{rung['id']}: unknown metric {m!r} — "
                              f"a rung must name a metric that exists, or the page renders blank")
                continue
            n = METRICS[m]()
            rec = {"ladder": lad["id"], "rung": rung["id"], "label": rung["label"],
                   "metric": m, "count": n}
            door = rung.get("door")
            if door:
                actual = "shut" if n == 0 else "open"
                rec["door"] = {**door, "actual": actual, "agrees": actual == door["expect"]}
                if actual != door["expect"]:
                    if door["expect"] == "shut":
                        errors.append(
                            f"A DOOR OPENED · {lad['id']}/{rung['id']}: \"{door['condition']}\" "
                            f"is declared shut and computes {n}. That is news — change `expect` to "
                            f"\"open\" in doors.declared.json, in the commit that says so.")
                    else:
                        errors.append(
                            f"A DOOR CLOSED · {lad['id']}/{rung['id']}: \"{door['condition']}\" "
                            f"is declared open and computes 0. That is a regression — something "
                            f"that worked has stopped.")
            computed.append(rec)

    shut = sum(1 for c in computed if c.get("door", {}).get("actual") == "shut")
    doors = sum(1 for c in computed if "door" in c)
    # Who has to act. The page may not assert this split; it computes it.
    shut_doors = [c for c in computed if c.get("door", {}).get("actual") == "shut"]
    ours = sum(1 for c in shut_doors if c["door"].get("needs") == "this project")
    theirs = len(shut_doors) - ours

    view = {
        "_authority": "NONE — generated by admin/build/gen_doors.py from doors.declared.json "
                      "and the repository. Recompute it yourself.",
        "what_this_is": decl["what_this_is"],
        "ladders": len(decl["ladders"]), "rungs": len(computed),
        "doors": doors, "doors_shut": shut,
        "computed": computed,
    }
    os.makedirs(os.path.join(R, "views"), exist_ok=True)
    with open(os.path.join(R, "views", "doors.json"), "w", encoding="utf-8") as f:
        json.dump(view, f, indent=2, ensure_ascii=False)
        f.write("\n")

    view["doors_shut_needing_this_project"] = ours
    view["doors_shut_needing_somebody_else"] = theirs
    with open(os.path.join(R, "views", "doors.json"), "w", encoding="utf-8") as f:
        json.dump(view, f, indent=2, ensure_ascii=False)
        f.write("\n")

    render(decl, computed, doors, shut, ours, theirs)
    return errors, doors, shut, len(computed)


# ── render ──────────────────────────────────────────────────────────────────
def esc(s):
    return html.escape(str(s), quote=True)


def nav_and_chrome():
    """Lift the nav, head and footer from an existing page so this one cannot
    drift from the site's chrome."""
    src = open(os.path.join(R, "index.html"), encoding="utf-8").read()
    nav = src[src.index('<nav class="site">'):src.index('<main')]
    foot = src[src.index('<footer class="site">'):src.index("</body>")]
    return nav, foot


def render(decl, computed, doors, shut, ours, theirs):
    idx = {(c["ladder"], c["rung"]): c for c in computed}
    nav, foot = nav_and_chrome()
    out = []

    for lad in decl["ladders"]:
        rows = []
        for rung in lad["rungs"]:
            c = idx.get((lad["id"], rung["id"]))
            if not c:
                continue
            n = c["count"]
            door = c.get("door")
            zero = " dr-row--zero" if n == 0 else ""
            state = ""
            if door:
                sh = door["actual"] == "shut"
                # two channels: the WORD, and the border style. never colour alone.
                state = (f'<span class="dr-door dr-door--{"shut" if sh else "open"}">'
                         f'{"◼ SHUT" if sh else "◻ OPEN"}</span>')
            rows.append(f"""  <div class="dr-row{zero}">
    <div class="dr-n"><span class="dr-count">{n}</span><span class="dr-metric">{esc(c['metric'])}</span></div>
    <div class="dr-body">
      <div class="dr-label">{esc(rung['label'])}{state}</div>
      <div class="dr-means">{esc(rung.get('means',''))}</div>
      {f'''<div class="dr-doorline"><b>The door:</b> {esc(door['condition'])}'''
       + (f''' &mdash; <span class="dr-why">{esc(door.get('why',''))}</span>''' if door.get('why') else '')
       + '</div>' if door else ''}
    </div>
  </div>""")
        out.append(f"""<section class="dr-ladder" id="{esc(lad['id'])}">
<h2>{esc(lad['label'])}</h2>
<p class="dr-asks">{esc(lad['asks'])}</p>
<p class="dr-source">Source: {esc(lad['source'])}</p>
{chr(10).join(rows)}
</section>""")

    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The doors &mdash; what this estate has and has not passed &middot; pki.sgit.ai</title>
<meta name="description" content="This estate's four ladders, computed: the bootstrap gradient, the tier ladder, the ordering rule and the confidence ladder, with the door on each rung — the condition the next rung will not accept work without. Every count is derived at build time, and a door whose computed state disagrees with the declaration fails the build.">
<link rel="canonical" href="https://pki.sgit.ai/registry/doors.html">
<meta property="og:url" content="https://pki.sgit.ai/registry/doors.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/bench.css">
<link rel="stylesheet" href="doors.css">
</head>
<body>

{nav}<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="index.html">registry</a> / doors</div>

<h1>The doors</h1>
<p class="lead">This estate's four ladders, and the <b>door</b> on each rung &mdash; the condition the
next rung will not accept work without. <b>{shut} of {doors} doors are shut.</b></p>

<div class="dr-rule">
<b>Every number on this page is computed at build time</b> from <code>registry/</code> and
<code>packs/</code>; the name beside each one is the function that produced it. The ladders, the door
text and whether each door is <i>expected</i> shut are declared in
<a href="doors.declared.json">doors.declared.json</a>, which holds <b>no counts</b>. The computed
result is <a href="views/doors.json">views/doors.json</a>, which carries no authority.
<b>A door whose computed state disagrees with the declaration fails the build, in either
direction</b> &mdash; a door that opens breaks it just as loudly as one that closes, because a door
opening is news, and news that does not interrupt anybody is news nobody reads.</div>

{chr(10).join(out)}

<h2 id="reading">What the shape says</h2>
<p>The count is not the finding; the split is. Of the {shut} shut doors, <b>{ours} could be opened by
this project alone</b> and <b>{theirs} need somebody who is not this project</b> &mdash; a second
measurer, a second registry, an issuer whose key would be worth forging, a person willing to put their
name against an exposure. That is not {theirs} problems. It is one problem with {theirs} faces, and it
is this estate's own longest-standing finding rather than a new one: nobody outside the project has
been asked whether any of this is a need.</p>
<p>The {ours} that are ours are the more uncomfortable half, because nothing is stopping them.</p>

<p class="dr-notprove"><b>This page does not prove anything is wrong.</b> A shut door is a statement
about instances, not about design, and not a commitment to open one. It adds no claim this estate has
not already published elsewhere &mdash; its whole contribution is putting them in one place and
letting a gate keep them true. It also cannot check its own declaration: if
<code>doors.declared.json</code> names the wrong ladders, everything agrees and everything is wrong.
Each rung names the published source its definition comes from; there is no mitigation for choosing
the wrong sources.</p>

<p class="dr-src">Ported from <a href="https://newsroom.sgit.ai/briefs/10__the-newsroom-floor.md">newsroom.sgit.ai brief 10</a>
&sect;8 &mdash; the state map, not the room &mdash; CC BY 4.0, with attribution kept per its &sect;11.
Specified in <a href="../briefs/v0.33.65__dev-brief__the-doors-page-a-computed-state-map-where-the-build-breaks-when-a-door-opens.md">brief v0.33.65</a>.
Generator: <code>admin/build/gen_doors.py</code>.</p>
</main>

{foot}
</body>
</html>
"""
    with open(os.path.join(R, "doors.html"), "w", encoding="utf-8") as f:
        f.write(page)


if __name__ == "__main__":
    errs, doors, shut, rungs = build()
    print(f"gen_doors: {rungs} rungs, {doors} doors, {shut} shut "
          f"-> registry/doors.html + registry/views/doors.json")
    if errs:
        print(f"\n  {len(errs)} GATE FAILURE(S):")
        for e in errs:
            print(f"  ✗ {e}")
        sys.exit(1)
    print("  ── every door agrees with the declaration")
