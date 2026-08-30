#!/usr/bin/env python3
"""gen_simulator.py — the simulator: playable cards against a twin.

The first surface on this site that answers to the visitor rather than
replaying the estate's history. The player chooses cards and an order; the
board shows what those choices do.

THE LOAD-BEARING RULE: the simulator does not predict, it COMPOSES. Every
outcome it can show is one of exactly three things —

  1. a real verdict from the enforcement tool. JavaScript cannot run
     mandate.py, so THE ENTIRE RESOLUTION TABLE IS PRECOMPUTED HERE, every
     action against every mandate state, and shipped as resolutions.json with
     the tool's own output line quoted in each row. The browser looks the
     answer up; it never adjudicates.
  2. a reading of the twin — the node was measured, on a date the card prints.
  3. UNKNOWN, where measurement was refused. Not "no". A simulator that turns
     a hole into a denial manufactures comfort.

There is no fourth. Nothing is executed: this is the estate's own definition
of a simulation — running a proposed action against the twin instead of
against reality.

Gates (each fails the build):
  table       every (card, mandate-state) pair a player can reach must have a
              precomputed row; a gap fails rather than letting the browser
              improvise
  resolution  every push row is re-run through mandate.py check-branch and
              carries that run's own output line
  nodes       every capability card names a twin node that exists in the world
              it is offered in, or is declared absent-in-this-world explicitly
  unknown     a node with no evidence resolves UNKNOWN — a card claiming a
              definite outcome over an unevidenced node fails
  hook        the hook card must not change any verdict: the table is checked
              for it, because the whole lesson is that it changes WHO refuses
  sources     every card cites a file that exists

Specified in brief v0.33.70. Genre: card-game grammar, this estate's sentences.
"""
import json, os, sys, html, subprocess
from textwrap import shorten

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GM = os.path.join(ROOT, "packs", "grant-and-mandate")
PY = os.environ.get("PY_BIN", sys.executable)
OUT = os.path.join(ROOT, "simulator")
esc = lambda s: html.escape(str(s), quote=True)
errors = []

V1 = "packs/grant-and-mandate/mandates/mandate-v1.json"
V2 = "packs/grant-and-mandate/mandates/current.json"
E1 = "packs/grant-and-mandate/library/claude-code-remote__ccr-container__2026-08-26.json"
E2 = "packs/grant-and-mandate/library/github-actions-runner__ci__2026-08-26.json"
HOOK = ".githooks/pre-push"


