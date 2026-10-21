/**
 * account.js: a person's vaults on pki.sgit.ai. The newsroom's design, reused, not redesigned:
 *
 *     passkey ──PRF──▶ door vault ──holds the key of──▶ master vault ──holds the key of──▶ book vault
 *     recovery code ──▶ recovery door ─────────────────────┘
 *
 *   door     at an address derived from the passkey's PRF bytes (door.js): master-key.json, door.json. A second
 *            device's passkey, or the recovery code, is another door to the same master; nothing is stored to be found.
 *   master   the secrets, and nothing else: the private keys, in sgit's key store layout
 *            (keys/sha256_<encryption fp>/{metadata.json, private_key.pem, public_key.pem, signing_private.pem,
 *            signing_public.pem}, the private halves as plain PKCS#8 inside the encrypted vault), identity.json (which
 *            key is the default), the SG/Send access key (.vault/access-token.json, where the library looks), the
 *            inbox's enum key (inbox.json), doors.json, and book.json (the book vault's key).
 *   book     what the person keeps: record/ (their own signed statements, the source of every submission),
 *            contacts/ (bundles of people they write to, with notes), messages/in and messages/out, invites/, notes/
 *            (an anchor's private notes on how someone was verified). The inbox, an append lane, is on this vault.
 *
 * The keys follow the person across devices because they live in the master, not in a browser: any device that
 * opens a door opens the same master. Everything below runs on assets/vendor/newsroom/newsroom-vault.js (the
 * newsroom's module, unedited) over the vault library (assets/vendor/sg-vault, unedited).
 *
 * @module account
 */
import * as NV from '../vendor/newsroom/newsroom-vault.js'
import * as K from './keys.js'
import { doorFrom, recoveryCode } from './door.js'

export const ENDPOINT = 'https://dev.send.sgraph.ai'
export const LIB = ['sg-send/sg-send-crypto.js', 'sg-send/sg-send.js', 'sg-vault/sg-vault-crypto.js', 'sg-vault/sg-vault-object-store.js', 'sg-vault/sg-vault-ref-manager.js',
    'sg-vault/sg-vault-commit.js', 'sg-vault/sg-vault.js', 'sg-vault/sg-vault--file-ops.js', 'sg-vault/sg-vault--folder-ops.js', 'sg-vault/sg-vault--sync.js',
    'sg-vault/sg-vault--history.js', 'sg-vault/sg-vault--branches.js'].map(f => `assets/vendor/sg-vault/v0.2.3/${f}`).concat(['assets/vendor/sg-vault/local/sg-vault--create-with-id.js'])
export const FILES = { masterKey: 'master-key.json', doorRecord: 'door.json', book: 'book.json', doors: 'doors.json', identity: 'identity.json', inbox: 'inbox.json',
                       token: { folder: '/.vault', name: 'access-token.json' } }
const now = () => new Date().toISOString()
const BOOK_README = '# A book on pki.sgit.ai\n\nMade by pki.sgit.ai for one person. record/ holds their own signed statements (what they published to the register), contacts/ the people they write to, messages/ what they sent and received, invites/ the invitations they made, notes/ their private notes. The private keys are not here: they are in the master vault, which holds this vault\'s key.\n'

/** The vault library, as plain scripts, in VENDOR.md's order, from this origin and nowhere else. */
let loading = null
export function loadLibrary(root) {
    if (typeof SGVault !== 'undefined' && typeof SGVault.createWithId === 'function') return Promise.resolve()
    if (loading) return loading
    loading = (async () => {
        for (const f of LIB) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = new URL(f, root).href; s.onload = res; s.onerror = () => rej(new Error(`could not load ${f}`)); document.head.append(s) })
    })()
    return loading
}
export const client = (token = '', endpoint = ENDPOINT) => NV.client({ endpoint, token })

const doorRecord = (door, rec) => ({ v: 1, kind: rec.kind || 'passkey', path: rec.path || '', credential_id: rec.credential_id || '', device: rec.device || '', created: now(), vault_id: door.vaultId })

