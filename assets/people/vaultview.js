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
const size = n => n < 1024 ? `${n} bytes` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`

export function vaultViewer(key, { from = '', popout = false } = {}) {
    const id = vaultIdOf(key)
    const box = h('section', { class: 'vaultview', id: 'vault-view' })
    const head = h('div', { class: 'vv-head' }, h('b', {}, 'Vault ', h('span', { class: 'mono' }, id)), from ? h('span', { class: 'dim small' }, ` · its key came sealed from ${from}`) : null)
    if (popout) head.append(h('button', { type: 'button', class: 'btn small', onclick: () => openVaultWindow(key, from) }, 'Open in a new window ↗'))
    const list = h('ul', { class: 'tree', id: 'vv-tree' }, h('li', { class: 'dim' }, 'Opening the vault…'))
    const view = h('div', { class: 'viewer', id: 'vv-file' }, h('p', { class: 'dim small' }, 'Pick a file.'))
    box.append(head, h('p', { class: 'dim small' }, 'The key is in this tab’s memory only: not shown, not in the address. Files open in a sandbox that runs and loads nothing.'), h('div', { class: 'explore' }, list, view))
    ;(async () => {
        try {
            await A.loadLibrary(ROOT)
            const v = await A.NV.openVault(vault.sg || A.client(''), key)
            const files = await A.tree(v)
            list.replaceChildren()
            if (!files.length) list.append(h('li', { class: 'dim' }, '(empty)'))
            let first = null
            for (const f of files) {
                const label = f.path.split('/').pop()
                if (f.folder) { list.append(h('li', { class: 'dir', style: `padding-left:${f.depth * .9}rem` }, '▸ ', label, '/')); continue }
                const b = h('button', { type: 'button', class: 'linkish' }, label)
                b.addEventListener('click', () => show(v, f.path, view, list, b))
                list.append(h('li', { style: `padding-left:${f.depth * .9}rem` }, b))
                if (!first || /(^|\/)(README\.md|index\.md)$/i.test(f.path) && f.depth === 0) first = { f, b }
            }
            head.append(h('span', { class: 'dim small' }, ` · ${files.filter(f => !f.folder).length} files`))
            if (first) show(v, first.f.path, view, list, first.b)
        } catch (e) { list.replaceChildren(h('li', {}, msg('bad', e.code === 'ENOVAULT' ? `No vault answers to that key (${id}).` : 'The vault did not open: ' + err(e)))) }
    })()
    return box
}
async function show(v, path, view, list, btn) {
    for (const x of list.querySelectorAll('button.on')) x.classList.remove('on')
    btn.classList.add('on')
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
