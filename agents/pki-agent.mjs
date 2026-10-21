#!/usr/bin/env node
/**
 * pki-agent: an agent's identity on pki.sgit.ai, from the command line. One file, no dependencies, Node 18+.
 *
 *     curl -sO https://pki.sgit.ai/agents/pki-agent.mjs && node pki-agent.mjs help
 *
 * The agent makes its own key here; the private halves never leave the machine it runs on. What it hands out is its
 * public record, signed: an identity (kind "agent") and a link to the key that operates it. Its operator confirms it
 * from their vault (pki.sgit.ai/vault/, the Agents tab) with a link back, method "operates", and an end date; from
 * then until that date the register shows the agent as operated by them.
 *
 * Keys are kept where the sgit CLI keeps them (~/.sg-send/keys/sha256_<encryption fp>/, the same five files), so
 * `sgit pki` uses the same key; the private halves are encrypted with SG_SEND_PASSPHRASE when it is set (as sgit
 * does) and written plain, mode 0600, when it is not. The agent's own statements are kept in ~/.sg-send/pki/.
 * PKI_AGENT_HOME moves both; PKI_REGISTER points at another register (default https://pki.sgit.ai/).
 *
 * A key that must outlive one machine (a cloud session is a fresh container each time) travels as PKI_AGENT_KEY: the
 * output of `keyfile`, the two private halves encrypted with SG_SEND_PASSPHRASE, set as a secret in the environment
 * the agent runs in. Whoever sets that secret holds the key in custody; a session key avoids it altogether.
 *
 * THIS FILE is generated from this file and assets/people/ by admin/build/gen_agent_tool.mjs: the same
 * code the site runs, in one file.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'

// ---------------------------------------------------------------- assets/people/keys.js
const __keys = (() => {
/**
 * keys.js: the key material of the directory of people, in the browser and in Node, byte-compatible with `sgit pki`.
 *
 * Everything here is Web Crypto and nothing else. Each construction was checked against sgit-ai v0.23.0 (the
 * PKI__Crypto and PKI__Key_Store classes it ships) by admin/build/test_people.mjs, which runs the sgit CLI on what
 * this file makes and makes what the CLI reads:
 *
 *   encryption pair     RSA-OAEP 4096, e = 65537, SHA-256                          (sgit: generate_encryption_key_pair)
 *   signing pair        ECDSA P-256, SHA-256, signatures raw r||s, 64 bytes        (sgit: sign / verify)
 *   fingerprint         "sha256:" + the first 16 hex of SHA-256 over the DER SPKI  (sgit: compute_fingerprint)
 *   public bundle       { v: 1, encrypt, sign, label, fingerprint, signing_fingerprint }   (sgit pki export)
 *   private halves      PKCS#8 PEM, passphrase-encrypted as PBES2: PBKDF2-HMAC-SHA256 and AES-256-CBC, the form
 *                       python-cryptography's BestAvailableEncryption writes and sgit's key store reads
 *   the envelope        sgit's hybrid v2: base64 of { v: 2, w, i, c[, s, f] }; a fresh AES-256-GCM key encrypts,
 *                       RSA-OAEP wraps it; s is the sender's ECDSA signature over c, f the sender's signing fingerprint
 *   statements          the register's: canonical bytes are `jq -cS 'del(.sig)'` plus the newline jq ends with; the
 *                       statement id is "sha256:" + SHA-256 over `jq -cS .` of the whole statement, sig included
 *
 * Records in the register are keyed by the SIGNING fingerprint (registry/params.json); sgit's key store folders are
 * named by the ENCRYPTION fingerprint. Both are in every bundle, and the code says which one it means.
 *
 * @module keys
 */
const te = new TextEncoder(), td = new TextDecoder()
const subtle = () => globalThis.crypto.subtle
const random = n => globalThis.crypto.getRandomValues(new Uint8Array(n))

// ------------------------------------------------------------ bytes
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
const unhex = s => Uint8Array.from(String(s).match(/../g) || [], h => parseInt(h, 16))
function b64(bytes) { let s = ''; for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b); return btoa(s) }
function unb64(s) { const bin = atob(String(s).replace(/\s/g, '')); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out }
const b64url = bytes => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64url = s => unb64(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4))
const utf8 = s => te.encode(s)
const fromUtf8 = b => td.decode(b)
async function sha256(data) { return new Uint8Array(await subtle().digest('SHA-256', typeof data === 'string' ? te.encode(data) : data)) }
const sha256hex = async data => hex(await sha256(data))

