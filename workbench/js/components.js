/* pki.sgit.ai workbench — the sections.

   One custom element per rail section. Every card renders from a fetched
   document or from localStorage — there is no display copy of anything that
   has a published home. User-typed text is escaped everywhere it is shown. */

import { estate, viewerFor } from './data.js';
import { store, SEED_FACTS, SEED_ACTIONS, currentFacts } from './store.js';
import { runDecision, enforcementTier, PACK_SCHEMA } from './engine.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const chip = r => `<span class="wb-res wb-res--${r}">${
  { pass: '✓', fail: '✕', warn: '△', unknown: '?' }[r] || '?'} ${r}</span>`;

const tierBadge = t => `<span class="gm-tier gm-tier--${t}">${t}</span>`;

/* ── the simulator's selection, shared between sections ─────────────────── */
export const sim = { actionId: 'push-main', mandateId: 'v2', custom: null, lastPack: null };

export function mandateOptions() {
  const opts = [
    { id: 'v2', label: 'Mandate v2 — the live one, signed', doc: estate.mandateV2,
      meta: { label: 'mandate v2 (current.json)', url: estate.sources.mandateV2 } },
    { id: 'v1', label: 'Mandate v1 — superseded (it refused the release)', doc: estate.mandateV1,
      meta: { label: 'mandate v1', url: estate.sources.mandateV1, superseded: true, supersededBy: 'mandate v2' } },
    { id: 'none', label: 'No mandate at all', doc: null, meta: { label: 'none' } },
  ];
  store.state.drafts.forEach((d, i) => opts.push({
    id: 'draft-' + i, label: 'Draft: ' + (d.label || 'untitled'), doc: d.doc,
    meta: { label: d.label || 'untitled draft', draft: true },
  }));
  return opts;
}

export function currentAction() {
  if (sim.actionId === 'custom' && sim.custom) return sim.custom;
  return SEED_ACTIONS.find(a => a.id === sim.actionId) || SEED_ACTIONS[0];
}

/* ── base ───────────────────────────────────────────────────────────────── */
class Section extends HTMLElement {
  connectedCallback() { this.render(); }
  render() {}
}

/* ── scenario (home) ────────────────────────────────────────────────────── */
class Scenario extends Section {
  render() {
    const nTwin = estate.twins.length, m = estate.mandateV2;
    this.innerHTML = `
    <h2>The scenario: one push, decided properly</h2>
    <p class="wb-lead">An agent wants to <b>push to a branch of this repository</b>. The workbench walks the
    decision the way an execution broker would: the subject presents an identity, a signed mandate, the specific
    action and the context — and every check lands in an <b>evidence pack</b>, collected at the moment of decision,
    which is the artefact that outlives the decision.</p>
    <div class="wb-loop">
      <span>reality</span><i>→</i><span>twin <small>(the measured grant)</small></span><i>→</i>
      <span>facts</span><i>→</i><span>attempt</span><i>→</i><span>decision</span><i>→</i>
      <span class="wb-loop-hi">evidence pack</span><i>→</i><span>finding</span><i>⇢</i><span class="wb-loop-dim">risks (theirs)</span>
    </div>
    <div class="note"><b>This app operates on the twin, not on reality.</b> The corpus's own definition: a digital
    twin is the point where the graph meets reality — the node that stands for a real system, to which facts attach
    and against which obligations are assessed. The grant here is a recorded measurement of a real environment
    (${nTwin} of them, fetched from the library just now); the mandate is the really-signed one
    ${m ? '(v' + esc(m.mandate_version) + ', in force until ' + esc(m.expires_at) + ')' : ''}; the simulator
    replays actions against that recording. Reality connects when a fresh measurement replaces the twin — and every
    evidence pack prints the twin's age so nobody mistakes a recording for now.</div>
    <div class="wb-grid3">
      <a class="wb-tile" href="#simulator"><b>Attempt an action</b><span>push to main and watch excess authority get refused — with the evidence</span></a>
      <a class="wb-tile" href="#facts"><b>Flip a fact</b><span>turn branch protection on and watch the enforcement tier move from setting to boundary</span></a>
      <a class="wb-tile" href="#schemas"><b>Read the schemas</b><span>the JSON shapes are the interface — including evidence-pack/v0, introduced here</span></a>
    </div>
    <p class="dim">Everything stays in this browser: same-origin fetches only, and localStorage for what you author.
    ${store.ok ? '' : '<b>' + esc(store.why) + '</b>'}</p>
    <p class="dim">Sibling surfaces, built in parallel on this estate: <a href="../simulator/index.html">the card
    simulator</a> and <a href="../experiments/index.html">the experiments</a> replay and play this estate's own
    history; the workbench decides a <i>fresh</i> action and keeps the evidence. Same primitives, different verbs —
    which is the point of a discovery phase.</p>`;
  }
}

/* ── identities ─────────────────────────────────────────────────────────── */
class Identities extends Section {
  render() {
    const recs = estate.regIndex?.records || {};
    const rows = Object.entries(recs).map(([fp, r]) => `
      <a class="wb-card" href="../registry/${esc(r.path)}index.html">
        <div class="wb-card-top"><b>${esc(r.label)}</b>
          <span class="gm-half ${r.fixture ? 'gm-half--fixture' : 'gm-half--real'}">${r.fixture ? 'fixture — private key published' : 'real — private half not published'}</span></div>
        <code>${esc(fp)}</code><span class="dim">${r.statements} signed statement${r.statements === 1 ? '' : 's'}</span>
      </a>`).join('');
    this.innerHTML = `
    <h2>Identities</h2>
    <p class="wb-lead">From the live register, just now. The fixture question is read <b>before</b> any signature:
    a keypair whose private half is published is not a weak identity, it is no identity. Each card opens
    <b>that record's own page</b> — its signed statements rendered in append order, with what the register answers
    about it.</p>
    <div class="wb-cards">${rows || '<p class="dim">Register not loaded.</p>'}</div>`;
  }
}

/* ── grants (the twin) ──────────────────────────────────────────────────── */
class Grants extends Section {
  render() {
    const cards = estate.twins.map(t => {
      const d = t.doc, age = d.measured_at ? Math.round((Date.now() - new Date(d.measured_at)) / 86400000) : null;
      return `
      <div class="wb-card">
        <div class="wb-card-top"><b>${esc(t.label)}</b>
          <span class="gm-date${age > 1 ? ' gm-date--stale' : ''}">twin measured ${esc(d.measured_at || '?')}${age !== null ? ' · ' + age + 'd old' : ''}</span></div>
        <p>${esc(d._what_this_is || '')}</p>
        <p class="dim">${esc(d.measured_by?.caveat_floor_not_census || 'a grant is a floor, not a census')}</p>
        <a href="${esc(viewerFor(t.url))}">the entry — rendered and raw →</a>
        <span class="dim"> · <a href="${esc(t.url)}">the raw file</a>, which is the reference the risk product stores</span>
      </div>`;
    }).join('');
    this.innerHTML = `
    <h2>Grants — the twin</h2>
    <p class="wb-lead">A grant is <b>discovered, not authored</b>: these two entries were generated by measurement,
    and each node carries its evidence class. Together they are the twin this workbench assesses obligations
    against. The memo's real-time question — <i>do I still have the same grant?</i> — is answered honestly on every
    evidence pack: the twin's age is printed, and a recording is never passed off as now.</p>
    <div class="wb-cards">${cards}</div>
    <p class="dim">The full node trees render in <a href="../packs/grant-and-mandate/blocks.html">the block gallery</a>;
    this app consumes the same documents by reference.</p>`;
  }
}

/* ── mandates ───────────────────────────────────────────────────────────── */
class Mandates extends Section {
  async render() {
    const m2 = estate.mandateV2, m1 = estate.mandateV1;
    const { verifySig } = await import('./canon.js');
    const ok = m2 ? await verifySig(m2, estate.issuerSignPem) : null;
    const drafts = store.state.drafts.map((d, i) => `
      <div class="wb-card wb-card--draft">
        <div class="wb-card-top"><b>Draft: ${esc(d.label || 'untitled')}</b><span class="wb-draftchip">unsigned draft — refuses everything</span></div>
        <pre class="wb-json">${esc(JSON.stringify(d.doc, null, 1))}</pre>
        <button data-del="${i}">delete draft</button>
      </div>`).join('');
    this.innerHTML = `
    <h2>Mandates</h2>
    <p class="wb-lead">What was authorised, by whom, until when — the half a credential cannot say.</p>
    <div class="wb-cards">
      <div class="wb-card">
        <div class="wb-card-top"><b>Mandate v2 — the live one</b>
          <span class="wb-verify ${ok === true ? 'wb-verify--ok' : ok === false ? 'wb-verify--bad' : ''}">${
            ok === true ? '✓ signature verified in this browser just now'
            : ok === false ? '✕ signature does NOT verify'
            : 'verification unavailable on this origin'}</span></div>
        ${m2 ? `<div class="gm-kv">
          <span>issuer</span><code>${esc(m2.issuer)}</code>
          <span>subject</span><code>${esc(m2.subject)}</code>
          <span>allows</span><span>${m2.allow.map(a => esc(a.capability) + ' on ' + esc(a.resource) +
            (a.constraints?.branches ? ' — branches ' + esc(a.constraints.branches.join(', ')) : '')).join('<br>')}</span>
          <span>interval</span><span>${esc(m2.issued_at)} → ${esc(m2.expires_at)}</span>
          <span>enforced by</span><span>${esc(m2.enforced_by?.point)} ${tierBadge(esc(m2.enforced_by?.tier || 'unknown'))}</span></div>
        <p class="wb-split"><b>Enforcement real, authority not:</b> the verification above is genuine — Web Crypto,
        against the signing key in the issuer's own record — and the issuer is a fixture whose private half is
        published, so it proves integrity and confers nothing. Two indicators, never one.</p>
        <div class="gm-prohib">${m2.prohibitions.map(p => '<span>' + esc(p) + '</span>').join('')}</div>
        <a href="${esc(viewerFor(estate.sources.mandateV2))}">the document — rendered and raw →</a>` : '<p class="dim">not loaded</p>'}
      </div>
      <div class="wb-card wb-card--dim">
        <div class="wb-card-top"><b>Mandate v1 — superseded</b><span class="gm-interval gm-interval--expired">refused the v0.1.28 release, then was amended — never bypassed</span></div>
        ${m1 ? `<p class="dim">Allowed only ${esc(m1.allow?.[0]?.constraints?.branches?.join(', ') || '?')} — narrower than
        the authorisation that actually existed. The remedy for a refusal is to correct the mandate.</p>
        <a href="${esc(viewerFor(estate.sources.mandateV1))}">the document — rendered and raw →</a>` : ''}
      </div>
      ${drafts}
      <div class="wb-card">
        <div class="wb-card-top"><b>Author a draft</b><span class="dim">stays in this browser</span></div>
        <p class="dim">This is where the memo's question lives: <i>what does the JSON file of that mandate look
        like?</i> Edit, save, then run it in the simulator — where default-deny will refuse it for being unsigned,
        and still show you the delta it would govern.</p>
        <input id="draft-label" placeholder="a name for this draft" maxlength="60">
        <textarea id="draft-json" rows="14" spellcheck="false">${esc(JSON.stringify(this.template(), null, 1))}</textarea>
        <div class="wb-btnrow"><button id="draft-save">save draft</button><span id="draft-msg" class="dim"></span></div>
      </div>
    </div>`;
    this.querySelector('#draft-save')?.addEventListener('click', () => this.saveDraft());
    this.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      store.removeDraft(+b.dataset.del); this.render();
    }));
  }
  template() {
    const m = estate.mandateV2 || {};
    return {
      mandate_version: 'draft', issuer: m.issuer || 'sha256:…', subject: m.subject || 'sha256:…',
      allow: [{ capability: 'repo.contents.push', resource: 'github.com/SGit-AI/SGit-AI__Website__PKI',
                constraints: { branches: ['claude/**', 'dev'] } }],
      prohibitions: ['will not push to any branch outside the allow list'],
      issued_at: new Date().toISOString(), expires_at: '2026-12-31T00:00:00Z',
      revocation: 'an append to the issuer’s registry record', v: 0,
    };
  }
  saveDraft() {
    const msg = this.querySelector('#draft-msg');
    try {
      const doc = JSON.parse(this.querySelector('#draft-json').value);
      for (const k of ['issuer', 'subject', 'allow', 'expires_at'])
        if (!doc[k]) throw new Error('missing required field: ' + k);
      if (!Array.isArray(doc.allow) || !doc.allow.length) throw new Error('allow must be a non-empty list');
      delete doc.sig; // a draft cannot carry a signature it did not earn
      store.addDraft({ label: this.querySelector('#draft-label').value || 'untitled', doc });
      this.render();
    } catch (e) { msg.textContent = 'not saved — ' + e.message; }
  }
}

/* ── facts ──────────────────────────────────────────────────────────────── */
class Facts extends Section {
  render() {
    const facts = currentFacts();
    const enfDev = enforcementTier(facts, 'dev'), enfMain = enforcementTier(facts, 'main');
    this.innerHTML = `
    <h2>Facts</h2>
    <p class="wb-lead">Facts attach to the twin — that is what makes it a twin rather than a document. Three values,
    and <b>unknown keeps the branch</b>: assuming absence is the comfortable error. Flip one and watch the
    enforcement tier recompute, because a tier is a property of the control's relationship to the tree, never a
    label stored on the control.</p>
    <div class="wb-facts">${facts.map(f => `
      <div class="wb-fact">
        <div><b>${esc(f.statement)}</b><span class="dim">${esc(f.basis)}</span></div>
        <div class="wb-tri" data-fact="${f.id}">
          ${['true', 'false', 'unknown'].map(v =>
            `<button class="${f.value === v ? 'on on--' + v : ''}" data-v="${v}">${v}</button>`).join('')}
        </div>
      </div>`).join('')}
    </div>
    <div class="wb-tierline">With the facts as set: pushing <b>dev</b> is bounded at ${tierBadge(enfDev.tier)}
    <span class="dim">(${esc(enfDev.because)})</span> — pushing <b>main</b> at ${tierBadge(enfMain.tier)}.</div>
    <p class="dim">Overrides live in this browser only. They change nothing outside this page — which is the point:
    this is the tabletop where N12 can be rehearsed before anyone touches repository settings.</p>`;
    this.querySelectorAll('.wb-tri button').forEach(b => b.addEventListener('click', () => {
      store.setFact(b.closest('.wb-tri').dataset.fact, b.dataset.v); this.render();
    }));
  }
}

/* ── actions ────────────────────────────────────────────────────────────── */
class Actions extends Section {
  render() {
    this.innerHTML = `
    <h2>Actions</h2>
    <p class="wb-lead">An action is the unit the whole apparatus exists to decide: a capability, a resource, and its
    parameters. Pick one here or in the simulator; author your own below.</p>
    <div class="wb-cards">${SEED_ACTIONS.map(a => `
      <button class="wb-card wb-card--action${sim.actionId === a.id ? ' wb-card--sel' : ''}" data-a="${a.id}">
        <b>${esc(a.label)}</b>
        <code>${esc(a.capability)} · ${esc(a.resource)}${a.branch ? ' · ' + esc(a.branch) : ''}${a.force ? ' · force' : ''}</code>
        <span class="dim">${esc(a.note)}</span>
      </button>`).join('')}
    </div>
    <div class="wb-card">
      <div class="wb-card-top"><b>A custom action</b><span class="dim">typed here, kept here</span></div>
      <div class="wb-form">
        <label>capability <input id="ca-cap" value="repo.contents.push"></label>
        <label>resource <input id="ca-res" value="github.com/SGit-AI/SGit-AI__Website__PKI"></label>
        <label>branch <input id="ca-br" value="release/1.0"></label>
        <label class="wb-check"><input id="ca-force" type="checkbox"> force</label>
        <button id="ca-use">use in the simulator</button>
      </div>
    </div>`;
    this.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      sim.actionId = b.dataset.a; location.hash = '#simulator';
    }));
    this.querySelector('#ca-use').addEventListener('click', () => {
      sim.custom = {
        id: 'custom', label: 'custom action',
        capability: this.querySelector('#ca-cap').value.trim(),
        resource: this.querySelector('#ca-res').value.trim(),
        branch: this.querySelector('#ca-br').value.trim(),
        force: this.querySelector('#ca-force').checked,
      };
      sim.actionId = 'custom'; location.hash = '#simulator';
    });
  }
}

/* ── simulator ──────────────────────────────────────────────────────────── */
class Simulator extends Section {
  render() {
    const acts = [...SEED_ACTIONS, ...(sim.custom ? [sim.custom] : [])];
    const mands = mandateOptions();
    this.innerHTML = `
    <h2>The simulator</h2>
    <p class="wb-lead">Attempt an action against the twin. The engine runs the broker's checks in order — identity,
    mandate, authenticity, validity, scope, grant, freshness — and hands back the evidence pack. <b>It decides
    nothing outside this page</b>, and the pack says so about itself.</p>
    <div class="wb-simbar">
      <label>action <select id="sim-a">${acts.map(a =>
        `<option value="${a.id}"${sim.actionId === a.id ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}</select></label>
      <label>mandate <select id="sim-m">${mands.map(m =>
        `<option value="${m.id}"${sim.mandateId === m.id ? ' selected' : ''}>${esc(m.label)}</option>`).join('')}</select></label>
      <button id="sim-run" class="wb-run">run the decision</button>
    </div>
    <div id="sim-out">${sim.lastPack ? '' : '<p class="dim">No decision yet. The default pick — push to main under mandate v2 — is the interesting one.</p>'}</div>`;
    this.querySelector('#sim-a').addEventListener('change', e => { sim.actionId = e.target.value; });
    this.querySelector('#sim-m').addEventListener('change', e => { sim.mandateId = e.target.value; });
    this.querySelector('#sim-run').addEventListener('click', () => this.run());
    if (sim.lastPack) this.showPack(sim.lastPack);
  }
  async run() {
    const m = mandateOptions().find(x => x.id === sim.mandateId);
    const pack = await runDecision({
      action: currentAction(), mandate: m.doc, mandateMeta: m.meta,
      twin: estate.twins[0], facts: currentFacts(), estate,
    });
    sim.lastPack = pack;
    this.showPack(pack);
  }
  showPack(pack) {
    this.querySelector('#sim-out').innerHTML = renderPack(pack, { savable: true });
    this.querySelector('#pack-save')?.addEventListener('click', () => {
      store.addPack(pack);
      this.querySelector('#pack-save').textContent = 'saved — see evidence packs';
      this.querySelector('#pack-save').disabled = true;
    });
    this.querySelector('#pack-copy')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(JSON.stringify(pack, null, 1));
      this.querySelector('#pack-copy').textContent = 'copied';
    });
  }
}

