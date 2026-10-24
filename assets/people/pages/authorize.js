/* authorize/index.html#r=…: sign in elsewhere with your key. A site sends you here with a request (who it is, where
   to answer, the key its browser made, what it asks to do, for how long). You read it, choose soft or strong, and your
   key signs a delegation; you go back to the site with it in the address's fragment, which no server sees. Strong also
   writes a "delegates" link in your record: while it is there the delegation holds, and withdrawing it ends it
   everywhere, with no revocation list (delegation.js). Nothing secret leaves: the delegation is public and narrow. */
import { h, msg, err, busy, vaultBar, vault, loadDirectory, pageUrl, K, D, A } from '../ui.js'
import * as DG from '../delegation.js'

const app = document.getElementById('app')
vaultBar(document.getElementById('vault-bar-mount'))
const b64urlJson = o => K.b64url(K.utf8(JSON.stringify(o)))
const fromB64url = s => JSON.parse(new TextDecoder().decode(K.unb64url(s)))

/** Back to the site that asked, the answer in the fragment. */
function answer(req, response) { const u = new URL(req.return); u.hash = 'pki=' + b64urlJson(response); location.replace(u.href) }

async function draw() {
    const m = /[#&]r=([A-Za-z0-9_-]+)/.exec(location.hash)
    if (!m) return app.replaceChildren(h('p', {}, 'A site sends you here to sign in with your key. There is no request in this address.'), h('p', { class: 'small' }, h('a', { href: pageUrl('sso/index.html') }, 'How a site asks'), '.'))
    let req
    try { req = await DG.parseRequest(fromB64url(m[1])) } catch (e) { return app.replaceChildren(msg('bad', 'This sign-in request is refused: ', err(e)), h('p', { class: 'small' }, 'Nothing was signed. Go back to the site that sent you.')) }
    await vault.settled()
    const host = new URL(req.client).host
    const head = [h('div', { class: 'az-who' }, h('div', { class: 'az-host mono' }, host), h('div', { class: 'dim small' }, req.label ? `“${req.label}” · ` : '', 'asks to sign you in')),]
    if (!vault.open || !vault.ids.length) return app.replaceChildren(h('div', { class: 'vpanel authorize' }, ...head, msg('warn', 'Open your vault above with your passkey: your key signs the answer.')))
    const dir = await loadDirectory().catch(() => null)
    const ids = vault.ids, def = vault.me
    const as = h('select', { class: 't', id: 'az-as' }, ...ids.map(i => h('option', { value: i.bundle.signing_fingerprint, selected: i === def }, `${i.bundle.label || 'a key'} · ${i.bundle.signing_fingerprint}`)))
    const forceLive = req.can.includes('delegate')
    const soft = h('input', { type: 'radio', name: 'az-mode', id: 'az-soft', value: 'soft', checked: !forceLive, disabled: forceLive })
    const strong = h('input', { type: 'radio', name: 'az-mode', id: 'az-strong', value: 'strong', checked: forceLive })
    const allow = h('button', { type: 'button', class: 'btn primary', id: 'az-allow' }, `Allow ${host}`)
    const deny = h('button', { type: 'button', class: 'btn', id: 'az-deny' }, 'Deny')
    const out = h('div')
    deny.addEventListener('click', () => answer(req, { v: 1, kind: DG.DENIED, nonce: req.nonce }))
    allow.addEventListener('click', () => busy(allow, async () => {
        try {
            const issuer = ids.find(i => i.bundle.signing_fingerprint === as.value)
            const rec = dir && dir.byFp.get(issuer.bundle.signing_fingerprint)
            const live = strong.checked
            const d = await DG.makeDelegation(issuer, req, { live, name: (rec && rec.name) || issuer.bundle.label })
            const id = await DG.delegationId(d)
            if (live) await vault.addStatement(await D.linkStatement(issuer, { to: d.to, method: 'delegates', on: d.from, until: d.until, delegation: id, can: d.can }))
            if (vault.mode === 'vault') await A.book.saveMessage(vault.book, 'out', { to: d.to, to_name: host, at: new Date().toISOString(), subject: `Signed in to ${host}`, how: live ? 'sign-in (strong)' : 'sign-in (soft)', delegation: id, aud: d.aud, can: d.can, until: d.until }).catch(() => {})
            answer(req, { v: 1, kind: DG.AUTHORIZED, nonce: req.nonce, delegation: d,
                identity: { fp: d.iss, name: d.iss_name, id: `https://pki.sgit.ai/id/${K.dirOf(d.iss)}.json` } })
        } catch (e) { out.replaceChildren(msg('bad', err(e))) }
    }))
    app.replaceChildren(h('div', { class: 'vpanel authorize', id: 'az-card' }, ...head,
        h('p', {}, 'It asks to:'),
        h('ul', { class: 'az-can' }, ...req.can.map(c => h('li', {}, DG.CAN_TEXT(c)))),
        h('table', { class: 'kv small' }, h('tbody', {},
            h('tr', {}, h('th', {}, 'For'), h('td', {}, `${req.days} day${req.days === 1 ? '' : 's'}, until ${new Date(Date.now() + req.days * 86400000).toISOString().slice(0, 10)}`)),
            h('tr', {}, h('th', {}, 'Its browser’s key'), h('td', { class: 'mono' }, req.bundle.signing_fingerprint)),
            h('tr', {}, h('th', {}, 'The answer goes to'), h('td', { class: 'mono' }, req.return)))),
        ids.length > 1 ? [h('label', { class: 'f', for: 'az-as' }, 'As'), as] : null,
        h('div', { class: 'az-modes' },
            h('label', { class: 'xchg-option', for: 'az-soft' }, soft, h('span', {}, h('b', {}, 'Soft'), ' · works now; holds until the date, and cannot be taken back early')),
            h('label', { class: 'xchg-option', for: 'az-strong' }, strong, h('span', {}, h('b', {}, 'Strong'), ' · only while your record vouches for it: withdraw it and it stops, everywhere. Takes effect when your record is published (To do → Copy for the register)'))),
        h('div', { class: 'acts' }, allow, deny), out,
        h('p', { class: 'dim small' }, 'Your private key stays here. The site gets a signed, public delegation for that browser key, good only at ', h('b', {}, req.client), ', for what is listed.')))
}
window.addEventListener('hashchange', () => draw())
vault.onChange(() => draw())
draw()
