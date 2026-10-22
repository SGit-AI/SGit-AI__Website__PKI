/* m/index.html#m1.…: open a message sent as a link or a QR code. The envelope is in the fragment, which the browser
   never sends to a server; it is rebuilt here as sgit's .enc text and opened with a key from your vault. A fixture's
   message can be opened with the fixture's published key, to see the whole thing work before you have a key. */
import { h, msg, err, loadDirectory, pageUrl, busy, vaultBar, vault, download, ROOT, K, A } from '../ui.js'
import * as M from '../message.js'
import { messageCard } from '../cards.js'
import * as QR from '../qrread.js'

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
    if (vault.mode === 'local') {                     // signed in, kept in this browser: the vault is made here, by them, now
        b.addEventListener('click', () => busy(b, async () => {
            try {
                const rc = await vault.upgrade(g.token)
                // in the bar's panel, which the page's redraw (the vault just changed) leaves alone until it is dismissed
                bar.showRecovery(rc); window.scrollTo(0, 0)
            } catch (e) { b.parentNode.prepend(msg('bad', err(e))) }
        }))
        return b
    }
    b.addEventListener('click', () => { bar.setAccessKey(g.token); window.scrollTo(0, 0); b.replaceWith(h('span', { class: 'ok' }, vault.mode === 'browser' ? 'Ready: press “Move into a vault” above, make or use a passkey, and the key goes in with your keys.' : 'Ready: press “Open with my passkey” above; the first time, the form to create your vault has the key in it.')) })
    return b
}

/** The text of the QR code in an image: the browser's own detector when it has one, this site's reader when not. */
async function fromImage(blob, out) {
    out.replaceChildren(h('p', { class: 'dim small' }, 'Reading the QR code…'))
    try {
        const bmp = await createImageBitmap(blob)
        if ('BarcodeDetector' in window) { try { const r = await new BarcodeDetector({ formats: ['qr_code'] }).detect(bmp); if (r[0] && r[0].rawValue) { out.replaceChildren(); return r[0].rawValue } } catch (e) { /* the reader below */ } }
        const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(bmp, 0, 0)
        const d = x.getImageData(0, 0, c.width, c.height).data, lum = new Uint8Array(c.width * c.height)
        for (let i = 0; i < lum.length; i++) lum[i] = Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2])
        const text = QR.readQr(lum, c.width, c.height); out.replaceChildren(); return text
    } catch (e) { out.replaceChildren(msg('bad', 'No QR code read from that image (', err(e), '). Crop it to the code, straight on, and try again.')); return null }
}
let onPasteImage = null                               // the paste handler of the page as last drawn
document.addEventListener('paste', e => { const it = [...(e.clipboardData && e.clipboardData.items || [])].find(i => i.type.startsWith('image/')); if (it && onPasteImage) { e.preventDefault(); onPasteImage(it.getAsFile()) } })
async function draw() {
    const code = M.parseCode(location.hash)
    if (!code) {
        const paste = h('textarea', { class: 't code', id: 'open-paste', placeholder: 'https://pki.sgit.ai/m/#m1.…, m1.…, or the JSON a QR code for an agent holds: {"v":1,"kind":"pki.sgit.ai/qr/sealed/v1",…}' })
        const out = h('div', { id: 'open-qr-out' })
        const take = text => {
            try { const q = M.parseQrText(text); if (q.kind !== 'sealed') return out.replaceChildren(msg('warn', 'That is a public key, not a sealed message: send to it from Send.')); location.hash = q.code }
            catch (e) { out.replaceChildren(msg('bad', err(e))) }
        }
        const file = h('input', { type: 'file', accept: 'image/*', id: 'open-qr-file', class: 'visually-hidden' })
        file.addEventListener('change', () => { if (file.files[0]) fromImage(file.files[0], out).then(t => t && take(t)) })
        onPasteImage = blob => fromImage(blob, out).then(t => t && take(t))
        return app.replaceChildren(h('p', {}, 'Nothing to open in this address. Bring the message here:'),
            h('h3', {}, 'A QR code image'), h('p', { class: 'small' }, 'Choose the image, or paste it here (Cmd/Ctrl+V). It is read in this browser; nothing is uploaded.'),
            h('div', { class: 'acts' }, h('label', { class: 'btn primary', for: 'open-qr-file' }, 'Choose a QR image'), file), out,
            h('h3', {}, 'Or its text'), paste, h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => take(paste.value) }, 'Open')))
    }
    onPasteImage = null
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
