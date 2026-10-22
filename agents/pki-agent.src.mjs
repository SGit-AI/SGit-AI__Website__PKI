#!/usr/bin/env node
/**
 * pki-agent: an agent's identity on pki.sgit.ai, from the command line. One file, no dependencies, Node 18+.
 *
 *     curl -sO https://pki.sgit.ai/agents/pki-agent.mjs && node pki-agent.mjs help
 *
 * The agent makes its own key here; the private halves never leave the machine it runs on. What it hands out is its
 * public record, signed: an identity (kind "agent") and a link to the key that operates it. Its operator confirms it
 * from their vault (pki.sgit.ai/vault/, the Agents tab) with a link back, method "operates", and an end date; from
 * then until that date the register shows the agent as operated by them.
 *
 * Keys are kept where the sgit CLI keeps them (~/.sg-send/keys/sha256_<encryption fp>/, the same five files), so
 * `sgit pki` uses the same key; the private halves are encrypted with SG_SEND_PASSPHRASE when it is set (as sgit
 * does) and written plain, mode 0600, when it is not. The agent's own statements are kept in ~/.sg-send/pki/.
 * PKI_AGENT_HOME moves both; PKI_REGISTER points at another register (default https://pki.sgit.ai/).
 *
 * A key that must outlive one machine (a cloud session is a fresh container each time) travels as PKI_AGENT_KEY: the
 * output of `keyfile`, the two private halves encrypted with SG_SEND_PASSPHRASE, set as a secret in the environment
 * the agent runs in. Whoever sets that secret holds the key in custody; a session key avoids it altogether.
 *
 * Trust before a secret (v0.2.8): `send` and `seal` refuse a recipient that does not chain to a pinned root. The root
 * is one fingerprint the agent is given out of band (its instructions; `pin`, or PKI_ROOT), never the register's own
 * anchors.json, since whoever can change the site can change that file. When the pin names a domain, the root's
 * fingerprint must also be in a DNS TXT record at _pki.sgit.ai.<domain>, a second channel under another control.
 * The register is then read with the pinned key as the only anchor (directory.js trustFrom).
 *
 * agents/pki-agent.mjs is generated from this file and assets/people/ by admin/build/gen_agent_tool.mjs: the same
 * code the site runs, in one file.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import zlib from 'zlib'
import { execFileSync } from 'child_process'
import * as K from '../assets/people/keys.js'
import * as D from '../assets/people/directory.js'
import * as M from '../assets/people/message.js'
import * as EV from '../assets/people/evidence.js'
import * as QR from '../assets/people/qrread.js'
import { qrcode } from '../assets/vendor/qrcode-generator/2.0.4/qrcode.mjs'

const HOME = process.env.PKI_AGENT_HOME || path.join(os.homedir(), '.sg-send')
const KEYS = path.join(HOME, 'keys'), PKI = path.join(HOME, 'pki'), RECORDS = path.join(PKI, 'records')
const REGISTER = (process.env.PKI_REGISTER || 'https://pki.sgit.ai/').replace(/\/?$/, '/')
const PASS = process.env.SG_SEND_PASSPHRASE || ''
const say = (...a) => console.log(...a), die = m => { console.error('pki-agent: ' + m); process.exit(1) }

// ------------------------------------------------------------ arguments
const [cmd = 'help', ...rest] = process.argv.slice(2)
const flags = {}, args = []
for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); flags[k] = v != null ? v : (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true) }
    else args.push(a)
}

// ------------------------------------------------------------ the key store (sgit's layout) and the agent's record
const writeSecret = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true, mode: 0o700 }); fs.writeFileSync(f, text, { mode: 0o600 }) }
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const state = () => fs.existsSync(path.join(PKI, 'agent.json')) ? readJson(path.join(PKI, 'agent.json')) : {}
async function saveKey(id) {
    const dir = path.join(KEYS, id.bundle.fingerprint.replace(':', '_'))
    const priv = async der => PASS ? K.encryptPrivate(der, PASS) : K.pem(der, 'PRIVATE KEY')
    writeSecret(path.join(dir, 'private_key.pem'), await priv(id.private.encrypt))
    writeSecret(path.join(dir, 'signing_private.pem'), await priv(id.private.sign))
    fs.writeFileSync(path.join(dir, 'public_key.pem'), id.bundle.encrypt)
    fs.writeFileSync(path.join(dir, 'signing_public.pem'), id.bundle.sign)
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({ label: id.bundle.label, algorithm: 'RSA-OAEP', key_size: 4096, encryption_fingerprint: id.bundle.fingerprint, signing_fingerprint: id.bundle.signing_fingerprint, created: id.created }, null, 2))
    return dir
}
async function loadKey(fp) {
    for (const d of fs.existsSync(KEYS) ? fs.readdirSync(KEYS) : []) {
        const meta = path.join(KEYS, d, 'metadata.json')
        if (!fs.existsSync(meta)) continue
        const m = readJson(meta)
        if (m.signing_fingerprint !== fp && m.encryption_fingerprint !== fp) continue
        try { return await K.importKeystore({ privateKeyPem: fs.readFileSync(path.join(KEYS, d, 'private_key.pem'), 'utf8'), signingPrivatePem: fs.readFileSync(path.join(KEYS, d, 'signing_private.pem'), 'utf8'), passphrase: PASS, label: m.label, created: m.created }) }
        catch (e) { die(`the key ${fp} is in ${path.join(KEYS, d)} but does not open: ${e.message}${PASS ? '' : ' (set SG_SEND_PASSPHRASE)'}`) }
    }
    return null
}
async function me() {
    if (process.env.PKI_AGENT_KEY && !flags.key) {
        let k; try { k = JSON.parse(process.env.PKI_AGENT_KEY) } catch (e) { die('PKI_AGENT_KEY is not the JSON keyfile prints') }
        try { return await K.importKeystore({ privateKeyPem: k.private_key, signingPrivatePem: k.signing_private, passphrase: PASS, label: k.label || '', created: k.created || 0 }) }
        catch (e) { die(`PKI_AGENT_KEY does not open: ${e.message}${PASS ? '' : ' (set SG_SEND_PASSPHRASE)'}`) }
    }
    const fp = flags.key || state().default
    if (!fp) die('no key yet: node pki-agent.mjs keygen --name "<what this agent is>"')
    const id = await loadKey(fp)
    if (!id) die(`the key ${fp} is not in ${KEYS}: it lived in another session or machine. Make a new one (keygen).`)
    return id
}
const recDir = fp => path.join(RECORDS, K.dirOf(fp))
function statements(fp) { const d = recDir(fp); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.json')).sort().map(f => readJson(path.join(d, f))) : [] }
function keep(st) { const d = recDir(st.record), n = statements(st.record).length + 1; fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `${String(n).padStart(2, '0')}__${st.type}.json`), JSON.stringify(st, null, 2)); return st }
async function register() {
    const r = await fetch(REGISTER + 'directory/index.json'); if (!r.ok) die(`the register did not answer (${r.status})`)
    const index = await r.json(), records = []
    for (const x of index.records) { const rec = await D.readRecord(x.statements, { dir: x.fp, fixture: x.fixture }); rec.dir = x.dir; records.push(rec) }
    return { index, records, byFp: new Map(records.map(r => [r.fp, r])), graph: D.graph(records, { anchors: index.anchors }) }
}

// ------------------------------------------------------------ the pinned root, and trust from it
const ROOTF = path.join(PKI, 'root.json')
function pinned() {
    if (process.env.PKI_ROOT) return { fp: process.env.PKI_ROOT.trim(), dns: (process.env.PKI_ROOT_DNS || '').trim(), from: 'PKI_ROOT' }
    return fs.existsSync(ROOTF) ? { ...readJson(ROOTF), from: ROOTF } : null
}
/** The pinned root, checked: in the register, unrevoked, and in DNS when the pin names a domain. The graph from it alone. */
async function fromRoot(reg) {
    const p = pinned()
    if (!p) die('no root pinned. node pki-agent.mjs pin <the root fingerprint your instructions give> [--dns <domain>] (or set PKI_ROOT)')
    if (!K.FP.test(p.fp)) die(`the pinned root ${p.fp} is not a sha256:<16 hex> fingerprint`)
    const rec = reg.byFp.get(p.fp)
    if (!rec || !rec.ok || rec.revoked) die(`the pinned root ${p.fp} is not a live record in the register: refusing`)
    const notes = []
    if (!reg.index.anchors.includes(p.fp)) notes.push(`the register's anchors.json does not name ${p.fp}: trusting the pin, not the site`)
    const domains = new Set([...(p.dns ? [p.dns] : []), ...rec.evidence.filter(e => e.kind === 'dns').map(e => e.value)])
    for (const d of domains) {
        const r = await EV.check({ kind: 'dns', value: d }, p.fp)
        if (r.ok === false) die(`DNS disagrees with the pinned root: ${r.detail}. Refusing.`)
        if (r.ok !== true && d === p.dns && !flags['no-dns']) die(`the pin requires DNS at ${d}, and it could not be checked (${r.detail}). Refusing (--no-dns to go on without it).`)
        notes.push(`DNS ${d}: ${r.ok === true ? 'carries the root' : 'not checked'} (${r.detail})`)
    }
    return { p, rec, notes, g: D.graph(reg.records, { anchors: [p.fp] }) }
}
/** Refuse a recipient the pinned root does not vouch for, unless --unverified says to. Returns the trust found. */
async function vouched(reg, fp) {
    if (flags.unverified) { console.error(`pki-agent: --unverified: sealing to ${fp} without checking it chains to a root`); return null }
    const { g, p, notes } = await fromRoot(reg)
    for (const n of notes) console.error('pki-agent: ' + n)
    const t = D.trustFrom(g, fp, p.fp)
    if (!t.ok) die(`refusing to seal to ${fp}: ${t.why}. It must be the pinned root (${p.fp}), verified by it, a persona of it, or an agent it operates, in date. (--unverified to override, knowingly.)`)
    if (t.policy_agrees === false) die(`refusing: the operator authorised policy ${t.policy}, the agent claims ${t.claimed_policy}`)
    console.error(`pki-agent: ${fp} chains to the root: ${t.chain.join(' → ')}${t.until ? `, until ${t.until}` : ''}${t.policy ? `, policy ${t.policy}` : ''}`)
    return t
}
/** A QR code as an SVG file: the same drawing the site's pages make. */
function svgOf(text) {
    const q = qrcode(0, 'L'); q.addData(String(text), 'Byte'); q.make()
    const n = q.getModuleCount(), m = 4, size = n + m * 2
    let d = ''
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (!q.isDark(r, c)) continue; let run = 1; while (c + run < n && q.isDark(r, c + run)) run++; d += `M${c + m} ${r + m}h${run}v1h-${run}z`; c += run - 1 }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 8}" height="${size * 8}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>\n`
}
/** A QR code file: PNG (8 pixels a module) or SVG, by the name's extension. Its text is the strict JSON an agent reads
    (message.js qrSealed / qrKey), or the plain link with --qr-link, for a phone's camera. */
async function qrOut(text, file) {
    if (!file || file === true) return
    if (text.length > M.MAX_QR_CHARS) { console.error(`pki-agent: ${text.length} characters: too long for one QR code; the link still works`); return }
    if (/\.svg$/i.test(file)) fs.writeFileSync(file, svgOf(text))
    else {
        const q = qrcode(0, 'L'); q.addData(String(text), 'Byte'); q.make()
        const n = q.getModuleCount(), m = 4, px = 8, size = (n + m * 2) * px, lum = new Uint8Array(size * size).fill(255)
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) for (let y = 0; y < px; y++) lum.fill(0, ((r + m) * px + y) * size + (c + m) * px, ((r + m) * px + y) * size + (c + m + 1) * px)
        const png = await QR.encodePng(lum, size, size, d => zlib.deflateSync(d))
        if (QR.readQr((await QR.decodePng(png, d => zlib.inflateSync(d))).lum, size, size) !== text) die('the QR code did not read back: not written')
        fs.writeFileSync(file, png)
    }
    say(`QR code: ${path.resolve(file)} (${/^\{/.test(text) ? 'strict JSON, for an agent' : 'a link, for a phone'})`)
}
/** What a QR code image holds, read and checked against the two shapes this site makes; nothing else gets through. */
async function fromQrImage(file) {
    const img = await QR.decodePng(fs.readFileSync(file), d => zlib.inflateSync(d))
    let text; try { text = QR.readQr(img.lum, img.w, img.h) } catch (e) { die(`${file}: no QR code read (${e.message}). Save the image as a PNG, cropped to the code, and try again.`) }
    try { return M.parseQrText(text) } catch (e) { die(`${file}: ${e.message}`) }
}
/** Where a sealed code comes from: a QR image, a file of strict JSON, a link, an m1 code, or an .enc file. */
async function sourceOf(src) {
    if (/\.png$/i.test(src) && fs.existsSync(src)) return fromQrImage(src)
    const text = fs.existsSync(src) ? fs.readFileSync(src, 'utf8').trim() : String(src).trim()
    if (text.startsWith('{') || /^(https:\/\/pki\.sgit\.ai\/|m1\.|k1\.)/.test(text)) { try { return M.parseQrText(text) } catch (e) { die(e.message) } }
    return { kind: 'enc', enc: text }
}
const qrTextOf = (sealed, to, from) => flags['qr-link'] ? sealed.url : M.qrSealed({ to, from, code: sealed.code })
const policyOf = v => { if (!v) return ''; if (D.POLICY.test(String(v))) return String(v); if (!fs.existsSync(String(v))) die(`--policy ${v}: neither a sha256:<64 hex> nor a file`); return null }
async function policyHash(v) { const p = policyOf(v); return p !== null ? p : 'sha256:' + await K.sha256hex(fs.readFileSync(String(v))) }
const expiresIn = days => days ? new Date(Date.now() + Number(days) * 86400000).toISOString() : ''

// ------------------------------------------------------------ the commands
const commands = {
    async help() {
        say(`pki-agent: an agent's identity on pki.sgit.ai (${REGISTER})

  keygen --name N [--about A] [--runtime R] [--session]   make this agent's key and sign its identity
  operator <fingerprint> [--policy FILE|HASH]              link to the key that operates this agent
  submission [--out FILE]                                  the signed record, to hand to the operator
  submit                                                   send it, sealed, into the operator's inbox
  status                                                   what the register says about this agent
  whoami                                                   this agent's fingerprints
  send --to FP --text T [--subject S] [--expires DAYS] [--qr F.svg]   a message sealed to someone the root vouches for
  seal [--to FP,FP] (--file F | --text T) [--name N] [--expires DAYS] [--qr F.svg]
                                                           a secret (a vault key) sealed to the root by default,
                                                           or to keys it vouches for; one link each
  pin <root fingerprint> [--dns DOMAIN]                    the root to trust, given out of band (or PKI_ROOT)
  root                                                     check the pinned root: register, anchors, DNS
  trust <fingerprint>                                      does it chain to the pinned root? (and its policy)
  keyqr [--out F.png]                                      this agent's public key as a link and a QR code
  read-qr <image.png>                                      what a QR image holds, checked (never the secret)
  QR files: --qr / --out F.png (or .svg); strict JSON for an agent by default, --qr-link for a phone's camera
  seal --from-vault DIR: the vault key straight from sgit vault show-key, never printed
  policy <file>                                            the sha256 a link names a behaviour policy by
  open <qr.png | link | m1… | file.enc> [--save DIR]       open a message sealed to this agent
  sign <file>                                              a signature sgit pki verify checks (file.sig)
  link <fingerprint> [--method known]                      link to any key in the register
  evidence --kind link|website|github|dns|key --value V [--url U]   a signed claim, e.g. the session's own URL
  keyfile                                                  this key as one line, for a PKI_AGENT_KEY secret (encrypted
                                                           when SG_SEND_PASSPHRASE is set; then that is a secret too)

Keys: ${KEYS} (sgit's layout${PASS ? ', encrypted with SG_SEND_PASSPHRASE' : ', plain, 0600: set SG_SEND_PASSPHRASE to encrypt'}).`)
    },
    async keygen() {
        if (!flags.name) die('keygen --name "<what this agent is>"')
        const id = await K.generate(String(flags.label || flags.name).slice(0, 80))
        const dir = await saveKey(id)
        const st = keep(await D.agentStatement(id, { name: flags.name, about: flags.about || '', runtime: flags.runtime || '', session: !!flags.session }))
        fs.mkdirSync(PKI, { recursive: true }); fs.writeFileSync(path.join(PKI, 'agent.json'), JSON.stringify({ ...state(), default: id.bundle.signing_fingerprint }, null, 2))
        say(`made: ${id.bundle.signing_fingerprint}  (record; encryption key ${id.bundle.fingerprint})`)
        say(`private halves: ${dir}${PASS ? ' (encrypted)' : ' (plain, 0600)'}; they stay here`)
        say(`identity signed (${st.created_at}). Next: node pki-agent.mjs operator <your operator's fingerprint>`)
    },
    async operator() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('operator <sha256:16 hex>')
        const id = await me(), policy = await policyHash(flags.policy)
        keep(await D.linkStatement(id, { to: fp, method: 'operated-by', policy }))
        say(`linked to ${fp} as its operator${policy ? `, under policy ${policy}` : ''}. Next: node pki-agent.mjs submission (or submit), and ask them to confirm it.`)
    },
    async link() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('link <sha256:16 hex>')
        keep(await D.linkStatement(await me(), { to: fp, method: flags.method || 'known' })); say(`linked to ${fp}`)
    },
    async evidence() {
        if (!D.EVIDENCE[flags.kind] || !flags.value) die('evidence --kind link|website|github|dns|key --value V [--url https://…]')
        keep(await D.evidenceStatement(await me(), { kind: flags.kind, value: flags.value, url: flags.url || '' })); say('evidence signed')
    },
    async whoami() { const id = await me(); say(JSON.stringify({ record: id.bundle.signing_fingerprint, encryption: id.bundle.fingerprint, label: id.bundle.label, keys: KEYS }, null, 2)) },
    async submission() {
        const id = await me(), sts = statements(id.bundle.signing_fingerprint)
        const r = await D.readRecord(sts); if (!r.ok) die('the record does not read cleanly: ' + r.problems.join('; '))
        const text = JSON.stringify(D.submission(sts), null, 1)
        if (flags.out) { fs.writeFileSync(flags.out, text); say(`written: ${flags.out} (${sts.length} statements, record ${r.fp})`) } else say(text)
    },
    async submit() {
        const id = await me(), fp = id.bundle.signing_fingerprint, sts = statements(fp)
        const r = await D.readRecord(sts); if (!r.ok) die('the record does not read cleanly: ' + r.problems.join('; '))
        const op = (r.links.find(l => l.method === 'operated-by') || {}).to || flags.to
        if (!op) die('no operator: node pki-agent.mjs operator <fingerprint> first')
        const reg = await register(), opRec = reg.byFp.get(op)
        if (!opRec) die(`the operator ${op} is not in the register; hand them the submission instead (submission --out FILE)`)
        if (!opRec.inbox) die(`${opRec.name} has no inbox on their record; hand them the submission instead (submission --out FILE)`)
        const msg = await M.compose({ to: opRec.bundle, from: id, subject: `An agent asks to be confirmed: ${r.name}`, text: `${r.name} (${fp}) asks ${opRec.name} to confirm they operate it. Compare this fingerprint with the one the agent printed in its session before confirming.`,
            files: [{ name: 'submission.json', type: 'application/json', data: K.utf8(JSON.stringify(D.submission(sts), null, 1)) }] })
        const sealed = await M.sealMessage(msg, opRec.bundle, id)
        const w = await fetch(`${opRec.inbox.endpoint}/api/vault/append/write/${opRec.inbox.vault}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ append_token: opRec.inbox.token, payload: btoa(M.parseCode(sealed.code).enc) }) })
        if (!w.ok) die(`the inbox answered ${w.status}`)
        say(`sent, sealed to ${opRec.name}'s key, into their inbox. They confirm it from pki.sgit.ai/vault/ (Agents). Fingerprint to read them: ${fp}`)
    },
    async status() {
        const id = await me(), fp = id.bundle.signing_fingerprint, reg = await register()
        if (!reg.byFp.has(fp)) return say(`${fp}: not in the register yet (${statements(fp).length} statements kept here, not yet added)`)
        say(`${fp}: ${D.standing(reg.graph, fp).text}`)
    },
    async send() {
        const id = await me(), reg = await register(), to = reg.byFp.get(flags.to)
        if (!to) die(`--to ${flags.to}: not in the register`)
        await vouched(reg, to.fp)
        const sealed = await M.sealMessage(await M.compose({ to: to.bundle, from: id, subject: flags.subject || '', text: String(flags.text || ''), expires: expiresIn(flags.expires) }), to.bundle, id)
        say(sealed.url); await qrOut(qrTextOf(sealed, to.fp, id.bundle.signing_fingerprint), flags.qr)
    },
    async seal() {
        const id = await me(), reg = await register()
        const tos = String(flags.to && flags.to !== true ? flags.to : (pinned() || {}).fp || '').split(',').map(x => x.trim()).filter(Boolean)
        if (!tos.length) die('seal: --to FP, or pin a root to seal to it by default')
        let data, name = flags.name && flags.name !== true ? String(flags.name) : ''
        if (flags['from-vault']) {
            // the vault key straight from sgit, into memory: it is never printed, never written to a file here
            const dir = flags['from-vault'] === true ? '.' : String(flags['from-vault'])
            let out; try { out = execFileSync('sgit', ['vault', 'show-key'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) { die(`sgit vault show-key in ${dir} failed: is it an sgit vault, and is sgit installed?`) }
            const m = new RegExp('sgit_private_' + 'vault_[A-Za-z0-9]+:[a-z0-9]+').exec(out)
            if (!m) die('sgit vault show-key printed no vault key that this tool recognises: nothing sealed')
            data = K.utf8(m[0]); name = name || `vault key: ${m[0].split(':').pop()}`
        } else if (flags.file) { data = fs.readFileSync(String(flags.file)); name = name || path.basename(String(flags.file)) } else if (flags.text) data = K.utf8(String(flags.text))
        else die('seal: --from-vault DIR, --file F or --text T (never paste a key on the command line: --text is for tests)')
        for (const fp of tos) {
            const to = reg.byFp.get(fp); if (!to) die(`${fp}: not in the register`)
            await vouched(reg, fp)
            const m = await M.compose({ to: to.bundle, from: id, subject: `A secret: ${name || 'unnamed'}`, text: `Sealed to ${fp} by ${id.bundle.signing_fingerprint}. Open it with your key; the secret is the file inside.`, files: [{ name: name || 'secret.txt', type: 'application/octet-stream', data }], expires: expiresIn(flags.expires || 7) })
            const sealed = await M.sealMessage(m, to.bundle, id)
            say(`${to.name} (${fp}):`); say(sealed.url)
            await qrOut(qrTextOf(sealed, fp, id.bundle.signing_fingerprint), flags.qr && flags.qr !== true ? (tos.length > 1 ? String(flags.qr).replace(/(\.(svg|png))?$/i, m => `-${K.dirOf(fp)}${m || '.png'}`) : String(flags.qr)) : '')
        }
    },
    async pin() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('pin <sha256:16 hex> [--dns domain]')
        fs.mkdirSync(PKI, { recursive: true })
        fs.writeFileSync(ROOTF, JSON.stringify({ fp, dns: flags.dns && flags.dns !== true ? String(flags.dns) : '', pinned_at: new Date().toISOString() }, null, 2))
        say(`pinned: ${fp}${flags.dns ? ` (and DNS at _pki.sgit.ai.${flags.dns})` : ''}. Only pin a fingerprint you were given out of band, never one read from the register.`)
    },
    async root() {
        const { p, rec, notes } = await fromRoot(await register())
        say(`root: ${rec.name} (${p.fp}), pinned from ${p.from}`); for (const n of notes) say('  ' + n)
    },
    async trust() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('trust <sha256:16 hex>')
        const { g, p } = await fromRoot(await register())
        say(JSON.stringify(D.trustFrom(g, fp, p.fp), null, 2))
    },
    async keyqr() {
        const id = await me(), k = M.keyCode(id.bundle)
        say(k.url); say(`fingerprint: ${id.bundle.signing_fingerprint} (read it to whoever scans this)`)
        await qrOut(flags['qr-link'] ? k.url : M.qrKey({ fp: id.bundle.signing_fingerprint, label: id.bundle.label, code: k.code }), flags.out)
    },
    async 'read-qr'() {
        const f = args[0]; if (!f || !fs.existsSync(f)) die('read-qr <image.png>')
        const q = await fromQrImage(f)
        say(JSON.stringify(q.kind === 'sealed' ? { kind: q.kind, to: q.to, from: q.from, bytes: q.code.length } : { kind: q.kind, fp: q.fp, label: q.label, fingerprint_from_key: (await M.parseKeyCode(q.code)).signing_fingerprint }, null, 2))
    },
    async policy() {
        const f = args[0]; if (!f || !fs.existsSync(f)) die('policy <file>')
        say('sha256:' + await K.sha256hex(fs.readFileSync(f)))
    },
    async open() {
        const src = args[0]; if (!src) die('open <qr.png | qr.json | link | m1… | file.enc>')
        const got = await sourceOf(src)
        if (got.kind === 'key') die('that is a public key, not a sealed message: nothing to open')
        const enc = got.kind === 'sealed' ? M.parseCode(got.code).enc : got.enc
        const id = await me()
        let known = new Map(); try { known = new Map([...(await register()).byFp].map(([k, r]) => [k, r.bundle])) } catch (e) { /* offline: signatures unchecked */ }
        const o = await M.openMessage(enc, [id], known)
        let trust = 'no root pinned'
        if (o.msg.from && pinned()) { try { const reg = await register(), { g, p } = await fromRoot(reg), t = D.trustFrom(g, o.msg.from, p.fp); trust = t.ok ? `chains to the root: ${t.chain.join(' → ')}` : `NOT vouched for by the root: ${t.why}` } catch (e) { trust = 'not checked: ' + e.message } }
        say(JSON.stringify({ from: o.msg.from || null, signature: o.verified === true ? 'checks' : o.verified === false ? 'DOES NOT CHECK' : 'not checked (sender not in the register)', sender_trust: trust, at: o.msg.at, expires: o.msg.expires || null, subject: o.msg.subject || '', text: o.msg.text, files: (o.msg.files || []).map(f => f.name), problems: o.problems }, null, 2))
        if (flags.save && o.msg.files) for (const f of o.msg.files) { const n = path.basename(String(f.name)).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^\.+/, '') || 'file'; writeSecret(path.join(String(flags.save), n), Buffer.from(K.unb64(f.data))); say(`saved ${path.join(String(flags.save), n)} (0600; its contents not shown)`) }
    },
    async keyfile() {
        const id = await me()
        if (!PASS) console.error('pki-agent: SG_SEND_PASSPHRASE is not set, so this keyfile is the private key in the clear')
        const priv = async der => PASS ? K.encryptPrivate(der, PASS) : K.pem(der, 'PRIVATE KEY')
        say(JSON.stringify({ v: 1, label: id.bundle.label, record: id.bundle.signing_fingerprint, created: id.created, private_key: await priv(id.private.encrypt), signing_private: await priv(id.private.sign) }))
    },
    async sign() {
        const f = args[0]; if (!f) die('sign <file>')
        const id = await me()
        fs.writeFileSync(f + '.sig', JSON.stringify({ signature: K.b64(await K.signBytes(id.private.sign, fs.readFileSync(f))), fingerprint: id.bundle.signing_fingerprint }, null, 2))
        say(`written: ${f}.sig`)
    },
}
if (!commands[cmd]) die(`unknown command ${cmd}: node pki-agent.mjs help`)
await commands[cmd]()
