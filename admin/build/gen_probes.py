#!/usr/bin/env python3
"""gen_probes.py — the probe registry's page, manifest and llms.txt, from its data.

Run: python3 admin/build/gen_probes.py, then admin/build/chrome.py

Everything on probes/index.html is derived from probes/primitives.json, probes.json,
profiles/**/*.json, evidence/*.json, incidents/*.json and reductions.json. The page
holds no typed counts. Gates, each of which fails the build:
  · every probe establishes only capabilities that exist, and every capability is
    established by at least one probe;
  · every profile validates (ids match paths; union and intersection are computed
    from the tools' grants; a row at a measured tier points at an evidence file
    that holds a True finding for it);
  · every evidence file validates (shape, ids, reversibility copied from the
    primitive, presence-only size);
  · every reduction names a capability that exists, and every irreversible
    capability has a reduction;
  · every profile JSON under profiles/ is in the manifest and vice versa.
"""
import glob, html, json, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
P = ROOT / "probes"
esc = lambda s: html.escape(str(s), quote=True)

prim = json.loads((P / "primitives.json").read_text())
reg = json.loads((P / "probes.json").read_text())
red = json.loads((P / "reductions.json").read_text())["reductions"]
CAPS = {c["id"]: c for c in prim["capabilities"]}
errors = []

# ── gates ──────────────────────────────────────────────────────────────────
established = set()
for p in reg["probes"]:
    for c in p["establishes"]:
        if c not in CAPS: errors.append(f"probe {p['id']} establishes unknown capability {c}")
        established.add(c)
for c in CAPS:
    if c not in established: errors.append(f"capability {c} is established by no probe — a row nobody can measure")
for c in red:
    if c not in CAPS: errors.append(f"reduction for unknown capability {c}")
for c, v in CAPS.items():
    if v["reversible"] == "no" and c not in red: errors.append(f"irreversible capability {c} has no reduction — the gap page would show a loss with no way out")

profile_files = sorted(glob.glob(str(P / "profiles" / "**" / "*.json"), recursive=True))
profile_files = [f for f in profile_files if not f.endswith("index.json")]
evidence_files = sorted(glob.glob(str(P / "evidence" / "*.json")))
r = subprocess.run([sys.executable, str(P / "run.py"), "validate-profile", *profile_files], capture_output=True, text=True)
if r.returncode: errors.append("profiles: " + r.stdout.strip())
r = subprocess.run([sys.executable, str(P / "run.py"), "validate", *evidence_files], capture_output=True, text=True)
if r.returncode: errors.append("evidence: " + r.stdout.strip())

profiles = [json.loads(Path(f).read_text()) for f in profile_files]
evidence = [json.loads(Path(f).read_text()) for f in evidence_files]
incidents = [json.loads(Path(f).read_text()) for f in sorted(glob.glob(str(P / "incidents" / "*__*.json")))]
for i in incidents:
    if i["capability"] not in CAPS: errors.append(f"incident names unknown capability {i['capability']}")
    if not (P / "profiles" / (i["profile"] + ".json")).exists(): errors.append(f"incident names unknown profile {i['profile']}")

if errors:
    print(f"gen_probes: {len(errors)} GATE FAILURE(S):")
    for e in errors: print("  ✗ " + e)
    sys.exit(1)

# ── manifest ───────────────────────────────────────────────────────────────
def measured(p):
    return any(t.get("evidence") for t in p["tools"])
manifest = {
    "type": "profiles-index/v1",
    "_what_this_is": "The manifest of profiles, generated from profiles/**/*.json by admin/build/gen_probes.py. A page that names your tools reads this; the profile files carry the rows.",
    "primitives": "primitives.json", "reductions": "reductions.json",
    "profiles": [{
        "id": p["id"], "vendor": p["vendor"], "product": p["product"], "variant": p["variant"], "surface": p.get("surface"),
        "version": p["version"], "description": p["description"], "measured": measured(p),
        "tools": [t["tool"] for t in p["tools"]], "union": p["union"], "intersection": p["intersection"],
        "irreversible_in_union": p.get("irreversible_in_union", []), "prior": p.get("prior", 0.0),
        "path": f"profiles/{p['id']}.json"} for p in profiles],
}
(P / "profiles" / "index.json").write_text(json.dumps(manifest, indent=2) + "\n")

