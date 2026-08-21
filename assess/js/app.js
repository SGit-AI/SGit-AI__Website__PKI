/* pki.sgit.ai — the assessment, wired together.

   State lives here; model.js decides; components.js renders. The order on the page is
   deliberate and it is the reverse of how the design documents read: the snapshot is at
   the top, filled in as you go, because the thing worth sending somebody is a summary,
   and nobody reads three screens of preamble to earn one. */

import * as M from './model.js';
import * as G from './graph.js';
import { storage } from './store.js';
import './components.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const $ = id => document.getElementById(id);

let LIB = null;
let state = M.emptyState();
let inspected = null;   /* { kind: 'node'|'cap', id, surface } */

/* ---------------------------------------------------------------- boot */
fetch('library.json')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(lib => {
    LIB = lib;
    document.querySelectorAll('[data-libver]').forEach(n => { n.textContent = lib.version; });
    const saved = storage.read();
    if (saved) {
      state = { products: saved.products || [], facts: saved.facts || {},
                controls: saved.controls || [], intent: saved.intent || [] };
      if (saved.lib !== lib.version) showLibMoved(saved.lib, lib.version);
    }
    renderExamples();
    render();
  })
  .catch(err => {
    const local = location.protocol === 'file:'
      ? ' This page was opened from a local folder, where a page gets an opaque origin and cannot fetch its own files or keep anything in browser storage. Serve the site over http and both work — which is why this is the feature that breaks first in a downloadable bundle.'
      : '';
    $('stage').innerHTML = `<div class="warnbox"><b>The library did not load</b> (${esc(err.message)}).${local}
      The assessment is only ever a set of references into <a href="library.json">that file</a> — without it there is
      deliberately nothing here.</div>`;
  });

function showLibMoved(was, now) {
  const n = $('libmoved');
  n.style.display = '';
  n.innerHTML = `<b>The library has changed since you were last here.</b> You were assessing against
    <code>${esc(was)}</code> and this is <code>${esc(now)}</code>. Your choices are unchanged. Anything that reads
    differently is the library moving, not you — which is why the version is recorded rather than assumed.`;
}

/* ------------------------------------------------------------- rendering */
function render() {
  const r = M.assess(LIB, state);
  const surfaces = r.surfaces;

  $('dash').data = { lib: LIB, state, r };
  $('picker').data = { lib: LIB, selected: state.products };

  const started = state.products.length > 0;
  document.querySelectorAll('[data-needs-agent]').forEach(n => { n.hidden = !started; });
  $('nothing-yet').hidden = started;

  if (started) {
    const live = M.liveFacts(LIB, surfaces, state.facts);
    $('facts').data = { lib: LIB, facts: state.facts, live };

    $('graphs').innerHTML = r.graphs.map(g => {
      const s = LIB.surfaces.find(x => x.id === g.surface);
      const hi = highlightSet(r);
      return `<figure class="gwrap" data-surface="${esc(g.surface)}">
        <figcaption><b>${esc(s.label)}</b> <span class="dim small">— ${esc(s.oneline)}</span></figcaption>
        <div class="gscroll">${G.render(g, { highlight: hi.surface === g.surface ? hi.ids : new Set(), selected: inspected?.kind === 'node' && inspected.surface === g.surface ? inspected.id : null })}</div>
        ${G.legend(LIB)}
        <details class="rerun"><summary>How these rows were produced, so you can disagree with them</summary>
          <p class="small">${esc(LIB.rerun[g.surface] || '')}</p></details>
      </figure>`;
    }).join('');
    wireGraph();

    $('intent').data = { lib: LIB, reach: r.reach, intent: state.intent };
    renderGap(r);

    const effects = {};
    for (const c of M.liveControls(LIB, surfaces)) effects[c.id] = M.controlEffect(LIB, state, c.id);
    $('controls').data = { lib: LIB, state, effects, live: M.liveControls(LIB, surfaces), excessCount: r.excess.length };
  }

  $('inspector').data = { body: inspectorBody(r) };
  $('dump').textContent = pretty(storage.raw());
  storage.write(state, LIB.version);
  $('storagenote').innerHTML = storage.ok ? '' :
    `<div class="warnbox"><b>Nothing can be kept in this browser.</b> ${esc(storage.why)}
     The assessment still works — you lose it when you close the tab.</div>`;
}

/* When a capability is inspected, light up the path that reaches it. */
function highlightSet(r) {
  if (inspected?.kind !== 'cap') return { surface: null, ids: new Set() };
  const e = r.reach.get(inspected.id);
  if (!e) return { surface: null, ids: new Set() };
  return { surface: e.surface, ids: new Set(e.path.map(n => n.id)) };
}