// ------------------------------------------------------------ PEM, as python-cryptography writes it
function pem(der, label) {
    const body = b64(der).match(/.{1,64}/g).join('\n')
    return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`
}
function unpem(text) {
    const m = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/.exec(String(text || ''))
    if (!m) throw new Error('not a PEM block')
    return { label: m[1], der: unb64(m[2]) }
}

/** sgit's fingerprint of a public key: SPKI bytes or a PEM. */
async function fingerprint(spkiOrPem) {
    const der = typeof spkiOrPem === 'string' ? unpem(spkiOrPem).der : new Uint8Array(spkiOrPem)
    return 'sha256:' + (await sha256hex(der)).slice(0, 16)
}
const FP = /^sha256:[0-9a-f]{16}$/
/** The folder name a record lives in: a ':' breaks Windows checkouts (registry/params.json, record_dirname). */
const dirOf = fp => String(fp).replace(':', '-')
const fpOfDir = d => String(d).replace(/^sha256-/, 'sha256:')

// ------------------------------------------------------------ algorithms
const RSA_GEN = { name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
const RSA = { name: 'RSA-OAEP', hash: 'SHA-256' }
const EC = { name: 'ECDSA', namedCurve: 'P-256' }
const ECDSA = { name: 'ECDSA', hash: 'SHA-256' }

const importEncPublic = spki => subtle().importKey('spki', spki, RSA, false, ['encrypt'])
const importEncPrivate = pkcs8 => subtle().importKey('pkcs8', pkcs8, RSA, false, ['decrypt'])
const importSignPublic = spki => subtle().importKey('spki', spki, EC, false, ['verify'])
const importSignPrivate = pkcs8 => subtle().importKey('pkcs8', pkcs8, EC, false, ['sign'])

// ------------------------------------------------------------ the identity: two pairs, one bundle
/**
 * A new identity, made here: { bundle, private: { encrypt, sign } (PKCS#8 bytes), created }.
 * RSA-4096 generation takes a few seconds in a browser; the caller says so on the page.
 */
async function generate(label = '') {
    const enc = await subtle().generateKey(RSA_GEN, true, ['encrypt', 'decrypt'])
    const sig = await subtle().generateKey(EC, true, ['sign', 'verify'])
    const encSpki = new Uint8Array(await subtle().exportKey('spki', enc.publicKey))
    const sigSpki = new Uint8Array(await subtle().exportKey('spki', sig.publicKey))
    return {
        bundle: await bundleOf(encSpki, sigSpki, label),
        private: { encrypt: new Uint8Array(await subtle().exportKey('pkcs8', enc.privateKey)), sign: new Uint8Array(await subtle().exportKey('pkcs8', sig.privateKey)) },
        created: Date.now(),
    }
}
/** The public bundle, in the shape `sgit pki export` emits. */
async function bundleOf(encSpki, sigSpki, label = '') {
    return { v: 1, encrypt: pem(encSpki, 'PUBLIC KEY'), sign: pem(sigSpki, 'PUBLIC KEY'), label: String(label || ''),
             fingerprint: await fingerprint(encSpki), signing_fingerprint: await fingerprint(sigSpki) }
}
/** A bundle checked: both keys parse as what they claim, and both fingerprints are theirs. Returns a list of problems. */
async function checkBundle(bundle) {
    const out = []
    if (!bundle || bundle.v !== 1) return ['not a v1 public-key bundle']
    try { await importEncPublic(unpem(bundle.encrypt).der) } catch (e) { out.push('the encryption key is not an RSA-OAEP public key') }
    try { await importSignPublic(unpem(bundle.sign).der) } catch (e) { out.push('the signing key is not an ECDSA P-256 public key') }
    if (out.length) return out
    if (await fingerprint(bundle.encrypt) !== bundle.fingerprint) out.push('fingerprint is not the encryption key’s')
    if (await fingerprint(bundle.sign) !== bundle.signing_fingerprint) out.push('signing_fingerprint is not the signing key’s')
    const { modulusLength } = (await subtle().importKey('spki', unpem(bundle.encrypt).der, RSA, true, ['encrypt'])).algorithm
    if (modulusLength < 3072) out.push(`the encryption key is ${modulusLength}-bit; sgit makes 4096`)
    return out
}
/** The public halves recomputed from the private ones (so an import needs only the two private PEMs). */
async function publicFromPrivate(encPkcs8, signPkcs8, label = '') {
    const ej = await subtle().exportKey('jwk', await subtle().importKey('pkcs8', encPkcs8, RSA, true, ['decrypt']))
    const sj = await subtle().exportKey('jwk', await subtle().importKey('pkcs8', signPkcs8, EC, true, ['sign']))
    const encPub = await subtle().importKey('jwk', { kty: 'RSA', n: ej.n, e: ej.e, alg: 'RSA-OAEP-256', ext: true }, RSA, true, ['encrypt'])
    const sigPub = await subtle().importKey('jwk', { kty: 'EC', crv: 'P-256', x: sj.x, y: sj.y, ext: true }, EC, true, ['verify'])
    return bundleOf(new Uint8Array(await subtle().exportKey('spki', encPub)), new Uint8Array(await subtle().exportKey('spki', sigPub)), label)
}

// ------------------------------------------------------------ DER, as much as PBES2 needs
function derLen(n) { if (n < 128) return [n]; const b = []; while (n) { b.unshift(n & 255); n >>= 8 } return [0x80 | b.length, ...b] }
const tlv = (tag, body) => Uint8Array.from([tag, ...derLen(body.length), ...body])
const seq = (...parts) => tlv(0x30, concat(...parts))
const octets = b => tlv(0x04, b)
function int(n) { const b = []; do { b.unshift(n & 255); n = Math.floor(n / 256) } while (n); if (b[0] & 0x80) b.unshift(0); return tlv(0x02, Uint8Array.from(b)) }
function oid(dotted) {
    const p = dotted.split('.').map(Number), out = [40 * p[0] + p[1]]
    for (const v of p.slice(2)) { const s = [v & 127]; let x = v >> 7; while (x) { s.unshift(0x80 | (x & 127)); x >>= 7 } out.push(...s) }
    return tlv(0x06, Uint8Array.from(out))
}
const NULL = Uint8Array.from([0x05, 0x00])
function concat(...parts) { const n = parts.reduce((s, p) => s + p.length, 0), out = new Uint8Array(n); let i = 0; for (const p of parts) { out.set(p, i); i += p.length } return out }
/** One TLV at offset: { tag, start (of content), end, kids() }. */
function read(buf, at = 0) {
    const tag = buf[at]; let len = buf[at + 1], i = at + 2
    if (len & 0x80) { const n = len & 127; len = 0; for (let k = 0; k < n; k++) len = len * 256 + buf[i++] }
    const node = { tag, start: i, end: i + len, bytes: buf.subarray(i, i + len) }
    node.kids = () => { const out = []; let p = node.start; while (p < node.end) { const k = read(buf, p); out.push(k); p = k.end } return out }
    return node
}
function oidText(bytes) {
    const out = [Math.floor(bytes[0] / 40), bytes[0] % 40]; let v = 0
    for (const b of bytes.subarray(1)) { v = v * 128 + (b & 127); if (!(b & 0x80)) { out.push(v); v = 0 } }
    return out.join('.')
}
const intOf = bytes => [...bytes].reduce((s, b) => s * 256 + b, 0)
const OID = { pbes2: '1.2.840.113549.1.5.13', pbkdf2: '1.2.840.113549.1.5.12', hmacSha256: '1.2.840.113549.2.9', hmacSha1: '1.2.840.113549.2.7',
              aes256cbc: '2.16.840.1.101.3.4.1.42', aes128cbc: '2.16.840.1.101.3.4.1.2' }

/**
 * A PKCS#8 private key encrypted with a passphrase, as "ENCRYPTED PRIVATE KEY" PEM: PBES2, PBKDF2-HMAC-SHA256,
 * AES-256-CBC. python-cryptography (and so sgit's key store) reads it; the iteration count is in the file.
 */
async function encryptPrivate(pkcs8, passphrase, iterations = 210000) {
    if (!passphrase) throw new Error('a passphrase is required: sgit keeps private keys encrypted at rest')
    const salt = random(16), iv = random(16)
    const base = await subtle().importKey('raw', te.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
    const key = await subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, { name: 'AES-CBC', length: 256 }, false, ['encrypt'])
    const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-CBC', iv }, key, pkcs8))
    const alg = seq(oid(OID.pbes2), seq(seq(oid(OID.pbkdf2), seq(octets(salt), int(iterations), seq(oid(OID.hmacSha256), NULL))), seq(oid(OID.aes256cbc), octets(iv))))
    return pem(seq(alg, octets(ct)), 'ENCRYPTED PRIVATE KEY')
}
/** The reverse, for sgit's own files (and for a plain "PRIVATE KEY" PEM, which needs no passphrase). PKCS#8 bytes out. */
async function decryptPrivate(text, passphrase) {
    const { label, der } = unpem(text)
    if (label === 'PRIVATE KEY') return der
    if (label !== 'ENCRYPTED PRIVATE KEY') throw new Error(`a ${label.toLowerCase()} PEM is not a PKCS#8 private key`)
    const [alg, data] = read(der).kids()
    const [algId, params] = alg.kids()
    if (oidText(algId.bytes) !== OID.pbes2) throw new Error('only PBES2-encrypted keys are read here (sgit writes PBES2)')
    const [kdf, enc] = params.kids()
    const [kdfId, kdfParams] = kdf.kids()
    if (oidText(kdfId.bytes) !== OID.pbkdf2) throw new Error('only PBKDF2 is read here')
    const kp = kdfParams.kids()
    const salt = kp[0].bytes, iterations = intOf(kp[1].bytes)
    const prfNode = kp.find(k => k.tag === 0x30)
    const prf = prfNode ? oidText(prfNode.kids()[0].bytes) : OID.hmacSha1
    const hash = prf === OID.hmacSha256 ? 'SHA-256' : prf === OID.hmacSha1 ? 'SHA-1' : null
    if (!hash) throw new Error('unknown PBKDF2 hash')
    const [encId, ivNode] = enc.kids()
    const cipher = oidText(encId.bytes), length = cipher === OID.aes256cbc ? 256 : cipher === OID.aes128cbc ? 128 : 0
    if (!length) throw new Error('only AES-CBC-encrypted keys are read here')
    const base = await subtle().importKey('raw', te.encode(passphrase || ''), 'PBKDF2', false, ['deriveKey'])
    const key = await subtle().deriveKey({ name: 'PBKDF2', hash, salt, iterations }, base, { name: 'AES-CBC', length }, false, ['decrypt'])
    try { return new Uint8Array(await subtle().decrypt({ name: 'AES-CBC', iv: ivNode.bytes }, key, data.bytes)) }
    catch (e) { throw new Error('wrong passphrase, or not this key') }
}

