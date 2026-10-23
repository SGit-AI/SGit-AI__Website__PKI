/**
 * desk.js: the QR desk. Drop, paste or choose QR images (or a zip of them, or their text): a key flips into a key
 * exchange (exchange.js), messages for your keys open, one under the other. The message page is a full-page desk;
 * your account and your vault carry the same desk at the top, since most of what you do now arrives as a QR image.
 *
 *   qrDesk({ dir, compact, onSealed })   the element; onSealed(code) for one sealed message (the message page opens it
 *                                        at its own address), else it opens in place
 *
 * @module desk
 */
import { h, msg, err, busy, vault, qr, copyButton, pageUrl, A } from './ui.js'
import * as M from './message.js'
import { messageCard } from './cards.js'
import { readImage, isImage } from './qrimage.js'
import { forwardPanel } from './forward.js'
import { keyExchange } from './exchange.js'
import { unzip, isZip, inflateRawBrowser } from './unzip.js'

const IMAGE = isImage
/** Every file brought (images, zips of them, JSON or text files), each read to one of the two QR shapes or an error. */
export async function readAll(files) {
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
/** A public key brought here (an agent's key QR code): the page flips into a key exchange (exchange.js). */
export async function keyBox(q, out, dir) {
    let b; try { b = await M.parseKeyCode(q.code) } catch (e) { return out.replaceChildren(msg('bad', err(e))) }
    if (q.fp && q.fp !== b.signing_fingerprint) return out.replaceChildren(msg('bad', 'The fingerprint this QR code names is not the one its key computes to: refused.'))
    out.replaceChildren(keyExchange(q, b, dir && dir.byFp.get(b.signing_fingerprint)))
    out.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
let onFiles = null                                    // what the page as last drawn does with files dropped or pasted
let lastBatch = null                                  // a batch read, kept across a redraw (the vault opening, say)
export const setDropHandler = fn => { onFiles = fn }
document.addEventListener('paste', e => { const fs = [...(e.clipboardData && e.clipboardData.items || [])].filter(i => i.kind === 'file').map(i => i.getAsFile()); if (fs.length && onFiles) { e.preventDefault(); onFiles(fs) } })
document.addEventListener('dragover', e => { if (onFiles) { e.preventDefault(); document.body.classList.add('dropping') } })
document.addEventListener('dragleave', e => { if (!e.relatedTarget) document.body.classList.remove('dropping') })
document.addEventListener('drop', e => { document.body.classList.remove('dropping'); if (onFiles && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); onFiles([...e.dataTransfer.files]) } })

/** A batch: what each file held, and every message for one of your keys opened, one under the other. */
export function batchView(items, out, dir) {
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

/** Your own public key as a QR code, to show an agent (or anyone) that should seal things to you. */
export async function myKeyQr() {
    if (!vault.open || !vault.me) return msg('warn', 'Open your vault first: your key is in it.')
    const b = vault.me.bundle, kc = M.keyCode(b)
    return h('div', { class: 'vpanel', id: 'my-key-qr' }, h('h3', {}, 'My key, as a QR code'),
        h('p', { class: 'fpbig mono' }, b.signing_fingerprint), h('p', { class: 'dim small' }, 'Your public key. Not secret. Whoever gets it should check this fingerprint with you.'),
        h('div', { class: 'qr' }, await qr(M.qrKey({ fp: b.signing_fingerprint, label: b.label, code: kc.code }), { caption: false, actions: 'my-public-key' }),
            h('div', { class: 'url' }, h('div', { class: 'acts' }, copyButton(kc.url, 'Copy the link')))))
}

export function qrDesk({ dir, compact = false, onSealed = null } = {}) {
    const out = h('div', { id: 'open-qr-out' }), mine = h('div')
    const show = (items) => {
        lastBatch = items
        if (items.length === 1 && items[0].q && items[0].q.kind === 'sealed' && onSealed) return onSealed(items[0].q.code)
        if (items.length === 1 && items[0].q && items[0].q.kind === 'key') return keyBox(items[0].q, out, dir)
        if (items.length === 1 && items[0].error) return out.replaceChildren(msg('bad', `${items[0].name}: ${items[0].error}. Crop it to the code, straight on, and try again.`))
        batchView(items, out, dir)
    }
    const take = async files => { out.replaceChildren(h('p', { class: 'dim small' }, `Reading ${files.length} file${files.length === 1 ? '' : 's'}…`)); show(await readAll(files)) }
    setDropHandler(take)
    const file = h('input', { type: 'file', accept: 'image/*,.zip,.json,.txt', multiple: true, id: 'open-qr-file', class: 'visually-hidden' })
    file.addEventListener('change', () => { if (file.files.length) take([...file.files]) })
    const paste = h('textarea', { class: 't code', id: 'open-paste', rows: 3, placeholder: 'https://pki.sgit.ai/m/#m1.…, a k1 key link, or the JSON a QR code holds: {"v":1,"kind":"pki.sgit.ai/qr/…",…}' })
    const openText = () => {
        try { const q = M.parseQrText(paste.value); show([{ name: 'pasted text', q }]) }
        catch (e) { out.replaceChildren(msg('bad', err(e))) }
    }
    const keyBtn = h('button', { type: 'button', class: 'btn', id: 'my-key-btn' }, 'My key as a QR code')
    keyBtn.addEventListener('click', async () => { if (mine.firstChild) return mine.replaceChildren(); mine.replaceChildren(await myKeyQr()) })
    const desk = h('section', { class: 'qrdesk' + (compact ? ' compact' : ''), id: 'qr-desk' },
        h('div', { class: 'qrdesk-zone' },
            h('div', { class: 'qrdesk-icon', 'aria-hidden': 'true' }, '▣'),
            h('div', {}, h('b', {}, 'Drop, paste or choose a QR image'),
                h('div', { class: 'dim small' }, 'An agent’s key starts a key exchange; a message for you opens here. Several images or a zip work too. Read in this browser; nothing is uploaded.')),
            h('div', { class: 'acts' }, h('label', { class: 'btn primary', for: 'open-qr-file' }, 'Choose images'), file, keyBtn)),
        h('details', { class: 'qrdesk-text' }, h('summary', { class: 'small' }, 'Paste text instead'), paste, h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn', onclick: openText }, 'Open'))),
        mine, out)
    // a batch read before a redraw (the vault opening, say) is shown again
    if (lastBatch) show(lastBatch)
    return desk
}
