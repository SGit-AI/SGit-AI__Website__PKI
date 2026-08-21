/* pki.sgit.ai — the custom elements.

   Kept deliberately thin: each one owns its markup and emits an event, and all the
   deciding happens in app.js against model.js. No shadow DOM, because the site's
   stylesheet is the design system and these should inherit it rather than reimplement
   it behind a boundary. */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

class Base extends HTMLElement {
  emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true })); }
  set data(v) { this._d = v; this.render(); }
  get data() { return this._d; }
}

/* ---- the shareable summary. Everything else on the page exists to fill this in ---- */
class Dashboard extends Base {
  render() {
    const d = this._d; if (!d) return;
    const { lib, state, r } = d;
    const names = state.products.map(p => lib.products.find(x => x.id === p)?.label).filter(Boolean);
    if (!names.length) {
      this.innerHTML = `<div class="dash empty">
        <div class="dashhead"><b>Your snapshot</b><span class="dim small">fills in as you go</span></div>
        <p class="dim">Pick an agent below and this becomes a summary you can screenshot and send to somebody.</p></div>`;
      return;
    }
    const worst = r.excess.slice(0, 4).map(e => esc(e.meta.label));
    this.innerHTML = `<div class="dash">
      <div class="dashhead"><b>Your snapshot</b>
        <span class="dim small">library ${esc(lib.version)} · nothing here left your browser</span></div>
      <div class="dashgrid">
        <div class="stat"><span class="n">${r.reach.size}</span><span class="l">capabilities reachable</span></div>
        <div class="stat gap"><span class="n">${r.excess.length}</span><span class="l">you did not ask for</span></div>
        <div class="stat ok"><span class="n">${r.controlsInPlace.length}</span><span class="l">controls in place</span></div>
        ${r.unverified ? `<div class="stat unv"><span class="n">${r.unverified}</span><span class="l">not established either way</span></div>` : ''}
      </div>
      <div class="dashrow"><b>Agents</b> <span>${names.map(esc).join(' · ')}</span></div>
      ${worst.length ? `<div class="dashrow"><b>The delta</b> <span>${worst.join(' · ')}${r.excess.length > 4 ? ` <span class="dim">and ${r.excess.length - 4} more</span>` : ''}</span></div>` : ''}
      ${r.chokepoint && r.chokepoint.count > 1
        ? `<div class="choke"><b>${esc(r.chokepoint.node.label)}</b> is the weakest link on ${r.chokepoint.count} of ${r.chokepoint.of}. That is <b>one</b> thing to change, not ${r.chokepoint.of}.</div>` : ''}
      ${r.escalated.length ? `<div class="dashrow esc"><b>Around a stated control</b> <span>${r.escalated.length} of them are reachable even with the tool's own restriction on</span></div>` : ''}
      <div class="dashfoot"><button class="btn ghost sm" data-act="copy">Copy as text</button>
        <span class="dim small">or screenshot this card — it is designed to be sent to somebody</span></div>
    </div>`;
    this.querySelector('[data-act="copy"]')?.addEventListener('click', () => this.emit('copy-summary'));
  }
}

/* ---- big clickable product boxes, grouped by surface ---- */
class Picker extends Base {
  render() {
    const { lib, selected } = this._d;
    const groups = lib.surfaces.map(s => {
      const prods = lib.products.filter(p => p.surface === s.id);
      return `<section class="sgroup">
        <header><b>${esc(s.label)}</b><span class="where">${esc(s.where)}</span>
          <p class="dim small">${esc(s.oneline)}</p></header>
        <div class="pboxes">${prods.map(p => `
          <button class="pbox${selected.includes(p.id) ? ' on' : ''}" data-prod="${esc(p.id)}"
            aria-pressed="${selected.includes(p.id)}">
            <span class="pl">${esc(p.label)}</span>
            ${p.vendor ? `<span class="pv">${esc(p.vendor)}</span>` : '<span class="pv dim">any</span>'}
          </button>`).join('')}</div>
      </section>`;
    }).join('');
    this.innerHTML = `<div class="picker">${groups}</div>`;
    this.querySelectorAll('[data-prod]').forEach(b =>
      b.addEventListener('click', () => this.emit('pick', b.dataset.prod)));
  }
}

/* ---- the fact questions that prune the graph ---- */
class Facts extends Base {
  render() {
    const { lib, facts, live } = this._d;
    if (!live.length) { this.innerHTML = ''; return; }
    this.innerHTML = `<div class="facts">${live.map(f => `
      <div class="fact">
        <div class="fq">${esc(f.q)}${f.hint ? `<span class="fh">${esc(f.hint)}</span>` : ''}</div>
        <div class="fa">${['yes', 'no', 'unsure'].map(v => `
          <button class="fbtn${(facts[f.id] ?? f.default) === v ? ' on' : ''}" data-fact="${esc(f.id)}" data-v="${v}">
            ${v === 'unsure' ? 'not sure' : v}</button>`).join('')}</div>
      </div>`).join('')}
      <p class="small dim">“Not sure” keeps the branch and marks it unverified. Assuming absence is the comfortable
      error, and this tool has no business making it on your behalf.</p></div>`;
    this.querySelectorAll('[data-fact]').forEach(b =>
      b.addEventListener('click', () => this.emit('fact', { id: b.dataset.fact, v: b.dataset.v })));
  }
}

/* ---- the intent picker: only what is actually reachable ---- */
class Intent extends Base {
  render() {
    const { lib, reach, intent } = this._d;
    const groups = [['benign', 'Everyday use'], ['work', 'Work it does for you'], ['reach', 'Everything else it can reach']];
    this.innerHTML = `<div class="intent">${groups.map(([g, title]) => {
      const caps = lib.capabilities.filter(c => c.group === g && reach.has(c.id));
      if (!caps.length) return '';
      return `<section><h4>${esc(title)}</h4><div class="opts">${caps.map(c => `
        <label class="opt tight${intent.includes(c.id) ? ' on' : ''}">
          <input type="checkbox" data-intent="${esc(c.id)}" ${intent.includes(c.id) ? 'checked' : ''}>
          <span>${esc(c.label)}</span>
          <button class="why" data-why="${esc(c.id)}" title="Where this comes from">?</button>
        </label>`).join('')}</div></section>`;
    }).join('')}</div>`;
    this.querySelectorAll('[data-intent]').forEach(b =>
      b.addEventListener('change', () => this.emit('intent', b.dataset.intent)));
    this.querySelectorAll('[data-why]').forEach(b =>
      b.addEventListener('click', e => { e.preventDefault(); this.emit('inspect-cap', b.dataset.why); }));
  }
}

/* ---- controls, framed as what removes capability rather than as advice ---- */
class Controls extends Base {
  render() {
    const { lib, state, effects } = this._d;
    const rows = c => {
      const e = effects[c.id] || { closes: [], strengthens: [] };
      const on = state.controls.includes(c.id);
      const label = on
        ? (e.closes.length ? `Turning this off would re-open ${e.closes.length}` : 'In place')
        : (e.closes.length ? `Would close ${e.closes.length} of your ${d_excess(this._d)}` : 'Closes none of your current gaps');
      return `<div class="ctrl${on ? ' on' : ''}">
        <label class="chead"><input type="checkbox" data-ctrl="${esc(c.id)}" ${on ? 'checked' : ''}>
          <b>${esc(c.label)}</b>
          <span class="tier t-${c.tier === 'expectation' ? 'expectation' : c.tier}">${esc(c.tier)}</span>
          <span class="dim small">· ${esc(c.effort)}</span></label>
        <div class="closes${e.closes.length ? '' : ' none'}">${esc(label)}${
          e.closes.length ? ': ' + e.closes.map(id => esc((lib.capabilities.find(x => x.id === id) || {}).label || id).toLowerCase()).join(', ') : ''}</div>
        <p class="small">${esc(c.note)}</p></div>`;
    };
    this.innerHTML = `<div class="ctrls">
      <p class="small dim">Tick what is <b>already true</b>. The graph and the delta above change as you do — the
      numbers are computed from your own answers, not asserted at you.</p>
      ${this._d.live.map(rows).join('')}</div>`;
    this.querySelectorAll('[data-ctrl]').forEach(b =>
      b.addEventListener('change', () => this.emit('control', b.dataset.ctrl)));
  }
}
function d_excess(d) { return d.excessCount ?? 0; }

/* ---- the inspector: what a node or capability means, and where it came from ---- */
class Inspector extends Base {
  render() {
    const d = this._d;
    if (!d || !d.body) {
      this.innerHTML = `<aside class="insp empty"><p class="dim">Click any box in the graph — or the <b>?</b> beside a
        capability — and what it means, what stands in the way, and where the claim came from appears here.</p></aside>`;
      return;
    }
    this.innerHTML = `<aside class="insp">${d.body}</aside>`;
    this.querySelector('[data-close]')?.addEventListener('click', () => this.emit('inspect-clear'));
  }
}

customElements.define('sg-dashboard', Dashboard);
customElements.define('sg-picker', Picker);
customElements.define('sg-facts', Facts);
customElements.define('sg-intent', Intent);
customElements.define('sg-controls', Controls);
customElements.define('sg-inspector', Inspector);