// ------------------------------------------------------------ sgit's key store, on disk
/**
 * The five files of one key in sgit's key store (~/.sg-send/keys/sha256_<encryption fp>/), private halves encrypted
 * with the passphrase. Returns { folder, files: { name: text } }.
 */
async function keystoreFiles(identity, passphrase) {
    const b = identity.bundle
    return {
        folder: b.fingerprint.replace(':', '_'),
        files: {
            'metadata.json': JSON.stringify({ label: b.label, algorithm: 'RSA-OAEP', key_size: 4096, encryption_fingerprint: b.fingerprint,
                                              signing_fingerprint: b.signing_fingerprint, created: identity.created || 0 }, null, 2),
            'private_key.pem': await encryptPrivate(identity.private.encrypt, passphrase),
            'public_key.pem': b.encrypt,
            'signing_private.pem': await encryptPrivate(identity.private.sign, passphrase),
            'signing_public.pem': b.sign,
        },
    }
}
/** A shell script that writes those files where sgit looks for them. Plain text; the private halves stay encrypted. */
function keystoreScript({ folder, files }) {
    const lines = ['#!/bin/sh', '# Writes one key into sgit\'s key store. Made by pki.sgit.ai in your browser; the private halves are', '# encrypted with your passphrase, which this file does not contain. Then: sgit pki list', 'set -e',
        `D="$HOME/.sg-send/keys/${folder}"`, 'mkdir -p "$D"', 'chmod 700 "$HOME/.sg-send/keys" "$D" 2>/dev/null || true']
    for (const [name, text] of Object.entries(files)) lines.push(`cat > "$D/${name}" <<'SGIT_PKI_EOF'`, text.replace(/\n$/, ''), 'SGIT_PKI_EOF')
    lines.push('chmod 600 "$D/private_key.pem" "$D/signing_private.pem"', `echo "written: $D"`)
    return lines.join('\n') + '\n'
}
/** An identity from sgit's two private PEMs (and the passphrase): the public bundle is recomputed, not trusted. */
async function importKeystore({ privateKeyPem, signingPrivatePem, passphrase, label = '', created = 0 }) {
    const encrypt = await decryptPrivate(privateKeyPem, passphrase), sign = await decryptPrivate(signingPrivatePem, passphrase)
    return { bundle: await publicFromPrivate(encrypt, sign, label), private: { encrypt, sign }, created }
}

// ------------------------------------------------------------ signatures
async function signBytes(signPkcs8, bytes) { return new Uint8Array(await subtle().sign(ECDSA, await importSignPrivate(signPkcs8), bytes)) }
async function verifyBytes(signPemOrSpki, sigRaw, bytes) {
    try {
        const spki = typeof signPemOrSpki === 'string' ? unpem(signPemOrSpki).der : signPemOrSpki
        if (sigRaw.length !== 64) return false
        return await subtle().verify(ECDSA, await importSignPublic(spki), sigRaw, bytes)
    } catch (e) { return false }
}

// ------------------------------------------------------------ statements: the register's canonical form
/** Recursively key-sorted compact JSON: jq -cS, byte for byte, for the values a statement may hold. */
function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
    if (typeof v === 'number' && !Number.isInteger(v)) throw new Error('statements carry no non-integer numbers (registry/params.json)')
    return JSON.stringify(v)
}
const canonicalBytes = st => { const { sig, ...rest } = st; return te.encode(canon(rest) + '\n') }
const statementId = async st => 'sha256:' + await sha256hex(te.encode(canon(st) + '\n'))
async function signStatement(st, signPkcs8) { const { sig, ...rest } = st; return { ...rest, sig: b64(await signBytes(signPkcs8, canonicalBytes(rest))) } }
async function verifyStatement(st, signPem) {
    if (!st || typeof st.sig !== 'string') return false
    let raw; try { raw = unb64(st.sig) } catch (e) { return false }
    return verifyBytes(signPem, raw, canonicalBytes(st))
}

// ------------------------------------------------------------ the envelope: sgit's hybrid v2
/**
 * Seal bytes (or text) to a bundle's encryption key. With a signer ({ sign: PKCS#8, fingerprint: signing fp }) it
 * carries s and f exactly as `sgit pki encrypt --fingerprint` does. Returns the .enc text (base64 of the JSON).
 */
async function seal(bundle, data, signer = null) {
    const pub = await importEncPublic(unpem(bundle.encrypt).der)
    const aes = await subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
    const iv = random(12)
    const c = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aes, typeof data === 'string' ? te.encode(data) : data))
    const w = new Uint8Array(await subtle().encrypt(RSA, pub, new Uint8Array(await subtle().exportKey('raw', aes))))
    const env = { v: 2, w: b64(w), i: b64(iv), c: b64(c) }
    if (signer) { env.s = b64(await signBytes(signer.sign, c)); env.f = signer.fingerprint }
    return btoa(JSON.stringify(env))
}
/** The envelope as an object, from the .enc text. */
function parseEnvelope(enc) {
    let env; try { env = JSON.parse(atob(String(enc).trim())) } catch (e) { throw new Error('not an sgit envelope') }
    if (!env || ![1, 2].includes(env.v) || !env.w || !env.i || !env.c) throw new Error('not an sgit envelope')
    return env
}
/**
 * Open an envelope with a private encryption key (PKCS#8). Returns { bytes, text, signed, signer, verified }:
 * verified is true or false only when the signer's bundle was given (signerBundles: [bundle]); otherwise null,
 * which means "not checked" and must never be shown as "forged".
 */
async function unseal(encPkcs8, enc, signerBundles = []) {
    const env = parseEnvelope(enc)
    let raw
    try { raw = await subtle().decrypt(RSA, await importEncPrivate(encPkcs8), unb64(env.w)) } catch (e) { throw new Error('not sealed to this key') }
    const aes = await subtle().importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
    let bytes
    try { bytes = new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: unb64(env.i), tagLength: 128 }, aes, unb64(env.c))) }
    catch (e) { throw new Error('changed on the way: the ciphertext does not check') }
    const out = { bytes, text: null, signed: !!(env.s && env.f), signer: env.f || null, verified: null }
    try { out.text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch (e) { out.text = null }
    if (out.signed) {
        const b = signerBundles.find(x => x && x.signing_fingerprint === env.f)
        if (b) out.verified = await verifyBytes(b.sign, unb64(env.s), unb64(env.c))
    }
    return out
}

return { hex, unhex, b64, unb64, b64url, unb64url, utf8, fromUtf8, sha256, sha256hex, pem, unpem, fingerprint, FP, dirOf, fpOfDir, RSA_GEN, RSA, EC, ECDSA, generate, bundleOf, checkBundle, publicFromPrivate, concat, encryptPrivate, decryptPrivate, keystoreFiles, keystoreScript, importKeystore, signBytes, verifyBytes, canon, canonicalBytes, statementId, signStatement, verifyStatement, seal, parseEnvelope, unseal }
})()

