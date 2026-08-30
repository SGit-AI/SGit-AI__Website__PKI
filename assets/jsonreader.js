/* pki.sgit.ai — the data viewer: one JSON document, rendered and raw.

   Same contract as assets/mdreader.js: the file named by ?src= stays the
   source of truth, this page is presentation, and any failure falls back to a
   link to the file so the document is always reachable.

   Two views, and the difference is honest: RENDERED is a reading of the
   parsed document; RAW is the file's actual bytes, fetched as text and shown
   verbatim — not re-serialised, because a "raw" view that pretty-printed a
   re-serialisation would be showing you something the file does not contain.

   Where a document carries a signature this page verifies it, in your browser,
   against the signing key in the signer's own registry record. That check can
   answer three ways and the third is not the second: unavailable is not
   forged. */

const $ = id => document.getElementById(id);

/* ── canonical form and verification: the registry's, unchanged ───────────
   Key-sorted compact JSON with `sig` removed, plus the trailing newline the
   reference implementation's `jq -cS` emits. Byte-identical to it. */
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object')
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

function b64ToBytes(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verify(doc, signPem) {
  if (!doc?.sig || !signPem || !globalThis.crypto?.subtle) return null;
  try {
    const der = b64ToBytes(signPem.replace(/-----[A-Z ]+-----/g, ''));
    const key = await crypto.subtle.importKey('spki', der,
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const { sig, ...rest } = doc;
    const raw = b64ToBytes(sig);
    if (raw.length !== 64) return false;
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, raw,
      new TextEncoder().encode(canon(rest) + '\n'));
  } catch { return false; }
}

/* ── the src parameter ────────────────────────────────────────────────────
   Site-relative paths only. Anything with a scheme or a protocol-relative
   prefix is refused rather than fetched: this page reads documents published
   on this site, and nothing else. */
function readSrc() {
  const raw = new URLSearchParams(location.search).get('src') || '';
  if (!raw) return { err: 'No document named. This page reads one JSON document from this site, named by <code>?src=</code>.' };
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//'))
    return { err: 'Refused: <code>?src=</code> takes a path on this site, not a URL elsewhere.' };
  const clean = raw.replace(/^\/+/, '');
  if (!/\.json$/i.test(clean)) return { err: 'Refused: this viewer reads <code>.json</code> documents.' };
  return { path: clean };
}

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── the rendered view ─────────────────────────────────────────────────── */
const LONG = 88;

function scalar(v) {
  if (v === null) return '<span class="jr-null">null</span>';
  if (typeof v === 'boolean') return `<span class="jr-bool jr-bool--${v}">${v}</span>`;
  if (typeof v === 'number') return `<span class="jr-num">${v}</span>`;
  const s = String(v);
  if (s.includes('-----BEGIN') || s.length > LONG)
    return `<pre class="jr-long">${esc(s)}</pre>`;
  return `<span class="jr-str">${esc(s)}</span>`;
}

function node(v, depth) {
  if (v === null || typeof v !== 'object') return scalar(v);

  if (Array.isArray(v)) {
    if (!v.length) return '<span class="jr-empty">[] — empty</span>';
    const allScalar = v.every(x => x === null || typeof x !== 'object');
    if (allScalar)
      return `<ul class="jr-list">${v.map(x => `<li>${scalar(x)}</li>`).join('')}</ul>`;
    return `<div class="jr-items">${v.map((x, i) =>
      `<div class="jr-item"><span class="jr-idx">${i}</span><div>${node(x, depth + 1)}</div></div>`).join('')}</div>`;
  }

  const keys = Object.keys(v);
  if (!keys.length) return '<span class="jr-empty">{} — empty</span>';
  return `<div class="jr-obj">${keys.map(k => {
    /* Keys starting with `_` are this estate's convention for a note ABOUT the
       document rather than data in it — usually the sentence disclaiming the
       file's authority. They are rendered as notes so they are not mistaken
       for payload. */
    const note = k.startsWith('_');
    return `<div class="jr-row${note ? ' jr-row--note' : ''}">
      <div class="jr-k">${esc(k)}</div>
      <div class="jr-v">${node(v[k], depth + 1)}</div></div>`;
  }).join('')}</div>`;
}

/* ── what kind of document this is, stated conservatively ──────────────── */
function describe(doc) {
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    if (doc.type && doc.signer && doc.sig)
      return `a signed <b>${esc(doc.type)}</b> statement in the register`;
    if (doc.allow && doc.issuer && doc.subject) return 'a <b>mandate</b> — what was authorised, by whom, until when';
    if (doc.environment && doc.measured_at) return 'a <b>grant library entry</b> — a measured environment, the twin';
    if (doc.roots) return 'the registry’s <b>declared roots</b>';
    if (doc.capabilities) return 'the <b>capability vocabulary</b>';
    if (doc.cases) return 'the <b>expected verification answers</b> — the register’s acceptance test';
  }
  return 'a JSON document published on this site';
}

