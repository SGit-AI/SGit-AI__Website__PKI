/* pki-props.js: the props pki.sgit.ai's storyboards need and the gen-z kit does not have, drawn the same way (Rough.js,
 * sketchy, nothing an image). Loaded before assets/storyboard/storyboard.js, which merges them into its PROPS through
 * the one local patch in that file. Every prop is (g, rc, x, y, s, p): x the centre, y the line it stands on, s a
 * scale, p the scene's entry. A prop that names a `label` writes it under (or on) itself.
 *
 *   key        a key; p.colour, p.label (e.g. "sign", "encrypt"), p.private draws it with a small padlock
 *   vault      a safe; p.label, p.colour, p.open (the door ajar), p.size (1 is 240 wide)
 *   qr         a QR code, with the URL printed above it as on this site; p.text, p.size, p.seed
 *   envelope   a sealed message; p.label, p.sealed (a wax seal), p.colour
 *   record     a signed statement on paper; p.lines, p.stamp (the seal's word)
 *   server     a server holding only ciphertext; p.label
 *   arrow      a hand-drawn arrow from x to p.to (both 0..1 of the width), at height y; p.label, p.both, p.dashed, p.colour
 *   mark       a big tick or cross; p.ok
 *   calendar   a date card; p.label, p.colour
 *   terminal   an agent's terminal; p.lines
 *   phoneqr    a phone with a QR code on its screen; p.text
 *   padlock    a padlock; p.open
 *
 * For the technical boards (v0.2.8), drawn to carry more than one action a panel. Any prop takes p.d, a delay in seconds:
 * it pops in then when the deck plays the panel, so the props of one panel happen in order.
 *   steps      a numbered list of actions, each popping in after the last; p.title, p.items, p.now (the current one,
 *              0-based: those before it ticked), p.w, p.d
 *   session    a cloud session: a box with its name, a few terminal lines, and its key; p.name, p.lines, p.key
 *              ("private" draws it locked), p.colour, p.w, p.h
 *   browser    a browser window: p.url, p.lines, p.button (a highlighted button), p.w, p.h
 *   dns        a DNS TXT record on a signpost: p.name, p.value
 *   chain      keys linked in a chain, from x to p.to: p.nodes [{ label, sub, colour }], p.links [labels], p.broken
 *              (the index of a link that does not hold: drawn cut, in red)
 *   policy     a behaviour policy on a scroll: p.title, p.lines, p.hash, p.signed
 *   lane       an append lane, as a letterbox: anyone posts, only the owner opens; p.label, p.count (letters in it)
 *   stop       a stop sign: p.text (REFUSE), p.label
 *   pin        a pinned fingerprint: the root an agent was told out of band; p.text, p.label
 *   hourglass  an expiry; p.label
 *   file       a file, with a QR code on it when p.qr; p.name, p.label
 *   note       a sticky note: p.lines, p.w, p.colour
 */