# ── page ───────────────────────────────────────────────────────────────────
reg_src = (ROOT / "registry" / "index.html").read_text()
nav = reg_src[reg_src.index('<nav class="site">'):reg_src.index("<main")]
foot = reg_src[reg_src.index('<footer class="site">'):reg_src.index("</body>")]

n_caps = len(CAPS); n_irrev = sum(1 for c in CAPS.values() if c["reversible"] == "no")
n_probes = len(reg["probes"]); n_safe = sum(1 for p in reg["probes"] if p["safe_to_run"])
n_prof = len(profiles); n_meas = sum(1 for p in profiles if measured(p))
n_ev = len(evidence); n_find = sum(len(e["findings"]) for e in evidence)
n_self = sum(1 for e in evidence if e["measured_by"]["independence"] == "self")
fams = prim["families"]

cap_rows = "\n".join(
    f'<tr><td><code>{esc(c["id"])}</code></td><td>{esc(c["family"])}</td><td>{esc(c["verb"])} &times; {esc(c["object"])} &times; {esc(c["reach"])}</td>'
    f'<td class="rev-{esc(c["reversible"])}">{esc(c["reversible"])}</td><td>{esc(c["label"])}{(" &mdash; <i>" + esc(c["why_irreversible"]) + "</i>") if c.get("why_irreversible") else ""}</td></tr>'
    for c in prim["capabilities"])
probe_rows = "\n".join(
    f'<tr><td><code>{esc(p["id"])}</code><br><span class="dim">{esc(p["family"])} &middot; {esc(p["tier_when_self_run"])} when self-run &middot; '
    f'{"safe to run" if p["safe_to_run"] else "<b>described, not run</b>"}</span></td>'
    f'<td>{"<br>".join("<code>" + esc(c) + "</code>" for c in p["establishes"])}</td>'
    f'<td><pre class="cmd">{esc(p["command"])}</pre><p>{esc(p["how_to_read"])}</p>{("<p class=dim>" + esc(p["origin"]) + "</p>") if p.get("origin") else ""}</td></tr>'
    for p in reg["probes"])
def prof_row(p):
    ev = [t["evidence"] for t in p["tools"] if t.get("evidence")]
    evc = " ".join(f'<a href="{esc(e)}">file</a>' for e in ev)
    return (f'<tr><td><a href="profiles/{esc(p["id"])}.json"><code>{esc(p["id"])}</code></a><br><span class="dim">{esc(p["product"])}</span></td>'
            f'<td>{esc(p.get("surface", ""))}</td><td>{"<br>".join(esc(t["tool"]) for t in p["tools"])}</td>'
            f'<td>{len(p["union"])}</td><td>{len(p["intersection"])}</td><td class="rev-no">{len(p.get("irreversible_in_union", []))}</td>'
            f'<td>{("<b>measured</b> &middot; " + evc) if ev else "<span class=is-claim>a claim &mdash; derived, no probe run</span>"}</td><td>{esc(p["version"])}</td></tr>')
prof_rows = "\n".join(prof_row(p) for p in profiles)
ev_rows = "\n".join(
    f'<tr><td><a href="evidence/{esc(Path(f).name)}"><code>{esc(Path(f).name)}</code></a></td><td>{esc(e["profile"])}</td><td>{esc(e["tool"])}</td>'
    f'<td>{esc(e["measured_at"][:10])}</td><td>{esc(e["measured_by"]["independence"])}</td>'
    f'<td>{sum(1 for x in e["findings"] if x["outcome"] == "True")} True &middot; {sum(1 for x in e["findings"] if x["outcome"] == "False")} False &middot; '
    f'{sum(1 for x in e["findings"] if x["outcome"] in ("NotAvailable", "NotApplicable"))} not available/applicable</td></tr>'
    for f, e in zip(evidence_files, evidence))
inc_rows = "\n".join(
    f'<tr><td>{esc(i["date"])}</td><td><code>{esc(i["profile"])}</code></td><td><code>{esc(i["capability"])}</code></td><td>{esc(i["control_claimed"])}</td>'
    f'<td>{esc(i["claimed_rung"])} &rarr; <b>{esc(i["demoted_to"])}</b>{"" if i.get("bypassed") else " (not a bypass)"}</td><td><a href="{esc(i["account"])}">the account</a></td></tr>'
    for i in incidents)
