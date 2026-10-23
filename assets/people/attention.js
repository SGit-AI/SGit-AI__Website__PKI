/**
 * attention.js: what needs you, worked out from the register and your vault, one line and one action each.
 *
 *   todo(dir) -> [{ level: 'bad'|'warn'|'info', text, sub, action: { label, href } | { label, copy } }]
 *   todoPanel(items, { compact })   the list; "Nothing needs you." when empty
 *
 * What it looks for, for every key in your vault:
 *   - an agent in the register that says you operate it, with no "operates" link from you      → Confirm
 *   - an agent you operate whose confirmation ends within a week, or has ended                → Renew
 *   - statements you signed that are not in the register yet (and agents you confirmed)       → Copy for the register
 *   - someone who linked to you, without your link back                                        → Review
 *   - (an anchor) people you verified, due again within 30 days                                → Verify again
 *   - messages waiting in your inbox                                                           → Open
 *   - vault keys you kept that you have not passed on                                         → Show
 *
 * @module attention
 */
import { h, vault, pageUrl, copyButton, D, K, A } from './ui.js'
import { keyish } from './exchange.js'

export const PENDING = 'pki.agent.pending'
export function pendingAgent(sub) { try { if (sub) sessionStorage.setItem(PENDING, JSON.stringify(sub)); else sessionStorage.removeItem(PENDING) } catch (e) { /* fine */ } }
export const readPending = () => { try { return JSON.parse(sessionStorage.getItem(PENDING) || 'null') } catch (e) { return null } }

const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const vaultUrl = hash => pageUrl('vault/index.html') + hash

