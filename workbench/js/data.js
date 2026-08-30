/* pki.sgit.ai workbench — the estate, fetched.

   References, never copies (pack rule GM3): every document this app reasons
   about is fetched from its published home at load time. Nothing here is a
   snapshot that can drift from the register. Every fetch is same-origin —
   open the network panel and watch nothing leave this site. */

const P = {
  mandateV2:   '../packs/grant-and-mandate/mandates/current.json',
  mandateV1:   '../packs/grant-and-mandate/mandates/mandate-v1.json',
  twinCcr:     '../packs/grant-and-mandate/library/claude-code-remote__ccr-container__2026-08-26.json',
  twinCi:      '../packs/grant-and-mandate/library/github-actions-runner__ci__2026-08-26.json',
  regIndex:    '../registry/index.json',
  roots:       '../registry/roots.json',
  capabilities:'../registry/capabilities.json',
};

async function fetchJson(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
  return r.json();
}

export const estate = {
  ok: false,
  why: '',
  sources: P,
  mandateV2: null, mandateV1: null,
  twins: [],           // [{id, label, doc, url}]
  regIndex: null, roots: null, capabilities: null,
  issuerIdentity: null, issuerSignPem: null,
  subjectIdentity: null,

  async load() {
    try {
      const [m2, m1, t1, t2, idx, roots, caps] = await Promise.all([
        fetchJson(P.mandateV2), fetchJson(P.mandateV1), fetchJson(P.twinCcr),
        fetchJson(P.twinCi), fetchJson(P.regIndex), fetchJson(P.roots),
        fetchJson(P.capabilities),
      ]);
      this.mandateV2 = m2; this.mandateV1 = m1;
      this.twins = [
        { id: 'ccr', label: 'Claude Code Remote container', doc: t1, url: P.twinCcr },
        { id: 'ci',  label: 'GitHub Actions runner',        doc: t2, url: P.twinCi },
      ];
      this.regIndex = idx; this.roots = roots; this.capabilities = caps;

      // The issuer's published signing key, from its own registry record —
      // fetched, not embedded, so a rotated key would change the answer here.
      const issuerPath = '../registry/records/' + m2.issuer.replace(':', '-') + '/01__identity.json';
      this.issuerIdentity = await fetchJson(issuerPath);
      this.issuerSignPem = this.issuerIdentity?.body?.bundle?.sign || null;

      const subjPath = '../registry/records/' + m2.subject.replace(':', '-') + '/01__identity.json';
      try { this.subjectIdentity = await fetchJson(subjPath); } catch { this.subjectIdentity = null; }

      this.ok = true;
    } catch (e) {
      this.ok = false;
      this.why = location.protocol === 'file:'
        ? 'This page was opened from a local folder, so it cannot fetch the register or the library. Serve the site over http (python3 -m http.server) and everything loads.'
        : 'Could not fetch the estate: ' + e.message;
    }
    return this;
  },

  isRoot(fp)    { return !!this.roots?.roots?.some(r => r.fingerprint === fp); },
  rootEntry(fp) { return this.roots?.roots?.find(r => r.fingerprint === fp) || null; },
  capability(name) { return this.capabilities?.capabilities?.find(c => c.name === name) || null; },
};
