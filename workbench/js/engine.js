/* pki.sgit.ai workbench — the decision engine and the evidence pack.

   This is the broker's checklist from the service-twin brief, run against the
   TWIN rather than reality: the subject presents an identity, a signed
   mandate, the specific action and the contextual evidence; every check is
   recorded with its result and its source; the decision is default-deny; and
   the artefact is the evidence pack — the decision is disposable, the pack is
   what crosses to the risk product.

   Nothing here enforces anything. The pack says so about itself. */

import { verifySig } from './canon.js';

export const PACK_SCHEMA = 'pki.sgit.ai/evidence-pack/v0';

/* Branch globs, the mandate's own two shapes only: a literal, or a single
   trailing `/**`. A richer glob language is a grammar, and grammars are
   standard-shaped commitments this estate deliberately has not made. */
export function branchMatch(pattern, branch) {
  if (pattern.endsWith('/**')) return branch.startsWith(pattern.slice(0, -2));
  return pattern === branch;
}

function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

/* The tier is a property of the node's relationship to the tree, not of the
   node (GM-D29) — so it is computed from the facts every time, never stored.
   Flip a fact and the tier moves. */
export function enforcementTier(facts, targetBranch) {
  const f = id => facts.find(x => x.id === id)?.value ?? 'unknown';
  const bp = targetBranch === 'dev' ? f('bp-dev') : targetBranch === 'main' ? f('bp-main') : 'unknown';
  if (bp === 'true') return {
    tier: 'boundary',
    because: 'branch protection on ' + targetBranch + ' is enforced by the code host — something the grant does not include',
    from: ['bp-' + targetBranch],
  };
  if (f('hook-installed') === 'true') return {
    tier: 'setting',
    because: 'the pre-push hook refuses, but it lives inside the grant it bounds — the agent can edit it, unset core.hooksPath, or pass --no-verify' +
      (bp === 'unknown' ? '; whether the code host also protects ' + targetBranch + ' is unknown, and unknown is not a boundary' : ''),
    from: ['hook-installed', 'hook-agent-writable', ...(bp === 'unknown' && (targetBranch === 'dev' || targetBranch === 'main') ? ['bp-' + targetBranch] : [])],
  };
  return {
    tier: 'expectation',
    because: 'no installed control stands between the credential and the push — only prose',
    from: ['hook-installed'],
  };
}

