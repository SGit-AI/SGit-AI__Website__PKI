/* account/index.html: your account. Signed in with a passkey, a section of its own: your profile, your master key and
   the personas it signs, where it is all kept (this browser, or a vault that follows you), and the vault itself, as
   files. The tools (record, links, contacts, inbox, agents) stay where they are and are linked from the side. */
import { h, msg, err, busy, vault, pageUrl, download, copyButton, avatarFor, loadDirectory, standingPill, K, D, A, L } from '../ui.js'
import { signInCard } from '../signin.js'

const app = document.getElementById('app')
const SECTIONS = [['overview', 'Overview', '◉'], ['profile', 'Profile', '☺'], ['keys', 'Keys & personas', '⚿'], ['storage', 'Storage & devices', '▣'], ['explorer', 'Your vault, as files', '☰']]
const TOOLS = [['vault/index.html#record', 'Your record'], ['vault/index.html#links', 'Links'], ['vault/index.html#contacts', 'Contacts'], ['vault/index.html#inbox', 'Inbox'],
               ['vault/index.html#agents', 'Agents'], ['send/index.html', 'Send a message'], ['invite/index.html', 'Invite someone'], ['people/index.html', 'The register']]
const parse = () => { const m = location.hash.match(/^#([a-z]+)/); return m && (m[1] === 'welcome' || SECTIONS.some(s => s[0] === m[1])) ? m[1] : 'overview' }
let route = parse(), drawing = 0
const today = () => new Date().toISOString().slice(0, 10)
const fpOf = id => id.bundle.signing_fingerprint
const avatarOf = () => { const p = vault.profile || {}, m = vault.masterKey; return p.avatar || avatarFor(p.username || p.name || (m && fpOf(m)) || 'pki') }
const whereKept = () => vault.mode === 'vault' ? 'in your master vault' : vault.mode === 'local' ? 'in this browser, encrypted with your passkey' : 'in this browser, encrypted with your passphrase'
const go = r => { if (location.hash !== '#' + r) location.hash = '#' + r; else { route = r; draw() } }

window.addEventListener('hashchange', () => { route = parse(); draw() })
vault.onChange(() => draw())
app.replaceChildren(h('p', { class: 'dim' }, 'Checking this tab’s session…'))
vault.resume().then(() => draw(), () => draw())

async function draw() {
    const t = ++drawing
    if (!vault.open) return app.replaceChildren(h('div', { class: 'acct-out' }, signInCard({ onDone: r => go(r.fresh ? 'welcome' : 'overview') })))
    const pane = h('section', { class: 'pane', id: 'pane-' + route })
    app.replaceChildren(h('div', { class: 'acct' }, side(), pane))
    try { await ({ welcome, overview, profile, keys, storage, explorer })[route](pane) } catch (e) { if (t === drawing) pane.prepend(msg('bad', err(e))) }
}

function side() {
    const p = vault.profile || {}
    const mode = vault.mode === 'vault' ? h('span', { class: 'pill verified' }, 'vault') : vault.mode === 'local' ? h('span', { class: 'pill expired' }, 'this browser') : h('span', { class: 'pill' }, 'passphrase key')
    return h('aside', { class: 'side' },
        h('div', { class: 'who' }, h('img', { class: 'avatar', alt: '', src: avatarOf() }),
            h('div', {}, h('b', { id: 'side-name' }, p.name || (p.username ? '@' + p.username : 'Your account')), p.username && p.name ? h('div', { class: 'dim small' }, '@' + p.username) : null, h('div', {}, mode))),
        h('nav', { class: 'side-nav', 'aria-label': 'Account' }, ...SECTIONS.map(([id, label, ic]) => h('a', { href: '#' + id, class: route === id ? 'on' : '', 'aria-current': route === id ? 'page' : false }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), label))),
        h('div', { class: 'side-h' }, 'Tools'),
        h('nav', { class: 'side-nav tools', 'aria-label': 'Tools' }, ...TOOLS.map(([href, label]) => h('a', { href: pageUrl(href) }, label))),
        h('button', { type: 'button', class: 'btn small signout', id: 'signout', onclick: () => { vault.close(); location.assign(pageUrl('login/index.html')) } }, 'Sign out'))
}
const head = (title, ...lead) => [h('h2', {}, title), lead.length ? h('p', { class: 'lead' }, ...lead) : null]

// ------------------------------------------------------------ welcome: the three steps after the first sign-in
async function welcome(pane) {
    const p = vault.profile || {}, m = vault.masterKey
    const step = !p.set ? 1 : !m ? 2 : 3              // set: the profile form was saved once (the sign-up's username alone is not that)
    const li = (n, t) => h('li', { class: n < step ? 'done' : n === step ? 'now' : '' }, t)
    pane.append(...head('Welcome', 'Your passkey is your login. Three steps, and the account is yours.'),
        h('ol', { class: 'steps' }, li(1, 'Who you are: a username, a name, a picture, a line about you.'), li(2, 'Your master key: the key pair every other key of yours is signed from.'), li(3, 'Where to keep it all: this browser, or a vault that follows you.')))
    const box = h('div', { class: 'vpanel' }); pane.append(box)
    if (step === 1) return profileForm(box, { submit: 'Save and go on' })
    if (step === 2) return masterMaker(box)
    box.append(h('h3', {}, '3 · Where to keep it'), storageChoice(), h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', id: 'welcome-done', onclick: () => go('overview') }, vault.mode === 'vault' ? 'Done' : 'Keep it in this browser for now')))
}

// ------------------------------------------------------------ overview
async function overview(pane) {
    const p = vault.profile || {}, m = vault.masterKey
    const dir = await loadDirectory().catch(() => null)
    const rec = m && dir && dir.byFp.get(fpOf(m))
    const g = rec && rec.fixture ? dir.fixturesGraph : dir && dir.graph
    const st = m && g ? D.standing(g, fpOf(m)) : null
    const mine = m ? await D.readRecord(await vault.statements(fpOf(m))) : null
    const personas = m ? vault.personasOf(fpOf(m)) : []
    pane.append(h('div', { class: 'profile-card' }, h('img', { class: 'avatar big', alt: '', src: avatarOf() }),
        h('div', {}, h('h2', {}, p.name || (p.username ? '@' + p.username : 'Your account')), p.username ? h('div', { class: 'dim' }, '@' + p.username) : null,
            p.blurb ? h('p', {}, p.blurb) : h('p', { class: 'dim small' }, h('a', { href: '#profile' }, 'Add a line about you')))))
    const tile = (label, value, href, note) => h('a', { class: 'tile', href }, h('div', { class: 'tl' }, label), h('div', { class: 'tv' }, value), note ? h('div', { class: 'tn' }, note) : null)
    pane.append(h('div', { class: 'tiles' },
        tile('Kept', vault.mode === 'vault' ? 'In your vault' : 'In this browser', '#storage', vault.mode === 'vault' ? 'follows you to every device' : 'only here, until you move it into a vault'),
        tile('Master key', m ? h('span', { class: 'mono' }, fpOf(m)) : 'none yet', '#keys', m ? m.bundle.label : 'make it on Keys'),
        tile('Personas', String(personas.length), '#keys', personas.length ? personas.map(x => x.bundle.label).join(', ') : 'keys signed by your master'),
        tile('In the register', rec ? standingPill(g, fpOf(m), rec) : 'not yet', rec ? pageUrl('people/person.html') + '#' + K.dirOf(fpOf(m)) : '#keys', st ? st.text : 'publish your record from Keys')))
    const verified = st && ['anchor', 'verified'].includes(st.level)
    const items = [[!!(p.username || p.name), 'A profile', '#profile'], [!!m, 'A master key', '#keys'], [!!(mine && mine.identity), 'Your identity statement, signed by your master key', '#keys'],
                   [!!rec, 'Your record in the register', '#keys'], [verified, 'Verified by an anchor (in person, on a call, or on a channel known to be yours)', pageUrl('people/how.html')], [vault.mode === 'vault', 'In a vault, so it follows you across devices', '#storage']]
    const next = items.findIndex(x => !x[0])
    pane.append(h('h3', {}, 'Your account, step by step'), h('ol', { class: 'steps' }, ...items.map(([ok, t, href], i) => h('li', { class: ok ? 'done' : i === next ? 'now' : '' }, ok ? t : h('a', { href }, t)))))
}

// ------------------------------------------------------------ profile
async function profile(pane) {
    pane.append(...head('Profile', 'Private to your account: kept ', whereKept(), '. The register gets only what you sign, your name and your line about you, when you publish.'))
    profileForm(pane, { submit: 'Save profile' })
    const m = vault.masterKey, mine = m ? await D.readRecord(await vault.statements(fpOf(m))) : null
    if (mine && mine.identity) pane.append(h('p', { class: 'dim small' }, 'Your identity statement, signed: ', h('b', {}, mine.name), mine.identity.body.about ? ' · ' + mine.identity.body.about : '', '. A record has one identity statement, the first; a different name in the register means a new key, or a note in your evidence.'))
}
function profileForm(box, { submit }) {
    const p = vault.profile || {}
    let avatar = p.avatar || ''
    const img = h('img', { class: 'avatar big', alt: 'your picture', src: avatar || avatarFor(p.username || p.name || 'pki') })
    const username = h('input', { class: 't', id: 'pf-username', maxlength: 32, value: p.username || '', placeholder: 'e.g. dinis', autocomplete: 'username' })
    const name = h('input', { class: 't', id: 'pf-name', maxlength: 120, value: p.name || '', placeholder: 'the name people know you by' })
    const blurb = h('textarea', { class: 't', id: 'pf-blurb', maxlength: 600, placeholder: 'a line or two about you' }, p.blurb || '')
    const file = h('input', { type: 'file', accept: 'image/*', id: 'pf-avatar', class: 'visually-hidden' })
    const refresh = () => { img.src = avatar || avatarFor(username.value || name.value || 'pki') }
    username.addEventListener('input', refresh); name.addEventListener('input', refresh)
    file.addEventListener('change', async () => {
        const f = file.files && file.files[0]; if (!f) return
        if (f.size > 15 * 1024 * 1024) return box.prepend(msg('warn', 'That picture is over 15 MB.'))
        try { avatar = await shrink(f); refresh() } catch (e) { box.prepend(msg('bad', 'That file did not read as a picture.')) }
    })
    const save = h('button', { type: 'button', class: 'btn primary', id: 'pf-save' }, submit)
    save.addEventListener('click', () => busy(save, async () => {
        const u = username.value.trim().toLowerCase()
        if (u && !/^[a-z0-9][a-z0-9._-]{1,31}$/.test(u)) return box.prepend(msg('warn', 'A username is 2 to 32 characters: a-z, 0-9, dot, dash, underscore.'))
        if (!u && !name.value.trim()) return box.prepend(msg('warn', 'A username or a name, at least.'))
        await vault.saveProfile({ username: u, name: name.value.trim(), blurb: blurb.value.trim(), avatar, set: true })
    }))
    box.append(h('div', { class: 'pf' },
        h('div', { class: 'pf-pic' }, img, h('div', { class: 'acts' }, h('label', { class: 'btn small', for: 'pf-avatar' }, 'Choose a picture'), file,
            h('button', { type: 'button', class: 'btn small', onclick: () => { avatar = ''; refresh() } }, 'Use the pattern')),
            h('p', { class: 'dim small' }, 'Cropped to a square and shrunk to 160 pixels here, in your browser.')),
        h('div', { class: 'pf-fields' }, h('label', { class: 'f', for: 'pf-username' }, 'Username'), username, h('label', { class: 'f', for: 'pf-name' }, 'Name'), name,
            h('label', { class: 'f', for: 'pf-blurb' }, 'About you ', h('span', { class: 'dim' }, '(up to 600 characters, as the register allows)')), blurb, h('div', { class: 'acts' }, save))))
}
/** A picture to a 160 × 160 JPEG data: URL, centre-cropped: a few kilobytes, whatever came in. */
async function shrink(f) {
    const bmp = await createImageBitmap(f), s = Math.min(bmp.width, bmp.height), c = document.createElement('canvas')
    c.width = c.height = 160
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 160, 160)
    x.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 160, 160)
    return c.toDataURL('image/jpeg', 0.85)
}

