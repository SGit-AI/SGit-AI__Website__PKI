// graph.js — a profile drawn as a graph: the profile, its tools, the capabilities each tool
// reaches (grouped by family), and what the profile cannot reach. Inline SVG from the
// profile JSON; no library; nothing sent. Every colour is doubled by a shape or a label:
// reversibility is the node's fill AND its word; the control tier is the edge's stroke
// AND its chip. Hover a node or edge for the row behind it; the table below is the same data.
window.ProfileGraph = { drawInto: null };
(async function () {
  const $ = s => document.querySelector(s);
  const base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/graph\.js.*$/, '') : './';
  const [idx, prim, red] = await Promise.all(['profiles/index.json', 'primitives.json', 'reductions.json'].map(f => fetch(base + f).then(r => r.json())));
  const caps = Object.fromEntries(prim.capabilities.map(c => [c.id, c]));
  const FAM = Object.keys(prim.families);
  const sel = $('#profileSel') || document.createElement('select');
  for (const p of idx.profiles) { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.product} · ${p.variant}${p.measured ? '' : ' (a claim)'}`; sel.appendChild(o); }
  const want = new URLSearchParams(location.search).get('profile');
  sel.value = idx.profiles.some(p => p.id === want) ? want : 'anthropic/claude-code-remote/ccr-container';
  sel.onchange = () => { history.replaceState(null, '', '?profile=' + encodeURIComponent(sel.value)); draw(); };
  let els = { graph: $('#graph'), reading: $('#reading'), table: $('#table'), links: $('#links') };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const REV = { no: { fill: '#b91c1c', ink: '#fff', word: 'irreversible' }, 'with-effort': { fill: '#fff', stroke: '#b45309', ink: '#7a3a05', word: 'with effort' }, yes: { fill: '#fff', stroke: '#9a9ea6', ink: '#34363c', word: 'reversible' } };
  const CTL = { boundary: { stroke: '#0f766e', width: 3, dash: '' }, setting: { stroke: '#b45309', width: 1.8, dash: '' }, expectation: { stroke: '#6b6f76', width: 1.4, dash: '2 4' }, none: { stroke: '#b91c1c', width: 1.4, dash: '6 4' } };

  async function draw(profileId) {
    const p = await fetch(base + 'profiles/' + (profileId || sel.value) + '.json').then(r => r.json());
    const m = idx.profiles.find(x => x.id === p.id);
    // rows: capability -> [{tool, tier, control, control_tier, note, probe}]
    const rows = {};
    p.tools.forEach((t, ti) => { for (const g of t.grant) (rows[g.capability] = rows[g.capability] || []).push({ ...g, tool: t.tool, ti, measured: !!t.evidence }); });
    const capIds = FAM.flatMap(f => Object.keys(rows).filter(c => caps[c].family === f).sort((a, b) => (caps[a].reversible === 'no' ? 0 : 1) - (caps[b].reversible === 'no' ? 0 : 1)));
    const notR = p.not_reachable || [];
    // geometry
    const W = 1040, rowH = 34, famGap = 14, top = 70;
    let y = top; const capY = {}; let lastFam = null;
    for (const c of capIds) { if (caps[c].family !== lastFam) { if (lastFam) y += famGap; lastFam = caps[c].family; } capY[c] = y; y += rowH; }
    const notTop = y + 30; const H = notTop + notR.length * rowH + 40;
    const xTool = 250, xCap = 450, capW = 360;
    const toolY = p.tools.map((t, i) => top + 30 + i * ((Math.max(y - top - 60, 120)) / Math.max(p.tools.length - 1, 1)));
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="grant graph of ${esc(p.id)}" style="max-width:${W}px;font-family:system-ui,sans-serif">`;
    // the profile node
    s += `<rect x="20" y="${top + (y - top) / 2 - 34}" width="150" height="68" rx="12" fill="#101114"/><text x="95" y="${top + (y - top) / 2 - 8}" fill="#fff" font-size="12" text-anchor="middle" font-weight="700">${esc(p.variant)}</text><text x="95" y="${top + (y - top) / 2 + 10}" fill="#c9c9c4" font-size="10" text-anchor="middle">${esc(p.surface)} · ${m.measured ? 'measured' : 'a claim'}</text><text x="95" y="${top + (y - top) / 2 + 26}" fill="#c9c9c4" font-size="10" text-anchor="middle">v${esc(p.version)}</text>`;
    // tools
    p.tools.forEach((t, i) => {
      s += `<path d="M170 ${top + (y - top) / 2} C 210 ${top + (y - top) / 2}, 210 ${toolY[i]}, ${xTool - 70} ${toolY[i]}" fill="none" stroke="#9a9ea6" stroke-width="1.4"/>`;
      s += `<rect x="${xTool - 70}" y="${toolY[i] - 18}" width="140" height="36" rx="9" fill="#fff" stroke="#101114" stroke-width="1.4"/><text x="${xTool}" y="${toolY[i] - 3}" font-size="11" text-anchor="middle" font-weight="700" fill="#101114">${esc(t.tool.split(' (')[0])}</text><text x="${xTool}" y="${toolY[i] + 11}" font-size="9.5" text-anchor="middle" fill="#6b6f76">${t.evidence ? 'evidence on file' : 'derived'} · ${t.grant.length} rows</text>`;
    });
    // edges then capability nodes
    let lastF = null;
    for (const c of capIds) {
      const cy = capY[c];
      if (caps[c].family !== lastF) { lastF = caps[c].family; s += `<text x="${xCap}" y="${cy - 19}" font-size="9.5" fill="#6b6f76" letter-spacing=".08em" style="text-transform:uppercase">${esc(lastF.toUpperCase())}</text>`; }
      for (const r of rows[c]) {
        const st = CTL[r.control_tier || 'none']; const ty = toolY[r.ti];
        s += `<path class="edge" data-cap="${esc(c)}" data-tool="${r.ti}" d="M${xTool + 70} ${ty} C ${xTool + 150} ${ty}, ${xCap - 90} ${cy}, ${xCap} ${cy}" fill="none" stroke="${st.stroke}" stroke-width="${st.width}" stroke-dasharray="${st.dash}" opacity=".85"><title>${esc(r.tool)} → ${esc(caps[c].label)}\ncontrol: ${esc(r.control_tier || 'none')}${r.control ? ' — ' + esc(r.control) : ''}\ntier: ${esc(r.tier)}${r.probe ? ' · probe ' + esc(r.probe) : ''}${r.note ? '\n' + esc(r.note) : ''}</title></path>`;
      }
      const rv = REV[caps[c].reversible]; const ctls = [...new Set(rows[c].map(r => r.control_tier || 'none'))];
      const rn = p.reach_names && p.reach_names[caps[c].reach];
      s += `<g class="cap" data-cap="${esc(c)}"><rect x="${xCap}" y="${cy - 14}" width="${capW}" height="28" rx="8" fill="${rv.fill}" stroke="${rv.stroke || rv.fill}" stroke-width="1.4"/>`;
      s += `<text x="${xCap + 10}" y="${cy + 4}" font-size="11" fill="${rv.ink}" font-weight="${caps[c].reversible === 'no' ? 700 : 500}">${esc(caps[c].label.length > 54 ? caps[c].label.slice(0, 52) + '…' : caps[c].label)}</text>`;
      s += `<title>${esc(caps[c].label)} (${esc(c)})\nreach: ${esc(caps[c].reach)}${rn ? ' = ' + esc(rn) : ''}\nreversible: ${esc(caps[c].reversible)}${caps[c].why_irreversible ? ' — ' + esc(caps[c].why_irreversible) : ''}\ncontrol: ${esc(ctls.join(' / '))}\nvia: ${esc(rows[c].map(r => r.tool).join(', '))}</title></g>`;
      s += `<text x="${xCap + capW + 10}" y="${cy + 4}" font-size="9.5" fill="${caps[c].reversible === 'no' ? '#b91c1c' : '#6b6f76'}" font-weight="${caps[c].reversible === 'no' ? 700 : 400}">${rv.word}</text><text x="${xCap + capW + 10}" y="${cy + 4}" dx="${rv.word.length * 5.6 + 6}" font-size="9.5" fill="#6b6f76">· ${esc(caps[c].reach)} · ${esc(ctls.join('/'))}</text>`;
    }
    // what it cannot reach
    if (notR.length) {
      s += `<text x="${xCap}" y="${notTop - 8}" font-size="9.5" fill="#6b6f76" letter-spacing=".08em">CANNOT REACH</text>`;
      notR.forEach((n, i) => { const cy = notTop + i * rowH + 10; s += `<g><rect x="${xCap}" y="${cy - 14}" width="${capW}" height="28" rx="8" fill="#f4f4f2" stroke="#9a9ea6" stroke-width="1.2" stroke-dasharray="4 3"/><text x="${xCap + 10}" y="${cy + 4}" font-size="11" fill="#6b6f76">${esc(n.what)}</text><title>${esc(n.what)}\n${esc(n.why)}\nsource: ${esc(n.source || '')}</title></g><text x="${xCap + capW + 10}" y="${cy + 4}" font-size="9.5" fill="#6b6f76">${esc((n.why || '').slice(0, 48))}</text>`; });
    }
    s += '</svg>';
    els.graph.innerHTML = s;
    // hover: dim everything but the hovered capability's edges
    const svg = els.graph.querySelector('svg');
    svg.querySelectorAll('.cap').forEach(g => { g.addEventListener('mouseenter', () => svg.querySelectorAll('.edge').forEach(e => e.style.opacity = e.dataset.cap === g.dataset.cap ? '1' : '.12')); g.addEventListener('mouseleave', () => svg.querySelectorAll('.edge').forEach(e => e.style.opacity = '.85')); });
    // the reading
    const irrev = capIds.filter(c => caps[c].reversible === 'no');
    const uncontrolled = irrev.filter(c => rows[c].every(r => (r.control_tier || 'none') === 'none'));
    const bounded = capIds.filter(c => rows[c].some(r => r.control_tier === 'boundary'));
    els.reading.innerHTML = `<p><b>${capIds.length} capabilities</b> across ${p.tools.length} tool${p.tools.length > 1 ? 's' : ''}; <b class="rev-no">${irrev.length} irreversible</b>, of which <b>${uncontrolled.length}</b> ${uncontrolled.length === 1 ? 'has' : 'have'} no control on any path; ${bounded.length} bounded by something the agent cannot reach; ${notR.length} thing${notR.length === 1 ? '' : 's'} it cannot reach at all.
      ${p.reach_names ? `<br><b>host</b> means ${esc(p.reach_names.host)} · <b>tenant</b> means ${esc(p.reach_names.tenant)} · <b>world</b> means ${esc(p.reach_names.world)}.` : ''}
      ${p.measured_note ? `<br><span class="dim">${esc(p.measured_note)}</span>` : ''}</p>
      <p class="dim">${esc(p.description)}</p>`;
    // the table view: the same rows
    els.table.innerHTML = `<table><thead><tr><th>tool</th><th>capability</th><th>reach</th><th>reversible</th><th>control</th><th>tier</th><th>note</th></tr></thead><tbody>` +
      p.tools.flatMap(t => t.grant.map(g => `<tr><td>${esc(t.tool)}</td><td><code>${esc(g.capability)}</code><br>${esc(caps[g.capability].label)}</td><td>${esc(caps[g.capability].reach)}</td><td class="rev-${caps[g.capability].reversible}">${esc(caps[g.capability].reversible)}</td><td><span class="ctl ${esc(g.control_tier || 'none')}">${esc(g.control_tier || 'none')}</span>${g.control ? '<br><span class="dim">' + esc(g.control) + '</span>' : ''}</td><td>${esc(g.tier)}${g.probe ? '<br><span class="dim">' + esc(g.probe) + '</span>' : ''}</td><td class="dim">${esc(g.note || '')}</td></tr>`)).join('') +
      notR.map(n => `<tr><td>—</td><td><i>cannot reach: ${esc(n.what)}</i></td><td></td><td></td><td></td><td></td><td class="dim">${esc(n.why)} · ${esc(n.source || '')}</td></tr>`).join('') + '</tbody></table>';
    els.links.innerHTML = `<a href="profiles/${esc(p.id)}.json">the profile JSON</a> · ${p.tools.filter(t => t.evidence).map(t => `<a href="${esc(t.evidence)}">${esc(t.tool.split(' (')[0])} evidence</a>`).join(' · ') || 'no evidence file: a claim'} · <a href="../guess/index.html">the game</a> · <a href="../authorised/index.html">the assessment</a>`;
  }
  window.ProfileGraph.drawInto = async (el, profileId) => { const mk = () => { const d = document.createElement('div'); el.appendChild(d); return d; }; els = { graph: mk(), reading: mk(), table: mk(), links: mk() }; els.graph.id = ''; await draw(profileId); };
  if ($('#profileSel')) draw();
})();
