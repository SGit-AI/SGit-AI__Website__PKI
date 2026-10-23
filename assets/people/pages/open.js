/* m/index.html#m1.…: open a message sent as a link or a QR code. The envelope is in the fragment, which the browser
   never sends to a server; it is rebuilt here as sgit's .enc text and opened with a key from your vault. A fixture's
   message can be opened with the fixture's published key, to see the whole thing work before you have a key. */
import { h, msg, err, loadDirectory, pageUrl, busy, vaultBar, vault, download, ROOT, K, A } from '../ui.js'
import * as M from '../message.js'
import { messageCard } from '../cards.js'
import { readImage, isImage } from '../qrimage.js'
import { forwardPanel } from '../forward.js'
import { keyExchange } from '../exchange.js'
import { unzip, isZip, inflateRawBrowser } from '../unzip.js'

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

const IMAGE = isImage
/** Every file brought (images, zips of them, JSON or text files), each read to one of the two QR shapes or an error. */
async function readAll(files) {
    const entries = []
    for (const f of files) {
        const bytes = new Uint8Array(await f.arrayBuffer())
        if (isZip(bytes)) { try { for (const e of await unzip(bytes, inflateRawBrowser)) entries.push({ name: `${f.name} › ${e.name}`, ...e }) } catch (e) { entries.push({ name: f.name, error: err(e) }) } }
        else entries.push({ name: f.name || 'pasted image', bytes })
    }
    const out = [], seen = new Set()
    for (const e of entries) {
        if (e.error) { out.push(e); continue }
        try {
            const text = IMAGE(e.bytes) ? await readImage(new Blob([e.bytes])) : new TextDecoder('utf-8', { fatal: true }).decode(e.bytes)
            const q = M.parseQrText(text)
            if (q.kind === 'sealed' && seen.has(q.code)) { out.push({ name: e.name, dup: true, q }); continue }
            if (q.kind === 'sealed') seen.add(q.code)
            out.push({ name: e.name, q })
        } catch (x) { out.push({ name: e.name, error: IMAGE(e.bytes) ? `no QR code read (${err(x)})` : err(x) }) }
    }
    return out
}
/** A public key brought here (an agent's key QR code): whose it claims to be, its fingerprint to compare, and what to do. */
/** A public key brought here (an agent's key QR code): the page flips into a key exchange (exchange.js). */
async function keyBox(q, out) {
    let b; try { b = await M.parseKeyCode(q.code) } catch (e) { return out.replaceChildren(msg('bad', err(e))) }
    if (q.fp && q.fp !== b.signing_fingerprint) return out.replaceChildren(msg('bad', 'The fingerprint this QR code names is not the one its key computes to: refused.'))
    out.replaceChildren(keyExchange(q, b, dir && dir.byFp.get(b.signing_fingerprint)))
    out.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
let onFiles = null                                    // what the page as last drawn does with files dropped or pasted
let lastOpened = null                                // { code, ids, label }: a message opened, opened again after a redraw (the vault resuming)
let lastBatch = null                                  // a batch read, kept across a redraw (the vault opening, say)
document.addEventListener('paste', e => { const fs = [...(e.clipboardData && e.clipboardData.items || [])].filter(i => i.kind === 'file').map(i => i.getAsFile()); if (fs.length && onFiles) { e.preventDefault(); onFiles(fs) } })
document.addEventListener('dragover', e => { if (onFiles) { e.preventDefault(); document.body.classList.add('dropping') } })
document.addEventListener('dragleave', e => { if (!e.relatedTarget) document.body.classList.remove('dropping') })
document.addEventListener('drop', e => { document.body.classList.remove('dropping'); if (onFiles && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); onFiles([...e.dataTransfer.files]) } })

