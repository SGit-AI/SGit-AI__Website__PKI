#!/usr/bin/env python3
"""gen_room.py — the chain room: the RiskMandate workflow as a playable simulation.

One room at /room/, eight stations, the product boundary drawn on the floor.
The LEFT half is real: this estate's measured library entry, its signed mandate,
its computed excess row. The RIGHT half is SYNTHETIC and says so on every
surface, per the estate's simulation rules (the marker lives in the filename,
the headers and beside every quote, because export is where markers die).

Every word the room speaks is derived here, at build time, from the same files
the pipeline runs on. Nothing about state is hand-written.

Gates (each fails the build):
  route     the station order drawn must equal the declared chain
  boundary  the instance fixture stores REFERENCES, NEVER COPIES (GM3)
  decision  the fixture's acceptance carries a named acceptor AND an interval
  observed  a condition's `holding` must be backed by an observed_as_of —
            a status that is typed rather than observed fails
  marker    every synthetic station's dialogue carries the SYNTHETIC marker

Genre from newsroom.sgit.ai brief 10 (CC BY 4.0): the grammar, not the work —
original figures, this site's palette, our verbs.  Specified in brief v0.33.66.
"""
import json, os, sys, html, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GM = os.path.join(ROOT, "packs", "grant-and-mandate")


