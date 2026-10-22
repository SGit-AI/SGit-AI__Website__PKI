/* cards.js: a message as the pages show it, the same on the inbox and on the message page. */
import { h, download, K } from './ui.js'
import { frameFor } from './preview.js'

const size = n => n < 1024 ? `${n} bytes` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`
/** A file that looks like a key or a credential stays closed until asked for: a vault key should not be on a screen
    someone is sharing because a page opened it. */
const looksSecret = f => /key|secret|token|passw|credential|\.pem$/i.test(String(f.name)) || /sgit_(private|public)_|BEGIN [A-Z ]*PRIVATE KEY/.test(atob(String(f.data || '')).slice(0, 4096))
/** One attached file: its name, a sandboxed view when it is something a page can show safely, and a download. The
    first few that can be shown are open; the rest open on a press. */
function fileRow(f, open) {
    const bytes = K.unb64(f.data), view = frameFor(f.name, bytes, h)
    const row = h('div', { class: 'msgfile' })
    const head = h('div', { class: 'acts' }, h('span', { class: 'mono small' }, f.name), h('span', { class: 'dim small' }, size(bytes.length) + (view ? ` · ${view.kind}` : '')))
    if (view) {
        const tog = h('button', { type: 'button', class: 'btn small' }, open ? 'Hide' : 'View')
        tog.addEventListener('click', () => { const on = view.el.isConnected; if (on) view.el.remove(); else row.append(view.el); tog.textContent = on ? 'View' : 'Hide' })
        head.append(tog)
    }
    head.append(h('button', { type: 'button', class: 'btn small', onclick: () => download(f.name, new Blob([bytes]), 'application/octet-stream') }, '⬇ Download'))
    row.append(head)
    if (view && open) row.append(view.el)
    return row
}

/** One message: who it is from and whether that checks (true, false, or null: "not checked", never "forged"), the text, the files. */
export function messageCard(m, verified, nameOf, actions = []) {
    const files = (m.files || []).map((f, i) => fileRow(f, i < 3 && !looksSecret(f)))
    return h('div', { class: 'msgcard' },
        h('div', { class: 'meta' }, m.from ? ['from ', h('b', {}, nameOf(m.from)), verified === true ? h('span', { class: 'ok' }, ' · signature checks') : verified === false ? h('span', { class: 'bad' }, ' · SIGNATURE DOES NOT CHECK') : h('span', { class: 'warn' }, ' · signed by a key not in the register or your contacts')] : 'unsigned: the sender is not named', ` · ${m.at || ''}`),
        m.subject ? h('h3', {}, m.subject) : null,
        m.grant ? h('p', { class: 'msg ok' }, h('b', {}, 'It carries an SG/Send access key'), m.grant.name ? ` (${m.grant.name})` : '', ', sealed to you.') : null, h('div', { class: 'body' }, m.text || ''),
        files.length ? h('div', { class: 'msgfiles' }, ...files, h('p', { class: 'dim small' }, 'Files are shown in a sandbox: their own origin, no scripts, nothing loaded from anywhere. What they are shown as is read from their bytes, not from what the sender called them. A file that looks like a key stays closed until you press View.')) : null,
        actions.length ? h('div', { class: 'acts' }, ...actions) : null)
}