/* ── boot ─────────────────────────────────────────────────────────────── */
(async function () {
  const box = $('jr');
  if (!box) return;
  const { path: src, err } = readSrc();

  if (err) {
    box.innerHTML = `<div class="note">${err} For example:
      <a href="?src=packs/grant-and-mandate/mandates/current.json">the live mandate</a>.</div>`;
    return;
  }

  /* Depth of this page below the site root, so a site-relative src becomes a
     path relative to here. This page lives at /data/, so one level. */
  const url = '../' + src;
  const fail = m => {
    box.innerHTML = `<div class="note"><b>Could not show this document in-page.</b> ${m}
      <a href="${esc(url)}">Open the file directly</a> — it is the source of truth either way.</div>`;
  };

  $('jr-path').innerHTML = `<code>${esc(src)}</code>`;
  $('jr-file').href = url;
  document.title = src.split('/').pop() + ' — rendered and raw · pki.sgit.ai';

  let text;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return fail(`The server answered <code>${r.status}</code> for <code>${esc(src)}</code>.`);
    text = await r.text();
  } catch (e) { return fail(esc(e.message)); }

  /* RAW: the bytes as fetched. Never re-serialised. */
  $('jr-raw').textContent = text;

  let doc;
  try { doc = JSON.parse(text); }
  catch (e) {
    $('jr-rendered').innerHTML =
      `<div class="note"><b>This file is not valid JSON</b>, so there is nothing to render — which is itself
       the answer. The parser said: <code>${esc(e.message)}</code>. The raw view has the bytes.</div>`;
    $('jr-meta').innerHTML = `<span>${text.length.toLocaleString()} bytes</span><span>does not parse</span>`;
    show('raw');
    return;
  }

  $('jr-rendered').innerHTML = node(doc, 0);
  $('jr-meta').innerHTML = [
    `<span>${describe(doc)}</span>`,
    `<span>${text.length.toLocaleString()} bytes</span>`,
    `<span>${Array.isArray(doc) ? doc.length + ' entries' : Object.keys(doc).length + ' top-level keys'}</span>`,
  ].join('');

  /* The signature, checked here rather than asserted. */
  const signer = doc?.signer || doc?.issuer;
  const sigBox = $('jr-sig');
  if (doc?.sig && signer) {
    sigBox.hidden = false;
    sigBox.className = 'jr-sig';
    sigBox.innerHTML = 'Checking the signature…';
    try {
      const idUrl = '../registry/records/' + String(signer).replace(':', '-') + '/01__identity.json';
      const ir = await fetch(idUrl, { cache: 'no-store' });
      if (!ir.ok) throw new Error('no record for ' + signer);
      const ident = await ir.json();
      const ok = await verify(doc, ident?.body?.bundle?.sign);
      const fixture = ident?.body?.private_key_published;
      sigBox.className = 'jr-sig jr-sig--' + (ok === true ? 'ok' : ok === false ? 'bad' : 'unk');
      sigBox.innerHTML = ok === true
        ? `<b>✓ Signature verified in this browser just now.</b> ECDSA P-256/SHA-256 over the canonical form,
           against the signing key in <a href="${esc(idUrl)}">${esc(signer)}’s own record</a>.
           ${fixture ? '<span class="jr-sig-warn">And it proves nothing: that signer is a <b>fixture</b> whose private half is published, so anybody could have produced this. Integrity, not authority.</span>' : ''}`
        : ok === false
          ? `<b>✕ This signature does not verify</b> against the signing key published in
             <a href="${esc(idUrl)}">${esc(signer)}’s record</a>.`
          : `<b>Signature not checked here.</b> Web Crypto is unavailable on this origin — which is not the same
             answer as “does not verify”, and must not be read as one.`;
    } catch (e) {
      sigBox.className = 'jr-sig jr-sig--unk';
      sigBox.innerHTML = `<b>Signature not checked.</b> ${esc(e.message)} — unchecked is not invalid.`;
    }
  }
})();

function show(which) {
  const rendered = which === 'rendered';
  $('jr-rendered').hidden = !rendered;
  $('jr-raw').hidden = rendered;
  $('tab-rendered').setAttribute('aria-selected', String(rendered));
  $('tab-raw').setAttribute('aria-selected', String(!rendered));
}

document.addEventListener('click', e => {
  const t = e.target.closest('#tab-rendered, #tab-raw, #jr-copy');
  if (!t) return;
  if (t.id === 'jr-copy') {
    navigator.clipboard?.writeText($('jr-raw').textContent)
      .then(() => { t.textContent = 'copied'; setTimeout(() => { t.textContent = 'copy raw'; }, 1400); });
    return;
  }
  show(t.id === 'tab-rendered' ? 'rendered' : 'raw');
});