def J(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def esc(s):
    return html.escape(str(s), quote=True)


# ── the declared chain (the ordering rule, Grant & Mandate document 01) ─────
CHAIN = ["reality", "twin", "facts", "finding", "risks", "decisions", "monitoring"]

errors = []

# ── load the real artefacts ─────────────────────────────────────────────────
fixture_path = os.path.join(GM, "instance-fixture.synthetic.json")
fx = J(fixture_path)
entry = J(os.path.join(GM, "library", fx["references"]["library_entry"] + ".json"))
mandate = J(os.path.join(GM, "mandates", "current.json"))
excess = J(os.path.join(ROOT, "registry", "views", "excess-authority.json"))["rows"][0]

stmts = [f for d in sorted(os.listdir(os.path.join(ROOT, "registry", "records")))
         for f in os.listdir(os.path.join(ROOT, "registry", "records", d))
         if f.endswith(".json") and f != "record.json"]
n_records = len(os.listdir(os.path.join(ROOT, "registry", "records")))
n_stmts = len(stmts)

nodes = entry["nodes"]
n_nodes = len(nodes)
n_unknown = sum(1 for n in nodes if n.get("tier") == "unknown")
branches = [b for r in mandate["allow"] for b in r["constraints"]["branches"]]

# ── gate: the fixture ───────────────────────────────────────────────────────
if ".synthetic." not in os.path.basename(fixture_path):
    errors.append("marker: the fixture's filename must carry .synthetic. — the marker lives in the filename")
if not fx.get("synthetic") or "_illustrative" not in fx:
    errors.append("marker: the fixture must carry synthetic:true and an _illustrative header")

FORBIDDEN_KEYS = {"nodes", "reaches", "reachable", "tier", "control", "method"}
def scan_for_copies(obj, path="fixture"):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in FORBIDDEN_KEYS:
                errors.append(f"boundary (GM3): the instance fixture embeds {path}.{k} — "
                              f"REFERENCES, NEVER COPIES; a copy keeps the stale answer silently")
            scan_for_copies(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            scan_for_copies(v, f"{path}[{i}]")
scan_for_copies(fx)

dec = fx["decision"]
if not dec.get("acceptor"):
    errors.append("decision: the acceptance has no named acceptor — a decision missing one is nobody's")
if not dec.get("expires_at"):
    errors.append("decision: the acceptance has no interval — without one it is a grant under another name")

for c in fx["conditions"]:
    if c["holding"] and not c.get("observed_as_of"):
        errors.append(f"observed: condition {c['id']} claims holding with no observed_as_of — "
                      f"a status is observed, never typed")

n_holding = sum(1 for c in fx["conditions"] if c["holding"] and c.get("observed_as_of"))
n_conditions = len(fx["conditions"])
never_held = [c for c in fx["conditions"] if not c["holding"]]

as_of = datetime.date.fromisoformat(fx["as_of"])
expires = datetime.date.fromisoformat(dec["expires_at"][:10])
days_left = (expires - as_of).days

SYN = "SYNTHETIC · illustrative — "   # the marker, beside every quote

# ── the stations, and everything they say (all derived) ─────────────────────
g_res, m_res = excess["grant"]["resources"], excess["mandate"]["resources"]
x_res = excess["excess_authority"]["resources"]

STATIONS = [
 dict(id="reality", chain="reality", x=95, y=145, syn=False, prop="cube",
   name="Reality", role="the environment, as installed",
   look=f"The environment itself — {entry['environment']['product']}, a {entry['environment']['surface'].split(',')[0]}. Not a desk: everything else in this room measures, records or constrains it.",
   ask="I hold whatever I was installed with. Nobody decided most of it.",
   door="Nothing. Reality is where the chain starts; it owes the room no conditions.",
   never="Stand still. I change on my vendor's schedule, which is why every fact about me carries a date."),
 dict(id="measurer", chain="twin", x=320, y=145, syn=False, prop="ruler",
   name="The Measurer", role="runs measure.py inside the twin",
   look="Runs the published measurement inside the environment and writes down only what it can see: presence and reachability, never contents.",
   ask=f"The twin's grant: {n_nodes} nodes, {n_unknown} of them unknown — my self-measurement probe was refused, and a refused probe is recorded unknown, never guessed. I am a floor, not a census, and I say so on my face.",
   door="An as_of on every node. An undated measurement is a wish with a ruler.",
   never="Guess. A node I could not evidence is marked, not dropped — and not invented."),
 dict(id="counter", chain="facts", x=545, y=145, syn=False, prop="ledger",
   name="The Counter", role="the registry: registers, holds, has no opinion",
   look="The register. Signed statements at public addresses — identities, facts, mandates — fetchable by anybody with no account.",
   ask=f"{n_stmts} statements across {n_records} records. Which would you like? I hand out documents, not answers.",
   door="Rule 1: only the owner writes to their own record. A valid signature by a non-owner is the 2019 failure, not write authority.",
   never="Hold an opinion. An opinion needs context, and the context is yours, not mine. I register."),
 dict(id="issuer", chain="facts", x=770, y=145, syn=False, prop="stamp",
   name="The Issuer", role="authors the mandate",
   look="Where authorisation gets decided and written down — the one document nothing else in the industry provides.",
   ask=f"Mandate v{mandate['mandate_version']}: {', '.join(branches)} on one repository, expiring {mandate['expires_at'][:10]}. The allow-list is stored; what a person accepts are the prohibitions rendered from it.",
   door="An interval. A mandate without one is a grant under another name, and I will not sign it.",
   never="Show the allow-list for approval. Forty permitted operations produce consent without comprehension."),
 dict(id="delta", chain="finding", x=995, y=145, syn=False, prop="delta",
   name="The Delta Desk", role="computes on approach — a desk with no drawers",
   look="A desk with no drawers. There is nothing in it, deliberately: a stored delta is stale the moment either side moves.",
   ask=f"Nothing — I compute when you arrive. Just now: grant {g_res} resources, mandate {m_res} → excess {x_res}, acceptor: none. That last field is why the room continues past me.",
   door="Both documents, fresh. Give me a stale grant and I will hand you a confident wrong number.",
   never="Store a result. Ask me again and I will compute it again."),
 dict(id="risk", chain="risks", x=995, y=470, syn=True, prop="gauge",
   name="The Risk Desk", role="derives risk at the business altitude",
   look=f"{SYN}Where a finding becomes a risk — at an altitude, in that altitude's language, on somebody's authority. The registry's half ended at the delta desk; everything on this side of the line is the instance's.",
   ask=f"{SYN}Risk {fx['risk']['score']} · {fx['risk']['band'].upper()} — “{fx['risk']['altitude_reading']}” Blast radius: {fx['risk']['blast_radius']}.",
   door=f"{SYN}A finding to derive from, by reference. I do not read raw environments and I hold no copies.",
   never=f"{SYN}Reach across the line for personal data. I work from references into the public library."),
 dict(id="acceptance", chain="decisions", x=660, y=470, syn=True, prop="card",
   name="The Acceptance", role="the card: owner, interval, reviewer",
   look=f"{SYN}The decision, as a card. Left of the line the excess row reads acceptor: none; here, for the first time in the chain, the exposure has an owner.",
   ask=f"{SYN}“{fx['risk']['title']}” — accepted by {dec['acceptor']}, expires in {days_left} days, reviewer: {dec['reviewer']}. Status: {dec['status']}.",
   door=f"{SYN}A named acceptor AND an interval. Missing either, I refuse the work — that is not caution, it is the definition.",
   never=f"{SYN}Accept on nobody's behalf. The null acceptor stays on the other side of the line."),
 dict(id="monitor", chain="monitoring", x=325, y=470, syn=True, prop="clock",
   name="The Monitor", role="conditions observed and holding; the clock runs",
   look=f"{SYN}The card is not a certificate — it is a live join between a decision and a stream of measurements. Each condition is checked, and checked again.",
   ask=f"{SYN}{n_holding} of {n_conditions} conditions holding as of {fx['as_of']}. "
       + (f"Condition {never_held[0]['id']} has never held: {never_held[0]['why_not']}. " if never_held else "")
       + f"Expiry in {days_left} days — and at expiry the item walks back across the line to be re-measured, re-computed and re-decided.",
   door=f"{SYN}Evidence with an as_of for every condition. A status that is typed rather than observed is not a status.",
   never=f"{SYN}Let the clock stop. An acceptance that outlives its interval is a grant wearing a decision's clothes."),
]

# the boundary — on the route, not in the chain
BOUNDARY = dict(id="boundary", name="The Boundary", syn=False,
  look="The line between the two products, drawn on the floor. The registry holds the library: public, no personal data, ever. The instance holds the decisions: private, never published.",
  ask="Traffic: references, crossing. A reference is a library identifier — a corrected entry improves every instance that holds one. A copy would keep the stale answer silently, so copies bounce.",
  door="For anything crossing rightward: be a reference. For anything crossing leftward: be nothing.",
  never="Let personal data cross into the library. Not compressed, not hashed, not summarised. Never.")

# ── gate: the route ─────────────────────────────────────────────────────────
route = []
for s in STATIONS:
    if not route or route[-1] != s["chain"]:
        route.append(s["chain"])
if route != CHAIN:
    errors.append(f"route: the room draws {route} but the declared chain is {CHAIN} — "
                  f"the room may not draw a route through a workflow that does not exist")

# ── gate: markers ───────────────────────────────────────────────────────────
for s in STATIONS:
    if s["syn"]:
        for verb in ("look", "ask", "door", "never"):
            if not s[verb].startswith(SYN):
                errors.append(f"marker: synthetic station {s['id']}.{verb} does not carry the marker")

if errors:
    print(f"gen_room: {len(errors)} GATE FAILURE(S):")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)

# ── the play-through (every caption derived, every stop linking its artefact) ─
PLAY = [
 dict(at="reality", text=f"The environment enters: {entry['environment']['product']}, as installed on {entry['measured_at']}.",
      href="../packs/grant-and-mandate/library/" + fx["references"]["library_entry"] + ".json", label="the library entry"),
 dict(at="measurer", text=f"Measured from inside: {n_nodes} nodes, {n_unknown} unknown — the self-measurement probe was refused. A floor, not a census.",
      href="../packs/grant-and-mandate/library.html", label="the measurement method"),
 dict(at="counter", text=f"Registered: the grant joins {n_stmts} signed statements in {n_records} records. The counter has no opinion about any of them.",
      href="../registry/llms.txt", label="the register's front door"),
 dict(at="issuer", text=f"Authorised: mandate v{mandate['mandate_version']} — {', '.join(branches)}, expiring {mandate['expires_at'][:10]}. Somebody decided, and signed.",
      href="../packs/grant-and-mandate/mandates/current.json", label="the signed mandate"),
 dict(at="delta", text=f"Computed on arrival: grant {g_res} resources − mandate {m_res} → excess {x_res}. Acceptor: none — nobody has accepted this, yet.",
      href="../registry/views/excess-authority.json", label="the excess row"),
 dict(at="boundary", text="The finding crosses as a REFERENCE — a library identifier, not a copy. Personal data never crosses the other way.",
      href="../book/12-the-library-and-the-instance.html", label="the contract (book ch. 12)"),
 dict(at="acceptance", text=f"{SYN}Risk {fx['risk']['score']} · {fx['risk']['band']} is derived and ACCEPTED — by {dec['acceptor']}, for {days_left} days, reviewed by {dec['reviewer']}. The exposure has an owner for the first time in the chain.",
      href="../packs/grant-and-mandate/instance-fixture.synthetic.json", label="the instance fixture (synthetic)"),
 dict(at="monitor", text=f"{SYN}Monitored: {n_holding} of {n_conditions} conditions holding" + (f"; {never_held[0]['id']} has never held ({never_held[0]['why_not']})" if never_held else "") + f". In {days_left} days the interval ends and the item walks back across the line: re-measured, re-computed, re-decided.",
      href="../packs/grant-and-mandate/instance-fixture.synthetic.json", label="the conditions (synthetic)"),
]

# ── svg ─────────────────────────────────────────────────────────────────────
def prop_svg(kind, x, y):
    if kind == "cube":
        return (f'<path d="M{x-16},{y-6} l16,-9 l16,9 l0,18 l-16,9 l-16,-9 z" class="rp"/>'
                f'<path d="M{x-16},{y-6} l16,9 l16,-9 M{x},{y+3} l0,18" class="rp"/>')
    if kind == "ruler":
        return (f'<rect x="{x-18}" y="{y-4}" width="36" height="12" rx="2" class="rp"/>'
                + "".join(f'<line x1="{x-12+i*8}" y1="{y-4}" x2="{x-12+i*8}" y2="{y+2}" class="rp"/>' for i in range(4)))
    if kind == "ledger":
        return "".join(f'<rect x="{x-15}" y="{y-8+i*7}" width="30" height="5" rx="1" class="rp"/>' for i in range(3))
    if kind == "stamp":
        return (f'<rect x="{x-5}" y="{y-10}" width="10" height="12" rx="2" class="rp"/>'
                f'<rect x="{x-14}" y="{y+2}" width="28" height="6" rx="2" class="rp"/>')
    if kind == "delta":
        return f'<path d="M{x},{y-11} L{x+14},{y+9} L{x-14},{y+9} Z" class="rp"/>'
    if kind == "gauge":
        return (f'<path d="M{x-15},{y+7} A15,15 0 0 1 {x+15},{y+7}" class="rp"/>'
                f'<line x1="{x}" y1="{y+7}" x2="{x+9}" y2="{y-4}" class="rp"/>')
    if kind == "card":
        return (f'<rect x="{x-17}" y="{y-9}" width="34" height="21" rx="2" class="rp"/>'
                f'<line x1="{x-12}" y1="{y+6}" x2="{x+4}" y2="{y+6}" class="rp"/>'
                f'<line x1="{x-12}" y1="{y-2}" x2="{x+12}" y2="{y-2}" class="rp"/>')
    if kind == "clock":
        return (f'<circle cx="{x}" cy="{y}" r="13" class="rp"/>'
                f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y-8}" class="rp"/>'
                f'<line x1="{x}" y1="{y}" x2="{x+6}" y2="{y+3}" class="rp"/>')
    return ""