// ------------------------------------------------------------ keys: the master, and the personas it signs
async function ensureIdentity(id, name, about = '') {
    const sts = await vault.statements(fpOf(id))
    if (sts.some(s => s.type === 'identity')) return false
    await vault.addStatement(await D.identityStatement(id, { name, about })); return true
}
const profileName = () => { const p = vault.profile || {}; return p.name || p.username || '' }
function masterMaker(box) {
    const label = h('input', { class: 't', id: 'master-label', maxlength: 80, value: profileName(), placeholder: 'your name' })
    const make = h('button', { type: 'button', class: 'btn primary', id: 'master-go' }, 'Make my master key')
    const out = h('div')
    make.addEventListener('click', () => busy(make, async () => {
        if (!label.value.trim()) return out.replaceChildren(msg('warn', 'A name for the key, please.'))
        out.replaceChildren(msg('', 'Making an RSA-4096 encryption pair and an ECDSA P-256 signing pair, here in your browser. RSA-4096 takes a few seconds…'))
        const id = await K.generate(label.value.trim())
        await vault.addIdentity(id, { role: 'master' })
        const p = vault.profile || {}
        await ensureIdentity(id, p.name || label.value.trim(), p.blurb || '')
        draw()
    }))
    box.append(h('h3', {}, 'Your master key'),
        h('p', { class: 'small' }, 'One key pair, made here in your browser, the way ', h('code', {}, 'sgit pki keygen'), ' makes them: RSA-OAEP 4096 to receive, ECDSA P-256 to sign. It is the root of your account: your record in the register starts from it, and every other key of yours (a persona for work, for a project) is signed from it. The private halves are kept ', whereKept(), ', never anywhere else.'),
        h('label', { class: 'f', for: 'master-label' }, 'Name on the key'), label, h('div', { class: 'acts' }, make), out)
}
async function keys(pane) {
    pane.append(...head('Keys & personas', 'Your master key, and the personas it signs. Private halves kept ', whereKept(), '.'))
    const m = vault.masterKey
    if (!m) { const box = h('div', { class: 'vpanel' }); pane.append(box); return masterMaker(box) }
    const dir = await loadDirectory().catch(() => null)
    pane.append(await keyCard(m, { master: true, dir }))
    // personas
    const ps = vault.personasOf(fpOf(m)), others = vault.ids.filter(i => i !== m && !(i.role === 'persona' && i.persona_of === fpOf(m)))
    pane.append(h('h3', {}, 'Personas'), h('p', { class: 'dim small' }, 'Another key of yours, for another part of your life: work, a project, a pseudonym. Your master key signs a link to it and it signs one back ("persona" and "persona-of"), so the register shows one person holding both, with your master’s standing. Each has its own record and fingerprint; messages to it are sealed to it.'))
    for (const p of ps) pane.append(await keyCard(p, { master: false, dir, m }))
    if (!ps.length) pane.append(h('p', { class: 'dim small' }, 'No persona yet.'))
    const name = h('input', { class: 't', id: 'persona-name', maxlength: 80, placeholder: 'e.g. Dinis at work, or a project’s name' })
    const about = h('input', { class: 't', id: 'persona-about', maxlength: 600, placeholder: 'optional: what this persona is for' })
    const make = h('button', { type: 'button', class: 'btn primary', id: 'persona-go' }, 'Make a persona, signed by my master key')
    const out = h('div')
    make.addEventListener('click', () => busy(make, async () => {
        if (!name.value.trim()) return out.replaceChildren(msg('warn', 'A name for the persona, please.'))
        out.replaceChildren(msg('', 'Making the persona’s keys (RSA-4096 takes a few seconds), then signing the two links…'))
        try { await makePersona(m, name.value.trim(), about.value.trim()); draw() } catch (e) { out.replaceChildren(msg('bad', err(e))) }
    }))
    pane.append(h('div', { class: 'vpanel' }, h('h3', {}, 'Make a persona'), h('label', { class: 'f', for: 'persona-name' }, 'Name'), name, h('label', { class: 'f', for: 'persona-about' }, 'About'), about, h('div', { class: 'acts' }, make), out))
    if (others.length) { pane.append(h('h3', {}, 'Other keys'), h('p', { class: 'dim small' }, 'Keys in your account that are neither your master nor one of its personas: brought from sgit, or made before personas.')); for (const o of others) pane.append(await keyCard(o, { master: false, dir })) }
    pane.append(h('p', { class: 'small' }, 'Bringing a key sgit already made, or making a plain one: ', h('a', { href: pageUrl('vault/index.html') + '#keys' }, 'Your vault → Your keys'), '.'))
}
async function makePersona(m, name, about) {
    await ensureIdentity(m, profileName() || m.bundle.label, (vault.profile || {}).blurb || '')
    const id = await K.generate(name)
    await vault.addIdentity(id, { role: 'persona', persona_of: fpOf(m) })
    await vault.addStatement(await D.identityStatement(id, { name, about }))
    await vault.addStatement(await D.linkStatement(id, { to: fpOf(m), method: 'persona-of', on: today() }))
    await vault.addStatement(await D.linkStatement(m, { to: fpOf(id), method: 'persona', on: today() }))
}
async function keyCard(id, { master, dir, m }) {
    const fp = fpOf(id), sts = await vault.statements(fp), mine = await D.readRecord(sts)
    const rec = dir && dir.byFp.get(fp), g = rec && rec.fixture ? dir.fixturesGraph : dir && dir.graph
    const inUse = vault.me === id
    let signed = null
    if (m) {
        const mrec = await D.readRecord(await vault.statements(fpOf(m)))
        signed = mrec.links.some(l => l.to === fp && l.method === 'persona') && mine.links.some(l => l.to === fpOf(m) && l.method === 'persona-of')
    }
    const card = h('div', { class: 'keycard' + (master ? ' master' : ''), 'data-fp': fp },
        h('div', { class: 'kc-head' }, h('span', { class: 'pill ' + (master ? 'anchor' : id.role === 'persona' ? 'persona' : '') }, master ? 'master' : id.role === 'persona' ? 'persona' : 'key'), h('b', {}, id.bundle.label || '(no label)'),
            inUse ? h('span', { class: 'pill verified', title: 'the key the tools sign and send with' }, 'in use') : null),
        h('table', { class: 'kv' }, h('tbody', {},
            h('tr', {}, h('th', {}, 'Record'), h('td', {}, h('span', { class: 'mono' }, fp), ' ', copyButton(fp, 'Copy'))),
            h('tr', {}, h('th', {}, 'Encryption'), h('td', {}, h('span', { class: 'mono' }, id.bundle.fingerprint))),
            id.created ? h('tr', {}, h('th', {}, 'Made'), h('td', {}, new Date(id.created).toISOString().slice(0, 10))) : null,
            h('tr', {}, h('th', {}, 'Private halves'), h('td', {}, whereKept())),
            m ? h('tr', {}, h('th', {}, 'Signed by master'), h('td', {}, signed ? h('span', { class: 'ok' }, '✓ both links signed: master → persona, persona → master') : h('span', { class: 'warn' }, 'not yet'))) : null,
            h('tr', {}, h('th', {}, 'Register'), h('td', {}, rec ? [standingPill(g, fp, rec), ' ', h('a', { href: pageUrl('people/person.html') + '#' + K.dirOf(fp) }, 'its page')] : mine.identity ? 'signed, not published yet' : 'no identity statement yet')))))
    const acts = h('div', { class: 'acts' },
        h('button', { type: 'button', class: 'btn small', onclick: () => download(`${id.bundle.label || 'key'}.public.json`.replace(/[^A-Za-z0-9_.-]+/g, '-'), JSON.stringify(id.bundle, null, 2)) }, 'Public bundle'),
        inUse ? null : h('button', { type: 'button', class: 'btn small', onclick: e => busy(e.target, () => vault.setDefault(fp)) }, 'Use this key'),
        h('button', { type: 'button', class: 'btn small', onclick: () => forSgit(id, card) }, 'For the sgit CLI…'),
        mine.identity ? h('button', { type: 'button', class: 'btn small primary', onclick: e => busy(e.target, () => publish(id, card, dir, m)) }, 'Publish…') : null,
        master && mine.identity ? h('a', { class: 'btn small', href: pageUrl('vault/index.html') + '#record' }, 'Evidence & inbox') : null)
    if (master && !mine.identity) {
        const b = h('button', { type: 'button', class: 'btn small primary', onclick: e => busy(e.target, async () => { if (!profileName()) return card.append(msg('warn', 'Add a name to your profile first.')); await ensureIdentity(id, profileName(), (vault.profile || {}).blurb || ''); draw() }) }, 'Sign my identity statement')
        acts.prepend(b)
    }
    card.append(acts)
    return card
}
function forSgit(id, card) {
    const pass = h('input', { class: 't', type: 'password', autocomplete: 'new-password', placeholder: 'a passphrase for sgit to ask for, 10 characters or more' })
    const go = h('button', { type: 'button', class: 'btn primary' }, 'Download the script')
    go.addEventListener('click', () => busy(go, async () => {
        if (pass.value.length < 10) return card.append(msg('warn', 'At least 10 characters.'))
        const ks = await K.keystoreFiles(id, pass.value)
        download(`sgit-key-${ks.folder}.sh`, K.keystoreScript(ks), 'text/x-shellscript')
    }))
    card.append(h('div', { class: 'vpanel' }, h('p', { class: 'small' }, 'A shell script that writes this key into ~/.sg-send/keys/, where sgit looks, its private halves encrypted with the passphrase you type here.'), pass, h('div', { class: 'acts' }, go)))
}
/** What is signed and not yet in the register, for this key (and, for a persona, the master's link to it), as one file. */
async function publish(id, card, dir, m) {
    const regIds = fp => new Set(dir && dir.byFp.get(fp) ? dir.byFp.get(fp).statements.map(e => e.id) : [])
    const unsentOf = async fp => { const have = regIds(fp), sts = await vault.statements(fp), out = []; for (const s of sts) if (!have.has(await K.statementId(s))) out.push(s); return { fp, sts, out } }
    const parts = [await unsentOf(fpOf(id))]
    if (m) parts.push(await unsentOf(fpOf(m)))
    const subs = parts.filter(p => p.out.length).map(p => D.submission(dir && dir.byFp.get(p.fp) ? p.out : p.sts))
    if (!subs.length) return card.append(msg('ok', 'Everything signed for this key is in the register.'))
    const text = JSON.stringify(subs.length === 1 ? subs[0] : D.submissions(subs), null, 1)
    const n = subs.reduce((s, x) => s + x.statements.length, 0)
    card.append(h('div', { class: 'vpanel' }, h('p', { class: 'small' }, `${n} signed statement(s) not in the register yet${m ? ', the persona’s and your master’s link to it' : ''}: a file of signed statements and nothing else. The register checks every signature before it writes anything.`),
        h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => download(`pki-submission-${K.dirOf(fpOf(id))}.json`, text) }, 'Download the submission'), copyButton(text, 'Copy it'),
            h('a', { class: 'btn', href: `mailto:agent@riskmandate.ai?subject=${encodeURIComponent('pki.sgit.ai submission ' + fpOf(id))}&body=${encodeURIComponent('My submission for the register is attached.')}` }, 'Email it'))))
}

