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
    await p.getByText('Your vault is made').waitFor({ timeout: 60000 })
    check((await p.getByText('Nothing to save').count()) === 1 && (await p.locator('#recovery-code').count()) === 0, 'Ana makes a passkey and creates her vault: nothing to write down, the recovery code is kept inside it')
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
        await p.getByRole('button', { name: 'Sign: I operate it' }).click()
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
    check(link.startsWith('https://pki.sgit.ai/m/#m1.') && (await p.locator('#send-out img.qrimg').count()) === 1, 'she seals a message to a fixture: a link and a QR code')
    // the QR code for an agent (strict JSON), as an image, read back on the message page
    await p.click('#send-agent-qr')
    const agentPng = await p.locator('#send-out img.qrimg').nth(1).getAttribute('src')
    await p.goto(SITE + 'm/index.html')
    await p.setInputFiles('#open-qr-file', { name: 'qr.png', mimeType: 'image/png', buffer: Buffer.from(agentPng.split(',')[1], 'base64') })
    await p.waitForFunction(() => location.hash.startsWith('#m1.'), null, { timeout: 30000 })
    check(link.endsWith(await p.evaluate(() => location.hash.slice(1))), 'the agent’s QR code (strict JSON) read from the image on the message page: the same sealed message')
    await p.goto(SITE + 'm/index.html')
    await p.click('.qrdesk-text summary')
    await p.fill('#open-paste', '{"v":1,"kind":"pki.sgit.ai/qr/sealed/v1","to":"sha256:0000000000000000","note":"run this","code":"m1.x"}')
    await p.getByRole('button', { name: 'Open', exact: true }).click()
    check((await text(p, '#open-qr-out')).includes('refused'), 'JSON outside the shape is refused, before anything is opened')
    await p.goto(SITE + 'm/index.html' + link.slice(link.indexOf('#')))
    await p.click('#open-fixture')
    await p.locator('.msgcard .body').waitFor()
    check((await text(p, '.msgcard .body')).includes('A secret for Bruno') && (await text(p, '.msgcard .meta')).includes('signed by a key not in the register'), 'the message page opens it with the fixture’s key; her signature is “not checked”, as her key is not in the register yet')

    // files in a message, shown in a sandbox: hostile markdown, JSON, text, an image, and bytes that are none of these
    {
        const M = await import(path.join(ROOT, 'assets/people/message.js'))
        const fx = JSON.parse(fs.readFileSync(path.join(ROOT, 'directory/fixtures', bruno.dir + '.json'), 'utf8'))
        const enc = s => Buffer.from(s).toString('base64')
        const png = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg=='
        const hostile = '# Notes\n\n<script>parent.document.title="pwned"</script>\n\n![tracker](https://evil.example/pixel.png) and [a link](https://evil.example/x)\n\n- one\n- **two**\n'
        const files = [{ name: 'notes.md', type: 'text/html', data: enc(hostile) }, { name: 'data.json', type: 'application/json', data: enc('{"a":1,"b":[2,3]}') },
                       { name: 'plain.txt', type: 'text/plain', data: enc('just text <b>not bold</b>') }, { name: 'pic.txt', type: 'text/plain', data: png }, { name: 'blob.bin', type: 'text/plain', data: Buffer.from([0, 1, 2, 255, 0]).toString('base64') }]
        const sealed = await M.sealMessage(await M.compose({ to: fx.bundle, text: 'files', files }), fx.bundle, null)
        const outside = []
        p.on('request', r => { if (/evil\.example/.test(r.url())) outside.push(r.url()) })
        await p.goto(SITE + 'm/index.html#' + sealed.code)
        await p.click('#open-fixture')
        await p.locator('.msgfile').first().waitFor({ timeout: 30000 })
        await p.waitForTimeout(1000)
        const frames = await p.$$eval('iframe.preview-frame', fs => fs.map(f => ({ sandbox: f.getAttribute('sandbox'), csp: /default-src 'none'/.test(f.srcdoc), script: /<script/i.test(f.srcdoc), doc: f.contentDocument === null, title: f.title })))
        const kinds = await p.$$eval('.msgfile', rows => rows.map(r => r.textContent))
        check(frames.length === 3 && frames.every(f => f.sandbox === '' && f.csp && !f.script && f.doc), `the first three files are shown, each in a sandboxed frame (sandbox="", an origin of its own, a CSP that loads nothing; no <script> survives): ${frames.map(f => f.title).join(', ')}`)
        check(/notes\.md.*markdown/.test(kinds[0]) && /data\.json.*json/.test(kinds[1]) && /plain\.txt.*text/.test(kinds[2]) && /pic\.txt.*image/.test(kinds[3]) && !/View|Hide/.test(kinds[4]), 'what a file is shown as comes from its bytes: an image called .txt is an image; bytes that are nothing are a download only')
        check(outside.length === 0 && (await p.title()) !== 'pwned', `nothing the files name is fetched (the markdown's tracker image and link are shown as addresses), and its script never runs${outside.length ? ': ' + outside.join(', ') : ''}`)
    }

    // a batch: a zip of QR images, sealed to her, opened together on the message page
    {
        const M = await import(path.join(ROOT, 'assets/people/message.js')), QR = await import(path.join(ROOT, 'assets/people/qrread.js')), K2 = await import(path.join(ROOT, 'assets/people/keys.js'))
        const { qrcode } = await import(path.join(ROOT, 'assets/vendor/qrcode-generator/2.0.4/qrcode.mjs'))
        const { makeZip } = await import('./zipfixture.mjs'), zlib = await import('zlib')
        await p.goto(SITE + 'vault/index.html'); await p.locator('#vault-bar').waitFor()
        let ana = null
        for (let i = 0; i < 120 && !ana; i++) { ana = await p.evaluate(async () => { const v = (await import('/assets/people/ui.js')).vault; await v.settled(); return v.me ? v.me.bundle : null }); if (!ana) await p.waitForTimeout(500) }
        const png = async text => { const q = qrcode(0, 'L'); q.addData(text, 'Byte'); q.make(); const n = q.getModuleCount(), px = 6, size = (n + 8) * px, lum = new Uint8Array(size * size).fill(255); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) for (let y = 0; y < px; y++) lum.fill(0, ((r + 4) * px + y) * size + (c + 4) * px, ((r + 4) * px + y) * size + (c + 5) * px); return Buffer.from(await QR.encodePng(lum, size, size, d => zlib.deflateSync(d))) }
        const codes = []
        for (const n of [1, 2]) { const sd = await M.sealMessage(await M.compose({ to: ana, text: `batch message ${n}` }), ana, null); codes.push(await png(M.qrSealed({ to: ana.signing_fingerprint, code: sd.code }))) }
        const zip = makeZip([{ name: 'a/one.png', bytes: codes[0] }, { name: 'a/two.png', bytes: codes[1], deflate: true }, { name: 'liar.png', bytes: Buffer.alloc(50000, 1), deflate: true, lieSize: 10 }])
        await p.goto(SITE + 'm/index.html')
        await p.setInputFiles('#open-qr-file', { name: 'codes.zip', mimeType: 'application/zip', buffer: zip })
        await p.locator('#batch-cards .msgcard').nth(1).waitFor({ timeout: 60000 }).catch(async e => { await p.screenshot({ path: '/tmp/claude-0/-home-user-SGit-AI--Website--PKI/a4b0d5a1-e4ef-596c-9c9b-79001e8aa63e/scratchpad/fail.png', fullPage: true }); throw e })
        const bodies = await p.$$eval('#batch-cards .msgcard .body', b => b.map(x => x.textContent))
        check(bodies.join('|') === 'batch message 1|batch message 2' && (await text(p, 'table.kv')).includes('refused'), 'a zip of QR images: both messages for her open together, one under the other; the entry that lies about its size is refused')
        // a vault key she holds, forwarded sealed to another key, never shown: the key arrives as its QR image
        const fx2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'directory/fixtures', bruno.dir + '.json'), 'utf8'))
        const keyMsg = await M.sealMessage(await M.compose({ to: ana, text: 'a vault key', files: [{ name: 'vault key: test', data: Buffer.from('the vault key, for the test').toString('base64') }] }), ana, null)
        await p.goto(SITE + 'm/index.html#' + keyMsg.code)
        await p.locator('.msgfile').first().waitFor({ timeout: 60000 })
        check((await p.locator('.msgfile iframe').count()) === 0, 'a file that looks like a key is not shown until asked for')
        await p.getByRole('button', { name: 'Forward, sealed, to…' }).click()
        const keyPng = await png(M.qrKey({ fp: fx2.bundle.signing_fingerprint, label: 'Bruno', code: M.keyCode(fx2.bundle).code }))
        await p.setInputFiles('.forward input[type=file]', { name: 'key.png', mimeType: 'image/png', buffer: keyPng })
        await p.locator('.forward p.msg.ok').first().waitFor({ timeout: 30000 })
        await p.getByRole('button', { name: 'Seal it to them' }).click()
        await p.locator('.forward img.qrimg').waitFor({ timeout: 30000 })
        const fwdSrc = await p.locator('.forward img.qrimg').getAttribute('src')
        const fimg = await QR.decodePng(Buffer.from(fwdSrc.split(',')[1], 'base64'), d => zlib.inflateSync(d))
        const fq = M.parseQrText(QR.readQr(fimg.lum, fimg.w, fimg.h))
        const fo = await M.openMessage(M.parseCode(fq.code).enc, [{ bundle: fx2.bundle, private: { encrypt: K2.unb64(fx2.private.encrypt), sign: K2.unb64(fx2.private.sign) } }], new Map([[ana.signing_fingerprint, ana]]))
        check(fq.to === fx2.bundle.signing_fingerprint && fo.verified === true && Buffer.from(fo.msg.files[0].data, 'base64').toString() === 'the vault key, for the test' && (await p.locator('.msgfile iframe').count()) === 0,
            'forwarded, sealed, from the key’s QR image: the image opens with that key alone, signed by her, the file intact, and it was never shown on her page')
        // a key QR brought to the message page: what to do with it
        await p.goto(SITE + 'm/index.html')
        await p.setInputFiles('#open-qr-file', { name: 'key.png', mimeType: 'image/png', buffer: keyPng })
        await p.locator('#key-box').waitFor({ timeout: 30000 })
        check((await text(p, '#key-box')).includes(fx2.bundle.signing_fingerprint) && (await text(p, '#key-box')).includes('Key exchange with') && (await p.locator('#xchg-go').count()) === 0,
            'a key QR on the message page flips it into a key exchange: the fingerprint to compare first, nothing to give until it is confirmed')
        await p.click('#xchg-match')
        await p.locator('#xchg-msg-img').waitFor({ state: 'attached', timeout: 30000 }).catch(async e => { await p.screenshot({ path: '/tmp/claude-0/-home-user-SGit-AI--Website--PKI/a4b0d5a1-e4ef-596c-9c9b-79001e8aa63e/scratchpad/fail.png', fullPage: true }); throw e })
        await p.setInputFiles('#xchg-msg-img', { name: 'msg.png', mimeType: 'image/png', buffer: await png(M.qrSealed({ to: ana.signing_fingerprint, code: keyMsg.code })) })
        await p.locator('#key-box p.msg.ok').first().waitFor({ timeout: 30000 })
        await p.click('#xchg-go')
        await p.locator('#key-box img.qrimg').waitFor({ timeout: 30000 })
        check((await text(p, '#key-box')).includes('pki-agent.mjs open') && (await p.locator('#key-box iframe').count()) === 0, 'confirmed, chosen, one button: the QR image to carry, the line to tell the agent, and the vault key never shown')
        const g = await QR.decodePng(Buffer.from((await p.locator('#key-box img.qrimg').getAttribute('src')).split(',')[1], 'base64'), d => zlib.inflateSync(d))
        const gq = M.parseQrText(QR.readQr(g.lum, g.w, g.h))
        const go2 = await M.openMessage(M.parseCode(gq.code).enc, [{ bundle: fx2.bundle, private: { encrypt: K2.unb64(fx2.private.encrypt), sign: K2.unb64(fx2.private.sign) } }], new Map([[ana.signing_fingerprint, ana]]))
        check(Buffer.from(go2.msg.files[0].data, 'base64').toString() === 'the vault key, for the test' && go2.verified === true, 'the key first, then the message: the exchange seals the vault key straight to the key brought, signed by her')
        // the same exchange, a message she writes
        await p.check('label.xchg-option:has-text("A message I write") input')
        await p.fill('#xchg-text', 'hello agent, from Ana')
        await p.click('#xchg-go')
        await p.waitForFunction(() => document.querySelector('#key-box .xchg-line') && document.querySelector('#key-box .xchg-line').textContent.includes('a message from me'), null, { timeout: 30000 })
        const t = await QR.decodePng(Buffer.from((await p.locator('#key-box img.qrimg').getAttribute('src')).split(',')[1], 'base64'), d => zlib.inflateSync(d))
        const to = await M.openMessage(M.parseCode(M.parseQrText(QR.readQr(t.lum, t.w, t.h)).code).enc, [{ bundle: fx2.bundle, private: { encrypt: K2.unb64(fx2.private.encrypt), sign: K2.unb64(fx2.private.sign) } }], new Map([[ana.signing_fingerprint, ana]]))
        check(to.msg.text === 'hello agent, from Ana' && to.verified === true, 'a message she writes, sealed to the agent in the same exchange: its QR image opens with the agent’s key alone, signed by her')
        // her vault: what needs her, the desk, and what she handed over
        await p.goto(SITE + 'vault/index.html#messages')
        await p.locator('#tab-messages h3', { hasText: 'Sent' }).waitFor({ timeout: 60000 })
        const todoText = await text(p, '#todo'), sentText = await text(p, '#tab-messages table.sent')
        check(/not in the register yet/.test(todoText) && (await p.locator('#todo button', { hasText: 'Copy for the register' }).count()) === 1 && (await p.locator('#qr-desk').count()) === 1,
            'her vault opens with To do (what she signed is not in the register yet: one button to copy it) and the QR desk above the tabs')
        check(sentText.includes('vault key: test') && (await p.locator('.tabs button.on').innerText()) === 'Messages', 'the vault key she handed over is under Sent, by name (never its bytes), in the Messages tab')
        await p.goto(SITE + 'account/index.html#overview')
        await p.locator('#pane-overview #todo').waitFor({ timeout: 60000 })
        check((await p.locator('#pane-overview #qr-desk').count()) === 1 && (await p.locator('nav.site .gh.signin').evaluate(e => getComputedStyle(e).marginLeft)) === '0px', 'her account’s Home: To do and the QR desk first; the nav’s account pill is not pushed onto a line of its own')

        // a vault from its QR code: an agent made a vault, and sealed its key to her
        const vkey = await p.evaluate(async () => {
            const ui = await import('/assets/people/ui.js'), v = ui.vault; await v.settled()
            const NV = ui.A.NV, x = await NV.createVault(v.sg, { name: 'an agent’s vault' })
            await NV.writeFile(x, '/', 'README.md', '# The agent’s vault\n\nMade for the test. <script>parent.document.title="pwned"</script>\n')
            await NV.writeFile(x, '/notes', 'plan.txt', 'step one')
            await NV.publish(x)
            return NV.prefixedKey(x)
        })
        const vmsg = await M.sealMessage(await M.compose({ to: ana, text: 'the key of my vault', files: [{ name: 'vault-key.txt', data: Buffer.from(vkey + '\n').toString('base64') }] }), ana, null)
        const vpng = await png(M.qrSealed({ to: ana.signing_fingerprint, code: vmsg.code }))
        await p.goto(SITE + 'v/index.html')
        await p.locator('#open-qr-file').waitFor({ state: 'attached', timeout: 60000 })
        await p.setInputFiles('#open-qr-file', { name: 'vault.png', mimeType: 'image/png', buffer: vpng })
        await p.locator('#vv-tree button', { hasText: 'plan.txt' }).waitFor({ timeout: 60000 })
        await p.locator('#vv-file iframe.preview-frame').waitFor({ timeout: 30000 })
        const vtext = await text(p, '#vault-view'), vid = vkey.split(':').pop()
        check(vtext.includes(vid) && !vtext.includes(vkey.split(':')[0].replace(/^sgit_private_vault_/, '')) && (await p.locator('#vv-file iframe').getAttribute('sandbox')) === '' && (await p.title()) !== 'pwned',
            'a vault from its QR code: dropped on the vault page, opened with her key, the vault opens there, its README in a sandbox; the key itself is never on the page')
        await p.locator('#vv-tree button', { hasText: 'plan.txt' }).click()
        await p.waitForFunction(() => document.querySelector('#vv-file .vh') && document.querySelector('#vv-file .vh').textContent.includes('plan.txt'), null, { timeout: 30000 })
        // and from a message anywhere else: Open the vault, in a new window, the key handed over in memory
        await p.goto(SITE + 'm/index.html#' + vmsg.code)
        await p.locator('.vv-open').waitFor({ timeout: 60000 })
        const [popup] = await Promise.all([p.waitForEvent('popup'), p.click('.vv-open')])
        await popup.locator('#vv-tree button', { hasText: 'plan.txt' }).waitFor({ timeout: 60000 })
        check(!popup.url().includes(vid) && !popup.url().includes('#'), 'Open the vault ↗ on a message: a new window, the vault open in it, nothing of the key in its address')
        await popup.close()
    }

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
    await p2.goto(SITE + 'vault/index.html#keys')
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
    await q.getByText('Your vault is made').waitFor({ timeout: 60000 })
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
    // Ana hands Cy an access key, sealed to his key; he opens it, and it creates his vault
    const cyBundle = await r.evaluate(async () => (await import('/assets/people/ui.js')).vault.me.bundle)
    await p.goto(SITE + 'send/index.html')
    await p.locator('#send-go').waitFor()
    await p.fill('#app textarea.code', JSON.stringify(cyBundle))
    await p.locator('details.vpanel summary').click()
    await p.fill('#send-grant', mock.token); await p.fill('#send-grant-name', 'cy-2026-10')
    await p.click('#send-go')
    await p.locator('#send-link').waitFor({ timeout: 30000 })
    const grantLink = (await text(p, '#send-link')).trim()
    await r.goto(SITE + 'm/index.html' + grantLink.slice(grantLink.indexOf('#')))
    await r.getByRole('button', { name: 'Open it with my keys' }).click()
    await r.getByText('It carries an SG/Send access key').waitFor()
    check(true, 'Ana hands Cy an access key, sealed to his key; he opens it with the key his browser holds')
    await r.click('#grant-use')
    await r.getByRole('button', { name: 'Move into a vault' }).click()
    await r.getByRole('button', { name: 'Make a passkey for pki.sgit.ai' }).click()
    await r.getByText('A passkey was made').waitFor()
    await r.getByRole('button', { name: 'Move into a vault' }).click()
    await r.getByText('No vault behind this passkey yet').waitFor()
    check((await r.inputValue('#vault-panel input[type=password]')) === mock.token, 'the access key from the sealed message is ready in the form that creates his vault')
    await r.getByRole('button', { name: 'Create my vault' }).click()
    await r.getByText('Your vault is made').waitFor({ timeout: 60000 })
    await r.goto(SITE + 'vault/index.html#record')
    await r.getByText('Your statements').waitFor({ timeout: 60000 })
    check((await text(r, '#vault-bar')).includes('Your vault is open') && (await r.locator('#tab-record table.kv tr').count()) === 2, 'with it, his key and his two statements move into a vault of his own')
} catch (e) { failed++; console.log('FAIL', e.message.split('\n')[0]) }
finally {
    check(errors.length === 0, errors.length ? `no page errors (${errors.length}: ${errors.slice(0, 3).join(' | ')})` : 'no page errors')
    await browser.close(); await mock.close(); server.close()
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
