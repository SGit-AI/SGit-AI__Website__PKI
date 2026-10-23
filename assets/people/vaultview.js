/**
 * vaultview.js: a vault, seen from a vault key that came sealed to you. The key is read from the opened message,
 * held in this tab's memory and never shown, typed or put in an address; the vault is read here (no access key is
 * needed to read), its files listed, and each one shown the way a message's files are: in a sandboxed frame of its
 * own origin that loads nothing (preview.js). Files are someone else's bytes, and are treated as such.
 *
 *   vaultKeyIn(bytes)            the vault key a file holds (prefixed, or passphrase:vault-id alone), or null
 *   vaultViewer(key, { from })   the element: the vault's files, and a frame for the one chosen
 *   openVaultWindow(key)         the vault page (v/) in a new window, the key handed over by postMessage, same origin only
 *
 * @module vaultview
 */
import { h, msg, err, vault, pageUrl, ROOT, K, A } from './ui.js'
import { frameFor } from './preview.js'
import * as M from './message.js'
import { readImage } from './qrimage.js'
import { keyExchange } from './exchange.js'
import { appEntry, mountApp } from './vaultapp.js'

const KEY_RE = /(?:sgit_private_vault_)?([a-z0-9]{16,64}):([a-z0-9]{6,32})\b/
export function vaultKeyIn(bytes) {
    let t; try { t = new TextDecoder('utf-8', { fatal: true }).decode(bytes instanceof Uint8Array ? bytes : K.unb64(bytes)) } catch (e) { return null }
    if (t.length > 4096) return null
    const m = KEY_RE.exec(t)
    return m ? `${m[1]}:${m[2]}` : null
}
export const vaultIdOf = key => key.split(':').pop()

/** Hand a key to the vault page in a new window: it says it is ready, and only then, to that window, at this origin. */
export function openVaultWindow(key, from = '') {
    const w = window.open(pageUrl('v/index.html'), '_blank')
    if (!w) return false
    const onReady = e => {
        if (e.source !== w || e.origin !== location.origin || !e.data || e.data.kind !== 'pki.vault-ready') return
        w.postMessage({ kind: 'pki.vault-key', key, from }, location.origin)
        window.removeEventListener('message', onReady)
    }
    window.addEventListener('message', onReady)
    setTimeout(() => window.removeEventListener('message', onReady), 60000)
    return true
}
/** On the vault page: a key from the window that opened it, at this origin, once. */
export function receiveVaultKey(onKey) {
    if (!window.opener) return
    window.addEventListener('message', e => {
        if (e.source !== window.opener || e.origin !== location.origin || !e.data || e.data.kind !== 'pki.vault-key' || typeof e.data.key !== 'string') return
        onKey(e.data.key, e.data.from || '')
    })
    window.opener.postMessage({ kind: 'pki.vault-ready' }, location.origin)
}