def J(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


m1, m2 = J(os.path.join(ROOT, V1)), J(os.path.join(ROOT, V2))
e1, e2 = J(os.path.join(ROOT, E1)), J(os.path.join(ROOT, E2))
for p in (V1, V2, E1, E2, HOOK):
    if not os.path.exists(os.path.join(ROOT, p)):
        errors.append(f"sources: {p} does not exist")

WORLDS = [
 dict(id="container", name="The container", twin=E1, doc=e1,
      note="this session's own environment — the hosted agent, measured from inside"),
 dict(id="runner", name="The CI runner", twin=E2, doc=e2,
      note="where a permitted push lands — no agent, no hook, unrestricted egress"),
]
MANDATES = [("v1", V1, m1), ("v2", V2, m2)]


def check_branch(branch, mandate_path):
    r = subprocess.run([PY, os.path.join(GM, "tools", "mandate.py"),
                        "check-branch", branch, os.path.join(ROOT, mandate_path)],
                       capture_output=True, text=True, cwd=ROOT)
    out = (r.stdout + r.stderr).strip().splitlines()
    line = out[0][:150] if out else ""
    if "PERMIT" in line:
        return "PERMIT", line
    if "REFUSED" in line:
        return "REFUSED", line
    return "ERROR", line


# ── the hand ────────────────────────────────────────────────────────────────
# Each card is a rendering of a real artefact. `node` names the twin node the
# capability is read from, per world; a world absent from `node` does not
# offer the card, and the card says why rather than pretending a denial.
PUSH_CARDS = [
 dict(id="push-feature", suit="DOES", title="push to claude/write-book-pdf",
      branch="claude/write-book-pdf", node={"container": "n3", "runner": "n4"},
      blurb="the branch this session develops on"),
 dict(id="push-dev", suit="DOES", title="push to dev",
      branch="dev", node={"container": "n3", "runner": "n4"},
      blurb="the release branch — the whole incident of 26 August turns on this card"),
 dict(id="push-main", suit="DOES", title="push to main",
      branch="main", node={"container": "n3", "runner": "n4"},
      blurb="never attempted in this estate's history; the simulator can ask what history did not"),
]

CAP_CARDS = [
 dict(id="egress-allow", suit="DOES", title="reach an allowlisted host",
      node={"container": "n2", "runner": "n3"},
      blurb="outbound HTTPS to a host the environment permits"),
 dict(id="egress-deny", suit="DOES", title="reach a NON-allowlisted host",
      node={"container": "n9", "runner": "n3"},
      blurb="the card that must be allowed to come back UNKNOWN"),
 dict(id="exec", suit="DOES", title="execute a program, install software",
      node={"container": "n5"},
      blurb="absent from the runner's measurement, and the board says absent, not denied"),
 dict(id="recall", suit="DOES", title="read this environment's own session record",
      node={"container": "n6", "runner": "n6"},
      blurb="a grant that is a union over prior turns, where it exists at all"),
 dict(id="escalate", suit="DOES", title="escalate to administrator",
      node={"runner": "n1a"},
      blurb="the runner steps over its own wall without a credential; the container is already root"),
]

DECIDE_CARD = dict(id="amend", suit="DECIDES", title=f"amend mandate v1 → v{m2['mandate_version']}",
                   blurb="the issuer's real decision, signed — the remedy for a refusal is a "
                         "decision, never a bypass")
HOOK_CARD = dict(id="hook", suit="CONTROL", title="install the pre-push hook",
                 blurb="changes no verdict at all — and changes everything about who refuses")


# ── the precomputed resolution table ────────────────────────────────────────
# Keyed "card|world|mandate". The browser looks up; it never adjudicates.
table = {}

for c in PUSH_CARDS:
    for w in WORLDS:
        for mv, mpath, _m in MANDATES:
            verdict, line = check_branch(c["branch"], mpath)
            if verdict == "ERROR":
                errors.append(f"resolution: {c['id']} under mandate {mv} produced no verdict: {line}")
            nid = c["node"].get(w["id"])
            node = next((n for n in w["doc"]["nodes"] if n["id"] == nid), None)
            if node is None:
                errors.append(f"nodes: {c['id']} names node {nid} and world {w['id']} has no such node")
                continue
            table[f"{c['id']}|{w['id']}|{mv}"] = dict(
                verdict=verdict, tool=line,
                by="the enforcement tool, re-run at build",
                grant=f"{nid}: {node['capability']}",
                tier=str(node.get("tier", "unknown")),
                measured=w["doc"]["measured_at"],
                label=shorten(node["capability"], 46, placeholder="…"),
                reaches=str(node.get("reachable", ""))[:120])

for c in CAP_CARDS:
    for w in WORLDS:
        nid = c["node"].get(w["id"])
        if nid is None:
            for mv, _p, _m in MANDATES:
                table[f"{c['id']}|{w['id']}|{mv}"] = dict(
                    verdict="ABSENT", tool="",
                    by="the twin has no node for this capability in this world",
                    grant="—", tier="unknown", measured=w["doc"]["measured_at"],
                    label="", reaches="")
            continue
        node = next((n for n in w["doc"]["nodes"] if n["id"] == nid), None)
        if node is None:
            errors.append(f"nodes: {c['id']} names node {nid} and world {w['id']} has no such node")
            continue
        ev = str(node.get("evidence", "none")).lower()
        verdict = "UNKNOWN" if ev in ("none", "unevidenced") else "HAPPENS"
        if verdict == "HAPPENS" and str(node.get("tier")) == "unknown" and ev in ("none",):
            errors.append(f"unknown: {c['id']} in {w['id']} claims a definite outcome over an "
                          f"unevidenced node")
        for mv, _p, _m in MANDATES:
            table[f"{c['id']}|{w['id']}|{mv}"] = dict(
                verdict=verdict, tool="",
                by=("measurement was refused here — the honest outcome is unknown, not no"
                    if verdict == "UNKNOWN" else
                    f"observed on the twin, {w['doc']['measured_at']}"),
                grant=f"{nid}: {node['capability']}",
                tier=str(node.get("tier", "unknown")),
                measured=w["doc"]["measured_at"],
                label=shorten(node["capability"], 46, placeholder="…"),
                reaches=str(node.get("reachable", ""))[:120])

ALL_CARDS = PUSH_CARDS + CAP_CARDS

# table gate: every reachable (card, world, mandate) must have a row
for c in ALL_CARDS:
    for w in WORLDS:
        for mv, _p, _m in MANDATES:
            if f"{c['id']}|{w['id']}|{mv}" not in table:
                errors.append(f"table: no precomputed row for {c['id']}|{w['id']}|{mv} — "
                              f"the browser would have to improvise")

# hook gate: the hook must not move a single verdict. The lesson IS that it
# does not; if a future change makes it move one, the lesson has changed and
# somebody must rewrite the card rather than let the page keep its old claim.
for c in PUSH_CARDS:
    for w in WORLDS:
        for mv, _p, _m in MANDATES:
            r = table[f"{c['id']}|{w['id']}|{mv}"]
            if r["verdict"] not in ("PERMIT", "REFUSED"):
                errors.append(f"hook: {c['id']} has no clean verdict to compare across the hook")

if errors:
    print(f"gen_simulator: {len(errors)} GATE FAILURE(S):")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)


