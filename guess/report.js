// report.js — the whole run on one page: the answer, the clues, the three classes, the belief as
// it moved, the specific gap with its reach nodes, the sense of scale, the grant, what it cannot
// reach, the graph, the obligations worth checking, and the sources. From this browser's last run,
// or headless from a profile's own modal answers with ?demo=<profile id>.
(async function () {
  const $ = s => document.querySelector(s); const esc = WhichAgent.esc;
  const D = await WhichAgent.load('./');
  const params = new URLSearchParams(location.search);
  let run = null, demo = params.get('demo');
  if (demo === 'random') demo = D.P[Math.floor(Math.random() * D.P.length)];
  if (demo && D.byId[demo]) {
    const G = new WhichAgent.Game(D); let q;
    while ((q = G.next())) G.answer(q, G.demoAnswer(q, demo));
    await G.ensure(G.lead());
    const m = D.byId[demo]; const fams = [...new Set(m.union.map(c => D.caps[c].family))].filter(f => !['identity', 'schedule'].includes(f));
    G.predict(fams, false); await G.ensure(G.matched || G.lead()); run = G.toRun(demo);
  } else { try { run = JSON.parse(localStorage.getItem('guess.run') || 'null'); } catch (e) { } }
  if (!run) { $('#report').innerHTML = `<p class="note">No run in this browser yet. <a href="index.html">Play</a>, or open a demo report: ${D.P.map(p => `<a href="?demo=${encodeURIComponent(p)}">${esc(D.byId[p].variant)}</a>`).join(' · ')}.</p>`; return; }
  const pid = run.matched || run.nearest; const m = D.byId[pid]; const lp = await D.profile(pid); const pn = D.nodes['profile:' + pid];
  const lab = c => `<span class="lab">${c}</span>`;
  const gaps = run.disagreements.filter(d => d.kind === 'unpredicted'), over = run.disagreements.filter(d => d.kind === 'over');
  // obligations worth checking: reach nodes this profile refines onto, and what governs them
  const reachIds = [...new Set(Object.values(lp.refine || {}).flat())];
  const obls = {}; for (const e of D.graph.edges) if (e.type === 'governed-by' && reachIds.includes(e.from)) (obls[e.to] = obls[e.to] || new Set()).add(e.from);
  const belief = Object.entries(run.belief).sort((a, b) => b[1] - a[1]).slice(0, 6);
  $('#report').innerHTML = `
  <div class="report-head"><p class="kicker" style="color:#9fd3cc">RiskMandate.ai · which agent is it? · report · ${esc(run.day)}${run.demo ? ' · DEMO: answers scripted from the profile ' + esc(run.demo) : ''}</p>
    <h2>${run.matched ? `It is ${esc(m.product)} <code>${esc(m.variant)}</code>, at ${(run.confidence * 100).toFixed(0)}%` : `I haven't met yours yet — nearest is ${esc(m.product)} <code>${esc(m.variant)}</code> at ${(run.confidence * 100).toFixed(0)}%`}</h2>
    <p>${gaps.length ? `${gaps.length} ${gaps.length === 1 ? 'thing' : 'things'} it can do that you did not know${gaps.some(d => d.reversible === 'no') ? ', ' + gaps.filter(d => d.reversible === 'no').length + ' irreversible' : ''}` : 'You knew every measured capability it holds'}${over.length ? ` · ${over.length} you expected that it does not hold` : ''}${run.known_fraction !== null ? ` · you knew ${(run.known_fraction * 100).toFixed(0)}% of what was asked` : ''}.</p>
    <p class="dim">${m.measured ? 'A measured profile, self-run' : 'A derived profile — a claim'}; matched from ${run.history.length} answers, the weakest tier there is; not a measurement of your environment. Profile version ${esc(run.profile_version)}: this report goes stale when it moves.</p></div>

  <h2>The clues</h2>
  <ol>${run.history.map(s => `<li><b>${esc(s.text)}</b> — <span class="asserted">${lab('asserted')}${s.answer === null ? 'not sure' : s.answer ? 'yes' : 'no'}</span> <span class="dim">· ${s.class === 'eliciting' ? 'measures' : 'identifies'} · reliability ${(s.reliability * 100).toFixed(0)}% · gain ${s.gain} bits · then leading ${esc(D.byId[s.lead].variant)} at ${(s.conf * 100).toFixed(0)}%</span>${s.class === 'eliciting' ? ` <span class="inferred">${lab('inferred')}the leader ${s.leader_says ? 'holds' : 'does not hold'} <i>${esc(D.caps[s.asks_about].label)}</i></span>` : ''}</li>`).join('')}</ol>

  <h2>The belief, at the end</h2>
  <div class="belief">${belief.map(([p, v]) => `<div class="${p === pid ? 'lead-p' : ''}"><span>${esc(D.byId[p].product)} <code>${esc(D.byId[p].variant)}</code></span><span class="bar"><i style="width:${(v * 100).toFixed(1)}%"></i></span><span>${(v * 100).toFixed(0)}%</span></div>`).join('')}</div>
  <p class="possible">${lab('possible')}${belief.filter(([p, v]) => p !== pid && v >= 0.05).map(([p, v]) => `${esc(D.byId[p].variant)} ${(v * 100).toFixed(0)}%`).join(' · ') || 'nothing else above 5%'}</p>

  <h2>The specific gap — per question, with its reach</h2>
  ${run.disagreements.length ? `<div class="tablewrap"><table><thead><tr><th>capability</th><th>reach</th><th>reversible</th><th>you said</th><th>the profile</th><th>reading</th><th>reliability</th></tr></thead><tbody>${run.disagreements.map(d => `<tr><td><b>${esc(d.label)}</b><br><code>${esc(d.capability)}</code></td><td>${d.reach.map(esc).join('<br>') || '<span class="dim">unrefined</span>'}</td><td class="rev-${esc(d.reversible)}">${esc(d.reversible)}</td><td>${d.answer === null ? 'not sure' : d.answer ? 'yes' : 'no'}</td><td>${d.holds ? 'holds it' : 'does not'}</td><td class="${d.kind === 'known' || d.kind === 'known-absent' ? 'agree' : d.kind === 'unsure' ? 'dim' : 'disagree'}">${{ known: 'you knew', 'known-absent': 'you knew it does not', unpredicted: 'you did not know', over: 'you expected more', unsure: 'not sure' }[d.kind]}</td><td>${(d.reliability * 100).toFixed(0)}%</td></tr>`).join('')}</tbody></table></div>` : '<p class="dim">No measuring question was asked.</p>'}
  ${gaps.length ? `<h3>The reduction</h3><ul>${gaps.map(d => `<li><b>${esc(d.label)}</b>: ${d.fix ? esc(d.fix.setting) + ' <span class="dim">· costs: ' + esc(d.fix.costs) + ' · after: ' + esc(d.fix.tier_after) + '</span>' : 'no reduction written yet'}</li>`).join('')}</ul>` : ''}

  <h2>Sense of scale — the end-of-game prediction</h2>
  <p>You predicted <b>${(run.prediction.families.length ? run.prediction.families.join(', ') : 'nothing')}</b>${run.prediction.irreversible ? ', some of it irreversible' : ', none of it irreversible'}. The profile holds <b>${run.scale.families_held.join(', ')}</b>, ${run.scale.irreversible_held} rows irreversible. Unpredicted families: ${run.scale.unpredicted.length ? run.scale.unpredicted.join(', ') : 'none'}${run.scale.over.length ? '; expected but not held: ' + run.scale.over.join(', ') : ''}. This measures something the per-question answers do not sum to.</p>

  <h2>Its grant</h2>
  <p class="dim">${lp.reach_names ? `host = ${esc(lp.reach_names.host)} · tenant = ${esc(lp.reach_names.tenant)} · world = ${esc(lp.reach_names.world)}` : ''}</p>
  ${(lp.not_reachable || []).length ? `<div class="cannot"><b>What it cannot reach:</b> ${lp.not_reachable.map(n => `${esc(n.what)} <span class="dim">(${esc(n.why)})</span>`).join(' · ')}</div>` : ''}
  <div id="pgraph"></div>

  <h2>Obligations worth checking</h2>
  <div class="warnbox"><b>A profile matched from answers is the weakest evidence tier there is</b> — self-reported, about a product rather than a deployment, inferred rather than measured. What follows is a set of questions worth asking, never a compliance finding. The game raises the question in two minutes; a probe answers it in ten; a conformance assertion with a named acceptor answers it properly.</div>
  ${Object.keys(obls).length ? `<ul>${Object.entries(obls).map(([o, rs]) => `<li><b>${esc(D.nodes[o].identifier)}</b> — ${esc(D.nodes[o].words)} <span class="dim">· governs ${[...rs].map(r => esc(D.nodes[r].label)).join(', ')} · <a href="graph.html?node=${encodeURIComponent(o)}">in the mesh</a></span></li>`).join('')}</ul>` : '<p class="dim">No reach node of this profile carries an obligation edge yet.</p>'}

  <h2>Sources</h2>
  <p class="srcs">${pn ? `<a href="${esc(pn.view)}">the profile file</a> <a href="${esc(pn.edit)}">edit</a>` : ''} · ${lp.tools.filter(t => t.evidence).map(t => `<a href="../probes/${esc(t.evidence)}">${esc(t.tool.split(' (')[0])} evidence</a>`).join(' · ') || 'no evidence file: a claim'} · <a href="tree.json">the question set</a> · <a href="../probes/mesh/graph.json">the mesh</a> · <a href="graph.html?node=${encodeURIComponent('profile:' + pid)}">walk the mesh from here</a> · <a href="data.html">how to correct a mapping</a></p>
  <h2>What is possible next</h2>
  <ul><li><a href="../probes/index.html#run">Run the probes</a> where the agent lives: the measured file replaces this hypothesis, and the difference between the two is itself worth showing.</li><li><a href="../authorised/index.html">Answer the mandate questions</a>: the gap between what it can do and what you asked of it, with the reduction beside each row.</li><li>Correct a mapping: every card above links to its file.</li></ul>
  <p><button class="btn alt" type="button" onclick="window.print()">print this report</button> <a class="btn alt" href="index.html">play again</a></p>
  <pre class="tuple">${esc(JSON.stringify({ type: run.type, day: run.day, demo: run.demo, matched: run.matched, confidence: run.confidence, answers: run.history.map(s => [s.id, s.answer]), prediction: run.prediction, known_fraction: run.known_fraction, disagreements: run.disagreements.map(d => [d.capability, d.kind]) }, null, 1))}</pre>
  <p class="dim">The tuple above is what a submission would contain — answers, the profile matched, the prediction, the gap — and this page has no button that sends it.</p>`;
  if (window.ProfileGraph && ProfileGraph.drawInto) await ProfileGraph.drawInto($('#pgraph'), pid);
})();