def figure(s):
    x, y = s["x"], s["y"]
    person = "" if s["id"] == "reality" else (
        f'<circle cx="{x}" cy="{y-46}" r="10" class="rf"/>'
        f'<path d="M{x-16},{y-22} a16,14 0 0 1 32,0" class="rf"/>')
    badge = f'<g class="rsyn-badge"><rect x="{x-46}" y="{y-84}" width="92" height="15" rx="3"/><text x="{x}" y="{y-73}">SYNTHETIC</text></g>' if s["syn"] else ""
    return f'''<g class="rst{' rst--syn' if s['syn'] else ''}" id="st-{s['id']}" tabindex="0" role="button"
   aria-label="{esc(s['name'])} — {esc(s['role'])}{'; synthetic, illustrative' if s['syn'] else ''}" data-id="{s['id']}">
  <rect x="{x-72}" y="{y-92}" width="144" height="132" rx="10" class="rhit"/>
  <rect x="{x-58}" y="{y-64}" width="116" height="86" rx="8" class="rdesk"/>
  {person}{prop_svg(s['prop'], x, y + (4 if s['id']=='reality' else 6))}
  <rect x="{x-58}" y="{y+26}" width="116" height="17" rx="3" class="rplate"/>
  <text x="{x}" y="{y+38.5}" class="rname">{esc(s['name'])}</text>
  {badge}
</g>'''


