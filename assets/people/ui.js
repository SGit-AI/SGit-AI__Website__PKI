/**
 * ui.js: what every page of the directory shares. The register as read from directory/index.json, the person's vault
 * (opened with a passkey, kept open for the life of the tab), the vault bar at the top of each tool page, QR codes.
 *
 * Three ways to hold your keys, and the page always says which:
 *   vault     the passkey opens a door, the door the master, the master holds the keys (account.js). The keys follow
 *             you to every device whose passkey (or recovery code) opens a door. Writing vaults needs an SG/Send
 *             access key, typed once and kept in the master, or carried by an invitation.
 *   local     the passkey, and no vault behind it yet: the whole account (profile, keys, record, contacts) is kept in
 *             this browser, encrypted with a key the same passkey derives (local.js). No passphrase, no access key;
 *             it travels nowhere, and moves into a vault, then leaves the browser, when an access key comes.
 *   browser   the older way, kept for those who used it: a key pair in local storage, its private halves encrypted
 *             with a passphrase in sgit's own format. It moves into a vault later.
 *
 * Where the keys live while the tab is open: in memory, and for the tab's life in sessionStorage (the door's
 * passphrase and id, so a page change does not ask for the passkey again), as the newsroom's pane does. Nothing
 * secret is written to localStorage except the browser mode's encrypted key file.
 *
 * @module ui
 */
import * as K from './keys.js'
import * as D from './directory.js'
import * as A from './account.js'
import * as L from './local.js'
import { doorFrom, prfBytes, recoveryBytes, PRF_INPUT_TEXT, sha256 } from './door.js'

export const ROOT = new URL('../../', import.meta.url)
export { K, D, A, L }

// ------------------------------------------------------------ small things
export function h(tag, attrs, ...kids) {
    const el = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) { if (v === false || v == null) continue; if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'html') el.innerHTML = v; else el.setAttribute(k, v === true ? '' : v) }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid))
    return el
}
/* The pages build with `cond ? node : null`, and h() skips null and false children. append, prepend and
   replaceChildren would print "null" instead, so on the pages that load this module they skip them too. */
for (const m of ['append', 'prepend', 'replaceChildren']) {
    const orig = Element.prototype[m]
    if (!orig.__skipsNull) { Element.prototype[m] = function (...kids) { return orig.apply(this, kids.flat().filter(k => k != null && k !== false)) }; Element.prototype[m].__skipsNull = true }
}
export const msg = (kind, ...kids) => h('p', { class: 'msg ' + kind }, ...kids)
export const err = e => String((e && e.message) || e).slice(0, 400)
export const shortFp = fp => String(fp || '').replace('sha256:', '').slice(0, 16)
export function download(name, text, type = 'application/json') {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
}
export function copyButton(text, label = 'Copy') {
    const b = h('button', { type: 'button', class: 'btn small' }, label)
    b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(typeof text === 'function' ? text() : text); b.textContent = 'Copied' } catch (e) { b.textContent = 'Copy failed' } setTimeout(() => { b.textContent = label }, 1500) })
    return b
}
export async function busy(btn, fn) { if (btn) btn.disabled = true; try { return await fn() } finally { if (btn) btn.disabled = false } }
export const pageUrl = rel => new URL(rel, ROOT).href