fam_list = "".join(f"<li><b>{esc(k)}</b> &mdash; {esc(v)}</li>" for k, v in fams.items())

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Probes, not tables &mdash; the capability primitives, the probes that establish them, and the measured profiles &middot; pki.sgit.ai</title>
<meta name="description" content="A registry of capability primitives and measured grants where a grant claim never travels alone: it travels with the probe that established it, so a challenge is a rerun rather than an argument. Grants public, mandates private.">
<link rel="canonical" href="https://pki.sgit.ai/probes/index.html">
<meta property="og:url" content="https://pki.sgit.ai/probes/index.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/authorised.css">
</head>
<body>

{nav}<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="../bench/index.html">the bench</a> / probes</div>
<h1>Probes, not tables</h1>
<p class="lead">A table of what a product can do is an opinion: somebody disagrees, edits it, and the registry accumulates positions rather than knowledge. <b>So the unit of contribution is a probe</b> &mdash; a short reproducible command, what it establishes, and how to read what comes back. A grant claim here points at the probe that produced it, the date, the environment and the output, and a challenge is a rerun with a different result, which is a fact rather than a view.</p>

<div class="verdict-strip">
  <div><span class="n">{n_caps}</span><span class="k">capability primitives, {n_irrev} of them irreversible</span></div>
  <div><span class="n">{n_probes}</span><span class="k">probes, {n_safe} safe to run, {n_probes - n_safe} described and never run</span></div>
  <div><span class="n">{n_prof}</span><span class="k">profiles, {n_meas} measured, {n_prof - n_meas} derived claims</span></div>
  <div><span class="n">{n_ev}</span><span class="k">evidence files, {n_find} findings, every one self-run</span></div>
</div>

<div class="note"><b>The rule every probe keeps: presence and reachability, never contents.</b> A probe records that a credential file exists at a path, never a byte of it; that a variable with a key-shaped name is set, never its value; that history is retained, never what is in it. The evidence files on this page were produced by the environment they describe, and there is nothing sensitive in them to leak, by construction. And the tier is stated: <b>every finding here was produced by the thing being profiled</b>, which is the weakest tier the model has, and exactly why the probe rather than the claim is what ships.</div>

<h2 id="split">Grants are public, mandates are private</h2>
<table>
<thead><tr><th></th><th>Grant</th><th>Mandate</th></tr></thead>
<tbody>
<tr><td>What it is</td><td>What a tool can do</td><td>What this organisation expected this agent to do</td></tr>
<tr><td>Who can establish it</td><td>Anybody with the product, by probe</td><td>Only the operator</td></tr>
<tr><td>Where it lives</td><td><b>Here: public, contributed, challenged</b></td><td><b>In your clone, under <code>yours/</code>, gitignored, never uploaded</b></td></tr>
<tr><td>How it is produced</td><td>Probes and documentation</td><td>An agent asking <a href="templates/mandate-questionnaire.md">questions about work</a>, never about capability</td></tr>
<tr><td>What it is worth to others</td><td>A great deal, because measuring is work</td><td>Nothing, and it is nobody's business</td></tr>
</tbody></table>
<p>Nothing about your estate leaves your clone. The delta is computed locally from a public grant and a private mandate, and the only things that can flow back are a probe result, a profile correction, or an incident &mdash; each a fact about a vendor's product rather than about you. <a href="../authorised/index.html">The page that computes the delta</a> runs in your browser for the same reason.</p>

<h2 id="primitive">The primitive</h2>
<pre class="cmd">capability = verb  &times;  object class  &times;  reach          + reversible?</pre>
<p>A specific path, host or mailbox is an <b>instance</b> of a primitive, never a new one, which is the rule that keeps the set finite. Reversibility sits on the primitive, because it decides whether a gap is a nuisance or a loss, and this estate has settled that <a href="../insurance/the-schemas-and-the-clocks.html">recoverability decides insurability</a>. These are <b>capability primitives</b>; the counters a policy is written in are <b>meters</b> (<a href="../insurance/the-resource-pool.html">measurable primitives</a>), and a document that touches both says which.</p>
<ul>{fam_list}</ul>
<div class="tablewrap"><table class="caps">
<thead><tr><th>id</th><th>family</th><th>verb &times; object &times; reach</th><th>reversible</th><th>what it means</th></tr></thead>
<tbody>{cap_rows}</tbody></table></div>
<p class="dim">Source: <a href="primitives.json">primitives.json</a>. A proposed primitive that is a specific thing is an instance; one that is a new verb, object class or reach needs a probe.</p>

