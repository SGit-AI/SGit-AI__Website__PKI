/* pki.sgit.ai — the graph renderer.

   Hand-rolled SVG rather than a charting library, and the reason is the page's own
   claim: it makes exactly the requests you can count on one hand, and pulling a graph
   library off a CDN would add a third-party request to a page whose argument is that
   nothing leaves your browser. The layout needed here is a layered DAG with two edge
   kinds — that is a hundred lines, and it is worth a hundred lines to keep the claim
   whole. */

const NODE_W = 184, NODE_H = 52, GAP_X = 32, GAP_Y = 28, PAD = 14;

const TIER_CLASS = { boundary: 'g-boundary', setting: 'g-setting', expectation: 'g-expectation', none: 'g-none' };

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** Depth from the root, following parent edges only — escalation edges never set depth. */
function layout(graph) {
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const depth = n => { let d = 0, c = n; while (c.parent && byId.has(c.parent)) { d++; c = byId.get(c.parent); } return d; };
  const rows = new Map();
  for (const n of graph.nodes) {
    const d = depth(n);
    rows.set(d, [...(rows.get(d) || []), n]);
  }
  /* Order each row by its parent's position so edges cross as little as possible. */
  const pos = new Map();
  const maxDepth = Math.max(...rows.keys());
  for (let d = 0; d <= maxDepth; d++) {
    const row = (rows.get(d) || []).slice().sort((a, b) => {
      const pa = pos.get(a.parent)?.x ?? 0, pb = pos.get(b.parent)?.x ?? 0;
      return pa - pb;
    });
    row.forEach((n, i) => pos.set(n.id, { x: i, y: d, row: row.length }));
  }
  const width = Math.max(...[...rows.values()].map(r => r.length));
  for (const [id, p] of pos) {
    /* Centre each row against the widest one. */
    const offset = (width - p.row) / 2;
    pos.set(id, { ...p,
      px: PAD + (p.x + offset) * (NODE_W + GAP_X),
      py: PAD + p.y * (NODE_H + GAP_Y) });
  }
  return { pos, w: PAD * 2 + width * NODE_W + (width - 1) * GAP_X, h: PAD * 2 + (maxDepth + 1) * NODE_H + maxDepth * GAP_Y };
}

function wrap(label, max = 23) {
  const words = String(label).split(' ');
  const lines = ['']; 
  for (const w of words) {
    if ((lines[lines.length - 1] + ' ' + w).trim().length > max) lines.push(w);
    else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim();
  }
  return lines.slice(0, 3);
}

/**
 * Render one surface's graph. `highlight` is a set of node ids on a path to emphasise;
 * `selected` is the inspected node.
 */
export function render(graph, opts = {}) {
  const { pos, w, h } = layout(graph);
  const hi = opts.highlight || new Set();
  const sel = opts.selected;
  const dimmed = hi.size > 0;
  const parts = [];

  parts.push(`<svg class="graph" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMin meet" style="--nat:${w}px" role="img" aria-label="What this agent can reach">`);
  parts.push(`<defs>
    <marker id="ar" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 z" fill="currentColor"/></marker>
  </defs>`);

  /* Parent edges first, so nodes sit on top of them. */
  for (const n of graph.nodes) {
    if (!n.parent || !pos.has(n.parent)) continue;
    const a = pos.get(n.parent), b = pos.get(n.id);
    const on = hi.has(n.id) && hi.has(n.parent);
    const x1 = a.px + NODE_W / 2, y1 = a.py + NODE_H, x2 = b.px + NODE_W / 2, y2 = b.py;
    const mid = (y1 + y2) / 2;
    parts.push(`<path class="edge${on ? ' on' : dimmed ? ' dim' : ''}" d="M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}" marker-end="url(#ar)"/>`);
  }
  /* Escalation edges: the ones that make a setting cosmetic. Drawn dashed and to the side. */
  for (const e of graph.escalations) {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) continue;
    const on = hi.has(e.from) && hi.has(e.to);
    const x1 = a.px, y1 = a.py + NODE_H / 2, x2 = b.px + NODE_W, y2 = b.py + NODE_H / 2;
    const bow = Math.min(x1, x2) - 60;
    parts.push(`<path class="edge esc${on ? ' on' : dimmed ? ' dim' : ''}" d="M${x1},${y1} C${bow},${y1} ${bow},${y2} ${x2},${y2}" marker-end="url(#ar)"/>`);
  }

  for (const n of graph.nodes) {
    const p = pos.get(n.id);
    const cls = [TIER_CLASS[n.tier] || 'g-none'];
    if (sel === n.id) cls.push('sel');
    if (hi.size && !hi.has(n.id)) cls.push('dim');
    if (n.unverified) cls.push('unv');
    const lines = wrap(n.label);
    const ty = NODE_H / 2 - (lines.length - 1) * 7 + 4;
    parts.push(`<g class="node ${cls.join(' ')}" data-node="${esc(n.id)}" transform="translate(${p.px},${p.py})" tabindex="0" role="button" aria-label="${esc(n.label)}">`);
    parts.push(`<rect width="${NODE_W}" height="${NODE_H}" rx="9"/>`);
    parts.push(`<rect class="bar" width="4" height="${NODE_H}" rx="2"/>`);
    lines.forEach((l, i) => parts.push(`<text x="${NODE_W / 2}" y="${ty + i * 14}" text-anchor="middle">${esc(l)}</text>`));
    if ((n.reaches || []).length) {
      parts.push(`<circle class="dot" cx="${NODE_W - 12}" cy="12" r="8"/>`);
      parts.push(`<text class="dotn" x="${NODE_W - 12}" y="15.5" text-anchor="middle">${n.reaches.length}</text>`);
    }
    if (n.unverified) parts.push(`<text class="unvmark" x="12" y="${NODE_H - 8}">?</text>`);
    parts.push(`</g>`);
  }
  parts.push('</svg>');
  return parts.join('');
}

/** The legend belongs next to the graph rather than in a paragraph above it. */
export function legend(lib) {
  const rows = ['boundary', 'setting', 'none'].map(t =>
    `<span class="lg"><i class="${TIER_CLASS[t]}"></i>${t === 'none' ? 'nothing in the way' : t}</span>`);
  rows.push('<span class="lg"><i class="lg-esc"></i>a way around a setting</span>');
  rows.push('<span class="lg"><i class="lg-unv"></i>you told us you were not sure</span>');
  return `<div class="legend">${rows.join('')}</div>`;
}
