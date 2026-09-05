#!/usr/bin/env python3
"""gen_mesh.py — compile the mesh from its source-of-truth folders, with gates.

Run: python3 admin/build/gen_mesh.py   (before gen_guess.py and gen_probes.py)

Sources (one file per node, so a correction is one edit and one pull request):
  probes/mesh/ontology.json           node types and edge types — the taxonomy every edge is typed in
  probes/mesh/vendors/*.json          vendors
  probes/mesh/envs/*.json             environments
  probes/mesh/reaches/*.json          reach nodes: where a capability lands (reach is a node, not a rung)
  probes/mesh/obligations/*.json      obligations a reach is governed by — a question worth asking, never a finding
  probes/mesh/questions/*.json        the game's questions: class, reliability, the capability each asks about
  probes/primitives.json              families and capabilities (the coarse nodes)
  probes/profiles/**/*.json           profiles, tools, rows, and the refine map (capability → reach node)
  probes/evidence/*.json              findings files

Outputs:
  probes/mesh/graph.json              every node and edge, typed, each with its source file and an edit link
  guess/tree.json                     the question set the engine reads, compiled from questions/
  guess/data.html                     the sources of truth, the ontology, and how to correct a mapping

Gates (each fails the build): every edge type is in the ontology and joins the node types it says;
every id an edge names exists; every refine names a capability in the profile's union and a reach that
exists; every question carries a class, a reliability in (0,1], a p_yes for every profile and no other,
and an eliciting question names the capability it asks about; every reach names a family, environments
and obligations that exist; every environment names a vendor; a question file's id matches its name.
"""
import glob, html, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
M = ROOT / "probes" / "mesh"
GH = "https://github.com/SGit-AI/SGit-AI__Website__PKI"
esc = lambda s: html.escape(str(s), quote=True)
errors = []
def rel(p): return Path(p).resolve().relative_to(ROOT).as_posix()
def load_dir(sub):
    out = []
    for f in sorted(glob.glob(str(M / sub / "*.json"))):
        d = json.loads(Path(f).read_text()); d["_source"] = rel(f); out.append(d)
    return out

onto = json.loads((M / "ontology.json").read_text())
NT, ET = onto["node_types"], onto["edge_types"]
vendors = load_dir("vendors"); envs = load_dir("envs"); reaches = load_dir("reaches"); obls = load_dir("obligations"); questions = load_dir("questions")
prim = json.loads((ROOT / "probes/primitives.json").read_text())
CAPS = {c["id"]: c for c in prim["capabilities"]}
prof_files = sorted(f for f in glob.glob(str(ROOT / "probes/profiles/**/*.json"), recursive=True) if not f.endswith("index.json"))
profiles = [dict(json.loads(Path(f).read_text()), _source=rel(f)) for f in prof_files]
ev_files = sorted(glob.glob(str(ROOT / "probes/evidence/*.json")))

nodes, edges = {}, []
def node(id, type, label, source, **attrs):
    if type not in NT: errors.append(f"node {id}: unknown node type {type}")
    if id in nodes: errors.append(f"node {id}: declared twice"); return
    nodes[id] = {"id": id, "type": type, "label": label, "source": source, "edit": f"{GH}/edit/dev/{source}", "view": f"{GH}/blob/dev/{source}", **attrs}
def edge(frm, to, type, source, **attrs):
    edges.append({"from": frm, "to": to, "type": type, "source": source, **attrs})

for v in vendors: node("vendor:" + v["id"], "vendor", v["label"], v["_source"], kind=v.get("kind"))
for e in envs:
    node(e["id"], "env", e["label"], e["_source"], note=e.get("note"))
    edge(e["id"], "vendor:" + e["provided_by"], "provided-by", e["_source"])
for o in obls: node(o["id"], "obligation", f'{o["identifier"]} — {o["words"]}', o["_source"], identifier=o["identifier"], words=o["words"], note=o.get("note"), caveat=o.get("caveat"), origin=o.get("source"))
for fid, fl in prim["families"].items(): node("family:" + fid, "family", fid, "probes/primitives.json", means=fl)
for c in prim["capabilities"]:
    node("cap:" + c["id"], "capability", c["label"], "probes/primitives.json", verb=c["verb"], object=c["object"], reach_class=c["reach"], reversible=c["reversible"], family=c["family"], why_irreversible=c.get("why_irreversible"))
    edge("cap:" + c["id"], "family:" + c["family"], "member-of", "probes/primitives.json")
