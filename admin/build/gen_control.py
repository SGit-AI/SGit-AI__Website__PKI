#!/usr/bin/env python3
"""gen_control.py — the control room: a SCADA board and a game HUD over the
scenario worlds. One more renderer, ZERO NEW DATA.

This reads the SAME experiments/*/scenario.json files the deck pages use and
the twins they reference. If this generator needed its own data file, the
scenario engine would be a page generator with a JSON config; because it does
not, the scenario files are a world model, renderer-independent.

The mapping (brief v0.33.69): a world is a plant unit; the grant chain is the
mimic diagram; a capability is an annunciator tile whose lamp colour is its
TIER AND NOTHING ELSE (boundary green, setting amber, expectation amber
flashing, none red — an unbounded capability IS the alarm state — unknown
hatched FAULT: measurement refused is sensor failure, displayed, never blank);
the 26 August incident is the sequence-of-events log, re-run through the
enforcement tool at build time. The board is REPLAY, not LIVE, and says so.

Gates (each fails the build):
  tiles       tiles == twin nodes exactly, per unit — the board may not
              simplify a world by omitting its embarrassing tiles
  lamps       every lamp class derives from a tier in the closed set; an
              unknown tier value fails rather than guessing a colour
  mimic       exactly one push-anim node per world; the egress wall drawn
              must agree with the egress node's tier (NO WALL iff none)
  resolution  mandate.py check-branch re-run for every push event and must
              agree with the verdict the log prints
  transcript  every quoted reaction must exist byte-for-byte in its source
  timestamps  derived (mandate issued_at, tag commit time) or an em-dash —
              there is no field for a typed clock time
  replay      the generator greps its own output for the REPLAY chip

Set PY_BIN to a python with `cryptography` (as gen_table.py).
Specified in brief v0.33.69. Genre: SCADA + game HUD conventions, this
estate's sentences — no vendor's mimic art, no specific game's HUD.
"""
import json, os, sys, glob, html, subprocess
from textwrap import shorten

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_scenario import rung_of  # the rung is computed the same way everywhere

GM = os.path.join(ROOT, "packs", "grant-and-mandate")
PY = os.environ.get("PY_BIN", sys.executable)
OUT = os.path.join(ROOT, "experiments", "the-control-room")
esc = lambda s: html.escape(str(s), quote=True)
errors = []

TIERS = {"boundary": "ok", "setting": "set", "expectation": "exp",
         "none": "alarm", "unknown": "fault"}
TIER_WORD = {"ok": "contained", "set": "setting", "exp": "expectation",
             "alarm": "UNBOUNDED", "fault": "FAULT"}

V1 = "packs/grant-and-mandate/mandates/mandate-v1.json"
V2 = "packs/grant-and-mandate/mandates/current.json"
T08 = "book/shots/transcripts/t08-refused-push.txt"
T08B = "book/shots/transcripts/t08b-amended.txt"


