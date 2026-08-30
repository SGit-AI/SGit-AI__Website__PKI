#!/usr/bin/env python3
"""Generates one identity-card page per registry record.

Run from anywhere: python3 admin/build/gen_records.py

Why this exists: a record was a directory of JSON files. Linking to the
directory 404s on a static host, and linking to the raw JSON gives a person
on a phone a wall of braces. Every other document on this site has a rendered
page; identities did not. Now they do — registry/records/<dirname>/index.html.

The record files stay the source of truth. This page is presentation, it says
so, and it renders ONLY what the files contain. Key material is LINKED, never
inlined: the fixture private halves are published on purpose, and there is
still no reason for a page to carry one.

Chrome (nav, footer, version) is applied afterwards by chrome.py, which
rglobs every .html — so the skeleton here is borrowed from a page at the same
depth and rewritten in place on the next run.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RECORDS = ROOT / "registry" / "records"
DONOR = ROOT / "packs" / "map-your-case" / "readers" / "index.html"  # same depth: ../../../
GH = "https://github.com/SGit-AI/SGit-AI__Website__PKI"


def esc(x):
    return html.escape(str(x if x is not None else ""))


def load(p):
    return json.loads(p.read_text(encoding="utf-8"))


TYPE_NOTE = {
    "identity": "The first statement in every record: the public halves, the agent type, and — read <b>before</b> any "
                "signature — whether the private half is published.",
    "mandate": "What the issuer authorised: a capability on a resource, bounded by constraints and an interval. "
               "Silence is refusal — anything not listed is not authorised.",
    "acceptance": "The subject's own signature over the issuer's statement. A mandate the subject never accepted is "
                  "inert (pack decision 8, provisional).",
    "revocation": "An append that ends something. Nothing is edited or deleted; the revoked statement stays readable "
                  "and the revocation sits after it.",
    "grant": "What a credential technically permits — <b>discovered by measurement, not authored</b>. The gap between "
             "this and the mandate is excess authority, and it has no acceptor.",
}


def render_body(st):
    """Render one statement's body as a definition grid, by type."""
    b = st.get("body", {}) or {}
    rows = []

    def kv(k, v):
        rows.append(f"<span>{esc(k)}</span><span>{v}</span>")

    t = st.get("type")
    if t == "identity":
        bundle = b.get("bundle", {}) or {}
        kv("agent type", esc(b.get("agent_type")))
        kv("label", esc(bundle.get("label")))
        kv("signing fingerprint", f"<code>{esc(bundle.get('signing_fingerprint'))}</code>")
        kv("encryption fingerprint", f"<code>{esc(bundle.get('fingerprint'))}</code>")
        pub = b.get("private_key_published")
        kv("private key published",
           '<b class="rec-yes">YES — this is a fixture, not an identity</b>' if pub
           else '<b class="rec-no">no</b>' if pub is False
           else "<i>not stated</i>")
        if b.get("note"):
            kv("note", esc(b["note"]))
    elif t == "mandate":
        kv("capability", f"<code>{esc(b.get('capability'))}</code>")
        kv("resource", f"<code>{esc(b.get('resource'))}</code>")
        kv("mandate subject", f"<code>{esc(b.get('mandate_subject'))}</code>")
        c = b.get("constraints") or {}
        if c:
            bits = []
            for k, v in sorted(c.items()):
                bits.append(f"{esc(k)}: <code>{esc(', '.join(v) if isinstance(v, list) else v)}</code>")
            kv("constraints", "<br>".join(bits))
        kv("interval", f"{esc(b.get('valid_from'))} &rarr; {esc(b.get('valid_until'))}")
        if b.get("environment"):
            kv("environment", esc(b["environment"]))
    elif t == "acceptance":
        a = b.get("accepts") or {}
        kv("accepts", f"a <b>{esc(b.get('as'))}</b> in record <code>{esc(a.get('record'))}</code>")
        kv("statement", f"<code>{esc(a.get('statement'))}</code>")
    elif t == "revocation":
        r = b.get("revokes") or {}
        kv("revokes", f"statement <code>{esc(r.get('statement'))}</code> in record <code>{esc(r.get('record'))}</code>")
        kv("reason", f"<b>{esc(b.get('reason'))}</b>")
        kv("effective from", esc(b.get("effective_from")))
    elif t == "grant":
        p = b.get("permits") or {}
        kv("grant subject", f"<code>{esc(b.get('grant_subject'))}</code>")
        kv("capability", f"<code>{esc(p.get('capability'))}</code>")
        kv("reaches", f"<b>{esc(p.get('resources_count'))}</b> resources; sample: "
                      + ", ".join(f"<code>{esc(x)}</code>" for x in (p.get("resources_sample") or [])))
        kv("basis", esc(b.get("basis")))
        kv("observed at", esc(b.get("observed_at")))
        cred = b.get("credential") or {}
        if cred:
            kv("credential", f"{esc(cred.get('kind'))} &mdash; {esc(cred.get('descriptor_note'))}")
        if p.get("note"):
            kv("note", esc(p["note"]))
        if b.get("tree"):
            kv("tree", f"{len(b['tree'])} node(s) &mdash; rendered in "
                       f'<a href="../../../packs/grant-and-mandate/blocks.html">the block gallery</a>')
    else:
        kv("body", f"<code>{esc(json.dumps(b)[:300])}</code>")

    return "\n  ".join(rows)


