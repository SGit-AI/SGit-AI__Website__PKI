/**
 * delegation.js: signing in elsewhere with a key from this register, and checking it, with no server in between.
 *
 * A site (the client) makes a key pair in its browser and sends the person to pki.sgit.ai/authorize/ with a request.
 * There, signed in with their passkey, the person reads who asks and for what, and signs a delegation with their own
 * key: "this browser key acts for me at this site, for these uses, until this date". The site keeps it, and every note
 * the browser key signs carries it. Anyone checks a note against the register, starting from a root they pinned:
 *
 *   soft     the delegation's signature checks against the issuer's key in the register, the issuer chains to the
 *            root, the audience is the site and the date holds. Good for low stakes; it cannot be taken back early.
 *   strong   all of that, and the issuer's record, today, holds a live "delegates" link to that browser key naming this
 *            very delegation (by its hash) and what it may do. Withdrawing the link ends it, everywhere, at the next
 *            check: nobody keeps a revocation list, absence is the answer. The verifier fetches the issuer's record
 *            anyway, for its key, so the check costs nothing more.
 *   check: "live"   a delegation that says so is worth nothing unless the issuer's record lists it: a stolen copy dies
 *            when the link is withdrawn. Anything that may delegate further is live.
 *
 * The record lists the browser key and the delegation's hash, never the site: holding the delegation, you can check it;
 * reading the register, you learn nothing of where the person signs in.
 *
 *   parseRequest(text)                     the authorize request, strict (fields, shapes, return on the client's origin)
 *   makeDelegation(issuer, req, opts)      signed by the issuer: { v, kind, iss, iss_name, to, key, aud, can, from, until, check, nonce, sig }
 *   delegationId(d)                        sha256 over the whole signed delegation: what a "delegates" link names
 *   checkDelegation(d, { g, root, origin, asOf })   { ok, level: strong|soft|not-vouched|invalid, why, … }
 *   signNote(browserId, payload, d)        a note signed by the browser key, carrying its delegation
 *   verifyNote(note, { g, root, origin, need })     { ok, level, why, payload, by, iss }
 *
 * @module delegation
 */
import { canon, canonicalBytes, signStatement, verifyStatement, statementId, signBytes, verifyBytes, b64, unb64, utf8, FP } from './keys.js'
import { parseKeyCode, keyCode } from './message.js'
import { trustFrom, validUntil } from './directory.js'

export const REQUEST = 'pki.sgit.ai/authorize/v1'
export const AUTHORIZED = 'pki.sgit.ai/authorized/v1'
export const DENIED = 'pki.sgit.ai/denied/v1'
export const DELEGATION = 'pki.sgit.ai/delegation/v1'
export const SIGNED = 'pki.sgit.ai/signed/v1'
export const CAN = /^(identity|delegate|sign(:[a-z0-9-]{1,32})?)$/
const NONCE = /^[A-Za-z0-9_-]{16,64}$/
const DATE = /^\d{4}-\d\d-\d\d$/
const day = (n, from = Date.now()) => new Date(from + n * 86400000).toISOString().slice(0, 10)

/** What a capability means, in words for the consent card. */
export const CAN_TEXT = c => c === 'identity' ? 'know who you are: your name and your key'
    : c === 'delegate' ? 'vouch for other keys in your name (keys of keys): only while you vouch for it'
    : c === 'sign' ? 'sign as you, from this browser'
    : `sign ${c.slice(5)} as you, from this browser`