for r in reaches:
    if r["family"] not in prim["families"]: errors.append(f"reach {r['id']}: unknown family {r['family']}")
    node(r["id"], "reach", r["label"], r["_source"], family=r["family"], exposure=r.get("exposure"))
    for e in r.get("runs_in", []): edge(r["id"], e, "runs-in", r["_source"])
    for o in r.get("governed_by", []): edge(r["id"], o, "governed-by", r["_source"])
SURFACE_ENV = {"cli": "env:desktop", "desktop": "env:desktop", "web": "env:vendor-cloud", "agentbox": "env:container", "ci": "env:ci-runner", "extension": "env:browser", "service": "env:server"}
for e in ev_files:
    d = json.loads(Path(e).read_text())
    node("evidence:" + Path(e).name, "evidence", f'{d["tool"]} · {d["measured_at"][:10]} · {d["measured_by"]["independence"]}', rel(e), profile=d["profile"], tool=d["tool"], measured_at=d["measured_at"], independence=d["measured_by"]["independence"], findings=len(d["findings"]))
for p in profiles:
    pid = "profile:" + p["id"]
    node(pid, "profile", f'{p["product"]} · {p["variant"]}', p["_source"], vendor=p["vendor"], product=p["product"], variant=p["variant"], surface=p.get("surface"), version=p["version"],
         measured=any(t.get("evidence") for t in p["tools"]), reach_names=p.get("reach_names"), not_reachable=p.get("not_reachable", []), description=p.get("description"), prior=p.get("prior"))
    vid = "vendor:" + p["id"].split("/")[0]
    if vid not in nodes: errors.append(f"profile {p['id']}: vendor {vid} has no file under probes/mesh/vendors/")
    edge(pid, vid, "made-by", p["_source"])
    env = SURFACE_ENV.get(p.get("surface"))
    if env: edge(pid, env, "runs-in", p["_source"])
    refine = p.get("refine", {})
    for c in refine:
        if c not in p["union"]: errors.append(f"profile {p['id']}: refine names {c}, which is not in its union")
        for rid in ([refine[c]] if isinstance(refine[c], str) else refine[c]):
            if rid not in nodes or nodes[rid]["type"] != "reach": errors.append(f"profile {p['id']}: refine {c} → {rid}, which is not a reach node")
    for t in p["tools"]:
        tid = f'tool:{p["id"]}/{t["tool"]}'
        node(tid, "tool", t["tool"], p["_source"], profile=p["id"], evidence=t.get("evidence"))
        edge(pid, tid, "has-tool", p["_source"])
        if t.get("evidence"):
            evid = "evidence:" + Path(t["evidence"]).name
            if evid not in nodes: errors.append(f"tool {tid}: evidence {t['evidence']} missing")
            else: edge(tid, evid, "evidenced-by", p["_source"])
        for g in t["grant"]:
            cap = g["capability"]
            if cap not in CAPS: errors.append(f"tool {tid}: unknown capability {cap}"); continue
            rids = refine.get(cap)
            rids = [rids] if isinstance(rids, str) else (rids or [None])
            for rid in rids:
                xid = f'exposure:{p["id"]}/{cap}@{rid or CAPS[cap]["reach"]}'
                if xid not in nodes:
                    node(xid, "exposure", f'{CAPS[cap]["label"]} @ {nodes[rid]["label"] if rid else CAPS[cap]["reach"] + " (unrefined)"}', p["_source"],
                         capability=cap, reach=rid, reversible=CAPS[cap]["reversible"], family=CAPS[cap]["family"], profile=p["id"], refined=bool(rid))
                    edge(xid, "cap:" + cap, "member-of", p["_source"])
                    if rid: edge(xid, rid, "at", p["_source"])
                edge(tid, xid, "reaches", p["_source"], control_tier=g.get("control_tier", "none"), control=g.get("control"), tier=g["tier"], probe=g.get("probe"), note=g.get("note"))