export function renderPack(pack, { savable = false, compact = false } = {}) {
  const oc = pack.decision.outcome;
  const cls = oc === 'ALLOWED' ? 'ok' : oc === 'SHORTFALL' ? 'shortfall' : oc === 'ALLOWED-UNVERIFIED' ? 'warn' : 'refused';
  return `
  <div class="wb-pack">
    <div class="wb-decision wb-decision--${cls}">
      <b>${esc(oc)}</b><span>${esc(pack.decision.reason)}</span>
      <small>${esc(pack.decision.decided_by)}</small>
    </div>
    <div class="wb-packmeta">
      <span>${esc(pack.action.capability)} · ${esc(pack.action.branch || '')}${pack.action.force ? ' · force' : ''}</span>
      <span>collected ${esc(pack.collected_at.slice(0, 19).replace('T', ' '))}Z</span>
      <span>twin age ${pack.twin?.age_days ?? '?'}d</span>
      <span>delta: <b>${esc(pack.delta.class)}</b> — ${esc(pack.delta.meaning)}</span>
      <span>enforcement ${tierBadge(esc(pack.enforcement.tier))}</span>
    </div>
    ${compact ? '' : `<table class="wb-checks"><tbody>
      ${pack.checks.map(c => `<tr><td>${chip(c.result)}</td><td><b>${esc(c.question)}</b><br><span>${esc(c.evidence)}</span>${
        c.source ? ' <a href="' + esc(c.source) + '">source</a>' : ''}</td></tr>`).join('')}
    </tbody></table>
    <details class="wb-raw"><summary>the pack as JSON — <code>${esc(pack.schema)}</code></summary>
      <pre class="wb-json">${esc(JSON.stringify(pack, null, 1))}</pre></details>
    ${savable ? '<div class="wb-btnrow"><button id="pack-save">save this pack</button><button id="pack-copy">copy JSON</button></div>' : ''}`}
  </div>`;
}