/**
 * The first device: door, master and book, and a recovery door. Returns { door, master, book, token, doors, recovery }
 * where recovery is the code to show once ({ code, shown }) and never keep.
 */
export async function createAccount({ sgSend, door, record = {}, token, cloneBranch }) {
    if (!token) throw new Error('an SG/Send access key is needed to create vaults')
    const master = await NV.createVault(sgSend, { name: 'pki master' })
    const book = await NV.createVault(sgSend, { name: 'pki book' })
    const doorVault = await NV.createVaultWithId(sgSend, door.passphrase, door.vaultId, { name: 'pki door', cloneBranch })
    const rec = doorRecord(door, record)
    await NV.writeFile(doorVault, '/', FILES.masterKey, JSON.stringify({ v: 1, master: NV.prefixedKey(master) }, null, 1))
    await NV.writeFile(doorVault, '/', FILES.doorRecord, JSON.stringify(rec, null, 1))
    await NV.publish(doorVault)
    await NV.writeFile(master, '/', FILES.book, JSON.stringify({ v: 1, book: NV.prefixedKey(book) }, null, 1))
    await NV.writeFile(master, '/', FILES.doors, JSON.stringify({ v: 1, doors: [{ ...rec, vault_key: NV.vaultKeyString(door.passphrase, door.vaultId) }] }, null, 1))
    await NV.writeFile(master, FILES.token.folder, FILES.token.name, JSON.stringify({ token }))
    await NV.publish(master)
    await NV.writeFile(book, '/', 'README.md', BOOK_README)
    await NV.publish(book)
    const recovery = recoveryCode()
    const added = await NV.addDoor({ sgSend: sgSend, master, door: await doorFrom(recovery.bytes), record: { kind: 'recovery', device: record.device || '' }, cloneBranch })
    return { door: doorVault, master, book, token, doors: added.doors, recovery: { code: recovery.code, shown: recovery.shown } }
}

/** Open the door, the master (with the access key it holds) and the book. ENOVAULT: no door at this address yet. */
export async function unlock({ sgSend, door, cloneBranch }) {
    const doorVault = await NV.openVault(sgSend, NV.vaultKeyString(door.passphrase, door.vaultId), { cloneBranch })
    const mk = await NV.readJson(doorVault, '/' + FILES.masterKey)
    if (!mk || !mk.master) { const e = new Error('the door has no master key in it'); e.code = 'EDOOR'; throw e }
    const master = await NV.openVault(sgSend, mk.master, { cloneBranch })
    const t = await NV.readJson(master, `${FILES.token.folder}/${FILES.token.name}`).catch(() => null)
    const token = (t && t.token) || ''
    if (token) sgSend.token = token
    const bk = await NV.readJson(master, '/' + FILES.book)
    const book = bk && bk.book ? await NV.openVault(sgSend, bk.book, { cloneBranch }) : null
    const doors = ((await NV.readJson(master, '/' + FILES.doors)) || { doors: [] }).doors
    return { door: doorVault, master, book, token, doors }
}
/** While open: this passkey path (or a new one) as another door to the same master. */
export async function addDoor({ sgSend, master, door, record = {}, cloneBranch }) { return NV.addDoor({ sgSend, master, door, record, cloneBranch }) }
export async function setToken(master, token) { await NV.writeFile(master, FILES.token.folder, FILES.token.name, JSON.stringify({ token })); await NV.publish(master) }

