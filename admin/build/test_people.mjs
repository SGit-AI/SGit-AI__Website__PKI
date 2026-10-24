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

// --- agents: operated, two ways, with an end date; fleets; the count kept apart ------------------------------------
const op = ada, agent = await K.generate('an agent'), fleetK = await K.generate('a fleet'), worker = await K.generate('a worker')
const agentRec = [await D.agentStatement(agent, { name: 'Test agent', runtime: 'claude-code', session: true }, T(1)), await D.linkStatement(agent, { to: op.bundle.signing_fingerprint, method: 'operated-by' }, T(2))]
const opRec = (extra = []) => [...adaRec, ...extra]
const opLink = await D.linkStatement(op, { to: agent.bundle.signing_fingerprint, method: 'operates', on: '2026-10-19', until: '2026-10-26' }, T(3))
let ga = D.graph([await D.readRecord(opRec()), await D.readRecord(boBack), await D.readRecord(agentRec)], { anchors: [op.bundle.signing_fingerprint], asOf: '2026-10-20' })
check(D.standing(ga, agent.bundle.signing_fingerprint).level === 'listed', 'an agent that names its operator, unconfirmed, is only listed')
ga = D.graph([await D.readRecord(opRec([opLink])), await D.readRecord(boBack), await D.readRecord(agentRec)], { anchors: [op.bundle.signing_fingerprint], asOf: '2026-10-20' })
let sa = D.standing(ga, agent.bundle.signing_fingerprint)
check(sa.level === 'operated' && sa.trusted && sa.until === '2026-10-26', 'the operator’s link back (operates, with an end date) makes it operated, and trusted, the operator being an anchor')
ga = D.graph([await D.readRecord(opRec([opLink])), await D.readRecord(boBack), await D.readRecord(agentRec)], { anchors: [op.bundle.signing_fingerprint], asOf: '2026-10-27' })
check(D.standing(ga, agent.bundle.signing_fingerprint).level === 'expired', 'a week later the confirmation has ended: to be confirmed again')
const fleetRec = [await D.agentStatement(fleetK, { name: 'Fleet', runtime: 'vault' }, T(1)), await D.linkStatement(fleetK, { to: bo.bundle.signing_fingerprint, method: 'operated-by' }, T(2)), await D.linkStatement(fleetK, { to: worker.bundle.signing_fingerprint, method: 'operates', on: '2026-10-19' }, T(3))]
const workerRec = [await D.agentStatement(worker, { name: 'Worker' }, T(1)), await D.linkStatement(worker, { to: fleetK.bundle.signing_fingerprint, method: 'operated-by' }, T(2))]
const boOps = [...boBack, await D.linkStatement(bo, { to: fleetK.bundle.signing_fingerprint, method: 'operates', on: '2026-10-19' }, T(4))]
ga = D.graph([await D.readRecord(adaRec), await D.readRecord(boOps), await D.readRecord(fleetRec), await D.readRecord(workerRec)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2026-10-20' })
sa = D.standing(ga, worker.bundle.signing_fingerprint)
check(sa.level === 'operated' && sa.chain.join() === [fleetK.bundle.signing_fingerprint, bo.bundle.signing_fingerprint].join() && sa.trusted, 'an agent operated by a fleet key shows the person at the root, and is trusted because Bo is verified')
check(D.validUntil({ method: 'operates', on: '2026-10-19' }) === '2026-11-18', 'an agent’s confirmation with no end of its own lasts 30 days')
const strangerOp = await K.generate('stranger')
const strangerRec = [await D.identityStatement(strangerOp, { name: 'Unverified' }, T(1)), await D.linkStatement(strangerOp, { to: agent.bundle.signing_fingerprint, method: 'operates', on: '2026-10-19' }, T(2))]
const agentToStranger = [agentRec[0], await D.linkStatement(agent, { to: strangerOp.bundle.signing_fingerprint, method: 'operated-by' }, T(2))]
ga = D.graph([await D.readRecord(adaRec), await D.readRecord(strangerRec), await D.readRecord(agentToStranger)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2026-10-20' })
check(D.standing(ga, agent.bundle.signing_fingerprint).level === 'agent', 'an agent operated by someone nobody verified is operated, and not trusted')

// --- personas: a person's other keys, tied to their master by the same two-way rule ------------------------------------
const pers = await K.generate('Bo at work')
const persRec = [await D.identityStatement(pers, { name: 'Bo at work' }, T(1)), await D.linkStatement(pers, { to: bo.bundle.signing_fingerprint, method: 'persona-of', on: '2026-10-20' }, T(2))]
const boPersona = [...boBack, await D.linkStatement(bo, { to: pers.bundle.signing_fingerprint, method: 'persona', on: '2026-10-20' }, T(4))]
let gp = D.graph([await D.readRecord(adaRec), await D.readRecord(boBack), await D.readRecord(persRec)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2026-10-20' })
check(D.standing(gp, pers.bundle.signing_fingerprint).level === 'listed', 'a key that says it is a persona of Bo, without Bo saying so, is only listed')
gp = D.graph([await D.readRecord(adaRec), await D.readRecord(boPersona), await D.readRecord(persRec)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2026-10-20' })
let sp = D.standing(gp, pers.bundle.signing_fingerprint)
check(sp.level === 'persona' && sp.master === bo.bundle.signing_fingerprint && sp.trusted, 'both links (persona, persona-of): a persona of Bo, carrying Bo’s standing (verified)')
const persAsAgentLink = [persRec[0], await D.linkStatement(pers, { to: bo.bundle.signing_fingerprint, method: 'known' }, T(2))]
gp = D.graph([await D.readRecord(adaRec), await D.readRecord(boPersona), await D.readRecord(persAsAgentLink)], { anchors: [ada.bundle.signing_fingerprint], asOf: '2026-10-20' })
check(D.standing(gp, pers.bundle.signing_fingerprint).level !== 'persona', 'a link back by another method is not a persona link')

// --- trust from a pinned root: the graph from that key alone, whatever anchors.json says ------------------------------
{
    const adaFp = ada.bundle.signing_fingerprint, boFp = bo.bundle.signing_fingerprint
    const recs = [await D.readRecord(adaRec), await D.readRecord([...boBack, boPersona[boPersona.length - 1], boOps[boOps.length - 1]]), await D.readRecord(persRec), await D.readRecord(fleetRec), await D.readRecord(workerRec), await D.readRecord(cyRec)]
    const gr = D.graph(recs, { anchors: [adaFp], asOf: '2026-10-20' })
    check(D.trustFrom(gr, adaFp, adaFp).ok, 'trustFrom: the pinned root itself')
    check(D.trustFrom(gr, boFp, adaFp).ok, 'trustFrom: a person the root verified, in date')
    check(D.trustFrom(gr, pers.bundle.signing_fingerprint, adaFp).ok, 'trustFrom: a persona of a person the root verified')
    const tw = D.trustFrom(gr, worker.bundle.signing_fingerprint, adaFp)
    check(tw.ok && tw.chain.join() === [worker, fleetK, bo].map(x => x.bundle.signing_fingerprint).concat([adaFp]).join(), 'trustFrom: an agent operated by a fleet, operated by a person the root verified: the chain to the root')
    check(!D.trustFrom(gr, cy.bundle.signing_fingerprint, adaFp).ok, 'trustFrom: a person linked to, not verified, is not vouched for')
    const gBo = D.graph(recs, { anchors: [boFp], asOf: '2026-10-20' })
    check(!D.trustFrom(gBo, adaFp, boFp).ok && D.trustFrom(gBo, worker.bundle.signing_fingerprint, boFp).ok, 'trustFrom: pinned to another root, trust follows that root, not the register’s anchors')
    check(!D.trustFrom(D.graph(recs, { anchors: [adaFp, boFp] }), boFp, adaFp).ok, 'trustFrom refuses a graph built from more anchors than the pin')
    const late = D.graph(recs, { anchors: [adaFp], asOf: '2028-01-01' })
    check(!D.trustFrom(late, worker.bundle.signing_fingerprint, adaFp).ok, 'trustFrom: after the end dates, nothing below the root is vouched for')
    check(!(await D.readRecord([adaRec[0], await D.linkStatement(ada, { to: boFp, method: 'operates', policy: 'not-a-hash' }, T(2))])).ok, 'a link’s policy must be a sha256:<64 hex>')
}
check(D.realKeys([await D.readRecord(adaRec), await D.readRecord(agentRec)]) === 1 && D.realAgents([await D.readRecord(adaRec), await D.readRecord(agentRec)]) === 1, 'agents are counted apart from people')

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
// --- signing in elsewhere: a delegation, soft or strong, checked from a pinned root, no revocation list ------------------
{
    const DG = await import(path.join(ROOT, 'assets/people/delegation.js'))
    const adaFp = ada.bundle.signing_fingerprint, site = 'https://newsroom.example', browser = await K.generate('a browser')
    const now = Date.parse('2026-10-24T09:00:00Z'), asOf = '2026-10-24'
    const req = await DG.parseRequest({ v: 1, kind: DG.REQUEST, client: site, return: site + '/pki/back.html', key: M.keyCode(browser.bundle).code, can: ['identity', 'sign:feedback'], days: 30, nonce: 'n'.repeat(24) })
    for (const [bad, why] of [[{ ...req, client: site, return: 'https://evil.example/x', key: req.key, bundle: undefined }, 'a return address on another origin'], [{ v: 1, kind: DG.REQUEST, client: site, return: site + '/', key: req.key, can: ['root'], days: 30, nonce: 'n'.repeat(24) }, 'an unknown use'], [{ v: 1, kind: DG.REQUEST, client: site, return: site + '/', key: req.key, can: ['identity'], days: 30, nonce: 'n'.repeat(24), note: 'x' }, 'an extra field']]) {
        const raw = { v: 1, kind: DG.REQUEST, ...bad }; delete raw.bundle
        let refused = false; try { await DG.parseRequest(raw) } catch (e) { refused = true }
        check(refused, `an authorize request is refused for ${why}`)
    }
    const soft = await DG.makeDelegation(ada, req, { name: 'Ada', from: now })
    const gSoft = D.graph([await D.readRecord(adaRec)], { anchors: [adaFp], asOf })
    let c = await DG.checkDelegation(soft, { g: gSoft, root: adaFp, origin: site, asOf })
    check(c.ok && c.level === 'soft', `soft: signed by the root, for this site, in date, not listed (${c.why})`)
    check((await DG.checkDelegation(soft, { g: gSoft, root: adaFp, origin: 'https://other.example', asOf })).level === 'invalid', 'a delegation is worth nothing at another site')
    check((await DG.checkDelegation({ ...soft, can: [...soft.can, 'delegate'] }, { g: gSoft, root: adaFp, origin: site, asOf })).level === 'invalid', 'a delegation widened after it was signed does not check')
    check((await DG.checkDelegation(soft, { g: gSoft, root: adaFp, origin: site, asOf: '2026-12-01' })).level === 'invalid', 'past its date, it is over')
    // strong: the root's record lists it today
    const live = await DG.makeDelegation(ada, req, { live: true, name: 'Ada', from: now }), liveId = await DG.delegationId(live)
    check((await DG.checkDelegation(live, { g: gSoft, root: adaFp, origin: site, asOf })).level === 'not-vouched', 'a live delegation the record does not list is not good (not published yet, or withdrawn)')
    const vouch = await D.linkStatement(ada, { to: browser.bundle.signing_fingerprint, method: 'delegates', on: asOf, until: live.until, delegation: liveId, can: live.can }, T(20))
    const adaVouches = await D.readRecord([...adaRec, vouch])
    check(adaVouches.ok, 'a delegates link reads in a record: the delegation by hash, its until, its uses')
    const gStrong = D.graph([adaVouches], { anchors: [adaFp], asOf })
    c = await DG.checkDelegation(live, { g: gStrong, root: adaFp, origin: site, asOf })
    check(c.ok && c.level === 'strong', `strong: the root’s record vouches for it today (${c.why})`)
    const gWithdrawn = D.graph([await D.readRecord([...adaRec, vouch, await D.withdrawStatement(ada, vouch, 'lost the iPad', T(21))])], { anchors: [adaFp], asOf })
    check((await DG.checkDelegation(live, { g: gWithdrawn, root: adaFp, origin: site, asOf })).level === 'not-vouched', 'withdrawn: the link is gone from the record, and the delegation stops, with no list of revoked keys anywhere')
    check((await DG.checkDelegation(soft, { g: gStrong, root: adaFp, origin: site, asOf })).level === 'soft', 'a link names one delegation by hash: it does not lift another to strong')
    // notes signed by the browser key
    const note = await DG.signNote(browser, { text: 'this figure is wrong' }, live)
    let v = await DG.verifyNote(note, { g: gStrong, root: adaFp, origin: site, need: 'sign:feedback', asOf })
    check(v.ok && v.level === 'strong' && v.payload.text === 'this figure is wrong', 'a note signed by the browser key checks, strong, back to the root')
    check(!(await DG.verifyNote({ ...note, payload: { text: 'this figure is right' } }, { g: gStrong, root: adaFp, origin: site, asOf })).ok, 'a note changed after it was signed fails')
    check(!(await DG.verifyNote(note, { g: gStrong, root: adaFp, origin: site, need: 'sign:payments', asOf })).ok, 'a note for a use the delegation does not allow fails')
    const other = await K.generate('another root')
    const otherRec = [await D.identityStatement(other, { name: 'Other' }, T(1))]
    check(!(await DG.checkDelegation(soft, { g: D.graph([await D.readRecord(adaRec), await D.readRecord(otherRec)], { anchors: [other.bundle.signing_fingerprint], asOf }), root: other.bundle.signing_fingerprint, origin: site, asOf })).ok, 'from another pinned root, the same delegation is not vouched for')
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