PIDS = sorted(p["id"] for p in profiles)
for q in questions:
    if q["id"] != Path(q["_source"]).stem: errors.append(f"question {q['_source']}: id {q['id']} does not match the file name")
    if q.get("class") not in ("discriminating", "eliciting"): errors.append(f"question {q['id']}: class must be discriminating|eliciting")
    if not (0 < float(q.get("reliability", 0)) <= 1): errors.append(f"question {q['id']}: reliability must be in (0,1]")
    if sorted(q["p_yes"]) != PIDS: errors.append(f"question {q['id']}: p_yes keys differ from the profile set: {sorted(set(q['p_yes']) ^ set(PIDS))}")
    for k, v in q["p_yes"].items():
        if not (0 <= v <= 1): errors.append(f"question {q['id']}: p_yes[{k}]={v}")
    if q["class"] == "eliciting":
        if q.get("asks_about") not in CAPS: errors.append(f"question {q['id']}: eliciting, but asks_about {q.get('asks_about')} is not a capability")
    node("q:" + q["id"], "question", q["text"], q["_source"], cls=q["class"], reliability=q["reliability"], asks_about=q.get("asks_about"), funny=q.get("funny", False))
    if q.get("asks_about") in CAPS: edge("q:" + q["id"], "cap:" + q["asks_about"], "asks-about", q["_source"])
# edge gate: types, ends, existence
def ok_type(t, want):
    want = want if isinstance(want, list) else [want]; return t in want
for e in edges:
    et = ET.get(e["type"])
    if not et: errors.append(f"edge {e['from']} -{e['type']}-> {e['to']}: unknown edge type"); continue
    for end, want in (("from", et["from"]), ("to", et["to"])):
        n = nodes.get(e[end])
        if not n: errors.append(f"edge {e['from']} -{e['type']}-> {e['to']}: {end} node does not exist ({e['source']})")
        elif not ok_type(n["type"], want): errors.append(f"edge {e['from']} -{e['type']}-> {e['to']}: {end} is a {n['type']}, the ontology wants {want}")
prior_sum = sum(p.get("prior", 0) or 0 for p in profiles)
if abs(prior_sum - 1) > 0.02: errors.append(f"profile priors sum to {prior_sum:.2f}, not 1")
if errors:
    print(f"gen_mesh: {len(errors)} GATE FAILURE(S):")
    for x in errors: print("  ✗ " + x)
    sys.exit(1)

graph = {"type": "mesh/v1", "_what_this_is": "The mesh, compiled by admin/build/gen_mesh.py from probes/mesh/ and probes/profiles/. Every node carries its source file and an edit link; every edge is typed by probes/mesh/ontology.json. Reach is a node, not a rung; coarse and fine are the same shape (member-of). Walk it in either direction: from a product to what it reaches, or from a reach node to which products touch it.",
         "generated_from": ["probes/mesh/ontology.json", "probes/mesh/vendors/", "probes/mesh/envs/", "probes/mesh/reaches/", "probes/mesh/obligations/", "probes/mesh/questions/", "probes/primitives.json", "probes/profiles/", "probes/evidence/"],
         "ontology": onto, "counts": {t: sum(1 for n in nodes.values() if n["type"] == t) for t in NT}, "edge_counts": {t: sum(1 for e in edges if e["type"] == t) for t in ET},
         "nodes": list(nodes.values()), "edges": edges, "licence": "CC BY 4.0"}
(M / "graph.json").write_text(json.dumps(graph, indent=1, ensure_ascii=False) + "\n")

tree = {"type": "guess-tree/v2", "_what_this_is": "The question set the engine reads — GENERATED by admin/build/gen_mesh.py from probes/mesh/questions/*.json (one file per question; correct a question there). Each question carries a class (discriminating identifies; eliciting measures, and only eliciting answers count toward the gap), a reliability (how likely a player is to know the true answer: a low-reliability answer barely moves the belief and fully counts toward the gap), and for eliciting questions the capability it asks about. Probabilities are the author's estimates; reliabilities are a mechanism with no fitted values behind them yet.",
        "generated_from": "probes/mesh/questions/", "profiles_manifest": "../probes/profiles/index.json",
        "stop": {"dominant": 0.8, "min_gain": 0.03, "budget": 16, "not_in_set_below": 0.5, "elicit_after_dominant": 4},
        "noise": {"floor": 0.06, "ceiling": 0.94, "why": "answers update a belief rather than prune a branch; the reliability tempers the update"},
        "questions": [{k: q[k] for k in ("id", "text", "help", "class", "reliability", "reliability_note", "p_yes", "asks_about", "funny") if k in q} | {"source": q["_source"]} for q in questions],
        "prediction": {"text": "Before we show you: which of these can it do?", "help": "Tick every family you think its grant contains. The per-question answers are the specific gap; this one measures your sense of scale.", "families": list(prim["families"].keys()), "irreversible": "…and do you think any of it is irreversible?"},
        "licence": "CC BY 4.0"}
