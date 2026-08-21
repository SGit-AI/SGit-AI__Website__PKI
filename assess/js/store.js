/* pki.sgit.ai — storage. Choices only, never answers.

   What goes in: product ids, fact answers from a fixed three-value set, control ids,
   capability ids, and the library version. What never goes in: anything typed, any
   path, hostname, account or project name, and any output of a scan. There is no
   text input on the page, which is what turns that from a promise into a property. */

const KEY = 'pki.sgit.ai/assess/v2';

export const storage = {
  ok: true,
  why: '',

  read() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      this.ok = false;
      /* An opaque origin and a browser blocking site data land in the same place with
         different causes, so name both rather than guessing. */
      this.why = location.protocol === 'file:'
        ? 'This page was opened from a local folder, which gives it an opaque origin. Browser storage is keyed by origin, so there is nowhere to keep anything — and the library cannot be fetched either. Serve the site over http and both work.'
        : 'This browser is not allowing site data for this origin — a private window, or a setting that blocks storage.';
      return null;
    }
  },

  write(state, libVersion) {
    if (!this.ok) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({
        v: 2, lib: libVersion, updated: new Date().toISOString(),
        products: state.products, facts: state.facts,
        controls: state.controls, intent: state.intent
      }));
    } catch (e) { this.ok = false; this.why = 'Writing to browser storage failed — it may be full, or blocked.'; }
  },

  clear() { try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing to remove */ } },

  raw() {
    try { return window.localStorage.getItem(KEY) || '(nothing stored yet)'; }
    catch (e) { return '(storage unavailable)'; }
  }
};