def J(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def check_branch(branch, mandate_path):
    r = subprocess.run([PY, os.path.join(GM, "tools", "mandate.py"),
                        "check-branch", branch, os.path.join(ROOT, mandate_path)],
                       capture_output=True, text=True, cwd=ROOT)
    out = (r.stdout + r.stderr).strip()
    if "PERMIT" in out:
        return "PERMIT", out
    if "REFUSED" in out:
        return "REFUSED", out
    return "ERROR", out


def ts(iso):
    """A derived timestamp, displayed; there is no code path for a typed one."""
    return f"{iso[:10]} {iso[11:16]} UTC" if iso and len(iso) >= 16 else "—"


# ── load the worlds — the same files, untouched ─────────────────────────────
worlds = []
for sp in sorted(glob.glob(os.path.join(ROOT, "experiments", "*", "scenario.json"))):
    scn = J(sp)
    tp = os.path.join(ROOT, scn["twin"])
    if not os.path.exists(tp):
        errors.append(f"{scn['id']}: twin {scn['twin']} does not exist")
        continue
    worlds.append((scn, J(tp)))

if len(worlds) < 2:
    errors.append(f"only {len(worlds)} world(s) found — the board exists to show the contrast")

m1, m2 = J(os.path.join(ROOT, V1)), J(os.path.join(ROOT, V2))
t08 = open(os.path.join(ROOT, T08), encoding="utf-8").read()
t08b = open(os.path.join(ROOT, T08B), encoding="utf-8").read()
tag_time = subprocess.run(["git", "-C", ROOT, "log", "-1", "--format=%cI", "v0.1.28"],
                          capture_output=True, text=True).stdout.strip()
if not tag_time:
    errors.append("timestamps: tag v0.1.28 not found — the landing has no derived time")
if not m2.get("issued_at"):
    errors.append("timestamps: mandate v2 carries no issued_at — the DECIDES row has no derived time")


# ── the sequence of events — every verdict re-run, every quote byte-checked ─
SOE = [
 dict(n=1, t=None, actor="the agent", event="git push origin claude/write-book-pdf",
      branch="claude/write-book-pdf", mandate=V1, expect="PERMIT",
      quote="PERMIT   claude/write-book-pdf  (mandate v1", qsrc=T08B,
      note="permitted — and the work crosses to Unit 2, the world without the walls"),
 dict(n=2, t=None, actor="the agent", event="git push origin dev",
      branch="dev", mandate=V1, expect="REFUSED",
      quote="✗ dev  is not permitted by mandate v1", qsrc=T08,
      note="CAN said yes; MAY said no; MAY won — the breaker trips"),
 dict(n=3, t=m2.get("issued_at", ""), actor=m2["issuer"], event=f"DECIDES: amend mandate v1 → v{m2['mandate_version']}",
      branch=None, mandate=None, expect="DECIDES",
      quote=None, qsrc=None,
      note="the operator action — the only signed, timestamped row on this log"),
 dict(n=4, t=tag_time, actor="the agent", event="git push origin dev  (again)",
      branch="dev", mandate=V2, expect="PERMIT",
      quote="PERMIT   dev  (mandate v2", qsrc=T08B,
      note="the site deploys; tag v0.1.28 records the landing"),
]

for e in SOE:
    if e["branch"]:
        verdict, out = check_branch(e["branch"], e["mandate"])
        if verdict != e["expect"]:
            errors.append(f"resolution: event {e['n']} prints {e['expect']} but the tool "
                          f"returned {verdict} — the log may not claim what the tool does not reproduce")
        e["live"] = out.splitlines()[0][:100]
    if e["quote"]:
        raw = open(os.path.join(ROOT, e["qsrc"]), encoding="utf-8").read()
        if e["quote"] not in raw:
            errors.append(f"transcript: event {e['n']}'s quote is not in {e['qsrc']} byte-for-byte")


# ── per-unit derivations ────────────────────────────────────────────────────
def unit_data(idx, scn, twin):
    nodes = twin["nodes"]
    # lamp gate: the tier set is closed
    for n in nodes:
        if str(n.get("tier", "unknown")) not in TIERS:
            errors.append(f"{scn['id']}: node {n['id']} tier '{n.get('tier')}' is outside the "
                          f"closed set — refusing to guess a lamp colour")
    # mimic gate: exactly one push-anim node; egress node found by anim
    pushes = [k for k, d in scn["decor"].items() if d["anim"] == "push"]
    if len(pushes) != 1:
        errors.append(f"{scn['id']}: {len(pushes)} push-anim nodes — the mimic needs exactly one push path")
    egress = [k for k, d in scn["decor"].items() if d["anim"] == "egress"]
    egress_tier = None
    if egress:
        egress_tier = str(next(n for n in nodes if n["id"] == egress[0]).get("tier", "unknown"))
    hook = scn["mandate_slots"]["hook"]["derive"] == "mandate:enforced_by"
    breaker_tier = m2.get("enforced_by", {}).get("tier") if hook else None
    if hook and breaker_tier not in TIERS:
        errors.append(f"{scn['id']}: breaker tier '{breaker_tier}' outside the closed set")
    # stations in chain order (first appearance)
    order, names = [], {p["id"]: p for p in scn["players"]}
    for a, _, b in scn["grant_chain"]:
        for x in (a, b):
            if x not in order:
                order.append(x)
    counts = {}
    for n in nodes:
        c = TIERS[str(n.get("tier", "unknown"))]
        counts[c] = counts.get(c, 0) + 1
    return dict(idx=idx, scn=scn, twin=twin, nodes=nodes, order=order, names=names,
                egress_tier=egress_tier, breaker_tier=breaker_tier, counts=counts)


def mimic_svg(u):
    """The plant as a schematic. Stations on one line; the final edge into the
    asset is the push path (breaker drawn iff the world has a hook); the twin
    station carries the egress branch (wall solid iff boundary; NO WALL iff
    none — and the gate below checks the drawing against the tier)."""
    order, names = u["order"], u["names"]
    # The final edge is the push path and carries a breaker, a dot and a
    # label; at the uniform pitch its 14px gap painted all three over the
    # asset station — the screenshot-read caught it — so that one gap gets
    # EXTRA width and everything else stays on pitch.
    pitch, sw, sy, EXTRA = 106, 92, 56, 34

    def sx(i):
        return 16 + i * pitch + (EXTRA if i == len(order) - 1 else 0)

    W = pitch * len(order) + 26 + EXTRA
    parts = [f'<svg viewBox="0 0 {W} 108" class="mimic" role="img" '
             f'aria-label="mimic diagram: the grant chain of {esc(u["scn"]["title"])}">']
    # edges first (under stations)
    for i in range(len(order) - 1):
        x1, x2 = sx(i) + sw, sx(i + 1)
        final = (i == len(order) - 2)
        cls = "m-edge m-edge--push" if final else "m-edge"
        if final and u["breaker_tier"]:
            mid = (x1 + x2) / 2
            parts.append(f'<line x1="{x1}" y1="{sy + 16}" x2="{mid - 9}" y2="{sy + 16}" class="{cls}"/>')
            parts.append(f'<line x1="{mid + 9}" y1="{sy + 16}" x2="{x2}" y2="{sy + 16}" class="{cls}"/>')
            parts.append(f'<circle cx="{mid - 9}" cy="{sy + 16}" r="2.6" class="m-term"/>'
                         f'<circle cx="{mid + 9}" cy="{sy + 16}" r="2.6" class="m-term"/>')
            parts.append(f'<line x1="{mid - 8}" y1="{sy + 15}" x2="{mid + 7}" y2="{sy + 4}" '
                         f'class="m-blade m-blade--{esc(u["breaker_tier"])}">'
                         f'<title>the mandate hook — {esc(u["breaker_tier"])} tier</title></line>')
            parts.append(f'<text x="{mid}" y="{sy + 34}" class="m-lbl">hook · {esc(u["breaker_tier"])}</text>')
        else:
            parts.append(f'<line x1="{x1}" y1="{sy + 16}" x2="{x2}" y2="{sy + 16}" class="{cls}"/>')
            if final:
                parts.append(f'<text x="{(x1 + x2) / 2}" y="{sy + 34}" class="m-lbl m-lbl--alarm">no interlock</text>')
    # the travelling work item, on the push edge
    px = sx(len(order) - 2) + sw
    parts.append(f'<circle cx="{px + 7}" cy="{sy + 16}" r="4.5" class="m-dot"/>')
    # stations
    for i, pid in enumerate(order):
        p, x = names[pid], sx(i)
        twin_st = p.get("ref") == "twin"
        asset = p.get("kind") == "asset"
        cls = "m-st" + (" m-st--twin" if twin_st else "") + (" m-st--asset" if asset else "")
        parts.append(f'<rect x="{x}" y="{sy}" width="{sw}" height="32" rx="4" class="{cls}">'
                     f'<title>{esc(p["name"])} — {esc(p["kind"])}</title></rect>')
        parts.append(f'<text x="{x + sw / 2}" y="{sy + 20}" class="m-name">{esc(p["name"])}</text>')
        if twin_st:
            parts.append(f'<text x="{x + sw / 2}" y="{sy + 44}" class="m-lbl">THE TWIN</text>')
            # egress branch, up from the twin station
            bx = x + sw / 2
            parts.append(f'<line x1="{bx}" y1="{sy}" x2="{bx}" y2="26" class="m-edge"/>')
            parts.append(f'<line x1="{bx}" y1="26" x2="{bx + 64}" y2="26" class="m-edge"/>')
            parts.append(f'<text x="{bx + 70}" y="30" class="m-lbl m-lbl--l">net</text>')
            if u["egress_tier"] == "boundary":
                parts.append(f'<line x1="{bx + 30}" y1="12" x2="{bx + 30}" y2="40" class="m-wall"/>')
                parts.append(f'<text x="{bx + 30}" y="8" class="m-lbl">proxy · boundary</text>')
            elif u["egress_tier"] == "none":
                parts.append(f'<text x="{bx + 30}" y="12" class="m-lbl m-lbl--alarm">NO WALL</text>')
            elif u["egress_tier"]:
                parts.append(f'<line x1="{bx + 30}" y1="12" x2="{bx + 30}" y2="40" class="m-wall m-wall--dash"/>')
                parts.append(f'<text x="{bx + 30}" y="8" class="m-lbl">{esc(u["egress_tier"])}</text>')
    parts.append("</svg>")
    return "".join(parts)


def unit_html(u):
    uid = f"u{u['idx']}"
    scn, twin = u["scn"], u["twin"]
    radios, tiles, plates = [], [], []
    for j, n in enumerate(twin["nodes"]):
        nid, tier = n["id"], str(n.get("tier", "unknown"))
        lamp = TIERS[tier]
        rid = f"fp-{uid}-{nid}"
        radios.append(f'<input type="radio" name="fp-{uid}" id="{rid}" class="fp-radio"'
                      + (" checked" if j == 0 else "") + ">")
        tiles.append(f'''<label for="{rid}" class="tile tile--{lamp}">
  <span class="tile-id">{esc(nid)}</span><span class="tile-lamp" aria-hidden="true"></span>
  <span class="tile-cap">{esc(shorten(n["capability"], 46, placeholder="…"))}</span>
  <span class="tile-word">{esc(TIER_WORD[lamp])}</span></label>''')
        r, why = rung_of(n)
        pips = "".join(f'<span class="sc-pip{" sc-pip--on" if i < r else ""}"></span>' for i in range(3))
        # n.get("control") can be a JSON null — str() would print "None" on
        # the faceplate, and the screenshot-read caught it doing exactly that
        control = str(n.get("control") or "—")
        plates.append(f'''<div class="fp fp-{uid}-{nid}">
  <div class="fp-head"><b>{esc(nid)}</b> · {esc(n["capability"])}
    <span class="fp-tier fp-tier--{lamp}">{esc(tier)}</span></div>
  <div class="fp-row"><span class="fp-k">evidence</span>{esc(str(n.get("evidence", "none")))}</div>
  <div class="fp-row"><span class="fp-k">rung</span><span class="fp-rung">{pips}</span> {r} — {esc(why)}</div>
  <div class="fp-row"><span class="fp-k">control</span>{esc(shorten(control, 220, placeholder="…"))}</div>
  <div class="fp-row"><span class="fp-k">as of</span>{esc(twin["measured_at"])} ·
    <a href="../../{esc(scn["twin"])}">the twin</a></div>
</div>''')
    hud = " · ".join(f'<span class="hud hud--{c}">{u["counts"][c]} {TIER_WORD[c]}</span>'
                     for c in ("ok", "set", "exp", "alarm", "fault") if u["counts"].get(c))
    return f'''<section class="unit" id="{uid}">
{"".join(radios)}
<div class="unit-head"><span class="unit-no">UNIT {u["idx"]}</span> {esc(scn["title"])}
  <span class="unit-env">{esc(twin["environment"]["product"])} · measured {esc(twin["measured_at"])}</span></div>
<div class="unit-hud">{hud}</div>
{mimic_svg(u)}
<div class="annun" role="list">{"".join(tiles)}</div>
<div class="fp-bay">{"".join(plates)}</div>
</section>'''


def soe_html():
    rows = []
    for e in SOE:
        v = e["expect"].lower()
        quote = (f'<div class="soe-quote">“{esc(e["quote"])}” — <a href="../../{esc(e["qsrc"])}">the transcript</a>'
                 f' · re-run at build: <code>{esc(e.get("live", ""))}</code></div>') if e["quote"] else ""
        rows.append(f'''<li class="soe-row" data-ev="{e["n"]}">
  <span class="soe-n">{e["n"]}</span><span class="soe-t">{esc(ts(e["t"]) if e["t"] else "—")}</span>
  <span class="soe-actor">{esc(e["actor"])}</span>
  <span class="soe-ev">{esc(e["event"])}</span>
  <span class="soe-v soe-v--{esc(v)}">{esc(e["expect"])}</span>
  <div class="soe-note">{esc(e["note"])}</div>{quote}
</li>''')
    return "\n".join(rows)


def main():
    units = [unit_data(i + 1, s, t) for i, (s, t) in enumerate(worlds)]
    if errors:
        print(f"gen_control: {len(errors)} GATE FAILURE(S):")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)

    # per-node CSS for the radio-driven faceplates and tile highlight
    sel = []
    for u in units:
        uid = f"u{u['idx']}"
        for n in u["twin"]["nodes"]:
            rid = f"fp-{uid}-{n['id']}"
            sel.append(f'#{rid}:checked ~ .fp-bay .fp-{uid}-{n["id"]}{{display:block}}')
            sel.append(f'#{rid}:checked ~ .annun label[for="{rid}"]{{outline:2px solid var(--cr-sel);outline-offset:1px}}')
    fp_css = f"<style>{''.join(sel)}</style>"

    reg = open(os.path.join(ROOT, "registry", "index.html"), encoding="utf-8").read()
    nav = reg[reg.index('<nav class="site">'):reg.index('<main')].replace('href="../', 'href="../../').replace('src="../', 'src="../../')
    foot = reg[reg.index('<footer class="site">'):reg.index("</body>")].replace('href="../', 'href="../../').replace('src="../', 'src="../../')

    incident_date = m2.get("issued_at", "")[:10]
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The control room &mdash; a SCADA board over the scenario worlds &middot; pki.sgit.ai</title>
<meta name="description" content="Both scenario worlds on one operator board: mimic diagrams, annunciator tiles lit by tier, faceplates, and the 26 August incident as a replayable sequence of events — every verdict re-run through the enforcement tool at build time.">
<link rel="canonical" href="https://pki.sgit.ai/experiments/the-control-room/index.html">
<meta property="og:url" content="https://pki.sgit.ai/experiments/the-control-room/index.html">
<link rel="stylesheet" href="../../assets/site.css">
<link rel="stylesheet" href="../../assets/bench.css">
<link rel="stylesheet" href="../scenario.css">
<link rel="stylesheet" href="control.css">
{fp_css}
</head>
<body>

