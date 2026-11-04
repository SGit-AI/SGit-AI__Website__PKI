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
import { h, msg, err, busy, vault, pageUrl, copyButton } from './ui.js'

/** Where to go after: a ?next= path on this site only (never an absolute URL), else the account. */
export function nextUrl(fresh) {
    const n = new URLSearchParams(location.search).get('next') || ''
    if (!fresh && /^[a-z0-9][a-z0-9/_.-]*(#[A-Za-z0-9=_.:-]*)?$/i.test(n) && !n.includes('..')) return pageUrl(n)
    return pageUrl('account/index.html') + (fresh ? '#welcome' : '')
}

/** A sign-in code just made, and not yet confirmed saved: the page must not redraw over it (it is the only copy). */
let holding = false
export const holdingCode = () => holding

export function signInCard({ onDone } = {}) {
    const card = h('div', { class: 'signin-card' })
    const out = h('div', { class: 'signin-out', 'aria-live': 'polite' })
    const done = r => (onDone ? onDone(r) : location.assign(nextUrl(r.fresh)))
    const why = e => {
        if (e && e.code === 'ENOPRF') { codes.open = true; return msg('warn', 'Your passkey worked, but its provider (a password manager such as NordPass, most often) gives no PRF answer, so it cannot open an account here. Use a sign-in code instead, below: your password manager keeps it. Or turn off the extension’s passkeys for pki.sgit.ai and use the computer’s own (Windows Hello, iCloud Keychain). ', h('a', { href: pageUrl('check/index.html') }, 'Check this computer')) }
        if (e && (e.name === 'NotAllowedError' || e.name === 'AbortError')) return msg('warn', 'No passkey answered: the request was cancelled, or this device has no passkey for pki.sgit.ai yet. New here? Create an account below.')
        return msg('bad', err(e))
    }
    const go = h('button', { type: 'button', class: 'btn primary big-btn', id: 'login-go' }, h('span', { class: 'kicon', 'aria-hidden': 'true' }, '⚿'), 'Sign in with a passkey')
    go.addEventListener('click', () => busy(go, async () => {
        out.replaceChildren(h('p', { class: 'dim small' }, 'Waiting for your passkey…'))
        try { const r = await vault.signIn(); out.replaceChildren(r.offline ? msg('warn', `The vault server did not answer (${r.offline}); the copy this browser keeps is open.`) : msg('ok', 'Signed in.')); done(r) }
        catch (e) { if (e && e.code === 'EHYBRID') return out.replaceChildren(hybrid(e)); out.replaceChildren(why(e)); if (e && e.name === 'NotAllowedError') signup.open = true }
    }))
    /** A passkey from another device found no account: the known issue, and two ways on (articles/a-login-made-of-a-passkey). */
    const hybrid = e => {
        const code = h('input', { class: 't', id: 'hybrid-code', autocomplete: 'off', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX' })
        const join = h('button', { type: 'button', class: 'btn primary', id: 'hybrid-join' }, 'Open my account and add this device')
        join.addEventListener('click', () => busy(join, async () => {
            try { await vault.recover(code.value, e.door, e.prf); done({ mode: 'vault' }) }
            catch (x) { box.append(msg('bad', x.code === 'ENOVAULT' ? 'No vault answers to that code.' : err(x))) }
        }))
        const fresh = h('button', { type: 'button', class: 'btn', id: 'hybrid-new' }, 'Start a new account on this device')
        fresh.addEventListener('click', () => busy(fresh, async () => done(await vault.startHere(e.door, e.prf))))
        const box = h('div', { class: 'vpanel', id: 'hybrid-box' },
            msg('warn', h('b', {}, 'Your passkey came from another device (the QR code), and no account answers to it here.')),
            h('p', { class: 'small' }, 'On some computers (older macOS, Intel Macs among them), a passkey used through your phone gives this site a different answer than it does on the device that made your account, so it cannot find your vault. If you already have an account, open it with your recovery code: this device’s passkey is then added to it, and opens it next time. Your code is in Your account → Storage & devices, on a device where you are signed in. ', h('a', { href: pageUrl('articles/a-login-made-of-a-passkey.html') + '#known-issues' }, 'Why')),
            h('label', { class: 'f', for: 'hybrid-code' }, 'Recovery code'), code, h('div', { class: 'acts' }, join, fresh))
        return box
    }
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
    // ------------------------------------------------------------ a sign-in code, for a computer whose passkeys give no PRF
    const codeUser = h('input', { class: 't', id: 'code-user', name: 'username', autocomplete: 'username', placeholder: 'your username (for your password manager)' })
    const codeIn = h('input', { class: 't code', id: 'code-in', name: 'password', type: 'password', autocomplete: 'current-password', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX' })
    const codeGo = h('button', { type: 'submit', class: 'btn primary', id: 'code-go' }, 'Sign in with my code')
    const codeForm = h('form', { id: 'code-signin', method: 'post', action: '#' }, h('label', { class: 'f', for: 'code-user' }, 'Username ', h('span', { class: 'dim' }, '(optional)')), codeUser, h('label', { class: 'f', for: 'code-in' }, 'Sign-in code'), codeIn, h('div', { class: 'acts' }, codeGo))
    codeForm.addEventListener('submit', ev => { ev.preventDefault(); busy(codeGo, async () => {
        out.replaceChildren(h('p', { class: 'dim small' }, 'Opening…'))
        try { const r = await vault.signInWithCode(codeIn.value); out.replaceChildren(msg('ok', 'Signed in.')); done(r) }
        catch (e) { out.replaceChildren(msg(e.code === 'ENOCODE' || e.code === 'EBADCODE' ? 'warn' : 'bad', err(e))) }
    }) })
    const codeNew = h('button', { type: 'button', class: 'btn', id: 'code-new' }, 'Create an account with a sign-in code')
    const codeMade = h('div', { id: 'code-made' })
    codeNew.addEventListener('click', () => busy(codeNew, async () => {
        const u = codeUser.value.trim().toLowerCase()
        if (u && !/^[a-z0-9][a-z0-9._-]{1,31}$/.test(u)) return out.replaceChildren(msg('warn', 'A username is 2 to 32 characters: a-z, 0-9, dot, dash, underscore.'))
        try {
            holding = true                          // set before the account opens: the redraw it causes must leave the code alone
            const r = await vault.createWithCode()
            if (u) await vault.saveProfile({ username: u })
            // the code, once, in a form a password manager offers to save as this site's login
            const user = h('input', { class: 't', id: 'save-user', name: 'username', autocomplete: 'username', value: u || 'pki.sgit.ai', readonly: true })
            const pass = h('input', { class: 't code', id: 'save-code', name: 'password', type: 'password', autocomplete: 'new-password', value: r.code, readonly: true })
            const show = h('button', { type: 'button', class: 'btn small', onclick: () => { pass.type = pass.type === 'password' ? 'text' : 'password' } }, 'Show')
            const cont = h('button', { type: 'submit', class: 'btn primary', id: 'save-go' }, 'I have saved it: continue')
            const f = h('form', { id: 'code-save', method: 'post', action: '#' }, user, h('div', { class: 'acts' }, pass, show, copyButton(r.code, 'Copy')), h('div', { class: 'acts' }, cont))
            f.addEventListener('submit', ev => { ev.preventDefault(); holding = false; done(r) })
            codeMade.replaceChildren(h('div', { class: 'vpanel' }, msg('ok', h('b', {}, 'Your account is made. Its sign-in code is below.')),
                h('p', { class: 'small' }, 'Save it now in your password manager as the login for pki.sgit.ai (NordPass and the others offer to, when you press continue), or write it down. It is the only way into this account: it is kept nowhere else, not even here. Whoever has it can open the account, so keep it as you would a password, and do not paste it into a chat.'), f))
        } catch (e) { holding = false; out.replaceChildren(msg('bad', err(e))) }
    }))
    const codes = h('details', { class: 'signup-alt', id: 'codes' }, h('summary', {}, 'No passkey on this computer? Use a sign-in code'),
        h('p', { class: 'small' }, 'For a computer where passkeys do not work for this site: Windows without Windows Hello, or passkeys kept by a password manager such as NordPass. A sign-in code is 26 letters and digits that open your account the way a passkey does; your password manager keeps it and fills it in.'),
        codeForm, h('p', { class: 'small' }, 'New here, and no passkey that works? ', codeNew), codeMade)
    card.append(
        h('div', { class: 'signin-mark', 'aria-hidden': 'true' }, 'pki', h('span', {}, '.sgit.ai')),
        h('h2', {}, 'Sign in'),
        h('p', { class: 'dim' }, 'One passkey. No password, no email, no account on a server.'),
        h('div', { class: 'acts' }, go), out, signup, codes,
        h('p', { class: 'dim small signin-foot' }, 'Passkey not working on this computer? ', h('a', { href: pageUrl('check/index.html'), id: 'check-link' }, 'Check this computer'), '. Lost the passkey? ', h('a', { href: pageUrl('vault/index.html') }, 'Open with your recovery code'), ' · ', h('a', { href: pageUrl('articles/a-login-made-of-a-passkey.html') }, 'How this login works')))
    return card
}
