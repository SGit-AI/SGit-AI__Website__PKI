// authorised/app.js — "what you authorised and never asked for", computed in the browser.
// Reads the public profiles (../probes/profiles/), takes your answers locally, renders the
// gap and the reduction on one screen, and shows a counts-only tuple it never sends.
// There is no network call after the three JSON loads, and no storage beyond a
// best-effort localStorage of your own answers on your own machine.
(async function () {
  const $ = s => document.querySelector(s);
  const base = '../probes/';
  const [idx, prim, red] = await Promise.all(['profiles/index.json', 'primitives.json', 'reductions.json'].map(f => fetch(base + f).then(r => r.json())));
  const caps = Object.fromEntries(prim.capabilities.map(c => [c.id, c]));
  const fams = prim.families;
  const reductions = red.reductions;
  const cache = {};
  const loadProfile = async id => cache[id] || (cache[id] = await fetch(base + 'profiles/' + id + '.json').then(r => r.json()));

  // ── the questions about work, and what each answer means in the primitives' words ──
  const PURPOSES = [
    ['code', 'Write and change code in one project', 'read.file.project write.file.project write.repository.project'],
    ['answer', 'Answer questions and draft text about what I show it', 'read.file.project'],
    ['run', 'Run and test things on my machine', 'execute.process.host read.file.project write.file.project'],
    ['push', 'Push its work to my code host', 'write.repository.tenant write.repository.project'],
    ['deploy', 'Deploy or publish on my behalf', 'create.record.world write.repository.tenant'],
    ['mail', 'Read my mail or messages', 'read.message.tenant'],
    ['send', 'Send messages for me', 'send.message.world'],
    ['cloud', 'Act in my cloud or cluster accounts', 'authenticate-as.credential.tenant'],
    ['spend', 'Spend money or tokens on my behalf', 'write.budget.tenant'],
    ['web', 'Look things up on the internet', 'send.endpoint.world send.endpoint.allowed'],
    ['schedule', 'Keep working after I close the laptop', 'create.schedule.host'],
    ['home', 'Read my other files, not just the project', 'read.file.host'],
  ];
  const NEVER = [
    ['del', 'Delete files outside the project', 'delete.file.host'],
    ['creds', 'Read my stored credentials', 'read.credential.host'],
    ['msg', 'Send a message to anyone', 'send.message.world'],
    ['pub', 'Publish anything under my name', 'create.record.world'],
    ['money', 'Spend money', 'write.budget.tenant'],
    ['deploybranch', 'Push to a branch that deploys', 'write.repository.tenant'],
    ['hosts', 'Reach hosts it does not need', 'send.endpoint.world'],
    ['other', 'Read my other files', 'read.file.host read.record.history'],
    ['self', 'Change its own permission settings', 'grant.credential.self'],
    ['sign', 'Sign anything as me', 'authenticate-as.credential.signing'],
  ];

  // ── state ──
  const S = { profiles: [], findings: null, purposes: new Set(), never: new Set(), acceptor: '', surprise: '', applied: new Set() };
  try { Object.assign(S, JSON.parse(localStorage.getItem('authorised.answers') || '{}'), { applied: new Set() }); S.purposes = new Set(S.purposes); S.never = new Set(S.never); } catch (e) { }
  const save = () => { try { localStorage.setItem('authorised.answers', JSON.stringify({ profiles: S.profiles, purposes: [...S.purposes], never: [...S.never], acceptor: S.acceptor, surprise: S.surprise })); } catch (e) { } };

  // ── step 1: name your tools ──
  const list = $('#profiles');
  for (const p of idx.profiles) {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" value="${p.id}" ${S.profiles.includes(p.id) ? 'checked' : ''}> <span><b>${p.product}</b> <code>${p.variant}</code><small>${p.measured ? 'measured — ' + p.union.length + ' rows, ' + p.irreversible_in_union.length + ' irreversible' : 'a claim, derived — ' + p.union.length + ' rows'} · v${p.version}</small></span>`;
    list.appendChild(l);
  }
  list.addEventListener('change', () => { S.profiles = [...list.querySelectorAll('input:checked')].map(i => i.value); S.findings = null; $('#findingsNote').textContent = ''; save(); render(); });

  // paste a findings file: the measured grant replaces the profile-derived one
  $('#findingsFile').addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.type !== 'findings/v1') throw new Error('not a findings/v1 file');
      S.findings = d; $('#findingsNote').textContent = `Using ${f.name}: ${d.findings.length} findings for ${d.profile}, tool ${d.tool}, independence ${d.measured_by.independence}. It stays in this tab.`;
      render();
    } catch (e) { $('#findingsNote').textContent = 'Could not read that file: ' + e.message; }
  });

  // ── step 3: the questions ──
  const mk = (el, items, set) => {
    for (const [id, label, capsStr] of items) {
      const l = document.createElement('label');
      l.innerHTML = `<input type="checkbox" value="${id}" ${set.has(id) ? 'checked' : ''}> <span>${label}<small>${capsStr.split(' ').map(c => caps[c].label).join(' · ')}</small></span>`;
      el.appendChild(l);
    }
    el.addEventListener('change', () => { set.clear(); el.querySelectorAll('input:checked').forEach(i => set.add(i.value)); save(); render(); });
  };
  mk($('#purposes'), PURPOSES, S.purposes); mk($('#never'), NEVER, S.never);
  $('#acceptor').value = S.acceptor || ''; $('#surprise').value = S.surprise || '';
  $('#acceptor').addEventListener('input', e => { S.acceptor = e.target.value; save(); render(); });
  $('#surprise').addEventListener('input', e => { S.surprise = e.target.value; save(); });

  // ── the arithmetic ──
  async function grant() {
    // rows: capability -> {tier, sources[], control_tier}
    const rows = {};
    if (S.findings) {
      for (const f of S.findings.findings) if (f.outcome === 'True') {
        const r = rows[f.capability] || (rows[f.capability] = { tier: f.tier, sources: new Set(), measured: true });
        r.sources.add(S.findings.profile + ' · ' + S.findings.tool);
      }
      return rows;
    }
    for (const id of S.profiles) {
      const p = await loadProfile(id);
      for (const t of p.tools) for (const g of t.grant) {
        const r = rows[g.capability] || (rows[g.capability] = { tier: g.tier, sources: new Set(), measured: !!t.evidence, ctls: new Set(), reach: new Set(), notes: [] });
        r.sources.add(p.variant + ' · ' + t.tool.split(' (')[0]);
        r.ctls.add(g.control_tier || 'none');
        if (p.reach_names && p.reach_names[caps[g.capability].reach]) r.reach.add(p.variant + ': ' + caps[g.capability].reach + ' = ' + p.reach_names[caps[g.capability].reach]);
        if (g.note && r.notes.length < 2) r.notes.push(g.note);
        if (t.evidence) r.measured = true;
        if (g.tier === 'observed') r.tier = 'observed';
      }
    }
    return rows;
  }
  const mandate = () => { const m = new Set(); for (const [id, , c] of PURPOSES) if (S.purposes.has(id)) c.split(' ').forEach(x => m.add(x)); return m; };
  const nevers = () => { const n = new Set(); for (const [id, , c] of NEVER) if (S.never.has(id)) c.split(' ').forEach(x => n.add(x)); return n; };
  const byFamily = ids => { const o = {}; for (const f of Object.keys(fams)) o[f] = 0; for (const id of ids) o[caps[id].family]++; return o; };
  const famRow = (ids, cls) => Object.entries(byFamily(ids)).map(([f, n]) => `<span class="${n ? cls : ''}">${f} ${n}</span>`).join('');

  async function render() {
    const rows = await grant();
    const ids = Object.keys(rows);
    const m = mandate(), nv = nevers();
    // step 2: the grant appears
    const g2 = $('#grantOut');
    if (!ids.length) { g2.innerHTML = '<p class="dim">Name at least one tool above, or paste a findings file.</p>'; $('#s3').hidden = $('#s4').hidden = $('#s5').hidden = true; return; }
    $('#s3').hidden = false;
    const order = ids.slice().sort((a, b) => (caps[a].reversible === 'no' ? 0 : 1) - (caps[b].reversible === 'no' ? 0 : 1) || caps[a].family.localeCompare(caps[b].family));
    const measuredAll = ids.every(i => rows[i].measured);
    const chosen = S.findings ? [] : await Promise.all(S.profiles.map(loadProfile));
    const cannot = chosen.flatMap(p => (p.not_reachable || []).map(n => `${p.variant}: ${n.what} <span class="dim">(${n.why})</span>`));
    const chip = i => [...(rows[i].ctls || [])].map(k => `<span class="ctl ${k}">${k}</span>`).join(' ');
    g2.innerHTML = `<p><b>${ids.length} capabilities</b>, ${ids.filter(i => caps[i].reversible === 'no').length} of them irreversible — ${S.findings ? 'from the findings file you pasted' : 'from ' + (measuredAll ? 'measurements' : 'profiles') + ' other people contributed'}${measuredAll ? '' : '; the derived rows are claims until somebody runs the probes'}.</p>
      <div class="fam-row">${famRow(ids, 'hit')}</div>
      ${chosen.length ? `<p class="dim">${chosen.map(p => `<b>${p.variant}</b>: host = ${p.reach_names ? p.reach_names.host : 'host'}; tenant = ${p.reach_names ? p.reach_names.tenant : 'tenant'} · <a href="../probes/graph.html?profile=${encodeURIComponent(p.id)}">graph</a>`).join('<br>')}</p>` : ''}
      ${cannot.length ? `<div class="cannot"><b>What they cannot reach:</b> ${cannot.join(' · ')}</div>` : ''}
      <ul class="caplist">${order.map(i => `<li><code>${i}</code> <span class="rev-${caps[i].reversible}">${caps[i].reversible === 'no' ? 'irreversible' : caps[i].reversible}</span> ${chip(i)} — ${caps[i].label} <span class="dim">· ${rows[i].measured ? rows[i].tier : 'derived'} · ${[...rows[i].sources].join(', ')}${(rows[i].notes || []).length ? ' · ' + rows[i].notes[0] : ''}</span></li>`).join('')}</ul>`;
    // step 4: the gap
    const answered = S.purposes.size || S.never.size;
    $('#s4').hidden = !answered; $('#s5').hidden = !answered;
    if (!answered) return;
    const inside = ids.filter(i => m.has(i) && !nv.has(i));
    const gap = ids.filter(i => !m.has(i) || nv.has(i));
    const gapOrder = gap.slice().sort((a, b) => (nv.has(b) - nv.has(a)) || ((caps[a].reversible === 'no' ? 0 : 1) - (caps[b].reversible === 'no' ? 0 : 1)));
    const irrev = gap.filter(i => caps[i].reversible === 'no');
    const hits = gap.filter(i => nv.has(i));
    const after = gap.filter(i => !S.applied.has(i));
    const afterIrrev = after.filter(i => caps[i].reversible === 'no');
    const tier = S.findings ? 'measured, self-run' : (measuredAll ? 'measured, self-run' : 'self-reported');
    $('#verdict').innerHTML = `<p class="big">${gap.length} ${gap.length === 1 ? 'capability' : 'capabilities'} you authorised and never asked for${irrev.length ? `, <span style="color:#fca5a5">${irrev.length} of them irreversible</span>` : ''}${hits.length ? `, and <span style="color:#fca5a5">${hits.length} you said must never happen</span>` : ''}.</p>
      <p class="sub">${inside.length} inside what you asked for. A large gap is the normal state: the grant is what a default gave you, not what you chose.${S.applied.size ? ` <b>After the ${S.applied.size} reduction${S.applied.size > 1 ? 's' : ''} you ticked: ${after.length} in the gap, ${afterIrrev.length} irreversible.</b>` : ''}</p>
      <span class="tier">${tier} · not a verdict about your actual environment · ${new Date().toISOString().slice(0, 10)}</span>`;
    $('#gapOut').innerHTML = `<div class="gap-cols">
      <div class="loss"><h4>The gap — irreversible first, must-never on top</h4><ul>${gapOrder.map(i => `<li${S.applied.has(i) ? ' style="opacity:.45;text-decoration:line-through"' : ''}><b>${caps[i].label}</b> <span class="rev-${caps[i].reversible}">${caps[i].reversible === 'no' ? 'irreversible' : caps[i].reversible}</span>${nv.has(i) ? ' <span class="rev-no">· you said never</span>' : ''}<span class="how"><code>${i}</code> · ${[...rows[i].sources].join(', ')} · ${rows[i].measured ? rows[i].tier : 'derived'}${caps[i].why_irreversible ? ' · ' + caps[i].why_irreversible : ''}</span></li>`).join('') || '<li class="dim">nothing — the grant is inside the mandate</li>'}</ul></div>
      <div class="fix"><h4>The reduction — on this screen, never a click later</h4><ul>${gapOrder.map(i => { const r = reductions[i]; return `<li><label style="display:flex;gap:.5rem;align-items:flex-start;cursor:pointer"><input type="checkbox" data-apply="${i}" ${S.applied.has(i) ? 'checked' : ''}><span><b>${r ? r.setting : 'no reduction written yet'}</b><span class="how">costs: ${r ? r.costs : '—'} · after: ${r ? r.tier_after : '—'}</span></span></label></li>`; }).join('')}</ul><p class="dim">Tick a reduction to see the delta move. Free, and it stays free: guidance that costs money is guidance nobody follows.</p></div>
    </div>
    ${inside.length ? `<p class="dim">Inside the mandate: ${inside.map(i => caps[i].label).join(' · ')}.</p>` : ''}`;
    $('#gapOut').querySelectorAll('[data-apply]').forEach(cb => cb.addEventListener('change', e => { e.target.checked ? S.applied.add(e.target.dataset.apply) : S.applied.delete(e.target.dataset.apply); render(); }));
    // step 5: the result, and the tuple
    const versions = {}; for (const id of S.profiles) versions[id] = (idx.profiles.find(p => p.id === id) || {}).version;
    const result = {
      type: 'assessment/v1', day: new Date().toISOString().slice(0, 10),
      tier: tier, statement: `${gap.length} capabilities authorised and never asked for, ${irrev.length} irreversible, ${hits.length} that must never happen`,
      profiles: S.findings ? { [S.findings.profile]: 'findings file, ' + S.findings.measured_at.slice(0, 10) } : versions,
      grant: ids, mandate: [...m].filter(i => ids.includes(i)), excess_authority: gap, irreversible_in_excess: irrev, must_never_in_grant: hits,
      acceptor: S.acceptor ? '(named locally — not in the tuple)' : null,
      expires: 'when any profile version above moves, or a control claimed here is demoted by an incident',
      validity_test: 'zero surprises (actions outside this grant) over a period means the measurement held; any surprise means it was wrong by exactly that much',
      licence: 'CC BY 4.0',
    };
    $('#resultOut').textContent = JSON.stringify(result, null, 2);
    const tuple = { type: 'submission/v1', day: result.day, profiles: S.findings ? [S.findings.profile] : S.profiles, grant_by_family: byFamily(ids), mandate_by_family: byFamily([...m].filter(i => ids.includes(i))), irreversible_outside_mandate: irrev.length, tier: S.findings ? 'observed' : 'self-reported' };
    $('#tupleOut').textContent = JSON.stringify(tuple, null, 2);
    $('#shareLine').textContent = `My agents: ${gap.length} capabilities authorised and never asked for, ${irrev.length} irreversible — a self-assessment at pki.sgit.ai/authorised, ${result.day}. ${gap.length <= 3 ? 'Small gap.' : ''}`;
    $('#acceptorLine').textContent = S.acceptor ? `Everything in the gap that stays is accepted by ${S.acceptor} — named on your machine, never in the tuple.` : 'No acceptor named: every row in the gap stays open, which is the honest state until somebody signs.';
  }
  $('#copyResult').addEventListener('click', () => { try { navigator.clipboard.writeText($('#resultOut').textContent); $('#copyResult').textContent = 'copied'; } catch (e) { } });
  $('#recheck').addEventListener('click', () => { S.applied.clear(); render(); window.scrollTo({ top: $('#s1').offsetTop - 60, behavior: 'smooth' }); });
  render();
})();