// ------------------------------------------------------------ the keys, in the master, in sgit's layout
const pemPrivate = der => K.pem(der, 'PRIVATE KEY')
/** Every key pair the master holds: [{ bundle, private: { encrypt, sign }, created, label }], the default first. */
export async function identities(master) {
    const folders = (await NV.listFiles(master, '/keys').catch(() => [])).filter(f => f.endsWith('/')).map(f => f.slice(0, -1))
    const out = []
    for (const f of folders) {
        const read = n => NV.readText(master, `/keys/${f}/${n}`)
        const meta = JSON.parse(await read('metadata.json') || '{}')
        try {
            const id = await K.importKeystore({ privateKeyPem: await read('private_key.pem'), signingPrivatePem: await read('signing_private.pem'), passphrase: '', label: meta.label || '', created: meta.created || 0 })
            out.push({ ...id, label: meta.label || '', role: meta.role || '', persona_of: meta.persona_of || '' })
        } catch (e) { /* a folder that does not read as a key pair is left alone, never deleted */ }
    }
    const pref = await NV.readJson(master, '/' + FILES.identity).catch(() => null)
    const def = pref && pref.default
    return out.sort((a, b) => (b.bundle.signing_fingerprint === def) - (a.bundle.signing_fingerprint === def) || (a.created - b.created))
}
/** Keep a key pair in the master (one commit, published). Optionally make it the default. */
export async function saveIdentity(master, id, { makeDefault = false, role = '', persona_of = '' } = {}) {
    const folder = `/keys/${id.bundle.fingerprint.replace(':', '_')}`
    const meta = { label: id.bundle.label, algorithm: 'RSA-OAEP', key_size: 4096, encryption_fingerprint: id.bundle.fingerprint, signing_fingerprint: id.bundle.signing_fingerprint, created: id.created || Date.now() }
    if (role) meta.role = role                      // pki.sgit.ai's own: "master", or "persona" with the master's fingerprint
    if (persona_of) meta.persona_of = persona_of
    const files = {
        'metadata.json': JSON.stringify(meta, null, 2),
        'private_key.pem': pemPrivate(id.private.encrypt), 'public_key.pem': id.bundle.encrypt,
        'signing_private.pem': pemPrivate(id.private.sign), 'signing_public.pem': id.bundle.sign,
    }
    for (const [n, t] of Object.entries(files)) await NV.writeFile(master, folder, n, t)
    if (makeDefault) await NV.writeFile(master, '/', FILES.identity, JSON.stringify({ v: 1, default: id.bundle.signing_fingerprint, set: now() }, null, 1))
    await NV.publish(master)
    return folder
}
export async function setDefault(master, fp) { await NV.writeFile(master, '/', FILES.identity, JSON.stringify({ v: 1, default: fp, set: now() }, null, 1)); await NV.publish(master) }

/** Every file in a vault, walked from the root: [{ path, folder }], folders first, sorted. For the vault explorer. */
export async function tree(v, folder = '/', depth = 0, out = []) {
    if (depth > 8) return out
    const names = (await NV.listFiles(v, folder).catch(() => [])).sort((a, b) => (b.endsWith('/') - a.endsWith('/')) || a.localeCompare(b))
    for (const n of names) {
        const p = (folder === '/' ? '' : folder) + '/' + n.replace(/\/$/, '')
        if (n.endsWith('/')) { out.push({ path: p, folder: true, depth }); await tree(v, p, depth + 1, out) } else out.push({ path: p, folder: false, depth })
    }
    return out
}

