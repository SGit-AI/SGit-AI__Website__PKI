/**
 * message.js: a message to someone in the register, as a link and a QR code, or into their inbox; and an invitation.
 *
 * A message is JSON, signed by the sender when the sender has a key, then sealed in sgit's hybrid v2 envelope to the
 * recipient's encryption key:
 *
 *     inner   { v: 1, kind: "pki.sgit.ai/message/v1", to, from?, at, subject?, text, files?: [{ name, type, data (base64) }],
 *               grant?: { service: "sg-send", endpoint, token, name? }, sig? }
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
export async function compose({ to, from = null, subject = '', text = '', files = [], grant = null, at = new Date().toISOString() }) {
    const msg = { v: 1, kind: KIND, to: to.signing_fingerprint, at, text: String(text) }
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
export { unhex }
