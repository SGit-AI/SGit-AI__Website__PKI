// engine.js — the deterministic engine behind "Which Agent Is It?", shared by the play screen and
// the report. Arithmetic over a published tree and the public profiles; no model, no server.
//   belief   b(p)      a distribution over profiles, from the population prior
//   update   b ∝ b × lik^reliability   — a low-reliability answer barely moves the belief (brief v0.33.65)
//   choose   the unasked question with the largest expected information gain; discriminators first
//   phases   identify (until one profile dominates) → elicit (a few measuring questions about the
//            leader) → predict (sense of scale) → reveal
//   the gap  every eliciting answer is already a prediction: a disagreement with the matched
//            profile is recorded per capability, with its reach node and reversibility
window.WhichAgent = (function () {
  const clip = (x, N) => Math.min(N.ceiling, Math.max(N.floor, x));
  const H = b => -Object.values(b).reduce((s, v) => s + (v > 0 ? v * Math.log2(v) : 0), 0);
  const norm = b => { const z = Object.values(b).reduce((s, v) => s + v, 0) || 1; const o = {}; for (const k in b) o[k] = b[k] / z; return o; };

  async function load(base) {
    base = base || './';
    const [tree, idx, prim, red, graph] = await Promise.all([base + 'tree.json', base + '../probes/profiles/index.json', base + '../probes/primitives.json', base + '../probes/reductions.json', base + '../probes/mesh/graph.json'].map(f => fetch(f).then(r => r.json())));
    const caps = Object.fromEntries(prim.capabilities.map(c => [c.id, c]));
    const nodes = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
    const cache = {};
    const profile = async id => cache[id] || (cache[id] = await fetch(base + '../probes/profiles/' + id + '.json').then(r => r.json()));
    return { base, tree, idx, prim, red, graph, caps, nodes, P: idx.profiles.map(p => p.id), byId: Object.fromEntries(idx.profiles.map(p => [p.id, p])), profile };
  }

  class Game {
    constructor(D) { this.D = D; this.S = D.tree.stop; this.N = D.tree.noise; this.reset(); }
    reset() {
      this.b = norm(Object.fromEntries(this.D.P.map(p => [p, this.D.byId[p].prior || 0])));
      this.asked = []; this.history = []; this.phase = 'identify'; this.prediction = null; this.matched = null; this.current = null; this.elicited = 0; this.full = {};
    }
    lik(q, p, ans) { const base = ans ? clip(q.p_yes[p], this.N) : 1 - clip(q.p_yes[p], this.N); return Math.pow(base, Math.max(0.05, q.reliability || 1)); }
    gain(q, b) { b = b || this.b; let g = H(b); for (const ans of [true, false]) { const pa = this.D.P.reduce((s, p) => s + b[p] * this.lik(q, p, ans), 0); const post = norm(Object.fromEntries(this.D.P.map(p => [p, b[p] * this.lik(q, p, ans)]))); g -= pa * H(post); } return g; }
    lead() { return this.D.P.reduce((a, p) => this.b[p] > this.b[a] ? p : a, this.D.P[0]); }
    conf() { return this.b[this.lead()]; }
    unasked() { return this.D.tree.questions.filter(q => !this.asked.includes(q.id)); }
    async ensure(id) { if (!this.full[id]) this.full[id] = await this.D.profile(id); return this.full[id]; }
    holds(profileId, cap) { const m = this.D.byId[profileId]; return !!(m && m.union.includes(cap)); }
    // the next question, or null when the phase moves on
    next() {
      if (this.phase === 'identify') {
        const done = this.conf() >= this.S.dominant || this.asked.length >= this.S.budget;
        const cands = this.unasked();
        const score = q => this.gain(q) * (q.class === 'discriminating' ? 1 : (this.asked.length >= 4 ? 1 : 0.5));
        const best = cands.length ? cands.reduce((a, q) => score(q) > score(a) ? q : a, cands[0]) : null;
        if (!done && best && this.gain(best) >= this.S.min_gain) { this.current = best; return best; }
        this.phase = 'elicit';
      }
      if (this.phase === 'elicit') {
        const lead = this.lead();
        const cands = this.unasked().filter(q => q.class === 'eliciting');
        // prefer questions about capabilities the leader holds, irreversible first — the gap must be measurable
        cands.sort((x, y) => (this.holds(lead, y.asks_about) - this.holds(lead, x.asks_about)) || ((this.D.caps[y.asks_about].reversible === 'no') - (this.D.caps[x.asks_about].reversible === 'no')) || (this.gain(y) - this.gain(x)));
        if (this.elicited < (this.S.elicit_after_dominant || 4) && cands.length && this.asked.length < this.S.budget + 4) { this.current = cands[0]; return cands[0]; }
        this.phase = 'predict';
      }
      this.current = null; return null;
    }
    // record an answer: true / false / null (not sure)
    answer(q, a) {
      const before = { lead: this.lead(), conf: this.conf() };
      const gain = this.gain(q);
      this.asked.push(q.id);
      if (a !== null) this.b = norm(Object.fromEntries(this.D.P.map(p => [p, this.b[p] * this.lik(q, p, a)])));
      if (q.class === 'eliciting') this.elicited++;
      const lead = this.lead();
      const step = { id: q.id, text: q.text, class: q.class, reliability: q.reliability, asks_about: q.asks_about || null, answer: a, gain: +gain.toFixed(3), before, lead, conf: +this.conf().toFixed(3), phase: q.class === 'eliciting' && this.phase === 'elicit' ? 'elicit' : 'identify' };
      if (q.class === 'eliciting') step.leader_says = this.holds(lead, q.asks_about);
      this.history.push(step); return step;
    }
    demoAnswer(q, profileId) { return q.p_yes[profileId] >= 0.5; }
    // the per-capability disagreement set against a profile (the matched one, or the nearest)
    disagreements(profileId) {
      const out = []; const full = this.full[profileId]; const refine = (full && full.refine) || {};
      for (const s of this.history) {
        if (s.class !== 'eliciting') continue;
        const cap = s.asks_about; const holds = this.holds(profileId, cap); const c = this.D.caps[cap];
        const kind = s.answer === null ? 'unsure' : holds && s.answer === false ? 'unpredicted' : holds && s.answer === true ? 'known' : !holds && s.answer === true ? 'over' : 'known-absent';
        const rids = [].concat(refine[cap] || []);
        out.push({ question: s.text, id: s.id, capability: cap, label: c.label, family: c.family, reversible: c.reversible, holds, answer: s.answer, kind,
                   reach: rids.map(r => (this.D.nodes[r] || {}).label || r), reach_ids: rids, reliability: s.reliability, fix: this.D.red.reductions[cap] || null });
      }
      return out;
    }
    knownFraction(dis) { const held = dis.filter(d => d.holds && d.answer !== null); const known = held.filter(d => d.kind === 'known'); return held.length ? known.length / held.length : null; }
    predict(families, irreversible) { this.prediction = { families: [...families], irreversible: !!irreversible }; this.phase = 'reveal'; this.matched = this.conf() >= this.S.not_in_set_below ? this.lead() : null; return this.matched; }
    scaleGap(profileId) {
      const m = this.D.byId[profileId]; const famsIn = new Set(m.union.map(c => this.D.caps[c].family)); const pred = new Set(this.prediction.families);
      return { families_held: [...famsIn], unpredicted: [...famsIn].filter(f => !pred.has(f)), over: [...pred].filter(f => !famsIn.has(f)), irreversible_held: m.irreversible_in_union.length, predicted_irreversible: this.prediction.irreversible };
    }
    toRun(demo) {
      const pid = this.matched || this.lead(); const dis = this.disagreements(pid);
      return { type: 'which-agent-run/v2', day: new Date().toISOString().slice(0, 10), demo: demo || null, matched: this.matched, nearest: pid, confidence: +this.conf().toFixed(3),
               belief: Object.fromEntries(this.D.P.map(p => [p, +this.b[p].toFixed(4)])), history: this.history, prediction: this.prediction, scale: this.prediction ? this.scaleGap(pid) : null,
               disagreements: dis, known_fraction: this.knownFraction(dis), profile_version: this.D.byId[pid].version, tree: this.D.tree.generated_from };
    }
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return { load, Game, esc, norm };
})();
