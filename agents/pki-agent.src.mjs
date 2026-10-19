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
 * agents/pki-agent.mjs is generated from this file and assets/people/ by admin/build/gen_agent_tool.mjs: the same
 * code the site runs, in one file.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import * as K from '../assets/people/keys.js'
import * as D from '../assets/people/directory.js'
import * as M from '../assets/people/message.js'

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

// ------------------------------------------------------------ the commands
const commands = {
    async help() {
        say(`pki-agent: an agent's identity on pki.sgit.ai (${REGISTER})

  keygen --name N [--about A] [--runtime R] [--session]   make this agent's key and sign its identity
  operator <fingerprint>                                   link to the key that operates this agent
  submission [--out FILE]                                  the signed record, to hand to the operator
  submit                                                   send it, sealed, into the operator's inbox
  status                                                   what the register says about this agent
  whoami                                                   this agent's fingerprints
  send --to FP --text T [--subject S]                      a message sealed to someone: a link and its text
  open <link | m1… | file.enc>                             open a message sealed to this agent
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
        const id = await me()
        keep(await D.linkStatement(id, { to: fp, method: 'operated-by' }))
        say(`linked to ${fp} as its operator. Next: node pki-agent.mjs submission (or submit), and ask them to confirm it.`)
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
        const sealed = await M.sealMessage(await M.compose({ to: to.bundle, from: id, subject: flags.subject || '', text: String(flags.text || '') }), to.bundle, id)
        say(sealed.url)
    },
    async open() {
        const src = args[0]; if (!src) die('open <link | m1… | file.enc>')
        const code = M.parseCode(src)
        const enc = code ? code.enc : fs.readFileSync(src, 'utf8').trim()
        const id = await me()
        let known = new Map(); try { known = new Map([...(await register()).byFp].map(([k, r]) => [k, r.bundle])) } catch (e) { /* offline: signatures unchecked */ }
        const o = await M.openMessage(enc, [id], known)
        say(JSON.stringify({ from: o.msg.from || null, signature: o.verified === true ? 'checks' : o.verified === false ? 'DOES NOT CHECK' : 'not checked (sender not in the register)', at: o.msg.at, subject: o.msg.subject || '', text: o.msg.text, files: (o.msg.files || []).map(f => f.name), problems: o.problems }, null, 2))
        if (flags.save && o.msg.files) for (const f of o.msg.files) { fs.writeFileSync(path.join(flags.save, path.basename(f.name)), K.unb64(f.data)); say(`saved ${f.name}`) }
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