# the route, boustrophedon, crossing the boundary between delta and risk
pts = [(s["x"], s["y"]) for s in STATIONS]
route_d = (f"M{pts[0][0]},{pts[0][1]+52} " + " ".join(f"L{x},{y+52}" for x, y in pts[1:5])
           + f" L{pts[5][0]},{pts[5][1]-96} " + " ".join(f"L{x},{y-96}" for x, y in pts[5:]))

stations_svg = "\n".join(figure(s) for s in STATIONS)

SVG = f'''<svg viewBox="0 0 1100 585" class="room-svg" role="img"
  aria-label="The chain room: eight stations from reality to monitoring, with the product boundary drawn across the floor between the delta desk and the risk desk">
  <rect x="0" y="0" width="1100" height="246" class="rzone rzone--pki"/>
  <rect x="0" y="272" width="1100" height="313" class="rzone rzone--rm"/>
  <text x="18" y="26" class="rzlabel">pki.sgit.ai &mdash; THE LIBRARY &middot; real artefacts, fetchable below every desk</text>
  <text x="18" y="298" class="rzlabel rzlabel--syn">riskmandate.ai &mdash; THE INSTANCE &middot; SYNTHETIC, illustrative &mdash; no risk has been derived, priced, accepted or monitored by anybody</text>

  <g class="rbound" id="st-boundary" tabindex="0" role="button" data-id="boundary"
     aria-label="The boundary between the two products: references cross, copies bounce, personal data never crosses into the library">
    <rect x="0" y="246" width="1100" height="26" class="rbound-band"/>
    <text x="550" y="263" class="rbound-t">THE BOUNDARY &mdash; references cross &middot; copies bounce &middot; personal data never crosses up</text>
  </g>

  <path d="{route_d}" class="rroute" fill="none"/>
  <path d="M{pts[7][0]-58},{pts[7][1]-40} C 85,415 85,180 {pts[1][0]-62},{pts[1][1]+24}" class="rloop" fill="none"/>
  <text x="70" y="326" class="rloop-t rloop-t--dark">at expiry: back across the line &mdash;</text>
  <text x="70" y="341" class="rloop-t rloop-t--dark">re-measured, re-computed, re-decided</text>

  {stations_svg}
  <circle id="token" cx="{pts[0][0]}" cy="{pts[0][1]+52}" r="7" class="rtoken"/>
</svg>'''