export async function todo(dir) {
    if (!vault.open || !vault.ids.length) return []
    const items = [], mine = vault.ids.map(i => i.bundle.signing_fingerprint), mineSet = new Set(mine)
    const g = dir ? dir.graph : null
    const local = new Map()                               // fp -> { sts, rec }: what your vault holds, published or not
    for (const fp of mine) { const sts = await vault.statements(fp).catch(() => []); local.set(fp, { sts, rec: await D.readRecord(sts) }) }
    const myLinksTo = to => mine.flatMap(fp => (local.get(fp).rec.links || []).filter(l => l.to === to))
    const confirmAction = r => ({ label: 'Confirm', run: () => { pendingAgent(D.submission(r.statements.map(e => e.st))); location.href = vaultUrl('#agents') } })

    if (dir) {
        // 1. agents naming you as operator, not signed back
        for (const r of dir.records) {
            if (!r.ok || r.fixture || r.revoked || r.kind !== 'agent') continue
            const claim = r.links.find(l => l.method === 'operated-by' && mineSet.has(l.to))
            if (!claim || myLinksTo(r.fp).some(l => l.method === 'operates')) continue
            items.push({ level: 'bad', text: `${r.name} says you operate it. Not confirmed.`, sub: r.fp, action: confirmAction(r) })
        }
        // 2. confirmations ending within a week, or ended
        const soon = day(7)
        for (const [map, ended] of [[g.operated, false], [g.lapsed, true]]) for (const [fp, v] of map) {
            if (!mineSet.has(v.by) || v.until > soon) continue
            if (myLinksTo(fp).some(l => l.method === 'operates' && D.validUntil(l) > soon)) continue      // renewed, not yet published: item 3
            const r = dir.byFp.get(fp); if (!r) continue
            items.push({ level: ended ? 'bad' : 'warn', text: `${r.name}: confirmation ${ended ? 'ended' : 'ends'} ${v.until}.`, sub: fp, action: { ...confirmAction(r), label: 'Renew' } })
        }
        // 5. people who linked to you, waiting for your link back
        for (const r of dir.records) {
            if (!r.ok || r.fixture || r.revoked || mineSet.has(r.fp)) continue
            const l = r.links.find(x => mineSet.has(x.to) && x.method !== 'operated-by')
            if (!l || myLinksTo(r.fp).length) continue
            items.push({ level: 'warn', text: `${r.name} linked to you.`, sub: r.fp, action: { label: 'Review', href: vaultUrl('#links') } })
        }
        // 6. verifications due (an anchor's)
        if (g) for (const [fp, v] of [...g.verified, ...(g.expired || new Map())]) {
            if (!mineSet.has(v.by) || v.until > day(30) || !dir.index.anchors.includes(v.by)) continue
            items.push({ level: v.until < g.asOf ? 'bad' : 'warn', text: `${D.nameOf(g, fp)}: verification ${v.until < g.asOf ? 'ended' : 'ends'} ${v.until}.`, sub: fp, action: { label: 'Verify again', href: vaultUrl('#link=' + K.dirOf(fp)) } })
        }
    }
    // 3. signed, not in the register
    const subs = [], unsentCount = { n: 0 }
    for (const fp of mine) {
        const { sts } = local.get(fp); if (!sts.length) continue
        const reg = dir && dir.byFp.get(fp), regIds = new Set(reg ? reg.statements.map(e => e.id) : [])
        const ids = await Promise.all(sts.map(s => K.statementId(s)))
        const n = ids.filter(id => !regIds.has(id)).length
        if (n) { unsentCount.n += n; subs.push(D.submission(sts)) }
    }
    const agentsKept = await vault.agents().catch(() => [])
    for (const a of agentsKept) if (a.confirmed && !(dir && dir.byFp.has(a.record))) subs.push({ kind: a.kind, record: a.record, statements: a.statements })
    if (subs.length) items.push({ level: 'warn', text: `${unsentCount.n || 'Some'} signed statement${unsentCount.n === 1 ? '' : 's'} not in the register yet.`, sub: 'Give the file to the site’s agent; it checks every signature and publishes.', action: { label: 'Copy for the register', copy: JSON.stringify(D.submissions(subs), null, 1) } })
    // 4. agents kept in your book, never confirmed, not in the register
    for (const a of agentsKept) if (!a.confirmed && !(dir && dir.byFp.has(a.record))) {
        const name = (a.statements && a.statements[0] && a.statements[0].body.name) || a.record
        items.push({ level: 'info', text: `${name} is not in the register.`, sub: a.record, action: { label: 'Review', run: () => { pendingAgent(a); location.href = vaultUrl('#agents') } } })
    }
    if (vault.mode === 'vault') {
        // 7. the inbox
        if (vault.inbox) { try { const w = await A.waiting(vault.inbox); if (w.length) items.push({ level: 'warn', text: `${w.length} new message${w.length === 1 ? '' : 's'} in your inbox.`, action: { label: 'Open', href: vaultUrl('#messages') } }) } catch (e) { /* offline: say nothing */ } }
        // 8. vault keys kept, not passed on
        try {
            const kept = await A.book.messages(vault.book, 'in'), sent = await A.book.messages(vault.book, 'out')
            const passed = new Set(sent.map(m => m.handed).filter(Boolean))
            const held = kept.flatMap(k => ((k.msg && k.msg.files) || []).filter(f => keyish(f) && !passed.has(f.name)))
            if (held.length) items.push({ level: 'info', text: `${held.length} vault key${held.length === 1 ? '' : 's'} kept, not passed on.`, sub: held.map(f => f.name).join(', '), action: { label: 'Show', href: vaultUrl('#messages') } })
        } catch (e) { /* no book */ }
    }
    const rank = { bad: 0, warn: 1, info: 2 }
    return items.sort((a, b) => rank[a.level] - rank[b.level])
}

export function todoPanel(items, { compact = false } = {}) {
    const box = h('section', { class: 'todo-panel' + (compact ? ' compact' : ''), id: 'todo' })
    if (!items.length) { box.append(h('p', { class: 'ok todo-none' }, '✓ Nothing needs you.')); return box }
    const rows = items.map(it => {
        const a = it.action
        const btn = !a ? null : a.copy ? copyButton(a.copy, a.label) : a.href ? h('a', { class: 'btn small primary', href: a.href }, a.label) : h('button', { type: 'button', class: 'btn small primary', onclick: a.run }, a.label)
        if (btn) btn.classList.add('small')
        return h('li', { class: 'lv-' + it.level }, h('span', { class: 'dot', 'aria-hidden': 'true' }),
            h('div', { class: 'grow' }, h('b', {}, it.text), it.sub ? h('div', { class: 'dim small' + (/^sha256:/.test(it.sub) ? ' mono' : '') }, it.sub) : null), btn)
    })
    const list = h('ul', { class: 'todo' }, ...rows)
    box.append(h('h2', {}, `To do `, h('span', { class: 'count' }, String(items.length))), list)
    return box
}
