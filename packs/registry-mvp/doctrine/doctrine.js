/* pki.sgit.ai — the doctrine appendix.

   Hand-rolled SVG again, for the same reason the assessment tool does it: this site
   makes only same-origin requests and a charting library from a CDN would cost that
   for three bar charts. Everything here is a function of doctrine.json. */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const $ = id => document.getElementById(id);
const ORDER = ['strong', 'partial', 'weak', 'na'];

let D = null, filter = { status: null, cat: null, phase: null }, selected = null, groupBy = 'phase';

fetch('doctrine/doctrine.json').then(r => r.json()).then(d => {
  D = d;
  document.querySelectorAll('[data-ver]').forEach(n => { n.textContent = d.version; });
  renderHeadline(); renderPhases(); renderCategories(); renderControls(); renderGrid(); renderDetail();
}).catch(e => {
  $('grid').innerHTML = `<div class="warnbox"><b>The assessment data did not load</b> (${esc(e.message)}).
    ${location.protocol === 'file:' ? ' This page was opened from a local folder, which gives it an opaque origin — it cannot fetch its own files.' : ''}</div>`;
});

const count = (list, s) => list.filter(x => x.status === s).length;

/* A single number for "how are we doing" would average practised and no-basis-yet into
   something meaningless, so the headline is a sentence and a shape instead. */