# ── page ────────────────────────────────────────────────────────────────────
lines = {s["id"]: {v: s[v] for v in ("look", "ask", "door", "never")} for s in STATIONS}
lines["boundary"] = {v: BOUNDARY[v] for v in ("look", "ask", "door", "never")}
names = {s["id"]: s["name"] for s in STATIONS}
names["boundary"] = BOUNDARY["name"]
syn_ids = [s["id"] for s in STATIONS if s["syn"]]
coords = {s["id"]: [s["x"], s["y"]] for s in STATIONS}
coords["boundary"] = [550, 259]

DATA = json.dumps({"lines": lines, "names": names, "syn": syn_ids,
                   "coords": coords, "play": PLAY}, ensure_ascii=False)

reg_src = open(os.path.join(ROOT, "registry", "index.html"), encoding="utf-8").read()
nav = reg_src[reg_src.index('<nav class="site">'):reg_src.index('<main')]
foot = reg_src[reg_src.index('<footer class="site">'):reg_src.index("</body>")]

transcript = "\n".join(
    f"<h3>{esc(names[i])}{' <em>(synthetic, illustrative)</em>' if i in syn_ids else ''}</h3><dl>"
    + "".join(f"<dt>{v.upper()}</dt><dd>{esc(lines[i][v])}</dd>" for v in ("look", "ask", "door", "never"))
    + "</dl>"
    for i in list(names))