<h2 id="probes">The probes</h2>
<p>Each probe is one heuristic about one distinct behaviour &mdash; <a href="https://github.com/ossf/scorecard/blob/main/docs/probes.md">OpenSSF Scorecard's definition</a>, adopted rather than minted, because this corpus anchors to published vocabulary and diverges only where the subject differs. The result of one probe is a <b>finding</b> in Scorecard's shape (probe, message, outcome, remediation, location) plus the two fields this subject needs: <b>reversible</b>, and <b>tier</b>. Shapes: <a href="schema/finding.schema.json">finding</a> &middot; <a href="schema/findings.schema.json">findings file</a> &middot; <a href="schema/profile.schema.json">profile</a>.</p>
<div class="tablewrap"><table class="probes">
<thead><tr><th>probe</th><th>establishes</th><th>command, and how to read it</th></tr></thead>
<tbody>{probe_rows}</tbody></table></div>
<p class="dim">Source: <a href="probes.json">probes.json</a>. Runner: <a href="run.py"><code>run.py</code></a>, which runs the safe probes, emits <code>findings/v1</code>, and validates evidence and profiles.</p>

<h2 id="profiles">The profiles</h2>
<p>The unit of mapping is a <b>tool</b>, not a product: two tools in one session reached different sets of hosts on 4 September, union seven and intersection one, and neither set was the session's. So a profile is a named configuration of a product listing its tools, each with its own grant; the union is what an operator actually carries and the intersection is reported because it is usually nearly empty. A row with no evidence file is visibly <span class="is-claim">a claim</span> rather than a measurement.</p>
<div class="tablewrap"><table class="profiles">
<thead><tr><th>profile</th><th>surface</th><th>tools</th><th>union</th><th>&cap;</th><th>irreversible</th><th>evidence</th><th>version</th></tr></thead>
<tbody>{prof_rows}</tbody></table></div>
<p class="dim">Manifest: <a href="profiles/index.json">profiles/index.json</a>. A profile's <code>version</code> moves when any row moves, and an assessment computed against it goes stale when it does.</p>

<h2 id="diff">The diff between two profiles</h2>
<p>The same assistant on the web, locally, and with confirmations disabled are siblings sharing most rows and differing in a few, and the diff is the answer to &ldquo;what does turning that on actually give it&rdquo;.</p>
<div class="diff-widget" id="diff">
  <label>A <select id="diffA"></select></label>
  <label>B <select id="diffB"></select></label>
  <div id="diffOut" class="diff-out"><p class="dim">Loading profiles&hellip;</p></div>
</div>

<h2 id="evidence">The evidence</h2>
<div class="tablewrap"><table>
<thead><tr><th>file</th><th>profile</th><th>tool</th><th>date</th><th>independence</th><th>findings</th></tr></thead>
<tbody>{ev_rows}</tbody></table></div>
<p>Every file says <code>self</code>: the probes were run by the thing being profiled. The registry's own model says a probe run by an independent party on the same profile is stronger, and the registry shows both when it has them. <b>Independence is the thing worth paying for</b>, and today nobody has.</p>

<h2 id="incidents">Incidents</h2>
<p>An incident is evidence that <b>demotes</b> a control: a guardrail an incident bypassed was not the guardrail it was claimed to be. A record names the profile, the capability, the control claimed, the rung it was claimed at and the rung it drops to, with a link to the public account. That is how the registry gets more honest over time rather than more confident.</p>
<div class="tablewrap"><table>
<thead><tr><th>date</th><th>profile</th><th>capability</th><th>control claimed</th><th>rung</th><th></th></tr></thead>
<tbody>{inc_rows}</tbody></table></div>
<p class="dim">Folder: <a href="incidents/README.md">incidents/</a>. No bypass has been recorded yet; the first would come from <a href="../packs/insurance-ecosystem/decision-points.html">the reconciliation job</a>, where a commit that carries no claim is the detection.</p>

<h2 id="workflow">The workflow, and where the value arrives</h2>
<pre class="cmd">1  fork or clone           you now hold every measured grant in the registry
2  name your profiles      which of these products and configurations you actually use
3  the grant appears       &lt;- value arrives here, before you have written anything
4  point an agent at it    it runs the probes it can, and asks the mandate questions
5  the delta is computed   locally, in your clone, and rendered
6  contribute back         a probe result, a profile correction, an incident. Never your mandate</pre>
<p>Step three is the test of the whole thing: anybody who names three products should see a grant they did not know they had, and if they do not, the registry is not yet worth forking. <a href="../authorised/index.html">Steps two to five, in the browser &rarr;</a></p>

