/**
 * signin.js: the sign-in card, on the login page and wherever an account page is opened signed out.
 *
 * One button does both: "Sign in with a passkey". Behind it, vault.signIn(): the passkey's PRF bytes give the door;
 * a vault there opens; with none, the account this browser keeps for that passkey opens; with neither, a new account
 * starts, kept in this browser. "Create an account" is the same with a new passkey made first (vault.signUp), for a
 * person who has none for this site. There is no password, no email, and nothing to remember but the passkey.
 *
 * @module signin
 */
import { h, msg, err, busy, vault, pageUrl } from './ui.js'

/** Where to go after: a ?next= path on this site only (never an absolute URL), else the account. */
export function nextUrl(fresh) {
    const n = new URLSearchParams(location.search).get('next') || ''
    if (!fresh && /^[a-z0-9][a-z0-9/_.-]*(#[A-Za-z0-9=_.:-]*)?$/i.test(n) && !n.includes('..')) return pageUrl(n)
    return pageUrl('account/index.html') + (fresh ? '#welcome' : '')
}

export function signInCard({ onDone } = {}) {
    const card = h('div', { class: 'signin-card' })
    const out = h('div', { class: 'signin-out', 'aria-live': 'polite' })
    const done = r => (onDone ? onDone(r) : location.assign(nextUrl(r.fresh)))
    const why = e => {
        if (e && e.code === 'ENOPRF') return msg('warn', 'Your passkey signed, but its provider gave no PRF bytes, so it cannot open an account here. Some password managers do this; the platform’s own passkeys (iCloud Keychain, Google Password Manager, Windows Hello) and security keys usually work.')
        if (e && (e.name === 'NotAllowedError' || e.name === 'AbortError')) return msg('warn', 'No passkey answered: the request was cancelled, or this device has no passkey for pki.sgit.ai yet. New here? Create an account below.')
        return msg('bad', err(e))
    }
    const go = h('button', { type: 'button', class: 'btn primary big-btn', id: 'login-go' }, h('span', { class: 'kicon', 'aria-hidden': 'true' }, '⚿'), 'Sign in with a passkey')
    go.addEventListener('click', () => busy(go, async () => {
        out.replaceChildren(h('p', { class: 'dim small' }, 'Waiting for your passkey…'))
        try { const r = await vault.signIn(); out.replaceChildren(r.offline ? msg('warn', `The vault server did not answer (${r.offline}); the copy this browser keeps is open.`) : msg('ok', 'Signed in.')); done(r) }
        catch (e) { out.replaceChildren(why(e)); if (e && e.name === 'NotAllowedError') signup.open = true }
    }))
    const name = h('input', { class: 't', id: 'signup-name', maxlength: 32, autocomplete: 'username', placeholder: 'a username, e.g. dinis' })
    const make = h('button', { type: 'button', class: 'btn', id: 'signup-go' }, 'Create a passkey and my account')
    make.addEventListener('click', () => busy(make, async () => {
        const n = name.value.trim().toLowerCase()
        if (n && !/^[a-z0-9][a-z0-9._-]{1,31}$/.test(n)) return out.replaceChildren(msg('warn', 'A username is 2 to 32 characters: a-z, 0-9, dot, dash, underscore, starting with a letter or digit.'))
        out.replaceChildren(h('p', { class: 'dim small' }, 'Making a passkey for pki.sgit.ai…'))
        try { const r = await vault.signUp(n); if (n && r.fresh) await vault.saveProfile({ username: n }); done(r) }
        catch (e) { out.replaceChildren(why(e)) }
    }))
    const signup = h('details', { class: 'signup' }, h('summary', {}, 'New here? Create an account'),
        h('p', { class: 'small' }, 'Your device makes a passkey for this site (Face ID, a fingerprint, a PIN, or a security key). The username is only the name the passkey list shows, and the first line of your profile; you can change it.'),
        h('label', { class: 'f', for: 'signup-name' }, 'Username ', h('span', { class: 'dim' }, '(optional)')), name, h('div', { class: 'acts' }, make))
    card.append(
        h('div', { class: 'signin-mark', 'aria-hidden': 'true' }, 'pki', h('span', {}, '.sgit.ai')),
        h('h2', {}, 'Sign in'),
        h('p', { class: 'dim' }, 'One passkey. No password, no email, no account on a server.'),
        h('div', { class: 'acts' }, go), out, signup,
        h('p', { class: 'dim small signin-foot' }, 'Lost the passkey? ', h('a', { href: pageUrl('vault/index.html') }, 'Open with your recovery code'), ' · ', h('a', { href: pageUrl('articles/a-login-made-of-a-passkey.html') }, 'How this login works')))
    return card
}