{nav}<main class="doc doc--wide">
<div class="crumb"><a href="../../index.html">pki.sgit.ai</a> / <a href="../index.html">experiments</a> / the-control-room</div>

<h1>The control room</h1>
<p class="lead">Both worlds on one operator board. The deck pages read a world one card at a time;
the operator's question is different — <i>what is the state of the whole plant, right now, and what
happened on the 26th?</i> That question has had a canonical answer for fifty years.</p>

<div class="rmark"><b>One more renderer, zero new data.</b> This board is drawn from the <i>same</i>
<code>scenario.json</code> files the deck pages use and the twins they reference — nothing was added
to make it possible, which is what makes the scenario files a world model rather than a page config.
A tile is a twin node; its lamp colour is its <b>tier and nothing else</b>; a sensor that refused
measurement is a <b>FAULT</b> lamp, never a blank; and the log at the bottom re-runs every verdict
through <code>mandate.py</code> at build time. Click any tile for its faceplate.</div>

<div class="ctrl" id="board">
<div class="ctrl-head"><span class="ctrl-title">GRANT &amp; MANDATE BOARD</span>
  <span class="mode-chip" title="This board replays recorded artefacts. It is not a live feed: the registry write path, monitors and a mandate service — the things a LIVE board needs — are all still stated design.">REPLAY · {esc(incident_date)}</span></div>