/** An origin a request may come from: https, or http on this machine (for tests and local tools). */
function originOf(url) {
    let u; try { u = new URL(url) } catch (e) { return null }
    if (u.protocol === 'https:' || (u.protocol === 'http:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname))) return u.origin
    return null
}

/** The request a site sends, read strictly: nothing it does not name, every field in its shape. */
export async function parseRequest(text) {
    let r; try { r = typeof text === 'string' ? JSON.parse(text) : text } catch (e) { throw new Error('the request is not JSON') }
    const allowed = ['v', 'kind', 'client', 'return', 'key', 'label', 'can', 'days', 'nonce']
    if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error('the request is not one JSON object')
    for (const k of Object.keys(r)) if (!allowed.includes(k)) throw new Error(`the request carries a field it should not: ${k}`)
    if (r.v !== 1 || r.kind !== REQUEST) throw new Error('not a pki.sgit.ai sign-in request')
    const client = originOf(r.client)
    if (!client || client !== r.client.replace(/\/$/, '')) throw new Error('client must be an origin: https://host (no path)')
    if (originOf(r.return) !== client) throw new Error(`the return address is not on ${client}: refused, so a reply can only go to the site that asked`)
    if (!Array.isArray(r.can) || !r.can.length || r.can.length > 8 || !r.can.every(c => typeof c === 'string' && CAN.test(c))) throw new Error('can is a list of up to 8 uses: identity, sign, sign:<word>, delegate')
    const days = r.days == null ? 30 : r.days
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('days is 1 to 365')
    if (!NONCE.test(String(r.nonce))) throw new Error('the nonce is 16 to 64 characters of base64url')
    if (r.label != null && (typeof r.label !== 'string' || r.label.length > 80)) throw new Error('label is up to 80 characters')
    const bundle = await parseKeyCode(String(r.key || ''))
    if (!bundle) throw new Error('key is not a k1 key code')
    return { client, return: r.return, bundle, key: keyCode(bundle).code, label: r.label || '', can: [...new Set(r.can)], days, nonce: r.nonce }
}

/** The delegation, signed by the issuer (an identity from the vault: { bundle, private: { sign } }). */
export async function makeDelegation(issuer, req, { live = false, name = '', from = Date.now() } = {}) {
    const d = { v: 1, kind: DELEGATION, iss: issuer.bundle.signing_fingerprint, iss_name: String(name || issuer.bundle.label || '').slice(0, 120),
        to: req.bundle.signing_fingerprint, key: req.key, aud: req.client, can: req.can, from: day(0, from), until: day(req.days, from),
        check: live || req.can.includes('delegate') ? 'live' : 'offline', nonce: req.nonce }
    return signStatement(d, issuer.private.sign)
}
export const delegationId = d => statementId(d)

function shape(d) {
    const keys = ['v', 'kind', 'iss', 'iss_name', 'to', 'key', 'aud', 'can', 'from', 'until', 'check', 'nonce', 'sig']
    if (!d || typeof d !== 'object' || Object.keys(d).some(k => !keys.includes(k))) return 'not a delegation (fields it should not carry)'
    if (d.v !== 1 || d.kind !== DELEGATION) return 'not a pki.sgit.ai delegation'
    if (!FP.test(String(d.iss)) || !FP.test(String(d.to))) return 'iss and to are key fingerprints'
    if (!originOf(d.aud)) return 'aud is an origin'
    if (!Array.isArray(d.can) || !d.can.every(c => CAN.test(String(c)))) return 'can is a list of uses'
    if (!DATE.test(String(d.from)) || !DATE.test(String(d.until)) || d.until < d.from) return 'from and until are dates'
    if (d.check !== 'live' && d.check !== 'offline') return 'check is live or offline'
    return null
}

/**
 * How far to believe a delegation. g: the register's graph built from the pinned root alone (graph(records,
 * { anchors: [root] })); origin: where it is being used (omit to skip the audience check, as a register page would).
 */
export async function checkDelegation(d, { g, root, origin = null, asOf = new Date().toISOString().slice(0, 10) }) {
    const bad = why => ({ ok: false, level: 'invalid', why })
    const s = shape(d); if (s) return bad(s)
    if (origin && d.aud !== origin) return bad(`it was given to ${d.aud}, not to ${origin}`)
    if (asOf < d.from) return bad(`not valid before ${d.from}`)
    if (asOf > d.until) return bad(`it ended on ${d.until}`)
    const kb = await parseKeyCode(d.key).catch(() => null)
    if (!kb || kb.signing_fingerprint !== d.to) return bad('the key it carries is not the key it names')
    const iss = g.people.get(d.iss)
    if (!iss) return bad(`the issuer ${d.iss} is not in the register (or its record does not read, or is withdrawn)`)
    if (!await verifyStatement(d, iss.bundle.sign)) return bad('the issuer’s signature does not check')
    const t = trustFrom(g, d.iss, root)
    if (!t.ok) return bad(`the issuer does not chain to the pinned root: ${t.why}`)
    const id = await delegationId(d)
    const link = (iss.links || []).find(l => l.method === 'delegates' && l.to === d.to && l.delegation === id)
    const base = { iss: d.iss, iss_name: iss.name, to: d.to, aud: d.aud, can: d.can, until: d.until, chain: t.chain, id }
    if (link && validUntil(link) >= asOf) return { ok: true, level: 'strong', why: `vouched for, today, in ${iss.name}’s record, until ${validUntil(link)}`, ...base, vouched_until: validUntil(link) }
    if (d.check === 'live') return { ok: false, level: 'not-vouched', why: `${iss.name}’s record does not list it today: withdrawn, or not published yet`, ...base }
    return { ok: true, level: 'soft', why: `signed by ${iss.name}, valid until ${d.until}; not listed in their record, so it cannot be withdrawn early`, ...base }
}

/** A note signed by the browser key (identity: { bundle, private: { sign } }), carrying the delegation that vouches for it. */
export async function signNote(browserId, payload, d) {
    const body = { v: 1, kind: SIGNED, by: browserId.bundle.signing_fingerprint, aud: d.aud, at: new Date().toISOString(), payload }
    const sig = b64(await signBytes(browserId.private.sign, utf8(canon(body) + '\n')))
    return { ...body, sig, delegation: d }
}
/** need: a capability the use requires (e.g. "sign:feedback"); sign covers every sign:<word>. */
export async function verifyNote(note, { g, root, origin = null, need = null, asOf } = {}) {
    if (!note || note.kind !== SIGNED || !note.delegation) return { ok: false, level: 'invalid', why: 'not a signed note' }
    const { sig, delegation, ...body } = note
    const d = delegation
    if (body.by !== d.to) return { ok: false, level: 'invalid', why: 'signed by a key the delegation does not name' }
    if (body.aud !== d.aud) return { ok: false, level: 'invalid', why: 'the note names another site than its delegation' }
    const kb = await parseKeyCode(d.key).catch(() => null)
    if (!kb || !await verifyBytes(kb.sign, unb64(String(sig)), utf8(canon(body) + '\n')).catch(() => false)) return { ok: false, level: 'invalid', why: 'the note’s signature does not check: changed after it was signed, or not that key' }
    const c = await checkDelegation(d, { g, root, origin, asOf })
    if (!c.ok) return { ...c, payload: body.payload, by: body.by }
    if (need && !(d.can.includes(need) || (need.startsWith('sign:') && d.can.includes('sign')))) return { ok: false, level: 'invalid', why: `the delegation does not allow ${need}`, payload: body.payload }
    return { ...c, payload: body.payload, by: body.by, at: body.at }
}