/** A QR code as an SVG element (qrcode-generator, vendored), with the text printed above it, as the brief asks. */
export async function qr(text, { caption = true } = {}) {
    const { default: qrcode } = await import('../vendor/qrcode-generator/2.0.4/qrcode.mjs')
    const q = qrcode(0, 'L'); q.addData(String(text), 'Byte'); q.make()
    const n = q.getModuleCount(), m = 4, size = n + m * 2
    let d = ''
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (!q.isDark(r, c)) continue
        let run = 1; while (c + run < n && q.isDark(r, c + run)) run++
        d += `M${c + m} ${r + m}h${run}v1h-${run}z`; c += run - 1
    }
    const wrap = h('div', { class: 'code' })
    if (caption) wrap.append(h('p', { class: 'printable' }, String(text).length > 64 ? String(text).slice(0, 60) + '…' : String(text)))
    wrap.insertAdjacentHTML('beforeend', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`)
    return wrap
}

// ------------------------------------------------------------ the register
let dirCache = null
/** The register: { index, records (read and checked here, in this browser), byFp, graph, fixturesGraph }. */
export function loadDirectory() {
    if (dirCache) return dirCache
    dirCache = (async () => {
        const r = await fetch(new URL('directory/index.json', ROOT), { cache: 'no-cache' })
        if (!r.ok) throw new Error(`the register did not load (${r.status})`)
        const index = await r.json()
        const records = []
        for (const x of index.records) { const r = await D.readRecord(x.statements, { dir: x.fp, fixture: x.fixture }); r.dir = x.dir; records.push(r) }
        const byFp = new Map(records.filter(x => x.fp).map(x => [x.fp, x]))
        return { index, records, byFp, graph: D.graph(records, { anchors: index.anchors }),
                 fixturesGraph: D.graph(records, { anchors: [...index.anchors, ...index.fixture_anchors], includeFixtures: true }) }
    })()
    return dirCache
}
export const bundlesOf = dir => new Map([...dir.byFp].map(([fp, r]) => [fp, r.bundle]))
export function standingPill(g, fp, rec) {
    if (rec && rec.revoked) return h('span', { class: 'pill revoked' }, 'revoked')
    const s = D.standing(g, fp)
    return h('span', { class: 'pill ' + s.level, title: s.text }, s.level === 'linked' ? `${s.degree} step${s.degree === 1 ? '' : 's'}` : s.level)
}

// ------------------------------------------------------------ the vault: one per tab
const SESSION = 'pki.vault.session', LOCAL = 'pki.browser-key.v1', LOCAL_BOOK = 'pki.browser-book.v1'
const session = {
    get() { try { return JSON.parse(sessionStorage.getItem(SESSION) || 'null') } catch (e) { return null } },
    set(v) { try { if (v) sessionStorage.setItem(SESSION, JSON.stringify(v)); else sessionStorage.removeItem(SESSION) } catch (e) { /* memory only */ } },
}
const listeners = new Set()
export const vault = {
    mode: null,               // null (closed) | 'vault' | 'local' | 'browser'
    sg: null, door: null, master: null, book: null, token: '', doors: [], ids: [], inbox: null,
    doorKey: null,            // the door's derivation ({ seed, passphrase, vaultId }); door is the door vault itself
    local: null,              // the decrypted local account, in local mode
    profile: null,            // { username, name, blurb, avatar }, from the book or the local account
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    changed() { for (const fn of listeners) { try { fn(this) } catch (e) { console.error(e) } } },
    get open() { return !!this.mode },
    get me() { return this.ids[0] || null },
    async client(token) { await A.loadLibrary(ROOT); if (!this.sg) this.sg = A.client(token || ''); if (token) this.sg.token = token; return this.sg },

    /** Reopen from the tab's session, quietly; false when there is nothing to reopen. Pages await settled() before
        acting on the vault, so a press made while it is still reopening waits for it instead of acting without it. */
    resume() { if (!this._resuming) this._resuming = this._resume().finally(() => { this._resuming = null }); return this._resuming },
    async settled() { if (this._resuming) await this._resuming.catch(() => false) },
    async _resume() {
        if (this.open) return true
        const s = session.get()
        if (s && s.door && s.local) { try { await this.openLocal(s.door, s.cred || null); return true } catch (e) { session.set(null); return false } }
        if (s && s.door) { try { await this.openDoor(s.door, s.path, s.cred || null); return true } catch (e) { session.set(null); return false } }
        if (s && s.browser) { const pass = s.browser; try { await this.openBrowser(pass); return true } catch (e) { session.set(null); return false } }
        return false
    },
    /** The passkey gesture: PRF bytes, the door, and everything behind it. Throws ENOVAULT with { door, prf } attached. */
    async withPasskey() {
        const prf = await prfBytes(PRF_INPUT_TEXT)
        const door = await doorFrom(prf.bytes)
        try { await this.openDoor(door, prf.path, prf) }
        catch (e) {
            if (e.code === 'ENOVAULT' && L.exists(door)) { await this.openLocal(door, prf); return prf }   // kept in this browser
            if (e.code === 'ENOVAULT') { e.door = door; e.prf = prf } throw e
        }
        return prf
    },
    /**
     * The login: one passkey gesture, whatever is behind it. A vault at the door opens; with none, the account this
     * browser keeps for that passkey opens; with neither, a new account starts, in this browser. The vault server
     * unreachable and a local account here: that opens, and says so. Returns { mode, fresh, offline, prf }.
     */
    async signIn() { return this._signInWith(await prfBytes(PRF_INPUT_TEXT)) },
    /**
     * The sign-up: a new passkey, then the same as signIn. When the authenticator returns the PRF bytes at creation (the
     * spec says they are the bytes an assertion would give), there is one gesture; when not, a second one, the login.
     */
    async signUp(name = '') {
        const cred = await this.makePasskey(name)
        const ext = (cred && cred.getClientExtensionResults && cred.getClientExtensionResults()) || {}
        if (ext.prf && ext.prf.enabled === false) { const e = new Error('The passkey was made, but its provider does not do PRF, so it cannot open a vault here.'); e.code = 'ENOPRF'; throw e }
        if (ext.prf && ext.prf.results && ext.prf.results.first) return this._signInWith({ bytes: new Uint8Array(ext.prf.results.first), path: cred.authenticatorAttachment || 'not reported', credId: cred.id })
        return this.signIn()
    },
    async _signInWith(prf) {
        const door = await doorFrom(prf.bytes)
        try { await this.openDoor(door, prf.path, prf); return { mode: 'vault', prf } }
        catch (e) {
            if (e.code === 'ENOVAULT') {
                if (L.exists(door)) { await this.openLocal(door, prf); return { mode: 'local', prf } }
                await this.createLocal(door, prf); return { mode: 'local', fresh: true, prf }
            }
            if (L.exists(door)) { await this.openLocal(door, prf); return { mode: 'local', prf, offline: err(e) } }
            throw e
        }
    },
    async openLocal(door, prf) {
        const acct = await L.read(door)
        if (!acct) { const e = new Error('this browser keeps no account for that passkey'); e.code = 'ENOLOCAL'; throw e }
        const ids = []
        for (const k of acct.keys) { try { ids.push(await L.identityOf(k)) } catch (e) { /* a key that does not read is left, not dropped */ } }
        ids.sort((a, b) => (b.bundle.signing_fingerprint === acct.default) - (a.bundle.signing_fingerprint === acct.default))
        Object.assign(this, { mode: 'local', doorKey: door, door: null, local: acct, ids, profile: acct.profile || null, master: null, book: null, token: '', doors: [], inbox: null, browserIds: null })
        session.set({ door, local: true, cred: credOf(prf) })
        this.changed()
    },
    async createLocal(door, prf) { await L.write(door, L.empty()); await L.persist(); await this.openLocal(door, prf) },
    async saveLocal() { await L.write(this.doorKey, this.local) },
    /** Local to vault: the three vaults, made with the access key; every key, the profile and the book moved in; checked; then the browser's copy removed. */
    async upgrade(token) {
        if (this.mode !== 'local') throw new Error('nothing kept in this browser to move')
        if (!token) throw new Error('an SG/Send access key is needed to create vaults')
        const door = this.doorKey, acct = this.local, cred = (session.get() || {}).cred || {}
        const sg = await this.client(token)
        const a = await A.createAccount({ sgSend: sg, door, record: { kind: 'passkey', path: cred.path || '', credential_id: cred.credId || '', device: deviceName() }, token })
        const def = acct.default || (acct.keys[0] && (await L.identityOf(acct.keys[0])).bundle.signing_fingerprint)
        for (const k of acct.keys) { const id = await L.identityOf(k); await A.saveIdentity(a.master, id, { makeDefault: id.bundle.signing_fingerprint === def, role: k.role, persona_of: k.persona_of }) }
        if (acct.profile && (acct.profile.username || acct.profile.name || acct.profile.avatar)) await A.book.saveProfile(a.book, acct.profile)
        Object.assign(this, { mode: 'vault', door: a.door, master: a.master, book: a.book, token, doors: a.doors, inbox: null, profile: acct.profile || null })
        await this.moveBook(acct.book)
        this.ids = await A.identities(a.master)
        if (this.ids.length < acct.keys.length) throw new Error(`${acct.keys.length - this.ids.length} key(s) did not read back from the vault; the copy in this browser is kept`)
        L.remove(door); this.local = null
        session.set({ door, path: cred.path || '', cred })
        this.changed()
        return a.recovery
    },
    async saveProfile(p) {
        const profile = { username: '', name: '', blurb: '', avatar: '', ...(this.profile || {}), ...p, updated: new Date().toISOString() }
        if (this.mode === 'vault') await A.book.saveProfile(this.book, profile)
        else if (this.mode === 'local') { this.local.profile = profile; await this.saveLocal() }
        else throw new Error('sign in with a passkey to keep a profile')
        this.profile = profile
        this.changed()
    },
    async openDoor(door, path = '', prf = null) {
        const carry = this.mode === 'browser' ? (this.browserIds || []) : []      // a browser key moves into the vault
        const sg = await this.client('')
        const u = await A.unlock({ sgSend: sg, door })
        Object.assign(this, { mode: 'vault', door: u.door, master: u.master, book: u.book, token: u.token, doors: u.doors })
        this.ids = await A.identities(u.master)
        const missing = carry.filter(c => !this.ids.some(i => i.bundle.signing_fingerprint === c.bundle.signing_fingerprint))
        if (missing.length && this.token) { for (const c of missing) await A.saveIdentity(u.master, c, { makeDefault: !this.ids.length }); this.ids = await A.identities(u.master) }
        if (carry.length && this.token) await this.moveLocalBook()
        this.inbox = await A.readInbox(u.master)
        this.doorKey = door; this.local = null
        this.profile = u.book ? await A.book.profile(u.book).catch(() => null) : null
        session.set({ door, path, cred: credOf(prf) || (session.get() || {}).cred || null })
        this.changed()
    },
    async create(door, prf, token) {
        const sg = await this.client(token)
        const a = await A.createAccount({ sgSend: sg, door, record: { kind: 'passkey', path: prf.path, credential_id: prf.credId, device: deviceName() }, token })
        Object.assign(this, { mode: 'vault', door: a.door, master: a.master, book: a.book, token, doors: a.doors, ids: [], inbox: null, doorKey: door, local: null, profile: null })
        session.set({ door, path: prf.path, cred: credOf(prf) })
        // a key the browser was holding moves in now
        const local = readLocal()
        if (local && this.browserIds && this.browserIds.length) { for (const id of this.browserIds) await A.saveIdentity(this.master, id, { makeDefault: true }); this.ids = await A.identities(this.master); await this.moveLocalBook() }
        this.changed()
        return a.recovery
    },
    /** The recovery code: open the recovery door; with a passkey's door given, add it as a door of its own. */
    async recover(code, door = null, prf = null) {
        const bytes = recoveryBytes(code); if (!bytes) throw new Error('that is not a 26-character recovery code')
        const rdoor = await doorFrom(bytes)
        await this.openDoor(rdoor, 'recovery')
        if (door && prf) {
            if (!this.token) throw new Error('the master holds no access key, so a door cannot be written from here')
            await A.addDoor({ sgSend: this.sg, master: this.master, door, record: { kind: 'passkey', path: prf.path, credential_id: prf.credId, device: deviceName() } })
            session.set({ door, path: prf.path, cred: credOf(prf) })
        }
    },
    /** A new passkey for this site. The name is what the passkey list shows; nothing else about the person goes in it. */
    async makePasskey(name = '') {
        const n = String(name || '').trim().slice(0, 64)
        return navigator.credentials.create({ publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { id: location.hostname, name: 'pki.sgit.ai' },
            user: { id: crypto.getRandomValues(new Uint8Array(16)), name: n ? `${n} · pki.sgit.ai` : 'pki.sgit.ai', displayName: n || 'Your keys on pki.sgit.ai' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
            authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
            extensions: { prf: { eval: { first: await sha256(PRF_INPUT_TEXT) } } }, timeout: 120000,
        } })
    },
    /** What the browser mode kept (its statements and contacts) into the book, skipping what is already there. */
    async moveLocalBook() { return this.moveBook(localBook()) },
    async moveBook(b) {
        for (const [fp, sts] of Object.entries(b.record || {})) {
            const have = new Set(await Promise.all((await A.book.statements(this.book, fp)).map(x => K.statementId(x))))
            for (const st of sts) if (!have.has(await K.statementId(st))) await A.book.addStatement(this.book, st)
        }
        for (const c of Object.values(b.contacts || {})) await A.book.saveContact(this.book, c)
        for (const sub of Object.values(b.agents || {})) await A.book.saveAgent(this.book, sub)
    },
    // -------------------------------------------------------- browser mode
    async openBrowser(passphrase) {
        const local = readLocal(); if (!local) throw new Error('this browser holds no key')
        const ids = []
        for (const k of local.keys) ids.push({ ...(await K.importKeystore({ privateKeyPem: k.private_key, signingPrivatePem: k.signing_private, passphrase, label: k.label, created: k.created })), label: k.label })
        Object.assign(this, { mode: 'browser', ids, browserIds: ids, master: null, book: null, token: '', inbox: null })
        session.set({ browser: passphrase })
        this.changed()
    },
    async keepInBrowser(id, passphrase) {
        const local = readLocal() || { v: 1, keys: [] }
        local.keys = local.keys.filter(k => k.signing_fingerprint !== id.bundle.signing_fingerprint)
        local.keys.unshift({ label: id.bundle.label, signing_fingerprint: id.bundle.signing_fingerprint, created: id.created || Date.now(),
                             private_key: await K.encryptPrivate(id.private.encrypt, passphrase), signing_private: await K.encryptPrivate(id.private.sign, passphrase) })
        localStorage.setItem(LOCAL, JSON.stringify(local))
        await this.openBrowser(passphrase)
    },
    // -------------------------------------------------------- keys and the book, in either mode
    async addIdentity(id, { role = '', persona_of = '' } = {}) {
        if (!this.ids.length && !role) role = 'master'                  // the first key is the master: the others are signed from it
        if (this.mode === 'vault') { await A.saveIdentity(this.master, id, { makeDefault: !this.ids.length, role, persona_of }); this.ids = await A.identities(this.master) }
        else if (this.mode === 'local') {
            this.local.keys = this.local.keys.filter(k => k.sign !== K.b64(id.private.sign)).concat([L.keptOf(id, { role, persona_of })])
            if (!this.local.default) this.local.default = id.bundle.signing_fingerprint
            await this.saveLocal(); this.ids = await this._localIds()
        }
        else throw new Error('open a vault, or keep the key in this browser, first')
        this.changed()
    },
    async setDefault(fp) {
        if (this.mode === 'vault') { await A.setDefault(this.master, fp); this.ids = await A.identities(this.master) }
        else if (this.mode === 'local') { this.local.default = fp; await this.saveLocal(); this.ids = await this._localIds() }
        else this.ids.sort((a, b) => (b.bundle.signing_fingerprint === fp) - (a.bundle.signing_fingerprint === fp))
        this.changed()
    },
    async _localIds() {
        const ids = []; for (const k of this.local.keys) { try { ids.push(await L.identityOf(k)) } catch (e) { /* left */ } }
        return ids.sort((a, b) => (b.bundle.signing_fingerprint === this.local.default) - (a.bundle.signing_fingerprint === this.local.default))
    },
    /** The book outside a vault: the local account's in local mode, the browser mode's own otherwise. */
    _lb() { if (this.mode === 'local') { const b = this.local.book = this.local.book || {}; b.record = b.record || {}; b.contacts = b.contacts || {}; b.agents = b.agents || {}; return b } return localBook() },
    async _saveLb(b) { if (this.mode === 'local') { this.local.book = b; await this.saveLocal() } else saveLocalBook(b) },
    async statements(fp) { return this.mode === 'vault' ? A.book.statements(this.book, fp) : (this._lb().record[fp] || []) },
    async addStatement(st) {
        if (this.mode === 'vault') return A.book.addStatement(this.book, st)
        const b = this._lb(); (b.record[st.record] = b.record[st.record] || []).push(st); await this._saveLb(b)
    },
    async contacts() { return this.mode === 'vault' ? A.book.contacts(this.book) : Object.values(this._lb().contacts) },
    async saveContact(c) { if (this.mode === 'vault') return A.book.saveContact(this.book, c); const b = this._lb(); b.contacts[c.bundle.signing_fingerprint] = { v: 1, ...c, updated: new Date().toISOString() }; await this._saveLb(b) },
    async agents() { return this.mode === 'vault' ? A.book.agents(this.book) : Object.values(this._lb().agents || {}) },
    async saveAgent(sub) { if (this.mode === 'vault') return A.book.saveAgent(this.book, sub); const b = this._lb(); (b.agents = b.agents || {})[sub.record] = sub; await this._saveLb(b) },
    async removeContact(fp) { if (this.mode === 'vault') return A.book.removeContact(this.book, fp); const b = this._lb(); delete b.contacts[fp]; await this._saveLb(b) },
    /** The master key: the one marked so, or (for keys made before roles) the default. Personas are the keys that name it. */
    get masterKey() { return this.ids.find(i => i.role === 'master') || this.ids.find(i => !i.role || i.role !== 'persona') || null },
    personasOf(fp) { return this.ids.filter(i => i.role === 'persona' && i.persona_of === fp) },
    close() { session.set(null); Object.assign(this, { mode: null, door: null, master: null, book: null, token: '', doors: [], ids: [], inbox: null, browserIds: null, doorKey: null, local: null, profile: null }); this.changed() },
}
const credOf = prf => prf && (prf.path || prf.credId) ? { path: prf.path || '', credId: prf.credId || '' } : null
function readLocal() { try { return JSON.parse(localStorage.getItem(LOCAL) || 'null') } catch (e) { return null } }
function localBook() { try { return JSON.parse(localStorage.getItem(LOCAL_BOOK) || 'null') || { v: 1, record: {}, contacts: {} } } catch (e) { return { v: 1, record: {}, contacts: {} } } }
function saveLocalBook(b) { localStorage.setItem(LOCAL_BOOK, JSON.stringify(b)) }
export const hasBrowserKey = () => !!readLocal()
function deviceName() { const ua = navigator.userAgent || ''; return /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'a browser' }

/** A default avatar: a 5×5 mirrored pattern from a hash (FNV-1a, then xorshift) of a name, as an SVG data: URL. Deterministic, offline. */
export function avatarFor(seed) {
    let x = 2166136261 >>> 0; const bits = []
    for (const c of String(seed || '?')) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0 }
    for (let i = 0; i < 15; i++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; bits.push(x & 1) }
    const hue = x % 360, fg = `hsl(${hue} 55% 42%)`, bg = `hsl(${hue} 40% 92%)`
    let r = ''; for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) if (bits[row * 3 + col]) for (const c of new Set([col, 4 - col])) r += `<rect x="${c + 1}" y="${row + 1}" width="1" height="1"/>`
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 7" shape-rendering="crispEdges"><rect width="7" height="7" fill="${bg}"/><g fill="${fg}">${r}</g></svg>`)
}

