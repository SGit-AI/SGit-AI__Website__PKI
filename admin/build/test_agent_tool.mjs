#!/usr/bin/env node
/* test_agent_tool.mjs: agents/pki-agent.mjs, the file an agent fetches, run as an agent would run it, in a throwaway HOME.
 *
 *   node admin/build/test_agent_tool.mjs
 *
 *   - the bundled file is not stale against its source and assets/people/;
 *   - keygen makes the key in sgit's layout and signs an agent identity; operator links to the operator; submission is
 *     a record that reads cleanly; the operator's link back (made here as the vault page makes it) and the agent's
 *     record, read together, show the agent as operated;
 *   - status reads a register (served locally) and says so;
 *   - open reads a message sealed to the agent, as a link, and checks the sender's signature against the register;
 *   - sign writes a signature that `sgit pki verify` accepts (when sgit is installed; reported as not run otherwise).
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import { spawnSync, spawn } from 'child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const TOOL = path.join(ROOT, 'agents/pki-agent.mjs')
const K = await import(path.join(ROOT, 'assets/people/keys.js'))
const D = await import(path.join(ROOT, 'assets/people/directory.js'))
const M = await import(path.join(ROOT, 'assets/people/message.js'))
let failed = 0
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++ }

check(spawnSync(process.execPath, [path.join(ROOT, 'admin/build/gen_agent_tool.mjs'), '--check']).status === 0, 'agents/pki-agent.mjs is generated from its source and assets/people/, and is not stale')

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pki-agent-'))
let server
const env = extra => ({ ...process.env, HOME: home, PKI_AGENT_HOME: '', ...extra })
const run = (args, extra = {}) => new Promise(resolve => {      // async: the register below is served from this process
    const p = spawn(process.execPath, [TOOL, ...args], { cwd: home, env: env(extra) })
    let stdout = '', stderr = ''; p.stdout.on('data', d => { stdout += d }); p.stderr.on('data', d => { stderr += d })
    p.on('close', status => resolve({ status, stdout, stderr }))
})
try {
    const operator = await K.generate('Operator')
    const opId = await D.identityStatement(operator, { name: 'The operator' }, '2026-10-19T10:00:00Z')
    const kg = await run(['keygen', '--name', 'Test agent', '--runtime', 'claude-code, cloud session', '--session'])
    const fp = (/made: (sha256:[0-9a-f]{16})/.exec(kg.stdout) || [])[1]
    check(kg.status === 0 && !!fp && fs.readdirSync(path.join(home, '.sg-send/keys')).length === 1, `keygen makes the agent’s key in sgit’s layout (${fp})`)
    const keyDir = path.join(home, '.sg-send/keys', fs.readdirSync(path.join(home, '.sg-send/keys'))[0])
    check((fs.statSync(path.join(keyDir, 'signing_private.pem')).mode & 0o777) === 0o600, 'the private halves are written 0600')
    check((await run(['operator', operator.bundle.signing_fingerprint])).status === 0, 'operator links it to its operator')
    const sub = path.join(home, 'sub.json')
    await run(['submission', '--out', sub])
    const s = JSON.parse(fs.readFileSync(sub, 'utf8'))
    const r = await D.readRecord(s.statements)
    check(r.ok && r.kind === 'agent' && r.fp === fp && r.identity.body.session === true && r.links[0].method === 'operated-by', 'its submission is a clean agent record naming the operator')
    const opLink = await D.linkStatement(operator, { to: fp, method: 'operates', on: '2026-10-19', until: '2026-10-26' }, '2026-10-19T11:00:00Z')
    const opRec = await D.readRecord([opId, opLink]), g = D.graph([opRec, r], { anchors: [operator.bundle.signing_fingerprint], asOf: '2026-10-20' })
    check(D.standing(g, fp).level === 'operated', 'with the operator’s link back, the two records show the agent as operated')

    // a register, served here: the operator and the agent
    const index = { anchors: [operator.bundle.signing_fingerprint], fixture_anchors: [], records: [
        { fp: operator.bundle.signing_fingerprint, dir: K.dirOf(operator.bundle.signing_fingerprint), fixture: false, statements: [opId, opLink] },
        { fp, dir: K.dirOf(fp), fixture: false, statements: s.statements }] }
    server = http.createServer((q, res) => { if (q.url === '/directory/index.json') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(index)) } else { res.writeHead(404); res.end() } })
    await new Promise(x => server.listen(0, '127.0.0.1', x))
    const REG = { PKI_REGISTER: `http://127.0.0.1:${server.address().port}/` }
    const st = await run(['status'], REG)
    check(/an agent operated by The operator/.test(st.stdout), `status reads the register: “${st.stdout.trim().slice(0, 90)}…”`)
    const agentBundle = r.bundle
    const sealed = await M.sealMessage(await M.compose({ to: agentBundle, from: operator, text: 'a token for the agent' }), agentBundle, operator)
    const op = await run(['open', sealed.url], REG)
    let opened = null; try { opened = JSON.parse(op.stdout) } catch (e) { /* below */ }
    check(opened && opened.text === 'a token for the agent' && opened.signature === 'checks', 'open reads a message sealed to the agent, and the operator’s signature checks against the register')

    const kf = await run(['keyfile'], { SG_SEND_PASSPHRASE: 'a session secret' })
    const moved = await run(['whoami'], { PKI_AGENT_HOME: path.join(home, 'elsewhere'), PKI_AGENT_KEY: kf.stdout.trim(), SG_SEND_PASSPHRASE: 'a session secret' })
    check(kf.stdout.includes('ENCRYPTED PRIVATE KEY') && moved.stdout.includes(fp), 'keyfile carries the key, encrypted, to another machine as PKI_AGENT_KEY: same fingerprint there')
    fs.writeFileSync(path.join(home, 'report.txt'), 'signed by the agent')
    await run(['sign', 'report.txt'])
    const sgit = spawnSync('sgit', ['--version'], { encoding: 'utf8' })
    if (sgit.status !== 0) console.log('NOT RUN: sgit pki verify of the agent’s signature (pip install sgit-ai)')
    else {
        const v = spawnSync('sgit', ['pki', 'verify', 'report.txt', 'report.txt.sig'], { cwd: home, env: env({ SG_SEND_PASSPHRASE: '' }), encoding: 'utf8' })
        check(v.status === 0, `sgit pki verify accepts the agent’s signature (${(v.stdout || v.stderr).trim().slice(0, 70)})`)
    }
} finally { if (server) server.close(); fs.rmSync(home, { recursive: true, force: true }) }
console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