/* ── evidence packs (saved + replay) ────────────────────────────────────── */
class Packs extends Section {
  render() {
    const packs = store.state.packs;
    this.innerHTML = `
    <h2>Evidence packs</h2>
    <p class="wb-lead">The decision is disposable; the pack is the record. Saved packs can be <b>replayed</b> — the
    same action, decided again against the facts and mandate as they stand now — and the two packs diffed. That is
    the twin's second job: simulate before, replay after.</p>
    ${packs.length ? `<div class="wb-packlist">${packs.map((p, i) => `
      <div class="wb-packrow" data-i="${i}">
        <div class="wb-packrow-head">
          <span class="wb-res wb-res--${p.decision.outcome === 'ALLOWED' ? 'pass' : p.decision.outcome === 'REFUSED' ? 'fail' : 'warn'}">${esc(p.decision.outcome)}</span>
          <b>${esc(p.action.capability)}${p.action.branch ? ' → ' + esc(p.action.branch) : ''}${p.action.force ? ' (force)' : ''}</b>
          <span class="dim">${esc(p.collected_at.slice(0, 19).replace('T', ' '))}Z</span>
          <span class="wb-btnrow"><button data-view="${i}">view</button><button data-replay="${i}">replay now</button><button data-del="${i}">delete</button></span>
        </div>
        <div class="wb-packrow-body" hidden></div>
      </div>`).join('')}</div>
      <p><button id="packs-clear">clear all</button></p>`
    : '<p class="dim">Nothing saved yet. Run a decision in the simulator and save the pack.</p>'}`;
    this.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      const body = this.querySelector(`.wb-packrow[data-i="${b.dataset.view}"] .wb-packrow-body`);
      body.hidden = !body.hidden;
      if (!body.hidden) body.innerHTML = renderPack(store.state.packs[+b.dataset.view]);
    }));
    this.querySelectorAll('[data-replay]').forEach(b => b.addEventListener('click', () => this.replay(+b.dataset.replay)));
    this.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { store.removePack(+b.dataset.del); this.render(); }));
    this.querySelector('#packs-clear')?.addEventListener('click', () => { store.clearPacks(); this.render(); });
  }
  async replay(i) {
    const old = store.state.packs[i];
    const opts = mandateOptions();
    let m = opts.find(x => x.meta.url && x.meta.url === old.mandate_ref) ||
            opts.find(x => x.meta.draft && old.mandate_ref === 'localStorage draft \u201c' + x.meta.label + '\u201d');
    let substituted = '';
    if (!m) {
      m = opts.find(x => x.id === 'v2');
      substituted = old.mandate_ref
        ? ' <b>Note:</b> the pack\u2019s mandate (' + esc(old.mandate_ref) + ') no longer exists here \u2014 replayed under mandate v2 instead, and that substitution is part of the answer.'
        : ' <b>Note:</b> the pack carried no mandate; replayed under mandate v2.';
    }
    const fresh = await runDecision({
      action: { ...old.action }, mandate: m.doc, mandateMeta: m.meta,
      twin: estate.twins[0], facts: currentFacts(), estate,
    });
    const changed = fresh.checks.filter(c => {
      const prev = old.checks.find(p => p.id === c.id);
      return prev && prev.result !== c.result;
    });
    const body = this.querySelector(`.wb-packrow[data-i="${i}"] .wb-packrow-body`);
    body.hidden = false;
    body.innerHTML = `
      <div class="wb-replay">
        <b>Replayed just now:</b> ${old.decision.outcome === fresh.decision.outcome
          ? 'same outcome — <b>' + esc(fresh.decision.outcome) + '</b>'
          : 'outcome CHANGED: <b>' + esc(old.decision.outcome) + '</b> then, <b>' + esc(fresh.decision.outcome) + '</b> now'}.
        ${changed.length
          ? 'Checks that moved: ' + changed.map(c => '<code>' + esc(c.id) + '</code> ' + chip(c.result)).join(' ')
          : 'No check changed its answer.'}
        <span class="dim">A replay is the same question asked of the estate as it stands — mandate expiry, fact flips
        and twin age all land here.${substituted}</span>
      </div>` + renderPack(fresh);
  }
}