<div class="ctrl-units">
{units and "".join(unit_html(u) for u in units)}
</div>

<div class="soe">
<div class="soe-head"><span>SEQUENCE OF EVENTS — the 26 August incident</span>
  <span class="soe-ctl" hidden>
    <button type="button" id="soe-play">▶ play</button>
    <button type="button" id="soe-step">⏭ step</button>
    <button type="button" id="soe-reset">↺ reset</button></span></div>
<div class="soe-cols"><span>#</span><span>time (derived)</span><span>actor</span><span>event</span><span>verdict</span></div>
<ol class="soe-log">
{soe_html()}
</ol>
<p class="soe-foot">Times are derived or absent: the DECIDES row prints mandate v2's own
<code>issued_at</code>; the landing prints the <code>v0.1.28</code> tag's commit time from git; the
transcript records the refusal, not the clock, so those rows print a dash. The replay is baked, not
computed — the browser only steps through verdicts the build already re-proved.</p>
</div>

<div class="ctrl-legend">LAMP GRAMMAR — the tier, and nothing else:
  <span class="lg lg--ok">contained</span> boundary ·
  <span class="lg lg--set">setting</span> outside the loop, inside the grant ·
  <span class="lg lg--exp">expectation</span> flashing — one mistake from red ·
  <span class="lg lg--alarm">UNBOUNDED</span> a capability with no control on it is the alarm state ·
  <span class="lg lg--fault">FAULT</span> measurement refused — a hole, displayed</div>
