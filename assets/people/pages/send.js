/* send/index.html: write to someone in the register. The message is encrypted here, in this browser, to their public
   key, and becomes a link and a QR code that opens in their browser, where their vault reads it; or it goes into their
   inbox, if their record publishes one. Nothing readable passes through a server: a link's fragment never leaves the
   browser that opens it. */
import { h, msg, err, loadDirectory, pageUrl, copyButton, download, busy, vaultBar, vault, qr, K, A } from '../ui.js'
import * as M from '../message.js'

const app = document.getElementById('app')
vaultBar(document.getElementById('vault-bar-mount'))
const dir = await loadDirectory().catch(() => null)
let contacts = []

const to = h('select', { class: 't', id: 'send-to' })
const paste = h('textarea', { class: 't code', id: 'send-paste', placeholder: 'or paste their public bundle (sgit pki export), or their key link (…/send/#k1.…)', rows: 3 })
const keyNote = h('div', { id: 'send-keynote' })
const subject = h('input', { class: 't', id: 'send-subject', maxlength: 200, placeholder: 'optional' })
const text = h('textarea', { class: 't', id: 'send-text', placeholder: 'What only they should read' })
const files = h('input', { type: 'file', multiple: true })
const grantKey = h('input', { class: 't', type: 'password', autocomplete: 'off', id: 'send-grant', placeholder: 'an SG/Send access key, to hand over sealed' })
const grantName = h('input', { class: 't', id: 'send-grant-name', placeholder: 'its name on the server, if it has one (for your records)' })
const sign = h('input', { type: 'checkbox', id: 'send-sign', checked: true })
const go = h('button', { type: 'button', class: 'btn primary', id: 'send-go' }, 'Encrypt it')
const out = h('div', { id: 'send-out' })
const signLine = h('label', { class: 'small' })

function options() {
    const want = (location.hash.match(/to=(sha256-[0-9a-f]{16})/) || [])[1]
    const wantFp = want ? K.fpOfDir(want) : (to.value || '')
    const opts = [h('option', { value: '' }, '— pick the recipient —')]
    const seen = new Set()
    if (dir) {
        const real = dir.records.filter(r => r.ok && !r.revoked && !r.fixture), fix = dir.records.filter(r => r.ok && !r.revoked && r.fixture)
        if (real.length) opts.push(h('optgroup', { label: 'In the register' }, ...real.map(r => { seen.add(r.fp); return h('option', { value: r.fp, selected: r.fp === wantFp }, `${r.name} · ${r.fp}`) })))
        if (contacts.length) opts.push(h('optgroup', { label: 'Your contacts' }, ...contacts.filter(c => !seen.has(c.bundle.signing_fingerprint)).map(c => { seen.add(c.bundle.signing_fingerprint); return h('option', { value: c.bundle.signing_fingerprint, selected: c.bundle.signing_fingerprint === wantFp }, `${c.name || c.bundle.label} · ${c.bundle.signing_fingerprint}`) })))
        if (fix.length) opts.push(h('optgroup', { label: 'Fixtures (to try it: their private keys are published)' }, ...fix.map(r => h('option', { value: r.fp, selected: r.fp === wantFp }, `${r.name} · ${r.fp}`))))
    }
    to.replaceChildren(...opts)
    signLine.replaceChildren(sign, vault._resuming ? ' sign it (your vault is opening…)' : vault.open && vault.me ? ` sign it as ${vault.me.bundle.label || 'you'} (${vault.me.bundle.signing_fingerprint}), so they know it is from you` : ' sign it (open your vault above to sign; unsigned, it says nothing about who sent it)')
    const can = !!(vault.open && vault.me)
    if (sign.disabled && can) sign.checked = true
    sign.disabled = !can
    if (!can) sign.checked = false
}
async function refresh() { contacts = vault.open ? await vault.contacts().catch(() => []) : []; options() }
vault.onChange(refresh)
refresh()

/** A key link (k1) in the address or pasted: the bundle, recomputed, and the fingerprint to compare with its owner. */
async function fromKeyLink(text) {
    const b = await M.parseKeyCode(text)
    if (!b) return null
    const rec = dir && dir.byFp.get(b.signing_fingerprint)
    keyNote.replaceChildren(msg(rec ? 'ok' : 'warn', 'A key from a link: ', h('b', {}, b.label || '(no label)'), ' · ', h('span', { class: 'mono' }, b.signing_fingerprint),
        rec ? ` · in the register as ${rec.name}.` : '. Not in the register: a key link proves nothing about whose key it is, so compare this fingerprint with them, face to face or on a channel you already know is theirs, before you seal anything that matters to it.'))
    return b
}
async function recipient() {
    if (paste.value.trim()) {
        const k = await fromKeyLink(paste.value); if (k) return { bundle: k, name: k.label || 'them', rec: (dir && dir.byFp.get(k.signing_fingerprint)) || null }
        let b; try { b = JSON.parse(paste.value) } catch (e) { throw new Error('the pasted text is neither a bundle nor a key link') } return { bundle: b, name: b.label || 'them', rec: null }
    }
    const fp = to.value
    if (!fp) throw new Error('pick who it is for')
    const rec = dir && dir.byFp.get(fp)
    if (rec) return { bundle: rec.bundle, name: rec.name, rec }
    const c = contacts.find(x => x.bundle.signing_fingerprint === fp)
    if (c) return { bundle: c.bundle, name: c.name || c.bundle.label, rec: null }
    throw new Error('that recipient is not known here')
}

