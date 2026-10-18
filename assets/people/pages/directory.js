/* people/index.html: the register of people. Every record is read and its signatures checked here, in this browser,
   from directory/index.json; the counts, the standings and the degrees are computed from the records each time. */
import { h, msg, err, loadDirectory, standingPill, shortFp, pageUrl, D } from '../ui.js'

const app = document.getElementById('app')
const showFix = h('input', { type: 'checkbox', id: 'show-fixtures' })
const search = h('input', { class: 't', type: 'search', placeholder: 'Search by name or fingerprint', id: 'people-search' })

try {
    const dir = await loadDirectory()
    const real = D.realKeys(dir.records)
    const list = h('div', { class: 'people', id: 'people-list' }), graphBox = h('div', { id: 'people-graph' }), claims = h('div')
    app.replaceChildren(
        h('div', { class: 'big' }, h('span', { class: 'n', id: 'real-keys' }, String(real)), h('span', { class: 'l' }, real === 1 ? 'real public key in the register' : 'real public keys in the register', h('br'), h('span', { class: 'small' }, 'the one number to watch; fixtures excluded'))),
        real === 0 ? msg('warn', 'The register holds no real person yet. The first records are the people Dinis Cruz works with, verified by him; until his own key is in, the anchor list is empty and the pages show the fixture graph to say how it works. ', h('a', { href: pageUrl('vault/index.html') }, 'Make your key'), ' · ', h('a', { href: 'mailto:agent@riskmandate.ai' }, 'ask to be one of the first')) : null,
        h('div', { class: 'acts' }, h('label', { class: 'small' }, showFix, ' show the fixture records (made up, their private keys published on purpose)')),
        search, list,
        h('h2', {}, 'The graph, from confirmed links only'),
        h('p', { class: 'dim small' }, 'Rings are degrees of separation from the anchor. A solid line is a link both people wrote; a dashed line is a claim one of them wrote, which counts for nothing until the other links back.'),
        graphBox, claims)
    const draw = () => {
        const g = showFix.checked ? dir.fixturesGraph : dir.graph
        const q = search.value.trim().toLowerCase()
        const recs = dir.records.filter(r => r.fp && (showFix.checked || !r.fixture)).filter(r => !q || r.name.toLowerCase().includes(q) || r.fp.includes(q))
        list.replaceChildren(...(recs.length ? recs.map(r => card(r, g)) : [h('p', { class: 'dim' }, showFix.checked ? 'No record matches.' : 'No real record yet. Tick the box above to see the fixtures.')]))
        graphBox.replaceChildren(drawGraph(g, dir))
        const cl = g.claims.filter(c => c.reason === 'not confirmed')
        claims.replaceChildren(cl.length ? h('p', { class: 'small dim' }, `${cl.length} one-way claim${cl.length === 1 ? '' : 's'} waiting to be confirmed: `, ...cl.map((c, i) => [i ? ', ' : '', `${D.nameOf(g, c.from)} → ${D.nameOf(g, c.to)}`])) : '')
    }
    showFix.addEventListener('change', draw); search.addEventListener('input', draw)
    if (real === 0) showFix.checked = true
    draw()
} catch (e) { app.replaceChildren(msg('bad', 'The register could not be read: ', err(e))) }

function card(r, g) {
    const links = g.edges.filter(([a, b]) => a === r.fp || b === r.fp).length
    return h('a', { class: 'person', href: pageUrl('people/person.html') + '#' + r.dir },
        h('div', {}, standingPill(g, r.fp, r), ' ', r.fixture ? h('span', { class: 'pill fixture' }, 'fixture') : null),
        h('h3', {}, r.name || '(no name)'), h('div', { class: 'fp' }, r.fp),
        h('p', {}, `${r.evidence.length} evidence · ${links} confirmed link${links === 1 ? '' : 's'}${r.inbox ? ' · has an inbox' : ''}`),
        r.problems.length ? h('p', { class: 'bad' }, `${r.problems.length} problem(s): ${r.problems[0]}`) : null)
}

/** Rings by degree from the anchors; nodes not reached go on the outer ring. SVG, no library. */
function drawGraph(g, dir) {
    const people = [...g.people.keys()]
    if (!people.length) return h('p', { class: 'dim' }, 'Nobody in this view yet.')
    const maxDeg = Math.max(0, ...g.degrees.values())
    const ring = fp => g.degrees.has(fp) ? g.degrees.get(fp) : maxDeg + 1
    const byRing = new Map(); for (const fp of people) { const r = ring(fp); if (!byRing.has(r)) byRing.set(r, []); byRing.get(r).push(fp) }
    const W = 640, H = 420, cx = W / 2, cy = H / 2, step = Math.min(cx, cy) / (maxDeg + 2.2), pos = new Map()
    for (const [r, fps] of byRing) fps.forEach((fp, i) => { const a = (i / fps.length) * Math.PI * 2 + r * 0.7; pos.set(fp, r === 0 && fps.length === 1 ? [cx, cy] : [cx + Math.cos(a) * step * (r + (r === 0 ? 0.6 : 0.4)), cy + Math.sin(a) * step * (r + (r === 0 ? 0.6 : 0.4))]) })
    let s = `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="The graph of confirmed links">`
    for (let r = 1; r <= maxDeg + 1; r++) s += `<circle class="ring" cx="${cx}" cy="${cy}" r="${step * (r + 0.4)}"/>`
    for (const c of g.claims) if (pos.has(c.from) && pos.has(c.to)) { const [x1, y1] = pos.get(c.from), [x2, y2] = pos.get(c.to); s += `<line class="claim" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>` }
    for (const [a, b] of g.edges) { const [x1, y1] = pos.get(a), [x2, y2] = pos.get(b); s += `<line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>` }
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    for (const fp of people) {
        const [x, y] = pos.get(fp), st = D.standing(g, fp).level, name = (dir.byFp.get(fp) || {}).name || shortFp(fp)
        s += `<a href="${pageUrl('people/person.html')}#${fp.replace(':', '-')}"><circle class="node ${st}" cx="${x}" cy="${y}" r="8"><title>${esc(name)}: ${esc(D.standing(g, fp).text)}</title></circle><text x="${x + 11}" y="${y + 4}">${esc(name.replace(/^Fixture: /, '').replace(/ \(.*\)$/, ''))}</text></a>`
    }
    const wrap = h('div'); wrap.innerHTML = s + '</svg>'
    return wrap
}