(function () {
  'use strict';
  window.StoryboardExtraProps = function (k) {
    const { draw, el, textBlock, wrap, INK, W } = k, PAPER = k.PAPER || '#fbf8f1';
    const ink = (o) => Object.assign({ stroke: INK, strokeWidth: 2.4 }, o || {});
    // a label sits on the floor line more often than not: a halo of paper keeps it legible over the line
    const label = (g, text, x, y, size, o) => { if (!text) return; const t = textBlock(g, wrap(text, (o && o.max) || 20), x, y, (size || 26) * 1.35, Object.assign({ anchor: 'middle' }, o || {})); if (t && t.setAttribute) { t.setAttribute('stroke', PAPER); t.setAttribute('stroke-width', '7'); t.setAttribute('stroke-linejoin', 'round'); t.setAttribute('paint-order', 'stroke') } };
    function rand(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
    const hash = (s) => { let h = 2166136261; for (const c of String(s || '')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
    function padlock(g, rc, x, y, s, open) {
      draw(g, rc.rectangle(x - 22 * s, y - 34 * s, 44 * s, 34 * s, ink({ fill: '#f59e0b', fillStyle: 'solid', strokeWidth: 2 })));
      draw(g, rc.path(open ? `M${x - 14 * s},${y - 34 * s} V${y - 52 * s} Q${x - 14 * s},${y - 66 * s} ${x},${y - 66 * s} Q${x + 14 * s},${y - 66 * s} ${x + 14 * s},${y - 56 * s}`
        : `M${x - 14 * s},${y - 34 * s} V${y - 50 * s} Q${x - 14 * s},${y - 64 * s} ${x},${y - 64 * s} Q${x + 14 * s},${y - 64 * s} ${x + 14 * s},${y - 50 * s} V${y - 34 * s}`, ink({ strokeWidth: 3 })));
    }
    function qrModules(g, rc, x0, y0, size, seed) {
      const n = 21, c = size / n, r = rand(seed);
      el('rect', { x: x0, y: y0, width: size, height: size, fill: '#fff' }, g);
      const finder = (fx, fy) => { el('rect', { x: x0 + fx * c, y: y0 + fy * c, width: 7 * c, height: 7 * c, fill: INK }, g); el('rect', { x: x0 + (fx + 1) * c, y: y0 + (fy + 1) * c, width: 5 * c, height: 5 * c, fill: '#fff' }, g); el('rect', { x: x0 + (fx + 2) * c, y: y0 + (fy + 2) * c, width: 3 * c, height: 3 * c, fill: INK }, g); };
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const inF = (i < 8 && j < 8) || (i < 8 && j > n - 9) || (i > n - 9 && j < 8);
        if (!inF && r() < 0.48) el('rect', { x: x0 + j * c, y: y0 + i * c, width: c + 0.4, height: c + 0.4, fill: INK }, g);
      }
      finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
      draw(g, rc.rectangle(x0 - 6, y0 - 6, size + 12, size + 12, ink({ strokeWidth: 2 })));
    }
    const delayed = (props) => { for (const k of Object.keys(props)) { const f = props[k]; props[k] = (g, rc, x, y, s, p) => { if (p && p.d != null) { g.classList.add('pop'); g.setAttribute('style', `--d:${p.d}s`) } return f(g, rc, x, y, s, p) } } return props }
    // drawn at 1.45 times the kit's own scale, so a key or a vault reads next to a person in a 1600-wide panel
    const K = 1.45
    return delayed({
      key(g, rc, x, y, s, p) {
        s *= K
        const c = p.colour || '#0f766e', bx = x - 70 * s, by = y - 60 * s;
        draw(g, rc.circle(bx, by, 70 * s, ink({ fill: c, fillStyle: 'hachure', hachureGap: 6 })));
        draw(g, rc.circle(bx, by, 22 * s, ink({ fill: '#fff', fillStyle: 'solid' })));
        draw(g, rc.rectangle(bx + 34 * s, by - 9 * s, 120 * s, 18 * s, ink({ fill: c, fillStyle: 'solid' })));
        draw(g, rc.rectangle(bx + 118 * s, by + 9 * s, 14 * s, 26 * s, ink({ fill: c, fillStyle: 'solid' })));
        draw(g, rc.rectangle(bx + 92 * s, by + 9 * s, 14 * s, 18 * s, ink({ fill: c, fillStyle: 'solid' })));
        if (p.private) padlock(g, rc, bx, by + 70 * s, 0.8 * s, false);
        label(g, p.label, x, y + 34 * s, 26 * s);
      },
      vault(g, rc, x, y, s, p) {
        s *= (p.size || 1) * K; const w = 240 * s, h = 220 * s, c = p.colour || '#cbd5e1';
        draw(g, rc.rectangle(x - w / 2, y - h, w, h, ink({ fill: c, fillStyle: 'solid', strokeWidth: 3 })));
        if (p.open) draw(g, rc.polygon([[x - w / 2 + 14 * s, y - h + 14 * s], [x - w / 2 - 60 * s, y - h + 40 * s], [x - w / 2 - 60 * s, y - 20 * s], [x - w / 2 + 14 * s, y - 14 * s]], ink({ fill: '#e5e7eb', fillStyle: 'solid' })));
        else {
          draw(g, rc.rectangle(x - w / 2 + 14 * s, y - h + 14 * s, w - 28 * s, h - 28 * s, ink({ strokeWidth: 2 })));
          draw(g, rc.circle(x, y - h / 2, 70 * s, ink({ fill: '#f8fafc', fillStyle: 'solid' })));
          for (let a = 0; a < 6; a++) { const t = a * Math.PI / 3; draw(g, rc.line(x + Math.cos(t) * 20 * s, y - h / 2 + Math.sin(t) * 20 * s, x + Math.cos(t) * 32 * s, y - h / 2 + Math.sin(t) * 32 * s, ink({ strokeWidth: 2 }))); }
          draw(g, rc.line(x + 70 * s, y - h / 2 - 30 * s, x + 70 * s, y - h / 2 + 30 * s, ink({ strokeWidth: 5 })));
        }
        label(g, p.label, x, y - h - 18 * s, 28 * s, { weight: 'bold', max: 18 });
      },
      qr(g, rc, x, y, s, p) {
        s *= K; const size = 200 * s * (p.size || 1);
        qrModules(g, rc, x - size / 2, y - size, size, p.seed || hash(p.text));
        if (p.text) textBlock(g, [p.text.length > 34 ? p.text.slice(0, 31) + '…' : p.text], x, y - size - 18, 20 * s, { anchor: 'middle', font: 'ui-monospace, Menlo, monospace' });
      },
      envelope(g, rc, x, y, s, p) {
        s *= K
        const w = 230 * s, h = 150 * s, c = p.colour || '#fef3c7';
        draw(g, rc.rectangle(x - w / 2, y - h, w, h, ink({ fill: c, fillStyle: 'solid' })));
        draw(g, rc.path(`M${x - w / 2},${y - h} L${x},${y - h / 2.2} L${x + w / 2},${y - h}`, ink()));
        if (p.sealed !== false) { draw(g, rc.circle(x, y - h / 2.2, 46 * s, ink({ fill: '#b91c1c', fillStyle: 'solid' }))); textBlock(g, ['✓'], x, y - h / 2.2 + 8 * s, 24 * s, { anchor: 'middle', fill: '#fff' }); }
        label(g, p.label, x, y + 34 * s, 24 * s);
      },
      record(g, rc, x, y, s, p) {
        s *= K * 0.9
        const w = 280 * s, h = 300 * s;
        draw(g, rc.rectangle(x - w / 2, y - h, w, h, ink({ fill: '#ffffff', fillStyle: 'solid' })));
        if (p.lines) textBlock(g, p.lines.slice(0, 7), x - w / 2 + 18 * s, y - h + 44 * s, 24 * s, { lh: 1.3 });
        else for (let i = 0; i < 6; i++) draw(g, rc.line(x - w / 2 + 24 * s, y - h + (50 + i * 34) * s, x + w / 2 - (30 + (i % 3) * 30) * s, y - h + (50 + i * 34) * s, ink({ stroke: '#9ca3af', strokeWidth: 2 })));
        if (p.stamp !== false) { draw(g, rc.circle(x + w / 2 - 50 * s, y - 50 * s, 70 * s, ink({ stroke: '#b91c1c', strokeWidth: 3 }))); textBlock(g, [p.stamp || 'signed'], x + w / 2 - 50 * s, y - 43 * s, 18 * s, { anchor: 'middle', fill: '#b91c1c' }); }
        label(g, p.label, x, y + 34 * s, 24 * s);
      },
      server(g, rc, x, y, s, p) {
        s *= K * 0.9
        const w = 170 * s, h = 300 * s;
        draw(g, rc.rectangle(x - w / 2, y - h, w, h, ink({ fill: '#e2e8f0', fillStyle: 'solid', strokeWidth: 3 })));
        for (let i = 0; i < 5; i++) { draw(g, rc.rectangle(x - w / 2 + 14 * s, y - h + (18 + i * 54) * s, w - 28 * s, 40 * s, ink({ strokeWidth: 1.8 }))); el('circle', { cx: x + w / 2 - 30 * s, cy: y - h + (38 + i * 54) * s, r: 6 * s, fill: i % 2 ? '#22c55e' : '#f59e0b' }, g); }
        label(g, p.label, x, y + 34 * s, 22 * s, { max: 20 });
      },
      arrow(g, rc, x, y, s, p) {
        const x2 = (p.to == null ? 0.5 : p.to) * W, c = p.colour || INK, d = x2 > x ? 1 : -1;
        draw(g, rc.line(x, y, x2, y, ink({ stroke: c, strokeWidth: 4, strokeLineDash: p.dashed ? [16, 12] : undefined })));
        draw(g, rc.path(`M${x2 - d * 28},${y - 16} L${x2},${y} L${x2 - d * 28},${y + 16}`, ink({ stroke: c, strokeWidth: 4 })));
        if (p.both) draw(g, rc.path(`M${x + d * 28},${y - 16} L${x},${y} L${x + d * 28},${y + 16}`, ink({ stroke: c, strokeWidth: 4 })));
        label(g, p.label, (x + x2) / 2, y - 26, 26, { max: 30, fill: c === INK ? INK : c });
      },
      mark(g, rc, x, y, s, p) {
        s *= K
        if (p.ok) draw(g, rc.path(`M${x - 50 * s},${y - 60 * s} L${x - 12 * s},${y - 20 * s} L${x + 60 * s},${y - 110 * s}`, { stroke: '#15803d', strokeWidth: 12, roughness: 1.2 }));
        else { draw(g, rc.line(x - 50 * s, y - 110 * s, x + 50 * s, y - 10 * s, { stroke: '#b91c1c', strokeWidth: 12, roughness: 1.2 })); draw(g, rc.line(x + 50 * s, y - 110 * s, x - 50 * s, y - 10 * s, { stroke: '#b91c1c', strokeWidth: 12, roughness: 1.2 })); }
        label(g, p.label, x, y + 30 * s, 24 * s);
      },
      calendar(g, rc, x, y, s, p) {
        s *= K * 0.9
        const w = 200 * s, h = 170 * s;
        draw(g, rc.rectangle(x - w / 2, y - h, w, h, ink({ fill: '#fff', fillStyle: 'solid' })));
        draw(g, rc.rectangle(x - w / 2, y - h, w, 44 * s, ink({ fill: p.colour || '#b91c1c', fillStyle: 'solid' })));
        for (const dx of [-50, 50]) draw(g, rc.line(x + dx * s, y - h - 16 * s, x + dx * s, y - h + 14 * s, ink({ strokeWidth: 5 })));
        if (p.label) textBlock(g, wrap(p.label, 12), x, y - h + 90 * s, 28 * s, { anchor: 'middle' });
      },
      terminal(g, rc, x, y, s, p) {
        s *= K * 0.95
        const w = 460 * s, h = 260 * s;
        draw(g, rc.rectangle(x - w / 2, y - h, w, h, ink({ fill: '#0d1117', fillStyle: 'solid', strokeWidth: 3 })));
        (p.lines || ['$ _']).slice(0, 7).forEach((l, i) => { const t = el('text', { x: x - w / 2 + 18 * s, y: y - h + (40 + i * 32) * s, 'font-family': 'ui-monospace, Menlo, monospace', 'font-size': 20 * s, fill: i === 0 ? '#3fb950' : '#e6edf3' }, g); t.textContent = l.length > 38 ? l.slice(0, 37) + '…' : l; });
      },
      phoneqr(g, rc, x, y, s, p) {
        s *= K
        const w = 150 * s, h = 270 * s;
        draw(g, rc.rectangle(x - w / 2, y - h, w, h, ink({ fill: '#111827', fillStyle: 'solid', strokeWidth: 3 })));
        qrModules(g, rc, x - 56 * s, y - h + 60 * s, 112 * s, p.seed || hash(p.text));
        if (p.text) textBlock(g, [p.text.length > 22 ? p.text.slice(0, 20) + '…' : p.text], x, y - h + 42 * s, 13 * s, { anchor: 'middle', fill: '#e5e7eb', font: 'ui-monospace, Menlo, monospace' });
        label(g, p.label, x, y + 34 * s, 22 * s);
      },
      padlock(g, rc, x, y, s, p) { padlock(g, rc, x, y, 2 * s, p.open); label(g, p.label, x, y + 34 * s, 22 * s); },

      // ---------------------------------------------------------- the technical props
      steps(g, rc, x, y, s, p) {
        const w = (p.w || 560) * s, items = p.items || [], size = 24 * s, per = Math.max(14, Math.floor(w / (size * 0.52)) - 4)
        const wrapped = items.map(t => wrap(t, per)), h = 74 * s + wrapped.reduce((a, l) => a + l.length * size * 1.25 + 16 * s, 0)
        const x0 = x - w / 2, y0 = y - h, now = p.now == null ? -1 : p.now
        draw(g, rc.rectangle(x0, y0, w, h, ink({ fill: '#ffffff', fillStyle: 'solid' })))
        if (p.title) textBlock(g, [p.title], x0 + 20 * s, y0 + 40 * s, 26 * s, { weight: 'bold' })
        let cy = y0 + 70 * s
        wrapped.forEach((lines, i) => {
          const it = el('g', { class: 'pop', style: `--d:${(p.d || 0.2) + 0.45 * (i + 1)}s` }, g)
          const done = i < now, cur = i === now
          if (cur) draw(it, rc.rectangle(x0 + 8 * s, cy - 6 * s, w - 16 * s, lines.length * size * 1.25 + 12 * s, { fill: '#fef9c3', fillStyle: 'solid', stroke: 'none' }))
          draw(it, rc.circle(x0 + 34 * s, cy + size * 0.45, 34 * s, ink({ fill: done ? '#15803d' : cur ? '#f59e0b' : '#f3f4f6', fillStyle: 'solid', strokeWidth: 2 })))
          textBlock(it, [done ? '✓' : String(i + 1)], x0 + 34 * s, cy + size * 0.75, 20 * s, { anchor: 'middle', weight: 'bold', fill: done ? '#fff' : INK })
          textBlock(it, lines, x0 + 64 * s, cy + size * 0.8, size, { lh: 1.25, fill: done ? '#4b5563' : INK, weight: cur ? 'bold' : 'normal' })
          cy += lines.length * size * 1.25 + 16 * s
        })
      },
      session(g, rc, x, y, s, p) {
        const w = (p.w || 440) * s, h = (p.h || 300) * s, c = p.colour || '#dbeafe', x0 = x - w / 2, y0 = y - h
        draw(g, rc.rectangle(x0, y0, w, h, ink({ fill: '#f8fafc', fillStyle: 'solid', strokeWidth: 3 })))
        draw(g, rc.rectangle(x0, y0, w, 48 * s, ink({ fill: c, fillStyle: 'solid' })))
        textBlock(g, ['☁ ' + (p.name || 'a session')], x0 + 16 * s, y0 + 33 * s, 22 * s, { weight: 'bold' })
        ;(p.lines || []).slice(0, 6).forEach((l, i) => { const t = el('text', { x: x0 + 18 * s, y: y0 + (84 + i * 30) * s, 'font-family': 'ui-monospace, Menlo, monospace', 'font-size': 18 * s, fill: '#111827' }, g); t.textContent = l.length > Math.floor(w / (11 * s)) ? l.slice(0, Math.floor(w / (11 * s)) - 1) + '…' : l })
        if (p.key) {
          const kx = x0 + w - 60 * s, ky = y - 36 * s
          draw(g, rc.circle(kx - 22 * s, ky, 30 * s, ink({ fill: '#f59e0b', fillStyle: 'hachure', hachureGap: 4 })))
          draw(g, rc.rectangle(kx - 8 * s, ky - 5 * s, 44 * s, 10 * s, ink({ fill: '#f59e0b', fillStyle: 'solid', strokeWidth: 1.6 })))
          if (p.key === 'private') padlock(g, rc, kx + 34 * s, ky + 28 * s, 0.55 * s, false)
        }
        label(g, p.label, x, y + 34 * s, 22 * s, { max: 28 })
      },
      browser(g, rc, x, y, s, p) {
        const w = (p.w || 600) * s, h = (p.h || 380) * s, x0 = x - w / 2, y0 = y - h
        draw(g, rc.rectangle(x0, y0, w, h, ink({ fill: '#ffffff', fillStyle: 'solid', strokeWidth: 3 })))
        draw(g, rc.rectangle(x0, y0, w, 50 * s, ink({ fill: '#e5e7eb', fillStyle: 'solid' })))
        ;['#ef4444', '#f59e0b', '#22c55e'].forEach((c, i) => el('circle', { cx: x0 + (24 + i * 24) * s, cy: y0 + 25 * s, r: 7 * s, fill: c }, g))
        draw(g, rc.rectangle(x0 + 100 * s, y0 + 11 * s, w - 120 * s, 28 * s, ink({ fill: '#fff', fillStyle: 'solid', strokeWidth: 1.4 })))
        if (p.url) textBlock(g, [p.url.length > Math.floor((w - 140 * s) / (10 * s)) ? p.url.slice(0, Math.floor((w - 140 * s) / (10 * s)) - 1) + '…' : p.url], x0 + 112 * s, y0 + 31 * s, 17 * s, { font: 'ui-monospace, Menlo, monospace', fill: '#374151' })
        textBlock(g, (p.lines || []).flatMap(l => wrap(l, Math.floor(w / (12 * s)))).slice(0, 7), x0 + 22 * s, y0 + 94 * s, 22 * s, { lh: 1.35 })
        if (p.button) {
          const bw = Math.min(w - 44 * s, (p.button.length * 12 + 40) * s), bx = x0 + 22 * s, by = y - 70 * s
          draw(g, rc.rectangle(bx, by, bw, 46 * s, ink({ fill: '#115e59', fillStyle: 'solid' })))
          textBlock(g, [p.button], bx + bw / 2, by + 31 * s, 20 * s, { anchor: 'middle', fill: '#fff', weight: 'bold' })
        }
        label(g, p.label, x, y + 34 * s, 22 * s, { max: 30 })
      },
      dns(g, rc, x, y, s, p) {
        const w = 470 * s, h = 150 * s, top = y - 360 * s
        draw(g, rc.line(x, top + h, x, y, ink({ strokeWidth: 8, stroke: '#78350f' })))
        draw(g, rc.rectangle(x - w / 2, top, w, h, ink({ fill: '#dbeafe', fillStyle: 'solid', strokeWidth: 3 })))
        textBlock(g, ['DNS · TXT'], x - w / 2 + 16 * s, top + 34 * s, 22 * s, { weight: 'bold', fill: '#1e3a8a' })
        textBlock(g, [p.name || '_pki.sgit.ai.example.org', p.value || 'pki.sgit.ai=sha256:…'], x - w / 2 + 16 * s, top + 74 * s, 19 * s, { font: 'ui-monospace, Menlo, monospace', lh: 1.5 })
        label(g, p.label, x, y + 34 * s, 22 * s)
      },
      chain(g, rc, x, y, s, p) {
        const nodes = p.nodes || [], x2 = (p.to == null ? 0.9 : p.to) * W, n = nodes.length, gap = n > 1 ? (x2 - x) / (n - 1) : 0, nw = Math.min(250, gap * 0.72 || 250) * s, nh = 96 * s
        nodes.forEach((nd, i) => {
          if (i + 1 < n) {
            const lg = el('g', { class: 'pop', style: `--d:${(p.d || 0.2) + 0.5 * i + 0.35}s` }, g), a = x + gap * i + nw / 2, b = x + gap * (i + 1) - nw / 2, broken = p.broken === i, c = broken ? '#b91c1c' : '#374151'
            const mid = (a + b) / 2
            draw(lg, rc.ellipse(mid - 20 * s, y, 56 * s, 30 * s, ink({ stroke: c, strokeWidth: 4 })))
            if (!broken) draw(lg, rc.ellipse(mid + 20 * s, y, 56 * s, 30 * s, ink({ stroke: c, strokeWidth: 4 })))
            else { draw(lg, rc.ellipse(mid + 36 * s, y + 18 * s, 56 * s, 30 * s, ink({ stroke: c, strokeWidth: 4 }))); draw(lg, rc.line(mid - 16 * s, y - 26 * s, mid + 16 * s, y + 26 * s, { stroke: c, strokeWidth: 6 })) }
            draw(lg, rc.line(a, y, mid - 48 * s, y, ink({ stroke: c, strokeWidth: 3, strokeLineDash: broken ? [10, 8] : undefined })))
            draw(lg, rc.line(mid + 48 * s, y, b, y, ink({ stroke: c, strokeWidth: 3, strokeLineDash: broken ? [10, 8] : undefined })))
            if (p.links && p.links[i]) textBlock(lg, wrap(p.links[i], 14), mid, y - 34 * s, 20 * s, { anchor: 'middle', fill: c })
          }
          const cx = x + gap * i, ng = el('g', { class: 'pop', style: `--d:${(p.d || 0.2) + 0.5 * i}s` }, g)
          draw(ng, rc.rectangle(cx - nw / 2, y - nh / 2, nw, nh, ink({ fill: nd.colour || '#fff', fillStyle: 'solid', strokeWidth: 2.6 })))
          textBlock(ng, wrap(nd.label, 16).slice(0, 2), cx, y - (nd.sub ? 10 : -6) * s, 22 * s, { anchor: 'middle', weight: 'bold' })
          if (nd.sub) textBlock(ng, [nd.sub], cx, y + 26 * s, 16 * s, { anchor: 'middle', font: 'ui-monospace, Menlo, monospace', fill: '#4b5563' })
        })
        label(g, p.label, (x + x2) / 2, y + 100 * s, 24 * s, { max: 50 })
      },
      policy(g, rc, x, y, s, p) {
        const w = 300 * s, h = 360 * s, x0 = x - w / 2, y0 = y - h
        draw(g, rc.rectangle(x0, y0 + 20 * s, w, h - 40 * s, ink({ fill: '#fffbeb', fillStyle: 'solid' })))
        draw(g, rc.ellipse(x, y0 + 20 * s, w + 24 * s, 40 * s, ink({ fill: '#fde68a', fillStyle: 'solid' })))
        draw(g, rc.ellipse(x, y - 20 * s, w + 24 * s, 40 * s, ink({ fill: '#fde68a', fillStyle: 'solid' })))
        textBlock(g, [p.title || 'policy.md'], x0 + 20 * s, y0 + 76 * s, 22 * s, { weight: 'bold', font: 'ui-monospace, Menlo, monospace' })
        textBlock(g, (p.lines || []).slice(0, 5).map(l => '· ' + l), x0 + 20 * s, y0 + 114 * s, 19 * s, { lh: 1.4 })
        if (p.hash) textBlock(g, [p.hash], x, y - 52 * s, 17 * s, { anchor: 'middle', font: 'ui-monospace, Menlo, monospace', fill: '#92400e' })
        if (p.signed) { draw(g, rc.circle(x0 + w - 36 * s, y - 90 * s, 54 * s, ink({ fill: '#b91c1c', fillStyle: 'solid' }))); textBlock(g, ['✓'], x0 + w - 36 * s, y - 82 * s, 24 * s, { anchor: 'middle', fill: '#fff' }) }
        label(g, p.label, x, y + 34 * s, 22 * s)
      },
      lane(g, rc, x, y, s, p) {
        const w = 280 * s, h = 220 * s, x0 = x - w / 2, y0 = y - h - 120 * s
        draw(g, rc.line(x, y0 + h, x, y, ink({ strokeWidth: 8 })))
        draw(g, rc.rectangle(x0, y0, w, h, ink({ fill: '#0f766e', fillStyle: 'hachure', hachureGap: 7, strokeWidth: 3 })))
        draw(g, rc.rectangle(x0 + 40 * s, y0 + 40 * s, w - 80 * s, 18 * s, ink({ fill: '#111827', fillStyle: 'solid' })))
        draw(g, rc.line(x0 + w, y0 + 30 * s, x0 + w + 40 * s, y0 + 30 * s, ink({ strokeWidth: 4 })))
        draw(g, rc.rectangle(x0 + w + 24 * s, y0 + 30 * s, 36 * s, 26 * s, ink({ fill: '#b91c1c', fillStyle: 'solid' })))
        for (let i = 0; i < Math.min(p.count || 0, 4); i++) draw(g, rc.rectangle(x0 + (30 + i * 52) * s, y0 + (110 + (i % 2) * 14) * s, 46 * s, 30 * s, ink({ fill: '#fef3c7', fillStyle: 'solid', strokeWidth: 1.6 })))
        label(g, p.label || 'append lane', x, y + 34 * s, 22 * s, { max: 24 })
      },
      stop(g, rc, x, y, s, p) {
        const r = 110 * s, cy = y - 300 * s, pts = []
        for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; pts.push([x + Math.cos(a) * r, cy + Math.sin(a) * r]) }
        draw(g, rc.line(x, cy + r, x, y, ink({ strokeWidth: 8 })))
        draw(g, rc.polygon(pts, ink({ fill: '#b91c1c', fillStyle: 'solid', strokeWidth: 3 })))
        textBlock(g, [p.text || 'REFUSE'], x, cy + 12 * s, (p.text || 'REFUSE').length > 6 ? 30 * s : 38 * s, { anchor: 'middle', fill: '#fff', weight: 'bold' })
        label(g, p.label, x, y + 34 * s, 22 * s, { max: 30 })
      },
      pin(g, rc, x, y, s, p) {
        const w = 330 * s, h = 120 * s, y0 = y - h
        draw(g, rc.rectangle(x - w / 2, y0, w, h, ink({ fill: '#ecfccb', fillStyle: 'solid' })))
        draw(g, rc.circle(x, y0 - 6 * s, 34 * s, ink({ fill: '#dc2626', fillStyle: 'solid' })))
        draw(g, rc.line(x, y0 + 10 * s, x, y0 + 30 * s, ink({ strokeWidth: 3 })))
        textBlock(g, ['pinned root'], x, y0 + 52 * s, 20 * s, { anchor: 'middle', weight: 'bold' })
        textBlock(g, [p.text || 'sha256:…'], x, y0 + 88 * s, 19 * s, { anchor: 'middle', font: 'ui-monospace, Menlo, monospace' })
        label(g, p.label, x, y + 34 * s, 22 * s, { max: 26 })
      },
      hourglass(g, rc, x, y, s, p) {
        s *= K; const w = 90 * s, h = 150 * s, y0 = y - h
        draw(g, rc.line(x - w / 2 - 8 * s, y0, x + w / 2 + 8 * s, y0, ink({ strokeWidth: 6 })))
        draw(g, rc.line(x - w / 2 - 8 * s, y, x + w / 2 + 8 * s, y, ink({ strokeWidth: 6 })))
        draw(g, rc.path(`M${x - w / 2},${y0} L${x + w / 2},${y0} L${x + 6 * s},${y0 + h / 2} L${x + w / 2},${y} L${x - w / 2},${y} L${x - 6 * s},${y0 + h / 2} Z`, ink({ fill: '#fde68a', fillStyle: 'hachure', hachureGap: 5 })))
        label(g, p.label, x, y + 34 * s, 20 * s, { max: 18 })
      },
      file(g, rc, x, y, s, p) {
        s *= K * 0.8; const w = 200 * s, h = 250 * s, x0 = x - w / 2, y0 = y - h
        draw(g, rc.path(`M${x0},${y0} L${x0 + w - 44 * s},${y0} L${x0 + w},${y0 + 44 * s} L${x0 + w},${y} L${x0},${y} Z`, ink({ fill: '#fff', fillStyle: 'solid' })))
        draw(g, rc.path(`M${x0 + w - 44 * s},${y0} L${x0 + w - 44 * s},${y0 + 44 * s} L${x0 + w},${y0 + 44 * s}`, ink({ strokeWidth: 2 })))
        if (p.qr) qrModules(g, rc, x - 60 * s, y0 + 60 * s, 120 * s, hash(p.name))
        else for (let i = 0; i < 5; i++) draw(g, rc.line(x0 + 20 * s, y0 + (70 + i * 30) * s, x0 + w - 30 * s, y0 + (70 + i * 30) * s, ink({ stroke: '#9ca3af', strokeWidth: 2 })))
        textBlock(g, [p.name || 'file'], x, y + 30 * s, 17 * s, { anchor: 'middle', font: 'ui-monospace, Menlo, monospace' })
        label(g, p.label, x, y + 62 * s, 20 * s)
      },
      note(g, rc, x, y, s, p) {
        const w = (p.w || 340) * s, lines = (p.lines || []).flatMap(l => wrap(l, Math.floor(w / (12 * s)))), h = lines.length * 30 * s + 40 * s, y0 = y - h
        const ng = el('g', { transform: `rotate(${p.tilt == null ? -2 : p.tilt} ${x} ${y0 + h / 2})` }, g)
        draw(ng, rc.rectangle(x - w / 2, y0, w, h, ink({ fill: p.colour || '#fef9c3', fillStyle: 'solid', strokeWidth: 2 })))
        textBlock(ng, lines, x - w / 2 + 16 * s, y0 + 36 * s, 22 * s, { lh: 1.3 })
      },
    });
  };
})();
