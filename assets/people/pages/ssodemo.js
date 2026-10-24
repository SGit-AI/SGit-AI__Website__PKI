/* sso/index.html: "Sign in with pki.sgit.ai", explained, and tried. This page plays the site that asks (the client):
   it makes a key for this browser, sends you to authorize/, and checks what comes back against the register, from the
   root you pin. Then it signs a note with the browser's key and checks it, as any other site would. */
import { h, msg, err, busy, pageUrl } from '../ui.js'
import { sso } from '../sso.js'

const app = document.getElementById('app')
const ROOT_KEY = 'pki.sso.demo.root'
const pinned = () => { try { return localStorage.getItem(ROOT_KEY) || 'sha256:db7f79fdd87e030a' } catch (e) { return 'sha256:db7f79fdd87e030a' } }
const LEVEL = { strong: ['ok', 'Strong: your record vouches for it today'], soft: ['ok', 'Soft: signed by your key, valid until its date'], 'not-vouched': ['warn', 'Not vouched for (yet): a strong sign-in takes effect when your record is published'], invalid: ['bad', 'Not valid'] }

async function draw(back = null) {
    const root = h('input', { class: 't code', id: 'sso-root', value: pinned() })
    let s; try { s = await sso({ root: root.value.trim() }) } catch (e) { return app.replaceChildren(msg('bad', err(e))) }
    root.addEventListener('change', () => { try { localStorage.setItem(ROOT_KEY, root.value.trim()) } catch (e) { /* fine */ } draw() })
    const can = [['identity', 'who you are'], ['sign:feedback', 'sign feedback as you'], ['sign', 'sign anything as you'], ['delegate', 'vouch for other keys (always strong)']]
    const boxes = can.map(([c, l], i) => h('label', { class: 'xchg-option' }, h('input', { type: 'checkbox', value: c, checked: i < 2, class: 'sso-can' }), ' ', h('span', {}, h('code', {}, c), ' · ', l)))
    const days = h('select', { class: 't', id: 'sso-days' }, ...[1, 7, 30, 90].map(d => h('option', { value: d, selected: d === 30 }, `${d} day${d === 1 ? '' : 's'}`)))
    const go = h('button', { type: 'button', class: 'btn primary', id: 'sso-login' }, 'Sign in with pki.sgit.ai')
    go.addEventListener('click', () => busy(go, async () => { go.textContent = 'Making this browser’s key…'; await s.login({ can: boxes.map(b => b.querySelector('input')).filter(i => i.checked).map(i => i.value), days: Number(days.value), label: 'the sign-in demo' }) }))
    const state = h('div', { id: 'sso-state' })
    const sess = s.session()
    if (back && !back.ok) state.append(msg('bad', 'Not signed in: ', back.why))
    if (sess) {
        const st = await s.status().catch(e => ({ level: 'invalid', why: err(e) }))
        const [kind, label] = LEVEL[st.level] || LEVEL.invalid
        const text = h('input', { class: 't', id: 'sso-text', value: 'This sentence is over the top.' })
        const signed = h('pre', { class: 'xchg-line', id: 'sso-note', hidden: true }), check = h('div', { id: 'sso-check' })
        const sign = h('button', { type: 'button', class: 'btn primary', id: 'sso-sign' }, 'Sign it with this browser’s key')
        sign.addEventListener('click', () => busy(sign, async () => {
            const note = await s.sign({ text: text.value, page: location.pathname })
            signed.hidden = false; signed.textContent = JSON.stringify({ ...note, delegation: `{ … delegation by ${note.delegation.iss} … }` }, null, 1)
            const v = await s.verify(note, { need: 'sign:feedback' })
            const tampered = await s.verify({ ...note, payload: { ...note.payload, text: note.payload.text + '!' } })
            check.replaceChildren(msg(v.ok ? 'ok' : 'bad', `Checked against the register: ${v.ok ? v.level : 'refused'} · ${v.why}`), msg(tampered.ok ? 'bad' : 'ok', `The same note with one character changed: ${tampered.ok ? 'accepted (wrong!)' : 'refused'} · ${tampered.why}`))
        }))
        state.append(h('div', { class: 'vpanel' }, h('h3', {}, 'Signed in as ', h('b', { id: 'sso-name' }, sess.identity.name)),
            h('table', { class: 'kv small' }, h('tbody', {},
                h('tr', {}, h('th', {}, 'Key'), h('td', { class: 'mono' }, sess.identity.fp, ' · ', h('a', { href: sess.identity.id }, 'identity JSON'))),
                h('tr', {}, h('th', {}, 'This browser'), h('td', { class: 'mono' }, sess.fp)),
                h('tr', {}, h('th', {}, 'May'), h('td', {}, sess.delegation.can.join(', '), ` · until ${sess.delegation.until} · check: ${sess.delegation.check}`)))),
            msg(kind, h('b', {}, label), ' · ', st.why || '', h('span', { id: 'sso-level', hidden: true }, st.level)),
            h('h3', {}, 'Sign a note, as a site would let you'), text, h('div', { class: 'acts' }, sign, h('button', { type: 'button', class: 'btn', onclick: () => { s.logout(); draw() } }, 'Sign out')), signed, check))
    }
    app.replaceChildren(
        h('p', { class: 'lead' }, 'Any site can let you sign in with your key on pki.sgit.ai. It sends you here with a key its browser made; you read who asks and for what; your key signs a delegation for that browser, at that site only; and every note the browser signs carries it, so anyone can check it against the register.'),
        state,
        sess ? null : h('div', { class: 'vpanel' }, h('h3', {}, 'Try it: this page plays the site'),
            h('label', { class: 'f', for: 'sso-root' }, 'The root this site trusts (pinned, never read from the register)'), root,
            h('p', { class: 'small' }, 'It asks to:'), ...boxes, h('label', { class: 'f', for: 'sso-days' }, 'For'), days, h('div', { class: 'acts' }, go)),
        h('h3', {}, 'Soft and strong'),
        h('ul', {}, h('li', {}, h('b', {}, 'Soft'), ': the delegation is signed by your key, names the site and the uses, and ends on its date. It works at once, and it cannot be taken back early.'),
            h('li', {}, h('b', {}, 'Strong'), ': your own record, today, lists the delegation (a “delegates” link naming its hash and its uses). Withdraw the link and it stops everywhere at the next check: no revocation list, absence is the answer. A delegation can say it is only good while listed, so a stolen copy dies with the link.')),
        h('h3', {}, 'For a site'),
        h('p', { class: 'small' }, 'Vendor ', h('code', {}, 'assets/people/'), ' ', h('code', {}, 'keys.js, message.js, directory.js, delegation.js, sso.js'), ', then:'),
        h('pre', { class: 'xchg-line' }, `import { sso } from './pki/sso.js'
const s = await sso({ root: 'sha256:db7f79fdd87e030a' })   // the root you trust, pinned
const back = await s.finish()                               // on the page you return to
if (!s.session()) button.onclick = () => s.login({ can: ['identity', 'sign:feedback'], days: 30 })
const note = await s.sign({ text: 'this figure is wrong' })
const v = await s.verify(note, { need: 'sign:feedback' })   // { ok, level: 'strong' | 'soft', why, … }`),
        h('p', { class: 'small' }, 'Who someone is, in one file: ', h('a', { href: pageUrl('id/index.json') }, 'id/index.json'), ' and ', h('code', {}, 'id/sha256-….json'), ' (name, keys, inbox, and what they vouch for today).'))
}
const s0 = await sso({ root: pinned() }).catch(() => null)
draw(s0 ? await s0.finish().catch(e => ({ ok: false, why: err(e) })) : null)