// ------------------------------------------------------------ the book
const safe = s => String(s).replace(/[^A-Za-z0-9_.-]/g, '-').slice(0, 80)
export const book = {
    /** The account's profile: { username, name, blurb, avatar (a small data: URL) }. Private: in the book, not the register. */
    async profile(bk) { return NV.readJson(bk, '/profile.json').catch(() => null) },
    async saveProfile(bk, p) { await NV.writeFile(bk, '/', 'profile.json', JSON.stringify({ v: 1, ...p }, null, 1)); await NV.publish(bk) },
    /** The person's own statements for one key, oldest first. */
    async statements(bk, fp) {
        const folder = `/record/${K.dirOf(fp)}`
        const names = (await NV.listFiles(bk, folder).catch(() => [])).filter(n => n.endsWith('.json')).sort()
        const out = []; for (const n of names) out.push(JSON.parse(await NV.readText(bk, `${folder}/${n}`)))
        return out.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    },
    async addStatement(bk, st) {
        const folder = `/record/${K.dirOf(st.record)}`, have = (await NV.listFiles(bk, folder).catch(() => [])).filter(n => n.endsWith('.json')).length
        const name = `${String(have + 1).padStart(2, '0')}__${st.type}.json`
        await NV.writeFile(bk, folder, name, JSON.stringify(st, null, 2)); await NV.publish(bk)
        return `${folder}/${name}`
    },
    async contacts(bk) {
        const names = (await NV.listFiles(bk, '/contacts').catch(() => [])).filter(n => n.endsWith('.json'))
        const out = []; for (const n of names) { try { out.push(JSON.parse(await NV.readText(bk, `/contacts/${n}`))) } catch (e) { /* skip */ } }
        return out.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    },
    async saveContact(bk, c) { await NV.writeFile(bk, '/contacts', `${K.dirOf(c.bundle.signing_fingerprint)}.json`, JSON.stringify({ v: 1, ...c, updated: now() }, null, 2)); await NV.publish(bk) },
    async removeContact(bk, fp) { const ok = await NV.removeFile(bk, '/contacts', `${K.dirOf(fp)}.json`); if (ok) await NV.publish(bk); return ok },
    async messages(bk, box) {
        const folder = `/messages/${box}`, names = (await NV.listFiles(bk, folder).catch(() => [])).filter(n => n.endsWith('.json')).sort().reverse()
        const out = []; for (const n of names) { try { out.push({ file: n, ...JSON.parse(await NV.readText(bk, `${folder}/${n}`)) }) } catch (e) { /* skip */ } }
        return out
    },
    async saveMessage(bk, box, m) {
        const name = `${(m.at || now()).replace(/[:.]/g, '-')}__${safe(m.id || K.hex(globalThis.crypto.getRandomValues(new Uint8Array(6))))}.json`
        await NV.writeFile(bk, `/messages/${box}`, name, JSON.stringify(m, null, 2)); await NV.publish(bk)
        return name
    },
    /** Agents this person confirmed, or was asked to: the agent's submission as it arrived, kept by the agent's fingerprint. */
    async agents(bk) {
        const names = (await NV.listFiles(bk, '/agents').catch(() => [])).filter(n => n.endsWith('.json'))
        const out = []; for (const n of names) { try { out.push(JSON.parse(await NV.readText(bk, `/agents/${n}`))) } catch (e) { /* skip */ } }
        return out
    },
    async saveAgent(bk, sub) { await NV.writeFile(bk, '/agents', `${K.dirOf(sub.record)}.json`, JSON.stringify(sub, null, 1)); await NV.publish(bk) },
    /** The access keys this person handed out: never the key itself, its SHA-256, who it went to and when. */
    async grants(bk) {
        const names = (await NV.listFiles(bk, '/grants').catch(() => [])).filter(n => n.endsWith('.json'))
        const out = []; for (const n of names) { try { out.push(JSON.parse(await NV.readText(bk, `/grants/${n}`))) } catch (e) { /* skip */ } }
        return out.sort((a, b) => String(b.at).localeCompare(String(a.at)))
    },
    async saveGrant(bk, g) { await NV.writeFile(bk, '/grants', `${g.token_sha256.slice(0, 16)}__${K.dirOf(g.to)}.json`, JSON.stringify(g, null, 1)); await NV.publish(bk) },
    async saveInvite(bk, inv) { await NV.writeFile(bk, '/invites', `${safe(inv.nonce)}.json`, JSON.stringify(inv, null, 2)); await NV.publish(bk) },
    async invites(bk) {
        const names = (await NV.listFiles(bk, '/invites').catch(() => [])).filter(n => n.endsWith('.json'))
        const out = []; for (const n of names) { try { out.push(JSON.parse(await NV.readText(bk, `/invites/${n}`))) } catch (e) { /* skip */ } }
        return out.sort((a, b) => String(b.made).localeCompare(String(a.made)))
    },
    async note(bk, fp) { return NV.readText(bk, `/notes/${K.dirOf(fp)}.md`).catch(() => null) },
    async saveNote(bk, fp, text) { await NV.writeFile(bk, '/notes', `${K.dirOf(fp)}.md`, text); await NV.publish(bk) },
}