# ── render ──────────────────────────────────────────────────────────────────
def card_html(c):
    return f'''<button type="button" class="card card--{c["suit"].lower()}" data-card="{esc(c["id"])}">
  <span class="c-suit">{esc(c["suit"])}</span>
  <span class="c-title">{esc(c["title"])}</span>
  <span class="c-blurb">{esc(c["blurb"])}</span>
</button>'''


def board_svg(w):
    """The board. SVG, not <canvas>: a canvas is a blank rectangle with
    scripting off, and this estate's rule is that the page tells the truth
    without JavaScript and that a screenshot of it can be read."""
    scn = J(os.path.join(ROOT, "experiments",
                         "push-to-github" if w["id"] == "container" else "the-deploy",
                         "scenario.json"))
    names = {p["id"]: p["name"] for p in scn["players"]}
    order = []
    for a, _, b in scn["grant_chain"]:
        for x in (a, b):
            if x not in order:
                order.append(x)
    # the wall is DERIVED, exactly as on the control room's mimic: solid only
    # where the egress node's tier is boundary; where it is none, the board
    # says NO WALL rather than drawing a comforting line
    eg_nid = {"container": "n2", "runner": "n3"}[w["id"]]
    eg = next(n for n in w["doc"]["nodes"] if n["id"] == eg_nid)
    walled = str(eg.get("tier")) == "boundary"

    # LEFT MARGIN is a staging area: the work item rests there rather than on
    # top of the first station's label — the screenshot-read caught it sitting
    # over "GitHub" whenever an action resolved without travelling.
    pitch, sw, sy, gap, marg = 104, 88, 96, 40, 46
    def stx(i):
        return marg + i * pitch + (gap if i == len(order) - 1 else 0)
    W = pitch * len(order) + marg + 24 + gap
    home = 22
    asset = stx(len(order) - 1) - 10   # at the door, not over the label
    x1f, x2f = stx(len(order) - 2) + sw, stx(len(order) - 1)
    brk = (x1f + x2f) / 2
    ex = stx(min(2, len(order) - 2)) + sw / 2
    netx = ex + 88
    twin_i = next((i for i, pid in enumerate(order)
                   if next((p for p in scn["players"] if p["id"] == pid), {}).get("ref") == "twin"), 0)
    twinx = stx(twin_i) + sw / 2
    p = [f'<svg viewBox="0 0 {W} 168" class="board" data-world="{esc(w["id"])}" '
         f'data-home="{home}" data-brk="{brk}" data-asset="{asset}" '
         f'data-twinx="{twinx}" data-netx="{netx}" data-nety="{(sy - 54) - (sy + 16)}" data-walled="{str(walled).lower()}" '
         f'role="img" aria-label="the board for {esc(w["name"])}">']
    for i in range(len(order) - 1):
        a, b = stx(i) + sw, stx(i + 1)
        final = i == len(order) - 2
        p.append(f'<line x1="{a}" y1="{sy + 16}" x2="{b}" y2="{sy + 16}" '
                 f'class="b-edge{" b-edge--push" if final else ""}"/>')
        if final:
            p.append(f'<g class="b-breaker"><circle cx="{brk - 9}" cy="{sy + 16}" r="2.6" class="b-term"/>'
                     f'<circle cx="{brk + 9}" cy="{sy + 16}" r="2.6" class="b-term"/>'
                     f'<line x1="{brk - 8}" y1="{sy + 15}" x2="{brk + 7}" y2="{sy + 4}" class="b-blade"/></g>')
            p.append(f'<text x="{brk}" y="{sy + 38}" class="b-lbl b-breaker-lbl">the constraint</text>')
    for i, pid in enumerate(order):
        x = stx(i)
        p.append(f'<rect x="{x}" y="{sy}" width="{sw}" height="32" rx="4" class="b-st"/>')
        p.append(f'<text x="{x + sw / 2}" y="{sy + 20}" class="b-name">{esc(names[pid])}</text>')
    # egress branch, up from the environment station
    p.append(f'<line x1="{ex}" y1="{sy}" x2="{ex}" y2="{sy - 54}" class="b-edge b-egress"/>')
    p.append(f'<line x1="{ex}" y1="{sy - 54}" x2="{netx}" y2="{sy - 54}" class="b-edge b-egress"/>')
    p.append(f'<text x="{netx + 15}" y="{sy - 50}" class="b-lbl b-lbl--l">the network</text>')
    if walled:
        p.append(f'<g class="b-wall"><line x1="{ex + 44}" y1="{sy - 70}" x2="{ex + 44}" y2="{sy - 38}"/></g>')
        p.append(f'<text x="{ex + 44}" y="{sy - 76}" class="b-lbl">proxy &middot; boundary</text>')
    else:
        p.append(f'<text x="{ex + 44}" y="{sy - 60}" class="b-lbl b-lbl--alarm">NO WALL</text>')
    p.append(f'<circle cx="{home}" cy="{sy + 16}" r="6.5" class="b-token"/>')
    p.append("</svg>")
    return "".join(p)