</div>

<p class="dr-notprove"><b>What this board does not claim.</b> Two units and one recorded incident is
a diorama with excellent manners, not a control room under load: nothing here shows the annunciator
scaling past twenty tiles, the log past one incident, or an operator acting on any of it. REPLAY
never becomes LIVE on this page — a live board needs the registry's write path, monitors feeding
facts, and a mandate service, all still stated design. And the genre bet — that a mimic reads
faster than a table — is now four implementations deep across two estates with zero user tests.</p>

<p class="dr-src">Renderer: <code>admin/build/gen_control.py</code> &middot; specified in
<a href="../../briefs/v0.33.69__dev-brief__the-control-room-a-scada-board-and-game-hud-over-the-scenario-worlds.md">brief v0.33.69</a>
&middot; gates: tiles == twin nodes per unit; lamp classes closed over the five tiers; the wall
drawn must agree with the egress tier; every verdict re-run through the tool; every quote
byte-checked; timestamps derived or absent; the REPLAY chip checked in the output.</p>
</main>

<script src="control.js" defer></script>
{foot}
</body>
</html>
'''

    # ── self-grep gates on the finished drawing ─────────────────────────────
    if "REPLAY ·" not in page:
        errors.append("replay: the mode chip is absent from the board")
    for u in units:
        has_nowall = u["egress_tier"] == "none"
        if has_nowall and "NO WALL" not in page:
            errors.append(f"mimic: unit {u['idx']} egress tier is none and the board does not print NO WALL")
    if u["egress_tier"] != "none" and page.count("NO WALL") != sum(1 for x in units if x["egress_tier"] == "none"):
        errors.append("mimic: NO WALL printed a different number of times than worlds that earn it")
    if errors:
        print(f"gen_control: {len(errors)} GATE FAILURE(S):")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)
    tiles = sum(len(u["twin"]["nodes"]) for u in units)
    print(f"gen_control: {len(units)} units, {tiles} tiles, {len(SOE)} events "
          f"(every verdict re-run) -> experiments/the-control-room/index.html")


if __name__ == "__main__":
    main()