async function readBytes(v, path) {
    const parts = path.split('/').filter(Boolean), name = parts.pop(), folder = '/' + parts.join('/')
    await A.NV.ensureLoaded(v, folder)
    return new Uint8Array(await v.getFile(folder, name))
}
/** Files that hold a secret: private keys, tokens, keys of other vaults. */
const SECRET = /(^|\/)(private_key\.pem|signing_private\.pem|[^/]*private[^/]*\.pem|access-token\.json|[^/]*-key\.json|[^/]*token[^/]*|recovery-code\.json|master-key\.json|vault-key[^/]*)$/i
const size = n => n < 1024 ? `${n} bytes` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`

const FULL = 'pki.vv.full'
const fullPref = () => { try { return localStorage.getItem(FULL) !== '0' } catch (e) { return true } }
/** The page's full width: the site's nav, footer and the page's own top give way to the vault, as on vault.sgraph.ai. */
export function setFull(on) { document.body.classList.toggle('vv-full', !!on); try { localStorage.setItem(FULL, on ? '1' : '0') } catch (e) { /* fine */ } }

/** A vault opened from its key: its own app when it has one (as the SG/App host runs it), or its files. */
export function vaultViewer(key, { from = '', popout = false, onClose = null } = {}) {
    const id = vaultIdOf(key)
    const box = h('section', { class: 'vaultview', id: 'vault-view' })
    const title = h('span', { class: 'vv-title' }, 'Opening the vault…'), status = h('span', { class: 'vv-chips' })
    const modeApp = h('button', { type: 'button', class: 'vv-tab', id: 'vv-mode-app', hidden: true }, 'App'), modeFiles = h('button', { type: 'button', class: 'vv-tab', id: 'vv-mode-files' }, 'Files')
    const give = h('div', { id: 'vv-give' })
    const fullBtn = h('button', { type: 'button', class: 'vv-btn', id: 'vv-full-btn', title: 'Use the whole window' })
    const syncFull = () => { fullBtn.textContent = document.body.classList.contains('vv-full') ? '⤡ Page' : '⤢ Full width' }
    fullBtn.addEventListener('click', () => { setFull(!document.body.classList.contains('vv-full')); syncFull() })
    const hud = h('div', { class: 'vv-hud' },
        h('span', { class: 'vv-brand' }, 'SG', h('i', {}, '/'), 'App'), title,
        h('span', { class: 'vv-id mono', title: from ? `its key came sealed from ${from}` : '' }, id), status,
        h('span', { class: 'vv-grow' }),
        h('span', { class: 'vv-tabs' }, modeApp, modeFiles),
        h('button', { type: 'button', class: 'vv-btn primary', id: 'vv-give-btn', onclick: () => { if (give.firstChild) give.replaceChildren(); else give.replaceChildren(givePanel(key)) } }, 'Give to an agent…'),
        popout ? h('button', { type: 'button', class: 'vv-btn', onclick: () => openVaultWindow(key, from) }, '↗') : null,
        fullBtn,
        onClose ? h('button', { type: 'button', class: 'vv-btn', id: 'vv-close', title: 'Close the vault', onclick: () => { setFull(false); onClose() } }, '✕') : null,
        h('span', { class: 'vv-ro', title: 'Opened with a key that came sealed to you: read only' }, '👁 Read-only'))
    const loading = h('div', { class: 'vv-loading' }, h('div', { class: 'vv-lock' }, '🔐'), h('b', {}, 'Loading vault'), h('div', { class: 'vv-bar' }, h('i')), h('span', { class: 'dim small' }, 'Opening vault…'))
    const appHost = h('div', { class: 'vv-app', id: 'vv-app', hidden: true })
    const list = h('ul', { class: 'tree', id: 'vv-tree' })
    const view = h('div', { class: 'viewer', id: 'vv-file' }, h('p', { class: 'dim small' }, 'Pick a file.'))
    const filesPane = h('div', { class: 'vv-files', hidden: true }, h('p', { class: 'dim small' }, 'The key is in this tab’s memory only: not shown, not in the address. Files open in a sandbox that runs and loads nothing.'), h('div', { class: 'explore' }, list, view))
    const mode = m => { appHost.hidden = m !== 'app'; filesPane.hidden = m !== 'files'; modeApp.classList.toggle('on', m === 'app'); modeFiles.classList.toggle('on', m === 'files') }
    modeApp.addEventListener('click', () => mode('app')); modeFiles.addEventListener('click', () => mode('files'))
    box.append(hud, give, loading, appHost, filesPane)
    setFull(fullPref()); syncFull()
    ;(async () => {
        try {
            await A.loadLibrary(ROOT)
            loading.querySelector('span').textContent = 'Decrypting its tree…'
            const v = await A.NV.openVault(vault.sg || A.client(''), key)
            const files = await A.tree(v)
            let first = null
            for (const f of files) {
                const label = f.path.split('/').pop()
                if (f.folder) { list.append(h('li', { class: 'dir', style: `padding-left:${f.depth * .9}rem` }, '▸ ', label, '/')); continue }
                const secret = SECRET.test(f.path)
                const b = h('button', { type: 'button', class: 'linkish' + (secret ? ' secret' : '') }, secret ? '🔒 ' : '', label)
                b.addEventListener('click', () => show(v, f.path, view, list, b, secret))
                list.append(h('li', { style: `padding-left:${f.depth * .9}rem` }, b))
                if (!secret && (!first || /(^|\/)(README\.md|index\.md)$/i.test(f.path) && f.depth === 0)) first = { f, b }
            }
            if (!files.length) list.append(h('li', { class: 'dim' }, '(empty)'))
            status.append(h('span', { class: 'vv-chip' }, `${files.filter(f => !f.folder).length} files`), from ? h('span', { class: 'vv-chip', title: 'who sealed its key to you' }, `from ${from}`) : null)
            if (first) show(v, first.f.path, view, list, first.b)
            const app = await appEntry(v)
            loading.remove()
            if (!app) { title.textContent = 'Files'; mode('files'); return }
            title.textContent = app.title || app.entry
            modeApp.hidden = false
            mode('app')
            const errs = h('span', { class: 'vv-chip bad', hidden: true })
            status.append(errs)
            await mountApp(v, appHost, app, { info: { vaultName: app.title || '' }, onError: m => { errs.hidden = false; errs.textContent = '⚠ the app reported an error'; errs.title = m } })
        } catch (e) { loading.replaceWith(msg('bad', e.code === 'ENOVAULT' ? `No vault answers to that key (${id}).` : 'The vault did not open: ' + err(e))); title.textContent = 'Not opened' }
    })()
    return box
}
async function show(v, path, view, list, btn, secret = false) {
    for (const x of list.querySelectorAll('button.on')) x.classList.remove('on')
    btn.classList.add('on')
    if (secret) {                                       // a private key or a token in the vault: masked until asked for
        const go = h('button', { type: 'button', class: 'btn small' }, 'Reveal on this screen')
        view.replaceChildren(h('div', { class: 'vh' }, h('b', { class: 'mono' }, path)), h('p', { class: 'small warn' }, '•••••••• a secret (a private key, a token or a vault key): masked. Revealing it puts it on your screen.'), h('div', { class: 'acts' }, go))
        return go.addEventListener('click', () => show(v, path, view, list, btn, false))
    }
    view.replaceChildren(h('p', { class: 'dim small' }, 'Reading…'))
    try {
        const bytes = await readBytes(v, path), name = path.split('/').pop()
        const f = frameFor(name, bytes, h)
        view.replaceChildren(h('div', { class: 'vh' }, h('b', { class: 'mono' }, path), ' ', h('span', { class: 'dim small' }, size(bytes.length))),
            f ? f.el : h('p', { class: 'dim small' }, 'Not something a page shows safely: download it instead.'),
            h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn small', onclick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([bytes])), download: name }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000) } }, '⬇ Download')))
    } catch (e) { view.replaceChildren(msg('bad', err(e))) }
}

/** What "Open the vault" does: a new window by default; the vault page opens it in place. */
let opener = (key, from) => openVaultWindow(key, from)
export const setVaultOpener = fn => { opener = fn }
export const openVault = (key, from = '') => opener(key, from)

/** Give the vault open here to an agent: bring its key QR image, confirm its fingerprint, and the vault key is sealed
    to it as a file (sgit's full form), never shown: the key exchange, with this vault as the first thing to give. */
function givePanel(key) {
    const id = vaultIdOf(key), [pass] = key.split(':')
    const file = M.vaultKeyFile({ id, key: 'sgit_private_' + 'vault_' + pass + ':' + id })
    const out = h('div'), img = h('input', { type: 'file', accept: 'image/*', id: 'vv-agent-key', class: 'visually-hidden' })
    const take = async f => {
        try {
            const q = M.parseQrText(await readImage(f))
            if (q.kind !== 'key') return out.replaceChildren(msg('warn', 'That image is a sealed message, not an agent’s public key.'))
            const b = await M.parseKeyCode(q.code)
            if (q.fp && q.fp !== b.signing_fingerprint) return out.replaceChildren(msg('bad', 'The fingerprint this QR code names is not the one its key computes to: refused.'))
            const dir = await import('./ui.js').then(u => u.loadDirectory()).catch(() => null)
            out.replaceChildren(keyExchange(q, b, dir && dir.byFp.get(b.signing_fingerprint), { extra: [{ label: `The key of this vault (${id}), as a file`, file }] }))
        } catch (e) { out.replaceChildren(msg('bad', err(e))) }
    }
    img.addEventListener('change', () => { if (img.files[0]) take(img.files[0]) })
    // while this panel is open, a pasted image is the agent's key: caught before the page's own desk sees it
    const onPaste = e => {
        if (!panel.isConnected) return window.removeEventListener('paste', onPaste, true)
        const f = [...(e.clipboardData && e.clipboardData.items || [])].filter(i => i.kind === 'file').map(i => i.getAsFile())[0]
        if (f) { e.preventDefault(); e.stopPropagation(); take(f) }
    }
    window.addEventListener('paste', onPaste, true)
    const panel = h('div', { class: 'vpanel' }, h('p', { class: 'small' }, 'Paste the agent’s key QR image here (it makes one with ', h('code', {}, 'node pki-agent.mjs keyqr --out key.png'), '), or choose it. The vault key goes sealed to that key alone, as a file.'),
        h('div', { class: 'acts' }, h('label', { class: 'btn primary', for: 'vv-agent-key' }, 'Choose the agent’s key image'), img), out)
    return panel
}
