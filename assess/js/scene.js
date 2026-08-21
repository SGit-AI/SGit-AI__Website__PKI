/* pki.sgit.ai — the scene view.

   The graph shows relationships; this shows recognition. A reader looking at a picture
   of a laptop with their own dotfiles drawn beside the terminal knows what they are
   looking at before they have read a word, and that is a different job from the graph's.

   Same model, no second source of truth: every asset here is a node from library.json,
   drawn only if it survived the facts, and clicking it opens the same inspector. */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Where each node sits in each scene, and what it is drawn as. Presentation only —
   the data stays in the library. */
const SCENES = {
  cli: {
    frame: 'machine', title: 'Your machine', w: 760, h: 400,
    agent: { id: 'root', x: 250, y: 150, w: 260, h: 120, kind: 'terminal', caption: 'A terminal, running as you' },
    assets: [
      { id: 'proj',  x: 40,  y: 44,  icon: 'folder', label: 'Your project' },
      { id: 'creds', x: 40,  y: 150, icon: 'key',    label: 'Credential files' },
      { id: 'hist',  x: 40,  y: 256, icon: 'scroll', label: 'History & transcripts' },
      { id: 'cfg',   x: 560, y: 44,  icon: 'gear',   label: 'Its own rules file' },
      { id: 'cloud', x: 560, y: 150, icon: 'cloud',  label: 'Cloud accounts' },
      { id: 'code',  x: 560, y: 232, icon: 'repo',   label: 'Code hosts' },
      { id: 'pkg',   x: 560, y: 314, icon: 'box',    label: 'Registries' }
    ],
    outside: { id: 'net', label: 'The internet' }
  },
  desktop: {
    frame: 'machine', title: 'Your machine', w: 760, h: 400,
    agent: { id: 'root', x: 250, y: 150, w: 260, h: 120, kind: 'window', caption: 'An application, running as you' },
    assets: [
      { id: 'proj',  x: 40,  y: 44,  icon: 'folder', label: 'Your project' },
      { id: 'creds', x: 40,  y: 150, icon: 'key',    label: 'Credential files' },
      { id: 'hist',  x: 40,  y: 256, icon: 'scroll', label: 'History & transcripts' },
      { id: 'cfg',   x: 560, y: 44,  icon: 'gear',   label: 'Its own settings' },
      { id: 'cloud', x: 560, y: 150, icon: 'cloud',  label: 'Cloud accounts' },
      { id: 'code',  x: 560, y: 232, icon: 'repo',   label: 'Code hosts' },
      { id: 'pkg',   x: 560, y: 314, icon: 'box',    label: 'Registries' }
    ],
    outside: { id: 'net', label: 'The internet' }
  },
  web: {
    frame: 'split', title: 'Your machine', title2: "The vendor's environment", w: 760, h: 340,
    agent: { id: 'root', x: 430, y: 120, w: 280, h: 120, kind: 'cloud', caption: 'Runs over there, not here' },
    assets: [
      { id: 'paste',   x: 60, y: 60,  icon: 'paste',  label: 'What you paste in' },
      { id: 'conv',    x: 60, y: 166, icon: 'chat',   label: 'The conversation' },
      { id: 'connect', x: 430, y: 260, icon: 'plug',  label: 'Connectors you switched on' },
      { id: 'home',    x: 60, y: 254, icon: 'lock',   label: 'Your files — out of reach' }
    ]
  },
  agentbox: {
    frame: 'split', title: 'Your machine', title2: "A container you do not control", w: 760, h: 340,
    agent: { id: 'root', x: 430, y: 110, w: 280, h: 110, kind: 'box', caption: 'Root, inside the container' },
    assets: [
      { id: 'repo',  x: 430, y: 244, icon: 'repo',  label: 'The repo you attached' },
      { id: 'sign',  x: 620, y: 244, icon: 'pen',   label: 'Signing identity' },
      { id: 'home',  x: 60,  y: 110, icon: 'lock',  label: 'Your files — out of reach' },
      { id: 'creds', x: 60,  y: 220, icon: 'lock',  label: 'No usable credentials' }
    ],
    outside: { id: 'net', label: 'The internet, through a gate' }
  }
};

