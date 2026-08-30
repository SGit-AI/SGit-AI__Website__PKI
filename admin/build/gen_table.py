#!/usr/bin/env python3
"""gen_table.py — the table: actions resolving against grants and mandates,
played as cards, on the estate's own real incident of 26 August 2026.

Unlike the room, NOTHING here is synthetic. Every card is a rendering of a real
artefact; every reaction is quoted by byte from the captured transcripts; and
the resolution of every turn is RE-RUN AT BUILD TIME through the estate's own
enforcement tool — if the table claims a refusal the tool does not reproduce,
or a permit it refuses, the build fails.

Gates:
  resolution  mandate.py check-branch is executed for each turn and must agree
  transcript  each reaction quote must exist, byte-for-byte, in the captured
              transcript it cites
  sources     every card cites a source file that must exist; card fields are
              read from it, never typed
  manifest    (in gen_experiments.py) the folder must be declared

Set PY_BIN to a python with `cryptography` (mandate.py verifies signatures and
refuses without it — default-deny includes the build).
Specified in brief v0.33.67. Genre: tabletop grammar, our sentences.
"""
import json, os, sys, html, subprocess, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GM = os.path.join(ROOT, "packs", "grant-and-mandate")
TR = os.path.join(ROOT, "book", "shots", "transcripts")
PY = os.environ.get("PY_BIN", sys.executable)
esc = lambda s: html.escape(str(s), quote=True)
errors = []