// ------------------------------------------------------------ the vault bar
/**
 * The bar at the top of a tool page: closed (Open with my passkey · I have a recovery code · browser key), the
 * first-time flow (make a passkey, create the vaults with an access key), and open (whose keys, which mode, Close).
 * opts.accessKey: an access key an invitation carried, offered when the vaults are created.
 */
export function vaultBar(mount, opts = {}) {
    const bar = h('div', { class: 'vbar', id: 'vault-bar' }), panel = h('div', { id: 'vault-panel' })
    mount.replaceChildren(bar, panel)
    const say = (...kids) => panel.replaceChildren(h('div', { class: 'vpanel' }, ...kids))
    const draw = () => {
        panel.replaceChildren()
        if (vault.open) {
            const me = vault.me, pr = vault.profile
            bar.replaceChildren(
                pr && (pr.avatar || pr.username) ? h('img', { class: 'vav', alt: '', src: pr.avatar || avatarFor(pr.username || (me && me.bundle.signing_fingerprint) || '') }) : null,
                h('span', { class: 'state open' }, vault.mode === 'vault' ? '● Your vault is open' : vault.mode === 'local' ? '● Signed in · kept in this browser' : '● Your key, from this browser'),
                h('span', { class: 'who' }, pr && pr.username ? `@${pr.username} · ` : '', me ? `${me.bundle.label || 'your key'} · ${me.bundle.signing_fingerprint}` : 'no key yet'),
                h('span', { class: 'grow' }),
                h('a', { class: 'btn small', href: pageUrl('account/index.html') }, 'Your account'),
                h('a', { class: 'btn small', href: pageUrl('vault/index.html') }, 'Your vault'),
                ...(vault.mode === 'browser' ? [h('button', { type: 'button', class: 'btn small', title: 'Open (or create) a vault with a passkey; this browser’s key moves into it', onclick: e => busy(e.target, withPasskey) }, 'Move into a vault')] : []),
                ...(vault.mode === 'local' ? [h('button', { type: 'button', class: 'btn small', title: 'Create your vault with an access key; everything this browser keeps moves into it', onclick: () => upgradePanel() }, 'Move into a vault')] : []),
                h('button', { type: 'button', class: 'btn small', onclick: () => vault.close() }, 'Close'))
            return
        }
        const open = h('button', { type: 'button', class: 'btn primary', id: 'vault-open' }, 'Open with my passkey')
        open.addEventListener('click', () => busy(open, withPasskey))
        bar.replaceChildren(h('span', { class: 'state' }, '○ Your vault is closed'), h('span', { class: 'grow' }), open,
            h('button', { type: 'button', class: 'btn small', onclick: recover }, 'Recovery code'),
            ...(hasBrowserKey() ? [h('button', { type: 'button', class: 'btn small', onclick: browserOpen }, 'Key in this browser')] : []))
    }
    async function withPasskey() {
            say(h('p', { class: 'dim' }, 'Waiting for your passkey…'))
            try { await vault.withPasskey() }
            catch (e) {
                if (e.code === 'ENOVAULT') return firstTime(e.door, e.prf)
                if (e.code === 'ENOPRF') return say(msg('warn', 'Your passkey signed but gave no PRF bytes, so it cannot open a vault here. Some password managers do this. Use another passkey provider (the platform’s own usually works), the recovery code, or keep the key in this browser for now.'))
                return say(msg('warn', `No passkey answered (${err(e)}).`), h('p', {}, 'If you have no passkey for pki.sgit.ai yet, make one, then open with it.'),
                    h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: makePasskey }, 'Make a passkey for pki.sgit.ai')))
            }
    }
    async function makePasskey() {
        try { await vault.makePasskey(); say(msg('ok', 'A passkey was made for pki.sgit.ai. Now open with it: the first time, there is no vault behind it yet, and the page will make one.')) }
        catch (e) { say(msg('warn', `The passkey was not made: ${err(e)}`)) }
    }
    function upgradePanel() {
        const access = h('input', { class: 't', type: 'password', autocomplete: 'off', placeholder: 'an SG/Send access key', value: opts.accessKey || '' })
        const go = h('button', { type: 'button', class: 'btn primary' }, 'Create my vault')
        go.addEventListener('click', () => busy(go, async () => {
            if (!access.value.trim()) return panel.prepend(msg('warn', 'An access key is needed to create vaults.'))
            panel.prepend(msg('', 'Creating three vaults (a door, a master, a book), moving your keys, profile and record in, and a recovery door…'))
            try { showRecovery(await vault.upgrade(access.value.trim())) } catch (e) { panel.prepend(msg('bad', err(e))) }
        }))
        say(h('h3', {}, 'Move into a vault'), h('p', { class: 'small' }, 'Your account is kept in this browser only. With an access key, it moves into a vault opened by the same passkey, and then follows you to every device; the copy here is removed once the vault reads it back.'),
            h('label', { class: 'f' }, 'SG/Send access key'), access, h('div', { class: 'acts' }, go))
    }
    function showRecovery(rc) {
        say(msg('warn', h('b', {}, 'Your recovery code, shown once. Write it down: '), h('span', { class: 'mono', id: 'recovery-code' }, rc.shown)),
            h('p', { class: 'dim small' }, 'It opens a second door to the same master: for a device with no passkey, and for the day the passkey is gone. This page does not keep it.'),
            h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn', onclick: () => draw() }, 'I have written it down')))
    }
    function firstTime(door, prf) {
        const access = h('input', { class: 't', type: 'password', autocomplete: 'off', placeholder: 'an SG/Send access key', value: opts.accessKey || '' })
        const code = h('input', { class: 't', type: 'text', autocomplete: 'off', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX' })
        const go = h('button', { type: 'button', class: 'btn primary' }, 'Create my vault')
        go.addEventListener('click', () => busy(go, async () => {
            if (!access.value.trim()) return say(msg('warn', 'An access key is needed to create vaults. Ask whoever invited you, or write to agent@riskmandate.ai.'))
            panel.prepend(msg('', 'Creating three vaults (a door, a master, a book) and a recovery door…'))
            try {
                showRecovery(await vault.create(door, prf, access.value.trim()))
            } catch (e) { say(msg('bad', e.code === 'EEXISTS' ? 'A vault already exists at this door: open with the passkey again.' : err(e))) }
        }))
        const join = h('button', { type: 'button', class: 'btn' }, 'Add this passkey with the code')
        join.addEventListener('click', () => busy(join, async () => { try { await vault.recover(code.value, door, prf); draw() } catch (e) { panel.prepend(msg('bad', e.code === 'ENOVAULT' ? 'No vault answers to that code.' : err(e))) } }))
        say(h('h3', {}, 'No vault behind this passkey yet'),
            h('p', { class: 'dim small' }, `Your passkey derived the address ${door.vaultId}, and nothing is there. Either this is your first time here, or your vault was made with another passkey.`),
            h('h3', {}, 'First time: create your vault'),
            h('p', { class: 'small' }, 'Three vaults are made: a door at that address, a master that will hold your private keys, and a book for your record, contacts and messages. The access key is written into the master, so no other device of yours needs it typed.'),
            h('label', { class: 'f' }, 'SG/Send access key ', h('span', { class: 'dim' }, opts.accessKey ? '(handed to you: in your invitation or a sealed message)' : '(from whoever invited you)')), access,
            h('div', { class: 'acts' }, go),
            h('h3', {}, 'Already have a vault from another device'),
            h('label', { class: 'f' }, 'Recovery code'), code, h('div', { class: 'acts' }, join),
            h('h3', {}, 'No access key yet'),
            h('p', { class: 'small' }, 'Keep everything in this browser, encrypted with a key this passkey derives: no passphrase. It moves into a vault when you have an access key.'),
            h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn', onclick: e => busy(e.target, async () => { try { await vault.createLocal(door, prf) } catch (x) { panel.prepend(msg('bad', err(x))) } }) }, 'Keep it in this browser')))
    }
    function recover() {
        const code = h('input', { class: 't', type: 'text', autocomplete: 'off', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX' })
        const go = h('button', { type: 'button', class: 'btn primary' }, 'Open')
        go.addEventListener('click', () => busy(go, async () => { try { await vault.recover(code.value) } catch (e) { panel.prepend(msg('bad', e.code === 'ENOVAULT' ? 'No vault answers to that code.' : err(e))) } }))
        say(h('h3', {}, 'Open with the recovery code'), code, h('div', { class: 'acts' }, go))
    }
    function browserOpen() {
        const pass = h('input', { class: 't', type: 'password', autocomplete: 'current-password', placeholder: 'the passphrase you chose' })
        const go = h('button', { type: 'button', class: 'btn primary' }, 'Unlock')
        go.addEventListener('click', () => busy(go, async () => { try { await vault.openBrowser(pass.value) } catch (e) { panel.prepend(msg('bad', err(e))) } }))
        say(h('h3', {}, 'The key kept in this browser'), h('p', { class: 'dim small' }, 'Its private halves are encrypted with your passphrase, in the same format sgit keeps them.'), pass, h('div', { class: 'acts' }, go))
    }
    vault.onChange(draw)
    draw()
    vault.resume().then(ok => { if (!ok) draw() })
    /** A grant opened on this page offers its access key to the vault's first-time form. */
    const setAccessKey = k => { opts.accessKey = k; draw() }
    return { draw, say, setAccessKey, showRecovery }
}
