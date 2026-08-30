/* pki.sgit.ai workbench — storage.

   localStorage holds three things and nothing else: fact overrides, draft
   mandates the visitor authors, and saved evidence packs. All of it stays in
   this browser — the page makes same-origin requests only, so there is
   nowhere for it to go. Drafts are marked draft:true at write time and the
   engine refuses them as unsigned; storage cannot promote a draft into a
   mandate. */

const KEY = 'pki.sgit.ai/workbench/v0';

export const store = {
  ok: true, why: '',
  state: { facts: {}, drafts: [], packs: [] },

  load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        this.state.facts  = s.facts  || {};
        this.state.drafts = Array.isArray(s.drafts) ? s.drafts : [];
        this.state.packs  = Array.isArray(s.packs)  ? s.packs  : [];
      }
    } catch {
      this.ok = false;
      this.why = 'This browser is not allowing site data for this origin — a private window, or a setting blocking storage. The app still works; nothing will persist.';
    }
    return this;
  },

  save() {
    if (!this.ok) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { this.ok = false; }
  },

  setFact(id, value)   { this.state.facts[id] = value; this.save(); },
  addDraft(d)          { this.state.drafts.push(d); this.save(); },
  removeDraft(i)       { this.state.drafts.splice(i, 1); this.save(); },
  addPack(p)           { this.state.packs.unshift(p); this.state.packs = this.state.packs.slice(0, 40); this.save(); },
  removePack(i)        { this.state.packs.splice(i, 1); this.save(); },
  clearPacks()         { this.state.packs = []; this.save(); },
};

/* The facts. Each is a statement about the environment the twin describes,
   with the basis it arrived on. Facts attach to the twin — that is what makes
   it a twin rather than a document (the corpus's own definition: the point
   where the graph meets reality, to which facts attach and against which
   obligations are assessed). Three values, like the assessment: true, false,
   unknown — and unknown keeps the branch, because assuming absence is the
   comfortable error. */
export const SEED_FACTS = [
  { id: 'hook-installed',      statement: 'core.hooksPath points at .githooks, so the pre-push hook runs', seed: 'true',
    basis: 'observed — the v0.1.28 refusal happened; the build record carries the transcript' },
  { id: 'hook-agent-writable', statement: 'the hook file is writable by the agent it constrains', seed: 'true',
    basis: 'observed — it lives in the repository the agent pushes' },
  { id: 'bp-dev',              statement: 'the code host enforces branch protection on dev', seed: 'unknown',
    basis: 'unknown — open item N12; flipping this to true is exactly the decision N12 asks for' },
  { id: 'bp-main',             statement: 'the code host enforces branch protection on main', seed: 'unknown',
    basis: 'unknown — not probed; a picture of settings this session cannot read would be a guess' },
  { id: 'cred-present',        statement: 'a push credential for the attached repository is present', seed: 'true',
    basis: 'observed — pushes to dev and claude/** succeeded this week' },
  { id: 'remote-reachable',    statement: 'the git remote is reachable from inside the environment', seed: 'true',
    basis: 'observed — same pushes' },
  { id: 'cred-other-repos',    statement: 'the credential reaches repositories beyond the attached one', seed: 'unknown',
    basis: 'unknown — the twin records presence and reachability, never contents (the measurement rule)' },
];

export function currentFacts() {
  return SEED_FACTS.map(f => ({ ...f, value: store.state.facts[f.id] ?? f.seed }));
}

/* The action cards — the GitHub push scenario the memo names, plus the edges
   that teach: the branch the mandate allows, the branch it does not, the flag
   the vocabulary cannot say, and the capability nobody measured. */
export const SEED_ACTIONS = [
  { id: 'push-dev',    label: 'Push to dev',
    capability: 'repo.contents.push', resource: 'github.com/SGit-AI/SGit-AI__Website__PKI', branch: 'dev',
    note: 'the release path — inside both the grant and the mandate' },
  { id: 'push-claude', label: 'Push to claude/registry-mvp-brief-hpbap8',
    capability: 'repo.contents.push', resource: 'github.com/SGit-AI/SGit-AI__Website__PKI', branch: 'claude/registry-mvp-brief-hpbap8',
    note: 'matches the claude/** constraint — the glob doing its one job' },
  { id: 'push-main',   label: 'Push to main',
    capability: 'repo.contents.push', resource: 'github.com/SGit-AI/SGit-AI__Website__PKI', branch: 'main',
    note: 'the grant reaches it, the mandate does not — excess authority, live' },
  { id: 'force-dev',   label: 'Force-push to dev',
    capability: 'repo.contents.push', resource: 'github.com/SGit-AI/SGit-AI__Website__PKI', branch: 'dev', force: true,
    note: 'the vocabulary cannot express force — watch default-deny handle what it cannot classify' },
  { id: 'push-other',  label: 'Push to another repository',
    capability: 'repo.contents.push', resource: 'github.com/SGit-AI/some-other-repo', branch: 'main',
    note: 'outside the mandate’s resource and inside its prohibitions' },
  { id: 'pr-create',   label: 'Open a pull request',
    capability: 'repo.pull-request.create', resource: 'github.com/SGit-AI/SGit-AI__Website__PKI', branch: 'dev',
    note: 'in the vocabulary, in nobody’s mandate here, and never measured — three gaps in one card' },
];