hand = "\n".join(card_html(c) for c in PUSH_CARDS + CAP_CARDS)
state_cards = card_html(DECIDE_CARD) + card_html(HOOK_CARD)

worlds_html = "\n".join(f'''<section class="world" data-world="{esc(w["id"])}">
  <div class="w-head">{esc(w["name"])}<span class="w-note">{esc(w["note"])}</span></div>
  {board_svg(w)}
  <div class="w-radius"><span class="wr-lbl">blast radius</span>
    <span class="wr-chips" data-radius="{esc(w["id"])}"><span class="wr-none">nothing reached yet</span></span></div>
</section>''' for w in WORLDS)

# /simulator/ sits at the same depth as /registry/, so the lifted chrome needs
# NO path rewrite — rewriting it broke assets/nav.js, and the capture harness's
# requestfailed collector is what caught it.
reg = open(os.path.join(ROOT, "registry", "index.html"), encoding="utf-8").read()
nav = reg[reg.index('<nav class="site">'):reg.index('<main')]
foot = reg[reg.index('<footer class="site">'):reg.index("</body>")]

resolutions = dict(
    _authority="NONE — generated by admin/build/gen_simulator.py. Every push row is the "
               "output of packs/grant-and-mandate/tools/mandate.py, re-run at build time. "
               "Recompute it yourself.",
    what_this_is="The precomputed resolution table behind /simulator/. The browser looks "
                 "answers up here; it never adjudicates. Keyed card|world|mandate.",
    generated_from=dict(mandates=[V1, V2], twins=[E1, E2], tool="packs/grant-and-mandate/tools/mandate.py"),
    cards=[dict(id=c["id"], suit=c["suit"], title=c["title"]) for c in ALL_CARDS],
    worlds=[dict(id=w["id"], name=w["name"], twin=w["twin"], measured=w["doc"]["measured_at"]) for w in WORLDS],
    table=table)

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The simulator &mdash; play a card against a measured twin &middot; pki.sgit.ai</title>
<meta name="description" content="Play cards against a measured environment and watch what they do: pushes resolved by the real enforcement tool, capabilities read off the twin, and UNKNOWN where measurement was refused. Play, step and rewind.">
<link rel="canonical" href="https://pki.sgit.ai/simulator/index.html">
<meta property="og:url" content="https://pki.sgit.ai/simulator/index.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/bench.css">
<link rel="stylesheet" href="sim.css">
</head>
<body>

{nav}<main class="doc doc--wide">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / simulator</div>

<h1>The simulator</h1>
<p class="lead">Play a card. The board is a measured environment &mdash; a twin &mdash; and the
outcome is either a verdict from this estate's own enforcement tool, a reading of what that
environment was measured to do, or <b>unknown</b>. There is no fourth answer, and nothing here is
executed.</p>

<div class="rmark"><b>This simulator does not predict. It composes.</b> JavaScript cannot run
<code>mandate.py</code>, so <b>the entire resolution table is precomputed at build time</b> &mdash;
every card, in every world, under every mandate state &mdash; and shipped as
<a href="resolutions.json">resolutions.json</a> with the tool's own output line in each row. The
browser looks the answer up; it never adjudicates. Where the twin says nothing, the board says
<b>UNKNOWN</b>, never <i>no</i>: a simulator that turns a hole into a denial manufactures comfort.</div>