// ---------------------------------------------------------------- assets/people/directory.js
const __directory = (() => {
/**
 * directory.js: what a person's record says, and what the register computes from everybody's records.
 *
 * A record is a folder of signed statements, all by one key, all about that key (rule 1: only the owner writes to
 * their own record). The statement envelope is the register's own, unchanged since v0.1.x:
 *
 *     { v: 1, type, registry: "pki.sgit.ai", record, signer, created_at, body, sig }
 *
 * with record === signer === the signing fingerprint of the identity's bundle. The types a person's record uses:
 *
 *   identity     body { kind: "person" | "agent", name, bundle, about?, runtime?, session?, private_key_published }
 *                                                                                         exactly one, the first
 *   evidence     body { kind: website | github | dns | key | link, value, url? }        a claim that an account is theirs
 *   link         body { to: <fingerprint>, method?, on?, until? }                        "I know the owner of that key"
 *   inbox        body { endpoint, vault, token }                                         where to write to them (an append lane)
 *   revocation   body { revokes: { record, statement }, reason, effective_from }        withdraws one of their own statements,
 *                                                                                         or the identity itself (rule 2)
 *
 * The rule that answers 2019: a link is a statement in the linker's record, never in the other person's. A LINK
 * EXISTS ONLY WHEN BOTH RECORDS HOLD ONE, EACH POINTING AT THE OTHER, NEITHER WITHDRAWN. A one-way link is a claim in
 * the claimant's record and adds nothing to the other person. A verification is a link from an anchor that names a
 * method (in person, a video call, a channel already known to be theirs); it is complete when the person links back.
 * A verification has a date and an end: `until` (yyyy-mm-dd), or a year after `on` when it names none. After it, the
 * person is linked but no longer verified, and the page asks for a re-verification: a new link statement, which
 * replaces the old one. Degrees of separation are computed from the records each time and never stored (rule: a view,
 * not a fact).
 *
 * Agents are records like people's (kind "agent"). An agent is OPERATED by a key when that key's record links to it
 * with method "operates" (and an end date: agents are verified for days or weeks, not a year) and the agent's record
 * links back (method "operated-by"): the same two-way rule. The operator can be a person, or an agent the person
 * operates (a fleet key, so that a person running hundreds of agents does not fill their own record); the chain is
 * followed up to three steps to the person at its root, whose standing the agent's page shows.
 *
 * Personas are a person's other keys (for work, for a project, for a pseudonym): records of kind "person" like any other,
 * tied to the person's master key by the same two-way rule. The master's record links to the persona with method
 * "persona", and the persona's record links back with "persona-of". Either side alone is a claim; both together say
 * one person holds both keys, and the persona's page shows the master's standing, not a standing of its own. A persona
 * that wants to be verified in its own right is verified like anyone else, and that wins.
 *
 * Bounds (rule 3): 16 KiB a statement, 256 statements a record, 150 live links to people and 200 to operated agents
 * a record, 32 live evidence items.
 *
 * Pure functions over parsed JSON and keys.js; runs in the browser and in Node (admin/build/people.mjs).
 *
 * @module directory
 */
const { FP, canon, checkBundle, fingerprint, statementId, signStatement, verifyStatement } = __keys

const REGISTRY = 'pki.sgit.ai'
const TYPES = ['identity', 'evidence', 'link', 'inbox', 'revocation']
const BOUNDS = { statement_bytes: 16384, statements: 256, links: 150, agents: 200, evidence: 32 }
const EVIDENCE = {
    website: { label: 'A website', machine: true, how: 'a file at https://<your domain>/.well-known/pki.sgit.ai.txt containing the proof line' },
    github: { label: 'GitHub', machine: true, how: 'a public gist, owned by your account, containing the proof line' },
    dns: { label: 'A DNS record', machine: true, how: 'a TXT record at _pki.sgit.ai.<your domain> containing the proof line' },
    key: { label: 'A key you publish elsewhere', machine: false, how: 'a URL where you already publish a key (github.com/<you>.keys, keys.openpgp.org, your site)' },
    link: { label: 'A profile', machine: false, how: 'LinkedIn or another profile: a link a person checks, not a machine' },
}
/** The verification methods an anchor may name. Published by name; the details stay in the anchor's vault. */
const METHODS = { 'in-person': 'met in person', 'video-call': 'on a video call', 'known-channel': 'on a channel already known to be theirs', 'invitation': 'through an invitation they accepted', 'known': 'known to me',
                          'operates': 'runs this agent', 'operated-by': 'is the agent of this key',
                          'persona': 'is another key of mine (a persona)', 'persona-of': 'is a persona of this key' }
const AGENT_DAYS = 30
const VERIFYING = ['in-person', 'video-call', 'known-channel']
const VERIFY_DAYS = 365
const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
/** When a verifying link stops verifying: its own `until`, or VERIFY_DAYS after it was made. */
const validUntil = l => l.until || plusDays(l.on || String(l.at).slice(0, 10), l.method === 'operates' ? AGENT_DAYS : VERIFY_DAYS)

/** The proof line evidence carries: the record's fingerprint, so a page, a gist or a TXT record names this key. */
const proofLine = fp => `pki.sgit.ai=${fp}`
const hasProof = (text, fp) => String(text || '').includes(proofLine(fp))

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x)

// ------------------------------------------------------------ writing statements (the owner, in their browser)
/** One statement, signed with the owner's key. identity = { bundle, private: { sign } }. */
async function statement(identity, type, body, at = now()) {
    if (!TYPES.includes(type)) throw new Error(`unknown statement type ${type}`)
    const fp = identity.bundle.signing_fingerprint
    const st = await signStatement({ v: 1, type, registry: REGISTRY, record: fp, signer: fp, created_at: at, body }, identity.private.sign)
    if (new TextEncoder().encode(canon(st) + '\n').length > BOUNDS.statement_bytes) throw new Error('over the 16 KiB bound for one statement')
    return st
}
const identityStatement = (identity, { name, about = '' }, at) =>
    statement(identity, 'identity', { kind: 'person', name: String(name).trim(), about: String(about || '').trim(), bundle: identity.bundle, private_key_published: false }, at)
/** An agent's identity: runtime says where it runs (free text), session that the key lives only as long as one session. */
const agentStatement = (identity, { name, about = '', runtime = '', session = false }, at) =>
    statement(identity, 'identity', { kind: 'agent', name: String(name).trim(), about: String(about || '').trim(), runtime: String(runtime || '').trim(), session: !!session, bundle: identity.bundle, private_key_published: false }, at)
const evidenceStatement = (identity, { kind, value, url = '' }, at) => statement(identity, 'evidence', { kind, value: String(value).trim(), url: String(url || '').trim() }, at)
const linkStatement = (identity, { to, method = '', on = '', until = '' }, at) => statement(identity, 'link', until ? { to, method, on, until } : { to, method, on }, at)
const inboxStatement = (identity, { endpoint, vault, token }, at) => statement(identity, 'inbox', { endpoint, vault, token }, at)
async function withdrawStatement(identity, of, reason = 'withdrawn', at = now()) {
    return statement(identity, 'revocation', { revokes: { record: identity.bundle.signing_fingerprint, statement: typeof of === 'string' ? of : await statementId(of) }, reason, effective_from: at }, at)
}

// ------------------------------------------------------------ reading one record (anyone, anywhere)
/**
 * Check one record: every rule a statement must keep. Returns
 *   { fp, ok, problems, identity, name, bundle, statements: [{ st, id, live }], evidence, links, inbox, revoked, fixture }
 * where evidence, links and inbox are the LIVE ones (not withdrawn). `dir` is the folder's fingerprint, when known.
 */
async function readRecord(statements, { dir = null, fixture = false } = {}) {
    const problems = [], out = { fp: dir, ok: false, problems, identity: null, name: '', bundle: null, statements: [], evidence: [], links: [], inbox: null, revoked: null, fixture: !!fixture }
    if (!Array.isArray(statements) || !statements.length) { problems.push('no statements'); return out }
    if (statements.length > BOUNDS.statements) problems.push(`${statements.length} statements: over the bound of ${BOUNDS.statements} (rule 3)`)
    const sorted = [...statements].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    const ids = sorted.filter(s => isObj(s) && s.type === 'identity')
    if (ids.length !== 1) { problems.push(ids.length ? 'more than one identity statement' : 'no identity statement: a record starts from the key'); return out }
    const idSt = ids[0], bundle = isObj(idSt.body) ? idSt.body.bundle : null
    const bp = await checkBundle(bundle)
    if (bp.length) { problems.push(...bp.map(p => 'identity: ' + p)); return out }
    const fp = bundle.signing_fingerprint
    if (dir && dir !== fp) problems.push(`the folder is ${dir} but the key is ${fp}`)
    out.fp = fp; out.bundle = bundle; out.identity = idSt; out.name = String(idSt.body.name || '')
    if (sorted[0] !== idSt) problems.push('a statement predates the identity')
    const byId = new Map()
    for (const st of sorted) {
        const where = `${st && st.type || '?'} ${st && st.created_at || ''}`.trim()
        if (!isObj(st) || st.v !== 1 || st.registry !== REGISTRY || !TYPES.includes(st.type) || !isObj(st.body) || !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(String(st.created_at))) { problems.push(`${where}: not a register statement`); continue }
        if (st.record !== fp || st.signer !== fp) { problems.push(`${where}: written for ${st.record} by ${st.signer}, in the record of ${fp}: only the owner writes to their own record (rule 1)`); continue }
        try { if (new TextEncoder().encode(canon(st) + '\n').length > BOUNDS.statement_bytes) { problems.push(`${where}: over 16 KiB (rule 3)`); continue } }
        catch (e) { problems.push(`${where}: ${e.message}`); continue }
        if (!await verifyStatement(st, bundle.sign)) { problems.push(`${where}: the signature does not verify (rule 4)`); continue }
        const id = await statementId(st)
        const entry = { st, id, live: true }
        byId.set(id, entry); out.statements.push(entry)
        const p = shapeProblems(st, fp)
        if (p) { problems.push(`${where}: ${p}`); entry.live = false }
    }
    for (const e of out.statements) {                                       // withdrawals: of the owner's own statements only
        if (e.st.type !== 'revocation' || !e.live) continue
        const target = byId.get(e.st.body.revokes.statement)
        if (!target) { problems.push(`revocation ${e.st.created_at}: names a statement not in this record`); continue }
        if (target.st.type === 'identity') out.revoked = { at: e.st.body.effective_from || e.st.created_at, reason: e.st.body.reason || '' }
        target.live = false
    }
    const live = t => out.statements.filter(e => e.live && e.st.type === t)
    out.evidence = live('evidence').map(e => ({ id: e.id, at: e.st.created_at, ...e.st.body }))
    const lastLink = new Map()                                             // the latest live link to each key
    for (const e of live('link')) lastLink.set(e.st.body.to, { id: e.id, at: e.st.created_at, ...e.st.body })
    out.links = [...lastLink.values()]
    const inb = live('inbox'); out.inbox = inb.length ? { id: inb[inb.length - 1].id, ...inb[inb.length - 1].st.body } : null
    const toAgents = out.links.filter(l => l.method === 'operates').length
    if (out.links.length - toAgents > BOUNDS.links) problems.push(`${out.links.length - toAgents} live links: over the bound of ${BOUNDS.links} (rule 3)`)
    if (toAgents > BOUNDS.agents) problems.push(`${toAgents} operated agents: over the bound of ${BOUNDS.agents} (rule 3); use a fleet key`)
    out.kind = idSt.body.kind
    if (out.evidence.length > BOUNDS.evidence) problems.push(`${out.evidence.length} live evidence items: over the bound of ${BOUNDS.evidence} (rule 3)`)
    if (out.revoked) { out.links = []; out.inbox = null }
    out.ok = problems.length === 0
    return out
}
function shapeProblems(st, fp) {
    const b = st.body
    switch (st.type) {
        case 'identity':
            if (b.kind !== 'person' && b.kind !== 'agent') return 'identity kind must be person or agent'
            if (!String(b.name || '').trim()) return 'an identity names who or what it is'
            if (b.kind === 'agent' && (String(b.runtime || '').length > 120 || (b.session != null && typeof b.session !== 'boolean'))) return 'runtime is short text and session a boolean'
            if (String(b.name || '').length > 120 || String(b.about || '').length > 600) return 'the name or about is too long'
            if (b.private_key_published !== false && b.private_key_published !== true) return 'private_key_published must be stated'
            return null
        case 'evidence':
            if (!EVIDENCE[b.kind]) return `unknown evidence kind ${b.kind}`
            if (!String(b.value || '').trim() || String(b.value).length > 300 || String(b.url || '').length > 500) return 'evidence names what it is about, briefly'
            if (b.url && !/^https:\/\//.test(b.url)) return 'an evidence URL is https'
            return null
        case 'link':
            if (!FP.test(String(b.to))) return 'a link names a key fingerprint'
            if (b.to === fp) return 'a link to oneself'
            if (b.method && !METHODS[b.method]) return `unknown method ${b.method}`
            if (b.on && !/^\d{4}-\d\d-\d\d$/.test(b.on)) return 'on is a date, yyyy-mm-dd'
            if (b.until && (!/^\d{4}-\d\d-\d\d$/.test(b.until) || (b.on && b.until < b.on))) return 'until is a date, yyyy-mm-dd, not before on'
            return null
        case 'inbox':
            if (!/^https:\/\/[a-z0-9.-]+$/.test(String(b.endpoint)) || !/^[a-z0-9]{4,24}$/.test(String(b.vault)) || !/^[0-9a-f]{16,128}$/.test(String(b.token))) return 'an inbox is an https endpoint, a vault id and a hex append token'
            return null
        case 'revocation':
            if (!isObj(b.revokes) || b.revokes.record !== fp || !/^sha256:[0-9a-f]{64}$/.test(String(b.revokes.statement))) return 'a revocation withdraws a statement of this record, by id'
            return null
    }
    return 'unknown type'
}

// ------------------------------------------------------------ the register: everybody's records, read together
/**
 * The graph from read records: { people: Map(fp → record), edges: [[a, b, {ab, ba}]], claims: [{from, to, link}],
 *   degrees: Map(fp → n) from the anchors, via: Map(fp → fp) (one shortest path's previous hop),
 *   verified: Map(fp → { by, method, on, at, until }), expired: Map(fp → the same, for verifications past their end) }.
 * asOf (yyyy-mm-dd, default today) is the day verifications are judged on.
 * Only records that read cleanly, are not revoked, and (unless includeFixtures) are not fixtures take part.
 */
function graph(records, { anchors = [], includeFixtures = false, asOf = today() } = {}) {
    const people = new Map()
    for (const r of records) if (r.ok && !r.revoked && (includeFixtures || !r.fixture)) people.set(r.fp, r)
    const linkOf = (a, b) => (people.get(a) && people.get(a).links.find(l => l.to === b)) || null
    const edges = [], claims = [], adj = new Map([...people.keys()].map(k => [k, new Set()]))
    for (const [a, r] of people) for (const l of r.links) {
        if (!people.has(l.to)) { claims.push({ from: a, to: l.to, link: l, reason: 'not in the register' }); continue }
        const back = linkOf(l.to, a)
        if (!back) { claims.push({ from: a, to: l.to, link: l, reason: 'not confirmed' }); continue }
        adj.get(a).add(l.to)
        if (a < l.to) edges.push([a, l.to, { ab: l, ba: back }])
    }
    const live = anchors.filter(a => people.has(a))
    const degrees = new Map(), via = new Map(), queue = []
    for (const a of live) { degrees.set(a, 0); queue.push(a) }
    while (queue.length) {
        const x = queue.shift()
        for (const y of adj.get(x)) if (!degrees.has(y)) { degrees.set(y, degrees.get(x) + 1); via.set(y, x); queue.push(y) }
    }
    const verified = new Map(), expired = new Map()
    for (const a of live) for (const y of adj.get(a)) {
        const l = linkOf(a, y)
        if (!l || !VERIFYING.includes(l.method)) continue
        const v = { by: a, method: l.method, on: l.on || l.at.slice(0, 10), at: l.at, until: validUntil(l) }
        if (v.until >= asOf) { const prev = verified.get(y); if (!prev || prev.until < v.until) verified.set(y, v) }
        else if (!expired.has(y) || expired.get(y).until < v.until) expired.set(y, v)
    }
    for (const y of verified.keys()) expired.delete(y)
    // agents: operated when the operator's link names "operates" and is in date, and the agent links back
    const operated = new Map(), lapsed = new Map()
    for (const [a, r] of people) for (const l of r.links) {
        const ag = people.get(l.to)
        if (l.method !== 'operates' || !ag || ag.kind !== 'agent' || !adj.get(a).has(l.to)) continue
        const v = { by: a, on: l.on || l.at.slice(0, 10), at: l.at, until: validUntil(l) }
        if (v.until >= asOf) { if (!operated.has(l.to) || operated.get(l.to).until < v.until) operated.set(l.to, v) }
        else if (!lapsed.has(l.to) || lapsed.get(l.to).until < v.until) lapsed.set(l.to, v)
    }
    for (const y of operated.keys()) lapsed.delete(y)
    // personas: the master links with "persona", the persona links back with "persona-of"; both people, both live
    const personas = new Map()
    for (const [a, r] of people) for (const l of r.links) {
        const p = people.get(l.to), back = linkOf(l.to, a)
        if (l.method !== 'persona' || !p || p.kind !== 'person' || r.kind !== 'person' || !back || back.method !== 'persona-of') continue
        personas.set(l.to, { of: a, on: l.on || l.at.slice(0, 10), at: l.at })
    }
    return { people, edges, claims, adj, degrees, via, verified, expired, operated, lapsed, personas, anchors: live, asOf }
}
/** The steps between two people, through confirmed links only: [a, …, b], or null. */
function path(g, a, b) {
    if (!g.adj.has(a) || !g.adj.has(b)) return null
    const prev = new Map([[a, null]]), q = [a]
    while (q.length) {
        const x = q.shift()
        if (x === b) break
        for (const y of g.adj.get(x)) if (!prev.has(y)) { prev.set(y, x); q.push(y) }
    }
    if (!prev.has(b)) return null
    const out = []; for (let x = b; x != null; x = prev.get(x)) out.unshift(x)
    return out
}
/** The operators above an agent, nearest first, up to three steps: [fp, …]; the last is the root. */
function operators(g, fp) {
    const out = []
    for (let x = fp, i = 0; i < 3 && g.operated.has(x); i++) { x = g.operated.get(x).by; if (out.includes(x)) break; out.push(x) }
    return out
}
/** What the register says about one person (or agent), in words the page shows. */
function standing(g, fp) {
    const rec = g.people.get(fp)
    if (rec && rec.kind === 'agent') {
        const op = g.operated.get(fp)
        if (op) {
            const chain = operators(g, fp), root = chain[chain.length - 1], rs = standing(g, root)
            const trusted = g.people.get(root) && g.people.get(root).kind === 'person' && ['anchor', 'verified'].includes(rs.level)
            return { level: trusted ? 'operated' : 'agent', text: `an agent operated by ${chain.map(x => nameOf(g, x)).join(', operated by ')}; confirmed ${op.on}, valid until ${op.until}${trusted ? '' : ` (whose own standing: ${rs.level})`}`, ...op, chain, root, trusted }
        }
        const x = g.lapsed.get(fp)
        if (x) return { level: 'expired', text: `an agent operated by ${nameOf(g, x.by)} until ${x.until}: to be confirmed again`, ...x }
        return { level: 'listed', text: 'an agent in the register, not confirmed by an operator' }
    }
    if (g.anchors.includes(fp)) return { level: 'anchor', text: 'an anchor: verification starts here' }
    const v = g.verified.get(fp)
    if (v) return { level: 'verified', text: `verified by ${nameOf(g, v.by)}, ${METHODS[v.method]}, on ${v.on}; valid until ${v.until}`, ...v }
    const pa = g.personas && g.personas.get(fp)
    if (pa && !(g.personas.has(pa.of))) {                                  // one level: a persona of a persona is not followed
        const ms = standing(g, pa.of)
        return { level: 'persona', text: `a persona of ${nameOf(g, pa.of)}, who holds both keys (their standing: ${ms.text})`, ...pa, master: pa.of, masterLevel: ms.level, trusted: ['anchor', 'verified'].includes(ms.level) }
    }
    const x = g.expired && g.expired.get(fp)
    if (x) return { level: 'expired', text: `verified by ${nameOf(g, x.by)} on ${x.on}; expired on ${x.until}: to be verified again`, ...x, degree: g.degrees.get(fp) }
    if (g.degrees.has(fp)) return { level: 'linked', text: `${g.degrees.get(fp)} step${g.degrees.get(fp) === 1 ? '' : 's'} from an anchor, through confirmed links`, degree: g.degrees.get(fp) }
    if (g.people.has(fp)) return { level: 'listed', text: 'in the register, not yet linked to an anchor' }
    return { level: 'absent', text: 'not in the register' }
}
const nameOf = (g, fp) => (g.people.get(fp) && g.people.get(fp).name) || fp
/** One-way links pointing at someone: the claims they can confirm by linking back. */
const waitingFor = (g, fp) => g.claims.filter(c => c.to === fp && c.reason === 'not confirmed')
/** The number to watch: real keys in the register (fixtures excluded, revoked excluded). */
const realKeys = records => records.filter(r => r.ok && !r.fixture && !r.revoked && r.identity && r.identity.body.kind === 'person').length
/** Agents' keys, counted apart: they are many, cheap, and short-lived. */
const realAgents = records => records.filter(r => r.ok && !r.fixture && !r.revoked && r.identity && r.identity.body.kind === 'agent').length

/** A submission: the statements a person hands to the register, in one file. */
const SUBMISSION = 'pki.sgit.ai/submission/v1'
function submission(statements) { return { kind: SUBMISSION, record: statements[0] && statements[0].record, statements } }
/** Several submissions in one file (an operator's link and the agent's record, say), for one `people.mjs add`. */
const SUBMISSIONS = 'pki.sgit.ai/submissions/v1'
const submissions = subs => ({ kind: SUBMISSIONS, submissions: subs })

return { REGISTRY, TYPES, BOUNDS, EVIDENCE, METHODS, AGENT_DAYS, VERIFYING, VERIFY_DAYS, validUntil, proofLine, hasProof, statement, identityStatement, agentStatement, evidenceStatement, linkStatement, inboxStatement, withdrawStatement, readRecord, graph, path, operators, standing, nameOf, waitingFor, realKeys, realAgents, SUBMISSION, submission, SUBMISSIONS, submissions, fingerprint, statementId }
})()