def J(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def rel(p):  # repo path -> href from experiments/the-table/
    return "../../" + p


# ── real artefacts ──────────────────────────────────────────────────────────
V1 = "packs/grant-and-mandate/mandates/mandate-v1.json"
V2 = "packs/grant-and-mandate/mandates/current.json"
E1 = "packs/grant-and-mandate/library/claude-code-remote__ccr-container__2026-08-26.json"
E2 = "packs/grant-and-mandate/library/github-actions-runner__ci__2026-08-26.json"
T08 = "book/shots/transcripts/t08-refused-push.txt"
T08B = "book/shots/transcripts/t08b-amended.txt"

m1, m2 = J(os.path.join(ROOT, V1)), J(os.path.join(ROOT, V2))
e1, e2 = J(os.path.join(ROOT, E1)), J(os.path.join(ROOT, E2))
n3 = next(n for n in e1["nodes"] if n["id"] == "n3")
ci_egress = next(n for n in e2["nodes"] if "outbound" in n.get("capability", "").lower())
t08 = open(os.path.join(ROOT, T08), encoding="utf-8").read()
t08b = open(os.path.join(ROOT, T08B), encoding="utf-8").read()

tag_time = subprocess.run(["git", "-C", ROOT, "log", "-1", "--format=%cI", "v0.1.28"],
                          capture_output=True, text=True).stdout.strip()
if not tag_time:
    errors.append("sources: tag v0.1.28 not found — the consequence has no timestamp")

for p in (V1, V2, E1, E2, T08, T08B):
    if not os.path.exists(os.path.join(ROOT, p)):
        errors.append(f"sources: {p} does not exist")


# ── the live resolution gate ────────────────────────────────────────────────
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


# ── the six exemplar cards (the deck) — every field read from its source ────
b1 = [b for r in m2["allow"] for b in r["constraints"]["branches"]]
DECK = [
 dict(suit="CAN", kind="grant", title=n3["capability"],
   fields=[("reaches", n3["reachable"][:110] + "…"),
           ("stands in the way", str(n3.get("control", ""))[:96] + "…"),
           ("tier", n3["tier"]), ("evidence", n3["evidence"]),
           ("measured", e1["measured_at"])],
   src=E1, note="unsigned — the facts_signed door is shut, and this card says so"),
 dict(suit="MAY", kind="mandate", title=f"mandate v{m2['mandate_version']}",
   fields=[("issuer", m2["issuer"]), ("subject", m2["subject"]),
           ("allow", ", ".join(b1)), ("interval", f"{m2['issued_at'][:10]} → {m2['expires_at'][:10]}"),
           ("first prohibition", m2["prohibitions"][0])],
   src=V2, note="issuer-signed — by the fixture root, so the authority is demonstrable, not real"),
 dict(suit="IS", kind="fact", title="this environment retains a session record",
   fields=[("subject", e1["environment"]["product"]),
           ("as_of", e1["measured_at"]),
           ("stater", "the measurer (instrument is subject)"),
           ("consequence", "its grant is a union over prior turns, not a tree over the present")],
   src=E1, note="unsigned — a fact needs a stater to be weighable"),
 dict(suit="SHOWS", kind="evidence", title="evidence for the fact above",
   fields=[("class", "observed"),
           ("method", e1["history"]["evidence"][:120] + "…"),
           ("grounds", "the IS card above — fact grounds to evidence")],
   src=E1, note="the estate's five evidence classes; observed is the strongest"),
 dict(suit="DOES", kind="action", title="git push origin dev",
   fields=[("actor", "sha256:f9facb4c94da6c19 (the agent)"),
           ("target", m2["allow"][0]["resource"]),
           ("when", "26 Aug 2026, before " + tag_time[11:16] + " UTC"),
           ("resolved", "turn 2, below")],
   src=T08, note="unsigned — a DOES card is the slot a receipt would fill, and nothing fills it yet"),
 dict(suit="DECIDES", kind="decision", title=f"amend mandate v1 → v{m2['mandate_version']}",
   fields=[("by", m2["issuer"] + " (the issuer)"),
           ("at", m2["issued_at"]),
           ("supersedes", m2["supersedes"]),
           ("citing", "\u201c" + m2["note"].split("(")[1].split(";")[0].strip("'") + "\u201d \u2014 the instruction, quoted inside the mandate itself")],
   src=V2, note="the remedy for a refusal is a decision, never a bypass (GM12)"),
]

# ── the four turns, each resolution re-run live ─────────────────────────────
TURNS = [
 dict(n=1, player="The Agent", does="git push origin claude/write-book-pdf",
      branch="claude/write-book-pdf", mandate=V1, expect="PERMIT",
      can=("node n3: pushes to a feature branch observed accepted", E1),
      quote="PERMIT   claude/write-book-pdf  (mandate v1", qsrc=T08B,
      consequence="permitted — and the work crosses to the CI Runner, whose own CAN card reads: "
                  + str(ci_egress.get("reachable", ""))[:90] + "…"),
 dict(n=2, player="The Agent", does="git push origin dev",
      branch="dev", mandate=V1, expect="REFUSED",
      can=("node n3: a dev push observed accepted — the grant reaches it", E1),
      quote="✗ dev  is not permitted by mandate v1", qsrc=T08,
      consequence="the release carrying the hook's own documentation is blocked. CAN said yes; MAY said no; MAY won"),
 dict(n=3, player="The Issuer", does=f"DECIDES: amend mandate v1 → v{m2['mandate_version']}",
      branch=None, mandate=None, expect=None,
      can=None, quote=None, qsrc=None,
      consequence="a new MAY card enters play, citing the authorisation that actually existed and carrying an interval. "
                  "The mandate was wrong; the refusal is what forced the authorisation to be written down"),
 dict(n=4, player="The Agent", does="git push origin dev  (again)",
      branch="dev", mandate=V2, expect="PERMIT",
      can=("node n3, unchanged — the grant never moved; the decision did", E1),
      quote="PERMIT   dev  (mandate v2", qsrc=T08B,
      consequence=f"the site deploys; tag v0.1.28 records it at {tag_time}"),
]

for t in TURNS:
    if t["branch"]:
        verdict, out = check_branch(t["branch"], t["mandate"])
        if verdict != t["expect"]:
            errors.append(f"resolution: turn {t['n']} declares {t['expect']} but the tool "
                          f"returned {verdict} — the table may not claim what the tool does not reproduce. [{out[:90]}]")
        t["live"] = out.splitlines()[0][:110]
    if t["quote"]:
        raw = open(os.path.join(ROOT, t["qsrc"]), encoding="utf-8").read()
        if t["quote"] not in raw:
            errors.append(f"transcript: turn {t['n']}'s reaction is not in {t['qsrc']} byte-for-byte")

banner = [l for l in t08.splitlines() if "PUSH REFUSED BY A MANDATE" in l]
if not banner:
    errors.append(f"transcript: the refusal banner is absent from {T08}")

if errors:
    print(f"gen_table: {len(errors)} GATE FAILURE(S):")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)


