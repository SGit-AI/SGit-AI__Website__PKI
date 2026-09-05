// graph.js — the mesh navigator: start anywhere. Pick any node; see what points at it on the
// left and what it points to on the right, grouped by edge type; click to recentre. Coarse and
// fine are the same shape, so an exposure zooms out to its capability and family by member-of,
// and a reach node answers "which products touch this?" by walking inward.
(async function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = await fetch('../probes/mesh/graph.json').then(r => r.json());
  const N = Object.fromEntries(G.nodes.map(n => [n.id, n]));
  const out = {}, inn = {};
  for (const e of G.edges) { (out[e.from] = out[e.from] || []).push(e); (inn[e.to] = inn[e.to] || []).push(e); }
  const ET = G.ontology.edge_types;
  const sel = $('#nodeSel'); const dl = $('#nodeList');
  const order = ['profile', 'reach', 'capability', 'family', 'exposure', 'tool', 'env', 'obligation', 'question', 'evidence', 'vendor'];
  for (const t of order) { const og = document.createElement('optgroup'); og.label = t; for (const n of G.nodes.filter(n => n.type === t).sort((a, b) => a.label.localeCompare(b.label))) { const o = document.createElement('option'); o.value = n.id; o.textContent = n.label.length > 70 ? n.label.slice(0, 68) + '…' : n.label; og.appendChild(o); } sel.appendChild(og); }
  $('#counts').textContent = Object.entries(G.counts).map(([k, v]) => `${v} ${k}${v === 1 ? '' : 's'}`).join(' · ') + ` · ${G.edges.length} edges`;
  const card = (n, extra, centre) => `<div class="ncard ${centre ? 'centre' : ''}" data-id="${esc(n.id)}"><span class="t ${esc(n.type)}">${esc(n.type)}</span> ${extra ? `<span class="et">${extra}</span>` : (n.type === 'exposure' && n.profile && !centre ? `<span class="et">${esc(n.profile)}</span>` : (n.type === 'tool' && n.profile && !centre ? `<span class="et">${esc(n.profile)}</span>` : ''))}<div><b>${esc(n.label)}</b></div>${centre ? attrs(n) : ''}<div class="srcs"><a href="${esc(n.view)}">source</a> <a href="${esc(n.edit)}">edit</a></div></div>`;
  function attrs(n) {
    const skip = new Set(['id', 'type', 'label', 'source', 'edit', 'view']);
    return '<div class="attrs">' + Object.entries(n).filter(([k, v]) => !skip.has(k) && v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => `<div><b>${esc(k)}</b>: ${typeof v === 'object' ? esc(JSON.stringify(v)) : esc(v)}</div>`).join('') + '</div>';
  }
  const group = (edges, side) => { const by = {}; for (const e of edges) (by[e.type] = by[e.type] || []).push(e); return Object.entries(by).map(([t, es]) => `<div class="egroup"><h5><code>${esc(t)}</code> <span class="dim">— ${esc((ET[t] || {}).means || '')}</span></h5>${es.map(e => { const n = N[side === 'in' ? e.from : e.to]; const extra = e.control_tier ? `control: ${esc(e.control_tier)} · tier: ${esc(e.tier)}${e.note ? ' · ' + esc(e.note) : ''}` : ''; return card(n, extra); }).join('')}</div>`).join('') || '<p class="dim">nothing</p>'; };
  function touches(id) {
    // reach ← at ← exposure ← reaches ← tool ← has-tool ← profile : which products touch this reach?
    const rows = [];
    for (const a of (inn[id] || []).filter(e => e.type === 'at')) for (const r of (inn[a.from] || []).filter(e => e.type === 'reaches')) for (const h of (inn[r.from] || []).filter(e => e.type === 'has-tool'))
      rows.push({ profile: N[h.from], tool: N[r.from], exposure: N[a.from], edge: r });
    return rows;
  }
  function show(id, push) {
    const n = N[id]; if (!n) return;
    sel.value = id; if (push !== false) history.replaceState(null, '', '?node=' + encodeURIComponent(id));
    $('#centre').innerHTML = card(n, '', true);
    $('#inbound').innerHTML = group(inn[id] || [], 'in'); $('#outbound').innerHTML = group(out[id] || [], 'out');
    let extra = '';
    if (n.type === 'reach') { const rows = touches(id); extra = `<h3>Which products touch ${esc(n.label)}?</h3>${rows.length ? `<div class="tablewrap"><table><thead><tr><th>profile</th><th>tool</th><th>capability</th><th>control</th><th>tier</th></tr></thead><tbody>${rows.map(r => `<tr><td><a href="?node=${encodeURIComponent(r.profile.id)}" data-go="${esc(r.profile.id)}">${esc(r.profile.label)}</a></td><td>${esc(r.tool.label)}</td><td>${esc(r.exposure.label.split(' @ ')[0])} <span class="rev-${esc(r.exposure.reversible)}">${r.exposure.reversible === 'no' ? 'irreversible' : ''}</span></td><td><span class="ctl ${esc(r.edge.control_tier || 'none')}">${esc(r.edge.control_tier || 'none')}</span></td><td>${esc(r.edge.tier)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="dim">No profile refines a capability onto this reach node yet — add a <code>refine</code> entry to a profile.</p>'}`; }
    if (n.type === 'profile') { const caps = {}; for (const h of (out[id] || []).filter(e => e.type === 'has-tool')) for (const r of (out[h.to] || []).filter(e => e.type === 'reaches')) { const x = N[r.to]; (caps[x.family] = caps[x.family] || []).push({ x, tool: N[h.to], e: r }); } extra = `<h3>What ${esc(n.variant)} reaches, by family</h3>` + Object.entries(caps).map(([f, rows]) => `<div class="egroup"><h5>${esc(f)}</h5>${rows.map(r => `<div class="ncard" data-id="${esc(r.x.id)}"><span class="t exposure">exposure</span> <span class="et">${esc(r.tool.label)} · control ${esc(r.e.control_tier || 'none')} · ${esc(r.e.tier)}</span><div><b>${esc(r.x.label)}</b> <span class="rev-${esc(r.x.reversible)}">${r.x.reversible === 'no' ? 'irreversible' : ''}</span></div></div>`).join('')}</div>`).join('') + `<p><a href="../probes/graph.html?profile=${encodeURIComponent(n.id.replace(/^profile:/, ''))}">as a grant graph →</a></p>`; }
    if (n.type === 'obligation') extra = `<div class="warnbox"><b>${esc(n.caveat || '')}</b></div>`;
    $('#extra').innerHTML = extra;
    window.scrollTo({ top: $('#centre').offsetTop - 80, behavior: 'smooth' });
  }
  document.addEventListener('click', e => { const c = e.target.closest('.ncard:not(.centre)'); if (c && !e.target.closest('a')) { show(c.dataset.id); e.preventDefault(); } const g = e.target.closest('[data-go]'); if (g) { show(g.dataset.go); e.preventDefault(); } });
  sel.onchange = () => show(sel.value);
  const want = new URLSearchParams(location.search).get('node');
  show(N[want] ? want : 'reach:fs:user-home' in N ? 'reach:fs:user-home' : 'fs:user-home', false);
})();