(ROOT / "guess/tree.json").write_text(json.dumps(tree, indent=2, ensure_ascii=False) + "\n")

# ── the data page: sources of truth, the ontology, and how to correct a mapping ──
reg = (ROOT / "registry/index.html").read_text()
nav = reg[reg.index('<nav class="site">'):reg.index("<main")]; foot = reg[reg.index('<footer class="site">'):reg.index("</body>")]
def flist(paths):
    return "".join(f'<li><code>{esc(p)}</code> · <a href="{GH}/blob/dev/{esc(p)}">view</a> · <a href="{GH}/edit/dev/{esc(p)}">edit</a></li>' for p in paths)
folders = [
 ("The ontology", "probes/mesh/ontology.json", "node types and edge types; an edge of a type not here fails the build", ["probes/mesh/ontology.json"]),
 ("Reach nodes", "probes/mesh/reaches/", "where a capability lands — six file systems wearing one verb, and the rest; each with the environments it lives in and the obligations that govern it", [r["_source"] for r in reaches]),
 ("Environments", "probes/mesh/envs/", "where things run", [e["_source"] for e in envs]),
 ("Vendors", "probes/mesh/vendors/", "who makes or provides", [v["_source"] for v in vendors]),
 ("Obligations", "probes/mesh/obligations/", "reached by traversal from a reach node; a question worth asking, never a finding", [o["_source"] for o in obls]),
 ("Questions", "probes/mesh/questions/", "one file each: class, reliability, the capability it asks about, a p_yes per profile", [q["_source"] for q in questions]),
 ("Capabilities and families", "probes/primitives.json", "the coarse nodes: verb × object × reach class + reversible", ["probes/primitives.json"]),
 ("Profiles", "probes/profiles/<vendor>/<product>/<variant>.json", "a configuration of a product: tools, rows, reach names, what it cannot reach, and the refine map (capability → reach node)", [p["_source"] for p in profiles]),
 ("Evidence", "probes/evidence/", "findings files, self-run or reported, dated and tiered", [rel(e) for e in ev_files]),
]
sections = "".join(f'<h3>{esc(h)} <code class="dim">{esc(path)}</code></h3><p class="dim">{esc(why)}</p><ul class="filelist">{flist(files)}</ul>' for h, path, why, files in folders)
nt_rows = "".join(f'<tr><td><code>{esc(k)}</code></td><td>{esc(v["means"])}</td><td><code>{esc(v["folder"])}</code></td><td>{graph["counts"][k]}</td></tr>' for k, v in NT.items())
et_rows = "".join(f'<tr><td><code>{esc(k)}</code></td><td><code>{esc(v["from"])}</code> &rarr; <code>{esc(v["to"])}</code></td><td>{esc(v["means"])}</td><td>{graph["edge_counts"][k]}</td></tr>' for k, v in ET.items())
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The sources of truth &mdash; every node in the mesh is a file, and a correction is an edit &middot; pki.sgit.ai</title>
<meta name="description" content="Where the game's data lives: one file per reach node, environment, obligation, question and profile, typed by one ontology, compiled with gates into the mesh. Every node links to its source; a correction is an edit and a pull request.">
<link rel="canonical" href="https://pki.sgit.ai/guess/data.html">
<meta property="og:url" content="https://pki.sgit.ai/guess/data.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/authorised.css">
</head>
<body>

