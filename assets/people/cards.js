/* cards.js: a message as the pages show it, the same on the inbox and on the message page. */
import { h, download, K } from './ui.js'

/** One message: who it is from and whether that checks (true, false, or null: "not checked", never "forged"), the text, the files. */
export function messageCard(m, verified, nameOf, actions = []) {
    const files = (m.files || []).map(f => h('button', { type: 'button', class: 'btn small', onclick: () => download(f.name, new Blob([K.unb64(f.data)]), f.type) }, `⬇ ${f.name}`))
    return h('div', { class: 'msgcard' },
        h('div', { class: 'meta' }, m.from ? ['from ', h('b', {}, nameOf(m.from)), verified === true ? h('span', { class: 'ok' }, ' · signature checks') : verified === false ? h('span', { class: 'bad' }, ' · SIGNATURE DOES NOT CHECK') : h('span', { class: 'warn' }, ' · signed by a key not in the register or your contacts')] : 'unsigned: the sender is not named', ` · ${m.at || ''}`),
        m.subject ? h('h3', {}, m.subject) : null,
        m.grant ? h('p', { class: 'msg ok' }, h('b', {}, 'It carries an SG/Send access key'), m.grant.name ? ` (${m.grant.name})` : '', ', sealed to you.') : null, h('div', { class: 'body' }, m.text || ''), files.length ? h('div', { class: 'acts' }, ...files) : null,
        actions.length ? h('div', { class: 'acts' }, ...actions) : null)
}
