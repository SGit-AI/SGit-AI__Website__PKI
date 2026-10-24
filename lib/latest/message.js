/**
 * message.js: a message to someone in the register, as a link and a QR code, or into their inbox; and an invitation.
 *
 * A message is JSON, signed by the sender when the sender has a key, then sealed in sgit's hybrid v2 envelope to the
 * recipient's encryption key:
 *
 *     inner   { v: 1, kind: "pki.sgit.ai/message/v1", to, from?, at, expires?, subject?, text, files?: [{ name, type, data (base64) }],
 *               grant?: { service: "sg-send", endpoint, token, name? }, sig? }
 *             expires: an ISO time after which the recipient should refuse it, inside the signature, so an old QR
 *             code shown again (a replay) reads as expired; with `to` and `at` signed too, it cannot be re-addressed.
 *             grant: an access key handed over, sealed to the person it is for (the key-management proposal's phase 0).
 *             sig: the sender's ECDSA over the canonical bytes (keys.js canon, without sig). It covers `to`, so a
 *             recipient cannot re-seal a signed message to a third party and have it read as addressed to them,
 *             which the envelope's own s (over c only, see sgit.ai/docs/pki.md) does not prevent.
 *     outer   sgit's .enc text, with s and f too when signed, so `sgit pki decrypt` opens it and checks it.
 *
 * As a link (the QR code is the same text), the envelope's binary fields travel as base64url, not base64-in-JSON-in-
 * base64, which keeps a short message inside one QR code:
 *
 *     https://pki.sgit.ai/m/#m1.<recipient fp, 16 hex>.<w>.<i>.<c>[.<s>.<sender signing fp, 16 hex>]
 *
 * Everything after # stays in the browser: a fragment is never sent to a server. The page that opens it rebuilds the
 * .enc text, unlocks the reader's vault, and decrypts there.
 *
 * A public key is a link too (k1), to show as a QR code or send, so someone can seal a message (an access key, say) to
 * a person who is not in the register yet. It carries the two keys' SPKI bytes and the label; the bundle and both
 * fingerprints are recomputed from them. It is not secret, and not authenticated: the camera, face to face, or a
 * fingerprint compared on a channel already known, is what says whose key it is.
 *
 *     https://pki.sgit.ai/send/#k1.<encryption SPKI>.<signing SPKI>.<label, utf-8>          (base64url, each)
 *
 * An invitation is a link too, signed by the inviter, naming nobody (the invitee has no key yet):
 *
 *     https://pki.sgit.ai/join/#i1.<inviter signing fp, 16 hex>.<expires yyyymmdd>.<nonce, 16 hex>.<sig>[&n=<name>][&k=<access key>]
 *
 * The invitee makes a key and their record's first link points at the inviter; the inviter's side shows it waiting
 * and confirms it with one link back. n (a name the inviter wrote, a hint only) and k (an SG/Send access key, so the
 * invitee can create vaults) are outside the signature and are only ever what the inviter typed.
 *
 * @module message
 */
import { b64, unb64, b64url, unb64url, canon, utf8, fromUtf8, unpem, bundleOf, signBytes, verifyBytes, seal, unseal, parseEnvelope, hex, unhex } from './keys.js'

export const KIND = 'pki.sgit.ai/message/v1'
export const SITE = 'https://pki.sgit.ai/'
const short = fp => String(fp).replace(/^sha256:/, '')
const long = s => 'sha256:' + s
export const MAX_QR_CHARS = 2300                            // version 40 at level L holds 2953 bytes; leave room for the URL

