/* login/index.html: sign in (or sign up) with a passkey. One button; what is behind the passkey decides the rest. */
import { h, msg, vault, avatarFor } from '../ui.js'
import { signInCard, nextUrl } from '../signin.js'

const app = document.getElementById('app')
function draw() {
    if (!vault.open) return app.replaceChildren(signInCard())
    const p = vault.profile || {}, me = vault.me
    app.replaceChildren(h('div', { class: 'signin-card' },
        h('img', { class: 'avatar big', alt: '', src: p.avatar || avatarFor(p.username || (me && me.bundle.signing_fingerprint) || '') }),
        h('h2', {}, p.name || (p.username ? '@' + p.username : 'Signed in')),
        msg('ok', vault.mode === 'vault' ? 'Signed in: your vault is open.' : vault.mode === 'local' ? 'Signed in: your account is kept in this browser.' : 'Your key, from this browser, is open.'),
        h('div', { class: 'acts' }, h('a', { class: 'btn primary', href: nextUrl(false), id: 'login-continue' }, 'Continue'), h('button', { type: 'button', class: 'btn', onclick: () => vault.close() }, 'Sign out'))))
}
vault.onChange(draw)
app.replaceChildren(h('p', { class: 'dim' }, 'Checking this tab’s session…'))
vault.resume().then(draw, draw)
