/* invite/index.html: an invitation as a QR code with the URL printed above it. Signed with your key, naming nobody:
   the person who scans it makes their own key, and their first link, to you, waits for you to link back. */
import { h, msg, err, loadDirectory, pageUrl, copyButton, busy, vaultBar, vault, qr, A } from '../ui.js'
import * as M from '../message.js'

const app = document.getElementById('app')
vaultBar(document.getElementById('vault-bar-mount'))
const dir = await loadDirectory().catch(() => null)

async function draw() {
    if (!vault.open || !vault.me) return app.replaceChildren(msg('warn', 'Open your vault above, with a key in it: the invitation is signed with your key, so whoever scans it can see it is from you.'))
    const me = vault.me, inReg = dir && dir.byFp.get(me.bundle.signing_fingerprint)
    const name = h('input', { class: 't', placeholder: 'their name, as a hint on their page (optional)', maxlength: 80 })
    const days = h('select', { class: 't' }, ...[7, 30, 90].map(d => h('option', { value: d, selected: d === 30 }, `${d} days`)))
    const withKey = h('input', { type: 'checkbox' })
    const go = h('button', { type: 'button', class: 'btn primary', id: 'invite-go' }, 'Make the invitation')
    const out = h('div', { id: 'invite-out' })
    go.addEventListener('click', () => busy(go, async () => {
        try {
            const inv = await M.invite(me, { days: Number(days.value), name: name.value.trim(), accessKey: withKey.checked ? vault.token : '' })
            out.replaceChildren(h('div', { class: 'qr' }, await qr(inv.url), h('div', { class: 'url' },
                h('p', { class: 'small' }, 'Show the QR code, or send the link. They scan it, make a passkey and a key, and their first link points at you; it shows on your Links tab, waiting for you to link back.'),
                h('span', { class: 'mono' }, inv.url), h('div', { class: 'acts' }, copyButton(inv.url, 'Copy the link'), h('button', { type: 'button', class: 'btn', onclick: () => window.print() }, 'Print')),
                withKey.checked ? msg('warn', 'This link carries your access key: whoever has the link can create vaults on it. Send it only to the person, and make a new one if it goes astray.') : null)))
            if (vault.mode === 'vault') await A.book.saveInvite(vault.book, { nonce: M.parseInvite(inv.url).nonce, made: new Date().toISOString(), name: name.value.trim(), days: Number(days.value), carries_access_key: withKey.checked })
        } catch (e) { out.replaceChildren(msg('bad', err(e))) }
    }))
    app.replaceChildren(
        !inReg ? msg('warn', 'Your key is not in the register yet, so the person you invite will see a fingerprint rather than your name. Send your record first (Your vault → Your record).') : null,
        h('label', { class: 'f' }, 'Who it is for'), name,
        h('label', { class: 'f' }, 'Valid for'), days,
        vault.token ? h('label', { class: 'small', style: 'display:block;margin-top:.7rem' }, withKey, ' include my SG/Send access key, so they can create their vault without one of their own') : null,
        h('div', { class: 'acts' }, go), out)
    if (vault.mode === 'vault') {
        const made = await A.book.invites(vault.book).catch(() => [])
        if (made.length) app.append(h('h2', {}, 'Invitations you made'), h('table', { class: 'kv' }, h('tbody', {}, ...made.map(i => h('tr', {}, h('th', {}, i.name || '(no name)'), h('td', { class: 'small' }, `${String(i.made).slice(0, 10)} · ${i.days} days${i.carries_access_key ? ' · carried your access key' : ''}`))))))
    }
}
vault.onChange(() => draw())
draw()
