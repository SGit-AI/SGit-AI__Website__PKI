/* check/index.html: can this computer sign in to pki.sgit.ai with a passkey? Everything runs here, in this browser, and
   nothing is sent anywhere: the page reads what the browser says it can do, then (if asked) makes one throwaway test
   passkey and uses it twice, to see whether the PRF extension answers, and answers the same both times. A vault's door
   is derived from that answer, so without it a passkey cannot open an account here. The report is for the person to
   copy and send to whoever helps them; it holds no secret: the PRF answer is shown only as a short hash. */
import { h, msg, err, busy, copyButton } from '../ui.js'

const app = document.getElementById('app')
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
const sha = async b => hex(await crypto.subtle.digest('SHA-256', b)).slice(0, 16)
const SALT = new TextEncoder().encode('pki.sgit.ai/check/v1')
const report = { v: 1, kind: 'pki.sgit.ai/passkey-check/v1', at: new Date().toISOString() }

/** Is navigator.credentials still the browser's own, or has an extension (a password manager) put itself in front? */
function intercepted() {
    try { return !/\[native code\]/.test(Function.prototype.toString.call(navigator.credentials.create)) || !/\[native code\]/.test(Function.prototype.toString.call(navigator.credentials.get)) } catch (e) { return null }
}
async function environment() {
    const ua = navigator.userAgent, uad = navigator.userAgentData
    const e = {
        user_agent: ua, platform: (uad && uad.platform) || navigator.platform || '', brands: uad ? uad.brands.map(b => `${b.brand} ${b.version}`).join(', ') : '',
        secure_context: window.isSecureContext, webauthn: !!window.PublicKeyCredential,
        credentials_api_replaced_by_an_extension: intercepted(),
    }
    if (window.PublicKeyCredential) {
        try { e.platform_authenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() } catch (x) { e.platform_authenticator = 'error: ' + err(x) }
        try { e.conditional_mediation = PublicKeyCredential.isConditionalMediationAvailable ? await PublicKeyCredential.isConditionalMediationAvailable() : 'not reported' } catch (x) { e.conditional_mediation = 'error' }
        try { e.client_capabilities = PublicKeyCredential.getClientCapabilities ? await PublicKeyCredential.getClientCapabilities() : 'not reported (an older browser)' } catch (x) { e.client_capabilities = 'error: ' + err(x) }
    }
    try { e.bluetooth = navigator.bluetooth && navigator.bluetooth.getAvailability ? await navigator.bluetooth.getAvailability() : 'not reported' } catch (x) { e.bluetooth = 'not reported' }
    return e
}

/** The test: one passkey made with PRF asked for, then used twice with PRF; the two answers must be the same. */
async function test(out) {
    const t = report.test = { started: new Date().toISOString() }
    out.replaceChildren(h('p', { class: 'dim small' }, 'Making a test passkey: choose where to keep it in the dialog (this computer, your phone, a security key, a password manager), as you would for a real one…'))
    let cred
    try {
        cred = await navigator.credentials.create({ publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { id: location.hostname, name: 'pki.sgit.ai' },
            user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'pki.sgit.ai check (test, delete me)', displayName: 'pki.sgit.ai check (test, delete me)' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
            authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
            extensions: { prf: { eval: { first: SALT } } }, timeout: 120000 } })
    } catch (x) { t.create = { ok: false, error: `${x.name}: ${err(x)}` }; return }
    const ce = cred.getClientExtensionResults() || {}
    t.create = { ok: true, attachment: cred.authenticatorAttachment || 'not reported', transports: cred.response.getTransports ? cred.response.getTransports() : [],
        prf_enabled: ce.prf ? (ce.prf.enabled === undefined ? 'not reported' : ce.prf.enabled) : 'no prf in the answer', prf_at_create: !!(ce.prf && ce.prf.results && ce.prf.results.first) }
    const use = async n => {
        out.replaceChildren(h('p', { class: 'dim small' }, `Using the test passkey (${n} of 2)…`))
        try {
            const a = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rpId: location.hostname, userVerification: 'required',
                allowCredentials: [{ type: 'public-key', id: cred.rawId }], extensions: { prf: { eval: { first: SALT } } }, timeout: 120000 } })
            const e = a.getClientExtensionResults() || {}
            return { ok: true, attachment: a.authenticatorAttachment || 'not reported', prf: !!(e.prf && e.prf.results && e.prf.results.first), prf_hash: e.prf && e.prf.results && e.prf.results.first ? await sha(e.prf.results.first) : null }
        } catch (x) { return { ok: false, error: `${x.name}: ${err(x)}` } }
    }
    t.use1 = await use(1)
    if (t.use1.ok) t.use2 = await use(2)
}

