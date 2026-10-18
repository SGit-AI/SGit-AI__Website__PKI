/* join/index.html#i1.…: where an invitation lands. Who invited you (and whether the invitation's signature checks
   against their key in the register), then the steps: a passkey and your vault, your key, your name, and your first
   link, to whoever invited you. Then your record goes to the register. */
import { h, msg, err, loadDirectory, pageUrl, busy, vaultBar, vault, D, K } from '../ui.js'
import * as M from '../message.js'

const app = document.getElementById('app')
const inv = M.parseInvite(location.hash)
vaultBar(document.getElementById('vault-bar-mount'), { accessKey: inv ? inv.accessKey : '' })
const dir = await loadDirectory().catch(() => null)

async function draw() {
    if (!inv) return app.replaceChildren(msg('warn', 'This address carries no invitation. Ask for the link again, or start from '), h('a', { href: pageUrl('vault/index.html') }, 'your vault'))
    const from = dir && dir.byFp.get(inv.from)
    const sig = from ? await inv.verify(from.bundle) : null
    const intro = [h('p', { class: 'lead' }, from ? [h('b', {}, from.name), ' invites you to the register of people and their keys.'] : ['An invitation from the key ', h('span', { class: 'mono' }, inv.from), ', which is not in the register yet.']),
        sig === true ? msg('ok', 'The invitation is signed by their key, and the signature checks.') : sig === false ? msg('bad', 'The invitation’s signature does not check against their key. Do not go on; ask them for a new one.') : msg('warn', 'The inviter is not in the register, so the invitation cannot be checked against their key. Go on only if you know who sent it.'),
        inv.expired ? msg('bad', `This invitation expired on ${inv.expires}. Ask for a new one.`) : h('p', { class: 'dim small' }, `Valid until ${inv.expires}.`)]
    if (sig === false || inv.expired) return app.replaceChildren(...intro)
    const me = vault.open ? vault.me : null
    const mine = me ? await D.readRecord(await vault.statements(me.bundle.signing_fingerprint)) : null
    const hasId = !!(mine && mine.identity), linked = !!(mine && mine.links.some(l => l.to === inv.from))
    const step = !vault.open ? 1 : !me ? 2 : !hasId ? 3 : !linked ? 4 : 5
    const li = (n, ...kids) => h('li', { class: n < step ? 'done' : n === step ? 'now' : '' }, ...kids)
    const steps = h('ol', { class: 'steps' },
        li(1, 'Open your vault with a passkey (above), or keep your key in this browser.', inv.accessKey ? ' The invitation carries an access key, so the vault can be created.' : ''),
        li(2, 'Make your key pair, here in your browser.'), li(3, 'Sign your name.'), li(4, `Link to ${from ? from.name : 'whoever invited you'}.`), li(5, 'Send your record to the register.'))
    const work = h('div', { class: 'vpanel' })
    if (step === 1) {
        const pass = h('input', { class: 't', type: 'password', autocomplete: 'new-password', placeholder: 'a passphrase, at least 10 characters' })
        const go = h('button', { type: 'button', class: 'btn' }, 'Make my key and keep it in this browser')
        go.addEventListener('click', () => busy(go, async () => {
            if (pass.value.length < 10) return work.prepend(msg('warn', 'At least 10 characters.'))
            work.prepend(msg('', 'Making the keys (RSA-4096 takes a few seconds)…'))
            try { await vault.keepInBrowser(await K.generate(inv.name || 'my key'), pass.value) } catch (e) { work.prepend(msg('bad', err(e))) }
        }))
        work.append(h('p', { class: 'small' }, inv.accessKey ? 'Use the bar above: make a passkey, open with it, and your vault is created with the access key your invitation carries.' : 'With an SG/Send access key, use the bar above: make a passkey, open with it, and your vault is created; your keys then follow you to every device.'),
            h('h3', {}, inv.accessKey ? 'Or, without a vault' : 'No access key? Start without a vault'),
            h('p', { class: 'small' }, 'Make your key here and keep it in this browser, its private halves encrypted with a passphrase you choose, in the format sgit uses. Everything else works: your record, your link to whoever invited you, and messages sent to you as links and QR codes. Move it into a vault later, when you have one.'),
            h('label', { class: 'f' }, 'Passphrase'), pass, h('div', { class: 'acts' }, go))
    }
    if (step === 2) {
        const go = h('button', { type: 'button', class: 'btn primary' }, 'Make my key pair')
        go.addEventListener('click', () => busy(go, async () => { work.prepend(msg('', 'Making the keys (RSA-4096 takes a few seconds)…')); try { const id = await K.generate(inv.name || 'my key'); if (vault.mode === 'vault') await vault.addIdentity(id); else throw new Error('keep it from your vault page in this mode') } catch (e) { work.prepend(msg('bad', err(e))) } }))
        work.append(h('p', { class: 'small' }, 'The same keys sgit makes: one pair to receive encrypted messages, one to sign. The private halves go into your master vault and never leave it.'), h('div', { class: 'acts' }, go))
    }
    if (step === 3) {
        const name = h('input', { class: 't', value: inv.name, maxlength: 120, placeholder: 'your name' })
        const go = h('button', { type: 'button', class: 'btn primary' }, 'Sign')
        go.addEventListener('click', () => busy(go, async () => { if (!name.value.trim()) return; await vault.addStatement(await D.identityStatement(me, { name: name.value })); draw() }))
        work.append(h('label', { class: 'f' }, 'The name people will find you by'), name, h('div', { class: 'acts' }, go))
    }
    if (step === 4) {
        const go = h('button', { type: 'button', class: 'btn primary' }, `Yes, I know ${from ? from.name : 'them'}: link`)
        go.addEventListener('click', () => busy(go, async () => { await vault.addStatement(await D.linkStatement(me, { to: inv.from, method: 'invitation' })); draw() }))
        work.append(h('p', { class: 'small' }, 'A statement in your own record: you know the owner of that key. They will link back from their side; the link counts only when both of you have said it.'), h('div', { class: 'acts' }, go))
    }
    if (step === 5) work.append(msg('ok', 'Your record is ready.'), h('div', { class: 'acts' }, h('a', { class: 'btn primary', href: pageUrl('vault/index.html') + '#record' }, 'Send it to the register'), h('a', { class: 'btn', href: pageUrl('vault/index.html') + '#record' }, 'Add evidence first (website, GitHub, DNS)')))
    app.replaceChildren(...intro, steps, work)
}
vault.onChange(() => draw())
draw().catch(e => app.replaceChildren(msg('bad', err(e))))