// ------------------------------------------------------------ the inbox: an append lane on the book vault
/**
 * The inbox: an append lane on the book vault that anyone holding the token can write to and nobody but the owner
 * can list or read; the messages in it are sealed to the owner's key, so the lane only carries ciphertext. The token
 * is published in the owner's record (an inbox statement): the lane is an address, as sgit.ai/docs/vault-messaging
 * intends, and the token is agreed through the register, until the derivation from a public key ships.
 */
async function lane(endpoint, op, vault, body, headers = {}) {
    const r = await fetch(`${endpoint}/api/vault/append/${op}/${vault}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
    let j = null; try { j = await r.json() } catch (e) { j = null }
    if (!r.ok || !j) { const e = new Error(`the vault server answered ${r.status} to ${op}${r.status === 404 ? ' (a wrong key, or a lane that is not there)' : ''}`); e.status = r.status; throw e }
    return j
}
export async function readInbox(master) { const r = await NV.readJson(master, '/' + FILES.inbox).catch(() => null); return r && r.token && r.enum_key ? r : null }
/** Make (or remake, with a new token) the inbox and keep its record in the master. Returns the record. */
export async function openInbox({ master, book: bk, token, endpoint = ENDPOINT, previous = null }) {
    const rec = { v: 1, endpoint, vault: bk.vaultId, token: K.hex(globalThis.crypto.getRandomValues(new Uint8Array(16))), enum_key: (previous && previous.enum_key) || K.hex(globalThis.crypto.getRandomValues(new Uint8Array(32))), created: now(), rotated: previous ? [...(previous.rotated || []), now()] : [] }
    await lane(endpoint, 'configure', rec.vault, { append_anchors: [await K.sha256hex(rec.token)], enum_key_hash: await K.sha256hex(rec.enum_key) }, { 'x-sgraph-vault-write-key': bk.writeKeyHex, 'x-sgraph-access-token': token })
    await NV.writeFile(master, '/', FILES.inbox, JSON.stringify(rec, null, 1)); await NV.publish(master)
    return rec
}
/** Write to someone's inbox (the body of their inbox statement): blind, no account. */
export async function deliver(inbox, enc) {
    const payload = btoa(enc)
    if (payload.length > 5 * 1024 * 1024) throw new Error('too large for one message (5 MB)')
    const j = await lane(inbox.endpoint, 'write', inbox.vault, { append_token: inbox.token, payload })
    if (j.ok !== true) throw new Error('the vault server did not take it')
}
/** What is waiting in my inbox: [{ inbox, file_id, enc }]. Nothing is marked read here. */
export async function waiting(rec) {
    const entries = []
    let after = null
    for (let page = 0; page < 20; page++) {
        const j = await lane(rec.endpoint, 'list', rec.vault, after ? { include_content: false, after_file_id: after } : { include_content: false }, { 'x-sgraph-vault-enum-key': rec.enum_key })
        entries.push(...(j.entries || []))
        if (!j.truncated || !(j.entries || []).length) break
        after = j.entries[j.entries.length - 1].file_id
    }
    const out = []
    const byLane = new Map(); for (const e of entries) { if (!byLane.has(e.inbox)) byLane.set(e.inbox, []); byLane.get(e.inbox).push(e) }
    for (const [inbox, es] of byLane) for (let i = 0; i < es.length; i += 100) {
        const j = await lane(rec.endpoint, 'fetch', rec.vault, { inbox, file_ids: es.slice(i, i + 100).map(e => e.file_id) }, { 'x-sgraph-vault-enum-key': rec.enum_key })
        for (const f of j.files || []) { let enc = null; try { enc = atob(f.content) } catch (e) { enc = null } out.push({ inbox, file_id: f.file_id, enc }) }
    }
    return out.sort((a, b) => String(a.file_id).localeCompare(String(b.file_id)))
}
export async function markRead(rec, inbox, ids) { return lane(rec.endpoint, 'mark-processed', rec.vault, { inbox, file_ids: ids }, { 'x-sgraph-vault-enum-key': rec.enum_key }) }

export { NV, doorFrom }