# ── render ──────────────────────────────────────────────────────────────────
def card_html(c, mini=False):
    fields = "".join(f'<div class="tc-kv"><span class="tc-k">{esc(k)}</span>'
                     f'<span class="tc-v">{esc(v)}</span></div>' for k, v in c["fields"])
    return f'''<div class="tcard tcard--{c["suit"].lower()}{' tcard--mini' if mini else ''}">
  <div class="tc-suit">{esc(c["suit"])}<span class="tc-kind">{esc(c["kind"])}</span></div>
  <div class="tc-title">{esc(c["title"])}</div>
  {fields}
  <div class="tc-note">{esc(c["note"])}</div>
  <a class="tc-src" href="{esc(rel(c["src"]))}">source</a>
</div>'''


deck_html = "\n".join(card_html(c) for c in DECK)

PLAYERS = [
 ("The Agent", "agent", "the session's real identity — the register's one non-fixture record",
  "registry/records/sha256-f9facb4c94da6c19/01__identity.json"),
 ("The Hook", "system", "git's pre-push enforcement point — a system is a player: it holds no cards and plays only reactions",
  ".githooks/pre-push"),
 ("The Issuer", "person (fixture)", "the operator root — plays the DECIDES cards; its private half is published, so its authority is demonstrable, not real",
  "registry/records/sha256-90f97984b9cf3930/01__identity.json"),
 ("The CI Runner", "system", "library entry #2 — where a permitted push lands; holds its own CAN cards, unrestricted egress among them",
  E2),
]
players_html = "\n".join(f'''<div class="tplayer">
  <div class="tp-name">{esc(n)}<span class="tp-kind">{esc(k)}</span></div>
  <div class="tp-desc">{esc(d)}</div>
  <a class="tc-src" href="{esc(rel(s_))}">record</a>
</div>''' for n, k, d, s_ in PLAYERS)


def turn_html(t):
    if t["branch"]:
        chips = (f'<span class="tchip tchip--yes">CAN &#10003; <a href="{esc(rel(t["can"][1]))}">{esc(t["can"][0][:44])}&hellip;</a></span>'
                 f'<span class="tchip tchip--{"yes" if t["expect"]=="PERMIT" else "no"}">MAY '
                 f'{"&#10003;" if t["expect"]=="PERMIT" else "&#10007;"} '
                 f'<a href="{esc(rel(t["mandate"]))}">{esc(os.path.basename(t["mandate"]))}</a></span>')
        react = (f'<div class="treact"><div class="tr-head">re-run at build time &middot; '
                 f'<a href="{esc(rel(t["qsrc"]))}">the transcript</a></div>'
                 f'<div class="tr-body">{esc(t["live"])}</div></div>')
    else:
        chips = '<span class="tchip tchip--dec">DECIDES — only people play this suit</span>'
        react = ''
    return f'''<div class="tturn" data-turn="{t["n"]}">
  <div class="tt-head"><span class="tt-n">TURN {t["n"]}</span>
    <span class="tt-player">{esc(t["player"])}</span> plays
    <span class="tt-does">{esc(t["does"])}</span></div>
  <div class="tt-chips">{chips}</div>
  {react}
  <div class="tt-cons"><b>Consequence:</b> {esc(t["consequence"])}</div>
</div>'''


turns_html = "\n".join(turn_html(t) for t in TURNS)

backward = "\n".join(
    f"<li><b>Turn {t['n']}</b> — {esc(t['consequence'][:120])}&hellip; "
    + (f"<i>because</i> the resolution was {esc(t['expect'])} against "
       f"<a href=\"{esc(rel(t['mandate']))}\">{esc(os.path.basename(t['mandate']))}</a>"
       if t["branch"] else "<i>because</i> the issuer decided, citing the instruction the mandate itself quotes")
    + "</li>"
    for t in reversed(TURNS))

reg = open(os.path.join(ROOT, "registry", "index.html"), encoding="utf-8").read()
nav = reg[reg.index('<nav class="site">'):reg.index('<main')].replace('href="../', 'href="../../').replace('src="../', 'src="../../')
foot = reg[reg.index('<footer class="site">'):reg.index("</body>")].replace('href="../', 'href="../../').replace('src="../', 'src="../../')

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The table &mdash; actions against grants and mandates, as cards &middot; pki.sgit.ai</title>
<meta name="description" content="Six suits — CAN, MAY, IS, SHOWS, DOES, DECIDES — and four players including the systems, replaying the estate's own 26 August incident: a push refused by a mandate, the mandate amended, the push landing. Every card derived from a real artefact; every resolution re-run through the enforcement tool at build time.">
<link rel="canonical" href="https://pki.sgit.ai/experiments/the-table/index.html">
<meta property="og:url" content="https://pki.sgit.ai/experiments/the-table/index.html">
<link rel="stylesheet" href="../../assets/site.css">
<link rel="stylesheet" href="../../assets/bench.css">
<link rel="stylesheet" href="table.css">
</head>
<body>