// ---------------------------------------------------------------- assets/people/message.js
const __message = (() => {
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
const { b64, unb64, b64url, unb64url, canon, utf8, signBytes, verifyBytes, seal, unseal, parseEnvelope, hex, unhex } = __keys

const KIND = 'pki.sgit.ai/message/v1'
const SITE = 'https://pki.sgit.ai/'
const short = fp => String(fp).replace(/^sha256:/, '')
const long = s => 'sha256:' + s
const MAX_QR_CHARS = 2300                            // version 40 at level L holds 2953 bytes; leave room for the URL

// ------------------------------------------------------------ the inner message
/** The inner message, signed when `from` is an identity ({ bundle, private: { sign } }). */
async function compose({ to, from = null, subject = '', text = '', files = [], grant = null, at = new Date().toISOString() }) {
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
async function verifyMessage(msg, fromBundle) {
    if (!msg || !msg.sig || !msg.from) return null
    if (!fromBundle || fromBundle.signing_fingerprint !== msg.from) return null
    const { sig, ...rest } = msg
    return verifyBytes(fromBundle.sign, unb64(sig), utf8(canon(rest) + '\n'))
}
function problems(msg, myFps = []) {
    const out = []
    if (!msg || msg.kind !== KIND || msg.v !== 1) return ['not a pki.sgit.ai message']
    if (myFps.length && !myFps.includes(msg.to)) out.push('addressed to another key')
    if (typeof msg.text !== 'string') out.push('no text')
    return out
}

// ------------------------------------------------------------ sealing, and the link
/** Seal a composed message to the recipient's bundle. Returns { enc, code, url } (code: the m1 text). */
async function sealMessage(msg, toBundle, from = null) {
    const signer = from ? { sign: from.private.sign, fingerprint: from.bundle.signing_fingerprint } : null
    const enc = await seal(toBundle, JSON.stringify(msg), signer)
    const code = codeOf(enc, toBundle.signing_fingerprint)
    return { enc, code, url: SITE + 'm/#' + code }
}
/** The m1 text from an .enc envelope. */
function codeOf(enc, toFp) {
    const env = parseEnvelope(enc), parts = ['m1', short(toFp), b64url(unb64(env.w)), b64url(unb64(env.i)), b64url(unb64(env.c))]
    if (env.s && env.f) parts.push(b64url(unb64(env.s)), short(env.f))
    return parts.join('.')
}
/** Back from the m1 text (or a URL holding one) to { to, enc }; null when there is none. */
function parseCode(text) {
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
async function openMessage(enc, identities, known = new Map()) {
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
async function invite(from, { days = 30, name = '', accessKey = '' } = {}) {
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
function parseInvite(text) {
    const s = String(text || ''), m = /i1\.([0-9a-f]{16})\.(\d{8})\.([0-9a-f]{16})\.([A-Za-z0-9_-]{80,90})/.exec(s)
    if (!m) return null
    const q = new URLSearchParams((s.split(m[0])[1] || '').replace(/^&/, ''))
    const from = long(m[1]), expires = `${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6)}`
    return { from, expires, nonce: m[3], name: q.get('n') || '', accessKey: q.get('k') || '', expired: expires < new Date().toISOString().slice(0, 10),
             verify: bundle => bundle && bundle.signing_fingerprint === from ? verifyBytes(bundle.sign, unb64url(m[4]), inviteBytes(from, m[2], m[3])) : Promise.resolve(null) }
}

return { KIND, SITE, MAX_QR_CHARS, compose, verifyMessage, problems, sealMessage, codeOf, parseCode, openMessage, invite, parseInvite, unhex }
})()

// ---------------------------------------------------------------- the tool (agents/pki-agent.src.mjs)
const K = __keys
const D = __directory
const M = __message

const HOME = process.env.PKI_AGENT_HOME || path.join(os.homedir(), '.sg-send')
const KEYS = path.join(HOME, 'keys'), PKI = path.join(HOME, 'pki'), RECORDS = path.join(PKI, 'records')
const REGISTER = (process.env.PKI_REGISTER || 'https://pki.sgit.ai/').replace(/\/?$/, '/')
const PASS = process.env.SG_SEND_PASSPHRASE || ''
const say = (...a) => console.log(...a), die = m => { console.error('pki-agent: ' + m); process.exit(1) }

// ------------------------------------------------------------ arguments
const [cmd = 'help', ...rest] = process.argv.slice(2)
const flags = {}, args = []
for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); flags[k] = v != null ? v : (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true) }
    else args.push(a)
}

// ------------------------------------------------------------ the key store (sgit's layout) and the agent's record
const writeSecret = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true, mode: 0o700 }); fs.writeFileSync(f, text, { mode: 0o600 }) }
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const state = () => fs.existsSync(path.join(PKI, 'agent.json')) ? readJson(path.join(PKI, 'agent.json')) : {}
async function saveKey(id) {
    const dir = path.join(KEYS, id.bundle.fingerprint.replace(':', '_'))
    const priv = async der => PASS ? K.encryptPrivate(der, PASS) : K.pem(der, 'PRIVATE KEY')
    writeSecret(path.join(dir, 'private_key.pem'), await priv(id.private.encrypt))
    writeSecret(path.join(dir, 'signing_private.pem'), await priv(id.private.sign))
    fs.writeFileSync(path.join(dir, 'public_key.pem'), id.bundle.encrypt)
    fs.writeFileSync(path.join(dir, 'signing_public.pem'), id.bundle.sign)
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({ label: id.bundle.label, algorithm: 'RSA-OAEP', key_size: 4096, encryption_fingerprint: id.bundle.fingerprint, signing_fingerprint: id.bundle.signing_fingerprint, created: id.created }, null, 2))
    return dir
}
async function loadKey(fp) {
    for (const d of fs.existsSync(KEYS) ? fs.readdirSync(KEYS) : []) {
        const meta = path.join(KEYS, d, 'metadata.json')
        if (!fs.existsSync(meta)) continue
        const m = readJson(meta)
        if (m.signing_fingerprint !== fp && m.encryption_fingerprint !== fp) continue
        try { return await K.importKeystore({ privateKeyPem: fs.readFileSync(path.join(KEYS, d, 'private_key.pem'), 'utf8'), signingPrivatePem: fs.readFileSync(path.join(KEYS, d, 'signing_private.pem'), 'utf8'), passphrase: PASS, label: m.label, created: m.created }) }
        catch (e) { die(`the key ${fp} is in ${path.join(KEYS, d)} but does not open: ${e.message}${PASS ? '' : ' (set SG_SEND_PASSPHRASE)'}`) }
    }
    return null
}
async function me() {
    if (process.env.PKI_AGENT_KEY && !flags.key) {
        let k; try { k = JSON.parse(process.env.PKI_AGENT_KEY) } catch (e) { die('PKI_AGENT_KEY is not the JSON keyfile prints') }
        try { return await K.importKeystore({ privateKeyPem: k.private_key, signingPrivatePem: k.signing_private, passphrase: PASS, label: k.label || '', created: k.created || 0 }) }
        catch (e) { die(`PKI_AGENT_KEY does not open: ${e.message}${PASS ? '' : ' (set SG_SEND_PASSPHRASE)'}`) }
    }
    const fp = flags.key || state().default
    if (!fp) die('no key yet: node pki-agent.mjs keygen --name "<what this agent is>"')
    const id = await loadKey(fp)
    if (!id) die(`the key ${fp} is not in ${KEYS}: it lived in another session or machine. Make a new one (keygen).`)
    return id
}
const recDir = fp => path.join(RECORDS, K.dirOf(fp))
function statements(fp) { const d = recDir(fp); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.json')).sort().map(f => readJson(path.join(d, f))) : [] }
function keep(st) { const d = recDir(st.record), n = statements(st.record).length + 1; fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `${String(n).padStart(2, '0')}__${st.type}.json`), JSON.stringify(st, null, 2)); return st }
async function register() {
    const r = await fetch(REGISTER + 'directory/index.json'); if (!r.ok) die(`the register did not answer (${r.status})`)
    const index = await r.json(), records = []
    for (const x of index.records) { const rec = await D.readRecord(x.statements, { dir: x.fp, fixture: x.fixture }); rec.dir = x.dir; records.push(rec) }
    return { index, records, byFp: new Map(records.map(r => [r.fp, r])), graph: D.graph(records, { anchors: index.anchors }) }
}

