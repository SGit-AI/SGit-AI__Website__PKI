/* pki.sgit.ai — the screen rail on the rendered mockups.

   Delivered as an IIFE over querySelectorAll; rewritten as a custom element to match
   the pattern the rest of this site uses. Same behaviour, one addition: arrow-key
   navigation, because a `role="tablist"` that cannot be driven from the keyboard is an
   ARIA role making a promise the markup does not keep.

   No shadow DOM — the site stylesheet is the design system, and these should inherit it
   rather than reimplement it behind a boundary. */
class ScreenRail extends HTMLElement {
  connectedCallback() {
    this.tabs = [...this.querySelectorAll('.tab')];
    this.screens = [...this.querySelectorAll('.screen')];
    if (!this.tabs.length) return;

    this.tabs.forEach(t => {
      t.addEventListener('click', () => this.show(t.dataset.s));
      t.addEventListener('keydown', e => this.key(e, t));
    });

    /* Cross-screen navigation: a finding on one screen points at the screen that owns
       it, which is how document 15's I8 expander reaches the grant tree. */
    this.addEventListener('click', e => {
      const el = e.target.closest?.('[data-goto]');
      if (el) { e.preventDefault(); this.show(el.dataset.goto); }
    });

    window.addEventListener('hashchange', () => this.show(this.fromHash(), false));
    this.show(this.fromHash(), false);
  }

  fromHash() {
    const id = (location.hash || '').slice(1);
    return this.querySelector(`#s-${CSS.escape(id)}`) ? id : this.tabs[0].dataset.s;
  }

  show(id, push = true) {
    this.tabs.forEach(t => {
      const on = t.dataset.s === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;      /* one stop in the tab order, as a tablist should be */
    });
    this.screens.forEach(s => s.classList.toggle('on', s.id === 's-' + id));
    if (push && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    this.dispatchEvent(new CustomEvent('screen', { detail: id, bubbles: true }));
  }

  key(e, tab) {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const i = this.tabs.indexOf(tab);
    const next = keys[e.key] === 'first' ? this.tabs[0]
      : keys[e.key] === 'last' ? this.tabs[this.tabs.length - 1]
      : this.tabs[(i + keys[e.key] + this.tabs.length) % this.tabs.length];
    next.focus();
    this.show(next.dataset.s);
  }
}
customElements.define('sg-screens', ScreenRail);
