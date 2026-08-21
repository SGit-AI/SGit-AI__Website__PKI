/* pki.sgit.ai — the library explorer. The same graph renderer the assessment uses, so
   what you see here is what it draws: one component, two pages, no second answer to the
   same question. The raw JSON sits beside it because the drawing is a reading of the
   file and somebody should be able to check the reading. */

import * as M from './model.js';
import * as G from './graph.js';
import './components.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const $ = id => document.getElementById(id);

let LIB = null, current = 'cli', inspected = null;

/* Every fact yes, so the library shows each tree at full extent. */
const ALL_YES = () => Object.fromEntries(LIB.facts.map(f => [f.id, 'yes']));

fetch('library.json').then(r => r.json()).then(lib => {
  LIB = lib;
  document.querySelectorAll('[data-libver]').forEach(n => { n.textContent = lib.version; });
  $('libnav').innerHTML = lib.surfaces.map(s =>
    `<button data-s="${esc(s.id)}" class="${s.id === current ? 'on' : ''}">${esc(s.label)}</button>`).join('');
  $('libnav').querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => {
    current = b.dataset.s; inspected = null; draw();
  }));
  renderCaps(); renderControls(); renderEvidence();
  draw();
}).catch(e => {
  $('libgraph').innerHTML = `<div class="warnbox"><b>The library did not load</b> (${esc(e.message)}).
    ${location.protocol === 'file:' ? 'This page was opened from a local folder, which gives it an opaque origin — it cannot fetch its own files. Serve the site over http.' : ''}</div>`;
});

function draw() {
  $('libnav').querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', b.dataset.s === current));
  const s = LIB.surfaces.find(x => x.id === current);
  const g = M.buildGraph(LIB, current, ALL_YES(), []);
  const products = LIB.products.filter(p => p.surface === current);
  $('libgraph').innerHTML = `<figure class="gwrap">
    <figcaption><b>${esc(s.label)}</b> <span class="dim small">— ${esc(s.oneline)}</span>
      <div class="small dim" style="margin-top:.3rem">Examples: ${products.map(p => esc(p.label)).join(' · ')}</div></figcaption>
    <div class="gscroll">${G.render(g, { selected: inspected })}</div>
    ${G.legend(LIB)}
    <details class="rerun" open><summary>How to check this yourself</summary>
      <p class="small">${esc(LIB.rerun[current] || '')}</p></details>
  </figure>`;
  $('libgraph').querySelectorAll('[data-node]').forEach(n => {
    const open = () => { inspected = n.dataset.node; draw(); };
    n.addEventListener('click', open);
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  $('inspector').data = { body: inspectorBody(g) };
  $('inspector').addEventListener('inspect-clear', () => { inspected = null; draw(); }, { once: true });
  $('raw').innerHTML = highlight(JSON.stringify({ surface: s, nodes: LIB.nodes[current],
    escalations: (LIB.escalations || []).filter(e => e.surfaces.includes(current)) }, null, 2), inspected);
}

function inspectorBody(g) {
  if (!inspected) return null;
  const n = g.nodes.find(x => x.id === inspected);
  if (!n) return null;
  const caps = (n.reaches || []).map(id => LIB.capabilities.find(c => c.id === id)).filter(Boolean);
  const out = g.escalations.filter(x => x.from === n.id);
  return `<button class="ix" data-close aria-label="Close">×</button>
    <h4>${esc(n.label)}</h4>
    <p><span class="tier t-${n.tier}">${n.tier === 'none' ? 'nothing in the way' : esc(n.tier)}</span></p>
    <p class="small">${esc(LIB.tiers[n.tier])}</p>
    ${n.mechanism ? `<p class="small"><b>In the way:</b> ${esc(n.mechanism)}</p>` : ''}
    ${n.detail ? `<p class="small">${esc(n.detail)}</p>` : ''}
    ${caps.length ? `<p class="small"><b>Reaches:</b> ${caps.map(c => esc(c.label)).join(', ')}</p>` : ''}
    ${n.requires ? `<p class="small"><b>Only exists if:</b> ${esc((LIB.facts.find(f => f.id === n.requires) || {}).q || n.requires)}</p>` : ''}
    ${out.length ? `<div class="note small"><b>Reaches around a control:</b> ${out.map(x => esc(x.why)).join(' ')}</div>` : ''}
    <p class="small dim"><b>Evidence:</b> ${esc(LIB.evidence[n.evidence] || n.evidence)}</p>`;
}

/* Minimal JSON colouring, and a highlight for the selected node so the drawing and the
   file can be read against each other. */
function highlight(json, nodeId) {
  let h = esc(json)
    .replace(/"([^"]*?)"(\s*:)/g, '<span class="k">"$1"</span>$2')
    .replace(/:\s*"([^"]*?)"/g, ': <span class="s">"$1"</span>')
    .replace(/:\s*(-?\d+(\.\d+)?|true|false|null)([,\n])/g, ': <span class="n">$1</span>$3');
  if (nodeId) {
    const re = new RegExp('(<span class="k">"id"</span>: <span class="s">"' + nodeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"</span>)');
    h = h.replace(re, '<mark>$1</mark>');
  }
  return h;
}

function renderCaps() {
  const groups = [['benign', 'Everyday use'], ['work', 'Work it does for you'], ['reach', 'Everything else it can reach']];
  $('caps').innerHTML = groups.map(([g, title]) => {
    const caps = LIB.capabilities.filter(c => c.group === g);
    return `<h4 class="capgh">${esc(title)}</h4><div class="opts">${caps.map(c =>
      `<div class="opt tight"><span>${esc(c.label)}</span><code class="dim small">${esc(c.id)}</code></div>`).join('')}</div>`;
  }).join('');
}

function renderControls() {
  $('ctrls').innerHTML = `<div class="ctrls">${LIB.controls.map(c => `
    <div class="ctrl"><div class="chead"><b>${esc(c.label)}</b>
      <span class="tier t-${c.tier === 'expectation' ? 'expectation' : c.tier}">${esc(c.tier)}</span>
      <span class="dim small">· ${esc(c.effort)}</span>
      <span class="dim small">· ${c.surfaces.map(s => esc((LIB.surfaces.find(x => x.id === s) || {}).label || s)).join(', ')}</span></div>
      <p class="small">${esc(c.note)}</p></div>`).join('')}</div>`;
}

function renderEvidence() {
  $('ev').innerHTML = `<div class="ctrls">${Object.entries(LIB.evidence).map(([k, v]) =>
    `<div class="ctrl"><div class="chead"><b><code>${esc(k)}</code></b></div><p class="small">${esc(v)}</p></div>`).join('')}
    <div class="ctrl"><div class="chead"><b>The basis for all of it</b></div><p class="small">${esc(LIB.basis)}</p></div></div>`;
}