function renderGap(r) {
  const host = $('gap');
  if (!state.intent.length) {
    host.innerHTML = `<p class="dim">Tick what you meant it to do, above, and the delta appears here.</p>`;
    return;
  }
  if (!r.excess.length) {
    host.innerHTML = `<p class="ok">Nothing reachable that you did not ask for. That is either a well-scoped setup or a
      list ticked generously — the two look identical from here.</p>` + shortfallHtml(r);
    return;
  }
  const max = Math.max(...r.excess.map(e => e.meta.weight), 1);
  host.innerHTML = `
    <div class="gapviz">
      <div class="gapcol intended"><h4>You asked for</h4>
        ${state.intent.map(id => LIB.capabilities.find(c => c.id === id)).filter(Boolean)
          .map(c => `<span class="chip ok">${esc(c.label)}</span>`).join('')}</div>
      <div class="gaparrow" aria-hidden="true"><span>the delta</span></div>
      <div class="gapcol excess"><h4>It can also do</h4>
        ${r.excess.map(e => `<button class="chip bad w${e.meta.weight}" data-cap="${esc(e.cap)}"
            style="--w:${(e.meta.weight / max * 100).toFixed(0)}%">${esc(e.meta.label)}${e.viaEscalation ? '<i title="reachable around a stated control">↯</i>' : ''}${e.unverified ? '<i title="you said you were not sure">?</i>' : ''}</button>`).join('')}</div>
    </div>
    <p class="small dim">Click any of them to see the path that reaches it. Deliberately not a score out of a hundred:
    a score gets optimised for how alarming it feels, and an alarming number with nothing to do about it produces
    denial rather than change.</p>` + shortfallHtml(r);
  host.querySelectorAll('[data-cap]').forEach(b =>
    b.addEventListener('click', () => { inspected = { kind: 'cap', id: b.dataset.cap }; render(); }));
}

function shortfallHtml(r) {
  if (!r.shortfall.length) return '';
  return `<div class="note small"><b>The other direction.</b> You asked for
    ${r.shortfall.map(c => `<b>${esc(c.label.toLowerCase())}</b>`).join(', ')}, and nothing you picked can reach it.
    That one hurts operations rather than security — the agent fails, and the failure looks like a bug.</div>`;
}

function inspectorBody(r) {
  if (!inspected) return null;
  if (inspected.kind === 'cap') {
    const e = r.reach.get(inspected.id);
    if (!e) return null;
    const s = LIB.surfaces.find(x => x.id === e.surface);
    return `<button class="ix" data-close aria-label="Close">×</button>
      <h4>${esc(e.meta ? e.meta.label : inspected.id)}</h4>
      <p class="small dim">on ${esc(s ? s.label : e.surface)}</p>
      <div class="pathbox">${e.path.map(n => `<span class="pn${n === e.weakest ? ' weak' : ''}">${esc(n.label)}</span>`).join('<span class="pa">→</span>')}</div>
      <p class="small"><b>Weakest link:</b> ${esc(e.weakest.label)} — ${esc(LIB.tiers[e.weakest.tier])}</p>
      ${e.mechanisms && e.mechanisms.length ? `<p class="small"><b>What is claimed to be in the way:</b> ${e.mechanisms.map(esc).join('; ')}</p>` : '<p class="small">Nothing is claimed to be in the way anywhere on this path.</p>'}
      ${e.viaEscalation ? `<div class="note small"><b>There is a way around.</b> ${esc((LIB.escalations.find(x => x.surfaces.includes(e.surface)) || {}).why || '')}</div>` : ''}
      ${e.unverified ? `<div class="note small">You answered <b>not sure</b> to a question this path depends on, so it is shown and marked rather than assumed away.</div>` : ''}`;
  }
  const g = r.graphs.find(x => x.surface === inspected.surface);
  const n = g?.nodes.find(x => x.id === inspected.id);
  if (!n) return null;
  const caps = (n.reaches || []).map(id => LIB.capabilities.find(c => c.id === id)).filter(Boolean);
  const kids = g.nodes.filter(x => x.parent === n.id);
  const esc_out = g.escalations.filter(x => x.from === n.id);
  return `<button class="ix" data-close aria-label="Close">×</button>
    <h4>${esc(n.label)}</h4>
    <p><span class="tier t-${n.tier}">${n.tier === 'none' ? 'nothing in the way' : esc(n.tier)}</span>
       <span class="dim small">${esc(n.evidence)} · ${esc(LIB.nodes[g.surface] ? (LIB.rerun ? '' : '') : '')}</span></p>
    <p class="small">${esc(LIB.tiers[n.tier])}</p>
    ${n.mechanism ? `<p class="small"><b>In the way:</b> ${esc(n.mechanism)}</p>` : ''}
    ${n.detail ? `<p class="small">${esc(n.detail)}</p>` : ''}
    ${caps.length ? `<p class="small"><b>Reaches directly:</b> ${caps.map(c => esc(c.label)).join(', ')}</p>` : ''}
    ${kids.length ? `<p class="small"><b>Leads to:</b> ${kids.map(k => esc(k.label)).join(', ')}</p>` : ''}
    ${esc_out.length ? `<div class="note small"><b>And around a control:</b> ${esc_out.map(x => esc(x.why)).join(' ')}</div>` : ''}
    <p class="small dim"><b>Where this comes from:</b> ${esc(LIB.evidence[n.evidence] || n.evidence)}</p>`;
}

