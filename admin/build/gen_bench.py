#!/usr/bin/env python3
"""Generates the bench: bench/index.html and bench/llms.txt.

Run: python3 admin/build/gen_bench.py, then admin/build/chrome.py

The bench is where this site ships MVPs and experiments. Adding one is a dict
below plus a folder that holds its own code — the pattern graphs.sgit.ai uses
for its own working surface, where each experiment (the WCLM, the file
explorer) lives in its own folder with its own code and is iterated release by
release against a brief.

ONE FIELD IS MANDATORY AND THE BUILD FAILS WITHOUT IT: `does_not_prove`.

That is the bench's own gate, and it is the whole difference between a bench
and a showcase. Everything here is a working thing that states what it does
NOT establish — the register's signatures verify and prove nothing, the hook
refuses pushes and carries no authority, the measurement is a floor and not a
census. A section that collected demonstrations without that field would
manufacture exactly the false assurance this site exists to argue against.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATES = {
    "live":      ("live", "Built, running, and reachable at a URL right now"),
    "specified": ("specified", "Written down in enough detail to build; not built"),
    "retired":   ("retired", "Was built, superseded — kept because the record is the point"),
}

BENCH = [
 dict(slug="registry", name="The register", state="live",
  where="../registry/index.html", since="v0.1.26", updated="v0.1.29",
  origin=("the <a href='../packs/registry-mvp/index.html'>Registry MVP pack</a>, "
          "after a <a href='../packs/registry-mvp/readiness-report.md'>readiness report</a> "
          "returned six blocking questions"),
  one_line="A static register of agent identities, roles, mandates, grants, acceptances and "
           "revocations — eleven records and twenty-three signed statements at constructed "
           "public URLs, verifiable with the shipped <code>sgit pki</code> commands.",
  demonstrates=[
    "The four published rules, with entries under them at last — including the ownership rule as a test case: a valid signature by a non-owner is rejected",
    "C7's commit-graph record model, implemented rather than queued — the public git history is the chain",
    "Four <b>assumable roles</b>: a fresh session takes one on by copying a keystore",
    "Six verification answers shipped <b>as data</b>, so any verifier can check itself against them"],
  does_not_prove=[
    "<b>That anything here is trustworthy.</b> Ten of the eleven records are fixtures — private keys published on purpose — so every signature verifies and proves nothing",
    "That the root can be relied on: it is a fixture root, and <code>roots.json</code> says so in its own entry",
    "That enrolment works without a human: the write path is a git commit reviewed by a maintainer, not the account-less lane the pack designs"],
  gates=["<code>registry_tool.py validate</code> — every signature, every reference, the fixture flag read before any signature, and all six expected answers reproduced",
         "the site's key-leak tripwire, which still bans vault-key-shaped strings from the tree"],
  code="registry/, registry/tools/registry_tool.py"),

 dict(slug="mandate-hook", name="The mandate hook", state="live",
  where="../packs/grant-and-mandate/enforcement.html", since="v0.1.28", updated="v0.1.29",
  origin="the <a href='../packs/grant-and-mandate/index.html'>Grant &amp; Mandate pack</a>, build-order step 1",
  one_line="A signed mandate compiled into a <code>pre-push</code> hook that git runs — and that "
           "refused a real push to <code>dev</code> with <code>error: failed to push some refs</code>.",
  demonstrates=[
    "The acceptance test's last sentence, executed: <b>refused by something that is not the agent</b>, with <code>origin/dev</code> unchanged afterwards",
    "A mandate as a living object: v1 was too narrow, refused the release carrying it, and the issuer <b>amended</b> it rather than anyone bypassing the control",
    "Default-deny — a missing, unparseable, mis-signed or expired mandate all refuse"],
  does_not_prove=[
    "<b>That the mandate has any authority.</b> Its issuer is the fixture root, so anybody could forge it and the hook would enforce the forgery just as diligently",
    "That the constraint is a boundary: it reached tier <b>setting</b>, and <code>--no-verify</code> still gets past it",
    "That it protects a fresh clone — the hook file is committed, the config that activates it is local and does not travel"],
  gates=["the hook itself, on every push — and the refusal banner states its own tier rather than overclaiming",
         "<code>mandate.py verify</code> — signature checked against the issuer's public registry record"],
  code=".githooks/pre-push, packs/grant-and-mandate/tools/mandate.py, packs/grant-and-mandate/mandates/"),

 dict(slug="grant-measurement", name="Grant measurement", state="live",
  where="../packs/grant-and-mandate/library.html", since="v0.1.27", updated="v0.1.29",
  origin="the Grant &amp; Mandate pack, documents 03 and 08",
  one_line="A tool that generates a grant document for the environment it runs in, and two "
           "measured entries — a hosted agent container and a CI runner — that join at the push edge.",
  demonstrates=[
    "That a grant can be <b>discovered rather than authored</b>, with provenance and a tier per node",
    "Drift as a diff: re-run after the hook was installed, it independently caught its own node moving from <code>expectation</code> to <code>setting</code>",
    "One rule that makes it safe to run: <b>presence and reachability, never contents</b> — there is nothing sensitive in the output to leak, by construction"],
  does_not_prove=[
    "<b>That the measurement is complete.</b> An agent measuring its own grant reports what it can see; it is a <b>floor, not a census</b>, and says so on its face",
    "Anything about environments nobody has measured — two entries, one agent, and a blind-spot delta needs at least two agents against a common reference",
    "That a hand-assembled entry is as good as a measured one: the gallery caught schema drift in the hand-written entry and none in the tool-generated one"],
  gates=["<code>gen_blocks.py</code> fails the build on an unrecognised tier or evidence class — verified by injecting one",
         "a refused probe is recorded as <code>unknown</code>, never guessed"],
  code="packs/grant-and-mandate/tools/measure.py, packs/grant-and-mandate/library/"),

 dict(slug="building-blocks", name="The building blocks", state="live",
  where="../packs/grant-and-mandate/blocks.html", since="v0.1.31", updated="v0.1.31",
  origin="the Grant &amp; Mandate pack, <a href='../packs/grant-and-mandate/building-blocks.html'>document 09</a>",
  one_line="Nine reusable components — tier and evidence badges, cards, the delta block, the "
           "grant tree — shipped as a stylesheet and a gallery that renders the real documents.",
  demonstrates=[
    "The defeat-path rule working on real data that is wrong: a stored <code>boundary</code> whose own next node defeats it renders as <code>setting</code>, with the path attached",
    "The authority/enforcement split as <b>two indicators, never one</b>",
    "A gap rendered as a gap — the three-term block shows <code>unknown</code> where no self-report exists rather than inventing a number"],
  does_not_prove=[
    "<b>That the components survive contact with a population.</b> They have been exercised against two environments and one mandate, all measured by one agent",
    "That the layouts hold on a phone — the grant tree below 390px has a proposed degradation nobody has tested",
    "That a second consumer will find the contract workable; RiskMandate is committed to consuming it and has not yet"],
  gates=["the gallery renders the actual library entries and mandate, so a schema change breaks the build rather than the integration"],
  code="assets/gm-blocks.css, admin/build/gen_blocks.py"),

 dict(slug="map-your-case", name="Map your own case", state="live",
  where="../assess/index.html", since="v0.1.16", updated="v0.1.19",
  origin="the <a href='../packs/map-your-case/index.html'>Map Your Case pack</a>",
  one_line="A visitor assembles their own agent installations as grant trees, sees the gap, and "
           "records a decision per gap — storing the choices and never the answers.",
  demonstrates=[
    "That the no-collection claim can be <b>architectural rather than operational</b>: there is no free-text input anywhere, so there is nothing to type",
    "The three-tier control test in an interface, with escalation drawn as an edge",
    "A conformance test for this site's own claim, checkable in ten seconds in a browser's network panel"],
  does_not_prove=[
    "<b>That the library covers anybody's real estate.</b> Scenario 5 has no tree to point at at all",
    "That the assessment changes what anybody does — it has no backend, so it can measure none of its own success measures",
    "That the acceptor model is sound: it offers a <b>role</b> where the pack's own standard asks for a named person"],
  gates=["no free-text input anywhere on the page, by construction",
         "browser storage only — nothing leaves the visitor's machine"],
  code="assess/"),

 dict(slug="the-book", name="A Key Means Nothing Alone (the book)", state="specified",
  where="../book/index.html", since="v0.1.33", updated="v0.1.33",
  origin="a <a href='../book/BRIEF.md'>commissioning brief</a> modelled on graphs.sgit.ai's book round",
  one_line="One volume explaining what this site built, how it composes with RiskMandate.ai, and what none "
           "of it proves — commissioned, with the brief published before the book exists.",
  demonstrates=[
    "This estate's habit applied to itself: <b>the specification goes up before the thing</b>, so the thing can be checked against it",
    "A screenshot gate — twelve figures each carrying the site version and the SHA-256 of the page, with the build failing when one stops matching",
    "An acceptance test that <b>fails the book if a reader finishes believing the register is trustworthy</b>"],
  does_not_prove=[
    "<b>That any of it is written.</b> The brief is complete; the book does not exist, and a commissioning page is not a book",
    "That the estate is mature enough to deserve a book — four days, two environments, one agent, one mandate",
    "That a participant's account can be neutral: it is written by the project that builds the layer it argues for, and says so"],
  gates=["the brief names the acceptance test and the honesty positions in advance, so a finished book can be held to them",
         "the figure hash gate, which breaks the build rather than shipping a screenshot of a page that changed"],
  code="book/BRIEF.md, book/"),

 dict(slug="synthetic-readers", name="Synthetic readers", state="specified",
  where="../packs/map-your-case/readers/index.html", since="v0.1.23", updated="v0.1.24",
  origin="the Map Your Case pack, document 08",
  one_line="A programme that puts a page in front of an agent which receives pixels and nothing "
           "else — no text, no structure, no knowledge of the project — and watches where it goes.",
  demonstrates=[
    "The screenshot boundary as an <b>instrument</b> rather than a limitation",
    "A patience budget set from outside the model, so abandonment is a measured event rather than a story the model tells about itself",
    "One run performed, with four defects already folded back into change control"],
  does_not_prove=[
    "<b>That synthetic readers can report preferences.</b> They find defects; a preference from a simulated reader is not evidence and the programme says so",
    "That the findings generalise — one run, one archetype, one page",
    "That the simulation marker survives export, which is the rule most likely to be broken by accident"],
  gates=["the simulation marker in the filename, the headers, and beside every quote",
         "the page under test is authored before the run, so the model cannot be agreeing with itself"],
  code="packs/map-your-case/readers/"),
]


def esc(x):
    return html.escape(str(x))


def check():
    """The bench's own gate. An entry that does not say what it fails to
    establish is a showcase entry, and this section is not a showcase."""
    bad = []
    for e in BENCH:
        if not e.get("does_not_prove"):
            bad.append(f'{e["slug"]}: no `does_not_prove` — the one mandatory field')
        if e.get("state") not in STATES:
            bad.append(f'{e["slug"]}: state {e.get("state")!r} not in {sorted(STATES)}')
        if not e.get("gates"):
            bad.append(f'{e["slug"]}: no `gates` — what keeps it honest when nobody is looking?')
    if bad:
        raise SystemExit("gen_bench: the bench's own gate failed:\n  " + "\n  ".join(bad))


def entry_html(e):
    st, _ = STATES[e["state"]]
    dem = "".join(f"<li>{d}</li>" for d in e["demonstrates"])
    dnp = "".join(f"<li>{d}</li>" for d in e["does_not_prove"])
    gates = "".join(f"<li>{g}</li>" for g in e["gates"])
    return f'''
<div class="bench-item" id="{esc(e["slug"])}">
  <div class="bench-item__head">
    <h3><a href="{esc(e["where"])}">{esc(e["name"])}</a></h3>
    <span class="bench-state bench-state--{esc(e["state"])}">{esc(st)}</span>
  </div>
  <p class="bench-item__line">{e["one_line"]}</p>
  <div class="bench-cols">
    <div class="bench-col">
      <div class="bench-col__k">What it demonstrates</div>
      <ul class="bench-list bench-list--yes">{dem}</ul>
    </div>
    <div class="bench-col bench-col--not">
      <div class="bench-col__k">What it does <b>not</b> prove</div>
      <ul class="bench-list bench-list--no">{dnp}</ul>
    </div>
  </div>
  <div class="bench-gates"><b>Gates</b> — what keeps it honest when nobody is looking:
    <ul class="bench-list">{gates}</ul></div>
  <div class="bench-meta">
    <span>from {e["origin"]}</span>
    <span>code: <code>{esc(e["code"])}</code></span>
    <span>on the bench since {esc(e["since"])} · last moved {esc(e["updated"])}</span>
  </div>
</div>'''


def main():
    check()
    live = sum(1 for e in BENCH if e["state"] == "live")
    items = "".join(entry_html(e) for e in BENCH)
    rows = "".join(
        f'    <tr><td><a href="#{esc(e["slug"])}">{esc(e["name"])}</a></td>'
        f'<td><span class="bench-state bench-state--{esc(e["state"])}">{esc(STATES[e["state"]][0])}</span></td>'
        f'<td>{e["one_line"]}</td></tr>' for e in BENCH)

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The bench: what this site has built, and what each thing does not prove · pki.sgit.ai</title>
<meta name="description" content="The bench is where pki.sgit.ai ships MVPs and experiments — the register, the mandate hook, grant measurement, the building blocks, the assessment and the synthetic-reader programme. Every entry states what it demonstrates and, mandatorily, what it does not prove.">
<link rel="canonical" href="https://pki.sgit.ai/bench/index.html">
<meta property="og:url" content="https://pki.sgit.ai/bench/index.html">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/bench.css">
</head>
<body>

<nav class="site"><div class="row"></div></nav>

<main class="doc">
<div class="crumb"><a href="../index.html">pki.sgit.ai</a> / bench</div>
<h1>The bench</h1>
<p class="lead">Where this site ships MVPs and experiments. <b>{live} of the {len(BENCH)} things below are
built and running right now</b> — you can fetch them, run them, and check them. Each one lives in its own
folder with its own code, arrives from a brief or a dev pack, and is iterated release by release.</p>

<div class="bench-rule">
  <div class="bench-rule__k">The rule this section is built on</div>
  <p><b>Every entry must say what it does not prove, and the build fails without it.</b> That is the
  difference between a bench and a showcase. A register whose signatures verify and prove nothing; a hook
  that refuses pushes and carries no authority; a measurement that is a floor and not a census — each of
  those is a real, working thing <em>and</em> a demonstration, and a section that listed only the first half
  would manufacture exactly the false assurance this site exists to argue against.</p>
</div>

<div class="tablewrap"><table>
  <thead><tr><th>On the bench</th><th>State</th><th>What it is</th></tr></thead>
  <tbody>
{rows}
  </tbody>
</table></div>

<h2 id="items">The bench, in full</h2>
{items}

<h2 id="adding">Putting something on the bench</h2>
<p>Three requirements, and the third is the one that matters:</p>
<ol>
  <li><b>Its own folder, its own code.</b> An experiment that entangles itself with the site's other
  machinery cannot be retired, and retiring things is most of what a bench is for.</li>
  <li><b>An origin.</b> A brief, or a dev-pack document. Something that says what question it was built to
  answer, so its result can disappoint.</li>
  <li><b>A <code>does_not_prove</code> list, and gates.</b> Both are mandatory in
  <code>admin/build/gen_bench.py</code>, and the generator refuses to build without them.</li>
</ol>
<p>Then add a dict to that generator and run it. The machine-readable index is
<a href="llms.txt"><code>bench/llms.txt</code></a>.</p>

<div class="note"><b>Why "the bench" and not "labs".</b> In this industry <em>labs</em> has come to mean
<em>unsupported, may vanish, do not depend on it</em> — and the things below are the opposite: they are the
most rigorously checked artefacts on this site. They are simply not finished products. A bench is where you
put something to test it and read the result honestly, which is the same posture the rest of the site takes,
and it sits naturally beside the estate's own vocabulary of measurement, evidence and gates.</div>

<div class="pagenav">
  <a href="../index.html">← Front page</a>
  <a href="../packs/index.html">The dev packs →</a>
</div>
</main>

<footer class="site"></footer>

</body>
</html>
'''
    (ROOT / "bench").mkdir(exist_ok=True)
    (ROOT / "bench" / "index.html").write_text(page)

    lines = ["# pki.sgit.ai/bench — MVPs and experiments, and what each does not prove",
             "#",
             "# Every entry below carries a `does not prove` list. It is mandatory: the",
             "# generator refuses to build an entry without one, because a section that",
             "# collected demonstrations without their limits would manufacture the false",
             "# assurance this site exists to argue against.",
             "#",
             f"# {live} of {len(BENCH)} are built and running. Hub: https://pki.sgit.ai/bench/index.html",
             ""]
    for e in BENCH:
        lines += [f"## {e['name']} — {STATES[e['state']][0]}",
                  f"  where     https://pki.sgit.ai/{e['where'].replace('../', '')}",
                  f"  code      {e['code']}",
                  f"  since     {e['since']} (last moved {e['updated']})",
                  "  is        " + html.unescape(
                      __import__("re").sub(r"<[^>]+>", "", e["one_line"])),
                  "  DOES NOT PROVE:"]
        for d in e["does_not_prove"]:
            lines.append("    - " + html.unescape(__import__("re").sub(r"<[^>]+>", "", d)))
        lines.append("")
    lines += ["# Putting something on the bench: its own folder and its own code, an origin",
              "# (a brief or a dev-pack document), and a does_not_prove list plus gates —",
              "# both enforced by admin/build/gen_bench.py.",
              "# All content CC BY 4.0."]
    (ROOT / "bench" / "llms.txt").write_text("\n".join(lines) + "\n")
    print(f"gen_bench: {len(BENCH)} entries ({live} live) -> bench/index.html + bench/llms.txt")


if __name__ == "__main__":
    main()
