/* people/person.html#sha256-<16 hex>: one person's record, every statement checked here, and what follows from it. */
import { h, msg, err, loadDirectory, standingPill, pageUrl, copyButton, download, vault, D, K } from '../ui.js'

const app = document.getElementById('app')
async function draw() {
    const dir = await loadDirectory()
    const fp = K.fpOfDir(location.hash.slice(1))
    const r = dir.byFp.get(fp)
    if (!r) return app.replaceChildren(msg('warn', `No record for ${fp || 'this address'} in the register.`), h('p', {}, h('a', { href: pageUrl('people/index.html') }, '← the register')))
    const g = r.fixture ? dir.fixturesGraph : dir.graph
    document.title = `${r.name} · pki.sgit.ai`
    const s = D.standing(g, fp)
    const mine = vault.open && vault.ids.some(i => i.bundle.signing_fingerprint === fp)
    const myFp = vault.open && vault.me ? vault.me.bundle.signing_fingerprint : null
    const pathFromMe = myFp && myFp !== fp ? D.path(g, myFp, fp) : null
    const confirmed = g.edges.filter(([a, b]) => a === fp || b === fp).map(([a, b, l]) => ({ other: a === fp ? b : a, mine: a === fp ? l.ab : l.ba, theirs: a === fp ? l.ba : l.ab }))
    const outClaims = g.claims.filter(c => c.from === fp), inClaims = g.claims.filter(c => c.to === fp)
    const nm = x => h('a', { href: pageUrl('people/person.html') + '#' + K.dirOf(x) }, D.nameOf(g, x))
    app.replaceChildren(
        h('h1', {}, r.name || '(no name)'),
        h('p', {}, r.kind === 'agent' ? [h('span', { class: 'pill agent' }, 'agent'), ' '] : null, standingPill(g, fp, r), ' ', r.fixture ? h('span', { class: 'pill fixture' }, 'fixture: its private keys are published, it proves nothing') : null, ' ', h('span', { class: 'dim small' }, s.text)),
        r.identity.body.about ? h('p', { class: 'lead' }, r.identity.body.about) : null,
        r.problems.length ? msg('bad', h('b', {}, 'This record does not read cleanly: '), r.problems.join('; ')) : msg('ok', `Every one of the ${r.statements.length} statements was checked here, in your browser, against this key.`),
        h('div', { class: 'acts' },
            h('a', { class: 'btn primary', href: pageUrl('send/index.html') + '#to=' + r.dir }, 'Send them a message'),
            h('button', { type: 'button', class: 'btn', onclick: () => download(`${(r.identity.body.bundle.label || r.name).replace(/[^A-Za-z0-9_-]+/g, '-')}.json`, JSON.stringify(r.bundle, null, 2)) }, 'Their key, for sgit pki import'),
            copyButton(r.fp, 'Copy fingerprint'),
            vault.open && !mine ? h('button', { type: 'button', class: 'btn', onclick: async e => { e.target.disabled = true; await vault.saveContact({ name: r.name, bundle: r.bundle, from: 'register' }); e.target.textContent = 'In your contacts' } }, 'Add to my contacts') : null,
            vault.open && !mine && vault.me ? h('a', { class: 'btn', href: pageUrl('vault/index.html') + '#link=' + r.dir }, 'I know them: link') : null),
        pathFromMe ? h('p', { class: 'small' }, 'From you: ', ...pathFromMe.map((x, i) => [i ? ' → ' : '', nm(x)]), ` (${pathFromMe.length - 1} step${pathFromMe.length === 2 ? '' : 's'})`) : null,
        h('h2', {}, 'The key'),
        h('table', { class: 'kv' }, h('tbody', {},
            h('tr', {}, h('th', {}, 'Record (signing key)'), h('td', { class: 'mono' }, r.fp)),
            h('tr', {}, h('th', {}, 'Encryption key'), h('td', { class: 'mono' }, r.bundle.fingerprint, h('span', { class: 'dim' }, ' · RSA-OAEP 4096'))),
            h('tr', {}, h('th', {}, 'Label'), h('td', {}, r.bundle.label || '')),
            r.kind === 'agent' ? h('tr', {}, h('th', {}, 'Runs on'), h('td', {}, r.identity.body.runtime || '(not said)', r.identity.body.session ? ' · a session key: it lives as long as one session' : '')) : null,
            r.kind === 'agent' && s.chain ? h('tr', {}, h('th', {}, 'Operated by'), h('td', {}, ...s.chain.map((x, i) => [i ? ', operated by ' : '', nm(x)]), ` · until ${s.until}`)) : null,
            h('tr', {}, h('th', {}, 'In the register since'), h('td', {}, r.identity.created_at)),
            h('tr', {}, h('th', {}, 'Inbox'), h('td', {}, r.inbox ? 'yes: anyone can write to them, sealed to this key, with no account' : 'none: a message to them travels as a link or a QR code')),
            r.revoked ? h('tr', {}, h('th', {}, 'Revoked'), h('td', { class: 'bad' }, `${r.revoked.at} (${r.revoked.reason})`)) : null)),
        h('h2', {}, 'Evidence'),
        r.evidence.length ? h('table', { class: 'kv' }, h('tbody', {}, ...r.evidence.map(e => h('tr', {}, h('th', {}, D.EVIDENCE[e.kind].label), h('td', {}, e.url ? h('a', { href: e.url, rel: 'noopener nofollow', target: '_blank' }, e.value) : e.value, D.EVIDENCE[e.kind].machine ? h('span', { class: 'dim small' }, ` · should contain ${D.proofLine(fp)}`) : h('span', { class: 'dim small' }, ' · a person checks this one')))))) : h('p', { class: 'dim' }, 'None yet.'),
        h('h2', {}, 'Links'),
        confirmed.length ? h('table', { class: 'kv' }, h('tbody', {}, ...confirmed.map(c => h('tr', {}, h('th', {}, nm(c.other)), h('td', {}, 'both ways', c.mine.method ? ` · they say: ${D.METHODS[c.mine.method]}` : '', c.theirs.method ? ` · ${D.nameOf(g, c.other)} says: ${D.METHODS[c.theirs.method]}${c.theirs.on ? ', ' + c.theirs.on : ''}` : ''))))) : h('p', { class: 'dim' }, 'No confirmed links.'),
        outClaims.length ? h('p', { class: 'small' }, h('b', {}, 'Claims they made that nobody confirmed: '), ...outClaims.map((c, i) => [i ? ', ' : '', g.people.has(c.to) ? nm(c.to) : c.to])) : null,
        inClaims.length ? h('p', { class: 'small' }, h('b', {}, 'Claims about them they have not confirmed: '), ...inClaims.map((c, i) => [i ? ', ' : '', nm(c.from)]), h('span', { class: 'dim' }, '. These add nothing to their standing, and they are in the claimants’ records, not in theirs.')) : null,
        h('h2', {}, 'The statements'),
        h('p', { class: 'dim small' }, 'Each is a file in ', h('a', { href: `https://github.com/SGit-AI/SGit-AI__Website__PKI/tree/dev/directory/records/${r.dir}` }, `directory/records/${r.dir}/`), ', signed with this key and checked here.'),
        h('table', { class: 'kv' }, h('tbody', {}, ...r.statements.map(e => h('tr', {}, h('th', {}, e.st.type), h('td', {}, h('span', { class: e.live ? '' : 'dim' }, e.st.created_at, e.live ? '' : ' · withdrawn'), h('div', { class: 'mono dim' }, e.id)))))))
}
window.addEventListener('hashchange', () => draw().catch(e => app.replaceChildren(msg('bad', err(e)))))
vault.onChange(() => draw().catch(() => {}))
vault.resume().finally(() => draw().catch(e => app.replaceChildren(msg('bad', err(e)))))