def statement_card(rec_dir, entry, st):
    t = st.get("type", "?")
    fn = entry["file"]
    return f"""
<div class="rec-st rec-st--{esc(t)}">
  <div class="rec-st-top">
    <b>{esc(t)}</b>
    <span class="dim">{esc(st.get('created_at', ''))}</span>
    <a href="{esc(fn)}">the signed file &rarr;</a>
  </div>
  <p class="rec-note">{TYPE_NOTE.get(t, '')}</p>
  <div class="rec-kv">
  {render_body(st)}
  <span>signed by</span><span><code>{esc(st.get('signer'))}</code></span>
  <span>statement hash</span><span><code>{esc(entry['statement'])}</code></span>
  </div>
</div>"""


def build_page(d, index, roots, verifs, donor_html):
    rec = load(d / "record.json")
    fp = rec["record"]
    label = rec["label"]
    fixture = bool(rec.get("fixture"))
    idx_rec = (index.get("records") or {}).get(fp, {})
    root_entry = next((r for r in roots.get("roots", []) if r["fingerprint"] == fp), None)

    # statements, in file order
    cards = []
    for entry in rec.get("statements", []):
        st = load(d / entry["file"])
        cards.append(statement_card(d, entry, st))

    # what the register answers about this subject
    cases = [c for c in verifs.get("cases", []) if c.get("subject") == fp]
    ans = ""
    if cases:
        rows = "".join(
            f'<tr><td><code>{esc(c["capability"])}</code></td>'
            f'<td><b class="rec-{"yes" if c["expected"] == "YES" else "no"}">{esc(c["expected"])}</b></td>'
            f'<td>{esc(c["because"])}</td></tr>' for c in cases)
        ans = f"""
<h2 id="answer">What the register answers about it</h2>
<p>Published as data at <a href="../../views/expected-verifications.json">views/expected-verifications.json</a>,
as of {esc(verifs.get('as_of', ''))} &mdash; and reproduced by the validator on every release, which is what makes
it an acceptance test rather than a claim.</p>
<div class="tablewrap"><table>
<thead><tr><th>Asked about</th><th>Answer</th><th>Because</th></tr></thead>
<tbody>{rows}</tbody></table></div>"""

    # mandates naming this record as subject
    held = (index.get("mandates_by_subject") or {}).get(fp, [])
    held_html = ""
    if held:
        items = "".join(
            f'<li><code>{esc(m["capability"])}</code> &mdash; issued by <code>{esc(m["issuer"])}</code>, '
            f'in <a href="../../{esc(m["path"])}">that record</a></li>' for m in held)
        held_html = f"""
<h2 id="held">Mandates naming it as subject</h2>
<p class="dim">A mandate lives in the <b>issuer's</b> record, not the subject's &mdash; the issuer is who signed it.
This list is the convenience index reading the other way.</p>
<ul>{items}</ul>"""

    # the class block: the loudest thing on the page
    if fixture:
        cls = f"""
<div class="rec-class rec-class--fixture">
  <b>FIXTURE &mdash; the private half of this keypair is published in this repository.</b>
  <p>Every signature in this record verifies, and none of them proves anything: anybody who can read this site can
  produce more. This is not a weak identity, it is <b>no identity</b> &mdash; which is why the class is read
  <em>before</em> any signature is checked, and why it is the first thing on this page.
  {'<b>It is also a declared root of this registry</b>, so every chain anchored here demonstrates the walk and proves nothing.' if root_entry else ''}</p>
  <p class="dim">The published key material is deliberate: the register exists so other agents and sites can consume
  grants and mandates, and that needs runnable examples more than it needs secrecy at this stage.</p>
</div>"""
    else:
        cls = """
<div class="rec-class rec-class--real">
  <b>REAL &mdash; the private half is not published.</b>
  <p>The only record here whose signatures could mean something: <code>private_key_published</code> is
  <code>false</code>, so the register can be asked about it and the answer is not circular. It is still signed by a
  fixture root, so what it has is <b>integrity, not authority</b> &mdash; the two are independent, and the second
  waits on a real enrolment.</p>
</div>"""

    keys = rec.get("public_keys", []) or []
    privs = rec.get("private_keys", []) or []
    keyrow = ""
    if keys or privs:
        pub = " ".join(f'<a href="public/{esc(k)}">public/{esc(k)}</a>' for k in keys)
        prv = " ".join(f'<a href="private/{esc(k)}">private/{esc(k)}</a>' for k in privs)
        keyrow = f"""
<h2 id="keys">Key material</h2>
<p class="dim">Linked, never printed on this page &mdash; a rendered page has no business carrying a key, even one
published on purpose.</p>
<p>{pub}{'<br>' + prv if prv else ''}</p>
{'<p class="dim">The private halves are published because this is a fixture. That is the whole point of the class.</p>' if privs else ''}"""

    ks = rec.get("keystore") or []
    if ks:
        keyrow += ('<p class="dim">A drop-in <code>sgit</code> keystore ships with this record: '
                   + ", ".join(f"<code>{esc(k)}</code>" for k in ks) + "</p>")

    main = f"""<main class="doc">
<div class="crumb"><a href="../../../index.html">pki.sgit.ai</a> / <a href="../../index.html">registry</a> / record</div>
<h1>{esc(label)}</h1>
<p class="lead">One record in the register: <code>{esc(fp)}</code> &mdash;
{len(rec.get('statements', []))} signed statement{'' if len(rec.get('statements', [])) == 1 else 's'}, appended in
order and never edited. <b>This page renders the record; the files beside it are the record.</b></p>

{cls}
{ans}
<h2 id="statements">The signed statements</h2>
<p>In file order, which is append order. Nothing here was rewritten: a revocation is a later statement, not a deletion,
and a superseded statement stays readable underneath it.</p>
{''.join(cards)}
{held_html}
{keyrow}

<h2 id="elsewhere">This record elsewhere</h2>
<ul>
  <li><a href="record.json">record.json</a> &mdash; the unsigned manifest (its own <code>_authority</code> field says
      NONE; it is regenerable from the statements)</li>
  <li><a href="../../index.html">The register</a> &mdash; all eleven records, and the verification walk</li>
  <li><a href="../../../workbench/index.html#identities">The workbench</a> &mdash; the same records as cards, and a
      simulator that decides an action against a mandate</li>
  <li><a href="{GH}/tree/dev/registry/records/{esc(d.name)}">on GitHub</a></li>
</ul>

<div class="pagenav">
  <a href="../../index.html">&larr; The register</a>
  <a href="record.json">record.json &rarr;</a>
</div>
</main>"""

    s = donor_html
    s = re.sub(r"<title>.*?</title>",
               f"<title>{esc(label)} &mdash; a record in the register &middot; pki.sgit.ai</title>", s, count=1, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="{esc(label)} ({esc(fp)}): '
               f'{"a fixture whose private half is published, so its signatures verify and prove nothing" if fixture else "the one real record here, whose private half is not published"} '
               f'&mdash; its signed statements, rendered.">', s, count=1)
    s = re.sub(r'<link rel="canonical" href="[^"]*">',
               f'<link rel="canonical" href="https://pki.sgit.ai/registry/records/{esc(d.name)}/index.html">', s, count=1)
    s = re.sub(r'<meta property="og:url" content="[^"]*">',
               f'<meta property="og:url" content="https://pki.sgit.ai/registry/records/{esc(d.name)}/index.html">', s, count=1)
    # Drop any stylesheet the donor page owns (they are relative to its folder,
    # not this one), then add ours.
    s = re.sub(r'\n?<link rel="stylesheet" href="(?!\.\./\.\./\.\./assets/)[^"]*">', "", s)
    if "records.css" not in s:
        s = s.replace('<link rel="stylesheet" href="../../../assets/site.css">',
                      '<link rel="stylesheet" href="../../../assets/site.css">\n'
                      '<link rel="stylesheet" href="../../../assets/records.css">', 1)
    s = re.sub(r"(?s)<main.*?</main>", lambda m: main, s, count=1)
    return s


def main():
    donor = DONOR.read_text(encoding="utf-8")
    index = load(ROOT / "registry" / "index.json")
    roots = load(ROOT / "registry" / "roots.json")
    verifs = load(ROOT / "registry" / "views" / "expected-verifications.json")

    n = 0
    for d in sorted(RECORDS.iterdir()):
        if not (d / "record.json").exists():
            continue
        (d / "index.html").write_text(build_page(d, index, roots, verifs, donor), encoding="utf-8")
        n += 1
    print(f"gen_records: {n} record page(s) written under registry/records/")


if __name__ == "__main__":
    main()