<h2 id="run">Run it where the agent lives</h2>
<pre class="cmd">git clone https://github.com/SGit-AI/SGit-AI__Website__PKI && cd SGit-AI__Website__PKI
python3 probes/run.py --profile &lt;vendor&gt;/&lt;product&gt;/&lt;variant&gt; --tool shell --out probes/evidence/&lt;file&gt;.json
python3 probes/run.py validate probes/evidence/&lt;file&gt;.json
# the second tool, by report: the hosts you saw it reach
python3 probes/run.py --profile ... --tool fetch --fetch-hosts host1,host2 --out ...</pre>
<p>The scan cannot run from outside: agent exposure lives inside a laptop, a container, a workspace configuration and a set of connected accounts, and there is nothing to probe from the internet. So the measurement runs where the thing lives and the file is yours until you commit it. Contributions are pull requests &mdash; a code host rather than a vault, because a vault publishes read keys and never write keys, and what this needs is exactly what that rule forbids: strangers proposing changes.</p>

<h2 id="not">What this does not prove</h2>
<ul>
<li><b>That any profile is complete.</b> A self-run probe reports what the subject can see; a capability it does not know it has will not appear. A floor, never a census.</li>
<li><b>That a derived profile is true of any instance.</b> {n_prof - n_meas} of the {n_prof} profiles are reasoned from what a surface architecturally is and no probe has been run on them; they are claims, marked as such, until somebody contributes a file.</li>
<li><b>Independence.</b> Every evidence file was produced by the environment it describes.</li>
<li><b>That the primitive set is right.</b> It is a starting set, will be wrong at the edges from the first week, and the probes are the contribution.</li>
<li><b>Anything about you.</b> Nothing here can see your environment; the page that computes your delta runs in your browser.</li>
</ul>
<p class="dim">Specified by <a href="../documents/probes-not-tables.html">brief v0.33.64 (the grant/mandate repository ships probes, not tables)</a>, with the vocabulary corrected the same day by <a href="../documents/the-precedents.html">the precedents brief</a>. Machine-readable: <a href="llms.txt">probes/llms.txt</a>. CC BY 4.0.</p>
</main>

