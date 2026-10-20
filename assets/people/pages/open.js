/* m/index.html#m1.…: open a message sent as a link or a QR code. The envelope is in the fragment, which the browser
   never sends to a server; it is rebuilt here as sgit's .enc text and opened with a key from your vault. A fixture's
   message can be opened with the fixture's published key, to see the whole thing work before you have a key. */
import { h, msg, err, loadDirectory, pageUrl, busy, vaultBar, vault, download, ROOT, K, A } from '../ui.js'
import * as M from '../message.js'
import { messageCard } from '../cards.js'

const app = document.getElementById('app')
const bar = vaultBar(document.getElementById('vault-bar-mount'))
const dir = await loadDirectory().catch(() => null)

/** An access key handed over: keep it in the open vault, or offer it to the form that creates one. */
function grantButton(g) {
    if (vault.mode === 'vault') {
        const b = h('button', { type: 'button', class: 'btn primary', id: 'grant-keep' }, vault.token === g.token ? 'Already your access key' : 'Keep it as my access key')
        if (vault.token === g.token) b.disabled = true
        b.addEventListener('click', () => busy(b, async () => { await A.setToken(vault.master, g.token); vault.token = g.token; if (vault.sg) vault.sg.token = g.token; b.replaceWith(h('span', { class: 'ok' }, 'Kept in your master vault: every device of yours has it now.')) }))
        return b
    }
    const b = h('button', { type: 'button', class: 'btn primary', id: 'grant-use' }, 'Create my vault with it')
    b.addEventListener('click', () => { bar.setAccessKey(g.token); window.scrollTo(0, 0); b.replaceWith(h('span', { class: 'ok' }, vault.mode === 'browser' ? 'Ready: press “Move into a vault” above, make or use a passkey, and the key goes in with your keys.' : 'Ready: press “Open with my passkey” above; the first time, the form to create your vault has the key in it.')) })
    return b
}

async function draw() {
    const code = M.parseCode(location.hash)
    if (!code) {
        const paste = h('textarea', { class: 't code', placeholder: 'https://pki.sgit.ai/m/#m1.… or m1.…' })
        return app.replaceChildren(h('p', {}, 'Nothing to open in this address. Paste a message link:'), paste, h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => { const c = M.parseCode(paste.value); if (c) { location.hash = c.code } } }, 'Open')))
    }
    const toRec = dir && dir.byFp.get(code.to), fromRec = code.signer && dir && [...dir.byFp.values()].find(r => r.bundle && r.bundle.signing_fingerprint === code.signer)
    const head = [h('p', {}, 'A sealed message for ', h('b', {}, toRec ? toRec.name : code.to), toRec ? h('span', { class: 'mono dim' }, ` (${code.to})`) : '', code.signer ? ['; the envelope says it was signed by ', h('b', {}, fromRec ? fromRec.name : code.signer)] : '; unsigned', '.')]
    const known = dir ? new Map([...dir.byFp].map(([k, r]) => [k, r.bundle])) : new Map()
    if (vault.open) for (const c of await vault.contacts().catch(() => [])) known.set(c.bundle.signing_fingerprint, c.bundle)
    const nameOf = f => (dir && dir.byFp.get(f) && dir.byFp.get(f).name) || f
    const result = h('div', { id: 'open-result' })
    const tryOpen = async (ids, label) => {
        try {
            const o = await M.openMessage(code.enc, ids, known)
            const acts = []
            if (vault.mode === 'vault' && !(toRec && toRec.fixture)) {
                const keep = h('button', { type: 'button', class: 'btn primary' }, 'Keep it in my book')
                keep.addEventListener('click', () => busy(keep, async () => { await A.book.saveMessage(vault.book, 'in', { id: code.code.slice(-24), at: o.msg.at, msg: o.msg, verified: o.verified }); keep.replaceWith(h('span', { class: 'ok' }, 'kept')) }))
                acts.push(keep)
            }
            if (o.msg.grant && o.msg.grant.token) acts.unshift(grantButton(o.msg.grant))
            if (o.msg.from) acts.push(h('a', { class: 'btn', href: pageUrl('send/index.html') + '#to=' + K.dirOf(o.msg.from) }, 'Reply'))
            acts.push(h('button', { type: 'button', class: 'btn', onclick: () => download('message.txt.enc', code.enc, 'text/plain') }, 'Download as .enc'))
            result.replaceChildren(msg('ok', `Opened with ${label}.`), o.problems.length ? msg('warn', o.problems.join('; ')) : null, messageCard(o.msg, o.verified, nameOf, acts))
        } catch (e) { result.replaceChildren(msg('bad', /not sealed|no key/.test(err(e)) ? `None of ${label === 'your keys' ? 'your keys' : label} opens it: it was sealed to ${code.to}.` : err(e))) }
    }
    const acts = h('div', { class: 'acts' })
    if (vault.open && vault.ids.length) acts.append(h('button', { type: 'button', class: 'btn primary', id: 'open-mine', onclick: e => busy(e.target, () => tryOpen(vault.ids, 'your keys')) }, 'Open it with my keys'))
    else head.push(h('p', { class: 'small' }, vault.open ? 'Your vault holds no key yet.' : 'Open your vault above with your passkey; the message opens with the key in it.'))
    if (toRec && toRec.fixture) acts.append(h('button', { type: 'button', class: 'btn', id: 'open-fixture', onclick: e => busy(e.target, async () => {
        const f = await (await fetch(new URL(`directory/fixtures/${toRec.dir}.json`, ROOT))).json()
        await tryOpen([{ bundle: f.bundle, private: { encrypt: K.unb64(f.private.encrypt), sign: K.unb64(f.private.sign) } }], `${toRec.name}’s published fixture key`)
    }) }, `Open it as ${toRec.name} (a fixture)`))
    app.replaceChildren(...head, acts, result)
    if (vault.open && vault.ids.some(i => i.bundle.signing_fingerprint === code.to)) acts.querySelector('#open-mine').click()
}
vault.onChange(() => draw())
window.addEventListener('hashchange', () => draw())
draw().catch(e => app.replaceChildren(msg('bad', err(e))))
