/**
 * local.js: an account kept in this browser only, opened by the passkey alone. No access key, no vault, no passphrase.
 *
 * The passkey's PRF bytes already give a door (door.js). When no vault answers at that door, the same seed gives a key
 * for this browser's own copy of the account:
 *
 *     passkey ──PRF──▶ door seed ──HKDF("pki.sgit.ai/local/v1")──▶ AES-256-GCM key ──▶ localStorage["pki.local.v1.<door id>"]
 *
 * What is in it (one JSON object, encrypted as a whole, iv || ciphertext || tag as base64):
 *   { v: 1, created, profile: { username, name, blurb, avatar }, keys: [{ label, role, persona_of, created, encrypt, sign }],
 *     default, book: { record: { fp: [statement] }, contacts: { fp: contact }, agents: { fp: submission } } }
 * where encrypt and sign are the private halves as base64 PKCS#8; the public halves and the fingerprints are recomputed
 * from them every time, never stored to be trusted.
 *
 * It travels nowhere: another browser, or this one after its site data is cleared, has none of it. The page asks the
 * browser to keep it (navigator.storage.persist()), and moves it into a vault, then removes it, when the person has an
 * access key. Nothing here is readable without the passkey: the storage key is a random-looking id, the value ciphertext.
 *
 * @module local
 */
import * as K from './keys.js'
import { hkdf, unhex, sha256, aesEncrypt, aesDecrypt } from './door.js'

export const PREFIX = 'pki.local.v1.'
const store = () => { try { return globalThis.localStorage } catch (e) { return null } }
const keyName = door => PREFIX + door.vaultId
const now = () => new Date().toISOString()

/** The AES key for this browser's copy, from the door's seed (never from the vault passphrase, which opens the door). */
export async function localKey(door) { return hkdf(unhex(door.seed), await sha256('pki.sgit.ai'), 'pki.sgit.ai/local/v1', 32) }
export const empty = () => ({ v: 1, created: now(), profile: { username: '', name: '', blurb: '', avatar: '' }, keys: [], default: '', book: { record: {}, contacts: {}, agents: {} } })

export function exists(door) { const s = store(); return !!(s && s.getItem(keyName(door))) }
export async function read(door) {
    const s = store(), raw = s && s.getItem(keyName(door))
    if (!raw) return null
    const box = JSON.parse(raw)
    const plain = await aesDecrypt(await localKey(door), K.unb64(box.ct))
    return JSON.parse(K.fromUtf8(plain))
}
export async function write(door, account) {
    const s = store(); if (!s) throw new Error('this browser keeps no local storage (a private window?)')
    const ct = await aesEncrypt(await localKey(door), K.utf8(JSON.stringify(account)))
    s.setItem(keyName(door), JSON.stringify({ v: 1, door: door.vaultId, updated: now(), ct: K.b64(ct) }))
}
export function remove(door) { const s = store(); if (s) s.removeItem(keyName(door)) }
/** Ask the browser not to clear this site's storage under pressure. true, false, or null when it cannot be asked. */
export async function persist() { try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : null } catch (e) { return null } }
export async function persisted() { try { return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null } catch (e) { return null } }

/** A kept key back to an identity: { bundle, private, created, label, role, persona_of }. */
export async function identityOf(k) {
    const enc = K.unb64(k.encrypt), sig = K.unb64(k.sign)
    return { bundle: await K.publicFromPrivate(enc, sig, k.label || ''), private: { encrypt: enc, sign: sig }, created: k.created || 0, label: k.label || '', role: k.role || '', persona_of: k.persona_of || '' }
}
export const keptOf = (id, { role = '', persona_of = '' } = {}) => ({ label: id.bundle.label || '', role, persona_of, created: id.created || Date.now(), encrypt: K.b64(id.private.encrypt), sign: K.b64(id.private.sign) })