{nav}<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / <a href="../bench/index.html">the bench</a> / <a href="index.html">which agent is it?</a> / the sources of truth</div>
<p class="kicker">RiskMandate.ai &middot; which agent is it?</p>
<h1>The sources of truth</h1>
<nav class="subnav"><a href="index.html">Play</a><a href="graph.html">The mesh</a><a href="report.html">Report</a><a class="here" href="data.html">Sources &amp; corrections</a><a href="../probes/index.html">The probes</a></nav>
<p class="lead">Every node in the mesh is a file, in a folder named for what it is, and every edge is typed by one ontology. The game, the graph and the report are compiled from these files with gates, so <b>a correction is an edit</b>: change the file, open a pull request, and the next build carries it. Nothing on the play screen is typed by hand.</p>
<div class="verdict-strip">
  <div><span class="n">{len(nodes)}</span><span class="k">nodes, {len(edges)} typed edges</span></div>
  <div><span class="n">{len(reaches)}</span><span class="k">reach nodes &mdash; reach is a node, not a rung</span></div>
  <div><span class="n">{len(questions)}</span><span class="k">questions: {sum(1 for q in questions if q["class"] == "discriminating")} identify, {sum(1 for q in questions if q["class"] == "eliciting")} measure</span></div>
  <div><span class="n">{len(profiles)}</span><span class="k">profiles, {sum(1 for p in profiles if any(t.get("evidence") for t in p["tools"]))} measured</span></div>
</div>
<h2 id="how">How to correct a mapping</h2>
<ol>
<li><b>Find the node.</b> Every node on <a href="graph.html">the mesh page</a> and every row on <a href="report.html">a report</a> carries <i>source</i> and <i>edit</i> links to the file behind it.</li>
<li><b>Edit the file.</b> A reach node's environments or obligations; a profile's refine map (which reach node a capability lands on for that profile) or a row's control; a question's class, reliability or expected answers. One file, one concern.</li>
<li><b>Open a pull request.</b> The build runs <code>gen_mesh.py</code>, <code>gen_guess.py</code> and <code>gen_probes.py</code>; an edge of an unknown type, an id that does not exist, or a profile the tree can no longer place from its own answers fails it, and the failure says why.</li>
<li><b>Play it.</b> <a href="index.html?demo=random">Demo mode</a> plays a profile's own modal answers end to end, so a change can be watched land.</li>
</ol>
<h2 id="ontology">The ontology</h2>
<p>Node types, then edge types with their direction. The rule is the fractal test: a coarse node (a family, a capability) and a fine node (an exposure &mdash; a capability at one reach node) are the same shape and are traversed identically, by <code>member-of</code>.</p>
<div class="tablewrap"><table><thead><tr><th>node type</th><th>means</th><th>lives in</th><th>count</th></tr></thead><tbody>{nt_rows}</tbody></table></div>
<div class="tablewrap"><table><thead><tr><th>edge type</th><th>from &rarr; to</th><th>means</th><th>count</th></tr></thead><tbody>{et_rows}</tbody></table></div>
<h2 id="folders">The folders</h2>
{sections}
<h2 id="compiled">What is compiled from them</h2>
<ul>
<li><a href="../probes/mesh/graph.json"><code>probes/mesh/graph.json</code></a> &mdash; the mesh: every node with its source and edit link, every edge typed.</li>
<li><a href="tree.json"><code>guess/tree.json</code></a> &mdash; the question set the engine reads, from <code>questions/</code>.</li>
<li><a href="selftest.json"><code>guess/selftest.json</code></a> &mdash; every profile placed from its own modal answers, by <code>gen_guess.py</code>; the count is derived, never typed.</li>
<li><a href="../probes/profiles/index.json"><code>probes/profiles/index.json</code></a> &mdash; the profile manifest, by <code>gen_probes.py</code>.</li>
</ul>
<p class="dim">Generated by <code>admin/build/gen_mesh.py</code>. The layout follows brief v0.33.65 (reach is a node) and the project lead's 5 September memo: folders per kind of thing, every node linked to its source, corrections as edits. CC BY 4.0.</p>
</main>

{foot}
</body>
</html>
'''
(ROOT / "guess/data.html").write_text(page)
print(f"gen_mesh: {len(nodes)} nodes, {len(edges)} edges ({len(reaches)} reaches, {len(questions)} questions, {len(profiles)} profiles) -> probes/mesh/graph.json, guess/tree.json, guess/data.html")
