/**
 * forward.js: a file from an opened message, sealed again, straight to someone else's key: a vault key handed on to
 * an agent without being shown, downloaded or pasted anywhere. The file never leaves memory; what comes out is a QR
 * code for an agent (strict JSON) and its link.
 *
 * The recipient is a fingerprint in the register, or a key brought by hand: its key link, the JSON of its key QR code,
 * or the QR image itself. A key brought by hand proves nothing about whose it is, so the panel shows its fingerprint to
 * compare with the one the agent printed in its own session, before anything is sealed.
 *
 * @module forward
 */
import { h, msg, err, busy, vault, qr, copyButton, K, A } from './ui.js'
import * as M from './message.js'
import { readImage } from './qrimage.js'

/** A recipient from what was brought: { bundle, name, inRegister } or an error. */
export async function recipientFrom(text, dir) {
    const t = String(text || '').trim()
    if (K.FP.test(t)) { const r = dir && dir.byFp.get(t); if (!r) throw new Error(`${t} is not in the register: bring its key link or QR code instead`); return { bundle: r.bundle, name: r.name, inRegister: true } }
    const q = M.parseQrText(t)
    if (q.kind !== 'key') throw new Error('that is a sealed message, not a key: bring the key of whoever it is for')
    const bundle = await M.parseKeyCode(q.code)
    if (q.fp && q.fp !== bundle.signing_fingerprint) throw new Error('the fingerprint the QR code names is not the one its key computes to: refused')
    const r = dir && dir.byFp.get(bundle.signing_fingerprint)
    return { bundle, name: r ? r.name : (q.label || bundle.label || 'them'), inRegister: !!r }
}

/** A file sealed to a target, signed by the open vault's key, expiring in a week: { sealed, json } (json: the agent QR text). */
export async function sealFileTo(file, target) {
    const m = await M.compose({ to: target.bundle, from: vault.me, subject: `A secret: ${file.name}`, text: `Sealed to ${target.bundle.signing_fingerprint} by ${vault.me.bundle.signing_fingerprint}. The secret is the file inside.`,
        files: [{ name: file.name, type: 'application/octet-stream', data: file.data }], expires: new Date(Date.now() + 7 * 86400000).toISOString() })
    const sealed = await M.sealMessage(m, target.bundle, vault.me)
    // a hand-off is kept under Sent (the file's name, never its bytes): so the page knows which vault key went where
    if (vault.mode === 'vault') await A.book.saveMessage(vault.book, 'out', { to: target.bundle.signing_fingerprint, to_name: target.name || '', at: m.at, subject: m.subject, handed: file.name, how: 'QR image', code: sealed.code }).catch(() => {})
    return { sealed, json: M.qrSealed({ to: target.bundle.signing_fingerprint, from: vault.me.bundle.signing_fingerprint, code: sealed.code }) }
}
export function forwardPanel(file, dir, preset = '') {
    const box = h('div', { class: 'vpanel forward' })
    const input = h('textarea', { class: 't code', rows: 2, placeholder: 'their key: a fingerprint in the register, the key link (…/send/#k1.…), or the JSON of their key QR code' })
    const img = h('input', { type: 'file', accept: 'image/*', class: 'visually-hidden' }), id = 'fw-' + Math.random().toString(36).slice(2, 8); img.id = id
    const who = h('div'), out = h('div')
    let target = null
    const look = async text => {
        target = null; out.replaceChildren()
        try {
            target = await recipientFrom(text, dir)
            who.replaceChildren(msg(target.inRegister ? 'ok' : 'warn', h('b', {}, target.name), ' · ', h('span', { class: 'mono' }, target.bundle.signing_fingerprint),
                target.inRegister ? ' · in the register.' : ' · not in the register: compare this fingerprint, character for character, with the one the agent printed in its own session.'))
        } catch (e) { who.replaceChildren(msg('bad', err(e))) }
    }
    input.addEventListener('input', () => { if (input.value.trim()) look(input.value) })
    img.addEventListener('change', async () => { if (!img.files[0]) return; try { const t = await readImage(img.files[0]); input.value = t; look(t) } catch (e) { who.replaceChildren(msg('bad', 'No QR code read from that image: ', err(e))) } })
    const go = h('button', { type: 'button', class: 'btn primary' }, 'Seal it to them')
    go.addEventListener('click', () => busy(go, async () => {
        if (!target) return out.replaceChildren(msg('warn', 'Bring their key first.'))
        if (!vault.me) return out.replaceChildren(msg('warn', 'Open your vault: the forward is signed with your key, so they know it is from you.'))
        const { sealed, json } = await sealFileTo(file, target)
        out.replaceChildren(msg('ok', `Sealed to ${target.name}, signed by you, expiring in 7 days. Only their key opens it.`),
            json.length <= M.MAX_QR_CHARS ? h('div', { class: 'qr' }, await qr(json, { caption: false, actions: `for-${target.name}`.replace(/[^A-Za-z0-9_.-]+/g, '-') }),
                h('div', { class: 'url' }, h('p', { class: 'small' }, 'Carry this image to their session (Download PNG, or Copy the image and paste it there). It holds strict JSON: an agent following pki.sgit.ai/handover.md opens it with ', h('code', {}, 'node pki-agent.mjs open <image.png>'), '.'), h('div', { class: 'acts' }, copyButton(sealed.url, 'Copy the link instead'))))
                : msg('warn', `Too large for one QR code (${json.length} characters): copy the link instead.`, ' ', copyButton(sealed.url, 'Copy the link')))
    }))
    if (preset) { input.value = preset; look(preset) }
    box.append(h('h3', {}, `Forward ${file.name}, sealed`), h('p', { class: 'small' }, 'To an agent (or a person) by their key. The file is sealed again here, in memory: it is not shown, not downloaded, not pasted.'),
        input, h('div', { class: 'acts' }, h('label', { class: 'btn small', for: id }, 'or choose their key QR image'), img), who, h('div', { class: 'acts' }, go), out)
    return box
}
