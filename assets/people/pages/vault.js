/* vault/index.html: your vault. Your keys, your record in the register, your links, your contacts, your inbox.
   Everything secret stays in your vault (or, with no vault yet, in this browser, encrypted); what goes to the register
   is a file of statements you signed, and nothing else. */
import { h, msg, err, loadDirectory, standingPill, pageUrl, copyButton, download, busy, vaultBar, vault, qr, D, K, A } from '../ui.js'
import * as M from '../message.js'
import * as EV from '../evidence.js'
import { messageCard } from '../cards.js'

const app = document.getElementById('app'), barMount = document.getElementById('vault-bar-mount')
vaultBar(barMount)
let tab = (location.hash.match(/^#(keys|record|links|agents|contacts|inbox|vaults)\b/) || [])[1] || 'keys'
const linkTarget = () => (location.hash.match(/link=(sha256-[0-9a-f]{16})/) || [])[1]
if (linkTarget()) tab = 'links'
const TABS = [['keys', 'Your keys'], ['record', 'Your record'], ['links', 'Links'], ['agents', 'Agents'], ['contacts', 'Contacts'], ['inbox', 'Inbox'], ['vaults', 'Your vaults']]
const say = (box, kind, ...kids) => box.prepend(msg(kind, ...kids))

async function draw() {
    const dir = await loadDirectory().catch(() => null)
    const tabs = h('div', { class: 'tabs', role: 'tablist' }, ...TABS.map(([id, label]) => h('button', { type: 'button', class: id === tab ? 'on' : '', onclick: () => { tab = id; history.replaceState(null, '', '#' + id); draw() } }, label)))
    const body = h('div', { id: 'tab-' + tab })
    app.replaceChildren(tabs, body)
    try { await ({ keys, record, links, agents, contacts, inbox, vaults })[tab](body, dir) } catch (e) { say(body, 'bad', err(e)) }
}
vault.onChange(() => draw())
window.addEventListener('hashchange', () => { const t = (location.hash.match(/^#(keys|record|links|agents|contacts|inbox|vaults)\b/) || [])[1] || (linkTarget() ? 'links' : null); if (t && t !== tab) { tab = t; draw() } })
draw()

// ------------------------------------------------------------ keys
async function keys(body) {
    if (!vault.open) {
        body.append(h('p', {}, 'Open your vault above to see your keys, or make one now. With no vault yet (no access key), the key can be kept in this browser, its private halves encrypted with a passphrase you choose, and moved into a vault later.'))
    } else {
        body.append(h('p', { class: 'dim small' }, vault.mode === 'vault' ? 'Kept in your master vault, in sgit’s own key store layout: every device that opens your vault has them.' : 'Kept in this browser only, encrypted with your passphrase. Open a vault with a passkey to have them on every device.'))
        if (vault.ids.length) body.append(h('table', { class: 'kv' }, h('tbody', {}, ...vault.ids.map((id, i) => h('tr', {},
            h('th', {}, i === 0 ? 'default' : ''),
            h('td', {}, h('b', {}, id.bundle.label || '(no label)'), h('div', { class: 'mono dim' }, 'record ', id.bundle.signing_fingerprint, ' · encryption ', id.bundle.fingerprint),
                h('div', { class: 'acts' },
                    i ? h('button', { type: 'button', class: 'btn small', onclick: () => vault.setDefault(id.bundle.signing_fingerprint) }, 'Make default') : null,
                    h('button', { type: 'button', class: 'btn small', onclick: () => download(`${id.bundle.label || 'key'}.public.json`.replace(/[^A-Za-z0-9_.-]+/g, '-'), JSON.stringify(id.bundle, null, 2)) }, 'Public bundle'),
                    h('button', { type: 'button', class: 'btn small', onclick: () => exportForSgit(id, body) }, 'For the sgit CLI…'))))))))
        else body.append(msg('warn', 'No key yet. Make one below: a record in the register starts from a key you made.'))
    }
    // make
    const label = h('input', { class: 't', placeholder: 'e.g. Dinis Cruz (personal)', maxlength: 80 })
    const make = h('button', { type: 'button', class: 'btn primary' }, 'Make a key pair')
    const out = h('div')
    make.addEventListener('click', () => busy(make, async () => {
        out.replaceChildren(msg('', 'Making an RSA-4096 encryption pair and an ECDSA P-256 signing pair, here in your browser. RSA-4096 takes a few seconds…'))
        const id = await K.generate(label.value.trim())
        if (vault.mode === 'vault') { await vault.addIdentity(id); return }
        const pass = h('input', { class: 't', type: 'password', autocomplete: 'new-password', placeholder: 'a passphrase, at least 10 characters' })
        const keep = h('button', { type: 'button', class: 'btn primary' }, 'Keep it in this browser')
        keep.addEventListener('click', () => busy(keep, async () => { if (pass.value.length < 10) return out.prepend(msg('warn', 'At least 10 characters.')); await vault.keepInBrowser(id, pass.value) }))
        out.replaceChildren(msg('ok', 'Made: ', h('span', { class: 'mono' }, id.bundle.signing_fingerprint), '. It exists only in this tab until you keep it.'), h('label', { class: 'f' }, 'Passphrase ', h('span', { class: 'dim' }, '(encrypts the private halves; sgit asks for the same one)')), pass, h('div', { class: 'acts' }, keep),
            h('p', { class: 'dim small' }, 'Or open (or create) your vault with a passkey above first, and make the key again there: then it follows you to every device.'))
    }))
    body.append(h('h3', {}, 'Make a key pair'), h('p', { class: 'dim small' }, 'The same constructions as sgit pki keygen: RSA-OAEP 4096 for encryption, ECDSA P-256 for signing. The private halves never leave your vault.'),
        h('label', { class: 'f' }, 'Label'), label, h('div', { class: 'acts' }, make), out)
    // import
    const encPem = h('textarea', { class: 't code', placeholder: '-----BEGIN ENCRYPTED PRIVATE KEY----- (private_key.pem)' })
    const sigPem = h('textarea', { class: 't code', placeholder: '-----BEGIN ENCRYPTED PRIVATE KEY----- (signing_private.pem)' })
    const pp = h('input', { class: 't', type: 'password', autocomplete: 'off', placeholder: 'the passphrase sgit asked for' })
    const imp = h('button', { type: 'button', class: 'btn' }, 'Import')
    imp.addEventListener('click', () => busy(imp, async () => {
        try {
            const id = await K.importKeystore({ privateKeyPem: encPem.value, signingPrivatePem: sigPem.value, passphrase: pp.value, label: 'imported from sgit' })
            if (vault.mode === 'vault') { await vault.addIdentity(id); return }
            if (vault.mode === 'browser') { await vault.keepInBrowser(id, pp.value); return }
            say(body, 'warn', 'Imported, but nowhere to keep it: open your vault above (or make a key to keep in this browser) and import again.')
        } catch (e) { say(body, 'bad', 'Not imported: ', err(e)) }
    }))
    body.append(h('h3', {}, 'Bring the key sgit already made'),
        h('p', { class: 'dim small' }, 'From ~/.sg-send/keys/sha256_<fingerprint>/, the two private files. The public halves and both fingerprints are recomputed from them, not trusted.'),
        h('label', { class: 'f' }, 'private_key.pem'), encPem, h('label', { class: 'f' }, 'signing_private.pem'), sigPem, h('label', { class: 'f' }, 'Passphrase'), pp, h('div', { class: 'acts' }, imp))
}
function exportForSgit(id, body) {
    const pass = h('input', { class: 't', type: 'password', autocomplete: 'new-password', placeholder: 'a passphrase for sgit to ask for' })
    const go = h('button', { type: 'button', class: 'btn primary' }, 'Download the script')
    go.addEventListener('click', () => busy(go, async () => {
        if (pass.value.length < 10) return say(body, 'warn', 'At least 10 characters.')
        const ks = await K.keystoreFiles(id, pass.value)
        download(`sgit-key-${ks.folder}.sh`, K.keystoreScript(ks), 'text/x-shellscript')
    }))
    body.prepend(h('div', { class: 'vpanel' }, h('h3', {}, 'This key, for the sgit CLI'),
        h('p', { class: 'small' }, 'A shell script that writes the five files of this key into ~/.sg-send/keys/, where sgit looks. The private halves inside it are encrypted with the passphrase you type here; then ', h('code', {}, 'sgit pki list'), ' shows the key and ', h('code', {}, 'sgit pki decrypt'), ' opens what is sent to it.'), pass, h('div', { class: 'acts' }, go)))
}

// ------------------------------------------------------------ record
async function record(body, dir) {
    if (!vault.open || !vault.me) return body.append(msg('warn', 'Open your vault, and make or bring a key, first.'))
    const me = vault.me, fp = me.bundle.signing_fingerprint
    const mine = await vault.statements(fp)
    const inReg = dir && dir.byFp.get(fp)
    const regIds = new Set(inReg ? inReg.statements.map(e => e.id) : [])
    const ids = await Promise.all(mine.map(s => K.statementId(s)))
    const unsent = mine.filter((s, i) => !regIds.has(ids[i]))
    const local = await D.readRecord(mine)
    body.append(h('p', {}, 'Your record is a set of statements signed with your key. They are kept in your book and handed to the register as one file; nobody, the register included, can add a statement to it but you.'),
        inReg ? h('p', {}, 'In the register: ', standingPill(inReg.fixture ? dir.fixturesGraph : dir.graph, fp, inReg), ' ', h('a', { href: pageUrl('people/person.html') + '#' + K.dirOf(fp) }, 'your page')) : msg('warn', 'Not in the register yet.'),
        local.problems.length && mine.length ? msg('bad', local.problems.join('; ')) : null)
    // identity
    if (!mine.some(s => s.type === 'identity')) {
        const name = h('input', { class: 't', maxlength: 120, placeholder: 'the name you want people to find you by' }), about = h('textarea', { class: 't', maxlength: 600, placeholder: 'optional: one line on who you are' })
        const go = h('button', { type: 'button', class: 'btn primary' }, 'Sign my identity statement')
        go.addEventListener('click', () => busy(go, async () => {
            if (!name.value.trim()) return say(body, 'warn', 'A name, please.')
            await vault.addStatement(await D.identityStatement(me, { name: name.value, about: about.value })); draw()
        }))
        body.append(h('h3', {}, '1 · Your identity'), h('p', { class: 'dim small' }, 'Your public key bundle and the name you choose, signed with your key: rule 4, every entry is signed, and the first is the key itself.'),
            h('label', { class: 'f' }, 'Name'), name, h('label', { class: 'f' }, 'About'), about, h('div', { class: 'acts' }, go))
        return
    }
    body.append(h('h3', {}, 'Your statements'), h('table', { class: 'kv' }, h('tbody', {}, ...local.statements.map((e, i) => h('tr', {},
        h('th', {}, e.st.type), h('td', {}, describe(e.st), e.live ? '' : h('span', { class: 'dim' }, ' · withdrawn'), regIds.has(e.id) ? h('span', { class: 'ok small' }, ' · in the register') : h('span', { class: 'warn small' }, ' · not sent yet'),
            e.live && e.st.type !== 'identity' && e.st.type !== 'revocation' ? h('button', { type: 'button', class: 'btn small', style: 'margin-left:.5rem', onclick: async () => { await vault.addStatement(await D.withdrawStatement(me, e.id)); draw() } }, 'Withdraw') : null))))))
    // evidence
    const kind = h('select', { class: 't' }, ...Object.entries(D.EVIDENCE).map(([k, v]) => h('option', { value: k }, v.label)))
    const value = h('input', { class: 't', placeholder: 'example.org, your GitHub username, or what the link is' }), url = h('input', { class: 't', placeholder: 'https://…' })
    const hint = h('p', { class: 'small' })
    const upd = () => { const k = kind.value, w = EV.where(k, value.value || '<value>', fp); hint.replaceChildren(D.EVIDENCE[k].how, w ? h('span', {}, h('br'), 'Put ', h('code', {}, w.content), ' in ', w.place, '.') : '') }
    kind.addEventListener('change', upd); value.addEventListener('input', upd); upd()
    const checkBtn = h('button', { type: 'button', class: 'btn' }, 'Check it now'), add = h('button', { type: 'button', class: 'btn primary' }, 'Sign and add')
    checkBtn.addEventListener('click', () => busy(checkBtn, async () => { const r = await EV.check({ kind: kind.value, value: value.value, url: url.value }, fp); say(body, r.ok ? 'ok' : r.ok === false ? 'bad' : 'warn', r.detail) }))
    add.addEventListener('click', () => busy(add, async () => {
        if (!value.value.trim()) return say(body, 'warn', 'What is it?')
        if (url.value && !/^https:\/\//.test(url.value)) return say(body, 'warn', 'The URL must be https.')
        await vault.addStatement(await D.evidenceStatement(me, { kind: kind.value, value: value.value, url: url.value })); draw()
    }))
    body.append(h('h3', {}, '2 · Evidence that this key is yours'), h('p', { class: 'dim small' }, 'Each piece is a signed claim in your own record. It says an account and this key go together; it does not say you are who you say. That is what verification is for.'),
        h('label', { class: 'f' }, 'Kind'), kind, hint, h('label', { class: 'f' }, 'Value'), value, h('label', { class: 'f' }, 'URL ', h('span', { class: 'dim' }, '(for a gist, a profile, a key)')), url, h('div', { class: 'acts' }, checkBtn, add))
    // inbox
    body.append(h('h3', {}, '3 · An inbox (optional)'))
    if (local.inbox) body.append(h('p', { class: 'small' }, 'Your record publishes an inbox: anyone can write to it, sealed to your key, with no account; only your vault can list and read it.'))
    else if (vault.mode !== 'vault' || !vault.token) body.append(h('p', { class: 'dim small' }, 'An inbox needs a vault with an access key. Without one, messages to you travel as links and QR codes, which works just as well.'))
    else {
        const ib = h('button', { type: 'button', class: 'btn' }, 'Open an inbox and publish it')
        ib.addEventListener('click', () => busy(ib, async () => {
            const rec = vault.inbox || await A.openInbox({ master: vault.master, book: vault.book, token: vault.token })
            vault.inbox = rec
            await vault.addStatement(await D.inboxStatement(me, { endpoint: rec.endpoint, vault: rec.vault, token: rec.token })); draw()
        }))
        body.append(h('p', { class: 'dim small' }, 'An append lane on your book vault. Its address goes in your record, so a stranger can send you a sealed message without an account and without a link changing hands; the server holds only ciphertext and cannot list it.'), h('div', { class: 'acts' }, ib))
    }
    // submit
    body.append(h('h3', {}, '4 · Send it to the register'))
    if (!unsent.length) { body.append(h('p', { class: 'ok small' }, 'Everything in your record is in the register.')); return }
    const sub = D.submission(mine)
    const text = JSON.stringify(sub, null, 1)
    const anchorWithInbox = dir && dir.index.anchors.map(a => dir.byFp.get(a)).find(r => r && r.inbox)
    const acts = h('div', { class: 'acts' },
        anchorWithInbox ? h('button', { type: 'button', class: 'btn primary', onclick: e => busy(e.target, async () => {
            const m = await M.compose({ to: anchorWithInbox.bundle, from: me, subject: 'Please add my record to the register', text: `A submission to pki.sgit.ai from ${local.name} (${fp}): ${unsent.length} statement(s) not yet in the register.`, files: [{ name: 'submission.json', type: 'application/json', data: K.b64(K.utf8(text)) }] })
            const s = await M.sealMessage(m, anchorWithInbox.bundle, me)
            await A.deliver(anchorWithInbox.inbox, M.parseCode(s.code).enc)
            say(body, 'ok', `Sent to ${anchorWithInbox.name}’s inbox, sealed to their key. They add it with one command; your page will show it after the next release.`)
        }) }, `Send to ${anchorWithInbox.name}`) : null,
        h('button', { type: 'button', class: anchorWithInbox ? 'btn' : 'btn primary', onclick: () => download(`pki-submission-${K.dirOf(fp)}.json`, text) }, 'Download the submission'),
        copyButton(text, 'Copy it'),
        h('a', { class: 'btn', href: `mailto:agent@riskmandate.ai?subject=${encodeURIComponent('pki.sgit.ai submission ' + fp)}&body=${encodeURIComponent('My submission for the register is attached (pki-submission-' + K.dirOf(fp) + '.json).')}` }, 'Email it'))
    body.append(h('p', { class: 'small' }, `${unsent.length} statement(s) are not in the register yet. The submission is a file of signed statements and nothing else: no private key, no note. The register checks every signature, and that every statement is yours, before it writes anything (`, h('code', {}, 'node admin/build/people.mjs add'), ').'), acts)
}
function describe(st) {
    const b = st.body
    if (st.type === 'identity') return `${b.name}${b.about ? ' · ' + b.about : ''}`
    if (st.type === 'evidence') return `${D.EVIDENCE[b.kind] ? D.EVIDENCE[b.kind].label : b.kind}: ${b.value}${b.url ? ' · ' + b.url : ''}`
    if (st.type === 'link') return `I know ${b.to}${b.method ? ' · ' + D.METHODS[b.method] : ''}${b.on ? ', ' + b.on : ''}`
    if (st.type === 'inbox') return `an inbox on vault ${b.vault}`
    if (st.type === 'revocation') return `withdraws ${b.revokes.statement.slice(0, 20)}…`
    return ''
}

// ------------------------------------------------------------ links
async function links(body, dir) {
    if (!vault.open || !vault.me) return body.append(msg('warn', 'Open your vault, and make or bring a key, first.'))
    const me = vault.me, fp = me.bundle.signing_fingerprint
    const mine = await D.readRecord(await vault.statements(fp))
    if (!mine.identity) return body.append(msg('warn', 'Sign your identity statement first (Your record).'))
    const g = dir ? (dir.byFp.get(fp) && dir.byFp.get(fp).fixture ? dir.fixturesGraph : dir.graph) : null
    const myLinks = new Set(mine.links.map(l => l.to))
    body.append(h('p', {}, 'A link is “I know the owner of that key”, written in your record. It counts only when they write the same about you. You can say you know anyone; they may never have heard of you, and then your claim adds nothing to them.'))
    // waiting for me
    const waiting = dir ? [...dir.records].filter(r => r.ok && r.links.some(l => l.to === fp) && !myLinks.has(r.fp)) : []
    body.append(h('h3', {}, 'Waiting for you to confirm'))
    body.append(waiting.length ? h('table', { class: 'kv' }, h('tbody', {}, ...waiting.map(r => { const l = r.links.find(x => x.to === fp); return h('tr', {}, h('th', {}, h('a', { href: pageUrl('people/person.html') + '#' + r.dir }, r.name)), h('td', {}, l.method ? `says: ${D.METHODS[l.method]}${l.on ? ', ' + l.on : ''}` : 'says they know you', ' ', h('button', { type: 'button', class: 'btn small primary', onclick: e => busy(e.target, async () => { await vault.addStatement(await D.linkStatement(me, { to: r.fp, method: 'known' })); draw() }) }, 'Yes, I know them: link back'))) }))) : h('p', { class: 'dim small' }, 'Nobody in the register has linked to you without your link back.'))
    // link to someone
    const target = linkTarget() ? K.fpOfDir(linkTarget()) : ''
    const pick = h('select', { class: 't' }, h('option', { value: '' }, '— pick someone in the register —'), ...(dir ? dir.records.filter(r => r.ok && r.fp !== fp && (!myLinks.has(r.fp) || r.fp === target)).map(r => h('option', { value: r.fp, selected: r.fp === target }, `${r.name} · ${r.fp}`)) : []))
    const other = h('input', { class: 't code', placeholder: 'or a fingerprint: sha256:…', value: target && !(dir && dir.byFp.has(target)) ? target : '' })
    const method = h('select', { class: 't' }, ...Object.entries(D.METHODS).map(([k, v]) => h('option', { value: k, selected: k === 'known' }, v)))
    const on = h('input', { class: 't', type: 'date', value: new Date().toISOString().slice(0, 10) })
    const yearOn = d => { const x = new Date(d + 'T00:00:00Z'); x.setUTCFullYear(x.getUTCFullYear() + 1); return x.toISOString().slice(0, 10) }
    const until = h('input', { class: 't', type: 'date', value: yearOn(on.value) })
    on.addEventListener('change', () => { until.value = yearOn(on.value) })
    const note = h('textarea', { class: 't', placeholder: 'private, kept in your book only: how you checked (the call, the channel, the number)' })
    const go = h('button', { type: 'button', class: 'btn primary' }, 'Sign the link')
    go.addEventListener('click', () => busy(go, async () => {
        const to = pick.value || other.value.trim()
        if (!K.FP.test(to)) return say(body, 'warn', 'Pick someone, or paste a sha256:<16 hex> fingerprint.')
        const verifying = D.VERIFYING.includes(method.value)
        if (verifying && until.value && until.value < on.value) return say(body, 'warn', 'Valid until must not be before the date of the check.')
        await vault.addStatement(await D.linkStatement(me, { to, method: method.value, on: verifying ? on.value : '', until: verifying ? until.value : '' }))
        if (note.value.trim() && vault.mode === 'vault') await A.book.saveNote(vault.book, to, `# ${to}\n\n${new Date().toISOString().slice(0, 10)} · ${D.METHODS[method.value]}\n\n${note.value.trim()}\n`)
        history.replaceState(null, '', '#links'); draw()
    }))
    const isAnchor = dir && dir.index.anchors.includes(fp)
    if (isAnchor && g) {
        const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
        const due = [...g.verified.values(), ...(g.expired ? g.expired.values() : [])].filter(v => v.by === fp && v.until <= soon)
        const whoOf = v => [...g.verified.entries(), ...g.expired.entries()].find(([, x]) => x === v)[0]
        body.append(h('h3', {}, 'Due for verification again'), due.length ? h('table', { class: 'kv' }, h('tbody', {}, ...due.map(v => { const who = whoOf(v); return h('tr', {}, h('th', {}, D.nameOf(g, who)), h('td', {}, v.until < g.asOf ? h('span', { class: 'bad' }, `expired ${v.until}`) : h('span', { class: 'warn' }, `ends ${v.until}`), ` · last: ${D.METHODS[v.method]}, ${v.on} `, h('a', { class: 'btn small', href: '#link=' + K.dirOf(who), onclick: () => setTimeout(draw, 0) }, 'Verify again'))) }))) : h('p', { class: 'dim small' }, 'Nobody you verified is due in the next 30 days.'))
    }
    body.append(h('h3', {}, isAnchor ? 'Verify someone, or link to them' : 'Link to someone you know'),
        isAnchor ? h('p', { class: 'small' }, 'You are an anchor: a link from you that names how you checked (in person, a video call, a channel already known to be theirs) is a verification. The method and the date are public; the details go in the private note, in your book. It is complete when they link back.') : h('p', { class: 'dim small' }, 'Name how you know them. In person, a video call or a known channel are the strong ones; from an anchor, they are a verification.'),
        h('label', { class: 'f' }, 'Who'), pick, other, h('label', { class: 'f' }, 'How'), method, h('label', { class: 'f' }, 'On ', h('span', { class: 'dim' }, '(for in person, a call, a known channel)')), on,
        h('label', { class: 'f' }, 'Valid until ', h('span', { class: 'dim' }, '(a verification ends; after this date they are to be verified again; a year by default)')), until,
        vault.mode === 'vault' ? [h('label', { class: 'f' }, 'Private note'), note] : null, h('div', { class: 'acts' }, go),
        h('p', { class: 'dim small' }, 'Then send your record to the register (Your record, step 4). Want to bring someone in who has no key yet? ', h('a', { href: pageUrl('invite/index.html') }, 'Invite them'), '.'))
    // mine
    body.append(h('h3', {}, 'Your links'), mine.links.length ? h('table', { class: 'kv' }, h('tbody', {}, ...mine.links.map(l => {
        const both = g && g.adj.get(fp) && g.adj.get(fp).has(l.to)
        return h('tr', {}, h('th', {}, g ? D.nameOf(g, l.to) : l.to), h('td', {}, both ? h('span', { class: 'ok' }, 'both ways') : h('span', { class: 'warn' }, 'one way, for now'), l.method ? ` · ${D.METHODS[l.method]}` : '', l.on ? `, ${l.on}` : '',
            h('button', { type: 'button', class: 'btn small', style: 'margin-left:.5rem', onclick: e => busy(e.target, async () => { await vault.addStatement(await D.withdrawStatement(me, l.id)); draw() }) }, 'Withdraw')))
    }))) : h('p', { class: 'dim small' }, 'None yet.'))
}

// ------------------------------------------------------------ agents
const PENDING = 'pki.agent.pending'
function pendingAgent(sub) { try { if (sub) sessionStorage.setItem(PENDING, JSON.stringify(sub)); else sessionStorage.removeItem(PENDING) } catch (e) { /* fine */ } }
const readPending = () => { try { return JSON.parse(sessionStorage.getItem(PENDING) || 'null') } catch (e) { return null } }
async function agents(body, dir) {
    if (!vault.open || !vault.me) return body.append(msg('warn', 'Open your vault, with a key in it, first.'))
    const mine = new Set(vault.ids.map(i => i.bundle.signing_fingerprint))
    const g = dir ? dir.graph : null
    body.append(h('p', {}, 'An agent makes its own key where it runs and hands you its public record: an identity, and a link naming your key as its operator. You confirm it with a link back, signed here, with an end date: until then the register shows it as operated by you. Its private key never comes to you. ', h('a', { href: pageUrl('agents/index.html') }, 'How agents get a key'), '.'))

    // confirm one
    const paste = h('textarea', { class: 't code', placeholder: '{"kind": "pki.sgit.ai/submission/v1", "record": "sha256:…", "statements": […]} — from node pki-agent.mjs submission, or from your inbox' })
    const p0 = readPending(); if (p0) paste.value = JSON.stringify(p0, null, 1)
    const check = h('button', { type: 'button', class: 'btn primary' }, 'Check it')
    const out = h('div')
    check.addEventListener('click', () => busy(check, async () => {
        out.replaceChildren()
        let sub; try { sub = JSON.parse(paste.value) } catch (e) { return out.append(msg('bad', 'That is not JSON.')) }
        const r = await D.readRecord(sub.statements || [])
        if (!r.ok) return out.append(msg('bad', 'The record does not read cleanly: ', r.problems.join('; ')))
        if (r.kind !== 'agent') return out.append(msg('bad', 'This is not an agent’s record (its identity is a ' + r.kind + ').'))
        const claims = r.links.filter(l => l.method === 'operated-by').map(l => l.to)
        const by = h('select', { class: 't' }, ...vault.ids.map(i => h('option', { value: i.bundle.signing_fingerprint, selected: claims.includes(i.bundle.signing_fingerprint) }, `${i.bundle.label || 'a key'} · ${i.bundle.signing_fingerprint}`)))
        const days = h('select', { class: 't' }, ...[[1, 'a day'], [7, 'a week'], [30, '30 days'], [90, '90 days'], [365, 'a year']].map(([d, l]) => h('option', { value: d, selected: d === (r.identity.body.session ? 7 : 30) }, l)))
        const sign = h('button', { type: 'button', class: 'btn primary' }, 'I operate this agent: sign')
        sign.addEventListener('click', () => busy(sign, async () => {
            const op = vault.ids.find(i => i.bundle.signing_fingerprint === by.value)
            if (!claims.includes(by.value)) { if (!confirm('The agent does not name this key as its operator, so the link will be one-way until it does. Sign anyway?')) return }
            const on = new Date().toISOString().slice(0, 10), until = new Date(Date.now() + Number(days.value) * 86400000).toISOString().slice(0, 10)
            const st = await D.linkStatement(op, { to: r.fp, method: 'operates', on, until })
            await vault.addStatement(st)
            await vault.saveAgent({ ...sub, confirmed: { by: by.value, on, until } })
            pendingAgent(null)
            const opSts = await vault.statements(by.value)
            const both = D.submissions([sub, D.submission(opSts)])
            out.replaceChildren(msg('ok', `Signed: ${r.name} is operated by ${op.bundle.label || by.value} until ${until}.`),
                h('p', { class: 'small' }, 'One file now carries both records, the agent’s and your link, for the register (', h('code', {}, 'node admin/build/people.mjs add'), '):'),
                h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => download(`pki-agent-${K.dirOf(r.fp)}.json`, JSON.stringify(both, null, 1)) }, 'Download for the register'), copyButton(JSON.stringify(both, null, 1), 'Copy it')))
        }))
        out.append(h('div', { class: 'vpanel' },
            h('h3', {}, r.name), r.identity.body.about ? h('p', { class: 'small' }, r.identity.body.about) : null,
            h('table', { class: 'kv' }, h('tbody', {},
                h('tr', {}, h('th', {}, 'Fingerprint'), h('td', {}, h('b', { class: 'mono' }, r.fp), h('div', { class: 'warn small' }, 'Compare it with what the agent printed in its own session, character for character, before you sign.'))),
                h('tr', {}, h('th', {}, 'Runs on'), h('td', {}, r.identity.body.runtime || '(not said)', r.identity.body.session ? ' · a session key: it dies with the session' : '')),
                h('tr', {}, h('th', {}, 'Names as operator'), h('td', { class: 'mono' }, claims.join(', ') || 'nobody yet')))),
            h('label', { class: 'f' }, 'Operated by'), by, h('label', { class: 'f' }, 'For'), days, h('div', { class: 'acts' }, sign)))
    }))
    body.append(h('h3', {}, 'Confirm an agent'), paste, h('div', { class: 'acts' }, check), out)
    if (p0) check.click()

    // mine
    const kept = await vault.agents()
    const rows = []
    for (const a of kept) {
        const fp = a.record, rec = dir && dir.byFp.get(fp), st = g && g.people.has(fp) ? D.standing(g, fp) : null
        const name = (a.statements && a.statements[0] && a.statements[0].body.name) || fp
        const renew = h('button', { type: 'button', class: 'btn small' }, 'Confirm again')
        renew.addEventListener('click', () => { pendingAgent(a); draw() })
        rows.push(h('tr', {}, h('th', {}, rec ? h('a', { href: pageUrl('people/person.html') + '#' + K.dirOf(fp) }, name) : name),
            h('td', {}, h('span', { class: 'mono dim' }, fp), h('div', { class: 'small' }, st ? st.text : `not in the register yet${a.confirmed ? `; you signed until ${a.confirmed.until}` : ''}`), renew)))
    }
    body.append(h('h3', {}, 'Your agents'), rows.length ? h('table', { class: 'kv' }, h('tbody', {}, ...rows)) : h('p', { class: 'dim small' }, 'None yet.'))

    // a fleet key
    const fname = h('input', { class: 't', placeholder: 'e.g. Dinis’s research agents' })
    const mk = h('button', { type: 'button', class: 'btn' }, 'Make a fleet key')
    mk.addEventListener('click', () => busy(mk, async () => {
        if (vault.mode !== 'vault') return say(body, 'warn', 'A fleet key lives in your vault: open it with your passkey.')
        if (!fname.value.trim()) return say(body, 'warn', 'Name the fleet.')
        say(body, '', 'Making the fleet’s key…')
        const person = vault.me, fleet = await K.generate(fname.value.trim())
        await A.saveIdentity(vault.master, fleet)
        vault.ids = await A.identities(vault.master)
        const until = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
        await vault.addStatement(await D.agentStatement(fleet, { name: fname.value.trim(), about: `A fleet key: it confirms the agents ${person.bundle.label || 'its operator'} runs, so their links do not fill the operator's own record.`, runtime: 'pki.sgit.ai vault' }))
        await vault.addStatement(await D.linkStatement(fleet, { to: person.bundle.signing_fingerprint, method: 'operated-by' }))
        await vault.addStatement(await D.linkStatement(person, { to: fleet.bundle.signing_fingerprint, method: 'operates', on: new Date().toISOString().slice(0, 10), until }))
        say(body, 'ok', `The fleet key ${fleet.bundle.signing_fingerprint} is in your master, operated by you until ${until}. Choose it under “Operated by” when you confirm its agents; send both records to the register (Your record, with each key as the default in turn, or the file below).`)
        const both = D.submissions([D.submission(await vault.statements(fleet.bundle.signing_fingerprint)), D.submission(await vault.statements(person.bundle.signing_fingerprint))])
        body.prepend(h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => download(`pki-fleet-${K.dirOf(fleet.bundle.signing_fingerprint)}.json`, JSON.stringify(both, null, 1)) }, 'Download the fleet and your record, for the register')))
        vault.changed()
    }))
    body.append(h('h3', {}, 'A fleet key, for many agents'), h('p', { class: 'dim small' }, `Each agent you confirm is a link in the confirming key's record, and a record holds ${D.BOUNDS.agents} live agents at most (rule 3). A fleet key is a second key in your vault that you operate, and that operates your agents: your own record holds one link, the fleet's holds the rest, and every agent's page still shows you at the root.`), fname, h('div', { class: 'acts' }, mk))
}

// ------------------------------------------------------------ contacts
async function contacts(body, dir) {
    if (!vault.open) return body.append(msg('warn', 'Open your vault first.'))
    const list = await vault.contacts()
    body.append(h('p', {}, 'People you write to, with their public keys, kept in your book. Anyone in the register can be added from their page; anyone else, from the bundle sgit pki export gave them.'))
    body.append(list.length ? h('table', { class: 'kv' }, h('tbody', {}, ...list.map(c => {
        const inReg = dir && dir.byFp.get(c.bundle.signing_fingerprint)
        return h('tr', {}, h('th', {}, c.name || c.bundle.label), h('td', {}, h('span', { class: 'mono dim' }, c.bundle.signing_fingerprint), inReg ? [' ', standingPill(inReg.fixture ? dir.fixturesGraph : dir.graph, inReg.fp, inReg)] : h('span', { class: 'dim small' }, ' · not in the register'),
            c.note ? h('div', { class: 'small' }, c.note) : null,
            h('div', { class: 'acts' }, h('a', { class: 'btn small primary', href: pageUrl('send/index.html') + '#to=' + K.dirOf(c.bundle.signing_fingerprint) }, 'Write'),
                h('button', { type: 'button', class: 'btn small', onclick: e => busy(e.target, async () => { await vault.removeContact(c.bundle.signing_fingerprint); draw() }) }, 'Remove'))))
    }))) : h('p', { class: 'dim small' }, 'No contacts yet.'))
    const bundle = h('textarea', { class: 't code', placeholder: '{"v": 1, "encrypt": "-----BEGIN PUBLIC KEY-----…", "sign": …}' }), name = h('input', { class: 't', placeholder: 'their name' }), note = h('input', { class: 't', placeholder: 'a note, private to you' })
    const add = h('button', { type: 'button', class: 'btn primary' }, 'Add')
    add.addEventListener('click', () => busy(add, async () => {
        let b; try { b = JSON.parse(bundle.value) } catch (e) { return say(body, 'bad', 'That is not JSON.') }
        const p = await K.checkBundle(b); if (p.length) return say(body, 'bad', p.join('; '))
        await vault.saveContact({ name: name.value.trim() || b.label, bundle: b, note: note.value.trim(), from: 'pasted' }); draw()
    }))
    body.append(h('h3', {}, 'Add a contact from a bundle'), h('label', { class: 'f' }, 'Bundle'), bundle, h('label', { class: 'f' }, 'Name'), name, h('label', { class: 'f' }, 'Note'), note, h('div', { class: 'acts' }, add))
}

// ------------------------------------------------------------ inbox
async function inbox(body, dir) {
    if (vault.mode !== 'vault') return body.append(msg('warn', 'The inbox is in your vault: open it with your passkey.'))
    const known = dir ? new Map([...dir.byFp].map(([k, r]) => [k, r.bundle])) : new Map()
    for (const c of await vault.contacts()) known.set(c.bundle.signing_fingerprint, c.bundle)
    const nameOf = f => (dir && dir.byFp.get(f) && dir.byFp.get(f).name) || f
    if (!vault.inbox) body.append(h('p', { class: 'dim' }, 'You have no inbox yet: open one from Your record, step 3. Messages sent as links open on the message page, and can be saved here.'))
    else {
        const check = h('button', { type: 'button', class: 'btn primary' }, 'Check for new messages'), box = h('div')
        check.addEventListener('click', () => busy(check, async () => {
            box.replaceChildren(msg('', 'Listing the lane…'))
            const w = await A.waiting(vault.inbox)
            if (!w.length) return box.replaceChildren(msg('ok', 'Nothing waiting.'))
            box.replaceChildren()
            for (const item of w) {
                let o = null, e1 = null
                try { o = await M.openMessage(item.enc, vault.ids, known) } catch (e) { e1 = e }
                const keep = h('button', { type: 'button', class: 'btn small primary' }, 'Keep in my book')
                keep.addEventListener('click', () => busy(keep, async () => { await A.book.saveMessage(vault.book, 'in', { id: item.file_id, at: o.msg.at, msg: o.msg, verified: o.verified }); await A.markRead(vault.inbox, item.inbox, [item.file_id]); keep.replaceWith(h('span', { class: 'ok small' }, 'kept')) }))
                const drop = h('button', { type: 'button', class: 'btn small' }, 'Discard')
                drop.addEventListener('click', () => busy(drop, async () => { await A.markRead(vault.inbox, item.inbox, [item.file_id]); drop.closest('.msgcard').remove() }))
                const subFile = o && (o.msg.files || []).find(f => f.name === 'submission.json')
                let agentSub = null
                if (subFile) { try { const j = JSON.parse(new TextDecoder().decode(K.unb64(subFile.data))); if (j.statements && j.statements[0] && j.statements[0].body.kind === 'agent') agentSub = j } catch (e) { /* not one */ } }
                const confirm = agentSub ? h('button', { type: 'button', class: 'btn small primary', onclick: () => { pendingAgent(agentSub); tab = 'agents'; history.replaceState(null, '', '#agents'); draw() } }, 'Confirm this agent…') : null
                box.append(o ? messageCard(o.msg, o.verified, nameOf, [confirm, keep, drop].filter(Boolean)) : h('div', { class: 'msgcard' }, msg('bad', `Could not be opened: ${err(e1)}`), h('div', { class: 'acts' }, drop)))
            }
        }))
        body.append(h('p', { class: 'small' }, 'Your inbox is an append lane on your book vault. What arrives is sealed to your key; it is opened here, with the key from your master.'), h('div', { class: 'acts' }, check), box)
    }
    const kept = await A.book.messages(vault.book, 'in')
    body.append(h('h3', {}, 'Kept'), kept.length ? h('div', {}, ...kept.map(m => messageCard(m.msg, m.verified, nameOf))) : h('p', { class: 'dim small' }, 'Nothing kept yet.'))
    const sent = await A.book.messages(vault.book, 'out')
    if (sent.length) body.append(h('h3', {}, 'Sent'), h('div', {}, ...sent.map(m => h('div', { class: 'msgcard' }, h('div', { class: 'meta' }, `to ${nameOf(m.to)} · ${m.at} · ${m.how}`), h('div', { class: 'body' }, m.subject ? m.subject + '\n\n' : '', m.text || '')))))
}
// ------------------------------------------------------------ vaults
async function vaults(body) {
    if (!vault.open) return body.append(h('p', {}, 'Open your vault above. The design, from the newsroom: your passkey derives the address and key of a small door vault; the door holds the key of your master vault; the master holds your private keys, your access key and the key of your book. Nothing is stored to be found, and nothing leaves this browser but ciphertext.'))
    if (vault.mode === 'browser') return body.append(msg('warn', 'Your key is in this browser only. Open a vault with a passkey (above, after Close) and make or import the key there to have it on every device; or download it for the sgit CLI from Your keys.'))
    body.append(h('table', { class: 'kv' }, h('tbody', {},
        h('tr', {}, h('th', {}, 'Doors'), h('td', {}, ...vault.doors.map(d => h('div', { class: 'small' }, `${d.kind}${d.path ? ' (' + d.path + ')' : ''} · ${d.device || ''} · ${String(d.created || '').slice(0, 10)}`)))),
        h('tr', {}, h('th', {}, 'Master'), h('td', { class: 'mono' }, vault.master.vaultId)),
        h('tr', {}, h('th', {}, 'Book'), h('td', { class: 'mono' }, vault.book ? vault.book.vaultId : 'none')),
        h('tr', {}, h('th', {}, 'Access key'), h('td', {}, vault.token ? 'in the master, in memory here' : 'none: add it below, once')),
        h('tr', {}, h('th', {}, 'Inbox'), h('td', {}, vault.inbox ? `a lane on the book (${vault.inbox.vault})` : 'none')))))
    const addThis = h('button', { type: 'button', class: 'btn' }, 'Add this device’s passkey as a door')
    addThis.addEventListener('click', () => busy(addThis, async () => {
        try {
            const { prfBytes, doorFrom, PRF_INPUT_TEXT } = await import('../door.js')
            const prf = await prfBytes(PRF_INPUT_TEXT), door = await doorFrom(prf.bytes)
            await A.addDoor({ sgSend: vault.sg, master: vault.master, door, record: { kind: 'passkey', path: prf.path, credential_id: prf.credId } })
            say(body, 'ok', 'Added: this passkey opens the same master now.')
        } catch (e) { say(body, 'bad', e.code === 'EEXISTS' ? 'This passkey is already a door.' : err(e)) }
    }))
    const tok = h('input', { class: 't', type: 'password', autocomplete: 'off', placeholder: 'an SG/Send access key' })
    const setTok = h('button', { type: 'button', class: 'btn' }, 'Keep it in the master')
    setTok.addEventListener('click', () => busy(setTok, async () => { await A.setToken(vault.master, tok.value.trim()); vault.token = tok.value.trim(); vault.sg.token = vault.token; draw() }))
    const reveal = h('button', { type: 'button', class: 'btn small' }, 'Reveal the vault keys')
    reveal.addEventListener('click', async () => {
        const NV = A.NV
        reveal.replaceWith(h('div', { class: 'vpanel' }, h('p', { class: 'small warn' }, 'Each key opens that vault to whoever holds it, and the master’s opens everything. Treat them like the recovery code.'),
            h('p', { class: 'small' }, 'Master: ', h('span', { class: 'mono' }, NV.prefixedKey(vault.master))), vault.book ? h('p', { class: 'small' }, 'Book: ', h('span', { class: 'mono' }, NV.prefixedKey(vault.book))) : null,
            h('p', { class: 'dim small' }, h('code', {}, 'sgit clone <key>'), ' opens either on the command line; the master’s keys/ folder is in sgit’s own key store layout.')))
    })
    const grants = await A.book.grants(vault.book).catch(() => [])
    body.append(h('h3', {}, 'Access keys you handed out'), grants.length ? h('table', { class: 'kv' }, h('tbody', {}, ...grants.map(g => h('tr', {}, h('th', {}, g.to_name || g.to), h('td', { class: 'small' }, `${String(g.at).slice(0, 10)}${g.name ? ' · ' + g.name : ''} · `, h('span', { class: 'mono dim' }, 'sha256 ' + g.token_sha256.slice(0, 16) + '…')))))) : h('p', { class: 'dim small' }, 'None yet. Hand one over from the send page: it travels sealed to their key.'))
    body.append(h('div', { class: 'acts' }, addThis), !vault.token ? [h('label', { class: 'f' }, 'Access key'), tok, h('div', { class: 'acts' }, setTok)] : null, h('div', { class: 'acts' }, reveal))
}
