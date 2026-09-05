// app.js — the play screen: the transcript on the left, the inspector on the right.
// Three classes in the inspector, never mixed: ASSERTED (you said), INFERRED (from the leading
// profile's measured grant), POSSIBLE (still consistent). Demo mode plays a profile's own modal
// answers so a change to the data can be watched land. Nothing is sent anywhere.
(async function () {
  const $ = s => document.querySelector(s); const esc = WhichAgent.esc;
  const D = await WhichAgent.load('./'); const G = new WhichAgent.Game(D);
  const GH = 'https://github.com/SGit-AI/SGit-AI__Website__PKI';
  const params = new URLSearchParams(location.search);
  let demo = params.get('demo'); if (demo === 'random') demo = D.P[Math.floor(Math.random() * D.P.length)];
  if (demo && !D.byId[demo]) demo = null;
  let autoplay = false, timer = null;
  const log = $('#log'), ask = $('#ask'), insp = $('#inspector');
  const say = (role, html, cls) => { const m = document.createElement('div'); m.className = 'msg ' + role + (cls ? ' ' + cls : ''); m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; };
  const chip = q => `<span class="tag ${q.class === 'eliciting' ? 'measures' : ''}">${q.class === 'eliciting' ? 'measures · ' : 'identifies · '}${q.funny ? '☺ · ' : ''}reliability ${(q.reliability * 100).toFixed(0)}%</span>`;
  const lab = c => `<span class="lab">${c}</span>`;
  const capLabel = c => D.caps[c] ? D.caps[c].label : c;
  const src = (n, txt) => n ? `<a href="${esc(n.view)}">${esc(txt || 'source')}</a> <a href="${esc(n.edit)}">edit</a>` : '';
  const sect = (id, title, cnt, body, open) => `<details id="${id}" ${open ? 'open' : ''}><summary>${title}<span class="cnt">${cnt}</span></summary><div class="body">${body}</div></details>`;
  const openState = {}; // remember which sections the player opened
  insp.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS') openState[e.target.id] = e.target.open; }, true);

  say('ai', `<span class="tag">RiskMandate.ai</span>Think of an AI agent, assistant or developer tool — or a tool you connected to something. I'll ask a few questions and try to identify it, or tell you I haven't met yours yet.<span class="help">Cheap questions first, to identify. Then a few that measure: those are already predictions about what it can do, and a wrong answer there is not noise, it is the finding.</span>`);
  if (demo) { $('#demoBar').innerHTML = `<span class="demo-on">demo · ${esc(D.byId[demo].variant)}</span> <span>answers are the profile's own modal answers, not a person's</span> <button class="btn alt" id="stepBtn" type="button">next step</button> <button class="btn" id="runBtn" type="button">run to the end</button> <a class="btn alt" href="index.html">play it yourself</a>`; say('sys', `demo: ${esc(D.byId[demo].product)} · ${esc(D.byId[demo].variant)} — every answer below is scripted from the profile`); }
  else $('#demoBar').innerHTML = `<span>Want to see it run? </span><a class="btn alt" href="?demo=random">demo, a random profile</a> <select id="demoSel" class="dim"><option value="">demo a chosen profile…</option>${D.P.map(p => `<option value="${esc(p)}">${esc(D.byId[p].product)} · ${esc(D.byId[p].variant)}</option>`).join('')}</select>`;
  const dsel = $('#demoSel'); if (dsel) dsel.onchange = () => { if (dsel.value) location.search = '?demo=' + encodeURIComponent(dsel.value); };

  async function renderInspector(q) {
    const lead = G.lead(), conf = G.conf(); const lp = await G.ensure(lead); const m = D.byId[lead];
    const belief = '<div class="belief">' + D.P.slice().sort((x, y) => G.b[y] - G.b[x]).map(p => `<div class="${p === lead ? 'lead-p' : ''}"><span>${esc(D.byId[p].product)} <code>${esc(D.byId[p].variant)}</code></span><span class="bar"><i style="width:${(G.b[p] * 100).toFixed(1)}%"></i></span><span>${(G.b[p] * 100).toFixed(0)}%</span></div>`).join('') + '</div>';
    const asserted = G.history.length ? '<ul>' + G.history.map(s => `<li class="asserted">${lab('asserted')}<b>${s.answer === null ? 'not sure' : s.answer ? 'yes' : 'no'}</b> — ${esc(s.text)} <span class="dim">· ${s.class === 'eliciting' ? 'measures' : 'identifies'} · reliability ${(s.reliability * 100).toFixed(0)}%</span></li>`).join('') + '</ul>' : '<p class="dim">Nothing asserted yet.</p>';
    const elic = G.history.filter(s => s.class === 'eliciting');
    const inferred = (elic.length ? '<ul>' + elic.map(s => `<li class="inferred">${lab('inferred')}the leading profile <b>${esc(m.variant)}</b> ${G.holds(lead, s.asks_about) ? 'holds' : 'does not hold'} <i>${esc(capLabel(s.asks_about))}</i>${(lp.refine && lp.refine[s.asks_about]) ? ' at ' + [].concat(lp.refine[s.asks_about]).map(r => esc((D.nodes[r] || {}).label || r)).join(', ') : ''} — you said <b>${s.answer === null ? 'not sure' : s.answer ? 'yes' : 'no'}</b> <span class="${s.answer === null ? 'dim' : (G.holds(lead, s.asks_about) === s.answer ? 'agree' : 'disagree')}">${s.answer === null ? '' : (G.holds(lead, s.asks_about) === s.answer ? '· agree' : '· disagree')}</span></li>`).join('') + '</ul>' : '<p class="dim">No measuring question answered yet; the inferred rows appear as they are.</p>')
      + `<p class="inferred" style="margin-top:.5rem">${lab('inferred')}if it is <b>${esc(m.variant)}</b>: ${m.union.length} capabilities, ${m.irreversible_in_union.length} irreversible${(lp.not_reachable || []).length ? '; cannot reach ' + lp.not_reachable.map(n => esc(n.what)).join(', ') : ''}. ${m.measured ? 'Measured, self-run.' : 'A derived profile — a claim.'}</p>`;
    const possible = D.P.filter(p => p !== lead && G.b[p] >= 0.05).sort((x, y) => G.b[y] - G.b[x]);
    const possibleHtml = possible.length ? '<ul>' + possible.map(p => `<li class="possible">${lab('possible')}${esc(D.byId[p].product)} <code>${esc(D.byId[p].variant)}</code> at ${(G.b[p] * 100).toFixed(0)}%</li>`).join('') + '</ul>' : '<p class="dim">Nothing else above 5%.</p>';
    let why = '<p class="dim">No question pending.</p>';
    if (q) { const top = D.P.slice().sort((x, y) => G.b[y] - G.b[x]).slice(0, 3); why = `<p><b>${esc(q.text)}</b></p><p>Expected gain ${G.gain(q).toFixed(2)} bits · ${q.class === 'eliciting' ? 'a measuring question about <i>' + esc(capLabel(q.asks_about)) + '</i>' : 'an identifying question'} · reliability ${(q.reliability * 100).toFixed(0)}%: ${esc(q.reliability_note || '')}</p><ul>${top.map(p => `<li class="possible">${esc(D.byId[p].variant)} would say yes ${(q.p_yes[p] * 100).toFixed(0)}% of the time</li>`).join('')}</ul><p class="dim">${src(D.nodes['q:' + q.id], 'this question\'s file')}</p>`; }
    const dis = G.disagreements(lead).filter(d => d.kind === 'unpredicted' || d.kind === 'over');
    const disHtml = dis.length ? '<ul>' + dis.map(d => `<li class="inferred">${lab('inferred')}<span class="disagree">${d.kind === 'unpredicted' ? 'you did not know' : 'you expected more'}</span>: <i>${esc(d.label)}</i>${d.reach.length ? ' at ' + d.reach.map(esc).join(', ') : ''} <span class="rev-${d.reversible}">${d.reversible === 'no' ? '· irreversible' : ''}</span></li>`).join('') + '</ul><p class="dim">Against the current leader; the set is final at the reveal.</p>' : '<p class="dim">No disagreement yet.</p>';
    const evid = lp.tools.filter(t => t.evidence).map(t => `<a href="../probes/${esc(t.evidence)}">${esc(t.tool.split(' (')[0])} evidence</a>`).join(' · ');
    const sources = `<p class="srcs"><b>Leading profile:</b> ${src(D.nodes['profile:' + lead], lp.id)}${evid ? ' · ' + evid : ' · no evidence file: a claim'}</p><p class="srcs"><b>The question set:</b> <a href="tree.json">tree.json</a> (compiled from <a href="${GH}/tree/dev/probes/mesh/questions">questions/</a>) · <b>the mesh:</b> <a href="../probes/mesh/graph.json">graph.json</a> · <a href="data.html">how to correct a mapping</a></p>`;
    const graphs = `<p><a href="graph.html?node=${encodeURIComponent('profile:' + lead)}">Walk the mesh from ${esc(m.variant)} →</a><br><a href="../probes/graph.html?profile=${encodeURIComponent(lead)}">${esc(m.variant)} as a grant graph →</a></p><p class="dim">${esc(m.reach_names ? 'host = ' + m.reach_names.host + ' · tenant = ' + m.reach_names.tenant : '')}</p>`;
    insp.innerHTML = sect('s-belief', 'The belief', `${esc(m.variant)} ${(conf * 100).toFixed(0)}%`, belief, openState['s-belief'] !== false)
      + sect('s-why', 'Why this question', q ? (q.class === 'eliciting' ? 'measures' : 'identifies') : '', why, openState['s-why'] !== false)
      + sect('s-asserted', 'Asserted — you said', G.history.length, asserted, openState['s-asserted'])
      + sect('s-inferred', 'Inferred — from the leading profile', elic.length, inferred, openState['s-inferred'] !== false && elic.length > 0)
      + sect('s-possible', 'Possible — still consistent', possible.length, possibleHtml, openState['s-possible'])
      + sect('s-dis', 'Disagreements so far', dis.length, disHtml, openState['s-dis'])
      + sect('s-sources', 'Sources & corrections', '', sources, openState['s-sources'])
      + sect('s-graph', 'The graph', '', graphs, openState['s-graph']);
  }

  async function step() {
    const q = G.next();
    if (q) {
      const phaseNote = (G.phase === 'elicit' && G.elicited === 0 && !G.history.some(s => s.phase === 'elicit')) ? `<div class="msg sys">the belief has settled on ${esc(D.byId[G.lead()].variant)} — now a few questions that measure</div>` : '';
      if (phaseNote) log.insertAdjacentHTML('beforeend', phaseNote);
      say('ai', `${chip(q)}${esc(q.text)}${q.help ? `<span class="help">${esc(q.help)}</span>` : ''}`);
      ask.innerHTML = `<div class="answers"><button class="btn" data-a="yes" type="button">yes</button><button class="btn" data-a="no" type="button">no</button><button class="btn alt" data-a="unsure" type="button">not sure</button></div>`;
      await renderInspector(q);
      if (demo) { const a = G.demoAnswer(q, demo); if (autoplay) timer = setTimeout(() => answer(q, a), 650); }
      return;
    }
    if (G.phase === 'predict') return predictStep();
  }
  async function answer(q, a) {
    clearTimeout(timer);
    say('you', a === null ? 'not sure' : a ? 'yes' : 'no');
    const s = G.answer(q, a);
    if (s.before.lead !== s.lead) say('sys', `the belief now leans to ${esc(D.byId[s.lead].variant)} at ${(s.conf * 100).toFixed(0)}%`);
    if (q.class === 'eliciting' && a !== null) { const holds = G.holds(s.lead, q.asks_about); say('sys', `inferred: if it is ${esc(D.byId[s.lead].variant)}, it ${holds ? 'holds' : 'does not hold'} “${esc(capLabel(q.asks_about))}” — ${holds === a ? 'you agree' : 'you disagree; kept as the finding'}`); }
    await step();
  }
  ask.addEventListener('click', e => { const v = e.target.dataset && e.target.dataset.a; if (v === undefined || !G.current) return; answer(G.current, v === 'yes' ? true : v === 'no' ? false : null); });

  async function predictStep() {
    const lead = G.lead(); const m = D.byId[lead];
    say('ai', `<span class="tag">the prediction · the experiment</span>${G.conf() >= G.S.not_in_set_below ? `I have a leading guess at ${(G.conf() * 100).toFixed(0)}% after ${G.history.length} questions. It stays hidden until you predict.` : `I haven't met yours yet: after ${G.history.length} questions no profile reaches ${(G.S.not_in_set_below * 100).toFixed(0)}%. That is a finding, not a failure — <a href="data.html#how">add a profile or a question</a>. Predict anyway and I'll show the nearest profile, labelled as nearest.`}<span class="help">Which of these can it do? Tick every family you think its grant contains. This measures your sense of scale; the measuring questions already recorded the specific gaps.</span>`);
    ask.innerHTML = `<div class="choices" id="famChoices">${D.tree.prediction.families.map(f => `<label><input type="checkbox" value="${f}"> <span>${f}<small>${esc(D.prim.families[f])}</small></span></label>`).join('')}</div><p><label><input type="checkbox" id="predIrrev"> …and do you think any of it is irreversible?</label></p><p><button class="btn" id="predictBtn" type="button">that is my prediction — show me</button></p>`;
    await renderInspector(null);
    $('#predictBtn').onclick = () => reveal([...ask.querySelectorAll('#famChoices input:checked')].map(i => i.value), $('#predIrrev').checked);
    if (demo) { const fams = [...new Set(m.union.map(c => D.caps[c].family))].filter(f => !['identity', 'schedule'].includes(f)); const go = () => { ask.querySelectorAll('#famChoices input').forEach(i => i.checked = fams.includes(i.value)); reveal(fams, false); }; if (autoplay) timer = setTimeout(go, 900); else $('#stepBtn').onclick = go; }
  }
  async function reveal(fams, irrev) {
    clearTimeout(timer);
    say('you', `my prediction: ${fams.length ? fams.map(esc).join(', ') : 'nothing ticked'}${irrev ? ' · some of it irreversible' : ''}`);
    const matched = G.predict(fams, irrev); const pid = matched || G.lead(); const m = D.byId[pid]; const lp = await G.ensure(pid);
    const dis = G.disagreements(pid); const gaps = dis.filter(d => d.kind === 'unpredicted'); const over = dis.filter(d => d.kind === 'over'); const known = G.knownFraction(dis); const sc = G.scaleGap(pid);
    say('ai', `<span class="tag">the reveal</span>${matched ? `It is <b>${esc(m.product)}</b> <code>${esc(m.variant)}</code>, at ${(G.conf() * 100).toFixed(0)}%.` : `Nearest: <b>${esc(m.product)}</b> <code>${esc(m.variant)}</code> — I haven't met yours yet.`}<span class="help">${m.measured ? 'A measured profile, self-run.' : 'A derived profile — a claim.'} Matched from your answers, the weakest tier there is; not a measurement of your environment.</span>`);
    const run = G.toRun(demo); try { localStorage.setItem('guess.run', JSON.stringify(run)); } catch (e) { }
    ask.innerHTML = `<div class="verdict"><p class="big">${gaps.length ? `<span style="color:#fca5a5">${gaps.length}</span> ${gaps.length === 1 ? 'thing' : 'things'} it can do that you did not know${gaps.some(d => d.reversible === 'no') ? `, <span style="color:#fca5a5">${gaps.filter(d => d.reversible === 'no').length} irreversible</span>` : ''}` : (dis.length ? 'You knew every measured capability it holds.' : 'No measuring question reached it.')}${over.length ? ` · ${over.length} you expected that it does not hold` : ''}${known !== null ? ` · you knew ${(known * 100).toFixed(0)}% of what was asked` : ''}.</p>
      <p class="sub">Sense of scale: ${sc.unpredicted.length} of ${sc.families_held.length} families unpredicted${sc.irreversible_held ? (irrev ? '; you expected irreversibility, and ' + sc.irreversible_held + ' rows are' : '; you did not expect irreversibility, and ' + sc.irreversible_held + ' rows are') : ''}. A gap is the normal state: almost nobody can enumerate what they have granted.</p>
      <span class="tier">${m.measured ? 'profile measured, self-run' : 'profile derived — a claim'} · matched from answers · not a measurement of your environment</span></div>
      ${lp.reach_names ? `<p class="dim">For this profile <b>host</b> means ${esc(lp.reach_names.host)}; <b>tenant</b> means ${esc(lp.reach_names.tenant)}.</p>` : ''}
      ${(lp.not_reachable || []).length ? `<div class="cannot"><b>What it cannot reach:</b> ${lp.not_reachable.map(n => `${esc(n.what)} <span class="dim">(${esc(n.why)})</span>`).join(' · ')}</div>` : ''}
      <div class="gap-cols">
        <div class="loss"><h4>The specific gap — per question, with its reach</h4><ul>${dis.length ? dis.map(d => `<li><b>${esc(d.label)}</b>${d.reach.length ? ' <span class="dim">at ' + d.reach.map(esc).join(', ') + '</span>' : ''} <span class="rev-${d.reversible}">${d.reversible === 'no' ? 'irreversible' : d.reversible}</span><span class="how">you said <b>${d.answer === null ? 'not sure' : d.answer ? 'yes' : 'no'}</b> · the profile ${d.holds ? 'holds it' : 'does not'} · <span class="${d.kind === 'known' || d.kind === 'known-absent' ? 'agree' : d.kind === 'unsure' ? 'dim' : 'disagree'}">${{ known: 'you knew', 'known-absent': 'you knew it does not', unpredicted: 'you did not know', over: 'you expected more', unsure: 'not sure' }[d.kind]}</span> · reliability ${(d.reliability * 100).toFixed(0)}%</span></li>`).join('') : '<li class="dim">no measuring question was asked</li>'}</ul></div>
        <div class="fix"><h4>The reduction — on this screen</h4><ul>${(gaps.length ? gaps : dis.filter(d => d.holds)).map(d => `<li><b>${esc(d.label)}</b><span class="how">${d.fix ? esc(d.fix.setting) + ' · costs: ' + esc(d.fix.costs) + ' · after: ' + esc(d.fix.tier_after) : 'no reduction written yet'}</span></li>`).join('') || '<li class="dim">nothing to reduce from what was asked</li>'}</ul></div>
      </div>
      <p><a class="btn" href="report.html">the full report →</a> <a class="btn alt" href="graph.html?node=${encodeURIComponent('profile:' + pid)}">walk the mesh from here</a> <a class="btn alt" href="index.html">play again</a></p>
      <p class="dim"><b>The truth in ten minutes:</b> this is a hypothesis about a grant from ${G.history.length} answers. <a href="../probes/index.html#run">Run the probes</a> where the agent lives and the measured file replaces the guess.</p>`;
    await renderInspector(null);
    say('sys', `run saved in this browser only · <a href="report.html">report</a>`);
  }
  // demo controls
  if (demo) {
    $('#stepBtn').onclick = () => { if (G.current) answer(G.current, G.demoAnswer(G.current, demo)); };
    $('#runBtn').onclick = () => { autoplay = true; $('#runBtn').disabled = true; if (G.current) answer(G.current, G.demoAnswer(G.current, demo)); };
  }
  await step();
})();