// ------------------------------------------------------------ storage & devices
function storageChoice() {
    const card = (on, title, ...kids) => h('div', { class: 'choice' + (on ? ' on' : '') }, h('div', { class: 'ch-h' }, h('b', {}, title), on ? h('span', { class: 'pill verified' }, 'now') : null), ...kids)
    const box = h('div', { class: 'choices' },
        card(vault.mode === 'local', 'This browser', h('p', { class: 'small' }, 'Everything, encrypted with a key your passkey derives; no passphrase, no access key, no server. It stays in this browser on this device: another device, or this one after its site data is cleared, starts empty.')),
        card(vault.mode === 'vault', 'Your vault', h('p', { class: 'small' }, 'Three encrypted vaults on SG/Send: a door your passkey opens, a master that holds your private keys, a book for your profile, record, contacts and messages. Every device whose passkey opens the door has it all. Needs an SG/Send access key, once.')))
    if (vault.mode === 'local') box.append(upgradeForm())
    return box
}
function upgradeForm() {
    const key = h('input', { class: 't', type: 'password', id: 'upgrade-key', autocomplete: 'off', placeholder: 'an SG/Send access key' })
    const btn = h('button', { type: 'button', class: 'btn primary', id: 'upgrade-go' }, 'Move it all into a vault')
    const out = h('div')
    btn.addEventListener('click', () => busy(btn, async () => {
        if (!key.value.trim()) return out.replaceChildren(msg('warn', 'An access key, please: whoever invited you can give you one, or write to agent@riskmandate.ai.'))
        out.replaceChildren(msg('', 'Creating three vaults (a door, a master, a book), moving your keys, profile and record in, reading them back, and a recovery door…'))
        try {
            const rc = await vault.upgrade(key.value.trim())
            app.replaceChildren(h('div', { class: 'acct-out' }, h('div', { class: 'signin' }, h('h2', {}, 'Your vault is made'),
                msg('warn', h('b', {}, 'Your recovery code, shown once. Write it down: '), h('span', { class: 'mono', id: 'recovery-code' }, rc.shown)),
                h('p', { class: 'small' }, 'It opens a second door to the same vault: for a device with no passkey, and for the day the passkey is gone. This page does not keep it. The copy this browser kept has been removed: your account now lives in the vault.'),
                h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', id: 'recovery-done', onclick: () => go('overview') }, 'I have written it down')))))
        } catch (e) { out.replaceChildren(msg('bad', err(e))) }
    }))
    return h('div', { class: 'vpanel' }, h('h3', {}, 'Move into a vault'), h('p', { class: 'small' }, 'The same passkey opens it afterwards, on any device. Your keys, profile, record and contacts move in; the copy here is removed once the vault reads them back.'),
        h('label', { class: 'f', for: 'upgrade-key' }, 'SG/Send access key'), key, h('div', { class: 'acts' }, btn), out)
}
async function storage(pane) {
    pane.append(...head('Storage & devices', 'Where your account is kept, and what opens it.'), storageChoice())
    if (vault.mode === 'local') {
        const raw = (() => { try { return localStorage.getItem(L.PREFIX + vault.doorKey.vaultId) || '' } catch (e) { return '' } })()
        const kept = await L.persisted()
        const keep = h('button', { type: 'button', class: 'btn small', onclick: e => busy(e.target, async () => { const r = await L.persist(); e.target.replaceWith(h('span', { class: r ? 'ok' : 'warn' }, r ? 'kept: the browser will not clear it under pressure' : 'the browser said no (it decides; bookmarking the site or installing it often helps)')) }) }, 'Ask the browser to keep it')
        pane.append(h('h3', {}, 'In this browser'), h('table', { class: 'kv' }, h('tbody', {},
            h('tr', {}, h('th', {}, 'Stored as'), h('td', {}, h('span', { class: 'mono' }, L.PREFIX + vault.doorKey.vaultId), ' in local storage, ', (raw.length / 1024).toFixed(1), ' KB of ciphertext')),
            h('tr', {}, h('th', {}, 'Encrypted with'), h('td', {}, 'AES-256-GCM, its key derived from your passkey’s PRF bytes (HKDF, "pki.sgit.ai/local/v1"): no passkey, no reading it')),
            h('tr', {}, h('th', {}, 'Persistent'), h('td', {}, kept ? h('span', { class: 'ok' }, 'yes: the browser will not clear it under pressure') : keep)))))
        const del = h('button', { type: 'button', class: 'btn small', id: 'local-remove' }, 'Remove this account from this browser')
        del.addEventListener('click', () => { if (!confirm('Remove the account kept in this browser? Its private keys exist nowhere else: export them for sgit first if you need them.')) return; L.remove(vault.doorKey); vault.close(); location.assign(pageUrl('login/index.html')) })
        pane.append(h('details', { class: 'danger' }, h('summary', {}, 'Remove it'), h('p', { class: 'small' }, 'Its private keys exist nowhere else. Export them (Keys → For the sgit CLI) before, if you need them.'), del))
    }
    if (vault.mode === 'vault') {
        pane.append(h('h3', {}, 'Your three vaults'), h('table', { class: 'kv' }, h('tbody', {},
            h('tr', {}, h('th', {}, 'Door'), h('td', {}, h('span', { class: 'mono' }, vault.door && vault.door.vaultId), ' · at the address your passkey derives; holds the master’s key')),
            h('tr', {}, h('th', {}, 'Master'), h('td', {}, h('span', { class: 'mono' }, vault.master && vault.master.vaultId), ' · your private keys, the access key, the doors')),
            h('tr', {}, h('th', {}, 'Book'), h('td', {}, h('span', { class: 'mono' }, vault.book && vault.book.vaultId), ' · profile, record, contacts, messages, invitations')),
            h('tr', {}, h('th', {}, 'Access key'), h('td', {}, vault.token ? 'kept in your master (.vault/access-token.json); never shown here' : h('span', { class: 'warn' }, 'none: the vaults open, but nothing can be written'))))))
        const tok = h('input', { class: 't', type: 'password', autocomplete: 'off', placeholder: 'a new SG/Send access key' })
        const set = h('button', { type: 'button', class: 'btn small' }, 'Replace the access key')
        set.addEventListener('click', () => busy(set, async () => { if (!tok.value.trim()) return; await A.setToken(vault.master, tok.value.trim()); vault.token = tok.value.trim(); vault.sg.token = vault.token; tok.value = ''; pane.append(msg('ok', 'Replaced.')) }))
        pane.append(h('details', {}, h('summary', {}, 'Replace the access key'), tok, h('div', { class: 'acts' }, set)))
        pane.append(h('h3', {}, 'Doors: what opens your vault'), h('table', { class: 'kv' }, h('tbody', {}, ...(vault.doors || []).map(d => h('tr', {},
            h('th', {}, d.kind === 'recovery' ? 'recovery code' : 'passkey'), h('td', {}, d.device || 'a device', d.path ? ` · ${d.path}` : '', ' · made ', String(d.created || '').slice(0, 10), ' · door ', h('span', { class: 'mono' }, d.vault_id || '')))))),
            h('p', { class: 'dim small' }, 'A passkey that syncs (iCloud Keychain, Google Password Manager) is the same door on every device it reaches. A passkey that does not (a security key, Windows Hello) is a door of its own: add it here.'))
        const add = h('button', { type: 'button', class: 'btn', id: 'door-add' }, 'Add another passkey as a door')
        add.addEventListener('click', () => busy(add, async () => {
            try {
                const p = vault.profile || {}
                const cred = await vault.makePasskey(p.username || p.name || '')
                const ext = cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}
                const D_ = await import('../door.js')
                const prf = ext.prf && ext.prf.results && ext.prf.results.first ? { bytes: new Uint8Array(ext.prf.results.first), path: cred.authenticatorAttachment || '', credId: cred.id } : await D_.prfBytes(D_.PRF_INPUT_TEXT)
                const door = await D_.doorFrom(prf.bytes)
                if (vault.doors.some(d => d.vault_id === door.vaultId)) return pane.append(msg('warn', 'That passkey is already a door to this vault.'))
                const r = await A.addDoor({ sgSend: vault.sg, master: vault.master, door, record: { kind: 'passkey', path: prf.path, credential_id: prf.credId, device: navigator.platform || '' } })
                vault.doors = r.doors; draw()
            } catch (e) { pane.append(msg('bad', err(e))) }
        }))
        pane.append(h('div', { class: 'acts' }, add))
    }
    if (vault.mode === 'browser') pane.append(msg('warn', 'This key is kept with a passphrase, the older way. Sign in with a passkey and move it into a vault from ', h('a', { href: pageUrl('vault/index.html') }, 'your vault'), '.'))
}

// ------------------------------------------------------------ the vault, as files
const SECRET = /(^|\/)(private_key\.pem|signing_private\.pem|access-token\.json|master-key\.json|book\.json|doors\.json|inbox\.json)$/
async function explorer(pane) {
    pane.append(...head('Your vault, as files', 'What is actually kept, as it is kept. Secret files are masked until you reveal them, here, on your screen.'))
    if (vault.mode === 'local') {
        const raw = (() => { try { return JSON.parse(localStorage.getItem(L.PREFIX + vault.doorKey.vaultId) || '{}') } catch (e) { return {} } })()
        const shown = JSON.parse(JSON.stringify(vault.local))
        for (const k of shown.keys || []) { k.encrypt = `‹private, ${K.unb64(k.encrypt).length} bytes of PKCS#8: never shown›`; k.sign = `‹private, ${K.unb64(k.sign).length} bytes of PKCS#8: never shown›` }
        if (shown.profile && shown.profile.avatar) shown.profile.avatar = shown.profile.avatar.slice(0, 40) + `… (${shown.profile.avatar.length} characters)`
        pane.append(h('h3', {}, 'What this browser stores'), h('p', { class: 'small' }, 'One entry in local storage, ', h('span', { class: 'mono' }, L.PREFIX + vault.doorKey.vaultId), ': ciphertext, and nothing that names you.'),
            h('pre', { class: 'file', id: 'local-raw' }, JSON.stringify({ ...raw, ct: String(raw.ct || '').slice(0, 120) + `… (${String(raw.ct || '').length} characters)` }, null, 1)),
            h('h3', {}, 'What your passkey opens it to'), h('pre', { class: 'file', id: 'local-plain' }, JSON.stringify(shown, null, 1)),
            h('p', { class: 'dim small' }, 'In a vault, the same account is files in three vaults: move into a vault (Storage) to see them here.'))
        return
    }
    if (vault.mode !== 'vault') return pane.append(msg('warn', 'Nothing kept as files: the key is in this browser.'))
    const which = new URLSearchParams(location.hash.split('?')[1] || '').get('v') || 'book'
    const vs = { book: vault.book, master: vault.master, door: vault.door }
    pane.append(h('div', { class: 'tabs' }, ...[['book', 'Book'], ['master', 'Master'], ['door', 'Door']].map(([k, l]) => h('button', { type: 'button', class: k === which ? 'on' : '', onclick: () => { location.hash = '#explorer?v=' + k } }, l))))
    const v = vs[which]
    pane.append(h('p', { class: 'dim small' }, { book: 'Your profile, record, contacts and messages.', master: 'Your private keys (sgit’s key store layout), the access key, the doors, the book’s key.', door: 'At the address your passkey derives: the master’s key, and where the door came from.' }[which], ' Vault ', h('span', { class: 'mono' }, v.vaultId), '.'))
    const view = h('div', { class: 'viewer' }, h('p', { class: 'dim small' }, 'Pick a file.'))
    const list = h('ul', { class: 'tree', id: 'tree' })
    pane.append(h('div', { class: 'explore' }, list, view))
    const files = await A.tree(v)
    if (!files.length) list.append(h('li', { class: 'dim' }, '(empty)'))
    for (const f of files) {
        const label = f.path.split('/').pop()
        if (f.folder) { list.append(h('li', { class: 'dir', style: `padding-left:${f.depth * .9}rem` }, '▸ ', label, '/')); continue }
        const secret = SECRET.test(f.path)
        list.append(h('li', { style: `padding-left:${f.depth * .9}rem` }, h('button', { type: 'button', class: 'linkish' + (secret ? ' secret' : ''), onclick: () => show(v, f.path, secret, view) }, secret ? '🔒 ' : '', label)))
    }
}
async function show(v, path, secret, view) {
    const text = await A.NV.readText(v, path)
    const pre = h('pre', { class: 'file' })
    const reveal = () => { pre.textContent = /\.json$/.test(path) ? (() => { try { return JSON.stringify(JSON.parse(text), null, 1) } catch (e) { return text } })() : text }
    view.replaceChildren(h('div', { class: 'vh' }, h('b', { class: 'mono' }, path), ' ', h('span', { class: 'dim small' }, `${new TextEncoder().encode(text || '').length} bytes`)), pre)
    if (secret) {
        pre.textContent = '•••••••• a secret: masked. It is decrypted in this tab only; revealing it shows it on your screen.'
        view.append(h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn small', onclick: e => { reveal(); e.target.remove() } }, 'Reveal on this screen')))
    } else reveal()
}