playlist = "\n".join(
    f'<li>{esc(p["text"])} <a href="{esc(p["href"])}">{esc(p["label"])}</a></li>' for p in PLAY)

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The chain room &mdash; the RiskMandate workflow, playable &middot; pki.sgit.ai</title>
<meta name="description" content="The full chain — reality, twin, facts, finding, risks, decisions, monitoring — as a room you can walk: eight stations, the product boundary drawn on the floor, a work item that travels it. The left half is real artefacts; the right half is a marked simulation, because the workflow is simulated first, then supported.">
<link rel="canonical" href="https://pki.sgit.ai/room/index.html">
<meta property="og:url" content="https://pki.sgit.ai/room/index.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/bench.css">
<link rel="stylesheet" href="room.css">
</head>
<body>

{nav}<main class="doc doc--wide">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / room</div>

<h1>The chain room</h1>
<p class="lead">The workflow this estate exists to serve, walked end to end:
<code>reality &rarr; twin &rarr; facts &rarr; finding</code> on this side of the line,
<code>risks &rarr; decisions &rarr; monitoring</code> on the other. <b>Pick a verb, then a
station.</b> Or <button id="play" class="rplay">&#9654; run the walk</button></p>

<div class="rmark"><b>The left half of this room is real</b> &mdash; every desk stands on a fetchable
artefact: the measured library entry, the signed mandate, the computed excess row.
<b>The right half is SYNTHETIC and marked on every surface</b>: no risk has been derived, priced,
accepted or monitored by anybody. The workflow is <b>simulated first, then supported</b> &mdash;
the same way this register taught its shape with ten labelled fixtures before one real record
existed. Fixture: <a href="../packs/grant-and-mandate/instance-fixture.synthetic.json">instance-fixture.synthetic.json</a>.</div>

<div class="rverbs" role="toolbar" aria-label="Verbs">
  <button class="rverb rverb--on" data-v="look">LOOK</button>
  <button class="rverb" data-v="ask">ASK</button>
  <button class="rverb" data-v="door">DOOR</button>
  <button class="rverb" data-v="never">NEVER</button>
  <span class="rverb-hint">what is this &middot; what are you holding &middot; what must be true before work moves &middot; what do you refuse</span>
</div>

<div class="rwrap">{SVG}</div>

<div class="rsay" id="say" aria-live="polite">
  <div class="rsay-head" id="say-head">The room</div>
  <div class="rsay-body" id="say-body">Every word spoken here is derived at build time from the same
files the pipeline runs on &mdash; nothing about state is hand-written. Click a verb, then a desk.
The boundary is clickable too.</div>
</div>

<details class="rplaylist"><summary>The walk, as text (the same eight stops the button plays)</summary>
<ol>{playlist}</ol></details>

<noscript><div class="rmark"><b>Without JavaScript, the room speaks here instead:</b></div>
{transcript}</noscript>