<script>
(async function () {{
  const base = '';
  const idx = await (await fetch(base + 'profiles/index.json')).json();
  const prim = await (await fetch(base + 'primitives.json')).json();
  const caps = Object.fromEntries(prim.capabilities.map(c => [c.id, c]));
  const A = document.getElementById('diffA'), B = document.getElementById('diffB'), out = document.getElementById('diffOut');
  for (const p of idx.profiles) {{ for (const s of [A, B]) {{ const o = document.createElement('option'); o.value = p.id; o.textContent = p.id + (p.measured ? '' : ' (claim)'); s.appendChild(o); }} }}
  A.value = 'anthropic/claude-code/local-default'; B.value = 'anthropic/claude-code/local-confirmations-off';
  const cache = {{}};
  async function load(id) {{ if (!cache[id]) cache[id] = await (await fetch(base + 'profiles/' + id + '.json')).json(); return cache[id]; }}
  function rows(p) {{ const m = {{}}; for (const t of p.tools) for (const g of t.grant) {{ const k = g.capability; if (!m[k]) m[k] = []; m[k].push({{tool: t.tool, control_tier: g.control_tier || 'none', control: g.control, tier: g.tier}}); }} return m; }}
  function li(k, extra) {{ const c = caps[k]; return `<li><code>${{k}}</code> <span class="rev-${{c.reversible}}">${{c.reversible === 'no' ? 'irreversible' : c.reversible}}</span> — ${{c.label}}${{extra || ''}}</li>`; }}
  async function render() {{
    const a = await load(A.value), b = await load(B.value); const ra = rows(a), rb = rows(b);
    const onlyA = Object.keys(ra).filter(k => !rb[k]), onlyB = Object.keys(rb).filter(k => !ra[k]);
    const both = Object.keys(ra).filter(k => rb[k]);
    const changed = both.filter(k => {{ const ta = ra[k].map(x => x.control_tier).sort().join(','), tb = rb[k].map(x => x.control_tier).sort().join(','); return ta !== tb; }});
    out.innerHTML = `<div class="diff-cols">
      <div><h4>Only in A (${{onlyA.length}})</h4><ul>${{onlyA.map(k => li(k)).join('') || '<li class=dim>nothing</li>'}}</ul></div>
      <div><h4>Only in B (${{onlyB.length}})</h4><ul>${{onlyB.map(k => li(k)).join('') || '<li class=dim>nothing</li>'}}</ul></div>
      <div><h4>In both, control differs (${{changed.length}})</h4><ul>${{changed.map(k => li(k, ` — A: <i>${{ra[k].map(x => x.control_tier).join('/')}}</i>, B: <i>${{rb[k].map(x => x.control_tier).join('/')}}</i>`)).join('') || '<li class=dim>nothing</li>'}}</ul></div>
    </div><p class="dim">${{both.length - changed.length}} rows are the same in both. Tier of A: ${{a.tools.some(t => t.evidence) ? 'measured' : 'derived (a claim)'}}; of B: ${{b.tools.some(t => t.evidence) ? 'measured' : 'derived (a claim)'}}.</p>`;
  }}
  A.onchange = B.onchange = render; render();
}})();
</script>
{foot}
</body>
</html>
'''
(P / "index.html").write_text(page)

# ── llms.txt ───────────────────────────────────────────────────────────────
lines = ["# pki.sgit.ai/probes — probes, not tables", "#",
         "# A registry of capability primitives and measured grants. A grant claim never travels alone:",
         "# it travels with the probe that established it, so a challenge is a rerun rather than an argument.",
         "# GRANTS ARE PUBLIC, MANDATES ARE PRIVATE: your mandate stays in your clone under probes/yours/ (gitignored).",
         f"# {n_caps} capability primitives ({n_irrev} irreversible) · {n_probes} probes ({n_safe} safe to run) · {n_prof} profiles ({n_meas} measured, {n_prof - n_meas} derived claims) · {n_ev} evidence files, {n_find} findings, all self-run.",
         "# Page: https://pki.sgit.ai/probes/index.html · Runner: probes/run.py · Shapes: probes/schema/",
         "", "## What an agent should carry if it summarises anything here", "",
         "  1. PRESENCE AND REACHABILITY, NEVER CONTENTS. No evidence file holds a byte of any credential, setting or transcript.",
         "  2. EVERY FINDING IS SELF-RUN: produced by the environment it describes, the weakest tier the model has. No independent run exists yet.",
         f"  3. {n_prof - n_meas} OF {n_prof} PROFILES ARE CLAIMS: derived from what a surface architecturally is, marked as such, no probe run on any instance.",
         "  4. A PROFILE IS PER TOOL, NOT PER PRODUCT. Two tools in one session reach different hosts; the union is what the operator carries.",
         "  5. NOTHING HERE CAN SEE YOU. The scan cannot run from outside; the delta is computed in your browser or your clone.",
         "", "## The profiles", ""]
for p in profiles:
    lines.append(f"  [{p['id']}] {p['product']} — {'MEASURED' if measured(p) else 'DERIVED (a claim)'} · version {p['version']}")
    lines.append(f"    tools {', '.join(t['tool'] for t in p['tools'])} · union {len(p['union'])} · intersection {len(p['intersection'])} · irreversible {len(p.get('irreversible_in_union', []))}")
    lines.append(f"    https://pki.sgit.ai/probes/profiles/{p['id']}.json")
lines += ["", "## The probes", ""]
for p in reg["probes"]:
    lines.append(f"  [{p['id']}] establishes {', '.join(p['establishes'])} · {p['tier_when_self_run']} when self-run · {'safe' if p['safe_to_run'] else 'DESCRIBED, NOT RUN'}")
lines += ["", "## Vocabulary", "",
          "  probe, finding: OpenSSF Scorecard's definitions, adopted (https://github.com/ossf/scorecard/blob/main/docs/probes.md);",
          "  plus reversible (recoverability decides insurability) and tier (observed | self-reported | documented | derived | inferred | unknown).",
          "  capability primitive = verb × object class × reach + reversible. Not to be confused with the meters a policy is written in.",
          "", "Specified by brief v0.33.64 (4 September 2026). CC BY 4.0."]
(P / "llms.txt").write_text("\n".join(lines) + "\n")
print(f"gen_probes: {n_caps} primitives, {n_probes} probes, {n_prof} profiles ({n_meas} measured), {n_ev} evidence files -> probes/index.html, profiles/index.json, llms.txt")
