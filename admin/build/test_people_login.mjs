#!/usr/bin/env node
/* test_people_login.mjs: the passkey login and the account section, driven in a real Chromium, end to end.
 *
 *   node admin/build/test_people_login.mjs
 *
 * Same harness as test_people_browser.mjs (the site from the working tree, the mock vault for dev.send.sgraph.ai, a
 * virtual authenticator with PRF). As Dee:
 *   signs up on login/ (one button, a new passkey, no access key): a new account, kept in this browser, encrypted;
 *   fills the welcome steps (username, name, picture, a line about her), makes her master key, makes a persona signed
 *   by it, and downloads the persona's submission (checked here: two clean records, linked both ways, a persona);
 *   checks local storage holds ciphertext only, and the explorer shows no private key;
 *   signs out, signs in again with the same passkey: the same account, from this browser;
 *   moves it all into a vault with an access key; the browser copy is gone;
 *   signs out, clears the tab, signs in: the vault opens, with her profile, master key and persona.
 * As Eve, the first anchor's way: signs up, and with an access key the vault is made before the key, so the master key
 * is born in it. As Fay, a newcomer with no access key: signs up in this browser, makes her key and shows it as a key
 * link (k1); Eve opens it on Send, seals an access key to it; Fay opens the message and her vault is made, by her.
 * Skips, saying so, when Playwright is not installed.
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


const D = await import(path.join(ROOT, 'assets/people/directory.js'))
const localKeys = page => page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('pki.local.v1.')))
try {
    const dee = await person('Dee'), p = dee.page
    await p.goto(SITE + 'login/index.html')
    await p.getByText('Sign in with a passkey').waitFor()
    await p.locator('details.signup summary').click()
    await p.fill('#signup-name', 'dee')
    await p.click('#signup-go')
    await p.waitForURL(/account\/index\.html#welcome/, { timeout: 60000 })
    await p.locator('#pf-name').waitFor({ timeout: 60000 })
    check((await p.inputValue('#pf-username')) === 'dee', 'sign-up: one passkey, and the username typed is the profile’s first line')
    check((await localKeys(p)).length === 1, 'a new account, kept in this browser (no access key asked for)')
    await p.fill('#pf-name', 'Dee Example')
    await p.fill('#pf-blurb', 'Testing the login.')
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64')
    await p.setInputFiles('#pf-avatar', { name: 'me.png', mimeType: 'image/png', buffer: png })
    await p.waitForFunction(() => document.querySelector('.pf-pic img').src.startsWith('data:image/jpeg'))
    await p.click('#pf-save')
    await p.locator('#welcome-browser').waitFor()
    await p.click('#welcome-browser')
    await p.locator('#master-go').waitFor()
    check((await p.inputValue('#master-label')) === 'Dee Example', 'step 2: the master key is named from the profile')
    await p.click('#master-go')
    await p.locator('.profile-card').waitFor({ timeout: 90000 })
    check((await text(p, '.profile-card')).includes('Testing the login.') && (await p.getAttribute('.profile-card img', 'src')).startsWith('data:image/jpeg'), 'the overview: name, blurb and the picture, shrunk to a JPEG here')
    check((await p.locator('.steps li.done').count()) === 3, 'three of six steps done: profile, master key, identity statement signed')
    // personas
    await p.goto(SITE + 'account/index.html#keys')
    await p.locator('#persona-name').waitFor({ timeout: 60000 })
    await p.fill('#persona-name', 'Dee at work')
    await p.click('#persona-go')
    await p.locator('.keycard:not(.master)').waitFor({ timeout: 90000 })
    check((await text(p, '.keycard:not(.master)')).includes('both links signed'), 'a persona, signed by the master key, and signing back')
    const [dl] = await Promise.all([p.waitForEvent('download'), (async () => { await p.locator('.keycard:not(.master) button', { hasText: 'Publish' }).click(); await p.locator('.keycard:not(.master) button', { hasText: 'Download the submission' }).click() })()])
    const sub = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'))
    const recs = []
    for (const s of sub.submissions || [sub]) recs.push(await D.readRecord(s.statements))
    const g = D.graph(recs, { anchors: [] })
    const persona = recs.find(r => r.name === 'Dee at work'), master = recs.find(r => r.name === 'Dee Example')
    check(recs.length === 2 && recs.every(r => r.ok), 'the persona’s submission: two records, both clean (' + recs.map(r => r.problems.join('; ')).join(' | ') + ')')
    check(persona && master && D.standing(g, persona.fp).level === 'persona' && D.standing(g, persona.fp).master === master.fp, 'read by the register: a persona of the master key')
    // what is stored
    const raw = await p.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('pki.local.v1.')).map(([, v]) => v).join(''))
    check(!/PRIVATE|Dee Example|dee|MII/.test(JSON.parse(raw).ct ? raw.replace(JSON.parse(raw).ct, '') : raw) && JSON.parse(raw).ct.length > 1000, 'local storage holds ciphertext, and nothing that names her')
    await p.goto(SITE + 'account/index.html#explorer')
    await p.locator('#local-plain').waitFor()
    check(!/MIIJ|MIGHAgEA/.test(await text(p, '#local-plain')) && (await text(p, '#local-plain')).includes('never shown'), 'the explorer shows the account, private halves masked')
    // out and in again
    await p.click('#signout')
    await p.waitForURL(/login\/index\.html/)
    await p.click('#login-go')
    await p.waitForURL(/account\/index\.html/, { timeout: 60000 })
    await p.locator('.profile-card').waitFor({ timeout: 60000 })
    check((await text(p, '#side-name')) === 'Dee Example' && (await text(p, '.side')).includes('this browser'), 'signed out and in: the same passkey opens the same account, from this browser')
    // into a vault
    await p.goto(SITE + 'account/index.html#storage')
    await p.locator('#upgrade-key').waitFor()
    await p.fill('#upgrade-key', mock.token)
    await p.click('#upgrade-go')
    await p.locator('#recovery-code').waitFor({ timeout: 120000 })
    check(/^[A-Z2-7]{4}(-[A-Z2-7]{1,4}){6}$/.test(await text(p, '#recovery-code')), 'moved into a vault: a recovery code, shown once')
    check((await localKeys(p)).length === 0, 'and the copy this browser kept is gone')
    await p.click('#recovery-done')
    await p.click('#signout')
    await p.waitForURL(/login\/index\.html/)
    await p.evaluate(() => sessionStorage.clear())
    await p.reload()
    await p.click('#login-go')
    await p.waitForURL(/account\/index\.html/, { timeout: 60000 })
    await p.locator('.profile-card').waitFor({ timeout: 60000 })
    check((await text(p, '.side')).includes('vault') && (await text(p, '.profile-card')).includes('Testing the login.'), 'signed in again: the vault opens, profile and all')
    await p.goto(SITE + 'account/index.html#keys')
    await p.locator('.keycard:not(.master)').waitFor({ timeout: 60000 })
    check((await p.locator('.keycard').count()) === 2 && (await text(p, '.keycard:not(.master)')).includes('both links signed'), 'the master key and its persona, from the vault')
    await p.goto(SITE + 'account/index.html#explorer?v=master')
    await p.locator('#tree button').first().waitFor({ timeout: 60000 })
    await p.locator('#tree button', { hasText: 'signing_private.pem' }).first().click()
    await p.locator('.viewer pre').waitFor()
    check((await text(p, '.viewer pre')).includes('masked'), 'the explorer lists the master’s files, a private key masked until revealed')
    // ---------------------------------------------------------------- Eve: vault first, then the key
    const eve = await person('Eve'), e = eve.page
    await e.goto(SITE + 'login/index.html')
    await e.locator('details.signup summary').click()
    await e.fill('#signup-name', 'eve')
    await e.click('#signup-go')
    await e.locator('#pf-name').waitFor({ timeout: 60000 })
    await e.fill('#pf-name', 'Eve Anchor')
    await e.click('#pf-save')
    await e.locator('#upgrade-key').waitFor()
    check((await e.locator('#anchor-callout').count()) === 0, 'the welcome asks where to keep it before any key is made')
    await e.fill('#upgrade-key', mock.token)
    await e.click('#upgrade-go')
    await e.locator('#recovery-code').waitFor({ timeout: 120000 })
    await e.click('#recovery-done')
    await e.locator('#master-go').waitFor({ timeout: 60000 })
    check((await text(e, '.vpanel')).includes('in your master vault'), 'with an access key, the vault comes first: the master key will be made in it')
    await e.click('#master-go')
    await e.locator('.profile-card').waitFor({ timeout: 90000 })
    check((await text(e, '.side')).includes('vault') && (await localKeys(e)).length === 0, 'Eve’s master key was born in her vault; nothing kept in the browser')
    check((await e.locator('#anchor-callout').count()) === 1 && (await text(e, '#anchor-callout')).includes('sha256:'), 'with no anchor in the register, the overview says how the first one is enrolled, with her fingerprint')
    // ---------------------------------------------------------------- Fay: a key first, then an access key sealed to it
    const fay = await person('Fay'), f = fay.page
    await f.goto(SITE + 'login/index.html')
    await f.locator('details.signup summary').click()
    await f.click('#signup-go')
    await f.locator('#pf-name').waitFor({ timeout: 60000 })
    await f.fill('#pf-name', 'Fay Newcomer')
    await f.click('#pf-save')
    await f.click('#welcome-browser')
    await f.locator('#master-go').waitFor()
    await f.click('#master-go')
    await f.locator('.profile-card').waitFor({ timeout: 90000 })
    await f.goto(SITE + 'account/index.html#keys')
    await f.locator('.keycard.master button', { hasText: 'Share as a QR code' }).click()
    await f.locator('.share svg').waitFor()
    const keyLink = await f.evaluate(() => [...document.querySelectorAll('.share button')].length && document.querySelector('.share .mono').textContent)
    const fayFp = keyLink
    const link = await f.evaluate(async () => (await import('/assets/people/message.js')).keyCode((await import('/assets/people/ui.js')).vault.masterKey.bundle).url)
    check(link.includes('/send/#k1.') && link.length < 1400, `Fay’s key as a link short enough for a QR code (${link.length} characters)`)
    await e.goto(SITE + 'send/index.html' + link.slice(link.indexOf('#')))
    await e.locator('#send-keynote p').waitFor({ timeout: 60000 })
    check((await text(e, '#send-keynote')).includes(fayFp) && (await text(e, '#send-keynote')).includes('compare'), 'on Send, Eve sees Fay’s fingerprint to compare, and the warning that a link proves nothing')
    await e.fill('#send-grant', mock.token)
    await e.click('#send-go')
    await e.locator('#send-link').waitFor({ timeout: 60000 })
    const grantLink = await text(e, '#send-link')
    await f.goto(SITE + 'm/index.html' + grantLink.slice(grantLink.indexOf('#')))
    await f.getByRole('button', { name: 'Open it with my keys' }).click()
    await f.locator('#grant-use').waitFor({ timeout: 60000 })
    await f.click('#grant-use')
    await f.locator('#recovery-code').waitFor({ timeout: 120000 })
    check((await localKeys(f)).length === 0, 'Fay opens it and her vault is made, by her, with the access key sealed to her key; the browser copy is gone')
    await f.goto(SITE + 'account/index.html#keys')
    await f.locator('.keycard.master').waitFor({ timeout: 60000 })
    check((await text(f, '.keycard.master')).includes(fayFp) && (await text(f, '.keycard.master')).includes('in your master vault'), 'and her key is in it')
} catch (e) { failed++; console.log('FAIL', e.message.split('\n')[0]); if (process.env.SHOT) for (const c of browser.contexts()) for (const pg of c.pages()) { await pg.screenshot({ path: process.env.SHOT, fullPage: true }).catch(() => {}); console.log('  at', pg.url()) } }
finally {
    check(errors.length === 0, errors.length ? `no page errors (${errors.length}: ${errors.slice(0, 3).join(' | ')})` : 'no page errors')
    await browser.close(); await mock.close(); server.close()
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