function verdict() {
    const e = report.environment, t = report.test
    const out = []
    if (!e.secure_context || !e.webauthn) out.push(['bad', 'This browser has no passkeys here (no WebAuthn in a secure page). Try another browser: Chrome, Edge or Safari, up to date.'])
    if (e.credentials_api_replaced_by_an_extension) out.push(['warn', 'A browser extension has put itself in front of passkeys (a password manager such as NordPass, 1Password, Bitwarden). When it offers to save or use the passkey, the passkey is the extension’s, and some do not support what this site needs (PRF): NordPass does not. In the extension’s settings, turn off passkeys for pki.sgit.ai (or “use the browser’s or the system’s passkeys”), and try again.'])
    if (e.platform_authenticator === false) out.push(['warn', 'This computer has no passkey store of its own ready (on Windows: Windows Hello is not set up, so the dialog offers only a phone or a security key). Set up Windows Hello (Settings → Accounts → Sign-in options: a PIN is enough), then try again.'])
    if (t) {
        if (!t.create.ok) out.push(['bad', `No test passkey was made: ${t.create.error}.`])
        else if (!t.use1 || !t.use1.ok) out.push(['bad', `The test passkey was made, but using it failed: ${t.use1 ? t.use1.error : 'not tried'}. With a phone (the QR code), Bluetooth must be on, on both the computer and the phone.`])
        else if (!t.use1.prf) out.push(['bad', `The passkey works, but its provider (${t.create.attachment === 'platform' ? 'this computer, or an extension in front of it' : 'the phone or security key, through this computer'}) gives no PRF answer, so it cannot open an account here.${e.credentials_api_replaced_by_an_extension ? ' The extension in front of passkeys is the likely reason.' : ''}`])
        else if (t.use2 && t.use2.ok && t.use1.prf_hash !== t.use2.prf_hash) out.push(['bad', 'The PRF answer changes between two uses of the same passkey: an account would not open twice. This is the known issue of passkeys used through a phone on some computers.'])
        else if (t.use2 && t.use2.ok) out.push(['ok', `Passkeys work here: made (${t.create.attachment}), used twice, and the same PRF answer both times. You can create your account at pki.sgit.ai/login/ with a passkey kept the same way.`])
    }
    return out
}

async function draw() {
    report.environment = await environment()
    const out = h('div', { id: 'check-out' })
    const go = h('button', { type: 'button', class: 'btn primary', id: 'check-go' }, 'Run the passkey test')
    const show = () => {
        const v = verdict()
        report.verdict = v.map(([level, text]) => ({ level, text }))
        const text = JSON.stringify(report, null, 2)
        out.replaceChildren(...v.map(([k, t]) => msg(k, t)),
            h('h3', {}, 'The report'), h('p', { class: 'small' }, 'Copy it and send it to whoever is helping you. It holds no secret: the PRF answer appears only as a short hash.'),
            h('div', { class: 'acts' }, copyButton(text, 'Copy the report')), h('pre', { class: 'xchg-line', id: 'check-report' }, text))
    }
    go.addEventListener('click', () => busy(go, async () => { await test(out); show() }))
    app.replaceChildren(
        h('p', { class: 'lead' }, 'Can this computer sign in to pki.sgit.ai with a passkey? This page checks, here in your browser, and sends nothing anywhere.'),
        h('ol', { class: 'small' }, h('li', {}, 'Below: what this browser says it can do.'), h('li', {}, 'Press the button: it makes a test passkey (keep it where you would keep your real one), and uses it twice.'), h('li', {}, 'Copy the report and send it. Then delete the test passkey, “pki.sgit.ai check (test, delete me)”, from wherever you kept it.')),
        h('div', { class: 'acts' }, go), out)
    show()
}
draw().catch(e => app.replaceChildren(msg('bad', err(e))))