function wireGraph() {
  document.querySelectorAll('.gwrap').forEach(fig => {
    const surface = fig.dataset.surface;
    fig.querySelectorAll('[data-node]').forEach(g => {
      const open = () => { inspected = { kind: 'node', id: g.dataset.node, surface }; render();
        document.getElementById('inspector').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
      g.addEventListener('click', open);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  });
}

function pretty(raw) { try { return JSON.stringify(JSON.parse(raw), null, 2); } catch (e) { return raw; } }

/* ---------------------------------------------------------------- events */
document.addEventListener('pick', e => {
  const id = e.detail;
  const i = state.products.indexOf(id);
  if (i === -1) state.products.push(id); else state.products.splice(i, 1);
  /* Dropping the last agent of a surface leaves its answers orphaned; keep them, since
     re-picking is common and re-asking is annoying. */
  render();
});
document.addEventListener('fact', e => { state.facts[e.detail.id] = e.detail.v; render(); });
document.addEventListener('control', e => {
  const i = state.controls.indexOf(e.detail);
  if (i === -1) state.controls.push(e.detail); else state.controls.splice(i, 1);
  render();
});
document.addEventListener('intent', e => {
  const i = state.intent.indexOf(e.detail);
  if (i === -1) state.intent.push(e.detail); else state.intent.splice(i, 1);
  render();
});
document.addEventListener('inspect-cap', e => { inspected = { kind: 'cap', id: e.detail }; render(); });
document.addEventListener('inspect-clear', () => { inspected = null; render(); });
document.addEventListener('copy-summary', () => copySummary());

document.addEventListener('keydown', e => { if (e.key === 'Escape' && inspected) { inspected = null; render(); } });

/* ---------------------------------------------------------------- examples */
function renderExamples() {
  $('examples').innerHTML = LIB.examples.map(x => `
    <button class="ex" data-ex="${esc(x.id)}"><b>${esc(x.label)}</b><span>${esc(x.blurb)}</span></button>`).join('');
  $('examples').querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => {
    const x = LIB.examples.find(e => e.id === b.dataset.ex);
    state = { products: [...x.state.products], facts: { ...x.state.facts },
              controls: [...x.state.controls], intent: [...x.state.intent] };
    inspected = null;
    render();
    $('dash').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

$('reset')?.addEventListener('click', () => {
  state = M.emptyState(); inspected = null; storage.clear(); render();
});
$('wipe')?.addEventListener('click', () => {
  storage.clear(); state = M.emptyState(); inspected = null; render();
});

function copySummary() {
  const r = M.assess(LIB, state);
  const names = state.products.map(p => LIB.products.find(x => x.id === p)?.label).filter(Boolean);
  const lines = [
    'Agent grant vs mandate — snapshot',
    'library ' + LIB.version + ' · pki.sgit.ai/assess',
    '',
    'Agents: ' + names.join(', '),
    'Reachable capabilities: ' + r.reach.size,
    'Not asked for: ' + r.excess.length,
    'Controls in place: ' + r.controlsInPlace.map(c => c.label).join(', ') || 'none',
  ];
  if (r.unverified) lines.push('Unverified (answered "not sure"): ' + r.unverified);
  if (r.chokepoint && r.chokepoint.count > 1)
    lines.push('', r.chokepoint.node.label + ' is the weakest link on ' + r.chokepoint.count + ' of ' + r.chokepoint.of + '.');
  if (r.excess.length) lines.push('', 'The delta:', ...r.excess.map(e => '  - ' + e.meta.label));
  const text = lines.join('\n');
  navigator.clipboard?.writeText(text).then(
    () => flash('Copied.'),
    () => flash('Could not copy — your browser blocked it.'));
}
function flash(msg) {
  const n = $('flash'); n.textContent = msg; n.hidden = false;
  setTimeout(() => { n.hidden = true; }, 2600);
}
