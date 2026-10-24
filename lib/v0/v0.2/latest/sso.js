/**
 * sso.js: "Sign in with pki.sgit.ai", for any site. Load it from a released, hash-pinned version,
 * https://pki.sgit.ai/lib/v0/v0.2/v0.2.N/sso.js (with keys.js, message.js, directory.js, delegation.js beside it),
 * or vendor that folder; nothing here talks to a server but the register's public JSON.
 *
 *   const s = await sso({ root: 'sha256:…' })        root: the fingerprint you pinned, out of band; never the register's say-so
 *   await s.login({ can: ['identity', 'sign:feedback'], days: 30 })    makes this browser's key, goes to pki.sgit.ai
 *   const r = await s.finish()     on the page you come back to: { ok, level, identity, delegation } or null
 *   s.session()                    what this browser holds: { identity, delegation, fp } or null
 *   await s.sign(payload)          a note signed by this browser's key, carrying its delegation
 *   await s.verify(note, { need })  anyone's note, checked against the live register: strong, soft, or why not
 *   s.logout()
 *
 * The browser's private key is kept in this site's localStorage, under its own origin: it is worth what its delegation
 * says, at this site only, until its date (strong: until the person withdraws it). The nonce of a request is checked on
 * the way back, so an answer this tab did not ask for is refused.
 *
 * @module sso
 */
import * as K from './keys.js'
import * as D from './directory.js'
import * as M from './message.js'
import * as DG from './delegation.js'

const HERE = new URL(import.meta.url)
const ON_PKI = /(^|\.)pki\.sgit\.ai$/.test(HERE.hostname) || /^(localhost|127\.0\.0\.1)$/.test(HERE.hostname)
const DEFAULT_PKI = ON_PKI ? HERE.origin + '/' : 'https://pki.sgit.ai/'      // served from pki.sgit.ai (assets/ or lib/), or vendored elsewhere

export async function sso({ root, pki = DEFAULT_PKI, store = localStorage, origin = location.origin } = {}) {
    if (!K.FP.test(String(root || ''))) throw new Error('sso: pin the root fingerprint (sha256:<16 hex>) you trust; it is never read from the register')
    const KEY = `pki.sso.v1.${origin}`, NONCE = 'pki.sso.nonce'
    const read = () => { try { return JSON.parse(store.getItem(KEY) || 'null') } catch (e) { return null } }
    const write = v => store.setItem(KEY, JSON.stringify(v))
    let reg = null
    async function graph() {                         // the register, read and checked here, from the pinned root alone
        if (reg) return reg
        const r = await fetch(new URL('directory/index.json', pki), { cache: 'no-cache' })
        if (!r.ok) throw new Error(`the register did not answer (${r.status})`)
        const idx = await r.json(), records = []
        for (const x of idx.records) records.push(await D.readRecord(x.statements, { dir: x.fp, fixture: x.fixture }))
        return (reg = D.graph(records, { anchors: [root] }))
    }
    async function browserKey() {
        const s = read()
        if (s && s.key) return { bundle: s.key.bundle, private: { encrypt: K.unb64(s.key.encrypt), sign: K.unb64(s.key.sign) } }
        const id = await K.generate(`browser key for ${origin}`)
        write({ ...(s || {}), key: { bundle: id.bundle, encrypt: K.b64(id.private.encrypt), sign: K.b64(id.private.sign) } })
        return id
    }
    return {
        async login({ can = ['identity'], days = 30, label = '', returnTo = location.href.split('#')[0] } = {}) {
            const id = await browserKey()
            const nonce = K.b64url(crypto.getRandomValues(new Uint8Array(24)))
            sessionStorage.setItem(NONCE, nonce)
            const req = { v: 1, kind: DG.REQUEST, client: origin, return: returnTo, key: M.keyCode(id.bundle).code, can, days, nonce, ...(label ? { label } : {}) }
            location.assign(new URL('authorize/index.html', pki).href + '#r=' + K.b64url(K.utf8(JSON.stringify(req))))
        },
        async finish() {
            const m = /[#&]pki=([A-Za-z0-9_-]+)/.exec(location.hash)
            if (!m) return null
            history.replaceState(null, '', location.href.split('#')[0])          // out of the address bar and the history
            let r; try { r = JSON.parse(new TextDecoder().decode(K.unb64url(m[1]))) } catch (e) { return { ok: false, why: 'the answer does not read' } }
            const nonce = sessionStorage.getItem(NONCE); sessionStorage.removeItem(NONCE)
            if (!nonce || r.nonce !== nonce) return { ok: false, why: 'an answer this tab did not ask for: refused' }
            if (r.kind === DG.DENIED) return { ok: false, why: 'you said no' }
            if (r.kind !== DG.AUTHORIZED || !r.delegation) return { ok: false, why: 'not a sign-in answer' }
            const s = read() || {}
            if (!s.key || r.delegation.to !== s.key.bundle.signing_fingerprint || r.delegation.nonce !== nonce) return { ok: false, why: 'the delegation is not for this browser’s key' }
            const c = await DG.checkDelegation(r.delegation, { g: await graph(), root, origin })
            if (c.level === 'invalid') return { ok: false, ...c }
            write({ ...s, delegation: r.delegation, identity: r.identity })
            return { ...c, ok: true, pending: c.level === 'not-vouched', identity: r.identity, delegation: r.delegation }
        },
        session() { const s = read(); return s && s.delegation ? { identity: s.identity, delegation: s.delegation, fp: s.key.bundle.signing_fingerprint } : null },
        async status() { const s = read(); return s && s.delegation ? DG.checkDelegation(s.delegation, { g: await graph(), root, origin }) : null },
        async sign(payload) {
            const s = read(); if (!s || !s.delegation) throw new Error('not signed in')
            return DG.signNote(await browserKey(), payload, s.delegation)
        },
        async verify(note, { need = null, from = origin } = {}) { return DG.verifyNote(note, { g: await graph(), root, origin: from, need }) },
        logout() { const s = read(); if (s) write({ key: s.key }) },
        refresh() { reg = null },
    }
}