/* ── schemas ────────────────────────────────────────────────────────────── */
class Schemas extends Section {
  render() {
    const rows = [
      { name: 'mandate/v0', status: 'the estate’s (stated)', live: estate.sources.mandateV2,
        what: 'issuer, subject, allow[{capability, resource, constraints}], prohibitions (rendered, dated, versioned over the vocabulary), issued_at/expires_at, revocation path, enforced_by{point, tier}, sig (raw r||s over the canonical form)' },
      { name: 'grant-library-entry/v0', status: 'the estate’s (stated)', live: estate.sources.twinCcr,
        what: 'environment, measured_at/measured_by, measurement_honesty, history, and the node tree — every node carrying one of five evidence classes; unmeasured is unknown, never absent' },
      { name: 'fact/v0', status: 'introduced by this workbench (drawn)', live: null,
        what: '{id, statement, basis, value: true|false|unknown} — a statement attached to the twin, with the basis it arrived on; unknown keeps the branch' },
      { name: 'action/v0', status: 'introduced by this workbench (drawn)', live: null,
        what: '{capability, resource, branch?, force?} — the unit a decision is about; comparison against the vocabulary is exact string equality, per the registry’s own rule' },
      { name: PACK_SCHEMA.replace('pki.sgit.ai/', ''), status: 'introduced by this workbench (drawn) — the load-bearing one', live: null,
        what: 'collected_at, mode, action, subject, mandate_ref, twin{source, measured_at, age_days}, checks[{id, question, result, evidence, source}], delta, decision{outcome, reason, decided_by}, enforcement{tier, computed_from_facts}, facts_snapshot, does_not_prove[] — the last field mandatory, as everywhere on this site' },
    ];
    this.innerHTML = `
    <h2>The schemas</h2>
    <p class="wb-lead">The memo's claim, taken seriously: <b>the JSON structures are the product</b> — they are how a
    registry, a risk product, an execution broker and an agent talk without sharing code. Two shapes below are the
    estate's; three are introduced by this workbench and say so, because blending what the estate states with what a
    session drew is the same error as apparent authority.</p>
    <div class="wb-cards">${rows.map(r => `
      <div class="wb-card">
        <div class="wb-card-top"><b><code>${esc(r.name)}</code></b><span class="dim">${esc(r.status)}</span></div>
        <p>${esc(r.what)}</p>
        ${r.live ? `<a href="${esc(viewerFor(r.live))}">a live instance — rendered and raw →</a>` : '<span class="dim">instances: run the simulator, save a pack</span>'}
      </div>`).join('')}
    </div>
    <div class="note"><b>The next consumer is an agent.</b> An agent at a real decision point — this repo's pre-push
    hook, a CI job, Claude in a session — can emit this same pack shape with <code>mode</code> set to
    <code>enforcement</code> instead of <code>twin-simulation</code>. Same schema, real stakes: that is the
    try-it-on-Claude-itself step, and it needs nothing this page does not already define.</div>`;
  }
}

