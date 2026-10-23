/**
 * exchange.js: a key exchange, from an agent's public key brought to the message page (its QR image, link or JSON).
 *
 *   1. the page reads the key and shows its fingerprint: is it the one the agent printed in its own session?
 *   2. what to give it: a vault key you hold (from a message you kept, or one you bring now as its QR image), a message
 *      you write, or your own public key, so it can seal things to you
 *   3. one button: sealed to its key, signed by yours, expiring in a week; the QR image to carry, with a copy button,
 *      and the line to tell the agent
 *
 * A vault key goes from your book (or the message you bring) to the agent's key in this tab's memory: it is not shown,
 * downloaded or pasted.
 *
 * @module exchange
 */
import { h, msg, err, busy, vault, qr, copyButton, A } from './ui.js'
import * as M from './message.js'
import { readImage } from './qrimage.js'
import { sealFileTo } from './forward.js'

const confirmed = new Set()                          // fingerprints confirmed in this tab: a redraw (the vault opening) keeps the step
export const keyish = f => /vault[ _-]?key|secret|token|key\b/i.test(String(f.name))

export function keyExchange(q, bundle, rec, { extra = [] } = {}) {
    const name = rec ? rec.name : (q.label || bundle.label || 'this agent'), fp = bundle.signing_fingerprint
    const target = { bundle, name, inRegister: !!rec }
    const box = h('div', { class: 'vpanel exchange', id: 'key-box' })
    const step2 = h('div'), step3 = h('div')
    const yes = h('button', { type: 'button', class: 'btn primary', id: 'xchg-match' }, 'Yes, it matches')
    const no = h('button', { type: 'button', class: 'btn' }, 'No')
    no.addEventListener('click', () => { step2.replaceChildren(msg('bad', 'Stop here: give it nothing. A key that does not match is not the agent you are talking to. Ask the agent to print its fingerprint again (node pki-agent.mjs whoami).')); step3.replaceChildren() })
    yes.addEventListener('click', () => { yes.disabled = true; no.disabled = true; confirmed.add(fp); choose(step2, step3, target, extra) })
    box.append(h('h2', {}, `Key exchange with ${name}`),
        h('p', { class: 'small' }, 'An agent showed you its public key. Check it is the one it printed, choose what to give it, and carry one image back. Only its key opens what you give it.'),
        h('ol', { class: 'steps' }, h('li', { class: 'now' }, 'Same fingerprint as the agent printed in its own session?')),
        h('p', { class: 'fpbig mono' }, fp),
        rec ? msg('ok', `In the register, as ${rec.name}.`) : h('p', { class: 'dim small' }, 'It is not in the register yet, so this comparison is the check: character for character.'),
        h('div', { class: 'acts' }, yes, no), step2, step3)
    if (confirmed.has(fp)) yes.click()
    return box
}