<p class="dr-notprove"><b>What this room does not claim.</b> The right half is invented, and labelled
&mdash; it teaches the workflow's shape and is not evidence the shape works. The genre is the
point-and-click adventure's grammar with this estate's own sentences, figures, palette and verbs,
ported from <a href="https://newsroom.sgit.ai/briefs/10__the-newsroom-floor.md">newsroom.sgit.ai's
debrief</a> (CC BY 4.0) whose own limits carry over: the genre has one prior implementation, unread
by users, untested with screen readers. And the room opens none of
<a href="../registry/doors.html">the nine shut doors</a> &mdash; it makes one of them, <i>nobody has
ever accepted an exposure</i>, explainable to the person who might.</p>

<p class="dr-src">Specified in <a href="../briefs/v0.33.66__dev-brief__the-chain-room-the-riskmandate-workflow-as-a-playable-simulation.md">brief
v0.33.66</a> &middot; generator <code>admin/build/gen_room.py</code> &middot; gates: route = declared
chain; the fixture stores references, never copies (GM3); a decision carries a named acceptor and an
interval; a condition's status is observed, never typed; the synthetic marker travels with every
quote.</p>

</main>

{foot}
<script>
const D={DATA};
let verb="look";
const say=(h,b)=>{{document.getElementById("say-head").textContent=h;
  document.getElementById("say-body").textContent=b;}};
document.querySelectorAll(".rverb").forEach(b=>b.onclick=()=>{{
  verb=b.dataset.v;
  document.querySelectorAll(".rverb").forEach(x=>x.classList.toggle("rverb--on",x===b));}});
const speak=id=>{{const syn=D.syn.includes(id);
  say(D.names[id]+" · "+verb.toUpperCase()+(syn?"   [SYNTHETIC · illustrative]":""),D.lines[id][verb]);}};
document.querySelectorAll("[data-id]").forEach(g=>{{
  g.addEventListener("click",()=>speak(g.dataset.id));
  g.addEventListener("keydown",e=>{{if(e.key==="Enter"||e.key===" "){{e.preventDefault();speak(g.dataset.id);}}}});}});
const tok=document.getElementById("token");
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let playing=false;
document.getElementById("play").onclick=async()=>{{
  if(playing)return; playing=true;
  for(const p of D.play){{
    const [x,y]=D.coords[p.at];
    const ty=p.at==="boundary"?y:(y<300?y+52:y-96);
    tok.style.transition=reduce?"none":"cx .8s ease, cy .8s ease";
    tok.setAttribute("cx",x); tok.setAttribute("cy",ty);
    say("The walk · "+D.names[p.at]+(D.syn.includes(p.at)||p.text.startsWith("SYNTHETIC")?"   [SYNTHETIC · illustrative]":""),p.text);
    document.querySelectorAll(".rst,.rbound").forEach(g=>g.classList.toggle("rst--here",g.dataset.id===p.at));
    await new Promise(r=>setTimeout(r,reduce?1400:2100));
  }}
  playing=false;
}};
</script>
</body>
</html>
'''
os.makedirs(os.path.join(ROOT, "room"), exist_ok=True)
with open(os.path.join(ROOT, "room", "index.html"), "w", encoding="utf-8") as f:
    f.write(page)

# marker gate on the OUTPUT, last: every synthetic dialogue line rendered must
# carry the marker (grep our own output, per the simulation rules)
out = page
for sid in syn_ids:
    for v in ("look", "ask", "door", "never"):
        if lines[sid][v][:20] not in out:
            errors.append(f"marker: {sid}.{v} did not reach the output intact")
if SYN not in out:
    errors.append("marker: the SYNTHETIC marker string is absent from the output")

if errors:
    print(f"gen_room: {len(errors)} GATE FAILURE(S):")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)

print(f"gen_room: 8 stations + the boundary, route == declared chain, "
      f"{n_holding}/{n_conditions} conditions holding, {days_left} days to expiry "
      f"-> room/index.html")
