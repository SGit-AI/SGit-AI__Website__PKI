/* pki.sgit.ai workbench — the shell: rail + stage, routed on the hash so
   every section is linkable. */

import { estate } from './data.js';
import { store } from './store.js';
import './components.js';

const SECTIONS = [
  { id: 'scenario',   label: 'The scenario',   el: 'wb-scenario' },
  { id: 'identities', label: 'Identities',     el: 'wb-identities', n: () => Object.keys(estate.regIndex?.records || {}).length },
  { id: 'grants',     label: 'Grants — the twin', el: 'wb-grants', n: () => estate.twins.length },
  { id: 'mandates',   label: 'Mandates',       el: 'wb-mandates',   n: () => 2 + store.state.drafts.length },
  { id: 'facts',      label: 'Facts',          el: 'wb-facts',      n: () => 7 },
  { id: 'actions',    label: 'Actions',        el: 'wb-actions',    n: () => 6 },
  { id: 'simulator',  label: 'Simulator',      el: 'wb-simulator' },
  { id: 'packs',      label: 'Evidence packs', el: 'wb-packs',      n: () => store.state.packs.length },
  { id: 'schemas',    label: 'Schemas',        el: 'wb-schemas',    n: () => 5 },
  { id: 'risks',      label: 'Risks (theirs)', el: 'wb-risks' },
];

function current() {
  const id = (location.hash || '#scenario').slice(1);
  return SECTIONS.find(s => s.id === id) || SECTIONS[0];
}

function render() {
  const cur = current();
  document.getElementById('rail').innerHTML = SECTIONS.map(s => `
    <a class="wb-rail-item${s.id === cur.id ? ' wb-rail-item--on' : ''}" href="#${s.id}">
      ${s.label}${s.n ? '<span class="wb-rail-n">' + s.n() + '</span>' : ''}
    </a>`).join('');
  document.getElementById('stage').innerHTML = '<' + cur.el + '></' + cur.el + '>';
}

async function boot() {
  const stage = document.getElementById('stage');
  stage.innerHTML = '<p class="dim">Fetching the estate — the register, the mandates, the twins…</p>';
  store.load();
  await estate.load();
  if (!estate.ok) {
    stage.innerHTML = '<div class="note"><b>The estate did not load.</b> ' + estate.why + '</div>';
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}

boot();