/* ── risks (the handover) ───────────────────────────────────────────────── */
class Risks extends Section {
  render() {
    this.innerHTML = `
    <h2>Risks — not here, on purpose</h2>
    <div class="wb-card">
      <p class="wb-lead"><b>This workbench's half of the chain ends at <i>finding</i>.</b> reality → twin → facts →
      finding — and then risks, decisions and acceptances belong to the risk product
      (<a href="https://riskmandate.ai">RiskMandate.ai</a>), which keeps the private instance and stores
      <b>references to this library, never copies</b>.</p>
      <p>What crosses the boundary is the <b>evidence pack</b>: the finding with its checks, sources and twin age
      attached. What must never cross: anything about a person or a named estate — the library carries no personal
      data, ever, and this app follows the same rule (same-origin fetches, localStorage, nothing leaves).</p>
      <p class="dim">A risk register fed by packs instead of assertions is the payoff of the ordering rule: reality
      before the risk register. The register's job is then to disagree with reality as rarely as possible.</p>
    </div>`;
  }
}

customElements.define('wb-scenario', Scenario);
customElements.define('wb-identities', Identities);
customElements.define('wb-grants', Grants);
customElements.define('wb-mandates', Mandates);
customElements.define('wb-facts', Facts);
customElements.define('wb-actions', Actions);
customElements.define('wb-simulator', Simulator);
customElements.define('wb-packs', Packs);
customElements.define('wb-schemas', Schemas);
customElements.define('wb-risks', Risks);