// ------------------------------------------------------------ the inner message
/** The inner message, signed when `from` is an identity ({ bundle, private: { sign } }). */
export async function compose({ to, from = null, subject = '', text = '', files = [], grant = null, at = new Date().toISOString(), expires = '' }) {
    const msg = { v: 1, kind: KIND, to: to.signing_fingerprint, at, text: String(text) }
    if (expires) msg.expires = String(expires)
    if (subject) msg.subject = String(subject)
    if (grant) msg.grant = { service: 'sg-send', endpoint: String(grant.endpoint || 'https://dev.send.sgraph.ai'), token: String(grant.token), ...(grant.name ? { name: String(grant.name) } : {}) }
    if (files.length) msg.files = files.map(f => ({ name: String(f.name), type: String(f.type || 'application/octet-stream'), data: typeof f.data === 'string' ? f.data : b64(f.data) }))
    if (from) {
        msg.from = from.bundle.signing_fingerprint
        msg.sig = b64(await signBytes(from.private.sign, utf8(canon(msg) + '\n')))
    }
    return msg
}
/** Check a message's own signature against a bundle; null when there is no bundle to check it with. */
export async function verifyMessage(msg, fromBundle) {
    if (!msg || !msg.sig || !msg.from) return null
    if (!fromBundle || fromBundle.signing_fingerprint !== msg.from) return null
    const { sig, ...rest } = msg
    return verifyBytes(fromBundle.sign, unb64(sig), utf8(canon(rest) + '\n'))
}
export function problems(msg, myFps = []) {
    const out = []
    if (!msg || msg.kind !== KIND || msg.v !== 1) return ['not a pki.sgit.ai message']
    if (myFps.length && !myFps.includes(msg.to)) out.push('addressed to another key')
    if (typeof msg.text !== 'string') out.push('no text')
    if (msg.expires && String(msg.expires) < new Date().toISOString()) out.push(`expired at ${msg.expires}: refuse it, it may be a replay`)
    return out
}

// ------------------------------------------------------------ sealing, and the link
/** Seal a composed message to the recipient's bundle. Returns { enc, code, url } (code: the m1 text). */
export async function sealMessage(msg, toBundle, from = null) {
    const signer = from ? { sign: from.private.sign, fingerprint: from.bundle.signing_fingerprint } : null
    const enc = await seal(toBundle, JSON.stringify(msg), signer)
    const code = codeOf(enc, toBundle.signing_fingerprint)
    return { enc, code, url: SITE + 'm/#' + code }
}
/** The m1 text from an .enc envelope. */
export function codeOf(enc, toFp) {
    const env = parseEnvelope(enc), parts = ['m1', short(toFp), b64url(unb64(env.w)), b64url(unb64(env.i)), b64url(unb64(env.c))]
    if (env.s && env.f) parts.push(b64url(unb64(env.s)), short(env.f))
    return parts.join('.')
}
/** Back from the m1 text (or a URL holding one) to { to, enc }; null when there is none. */
export function parseCode(text) {
    const m = /m1\.([0-9a-f]{16})\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9_-]{80,90})\.([0-9a-f]{16}))?/.exec(String(text || ''))
    if (!m) return null
    try {
        const env = { v: 2, w: b64(unb64url(m[2])), i: b64(unb64url(m[3])), c: b64(unb64url(m[4])) }
        if (m[5]) { env.s = b64(unb64url(m[5])); env.f = long(m[6]) }
        return { to: long(m[1]), enc: btoa(JSON.stringify(env)), signer: m[6] ? long(m[6]) : null, code: m[0] }
    } catch (e) { return null }
}
/**
 * Open a message with one of the reader's identities. Returns { msg, identity, envelope: { signed, signer, verified },
 * verified (the inner signature: true, false or null), problems }. bundlesByFp: Map or object of known bundles.
 */
export async function openMessage(enc, identities, known = new Map()) {
    const look = fp => (known instanceof Map ? known.get(fp) : known[fp]) || null
    let lastErr = null
    for (const id of identities) {
        let opened
        try { opened = await unseal(id.private.encrypt, enc, [look(parseEnvelope(enc).f)].filter(Boolean)) }
        catch (e) { lastErr = e; if (/changed on the way/.test(e.message)) throw e; continue }
        let msg = null
        try { msg = JSON.parse(opened.text) } catch (e) { /* not ours: plain text sealed with sgit pki encrypt */ }
        if (!msg || msg.kind !== KIND) return { msg: { v: 1, kind: KIND, to: id.bundle.signing_fingerprint, text: opened.text == null ? '' : opened.text, raw: true }, identity: id, envelope: opened, verified: null, problems: ['sealed with sgit pki encrypt, not this site: shown as it is'] }
        return { msg, identity: id, envelope: opened, verified: await verifyMessage(msg, look(msg.from)), problems: problems(msg, [id.bundle.signing_fingerprint]) }
    }
    throw lastErr || new Error('no key to open it with')
}