const ICONS = {
  folder: 'M2,5 h7 l2,2.5 h11 v12 h-20 z',
  key:    'M15,4 a5,5 0 1,0 -3.5,8.5 L10,14 v3 h-3 v3 h-4 v-4 l8,-8 A5,5 0 0,0 15,4 z',
  scroll: 'M4,4 h16 v14 a3,3 0 0,1 -3,3 h-13 a3,3 0 0,0 3,-3 z',
  gear:   'M12,8 a4,4 0 1,0 0,8 a4,4 0 0,0 0,-8 z M11,2 h2 l.6,3 2,1 2.6,-1.6 1.4,1.4 -1.6,2.6 1,2 3,.6 v2 l-3,.6 -1,2 1.6,2.6 -1.4,1.4 -2.6,-1.6 -2,1 -.6,3 h-2 l-.6,-3 -2,-1 -2.6,1.6 -1.4,-1.4 1.6,-2.6 -1,-2 -3,-.6 v-2 l3,-.6 1,-2 -1.6,-2.6 1.4,-1.4 2.6,1.6 2,-1 z',
  cloud:  'M6,18 a4,4 0 0,1 .6,-8 a6,6 0 0,1 11.3,1.6 a3.5,3.5 0 0,1 -.9,6.4 z',
  repo:   'M5,3 h12 a2,2 0 0,1 2,2 v16 l-4,-3 -4,3 -4,-3 v-13 a2,2 0 0,1 -2,-2 z',
  box:    'M12,2 l9,5 v10 l-9,5 -9,-5 v-10 z',
  paste:  'M8,3 h8 v3 h-8 z M5,5 h3 v3 h8 v-3 h3 v16 h-14 z',
  chat:   'M3,5 h18 v11 h-11 l-5,4 v-4 h-2 z',
  plug:   'M9,2 v6 M15,2 v6 M6,8 h12 v4 a6,6 0 0,1 -12,0 z M12,18 v4',
  lock:   'M7,10 v-3 a5,5 0 0,1 10,0 v3 h1.5 v11 h-13 v-11 z',
  pen:    'M4,20 l1,-4 11,-11 3,3 -11,11 z M17,3 l3,3'
};