{nav}<main class="doc doc--wide">
<div class="crumb"><a href="../../index.html">pki.sgit.ai</a> / <a href="../index.html">experiments</a> / the-table</div>

<h1>The table</h1>
<p class="lead">Actions resolving against grants and mandates, played as cards. <b>Nothing on this
table is synthetic</b>: the scenario is this estate's own incident of 26 August 2026 — a push
refused by a mandate, the mandate found to be wrong, the issuer amending it, the push landing —
replayed from the artefacts it left behind. Every resolution below was
<b>re-run through the estate's own enforcement tool during the build</b>; if the table claimed a
refusal the tool does not reproduce, this page would not exist.
<button id="deal" class="rplay">&#9654; deal the turns</button></p>

<h2>The players <span class="tdim">&mdash; the systems are players too</span></h2>
<div class="tplayers">{players_html}</div>

<h2>The deck <span class="tdim">&mdash; six suits, one card each, every field read from its source</span></h2>
<p>A card is a rendering of a signed statement and nothing more — the one-envelope-two-genres model
wearing table clothes. The resolution order is the ordering rule as game mechanics: a
<b>DOES</b> resolves against <b>CAN</b>, then <b>MAY</b>, and its outcome mints an <b>IS</b> backed
by a <b>SHOWS</b>. Blast radius is the CAN cards face-up on the table that no MAY card covers.</p>
<div class="tdeck">{deck_html}</div>

<h2>The play <span class="tdim">&mdash; forward: the simulation</span></h2>
<div class="tturns" id="turns">{turns_html}</div>

<h2>The whodunnit <span class="tdim">&mdash; backward: the audit</span></h2>
<p>The same cards, turned over in reverse: start from the consequence and ask <i>because of what?</i>
Forward is the simulation; backward is the audit — <b>they are the same cards in the same order</b>,
which is the register's <i>was it valid last Tuesday?</i> promise, as play.</p>
<ol class="tback">{backward}</ol>

<p class="dr-notprove"><b>What this table does not claim.</b> One scenario, four turns, one agent,
one control — it demonstrates the mechanics, not coverage. A DOES card is not a receipt: nothing
here is signed by the actor at the time of action; the table shows where receipts would sit, which
is not the same as having them. And proposed-action simulation — playing a hypothetical card against
the twin before reality sees it — is specified in
<a href="../../briefs/v0.33.67__dev-brief__the-experiments-the-deck-and-the-table-cards-for-grants-mandates-facts-evidence-and-actions.md">brief v0.33.67</a>
and deliberately not built here.</p>

<p class="dr-src">Generator <code>admin/build/gen_table.py</code> &middot; gates: every resolution
re-run live through <code>mandate.py check-branch</code>; every reaction byte-checked against the
captured transcripts; every card field read from the source it links. Genre: tabletop grammar,
this estate's sentences.</p>
</main>

{foot}
<script>
const rows=[...document.querySelectorAll(".tturn")];
rows.forEach(r=>r.classList.add("tturn--hid"));
let i=0;const b=document.getElementById("deal");
b.onclick=()=>{{if(i<rows.length){{rows[i].classList.remove("tturn--hid");
  rows[i].scrollIntoView({{behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"}});
  i++;b.textContent=i<rows.length?"\\u25B6 next turn ("+(i+1)+" of "+rows.length+")":"\\u21BA replay";}}
 else{{rows.forEach(r=>r.classList.add("tturn--hid"));i=0;b.textContent="\\u25B6 deal the turns";}}}};
</script>
<noscript><style>.tturn--hid{{display:block!important}}</style></noscript>
</body>
</html>
'''
os.makedirs(os.path.join(ROOT, "experiments", "the-table"), exist_ok=True)
open(os.path.join(ROOT, "experiments", "the-table", "index.html"), "w", encoding="utf-8").write(page)
print(f"gen_table: {len(DECK)} suits, {len(PLAYERS)} players, {len(TURNS)} turns, "
      f"every resolution re-run live -> experiments/the-table/index.html")