function renderHeadline() {
  const ds = D.doctrines;
  const rated = ds.filter(x => x.status !== 'na');
  const p1 = ds.filter(x => x.phase === 1), p4 = ds.filter(x => x.phase === 4);
  $('headline').innerHTML = `
    <div class="hgrid">
      ${ORDER.map(s => `<button class="hstat s-${s}" data-status="${s}">
        <span class="n">${count(ds, s)}</span><span class="l">${esc(D.statuses[s].label)}</span></button>`).join('')}
    </div>
    <p class="hsent">Of the ${rated.length} doctrines that can be rated at this size, <b>${count(rated, 'strong')} are practised</b>
      and <b>${count(rated, 'weak')} are not</b>. The remaining ${ds.length - rated.length} need an organisation, and there
      is one agent and one project lead — so they are marked <em>no basis yet</em> rather than scored.</p>
    <div class="hfind"><b>The shape is the finding.</b> This project is strong exactly where a documentation-heavy solo
      effort can be strong on its own — language, transparency, challenging assumptions, knowing the details, standards,
      humility. It is weak exactly where a doctrine needs <em>other people</em>: knowing your users, listening to an
      ecosystem, distributing decisions, being the owner. Phase&nbsp;I is ${count(p1, 'strong')} of ${p1.length}
      practised with one conspicuous hole; Phase&nbsp;IV is ${count(p4, 'weak') + count(p4, 'na')} of ${p4.length}
      absent, and both of those follow from the same fact.</div>`;
  $('headline').querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => {
    filter = { status: filter.status === b.dataset.status ? null : b.dataset.status, cat: null, phase: null };
    renderControls(); renderGrid();
    $('grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

/* A stacked bar per phase, drawn as divs — no library, and it reflows on a phone. */
function bar(list) {
  const total = list.length || 1;
  return `<div class="bar">${ORDER.map(s => {
    const n = count(list, s);
    return n ? `<span class="seg s-${s}" style="flex:${n}" title="${n} ${esc(D.statuses[s].label)}">${n}</span>` : '';
  }).join('')}</div>`;
}

function renderPhases() {
  $('phases').innerHTML = Object.entries(D.phases).map(([k, p]) => {
    const list = D.doctrines.filter(x => String(x.phase) === k);
    return `<div class="prow" data-phase="${k}">
      <div class="pl"><b>Phase ${k}</b><span>${esc(p.label)}</span></div>
      ${bar(list)}
      <div class="pn">${count(list, 'strong')}/${list.length}</div>
      <p class="pg">${esc(p.gist)}</p></div>`;
  }).join('');
  $('phases').querySelectorAll('[data-phase]').forEach(r => r.addEventListener('click', () => {
    filter = { status: null, cat: null, phase: filter.phase === r.dataset.phase ? null : r.dataset.phase };
    renderControls(); renderGrid();
    $('grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderCategories() {
  $('cats').innerHTML = Object.entries(D.categories).map(([k, c]) => {
    const list = D.doctrines.filter(x => x.cat === k);
    return `<div class="crow" data-cat="${k}">
      <div class="cl"><b>${esc(c.label)}</b><span>${esc(c.gist)}</span></div>
      ${bar(list)}
      <div class="pn">${count(list, 'strong')}/${list.length}</div></div>`;
  }).join('');
  $('cats').querySelectorAll('[data-cat]').forEach(r => r.addEventListener('click', () => {
    filter = { status: null, phase: null, cat: filter.cat === r.dataset.cat ? null : r.dataset.cat };
    renderControls(); renderGrid();
    $('grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderControls() {
  const active = filter.status || filter.cat || filter.phase;
  const label = filter.status ? D.statuses[filter.status].label
    : filter.cat ? D.categories[filter.cat].label
    : filter.phase ? 'Phase ' + filter.phase : '';
  $('controls').innerHTML = `
    <div class="dctl">
      <span class="dim small">Group by</span>
      ${['phase', 'cat', 'status'].map(g => `<button class="vt${groupBy === g ? ' on' : ''}" data-group="${g}">${
        g === 'cat' ? 'category' : g}</button>`).join('')}
      ${active ? `<button class="clr" data-clear>Showing: <b>${esc(label)}</b> ×</button>` : ''}
    </div>`;
  $('controls').querySelectorAll('[data-group]').forEach(b =>
    b.addEventListener('click', () => { groupBy = b.dataset.group; renderControls(); renderGrid(); }));
  $('controls').querySelector('[data-clear]')?.addEventListener('click', () => {
    filter = { status: null, cat: null, phase: null }; renderControls(); renderGrid();
  });
}

function renderGrid() {
  const shown = D.doctrines.filter(x =>
    (!filter.status || x.status === filter.status) &&
    (!filter.cat || x.cat === filter.cat) &&
    (!filter.phase || String(x.phase) === filter.phase));
  const key = x => groupBy === 'phase' ? 'Phase ' + x.phase + ' · ' + D.phases[x.phase].label
    : groupBy === 'cat' ? D.categories[x.cat].label
    : D.statuses[x.status].label;
  const groups = new Map();
  for (const x of shown) groups.set(key(x), [...(groups.get(key(x)) || []), x]);
  $('grid').innerHTML = [...groups].map(([g, list]) => `
    <section class="dgroup"><h4>${esc(g)} <span class="dim">${list.length}</span></h4>
      <div class="dcells">${list.map(x => `
        <button class="dcell s-${x.status}${selected === x.id ? ' sel' : ''}" data-id="${esc(x.id)}">
          <span class="did">${esc(x.id)}</span>
          <span class="dnm">${esc(x.name)}</span>
          <span class="dst">${esc(D.statuses[x.status].label)}</span>
        </button>`).join('')}</div></section>`).join('')
    || '<p class="dim">Nothing matches that filter.</p>';
  $('grid').querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => {
    selected = selected === b.dataset.id ? null : b.dataset.id;
    renderGrid(); renderDetail();
    if (selected) $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
}

function renderDetail() {
  const x = D.doctrines.find(d => d.id === selected);
  if (!x) {
    $('detail').innerHTML = `<aside class="insp empty"><p class="dim">Pick any of the forty and you get what the
      doctrine asks for, how we rate ourselves against it, and the artefact that rating rests on — so you can go and
      disagree with it.</p></aside>`;
    return;
  }
  $('detail').innerHTML = `<aside class="insp">
    <button class="ix" data-close aria-label="Close">×</button>
    <h4><span class="did inline">${esc(x.id)}</span> ${esc(x.name)}</h4>
    <p class="small dim">${esc(D.categories[x.cat].label)} · Phase ${x.phase} — ${esc(D.phases[x.phase].label)}</p>
    <p class="small"><b>What the doctrine asks for.</b> ${esc(x.what)}</p>
    <p class="dverdict s-${x.status}">${esc(D.statuses[x.status].label)}<span>${esc(D.statuses[x.status].note)}</span></p>
    <p class="small"><b>Us.</b> ${x.us}</p>
    ${x.evidence.length ? `<p class="small"><b>Rests on:</b><br>${x.evidence.map(
      ([label, href]) => `<a href="${esc(href)}">${esc(label)}</a>`).join('<br>')}</p>` : ''}
  </aside>`;
  $('detail').querySelector('[data-close]')?.addEventListener('click', () => {
    selected = null; renderGrid(); renderDetail();
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && selected) { selected = null; renderGrid(); renderDetail(); }
});
