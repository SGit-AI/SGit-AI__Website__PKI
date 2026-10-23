/* v/index.html: open a vault from its QR code. Drop or paste the QR image an agent gave you (a sealed message that
   carries a vault key): it opens with your key, and the vault opens below it, its files in sandboxed frames. Or the
   page is opened by another one of this site's pages, which hands the key over in memory (vaultview.js). */
import { h, msg, err, loadDirectory, vaultBar, vault, busy } from '../ui.js'
import * as M from '../message.js'
import { messageCard } from '../cards.js'
import { qrDesk } from '../desk.js'
import { vaultKeyIn, vaultViewer, setVaultOpener, receiveVaultKey } from '../vaultview.js'

const app = document.getElementById('app')
vaultBar(document.getElementById('vault-bar-mount'))
const dir = await loadDirectory().catch(() => null)
const nameOf = f => (dir && dir.byFp.get(f) && dir.byFp.get(f).name) || f
const mount = h('div', { id: 'vv-mount' })
let shown = null                                      // { key, from }: kept across a redraw (the vault reopening)

const showVault = (key, from = '') => { shown = { key, from }; mount.replaceChildren(vaultViewer(key, { from })); mount.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
setVaultOpener(showVault)                              // "Open the vault" on a message here opens it here
receiveVaultKey(showVault)

/** One sealed message: opened with your keys; the vault it carries opens straight away, anything else shows as a message. */
async function openSealed(code) {
    mount.replaceChildren(h('p', { class: 'dim small' }, 'Opening it with your key…'))
    await vault.settled()
    if (!vault.open || !vault.ids.length) return mount.replaceChildren(msg('warn', 'Open your vault above with your passkey: the QR code is sealed to your key.'))
    try {
        const known = dir ? new Map([...dir.byFp].map(([k, r]) => [k, r.bundle])) : new Map()
        const o = await M.openMessage(M.parseCode(code).enc, vault.ids, known)
        const keys = (o.msg.files || []).map(f => vaultKeyIn(f.data)).filter(Boolean)
        const from = o.msg.from ? nameOf(o.msg.from) : ''
        if (keys.length === 1 && !o.problems.length) return showVault(keys[0], from + (o.verified === true ? '' : ' (signature not checked)'))
        mount.replaceChildren(o.problems.length ? msg('warn', o.problems.join('; ')) : null, messageCard(o.msg, o.verified, nameOf))
    } catch (e) { mount.replaceChildren(msg('bad', /not sealed|no key/.test(err(e)) ? 'None of your keys opens it.' : err(e))) }
}

function draw() {
    app.replaceChildren(shown ? null : h('p', { class: 'lead' }, 'An agent gave you a QR image that carries a vault key? Drop or paste it here: it opens with your key, and the vault opens below.'),
        qrDesk({ dir, compact: !!shown, onSealed: openSealed }), mount)
    if (shown && !mount.firstChild) showVault(shown.key, shown.from)
}
vault.onChange(() => { if (!shown) draw() })
draw()
