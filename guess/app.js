// guess/app.js — "guess the agent": deterministic decision-tree induction over the public
// profiles, in the browser. No model, no server, no submission. The tree is tree.json;
// the profiles are ../probes/profiles/. The prediction step is the instrument; the gap
// between what you predicted and what the tree found is the finding — a PREDICTION GAP,
// never a "surprise" (that word means an action outside the grant, and lives elsewhere).
(async function () {
  const $ = s => document.querySelector(s);
  const [tree, idx, prim, red, self] = await Promise.all(['tree.json', '../probes/profiles/index.json', '../probes/primitives.json', '../probes/reductions.json', 'selftest.json'].map(f => fetch(f).then(r => r.json())));
  const caps = Object.fromEntries(prim.capabilities.map(c => [c.id, c]));
  const P = idx.profiles.map(p => p.id);
  const byId = Object.fromEntries(idx.profiles.map(p => [p.id, p]));
  const S = tree.stop, N = tree.noise;
  const clip = p => Math.min(N.ceiling, Math.max(N.floor, p));
  const H = b => -Object.values(b).reduce((s, v) => s + (v > 0 ? v * Math.log2(v) : 0), 0);
  const norm = b => { const z = Object.values(b).reduce((s, v) => s + v, 0) || 1; const o = {}; for (const k in b) o[k] = b[k] / z; return o; };
  const lik = (q, p, ans) => ans ? clip(q.p_yes[p]) : 1 - clip(q.p_yes[p]);
  const gain = (b, q) => { let g = H(b); for (const ans of [true, false]) { const pa = P.reduce((s, p) => s + b[p] * lik(q, p, ans), 0); const post = norm(Object.fromEntries(P.map(p => [p, b[p] * lik(q, p, ans)]))); g -= pa * H(post); } return g; };

  // state
  let b, asked, path, phase, prediction, matched;
  const reset = () => { b = norm(Object.fromEntries(P.map(p => [p, byId[p].prior || 0]))); asked = []; path = []; phase = 'ask'; prediction = null; matched = null; };
  reset();
  $('#selftest').textContent = `${self.profiles} profiles, ${self.questions_in_tree} questions; the tree places its own profiles from their modal answers in ${self.mean_questions} questions on average (at most ${self.max_questions}), ${self.all_placed ? 'all of them' : 'not all of them'} correctly. That is a floor: it can tell its seven apart, which says nothing yet about placing a person.`;

  const lead = () => P.reduce((a, p) => b[p] > b[a] ? p : a, P[0]);
  function beliefHtml() {
    const l = lead();
    return '<div class="belief">' + P.slice().sort((x, y) => b[y] - b[x]).map(p => `<div class="${p === l ? 'lead-p' : ''}"><span>${byId[p].product} <code>${byId[p].variant}</code></span><span class="bar"><i style="width:${(b[p] * 100).toFixed(1)}%"></i></span><span>${(b[p] * 100).toFixed(0)}%</span></div>`).join('') + '</div>';
  }
  function nextQuestion() {
    const cands = tree.questions.filter(q => !asked.includes(q.id));
    if (!cands.length) return null;
    const best = cands.reduce((a, q) => gain(b, q) > gain(b, a) ? q : a, cands[0]);
    return gain(b, best) < S.min_gain ? null : best;
  }
  async function render() {
    const l = lead(), conf = b[l];
    $('#belief').innerHTML = beliefHtml();
    $('#pathOut').innerHTML = path.length ? '<ol class="path">' + path.map(s => `<li><b>${s.q}</b> — ${s.a === null ? 'not sure' : s.a ? 'yes' : 'no'} → leading ${byId[s.lead].variant} at ${(s.conf * 100).toFixed(0)}%</li>`).join('') + '</ol>' : '<p class="dim">No questions asked yet.</p>';
    if (phase === 'ask') {
      const done = conf >= S.dominant || asked.length >= S.budget;
      const q = done ? null : nextQuestion();
      if (!q) { phase = 'predict'; matched = conf >= S.not_in_set_below ? l : null; return render(); }
      $('#ask').hidden = false; $('#predict').hidden = $('#reveal').hidden = true;
      $('#qText').textContent = q.text; $('#qHelp').textContent = q.help; $('#qNum').textContent = `question ${asked.length + 1} of at most ${S.budget}`;
      $('#answers').onclick = e => { const v = e.target.dataset.a; if (v === undefined) return; const a = v === 'yes' ? true : v === 'no' ? false : null; asked.push(q.id); if (a !== null) b = norm(Object.fromEntries(P.map(p => [p, b[p] * lik(q, p, a)]))); path.push({ q: q.text, a, lead: lead(), conf: b[lead()] }); render(); };
    } else if (phase === 'predict') {
      $('#ask').hidden = true; $('#predict').hidden = false; $('#reveal').hidden = true;
      $('#predictStatus').innerHTML = matched ? `The tree has a leading guess at ${(conf * 100).toFixed(0)}% after ${asked.length} question${asked.length === 1 ? '' : 's'}${asked.length > 4 ? ' — taking longer means your setup is less ordinary, which is correct behaviour rather than a fault' : ''}. It is hidden until you predict.` : `<b>It hasn't met yours yet.</b> After ${asked.length} questions no profile reaches ${(S.not_in_set_below * 100).toFixed(0)}%: your setup is one the tree has not mapped, which is a finding rather than a failure — <a href="https://github.com/SGit-AI/SGit-AI__Website__PKI/blob/dev/guess/tree.json">add a profile or a question</a>. You can still predict and see the nearest profile's grant, labelled as nearest.`;
      $('#famChoices').innerHTML = tree.prediction.families.map(f => `<label><input type="checkbox" value="${f}"> <span>${f}<small>${prim.families[f]}</small></span></label>`).join('');
    } else {
      $('#ask').hidden = $('#predict').hidden = true; $('#reveal').hidden = false;
      const pid = matched || l; const prof = byId[pid];
      const union = prof.union, irrev = new Set(prof.irreversible_in_union);
      const famsIn = new Set(union.map(c => caps[c].family));
      const predicted = new Set(prediction.families);
      const unpredicted = [...famsIn].filter(f => !predicted.has(f));
      const over = [...predicted].filter(f => !famsIn.has(f));
      const unpredIrrev = union.filter(c => irrev.has(c) && !predicted.has(caps[c].family));
      const gapN = unpredicted.length;
      $('#verdict').innerHTML = `<p class="big">${matched ? 'The tree guesses' : 'Nearest profile:'} <b>${prof.product}</b> <code>${prof.variant}</code>${matched ? ` at ${(conf * 100).toFixed(0)}%` : ''}.</p>
        <p class="big" style="font-size:1.15rem">Prediction gap: <span style="color:#fca5a5">${gapN} of ${famsIn.size}</span> capability families you did not predict${unpredIrrev.length ? `, holding <span style="color:#fca5a5">${unpredIrrev.length} irreversible</span> ${unpredIrrev.length === 1 ? 'capability' : 'capabilities'}` : ''}${prediction.irreversible === (irrev.size > 0) ? '' : ` — and you ${prediction.irreversible ? 'expected irreversibility where the profile has none' : 'did not expect any of it to be irreversible; ' + irrev.size + ' rows are'}`}.</p>
        <p class="sub">A gap is the normal state: almost nobody can enumerate what they have granted, which is why the game asks cheap questions instead. ${over.length ? 'You also predicted ' + over.join(', ') + ', which this profile does not hold.' : ''}</p>
        <span class="tier">${prof.measured ? 'profile measured, self-run' : 'profile derived — a claim'} · matched from your answers, the weakest tier there is · not a measurement of your environment</span>`;
      const order = union.slice().sort((a, c) => (irrev.has(c) - irrev.has(a)) || (predicted.has(caps[a].family) - predicted.has(caps[c].family)));
      const full = await fetch('../probes/profiles/' + pid + '.json').then(r => r.json());
      const rowsOf = {}; for (const t of full.tools) for (const g of t.grant) (rowsOf[g.capability] = rowsOf[g.capability] || []).push({ ...g, tool: t.tool.split(' (')[0] });
      const rn = full.reach_names || {};
      const ctlChip = c => [...new Set((rowsOf[c] || []).map(r => r.control_tier || 'none'))].map(k => `<span class="ctl ${k}">${k}</span>`).join(' ');
      const noteOf = c => { const rs = rowsOf[c] || []; const n = rs.find(r => r.note); const ctl = rs.find(r => r.control); return `${rs.map(r => r.tool).join(', ')}${rn[caps[c].reach] ? ' · ' + caps[c].reach + ' = ' + rn[caps[c].reach] : ''}${ctl ? ' · control: ' + ctl.control : ''}${n ? ' · ' + n.note : ''}`; };
      $('#gapOut').innerHTML = `<div class="fam-row">${tree.prediction.families.map(f => `<span class="${famsIn.has(f) ? (predicted.has(f) ? 'hit' : 'miss') : ''}">${f}${famsIn.has(f) ? (predicted.has(f) ? ' ✓' : ' — unpredicted') : ''}</span>`).join('')}</div>
        ${rn.host ? `<p class="dim">For this profile <b>host</b> means ${rn.host}; <b>tenant</b> means ${rn.tenant}; <b>world</b> means ${rn.world}. <a href="../probes/graph.html?profile=${encodeURIComponent(pid)}">See it as a graph →</a></p>` : ''}
        ${(full.not_reachable || []).length ? `<div class="cannot"><b>What it cannot reach:</b> ${full.not_reachable.map(n => `${n.what} <span class="dim">(${n.why})</span>`).join(' · ')}</div>` : ''}
        <div class="gap-cols">
          <div class="loss"><h4>Its grant — irreversible first, unpredicted first</h4><ul>${order.map(c => `<li><b>${caps[c].label}</b> <span class="rev-${caps[c].reversible}">${caps[c].reversible === 'no' ? 'irreversible' : caps[c].reversible}</span> ${ctlChip(c)}${predicted.has(caps[c].family) ? '' : ' <span class="rev-no">· unpredicted</span>'}<span class="how"><code>${c}</code> · ${caps[c].family} · ${noteOf(c)}</span></li>`).join('')}</ul></div>
          <div class="fix"><h4>The reduction — on this screen</h4><ul>${order.filter(c => irrev.has(c) || !predicted.has(caps[c].family)).map(c => { const r = red.reductions[c]; return `<li><b>${caps[c].label}</b><span class="how">${r ? r.setting + ' · costs: ' + r.costs + ' · after: ' + r.tier_after : 'no reduction written yet'}</span></li>`; }).join('')}</ul></div>
        </div>
        <p><b>Now the truth in ten minutes:</b> this is a hypothesis about your grant from ${asked.length} answers. <a href="../probes/index.html#run">Run the probes</a> where the agent lives and the measured file replaces the guess; the difference between the two results is itself worth showing. Or take the profile into <a href="../authorised/index.html">what you authorised and never asked for</a> and answer the mandate questions.</p>`;
      const tuple = { type: 'guess-tuple/v1', day: new Date().toISOString().slice(0, 10), answers: path.map(s => [asked[path.indexOf(s)], s.a]), matched: matched, confidence: +conf.toFixed(2), predicted: [...predicted], predicted_irreversible: prediction.irreversible, gap_families: unpredicted, gap_irreversible: unpredIrrev.length };
      $('#tupleOut').textContent = JSON.stringify(tuple, null, 2);
      try { const last = JSON.parse(localStorage.getItem('guess.last') || 'null'); $('#lastTime').textContent = last ? `Last time on this browser (${last.day}) your prediction gap was ${last.gap_families.length} families; today it is ${gapN}. ${gapN < last.gap_families.length ? 'It shrank.' : gapN > last.gap_families.length ? 'It grew.' : 'Unchanged.'}` : ''; localStorage.setItem('guess.last', JSON.stringify(tuple)); } catch (e) { }
    }
  }
  $('#predictBtn').onclick = () => { prediction = { families: [...$('#famChoices').querySelectorAll('input:checked')].map(i => i.value), irreversible: $('#predIrrev').checked }; phase = 'reveal'; render(); };
  $('#again').onclick = () => { reset(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#again2').onclick = $('#again').onclick;
  render();
})();
