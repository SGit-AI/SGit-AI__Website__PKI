#!/usr/bin/env node
/* test_people.mjs: the directory of people's own code, against itself and against the sgit CLI.
 *
 *   node admin/build/test_people.mjs
 *
 * The brief's tests (newsroom.sgit.ai, 2026-10-18 build brief), each a check below:
 *   - a record cannot be written by anyone but its owner; a link appended to someone else's record is rejected;
 *   - a one-way link adds nothing to the other person's standing; linking back creates the link; withdrawing either
 *     side removes it;
 *   - a record over the bound is rejected;
 *   - a key made here exports a bundle and a key store that `sgit pki` imports, and the reverse;
 *   - a message sealed on the send page can be read only by the recipient's key;
 *   - the register's count of real keys excludes fixtures.
 * With sgit-ai installed (pip install sgit-ai), the CLI checks run in a throwaway HOME; without it they are reported
 * as not run, never silently passed. No key made here is kept: every one is discarded at exit.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const K = await import(path.join(ROOT, 'assets/people/keys.js'))
const D = await import(path.join(ROOT, 'assets/people/directory.js'))
const M = await import(path.join(ROOT, 'assets/people/message.js'))
let failed = 0
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++ }
const throws = async (fn, re) => { try { await fn(); return false } catch (e) { return re ? re.test(e.message) : true } }

// --- keys ----------------------------------------------------------------------------------------------------------
const ada = await K.generate('Ada'), bo = await K.generate('Bo'), cy = await K.generate('Cy')
check((await K.checkBundle(ada.bundle)).length === 0, 'a key made here is a well-formed sgit bundle (both keys, both fingerprints)')
check(K.FP.test(ada.bundle.fingerprint) && K.FP.test(ada.bundle.signing_fingerprint), 'fingerprints are sgit-shaped, sha256:<16 hex>')
const again = await K.publicFromPrivate(ada.private.encrypt, ada.private.sign, 'Ada')
check(JSON.stringify(again) === JSON.stringify(ada.bundle), 'the public bundle recomputes from the two private halves alone')
const encPem = await K.encryptPrivate(ada.private.sign, 'correct horse', 2048)
check(K.hex(await K.decryptPrivate(encPem, 'correct horse')) === K.hex(ada.private.sign), 'a private key encrypted as PBES2 PEM decrypts with its passphrase')
check(await throws(() => K.decryptPrivate(encPem, 'wrong'), /wrong passphrase/), 'and refuses the wrong passphrase')
const enc = await K.seal(bo.bundle, 'for Bo only', { sign: ada.private.sign, fingerprint: ada.bundle.signing_fingerprint })
const opened = await K.unseal(bo.private.encrypt, enc, [ada.bundle])
check(opened.text === 'for Bo only' && opened.verified === true, 'the envelope opens with the recipient’s key, and its signature checks against the sender')
check(await throws(() => K.unseal(cy.private.encrypt, enc), /not sealed to this key/), 'and no other key opens it')
check((await K.unseal(bo.private.encrypt, enc)).verified === null, 'a signature with no bundle to check it against is "not checked", never "forged"')

// --- records: the four rules, and the two-way link ------------------------------------------------------------------
const rec = async (who, extra = []) => [await D.identityStatement(who, { name: who.bundle.label }, '2026-10-18T10:00:00Z'), ...extra]
const T = (n) => `2026-10-18T10:0${n}:00Z`
const adaRec = await rec(ada, [await D.linkStatement(ada, { to: bo.bundle.signing_fingerprint, method: 'in-person', on: '2026-10-18' }, T(1))])
let r = await D.readRecord(adaRec)
check(r.ok && r.links.length === 1, 'a record of identity and one link reads cleanly')
const forged = await D.statement(bo, 'link', { to: cy.bundle.signing_fingerprint }, T(2))
r = await D.readRecord([...adaRec, forged])
check(!r.ok && r.problems.some(p => /rule 1/.test(p)) && r.links.length === 1, 'a statement by another key, put in Ada’s record, is rejected (rule 1) and adds nothing')
const tampered = { ...adaRec[1], body: { ...adaRec[1].body, to: cy.bundle.signing_fingerprint } }
r = await D.readRecord([adaRec[0], tampered])
check(!r.ok && r.problems.some(p => /signature/.test(p)) && r.links.length === 0, 'a statement changed after signing fails its signature (rule 4)')

const boOneWay = await rec(bo)
let g = D.graph([await D.readRecord(adaRec), await D.readRecord(boOneWay)], { anchors: [ada.bundle.signing_fingerprint] })
check(g.edges.length === 0 && !g.degrees.has(bo.bundle.signing_fingerprint) && D.standing(g, bo.bundle.signing_fingerprint).level === 'listed', 'a one-way link adds nothing to the other person’s standing')
check(D.waitingFor(g, bo.bundle.signing_fingerprint).length === 1, 'and shows as a claim waiting for them to confirm')
const boBack = await rec(bo, [await D.linkStatement(bo, { to: ada.bundle.signing_fingerprint, method: 'known' }, T(3))])
g = D.graph([await D.readRecord(adaRec), await D.readRecord(boBack)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2026-10-19' })
const st = D.standing(g, bo.bundle.signing_fingerprint)
check(g.edges.length === 1 && st.level === 'verified' && st.method === 'in-person', 'linking back creates the link, and an anchor’s link with a method is a verification')
check(st.until === '2027-10-18', 'a verification with no end of its own lasts a year from its date')
const gLater = D.graph([await D.readRecord(adaRec), await D.readRecord(boBack)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2027-10-19' })
const later = D.standing(gLater, bo.bundle.signing_fingerprint)
check(later.level === 'expired' && gLater.edges.length === 1, 'the day after, it has expired: still linked both ways, no longer verified, to be verified again')
const adaAgain = [...adaRec, await D.linkStatement(ada, { to: bo.bundle.signing_fingerprint, method: 'video-call', on: '2027-10-20', until: '2028-04-20' }, '2027-10-20T10:00:00Z')]
const gAgain = D.graph([await D.readRecord(adaAgain), await D.readRecord(boBack)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2027-10-21' })
check(D.standing(gAgain, bo.bundle.signing_fingerprint).level === 'verified' && D.standing(gAgain, bo.bundle.signing_fingerprint).until === '2028-04-20', 're-verifying is a new link statement, with its own end date, and it counts again')
check(!(await D.readRecord([adaRec[0], await D.linkStatement(ada, { to: bo.bundle.signing_fingerprint, method: 'in-person', on: '2026-10-18', until: '2026-01-01' }, T(2))])).ok, 'an end date before the verification date is refused')
const cyRec = await rec(cy, [await D.linkStatement(cy, { to: bo.bundle.signing_fingerprint }, T(4))])
const boBoth = [...boBack, await D.linkStatement(bo, { to: cy.bundle.signing_fingerprint }, T(5))]
g = D.graph([await D.readRecord(adaRec), await D.readRecord(boBoth), await D.readRecord(cyRec)], { anchors: [ada.bundle.signing_fingerprint] })
check(g.degrees.get(cy.bundle.signing_fingerprint) === 2 && D.path(g, ada.bundle.signing_fingerprint, cy.bundle.signing_fingerprint).length === 3, 'degrees of separation are computed through confirmed links: Cy is two steps from Ada, through Bo')
check(D.standing(g, cy.bundle.signing_fingerprint).level === 'linked', 'and two steps is linked, not verified')
const withdraw = await D.withdrawStatement(bo, boBoth[1], 'withdrawn', T(6))
g = D.graph([await D.readRecord(adaRec), await D.readRecord([...boBoth, withdraw]), await D.readRecord(cyRec)], { anchors: [ada.bundle.signing_fingerprint] })
check(!g.adj.get(ada.bundle.signing_fingerprint).has(bo.bundle.signing_fingerprint) && g.edges.length === 1, 'withdrawing one side removes the link; the other link stands')
const adaWithdraw = await D.withdrawStatement(ada, adaRec[1], 'withdrawn', T(7))
g = D.graph([await D.readRecord([...adaRec, adaWithdraw]), await D.readRecord(boBack)], { anchors: [ada.bundle.signing_fingerprint] })
check(g.edges.length === 0, 'withdrawing the other side removes it too')
const crossRevoke = await D.statement(bo, 'revocation', { revokes: { record: ada.bundle.signing_fingerprint, statement: await D.statementId(adaRec[1]) }, reason: 'x', effective_from: T(8) }, T(8))
r = await D.readRecord([...boBack, crossRevoke])
check(!r.ok && r.problems.some(p => /withdraws a statement of this record/.test(p)), 'nobody can withdraw a statement in someone else’s record')

const many = [await D.identityStatement(cy, { name: 'Cy' }, '2026-10-18T09:00:00Z')]
for (let i = 0; i < D.BOUNDS.statements; i++) many.push(await D.evidenceStatement(cy, { kind: 'link', value: 'x' + i }, new Date(Date.parse('2026-10-18T10:00:00Z') + i * 1000).toISOString().replace('.000', '')))
r = await D.readRecord(many)
check(!r.ok && r.problems.some(p => /over the bound/.test(p)), `a record over the bound (${D.BOUNDS.statements} statements) is rejected (rule 3)`)
check(await throws(() => D.statement(cy, 'evidence', { kind: 'link', value: 'x'.repeat(17000) })), 'a statement over 16 KiB is refused when it is made')
const fixture = await D.readRecord(await rec(cy), { fixture: true })
check(D.realKeys([await D.readRecord(adaRec), await D.readRecord(boBack), fixture]) === 2, 'the count of real keys excludes fixtures')
check(await throws(() => D.statement(ada, 'evidence', { kind: 'link', value: 'a', weight: 0.5 }), /non-integer/), 'statements carry no floats (registry/params.json)')

const jq = spawnSync('jq', ['-cS', 'del(.sig)'], { input: JSON.stringify({ ...adaRec[0], body: { ...adaRec[0].body, about: 'Zoë <&> "q" \\ é ✓' } }), encoding: 'utf8' })
if (jq.status !== 0) console.log('NOT RUN: the jq canonical-form check (jq is not installed)')
else check(jq.stdout === new TextDecoder().decode(K.canonicalBytes({ ...adaRec[0], body: { ...adaRec[0].body, about: 'Zoë <&> "q" \\ é ✓' } })), 'the canonical bytes are jq -cS \'del(.sig)\', byte for byte (non-ASCII, quotes and escapes included)')

// --- messages and invitations ---------------------------------------------------------------------------------------
const msg = await M.compose({ to: bo.bundle, from: ada, subject: 'hello', text: 'A secret for Bo.' })
const sealed = await M.sealMessage(msg, bo.bundle, ada)
const parsed = M.parseCode(sealed.url)
check(parsed && parsed.to === bo.bundle.signing_fingerprint && sealed.url.length < M.MAX_QR_CHARS, `a short signed message fits one QR code (${sealed.url.length} characters)`)
const known = new Map([[ada.bundle.signing_fingerprint, ada.bundle]])
const o = await M.openMessage(parsed.enc, [cy, bo], known)
check(o.msg.text === 'A secret for Bo.' && o.verified === true && o.envelope.verified === true && o.problems.length === 0, 'Bo opens it, and both signatures check against Ada’s key')
check(await throws(() => M.openMessage(parsed.enc, [cy], known)), 'Cy cannot open it')
const resealed = await K.seal(cy.bundle, JSON.stringify(o.msg))                 // Bo passes Ada's signed message on to Cy
const o2 = await M.openMessage(resealed, [cy], known)
check(o2.verified === true && o2.problems.some(p => /another key/.test(p)), 'a signed message re-sealed to a third person still says who it was for, and is flagged')
const inv = await M.invite(ada, { days: 30, name: 'Dee', accessKey: 'abc123' })
const pi = M.parseInvite(inv.url)
check(pi && pi.from === ada.bundle.signing_fingerprint && pi.name === 'Dee' && pi.accessKey === 'abc123' && !pi.expired && await pi.verify(ada.bundle) === true, 'an invitation parses, names the inviter, and its signature checks')
check(await pi.verify(bo.bundle) === null, 'an invitation checked against the wrong key is "not checked", not valid')

// --- against the sgit CLI -------------------------------------------------------------------------------------------
const sgit = spawnSync('sgit', ['--version'], { encoding: 'utf8' })
if (sgit.status !== 0) console.log('NOT RUN: the sgit CLI checks (pip install sgit-ai to run them)')
else {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pki-people-'))
    const env = { ...process.env, HOME: home, SG_SEND_PASSPHRASE: 'test passphrase' }
    const run = (...args) => spawnSync('sgit', args, { cwd: home, env, encoding: 'utf8', timeout: 180000 })
    try {
        // browser → sgit: the key store files, written by the script the page offers
        const ks = await K.keystoreFiles(ada, 'test passphrase')
        fs.writeFileSync(path.join(home, 'install.sh'), K.keystoreScript(ks))
        const inst = spawnSync('sh', [path.join(home, 'install.sh')], { env, encoding: 'utf8' })
        check(inst.status === 0, 'the key store script the page offers runs')
        const list = run('pki', 'list')
        check(list.stdout.includes(ada.bundle.fingerprint), `sgit pki list shows the key made here (${sgit.stdout.trim()})`)
        const exp = run('pki', 'export', ada.bundle.fingerprint)
        let theirs = null; try { theirs = JSON.parse(exp.stdout) } catch (e) { /* reported below */ }
        check(theirs && K.canon(theirs) === K.canon(ada.bundle), 'sgit pki export of it is the bundle made here, field for field')
        // sgit → browser: an envelope sgit seals to our key opens here
        fs.writeFileSync(path.join(home, 'note.txt'), 'from the CLI')
        run('pki', 'encrypt', 'note.txt', '--recipient', ada.bundle.fingerprint, '--fingerprint', ada.bundle.fingerprint)
        const cliEnc = fs.readFileSync(path.join(home, 'note.txt.enc'), 'utf8')
        const cliOpen = await K.unseal(ada.private.encrypt, cliEnc, [ada.bundle])
        check(cliOpen.text === 'from the CLI' && cliOpen.verified === true, 'an envelope sgit seals and signs opens here, and its signature checks')
        // browser → sgit: a message sealed here opens with sgit, signature verified against an imported contact
        fs.writeFileSync(path.join(home, 'bo.json'), JSON.stringify(bo.bundle))
        run('pki', 'import', 'bo.json')
        const forAda = await M.sealMessage(await M.compose({ to: ada.bundle, from: bo, text: 'to the CLI' }), ada.bundle, bo)
        fs.writeFileSync(path.join(home, 'm.enc'), M.parseCode(forAda.code).enc)
        const dec = run('pki', 'decrypt', 'm.enc', '--fingerprint', ada.bundle.fingerprint, '--output', '-')
        let inner = null; try { inner = JSON.parse(dec.stdout) } catch (e) { /* reported below */ }
        check(inner && inner.text === 'to the CLI' && /Signature verified/.test(dec.stderr), 'a message made here (rebuilt from its link) opens with sgit pki decrypt, signature verified')
        // sgit → browser: a key sgit made, imported from its two private PEMs and the passphrase
        const kg = run('pki', 'keygen', '--label', 'Made by sgit')
        const sfp = (/Fingerprint:\s+(sha256:[0-9a-f]{16})/.exec(kg.stdout) || [])[1]
        const dir = path.join(home, '.sg-send/keys', String(sfp).replace(':', '_'))
        const imported = await K.importKeystore({ privateKeyPem: fs.readFileSync(path.join(dir, 'private_key.pem'), 'utf8'), signingPrivatePem: fs.readFileSync(path.join(dir, 'signing_private.pem'), 'utf8'),
                                                 passphrase: 'test passphrase', label: 'Made by sgit' })
        const sgitBundle = JSON.parse(run('pki', 'export', sfp).stdout)
        check(K.canon(imported.bundle) === K.canon(sgitBundle), 'a key sgit made imports here from its private PEMs, and its bundle is the one sgit exports')
        fs.writeFileSync(path.join(home, 'doc.txt'), 'signed here')
        const sigRaw = await K.signBytes(imported.private.sign, K.utf8('signed here'))
        fs.writeFileSync(path.join(home, 'doc.txt.sig'), JSON.stringify({ signature: K.b64(sigRaw), fingerprint: imported.bundle.signing_fingerprint }))
        check(run('pki', 'verify', 'doc.txt', 'doc.txt.sig').status === 0, 'a signature made here with the imported key verifies with sgit pki verify')
        const idSt = await D.identityStatement(imported, { name: 'Made by sgit' })
        check((await D.readRecord([idSt])).ok, 'and a key sgit made can start a record in the register')
    } finally { fs.rmSync(home, { recursive: true, force: true }) }
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