export function render(lib, graph, opts = {}) {
  const S = SCENES[graph.surface];
  if (!S) return '';
  const live = new Map(graph.nodes.map(n => [n.id, n]));
  const sel = opts.selected;
  const P = [];
  const agentCx = S.agent.x + S.agent.w / 2, agentCy = S.agent.y + S.agent.h / 2;

  P.push(`<svg class="scene" viewBox="0 0 ${S.w} ${S.h}" preserveAspectRatio="xMidYMin meet" style="--nat:${S.w}px" role="img" aria-label="Where this agent sits, and what is around it">`);

  /* Frames: one machine, or your machine and theirs with a boundary between. */
  if (S.frame === 'machine') {
    P.push(`<rect class="frame" x="12" y="12" width="${S.w - 24}" height="${S.h - 24}" rx="14"/>`);
    P.push(`<text class="ftitle" x="28" y="34">${esc(S.title)}</text>`);
  } else {
    P.push(`<rect class="frame" x="12" y="12" width="${S.w / 2 - 30}" height="${S.h - 24}" rx="14"/>`);
    P.push(`<text class="ftitle" x="28" y="34">${esc(S.title)}</text>`);
    P.push(`<rect class="frame vendor" x="${S.w / 2 + 6}" y="12" width="${S.w / 2 - 18}" height="${S.h - 24}" rx="14"/>`);
    P.push(`<text class="ftitle" x="${S.w / 2 + 22}" y="34">${esc(S.title2)}</text>`);
    P.push(`<line class="boundary" x1="${S.w / 2 - 12}" y1="24" x2="${S.w / 2 - 12}" y2="${S.h - 24}"/>`);
    P.push(`<text class="bmark" x="${S.w / 2 - 12}" y="${S.h - 8}" text-anchor="middle">a boundary you did not build and cannot inspect</text>`);
  }

  /* Reach lines from the agent to every asset that is actually live. */
  for (const a of S.assets) {
    const n = live.get(a.id); if (!n) continue;
    const cx = a.x + 26, cy = a.y + 26;
    const cls = n.tier === 'boundary' ? 'blocked' : n.tier === 'setting' ? 'setting' : 'open';
    P.push(`<path class="reach ${cls}${sel === a.id ? ' on' : ''}" d="M${agentCx},${agentCy} L${cx},${cy}"/>`);
    if (n.tier === 'boundary') {
      const mx = (agentCx + cx) / 2, my = (agentCy + cy) / 2;
      P.push(`<g class="stop"><circle cx="${mx}" cy="${my}" r="9"/><path d="M${mx - 4},${my} h8"/></g>`);
    }
  }
  if (S.outside && live.get(S.outside.id)) {
    const n = live.get(S.outside.id);
    const gx = S.w - 34, gy = S.h / 2;
    P.push(`<path class="reach ${n.reaches.includes('net.allowed') ? 'setting' : 'open'}${sel === S.outside.id ? ' on' : ''}" d="M${agentCx},${agentCy} L${gx - 16},${gy}"/>`);
    P.push(`<g class="node asset out" data-node="${esc(S.outside.id)}" transform="translate(${gx - 16},${gy - 22})" tabindex="0" role="button" aria-label="${esc(S.outside.label)}">
      <rect width="34" height="44" rx="8"/><text class="ai" x="17" y="20" text-anchor="middle">↗</text>
      <text class="al" x="17" y="60" text-anchor="middle">${esc(n.reaches.includes('net.allowed') ? 'gated' : 'open')}</text></g>`);
  }

  /* The agent itself. */
  const rootNode = live.get(S.agent.id);
  P.push(`<g class="node agent${sel === S.agent.id ? ' sel' : ''}" data-node="${esc(S.agent.id)}" transform="translate(${S.agent.x},${S.agent.y})" tabindex="0" role="button" aria-label="${esc(rootNode ? rootNode.label : 'the agent')}">`);
  P.push(`<rect width="${S.agent.w}" height="${S.agent.h}" rx="10"/>`);
  P.push(`<rect class="bar" width="${S.agent.w}" height="22" rx="10"/><rect class="bar2" y="12" width="${S.agent.w}" height="10"/>`);
  ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) =>
    P.push(`<circle class="tl" cx="${14 + i * 14}" cy="11" r="4.5" fill="${c}"/>`));
  P.push(`<text class="acap" x="${S.agent.w / 2}" y="46" text-anchor="middle">${esc(S.agent.caption)}</text>`);
  if (S.agent.kind === 'terminal') {
    P.push(`<text class="prompt" x="16" y="72">$ <tspan class="cmd">agent</tspan> --dangerously-do-things</text>`);
    P.push(`<text class="prompt" x="16" y="92">▍</text>`);
  } else {
    P.push(`<text class="prompt" x="16" y="74">▸ working…</text>`);
  }
  P.push(`</g>`);

  /* Assets. Drawn only if the facts kept them. */
  for (const a of S.assets) {
    const n = live.get(a.id); if (!n) continue;
    const cls = n.tier === 'boundary' ? 'safe' : n.tier === 'setting' ? 'warn' : 'open';
    P.push(`<g class="node asset ${cls}${sel === a.id ? ' sel' : ''}${n.unverified ? ' unv' : ''}" data-node="${esc(a.id)}" transform="translate(${a.x},${a.y})" tabindex="0" role="button" aria-label="${esc(n.label)}">`);
    P.push(`<rect width="52" height="52" rx="11"/>`);
    P.push(`<path class="ico" transform="translate(14,14) scale(1)" d="${ICONS[a.icon] || ICONS.box}"/>`);
    if (n.unverified) P.push(`<text class="unvmark" x="45" y="16">?</text>`);
    wrapLabel(a.label).forEach((l, i) =>
      P.push(`<text class="al" x="26" y="${68 + i * 12}" text-anchor="middle">${esc(l)}</text>`));
    P.push(`</g>`);
  }
  P.push('</svg>');
  return P.join('');
}

function wrapLabel(s, max = 16) {
  const words = String(s).split(' '), lines = [''];
  for (const w of words) {
    if ((lines[lines.length - 1] + ' ' + w).trim().length > max) lines.push(w);
    else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim();
  }
  return lines.slice(0, 2);
}

export function legend() {
  return `<div class="legend">
    <span class="lg"><i class="sc-open"></i>reachable, nothing in the way</span>
    <span class="lg"><i class="sc-warn"></i>a setting stands in the way</span>
    <span class="lg"><i class="sc-safe"></i>out of reach — a real boundary</span>
    <span class="lg"><i class="lg-unv"></i>you said you were not sure</span></div>`;
}