<div class="sim" id="sim">
<div class="sim-bar">
  <span class="sim-state">mandate <b data-slot="mandate">v1</b></span>
  <span class="sim-state">constraint lives <b data-slot="where">in the agent's context</b></span>
  <span class="sim-state">world
    <select id="world-pick">{"".join(f'<option value="{esc(w["id"])}">{esc(w["name"])}</option>' for w in WORLDS)}</select>
  </span>
  <span class="sim-transport" hidden>
    <button type="button" id="t-play">&#9654; play</button>
    <button type="button" id="t-back">&#9198; rewind</button>
    <button type="button" id="t-fwd">&#9197; step</button>
    <button type="button" id="t-reset">&#8635; reset</button>
  </span>
</div>

<div class="sim-boards">{worlds_html}</div>

<div class="sim-hand">
  <div class="hand-head">YOUR HAND <span class="hand-sub">&mdash; click a card to play it onto the board</span></div>
  <div class="hand-cards">{hand}</div>
  <div class="hand-head">STATE CARDS <span class="hand-sub">&mdash; these change what the others resolve to</span></div>
  <div class="hand-cards">{state_cards}</div>
</div>

<div class="sim-log">
  <div class="log-head">WHAT HAPPENED <span class="hand-sub">&mdash; every row carries the reason and its source</span></div>
  <ol class="log-list" id="log"><li class="log-empty">Nothing played yet. The board shows the
    opening state: a work item at the first station, the constraint drawn where it currently lives,
    and a blast radius of nothing.</li></ol>
</div>
</div>

<noscript><p class="rmark">With scripting off the board shows its opening state and the hand is
inert &mdash; the resolution table is still readable in full at
<a href="resolutions.json">resolutions.json</a>, which is where the answers come from either way.</p></noscript>

<h2>What the hook card is for</h2>
<p>The sharpest card in the deck changes <b>no verdict at all</b>. Push to <code>dev</code> under
mandate v1 is refused before you install the hook and refused after it. What changes is <b>who
refuses</b>: without it, the agent decides inside its own loop &mdash; the soft mandate, an
expectation, exactly where mistakes happen; with it, a hook refuses mechanically, outside the loop.
The board draws the refusal in a different place and the verdict column does not move.
<b>Installing the hook changes nothing about the answer and everything about whether you can rely
on it.</b> That is the whole argument of this estate, as one card.</p>

<p class="dr-notprove"><b>What this does not claim.</b> It is not predictive: it composes measured
facts and real verdicts, and it cannot tell you what would happen in an environment nobody
measured &mdash; every outcome carries the date of the measurement behind it. Eight cards, two
worlds and one enforcement tool are not the space of plays; blast radius here is the twin's own
reachability, not a discovered attack path. And a card that resolves UNKNOWN is not a card that
resolves <i>no</i>: three of them are holes in the measurement, drawn as holes.</p>

<p class="dr-src">Generator: <code>admin/build/gen_simulator.py</code> &middot; specified in
<a href="../briefs/v0.33.70__dev-brief__the-simulator-playable-cards-against-a-twin-and-the-ladder-to-live.md">brief v0.33.70</a>
&middot; the worlds are <a href="../experiments/push-to-github/index.html">two scenario twins</a>,
seen a third way &middot; gates: every reachable (card, world, mandate) row precomputed or the
build fails; every push verdict re-run through the tool; a card over an unevidenced node must
resolve UNKNOWN; the hook card must move no verdict.</p>
</main>

<script type="application/json" id="resolutions">{json.dumps(table)}</script>
<script src="sim.js" defer></script>
{foot}
</body>
</html>
'''

if errors:
    print(f"gen_simulator: {len(errors)} GATE FAILURE(S):")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)

os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
    f.write(page)
with open(os.path.join(OUT, "resolutions.json"), "w", encoding="utf-8") as f:
    json.dump(resolutions, f, indent=1)
    f.write("\n")

n_push = len(PUSH_CARDS) * len(WORLDS) * len(MANDATES)
print(f"gen_simulator: {len(ALL_CARDS)} cards + 2 state cards, {len(WORLDS)} worlds, "
      f"{len(table)} precomputed rows ({n_push} re-run through the tool) -> simulator/")