// ------------------------------------------------------------ the commands
const commands = {
    async help() {
        say(`pki-agent: an agent's identity on pki.sgit.ai (${REGISTER})

  keygen --name N [--about A] [--runtime R] [--session]   make this agent's key and sign its identity
  operator <fingerprint>                                   link to the key that operates this agent
  submission [--out FILE]                                  the signed record, to hand to the operator
  submit                                                   send it, sealed, into the operator's inbox
  status                                                   what the register says about this agent
  whoami                                                   this agent's fingerprints
  send --to FP --text T [--subject S]                      a message sealed to someone: a link and its text
  open <link | m1… | file.enc>                             open a message sealed to this agent
  sign <file>                                              a signature sgit pki verify checks (file.sig)
  link <fingerprint> [--method known]                      link to any key in the register
  evidence --kind link|website|github|dns|key --value V [--url U]   a signed claim, e.g. the session's own URL
  keyfile                                                  this key as one line, for a PKI_AGENT_KEY secret (encrypted
                                                           when SG_SEND_PASSPHRASE is set; then that is a secret too)

Keys: ${KEYS} (sgit's layout${PASS ? ', encrypted with SG_SEND_PASSPHRASE' : ', plain, 0600: set SG_SEND_PASSPHRASE to encrypt'}).`)
    },
    async keygen() {
        if (!flags.name) die('keygen --name "<what this agent is>"')
        const id = await K.generate(String(flags.label || flags.name).slice(0, 80))
        const dir = await saveKey(id)
        const st = keep(await D.agentStatement(id, { name: flags.name, about: flags.about || '', runtime: flags.runtime || '', session: !!flags.session }))
        fs.mkdirSync(PKI, { recursive: true }); fs.writeFileSync(path.join(PKI, 'agent.json'), JSON.stringify({ ...state(), default: id.bundle.signing_fingerprint }, null, 2))
        say(`made: ${id.bundle.signing_fingerprint}  (record; encryption key ${id.bundle.fingerprint})`)
        say(`private halves: ${dir}${PASS ? ' (encrypted)' : ' (plain, 0600)'}; they stay here`)
        say(`identity signed (${st.created_at}). Next: node pki-agent.mjs operator <your operator's fingerprint>`)
    },
    async operator() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('operator <sha256:16 hex>')
        const id = await me()
        keep(await D.linkStatement(id, { to: fp, method: 'operated-by' }))
        say(`linked to ${fp} as its operator. Next: node pki-agent.mjs submission (or submit), and ask them to confirm it.`)
    },
    async link() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('link <sha256:16 hex>')
        keep(await D.linkStatement(await me(), { to: fp, method: flags.method || 'known' })); say(`linked to ${fp}`)
    },
    async evidence() {
        if (!D.EVIDENCE[flags.kind] || !flags.value) die('evidence --kind link|website|github|dns|key --value V [--url https://…]')
        keep(await D.evidenceStatement(await me(), { kind: flags.kind, value: flags.value, url: flags.url || '' })); say('evidence signed')
    },
    async whoami() { const id = await me(); say(JSON.stringify({ record: id.bundle.signing_fingerprint, encryption: id.bundle.fingerprint, label: id.bundle.label, keys: KEYS }, null, 2)) },
    async submission() {
        const id = await me(), sts = statements(id.bundle.signing_fingerprint)
        const r = await D.readRecord(sts); if (!r.ok) die('the record does not read cleanly: ' + r.problems.join('; '))
        const text = JSON.stringify(D.submission(sts), null, 1)
        if (flags.out) { fs.writeFileSync(flags.out, text); say(`written: ${flags.out} (${sts.length} statements, record ${r.fp})`) } else say(text)
    },
    async submit() {
        const id = await me(), fp = id.bundle.signing_fingerprint, sts = statements(fp)
        const r = await D.readRecord(sts); if (!r.ok) die('the record does not read cleanly: ' + r.problems.join('; '))
        const op = (r.links.find(l => l.method === 'operated-by') || {}).to || flags.to
        if (!op) die('no operator: node pki-agent.mjs operator <fingerprint> first')
        const reg = await register(), opRec = reg.byFp.get(op)
        if (!opRec) die(`the operator ${op} is not in the register; hand them the submission instead (submission --out FILE)`)
        if (!opRec.inbox) die(`${opRec.name} has no inbox on their record; hand them the submission instead (submission --out FILE)`)
        const msg = await M.compose({ to: opRec.bundle, from: id, subject: `An agent asks to be confirmed: ${r.name}`, text: `${r.name} (${fp}) asks ${opRec.name} to confirm they operate it. Compare this fingerprint with the one the agent printed in its session before confirming.`,
            files: [{ name: 'submission.json', type: 'application/json', data: K.utf8(JSON.stringify(D.submission(sts), null, 1)) }] })
        const sealed = await M.sealMessage(msg, opRec.bundle, id)
        const w = await fetch(`${opRec.inbox.endpoint}/api/vault/append/write/${opRec.inbox.vault}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ append_token: opRec.inbox.token, payload: btoa(M.parseCode(sealed.code).enc) }) })
        if (!w.ok) die(`the inbox answered ${w.status}`)
        say(`sent, sealed to ${opRec.name}'s key, into their inbox. They confirm it from pki.sgit.ai/vault/ (Agents). Fingerprint to read them: ${fp}`)
    },
    async status() {
        const id = await me(), fp = id.bundle.signing_fingerprint, reg = await register()
        if (!reg.byFp.has(fp)) return say(`${fp}: not in the register yet (${statements(fp).length} statements kept here, not yet added)`)
        say(`${fp}: ${D.standing(reg.graph, fp).text}`)
    },
    async send() {
        const id = await me(), reg = await register(), to = reg.byFp.get(flags.to)
        if (!to) die(`--to ${flags.to}: not in the register`)
        const sealed = await M.sealMessage(await M.compose({ to: to.bundle, from: id, subject: flags.subject || '', text: String(flags.text || '') }), to.bundle, id)
        say(sealed.url)
    },
    async open() {
        const src = args[0]; if (!src) die('open <link | m1… | file.enc>')
        const code = M.parseCode(src)
        const enc = code ? code.enc : fs.readFileSync(src, 'utf8').trim()
        const id = await me()
        let known = new Map(); try { known = new Map([...(await register()).byFp].map(([k, r]) => [k, r.bundle])) } catch (e) { /* offline: signatures unchecked */ }
        const o = await M.openMessage(enc, [id], known)
        say(JSON.stringify({ from: o.msg.from || null, signature: o.verified === true ? 'checks' : o.verified === false ? 'DOES NOT CHECK' : 'not checked (sender not in the register)', at: o.msg.at, subject: o.msg.subject || '', text: o.msg.text, files: (o.msg.files || []).map(f => f.name), problems: o.problems }, null, 2))
        if (flags.save && o.msg.files) for (const f of o.msg.files) { fs.writeFileSync(path.join(flags.save, path.basename(f.name)), K.unb64(f.data)); say(`saved ${f.name}`) }
    },
    async keyfile() {
        const id = await me()
        if (!PASS) console.error('pki-agent: SG_SEND_PASSPHRASE is not set, so this keyfile is the private key in the clear')
        const priv = async der => PASS ? K.encryptPrivate(der, PASS) : K.pem(der, 'PRIVATE KEY')
        say(JSON.stringify({ v: 1, label: id.bundle.label, record: id.bundle.signing_fingerprint, created: id.created, private_key: await priv(id.private.encrypt), signing_private: await priv(id.private.sign) }))
    },
    async sign() {
        const f = args[0]; if (!f) die('sign <file>')
        const id = await me()
        fs.writeFileSync(f + '.sig', JSON.stringify({ signature: K.b64(await K.signBytes(id.private.sign, fs.readFileSync(f))), fingerprint: id.bundle.signing_fingerprint }, null, 2))
        say(`written: ${f}.sig`)
    },
}
if (!commands[cmd]) die(`unknown command ${cmd}: node pki-agent.mjs help`)
await commands[cmd]()
