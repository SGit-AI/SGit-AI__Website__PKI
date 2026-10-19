#!/usr/bin/env node
/* test_people_browser.mjs: the pages, driven in a real Chromium, end to end, with a virtual passkey and the mock vault.
 *
 *   node admin/build/test_people_browser.mjs
 *
 * Serves the site from the working tree, answers https://dev.send.sgraph.ai with admin/build/vault-mock.mjs (through
 * Playwright's routing: nothing reaches the real server), and gives each browser a virtual authenticator with the PRF
 * extension (Chrome DevTools Protocol, WebAuthn domain). Then, as two people:
 *   Ana   makes a passkey, creates her vault with an access key, makes a key, signs her name and a piece of evidence,
 *         downloads her submission (checked here: a clean record), sends a fixture a message (opened as the fixture,
 *         on the message page), and makes an invitation carrying her access key;
 *   Bo    lands on the invitation, makes a passkey, creates his vault from the access key the invitation carried,
 *         makes a key, signs his name and links to Ana: the join page's five steps, each done.
 *   Cy    lands on an invitation with no access key, keeps his key in the browser, signs and links, and later moves
 *         it all into a vault of his own.
 * And: with the tab's session cleared, Ana's vault opens again from the passkey alone, keys and all (they live in the master).
 * Skips, saying so, when Playwright is not installed. Needs the Chromium the environment provides.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import { createRequire } from 'module'
import { startMock } from './vault-mock.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
let chromium
try { chromium = createRequire(import.meta.url)('playwright').chromium } catch (e) {
    try { chromium = createRequire(path.join(process.execPath, '../../lib/node_modules/') + '/')('playwright').chromium } catch (e2) {
        try { chromium = createRequire('/opt/node-tools/node_modules/')('playwright').chromium } catch (e3) { console.log('NOT RUN: Playwright is not installed'); process.exit(0) } } }

let failed = 0
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++ }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.md': 'text/markdown' }
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
    const f = path.join(ROOT, p)
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const SITE = `http://localhost:${server.address().port}/`
const mock = await startMock()
const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? undefined : undefined })
const errors = []

async function person(name) {
    const ctx = await browser.newContext({ acceptDownloads: true })
    await ctx.route('https://dev.send.sgraph.ai/**', async route => {
        const req = route.request(), u = new URL(req.url())
        const r = await fetch(mock.base + u.pathname + u.search, { method: req.method(), headers: req.headers(), body: ['GET', 'HEAD'].includes(req.method()) ? undefined : req.postDataBuffer() })
        await route.fulfill({ status: r.status, headers: Object.fromEntries(r.headers), body: Buffer.from(await r.arrayBuffer()) })
    })
    const page = await ctx.newPage()
    page.on('pageerror', e => errors.push(`${name}: ${e.message}`))
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(`${name} console: ${m.text()}`) })
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('WebAuthn.enable')
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, hasPrf: true, automaticPresenceSimulation: true } })
    return { ctx, page, cdp, authenticatorId }
}
const text = async (page, sel) => (await page.locator(sel).first().textContent()) || ''

try {
    // ---------------------------------------------------------------- Ana
    const ana = await person('Ana'), p = ana.page
    await p.goto(SITE + 'vault/index.html')
    await p.click('#vault-open')
    await p.getByRole('button', { name: 'Make a passkey for pki.sgit.ai' }).click()
    await p.getByText('A passkey was made').waitFor()
    await p.click('#vault-open')
    await p.getByText('No vault behind this passkey yet').waitFor()
    await p.fill('#vault-panel input[type=password]', mock.token)
    await p.getByRole('button', { name: 'Create my vault' }).click()
    await p.getByText('Your recovery code, shown once').waitFor({ timeout: 60000 })
    const code = await text(p, '#vault-panel .mono')
    check(/^[A-Z2-7]{4}(-[A-Z2-7]{1,4}){6}$/.test(code.trim()), 'Ana makes a passkey and creates her vault; the recovery code is shown once')
    await p.getByRole('button', { name: 'I have written it down' }).click()
    check((await text(p, '#vault-bar')).includes('Your vault is open'), 'and her vault is open')

    await p.fill('#tab-keys input.t', 'Ana Test')
    await p.getByRole('button', { name: 'Make a key pair' }).click()
    await p.locator('#tab-keys table.kv').waitFor({ timeout: 60000 })
    const anaFp = ((await text(p, '#tab-keys table.kv .mono')).match(/sha256:[0-9a-f]{16}/) || [])[0]
    check(!!anaFp, `she makes a key pair in the browser, kept in her master (${anaFp})`)

    await p.getByRole('button', { name: 'Your record' }).click()
    await p.fill('#tab-record input.t', 'Ana Test')
    await p.getByRole('button', { name: 'Sign my identity statement' }).click()
    await p.getByText('2 · Evidence that this key is yours').waitFor()
    await p.selectOption('#tab-record select', 'link')
    const inputs = p.locator('#tab-record input.t')
    await inputs.nth(0).fill('linkedin.com/in/ana-test'); await inputs.nth(1).fill('https://www.linkedin.com/in/ana-test')
    await p.getByRole('button', { name: 'Sign and add' }).click()
    await p.getByText('not sent yet').nth(1).waitFor()
    const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Download the submission' }).click()])
    const subFile = path.join(os.tmpdir(), `pki-sub-${Date.now()}.json`); await dl.saveAs(subFile)
    const sub = JSON.parse(fs.readFileSync(subFile, 'utf8')); fs.rmSync(subFile)
    const D = await import(path.join(ROOT, 'assets/people/directory.js'))
    const rec = await D.readRecord(sub.statements)
    check(sub.kind === D.SUBMISSION && rec.ok && rec.fp === anaFp && rec.evidence.length === 1 && rec.name === 'Ana Test', 'she signs her identity and a piece of evidence; the submission she downloads reads as a clean record')

    // an agent asks Ana to operate it; she confirms it in her Agents tab
    {
        const K = await import(path.join(ROOT, 'assets/people/keys.js'))
        const agent = await K.generate('an agent of Ana')
        const agentSts = [await D.agentStatement(agent, { name: 'Ana’s test agent', runtime: 'claude-code, cloud session', session: true }), await D.linkStatement(agent, { to: anaFp, method: 'operated-by' })]
        await p.goto(SITE + 'vault/index.html#agents')
        await p.locator('#tab-agents textarea').waitFor({ timeout: 60000 })
        await p.fill('#tab-agents textarea', JSON.stringify(D.submission(agentSts)))
        await p.getByRole('button', { name: 'Check it' }).click()
        await p.getByText('Compare it with what the agent printed').waitFor()
        check((await text(p, '#tab-agents .vpanel b.mono')).trim() === agent.bundle.signing_fingerprint, 'Ana pastes an agent’s submission: the page checks it and shows the fingerprint to compare')
        await p.getByRole('button', { name: 'I operate this agent: sign' }).click()
        const [dl2] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Download for the register' }).click()])
        const f2 = path.join(os.tmpdir(), `pki-agent-${Date.now()}.json`); await dl2.saveAs(f2)
        const both = JSON.parse(fs.readFileSync(f2, 'utf8')); fs.rmSync(f2)
        const recs = []; for (const sub of both.submissions) recs.push(await D.readRecord(sub.statements))
        const ga = D.graph(recs, { anchors: [anaFp] })
        const sa = D.standing(ga, agent.bundle.signing_fingerprint)
        check(both.kind === D.SUBMISSIONS && recs.every(r => r.ok) && sa.level === 'operated' && sa.chain[0] === anaFp, `she signs a link back; the one file for the register shows the agent operated by her (${sa.text.slice(0, 60)}…)`)
    }

    // a message to a fixture, opened as the fixture
    await p.goto(SITE + 'send/index.html')
    const bruno = (await (await fetch(SITE + 'directory/index.json')).json()).records.find(r => /Bruno/.test(r.name))
    await p.selectOption('#send-to', bruno.fp)
    await p.fill('#send-text', 'A secret for Bruno, from a browser.')
    await p.click('#send-go')
    await p.locator('#send-link').waitFor({ timeout: 30000 })
    const link = (await text(p, '#send-link')).trim()
    check(link.startsWith('https://pki.sgit.ai/m/#m1.') && (await p.locator('#send-out svg').count()) === 1, 'she seals a message to a fixture: a link and a QR code')
    await p.goto(SITE + 'm/index.html' + link.slice(link.indexOf('#')))
    await p.click('#open-fixture')
    await p.locator('.msgcard .body').waitFor()
    check((await text(p, '.msgcard .body')).includes('A secret for Bruno') && (await text(p, '.msgcard .meta')).includes('signed by a key not in the register'), 'the message page opens it with the fixture’s key; her signature is “not checked”, as her key is not in the register yet')

    // her invitation
    await p.goto(SITE + 'invite/index.html')
    await p.locator('#invite-go').waitFor()
    await p.fill('#app input.t', 'Bo')
    await p.check('#app input[type=checkbox]')
    await p.click('#invite-go')
    await p.locator('#invite-out .mono').waitFor()
    const invite = (await text(p, '#invite-out .mono')).trim()
    check(/^https:\/\/pki\.sgit\.ai\/join\/#i1\./.test(invite) && invite.includes('&k='), 'she makes an invitation, a QR code, carrying her access key')

    // the same passkey, a fresh tab: the keys come from the master
    const p2 = p                                                     // the virtual authenticator belongs to this page's target
    await p2.goto(SITE + 'vault/index.html')
    await p2.evaluate(() => sessionStorage.clear())
    await p2.reload()
    await p2.click('#vault-open')
    await p2.locator('#tab-keys table.kv').waitFor({ timeout: 60000 })
    check((await text(p2, '#tab-keys table.kv .mono')).includes(anaFp), 'the tab’s session cleared, the same passkey: her vault opens again with her key in it')

    // ---------------------------------------------------------------- Bo
    const bo = await person('Bo'), q = bo.page
    await q.goto(SITE + 'join/index.html' + invite.slice(invite.indexOf('#')))
    await q.getByText('which is not in the register yet').waitFor()
    await q.click('#vault-open')
    await q.getByRole('button', { name: 'Make a passkey for pki.sgit.ai' }).click()
    await q.getByText('A passkey was made').waitFor()
    await q.click('#vault-open')
    await q.getByText('No vault behind this passkey yet').waitFor()
    check((await q.inputValue('#vault-panel input[type=password]')) === mock.token, 'Bo lands on the invitation; the access key it carried is ready in the form')
    await q.getByRole('button', { name: 'Create my vault' }).click()
    await q.getByText('Your recovery code, shown once').waitFor({ timeout: 60000 })
    await q.getByRole('button', { name: 'I have written it down' }).click()
    await q.getByRole('button', { name: 'Make my key pair' }).click()
    await q.getByRole('button', { name: 'Sign' }).waitFor({ timeout: 60000 })
    check((await q.inputValue('.vpanel input.t')) === 'Bo', 'his key is made; the name the invitation suggested is filled in')
    await q.getByRole('button', { name: 'Sign' }).click()
    await q.getByRole('button', { name: /link$/ }).click()
    await q.getByText('Your record is ready.').waitFor()
    check((await q.locator('ol.steps li.done').count()) === 4, 'he signs his name and links to Ana: the join page’s steps are done')

    // ---------------------------------------------------------------- Cy: an invitation with no access key
    await p.goto(SITE + 'invite/index.html')
    await p.locator('#invite-go').waitFor()
    await p.fill('#app input.t', 'Cy')
    await p.click('#invite-go')
    await p.locator('#invite-out .mono').waitFor()
    const invite2 = (await text(p, '#invite-out .mono')).trim()
    check(!invite2.includes('&k='), 'an invitation without the box ticked carries no access key')
    const cy = await person('Cy'), r = cy.page
    await r.goto(SITE + 'join/index.html' + invite2.slice(invite2.indexOf('#')))
    await r.getByText('No access key? Start without a vault').waitFor()
    await r.fill('.vpanel input[type=password]', 'a long passphrase')
    await r.getByRole('button', { name: 'Make my key and keep it in this browser' }).click()
    await r.getByRole('button', { name: 'Sign' }).waitFor({ timeout: 60000 })
    await r.getByRole('button', { name: 'Sign' }).click()
    await r.getByRole('button', { name: /link$/ }).click()
    await r.getByText('Your record is ready.').waitFor()
    check((await text(r, '#vault-bar')).includes('from this browser'), 'Cy joins with no access key: his key is kept in this browser, his name signed, his link to Ana made')
    await r.getByRole('button', { name: 'Move into a vault' }).click()
    await r.getByRole('button', { name: 'Make a passkey for pki.sgit.ai' }).click()
    await r.getByText('A passkey was made').waitFor()
    await r.getByRole('button', { name: 'Move into a vault' }).click()
    await r.getByText('No vault behind this passkey yet').waitFor()
    await r.fill('#vault-panel input[type=password]', mock.token)
    await r.getByRole('button', { name: 'Create my vault' }).click()
    await r.getByText('Your recovery code, shown once').waitFor({ timeout: 60000 })
    await r.getByRole('button', { name: 'I have written it down' }).click()
    await r.goto(SITE + 'vault/index.html#record')
    await r.getByText('Your statements').waitFor({ timeout: 60000 })
    check((await text(r, '#vault-bar')).includes('Your vault is open') && (await r.locator('#tab-record table.kv tr').count()) === 2, 'later, with an access key, his key and his two statements move into a vault of his own')
} catch (e) { failed++; console.log('FAIL', e.message.split('\n')[0]) }
finally {
    check(errors.length === 0, errors.length ? `no page errors (${errors.length}: ${errors.slice(0, 3).join(' | ')})` : 'no page errors')
    await browser.close(); await mock.close(); server.close()
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