// ------------------------------------------------------------ invitations
const INVITE = 'pki.sgit.ai/invite/v1'
const inviteBytes = (fp, exp, nonce) => utf8(`${INVITE}|${fp}|${exp}|${nonce}`)
/** An invitation from an identity, valid until `days` from now. Returns { code, url }. */
export async function invite(from, { days = 30, name = '', accessKey = '' } = {}) {
    const fp = from.bundle.signing_fingerprint
    const exp = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10).replace(/-/g, '')
    const nonce = hex(globalThis.crypto.getRandomValues(new Uint8Array(8)))
    const sig = b64url(await signBytes(from.private.sign, inviteBytes(fp, exp, nonce)))
    let code = ['i1', short(fp), exp, nonce, sig].join('.')
    const extra = []
    if (name) extra.push('n=' + encodeURIComponent(name))
    if (accessKey) extra.push('k=' + encodeURIComponent(accessKey))
    if (extra.length) code += '&' + extra.join('&')
    return { code, url: SITE + 'join/#' + code }
}
/** Read an invitation: { from, expires, nonce, name, accessKey, expired, verify(bundle) }; null when there is none. */
export function parseInvite(text) {
    const s = String(text || ''), m = /i1\.([0-9a-f]{16})\.(\d{8})\.([0-9a-f]{16})\.([A-Za-z0-9_-]{80,90})/.exec(s)
    if (!m) return null
    const q = new URLSearchParams((s.split(m[0])[1] || '').replace(/^&/, ''))
    const from = long(m[1]), expires = `${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6)}`
    return { from, expires, nonce: m[3], name: q.get('n') || '', accessKey: q.get('k') || '', expired: expires < new Date().toISOString().slice(0, 10),
             verify: bundle => bundle && bundle.signing_fingerprint === from ? verifyBytes(bundle.sign, unb64url(m[4]), inviteBytes(from, m[2], m[3])) : Promise.resolve(null) }
}
/** A public bundle as a k1 code and a link to the send page with it. */
export function keyCode(bundle) {
    const code = `k1.${b64url(unpem(bundle.encrypt).der)}.${b64url(unpem(bundle.sign).der)}.${b64url(utf8(bundle.label || ''))}`
    return { code, url: SITE + 'send/#' + code }
}
/** Read a k1 code (in a link or alone): the bundle, recomputed; null when there is none. */
export async function parseKeyCode(text) {
    const m = /k1\.([A-Za-z0-9_-]{100,1200})\.([A-Za-z0-9_-]{60,200})\.([A-Za-z0-9_-]{0,200})/.exec(String(text || ''))
    if (!m) return null
    return bundleOf(unb64url(m[1]), unb64url(m[2]), fromUtf8(unb64url(m[3])))
}
// ------------------------------------------------------------ QR codes for agents: strict JSON, two kinds
/**
 * What a QR code carries when an agent is to read it: one JSON object, of one of two kinds, with exactly these keys.
 * An agent reading a QR code reads data someone else made, carried by hand: so the text is parsed, never interpreted,
 * and anything outside the shape below is refused before a byte of it is used.
 *
 *   { "v": 1, "kind": "pki.sgit.ai/qr/sealed/v1", "to": "sha256:<16 hex>", "from": "sha256:<16 hex>", "code": "m1.…" }
 *   { "v": 1, "kind": "pki.sgit.ai/qr/key/v1", "fp": "sha256:<16 hex>", "label": "<80 printable characters>", "code": "k1.…" }
 *
 * "to" and "from" repeat what the sealed code says (the recipient's fingerprint and the signer's), and must agree with
 * it; the code is what is opened, and its signature is what is trusted. A pki.sgit.ai link (/m/#m1.…, /send/#k1.…) is
 * read too, and turned into the same object, for a QR code made for a phone.
 */
