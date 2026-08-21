/* pki.sgit.ai — assessment model. Pure functions over the library and the visitor's
   choices. No DOM, no storage, no rendering: everything here is testable by calling it.

   The one idea worth holding on to: a capability is reachable if SOME path of live
   nodes reaches it, and the honest label for that capability is the WEAKEST control
   on that path. A path is only as bounded as its least-enforced node, which is why
   escalation edges matter — they create paths that go around a setting. */

export const TIER_RANK = { boundary: 3, setting: 2, expectation: 1, none: 0 };

/* A fact answer is yes / no / unsure. "unsure" resolves to present-but-unverified,
   because assuming absence is the comfortable error and this tool has no business
   making it on the visitor's behalf. */
export function factHolds(facts, id) {
  const v = facts[id];
  return v === 'yes' || v === 'unsure' || v === undefined;
}
export function factUnverified(facts, id) { return (facts[id] ?? 'unsure') === 'unsure'; }

/** Which fact questions apply, given the surfaces in play and answers so far. */
export function liveFacts(lib, surfaces, facts) {
  return lib.facts.filter(f =>
    f.surfaces.some(s => surfaces.includes(s)) &&
    (!f.requires || f.requires.every(r => facts[r] === 'yes' || facts[r] === 'unsure')));
}

export function liveControls(lib, surfaces) {
  return lib.controls.filter(c => c.surfaces.some(s => surfaces.includes(s)));
}

/**
 * Build the live graph for one surface: nodes that survive the facts and the controls
 * in place, parent edges, and escalation edges.
 */
export function buildGraph(lib, surface, facts, controls) {
  const removed = new Set();
  const marks = {}, downgrades = {};
  for (const c of lib.controls) {
    if (!controls.includes(c.id) || !c.surfaces.includes(surface)) continue;
    (c.removes || []).forEach(id => removed.add(id));
    Object.assign(marks, c.marks || {});
    Object.assign(downgrades, c.downgrades || {});
  }
  const swaps = {};
  for (const c of lib.controls) {
    if (controls.includes(c.id) && c.surfaces.includes(surface)) Object.assign(swaps, c.swaps || {});
  }

  const raw = lib.nodes[surface] || [];
  const live = [];
  const byId = new Map(raw.map(n => [n.id, n]));

  const dropped = id => {
    let cur = byId.get(id);
    while (cur) {
      if (removed.has(cur.id)) return true;
      if (cur.requires && !factHolds(facts, cur.requires)) return true;
      cur = cur.parent ? byId.get(cur.parent) : null;
    }
    return false;
  };

  for (const n of raw) {
    if (dropped(n.id)) continue;
    const tier = marks[n.id] || n.tier;
    const reaches = (n.reaches || []).map(c => swaps[c] || c);
    live.push({ ...n, tier, reaches, surface,
      unverified: !!(n.requires && factUnverified(facts, n.requires)) });
  }

  const liveIds = new Set(live.map(n => n.id));
  const escalations = (lib.escalations || [])
    .filter(e => e.surfaces.includes(surface) && liveIds.has(e.from) && liveIds.has(e.to)
                 && !controls.some(id => (lib.controls.find(c => c.id === id)?.downgrades || {})[e.from]));
  return { surface, nodes: live, escalations };
}

/** Every path from the root to `id`, following parent edges and escalation edges. */
function pathsTo(graph, id, seen = new Set()) {
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const node = byId.get(id);
  if (!node) return [];
  if (seen.has(id)) return [];
  const next = new Set(seen); next.add(id);
  const parents = [];
  if (node.parent && byId.has(node.parent)) parents.push(node.parent);
  graph.escalations.filter(e => e.to === id).forEach(e => parents.push(e.from));
  if (!parents.length) return [[node]];
  const out = [];
  for (const p of parents) for (const path of pathsTo(graph, p, next)) out.push([...path, node]);
  return out;
}

function weakest(path) {
  return path.reduce((acc, n) => (TIER_RANK[n.tier] < TIER_RANK[acc.tier] ? n : acc), path[0]);
}

/**
 * Reachability across every selected surface. For each capability we keep the WEAKEST
 * route to it: if one surface reaches it through a boundary and another through
 * nothing, the honest summary is "nothing".
 */