go.addEventListener('click', () => busy(go, async () => {
    out.replaceChildren()
    await vault.settled()
    try {
        const r = await recipient()
        const p = await K.checkBundle(r.bundle); if (p.length) throw new Error(p.join('; '))
        const grant = grantKey.value.trim() ? { token: grantKey.value.trim(), name: grantName.value.trim() } : null
        if (!text.value.trim() && !files.files.length && !grant) throw new Error('nothing to send')
        const attached = []
        for (const f of files.files) { if (f.size > 2 * 1024 * 1024) throw new Error(`${f.name} is over 2 MB`); attached.push({ name: f.name, type: f.type, data: new Uint8Array(await f.arrayBuffer()) }) }
        const from = sign.checked && vault.open ? vault.me : null
        const m = await M.compose({ to: r.bundle, from, subject: subject.value.trim(), text: text.value || (grant ? 'An SG/Send access key, for you to create your vault with. Open this with your key, and the page will offer to keep it in your vault.' : ''), files: attached, grant })
        const sealed = await M.sealMessage(m, r.bundle, from)
        const fits = sealed.url.length <= M.MAX_QR_CHARS
        const boxes = [h('h2', {}, `Sealed to ${r.name}`),
            h('p', { class: 'small dim' }, `Encrypted here to ${r.bundle.fingerprint} (RSA-OAEP 4096 wrapping AES-256-GCM, sgit’s envelope)${from ? ', signed with your key, the recipient named inside the signature' : ', unsigned'}. Only their private key opens it.`)]
        if (fits) {
            boxes.push(h('div', { class: 'qr' }, await qr(sealed.url, { actions: 'sealed-message' }), h('div', { class: 'url' }, h('p', { class: 'small' }, 'Show them the QR code, or send them the link. It opens in their browser and their vault reads it; the part after # never reaches a server.'), h('span', { class: 'mono', id: 'send-link' }, sealed.url), h('div', { class: 'acts' }, copyButton(sealed.url, 'Copy the link')))))
        } else boxes.push(msg('warn', `Too long for one QR code (${sealed.url.length} characters). The link still works, or send it to their inbox, or as a file.`), h('div', { class: 'acts' }, copyButton(sealed.url, 'Copy the link')))
        const acts = h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn', onclick: () => download('message.txt.enc', sealed.enc, 'text/plain') }, 'Download as .enc (for sgit pki decrypt)'))
        if (r.rec && r.rec.inbox) acts.prepend(h('button', { type: 'button', class: 'btn primary', id: 'send-inbox', onclick: e => busy(e.target, async () => {
            try { await A.deliver(r.rec.inbox, sealed.enc); e.target.replaceWith(h('span', { class: 'ok' }, `Delivered to ${r.name}’s inbox: the server said ok, and can say nothing else.`)) } catch (x) { out.prepend(msg('bad', err(x))) }
        }) }, `Deliver to ${r.name}’s inbox`))
        boxes.push(acts)
        if (grant && vault.mode === 'vault') { await A.book.saveGrant(vault.book, { v: 1, to: r.bundle.signing_fingerprint, to_name: r.name, at: m.at, name: grant.name || '', token_sha256: await K.sha256hex(grant.token) }); boxes.push(h('p', { class: 'dim small' }, 'The hand-over is in your book, under Your vaults: who, when, and the key’s SHA-256, never the key.')) }
        if (vault.mode === 'vault') { await A.book.saveMessage(vault.book, 'out', { to: r.bundle.signing_fingerprint, at: m.at, subject: m.subject || '', text: m.text, how: r.rec && r.rec.inbox ? 'link or inbox' : 'link', code: sealed.code }); boxes.push(h('p', { class: 'dim small' }, 'A copy is kept in your book, under Sent.')) }
        out.replaceChildren(...boxes)
    } catch (e) { out.replaceChildren(msg('bad', err(e))) }
}))

app.replaceChildren(
    h('label', { class: 'f' }, 'To'), to, paste, keyNote,
    h('label', { class: 'f' }, 'Subject'), subject,
    h('label', { class: 'f' }, 'Message'), text,
    h('details', { class: 'vpanel' }, h('summary', {}, h('b', {}, 'Hand over an access key')),
        h('p', { class: 'small' }, 'An SG/Send access key lets them create vaults, and so keep their keys in a vault that follows them across devices. It travels sealed to their key, inside this message: only they can open it, and when they do, the page offers to keep it in their vault. Your book records that you handed it over, and its SHA-256, never the key.'),
        grantKey, grantName),
    h('label', { class: 'f' }, 'Files ', h('span', { class: 'dim' }, '(optional, 2 MB each; a file makes it too long for a QR code, so it goes as a link or to their inbox)')), files,
    h('div', { class: 'acts' }, signLine), h('div', { class: 'acts' }, go), out)
if (/#k1\./.test(location.hash)) fromKeyLink(location.hash).then(b => { if (b) { paste.value = location.hash.slice(1); document.querySelector('details.vpanel').open = true } }).catch(e => keyNote.replaceChildren(msg('bad', err(e))))
paste.addEventListener('input', () => { if (/k1\./.test(paste.value)) fromKeyLink(paste.value).catch(() => {}); else keyNote.replaceChildren() })