export const QR_SEALED = 'pki.sgit.ai/qr/sealed/v1', QR_KEY = 'pki.sgit.ai/qr/key/v1'
const FPX = /^sha256:[0-9a-f]{16}$/, M1X = /^m1\.[0-9a-f]{16}(\.[A-Za-z0-9_-]+){3}(\.[A-Za-z0-9_-]+\.[0-9a-f]{16})?$/, K1X = /^k1\.[A-Za-z0-9_-]{100,1200}\.[A-Za-z0-9_-]{60,200}\.[A-Za-z0-9_-]{0,200}$/
export function qrSealed({ to, from = '', code }) { const o = { v: 1, kind: QR_SEALED, to }; if (from) o.from = from; o.code = code; return JSON.stringify(o) }
export function qrKey({ fp, label = '', code }) { return JSON.stringify({ v: 1, kind: QR_KEY, fp, label: String(label).slice(0, 80), code }) }
export function parseQrText(text) {
    const s = String(text == null ? '' : text).trim()
    if (s.length > 3000) throw new Error('longer than any QR code this site makes: refused')
    if (s.startsWith('{')) {
        let o; try { o = JSON.parse(s) } catch (e) { throw new Error('not JSON: refused') }
        if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('not a JSON object: refused')
        const keys = Object.keys(o).sort().join(','), allowed = o.kind === QR_SEALED ? ['code', 'from', 'kind', 'to', 'v'] : o.kind === QR_KEY ? ['code', 'fp', 'kind', 'label', 'v'] : null
        if (!allowed) throw new Error('an unknown kind of QR code: refused')
        if (o.v !== 1) throw new Error('an unknown version: refused')
        if (keys.split(',').some(k => !allowed.includes(k))) throw new Error(`unexpected fields (${keys}): refused`)
        for (const k of Object.keys(o)) if (k !== 'v' && typeof o[k] !== 'string') throw new Error(`${k} is not a string: refused`)
        if (o.kind === QR_SEALED) {
            if (!FPX.test(o.to || '') || (o.from != null && !FPX.test(o.from)) || !M1X.test(o.code || '')) throw new Error('a field is not in its shape: refused')
            const c = parseCode(o.code)
            if (!c || c.to !== o.to || (o.from && c.signer !== o.from)) throw new Error('to or from does not match the sealed code: refused')
            return { kind: 'sealed', to: o.to, from: o.from || c.signer || '', code: o.code }
        }
        if (!FPX.test(o.fp || '') || !K1X.test(o.code || '') || /[\u0000-\u001f\u007f]/.test(o.label || '') || String(o.label || '').length > 80) throw new Error('a field is not in its shape: refused')
        return { kind: 'key', fp: o.fp, label: o.label || '', code: o.code }
    }
    const m = /^https:\/\/pki\.sgit\.ai\/(m|send)\/(?:index\.html)?#((?:m1|k1)\.[A-Za-z0-9_.-]+)$/.exec(s) || /^((m1|k1)\.[A-Za-z0-9_.-]+)$/.exec(s) && [null, null, s]
    if (!m) throw new Error('neither a pki.sgit.ai QR object nor a pki.sgit.ai link: refused')
    const code = m[2]
    if (code.startsWith('m1.')) { if (!M1X.test(code)) throw new Error('a sealed code not in its shape: refused'); const c = parseCode(code); return { kind: 'sealed', to: c.to, from: c.signer || '', code } }
    if (!K1X.test(code)) throw new Error('a key code not in its shape: refused')
    return { kind: 'key', fp: '', label: '', code }
}
export { unhex }
// ------------------------------------------------------------ vault keys in text: found, so they travel as files
/** A vault key in text, prefixed or as passphrase:vault-id alone. The prefix is split so this file holds no key-shaped literal. */
export const VAULT_KEY_RE = new RegExp('(?:sgit_private_' + 'vault_)?\\b([a-z0-9]{16,64}):([a-z0-9]{6,32})\\b', 'g')
const PREFIXED = (pass, id) => 'sgit_private_' + 'vault_' + pass + ':' + id
/** Every vault key in a text: [{ id, key (prefixed, the form sgit takes) }], and the text with each one replaced by a
    placeholder naming only its vault id. */
export function vaultKeysIn(text) {
    const keys = [], seen = new Set()
    const redacted = String(text || '').replace(VAULT_KEY_RE, (_, pass, id) => { if (!seen.has(id)) { seen.add(id); keys.push({ id, key: PREFIXED(pass, id) }) } return `‹the vault key of ${id}: sent as a file, not shown›` })
    return { keys, text: redacted }
}
/** The file a vault key travels in. */
export const vaultKeyFile = k => ({ name: `vault-key-${k.id}.txt`, type: 'text/plain', data: b64(utf8(k.key + '\n')) })