/** A batch: what each file held, and every message for one of your keys opened, one under the other. */
function batchView(items, out) {
    const known = dir ? new Map([...dir.byFp].map(([k, r]) => [k, r.bundle])) : new Map()
    const nameOf = f => (dir && dir.byFp.get(f) && dir.byFp.get(f).name) || f
    const mine = new Set(vault.ids.map(i => i.bundle.signing_fingerprint))
    const sealed = items.filter(i => i.q && i.q.kind === 'sealed' && !i.dup)
    const rows = items.map((it, n) => h('tr', {}, h('th', {}, String(n + 1)), h('td', {}, h('span', { class: 'mono small' }, it.name)),
        h('td', { class: 'small' }, it.error ? h('span', { class: 'bad' }, it.error) : it.dup ? h('span', { class: 'dim' }, 'the same message again: skipped') : it.q.kind === 'key' ? ['a public key: ', h('a', { href: pageUrl('send/index.html') + '#' + it.q.code }, 'send to it')]
            : ['for ', h('b', {}, nameOf(it.q.to)), mine.has(it.q.to) ? h('span', { class: 'ok' }, ' (you)') : '', it.q.from ? [' · from ', h('span', { class: 'mono' }, nameOf(it.q.from))] : ' · unsigned'])))
    const cards = h('div', { id: 'batch-cards' })
    const go = h('button', { type: 'button', class: 'btn primary', id: 'batch-open' }, `Open ${sealed.filter(i => mine.has(i.q.to)).length} with my keys`)
    go.addEventListener('click', () => busy(go, async () => {
        cards.replaceChildren()
        for (const [n, it] of sealed.entries()) {
            const head = h('h3', {}, `${n + 1} of ${sealed.length} · `, h('span', { class: 'mono small' }, it.name))
            if (!mine.has(it.q.to)) { cards.append(head, msg('warn', `Sealed to ${nameOf(it.q.to)}, not to one of your keys: only its owner opens it.`)); continue }
            try {
                const o = await M.openMessage(M.parseCode(it.q.code).enc, vault.ids, known), acts = []
                if (vault.mode === 'vault') { const keep = h('button', { type: 'button', class: 'btn' }, 'Keep it in my book'); keep.addEventListener('click', () => busy(keep, async () => { await A.book.saveMessage(vault.book, 'in', { id: it.q.code.slice(-24), at: o.msg.at, msg: o.msg, verified: o.verified }); keep.replaceWith(h('span', { class: 'ok' }, 'kept')) })); acts.push(keep) }
                cards.append(head, o.problems.length ? msg('warn', o.problems.join('; ')) : null, messageCard(o.msg, o.verified, nameOf, acts, { forward: f => forwardPanel(f, dir) }))
            } catch (e) { cards.append(head, msg('bad', err(e))) }
        }
    }))
    out.replaceChildren(h('h2', {}, `${items.length} item${items.length === 1 ? '' : 's'} read`), h('table', { class: 'kv' }, h('tbody', {}, ...rows)),
        vault.open && vault.ids.length ? h('div', { class: 'acts' }, go) : msg('warn', 'Open your vault above with your passkey to open them.'), cards)
    if (vault.open && vault.ids.length && sealed.some(i => mine.has(i.q.to))) go.click()
}
async function draw() {
    const code = M.parseCode(location.hash)
    if (!code) {
        const paste = h('textarea', { class: 't code', id: 'open-paste', placeholder: 'https://pki.sgit.ai/m/#m1.…, m1.…, or the JSON a QR code for an agent holds: {"v":1,"kind":"pki.sgit.ai/qr/sealed/v1",…}' })
        const out = h('div', { id: 'open-qr-out' })
        const take = text => {
            try { const q = M.parseQrText(text); if (q.kind !== 'sealed') return keyBox(q, out); location.hash = q.code }
            catch (e) { out.replaceChildren(msg('bad', err(e))) }
        }
        const file = h('input', { type: 'file', accept: 'image/*,.zip,.json,.txt', multiple: true, id: 'open-qr-file', class: 'visually-hidden' })
        onFiles = async files => {
            out.replaceChildren(h('p', { class: 'dim small' }, `Reading ${files.length} file${files.length === 1 ? '' : 's'}…`))
            const items = await readAll(files)
            lastBatch = items
            if (items.length === 1 && items[0].q && items[0].q.kind === 'sealed') return (location.hash = items[0].q.code)
            if (items.length === 1 && items[0].q && items[0].q.kind === 'key') return keyBox(items[0].q, out)
            if (items.length === 1 && items[0].error) return out.replaceChildren(msg('bad', `${items[0].name}: ${items[0].error}. Crop it to the code, straight on, and try again.`))
            batchView(items, out)
        }
        file.addEventListener('change', () => { if (file.files.length) onFiles([...file.files]) })
        app.replaceChildren(h('p', { class: 'msg ok' }, 'Giving an agent a vault key you hold? Bring its key QR image here (paste it): the page switches into a key exchange, you confirm its fingerprint, and you get the image to give back. Step by step: ', h('a', { href: pageUrl('handover/for-you.html') + '#give' }, 'recipe 1'), '.'),
            h('p', {}, 'Nothing to open in this address. Bring the message here:'),
            h('h3', {}, 'QR code images'), h('p', { class: 'small' }, 'One image or many, or a zip of them: choose them, drop them on this page, or paste (Cmd/Ctrl+V). They are read in this browser; nothing is uploaded.'),
            h('div', { class: 'acts' }, h('label', { class: 'btn primary', for: 'open-qr-file' }, 'Choose QR images or a zip'), file), out,
            h('h3', {}, 'Or its text'), paste, h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => take(paste.value) }, 'Open')),
            null)
        // a batch read before a redraw (the vault opening, say) is shown again: one key as its key box, the rest as a list
        if (lastBatch) { if (lastBatch.length === 1 && lastBatch[0].q && lastBatch[0].q.kind === 'key') keyBox(lastBatch[0].q, out); else batchView(lastBatch, out) }
        return
    }
    onFiles = null
    const toRec = dir && dir.byFp.get(code.to), fromRec = code.signer && dir && [...dir.byFp.values()].find(r => r.bundle && r.bundle.signing_fingerprint === code.signer)
    const head = [h('p', {}, 'A sealed message for ', h('b', {}, toRec ? toRec.name : code.to), toRec ? h('span', { class: 'mono dim' }, ` (${code.to})`) : '', code.signer ? ['; the envelope says it was signed by ', h('b', {}, fromRec ? fromRec.name : code.signer)] : '; unsigned', '.')]
    const known = dir ? new Map([...dir.byFp].map(([k, r]) => [k, r.bundle])) : new Map()
    if (vault.open) for (const c of await vault.contacts().catch(() => [])) known.set(c.bundle.signing_fingerprint, c.bundle)
    const nameOf = f => (dir && dir.byFp.get(f) && dir.byFp.get(f).name) || f
    const result = h('div', { id: 'open-result' })
    const tryOpen = async (ids, label) => {
        try {
            const o = await M.openMessage(code.enc, ids, known)
            lastOpened = { code: code.code, ids, label }
            const acts = []
            if (vault.mode === 'vault' && !(toRec && toRec.fixture)) {
                const keep = h('button', { type: 'button', class: 'btn primary' }, 'Keep it in my book')
                keep.addEventListener('click', () => busy(keep, async () => { await A.book.saveMessage(vault.book, 'in', { id: code.code.slice(-24), at: o.msg.at, msg: o.msg, verified: o.verified }); keep.replaceWith(h('span', { class: 'ok' }, 'kept')) }))
                acts.push(keep)
            }
            if (o.msg.grant && o.msg.grant.token) acts.unshift(grantButton(o.msg.grant))
            if (o.msg.from) acts.push(h('a', { class: 'btn', href: pageUrl('send/index.html') + '#to=' + K.dirOf(o.msg.from) }, 'Reply'))
            acts.push(h('button', { type: 'button', class: 'btn', onclick: () => download('message.txt.enc', code.enc, 'text/plain') }, 'Download as .enc'))
            result.replaceChildren(msg('ok', `Opened with ${label}.`), o.problems.length ? msg('warn', o.problems.join('; ')) : null, messageCard(o.msg, o.verified, nameOf, acts, { forward: f => forwardPanel(f, dir) }))
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
    else if (lastOpened && lastOpened.code === code.code) tryOpen(lastOpened.ids, lastOpened.label)
}
vault.onChange(() => draw())
window.addEventListener('hashchange', () => draw())
draw().catch(e => app.replaceChildren(msg('bad', err(e))))