async function choose(step2, step3, target, extra = []) {
    step2.replaceChildren(h('p', { class: 'dim small' }, 'Opening your vault…'))
    await vault.settled()
    if (!vault.open || !vault.me) return step2.replaceChildren(msg('warn', 'Open your vault above with your passkey: what you give is signed with your key.'))
    const options = []                                // { label, file?, mine? }
    const list = h('div', { class: 'xchg-options' }), out = h('div')
    const radio = (o, checked) => {
        const id = 'xo-' + options.length
        options.push(o)
        list.append(h('label', { class: 'xchg-option', for: id }, h('input', { type: 'radio', name: 'xchg', id, value: String(options.length - 1), checked }), ' ', h('span', {}, o.label)))
    }
    for (const o of extra) radio(o, false)               // given by the page: the vault open on it, say
    const pickDefault = () => { const all = [...list.querySelectorAll('input')]; const i = options.findIndex(o => o.file && keyish(o.file)); (all[i >= 0 ? i : 0] || {}).checked = true }
    const img = h('input', { type: 'file', accept: 'image/*', id: 'xchg-msg-img', class: 'visually-hidden' })
    img.addEventListener('change', async () => {
        if (!img.files[0]) return
        try {
            const mq = M.parseQrText(await readImage(img.files[0]))
            if (mq.kind !== 'sealed') return out.replaceChildren(msg('warn', 'That image is a key, not a message that carries a vault key.'))
            const o = await M.openMessage(M.parseCode(mq.code).enc, vault.ids, new Map())
            if (!(o.msg.files || []).length) return out.replaceChildren(msg('warn', 'That message carries no file.'))
            out.replaceChildren(msg('ok', `Opened with your key: ${o.msg.files.length} file${o.msg.files.length === 1 ? '' : 's'}, not shown.`))
            const before = options.length
            for (const f of o.msg.files) radio({ label: `${f.name} · from the message you just brought`, file: f }, false)
            ;(list.querySelectorAll('input')[before] || {}).checked = true
        } catch (e) { out.replaceChildren(msg('bad', 'That message did not open: ', err(e))) }
    })
    if (vault.mode === 'vault') {
        try { for (const k of await A.book.messages(vault.book, 'in')) for (const f of (k.msg && k.msg.files) || []) radio({ label: `${f.name} · kept · ${k.msg.subject || ''} · ${String(k.at || '').slice(0, 10)}`, file: f }, false) } catch (e) { /* none kept */ }
    }
    radio({ label: 'A message I write, sealed to it', text: true }, false)
    // confirmed by its fingerprint: kept in your contacts, so Send lists it next time without the key image
    const known = (await vault.contacts().catch(() => [])).some(c => c.bundle && c.bundle.signing_fingerprint === target.bundle.signing_fingerprint)
    const remember = known || target.inRegister ? null : h('button', { type: 'button', class: 'btn small', id: 'xchg-remember' }, `Keep ${target.name} in my contacts`)
    if (remember) remember.addEventListener('click', () => busy(remember, async () => { await vault.saveContact({ name: target.name, bundle: target.bundle, note: 'fingerprint confirmed in a key exchange', from: 'key exchange' }); remember.replaceWith(h('span', { class: 'ok small' }, 'In your contacts: Send lists it from now on.')) }))
    radio({ label: 'My public key, so it can seal things to me', mine: true }, false)
    pickDefault()
    const note = h('textarea', { id: 'xchg-text', rows: 4, maxlength: 1500, placeholder: 'What to tell the agent. It reads it as data from you, signed by your key.' })
    const noteBox = h('div', { class: 'xchg-note', hidden: true }, note)
    const showNote = () => { const sel = list.querySelector('input:checked'); noteBox.hidden = !(sel && options[Number(sel.value)].text); if (!noteBox.hidden) note.focus() }
    list.addEventListener('change', showNote)
    const go = h('button', { type: 'button', class: 'btn primary', id: 'xchg-go' }, `Seal it and make the QR code`)
    showNote()
    go.addEventListener('click', () => busy(go, async () => {
        const sel = list.querySelector('input:checked'); if (!sel) return
        const o = options[Number(sel.value)], me = vault.me.bundle.signing_fingerprint, fp = target.bundle.signing_fingerprint
        let json, line, label
        if (o.text) {
            const text = note.value.trim()
            if (!text) return step3.replaceChildren(msg('warn', 'Write the message first.'))
            // a vault key written into the message travels as a file (sgit's full form), never as text an agent prints
            const vk = M.vaultKeysIn(text)
            const m = await M.compose({ to: target.bundle, from: vault.me, subject: vk.keys.length ? `A vault key: ${vk.keys.map(k => k.id).join(', ')}` : 'A message', text: vk.text, files: vk.keys.map(M.vaultKeyFile), expires: new Date(Date.now() + 7 * 86400000).toISOString() })
            const sealed = await M.sealMessage(m, target.bundle, vault.me)
            json = M.qrSealed({ to: fp, from: me, code: sealed.code })
            line = vk.keys.length ? `Open this with: node pki-agent.mjs open <image> --save <folder>. The sender is me, ${me}. The vault key of ${vk.keys.map(k => k.id).join(', ')} is a file in it.`
                : `Open this with: node pki-agent.mjs open <image>. The sender is me, ${me}. It is a message from me.`
            label = `message-for-${target.name}`.replace(/[^A-Za-z0-9_.-]+/g, '-')
        } else if (o.mine) {
            json = M.qrKey({ fp: me, label: vault.me.bundle.label, code: M.keyCode(vault.me.bundle).code })
            line = `This is my public key, ${me}. Check it with: node pki-agent.mjs read-qr <image>`
            label = 'my-public-key'
        } else {
            json = (await sealFileTo(o.file, target)).json
            line = `Open this with: node pki-agent.mjs open <image> --save <folder>. The sender is me, ${me}. It holds ${o.file.name}.`
            label = `for-${target.name}`.replace(/[^A-Za-z0-9_.-]+/g, '-')
        }
        if (json.length > M.MAX_QR_CHARS) return step3.replaceChildren(msg('bad', `Too large for one QR code (${json.length} characters).`))
        step3.replaceChildren(h('ol', { class: 'steps', start: 3 }, h('li', { class: 'now' }, 'Give this image to the agent, with the line below.')),
            o.mine ? msg('ok', 'Your public key: nothing secret.') : o.text ? msg('ok', `Your message, sealed to ${target.name} and signed by you, expiring in 7 days. Only its key opens it.${M.vaultKeysIn(note.value).keys.length ? ' The vault key in it goes as a file, not as text.' : ''}`) : msg('ok', `Sealed to ${target.name}, signed by you, expiring in 7 days. Only its key opens it.`),
            h('div', { class: 'qr' }, await qr(json, { caption: false, actions: label }),
                h('div', { class: 'url' }, h('p', { class: 'small' }, h('b', {}, 'Tell the agent:')), h('pre', { class: 'xchg-line' }, line), h('div', { class: 'acts' }, copyButton(line, 'Copy the line')))))
        step3.append(h('p', { class: 'small dim' }, 'Something else for the same agent? Choose it above and press the button again.'))
        step3.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }))
    step2.replaceChildren(remember ? h('div', { class: 'acts' }, remember) : null, h('ol', { class: 'steps', start: 2 }, h('li', { class: 'now' }, 'What to give it')),
        list, noteBox, h('div', { class: 'acts' }, h('label', { class: 'btn small', for: 'xchg-msg-img' }, 'Add from a message QR image…'), img), out,
        h('div', { class: 'acts' }, go))
}