export function reachable(lib, graphs) {
  const out = new Map();
  for (const g of graphs) {
    for (const n of g.nodes) {
      for (const capId of n.reaches || []) {
        const paths = pathsTo(g, n.id);
        for (const path of paths) {
          const usesEscalation = path.some((p, i) =>
            i > 0 && g.escalations.some(e => e.from === path[i - 1].id && e.to === p.id));
          const entry = { cap: capId, surface: g.surface, path, weakest: weakest(path),
            unverified: path.some(p => p.unverified),
            /* Whether an escalation route EXISTS is a property of the capability, not of
               whichever path happened to win the weakest-link contest below. Tracking it
               on the winner alone hid every one of them, because the root is already the
               weakest node on the direct path too. */
            viaEscalation: usesEscalation,
            escalationOnly: usesEscalation,
            mechanisms: path.filter(p => p.mechanism).map(p => p.mechanism) };
          const cur = out.get(capId);
          if (!cur) { out.set(capId, entry); continue; }
          cur.viaEscalation = cur.viaEscalation || usesEscalation;
          cur.escalationOnly = cur.escalationOnly && usesEscalation;
          if (TIER_RANK[entry.weakest.tier] < TIER_RANK[cur.weakest.tier]) {
            out.set(capId, { ...entry, viaEscalation: cur.viaEscalation, escalationOnly: cur.escalationOnly });
          }
        }
      }
    }
  }
  return out;
}

/** grant − mandate, and mandate − grant. Both directions, both named. */
export function computeGap(lib, reach, intent) {
  const capOf = id => lib.capabilities.find(c => c.id === id);
  const excess = [...reach.keys()].filter(id => !intent.includes(id))
    .map(id => ({ ...reach.get(id), meta: capOf(id) }))
    .filter(e => e.meta)
    .sort((a, b) => (b.meta.weight - a.meta.weight) || a.meta.label.localeCompare(b.meta.label));
  const shortfall = intent.filter(id => !reach.has(id)).map(capOf).filter(Boolean);
  return { excess, shortfall };
}

/** What a control would remove from the current excess — computed, never asserted. */
export function controlEffect(lib, state, controlId) {
  const on = state.controls.includes(controlId);
  const controls = on ? state.controls.filter(c => c !== controlId) : [...state.controls, controlId];
  const surfaces = surfacesOf(lib, state.products);
  const before = reachable(lib, surfaces.map(s => buildGraph(lib, s, state.facts, state.controls)));
  const after  = reachable(lib, surfaces.map(s => buildGraph(lib, s, state.facts, controls)));
  const gone = [...before.keys()].filter(id => !after.has(id) && !state.intent.includes(id));
  const changed = [...before.keys()].filter(id => after.has(id) &&
    TIER_RANK[after.get(id).weakest.tier] > TIER_RANK[before.get(id).weakest.tier]);
  return { on, closes: gone, strengthens: changed };
}

export function surfacesOf(lib, products) {
  const s = products.map(p => lib.products.find(x => x.id === p)?.surface).filter(Boolean);
  return [...new Set(s)];
}

/** Everything the dashboard needs, in one call. */
export function assess(lib, state) {
  const surfaces = surfacesOf(lib, state.products);
  const graphs = surfaces.map(s => buildGraph(lib, s, state.facts, state.controls));
  const reach = reachable(lib, graphs);
  const gap = computeGap(lib, reach, state.intent);
  const byTier = { boundary: 0, setting: 0, expectation: 0, none: 0 };
  for (const e of reach.values()) byTier[e.weakest.tier]++;
  const unverified = [...reach.values()].filter(e => e.unverified).length;
  /* On a local surface the root — "runs as your user account" — is the weakest link on
     every path, so a histogram of tiers says "all none" and tells nobody anything. The
     informative version is that single sentence: one node accounts for N of M. */
  const tally = new Map();
  for (const e of gap.excess) {
    const k = e.weakest.surface + '/' + e.weakest.id;
    tally.set(k, [...(tally.get(k) || []), e]);
  }
  let chokepoint = null;
  for (const [, group] of tally) {
    if (!chokepoint || group.length > chokepoint.count) {
      chokepoint = { node: group[0].weakest, count: group.length, of: gap.excess.length };
    }
  }
  const escalated = gap.excess.filter(e => e.viaEscalation);
  return { surfaces, graphs, reach, ...gap, byTier, unverified, chokepoint, escalated,
    controlsInPlace: liveControls(lib, surfaces).filter(c => state.controls.includes(c.id)),
    controlsAvailable: liveControls(lib, surfaces).filter(c => !state.controls.includes(c.id)) };
}

export function emptyState() { return { products: [], facts: {}, controls: [], intent: [] }; }