export async function runDecision({ action, mandate, mandateMeta, twin, facts, estate }) {
  const now = new Date();
  const checks = [];
  const add = (id, question, result, evidence, source) =>
    checks.push({ id, question, result, evidence, ...(source ? { source } : {}) });

  // ── 1 · identity — and the fixture question is read BEFORE any signature (C3)
  const subj = mandate?.subject || null;
  const subjRec = subj ? estate.subjectIdentity : null;
  if (subjRec) {
    const pub = subjRec.body?.private_key_published;
    add('identity', 'Is the subject in the register, and is it an identity at all?',
      pub === false ? 'pass' : 'warn',
      pub === false
        ? subj + ' is a real record: private_key_published false. The register can be asked about it.'
        : subj + ' is a FIXTURE — its private half is published, so it is not a weak identity but no identity.',
      '../registry/records/' + subj.replace(':', '-') + '/index.html');
  } else {
    add('identity', 'Is the subject in the register, and is it an identity at all?',
      subj ? 'unknown' : 'fail',
      subj ? 'No record fetched for ' + subj + '.' : 'The mandate names no subject.');
  }

  // ── 2 · mandate present
  if (!mandate) {
    add('mandate-present', 'Does a mandate exist for this subject?', 'fail',
      'No mandate document. Whatever the grant can do, nobody authorised any of it — the whole grant is excess authority.');
  } else {
    add('mandate-present', 'Does a mandate exist for this subject?', 'pass',
      mandateMeta.label + (mandate.mandate_version ? ' (version ' + mandate.mandate_version + ')' : ''),
      mandateMeta.url || null);
  }

  // ── 3 · mandate authentic — a real verification, not a badge
  let sigOk = null;
  if (mandate) {
    if (mandateMeta.draft) {
      add('mandate-authentic', 'Does the issuer’s signature verify?', 'fail',
        'This is an unsigned draft. Default-deny refuses it — the delta below is what it WOULD govern once signed and accepted.');
    } else {
      sigOk = await verifySig(mandate, estate.issuerSignPem);
      add('mandate-authentic', 'Does the issuer’s signature verify?',
        sigOk === true ? 'pass' : sigOk === false ? 'fail' : 'unknown',
        sigOk === true
          ? 'Verified in this browser just now: Web Crypto, ECDSA P-256/SHA-256, raw r||s over the canonical form, against the signing key published in the issuer’s registry record.'
          : sigOk === false
            ? 'The signature does not verify against the issuer’s published signing key.'
            : 'Verification could not run here (no crypto.subtle on this origin, or no key fetched) — which is not the same answer as “forged”.',
        '../registry/records/' + (mandate.issuer || '').replace(':', '-') + '/01__identity.json');
    }
  }

  // ── 4 · mandate valid now
  if (mandate) {
    const exp = mandate.expires_at ? new Date(mandate.expires_at) : null;
    const iss = mandate.issued_at ? new Date(mandate.issued_at) : null;
    if (mandateMeta.superseded) {
      add('mandate-valid', 'Is the mandate in force right now?', 'fail',
        'Superseded by ' + mandateMeta.supersededBy + '. A superseded mandate authorises nothing — this is the document that refused the v0.1.28 release push.');
    } else if (exp && now >= exp) {
      add('mandate-valid', 'Is the mandate in force right now?', 'fail',
        'Expired ' + mandate.expires_at + '. Expiry is the default outcome; persistence is the thing that has to be renewed.');
    } else if (iss && now < iss) {
      add('mandate-valid', 'Is the mandate in force right now?', 'fail', 'Not yet in force: issued_at is in the future.');
    } else {
      add('mandate-valid', 'Is the mandate in force right now?', mandateMeta.draft ? 'unknown' : 'pass',
        (exp ? 'In force until ' + mandate.expires_at + '.' : 'No expiry stated — which the pack treats as a defect, not a convenience.') +
        ' No revocation append found in the issuer’s record.');
    }
  }

  // ── 5 · accepted by the subject — decision 8: a mandate never accepted is inert
  if (mandate && !mandateMeta.draft) {
    add('mandate-accepted', 'Did the subject accept it?', 'warn',
      'No signed acceptance statement exists for this mandate. The subject installed the enforcing hook, which is acceptance by conduct — real, and weaker than a signature. The missing artefact is named, not papered over.');
  } else if (mandate) {
    add('mandate-accepted', 'Did the subject accept it?', 'fail', 'A draft has no acceptance. Unaccepted means inert.');
  }

  // ── 6 · issuer authority — the split: enforcement and authority, never one indicator
  if (mandate) {
    const root = estate.rootEntry(mandate.issuer);
    if (!root) {
      add('issuer-authority', 'Does the issuer’s signature carry authority?', 'fail',
        (mandate.issuer || 'The issuer') + ' is not a declared root of this registry.');
    } else if (root.private_key_published) {
      add('issuer-authority', 'Does the issuer’s signature carry authority?', 'warn',
        'The issuer is a declared root AND a fixture: its private half is published, so the signature verifies and proves nothing — anybody could have produced it. Enforcement real, authority not (open item N11).',
        '../registry/roots.json');
    } else {
      add('issuer-authority', 'Does the issuer’s signature carry authority?', 'pass',
        'The issuer is a declared root whose private half is not published.', '../registry/roots.json');
    }
  }

  // ── 7 · the twin — grant reach, and the freshness the memo asks about
  const f = id => facts.find(x => x.id === id)?.value ?? 'unknown';
  const measuredAt = twin?.doc?.measured_at ? new Date(twin.doc.measured_at) : null;
  const ageDays = measuredAt ? daysBetween(measuredAt, now) : null;
  let grantReaches = 'unknown';
  if (action.capability === 'repo.contents.push') {
    if (action.resource !== 'github.com/SGit-AI/SGit-AI__Website__PKI') {
      grantReaches = f('cred-other-repos') === 'true' ? 'true' : 'unknown';
      add('grant-reach', 'Can this environment actually do it?', grantReaches === 'true' ? 'pass' : 'unknown',
        'The twin records a credential for the attached repository; whether it reaches ' + action.resource + ' is ' + (grantReaches === 'true' ? 'recorded as true' : 'not recorded — unknown, not no') + '.');
    } else if (f('cred-present') === 'true' && f('remote-reachable') === 'true') {
      grantReaches = 'true';
      add('grant-reach', 'Can this environment actually do it?', 'pass',
        'The twin records a push credential and a reachable remote. The credential does not know what a branch is — it reaches ' + action.branch + ' exactly as well as it reaches dev. That blindness is why the delta exists.',
        twin?.url || null);
    } else {
      grantReaches = f('cred-present') === 'false' ? 'false' : 'unknown';
      add('grant-reach', 'Can this environment actually do it?', grantReaches === 'false' ? 'fail' : 'unknown',
        grantReaches === 'false' ? 'The twin records no push credential.' : 'The twin does not evidence a credential either way.');
    }
  } else {
    add('grant-reach', 'Can this environment actually do it?', 'unknown',
      'The twin has no measured node for ' + action.capability + '. A grant is a floor, not a census — unmeasured is unknown, never no.',
      twin?.url || null);
  }

  add('twin-freshness', 'Is the twin fresh enough to decide on?',
    ageDays === null ? 'unknown' : ageDays <= 1 ? 'pass' : 'warn',
    ageDays === null
      ? 'The twin carries no measurement date.'
      : 'Measured ' + twin.doc.measured_at + ' — ' + ageDays + ' day' + (ageDays === 1 ? '' : 's') + ' ago. ' +
        (ageDays <= 1
          ? 'Fresh, and still a recording: the real-time answer is a re-measurement, not a newer file.'
          : 'This decision binds against an environment as it WAS. The check the memo asks for — “do I still have the same grant” — needs a re-measurement at decision time, and this app cannot perform one. It says so instead of pretending.'),
    twin?.url || null);

  // ── 8 · vocabulary — exact string equality is the registry's only comparison
  const inVocab = !!estate.capability(action.capability);
  add('vocabulary', 'Is the capability in the declared vocabulary?', inVocab ? 'pass' : 'warn',
    inVocab
      ? action.capability + ' is declared in registry/capabilities.json.'
      : action.capability + ' is NOT in the fixture vocabulary (comparison is exact string equality; containment is deliberately undefined). The admitted absence — a capability vocabulary that does not exist — showing up mid-decision.',
    '../registry/capabilities.json');

  // ── 9 · mandate scope — allow-list, constraints, prohibitions
  let mandateAllows = false;
  let scopeWhy = '';
  if (mandate && Array.isArray(mandate.allow)) {
    if (action.force) {
      scopeWhy = 'The vocabulary cannot express force-push, so the allow-list cannot allow it. Default-deny refuses what it cannot classify — the honest cost of a vocabulary this small.';
    } else {
      const hit = mandate.allow.find(a =>
        a.capability === action.capability &&
        a.resource === action.resource &&
        (!a.constraints?.branches || a.constraints.branches.some(p => branchMatch(p, action.branch))));
      if (hit) {
        mandateAllows = true;
        scopeWhy = 'Matched: ' + hit.capability + ' on ' + hit.resource +
          (hit.constraints?.branches ? ', branches ' + hit.constraints.branches.join(', ') + ' — ' + action.branch + ' matches' : '');
      } else {
        const near = mandate.allow.find(a => a.capability === action.capability && a.resource === action.resource);
        scopeWhy = near
          ? 'The capability and resource are allowed, but ' + action.branch + ' is outside branches ' + near.constraints.branches.join(', ') + '.'
          : 'No allow entry covers ' + action.capability + ' on ' + action.resource + '. Silence is refusal.';
      }
    }
    add('mandate-scope', 'Does the mandate allow this action?', mandateAllows ? 'pass' : 'fail', scopeWhy, mandateMeta.url || null);
  } else if (mandate) {
    add('mandate-scope', 'Does the mandate allow this action?', 'fail', 'The mandate has no allow list. Default-deny: no list, no action.');
  }

  // ── 10 · delta and decision
  const gate = id => checks.find(c => c.id === id)?.result;
  const mandateSound = mandate && !mandateMeta.draft &&
    gate('mandate-authentic') === 'pass' && gate('mandate-valid') === 'pass';

  let delta, outcome, reason;
  if (grantReaches === 'true' && mandateAllows) {
    delta = 'within';
  } else if (grantReaches === 'true' && !mandateAllows) {
    delta = 'excess';
  } else if (grantReaches !== 'true' && mandateAllows) {
    delta = 'shortfall';
  } else {
    delta = 'blind-spot';
  }

  if (!mandate) {
    outcome = 'REFUSED'; reason = 'no mandate exists — everything the grant reaches is excess authority';
  } else if (!mandateSound) {
    outcome = 'REFUSED';
    reason = mandateMeta.draft ? 'the mandate is an unsigned draft (default-deny)'
      : gate('mandate-authentic') !== 'pass' ? 'the signature did not verify (default-deny)'
      : 'the mandate is not in force (default-deny)';
  } else if (!mandateAllows) {
    outcome = 'REFUSED';
    reason = delta === 'excess'
      ? 'excess authority: the grant reaches this action and no mandate covers it — the exact gap the registry exists to make visible'
      : 'outside the mandate’s scope';
  } else if (grantReaches === 'false') {
    outcome = 'SHORTFALL'; reason = 'authorised, and the twin says the environment cannot do it — mandate minus grant';
  } else if (grantReaches === 'unknown') {
    outcome = 'ALLOWED-UNVERIFIED'; reason = 'the mandate allows it; whether the environment can actually do it is not in the twin';
  } else {
    outcome = 'ALLOWED'; reason = 'the grant reaches it and the mandate covers it — authority and capability agree';
  }

  const enf = enforcementTier(facts, action.branch);

  return {
    schema: PACK_SCHEMA,
    collected_at: now.toISOString(),
    mode: 'twin-simulation',
    scenario: 'github-push',
    action: { capability: action.capability, resource: action.resource,
              ...(action.branch ? { branch: action.branch } : {}), ...(action.force ? { force: true } : {}) },
    subject: subj,
    mandate_ref: mandateMeta.url || (mandateMeta.draft ? 'localStorage draft “' + mandateMeta.label + '”' : null),
    twin: twin ? { source: twin.url, measured_at: twin.doc.measured_at || null, age_days: ageDays } : null,
    checks,
    delta: { class: delta,
      meaning: { within: 'grant ∩ mandate — authorised and possible',
                 excess: 'grant − mandate — possible, authorised by nobody',
                 shortfall: 'mandate − grant — authorised, not possible',
                 'blind-spot': 'neither evidenced — the third term, rendered as a gap' }[delta] },
    decision: { outcome, reason,
      decided_by: 'the workbench simulator — nothing was enforced; the live decision points are the pre-push hook (setting) and a boundary that does not exist yet (N12)' },
    enforcement: { tier: enf.tier, because: enf.because, computed_from_facts: enf.from },
    facts_snapshot: facts.map(x => ({ id: x.id, value: x.value })),
    does_not_prove: [
      'that anything was enforced — this pack records a simulation against a twin',
      'that the twin matches the environment right now — it is a recording, and its age is printed above',
      'that a verified signature carries authority — the issuer is a fixture until N11 closes',
      'that this schema is settled — evidence-pack/v0 is introduced by this workbench, not adopted by the pack',
    ],
  };
}
